import { createHash } from 'node:crypto';
import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute } from 'node:path';

export const PLATFORMS = ['web', 'mobile', 'game'];
export const REQUIRED_BASE_GATES = [
  'source-rights', 'asset-provenance', 'brand-originality', 'privacy', 'security',
  'navigation', 'interactions', 'responsive-layout', 'accessibility',
  'performance', 'independent-review', 'owner-approval'
];
const REQUIRED_BY_PLATFORM = {
  web: ['touch-input', 'browser-e2e', 'physical-safari'],
  mobile: ['touch-input', 'native-device', 'physical-safari', 'offline-recovery'],
  game: ['touch-input', 'gameplay-loop', 'restart', 'fullscreen', 'native-device', 'physical-safari']
};
const ALLOWED_KINDS = ['pattern-study', 'implementation-reference', 'owned-product'];
export function slug(value) { return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''); }
export function stableJson(value) { return JSON.stringify(sort(value)); }
function sort(value) {
  if (Array.isArray(value)) return value.map(sort);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, sort(value[k])]));
  return value;
}
export function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
export function defaultManifest(id, platform='web') {
  if (!PLATFORMS.includes(platform)) throw new Error('Unsupported platform');
  const name = slug(id);
  if (!name || name.length > 64) throw new Error('Project ID must contain 1 to 64 slug characters');
  return {
    schemaVersion: 1,
    project: { id: name, name: name.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '), platform, owner: 'UNASSIGNED', childDirected: false },
    scope: { aim: 'Original implementation informed by authorised reference research', routes: ['home', 'experience'], journeys: [{ id: 'open-experience', steps: ['Open home', 'Open experience', 'Verify usable controls'] }] },
    references: [],
    policy: { sourceRightsApproved: false, brandAssetsOwned: false, privacyApproved: false, securityApproved: false, independentReviewer: '', releaseApproved: false, unapprovedSpendZAR: 0, allowAutomatedDownloads: false, allowExternalAccounts: false, copyThirdPartyAssets: false }
  };
}
export function validateManifest(m) {
  const errors=[];
  if (!m || typeof m!=='object' || Array.isArray(m)) return ['Manifest must be an object'];
  if (m.schemaVersion!==1) errors.push('schemaVersion must be 1');
  if (!m.project || typeof m.project!=='object') errors.push('project is required');
  else {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(m.project.id??'')) errors.push('project.id must be a valid slug');
    if (!PLATFORMS.includes(m.project.platform)) errors.push('Invalid project.platform');
    if (typeof m.project.name!=='string' || !m.project.name.trim()) errors.push('project.name is required');
    if (typeof m.project.owner!=='string' || !m.project.owner.trim()) errors.push('project.owner is required');
    if (typeof m.project.childDirected!=='boolean') errors.push('project.childDirected must be boolean');
  }
  if (!m.scope || !Array.isArray(m.scope.routes) || m.scope.routes.length===0 || m.scope.routes.some(x=>typeof x!=='string' || !x.trim())) errors.push('scope.routes must have named routes');
  if (!Array.isArray(m?.scope?.journeys) || m.scope.journeys.length===0 || m.scope.journeys.some(j=>!j || typeof j.id!=='string' || !Array.isArray(j.steps) || j.steps.length===0 || j.steps.some(s=>typeof s!=='string' || !s.trim()))) errors.push('scope.journeys need IDs and steps');
  if (!Array.isArray(m.references)) errors.push('references must be an array');
  else for (const [i,r] of m.references.entries()) {
    if (!r || typeof r.label!=='string' || !r.label.trim() || !ALLOWED_KINDS.includes(r.kind)) errors.push(`references[${i}] missing label or valid kind`);
    try { const u=new URL(r?.url); if (u.protocol!=='https:' || !u.hostname) throw new Error(); } catch { errors.push(`references[${i}].url must be HTTPS`); }
  }
  const p=m.policy;
  if (!p || typeof p!=='object') errors.push('policy is required');
  else {
    for (const key of ['sourceRightsApproved','brandAssetsOwned','privacyApproved','securityApproved','releaseApproved','allowAutomatedDownloads','allowExternalAccounts','copyThirdPartyAssets']) if (typeof p[key]!=='boolean') errors.push(`policy.${key} must be boolean`);
    if (p.unapprovedSpendZAR!==0) errors.push('policy.unapprovedSpendZAR must be zero');
    if (p.allowAutomatedDownloads || p.allowExternalAccounts || p.copyThirdPartyAssets) errors.push('Network downloads, external accounts and third-party assets are disallowed in R0');
    if (typeof p.independentReviewer!=='string') errors.push('policy.independentReviewer must be string');
  }
  return errors;
}
export function requiredGates(m) {
  const gates=[...REQUIRED_BASE_GATES,...(REQUIRED_BY_PLATFORM[m.project.platform]??[])];
  if (m.project.childDirected) gates.push('child-safety');
  return [...new Set(gates)];
}
export function plan(m) {
  const errors=validateManifest(m); if(errors.length) throw new Error(errors.join('; '));
  const hash=sha256(stableJson(m));
  const lines=[`# App Recon Plan: ${m.project.name}`, '',`Project: ${m.project.id} | Platform: ${m.project.platform} | Spec SHA-256: ${hash}`,
    '', '## Boundary', '- Original code and original or authorised brand assets only.', '- Observe only publicly accessible or explicitly authorised flows. No login bypass or scraping personal data.', '- No external downloads, account connections or unapproved spend.', '- This plan is not proof of a working clone or approval to release.', '',
    '## Routes and screens', ...m.scope.routes.map(r=>`- ${r}`),'', '## Behaviour contracts',
    ...m.scope.journeys.flatMap(j=>[`### ${j.id}`,...j.steps.map((s,i)=>`${i+1}. ${s}`)]),'',
    '## Research references', ...(m.references.length?m.references.map(r=>`- ${r.label}: ${r.kind} | ${r.url} | study patterns, not proprietary copy`):['- None supplied, capture only rights-cleared references.']),
    '', '## Implementation sequence', '1. Capture authorised reference journey, UX states, transitions, errors and responsive behavior.',
    '2. Sketch original information architecture, tokens, copy, visual composition and interaction contracts.',
    '3. Implement working end-to-end flows and source-controlled tests. No static screenshot-only shortcuts.',
    '4. Run browser/device QA and retain reproducible test artifacts.',
    '5. Obtain independent review and owner sign-off before release.', '',
    '## Required evidence gates', ...requiredGates(m).map(g=>`- [ ] ${g}`),'',
    '## Readiness', `Research and build may proceed locally. Release policy: ${m.policy.releaseApproved?'approval claimed in manifest, still subject to evidence':'held'}.`];
  return lines.join('\n')+'\n';
}
function withinDirectory(dir, file) {
  if (typeof file!=='string' || !file.trim() || isAbsolute(file) || file.includes('\\') || file.includes('\0')) return null;
  const full=resolve(dir,file); const rel=relative(dir,full);
  if (!rel || rel==='..' || rel.startsWith('../')) return null;
  try {
    if (!lstatSync(full).isFile()) return null;
    const real=realpathSync(full), root=realpathSync(dir), inside=relative(root,real);
    if (inside==='..' || inside.startsWith('../') || isAbsolute(inside)) return null;
    if (readFileSync(real).length===0) return null;
    return {path:full,digest:sha256(readFileSync(real))};
  } catch { return null; }
}
export function verify(m, e, evidenceDir) {
  const errors=validateManifest(m); if(errors.length) throw new Error(errors.join('; '));
  const gates=requiredGates(m);
  const report={project:m.project.id, platform:m.project.platform, specSha256:sha256(stableJson(m)), ready:false, status:'BLOCKED', passed:[], blockers:[], evidenceHashes:{}};
  const policy=m.policy;
  for (const k of ['sourceRightsApproved','brandAssetsOwned','privacyApproved','securityApproved','releaseApproved']) if(policy[k]!==true) report.blockers.push(`policy:${k}`);
  if (!policy.independentReviewer.trim() || policy.independentReviewer.trim().toLowerCase()===m.project.owner.trim().toLowerCase()) report.blockers.push('policy:independent-reviewer-missing-or-not-independent');
  if (!e || e.schemaVersion!==1 || !Array.isArray(e.gates)) { report.blockers.push('invalid-evidence-format');return report; }
  if (e.specSha256!==report.specSha256) report.blockers.push('evidence-manifest-hash-mismatch');
  for (const gate of gates) {
    const entries=e.gates.filter(x=>x?.id===gate);
    if(entries.length!==1) {report.blockers.push(`gate:${gate}:missing-or-duplicate`);continue;}
    const item=entries[0];
    if(item.status!=='pass') {report.blockers.push(`gate:${gate}:not-passed`);continue;}
    if (typeof item.reviewer!=='string' || !item.reviewer.trim()) {report.blockers.push(`gate:${gate}:reviewer-missing`);continue;}
    const evidence=withinDirectory(evidenceDir,item.artifact);
    if(!evidence) {report.blockers.push(`gate:${gate}:artifact-missing-or-unsafe`);continue;}
    if (gate==='independent-review' && item.reviewer.trim().toLowerCase()!==policy.independentReviewer.trim().toLowerCase()) {report.blockers.push(`gate:${gate}:reviewer-mismatch`);continue;}
    report.passed.push(gate);report.evidenceHashes[gate]=evidence.digest;
  }
  report.ready=report.blockers.length===0;
  report.status=report.ready?'EVIDENCE_COMPLETE_REQUIRES_HUMAN_VALIDATION':'BLOCKED';
  return report;
}
export function sourceCatalog(path) {
  const catalog=JSON.parse(readFileSync(path,'utf8'));
  if(catalog.schemaVersion!==1 || !Array.isArray(catalog.tools)) throw new Error('Invalid source catalog');
  for(const t of catalog.tools) {
    if(!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(t.url) || !['MIT','AGPL-3.0'].includes(t.license) || typeof t.restriction!=='string' || !t.restriction.trim()) throw new Error(`Invalid tool entry ${t.id}`);
    if (t.installed!==false || t.autoEnabled!==false) throw new Error(`Unsafe default for ${t.id}`);
  }
  return catalog;
}