# FORGE Research Engine v0.3: Methods, assumptions and falsifiable claims

**Status**: Experimental public-alpha proposal. Not peer-reviewed. Not a manufacturing tool, registered engineering deliverable, building safety tool or robotics safety controller. No claims of PhD research output or certified correctness.

## Research thesis

A creator should be able to describe a bounded spatial scenario, receive a reproducible *computational answer*, and distinguish an actually valid result from a solver budget failure or a model limitation. The value is not a glossy editor, but explainable geometry, defined constraints, measurable guarantees and exportable evidence.

## Model M: integer-mm, static, 2.5D

- Scene uses metre-valued (x, y) centres. Every query quantises locations to integer millimetres with `round(x*1000)`; object bounding-box widths can have half-millimetre boundaries.
- Bodies are static axis-aligned boxes with fixed ground footprints. `rotation` is 0, 90, 180, or 270 degrees. Height is a displayed envelope only.
- The navigable agent is another bounding rectangle with a **fixed orientation**. There is no configuration-space rotation, articulation, robot dynamics, acceleration, terrain, friction, sensing error, or uncertainty distribution.
- Navigation obstacles are inflated by the agent's half-footprint in x and y and a user-specified clearance. A conservative additional 1 mm is applied to avoid boundary-contact ambiguity.
- All rectangle predicates include those conservative inflated contact boundaries; no route may pass through an inflated obstacle. Model precision is 1 mm, **not** real measurement accuracy.

## Algorithm A: rectilinear routing

1. Validate a scene and quantise start/goal.
2. Shrink room boundaries by the agent footprint and the requested clearance.
3. Inflate obstacles by the footprint and clearance.
4. Assemble sorted critical x/y coordinates: start/goal, navigable room boundaries, and one millimetre outside each obstacle support line.
5. Form an orthogonal grid and reject vertices inside expanded obstacles or outside the navigable room. Reject segments that touch expanded obstacles.
6. Run deterministic Dijkstra on adjacent unobstructed grid vertices, with integer-mm Manhattan edge weights. Simplify collinear waypoints.
7. Revalidate the returned polyline with `verifyRoute`. A mismatch aborts rather than claiming success.

**Supported optimization claim:** returned path is shortest **on this finite enumerated graph** given the graph construction and Dijkstra implementation. No global continuous-time robot-optimality or independent proof is claimed. When no graph route exists, report `blocked`; for excessive grid size, report `unknown` rather than manufacture a route.

## Algorithm B: constrained room synthesis

- Inputs: bounded room, up to 12 unique known objects, grid step 0.1–2.0 m, clearance, optional 0/90-degree orientation, and a strict node budget.
- Object domains: every allowable sampled centre per orientation inside room bounds, converted to integer mm, sorted by centrality for fast feasible-first exploration.
- Search: deterministic depth-first backtracking, largest footprints first; pairwise inflated rectangle checks prune invalid assignments; no self-selected success claims.
- Output: `satisfiable` + checked scene, `unsatisfiable` + domain and explored-node evidence **only if exhausted**, or `unknown` + budget evidence.
- Scope of UNSAT: no valid assignment *on the enumerated lattice*, not proof that arbitrary continuous coordinates or other shape orientations are impossible. The search is finite and complete only under its explicitly sampled candidate domain, assuming no implementation bug.

## What tests falsify

- Unit and regression checks: invalid/colliding rooms, diagonal paths, intersecting obstacles, valid/invalid route endpoints, deterministic outputs, old scene schemas.
- Seeded metamorphic tests: 200 reproducible generated geometry cases checked through the exported checker. An additional **separately authored analytic oracle** in `tests/oracle.test.mjs` evaluates 250 generated cases with an independent interval-overlap implementation plus checks synthesized pair clearances. This reduces shared-code verification blind spots but is still not an external or formal proof. Reversing an obstacle-free route preserves its length; results cannot be shorter than the Manhattan lower bound.
- Solver trichotomy tests: feasible, demonstrably finite-domain infeasible, budget-exhausted/unknown. Never relabel unknown as unsat.
- GitHub CI: Node.js 22 `npm run check` and `npm test`. Manual browser UI smoke test runs in an offline Chromium harness; no live hosted route has been certified.

## What remains research work

1. **Oracle evaluation:** compare answers on a public synthetic corpus against an externally reviewed geometric validator and an optimization baseline (e.g. exact mixed-integer model where feasible). Save counterexamples and seed numbers.
2. **Continuous geometry:** exact predicates with independently reviewed computational geometry libraries; arbitrary polygons, rotations, topology and clearance proofs.
3. **True robot path planning:** kinodynamics, swept volumes, turn radius, dynamic obstacles, localization uncertainty, and simulator-ground-truth, then external robotics expert review. Until then: visualization and offline layout reasoning only.
4. **Human accessibility and building compliance:** standards-specific requirements, country/region and licensed professionals. No automated building-code or access certification.
5. **CAD & Pascal:** execute genuine upstream runtimes, compare reconstructed dimensions and provenance, and test edited round trips against geometric metrics. A generated Python envelope is not sufficient.
6. **Benchmark disclosure:** publish speed, memory, failures, hardware/version/seed, full methodology, partial tests and independent reviewer notes; do not cherry-pick one impressive demo.

## Privacy, IP, cost and governance

Only synthetic, public-safe geometry belongs in the public repo. No private creative IP, plans, personal captured spaces, customers or credentials. R0 unapproved spend. Changes require independent review, CI, reproducible reports and a tested rollback; CI green alone does not permit production deployment. The 20,000-star ambition is a community adoption metric, not a performance claim.
