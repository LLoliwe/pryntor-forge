# Pryntor FORGE

**Spaces meet things. An open-source, local-first scene playground for makers, robotics builders and spatial creators.**

> **Alpha / working vertical slice.** FORGE is not yet an AI CAD generator, professional CAD solver, physics simulator, or Pascal importer. The first release proves a common *scene contract*, real-time editable preview, deterministic text grammar, and safe source export.

![MIT](https://img.shields.io/badge/license-MIT-b4e776) ![Node](https://img.shields.io/badge/node-%E2%89%A520-caf178) ![Status](https://img.shields.io/badge/status-early%20alpha-49594c)

## The five-minute demo

```bash
git clone https://github.com/LLoliwe/pryntor-forge.git
cd pryntor-forge
npm start
# Open http://127.0.0.1:4173
```

No signup, API key, telemetry, cloud processing, dependencies or paid model credits. Node 20 or newer required. The included app shows an interactive isometric workshop. Orbit, zoom, select, add and remove furniture and tools. Use **Scene JSON**, **CAD envelope**, or **Pascal handoff** to download your work.

The prompt parser is intentionally bounded and deterministic. For example:

> `7x5m makerspace with 2 workbenches, 1 robot, 2 shelves and 1 table`

It parses room dimensions and supported item counts. It does **not** claim unrestricted text-to-3D AI.

## CLI

```bash
node bin/forge.mjs scene "7x5m with 2 robots and 2 workbenches" > studio.json
node bin/forge.mjs cad robot > robot-envelope.py
node bin/forge.mjs handoff studio.json > pascal-handoff.json
npm test
npm run check
```

## Architecture and integrations

```text
Text grammar -> validated scene JSON (metres) -> editable browser preview
                                             |-> export CAD envelope Python source
                                             |-> export Pascal agent handoff JSON
```

**text-to-cad by Jake Fitzgerald:** External inspiration and recommended upstream modelling tool for actual parametric CAD, STEP and STL. Repo: https://github.com/earthtojake/text-to-cad . To use its modelling skills with your agent, follow upstream installation instructions. FORGE alpha currently exports only an intentionally crude CadQuery bounding-box envelope; it does not call text-to-cad or generate manufacture-ready parts. Do not confuse a bounding envelope with structural verification.

**Pascal Editor:** External spatial modelling tool for real architecture scenes, available at https://github.com/pascalorg/editor . Follow upstream CLI and MCP installation instructions. FORGE's JSON handoff records the desired dimensions and components for an agent to recreate **after** connecting Pascal's MCP. FORGE does not directly call Pascal or certify its geometry.

Both upstream projects are MIT-licensed; FORGE contains no copied source code from either and does not imply endorsement or partnership. Respect upstream license notices if distributing modifications.

## What is real today

- Portable source-first scene with schema validation, known supported component types and object bounds.
- Local-only browser, no network calls, no build step, no runtime npm dependencies.
- Mouse/touch selection, orbit and zoom, primitive envelopes with real metre dimensions.
- Deterministic grammar, JSON scene export, parametric envelope output, Pascal handoff artifact.
- CI and tests for valid and invalid inputs.

## Not yet implemented

- Real text-to-cad plugin invocation, Pascal MCP live scene creation, file import, STEP/GLB export, collision verification, physics, mobile viewport validation, accessibility audit, scene persistence or browser-level end-to-end tests.
- No claim of manufacturing safety, production readiness or independent review.

## Road to a community-scale developer product

1. Open a public roadmap and recruit robotics, CAD, architecture and science-education maintainers.
2. Add **real** adapters to upstream CAD and Pascal toolchains, feature-detecting capabilities rather than assuming API support.
3. Add round-trip source tests: create → edit → export → import → geometric comparison.
4. Make the demo reproducible, with a one-minute walkthrough video, browser CI, docs and accessibility testing.
5. Ship 3 showcase scenes: maker workshop, science classroom, accessible apartment. Public release only after license, privacy and safety review.

**20,000 GitHub stars is an ambition, not a projected or achieved result.** We will track actual stars, unique contributors, issues resolved, weekly installs and first-time successful scenes. No purchased or artificial stars.

## Governance

MIT license. R0 infrastructure requirement. No telemetry. No private Pryntor IP, client material, customer files, secrets or proprietary creative artwork should enter the public repository. Contributions via issues and pull requests with tests and code review; no automatic merges.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [docs/ROADMAP.md](docs/ROADMAP.md).

## Research engine v0.3 (experimental, opt-in)

FORGE now has **inspectable computational-geometry and constraint-search primitives**, not just a rendered set. The API has no model keys, tracking, paid services or external dependencies.

```sh
node bin/forge.mjs route examples/research-route.json
node bin/forge.mjs synthesize examples/research-layout.json
node bin/forge.mjs robustness examples/research-route.json
npm run check && npm test
```

- `planRoute`: integer-mm static 2D axis-aligned clearance planning on a finite rectilinear critical-coordinate graph, with deterministic shortest paths **within that graph**, a waypoint list and a rechecked segment report.
- `verifyRoute`: independently callable geometric contract checker against an existing scene, checking clearance, blocked waypoints, diagonal segments and crossings. It shares modelling assumptions with the planner, so it is **not** an external formal verifier.
- `synthesizeLayout`: bounded finite-grid backtracking, quarter-turn candidate orientations and spacing rules. Explicit `satisfiable`, `unsatisfiable` (only in the discretized domain) and `unknown` (search budget exhausted) states.
- `clearanceEnvelope`: sampled clearance sensitivity, never represented as an exact physical robustness bound.

The browser now has a local **Research Engine** inspector: adjust start/goal positions and an envelope proxy, compute a route, draw it over the scene and export the evidence. The interface has no claim of robot navigation safety, architectural egress approval, continuous motion, or engineering certification. Start from the five free venture blueprints. The test suite includes a separate analytic collision oracle across 250 seeded test cases and explicit finite-domain UNSAT-versus-UNKNOWN checks. See [Research Method and Limits](docs/RESEARCH_ENGINE.md) for explicit assumptions, the threat model, evidence gates and failure tests.
