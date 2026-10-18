# OSIE R1 | Worldwide Upstream Intelligence and Sandbox Intake

**Status:** Working discovery and read-only source-review tooling on a draft Pryntor FORGE PR. Neither production integration nor commercial-use clearance. 18 October 2026. Owner: Pryntor Engineering OSIE.

## Now executable (stdlib only, no paid services)

- `python3 tools/osie_radar.py`: safe offline mode, always reports unimplemented regional providers.
- `python3 tools/osie_radar.py --live --query image --query robotics --limit 3`: bounded READ ONLY public metadata search for GitHub, Hugging Face, China's Gitee and ModelScope, and Russia's GitFlic. An unavailable provider is recorded, not treated as no innovation in the region.
- `python3 tools/osie_sparse_stage.py --repository owner/repo --revision <40hex> --file README.md --file LICENSE --destination /tmp/isolated --stage`: files-only staged inspection with exact immutable revision and SHA-256 receipts. No package installation, script execution, weights or inference.
- `python3 tools/osie_stage.py ...`: alternative bounded source archive import for small repositories with complete path and symlink checks. It refused a large MOSS archive as intended; prefer sparse staging for MOSS.
- `python3 -m unittest discover -s tests -p 'test_osie_*.py' -v`: offline red and positive tests.

**No blanket cloning and executing packages. No trust_remote_code. No model weights, production product keys, or paid GPU actions.** Source bytes stage only into disposable GitHub Actions runner scratch.

## Confirmed canonical upstream intake shortlist
Items below are candidates, not technologies adopted by any Pryntor product. Repository URL and exact code revision verified through GitHub APIs on 18 October 2026. Licence text was staged for review where available, but independent rights review remains OPEN.

| Geography / ecosystem | Canonical upstream | Observed immutable code revision | Pryntor trial wedge | Status |
|---|---|---|---|---|
| China / OpenMOSS | https://github.com/OpenMOSS/MOSS-Image | `c1355e6b1986dfe8fba3c0455783a05899212342` | Studios and ZOWIBO image layouts/text | Source-only inspection; weights not installed |
| China / Qwen | https://github.com/QwenLM/Qwen-Image | `6b5e1f5cec987d404be5ac6657db3b9aacb56a89` | Typography and character/asset baseline | Source-only review |
| Russia / AI-Forever | https://github.com/ai-forever/Kandinsky-4 | `7506103f897f6f48278fe9b6b71f1471ea374679` | Alternative generative imaging/video baseline | Source-only review |
| India / AI4Bharat | https://github.com/AI4Bharat/IndicTrans2 | `4f08e39cc6bf13cd62e2445dc725f22bff1a9219` | Multilingual internationalisation methodology | Source-only review |
| Urdu-language NLP | https://github.com/urduhack/urduhack | `f7f0aa26ef516ce7907429dff0863577190beca7` | Language pipeline robustness; old last commit risk | Source-only review |
| US / Meta FAIR | https://github.com/facebookresearch/sam2 | `2b90b9f5ceec907a1c18123530e92e794ad901a4` | WORLDWEAVER image-to-scene segmentation | Source-only review |
| Global / Godot | https://github.com/godotengine/godot | `81ab961f91066a63bcbf3ec340962bb1a1ada558` | Actual games, cross-platform inputs, touch | Research intake only |

### Distribution channels beyond global mirrors
- **Gitee, China:** official documented GET `https://gitee.com/api/v5/search/repositories?q=...`. API may reject anonymous requests. No fake zero results.
- **ModelScope, China:** official `https://modelscope.cn/openapi/v1/models?search=...` documented but can require API key. Anonymous failures are NOT proof nothing exists. E.g. official MOSS Base/SFT also offered via ModelScope.
- **GitFlic, Russia:** documented `https://api.gitflic.ru/project?q=...`; read-only public project list. Availability/permissions measured live.
- **GitVerse, Russia:** official API documentation at https://gitverse.ru/docs/developers/public-api/ ; public catalogue search not confirmed, so remains manual evidence intake.
- **GitCode, China:** investigate the canonical public repo search contract before automating. Never scrape private sessions or collect personal identifiers.
- **Africa:** Masakhane, local speech/translation and education engineering; establish exact maintainer/source proof and benchmark South African language support. No unverified vendor declared installed.
- **Pakistan, MENA, LatAm, polar science:** multilingual tokenisers, Urdu/Nastaliq typography, robotics/control, scientific computing, ocean/ice/climate datasets and creative pipelines. Discovery must cover indigenous and non-English sources and check legally permitted use. No special privilege for star counts.

