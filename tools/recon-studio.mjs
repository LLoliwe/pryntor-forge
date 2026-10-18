#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { capture, journey } from '../src/recon-browser.mjs';
import { compare } from '../src/recon-compare.mjs';
import { blueprint } from '../src/recon-blueprint.mjs';
const [command,...args]=process.argv.slice(2);
const flag=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const usage=()=>`PRYNTOR APP RECON STUDIO R1
  node tools/recon-studio.mjs capture URL --out DIRECTORY [--viewports mobile,tablet,desktop] [--allow-host example.com]
  node tools/recon-studio.mjs journey URL SCENARIO.json --out RESULTS.json [--allow-host example.com]
  node tools/recon-studio.mjs capture-file OWNED.html --out DIRECTORY
  node tools/recon-studio.mjs journey-file OWNED.html SCENARIO.json --out RESULTS.json
  node tools/recon-studio.mjs blueprint CAPTURE_DIR --out BLUEPRINT_DIR
  node tools/recon-studio.mjs compare REFERENCE_DIR CANDIDATE_DIR --out REPORT_DIR
Public URLs require explicitly approved hostname. Never use protected pages, production logins or private user data.
No third-party downloads, paid API calls, code execution from target pages outside isolated Chromium or commercial release approval.`;
try{
 if(command==='capture-file') {const [file]=args;if(!file||!flag('out'))throw new Error(usage());const r=await capture(null,flag('out'),{ownedFile:file,viewports:flag('viewports','mobile,desktop').split(',')});console.log(JSON.stringify({status:'OFFLINE_CAPTURED',path:flag('out'),viewports:r.viewports.map(v=>({name:v.name,buttons:v.counts.buttons,links:v.counts.links}))},null,2));}
 else if(command==='journey-file') {const [file,scenario]=args;if(!file||!scenario||!flag('out'))throw new Error(usage());const steps=JSON.parse(await readFile(scenario,'utf8'));const r=await journey(null,steps,{ownedFile:file});await writeFile(flag('out'),JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));if(!r.passed)process.exitCode=1;}
 else if(command==='capture') {const [url]=args;if(!url||!flag('out'))throw new Error(usage());const r=await capture(url,flag('out'),{allowHosts:flag('allow-host')?[flag('allow-host')]:[],viewports:flag('viewports','mobile,desktop').split(',')});console.log(JSON.stringify({status:'CAPTURED',path:flag('out'),viewports:r.viewports.map(v=>({name:v.name,buttons:v.counts.buttons,links:v.counts.links}))},null,2));}
 else if(command==='blueprint') {const [dir]=args;if(!dir||!flag('out'))throw new Error(usage());const r=await blueprint(dir,flag('out'));console.log(JSON.stringify({status:'BLUEPRINT_GENERATED',path:flag('out'),issues:r.issues.length},null,2));}
 else if(command==='compare') {const [a,b]=args;if(!a||!b||!flag('out'))throw new Error(usage());const r=await compare(a,b,flag('out'));console.log(JSON.stringify({status:'REPORT_GENERATED',path:flag('out')+'/index.html',scores:r.entries.map(e=>({viewport:e.viewport,similarity:e.visual.similarity,controls:e.semantic.controlSimilarity}))},null,2));}
 else if(command==='journey') {const [url,scenario]=args;if(!url||!scenario||!flag('out'))throw new Error(usage());const steps=JSON.parse(await readFile(scenario,'utf8'));const r=await journey(url,steps,{allowHosts:flag('allow-host')?[flag('allow-host')]:[]});await writeFile(flag('out'),JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));if(!r.passed)process.exitCode=1;}
 else console.log(usage());
}catch(e){console.error('BLOCKED:',e.message);process.exitCode=1;}
