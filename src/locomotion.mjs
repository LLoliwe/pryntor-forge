/** Original, deterministic 2D locomotion for WORLDWEAVER.
 * Not learned motion matching, mocap, or a substitute for native rig evaluation.
 * Stride phase advances with actual world displacement to reduce planted-foot sliding.
 */
const STRIDE_PX = 48;
const finite = v => typeof v === 'number' && Number.isFinite(v);
const frac = v => ((v % 1) + 1) % 1;
export function newGait() {
  return { x: null, phase: 0, facing: 1, deaths: 0, travelled: 0 };
}
export function advanceGait(gait, player, deaths = 0) {
  if (!player || !finite(player.x) || !finite(player.vx) || typeof player.grounded !== 'boolean' || !Number.isInteger(deaths) || deaths < 0) throw new Error('Invalid gait input');
  const dx = gait.x === null ? 0 : player.x - gait.x;
  const teleported = gait.x === null || Math.abs(dx) > 60 || deaths !== gait.deaths;
  if (teleported) { gait.phase = 0; gait.travelled = 0; }
  else if (player.grounded) { gait.phase = frac(gait.phase + Math.abs(dx) / STRIDE_PX); gait.travelled += Math.abs(dx); }
  gait.x = player.x;
  gait.deaths = deaths;
  gait.facing = player.facing === -1 ? -1 : 1;
  return sampleGait(gait, player);
}
function foot(phase, facing, grounded, active) {
  if (!grounded) return { x: 0, y: -5 };
  if (!active) return { x: 0, y: 0 };
  const t = frac(phase);
  if (t < .5) return { x: facing * (12 - 48 * t), y: 0 };
  const u = (t - .5) * 2;
  return { x: facing * (-12 + 24 * u), y: -9 * Math.sin(Math.PI * u) };
}
export function sampleGait(gait, player, reducedMotion = false) {
  const active = player.grounded && Math.abs(player.vx) >= 14 && !reducedMotion;
  const left = foot(gait.phase, gait.facing, player.grounded, active);
  const right = foot(gait.phase + .5, gait.facing, player.grounded, active);
  return { left, right, bob: active ? 1.5 * Math.abs(Math.sin(2 * Math.PI * gait.phase)) : 0, active, phase: gait.phase };
}
