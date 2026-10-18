import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
const paths={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css','/core.mjs':'../src/core.mjs',
  '/game-environment.mjs':'../src/game/environment.mjs',
  '/labs/ocean-webgpu.html':'labs/ocean-webgpu.html'};
const standardCsp="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
function hashedInline(source,tag) {
  const re=new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/'+tag+'>','gi');
  return [...source.matchAll(re)].map(m=>"'sha256-"+createHash('sha256').update(m[1],'utf8').digest('base64')+"'");
}
function labCsp(html) {
  // The upstream self-contained HTML requires inline code, but we allow only
  // byte-for-byte hash-verified scripts/styles, never unsafe-inline or remote code.
  const scripts=hashedInline(html,'script'),styles=hashedInline(html,'style');
  if (scripts.length!==1 || styles.length!==1) throw new Error('Unexpected ocean lab bundle structure');
  return "default-src 'none'; img-src 'self' data:; script-src "+scripts.join(' ')+"; style-src "+styles.join(' ')+
    "; connect-src 'none'; object-src 'none'; worker-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
}
export function createServer() { return http.createServer(async (req,res)=>{
  const route=(req.url||'/').split('?')[0];
  const rel=paths[route];
  if (req.method!=='GET'||!rel) {res.writeHead(404,{'Content-Type':'text/plain'}); res.end('Not found'); return;}
  const f=path.resolve(root,rel); // explicit whitelist above, no user-controlled paths
  try {
    const data=await readFile(f);
    const isLab=route==='/labs/ocean-webgpu.html';
    const csp=isLab?labCsp(data.toString('utf8')):standardCsp;
    res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'text/javascript; charset=utf-8',
      'Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});
    res.end(data);
  }
  catch {res.writeHead(500,{'Content-Type':'text/plain'});res.end('Unable to load application');}
}); }
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||4173);
  if(!Number.isInteger(port)||port<1||port>65535) throw new Error('Invalid PORT');
  createServer().listen(port,'127.0.0.1',()=>console.log(`Pryntor FORGE at http://127.0.0.1:${port}`));
}
