# Wes Bos 3D Model Anything: pinned R0 source intake

This directory preserves a **selected upstream source snapshot** of the scan-to-threejs skill, its support scripts and references, the MIT license and licensing information, and upstream README files. It is not the full original iPhone app or Three.js viewer. It is not an installed Pryntor service or a working FORGE import feature.

- **Original:** https://github.com/wesbos/3d-model-anything
- **Exact upstream commit:** `31b2dc9da3fb541e501f2f0936e55b32afb70ee8`
- **Code and agent skill:** MIT License, © 2026 Wes Bos. Retain LICENSE and author attribution.
- **Example assets:** The upstream MIT license excludes `data/` and `docs/images/thumb-1.png`. Consult ASSETS-LICENSE.md; neither excluded directory nor images are vendored into FORGE.

The skill explicitly depends on its original companion viewer and iPhone application. To use the **complete workflow**, obtain the full original repository at this pinned commit through an authorized, audited checkout. Do not assume the scanned office assets, photo datasets, privacy-sensitive home scans or App Store app are freely redistributable. The staged helper `fetch_textures.py` can access third-party sites, and capture helpers can invoke `agent-browser`; no helpers or downloads have been run as part of this intake.

**Default policy:** review only, no network requests, no paid APIs, no cloud uploads, no personal or child data, no new agent scheduling, and no production changes. Owner: existing FORGE spatial tooling. Canonical intake issue: https://github.com/LLoliwe/pryntor-forge/issues/19. See `docs/integrations/3d-model-anything.md` for safe test gates.
