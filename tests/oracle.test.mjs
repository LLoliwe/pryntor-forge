/** Separate analytic test oracle for FORGE Research Engine.
 * This file deliberately does not import planner geometry/verification helpers.
 * It only shares published component dimensions and scene construction.
 * Agreement is empirical, not a formal proof of implementation correctness.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {components,fromPrompt} from '../src/core.mjs';
import {planRoute,synthesizeLayout} from '../src/research.mjs';
const rnd=()=>{let state=0xACCE551;return ()=>((state=(Math.imul(state,1103515245)+12345)>>>0)/2**32);};
const box=(body,margin=0)=>{
 const size=components[body.type].size;
 const w=body.rotation%180?size[1]:size[0],d=body.rotation%180?size[0]:size[1];
 return {xmin:body.x-w/2-margin,xmax:body.x+w/2+margin,ymin:body.y-d/2-margin,ymax:body.y+d/2+margin};
};
const outside=(p,r)=>p.x<r.xmin-1e-9||p.x>r.xmax+1e-9||p.y<r.ymin-1e-9||p.y>r.ymax+1e-9;
const touches=(a,b)=>a.xmin<=b.xmax&&a.xmax>=b.xmin&&a.ymin<=b.ymax&&a.ymax>=b.ymin;
function independentVerify(scene,path,opts={}){
 const {agentType='robot',clearanceM=0.15,rotation=0,ignoreId}=opts;
 const robot=components[agentType].size;
 const w=rotation%180?robot[1]:robot[0],d=rotation%180?robot[0]:robot[1];
 const safe=clearanceM+0.001;
 const room={xmin:-scene.room.width/2+w/2+safe,xmax:scene.room.width/2-w/2-safe,
   ymin:-scene.room.depth/2+d/2+safe,ymax:scene.room.depth/2-d/2-safe};
 const obstacles=scene.objects.filter(o=>o.id!==ignoreId).map(o=>{
  const r=box(o);
  return {xmin:r.xmin-w/2-safe,xmax:r.xmax+w/2+safe,ymin:r.ymin-d/2-safe,ymax:r.ymax+d/2+safe};
 });
 let distance=0;
 for(let i=0;i<path.length;i++){
  const p=path[i];
  assert.equal(outside(p,room),false,`waypoint ${i} outside interior`);
  for(const [j,r] of obstacles.entries())assert.equal(outside(p,r),true,`waypoint ${i} intersects obstacle ${j}`);
  if(i===0)continue;
  const prev=path[i-1];
  assert.ok(prev.x===p.x||prev.y===p.y,'route contains diagonal segment');
  // A separate analytic 1D interval-overlap oracle, without calling the planner checker.
  for(const [j,r] of obstacles.entries()){
   const crosses=prev.x===p.x?prev.x>=r.xmin&&prev.x<=r.xmax&&
     Math.max(prev.y,p.y)>=r.ymin&&Math.min(prev.y,p.y)<=r.ymax:
     prev.y>=r.ymin&&prev.y<=r.ymax&&Math.max(prev.x,p.x)>=r.xmin&&Math.min(prev.x,p.x)<=r.xmax;
   assert.equal(crosses,false,`route segment ${i} crosses obstacle ${j}`);
  }
  distance+=Math.abs(prev.x-p.x)+Math.abs(prev.y-p.y);
 }
 return Number(distance.toFixed(3));
}

test('independent analytic oracle checks 250 seeded output routes, including rotated obstacles',()=>{
 const next=rnd();let checked=0,blocked=0;
 for(let i=0;i<250;i++){
  const scene=fromPrompt(`9x7m with ${1+Math.floor(next()*5)} workbenches and ${1+Math.floor(next()*4)} chairs`);
  for(const o of scene.objects)if(o.type==='chair')o.rotation=90;
  const a={x:-3.5,y:Number((-2+next()*4).toFixed(3))};
  const b={x:3.5,y:Number((-2+next()*4).toFixed(3))};
  const opts={agentType:'chair',clearanceM:0.05};
  const r=planRoute(scene,a,b,opts);
  if(r.status==='blocked'){blocked++;continue;}
  assert.equal(r.status,'clear');checked++;
  assert.equal(independentVerify(scene,r.waypoints,opts),r.lengthM);
 }
 assert.ok(checked>=25,`only ${checked} routable cases`);
 assert.equal(checked+blocked,250);
});

test('independent geometry oracle checks every synthesized pair and clearance',()=>{
 const spec={room:{width:6,depth:5},clearanceM:0.2,stepM:0.5,objects:[
  {id:'a',type:'robot'},{id:'b',type:'workbench'},{id:'c',type:'tank'},
  {id:'d',type:'shelf'},{id:'e',type:'chair'}]};
 const result=synthesizeLayout(spec);assert.equal(result.status,'satisfiable');
 const bodies=result.scene.objects;
 for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
  const a=box(bodies[i],spec.clearanceM/2),b=box(bodies[j],spec.clearanceM/2);
  // Tangency is allowed by the finite-lattice placement model; overlap is not.
  const penetration=a.xmin<b.xmax-1e-9&&a.xmax>b.xmin+1e-9&&a.ymin<b.ymax-1e-9&&a.ymax>b.ymin+1e-9;
  assert.equal(penetration,false,`${bodies[i].id} and ${bodies[j].id} violate the claimed clearance`);
 }
});
