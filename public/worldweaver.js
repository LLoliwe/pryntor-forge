import {WIDTH,HEIGHT,newGame,step,placeObject,validateWorld} from '/worldweaver-core.mjs';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
let game=newGame(),mode='play',tool='platform',reference=null,last=0,lag=0;
let keys={left:false,right:false,jump:false};
const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
function label(t,x,y,size=20,color='#fff'){ctx.font='800 '+size+'px system-ui';ctx.fillStyle=color;ctx.fillText(t,x,y);}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function drawBackground(t){
 let grad=ctx.createLinearGradient(0,0,0,HEIGHT);grad.addColorStop(0,'#140d34');grad.addColorStop(.55,'#654384');grad.addColorStop(1,'#ef8dba');rect(0,0,WIDTH,HEIGHT,grad);
 const shift=game.camera;
 for(let i=0;i<48;i++){const x=(i*151-shift*.08+WIDTH*8)%(WIDTH+200),y=25+(i*53)%215;rect(x,y,3,3,i%4===0?'#d7fbae':'#d5b8f6');}
 let glow=ctx.createRadialGradient(755,118,1,755,118,105);glow.addColorStop(0,'#ffeab6');glow.addColorStop(.5,'#f8b4e188');glow.addColorStop(1,'#f8b4e100');rect(640,5,235,235,glow);ellipse(755,118,41,41,'#ffe7c4');
 for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(0,HEIGHT);for(let x=0;x<=WIDTH+24;x+=24){const h=330+k*55+32*Math.sin((x+shift*(.06+k*.09))*0.009+k*2);ctx.lineTo(x,h);}ctx.lineTo(WIDTH,HEIGHT);ctx.closePath();ctx.fillStyle=['#332956','#343057','#242146'][k];ctx.fill();}
 if(reference){ctx.save();ctx.globalAlpha=.55;const s=Math.max(WIDTH/reference.width,HEIGHT/reference.height),w=reference.width*s,h=reference.height*s;ctx.drawImage(reference,(WIDTH-w)/2,(HEIGHT-h)/2,w,h);ctx.restore();}
}
function drawWorld(){
 const t=game.time,c=game.camera;
 for(const o of game.world.objects){
  const x=o.x-c;if(x<-230||x>WIDTH+250)continue;
  if(o.type==='platform'){rect(x,o.y,o.w,o.h,'#1a2043');rect(x,o.y,o.w,12,'#bef78b');for(let a=14;a<o.w-9;a+=36)rect(x+a,o.y+22,14,4,'#56649b');}
  if(o.type==='gem'&&!game.collected.includes(o.id)){const y=o.y+Math.sin(t*3+o.x)*5;ctx.save();ctx.translate(x,y);ctx.rotate(t*.4);ctx.shadowColor='#fff098';ctx.shadowBlur=20;ctx.fillStyle='#fadd72';ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(12,0);ctx.lineTo(0,15);ctx.lineTo(-12,0);ctx.closePath();ctx.fill();ctx.restore();}
  if(o.type==='enemy'){const ex=x+Math.sin(t*o.speed)*o.range;ctx.save();ctx.shadowColor='#ff71a9';ctx.shadowBlur=17;ellipse(ex,o.y,20,20,'#fb78af');ctx.restore();ellipse(ex-8,o.y-3,3,4,'#281332');ellipse(ex+8,o.y-3,3,4,'#281332');}
  if(o.type==='portal'){ctx.save();ctx.shadowColor='#85fcf1';ctx.shadowBlur=28;ctx.lineWidth=9;ctx.strokeStyle='#a0ffde';ctx.beginPath();ctx.ellipse(x+10,o.y-8,32,62,0,0,Math.PI*2);ctx.stroke();ctx.restore();ellipse(x+10,o.y-8,24,50,'#9c8ceaad');}
 }
 const p=game.player,x=p.x-c,y=p.y;if(p.invulnerable===0||Math.sin(t*24)<0){ctx.save();ctx.shadowBlur=13;ctx.shadowColor='#9b83ff';ellipse(x+15,y+18,22,25,'#7963bc');ctx.shadowBlur=0;for(let k=0;k<8;k++){const a=k*Math.PI/4;ellipse(x+15+18*Math.cos(a),y+15+19*Math.sin(a),9,10,k%2?'#7f69dc':'#ae93ff');}ellipse(x+8,y+16,5,7,'#fff7df');ellipse(x+22,y+16,5,7,'#fff7df');ellipse(x+8,y+17,2,3,'#191a34');ellipse(x+22,y+17,2,3,'#191a34');rect(x+4,y+38,10,5,'#bafa83');rect(x+18,y+38,10,5,'#bafa83');ctx.restore();}
}
function draw(){
 drawBackground(game.time);drawWorld();
 if(mode==='edit'){rect(12,12,578,47,'#1b153bdd');label('EDIT MODE   /   TAP TO PLACE '+tool.toUpperCase(),27,42,18,'#d8ff90');}
 if(game.completed){rect(0,0,WIDTH,HEIGHT,'#110f2bcb');rect(210,151,540,244,'#322354');label('WORLD COMPLETE ✦',257,235,41,'#d4ff8c');label('The Spark Trail is yours.',316,284,22);label('Restart to play again.',334,332,17,'#bfb2dd');}
}
function updateReadout(){
 $('score').textContent=String(game.score).padStart(4,'0');
 $('count').textContent=game.collected.length+' / '+game.world.objects.filter(o=>o.type==='gem').length;
 $('deaths').textContent=String(game.deaths).padStart(2,'0');
 $('notice').textContent=game.completed?'✨ WORLD COMPLETE':mode==='edit'?'Tap the canvas to '+(tool==='erase'?'erase':'place')+' '+tool:'Reach the portal.';
}
function tick(now){if(!last)last=now;lag=Math.min(lag+Math.min((now-last)/1000,.1),.12);last=now;while(lag>=1/60){if(mode==='play')step(game,keys,1/60);lag-=1/60;}draw();updateReadout();requestAnimationFrame(tick);}requestAnimationFrame(tick);
function chooseMode(m){mode=m;$('mode').textContent=m.toUpperCase()+' MODE';canvas.focus();}
$('play').onclick=()=>chooseMode('play');$('edit').onclick=()=>chooseMode('edit');
$('restart').onclick=()=>{game=newGame(game.world);};
for(const b of document.querySelectorAll('[data-tool]'))b.onclick=()=>{tool=b.dataset.tool;chooseMode('edit');document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('selected',x===b));};
const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump'};
window.addEventListener('keydown',e=>{if(map[e.code]){e.preventDefault();keys[map[e.code]]=true;}});
window.addEventListener('keyup',e=>{if(map[e.code])keys[map[e.code]]=false;});
window.addEventListener('blur',()=>{keys={left:false,right:false,jump:false};});
for(const b of document.querySelectorAll('[data-key]')){const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;b.setPointerCapture(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>{keys[k]=false;});}
canvas.addEventListener('pointerdown',e=>{
 if(mode!=='edit')return;
 const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*WIDTH/r.width+game.camera,y=(e.clientY-r.top)*HEIGHT/r.height;
 if(tool==='erase'){let choice=null,dist=48;for(const o of game.world.objects){if(o.id==='p0'||o.type==='portal')continue;const cx=o.type==='platform'?o.x+o.w/2:o.x,cy=o.type==='platform'?o.y+o.h/2:o.y;const d=Math.hypot(x-cx,y-cy);if(d<dist){choice=o;dist=d;}}if(choice){game.world.objects=game.world.objects.filter(o=>o.id!==choice.id);game.collected=game.collected.filter(id=>id!==choice.id);}}
 else{try{placeObject(game,tool,x,y);}catch(err){$('notice').textContent=err.message;}}
});
$('rights').addEventListener('change',()=>{if(!$('rights').checked){reference=null;game.world.source={kind:'original-demo',referenceName:null,visualExtraction:'none',rightsConfirmed:true};$('imageNote').textContent='Reference cleared when permission withdrawn.';}});
$('image').addEventListener('change',async e=>{
 const f=e.target.files?.[0];if(!f)return;
 if(!$('rights').checked){$('imageNote').textContent='Confirm your rights before selecting an image.';e.target.value='';return;}
 if(f.size>8*1024*1024||!['image/png','image/jpeg','image/webp'].includes(f.type)){$('imageNote').textContent='PNG, JPEG or WebP only, up to 8 MB.';return;}
 try{const src=await new Promise((ok,bad)=>{const reader=new FileReader();reader.onload=()=>ok(reader.result);reader.onerror=bad;reader.readAsDataURL(f);});
 const img=new Image();await new Promise((ok,bad)=>{img.onload=ok;img.onerror=bad;img.src=src;});if(img.naturalWidth>8000||img.naturalHeight>8000)throw Error('Too large');
 reference=img;game.world.source={kind:'reference',referenceName:f.name,visualExtraction:'none',rightsConfirmed:true};$('imageNote').textContent='Image loaded locally as a backdrop. Place gameplay objects manually.';
 }catch(err){$('imageNote').textContent='Image could not be read.';}
});
$('export').onclick=()=>{try{const data=JSON.stringify(validateWorld(game.world),null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pryntor-worldweaver-scene.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('notice').textContent='Scene JSON exported.';}catch(err){$('notice').textContent=err.message;}};
