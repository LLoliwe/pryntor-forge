/**
 * Evidence-only, synchronous, local parsing/extraction comparison.
 * Never used as a release gate or cited as proof of vendor performance claims.
 * Requires optional npm install: rusteerio@2.0.0 and cheerio@1.2.0.
 */
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import * as cheerio from 'cheerio';
import * as rusteerio from 'rusteerio';
import {collectDocument} from './rusteerio_extract.mjs';
import {benchmarkPages} from '../tests/fixtures/rusteerio_pages.mjs';

const pages = benchmarkPages(450);
const loadAndExtract = (engine) => pages.map(p=>collectDocument(engine.load(p.html),p.sourceUrl));
const ref = loadAndExtract(cheerio);
assert.deepEqual(loadAndExtract(rusteerio),ref,'Output parity failed; stop benchmark before comparing speed');

function sample(engine) {
  const start = performance.now();
  const result=loadAndExtract(engine);
  if(result.length!==pages.length) throw new Error('incomplete extraction');
  return +(performance.now()-start).toFixed(3);
}
function median(nums) {
  const s=[...nums].sort((a,b)=>a-b);
  return s[(s.length-1)>>1];
}
// Warm both parsers before measurement. Alternate benchmark order to reduce CPU drift bias.
sample(cheerio); sample(rusteerio);
const c=[],r=[];
for(let i=0;i<5;i++){
  if(i%2) {r.push(sample(rusteerio));c.push(sample(cheerio));}
  else {c.push(sample(cheerio));r.push(sample(rusteerio));}
}
const cMs=median(c),rMs=median(r);
console.log(JSON.stringify({
  scope:'synthetic, local, synchronous HTML parse + fixed-source extraction only',
  reproducible_fixture_count:pages.length, rounds:5,
  node:process.version, platform:process.platform, arch:process.arch,
  cheerio_version:'1.2.0',rusteerio_version:'2.0.0',
  cheerio_median_ms:cMs,rusteerio_median_ms:rMs,
  observed_ratio_cheerio_over_rusteerio:+(cMs/rMs).toFixed(3),
  output_parity:'matched', spend_zar:0,
  caveat:'Single CI runner/limited synthetic fixtures; no cold-start/native memory/Web-scale claim, no live fetching or billing.'
},null,2));
