// Turns measured browser evidence into an auditable design and interaction handoff.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
const SAFE=/^[\w\s.,:%()#-]+$/;
const clean=value=>String(value??'').replace(/[\r\n|]/g,' ').slice(0,120);
export function analyzeCapture(capture){
 if(capture?.version!==1||!Array.isArray(capture.viewports)||!capture.viewports.length)throw new Error('Unsupported or empty capture');
 const screenReports=[];
 for(const page of capture.viewports){
  const controls=page.controls||[];
  const small=controls.filter(c=>c.w<44||c.h<44).map(c=>({label:clean(c.label),size:`${c.w}x${c.h}`,tag:c.tag}));
  screenReports.push({viewport:page.name,width:page.viewport.width,height:page.viewport.height,buttons:page.counts?.buttons??0,links:page.counts?.links??0,headings:page.headings??[],smallTouchTargets:small,horizontalOverflow:!!page.horizontalOverflow,externalAssetsUnverified:true});
 }
 const globalColors=[...new Map(capture.viewports.flatMap(v=>v.colors||[]).filter(x=>SAFE.test(x.color)).map(x=>[x.color,x.count])).entries()].slice(0,18).map(([color,count])=>({color,count}));
 const fonts=[...new Set(capture.viewports.flatMap(v=>v.fonts||[]).map(clean))].slice(0,12);
 const issues=screenReports.flatMap(p=>[...(p.horizontalOverflow?[`${p.viewport}: horizontal overflow`]:[]),...(p.smallTouchTargets.length?[`${p.viewport}: ${p.smallTouchTargets.length} interactive elements smaller than 44px`]:[])]);
 return {source:capture.url,viewports:screenReports,designSignals:{fonts,observedColors:globalColors},issues,limitations:['Visual similarity is not a functionality test','Screenshots cannot establish rights or performance','No test evidence for real Safari, Android or accessibility tools','Third-party assets, copy and logos cannot be reused without explicit rights']};
}
export async function blueprint(captureDir,outDir){
 const cap=JSON.parse(await readFile(join(resolve(captureDir),'capture.json'),'utf8'));
 const data=analyzeCapture(cap);const out=resolve(outDir);await mkdir(out,{recursive:true});
 const md=['# PRYNTOR / RECONSTRUCTION BLUEPRINT', '',`Research source: ${data.source}`,`Observed via: ${cap.engine}`, '', '## Measured screen inventory', ...data.viewports.flatMap(v=>[`### ${v.viewport} (${v.width} × ${v.height})`,`- Visible buttons: ${v.buttons}, visible links: ${v.links}`,`- Horizontal overflow: ${v.horizontalOverflow?'YES':'NO'}`,`- Small touch targets: ${v.smallTouchTargets.length}`,...v.headings.slice(0,8).map(h=>`- Heading H${h.level}: ${clean(h.text)}`)]), '', '## Observed design signals (research only)',`- Font families: ${data.designSignals.fonts.join(' | ')||'Not available'}`,`- Common colours: ${data.designSignals.observedColors.map(c=>c.color).slice(0,8).join(', ')||'Not available'}`,'', '## Engineering actions','1. Map user jobs, routes, screen states and error states.','2. Design an original brand identity and interaction system. Never copy third-party source or protected assets.','3. Build actual interactive controls, state changes, navigation, error and loading states.','4. Write repeatable browser journeys for start, primary action, back and restart or recovery.','5. Capture at mobile, tablet and desktop sizes with independent visual comparison.','6. Test physical iOS Safari and Android, accessibility and permissions before shipping.','','## Detected concerns',...(data.issues.length?data.issues.map(i=>'- '+i):['- No automated layout alerts in the captured samples. This is not approval.']),'','## Limitations',...data.limitations.map(s=>'- '+s),''];
 await writeFile(join(out,'blueprint.md'),md.join('\n'));
 await writeFile(join(out,'audit.json'),JSON.stringify(data,null,2));return data;
}
