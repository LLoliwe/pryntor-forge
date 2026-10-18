import test from 'node:test';
import assert from 'node:assert/strict';
import {seededWorld,validateWorld,newGame,step,placeObject,MAX_OBJECTS} from '../src/worldweaver.mjs';
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
 assert.notEqual(a.id,b.id);assert.equal(g.world.objects.length,16);assert.deepEqual(validateWorld(g.world),g.world);
 assert.throws(()=>placeObject(g,'teleport',0,0),/Unsupported/);
});
test('portal is actual completion state',()=>{
 const g=newGame();g.player.x=2370;g.player.y=380;step(g,{},1/60);
 assert.equal(g.completed,true);const score=g.score;step(g,{right:true},1/60);assert.equal(g.score,score);
});