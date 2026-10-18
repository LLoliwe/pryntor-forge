/**
 * Offline guardrails for existing Pryntor OSIE Git QA.
 * Advisory pattern checks, NOT a substitute for a full YAML parser,
 * SAST scan or independent security review.
 */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export function inspectWorkflow(input) {
  const errors = [];
  if (/^\s*(pull_request_target|workflow_run|repository_dispatch)\s*:/m.test(input))
    errors.push('untrusted high-privilege event trigger');
  if (!/^permissions:\s*\n\s{2}contents:\s*read\s*$/m.test(input))
    errors.push('expected top-level contents: read with least privilege');
  if (/^\s*(contents|actions|issues|pull-requests|security-events|id-token):\s*write\s*$/m.test(input))
    errors.push('unexpected write permission');
  if (/\$\{\{\s*secrets\.|\$\{\{\s*vars\./.test(input))
    errors.push('workflow must not access secrets or account variables');
  const actionPattern = /^\s*-\s*uses:\s*([^\s#]+)/gm;
  for (const match of input.matchAll(actionPattern)) {
    const action = match[1];
    const revision = action.split('@')[1];
    if (!/^[a-f0-9]{40}$/.test(revision ?? '') || !action.includes('/'))
      errors.push('action must be an exact 40-character pinned revision: ' + action);
  }
  for (const match of input.matchAll(/\bnpm\s+install\b[^\n]*/g)) {
    const line = match[0];
    for (const opt of ['--no-save','--no-package-lock','--ignore-scripts','--no-audit','--no-fund']) {
      if (!line.includes(opt)) errors.push('npm install missing ' + opt);
    }
    if (!/rusteerio@2\.0\.0\b/.test(line)) errors.push('native dependency must be version pinned');
  }
  return errors;
}

export function inspectAdapter(input) {
  const errors = [];
  for (const [name,pattern] of [
    ['byte cap',/Buffer\.byteLength\(/],
    ['batch cap',/batchPages/],
    ['explicit HTTPS source',/parsed\.protocol\s*!==\s*['"]https:['"]/],
    ['bounded native batch',/loadAll\(/],
  ]) if (!pattern.test(input)) errors.push('missing '+name);
  for (const pattern of [/\bfetch\s*\(/,/\bexecSync\s*\(/,/\bspawn\s*\(/,/\bhttps?\.request\s*\(/])
    if (pattern.test(input)) errors.push('potential network/subprocess call in local-only adapter: '+pattern);
  return errors;
}
export async function runGuard() {
  const files = [
    '.github/workflows/rusteerio-opt-in.yml',
    '.github/workflows/osie-git-qa.yml',
  ];
  const report = [];
  for (const file of files) {
    const body=await readFile(file,'utf8');
    report.push(...inspectWorkflow(body).map(reason => ({file,reason})));
  }
  const source=await readFile('tools/rusteerio_extract.mjs','utf8');
  report.push(...inspectAdapter(source).map(reason => ({file:'tools/rusteerio_extract.mjs',reason})));
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const errors=await runGuard();
    if(errors.length) {
      for(const x of errors) console.error('QA GUARD FAIL:', x.file+':',x.reason);
      process.exitCode=1;
    } else console.log('QA GUARD PASS: offline workflow and local-only source checks; no independent approval implied');
  } catch(error) {console.error('QA GUARD ERROR:',error.message);process.exitCode=2;}
}
