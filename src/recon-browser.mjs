// Pryntor App Recon Studio R1. Zero-dependency, isolated local Chromium research adapter.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { isIP } from 'node:net';

const VIEWPORTS = Object.freeze({ mobile: [390, 844], tablet: [768, 1024], desktop: [1440, 900] });
const LOCAL = new Set(['localhost', '127.0.0.1', '[::1]']);
const PRIVATE_TLDS = /(?:^|\.)(?:internal|local|localhost|test|invalid)$/i;
export function validateTarget(input, allowHosts=[]) {
  let u;
  try { u = new URL(input); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new Error('Only HTTP(S) URLs without credentials are allowed');
  const host=u.hostname.toLowerCase();
  if (!LOCAL.has(host) && (isIP(host.replace(/^\[|\]$/g,'')) || PRIVATE_TLDS.test(host))) throw new Error('Private/IP-literal targets are blocked');
  if (!LOCAL.has(u.hostname) && !allowHosts.includes(u.hostname)) throw new Error(`Host ${u.hostname} not explicitly approved. Use --allow-host ${u.hostname} after rights/security review.`);
  if (u.hostname.endsWith('.local') || /(?:^|\.)internal$/.test(u.hostname)) throw new Error('Internal network host blocked');
  u.hash='';
  return u.toString();
}
export function validateViewportNames(names) {
  const selected=names.length?names:['mobile','desktop'];
  if (selected.length>3 || selected.some(x=>!(x in VIEWPORTS)) || new Set(selected).size!==selected.length) throw new Error('Viewports must be unique: mobile, tablet, desktop');
  return selected;
}
export class CDP {
  constructor(url) { this.ws=new WebSocket(url); this.next=0; this.pending=new Map(); this.handlers=new Map(); this.open=new Promise((ok,bad)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',bad,{once:true});}); this.ws.addEventListener('message',e=>{let m;try{m=JSON.parse(e.data);}catch{return;}if(!m.id){for(const callback of this.handlers.get(m.method)||[])Promise.resolve().then(()=>callback(m.params)).catch(()=>{});return;}const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result??{});}); this.ws.addEventListener('close',()=>{for(const p of this.pending.values())p.reject(new Error('Chromium disconnected'));this.pending.clear();}); }
  on(name,callback){const current=this.handlers.get(name)||[];current.push(callback);this.handlers.set(name,current);}
  async call(method,params={}) { await this.open;const id=++this.next;return await new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));}); }
  close() {this.ws.close();}
}
export async function withBrowser(fn,{chromePath=process.env.CHROME_PATH||'/usr/bin/chromium'}={}) {
  const profile=await mkdtemp(join(tmpdir(),'pryntor-recon-'));
  const args=['--headless=new','--disable-gpu','--disable-extensions','--disable-background-networking','--no-first-run','--no-default-browser-check','--disable-sync','--no-proxy-server','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'];
  if (process.getuid?.()===0) args.unshift('--no-sandbox');
  const child=spawn(chromePath,args,{stdio:'ignore'});
  let client;
  try {
    let port;
    for(let n=0;n<80;n++) {if(child.exitCode!==null)throw new Error('Chromium exited before ready');try {port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;} catch {await sleep(100);} }
    if(!port)throw new Error('Chromium could not start (set CHROME_PATH to an installed Chromium)');
    const list=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page=list.find(t=>t.type==='page'); if(!page)throw new Error('No browser page available');
    client=new CDP(page.webSocketDebuggerUrl);await client.open;await client.call('Page.enable');await client.call('Runtime.enable');
    return await fn(client);
  } finally {
    client?.close();child.kill('SIGKILL');await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
  }
}
async function guardPublicRequests(cdp,target){
 const host=new URL(target).hostname;
 cdp.on('Fetch.requestPaused',async p=>{
   let allowed=false;try{const u=new URL(p.request.url);allowed=['http:','https:'].includes(u.protocol)&&u.hostname===host&&!u.username&&!u.password;}catch{}
   try {await cdp.call(allowed?'Fetch.continueRequest':'Fetch.failRequest',allowed?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'});}catch{}
 });
 await cdp.call('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
}
async function evaluate(cdp, expression){const r=await cdp.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text||'Page JavaScript failed');return r.result?.value;}
async function navigate(cdp,url){const result=await cdp.call('Page.navigate',{url});if(result.errorText)throw new Error(`Browser refused navigation: ${result.errorText}`);for(let i=0;i<65;i++){try{const ready=await evaluate(cdp,'document.readyState');if(ready==='complete')break;}catch{} await sleep(100);} await sleep(220);}
export async function renderOwnedFile(cdp, file){
 if(extname(file).toLowerCase()!=='.html')throw new Error('Owned-source renderer accepts .html files only');
 const html=await readFile(resolve(file),'utf8');if(html.length>1_000_000)throw new Error('HTML fixture exceeds 1MB limit');
 await cdp.call('Network.enable');await cdp.call('Network.setBlockedURLs',{urls:['http://*','https://*','file://*']});
 await evaluate(cdp,`document.open();document.write(${JSON.stringify(html)});document.close();true`);await sleep(250);
}
const OBSERVE = `(()=>{
 const clean=s=>String(s||'').replace(/\\s+/g,' ').trim().slice(0,90);
 const isVisible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const elements=[...document.querySelectorAll('button,a,input,select,textarea,[role="button"],[role="tab"]')].filter(isVisible).slice(0,180).map((e,i)=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return {id:i,tag:e.tagName.toLowerCase(),role:e.getAttribute('role')||'',label:e.matches('input[type="password"],input[type="email"],textarea')?'[REDACTED]':clean(e.getAttribute('aria-label')||e.innerText||e.getAttribute('placeholder')||''),type:e.getAttribute('type')||'',href:e.tagName==='A'?new URL(e.href).pathname:null,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),radius:s.borderRadius,background:s.backgroundColor,color:s.color}});
 const colors=new Map();for(const e of [document.body,...document.querySelectorAll('header,nav,main,section,article,button,a,h1,h2,h3')].length>100?[document.body,...document.querySelectorAll('header,nav,main,section,article,button,a,h1,h2,h3')].slice(0,100):[document.body,...document.querySelectorAll('header,nav,main,section,article,button,a,h1,h2,h3')]){if(!isVisible(e))continue;const s=getComputedStyle(e);for(const v of [s.color,s.backgroundColor])if(v&&v!=='rgba(0, 0, 0, 0)')colors.set(v,(colors.get(v)||0)+1)}
 const headings=[...document.querySelectorAll('h1,h2,h3')].filter(isVisible).slice(0,20).map(e=>({level:Number(e.tagName[1]),text:clean(e.innerText)}));const fonts=[...new Set([document.body,...document.querySelectorAll('h1,h2,h3,button')].slice(0,20).map(e=>getComputedStyle(e).fontFamily))];
 return {title:clean(document.title),path:location.pathname, horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,viewport:{width:innerWidth,height:innerHeight},body:{background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily},headings,fonts,colors:[...colors.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([color,count])=>({color,count})),controls:elements,counts:{buttons:elements.filter(e=>e.tag==='button').length,links:elements.filter(e=>e.tag==='a').length,inputs:elements.filter(e=>['input','select','textarea'].includes(e.tag)).length},captureWarnings:[...document.querySelectorAll('input[type="password"]')].length?['Password field detected: never record input values']:[]};
})()`;
export async function capture(url,outDir,{allowHosts=[],viewports=['mobile','desktop'],chromePath,ownedFile=null}={}){
  const target=ownedFile?'owned-fixture:'+resolve(ownedFile):validateTarget(url,allowHosts),names=validateViewportNames(viewports),dir=resolve(outDir);
  await mkdir(dir,{recursive:true});
  const pages=[];
  await withBrowser(async cdp=>{if(!ownedFile)await guardPublicRequests(cdp,target);
    for(const name of names){const [width,height]=VIEWPORTS[name];await cdp.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:name==='mobile',screenWidth:width,screenHeight:height});if(ownedFile)await renderOwnedFile(cdp,ownedFile);else await navigate(cdp,target);
      const observed=await evaluate(cdp,OBSERVE);if(!observed)throw new Error('Could not inspect page');
      const screen=await cdp.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(dir,`${name}.png`),Buffer.from(screen.data,'base64'));
      pages.push({name,screenshot:`${name}.png`,...observed});
    }
  },{chromePath});
  const result={version:1,engine:'Chromium CDP',url:ownedFile?'owned-fixture (offline)':new URL(target).origin+new URL(target).pathname,createdAt:new Date().toISOString(),privacy:'Public or authorised non-sensitive demo only. No cookies, credentials or form values captured.',viewports:pages};
  await writeFile(join(dir,'capture.json'),JSON.stringify(result,null,2));return result;
}
export async function journey(url,steps,{allowHosts=[],chromePath,viewport='mobile',ownedFile=null}={}){
 const target=ownedFile?'owned-fixture:'+resolve(ownedFile):validateTarget(url,allowHosts);validateViewportNames([viewport]);if(!Array.isArray(steps)||steps.length===0||steps.length>50)throw new Error('Journey needs 1-50 steps');
 const results=[];
 if(!ownedFile)throw new Error('Automated clicks restricted to owned offline fixtures; never exercise third-party services');
 await withBrowser(async cdp=>{const [width,height]=VIEWPORTS[viewport];await cdp.call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:viewport==='mobile'});if(ownedFile)await renderOwnedFile(cdp,ownedFile);else await navigate(cdp,target);
 for(const [i,step] of steps.entries()){
  if(!['tap','visible','text','not-visible','reload'].includes(step.action))throw new Error(`Unsupported action at step ${i+1}`);
  if(step.action!=='reload'&&(typeof step.selector!=='string'||!step.selector||step.selector.length>200))throw new Error('A short selector is required');
  if(step.action==='reload'){if(ownedFile)await renderOwnedFile(cdp,ownedFile);else await navigate(cdp,target);results.push({step:i+1,action:'reload',passed:true});continue;}
  const value=await evaluate(cdp,`(()=>{const el=document.querySelector(${JSON.stringify(step.selector)});if(!el)return {exists:false};const r=el.getBoundingClientRect();return {exists:true,visible:r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden',text:el.innerText?.trim().slice(0,200)||''}})()`);
  let pass=step.action==='not-visible'?!value?.visible:!!value?.visible;
  if(step.action==='text')pass=pass&&typeof step.includes==='string'&&value.text.includes(step.includes);
  if(step.action==='tap'&&pass){await evaluate(cdp,`(()=>{const el=document.querySelector(${JSON.stringify(step.selector)});el.click();return true})()`);await sleep(130);}
  results.push({step:i+1,action:step.action,selector:step.selector,passed:pass,reason:pass?'':`Expected ${step.action}; observed ${JSON.stringify(value)}`});
  if(!pass)break;
 }
 },{chromePath});
 return {url:ownedFile?'owned-fixture (offline)':new URL(target).origin+new URL(target).pathname,viewport,passed:results.length===steps.length&&results.every(r=>r.passed),results};
}
