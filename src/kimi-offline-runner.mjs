import { evidenceRef, evaluateStructuredCases } from './kimi-pilot-gate.mjs';

// Import/replay adapter only. No network transport, billing, tools, retries or secrets.
// Host records metadata and charges; never accept them from the model response.
export function replayEvaluation(fixtures, envelope) {
  if (!envelope || !['fixture', 'recorded-provider'].includes(envelope.kind) ||
      typeof envelope.modelVersion !== 'string' || !envelope.modelVersion.trim() ||
      typeof envelope.sourceRevision !== 'string' || !/^[a-f0-9]{40}$/.test(envelope.sourceRevision) ||
      !Array.isArray(fixtures) || fixtures.length === 0 ||
      !Array.isArray(envelope.records) || envelope.records.length !== fixtures.length) {
    throw new TypeError('Complete versioned replay envelope required');
  }
  const expectedHash = evidenceRef(JSON.stringify(fixtures));
  if (envelope.fixtureHash !== expectedHash) throw new Error('Fixture hash mismatch');
  const registry = new Map();
  const cases = Array.from(fixtures, (fixture, i) => {
    const record = envelope.records[i];
    if (!fixture || !record || record.caseId !== fixture.caseId) throw new Error('Missing, reordered or duplicate response');
    const bytes = JSON.stringify({ fixture, record, modelVersion: envelope.modelVersion, sourceRevision: envelope.sourceRevision });
    const ref = evidenceRef(bytes);
    registry.set(ref, bytes);
    return { ...fixture, result: { ...record, evidenceId: ref } };
  });
  const score = evaluateStructuredCases(cases, registry);
  const latencies = envelope.records.map(r => r.latencyMs).filter(Number.isFinite).sort((a,b) => a-b);
  const percentile = p => latencies[Math.max(0, Math.ceil(latencies.length*p)-1)] ?? null;
  return { kind: envelope.kind, modelVersion: envelope.modelVersion,
    fixtureHash: expectedHash, outputHash: evidenceRef(JSON.stringify(envelope.records)),
    sourceRevision: envelope.sourceRevision, score,
    latencyP50Ms: percentile(.5), latencyP95Ms: percentile(.95),
    // Replay integrity is not provider authenticity, capability or independent approval.
    liveModelResultsVerified: false, independentApproval: false };
}
