import test from 'node:test';
import assert from 'node:assert/strict';
import {newGait,advanceGait,sampleGait} from '../src/locomotion.mjs';
const p=(x,vx=120,grounded=true,facing=1)=>({x,vx,grounded,facing});
test('deterministic stride phase tied to displacement, not framerate',()=>{
  const a=newGait(),b=newGait();advanceGait(a,p(0));advanceGait(b,p(0));
  for(let i=1;i<=25;i++)advanceGait(a,p(i));
  for(let i=1;i<=5;i++)advanceGait(b,p(5*i));
  assert.ok(Math.abs(a.phase-b.phase)<1e-10);assert.equal(a.travelled,25);
});
test('planted stance compensates root travel in world coordinates',()=>{
 const g=newGait(); advanceGait(g,p(0)); const world=[];
 for(let x=1;x<=20;x++){const pose=advanceGait(g,p(x));world.push(x+pose.left.x);}
 assert.ok(Math.max(...world)-Math.min(...world)<1e-8,`foot drift ${Math.max(...world)-Math.min(...world)}`);
});
test('pause, idle and reduced motion have no animated feet',()=>{
 const g=newGait();advanceGait(g,p(0));advanceGait(g,p(10));const phase=g.phase;
 assert.equal(sampleGait(g,p(10,120),true).active,false);
 advanceGait(g,p(10,0));assert.equal(g.phase,phase);
 assert.equal(sampleGait(g,p(10,0)).bob,0);
});
test('falling does not invent grounded footsteps',()=>{
 const g=newGait();advanceGait(g,p(0));const a=advanceGait(g,p(9,80,false));
 assert.equal(a.active,false);assert.equal(a.left.y,-5);assert.equal(g.phase,0);
});
test('respawn, teleport and invalid input are handled safely',()=>{
 const g=newGait();advanceGait(g,p(0));advanceGait(g,p(20));
 const a=advanceGait(g,p(700),1);assert.equal(a.phase,0);assert.equal(g.travelled,0);
 assert.throws(()=>advanceGait(g,p(NaN)),/Invalid/);
 assert.throws(()=>advanceGait(g,p(701),-1),/Invalid/);
});
test('negative-facing foot poses mirror and stay bounded',()=>{
 const a=newGait(),b=newGait();advanceGait(a,p(0));advanceGait(b,p(0));
 let l=advanceGait(a,p(10,120,true,1));let r=advanceGait(b,p(10,-120,true,-1));
 assert.equal(l.left.x,-r.left.x);
 for(let i=0;i<100;i++){const q=sampleGait(a,p(10));for(const f of [q.left,q.right]) assert.ok(Math.abs(f.x)<=12&&f.y<=0&&f.y>=-9);}
});
