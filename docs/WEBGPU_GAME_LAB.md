# FORGE GPU Environment Lab R0
**Status:** isolated research pilot. **Not merged, not deployed to games, not a completed gameplay system.**
**Budget:** R0 unapproved spend. **Source:** [Noniv/web-ocean](https://github.com/Noniv/web-ocean), MIT (original author Maksymilian Dendura).

## The actual reference
- The unmodified upstream 61 KB minified, self-contained WebGPU FFT ocean is vendored at `public/labs/ocean-webgpu.html`. Only an HTML provenance/licence comment was prepended.
- Source blob: `527b6f1e36e2fd315046bb463a659d77bfd08c8f`. MIT copyright and terms are included IN the distributed HTML, not just in a separate document.
- The original demo has Tessendorf FFT water, atmospheric sunset, whitecaps, sun glitter and desktop fly camera. Do not call it a physics/gameplay engine, port to native iOS, mobile touch-tested feature or production renderer.
- FORGE's main spatial editor stays untouched. The lab is served through an explicit route with a SHA-256 hash-based Content Security Policy so its original self-contained inline script can run without opening unsafe-inline permissions for the rest of FORGE.
- This is third-party code with its own upstream maintenance. Independently review security, performance and licence before downstream inclusion.

## Local pilot commands
```bash
git checkout pilot/webgpu-water-lab-r0
npm run check
npm test
npm start
# desktop Chrome or Edge with a WORKING WebGPU adapter:
# http://127.0.0.1:4173/labs/ocean-webgpu.html
```
The existing home page remains `http://127.0.0.1:4173/`.
Experiment at low settings first. Original upstream controls: WASD move, mouse look, H environment settings. A browser feature flag does not prove an adapter or acceptable framerate.

## Separation of concerns
1. `src/game/environment.mjs` contains distinct, original art-direction presets for ZOWIBO, LVL7, Moon Taxi, Route Zero and RELICBOUND. It makes NO changes to their own repositories or released apps.
2. `probeGraphics` requires `navigator.gpu.requestAdapter()` to succeed before identifying WebGPU. The selection API fails closed with `*-pending` for unimplemented WebGL2 and Canvas2D fallbacks. **Do not route mobile players into an unavailable fallback**.
3. Rendering, deterministic physics and GAME LOGIC are different systems. An FFT shader creates ocean appearance, not boat collision, buoyancy truth, educational liquid physics or satisfying touch input.
4. A reusable environment component must eventually expose configurable `sky`, `wind`, `water`, `fog`, `camera`, `controls`, `accessibility`, `qualityBudget` and `telemetryPolicy` via a versioned scene contract in WORLDWEAVER. A production implementation must also include engine bridge to Phaser / Three / Godot as applicable, not copy whole HTML pages into games.
5. Preserve original brand canon. ZOWIBO should have art-directed stylized water; LVL7 must visualize *tested* water behaviour; Moon Taxi should prioritize rain, night lighting and Southern African environments. Generic photoreal sunset water is NOT automatically on-brand.

## Required quality gates before integration
| Area | Evidence required |
| --- | --- |
| Functionality | actual working start, restart, pause, full-screen, goals and collision; no dead buttons |
| Devices | desktop Chrome and Edge, physical iPhone Safari and Android Chrome; adapter/fallback coverage |
| Touch | on-screen movement/look, landscape and portrait handling, focus, accessibility, no clipping |
| Performance | record FPS, p95 frame time, GPU memory, startup latency, battery and thermal impact; target 60 FPS on strong devices and stable 30 FPS on accepted lower-end mobile |
| Visuals | 3 controlled camera shots, artist-reviewed brand fit, no texture seams or popping, screenshot regression baselines, independent critique |
| Rights | inherited MIT notice, dependency/asset register, Southern African reference/representation review |
| Safety | independent security scan, CSP, no unapproved spend, offline-first or strictly permitted data use |
| Child safety | LVL7 and ZOWIBO game and educator/child review including seizure-risk/motion options |

Performance numbers are *targets*, not measured results. Reduced motion must get a real still illustration in the eventual app. Do not pretend the pending mobile fallbacks exist.

## Near-term pilot work
1. **ZOWIBO:** prototype a 15-second interactive lagoon or river level with its actual character canon and a real win/restart loop, under a distinct, not photoreal, water style. Fix pre-existing touch control blockers first.
2. **LVL7:** prototype a small water environment showing light, reflections and splash effects while maintaining a separate independently checked volume/temperature/phase model.
3. **RELICBOUND:** try an ocean traverse with third-person camera, sky and shore transition. Evaluate FFT sim grid/budget and near-field collision separately.
4. **Moon Taxi / Route Zero:** use atmosphere, clouds, rain, reflections and rivers selectively, through environment presets that respect art direction.

## Acceptance definition
Accept ONLY after two independent reviews: (a) engine correctness + licence + performance and (b) game design + brand art direction + functioning controls on physical devices. The existing public GitHub FORGE release remains the stable baseline; this pilot PR must not self-merge. If a feature fails one gate, keep it in the lab, not the playable games.
