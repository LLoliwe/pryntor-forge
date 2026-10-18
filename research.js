/**
 * FORGE Research Engine, v0.3 experimental.
 * Integer millimetre geometry, deterministic finite-lattice constraint solving,
 * and axis-aligned continuous-free-space routing on a critical-coordinate grid.
 * No implication of formal verification, manufacturability, or robot safety.
 */
import {components, validateScene} from './core.js';

const UNIT = 1000;
const mm = (value, label = 'coordinate') => {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 40000)
    throw new Error(`${label} must be a finite metre value`);
  return Math.round(value * UNIT);
};
const metres = n => Number((n / UNIT).toFixed(3));
const integer = (v, lo, hi, name) => {
  if (!Number.isInteger(v) || v < lo || v > hi) throw new Error(`${name} must be an integer from ${lo} to ${hi}`);
  return v;
};
const bounded = (value, min, max, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error(`${name} must be finite between ${min} and ${max} metres`);
  return mm(value, name);
};
const footprintMM = (type, rotation) => {
  if (!Object.hasOwn(components, type)) throw new Error(`Unknown component: ${String(type)}`);
  if (![0, 90, 180, 270].includes(rotation)) throw new Error('Invalid quarter-turn rotation');
  const [w, d] = components[type].size.map(x => mm(x));
  return rotation % 180 ? [d, w] : [w, d];
};
function rectOf(obj, inflation = 0) {
  const [w, d] = footprintMM(obj.type, obj.rotation);
  const x = mm(obj.x), y = mm(obj.y);
  // 1mm quantisation: half widths can be fractional, deliberately conserved.
  return {id: obj.id, l: x - w/2 - inflation, r: x + w/2 + inflation,
    t: y - d/2 - inflation, b: y + d/2 + inflation};
}
const isInside = (r, x, y) => x >= r.l && x <= r.r && y >= r.t && y <= r.b;
const intersects = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
const segmentHits = (a, b, r) => {
  if (a.x === b.x) return a.x >= r.l && a.x <= r.r && Math.max(a.y,b.y) >= r.t && Math.min(a.y,b.y) <= r.b;
  if (a.y === b.y) return a.y >= r.t && a.y <= r.b && Math.max(a.x,b.x) >= r.l && Math.min(a.x,b.x) <= r.r;
  return true; // diagonal segments are not permitted
};
const roomBounds = (scene, [w,d] = [0,0], margin = 0) => ({
  l: -mm(scene.room.width)/2 + w/2 + margin,
  r: mm(scene.room.width)/2 - w/2 - margin,
  t: -mm(scene.room.depth)/2 + d/2 + margin,
  b: mm(scene.room.depth)/2 - d/2 - margin
});
const xy = p => {
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('Waypoint must have x and y in metres');
  return {x:mm(p.x, 'waypoint x'),y:mm(p.y, 'waypoint y')};
};
const metric = points => points.slice(1).reduce((sum,p,i)=>sum + Math.abs(p.x-points[i].x)+Math.abs(p.y-points[i].y),0);
const orthogonal = (a,b) => a.x === b.x || a.y === b.y;

/**
 * Validity of a polyline against the SAME clearance geometry as the planner.
 * This is a secondary checker, not an independent formal proof system.
 */
