import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectRelease} from '../tools/release_evidence_gate.mjs';
const head='a'.repeat(40), time='2026-10-18T20:00:00Z', now=Date.parse(time);
const policy={expectedHead:head,requiredChecks:['unit'],requiredGates:['device','rights','rollback'],allowedReviewers:['reviewer','other'],maxAgeHours:24};
function fixture(){return {head,author:'author',collectedAt:time,checks:[{name:'unit',head,status:'passed',passed:10,failed:0,skipped:0,url:'https://example.com/run',completedAt:time}],gates:policy.requiredGates.map(name=>({name,head,status:'passed',url:'https://example.com/proof',completedAt:time})),reviews:[{reviewer:'reviewer',head,state:'APPROVED',url:'https://example.com/review',submittedAt:time}]};}
test('complete synthetic evidence is consistent, never release authorization',()=>assert.deepEqual(inspectRelease(fixture(),policy,now),{status:'CONSISTENT_NOT_AUTHORIZED',errors:[]}));
const mutations={
 'wrong head':e=>e.head='b'.repeat(40),
 'old check':e=>e.checks[0].head='b'.repeat(40),
 'skipped test':e=>e.checks[0].skipped=1,
 'zero tests':e=>e.checks[0].passed=0,
 'failed test':e=>e.checks[0].failed=1,
 'string count':e=>e.checks[0].passed='10',
 'duplicate check':e=>e.checks.push({...e.checks[0]}),
 'missing check':e=>e.checks=[],
 'sparse checks':e=>e.checks=Array(1),
 'null check':e=>e.checks=[null],
 'missing device proof':e=>e.gates.shift(),
 'unsafe evidence URL':e=>e.gates[0].url='javascript:alert(1)',
 'stale run':e=>e.checks[0].completedAt='2026-10-16T00:00:00Z',
 'future collection':e=>e.collectedAt='2026-10-19T00:00:00Z',
 'self approval case insensitive':e=>e.author='REVIEWER',
 'unknown reviewer':e=>e.reviews[0].reviewer='stranger',
 'old head approval':e=>e.reviews[0].head='b'.repeat(40),
 'dismissed approval':e=>e.reviews[0].state='DISMISSED',
 'missing review':e=>e.reviews=[],
 'sparse review':e=>e.reviews=Array(1),
 'later changes requested':e=>e.reviews.push({...e.reviews[0],state:'CHANGES_REQUESTED'}),
 'second reviewer veto':e=>e.reviews.push({...e.reviews[0],reviewer:'other',state:'CHANGES_REQUESTED'}),
};
for(const [name,change] of Object.entries(mutations))test('blocks '+name,()=>{const e=fixture();change(e);assert.equal(inspectRelease(e,policy,now).status,'BLOCKED');});
for(const bad of [null,{}, {...policy,requiredChecks:[]},{...policy,requiredGates:[]},{...policy,allowedReviewers:[]},{...policy,maxAgeHours:Infinity}])test('invalid trusted policy fails closed '+JSON.stringify(bad),()=>assert.equal(inspectRelease(fixture(),bad,now).status,'BLOCKED'));
