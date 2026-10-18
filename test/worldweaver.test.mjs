import test from 'node:test';
import assert from 'node:assert/strict';
import {seededWorld,validateWorld,newGame,step,placeObject,MAX_OBJECTS,circuitState,circuitLit,changeCircuit,replay,gameSummary,FIXED_DT} from '../src/worldweaver.mjs';
test('round-trip scene contract and object provenance',()=>{
 const world=seededWorld();assert.deepEqual(validateWorld(JSON.parse(JSON.stringify(world))),world);
 assert.throws(()=>validateWorld({...world, objects:[world.objects[0], world.objects[0]]}),/duplicate/);
 assert.throws(()=>validateWorld({...world,objects:[...world.objects,{id:'oops',type:'script',x:1,y:1}]}),/type/);
 assert.throws(()=>validateWorld({...world,objects:Array(MAX_OBJECTS+1).fill(world.objects[0])}),/count/);
 assert.throws(()=>validateWorld({...world,source:{kind:'reference',rightsConfirmed:false}}),/rights/);
});
test('platform landing, grounded jump and bounded camera are deterministic',()=>{
 const a=newGame(),b=newGame();
 for(let i=0;i<80;i++){step(a,{},1/60);step(b,{},1/60);}
 assert.deepEqual(a,b);assert.equal(a.player.grounded,true);assert.equal(a.player.y,492-a.player.h);
 step(a,{jump:true},1/60);assert.ok(a.player.vy<0);assert.equal(a.player.grounded,false);
 for(let i=0;i<300;i++)step(a,{right:true},1/60);
 assert.ok(a.camera>=0 && a.camera<=a.world.width-960);
});
test('collectible awards points only once',()=>{
 const g=newGame();g.world.objects.push({id:'bonus',type:'gem',x:75,y:427});step(g,{},1/60);assert.equal(g.score,100);step(g,{},1/60);assert.equal(g.score,100);
});
test('death resets player without wiping earned score',()=>{
 const g=newGame();g.score=700;g.player.y=1000;step(g,{},1/60);assert.equal(g.deaths,1);assert.equal(g.score,700);assert.equal(g.player.x,70);
});
test('editing validates and allocates unique IDs',()=>{
 const g=newGame();const a=placeObject(g,'platform',200,370),b=placeObject(g,'gem',250,330);
 assert.notEqual(a.id,b.id);assert.equal(g.world.objects.length,seededWorld().objects.length+2);assert.deepEqual(validateWorld(g.world),g.world);
 assert.throws(()=>placeObject(g,'teleport',0,0),/Unsupported/);
});
test('portal is actual completion state',()=>{
 const g=newGame();g.player.x=2370;g.player.y=380;step(g,{},1/60);
 assert.equal(g.completed,true);const score=g.score;step(g,{right:true},1/60);assert.equal(g.score,score);
});

