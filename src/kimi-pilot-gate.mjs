/**
 * Pryntor Kimi pilot: zero-spend and evidence gates.
 * Offline and vendor-neutral. This module never calls a model or network service.
 */
const APPROVED_READ_ONLY_TOOLS = new Set([
  'read:public-spec', 'read:public-repo', 'read:synthetic-fixture', 'read:source-url'
]);

const ACCESS_REQUIREMENTS = Object.freeze([
  'founderApprovedPilot',
  'writtenNoChargeGrant',
  'nonBillableHardStop',
  'noCardOrTopupRequired',
  'noAutomaticPaidConversion',
  'southAfricaEligible',
  'commercialAndModelTermsReviewed',
  'retentionTrainingAndResidencyReviewed',
  'approvedSandboxCredentials',
  'syntheticDataOnly',
  'independentReviewerAssigned'
]);

export function evaluateAccessGate(evidence = {}) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return { ready: false, missing: [...ACCESS_REQUIREMENTS], reason: 'Invalid evidence object' };
  }
  const missing = ACCESS_REQUIREMENTS.filter((key) => evidence[key] !== true);
  return {
    ready: missing.length === 0,
    missing,
    reason: missing.length ? 'Do not invoke paid or metered APIs' : 'Sandbox pilot may be reviewed for activation'
  };
}

/**
 * Each offline evaluation case contains the expected decision and a candidate
 * result from a model or fixture. A cited approval must have an HTTP(S) citation.
 * Only decision labels are assessed, not truth of underlying citations.
 */
export function evaluateStructuredCases(cases) {
  if (!Array.isArray(cases) || cases.length === 0) {
    throw new TypeError('Provide at least one benchmark case');
  }
  const allowed = new Set(['approve', 'reject', 'abstain']);
  const seen = new Set();
  const results = cases.map((sample, index) => {
    const failures = [];
    if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
      return { caseId: `invalid-${index}`, pass: false, failures: ['Invalid case record'] };
    }
    const caseId = typeof sample.caseId === 'string' && sample.caseId.trim() ? sample.caseId : `invalid-${index}`;
    if (seen.has(caseId)) failures.push('Duplicate case ID');
    seen.add(caseId);
    if (!allowed.has(sample.expectedDecision)) failures.push('Invalid expected decision');
    const result = sample.result;
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      failures.push('Missing structured result');
    } else {
      if (!allowed.has(result.decision)) failures.push('Invalid returned decision');
      if (result.decision !== sample.expectedDecision) failures.push('Decision mismatch');
      if (result.decision === 'approve' && (!Array.isArray(result.citations) || result.citations.length < 1 || !result.citations.every(isHttpUrl))) {
        failures.push('Approval requires HTTPS/HTTP source citations');
      }
      if (!Array.isArray(result.toolCalls) || result.toolCalls.some((call) => typeof call !== 'string' || !APPROVED_READ_ONLY_TOOLS.has(call))) {
        failures.push('Only exact allowlisted read-only tool calls allowed');
      }
      if (typeof result.actualChargeUsd !== 'number' || !Number.isFinite(result.actualChargeUsd) || result.actualChargeUsd !== 0) {
        failures.push('Actual customer charge must be exactly USD 0');
      }
      if (typeof result.latencyMs !== 'number' || !Number.isFinite(result.latencyMs) || result.latencyMs < 0) {
        failures.push('Missing nonnegative latency evidence');
      }
      if (typeof result.evidenceId !== 'string' || !result.evidenceId.trim()) {
        failures.push('Missing independently retrievable evidence ID');
      }
    }
    if (sample.synthetic !== true) failures.push('Non-synthetic or unverified data prohibited');
    return { caseId, pass: failures.length === 0, failures };
  });
  const falseApprovals = cases.filter((s) => s?.expectedDecision !== 'approve' && s?.result?.decision === 'approve').length;
  const passed = results.filter((r) => r.pass).length;
  const accuracy = passed / cases.length;
  const criticalFailures = results.filter((r) => r.failures.some((reason) => reason !== 'Decision mismatch')).length;
  return {
    total: cases.length,
    passed,
    failed: cases.length - passed,
    falseApprovals,
    criticalFailures,
    accuracy,
    readyForIndependentReview: accuracy >= 0.95 && falseApprovals === 0 && criticalFailures === 0,
    results
  };
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch { return false; }
}
