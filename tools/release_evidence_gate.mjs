/** Offline evidence consistency check. Inputs must come from a trusted collector.
 * This does not authenticate GitHub records or authorize a merge/deployment. */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const names = x => Array.isArray(x) && x.length > 0 &&
  Array.from(x).every(v => typeof v === 'string' && v.trim() === v && v.length > 0) &&
  new Set(x).size === x.length;
const sha = x => typeof x === 'string' && /^[a-f0-9]{40}$/.test(x);
const url = x => {
  try { const u = new URL(x); return u.protocol === 'https:' && !u.username && !u.password; }
  catch { return false; }
};

export function inspectRelease(evidence, policy, now = Date.now()) {
  const errors = [];
  if (!object(policy) || !sha(policy.expectedHead) ||
      !names(policy.requiredChecks) || !names(policy.requiredGates) ||
      !names(policy.allowedReviewers) || !Number.isSafeInteger(policy.maxAgeHours) ||
      policy.maxAgeHours < 1 || policy.maxAgeHours > 168 || !Number.isFinite(now))
    return {status:'BLOCKED', errors:['invalid trusted policy']};
  if (!object(evidence)) return {status:'BLOCKED', errors:['invalid evidence']};
  if (evidence.head !== policy.expectedHead) errors.push('head differs from trusted expected head');
  if (typeof evidence.author !== 'string' || !evidence.author.trim()) errors.push('missing author');
  const fresh = value => {
    if (typeof value !== 'string') return false;
    const time = Date.parse(value);
    return Number.isFinite(time) && time <= now && now-time <= policy.maxAgeHours*3600000;
  };
  if (!fresh(evidence.collectedAt)) errors.push('collection stale, invalid or future-dated');
  for (const [field, required] of [['checks',policy.requiredChecks],['gates',policy.requiredGates]]) {
    const rows = evidence[field];
    if (!Array.isArray(rows) || rows.some(x => !object(x)) ||
        Array.from(rows).some(x => !object(x))) { errors.push('invalid '+field); continue; }
    for (const name of required) {
      const matches = rows.filter(x => x.name === name);
      if (matches.length !== 1) { errors.push(field+': missing or duplicate '+name); continue; }
      const row = matches[0];
      if (row.head !== policy.expectedHead || row.status !== 'passed' ||
          !url(row.url) || !fresh(row.completedAt)) errors.push(field+': invalid proof for '+name);
      if (field === 'checks' && (!Number.isSafeInteger(row.passed) || row.passed < 1 ||
          row.failed !== 0 || row.skipped !== 0)) errors.push('checks: incomplete execution for '+name);
    }
  }
  if (!Array.isArray(evidence.reviews) || !evidence.reviews.length) errors.push('missing independent review');
  else {
    const latest = new Map();
    for (const r of Array.from(evidence.reviews)) {
      if (!object(r) || typeof r.reviewer !== 'string' || !fresh(r.submittedAt)) {
        errors.push('invalid or stale review'); continue;
      }
      const key=r.reviewer.toLowerCase();
      if (!latest.has(key) || Date.parse(r.submittedAt) >= Date.parse(latest.get(key).submittedAt)) latest.set(key,r);
    }
    const allowed=policy.allowedReviewers.map(x=>x.toLowerCase());
    const independent=[...latest.values()].filter(r=>allowed.includes(r.reviewer.toLowerCase()) &&
      r.reviewer.toLowerCase() !== String(evidence.author).toLowerCase() && r.head === policy.expectedHead);
    if (independent.some(r=>r.state === 'CHANGES_REQUESTED')) errors.push('unresolved changes requested');
    if (!independent.some(r=>r.state === 'APPROVED' && url(r.url))) errors.push('no allowed independent approval on current head');
  }
  return {status:errors.length ? 'BLOCKED' : 'CONSISTENT_NOT_AUTHORIZED',errors};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4) throw Error('usage: node tools/release_evidence_gate.mjs TRUSTED_POLICY.json EVIDENCE.json');
    const policy=JSON.parse(await readFile(process.argv[2],'utf8'));
    const evidence=JSON.parse(await readFile(process.argv[3],'utf8'));
    const report=inspectRelease(evidence,policy);
    console.log(JSON.stringify(report,null,2));
    process.exitCode=report.errors.length ? 1 : 0;
  } catch(error) { console.error(error.message); process.exitCode=2; }
}
