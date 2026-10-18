import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { mkdtemp, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { validateTarget, validateViewportNames, capture, journey } from '../src/recon-browser.mjs';
import { pixelDifference, semanticDifference, compare } from '../src/recon-compare.mjs';
import { analyzeCapture, blueprint } from '../src/recon-blueprint.mjs';

function png(r,g,b){const pixel=Buffer.from([0,r,g,b]);function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const crc=Buffer.alloc(4); // decoder validates dimensions/filter/contents rather than CRC
 return Buffer.concat([len,Buffer.from(type),data,crc]);}
 const header=Buffer.alloc(13);header.writeUInt32BE(1,0);header.writeUInt32BE(1,4);header[8]=8;header[9]=2;
 return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(pixel)),chunk('IEND',Buffer.alloc(0))]);}
const page={name:'mobile',screenshot:'mobile.png',viewport:{width:390,height:844},headings:[{level:1,text:'Hello'}],fonts:['Arial'],colors:[{color:'rgb(1, 2, 3)',count:1}],counts:{buttons:1,links:0,inputs:0},controls:[{tag:'button',role:'',label:'Play',w:30,h:30}]};
const captureSample={version:1,engine:'Chromium CDP',url:'owned-fixture (offline)',viewports:[page]};

test('host allowlist rejects unsafe input, private addresses, remote by default',()=>{
 assert.match(validateTarget('http://127.0.0.1:8000/demo'),/127\.0\.0\.1/);
 assert.match(validateTarget('https://example.org/', ['example.org']),/example\.org/);
 for(const x of ['file:///etc/passwd','https://user:pass@example.org','https://10.0.0.5','http://169.254.169.254/','https://api.internal/','https://site.local/','https://127.0.0.2/'])assert.throws(()=>validateTarget(x,[new URL(x).hostname]));
 assert.throws(()=>validateTarget('https://example.org/'),/not explicitly approved/);
});
test('viewports are bounded and unique',()=>{assert.deepEqual(validateViewportNames([]),['mobile','desktop']);assert.throws(()=>validateViewportNames(['mobile','mobile']));assert.throws(()=>validateViewportNames(['phone']));});
test('real pixel similarity reads PNG, catches changes',()=>{const a=png(30,50,70),b=png(30,50,70),c=png(255,0,0);assert.equal(pixelDifference(a,b).similarity,100);assert.ok(pixelDifference(a,c).similarity<100);assert.throws(()=>pixelDifference(Buffer.from('not png'),a));});
test('semantic diff flags missing controls',()=>{const a={controls:[{tag:'button',role:'',label:'Play'}]},b={controls:[]};assert.equal(semanticDifference(a,b).controlSimilarity,0);assert.equal(semanticDifference(a,b).missing.length,1);});
test('blueprint warns for tiny targets and overflow',()=>{const data=analyzeCapture(captureSample);assert.equal(data.issues.length,1);assert.match(data.issues[0],/44px/);assert.equal(data.viewports[0].buttons,1);assert.throws(()=>analyzeCapture({version:99,viewports:[]}));});
test('creates a self-contained inspection report and machine-readable scores',async()=>{const dir=await mkdtemp(join(tmpdir(),'recon-test-'));try{const a=join(dir,'a'),b=join(dir,'b'),out=join(dir,'report');await mkdir(a);await mkdir(b);await writeFile(join(a,'capture.json'),JSON.stringify(captureSample));await writeFile(join(b,'capture.json'),JSON.stringify(captureSample));await writeFile(join(a,'mobile.png'),png(50,50,50));await writeFile(join(b,'mobile.png'),png(50,50,50));const result=await compare(a,b,out);assert.equal(result.entries[0].visual.similarity,100);assert.match(await readFile(join(out,'index.html'),'utf8'),/Drag to reveal candidate/);const data=await blueprint(a,join(dir,'blueprint'));assert.equal(data.viewports.length,1);assert.match(await readFile(join(dir,'blueprint','blueprint.md'),'utf8'),/PRYNTOR \/ RECONSTRUCTION BLUEPRINT/);}finally{await rm(dir,{recursive:true,force:true});}});
const e2e=process.env.RUN_RECON_BROWSER_TESTS==='1';
test('Chromium renders owned original demo and captures visible controls', {skip:!e2e}, async()=>{const dir=await mkdtemp(join(tmpdir(),'recon-e2e-'));try{const file=resolve('examples/recon-demo/index.html');const cap=await capture(null,dir,{ownedFile:file,viewports:['mobile']});assert.equal(cap.viewports[0].name,'mobile');assert.ok(cap.viewports[0].counts.buttons>=1);const pngBytes=await readFile(join(dir,'mobile.png'));assert.ok(pngBytes.length>20_000);}finally{await rm(dir,{recursive:true,force:true});}});
test('Chromium completes actual Play → Win → Restart interactions', {skip:!e2e}, async()=>{const file=resolve('examples/recon-demo/index.html');const steps=JSON.parse(await readFile(resolve('examples/recon-demo/full-journey.json'),'utf8'));const result=await journey(null,steps,{ownedFile:file});assert.equal(result.passed,true,JSON.stringify(result.results.find(s=>!s.passed)));assert.equal(result.results.length,17);});
test('Chromium navigation to protected addresses fails closed', {skip:!e2e}, async()=>{const dir=await mkdtemp(join(tmpdir(),'recon-block-'));try{await assert.rejects(()=>capture('http://127.0.0.1:1/',dir,{viewports:['mobile']}),/Browser refused navigation/);}finally{await rm(dir,{recursive:true,force:true});}});
