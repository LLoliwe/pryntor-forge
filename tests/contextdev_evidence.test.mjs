import test from 'node:test';
import assert from 'node:assert/strict';
import {safeSourceUrl,planSearch,normalizeEvidence,searchPublicEvidence} from '../tools/contextdev_evidence.mjs';
const payload = (rest={}) => ({results:[
  {url:'https://example.org/study',title:'Public source',description:'Source statement',relevance:'high'},
  {url:'https://example.org/study',title:'Duplicate'},
  {url:'https://127.0.0.1/secrets',title:'Local'},
  {url:'https://example.com/help',title:'Docs',relevance:'low'}
],key_metadata:{credits_consumed:1,credits_remaining:999},request_id:'test-id',...rest});

test('disabled by default, makes zero requests',async()=>{
  let count=0;
  await assert.rejects(searchPublicEvidence({query:'public engineering standards',apiKey:'fake',transport:()=>{count++;}}),/disabled/);
  assert.equal(count,0);
});
test('missing key blocks before request',async()=>{
  await assert.rejects(searchPublicEvidence({query:'open research',enabled:true,apiKey:'',transport:()=>{throw Error('called');}}),/key missing/);
});
test('search query and count bounded',()=>{
  assert.throws(()=>planSearch(''),/Invalid/);
  assert.throws(()=>planSearch('a\nb'),/Invalid/);
  assert.throws(()=>planSearch('a'.repeat(241)),/Invalid/);
  assert.throws(()=>planSearch('source',11),/1 to 10/);
  assert.deepEqual(planSearch(' source '),{query:'source',numResults:5,estimatedCredits:1});
});
test('rejects unsafe result links',()=>{
  for(const url of ['http://example.org','file:///tmp/x','https://localhost/',
    'https://[::1]/','https://172.16.1.1','https://a:b@example.org','https://host.internal/a'])
    assert.equal(safeSourceUrl(url),null,url);
});
test('deduplicates and preserves source identity, timestamp and unverified status',()=>{
  const rec=normalizeEvidence(payload(),'test query','2026-10-25T12:00:00Z');
  assert.equal(rec.records.length,2);
  assert.equal(rec.records[0].source_url,'https://example.org/study');
  assert.equal(rec.records[0].evidence_status,'UNVERIFIED_WEB_SNIPPET');
  assert.equal(rec.records[0].observed_at,'2026-10-25T12:00:00Z');
  assert.equal(rec.credits_consumed,1);
});
test('fails closed on missing and unexpected billing metadata',()=>{
  assert.throws(()=>normalizeEvidence({results:[]},'q','time'),/metadata/);
  assert.throws(()=>normalizeEvidence(payload({key_metadata:{credits_consumed:2,credits_remaining:1}}),'q','time'),/Unexpected/);
  assert.throws(()=>normalizeEvidence(payload({key_metadata:{credits_consumed:-1,credits_remaining:1}}),'q','time'),/metadata/);
  assert.throws(()=>normalizeEvidence({results:null,key_metadata:{credits_consumed:1,credits_remaining:1}},'q','time'),/Invalid/);
});
test('verified stub sends exactly one bounded request',async()=>{
  let count=0;
  const got=await searchPublicEvidence({query:' South African education ',count:3,enabled:true,apiKey:'fixture',
    observedAt:'2026-10-25T12:00:00Z',transport:async(url,opts)=>{
      count++;
      assert.equal(url,'https://api.context.dev/v1/web/search');
      assert.deepEqual(JSON.parse(opts.body),{query:'South African education',numResults:3});
      assert.equal(opts.headers.Authorization,'Bearer fixture');
      return {ok:true,status:200,json:async()=>payload()};
    }});
  assert.equal(count,1);
  assert.equal(got.provider_request_id,'test-id');
  assert.equal(got.records.length,2);
});
test('does not print secrets or provider body on failure',async()=>{
  const secret='topsecret';
  await assert.rejects(searchPublicEvidence({query:'public release',enabled:true,apiKey:secret,
    transport:async()=>({ok:false,status:429,json:async()=>({message:secret})})}),
    e=>e.message.includes('429')&&!e.message.includes(secret));
});
test('empty results produce zero accepted facts',()=>{
  const out=normalizeEvidence(payload({results:[]}), 'q','time');
  assert.deepEqual(out.records,[]);
  assert.equal(out.status,'COLLECTED_NOT_FACT_CHECKED');
});
