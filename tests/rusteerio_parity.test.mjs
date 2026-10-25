import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectDocument, extractBatch } from '../tools/rusteerio_extract.mjs';
import {fixturePages} from './fixtures/rusteerio_pages.mjs';

test('real Rusteerio matches Cheerio on source-attributed public synthetic fixtures',async(t)=>{
  let r,c;
  try {
    [r,c]=await Promise.all([import('rusteerio'),import('cheerio')]);
  } catch(error) {
    if(error?.code==='ERR_MODULE_NOT_FOUND') return t.skip('Opt-in Rusteerio + Cheerio packages not installed');
    throw error;
  }
  for (const page of fixturePages) {
    const actual=collectDocument(r.load(page.html),page.sourceUrl);
    const reference=collectDocument(c.load(page.html),page.sourceUrl);
    assert.deepEqual(actual,reference,'Parity mismatch for '+page.sourceUrl);
  }
  const batch=await extractBatch(fixturePages,{parser:r});
  assert.deepEqual(batch,fixturePages.map(p=>collectDocument(c.load(p.html),p.sourceUrl)),'Batch mismatch vs Cheerio reference');
});
