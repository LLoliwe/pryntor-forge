import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {once} from 'node:events';
import {createServer} from '../src/server.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const filename=path.resolve(here,'../public/demos/ocean-forge.html');

test('ocean pilot is real standalone source with working controls and no external scripts',async()=>{
  const html=await readFile(filename,'utf8');
  for(const anchor of ['id="play"','id="dive"','id="ascend"','id="boost"',
                        'id="touchpad"','id="oxygen"','id="score"',
                        'getContext(\'webgl2\'','getState:','drawHunter()',
                        'drawGeometry()','requestAnimationFrame(frame)']) {
    assert.ok(html.includes(anchor), 'missing '+anchor);
  }
  assert.match(html,/function move\(dt\)/);
  assert.match(html,/crystals\.forEach\(drawCrystal\)/);
  assert.match(html,/const csp|FORGE_OCEAN|no.*external network/i);
  assert.doesNotMatch(html,/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/);
  assert.doesNotMatch(html,/<script[^>]*\bsrc=/i);
  assert.doesNotMatch(html,/@import\s+url\(/i);
  assert.doesNotMatch(html,/https?:\/\/fonts\./i);
});

test('ocean scene is whitelisted and isolated from existing app CSP',async()=>{
  const server=createServer();
  try{
    server.listen(0,'127.0.0.1');
    await once(server,'listening');
    const base='http://127.0.0.1:'+server.address().port;
    const ocean=await fetch(base+'/demos/ocean-forge.html');
    assert.equal(ocean.status,200);
    assert.match(ocean.headers.get('content-type'),/text\/html/);
    const csp=ocean.headers.get('content-security-policy');
    assert.match(csp,/default-src 'none'/);
    assert.match(csp,/connect-src 'none'/);
    assert.match(csp,/frame-ancestors 'none'/);
    assert.match(await ocean.text(),/THE.*BLUE|THE<br><em>BLUE/);
    const normal=await fetch(base+'/');
    assert.equal(normal.status,200);
    assert.match(normal.headers.get('content-security-policy'),/script-src 'self'/);
    const unknown=await fetch(base+'/private/source.env');
    assert.equal(unknown.status,404);
  }finally{
    server.close();
  }
});
