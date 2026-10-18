/**
 * PRYNTOR WORLDWEAVER R1. Deterministic simulation and safe scene semantics.
 * Original local-first code, no inference, dependencies or network calls.
 * All game state advances at 60 Hz in the host's fixed-step loop.
 */
export const WIDTH=960, HEIGHT=540, MAX_OBJECTS=160, FIXED_DT=1/60;
export const PHYSICS=Object.freeze({gravity:1320,maxSpeed:285,groundAcceleration:2100,airAcceleration:1650,groundDrag:2550,airDrag:430,jumpVelocity:-585,terminalVelocity:1050,coyoteSeconds:.11,bufferSeconds:.14,jumpReleaseMultiplier:.55,checkpointRadius:38});
const box=(x,y,w,h)=>({x,y,w,h});
const isNum=v=>typeof v==='number' && Number.isFinite(v);
const range=(v,a,b)=>isNum(v) && v>=a && v<=b;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const overlap=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);

export const seededWorld=()=>({
 version:'worldweaver/0.1',width:2520,height:HEIGHT,title:'THE SPARK TRAIL',
 source:{kind:'original-demo',referenceName:null,visualExtraction:'none',rightsConfirmed:true},
 objects:[
 {id:'p0',type:'platform',...box(0,492,460,48)},
 {id:'p1',type:'platform',...box(530,445,320,32)},
 {id:'p2',type:'platform',...box(920,395,350,32)},
 {id:'p3',type:'platform',...box(1340,460,310,35)},
 {id:'p4',type:'platform',...box(1740,420,330,36)},
 {id:'p5',type:'platform',...box(2150,490,370,50)},
 {id:'g1',type:'gem',x:200,y:445},
 {id:'g2',type:'gem',x:650,y:393},
 {id:'g3',type:'gem',x:1050,y:341},
 {id:'g4',type:'gem',x:1480,y:406},
 {id:'g5',type:'gem',x:1900,y:361},
 {id:'c1',type:'checkpoint',x:1450,y:428},
 {id:'e1',type:'enemy',x:1110,y:366,range:90,speed:1.5},
 {id:'e2',type:'enemy',x:1930,y:391,range:95,speed:1.8},
 {id:'exit',type:'portal',x:2370,y:400},
 ]
});

