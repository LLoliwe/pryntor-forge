// FORGE scene format v0.1. Portable metres, zero remote calls, zero dependencies.
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

function countFor(prompt, aliases) {
  const pattern = new RegExp('(?:\\b(\\d{1,2})\\s+)?(?:' + aliases.join('|') + ')\\b', 'gi');
  let total = 0; let match;
  while ((match = pattern.exec(prompt)) !== null) total += match[1] ? Number(match[1]) : 1;
  return total;
}
export function fromPrompt(prompt) {
  if (typeof prompt !== 'string' || prompt.length > 500) throw new Error('Prompt must be text of at most 500 characters');
  const roomMatch = prompt.match(/\b(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:m|meters?|metres?)?\b/i);
  const width = roomMatch ? Number(roomMatch[1]) : 7;
  const depth = roomMatch ? Number(roomMatch[2]) : 5;
  if (width < 2 || width > 40 || depth < 2 || depth > 40) throw new Error('Room dimensions must be 2–40 metres');
  const aliases = {
    robot: ['robots?'], workbench: ['workbenches', 'workbench'], table: ['tables?'],
    chair: ['chairs?'], shelf: ['shelves', 'shelf'], tank: ['tanks?'], cabinet: ['cabinets?']
  };
  const objects = [];
  for (const [type, terms] of Object.entries(aliases)) {
    const quantity = countFor(prompt, terms);
    if (quantity > 16) throw new Error('Maximum 16 of each item');
    for (let i = 0; i < quantity; i++) {
      objects.push({ id: `${type}-${i + 1}`, type, x: 0, y: 0, rotation: 0 });
    }
  }
  if (objects.length > 45) throw new Error('Maximum 45 objects per scene');
  // Stable, reproducible placement on a two-dimensional grid.
  const cols = Math.max(1, Math.ceil(Math.sqrt(objects.length * width / depth)));
  const rows = Math.max(1, Math.ceil(objects.length / cols));
  for (let i = 0; i < objects.length; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    objects[i].x = Number(((col + .5) * width / cols - width / 2).toFixed(3));
    objects[i].y = Number(((row + .5) * depth / rows - depth / 2).toFixed(3));
  }
  return validateScene({ schemaVersion: '0.1', name: 'Pryntor FORGE Studio', room: { width, depth, height: 3.1 }, objects });
}
export function validateScene(scene) {
  if (!scene || typeof scene !== 'object' || Array.isArray(scene)) throw new Error('Scene must be an object');
  if (scene.schemaVersion !== '0.1') throw new Error('Unsupported scene version');
  if (!scene.room || !Array.isArray(scene.objects) || scene.objects.length > 45) throw new Error('Invalid room or object list');
  const {width, depth, height} = scene.room;
  if (![width,depth,height].every(x => typeof x === 'number' && Number.isFinite(x) && x >= 2 && x <= 40)) throw new Error('Room dimensions must be finite numbers from 2–40m');
  if (typeof scene.name !== 'string' || scene.name.length > 80) throw new Error('Scene name must be text up to 80 characters');
  const ids = new Set();
  for (const obj of scene.objects) {
    if (!obj || typeof obj.id !== 'string' || !/^[a-z0-9-]{1,50}$/i.test(obj.id) || ids.has(obj.id)) throw new Error('Object IDs must be unique and alphanumeric');
    ids.add(obj.id);
    if (!Object.hasOwn(components, obj.type)) throw new Error(`Unknown component type: ${String(obj.type)}`);
    if (![obj.x, obj.y, obj.rotation].every(Number.isFinite)) throw new Error('Object coordinates must be finite numbers');
    if (Math.abs(obj.x) + components[obj.type].size[0]/2 > width / 2 + 0.001 || Math.abs(obj.y) + components[obj.type].size[1]/2 > depth / 2 + 0.001) throw new Error(`Object ${obj.id} falls outside room`);
  }
  return structuredClone(scene);
}
export function removeObject(scene, id) { const next=validateScene(scene); next.objects=next.objects.filter(o=>o.id!==id); return next; }
export function addObject(scene, type) {
  if (!Object.hasOwn(components, type)) throw new Error('Invalid component type');
  const next=validateScene(scene);
  const pos=next.objects.length + 1;
  next.objects.push({id: `${type}-${pos}`,type,x:0,y:0,rotation:0});
  if (next.objects.some((o,i,a)=>a.findIndex(t=>t.id===o.id)!==i)) next.objects[next.objects.length-1].id=`${type}-${Date.now()}`;
  return validateScene(next);
}
export function cadScriptFor(type) {
  if (!Object.hasOwn(components, type)) throw new Error('Unsupported component');
  const [w,d,h]=components[type].size;
  // Simple placeholder envelopes, NOT manufactured/fit-verified CAD parts.
  return `# Pryntor FORGE parametric ENVELOPE for ${type}\n# Requires cadquery installed. Units: mm. Not a fabrication-ready design.\nimport cadquery as cq\nshape = cq.Workplane("XY").box(${Math.round(w*1000)}, ${Math.round(d*1000)}, ${Math.round(h*1000)})\ncq.exporters.export(shape, "${type}-envelope.step")\n`;
}
export function pascalHandoff(scene) {
  const s=validateScene(scene);
  return {format:'pryntor-forge/pascal-handoff-v1', units:'metres', sourceScene:s,
    instructions:'Recreate room and items in Pascal using its connected MCP tools. Verify geometry and save within Pascal; this handoff is NOT an automatic import or confirmed Pascal scene.'};
}
