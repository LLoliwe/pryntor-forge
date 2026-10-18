import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {once} from 'node:events';
import {createServer} from '../src/server.mjs';
const page=await readFile(new URL('../public/labs/ocean-first-descent.html',import.meta.url),'utf8');
test('real upstream FFT renderer and MIT attribution preserved',()=>{
 assert.match(page,/WebGPU/);
 assert.match(page,/Copyright \(c\) 2026 Maksymilian Dendura/);
 assert.match(page,/THE FIRST DESCENT/);
 assert.match(page,/fft|FFT/i);
});
test('interactive three-state navigation and five existing IP themes wired',()=>{
 for(const w of ['relicbound','zowibo','lvl7','routezero','moontaxi']) assert.match(page,new RegExp('value="'+w+'"'));
 for(const id of ['p-enter','p-down','p-up','p-collect','p-forward']) assert.match(page,new RegExp('id="'+id+'"'));
 const scripts=[...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,2);
 for(const [,code] of scripts) new vm.Script(code);
});
test('server isolates playable WebGPU surface under a hash-only CSP',async()=>{
 const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const url='http://127.0.0.1:'+server.address().port+'/labs/ocean-first-descent.html';
 try{const r=await fetch(url);assert.equal(r.status,200);assert.match(await r.text(),/FIRST DESCENT/);const csp=r.headers.get('content-security-policy');assert.match(csp,/script-src 'sha256-/);assert.doesNotMatch(csp,/unsafe-inline/);}finally{await new Promise((done,reject)=>server.close(e=>e?reject(e):done()));}
});