/** Pure, whitelist-based scene validation. Do not put user-controlled HTML in the DOM. */
export function validateWorld(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!=='worldweaver/0.1'||!range(raw.width,WIDTH,20000)||raw.height!==HEIGHT||!Array.isArray(raw.objects)||raw.objects.length>MAX_OBJECTS) throw Error('Invalid scene header or object count');
 const ids=new Set(),objects=[];
 for(const value of raw.objects){
  if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.id!=='string'||!/^[a-zA-Z0-9_-]{1,48}$/.test(value.id)||ids.has(value.id))throw Error('Invalid or duplicate object ID');
  ids.add(value.id);
  const {id,type,x,y}=value;
  if(!['platform','gem','enemy','portal','checkpoint'].includes(type)||!range(x,0,raw.width)||!range(y,0,HEIGHT))throw Error('Invalid object type or position');
  let o={id,type,x,y};
  if(type==='platform'){
   if(!range(value.w,30,900)||!range(value.h,12,90)||x+value.w>raw.width||y+value.h>HEIGHT)throw Error('Invalid platform dimensions');
   o.w=value.w;o.h=value.h;
  }
  if(type==='enemy'){
   if(!range(value.range,0,150)||!range(value.speed,.2,5)||x-value.range-18<0||x+value.range+18>raw.width)throw Error('Invalid enemy movement');
   o.range=value.range;o.speed=value.speed;
  }
  objects.push(o);
 }
 if(!objects.some(o=>o.type==='platform')||objects.filter(o=>o.type==='portal').length!==1)throw Error('Scene requires platforms and exactly one portal');
 const src=raw.source||{};
 if(src.kind==='reference' && src.rightsConfirmed!==true)throw Error('Reference image rights confirmation required');
 if(src.kind!==undefined&&!['original-demo','reference'].includes(src.kind))throw Error('Invalid source kind');
 return {version:raw.version,width:raw.width,height:HEIGHT,title:String(raw.title||'Untitled world').slice(0,70),
  source:{kind:src.kind==='reference'?'reference':'original-demo',referenceName:typeof src.referenceName==='string'?src.referenceName.slice(0,120):null,visualExtraction:'none',rightsConfirmed:src.rightsConfirmed===true},objects};
}
export const circuitState=()=>({battery:false,wire:false,switchClosed:false});
/** Truth-preserving educational model, NOT a simulation of electron trajectories. */
export const circuitLit=state=>Boolean(state.battery&&state.wire&&state.switchClosed);
export function changeCircuit(state,part){
 if(!['battery','wire','switchClosed'].includes(part))throw Error('Unknown circuit control');
 return {...state,[part]:!state[part]};
}
export function newGame(scene=seededWorld()){
 const world=validateWorld(scene);
 return {world,player:{x:70,y:408,w:31,h:43,vx:0,vy:0,grounded:false,invulnerable:0,coyote:0,jumpBuffer:0,jumpWasDown:false,facing:1},
  time:0,frame:0,score:0,deaths:0,collected:[],checkpoint:null,respawn:{x:70,y:408},completed:false,camera:0,events:[]};
}
export function resetPlayer(g){
 const p=g.player;
 Object.assign(p,{x:g.respawn.x,y:g.respawn.y,vx:0,vy:0,grounded:false,invulnerable:1,coyote:0,jumpBuffer:0,jumpWasDown:false});
 g.deaths+=1;
 g.events.push({frame:g.frame,type:'respawn',at:g.checkpoint});
}
function approach(value,target,delta){return value<target?Math.min(target,value+delta):Math.max(target,value-delta);}
const touching=(a,b)=>a.x+a.w>b.x+.001 && a.x<b.x+b.w-.001;
export function step(g,controls={},delta=FIXED_DT){
 if(!Number.isFinite(delta)||delta<0||delta>1/30+1e-8)throw Error('Invalid fixed timestep');
 if(g.completed||delta===0)return g;
 const dt=delta,p=g.player,world=g.world;
 g.frame+=1;g.time=g.frame*FIXED_DT;
 p.invulnerable=Math.max(0,p.invulnerable-dt);
 p.coyote=p.grounded?PHYSICS.coyoteSeconds:Math.max(0,p.coyote-dt);
 const jump=controls.jump===true;
 p.jumpBuffer=jump&&!p.jumpWasDown?PHYSICS.bufferSeconds:Math.max(0,p.jumpBuffer-dt);
 if(!jump&&p.jumpWasDown&&p.vy<0)p.vy*=PHYSICS.jumpReleaseMultiplier;
 p.jumpWasDown=jump;
 const axis=Number(controls.right===true)-Number(controls.left===true);
 if(axis!==0)p.facing=axis;
 const accel=p.grounded?PHYSICS.groundAcceleration:PHYSICS.airAcceleration;
 const drag=p.grounded?PHYSICS.groundDrag:PHYSICS.airDrag;
 p.vx=axis?approach(p.vx,axis*PHYSICS.maxSpeed,accel*dt):approach(p.vx,0,drag*dt);
 if(p.jumpBuffer>0&&(p.grounded||p.coyote>0)){
  p.vy=PHYSICS.jumpVelocity;p.grounded=false;p.coyote=0;p.jumpBuffer=0;
  g.events.push({frame:g.frame,type:'jump'});
 }
 // Resolve horizontal contact against solids, no tunnelling through their sides.
 const beforeX=p.x;
 p.x=clamp(p.x+p.vx*dt,0,world.width-p.w);
 for(const o of world.objects){if(o.type!=='platform')continue;
  if(p.y+p.h<=o.y+2||p.y>=o.y+o.h-2)continue;
  if(beforeX+p.w<=o.x+.01 && p.x+p.w>o.x){p.x=o.x-p.w;p.vx=0;}
  if(beforeX>=o.x+o.w-.01 && p.x<o.x+o.w){p.x=o.x+o.w;p.vx=0;}
 }
 const previousTop=p.y,previousBottom=p.y+p.h;
 p.vy=Math.min(PHYSICS.terminalVelocity,p.vy+PHYSICS.gravity*dt);
 p.y+=p.vy*dt;
 let grounded=false;
 if(p.vy>=0){
  let nearest=Infinity;
  for(const o of world.objects){if(o.type!=='platform'||!touching(p,o))continue;
   // A platform that was above the feet never counts as a landing.
   if(previousBottom<=o.y+0.01 && p.y+p.h>=o.y && o.y<nearest)nearest=o.y;
  }
  if(nearest<Infinity){p.y=nearest-p.h;p.vy=0;grounded=true;}
 }else{
  let ceiling=-Infinity;
  for(const o of world.objects){if(o.type!=='platform'||!touching(p,o))continue;
   if(previousTop>=o.y+o.h-.01 && p.y<o.y+o.h && o.y+o.h>ceiling)ceiling=o.y+o.h;
  }
  if(ceiling>-Infinity){p.y=ceiling;p.vy=0;}
 }
 p.grounded=grounded;
 if(p.y>HEIGHT+100){resetPlayer(g);return g;}
 for(const o of world.objects){
  if(o.type==='gem'&&!g.collected.includes(o.id)&&overlap(p,box(o.x-13,o.y-13,26,26))){g.collected.push(o.id);g.score+=100;g.events.push({frame:g.frame,type:'collect',id:o.id});}
  if(o.type==='checkpoint'&&overlap(p,box(o.x-16,o.y-55,32,65))&&g.checkpoint!==o.id){
   g.checkpoint=o.id;g.respawn={x:clamp(o.x-16,0,world.width-p.w),y:Math.max(0,o.y-p.h-12)};
   g.score+=50;g.events.push({frame:g.frame,type:'checkpoint',id:o.id});
  }
  if(o.type==='enemy'&&p.invulnerable===0&&overlap(p,box(o.x+Math.sin(g.time*o.speed)*o.range-17,o.y-18,34,36))){resetPlayer(g);return g;}
  if(o.type==='portal'&&overlap(p,box(o.x-10,o.y-54,55,98))){g.completed=true;g.score+=500;g.events.push({frame:g.frame,type:'complete'});}
 }
 g.camera=clamp(p.x-260,0,world.width-WIDTH);
 return g;
}
export function placeObject(g,type,x,y){
 if(!['platform','gem','enemy','checkpoint'].includes(type))throw Error('Unsupported placement type');
 if(g.world.objects.length>=MAX_OBJECTS)throw Error('Scene object limit reached');
 if(!range(x,0,g.world.width)||!range(y,0,HEIGHT))throw Error('Placement outside world');
 let next=1;
 const existing=new Set(g.world.objects.map(o=>o.id));
 while(existing.has('u'+next))next++;
 const obj={id:'u'+next,type,x:Math.round(x),y:Math.round(y)};
 if(type==='platform'){obj.w=165;obj.h=28;obj.x=clamp(obj.x,0,g.world.width-165);obj.y=clamp(obj.y,40,HEIGHT-28);}
 if(type==='enemy'){obj.range=45;obj.speed=1.3;obj.x=clamp(obj.x,63,g.world.width-63);}
 g.world=validateWorld({...g.world,objects:[...g.world.objects,obj]});
 return obj;
}
/** No input, child data, private assets or visual blobs leave the device. */
export function replay(scene,frames){
 if(!Array.isArray(frames)||frames.length>36000)throw Error('Replay exceeds safe size');
 const game=newGame(scene);
 for(const frame of frames){
  if(!frame||typeof frame!=='object'||Array.isArray(frame))throw Error('Invalid replay input');
  step(game,{left:frame.left===true,right:frame.right===true,jump:frame.jump===true});
 }
 return {frame:game.frame,score:game.score,deaths:game.deaths,collected:game.collected.slice(),completed:game.completed,position:{x:game.player.x,y:game.player.y},events:game.events.slice()};
}
export function gameSummary(g){
 return {version:'worldweaver-proof/0.2',frame:g.frame,score:g.score,deaths:g.deaths,collected:[...g.collected],checkpoint:g.checkpoint,completed:g.completed,x:Math.round(g.player.x*100)/100,y:Math.round(g.player.y*100)/100,events:g.events.slice()};
}