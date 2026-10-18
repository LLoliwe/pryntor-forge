import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const paths={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css','/core.mjs':'../src/core.mjs','/demos/ocean-forge.html':'demos/ocean-forge.html'};
export function createServer() { return http.createServer(async (req,res)=>{
  const route=(req.url||'/').split('?')[0];
  const rel=paths[route];
  if (req.method!=='GET'||!rel) {res.writeHead(404,{'Content-Type':'text/plain'}); res.end('Not found'); return;}
  const f=path.resolve(root,rel); // explicit whitelist above, no user-controlled paths
  try {
    const data=await readFile(f);
    // This one isolated, standalone procedural scene is fully self-contained.
    // Allow its inline original graphics code, but deny all network, framing
    // and object loading. Keep the existing application CSP unchanged.
    const ocean=route==='/demos/ocean-forge.html';
    const csp=ocean
      ?"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
      :"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
    res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'text/javascript; charset=utf-8','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'});
    res.end(data);
  }
  catch {res.writeHead(500);res.end('Unable to load application');}
}); }
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||4173);
  if(!Number.isInteger(port)||port<1||port>65535) throw new Error('Invalid PORT');
  createServer().listen(port,'127.0.0.1',()=>console.log(`Pryntor FORGE at http://127.0.0.1:${port}`));
}
