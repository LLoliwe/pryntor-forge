import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectWorkflow,inspectAdapter} from '../tools/osie_git_qa_guard.mjs';

const sha='11bd71901bbe5b1630ceea73d27597364c9af683';
const safeWorkflow=`name: Test
on:
  pull_request:
permissions:
  contents: read
jobs:
  safe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${sha}
      - run: npm install --no-save --no-package-lock --ignore-scripts --no-audit --no-fund rusteerio@2.0.0
`;
test('accepted minimal read-only pinned workflow',()=>assert.deepEqual(inspectWorkflow(safeWorkflow),[]));
test('deny dangerous events, broad permissions and secrets',()=>{
  const mutated = [
    safeWorkflow.replace('pull_request:', 'pull_request_target:'),
    safeWorkflow.replace('contents: read', 'contents: write'),
    safeWorkflow.replace('permissions:\n  contents: read', 'permissions: write-all'),
    safeWorkflow.replace('node_modules', 'node_modules')+'\n      - run: echo ${{ secrets.PRIVATE_KEY }}',
  ];
  for (const value of mutated) assert.ok(inspectWorkflow(value).length>0,'expected a rejection');
});
test('deny unpinned actions and package install scripts',()=>{
  assert.match(inspectWorkflow(safeWorkflow.replace(sha,'v4')).join(' '),/40-character/);
  assert.match(inspectWorkflow(safeWorkflow.replace('--ignore-scripts','--scripts')).join(' '),/ignore-scripts/);
  assert.match(inspectWorkflow(safeWorkflow.replace('rusteerio@2.0.0','rusteerio@latest')).join(' '),/version pinned/);
});
test('local-only adapter checks identify forbidden runtime paths',()=>{
  const good = `Buffer.byteLength(html); const batchPages=16; if (parsed.protocol !== 'https:') throw Error(); await parser.loadAll(items)`;
  assert.deepEqual(inspectAdapter(good),[]);
  assert.ok(inspectAdapter(good+'; await fetch("https://example.com")').length);
  assert.ok(inspectAdapter(good+'; child_process.execSync("id")').length);
  assert.ok(inspectAdapter(good.replace('Buffer.byteLength','str.length')).length);
});
