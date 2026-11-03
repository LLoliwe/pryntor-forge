#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultManifest, plan, sourceCatalog, verify } from '../src/app-recon.mjs';
const [command,...args]=process.argv.slice(2);
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const usage='Usage: node tools/app-recon.mjs catalog | init <slug> <web|mobile|game> [file.json] | plan <manifest.json> [report.md] | verify <manifest.json> <evidence.json> [report.json]';
try {
  if(command==='catalog' && args.length===0) {
    console.log(JSON.stringify(sourceCatalog(resolve(root,'docs/app-recon-sources.json')),null,2));
  } else if(command==='init' && args.length>=2 && args.length<=3) {
    const m=defaultManifest(args[0],args[1]);
    const dest=resolve(args[2]??(m.project.id+'.app-recon.json'));
    if(existsSync(dest)) throw new Error('File exists, refusing to overwrite: '+dest);
    mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,JSON.stringify(m,null,2)+'\n',{flag:'wx'});
    console.log('CREATED '+dest+'\nSafe defaults: no downloads, paid services, brand copying, or release approval.');
  } else if(command==='plan' && args.length>=1 && args.length<=2) {
    const m=JSON.parse(readFileSync(resolve(args[0]),'utf8'));
    const output=plan(m);
    if(args[1]) {
      const dest=resolve(args[1]);
      if(existsSync(dest))throw new Error('File exists, refusing to overwrite: '+dest);
      writeFileSync(dest,output,{flag:'wx'});console.log('CREATED '+dest);
    } else process.stdout.write(output);
  } else if(command==='verify' && args.length>=2 && args.length<=3) {
    const m=JSON.parse(readFileSync(resolve(args[0]),'utf8'));
    const evidenceFile=resolve(args[1]);const e=JSON.parse(readFileSync(evidenceFile,'utf8'));
    const report=verify(m,e,dirname(evidenceFile));
    const output=JSON.stringify(report,null,2)+'\n';
    if(args[2]) {
      const dest=resolve(args[2]);
      if(existsSync(dest))throw new Error('File exists, refusing to overwrite: '+dest);
      writeFileSync(dest,output,{flag:'wx'});console.log('CREATED '+dest);
    } else process.stdout.write(output);
    if(!report.ready) process.exitCode=2;
  } else {console.error(usage);process.exitCode=64}
} catch(err){console.error('APP RECON ERROR: '+err.message);process.exitCode=1}
