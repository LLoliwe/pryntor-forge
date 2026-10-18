import test from 'node:test';
import assert from 'node:assert/strict';
import {fromPrompt,validateScene,components} from '../src/core.mjs';
import {planRoute,verifyRoute,synthesizeLayout,clearanceEnvelope} from '../src/research.mjs';
const empty=(w=10,d=8)=>({schemaVersion:'0.2',name:'Research Test',room:{width:w,depth:d,height:3.1},objects:[]});
const obj=(id,type,x,y,rotation=0)=>({id,type,x,y,rotation});
const obstacleTest=()=>({...empty(),objects:[obj('tank-1','tank',0,0)]});

test('unobstructed route has true Manhattan shortest length, and deterministic output',()=>{
 const s=empty();const a={x:-3,y:-2},b={x:3,y:2};
 const result=planRoute(s,a,b,{clearanceM:0.1});
 assert.equal(result.status,'clear');assert.equal(result.lengthM,10);
 assert.deepEqual(result,planRoute(s,a,b,{clearanceM:0.1}));
 assert.equal(verifyRoute(s,result.waypoints,{clearanceM:0.1}).valid,true);
});
test('obstacle yields a verified orthogonal detour',()=>{
 const s=obstacleTest(),a={x:-3,y:0},b={x:3,y:0};
 const result=planRoute(s,a,b);
 assert.equal(result.status,'clear');assert.ok(result.lengthM>6);
 assert.ok(result.waypoints.length>=3);
 const proof=verifyRoute(s,result.waypoints);
 assert.equal(proof.valid,true);assert.equal(proof.lengthM,result.lengthM);
});
test('blocked start and no-passage wall are explicit non-success',()=>{
 const s=obstacleTest();
 assert.match(planRoute(s,{x:0,y:0},{x:3,y:0}).reason,/start intersects/);
 const wall={...empty(4,4),objects:[obj('barrier-1','workbench',0,0,90)]};
 assert.equal(planRoute(wall,{x:-1,y:0},{x:1,y:0},{clearanceM:1}).status,'blocked');
});
test('route checker rejects diagonal, collision and invalid waypoints',()=>{
 const s=obstacleTest();
 assert.match(verifyRoute(s,[{x:-2,y:0},{x:2,y:0}]).reason,/crosses/);
 assert.match(verifyRoute(s,[{x:-2,y:-2},{x:2,y:2}]).reason,/diagonal/);
 assert.match(verifyRoute(s,[{x:-100,y:0},{x:2,y:0}]).reason,/outside/);
});
test('routing exposes clearance sensitivity instead of claiming exact robust max',()=>{
 const s=obstacleTest(); const result=clearanceEnvelope(s,{x:-3,y:0},{x:3,y:0},{clearancesM:[0,0.1,0.25,0.5]});
 assert.equal(result.samples.length,4);assert.ok(result.maxPassingSampleM>=0);
 assert.match(result.limitations,/not a continuous/);
});
test('finite solver is deterministic and outputs collision-free layout',()=>{
 const spec={room:{width:5,depth:4},stepM:0.5,objects:[{id:'robot-1',type:'robot'},{id:'bench-1',type:'workbench'},{id:'bench-2',type:'workbench'}]};
 const a=synthesizeLayout(spec),b=synthesizeLayout(spec);
 assert.equal(a.status,'satisfiable');assert.deepEqual(a,b);
 assert.ok(validateScene(a.scene));assert.equal(a.scene.objects.length,3);
 assert.equal(a.certificate.domainSize['robot-1']>0,true);
});
test('unsatisfiable means a completed finite lattice, not arbitrary timeout',()=>{
 const spec={room:{width:2,depth:2},stepM:1,clearanceM:0.5,objects:[{id:'a',type:'tank'},{id:'b',type:'tank'}],nodeLimit:100000};
 const result=synthesizeLayout(spec);
 assert.equal(result.status,'unsatisfiable');assert.ok(result.certificate.nodesVisited>0);
});
test('unknown, distinct from unsat, propagates a bounded search budget',()=>{
 const spec={room:{width:4,depth:4},stepM:0.25,nodeLimit:1,objects:[{id:'a',type:'workbench'},{id:'b',type:'workbench'}]};
 const result=synthesizeLayout(spec);
 assert.equal(result.status,'unknown');assert.equal(result.certificate.nodesVisited,1);
});
test('solver refuses deceptive continuous-domain interpretations and malformed inputs',()=>{
 assert.throws(()=>synthesizeLayout({room:{width:4,depth:4},objects:[{id:'x',type:'fake'}]}),/Unknown component/);
 assert.throws(()=>synthesizeLayout({room:{width:4,depth:4},objects:[{id:'a',type:'chair'},{id:'a',type:'chair'}]}),/IDs must be unique/);
 assert.throws(()=>synthesizeLayout({room:{width:4,depth:4},objects:[],nodeLimit:0}),/nodeLimit/);
 const r=synthesizeLayout({room:{width:4,depth:4},objects:[]});assert.equal(r.status,'satisfiable');
});
test('v0.1 scenes route without needing a migration',()=>{
 const s=fromPrompt('8x6m with 1 robot');s.schemaVersion='0.1';
 const res=planRoute(s,{x:-3,y:-2},{x:3,y:2},{agentType:'chair',clearanceM:0});
 assert.equal(res.status,'clear');assert.equal(verifyRoute(s,res.waypoints,{agentType:'chair',clearanceM:0}).valid,true);
});
test('symmetry and translation metamorphic invariants on obstacle-free rooms',()=>{
 const s=empty(), points=[[-3,-2,3,2],[-2,1,3,-1],[-1,1,1,1],[0,0,0,0]];
 for(const [ax,ay,bx,by] of points){
  const p=planRoute(s,{x:ax,y:ay},{x:bx,y:by},{agentType:'chair',clearanceM:0});
  const reverse=planRoute(s,{x:bx,y:by},{x:ax,y:ay},{agentType:'chair',clearanceM:0});
  assert.equal(p.status,'clear');assert.equal(p.lengthM,reverse.lengthM);
  assert.equal(p.lengthM,Math.abs(ax-bx)+Math.abs(ay-by));
 }
});
test('test semantic boundary: route length and 2D clearance cannot assert real robot safety',()=>{
 const r=planRoute(empty(),{x:-2,y:0},{x:2,y:0});
 assert.match(r.qualifications,/no dynamics/);
 assert.equal(Object.hasOwn(r,'safeForRealRobot'),false);
});

