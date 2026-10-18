import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { replayEvaluation } from '../src/kimi-offline-runner.mjs';
import { evidenceRef } from '../src/kimi-pilot-gate.mjs';
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/kimi/portfolio-v1.json', import.meta.url)));
const envelope = (rows=fixtures) => ({kind:'fixture', modelVersion:'independent-oracle-NOT-MODEL', sourceRevision:'89e2780b8996ea65cd26534bab577520fbafa17b', fixtureHash:evidenceRef(JSON.stringify(rows)), records:rows.map(f=>({caseId:f.caseId,decision:f.expectedDecision,citations:['https://example.org/source'],toolCalls:[],actualChargeUsd:0,latencyMs:0}))});
test('independent runner: all 40 policy fixtures remain explicitly synthetic',()=>{
 assert.equal(fixtures.length,40);assert.equal(new Set(fixtures.map(f=>f.caseId)).size,40);
 assert.equal(fixtures.every(f=>f.synthetic===true && typeof f.prompt==='string'),true);
 const result = replayEvaluation(fixtures,envelope());
 assert.equal(result.score.passed,40); assert.equal(result.liveModelResultsVerified,false);assert.equal(result.independentApproval,false);
});
test('independent runner: sparse fixture with matching recalculated hash rejected',()=>{
 const rows=structuredClone(fixtures); delete rows[11]; const e=envelope();e.fixtureHash=evidenceRef(JSON.stringify(rows));
 assert.throws(()=>replayEvaluation(rows,e),/Missing/);
});
test('independent runner: sparse response rejected',()=>{const e=envelope(); delete e.records[11];assert.throws(()=>replayEvaluation(fixtures,e),/Missing/);});
test('independent runner: swap two response positions rejected',()=>{const e=envelope();[e.records[1],e.records[2]]=[e.records[2],e.records[1]];assert.throws(()=>replayEvaluation(fixtures,e),/reordered/);});
test('independent runner: mutation without frozen hash update rejected',()=>{const rows=structuredClone(fixtures);rows[0].prompt+=' changed';assert.throws(()=>replayEvaluation(rows,envelope()),/hash mismatch/);});
test('independent runner: recomputed output hash changes on metadata mutation',()=>{const e=envelope();const before=replayEvaluation(fixtures,e);e.records[0].latencyMs=1;const after=replayEvaluation(fixtures,e);assert.notEqual(after.outputHash,before.outputHash);});
test('independent runner: recorded-provider label cannot imply verified authenticity',()=>{const e=envelope();e.kind='recorded-provider';const r=replayEvaluation(fixtures,e);assert.equal(r.liveModelResultsVerified,false);assert.equal(r.independentApproval,false);});
test('independent runner: duplicate IDs in fixtures and records block review',()=>{const rows=structuredClone(fixtures);rows[1].caseId=rows[0].caseId;assert.equal(replayEvaluation(rows,envelope(rows)).score.readyForIndependentReview,false);});
test('independent runner: one forbidden tool, charge or invalid latency blocks review',()=>{for(const changes of [{toolCalls:['write:payment']},{actualChargeUsd:0.01},{latencyMs:-1}]){const e=envelope();Object.assign(e.records[0],changes);assert.equal(replayEvaluation(fixtures,e).score.readyForIndependentReview,false);}});
