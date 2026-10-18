import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractHtml,extractBatch,LIMITS} from '../tools/rusteerio_extract.mjs';

test('UTF-8 page size cap runs before native parser',async()=>{
  let touched=false;
  const parser={load(){touched=true; throw Error('must not execute');}};
  await assert.rejects(
    ()=>extractHtml({html:'🚀'.repeat(Math.ceil(LIMITS.bytesPerPage/4)+1),sourceUrl:'https://example.org/'},{parser}),
    /2 MiB/
  );
  assert.equal(touched,false);
});
test('native batch output count mismatch fails closed',async()=>{
  const parser={async loadAll(){return [];}};
  await assert.rejects(
    ()=>extractBatch([{html:'hello',sourceUrl:'https://example.org/'}],{parser}),
    /different document count/
  );
});
test('real native parser filters dangerous/local links without executing scripts',async t=>{
  let parser;
  try {parser=await import('rusteerio');}
  catch(e) {if(e?.code==='ERR_MODULE_NOT_FOUND')return t.skip('optional reviewed native package not installed');throw e;}
  const suspicious=[
    'http://127.0.0.1/admin',
    'http://127.1/private',
    'http://10.42.3.2/',
    'http://172.17.0.1/',
    'https://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data',
    'http://[::1]/',
    'http://[::ffff:7f00:1]/',
    'https://localhost/secrets',
    'https://machine.internal/',
    'javascript:alert(1)',
    'data:text/html,secret',
    'https://user:pass@external.example/',
  ];
  const html='<html><body>'+suspicious.map(h=>'<a href="'+h+'">unsafe</a>').join('')+
   '<a href="/catalogue">relative</a><a href="https://example.net/info">public</a>'+
   '<script>globalThis.__pryntor_qa_executed=true</script></body></html>';
  delete globalThis.__pryntor_qa_executed;
  const result=await extractHtml({html,sourceUrl:'https://example.org/about'},{parser});
  assert.equal(globalThis.__pryntor_qa_executed,undefined);
  assert.deepEqual(result.links.map(x=>x.url),['https://example.org/catalogue','https://example.net/info']);
});
test('real native parser enforces bounded heading and link count',async t=>{
  let parser;
  try {parser=await import('rusteerio');}
  catch(e) {if(e?.code==='ERR_MODULE_NOT_FOUND')return t.skip('optional reviewed native package not installed');throw e;}
  const html='<h1>Research</h1>'+('<h2>Section</h2>').repeat(50)+('<a href="/p">link</a>').repeat(400);
  const result=await extractHtml({html,sourceUrl:'https://example.org/'},{parser});
  assert.equal(result.headings.length,LIMITS.headings);
  assert.equal(result.links.length,LIMITS.links);
});
