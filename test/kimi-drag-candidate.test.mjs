import test from 'node:test';
import assert from 'node:assert/strict';
// Independently frozen contract tests. Select baseline with DRAG_TEST_MODULE.
// Factory has down/move/up/cancel(event), blur(), snapshot(); events use pointerId/clientX.
const modulePath = process.env.DRAG_TEST_MODULE || '../src/kimi-drag-candidate.mjs';
const { createDragState } = await import(new URL(modulePath, import.meta.url));
const event = (pointerId, clientX) => ({ pointerId, clientX });
const checkActive = (s, pointerId, x) => {
 const snapshot = s.snapshot();
 assert.equal(snapshot.active, true); assert.equal(snapshot.id, pointerId); assert.equal(snapshot.x, x);
};
test('drag contract: starts inactive; matching down and move update position', () => {
 const s=createDragState(); assert.equal(s.snapshot().active,false);
 s.down(event(7,10));checkActive(s,7,10);s.move(event(7,25));checkActive(s,7,25);
});
test('drag contract: second pointer down cannot replace active owner',()=>{
 const s=createDragState();s.down(event(7,10));const before=s.snapshot();s.down(event(8,99));assert.deepEqual(s.snapshot(),before);
});
test('drag contract: repeated down from same pointer cannot restart current drag',()=>{
 const s=createDragState();s.down(event(7,10));const before=s.snapshot();s.down(event(7,99));assert.deepEqual(s.snapshot(),before);
});
test('drag contract: wrong-pointer move cannot change current position',()=>{
 const s=createDragState();s.down(event(7,10));const before=s.snapshot();s.move(event(8,99));assert.deepEqual(s.snapshot(),before);
});
test('drag contract: wrong-pointer up cannot stop active drag',()=>{
 const s=createDragState();s.down(event(7,10));const before=s.snapshot();s.up(event(8,99));assert.deepEqual(s.snapshot(),before);
});
test('drag contract: wrong-pointer cancel cannot stop active drag',()=>{
 const s=createDragState();s.down(event(7,10));const before=s.snapshot();s.cancel(event(8,99));assert.deepEqual(s.snapshot(),before);
});
test('drag contract: matching up stops drag and stale move is ignored',()=>{
 const s=createDragState();s.down(event(7,10));s.up(event(7,10));assert.equal(s.snapshot().active,false);
 const before=s.snapshot();s.move(event(7,99));assert.deepEqual(s.snapshot(),before);
});
test('drag contract: matching cancel stops drag; restart accepts new owner',()=>{
 const s=createDragState();s.down(event(7,10));s.cancel(event(7,10));assert.equal(s.snapshot().active,false);
 const before=s.snapshot();s.move(event(7,99));assert.deepEqual(s.snapshot(),before);
 s.down(event(8,20));checkActive(s,8,20);s.move(event(8,30));checkActive(s,8,30);
});
test('drag contract: blur stops drag; stale events ignored; restart works',()=>{
 const s=createDragState();s.down(event(7,10));s.blur();assert.equal(s.snapshot().active,false);
 const before=s.snapshot();s.move(event(7,99));assert.deepEqual(s.snapshot(),before);
 s.down(event(8,20));checkActive(s,8,20);s.up(event(7,50));checkActive(s,8,20);
});
for (const value of [NaN, Infinity, -Infinity, undefined, '10', null]) {
 const label = String(value);
 test(`drag contract: down rejects nonfinite/nonnumeric clientX ${label}`,()=>{
  const s=createDragState();const before=s.snapshot();s.down(event(7,value));assert.deepEqual(s.snapshot(),before);
 });
 test(`drag contract: move rejects nonfinite/nonnumeric clientX ${label} without corrupting active drag`,()=>{
  const s=createDragState();s.down(event(7,10));const before=s.snapshot();s.move(event(7,value));assert.deepEqual(s.snapshot(),before);s.move(event(7,20));checkActive(s,7,20);
 });
}
test('drag contract: zero and negative finite coordinates remain valid',()=>{
 const s=createDragState();s.down(event(0,0));checkActive(s,0,0);s.move(event(0,-25));checkActive(s,0,-25);
});
test('drag contract: factory instances keep independent state',()=>{
 const a=createDragState(),b=createDragState();a.down(event(1,10));b.down(event(2,20));a.blur();checkActive(b,2,20);assert.equal(a.snapshot().active,false);
});
