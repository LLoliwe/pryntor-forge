// Image and interaction comparisons without image processing subscriptions or external dependencies.
import { inflateSync } from 'node:zlib';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';

function png(buffer){
 if(buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Not a PNG');
 let offset=8,width=0,height=0,depth=0,type=0,compression=0,filter=0,interlace=0;const chunks=[];
 while(offset<buffer.length){const size=buffer.readUInt32BE(offset),kind=buffer.toString('ascii',offset+4,offset+8);const start=offset+8;if(size>50e6||start+size+4>buffer.length)throw new Error('Invalid PNG chunk');if(kind==='IHDR'){width=buffer.readUInt32BE(start);height=buffer.readUInt32BE(start+4);depth=buffer[start+8];type=buffer[start+9];compression=buffer[start+10];filter=buffer[start+11];interlace=buffer[start+12];}if(kind==='IDAT')chunks.push(buffer.subarray(start,start+size));if(kind==='IEND')break;offset=start+size+4;}
 if(!width||!height||width*height>5e6||depth!==8||![2,6].includes(type)||compression||filter||interlace)throw new Error('PNG requires <=5 megapixels, 8-bit RGB/RGBA, non-interlaced');
 const bpp=type===6?4:3,rowBytes=width*bpp,raw=inflateSync(Buffer.concat(chunks));if(raw.length!==(rowBytes+1)*height)throw new Error('Invalid image dimensions');
 const result=Buffer.alloc(width*height*3),prev=Buffer.alloc(rowBytes),row=Buffer.alloc(rowBytes);let position=0;
 for(let y=0;y<height;y++){
  const mode=raw[position++];if(mode>4)throw new Error('Unsupported PNG filter');
  for(let x=0;x<rowBytes;x++){
   const a=x>=bpp?row[x-bpp]:0,b=prev[x],c=x>=bpp?prev[x-bpp]:0;
   let pred=0;
   if(mode===1)pred=a;else if(mode===2)pred=b;else if(mode===3)pred=Math.floor((a+b)/2);else if(mode===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);pred=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
   row[x]=(raw[position++]+pred)&255;
  }
  for(let x=0;x<width;x++){const i=x*bpp,j=(y*width+x)*3,alpha=type===6?row[i+3]/255:1;for(let c=0;c<3;c++)result[j+c]=Math.round(row[i+c]*alpha+255*(1-alpha));}
  row.copy(prev);
 }
 return {width,height,data:result};
}
export function pixelDifference(bufferA,bufferB){
 const a=png(bufferA),b=png(bufferB);if(a.width!==b.width||a.height!==b.height)return {comparable:false,reason:'Image dimensions differ',dimensions:[`${a.width}x${a.height}`,`${b.width}x${b.height}`]};
 let sum=0,changed=0;const tiles=[],tile=32;
 for(let ty=0;ty<a.height;ty+=tile)for(let tx=0;tx<a.width;tx+=tile){let total=0,n=0;for(let y=ty;y<Math.min(ty+tile,a.height);y++)for(let x=tx;x<Math.min(tx+tile,a.width);x++){const k=(y*a.width+x)*3;const d=(Math.abs(a.data[k]-b.data[k])+Math.abs(a.data[k+1]-b.data[k+1])+Math.abs(a.data[k+2]-b.data[k+2]))/765;sum+=d;total+=d;n++;if(d>.07)changed++;}tiles.push({x:tx,y:ty,width:Math.min(tile,a.width-tx),height:Math.min(tile,a.height-ty),difference:total/n});}
 return {comparable:true,width:a.width,height:a.height,similarity:Number((100*(1-sum/(a.width*a.height))).toFixed(2)),changedPixelPercent:Number((100*changed/(a.width*a.height)).toFixed(2)),tiles};
}
export function semanticDifference(a,b){
 const controls=v=>new Set((v.controls||[]).map(c=>`${c.tag}:${c.role}:${c.label}`));const aa=controls(a),bb=controls(b),intersection=[...aa].filter(x=>bb.has(x)).length,union=new Set([...aa,...bb]).size;
 return {referenceControls:aa.size,candidateControls:bb.size,controlSimilarity:union===0?100:Number((100*intersection/union).toFixed(2)),missing:[...aa].filter(x=>!bb.has(x)).slice(0,25),added:[...bb].filter(x=>!aa.has(x)).slice(0,25)};
}
function escaped(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeImgName(name){if(!/^[a-z0-9-]+\.png$/i.test(name))throw new Error('Unsafe screenshot path');return name;}
export async function compare(referenceDir,candidateDir,outDir){
 const refDir=resolve(referenceDir),canDir=resolve(candidateDir),out=resolve(outDir);await mkdir(out,{recursive:true});
 const a=JSON.parse(await readFile(join(refDir,'capture.json'),'utf8')),b=JSON.parse(await readFile(join(canDir,'capture.json'),'utf8'));
 const entries=[];
 for(const ref of a.viewports){const can=b.viewports.find(v=>v.name===ref.name);if(!can)continue;
  const imgA=await readFile(join(refDir,safeImgName(ref.screenshot))),imgB=await readFile(join(canDir,safeImgName(can.screenshot)));
  const diff=pixelDifference(imgA,imgB),semantic=semanticDifference(ref,can);
  const name=ref.name;await writeFile(join(out,`${name}-reference.png`),imgA);await writeFile(join(out,`${name}-candidate.png`),imgB);
  entries.push({viewport:name,visual:diff,semantic,refImage:`${name}-reference.png`,candidateImage:`${name}-candidate.png`});
 }
 if(!entries.length)throw new Error('No matching viewports to compare');
 const report={schemaVersion:1,generatedAt:new Date().toISOString(),reference:a.url,candidate:b.url,entries:entries.map(e=>({...e,visual:{...e.visual,tiles:undefined}})),note:'Pixel similarity is a diagnostic, not proof of usability or legal permission. Human and physical-device testing still required.'};
 await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
 const cards=entries.map(e=>{const cells=e.visual.comparable?e.visual.tiles.filter(t=>t.difference>.10).map(t=>`<rect x="${t.x}" y="${t.y}" width="${t.width}" height="${t.height}" fill="#fa4b4b" opacity="${Math.min(.73,Math.max(.12,t.difference))}"/>`).join(''):'';
 const heat=e.visual.comparable?`<svg class="heat" viewBox="0 0 ${e.visual.width} ${e.visual.height}" aria-hidden="true">${cells}</svg>`:'';
 return `<section class="shot"><div class="shot-title"><h2>${escaped(e.viewport)}</h2><div><strong>${e.visual.comparable?e.visual.similarity+'%':'N/A'}</strong><small>pixel similarity</small></div><div><strong>${e.semantic.controlSimilarity}%</strong><small>control match</small></div></div><div class="stage" style="aspect-ratio:${e.visual.width||390}/${e.visual.height||844}"><img src="${e.refImage}" alt="Reference ${escaped(e.viewport)}"/><div class="candidate" style="clip-path:inset(0 50% 0 0)"><img src="${e.candidateImage}" alt="Candidate ${escaped(e.viewport)}"/></div><div class="midline"></div>${heat}</div><label>Drag to reveal candidate <input type="range" min="0" max="100" value="50" aria-label="Reveal ${escaped(e.viewport)} candidate"/></label><details><summary>Interaction gaps (${e.semantic.missing.length})</summary><ul>${e.semantic.missing.map(s=>`<li>${escaped(s)}</li>`).join('')||'<li>None detected</li>'}</ul></details></section>`;}).join('');
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Pryntor Recon | Comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#090a0f;color:#f5f4ef;font:15px system-ui,-apple-system,sans-serif}main{max-width:1430px;margin:auto;padding:clamp(24px,4vw,72px)}header{display:flex;justify-content:space-between;gap:2rem;flex-wrap:wrap;align-items:end;padding-bottom:30px;border-bottom:1px solid #303139}.eyebrow{letter-spacing:.2em;text-transform:uppercase;color:#cbbf89;font-size:11px}h1{font-size:clamp(35px,6vw,85px);font-weight:650;letter-spacing:-.065em;line-height:.99;margin:16px 0}p{color:#a7aab4;max-width:520px;line-height:1.6} .pill{border:1px solid #41424d;border-radius:99px;padding:11px 17px;font-size:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,325px),1fr));gap:24px;margin-top:35px;align-items:start}.shot{border:1px solid #303139;border-radius:20px;padding:20px;background:#15161c}.shot-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px}.shot-title h2{text-transform:capitalize;margin:0;font-size:20px}.shot-title strong{display:block;font-size:23px;font-variant-numeric:tabular-nums}.shot-title small{display:block;font-size:10px;color:#92949c}.stage{position:relative;max-height:650px;border-radius:12px;overflow:hidden;background:#222}.stage>img,.candidate,.candidate img{width:100%;height:100%;position:absolute;inset:0;object-fit:fill}.candidate{z-index:2}.midline{z-index:4;position:absolute;top:0;bottom:0;left:50%;border-left:2px solid #efecdd}.heat{z-index:3;position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .2s}.shot:hover .heat{opacity:.45}label{display:block;margin:18px 0;color:#b5b7c0;font-size:12px}input[type=range]{display:block;width:100%;accent-color:#d9e767;margin-top:9px}summary{cursor:pointer;color:#d9e767;padding:6px 0}li{color:#b7b8c0;margin:9px 0;overflow-wrap:anywhere}.footer{margin-top:50px;border-top:1px solid #303139;padding-top:25px;color:#92949c;font-size:12px}</style><main><header><div><div class="eyebrow">PRYNTOR / APP RECON STUDIO R1</div><h1>See the gap.</h1><p>Reference vs build. Real Chromium screenshots and extracted interactive controls, not AI-generated quality claims.</p></div><span class="pill">LOCAL · PRIVATE · NO SUBSCRIPTIONS</span></header><div class="grid">${cards}</div><p class="footer">${escaped(report.note)} No login data or secret form values are included in this comparison.</p></main><script>document.querySelectorAll('.shot').forEach(card=>{const input=card.querySelector('input'),image=card.querySelector('.candidate'),line=card.querySelector('.midline');input.addEventListener('input',()=>{image.style.clipPath='inset(0 '+(100-input.value)+'% 0 0)';line.style.left=input.value+'%'});})</script></html>`;
 await writeFile(join(out,'index.html'),html);return report;
}
