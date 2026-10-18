import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAccessGate, evaluateStructuredCases, evidenceRef } from '../src/kimi-pilot-gate.mjs';
// Authored independently of the gate implementation. Local synthetic bytes only.
const bytes = '{"kind":"independent-offline-fixture","revision":1}';
const ref = evidenceRef(bytes);
const registry = new Map([[ref, bytes]]);
const sample = (change = {}) => ({ caseId: 'independent-1', synthetic: true, expectedDecision: 'approve', result: { decision: 'approve', citations: ['https://example.org/public-source'], toolCalls: ['read:synthetic-fixture'], actualChargeUsd: 0, latencyMs: 2, evidenceId: ref, ...change } });
const blocked = (rows, reg = registry) => assert.equal(evaluateStructuredCases(rows, reg).readyForIndependentReview, false);
test('independent: control fixture with registered bytes passes offline review gate', () => assert.equal(evaluateStructuredCases([sample()], registry).readyForIndependentReview, true));
test('independent: sparse citations cannot count as approval source', () => blocked([sample({ citations: Array(1) })]));
test('independent: sparse tool metadata cannot hide invalid entry', () => blocked([sample({ toolCalls: Array(1) })]));
test('independent: inherited permissions cannot grant access', () => {
 const names = ['founderApprovedPilot','writtenNoChargeGrant','nonBillableHardStop','noCardOrTopupRequired','noAutomaticPaidConversion','southAfricaEligible','commercialAndModelTermsReviewed','retentionTrainingAndResidencyReviewed','approvedSandboxCredentials','syntheticDataOnly','independentReviewerAssigned'];
 assert.equal(evaluateAccessGate(Object.create(Object.fromEntries(names.map(name => [name, true])))).ready, false);
});
test('independent: arbitrary fabricated evidence ID blocked', () => blocked([sample({ evidenceId: 'fabricated-without-artifact' })]));
test('independent: valid hash without registered bytes blocked', () => blocked([sample()], new Map()));
test('independent: registered bytes changed after hashing blocked', () => blocked([sample()], new Map([[ref, bytes + 'tampered']])));
test('independent: caller cannot substitute plain object as trusted registry', () => blocked([sample()], { [ref]: bytes }));
test('independent: source URLs cannot contain credentials', () => blocked([sample({ citations: ['https://user:password@example.org/source'] })]));
test('independent: source URL loopback excluded', () => blocked([sample({ citations: ['https://127.0.0.1/private'] })]));
test('independent: case identifier cannot be silently manufactured', () => blocked([{ ...sample(), caseId: '' }]));
for (const [name, change] of [['positive charge', { actualChargeUsd: 0.01 }], ['unauthorized tool', { toolCalls: ['write:payments'] }], ['forged evidence', { evidenceId: 'sha256:' + '0'.repeat(64) }]]) {
 test(`independent: single ${name} violation among 100 blocks review`, () => {
  const rows = Array.from({ length: 100 }, (_, i) => ({ ...sample(i === 42 ? change : {}), caseId: `independent-${i}` }));
  const result = evaluateStructuredCases(rows, registry);
  assert.equal(result.accuracy, 0.99); assert.equal(result.criticalFailures, 1); assert.equal(result.readyForIndependentReview, false);
 });
}
test('independent: sparse benchmark hole is a critical missing record', () => {
 const rows = Array.from({ length: 100 }, (_, i) => ({ ...sample(), caseId: `sparse-${i}` }));
 delete rows[42];
 const result = evaluateStructuredCases(rows, registry);
 assert.equal(result.criticalFailures, 1); assert.equal(result.readyForIndependentReview, false);
});