test('circuit is lit iff battery, wire and switch are all true',()=>{
 for(let mask=0;mask<8;mask++){
  const s={battery:!!(mask&1),wire:!!(mask&2),switchClosed:!!(mask&4)};
  assert.equal(circuitLit(s),mask===7);
 }
 let s=circuitState();s=changeCircuit(s,'battery');assert.equal(s.battery,true);
 assert.equal(circuitLit(s),false);assert.throws(()=>changeCircuit(s,'unknown'),/Unknown/);
});
test('jump release gives lower height than holding jump',()=>{
 const a=newGame(),b=newGame();
 for(let i=0;i<90;i++){step(a);step(b);}
 let minA=Infinity,minB=Infinity;
 for(let i=0;i<50;i++){
  step(a,{jump:i===0});step(b,{jump:true});
  minA=Math.min(minA,a.player.y);minB=Math.min(minB,b.player.y);
 }
 assert.ok(minB<minA-30,`hold ${minB} needs to outjump tap ${minA}`);
});
test('coyote jump is accepted shortly after leaving edge',()=>{
 const g=newGame();for(let i=0;i<85;i++)step(g);
 g.player.x=450;g.player.vx=285;g.player.grounded=true;
 for(let i=0;i<4;i++)step(g,{right:true});
 assert.equal(g.player.grounded,false);
 step(g,{right:true,jump:true});assert.ok(g.player.vy<0);
});
test('buffered jump occurs on landing, without requiring a second keypress',()=>{
 const g=newGame();g.player.y=420;g.player.vy=200;
 step(g,{jump:true});assert.equal(g.player.jumpWasDown,true);
 let jumped=false;
 for(let i=0;i<10;i++){step(g,{jump:true});if(g.player.vy<0)jumped=true;}
 assert.ok(jumped,'landing should consume jump buffer');
});
test('horizontal platform collision prevents walking into a solid wall',()=>{
 const g=newGame();
 g.world.objects.push({id:'wall',type:'platform',x:250,y:300,w:45,h:90});
 g.player.x=200;g.player.y=310;g.player.vx=285;
 for(let i=0;i<12;i++)step(g,{right:true});
 assert.ok(g.player.x+g.player.w<=250.01);
});
test('jumping into underside of a platform stops upward penetration',()=>{
 const g=newGame();g.world.objects.push({id:'ceiling',type:'platform',x:100,y:325,w:180,h:18});
 g.player.x=130;g.player.y=360;g.player.vy=-500;
 let minimum=Infinity;for(let i=0;i<6;i++){step(g);minimum=Math.min(minimum,g.player.y);}assert.equal(minimum,343);assert.ok(g.player.y>=343);
});
test('checkpoint records a stable recovery position',()=>{
 const g=newGame();g.player.x=1447;g.player.y=392;
 step(g);assert.equal(g.checkpoint,'c1');assert.ok(g.score>=50);
 g.player.y=900;step(g);assert.equal(g.deaths,1);assert.equal(g.player.x,g.respawn.x);assert.ok(g.events.some(e=>e.type==='checkpoint'));
});
test('replay is deterministic across repeated independent runs',()=>{
 const frames=Array.from({length:240},(_,i)=>({right:i<220,jump:i===80||i===148}));
 const a=replay(seededWorld(),frames),b=replay(seededWorld(),frames);
 assert.deepEqual(a,b);assert.equal(a.frame,frames.length);
 assert.throws(()=>replay(seededWorld(),Array(36001).fill({})),/safe size/);
});
test('scene sanitizes unknown injected data and rejects impossible layouts',()=>{
 const world=seededWorld();const extra={evil:'nope'};
 const valid=validateWorld({...world,objects:world.objects.map((o,i)=>i?o:{...o,...extra})});
 assert.equal(Object.hasOwn(valid.objects[0],'evil'),false);
 assert.throws(()=>validateWorld({...world,objects:[...world.objects,{id:'another-exit',type:'portal',x:800,y:300}]}),/one portal/);
 assert.throws(()=>validateWorld({...world,objects:[...world.objects,{id:'bad',type:'platform',x:2510,y:100,w:100,h:20}]}),/dimensions/);
 assert.throws(()=>validateWorld({...world,source:{kind:'reference',rightsConfirmed:false}}),/rights/);
});
test('editor rejects invalid positions and keeps source stable on failed add',()=>{
 const g=newGame(),before=JSON.stringify(g.world);
 assert.throws(()=>placeObject(g,'checkpoint',NaN,200),/outside/);
 assert.equal(JSON.stringify(g.world),before);
 const a=placeObject(g,'checkpoint',420,400);
 assert.equal(a.type,'checkpoint');assert.ok(g.world.objects.some(o=>o.id===a.id));
});
test('run never silently exceeds allowed physics timestep',()=>{
 const g=newGame();assert.throws(()=>step(g,{},1),/timestep/);
 assert.throws(()=>step(g,{},-1),/timestep/);
 step(g,{},FIXED_DT);assert.equal(gameSummary(g).frame,1);
});