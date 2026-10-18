import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractHtml, extractBatch, LIMITS } from '../tools/rusteerio_extract.mjs';

function fakeDOM() {
  const collections = {
    title: [{text:' Test  page '}],
    'meta[name="description"]': [{attrs:{content:' Example   description '}}],
    'meta[property="og:title"]': [],
    'meta[property="og:description"]': [],
    'h1, h2, h3': [{name:'h1',text:' Header '},{name:'h2',text:' Section'}],
    'a[href]': [
      {attrs:{href:'/team'},text:' About   us '},
      {attrs:{href:'javascript:alert(1)'},text:'Bad'},
      {attrs:{href:'https://user:pass@evil.example/path'},text:'Bad 2'},
      {attrs:{href:'https://example.org/jobs'},text:'Jobs'},
    ],
  };
  function select(arg) {
    const nodes = typeof arg === 'string' ? (collections[arg] || []) : [arg];
    return {
      first() { const n = nodes[0]; return {text:()=>n?.text??'',attr:key=>n?.attrs?.[key]}; },
      text() { return nodes.map(n=>n.text).join(''); },
      attr(key) { return nodes[0]?.attrs?.[key]; },
      each(fn) { nodes.forEach((n,i)=>fn(i,n)); return this; },
    };
  }
  return select;
}
const parser = {load:()=>fakeDOM(), async loadAll(items,options) {assert.deepEqual(options,{threads:2});return items.map(fakeDOM);}};

test('structured fields preserve provenance and filter unsafe links',async()=>{
  const r=await extractHtml({html:'<h1>fixture</h1>',sourceUrl:'https://example.org/p'},{parser});
  assert.equal(r.source_url,'https://example.org/p');
  assert.equal(r.title,'Test page');
  assert.equal(r.description,'Example description');
  assert.deepEqual(r.headings,[{level:'h1',text:'Header'},{level:'h2',text:'Section'}]);
  assert.deepEqual(r.links,[{url:'https://example.org/team',text:'About us'},{url:'https://example.org/jobs',text:'Jobs'}]);
});

test('input validation precedes all parser execution',async()=>{
  let called=false;
  const never={load(){called=true;},async loadAll(){called=true;}};
  for(const invalid of [
    {html:'ok',sourceUrl:'http://example.org'},
    {html:'ok',sourceUrl:'https://user:pass@example.org'},
    {html:'ok',sourceUrl:'javascript:alert(1)'},
    {html:'x'.repeat(LIMITS.bytesPerPage+1),sourceUrl:'https://example.org/'},
  ]) await assert.rejects(()=>extractHtml(invalid,{parser:never}));
  await assert.rejects(()=>extractBatch([{html:'ok',sourceUrl:'https://example.org/'},{html:'bad',sourceUrl:'file:///secret'}],{parser:never}));
  await assert.rejects(()=>extractBatch(Array.from({length:17},()=>({html:'x',sourceUrl:'https://example.org'})),{parser:never}));
  assert.equal(called,false);
});

test('batch preserves ordering, with bounded native worker count',async()=>{
  const r=await extractBatch([{html:'one',sourceUrl:'https://a.example/'},{html:'two',sourceUrl:'https://b.example/'}],{parser});
  assert.deepEqual(r.map(x=>x.source_url),['https://a.example/','https://b.example/']);
});

test('changed upstream APIs fail closed',async()=>{
  await assert.rejects(()=>extractHtml({html:'x',sourceUrl:'https://example.org/'},{parser:{}}),/load is unavailable/);
  await assert.rejects(()=>extractBatch([{html:'x',sourceUrl:'https://example.org/'}],{parser:{}}),/loadAll is unavailable/);
});

test('real Rusteerio smoke when explicit native package is installed',async(t)=>{
  let real;
  try { real=await import('rusteerio'); }
  catch(error) {
    if(error?.code==='ERR_MODULE_NOT_FOUND') return t.skip('Rusteerio is not installed in this offline environment');
    throw error;
  }
  const html='<html><head><title>Sample</title><meta name="description" content="pilot"></head><body><h1>Research</h1><a href="/about">About</a></body></html>';
  const actual=await extractHtml({html,sourceUrl:'https://example.org/'},{parser:real});
  assert.equal(actual.title,'Sample');
  assert.equal(actual.description,'pilot');
  assert.equal(actual.headings[0]?.text,'Research');
  assert.equal(actual.links[0]?.url,'https://example.org/about');
  const batch=await extractBatch([{html,sourceUrl:'https://example.org/'}],{parser:real});
  assert.deepEqual(batch[0],actual);
});
