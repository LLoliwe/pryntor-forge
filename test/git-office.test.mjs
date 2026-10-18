import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../tools/git-office/onboard.mjs', import.meta.url));
const registry = JSON.parse(readFileSync(fileURLToPath(new URL('../tools/git-office/upstreams.json', import.meta.url)), 'utf8'));
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 10000 });

test('upstream manifest has nine distinct full-SHA records', () => {
  assert.equal(registry.upstreams.length, 9);
  assert.equal(new Set(registry.upstreams.map(x => x.id)).size, 9);
  for (const r of registry.upstreams) assert.match(r.sha, /^[a-f0-9]{40}$/);
});
test('offline registry verification succeeds', () => {
  const r = run('--verify');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Validated 9 pinned upstream records/);
});
test('reference-only material cannot be installed', () => {
  const r = run('--install','phaser-examples','--ack-source-only');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /rights approval required/);
});
test('installation requires positive opt-in', () => {
  const r = run('--install','pixi-open-games');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Usage/);
});
test('no production deployment credentials exist in catalog', () => {
  const serialized = JSON.stringify(registry);
  assert.doesNotMatch(serialized, /(?:ghp_|sk-proj-|AKIA)[a-zA-Z0-9]{8,}/);
});
