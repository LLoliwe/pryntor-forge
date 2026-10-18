/**
 * Pryntor Game Environment Adapter (pilot, NOT a released game renderer).
 * Pure selection + game-specific art direction. No telemetry or paid dependencies.
 * The copied upstream FFT demo lives in /labs/ocean-webgpu.html and is only
 * launched as a separate reference lab when a functional WebGPU adapter exists.
 */
const presets = {
  zowibo: {
    name: 'ZOWIBO', aesthetic: 'hand-directed, tactile, saturated storybook',
    water: 'playful lagoons and splash zones', weather: 'soft clouds and readable rain',
    rules: ['Use original ZOWIBO canon', 'Water must not obstruct touch targets', 'No photoreal shader pasted into the world']
  },
  lvl7: {
    name: 'LVL7', aesthetic: 'premium science game with legible experiments',
    water: 'physically motivated appearance, separately validated educational physics',
    weather: 'simulation controls with visible cause and effect',
    rules: ['Never substitute a water shader for chemistry or fluid simulation', 'Water state and success conditions require tests']
  },
  'moon-taxi': {
    name: 'Moon Taxi', aesthetic: 'crafted Southern African night-city adventure',
    water: 'rain puddles, wet roads and reflections', weather: 'night clouds and atmospheric haze',
    rules: ['Keep characters and settings culturally grounded', 'Art-directed, not generic photorealism']
  },
  'route-zero': {
    name: 'Route Zero', aesthetic: 'Southern African journey with cinematic legibility',
    water: 'rivers, coastal scenes, rain and seasonal flooding', weather: 'dust, cloud shadows, rain',
    rules: ['Mechanics must remain playable on mobile', 'Reflect real biomes and places with reviewed references']
  },
  relicbound: {
    name: 'RELICBOUND', aesthetic: 'cinematic but performance-budgeted exploration',
    water: 'ocean crossings and shore break', weather: 'fog, rain, sun scatter',
    rules: ['Water must interact with gameplay and collision correctly', 'Visual effects must pass a performance gate']
  }
};
export const GAME_ENVIRONMENT_PRESETS = Object.freeze(
  Object.fromEntries(Object.entries(presets).map(([k,v])=>[k,Object.freeze({...v, rules:Object.freeze(v.rules)})]))
);
export function getGameEnvironment(gameId) {
  if (!Object.hasOwn(GAME_ENVIRONMENT_PRESETS, gameId)) throw new RangeError('Unsupported game environment');
  const p=GAME_ENVIRONMENT_PRESETS[gameId];
  return {...p,rules:[...p.rules]};
}
/**
 * This capability choice does not implement a WebGL2 ocean. Pending states are
 * intentionally unavailable, not incorrectly reported as a complete fallback.
 */
export function selectOceanRenderer(capabilities, {batterySaver=false,reducedMotion=false}={}) {
  if (!capabilities || typeof capabilities!=='object') throw new TypeError('Capabilities required');
  for(const key of ['webgpu','webgl2','canvas2d']) {
    if (typeof capabilities[key] !== 'boolean') throw new TypeError('Capability '+key+' must be boolean');
  }
  if (reducedMotion) return {kind:'still',ready:true,reason:'Reduced motion requested'};
  if (capabilities.webgpu && !batterySaver) return {kind:'webgpu-fft',ready:true,reason:'Working WebGPU adapter reported'};
  if (capabilities.webgl2) return {kind:'webgl2-pending',ready:false,reason:'WebGL2 ocean adaptation requires a verified separate renderer'};
  if (capabilities.canvas2d) return {kind:'canvas2d-pending',ready:false,reason:'Accessible 2D animation has not been implemented'};
  return {kind:'unsupported',ready:false,reason:'No supported rendering context'};
}
/**
 * Probe a real adapter, not just navigator.gpu presence.
 * Pass navigator/document objects explicitly for offline testing.
 */
export async function probeGraphics(nav,doc) {
  let webgpu=false,webgl2=false,canvas2d=false;
  try { if (nav?.gpu?.requestAdapter) webgpu=Boolean(await nav.gpu.requestAdapter()); } catch {}
  try {
    const canvas=doc?.createElement?.('canvas');
    if (canvas) {
      webgl2=Boolean(canvas.getContext?.('webgl2'));
      if (!webgl2) canvas2d=Boolean(canvas.getContext?.('2d'));
      else canvas2d=true;
    }
  } catch {}
  return {webgpu,webgl2,canvas2d};
}
