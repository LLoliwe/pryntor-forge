// FORGE scene contract v0.2: deterministic, local-first spatial envelopes in metres.
// An envelope is not a CAD part, collision-tested robot, or safety certification.
const components = Object.freeze({
  robot: { size: [0.7, 0.65, 1.35], color: '#ecb44a', kind: 'equipment' },
  workbench: { size: [1.7, 0.75, 0.9], color: '#66daca', kind: 'furniture' },
  table: { size: [1.35, 0.8, 0.75], color: '#7da7ff', kind: 'furniture' },
  chair: { size: [0.55, 0.55, 0.9], color: '#e6a5ef', kind: 'furniture' },
  shelf: { size: [1.2, 0.5, 1.9], color: '#90b0c5', kind: 'storage' },
  tank: { size: [1, 1, 1.25], color: '#64a5e6', kind: 'equipment' },
  cabinet: { size: [0.85, 0.55, 1.5], color: '#9dd887', kind: 'storage' }
});
export { components };
export const examplePrompt = '7x5m makerspace with 2 workbenches, 1 robot, 2 shelves and 1 table';
export const templates = Object.freeze({
  robotics: {name: 'Robotics test cell', prompt: '8x6m robotics test cell with 2 robots, 2 workbenches and 2 cabinets', use: 'Pryntor Robotics | equipment placement rehearsal (not motion/robot safety simulation)'},
  science: {name: 'Science discovery lab', prompt: '9x7m science lab with 4 tables, 4 chairs, 2 tanks and 2 shelves', use: 'LVL7 | teaching-space storyboard (not chemistry/physics simulation)'},
  studio: {name: 'Creative production set', prompt: '10x7m creative studio with 3 tables, 4 chairs, 2 cabinets', use: 'Pryntor Studios | set-blocking prototype (not render-quality cinematics)'},
  travel: {name: 'Hospitality concept', prompt: '8x6m hospitality suite with 2 tables, 4 chairs, 2 shelves', use: 'Tirisano | room-envelope ideation (not an architectural plan)'},
  makerspace: {name: 'Maker workshop', prompt: examplePrompt, use: 'FORGE | open developer demo'}
});
const MAX_OBJECTS = 45;
const EPS = 1e-9;
const num = n => typeof n === 'number' && Number.isFinite(n);
const round = n => Number(n.toFixed(3));
function countFor(prompt, aliases) {
  const re = new RegExp('(?:\\b(\\d{1,2})\\s+)?(?:' + aliases.join('|') + ')\\b', 'gi');
  let total = 0; let match;
  while ((match = re.exec(prompt)) !== null) total += match[1] ? Number(match[1]) : 1;
  return total;
}
function geometry(scene) {
  if (!scene || typeof scene !== 'object' || Array.isArray(scene)) throw new Error('Scene must be an object');
  if (!['0.1', '0.2'].includes(scene.schemaVersion)) throw new Error('Unsupported scene version');
  if (!scene.room || typeof scene.room !== 'object' || !Array.isArray(scene.objects) || scene.objects.length > MAX_OBJECTS) throw new Error('Invalid room or object list');
  const {width, depth, height} = scene.room;
  if (![width,depth,height].every(x=>num(x)&&x>=2&&x<=40)) throw new Error('Room dimensions must be finite numbers from 2–40m');
  if (typeof scene.name !== 'string' || scene.name.length > 80) throw new Error('Scene name must be text up to 80 characters');
  const ids=new Set();
  for (const obj of scene.objects) {
    if (!obj || typeof obj.id !== 'string' || !/^[a-z0-9-]{1,50}$/i.test(obj.id) || ids.has(obj.id)) throw new Error('Object IDs must be unique and alphanumeric');
    ids.add(obj.id);
    if (!Object.hasOwn(components,obj.type)) throw new Error(`Unknown component type: ${String(obj.type)}`);
    if (![obj.x,obj.y,obj.rotation].every(num)) throw new Error('Object coordinates and rotation must be finite numbers');
    if (![0,90,180,270].includes(obj.rotation)) throw new Error('Rotation must be 0, 90, 180 or 270 degrees');
  }
  return structuredClone(scene);
}
export function footprint(obj) {
  if (!obj || !Object.hasOwn(components,obj.type) || ![0,90,180,270].includes(obj.rotation)) throw new Error('Invalid component or rotation');
  const [w,d] = components[obj.type].size;
  return (obj.rotation===90 || obj.rotation===270) ? {width:d,depth:w} : {width:w,depth:d};
}
const bounds = o=>{const d=footprint(o);return {left:o.x-d.width/2,right:o.x+d.width/2,top:o.y-d.depth/2,bottom:o.y+d.depth/2};};
const intersects=(a,b,gap=0)=>a.left<b.right+gap-EPS && a.right>b.left-gap+EPS && a.top<b.bottom+gap-EPS && a.bottom>b.top-gap+EPS;
export function auditScene(input) {
  const scene=geometry(input), outside=[],overlaps=[];
  const boxes=scene.objects.map(bounds);
  for(let i=0;i<scene.objects.length;i++) {
    const a=scene.objects[i],b=boxes[i];
    if(b.left < -scene.room.width/2-EPS||b.right > scene.room.width/2+EPS||b.top < -scene.room.depth/2-EPS||b.bottom > scene.room.depth/2+EPS)outside.push(a.id);
    for(let j=i+1;j<scene.objects.length;j++)if(intersects(b,boxes[j]))overlaps.push([a.id,scene.objects[j].id]);
  }
  const occupiedArea=round(scene.objects.reduce((sum,o)=>{const f=footprint(o);return sum+f.width*f.depth},0));
  return {status:outside.length||overlaps.length?'issues':'clear',objectCount:scene.objects.length,occupiedAreaM2:occupiedArea, floorAreaM2:round(scene.room.width*scene.room.depth), outside,overlaps,
    limitations:'Axis-aligned 2D envelope overlap only. Does not check robot paths, access clearances, structural loads, accessibility, physics or real CAD geometry.'};
}
export function validateScene(scene) {
  const copy=geometry(scene),report=auditScene(copy);
  if(report.outside.length)throw new Error(`Object ${report.outside[0]} falls outside room`);
  if(report.overlaps.length)throw new Error(`Objects overlap: ${report.overlaps[0].join(' and ')}`);
  return copy;
}
function place(scene, type, id, gap=0.12) {
  const probe={id,type,x:0,y:0,rotation:0};
  const f=footprint(probe), {width,depth}=scene.room;
  const step=Math.max(0.25,Math.min(0.8,Math.sqrt(width*depth/(scene.objects.length+1))/2));
  // Candidate grid is reproducible, prioritized across the room, and bounded.
  const choices=[];
  for(let x=-width/2+f.width/2;x<=width/2-f.width/2+EPS;x+=step)
    for(let y=-depth/2+f.depth/2;y<=depth/2-f.depth/2+EPS;y+=step)
      choices.push({x:round(x),y:round(y)});
  choices.sort((a,b)=>{
    // Place subsequent objects around centre; stable ties give repeatable scenes.
    const d=(a.x*a.x+a.y*a.y)-(b.x*b.x+b.y*b.y);
    return Math.abs(d)>EPS?d:a.y-b.y||a.x-b.x;
  });
  // Strict clearance first. Fallback to non-overlap if a denser scene requires it.
  for(const minGap of [gap,0])for(const p of choices) {
    const o={...probe,...p}; const b=bounds(o);
    if(scene.objects.every(existing=>!intersects(bounds(existing),b,minGap)))return o;
  }
  throw new Error(`No non-overlapping location for ${id}. Increase room dimensions or remove objects.`);
}
export function fromPrompt(prompt) {
  if (typeof prompt !== 'string' || prompt.length>500)throw new Error('Prompt must be text of at most 500 characters');
  const roomMatch=prompt.match(/\b(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:m|meters?|metres?)?\b/i);
  const width=roomMatch?Number(roomMatch[1]):7,depth=roomMatch?Number(roomMatch[2]):5;
  if(width<2||width>40||depth<2||depth>40)throw new Error('Room dimensions must be 2–40 metres');
  const aliases={robot:['robots?'],workbench:['workbenches','workbench'],table:['tables?'],chair:['chairs?'],shelf:['shelves','shelf'],tank:['tanks?'],cabinet:['cabinets?']};
  const requests=[];
  for(const [type,terms] of Object.entries(aliases)) {
    const n=countFor(prompt,terms);if(n>16)throw new Error('Maximum 16 of each item');
    for(let i=0;i<n;i++)requests.push({type,id:`${type}-${i+1}`});
  }
  if(requests.length>MAX_OBJECTS)throw new Error('Maximum 45 objects per scene');
  const scene={schemaVersion:'0.2',name:'Pryntor FORGE Studio',room:{width,depth,height:3.1},objects:[]};
  // Place largest first to reduce false no-fit failures.
  requests.sort((a,b)=>{const x=footprint({...a,rotation:0}),y=footprint({...b,rotation:0});return y.width*y.depth-x.width*x.depth||a.type.localeCompare(b.type)||a.id.localeCompare(b.id)});
  for(const {type,id} of requests)scene.objects.push(place(scene,type,id));
  return validateScene(scene);
}
export function addObject(input,type) {
  if(!Object.hasOwn(components,type))throw new Error('Invalid component type');
  const scene=validateScene(input);
  if(scene.objects.length>=MAX_OBJECTS)throw new Error('Maximum 45 objects per scene');
  let n=1;while(scene.objects.some(o=>o.id===`${type}-${n}`))n++;
  const id=`${type}-${n}`;
  scene.objects.push(place(scene,type,id));
  return validateScene(scene);
}
export function removeObject(input,id) {const scene=validateScene(input);scene.objects=scene.objects.filter(o=>o.id!==id);return scene;}
export function moveObject(input,id,x,y) {
  const scene=validateScene(input),obj=scene.objects.find(o=>o.id===id);
  if(!obj)throw new Error('Object not found');
  if(!num(x)||!num(y))throw new Error('Position must be finite');
  obj.x=round(x);obj.y=round(y);
  return validateScene(scene);
}
export function rotateObject(input,id) {
  const scene=validateScene(input),obj=scene.objects.find(o=>o.id===id);
  if(!obj)throw new Error('Object not found');
  obj.rotation=(obj.rotation+90)%360;
  return validateScene(scene);
}
export function cadScriptFor(type) {
  if(!Object.hasOwn(components,type))throw new Error('Unsupported component');
  const [w,d,h]=components[type].size;
  return `# Pryntor FORGE parametric ENVELOPE for ${type}\n# For text-to-cad's cadgen 0.7.21. Units: mm.\n# Not a fabrication-ready design; no collision or load verification.\nfrom cadgen import build123d as bd\nfrom cadgen import step\n\n@step(out="${type}-envelope.step")\ndef model():\n    shape = bd.Box(${Math.round(w*1000)}, ${Math.round(d*1000)}, ${Math.round(h*1000)})\n    shape.label = "${type} envelope"\n    return shape\n\nif __name__ == "__main__":\n    model()\n`;
}
export function pascalHandoff(input) {
  const scene=validateScene(input);
  return {format:'pryntor-forge/pascal-handoff-v1',units:'metres',sourceScene:scene,preflight:auditScene(scene),
    instructions:'Recreate room and items in Pascal using its connected MCP tools. Verify geometry and save within Pascal; this handoff is NOT an automatic import or confirmed Pascal scene.'};
}