## Evaluation scoring: evidence or no points
**Hard gates first:** maintainer/canonical provenance, SPDX/code/weight/dataset rights, untrusted-code security, exact revision and build reproduction, R0 compute and data minimisation, independent human review.

Once hard gates are eligible, rank relative to a category-specific incumbent by: actual quality uplift 30%, user task fit 25%, repeatable integration and device/latency performance 20%, maintainability and portability 10%, operating cost 10%, contribution/learning advantage 5%. Blank measurements are `NOT TESTED`, not zero or fabricated rank. For ZOWIBO and LVL7, check real touch/game loops, educator/child review, rights and culturally authentic art. For Studios, moving-frame temporal continuity and animation cannot be replaced by a still-image slideshow.

## MOSS benchmark contract (not yet executed)
Same 50 prompts and negative cases for Base, SFT and incumbent. Track exact revision, seed, resolution, sampling settings, VRAM, latency, all-on cost, successful generation count, blind reviewer identity and scores, failure gallery. Prompt clusters: English/Chinese text legibility, multiline constrained layout, Southern African written signage and linguistic accuracy reviewed by humans, strict ZOWIBO canon/consistency, cinematic scene continuity references. Child-safe and provenance review mandatory. If no verified R0 GPU allocation, STOP.

## Acceptance and controls
GitHub PR merge remains blocked by independent security/rights review and approved venture owner. CI proves staging and metadata validation only. GitHub Actions logs/artefacts cannot be treated as evidence of child-safe production use, real inference or revenue. No actual spend was authorised.

## Connected Pryntor handoff
Parent department: https://linear.app/pryntor/project/pryntor-engineering-git-and-open-source-systems-department-791494feb98e
Charter: https://linear.app/pryntor/document/engineering-osie-charter-hugging-face-model-registry-and-independent-2f6ddfb938e9
Trackers: PRY-347 image pilot, PRY-348 gate tooling, PRY-349 Hugging Face official organisation and finance, PRY-350 global radar.


## 18 Oct 2026 | Actual GitHub-source intake for EXISTING operations ONLY

These are verified **real upstream repositories**, retrieved from canonical GitHub metadata and pinned to their immutable source commits. The existing OSIE workflow stages **README.md and LICENSE only** into an ephemeral read-only review runner and performs a static risk-signal scan. It neither installs dependencies nor imports source code into a product. Independent legal/security and technical release reviews remain open.

| Actual official Git origin | Immutable snapshot | Existing Pryntor destination | Runtime status |
| --- | --- | --- | --- |
| [JLPM22/MotionMatching](https://github.com/JLPM22/MotionMatching) | `35fc8ee9a0fd97f12de458ea81eaef7c8219d87a` | Existing Unity-compatible animation work, only after a real Unity 6 project and licensed source/motion library are identified | Source intake only, not installed; no claim to match the screenshot's exact AiKodex implementation |
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | `0978e2b62e53654ebe1a2c3032ebee0a4981c701` | Existing FORGE/Robotics browser 3D investigations, not replacing 2D WORLDWEAVER or hardware physics | Source intake only, no browser integration yet |
| [morluto/rea](https://github.com/morluto/rea) | `c12d9eda87aa5a022ee7e18ea96d8d03bfd12e96` | Existing Engineering/Git REA permissioned overlays; authorised first-party analysis only | Source intake only, no MCP/CLI installation or arbitrary app reverse engineering |

The repositories' root LICENSE files declare MIT. Confirm component-level dependencies, third-party datasets and assets independently. No 'AI employees', speculative agent swarms, Mac full-device control, private client access or copied application artwork. The Shipper post, drag+shift converter, Blender warehouse video and self-revising-paper figures do not themselves identify a verified compatible GitHub package, so they are not silently installed.

The browser game's **actual executable change** is tracked separately under WORLDWEAVER existing [FORGE draft PR #6](https://github.com/LLoliwe/pryntor-forge/pull/6): an original deterministic foot-plant locomotion module with local tests and replay-safe drawing. This is not machine-learned motion matching and does not imply ZOWIBO brand art or production device readiness. No new projects, issues, departments or production deployment.
