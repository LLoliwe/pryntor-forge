# Pryntor SceneBridge R0: Blender to Unreal Engine 5

**Status (18 October 2026): BLENDER HEADLESS EXPORT AND OFFLINE PREFLIGHT VERIFIED IN CI; UNREAL IMPORT NOT YET VERIFIED.**

Owner: Pryntor FORGE / Game Studios. Shared optional adapter for OMEGA R3, WORLDWEAVER, Studios and approved venture pilots. This is a standalone directory in the FORGE repository; it does not change existing browser gameplay or claim to produce finished games.

## Exactly what works today

- Blender-host authoring script for original single-scene FBX and directly connected Principled BSDF PBR textures, with explicit source-rights metadata. Complex node graphs are rejected rather than silently mistranslated.
- Offline Python-standard-library manifest validation with strict relative file inventory, SHA-256 digests, anti-traversal/symlink checks, material factor checking, source-rights declarations and no silent overwrite.
- Deterministic import-job generation to /Game/Pryntor/SceneBridge/<scene>.
- Unreal Editor-host Python adapter that verifies content again before attempting FBX/texture import and rebuilding native Unreal material nodes. Reports unmatched material slots and refuses to overwrite an existing destination.
- Dependency-free unit tests and optional GitHub CI, including a passing real Blender smoke job on a public runner. No account, telemetry, model API or paid compute required for preflight.

**Not yet evidenced:** Unreal Python API compatibility on a particular UE5 release, actual Blender file export from the user's scene, native Unreal import, visual parity, procedural bake of complex Blender shaders, game collisions, navigation, physics, lighting, interactive gameplay, asset licensing truth, child-safety, performance or private-brand acceptance. All engine claims remain blocked until executed on a versioned workstation and independently reviewed.

## Native Blender smoke evidence (18 October 2026)

- Reproducible originally modelled procedural office with four Principled PBR materials.
- GitHub Actions `SceneBridge offline checks`: https://github.com/LLoliwe/pryntor-forge/actions/runs/39108822697, SUCCESS at code head `b68ee8be3d223a0d78607142ac2cc42fffcbb70c`.
- Blender 4.0.2 with Python 3.12.3 and distro NumPy 1.26.4 exported `OriginalOfficeCI.fbx` and `manifest.json`.
- Separate offline validation returned `PASS: OriginalOfficeCI` and wrote `import-plan.json`.
- No Unreal Editor binary or native UE test in this run. Nothing about UE import or appearance can be inferred from this smoke check.

## Runbook: three phases

1. On a local workstation with Blender installed and an approved original or licensed .blend scene:

       blender --background approved.blend --python scenebridge/blender_export.py -- --scene OfficePilot --rights original --out /absolute/path/office-source

   Use --rights licensed --license-reference 'license-document-reference' only if actually granted. Packed textures must be unpacked. Blender shader links must use direct image textures or a Normal Map node into a Principled shader. For more complex materials, an artist must manually bake and approve the maps before export. This script does not do automatic baking.

2. On any host with Python 3.10+ (zero extra packages):

       python -m scenebridge validate /absolute/path/office-source/manifest.json
       python -m scenebridge plan /absolute/path/office-source/manifest.json --out /absolute/path/office-job
       python -m unittest discover -s tests -p 'test_scenebridge.py' -v

   A passed plan is only a **preflight** result. It is not an Unreal import or rendered game.

3. On an approved Unreal Engine 5 workstation with the Python Editor Script plugin enabled:

       export SCENEBRIDGE_JOB=/absolute/path/office-job/import-plan.json
       UnrealEditor-Cmd /absolute/path/Game.uproject -ExecutePythonScript=/absolute/path/repo/scenebridge/unreal_import.py -unattended

   Inspect unreal-import-report.json, all newly created materials and texture colour-space settings. Unreal Editor API differences can require a version-specific adapter update. The adapter intentionally refuses to overwrite any existing content in the target asset directory.

## Technical contract and security

Schema: pryntor.scenebridge/1. Materials use unique portable names, RGBA base colour (0..1), metallic and roughness (0..1), and optional base_color, metallic, roughness and normal texture links. Texture samplers are interpreted as RGB for colour/normal and R for scalar roughness/metalness; the V0 importer does not reconstruct arbitrary mixing graphs, emission or transparency. Exactly one FBX geometry asset is required. The importer operates only in a dedicated scene namespace, does not upload assets and is blocked on an existing nonempty destination. Blender may include objects outside meshes in the FBX; confirm import scope and scene visibility during independent review.

Manifest provenance is **self-attested**, not independent license verification. Do not place unreleased proprietary brand art, client material, private source blends, secrets or identifiable children into a public GitHub fixture. Any proprietary content stays in per-venture private storage with access controls. The public repo contains only scripts and synthetic tests. R0 unapproved spend, no paid model use, no outbound customer data, no automatic PR self-merge or public release.

## Company routing and acceptance gates

| Division | Use | Owner signoff | Blocked until |
| --- | --- | --- | --- |
| FORGE / WORLDWEAVER | scene material preflight / optional engine backend | FORGE owner | Independent code review and UE import parity proof |
| Game Studios / RELICBOUND | original playable room, authored props and UE material graph | Game Studios owner | physics, collision, control latency, animation, 60 fps device target |
| ZOWIBO | original stylised indoor set and asset library | ZOWIBO art and child-safety owners | original IP, age-appropriate interactions, rights, independent child testing |
| LVL7 | interactive science/biology lab staging | LVL7 science/educator owner | physics/science accuracy, WCAG, educator review |
| Studios / AFTERLIGHT | real-time previs, cameras, staged animation | Studios creative director | shot/acting quality, colour, audio rights, final render review |
| Robotics / Lens | low-risk digital twin props or layout | robotics/security owner | not a control or physical-safety certification |
| Tirisano Travel / Web / Mobile | optional space visuals | relevant venture owner | licensed original art and product needs |
| ATLAS / partnerships | rights-cleared demo evidence only | partnerships owner | no promise of engine readiness or customer service prior to QA |
| Recover / finance / non-spatial units | not automatically adopted | functional owner | demonstrated spatial need |

## Evidence required before GO

- Capture exact Blender, Python, Unreal, FBX importer and workstation versions plus code commit.
- Run one original room through Blender export, offline preflight, UE import and re-open project. Check mesh count, slot assignment, normal-map compression, PBR colour and roughness tolerances.
- Produce side-by-side same-camera/lighting source and Unreal renders, texture-map checksum table, asset/rights ledger and profiler capture. Record failures rather than adjusting claims.
- Independently review security, maintainability, cultural/brand suitability, accessibility and device performance. Maintain rollback plan and import report.
- All PRs stay draft until reviewed. Each venture integrates through its own explicit approval, with tenant-separated assets.

## Relationship to related work

- FORGE spatial contract: https://linear.app/pryntor/issue/PRY-328
- WORLDWEAVER gameplay contract: https://linear.app/pryntor/issue/PRY-329
- OMEGA R3 governance: https://linear.app/pryntor/issue/PRY-330
- 3D Blender host and Scenario evidence: https://linear.app/pryntor/issue/PRY-184
- Company canon: https://docs.google.com/document/d/14EuuUkEMYv4XfJvKNEuLT2JmDlJw-h5d1brjwwz4b6A/edit

### Acceptance definition

R0 is **GO for code review and private offline preflight**, **BLOCKED for claiming tested Blender-to-UE automation or playable-world output**, and **NO-GO for public distribution of private brands**.
