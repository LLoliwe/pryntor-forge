import {fromPrompt, components, validateScene, addObject, removeObject, cadScriptFor, pascalHandoff, examplePrompt} from '/core.mjs';
const $=id=>document.getElementById(id);
const canvas=$('viewport'),ctx=canvas.getContext('2d');
let scene=fromPrompt(examplePrompt), selected=null, yaw=-0.73,zoom=1.0,drag=false,moved=false,lastX=0;
const shortType=t=>t[0].toUpperCase()+t.slice(1);
const numeric=n=>n.toFixed(1);
function color(hex,a){return hex+a}
function project(x,y,z){
 const rotX=x*Math.cos(yaw)-y*Math.sin(yaw), rotY=x*Math.sin(yaw)+y*Math.cos(yaw);
 const scale=Math.min(canvas.clientWidth/(scene.room.width*2.2),canvas.clientHeight/(scene.room.depth*2.2),61)*zoom;
 return [canvas.clientWidth*.56+(rotX-rotY*.24)*scale,canvas.clientHeight*.60+(rotY*.62-z*1.12)*scale];
}
function polygon(points,fill,stroke,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function line(a,b,stroke,width=1){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
function boxDraw(cx,cy,w,d,h,col,id){
 const a=[project(cx-w/2,cy-d/2,0),project(cx+w/2,cy-d/2,0),project(cx+w/2,cy+d/2,0),project(cx-w/2,cy+d/2,0)];
 const t=[project(cx-w/2,cy-d/2,h),project(cx+w/2,cy-d/2,h),project(cx+w/2,cy+d/2,h),project(cx-w/2,cy+d/2,h)];
 polygon([a[0],a[1],t[1],t[0]],'#172724',col+'7a');
 polygon([a[1],a[2],t[2],t[1]],'#213631',col+'9a');
 polygon([a[3],a[2],t[2],t[3]],'#152723',col+'50');
 polygon(t,col+'dc','#e1f9c0',id===selected?.id?2.5:0.7);
 if(id===selected?.id){ctx.save();ctx.setLineDash([6,3]);polygon(t,null,'#e9ffa6',1.5);ctx.restore();}
 const center=project(cx,cy,h+.22);ctx.fillStyle='#e8f7e6';ctx.font='10px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(id.replace(/-\d+$/, '').toUpperCase(),center[0],center[1]);
}
function draw(){
 if(!canvas.clientWidth)return;
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
 if(canvas.width!==Math.floor(rect.width*dpr)||canvas.height!==Math.floor(rect.height*dpr)){canvas.width=Math.floor(rect.width*dpr);canvas.height=Math.floor(rect.height*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
 const {width:w,depth:d}=scene.room;
 const floor=[project(-w/2,-d/2,0),project(w/2,-d/2,0),project(w/2,d/2,0),project(-w/2,d/2,0)];
 polygon(floor,'#243a33','#94b880',1.8);
 for(let x=-w/2;x<=w/2+.01;x+=.5)line(project(x,-d/2,0),project(x,d/2,0),'#5b836235',.7);
 for(let y=-d/2;y<=d/2+.01;y+=.5)line(project(-w/2,y,0),project(w/2,y,0),'#5b836235',.7);
 const back=[[project(-w/2,-d/2,0),project(w/2,-d/2,0),project(w/2,-d/2,scene.room.height),project(-w/2,-d/2,scene.room.height)],[project(-w/2,d/2,0),project(-w/2,-d/2,0),project(-w/2,-d/2,scene.room.height),project(-w/2,d/2,scene.room.height)]];
 for(const p of back)polygon(p,'#60746813','#90c28f46',.6);
 for(let x=-w/2;x<=w/2+.01;x+=1)line(project(x,-d/2,0),project(x,-d/2,scene.room.height),'#acc5ab19',.65);
 const sorted=[...scene.objects].sort((a,b)=>{const za=a.x*Math.sin(yaw)+a.y*Math.cos(yaw);const zb=b.x*Math.sin(yaw)+b.y*Math.cos(yaw);return za-zb;});
 for(const o of sorted){const c=components[o.type];boxDraw(o.x,o.y,...c.size,c.color,o.id);}
 for(const p of floor){ctx.fillStyle='#c5f37c';ctx.fillRect(p[0]-2,p[1]-2,4,4);}
 line(project(-w/2,d/2,0),project(-w/2,d/2,-.4),'#c8ee79');
 ctx.fillStyle='#9dbcaa';ctx.font='11px ui-monospace,monospace';ctx.textAlign='center';let pos=project(0,d/2,-.5);ctx.fillText(numeric(w)+' M',pos[0],pos[1]);
}
function update(){
 $('area').textContent=(scene.room.width*scene.room.depth).toFixed(1)+' m²';
 $('count').textContent=String(scene.objects.length).padStart(2,'0');
 $('dims').textContent=[scene.room.width,scene.room.depth,scene.room.height].map(n=>numeric(n)).join(' × ')+' M';
 const s=scene.objects.find(o=>o.id===selected?.id);selected=s||null;
 $('selected-title').textContent=s?shortType(s.type):'None selected';
 $('selected-description').textContent=s?`Editable ${components[s.type].kind} envelope. Export source for further CAD work.`:'Select a component in the canvas to inspect its physical envelope.';
 $('remove').disabled=!s;
 $('properties').innerHTML=s?`<div class="proprow"><span>TYPE</span><strong>${s.type.toUpperCase()}</strong></div><div class="proprow"><span>DIMENSIONS</span><strong>${components[s.type].size.map(n=>n.toFixed(2)).join(' × ')} M</strong></div><div class="proprow"><span>POSITION</span><strong>${s.x.toFixed(2)}, ${s.y.toFixed(2)} M</strong></div><div class="proprow"><span>QUALITY</span><strong>ENVELOPE ONLY</strong></div>`:'<div class="proprow"><span>STATUS</span><strong>WAITING</strong></div>';
 draw();
}
function notice(message){$('notice').textContent=message;}
function download(filename,content,mime='application/json'){let blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('catalog').innerHTML=Object.entries(components).map(([t,c])=>`<button data-type="${t}"><span class="swatch" style="background:${c.color}"></span>${shortType(t)} <span style="margin-left:auto;color:#869a8d">+</span></button>`).join('');
$('catalog').addEventListener('click',e=>{const b=e.target.closest('button[data-type]');if(!b)return;try{scene=addObject(scene,b.dataset.type);selected=scene.objects.at(-1);update();notice('Component added to the source scene.');}catch(err){notice(err.message);}});
$('generate').addEventListener('click',()=>{try{scene=fromPrompt($('prompt').value);selected=null;update();notice(`Generated ${scene.objects.length} objects. Click to inspect.`);}catch(e){notice(e.message);}});
$('reset').addEventListener('click',()=>{yaw=-.73;zoom=1;draw();notice('View reset.');});
$('remove').addEventListener('click',()=>{if(!selected)return;scene=removeObject(scene,selected.id);selected=null;update();notice('Selected component removed.');});
$('export-json').addEventListener('click',()=>{download('pryntor-forge-scene.json',JSON.stringify(validateScene(scene),null,2));notice('Scene JSON exported.');});
$('export-cad').addEventListener('click',()=>{if(!selected){notice('Select a component in the scene to export its CAD envelope.');return;}download(selected.type+'-envelope.py',cadScriptFor(selected.type),'text/x-python');notice('cadgen 0.7.21 source exported. Generation requires upstream runtime.');});
$('export-pascal').addEventListener('click',()=>{download('pascal-handoff.json',JSON.stringify(pascalHandoff(scene),null,2));notice('Handoff exported. Use an agent connected to Pascal MCP.');});
canvas.addEventListener('pointerdown',e=>{drag=true;moved=false;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;let diff=e.clientX-lastX;if(Math.abs(diff)>2)moved=true;yaw+=diff*.008;lastX=e.clientX;draw();});
canvas.addEventListener('pointerup',e=>{if(!moved){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let nearest=null,dist=65;for(const o of scene.objects){const c=components[o.type],p=project(o.x,o.y,c.size[2]);const dd=Math.hypot(p[0]-x,p[1]-y);if(dd<dist){dist=dd;nearest=o;}}selected=nearest;update();}drag=false;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.6,Math.min(2.3,zoom*(e.deltaY>0?.94:1.06)));draw();},{passive:false});
window.addEventListener('resize',draw);
update();
