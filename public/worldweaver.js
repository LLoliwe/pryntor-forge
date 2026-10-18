import {WIDTH,HEIGHT,newGame,step,seededWorld,placeObject,validateWorld,circuitState,circuitLit,changeCircuit,gameSummary} from '/worldweaver-core.mjs';
import {newGait,advanceGait,sampleGait} from '/locomotion-core.mjs';
const $=id=>document.getElementById(id), canvas=$('world'),ctx=canvas.getContext('2d');
let game=newGame(), mode='play', tool='platform', image=null, imageFile=null, last=0, accumulator=0, keys={left:false,right:false,jump:false},paused=false,light=circuitState(),recording=[],motionReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let gait=newGait();
const make=(x,y,w,h)=>ctx.fillRect(x,y,w,h);
function text(str,x,y,size=24,fill='#fff') {ctx.font=`800 ${size}px system-ui`;ctx.fillStyle=fill;ctx.fillText(str,x,y);}
function round(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
const terrain=(x,h,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,HEIGHT);ctx.lineTo(0,h);for(let i=0;i<12;i++)ctx.lineTo(i*105,h-40*Math.sin((i*93+x)*.012)-20*Math.sin((i*49+x)*.023));ctx.lineTo(WIDTH,HEIGHT);ctx.fill();};
function sky(time,camera){let grad=ctx.createLinearGradient(0,0,0,HEIGHT);grad.addColorStop(0,'#120c32');grad.addColorStop(.62,'#573c86');grad.addColorStop(1,'#fa8ab1');ctx.fillStyle=grad;make(0,0,WIDTH,HEIGHT);
 ctx.save();ctx.translate(-camera*.08,0);
 for(let i=0;i<32;i++){const x=((i*139+45)%1100)+camera*.08;const y=30+(i*67)%200;ctx.fillStyle=i%3?'#e8ccff':'#d6ff98';ctx.globalAlpha=.4+.3*Math.sin(time*1.2+i);make(x,y,3,3);}ctx.restore();
 let moon=ctx.createRadialGradient(735,120,1,735,120,120);moon.addColorStop(0,'#ffefc4');moon.addColorStop(.38,'#ecbaff80');moon.addColorStop(1,'#f1b4ff00');ctx.fillStyle=moon;ctx.fillRect(610,0,250,250);
 ctx.fillStyle='#ffe4b7';ctx.beginPath();ctx.arc(735,120,42,0,Math.PI*2);ctx.fill();
 terrain(camera*.03,385,'#302950');terrain(camera*.08+140,425,'#373154');terrain(camera*.18+260,455,'#29254b');}
function drawPlatform(o){const x=o.x-game.camera; if(x>WIDTH+10||x+o.w < -10)return;
 round(x,o.y,o.w,o.h,9,'#1b203d');round(x,o.y,o.w,13,6,'#b4f277');ctx.fillStyle='#5e73ad';for(let i=14;i<o.w-10;i+=34)make(x+i,o.y+21,13,5);
 ctx.strokeStyle='#effbaa77';ctx.lineWidth=2;ctx.strokeRect(x+1,o.y+1,o.w-2,o.h-2);}
