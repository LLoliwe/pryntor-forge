# Optional 3D reconstruction research: 3D Model Anything

**R0 status (2026-10-23):** pinned source code acquired into a separate review branch; not merged, not installed as FORGE tooling, not exposed in the interface, not deployed, and not tested on an iPhone. This is not a production model of anyone's room.

## Source and rights

Original upstream https://github.com/wesbos/3d-model-anything, © 2026 Wes Bos, MIT. Pinned commit `31b2dc9da3fb541e501f2f0936e55b32afb70ee8`. The FORGE source snapshot is at `third_party/wesbos/3d-model-anything/`, retaining upstream `LICENSE` and `ASSETS-LICENSE.md` notices. No `data/`, private scans, image sets or promotional thumbnail assets are included. Third-party marks and demo media have distinct rights.

## What it offers

Upstream uses iPhone LiDAR/RoomPlan/camera evidence, converters for `house-project/1` and `house-capture/5` bundles, editable Three.js reconstruction, and exact camera-pose visual comparison. Its matched-camera scripts capture side-by-side evidence only; **they do not compute numeric similarity**, prove metric accuracy or guarantee that hidden geometry is correct. Scans must remain in meters (+Y up), preserving room/session/house transforms, image ordering and camera intrinsics. The published iPhone app is source code, not a verified App Store release or device-passed product.

## Evaluation plan (not executed)

1. Audit the pinned code and scripts for unexpected file writes, browser process invocation, network access, dependency install, shell assumptions and exfiltration risks. Require third-party license inventory and independent specialist review.
2. Use synthetic, consented local input only. Obtain **full** upstream checkout pinned at this SHA on a controlled machine to provide the companion viewer, iPhone app source and `RoomModule` runtime. A copied skill alone is insufficient.
3. Execute the synthetic import tests and write independent adverse cases: malformed bundle formats, nested paths, symlinks, oversized media, ill-conditioned matrices, unaligned sessions, nonzero room indices and photo-order/intrinsics mismatches. Record commands, exact source revision, results and failures.
4. Quantify ground-truth dimensional and camera reprojection error on synthetic fixtures, and perform browser rendering/error/accessibility/mobile performance testing. Differentiate measured, inferred, modeled and unverified geometry.
5. Only then design an **opt-in FORGE scene contract importer** and a reversible round-trip. Avoid direct live integration until independent 30-Furies audit, accepted rights/privacy reviews, current-head CI and separate founder release approval.

## Restrictions

R0 unapproved spend. No paid tokens or background services. Keep personal home interiors, people, faces, geolocation, camera/depth exports and building security layouts off public GitHub. No external messaging, no agent reconfiguration, no customer capture or deployment. No safety certification for Robotics/Lens/architectural suitability. A CI green check or still photo is not evidence of a validated production pipeline.

Tracker: https://github.com/LLoliwe/pryntor-forge/issues/19