// Reproducible property sampling; no unseeded Math.random, paid APIs or external fixtures.
test('200 seeded metamorphic routing cases never return unverified clear routes',()=>{
 let seed=0x51A7E;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 let clears=0,blocked=0;
 for(let i=0;i<200;i++){
  const count=1+Math.floor(next()*5);
  const source=fromPrompt(`9x7m with ${count} chairs and 1 tank`);
  const start={x:-3.6,y:Number((-1.5+next()*3).toFixed(3))};
  const goal={x:3.6,y:Number((-1.5+next()*3).toFixed(3))};
  const result=planRoute(source,start,goal,{agentType:'chair',clearanceM:0.05});
  if(result.status==='clear'){
   clears++;
   const check=verifyRoute(source,result.waypoints,{agentType:'chair',clearanceM:0.05});
   assert.equal(check.valid,true,`seed index ${i}`);
   assert.equal(check.lengthM,result.lengthM,`length index ${i}`);
   assert.ok(result.lengthM>=Math.abs(start.x-goal.x)+Math.abs(start.y-goal.y)-0.001);
  }else if(result.status==='blocked')blocked++;
  else assert.fail(`Unexpected unknown at seed index ${i}`);
 }
 assert.equal(clears+blocked,200);assert.ok(clears>=30);
});

test('route planner rejects invalid geometry and clearance, rather than normalizing to success',()=>{
 const s=empty();
 assert.throws(()=>planRoute(s,{x:NaN,y:0},{x:1,y:1}),/finite/);
 assert.throws(()=>planRoute(s,{x:1,y:0},{x:1,y:1},{agentType:'phantom'}),/Unknown component/);
 assert.throws(()=>planRoute(s,{x:1,y:0},{x:1,y:1},{clearanceM:-0.1}),/clearanceM/);
 assert.throws(()=>planRoute(s,{x:1,y:0},{x:1,y:1},{clearanceM:Infinity}),/clearanceM/);
});
