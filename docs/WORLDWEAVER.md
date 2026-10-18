# Pryntor WORLDWEAVER v0.1 | playable-world experiment

**Status: draft-only prototype, not public-ready or automatically image-to-game.**

## Run and verify

Start FORGE with Node 20+ using npm start, then visit http://127.0.0.1:4173/worldweaver. Play with A/D or arrows, jump with Space or up, and use mobile touch controls. Tap Edit to place platforms, gems and moving hazards, then export world JSON. Run npm test and npm run check.

Importing a PNG, JPEG or WebP under 8 MB is rights-gated and local. It becomes a composited background. It is not a segmented character layer. Export excludes raw image bytes, so a visual scene using imported art cannot round-trip through JSON without the source file. We do not claim inference of hidden pixels or full image-to-game conversion.

The proof is original code: no upstream Pixi2D files, copyrighted third-party sprites, cloud credentials, telemetry, build-step downloads or metered inference are involved.

## Beyond a pretty animation

The reusable source contract in src/worldweaver.mjs separates deterministic physics, pickups, moving hazards, camera and finish conditions from the renderer. Scene edits are validated, game rules can be replayed against a fixed clock, and the browser renderer remains replaceable. AI can eventually propose a scene, but independent tests, human reviewers and rights gates must certify it.

## Company-wide pilots

- **ZOWIBO:** flagship proprietary-IP playable story using privately stored, rights-cleared mascot layers, age-appropriate agency and guardian/educator checks.
- **LVL7:** chemistry/biology exploratory lessons with scientifically separate simulation and pedagogy checks. Game physics is not a science engine.
- **Game Studios / RELICBOUND:** mechanic and level-loop tests before committing to full production engine.
- **Pryntor Studios / AFTERLIGHT:** layered animation boards, camera choreography and motion studies; not production-video fidelity proof.
- **FORGE:** reusable MIT generic schema and accessible creator canvas without proprietary IP leaks.
- **ATLAS:** evidence-backed private proof for licensing/pilots, after signoff. No invented customers or revenue.

## 100x quality gates, not a 100x result claim

1. Image intake: immutable reference, hash, original dimensions, license, perceptual comparisons and authorized artwork.
2. Independent object ownership: segmentation/mattes, pivots, layering, original-pixel protection and explicitly disclosed inferred occlusion.
3. Meaningful gameplay: mobile feel, jump reachability, moving threats, checkpoints, state machines, sound, user-friendly reset, optional recording.
4. Directed storytelling: authored characters and dialog, learning objectives, safe achievements and fair play.
5. Evidence-driven iteration: deterministic replay, Chromium/WebKit canvas comparisons, independent reviewer, accessibility and low-end frame budgets, child privacy.
6. Productization: ZOWIBO private IP pilot, API/scene format, opt-in generic examples and licensing only after approval.

## Blocking gates now

- No independently verified browser rendering or mobile-device QA.
- No AI segmentation, occlusion completion, sprite animation, visual reference-match or full import/reimport round trip.
- No signoff on child safety, brand rights, license review, accessibility or commercial validation.
- No production deployment, paid service, auto-merge or customer claims.

## Upstream inspiration

The public img2threejs/pixi2d repository documents an editable reference-image reconstruction workflow. Its README says it is not automatic segmentation or inpainting. We drew on its separation/provenance principles without copying source or visuals. Any future direct reuse requires license review.

Governance: R0 unapproved spend, no secrets or private artwork in public FORGE, independent QA before merge.