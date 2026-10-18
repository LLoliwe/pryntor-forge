import {fromPrompt, components, validateScene, addObject, removeObject, cadScriptFor, pascalHandoff, examplePrompt, templates, auditScene, rotateObject, moveObject, footprint} from '/core.mjs';
import {planRoute} from '/research.mjs';
const $=id=>document.getElementById(id);
const canvas=$('viewport'),ctx=canvas.getContext('2d');
let routeResult=null,routeSceneKey=null,routeRequest=null;
let scene=fromPrompt(examplePrompt), selected=null, yaw=-0.73,zoom=1.0,drag=false,moved=false,lastX=0;
let viewMode='iso',showLabels=true,sceneRevision=1;
const pointers=new Map();let pinchDistance=0;
const shortType=t=>t[0].toUpperCase()+t.slice(1);
const numeric=n=>n.toFixed(1);
function mix(hex,amount){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 return '#'+rgb.map(c=>Math.max(0,Math.min(255,Math.round(c+(amount>=0?(255-c)*amount:c*amount)))).toString(16).padStart(2,'0')).join('');
}
function project(x,y,z){
 const rotX=x*Math.cos(yaw)-y*Math.sin(yaw), rotY=x*Math.sin(yaw)+y*Math.cos(yaw);
 const {width:w,depth:d,height:h}=scene.room;
 const diagonal=Math.hypot(w,d), pitch=viewMode==='plan'?1.54:.61;
 const scale=Math.min(canvas.clientWidth/(diagonal*1.53),canvas.clientHeight/(diagonal*.89+h*1.3))*zoom;
 const centerY=viewMode==='plan'?.54:.63;
 return [canvas.clientWidth*.55+rotX*scale,canvas.clientHeight*centerY+(rotY*Math.sin(pitch)-z*Math.cos(pitch))*scale];
}
function polygon(points,fill,stroke,width=1){
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function line(a,b,stroke,width=1){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
function boxDraw(cx,cy,w,d,h,col,id,type){
 const a=[project(cx-w/2,cy-d/2,0),project(cx+w/2,cy-d/2,0),project(cx+w/2,cy+d/2,0),project(cx-w/2,cy+d/2,0)];
 const t=[project(cx-w/2,cy-d/2,h),project(cx+w/2,cy-d/2,h),project(cx+w/2,cy+d/2,h),project(cx-w/2,cy+d/2,h)];
 const focus=id===selected?.id;
 const ground=project(cx,cy,0);
 ctx.save();ctx.filter='blur(11px)';ctx.globalAlpha=.23;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(ground[0]+8,ground[1]+8,Math.max(11,Math.hypot(a[1][0]-a[0][0],a[1][1]-a[0][1])*.7),11,-.25,0,Math.PI*2);ctx.fill();ctx.restore();
 const side1=ctx.createLinearGradient(a[0][0],a[0][1],t[0][0],t[0][1]);side1.addColorStop(0,mix(col,-.78));side1.addColorStop(1,mix(col,-.48));
 const side2=ctx.createLinearGradient(a[1][0],a[1][1],t[1][0],t[1][1]);side2.addColorStop(0,mix(col,-.72));side2.addColorStop(1,mix(col,-.27));
 if(type==='workbench'||type==='table'){
   const mid=[project(cx-w/2,cy-d/2,h-.12),project(cx+w/2,cy-d/2,h-.12),project(cx+w/2,cy+d/2,h-.12),project(cx-w/2,cy+d/2,h-.12)];
   for(let i=0;i<4;i++)line(a[i],mid[i],mix(col,-.37),3.5);
   polygon([mid[0],mid[1],t[1],t[0]],side1,mix(col,-.1),.8);
   polygon([mid[1],mid[2],t[2],t[1]],side2,mix(col,-.1),.8);
   polygon([mid[3],mid[2],t[2],t[3]],mix(col,-.42),mix(col,-.1),.7);
 } else {
   polygon([a[0],a[1],t[1],t[0]],side1,mix(col,-.32),.75);
   polygon([a[1],a[2],t[2],t[1]],side2,mix(col,-.14),.75);
   polygon([a[3],a[2],t[2],t[3]],mix(col,-.49),mix(col,-.18),.7);
 }
 const top=ctx.createLinearGradient(t[0][0],t[0][1],t[2][0],t[2][1]);top.addColorStop(0,mix(col,.28));top.addColorStop(.6,col);top.addColorStop(1,mix(col,-.15));
 ctx.save();ctx.shadowColor=col;ctx.shadowBlur=focus?18:4;ctx.shadowOffsetY=2;
 polygon(t,top,focus?'#f4ffbd':mix(col,.46),focus?2:1.2);ctx.restore();
 // Visual assembly hints only. These strokes do not imply real mechanical topology.
 if(type==='workbench'||type==='table'){const strip=.11;line(project(cx-w/2,cy,h+strip),project(cx+w/2,cy,h+strip),mix(col,.48),1.2);}
 if(type==='shelf'||type==='cabinet')for(let i=1;i<=2;i++){const z=h*i/3;line(project(cx+w/2,cy-d/2,z),project(cx+w/2,cy+d/2,z),mix(col,.26),1);}
 if(type==='robot'){let eye=project(cx,cy-d/2-.01,h*.78);ctx.fillStyle='#e8fdb9';ctx.shadowColor='#d4fa76';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(eye[0],eye[1],2.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
 if(focus){ctx.save();ctx.setLineDash([5,5]);polygon([a[0],a[1],a[2],a[3]],null,'#d4fa76',1.2);ctx.restore();for(const p of t){ctx.fillStyle='#efffb6';ctx.fillRect(p[0]-2.6,p[1]-2.6,5.2,5.2);}}
 if(showLabels||focus){const center=project(cx,cy,h+.22);const text=type.toUpperCase();ctx.font='600 9px ui-monospace,Menlo,monospace';const tw=ctx.measureText(text).width;const tx=center[0],ty=center[1];ctx.fillStyle=focus?'#d4fa76dd':'#0c1818db';ctx.beginPath();ctx.roundRect(tx-tw/2-8,ty-12,tw+16,20,5);ctx.fill();ctx.fillStyle=focus?'#19241b':'#e1eddd';ctx.textAlign='center';ctx.fillText(text,tx,ty+1.3);}
}
function draw(){
 if(!canvas.clientWidth)return;
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
 if(canvas.width!==Math.floor(rect.width*dpr)||canvas.height!==Math.floor(rect.height*dpr)){canvas.width=Math.floor(rect.width*dpr);canvas.height=Math.floor(rect.height*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
 const {width:w,depth:d,height:h}=scene.room;
 const floor=[project(-w/2,-d/2,0),project(w/2,-d/2,0),project(w/2,d/2,0),project(-w/2,d/2,0)];
 ctx.save();ctx.shadowColor='#060a07';ctx.shadowBlur=36;ctx.shadowOffsetY=17;
 const fl=ctx.createLinearGradient(floor[0][0],floor[0][1],floor[2][0],floor[2][1]);fl.addColorStop(0,'#385348');fl.addColorStop(.55,'#30443c');fl.addColorStop(1,'#23352f');polygon(floor,fl,'#b8de95',1.6);ctx.restore();
 for(let x=-w/2;x<=w/2+.01;x+=.5){const major=Math.abs(x-Math.round(x))<1e-5;line(project(x,-d/2,0),project(x,d/2,0),major?'#c4eac023':'#b0d4b013',major?.8:.5);}
 for(let y=-d/2;y<=d/2+.01;y+=.5){const major=Math.abs(y-Math.round(y))<1e-5;line(project(-w/2,y,0),project(w/2,y,0),major?'#c4eac023':'#b0d4b013',major?.8:.5);}
 if(viewMode!=='plan'){
  const walls=[[project(-w/2,-d/2,0),project(w/2,-d/2,0),project(w/2,-d/2,h),project(-w/2,-d/2,h)],[project(-w/2,d/2,0),project(-w/2,-d/2,0),project(-w/2,-d/2,h),project(-w/2,d/2,h)]];
  for(const p of walls)polygon(p,'#c9efb10b','#bddeb633',.6);
  for(let x=-w/2;x<=w/2+.01;x+=1){line(project(x,-d/2,0),project(x,-d/2,h),'#dcead71b',.6);}
 }
 // Stable painter order for this orthographic envelope preview.
 const sorted=[...scene.objects].sort((a,b)=>{const za=a.x*Math.sin(yaw)+a.y*Math.cos(yaw);const zb=b.x*Math.sin(yaw)+b.y*Math.cos(yaw);return za-zb;});
 for(const o of sorted){const c=components[o.type],fp=footprint(o);boxDraw(o.x,o.y,fp.width,fp.depth,c.size[2],c.color,o.id,o.type);}
 if(routeResult?.status==='clear'&&routeSceneKey===JSON.stringify(scene)){
  const pts=routeResult.waypoints.map(p=>project(p.x,p.y,.08));ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#ffcf80';ctx.lineWidth=5;ctx.shadowColor='#ffc37b';ctx.shadowBlur=12;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#ffebb9';ctx.lineWidth=1.1;ctx.stroke();for(const [i,p] of pts.entries())if(i===0||i===pts.length-1){ctx.beginPath();ctx.arc(p[0],p[1],6,0,Math.PI*2);ctx.fillStyle=i===0?'#8cf4bd':'#ffcf80';ctx.fill();}ctx.restore();
 }
 for(const p of floor){ctx.fillStyle='#e0f99a';ctx.beginPath();ctx.arc(p[0],p[1],2.1,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle='#b9c8b6';ctx.font='10px ui-monospace,monospace';ctx.textAlign='center';const pos=project(0,d/2,-.2);ctx.fillText(numeric(w)+' M',pos[0],pos[1]+14);
}
function update(){
 if(routeResult && routeSceneKey!==JSON.stringify(scene)){routeResult=null;routeRequest=null;$('route-result').textContent='Scene changed. Run the planner again.';$('download-route').disabled=true;}
 $('scene-title').textContent=scene.name.toUpperCase();
 $('scene-index').textContent=String(sceneRevision).padStart(3,'0');
 $('area').textContent=(scene.room.width*scene.room.depth).toFixed(1)+' m²';
 $('count').textContent=String(scene.objects.length).padStart(2,'0');
 const report=auditScene(scene);$('audit-status').textContent=report.status.toUpperCase();$('occupancy').textContent=`${report.occupiedAreaM2.toFixed(1)} / ${report.floorAreaM2.toFixed(1)} m²`;
 $('dims').textContent=[scene.room.width,scene.room.depth,scene.room.height].map(n=>numeric(n)).join(' × ')+' M';
 const s=scene.objects.find(o=>o.id===selected?.id);selected=s||null;
 $('object-list').innerHTML='<option value="">None selected</option>'+scene.objects.map(o=>`<option value="${o.id}">${shortType(o.type)} (${o.id})</option>`).join('');$('object-list').value=s?.id||'';
 $('selected-title').textContent=s?shortType(s.type):'None selected';
 $('object-glyph').textContent=s?'◈':'◇';$('object-glyph').style.color=s?components[s.type].color:'#d4fa76';$('preview-label').textContent=s?`${s.type.toUpperCase()} / ${s.id.toUpperCase()}`:'THE OBJECT LAB';
 $('selected-description').textContent=s?`Editable ${components[s.type].kind} envelope. Export source for further CAD work.`:'Select a component in the canvas to inspect its physical envelope.';
 $('remove').disabled=!s;for(const control of ['rotate','move-left','move-right','move-up','move-down'])$(control).disabled=!s;
 $('properties').innerHTML=s?`<div class="proprow"><span>TYPE</span><strong>${s.type.toUpperCase()}</strong></div><div class="proprow"><span>DIMENSIONS</span><strong>${components[s.type].size.map(n=>n.toFixed(2)).join(' × ')} M</strong></div><div class="proprow"><span>POSITION</span><strong>${s.x.toFixed(2)}, ${s.y.toFixed(2)} M</strong></div><div class="proprow"><span>ROTATION</span><strong>${s.rotation}°</strong></div><div class="proprow"><span>QUALITY</span><strong>ENVELOPE ONLY</strong></div>`:'<div class="proprow"><span>STATUS</span><strong>WAITING</strong></div>';
 draw();
}
function notice(message){$('notice').textContent=message;}
function download(filename,content,mime='application/json'){let blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('object-list').addEventListener('change',()=>{selected=scene.objects.find(o=>o.id===$('object-list').value)||null;update();});
$('blueprints').innerHTML='<option value="">Choose a blueprint</option>'+Object.entries(templates).map(([key,t])=>`<option value="${key}">${t.name}</option>`).join('');
$('blueprints').addEventListener('change',()=>{const t=templates[$('blueprints').value];if(!t)return;try{scene=fromPrompt(t.prompt);scene.name=t.name;$('prompt').value=t.prompt;$('blueprint-use').textContent=t.use;selected=null;sceneRevision++;setActiveQuick($('blueprints').value);update();notice(`Loaded ${t.name}: ${scene.objects.length} checked envelopes.`);}catch(err){notice(err.message);}});
$('catalog').innerHTML=Object.entries(components).map(([t,c])=>`<button data-type="${t}"><span class="swatch" style="background:${c.color}"></span>${shortType(t)} <span style="margin-left:auto;color:#869a8d">+</span></button>`).join('');
$('catalog').addEventListener('click',e=>{const b=e.target.closest('button[data-type]');if(!b)return;try{scene=addObject(scene,b.dataset.type);selected=scene.objects.at(-1);sceneRevision++;update();notice('Component added to the source scene.');}catch(err){notice(err.message);}});
$('generate').addEventListener('click',()=>{try{scene=fromPrompt($('prompt').value);selected=null;sceneRevision++;setActiveQuick('');update();notice(`Generated ${scene.objects.length} objects. Click to inspect.`);}catch(e){notice(e.message);}});
$('reset').addEventListener('click',()=>{yaw=-.73;zoom=1;draw();notice('View reset.');});
$('remove').addEventListener('click',()=>{if(!selected)return;scene=removeObject(scene,selected.id);selected=null;sceneRevision++;update();notice('Selected component removed.');});
$('rotate').addEventListener('click',()=>{if(!selected)return;try{scene=rotateObject(scene,selected.id);sceneRevision++;update();notice('Rotation validated.')}catch(err){notice(err.message);}});
for(const [control,dx,dy] of [['move-left',-.25,0],['move-right',.25,0],['move-up',0,-.25],['move-down',0,.25]])$(control).addEventListener('click',()=>{if(!selected)return;try{scene=moveObject(scene,selected.id,selected.x+dx,selected.y+dy);sceneRevision++;update();notice('Move validated.')}catch(err){notice(err.message);}});
$('import-json').addEventListener('change',async(e)=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>100000)throw new Error('JSON exceeds 100 KB limit');const candidate=validateScene(JSON.parse(await file.text()));scene=candidate;selected=null;$('blueprints').value='';sceneRevision++;setActiveQuick('');update();notice(`Imported and validated ${scene.objects.length} envelopes.`);}catch(err){notice(`Import rejected: ${err.message}`);}finally{e.target.value='';}});
$('export-audit').addEventListener('click',()=>{download('pryntor-forge-spatial-audit.json',JSON.stringify(auditScene(scene),null,2));notice('Preflight exported. Only 2D axis-aligned envelope overlap checked.');});
$('run-route').addEventListener('click',()=>{
 try{
  const number=id=>{const input=$(id);if(!input.value.trim())throw new Error(`${id} needs a number`);const v=Number(input.value);if(!Number.isFinite(v))throw new Error(`${id} must be finite`);return v;};
  routeRequest={scene:validateScene(scene),start:{x:number('route-start-x'),y:number('route-start-y')},goal:{x:number('route-goal-x'),y:number('route-goal-y')},options:{agentType:$('route-agent').value,clearanceM:number('route-clearance')}};
  routeResult=planRoute(routeRequest.scene,routeRequest.start,routeRequest.goal,routeRequest.options);
  routeSceneKey=JSON.stringify(scene);
  $('route-result').textContent=routeResult.status==='clear'?`CLEAR ON 2D MODEL · ${routeResult.lengthM.toFixed(3)} m · ${routeResult.visitedNodes ?? 0} graph nodes visited. Not robot-safe.`:`${routeResult.status.toUpperCase()} · ${routeResult.reason}`;
  $('download-route').disabled=false;draw();
 }catch(e){routeResult=null;routeRequest=null;$('download-route').disabled=true;$('route-result').textContent=`Rejected: ${e.message}`;draw();}
});
$('download-route').addEventListener('click',()=>{if(!routeResult||!routeRequest)return;download('forge-research-route-evidence.json',JSON.stringify({request:routeRequest,result:routeResult},null,2));notice('Model-specific route evidence exported. No physical safety certification.');});
$('export-json').addEventListener('click',()=>{download('pryntor-forge-scene.json',JSON.stringify(validateScene(scene),null,2));notice('Scene JSON exported.');});
$('export-cad').addEventListener('click',()=>{if(!selected){notice('Select a component in the scene to export its CAD envelope.');return;}download(selected.type+'-envelope.py',cadScriptFor(selected.type),'text/x-python');notice('cadgen 0.7.21 source exported. Generation requires upstream runtime.');});
$('export-pascal').addEventListener('click',()=>{download('pascal-handoff.json',JSON.stringify(pascalHandoff(scene),null,2));notice('Handoff exported. Use an agent connected to Pascal MCP.');});
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);drag=true;moved=false;lastX=e.clientX;if(pointers.size===2){const v=[...pointers.values()];pinchDistance=Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1]);moved=true;}canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const v=[...pointers.values()],dist=Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1]);if(pinchDistance>0)zoom=Math.max(.56,Math.min(2.4,zoom*(dist/pinchDistance)));pinchDistance=dist;moved=true;draw();return;}if(!drag)return;let diff=e.clientX-lastX;if(Math.abs(diff)>2)moved=true;yaw+=diff*.008;lastX=e.clientX;draw();});
canvas.addEventListener('pointerup',e=>{if(!moved&&pointers.size===1){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let nearest=null,dist=65;for(const o of scene.objects){const c=components[o.type],p=project(o.x,o.y,c.size[2]);const dd=Math.hypot(p[0]-x,p[1]-y);if(dd<dist){dist=dd;nearest=o;}}selected=nearest;update();}pointers.delete(e.pointerId);if(pointers.size===0){drag=false;pinchDistance=0;}else{drag=true;moved=true;} });
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);if(!pointers.size){drag=false;pinchDistance=0;}});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.6,Math.min(2.3,zoom*(e.deltaY>0?.94:1.06)));draw();},{passive:false});
function setActiveQuick(key){document.querySelectorAll('[data-quick]').forEach(b=>b.classList.toggle('current',b.dataset.quick===key));}
function setMode(mode){viewMode=mode;for(const [name,id] of [['iso','view-iso'],['plan','view-top']]){const b=$(id);b.classList.toggle('active',name===mode);b.setAttribute('aria-pressed',String(name===mode));}draw();}
$('view-iso').addEventListener('click',()=>setMode('iso'));
$('view-top').addEventListener('click',()=>setMode('plan'));
$('view-labels').addEventListener('click',()=>{showLabels=!showLabels;$('view-labels').classList.toggle('active',showLabels);$('view-labels').setAttribute('aria-pressed',String(showLabels));draw();});
$('view-labels').classList.add('active');
$('view-fit').addEventListener('click',()=>{zoom=1;yaw=viewMode==='plan'?-.73:-.73;draw();notice('Scene framed.');});
document.querySelectorAll('[data-quick]').forEach(b=>b.addEventListener('click',()=>{const t=templates[b.dataset.quick];if(!t)return;try{scene=fromPrompt(t.prompt);scene.name=t.name;$('prompt').value=t.prompt;$('blueprints').value=b.dataset.quick;$('blueprint-use').textContent=t.use;selected=null;sceneRevision++;setActiveQuick(b.dataset.quick);update();notice(`${t.name} ready. Select an object or edit your brief.`);}catch(e){notice(e.message);}}));
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Escape'&&selected){selected=null;update();}
 if((e.key==='r'||e.key==='R')&&selected){$('rotate').click();}
 if(selected&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const id={'ArrowLeft':'move-left','ArrowRight':'move-right','ArrowUp':'move-up','ArrowDown':'move-down'}[e.key];$(id).click();}
});
window.addEventListener('resize',draw);
update();
