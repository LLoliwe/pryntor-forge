#!/usr/bin/env node
// Pryntor Git Office: opt-in, pinned SOURCE checkout only.
// Never installs npm dependencies, executes upstream scripts or deploys games.
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const manifestPath = fileURLToPath(new URL('./upstreams.json', import.meta.url));
const { schema, upstreams } = JSON.parse(await readFile(manifestPath, 'utf8'));
const allowedModes = new Set(['sandbox', 'reference-only']);
function fail(message) { console.error('Git Office ERROR:', message); process.exit(1); }
if (schema !== 1 || !Array.isArray(upstreams)) fail('Unsupported registry format');
const seen = new Set();
for (const r of upstreams) {
  if (!/^[a-z0-9-]+$/.test(r.id) || seen.has(r.id)) fail('Invalid or repeated id');
  seen.add(r.id);
  if (!/^[\w.-]+\/[\w.-]+$/.test(r.repo)) fail('Invalid GitHub repository');
  if (!/^[0-9a-f]{40}$/.test(r.sha)) fail('Missing pinned full commit SHA');
  if (!allowedModes.has(r.mode)) fail('Invalid adoption gate');
  if (!r.license || !r.rights || !r.use) fail('Missing rights or use notes');
}
const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && args[0] === '--list')) {
  for (const r of upstreams) console.log(r.id.padEnd(25), r.mode.padEnd(14), r.license, r.sha.slice(0, 12));
  console.log('\nNo sources cloned or dependencies installed. Use --install <id> --ack-source-only for an isolated checkout.');
} else if (args.length === 1 && args[0] === '--verify') {
  console.log('Validated', upstreams.length, 'pinned upstream records; no network accessed.');
} else if (args.length === 3 && args[0] === '--install' && args[2] === '--ack-source-only') {
  const r = upstreams.find(x => x.id === args[1]);
  if (!r) fail('Unknown source id');
  if (r.mode !== 'sandbox') fail('Reference-only repo; rights approval required before cloning for reuse');
  const dir = await mkdtemp(join(tmpdir(), 'pryntor-upstream-'));
  const target = join(dir, r.id);
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1' };
  const git = (...argv) => execFileSync('git', argv, { encoding:'utf8', env, stdio: ['ignore','pipe','pipe'], timeout: 120000 });
  try {
    git('-c','core.hooksPath=/dev/null','-c','submodule.recurse=false','clone','--filter=blob:none','--no-checkout','--no-recurse-submodules','https://github.com/' + r.repo + '.git',target);
    git('-C',target,'-c','core.hooksPath=/dev/null','checkout','--detach','--force',r.sha);
    const actual = git('-C',target,'rev-parse','HEAD').trim();
    if (actual !== r.sha) fail('Checkout SHA mismatch. Do not use checkout');
    console.log('Verified SOURCE checkout:', target, 'commit:', actual);
    console.log('Not approved for production. No dependencies installed, build run, licenses inherited or assets imported.');
  } catch (err) { fail('Checkout failed: ' + String(err.message || err)); }
} else fail('Usage: --list | --verify | --install <id> --ack-source-only');
