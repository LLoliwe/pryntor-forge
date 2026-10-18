# SceneBridge / CINEMA R1

**Status: isolated experimental source, not a published or verified production website.** First clean dependency installation and Vite build are tested in the GitHub Actions pilot after commit; native Unreal Engine import remains independent.

This experiment is an original editorial 3D frontend for SceneBridge. It is separate from the existing FORGE browser, and deliberately includes no proprietary private-brand art or third-party film/TV intellectual property.

## Stack and dependency decisions

- React, ReactDOM and Three.js: interactive browser rendering.
- @react-three/fiber: React WebGL scene binding.
- @react-three/drei: OrbitControls, contact shadow and geometry helpers.
- @react-three/postprocessing: subtle Bloom and Vignette passes; disable on slow devices before release if needed.
- @theatre/core: future film-style shot sequencing contract. Instantiated in the prototype but **no finished keyframed Theatre animation is claimed**. Camera motion currently authored in a controlled R3F update loop.
- @14islands/r3f-scroll-rig/scrollbar: optional smooth editorial scroll enhancement, disabled for reduced-motion preference. This demo uses only scrollbar mode, not full scroll-linked WebGL composition.
- MaterialX, from ASWF, is explicitly **research/evaluation only**, not vendored or installed. Feature-film material interchange requires a dedicated engine proof and rights review.

Upstream code was not copied. Project package dependency installs use npm, licensed source is downloaded from the public registry in GitHub Actions only. Upstream licences: React/Three/Fiber/Drei/scroll-rig/postprocessing MIT and Theatre Core Apache 2.0. Verify the final full transitive licence inventory and vulnerability scan before commercial redistribution. **Do not include @theatre/studio** without approving its AGPL-related redistribution/host implications. Do not assume that the main Theatre library's Apache licence covers that studio package.

## Try locally

Requires Node >=20.19.0 and internet access to npm registry for the first install:

    cd experiments/scenebridge-cinema
    npm install --no-audit --no-fund
    npm run check
    npm run dev

Open the localhost URL printed by Vite. No cloud AI or paid API calls. Remote Google font load is currently an optional visual enhancement, not self-hosted or licensed for a release build. If npm is not reachable, installation must be marked BLOCKED and not claimed.

The demo shows an original procedural room. Drag to orbit, scroll to zoom, use the three material moods, play/pause the designed camera and export study metadata. It does **not** export a UE5-ready material graph or verify a Blender round-trip. Desktop browser, physical Safari, shader parity, accessibility and WebGL fallbacks need their own independently documented checks.

## Merge and release gate

1. npm dependency install + Vite build succeeds on an isolated CI host at the exact commit.
2. Dependency licence, vulnerable package, transitive dependencies and provenance review; record versions/lockfile when possible. No version ranges promoted to production without a generated lockfile.
3. Independent visual review, cross-browser, mobile Safari, keyboard, reduced-motion, contrast, frame-time and memory check.
4. Rights/branding/creative director approval and a private client-style demo.
5. Independent developer security review, explicit venture owner approval and authorised merge and release. Draft PRs may not self-approve or publish.
6. R0 unapproved spend and no hidden third-party API keys, private assets or customer information.

Company source governance: docs/GIT_DEPARTMENT.md. Existing SceneBridge R0 backend contract: docs/SCENEBRIDGE.md.
