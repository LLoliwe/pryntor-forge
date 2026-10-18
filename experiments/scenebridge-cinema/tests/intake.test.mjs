import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
const json=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'))
test('must have actual build and test scripts',()=>{assert.ok(json.scripts.build);assert.ok(json.scripts.test)})
test('approved cinematic dependencies declared',()=>{
  for(const name of ['react','three','@react-three/fiber','@react-three/drei','@react-three/postprocessing','@14islands/r3f-scroll-rig','@theatre/core'])
    assert.ok(json.dependencies[name],name)
})
test('no unreviewed studio or paid inference dependencies',()=>{assert.equal(json.dependencies['@theatre/studio'],undefined);assert.equal(json.dependencies['@theatre/r3f'],undefined)})
test('scene sources and page exist',()=>{for(const p of ['../index.html','../src/main.jsx','../src/stage.jsx','../src/style.css'])assert.ok(existsSync(new URL(p,import.meta.url)),p)})
test('engine limitations and independent QA described',()=>{
  const doc=readFileSync(new URL('../README.md',import.meta.url),'utf8')
  assert.match(doc,/NOT|not.*(verified|yet)|unverified|unavailable/i)
  assert.match(doc,/independent/i)
  assert.match(doc,/Unreal/)
})
test('require provenance-safe source code',()=>{
  const source=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8')
  assert.match(source,/original procedural/)
  assert.match(source,/NOT VERIFIED/)
  assert.doesNotMatch(source,/(sk-proj-|AKIA[0-9A-Z]{16})/)
})
