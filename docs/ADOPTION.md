# FORGE adoption contract for Pryntor ventures

**Status:** v0.2 internal evaluation. Not an authorization for automatic release or production integrations.

The shared component contract is open-source. Private customer data, ZOWIBO IP, proprietary production designs, unannounced business plans, developer tokens, and commercial venture datasets must never appear in the public FORGE repository.

## Reusable capabilities available now

1. A dimensioned room containing typed, rotatable, movable 2D footprints and bounding-height envelopes.
2. Reproducible placement, strict JSON validation, overlap and boundary checks, and machine-readable preflight reports.
3. A zero-network browser demonstration with five representative scene blueprints.
4. Export of reproducible source JSON, simplified cadgen Python envelopes, and **unexecuted** Pascal handoff instructions.

### Pilot matrix

| Venture | First bounded use | Acceptance evidence | Explicitly out of scope |
|---|---|---|---|
| Pryntor Robotics | Robotics test-cell equipment layout | Import a test-cell scene, move robot envelopes, reject overlap, save audit | Robot dynamics, MuJoCo, movement safety, or real-world controls |
| LVL7 | Science classroom staging | Import science lab, rerender, measure footprint and export | Chemistry, water flow, child safety certification |
| Pryntor Studios | Previsualization scene blocking | Export editable source for editorial team review | Cinematic-quality rendering, licensed assets |
| Tirisano Travel | Hospitality room concept | JSON source + auditable spatial envelope | Building-code, structural, accessibility or architectural signoff |
| ZOWIBO / Game Studios | Non-public set-blocking R&D only | Private scene demonstrator, original assets retained privately | Using private character IP in public examples |
| Pryntor Lens | Future room/context source | Privacy/security review before any capture or location integration | Camera capture and personal environment upload |
| Pryntor Recover / Partnerships | No spatial integration necessary | Documented opt-out | Shipping arbitrary feature just for coverage |

## Company-wide gates

- **Discover:** A venture owner records a real use case, reusable needs, and alternatives.
- **Build:** Use a pinned FORGE revision and copy only public-safe, self-contained model data.
- **Verify:** Run `npm run check`, `npm test`, `node bin/forge.mjs audit examples/<venture>.json`; record before/after results and visual browser QA.
- **Independently review:** A reviewer checks provenance, IP isolation, privacy, copyright, accessibility, functional utility and failure modes. The author/agent cannot self-approve.
- **Integrate:** Only the relevant venture's owner authorizes a release. No automatic merges, production deployments or new cost obligations.
- **Learn:** Record rejected cases, first-error traces, measurable outcomes and failure classifications for the next iteration.

## What earns a wider rollout

Real source round-tripping, verified upstream CAD generation, actual Pascal MCP invocation, accessibility and browser E2E tests, license checks, a playable demo, and useful third-party feedback. 20,000 GitHub stars is an ambition, not a fact or a prediction. Public claims must distinguish a spatial envelope from engineering correctness.
