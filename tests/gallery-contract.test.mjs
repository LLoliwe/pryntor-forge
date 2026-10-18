import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../', import.meta.url);
async function file(path){return readFile(new URL(path,root),'utf8');}

test('gallery interactions have real DOM targets',async()=>{
 const html=await file('public/index.html');
 const js=await file('public/app.js');
 const ids=['view-iso','view-top','view-labels','view-fit','viewport','generate','run-route','catalog','object-list','rotate','export-json','export-cad','export-pascal','import-json'];
 for(const id of ids){assert.match(html,new RegExp(`id="${id}"`),`missing #${id}`);}
 for(const name of ['view-iso','view-top','view-labels','view-fit'])assert.ok(js.includes(`$('${name}').addEventListener`),`not wired: ${name}`);
 for(const key of ['science','robotics','studio','travel','makerspace'])assert.ok(html.includes(`data-quick="${key}"`),`missing ${key}`);
 assert.ok(js.includes('setActiveQuick('));
});

test('local-first styling and non-certification notice remain visible',async()=>{
 const [html,css,app]=await Promise.all(['public/index.html','public/styles.css','public/app.js'].map(file));
 assert.match(html,/not production CAD/i);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/focus-visible/);
 assert.match(css,/max-width:480px/);
 assert.ok(!/https?:\/\//.test(app),'runtime should not depend on network assets');
 assert.match(app,/planRoute\(/);
});