export function verifyRoute(input, waypoints, options = {}) {
  const scene = validateScene(input);
  const clearance = bounded(options.clearanceM ?? 0.15, 0, 3, 'clearanceM') + 1;
  const type = options.agentType ?? 'robot';
  const shape = footprintMM(type, options.rotation ?? 0);
  const valid = roomBounds(scene, shape, clearance);
  if (!Array.isArray(waypoints) || waypoints.length < 2 || waypoints.length > 20000)
    return {valid:false, reason:'Route needs at least two and at most 20000 waypoints'};
  const points = waypoints.map(xy), walls = scene.objects.filter(o=>o.id!==options.ignoreId)
    .map(o=>rectOf(o, clearance)).map(r=>({id:r.id,l:r.l-shape[0]/2,r:r.r+shape[0]/2,t:r.t-shape[1]/2,b:r.b+shape[1]/2}));
  for (let i=0;i<points.length;i++) {
    const p=points[i];
    if (!isInside(valid,p.x,p.y)) return {valid:false,reason:`Waypoint ${i} outside navigable room`};
    const hit=walls.find(o=>isInside(o,p.x,p.y));
    if (hit) return {valid:false,reason:`Waypoint ${i} blocked by ${hit.id}`};
    if (i && !orthogonal(points[i-1],p)) return {valid:false,reason:`Segment ${i} is diagonal`};
    const crossing=i && walls.find(o=>segmentHits(points[i-1],p,o));
    if (crossing) return {valid:false,reason:`Segment ${i} crosses ${crossing.id}`};
  }
  return {valid:true, lengthM:metres(metric(points)), clearanceM:options.clearanceM ?? 0.15, segments:points.length-1};
}

/**
 * Exact on the specified 1mm rectilinear planning model: route nodes use
 * start/goal and all obstacle support coordinates. A Dijkstra search then
 * minimizes Manhattan path length on this finite critical-coordinate graph.
 * It is NOT a kinodynamic route, continuous rotation plan, or physical proof.
 */
export function planRoute(input, start, goal, options = {}) {
  const scene=validateScene(input);
  const a=xy(start), z=xy(goal);
  const clearanceM=options.clearanceM ?? 0.15;
  const extra=bounded(clearanceM,0,3,'clearanceM') + 1;
  const agentType=options.agentType ?? 'robot';
  const shape=footprintMM(agentType,options.rotation ?? 0);
  const boundary=roomBounds(scene,shape,extra);
  const blockers=scene.objects.filter(o=>o.id!==options.ignoreId).map(o=>{
    const r=rectOf(o,extra);
    return {...r,l:r.l-shape[0]/2,r:r.r+shape[0]/2,t:r.t-shape[1]/2,b:r.b+shape[1]/2};
  });
  for(const [name,p] of [['start',a],['goal',z]]) {
    if(!isInside(boundary,p.x,p.y))return {status:'blocked',reason:`${name} lies outside the navigable bounds`,lengthM:null};
    const obstacle=blockers.find(b=>isInside(b,p.x,p.y));
    if(obstacle)return {status:'blocked',reason:`${name} intersects ${obstacle.id}`,lengthM:null};
  }
  if(a.x===z.x && a.y===z.y) {
    // Retain two points so verifyRoute has a simple public contract.
    return {status:'clear',waypoints:[start,goal],lengthM:0,clearanceM,method:'integer-mm rectilinear visibility grid'};
  }
  // Avoid the quadratic intersection graph: only adjacent support lines matter.
  const xs=new Set([a.x,z.x,boundary.l,boundary.r]);
  const ys=new Set([a.y,z.y,boundary.t,boundary.b]);
  for (const r of blockers) {
    for(const v of [Math.floor(r.l)-1,Math.ceil(r.r)+1])if(v>=boundary.l&&v<=boundary.r)xs.add(v);
    for(const v of [Math.floor(r.t)-1,Math.ceil(r.b)+1])if(v>=boundary.t&&v<=boundary.b)ys.add(v);
  }
  const X=[...xs].sort((u,v)=>u-v),Y=[...ys].sort((u,v)=>u-v);
  const nx=X.length, ny=Y.length, count=nx*ny;
  if(count>12000) return {status:'unknown',reason:'Critical-coordinate graph exceeds 12,000 nodes',lengthM:null};
  const nodes=new Uint8Array(count);
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
    const x=X[i],y=Y[j];nodes[i*ny+j]=Number(isInside(boundary,x,y)&&!blockers.some(b=>isInside(b,x,y)));
  }
  const sx=X.indexOf(a.x),sy=Y.indexOf(a.y),gx=X.indexOf(z.x),gy=Y.indexOf(z.y);
  const origin=sx*ny+sy,target=gx*ny+gy;
  const dist=new Float64Array(count).fill(Infinity), prev=new Int32Array(count).fill(-1);
  const heap=[];
  const push=(d,v)=>{let i=heap.length;heap.push([d,v]);while(i){const p=(i-1)>>1;if(heap[p][0]<d||(heap[p][0]===d&&heap[p][1]<=v))break;heap[i]=heap[p];i=p;}heap[i]=[d,v];};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let l=2*i+1,r=l+1;if(l>=heap.length)break;let j=r<heap.length&&(heap[r][0]<heap[l][0]||(heap[r][0]===heap[l][0]&&heap[r][1]<heap[l][1]))?r:l;if(heap[j][0]>last[0]||(heap[j][0]===last[0]&&heap[j][1]>=last[1]))break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;};
  dist[origin]=0;push(0,origin);
  let visited=0;
  while(heap.length){
    const [d,u]=pop();if(d!==dist[u])continue;
    visited++;if(u===target)break;
    const i=Math.floor(u/ny),j=u%ny,p={x:X[i],y:Y[j]};
    for(const [ii,jj] of [[i-1,j],[i+1,j],[i,j-1],[i,j+1]]){
      if(ii<0||jj<0||ii>=nx||jj>=ny)continue;
      const v=ii*ny+jj;if(!nodes[v])continue;
      const q={x:X[ii],y:Y[jj]};if(blockers.some(b=>segmentHits(p,q,b)))continue;
      const delta=Math.abs(p.x-q.x)+Math.abs(p.y-q.y),nd=d+delta;
      if(nd<dist[v]){dist[v]=nd;prev[v]=u;push(nd,v);}
    }
  }
  if(!Number.isFinite(dist[target]))return {status:'blocked',reason:'No rectilinear clearance path exists in the critical-coordinate graph',lengthM:null,visitedNodes:visited};
  const raw=[];let n=target;
  while(n!==-1){raw.push({x:X[Math.floor(n/ny)],y:Y[n%ny]});n=prev[n];}
  raw.reverse();
  const turns=raw.filter((p,i)=> i===0||i===raw.length-1||!
    ((p.x===raw[i-1].x&&p.x===raw[i+1].x)||(p.y===raw[i-1].y&&p.y===raw[i+1].y)));
  const waypoints=turns.map(p=>({x:metres(p.x),y:metres(p.y)}));
  const verification=verifyRoute(scene,waypoints,{...options,clearanceM,agentType});
  if(!verification.valid)throw new Error(`Internal route verification failed: ${verification.reason}`);
  return {status:'clear',waypoints,lengthM:metres(dist[target]),clearanceM,method:'integer-mm rectilinear visibility grid',visitedNodes:visited,
    qualifications:'Shortest on enumerated rectilinear critical-coordinate graph only; static obstacles, axis-aligned footprints, no dynamics.'};
}