function drawGem(o,t){if(game.collected.includes(o.id))return; const x=o.x-game.camera;if(x< -40||x>WIDTH+40)return;const y=o.y+Math.sin(t*3+o.x)*5;
 ctx.save();ctx.translate(x,y);ctx.rotate(.2*Math.sin(t*2+o.x));ctx.shadowColor='#feeb71';ctx.shadowBlur=20;ctx.fillStyle='#ffdf61';ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(12,0);ctx.lineTo(0,16);ctx.lineTo(-12,0);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff8b5';ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,12);ctx.lineTo(-11,0);ctx.fill();ctx.restore();}
function drawEnemy(o,t){const x=o.x+Math.sin(t*o.speed)*o.range-game.camera;if(x< -40||x>WIDTH+40)return;ctx.save();ctx.translate(x,o.y);ctx.shadowColor='#fc71a7';ctx.shadowBlur=16;ctx.fillStyle='#f36baf';ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#452248';for(let i=-1;i<=1;i++)round(i*11-3,-20,6,10,2,'#362041');round(-10,-3,7,6,3,'#210e3e');round(5,-3,7,6,3,'#210e3e');ctx.restore();}
function drawPortal(o,t){const x=o.x-game.camera;if(x<-100||x>WIDTH+100)return;ctx.save();ctx.translate(x+12,o.y-3);ctx.shadowColor='#70fcf6';ctx.shadowBlur=28;ctx.strokeStyle='#90ffd8';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(0,0,32,63,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;const g=ctx.createRadialGradient(0,0,0,0,0,58);g.addColorStop(0,'#fce5ff');g.addColorStop(.35,'#a3b6ff');g.addColorStop(1,'#8660d322');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,29,58,0,0,Math.PI*2);ctx.fill();for(let i=0;i<6;i++){ctx.fillStyle='#d2ffff';ctx.fillRect(-10+Math.sin(t*2+i)*15,i*17-50,3,8);}ctx.restore();}
function drawPlayer(t){const p=game.player,x=p.x-game.camera,y=p.y,pose=sampleGait(gait,p,motionReduced);ctx.save();ctx.translate(x+p.w/2,y+23-pose.bob);const stretch=p.grounded?1-.05*Math.min(1,Math.abs(p.vx)/285):1+.07*Math.min(1,Math.abs(p.vy)/585);ctx.scale(1/stretch,stretch);if(p.invulnerable>0&&Math.sin(t*24)>0)ctx.globalAlpha=.6;
 ctx.shadowColor='#8493ff';ctx.shadowBlur=15;round(-18,-4,36,35,15,'#6f72e8');ctx.shadowBlur=0;
 ctx.fillStyle='#6953b2';ctx.beginPath();ctx.arc(0,-9,24,0,Math.PI*2);ctx.fill();
 for(let i=0;i<8;i++){const a=i*Math.PI*2/8;ctx.fillStyle=i%2?'#8270d4':'#9c8deb';ctx.beginPath();ctx.arc(Math.cos(a)*19,Math.sin(a)*18-9,10,0,Math.PI*2);ctx.fill();}
 round(-13,-15,10,12,5,'#fff9ef');round(3,-15,10,12,5,'#fff9ef');round(-9,-12,5,7,3,'#202042');round(6,-12,5,7,3,'#202042');round(-5,0,10,4,3,'#ffd884');
 ctx.fillStyle='#b3ff99';ctx.fillRect(-20+pose.left.x,20+pose.left.y,15,11);ctx.fillRect(5+pose.right.x,20+pose.right.y,15,11);ctx.restore();}
function drawCheckpoint(o,t){const x=o.x-game.camera,y=o.y;if(x<-50||x>WIDTH+50)return;ctx.save();ctx.translate(x,y);ctx.strokeStyle='#d0d7ed';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-75);ctx.stroke();ctx.shadowColor='#ffec8c';ctx.shadowBlur=game.checkpoint===o.id?28:9;ctx.fillStyle=game.checkpoint===o.id?'#f9e58d':'#f2a7d0';ctx.beginPath();ctx.moveTo(0,-76);ctx.lineTo(15,-59);ctx.lineTo(0,-42);ctx.lineTo(-15,-59);ctx.closePath();ctx.fill();ctx.restore();}
function draw(){const d=Math.min(window.devicePixelRatio||1,2); if(canvas.width!==Math.round(WIDTH*d)||canvas.height!==Math.round(HEIGHT*d)){canvas.width=Math.round(WIDTH*d);canvas.height=Math.round(HEIGHT*d);}ctx.setTransform(d,0,0,d,0,0);const t=motionReduced?0:game.time;sky(t,game.camera);
 if(image){ctx.save();ctx.globalAlpha=.53;const iw=image.naturalWidth,ih=image.naturalHeight,scale=Math.max(WIDTH/iw,HEIGHT/ih);let sw=iw*scale,sh=ih*scale;ctx.drawImage(image,(WIDTH-sw)/2,(HEIGHT-sh)/2,sw,sh);ctx.restore();}
 for(const o of game.world.objects.filter(o=>o.type==='platform'))drawPlatform(o);
 for(const o of game.world.objects.filter(o=>o.type==='gem'))drawGem(o,t);
 for(const o of game.world.objects.filter(o=>o.type==='enemy'))drawEnemy(o,t);
 for(const o of game.world.objects.filter(o=>o.type==='checkpoint'))drawCheckpoint(o,t);
 for(const o of game.world.objects.filter(o=>o.type==='portal'))drawPortal(o,t);
 drawPlayer(t);
 if(paused&&mode==='play'){round(16,16,207,49,12,'#191633b8');text('Ⅱ PAUSED',36,47,22,'#f9e6ab');}
 if(mode==='edit'){ctx.fillStyle='#17112bba';round(18,17,610,44,13,'#17112bdc');text('EDIT WORLD  ·  CLICK TO PLACE '+tool.toUpperCase(),35,46,18,'#edffac');}
 if(game.completed){ctx.fillStyle='#111022bd';make(0,0,WIDTH,HEIGHT);round(195,140,570,265,25,'#23173e');text('WORLD COMPLETE ✦',247,233,42,'#d8ff8f');text('You brought the Spark Trail to life.',248,285,22,'#f5def9');text('Restart to play again',340,336,20,'#c4b7ed');}
}
function metrics(){ $('score').textContent=String(game.score).padStart(4,'0');$('collected').textContent=game.collected.length+' / '+game.world.objects.filter(o=>o.type==='gem').length;$('deaths').textContent=String(game.deaths).padStart(2,'0');$('checkpoint').textContent=game.checkpoint?'LIT':'NONE';$('status').textContent=game.completed?'✨ World complete. You win!':mode==='edit'?'Tap the canvas to '+(tool==='erase'?'remove':'place')+' an object.':paused?'Paused. Resume when ready.':'Reach the portal. Collect sparks along the way.';}
function frame(now){if(!last)last=now;const elapsed=Math.min((now-last)/1000,.12);last=now;accumulator=Math.min(accumulator+elapsed,.12);while(accumulator>=1/60){if(mode==='play'&&!paused){step(game,keys,1/60);advanceGait(gait,game.player,game.deaths);if(recording.length<36000)recording.push({left:keys.left,right:keys.right,jump:keys.jump});}accumulator-=1/60;}draw();metrics();requestAnimationFrame(frame);}requestAnimationFrame(frame);
$('play').onclick=()=>{paused=false;$('pause').textContent='Ⅱ Pause game';mode='play';$('mode-label').textContent='PLAY MODE';$('play').classList.add('primary');$('edit').classList.remove('primary');canvas.focus();};
$('edit').onclick=()=>{mode='edit';$('mode-label').textContent='EDIT MODE';$('edit').classList.add('primary');$('play').classList.remove('primary');};
$('reset').onclick=()=>{let w=game.world;game=newGame(w);gait=newGait();recording=[];paused=false;$('pause').textContent='Ⅱ Pause game';};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ Resume game':'Ⅱ Pause game';};
for(const b of document.querySelectorAll('.tool'))b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('.tool').forEach(a=>a.classList.toggle('active',a===b));mode='edit';$('mode-label').textContent='EDIT MODE';};
const mapping={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump'};
window.addEventListener('keydown',e=>{if(mapping[e.code]){e.preventDefault();keys[mapping[e.code]]=true;}});window.addEventListener('keyup',e=>{if(mapping[e.code])keys[mapping[e.code]]=false;});window.addEventListener('blur',()=>{keys={left:false,right:false,jump:false};paused=true;$('pause').textContent='▶ Resume game';});
for(const b of document.querySelectorAll('[data-key]')){const key=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;b.setPointerCapture(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>{keys[key]=false;});}
canvas.addEventListener('pointerdown',e=>{if(mode!=='edit')return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*WIDTH+game.camera,y=(e.clientY-r.top)/r.height*HEIGHT;
 if(tool==='erase'){let closest=null,dist=50;for(const o of game.world.objects){if(o.type==='portal'||o.id==='p0')continue;const cx=o.type==='platform'?o.x+o.w/2:o.x,cy=o.type==='platform'?o.y+o.h/2:o.y;const d=Math.hypot(cx-x,cy-y);if(d<dist){closest=o;dist=d;}}if(closest){game.world.objects=game.world.objects.filter(o=>o.id!==closest.id);game.collected=game.collected.filter(id=>id!==closest.id);}} else {try{placeObject(game,tool,x,y)}catch(err){$('status').textContent=err.message;}}});
$('rights').onchange=()=>{if(!$('rights').checked&&image){image=null;imageFile=null;game.world.source={kind:'original-demo',referenceName:null,visualExtraction:'none',rightsConfirmed:true};$('image-info').textContent='Reference image cleared because permission was withdrawn.';}};
$('file').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(!$('rights').checked){$('image-info').textContent='Check the rights box before loading artwork.';e.target.value='';return;}if(f.size>8*1024*1024 || !['image/png','image/jpeg','image/webp'].includes(f.type)){$('image-info').textContent='Only PNG, JPEG, WebP, maximum 8 MB.';return;}
 try{const img=new Image();const url=await new Promise((ok,fail)=>{const reader=new FileReader();reader.onload=()=>ok(reader.result);reader.onerror=fail;reader.readAsDataURL(f);});await new Promise((ok,fail)=>{img.onload=ok;img.onerror=fail;img.src=url;});if(img.naturalWidth>8000||img.naturalHeight>8000)throw Error('Image dimensions too large');image=img;imageFile=f.name;game.world.source={kind:'reference',referenceName:f.name,visualExtraction:'none',rightsConfirmed:true};$('image-info').textContent='Image loaded as a backdrop only. Objects need manual placement.';}catch(err){$('image-info').textContent='Could not read this image.';}});
