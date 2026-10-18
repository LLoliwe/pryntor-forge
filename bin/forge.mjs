#!/usr/bin/env node
import {writeFile,readFile} from 'node:fs/promises';
import {fromPrompt,cadScriptFor,pascalHandoff,validateScene} from '../src/core.mjs';
import {createServer} from '../src/server.mjs';
const [command,...args]=process.argv.slice(2);
try {
 if(command==='scene') { const s=fromPrompt(args.join(' ')); console.log(JSON.stringify(s,null,2)); }
 else if(command==='cad') { const t=args[0]||'workbench'; process.stdout.write(cadScriptFor(t)); }
 else if(command==='handoff') {
  const filename=args[0]; if(!filename) throw new Error('Usage: pryntor-forge handoff <scene.json>');
  const scene=validateScene(JSON.parse(await readFile(filename,'utf8')));
  console.log(JSON.stringify(pascalHandoff(scene),null,2));
 }
 else if(command==='serve'||!command) { createServer().listen(4173,'127.0.0.1',()=>console.log('Open http://127.0.0.1:4173')); }
 else {throw new Error('Usage: pryntor-forge [serve | scene "7x5m with 2 robots" | cad robot | handoff scene.json]');}
}catch(e){console.error(`FORGE: ${e.message}`);process.exitCode=1;}
