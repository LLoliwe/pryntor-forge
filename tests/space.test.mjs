import test from 'node:test';
import assert from 'node:assert/strict';
import {fromPrompt,validateScene,auditScene,addObject,moveObject,rotateObject,footprint,templates,pascalHandoff} from '../src/core.mjs';
const withObjects=(scene,objects)=>({...scene,objects});
test('every venture template generates a non-overlapping, in-room scene deterministically',()=>{
 for(const template of Object.values(templates)){
   const a=fromPrompt(template.prompt),b=fromPrompt(template.prompt);
   assert.deepEqual(a,b,template.name);assert.equal(auditScene(a).status,'clear',template.name);
 }
});
test('v0.1 source scenes remain accepted for backwards compatibility',()=>{
 const scene=fromPrompt('7x5m with 1 robot');scene.schemaVersion='0.1';
 assert.equal(validateScene(scene).schemaVersion,'0.1');
});
test('overlapping positions are denied with evidence',()=>{
 const scene=fromPrompt('7x5m with 2 robots');scene.objects[1].x=scene.objects[0].x;scene.objects[1].y=scene.objects[0].y;
 assert.deepEqual(auditScene(scene).overlaps,[[scene.objects[0].id,scene.objects[1].id]]);
 assert.throws(()=>validateScene(scene),/overlap/);
});
test('rotation changes footprint and checks room edges',()=>{
 const o={type:'workbench',rotation:90};assert.deepEqual(footprint(o),{width:0.75,depth:1.7});
 const scene=fromPrompt('7x5m with 1 workbench');const r=rotateObject(scene,scene.objects[0].id);
 assert.equal(r.objects[0].rotation,90);assert.equal(auditScene(r).status,'clear');
});
test('manual moves that intersect or leave room are rejected',()=>{
 const scene=fromPrompt('7x5m with 2 robots');const [a,b]=scene.objects;
 assert.throws(()=>moveObject(scene,b.id,a.x,a.y),/overlap/);
 assert.throws(()=>moveObject(scene,b.id,999,999),/outside/);
 assert.equal(auditScene(moveObject(scene,b.id,b.x,b.y)).status,'clear');
});
test('adding a component never silently places it on another component',()=>{
 let scene=fromPrompt('7x5m with 1 workbench');for(let i=0;i<6;i++)scene=addObject(scene,'chair');
 assert.equal(scene.objects.length,7);assert.equal(auditScene(scene).overlaps.length,0);
});
test('no room capacity fails explicitly, rather than outputting overlapping placement',()=>{
 assert.throws(()=>fromPrompt('2x2m with 16 workbenches'),/No non-overlapping location/);
});
test('unsupported rotation and non-finite positions rejected',()=>{
 const scene=fromPrompt('7x5m with 1 chair');scene.objects[0].rotation=47;
 assert.throws(()=>validateScene(scene),/Rotation/);
 scene.objects[0].rotation=0;scene.objects[0].x=NaN;
 assert.throws(()=>validateScene(scene),/finite/);
});
test('handoff includes transparent limited preflight, no fake automatic bridge',()=>{
 const h=pascalHandoff(fromPrompt(templates.robotics.prompt));
 assert.equal(h.preflight.status,'clear');assert.match(h.preflight.limitations,/Does not check robot paths/);
 assert.match(h.instructions,/NOT an automatic import/);
});