$('export').onclick=()=>{try{const world=validateWorld(game.world);const blob=new Blob([JSON.stringify(world,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pryntor-worldweaver-scene.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='Source JSON exported locally. Image pixels are not embedded.';}catch(err){$('status').textContent=err.message;}};

// Three-control educational circuit truth model. Local and deliberately separate from fictional physics.
for(const b of document.querySelectorAll('[data-circuit]'))b.addEventListener('click',()=>{
 light=changeCircuit(light,b.dataset.circuit);
 for(const control of document.querySelectorAll('[data-circuit]')){
  const active=light[control.dataset.circuit];control.setAttribute('aria-pressed',String(active));
  control.textContent=(active?'● ':'◯ ')+({battery:'Battery',wire:'Wire',switchClosed:'Switch'}[control.dataset.circuit]);
 }
 const on=circuitLit(light);$('lamp').classList.toggle('on',on);
 $('lamp-title').textContent=on?'LIGHT ON':'LIGHT OFF';
 $('lamp-note').textContent=on?'Circuit complete. All three parts are connected.':!light.battery?'No battery: the model has no power source.':!light.wire?'Loose wire: the circuit path is broken.':'Open switch: the circuit path is broken.';
});
$('scene-file').addEventListener('change',async e=>{
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>100000){$('status').textContent='World JSON must be smaller than 100 KB.';return;}
 try{const content=await f.text();const safe=validateWorld(JSON.parse(content));
  if(safe.source.kind==='reference'){
   // A JSON export never contains its artwork, so don't claim a portable image.
   safe.source={kind:'original-demo',referenceName:null,visualExtraction:'none',rightsConfirmed:true};
   image=null;imageFile=null;$('image-info').textContent='Scene restored. Re-import the reference image separately if licensed.';
  }else{image=null;imageFile=null;}
  game=newGame(safe);gait=newGait();recording=[];$('world-title').textContent=safe.title;mode='play';paused=false;
  $('status').textContent='Valid, untrusted JSON safely imported. Original image not included.';
 }catch(err){$('status').textContent='Scene rejected: '+err.message;}finally{e.target.value='';}
});
$('proof').onclick=()=>{
 const payload={source:'local-simulation',engine:'worldweaver/0.2',note:'Not proof of child usability or artistic acceptance.',scene:validateWorld(game.world),summary:gameSummary(game),inputs:recording};
 const blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='worldweaver-local-replay-evidence.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
};