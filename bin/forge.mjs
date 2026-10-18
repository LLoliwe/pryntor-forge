#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {fromPrompt,cadScriptFor,pascalHandoff,validateScene,auditScene,templates} from '../src/core.mjs';
import {createServer} from '../src/server.mjs';
import {planRoute, verifyRoute, synthesizeLayout, clearanceEnvelope} from '../src/research.mjs';
const [command,...args]=process.argv.slice(2);
const help='Usage: pryntor-forge [serve | scene "7x5m with 2 robots" | blueprints | blueprint robotics | audit scene.json | cad robot | handoff scene.json | route request.json | route-verify request.json | robustness request.json | synthesize layout-spec.json]';
try {
 if(command==='scene'){console.log(JSON.stringify(fromPrompt(args.join(' ')),null,2));}
 else if(command==='blueprints'){console.log(Object.entries(templates).map(([k,v])=>`${k.padEnd(12)} ${v.name} | ${v.use}`).join('\n'));}
 else if(command==='blueprint'){
  const template=templates[args[0]];
  if(!template)throw new Error(`Unknown blueprint. ${Object.keys(templates).join(', ')}`);
  const scene=fromPrompt(template.prompt);scene.name=template.name;console.log(JSON.stringify(scene,null,2));
 }
 else if(['route','route-verify','robustness','synthesize'].includes(command)){
  if(!args[0])throw new Error(`Usage: pryntor-forge ${command} <request.json>`);
  const request=JSON.parse(await readFile(args[0],'utf8'));
  const answer=command==='route'?planRoute(request.scene,request.start,request.goal,request.options):
    command==='route-verify'?verifyRoute(request.scene,request.waypoints,request.options):
    command==='robustness'?clearanceEnvelope(request.scene,request.start,request.goal,request.options):synthesizeLayout(request);
  console.log(JSON.stringify(answer,null,2));
  if((command==='route'&&answer.status!=='clear') || (command==='route-verify'&&!answer.valid) ||
    (command==='synthesize'&&answer.status!=='satisfiable'))process.exitCode=2;
 }
 else if(command==='cad'){process.stdout.write(cadScriptFor(args[0]||'workbench'));}
 else if(command==='audit'||command==='handoff'){
  if(!args[0])throw new Error(`Usage: pryntor-forge ${command} <scene.json>`);
  const source=JSON.parse(await readFile(args[0],'utf8'));
  console.log(JSON.stringify(command==='audit'?auditScene(source):pascalHandoff(validateScene(source)),null,2));
  if(command==='audit' && auditScene(source).status!=='clear')process.exitCode=2;
 }
 else if(command==='serve'||!command){createServer().listen(4173,'127.0.0.1',()=>console.log('Open http://127.0.0.1:4173'));}
 else{throw new Error(help);}
}catch(e){console.error(`FORGE: ${e.message}`);process.exitCode=1;}
