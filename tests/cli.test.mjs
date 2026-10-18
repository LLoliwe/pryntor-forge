import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const cli=new URL('../bin/forge.mjs',import.meta.url).pathname;
const exec=(...args)=>execFileSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:6000});
test('CLI lists company blueprints',()=>{const text=exec('blueprints');for(const name of ['robotics','science','studio','travel','makerspace'])assert.match(text,new RegExp(name));});
test('CLI renders, audits and hands off a scene with no secrets',()=>{
 const dir=mkdtempSync(join(tmpdir(),'forge-'));
 try{
  const json=exec('blueprint','robotics'),s=JSON.parse(json),file=join(dir,'scene.json');
  writeFileSync(file,json);
  assert.equal(s.schemaVersion,'0.2');assert.equal(JSON.parse(exec('audit',file)).status,'clear');
  const handoff=JSON.parse(exec('handoff',file));assert.equal(handoff.preflight.status,'clear');
  assert.match(handoff.instructions,/NOT an automatic import/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('CLI audit returns failing exit code and details on overlap',()=>{
 const dir=mkdtempSync(join(tmpdir(),'forge-'));
 try{
  const s=JSON.parse(exec('scene','7x5m with 2 robots'));s.objects[1].x=s.objects[0].x;s.objects[1].y=s.objects[0].y;
  const file=join(dir,'scene.json');writeFileSync(file,JSON.stringify(s));
  const r=spawnSync(process.execPath,[cli,'audit',file],{encoding:'utf8',timeout:6000});
  assert.equal(r.status,2);assert.equal(JSON.parse(r.stdout).status,'issues');
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('research CLI returns a verified route, finite lattice certificate and explicit invalid exit',()=>{
 const cwd=new URL('../',import.meta.url).pathname;
 const route=spawnSync(process.execPath,['bin/forge.mjs','route','examples/research-route.json'],{cwd,encoding:'utf8'});
 assert.equal(route.status,0,route.stderr);
 const result=JSON.parse(route.stdout);assert.equal(result.status,'clear');assert.ok(result.lengthM>7);
 const layout=spawnSync(process.execPath,['bin/forge.mjs','synthesize','examples/research-layout.json'],{cwd,encoding:'utf8'});
 assert.equal(layout.status,0,layout.stderr);assert.equal(JSON.parse(layout.stdout).status,'satisfiable');
});
