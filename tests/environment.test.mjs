import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createServer} from '../src/server.mjs';
import {getGameEnvironment, selectOceanRenderer, probeGraphics, GAME_ENVIRONMENT_PRESETS} from '../src/game/environment.mjs';

test('each franchise receives a distinct art direction and independent rules',()=>{
  for(const id of ['zowibo','lvl7','moon-taxi','route-zero','relicbound']){
    const p=getGameEnvironment(id);
    assert.ok(p.aesthetic && p.water && p.rules.length>=2);
  }
  const z=getGameEnvironment('zowibo');z.rules.push('mutation');
  assert.equal(GAME_ENVIRONMENT_PRESETS.zowibo.rules.includes('mutation'),false);
  assert.notEqual(getGameEnvironment('zowibo').aesthetic,getGameEnvironment('lvl7').aesthetic);
});
test('unknown game IDs fail closed',()=>assert.throws(()=>getGameEnvironment('__proto__'),/Unsupported/));
test('WebGPU FFT requires declared working adapter and ordinary motion setting',()=>{
  assert.deepEqual(selectOceanRenderer({webgpu:true,webgl2:true,canvas2d:true}).kind,'webgpu-fft');
  assert.equal(selectOceanRenderer({webgpu:true,webgl2:true,canvas2d:true},{batterySaver:true}).ready,false);
  assert.equal(selectOceanRenderer({webgpu:true,webgl2:true,canvas2d:true},{reducedMotion:true}).kind,'still');
});
test('fallbacks cannot be confused with implemented GPU water',()=>{
  assert.deepEqual(selectOceanRenderer({webgpu:false,webgl2:true,canvas2d:true}).kind,'webgl2-pending');
  assert.equal(selectOceanRenderer({webgpu:false,webgl2:true,canvas2d:true}).ready,false);
  assert.equal(selectOceanRenderer({webgpu:false,webgl2:false,canvas2d:true}).ready,false);
  assert.equal(selectOceanRenderer({webgpu:false,webgl2:false,canvas2d:false}).kind,'unsupported');
  assert.throws(()=>selectOceanRenderer({webgpu:true}),/Capability/);
});
test('probe does not infer WebGPU from navigator.gpu without a working adapter',async()=>{
  const nav={gpu:{requestAdapter:async()=>null}};
  const doc={createElement:()=>({getContext:type=>type==='webgl2'?{}:null})};
  assert.deepEqual(await probeGraphics(nav,doc),{webgpu:false,webgl2:true,canvas2d:true});
  assert.equal((await probeGraphics({gpu:{requestAdapter:async()=>{throw Error('adapter denied')}}},{})).webgpu,false);
});
test('isolated ocean demo has licence notice, restrictive CSP and does not alter FORGE root',async()=>{
  const server=createServer();
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  try{
    const lab=await fetch(base+'/labs/ocean-webgpu.html');
    assert.equal(lab.status,200);
    const html=await lab.text();
    assert.match(html,/Copyright \(c\) 2026 Maksymilian Dendura/);
    assert.match(html,/WebGPU/);
    assert.match(lab.headers.get('content-security-policy'),/script-src 'sha256-/);
    assert.doesNotMatch(lab.headers.get('content-security-policy'),/unsafe-inline/);
    const root=await fetch(base+'/');
    assert.equal(root.status,200);
    assert.match(await root.text(),/FORGE/i);
    assert.match(root.headers.get('content-security-policy'),/script-src 'self'/);
    const missing=await fetch(base+'/private');assert.equal(missing.status,404);
  } finally { await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve())); }
});
