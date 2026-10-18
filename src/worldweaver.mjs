/** Pryntor WORLDWEAVER: deterministic, dependency-free 2D play simulation. MIT. */
export const WIDTH = 960;
export const HEIGHT = 540;
export const MAX_OBJECTS = 160;
const GRAVITY = 1320, SPEED = 285, JUMP = -585;
const box = (x,y,w,h) => ({x,y,w,h});
export const seededWorld = () => ({
  version: 'worldweaver/0.1', width: 2520, height: HEIGHT, title: 'THE SPARK TRAIL',
  source: {kind:'original-demo',referenceName:null,visualExtraction:'none',rightsConfirmed:true},
  objects: [
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
    {id:'e1',type:'enemy',x:1110,y:366,range:90,speed:1.5},
    {id:'e2',type:'enemy',x:1930,y:391,range:95,speed:1.8},
    {id:'exit',type:'portal',x:2370,y:400},
  ]
});
const isNum = x => typeof x === 'number' && Number.isFinite(x);
const inRange = (n, lo, hi) => isNum(n) && n >= lo && n <= hi;
export function validateWorld(raw) {
  if (!raw || raw.version !== 'worldweaver/0.1' || !inRange(raw.width,960,20000) || raw.height !== HEIGHT || !Array.isArray(raw.objects) || raw.objects.length>MAX_OBJECTS) throw Error('Invalid scene header or object count');
  const ids=new Set();
  for(const o of raw.objects){
    if(!o || typeof o.id!=='string' || !/^[a-zA-Z0-9_-]{1,48}$/.test(o.id) || ids.has(o.id)) throw Error('Invalid or duplicate object ID');
    ids.add(o.id);
    if(!['platform','gem','enemy','portal'].includes(o.type) || !inRange(o.x,0,raw.width) || !inRange(o.y,0,HEIGHT)) throw Error('Invalid object type or position');
    if(o.type==='platform' && (!inRange(o.w,30,900) || !inRange(o.h,12,90) || o.x+o.w>raw.width)) throw Error('Invalid platform dimensions');
    if(o.type==='enemy' && (!inRange(o.range,0,150) || !inRange(o.speed,0.2,5))) throw Error('Invalid enemy movement');
  }
  if(!raw.objects.some(o=>o.type==='platform') || !raw.objects.some(o=>o.type==='portal')) throw Error('Scene requires a platform and portal');
  const source=raw.source||{};
  if(source.kind==='reference' && source.rightsConfirmed!==true) throw Error('Reference image rights confirmation required');
  return {version:raw.version,width:raw.width,height:HEIGHT,title:String(raw.title||'Untitled world').slice(0,70), source: {kind:source.kind==='reference'?'reference':'original-demo',referenceName: typeof source.referenceName==='string'?source.referenceName.slice(0,120):null,visualExtraction:'none',rightsConfirmed:source.rightsConfirmed===true},objects:raw.objects.map(o=>({...o}))};
}
const overlaps=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
export function newGame(source=seededWorld()) {
  const world=validateWorld(source);
  return {world,player:{x:70,y:408,w:31,h:43,vy:0,grounded:false,invulnerable:0},time:0,score:0,deaths:0,collected:[],completed:false,camera:0};
}
export function resetPlayer(game){Object.assign(game.player,{x:70,y:408,vy:0,grounded:false,invulnerable:1}); game.deaths++;}
export function step(game, input, delta=1/60) {
  const dt=Math.min(Math.max(Number(delta)||0,0),1/30), p=game.player;
  if(game.completed || dt===0) return game;
  game.time+=dt;p.invulnerable=Math.max(0,p.invulnerable-dt);
  const axis=(input.right?1:0)-(input.left?1:0);
  p.x=Math.max(0,Math.min(game.world.width-p.w,p.x+axis*SPEED*dt));
  if(input.jump && p.grounded){p.vy=JUMP;p.grounded=false;}
  const oldBottom=p.y+p.h;
  p.vy=Math.min(1050,p.vy+GRAVITY*dt);
  p.y+=p.vy*dt;
  p.grounded=false;
  if(p.vy>=0){
    let landing=Infinity;
    for(const o of game.world.objects){
      if(o.type!=='platform')continue;
      if(p.x+p.w>o.x+3 && p.x<o.x+o.w-3 && oldBottom<=o.y+12 && p.y+p.h>=o.y && o.y<landing)landing=o.y;
    }
    if(landing<Infinity){p.y=landing-p.h;p.vy=0;p.grounded=true;}
  }
  if(p.y>HEIGHT+110){resetPlayer(game);return game;}
  for(const o of game.world.objects){
    if(o.type==='gem' && !game.collected.includes(o.id) && overlaps(p,box(o.x-13,o.y-13,26,26))){game.collected.push(o.id);game.score+=100;}
    if(o.type==='enemy'){
      const ex=o.x+Math.sin(game.time*o.speed)*o.range;
      if(p.invulnerable===0 && overlaps(p,box(ex-17,o.y-18,34,36))){resetPlayer(game);return game;}
    }
    if(o.type==='portal' && overlaps(p,box(o.x-10,o.y-54,55,98))){game.completed=true;game.score+=500;}
  }
  game.camera=Math.max(0,Math.min(game.world.width-WIDTH,p.x-260));
  return game;
}
export function placeObject(game,type,x,y){
  if(!['platform','gem','enemy'].includes(type)) throw Error('Unsupported placement type');
  if(game.world.objects.length>=MAX_OBJECTS)throw Error('Scene object limit reached');
  const obj={id:'u'+(Math.max(0,...game.world.objects.map(o=>/^u\d+$/.test(o.id)?Number(o.id.slice(1)):0))+1),type,x:Math.round(x),y:Math.round(y)};
  if(type==='platform'){obj.w=165;obj.h=28;obj.x=Math.max(0,Math.min(game.world.width-165,obj.x));obj.y=Math.max(40,Math.min(HEIGHT-28,obj.y));}
  if(type==='enemy'){obj.range=45;obj.speed=1.3;}
  const test=validateWorld({...game.world,objects:[...game.world.objects,obj]}); game.world=test;return obj;
}