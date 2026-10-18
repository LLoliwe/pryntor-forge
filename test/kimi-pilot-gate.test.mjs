import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAccessGate, evaluateStructuredCases as scoreCases, evidenceRef } from '../src/kimi-pilot-gate.mjs';

const bytes = 'synthetic-fixture-001';
const ref = evidenceRef(bytes);
const registry = new Map([[ref, bytes]]);
const evaluateStructuredCases = (cases) => scoreCases(cases, registry);

const green = {
  founderApprovedPilot: true, writtenNoChargeGrant: true,
  nonBillableHardStop: true, noCardOrTopupRequired: true,
  noAutomaticPaidConversion: true, southAfricaEligible: true,
  commercialAndModelTermsReviewed: true,
  retentionTrainingAndResidencyReviewed: true,
  approvedSandboxCredentials: true, syntheticDataOnly: true,
  independentReviewerAssigned: true
};
const candidate = (changes = {}) => ({
  caseId: 'case-01', expectedDecision: 'approve', synthetic: true,
  result: {
    decision: 'approve', citations: ['https://example.org/official'],
    toolCalls: ['read:public-spec'], actualChargeUsd: 0,
    latencyMs: 1200, evidenceId: ref, ...changes
  }
});

test('fails closed with missing evidence', () => {
  const gate = evaluateAccessGate({});
  assert.equal(gate.ready, false);
  assert.equal(gate.missing.length, 11);
});
test('refuses malformed evidence', () => {
  assert.equal(evaluateAccessGate(null).ready, false);
  assert.equal(evaluateAccessGate([]).ready, false);
});
test('complete explicitly verified permissions only permit review', () => {
  assert.equal(evaluateAccessGate(green).ready, true);
  assert.match(evaluateAccessGate(green).reason, /review/);
});
for (const key of Object.keys(green)) {
  test(`fails closed when ${key} not proven`, () => {
    assert.deepEqual(evaluateAccessGate({ ...green, [key]: false }).missing, [key]);
  });
}
test('rejects empty benchmark', () => {
  assert.throws(() => evaluateStructuredCases([]), /at least one/);
});
test('passes exactly grounded, read-only, zero-charge synthetic evidence', () => {
  const score = evaluateStructuredCases([candidate()]);
  assert.equal(score.passed, 1);
  assert.equal(score.readyForIndependentReview, true);
});
test('fails false approval even where other fields look plausible', () => {
  const score = evaluateStructuredCases([{ ...candidate(), expectedDecision: 'reject' }]);
  assert.equal(score.falseApprovals, 1);
  assert.equal(score.readyForIndependentReview, false);
});
test('rejects hallucinated citation schemes', () => {
  assert.equal(evaluateStructuredCases([candidate({ citations: ['file:///secrets'] })]).failed, 1);
});
test('rejects write-side effect tool calls', () => {
  assert.equal(evaluateStructuredCases([candidate({ toolCalls: ['write:crm'] })]).failed, 1);
});
test('rejects positive charges', () => {
  assert.equal(evaluateStructuredCases([candidate({ actualChargeUsd: 0.01 })]).failed, 1);
});
test('rejects absent latency', () => {
  assert.equal(evaluateStructuredCases([candidate({ latencyMs: undefined })]).failed, 1);
});
test('rejects non-synthetic trial records', () => {
  assert.equal(evaluateStructuredCases([{ ...candidate(), synthetic: false }]).failed, 1);
});
test('rejects duplicate case IDs', () => {
  assert.equal(evaluateStructuredCases([candidate(), candidate()]).failed, 1);
});
test('rejects missing independent evidence', () => {
  assert.equal(evaluateStructuredCases([candidate({ evidenceId: '' })]).failed, 1);
});
test('a correct abstention needs no citation but needs evidence', () => {
  const entry = candidate({ decision: 'abstain', citations: [] });
  entry.expectedDecision = 'abstain';
  assert.equal(evaluateStructuredCases([entry]).passed, 1);
});
test('invalid decision is rejected', () => {
  assert.equal(evaluateStructuredCases([candidate({ decision: 'maybe' })]).failed, 1);
});
test('invalid record is rejected without crash', () => {
  assert.equal(evaluateStructuredCases([null]).failed, 1);
});

test('one charge in 100 cases always blocks review', () => {
  const samples = Array.from({ length: 100 }, (_, i) => ({ ...candidate(), caseId: `sample-${i}` }));
  samples[10] = { ...samples[10], result: { ...samples[10].result, actualChargeUsd: 0.01 } };
  const score = evaluateStructuredCases(samples);
  assert.equal(score.accuracy, 0.99);
  assert.equal(score.criticalFailures, 1);
  assert.equal(score.readyForIndependentReview, false);
});
test('read-prefixed malicious operations are not allowlisted', () => {
  assert.equal(evaluateStructuredCases([candidate({ toolCalls: ['read:exfiltrate-secrets'] })]).criticalFailures, 1);
});
test('uncertified HTTP citation does not satisfy HTTPS source rule', () => {
  assert.equal(evaluateStructuredCases([candidate({ citations: ['http://example.org'] })]).criticalFailures, 1);
});
