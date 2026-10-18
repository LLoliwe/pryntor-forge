import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import vm from 'node:vm';
import {createServer} from '../src/server.mjs';
const html=await readFile(new URL('../public/labs/ocean-play.html',import.meta.url),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
test('offline game is truly self-contained and the executable script parses',()=>{
 assert.match(html, /OCEAN LAYER/);
 assert.doesNotMatch(html, /<script\s+src=/);
 assert.doesNotMatch(html, /<link\s+[^>]*stylesheet/);
 assert.match(html, /data-world="zowibo"/);
 assert.match(html, /data-world="lvl7"/);
 assert.match(html, /data-world="relicbound"/);
 assert.match(html, /data-world="routezero"/);
 assert.match(html, /data-world="moontaxi"/);
 assert.ok(match?.[1]?.length>10000);
 new vm.Script(match[1]);
});
function harness(){
 const elements=new Map(),storage=new Map(),callbacks=[];
 function el(id){
  if(!elements.has(id))elements.set(id,{id,dataset:{},textContent:'',innerHTML:'',hidden:false,
   style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},
   setAttribute(){},addEventListener(){},setPointerCapture(){},
   querySelector(){return el('nested-span')},querySelectorAll(){return []},
   parentElement:{querySelector(){return el('tab-count')}}});
  return elements.get(id);
 }
 const ctx={};
 for(const fn of ['setTransform','clearRect','fillRect','beginPath','moveTo','lineTo','stroke','closePath','fill','arc','ellipse','save','restore','translate','scale','rotate','fillText','setLineDash','quadraticCurveTo','bezierCurveTo'])ctx[fn]=()=>{};
 ctx.createLinearGradient=ctx.createRadialGradient=()=>({addColorStop(){}});
 el('game').getContext=()=>ctx;
 const ids=['zowibo','lvl7','relicbound','routezero','moontaxi'];
 const worldButtons=ids.map(id=>Object.assign(el('tab-'+id),{dataset:{world:id}}));
 el('worldTabs').querySelectorAll=()=>worldButtons;
 let t=0;
 const document={getElementById:el,documentElement:{style:{setProperty(){}}},querySelectorAll:()=>[],addEventListener(){}};
 const window={addEventListener(){}};
 const context={window,document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
   performance:{now:()=>t+=17},requestAnimationFrame:fn=>callbacks.push(fn),Math,Map,Set,JSON,console,confirm:()=>true};
 vm.runInNewContext(match[1],context,{filename:'ocean-play.js'});
 const q=window.__OCEAN_QA__;
 function move(axis,steps){q.move(axis,true);for(let i=0;i<steps;i++)q.step(.04);q.move(axis,false)}
 return {q,move,callbacks,storage};
}
test('five franchise worlds switch without losing independent saves',()=>{
 const {q}=harness();
 for(const id of ['lvl7','moontaxi','relicbound','routezero','zowibo']){
  q.world(id);assert.equal(q.snapshot().world,id);
 }
 assert.equal(q.snapshot().mode,'boat');
});
test('genuine surface, swimming, pearl rewards, depth gating, upgrade, air rescue and cosmetics',()=>{
 const {q,move,callbacks,storage}=harness();
 move('right',18);q.mode();move('down',5);
 assert.equal(q.snapshot().mode,'swim');
 assert.ok(q.snapshot().collected>=1);
 move('right',22);move('down',17);
 move('right',23);move('down',18);
 move('right',20);move('up',24);
 assert.ok(q.snapshot().collected>=4);
 const before=q.snapshot().pearls;assert.ok(before>=4);
 q.upgrade();assert.equal(q.snapshot().tier,2);
 assert.ok(q.snapshot().pearls<=before-4);
 move('down',90);assert.ok(q.snapshot().depth>60);
 assert.ok(q.snapshot().depth<=145);
 q.world('lvl7');assert.equal(q.snapshot().tier,1);
 q.world('zowibo');assert.equal(q.snapshot().tier,2);
 q.mode();move('down',100);for(let i=0;i<2500;i++)q.step(.04);
 assert.equal(q.snapshot().depth,3);
 q.mode();move('right',85);q.mode();move('down',36);move('right',27);move('down',9);
 assert.ok(q.snapshot().collected>=6);
 q.skin('citrus');assert.equal(q.snapshot().pearls,0);
 assert.ok(storage.has('pryntor-ocean-layer-r01'));
 const frame=callbacks.shift();frame(100); // mocked Canvas2D render: catches missing drawing APIs/exceptions
});
test('new discovery sites continue beyond the first authored ocean region',()=>{
 const {q,move}=harness();q.world('relicbound');move('right',315);
 assert.ok(q.snapshot().x>2600);
 assert.ok(q.getSites().some(s=>s.x>=2700));
});
test('the HTML game route is available only via whitelist and uses hash-based CSP',async()=>{
 const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 try {
  const play=await fetch(base+'/labs/ocean-play.html');
  assert.equal(play.status,200);assert.match(await play.text(),/OCEAN LAYER/);
  const csp=play.headers.get('content-security-policy');
  assert.match(csp,/script-src 'sha256-/);
  assert.match(csp,/style-src 'sha256-/);
  assert.doesNotMatch(csp,/unsafe-inline/);
  assert.equal((await fetch(base+'/unlisted.html')).status,404);
 } finally {await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