/**
 * A bounded finite-domain constraint solver. An UNSAT result applies ONLY to the
 * enumerated grid/orientation domain. Timeout is UNKNOWN, not UNSAT.
 */
export function synthesizeLayout(spec) {
  if (!spec || typeof spec!=='object' || Array.isArray(spec) || !spec.room || !Array.isArray(spec.objects))throw new Error('Invalid layout specification');
  const {width,depth,height=3.1}=spec.room;
  for(const [name,value] of [['width',width],['depth',depth],['height',height]])bounded(value,2,40,name);
  const step=bounded(spec.stepM ?? 0.5,0.1,2,'stepM');
  const clearance=bounded(spec.clearanceM ?? 0.1,0,2,'clearanceM');
  const nodeLimit=integer(spec.nodeLimit ?? 30000,1,1000000,'nodeLimit');
  if(spec.objects.length>12)throw new Error('Research solver supports at most 12 components per run');
  const ids=new Set(),items=spec.objects.map(o=>{
    if(!o||typeof o.id!=='string'||!/^[a-z0-9-]{1,50}$/i.test(o.id)||ids.has(o.id))throw new Error('Layout IDs must be unique, nonempty, alphanumeric');
    ids.add(o.id);if(!Object.hasOwn(components,o.type))throw new Error(`Unknown component: ${String(o.type)}`);
    return {id:o.id,type:o.type};
  });
  const base={schemaVersion:'0.2',name:typeof spec.name==='string'?spec.name:'FORGE research layout',room:{width,depth,height},objects:[]};
  validateScene(base);
  // Search largest area first; all candidate coordinates are snapped to an integer-mm lattice.
  items.sort((a,b)=>{const [aw,ad]=footprintMM(a.type,0),[bw,bd]=footprintMM(b.type,0);return bw*bd-aw*ad||a.type.localeCompare(b.type)||a.id.localeCompare(b.id);});
  const rotations=spec.allowRotation===false?[0]:[0,90];
  const candidates=new Map();
  for(const item of items){
    const domain=[];
    for(const rotation of rotations){
      const [w,d]=footprintMM(item.type,rotation);
      const bound=roomBounds(base,[w,d],0);
      // x,y anchored to lower room edge + half envelope, with constant step.
      for(let x=bound.l;x<=bound.r;x+=step)for(let y=bound.t;y<=bound.b;y+=step) {
        const o={...item,rotation,x:metres(x),y:metres(y)};
        // Quantisation in a 0.5mm origin is conservatively handled by rectOf.
        const r=rectOf(o);
        if(r.l>=-mm(width)/2&&r.r<=mm(width)/2&&r.t>=-mm(depth)/2&&r.b<=mm(depth)/2)
          domain.push({o,r});
      }
    }
    domain.sort((a,b)=>(Math.abs(a.o.x)+Math.abs(a.o.y))-(Math.abs(b.o.x)+Math.abs(b.o.y))||a.o.rotation-b.o.rotation||a.o.y-b.o.y||a.o.x-b.o.x);
    candidates.set(item.id,domain);
  }
  const chosen=[];let nodesVisited=0,exhausted=false;
  function dfs(index) {
    if(index===items.length)return true;
    for(const c of candidates.get(items[index].id)){
      if(nodesVisited>=nodeLimit){exhausted=true;return false;}
      nodesVisited++;
      if(chosen.some(existing=>intersects({l:existing.r.l-clearance/2,r:existing.r.r+clearance/2,t:existing.r.t-clearance/2,b:existing.r.b+clearance/2},
        {l:c.r.l-clearance/2,r:c.r.r+clearance/2,t:c.r.t-clearance/2,b:c.r.b+clearance/2})))continue;
      chosen.push(c);
      if(dfs(index+1))return true;
      chosen.pop();
      if(exhausted)return false;
    }
    return false;
  }
  const found=dfs(0);
  const domainSize=Object.fromEntries(items.map(x=>[x.id,candidates.get(x.id).length]));
  const certificate={model:'finite sampled mm-grid, axis-aligned rectangular envelope',stepM:metres(step),clearanceM:metres(clearance),allowRotation:spec.allowRotation!==false,
    domainSize,nodesVisited,nodeLimit,guarantee:'UNSAT applies only to this explicitly enumerated domain; UNKNOWN means budget exhausted.'};
  if(!found)return {status:exhausted?'unknown':'unsatisfiable',certificate};
  base.objects=chosen.map(c=>c.o);const scene=validateScene(base);
  return {status:'satisfiable',scene,certificate};
}

export function clearanceEnvelope(input, start, goal, opts={}) {
  // A reproducible robustness sweep, not a globally certified maximum clearance.
  const values=opts.clearancesM ?? [0,0.05,0.1,0.15,0.25,0.5];
  if(!Array.isArray(values)||values.length<1||values.length>30)throw new Error('Provide 1–30 clearance samples');
  const samples=values.map(c=>({clearanceM:c,...(({status,lengthM,reason})=>({status,lengthM,reason}))(planRoute(input,start,goal,{...opts,clearanceM:c}))}));
  return {samples,maxPassingSampleM:samples.filter(x=>x.status==='clear').reduce((m,x)=>Math.max(m,x.clearanceM),-1),
    limitations:'Sampled clearances are not a continuous robustness certificate; route model is axis aligned and static.'};
}
