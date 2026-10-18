import test from 'node:test';
import assert from 'node:assert/strict';
import {fromPrompt, validateScene, cadScriptFor, pascalHandoff, addObject, removeObject} from '../src/core.mjs';
test('parser creates deterministic room and correctly pluralized items',()=>{
 const a=fromPrompt('7x5m makerspace with 2 workbenches, 1 robot, 2 shelves and 1 table');
 assert.equal(a.room.width,7);assert.equal(a.room.depth,5);assert.equal(a.objects.length,6);
 assert.deepEqual(a,fromPrompt('7x5m makerspace with 2 workbenches, 1 robot, 2 shelves and 1 table'));
});
test('unknown components fail closed',()=>assert.throws(()=>validateScene({...fromPrompt('7x5m'), objects:[{id:'a',type:'__proto__',x:0,y:0,rotation:0}]}),/Unknown component/));
test('objects outside the room fail closed',()=>assert.throws(()=>validateScene({...fromPrompt('5x5m'),objects:[{id:'a',type:'robot',x:99,y:0,rotation:0}]}),/outside/));
test('room bounds rejected',()=>assert.throws(()=>fromPrompt('999x2m with a robot'),/dimensions/));
test('malformed prompt and oversized quantity rejected',()=>{assert.throws(()=>fromPrompt(null),/Prompt/);assert.throws(()=>fromPrompt('6x6 with 99 robots'),/Maximum/);});
test('CAD export clearly labels simplified envelope',()=>{let s=cadScriptFor('robot');assert.match(s,/Not a fabrication-ready design/);assert.match(s,/bd.Box\(700, 650, 1350\)/);assert.match(s,/@step\(out=/);});
test('handoff preserves scene and makes no false Pascal import claim',()=>{const a=fromPrompt('6x6 with 1 robot');const h=pascalHandoff(a);assert.deepEqual(h.sourceScene,a);assert.match(h.instructions,/NOT an automatic import/);});
test('add and remove preserve scene validation',()=>{let a=fromPrompt('7x5 with a robot');a=addObject(a,'chair');assert.equal(a.objects.length,2);a=removeObject(a,a.objects[0].id);assert.equal(a.objects.length,1);});
