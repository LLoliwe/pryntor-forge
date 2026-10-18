# Pryntor Git Engineering & Open-Source Office | Operating Standard 0.1

**Status:** proposed policy and opt-in source onboarding, not active company-wide enforcement.  
**Control:** Linear project P-PRY-21. **R0 unapproved spend.**  
**Scope:** PRYNTOR Group game products and general engineering; pilots in FORGE/WORLDWEAVER first, then ZOWIBO, LVL7 and Game Studios after their product owners and independent reviewers approve.

## Mission, ownership and accountability

This is the central source-control and dependency-governance function. It owns:
- Repository inventory, access/permission reviews, visibility, commit and branch rules and onboarding/offboarding.
- GitHub issue/PR hygiene, reproducible builds, explicit owner signoff, CI and rollbacks.
- Third-party software provenance, license/asset separation, version pinning, SBOM, advisory triage and incident response.
- Code quality, maintainability, accessibility, child-safety escalation, documentation, integration contracts and evidence.
- A weekly operations report listing the named accountable maintainer of each codebase, upstream risk, CI state, release status and failures.

No model or engineer can independently approve its own change. Never merge an unreviewed external dependency into product code. A GitHub "green" check is not proof of artistic quality, mobile Safari or production safety. The founder authorizes spend, customer commitments and releases through applicable product policy.

## Hard rules

1. **R0 spend and least privilege.** No paid plans, marketplace purchases, cloud spend, auto-renewals, unsanctioned service accounts or deployment credentials. Audit existing GitHub Actions pricing and availability before enabling high-use jobs.
2. **Protected IP.** Public repositories never contain private company IP, original production character art, user/child data, unreleased commercial content, client files, proprietary API keys, personal data or private partner terms.
3. **No production changes from onboarding.** Isolated pilots and draft PRs first. No editing live games or mainline dependencies by default.
4. **License and provenance gate.** Capture exact upstream owner, URL, SHA, license text, transitive dependencies, files copied, asset/audio/font rights, third-party restrictions and trademark conditions. MIT source does not make every bundled asset commercial-safe. Preserve notices.
5. **Security gate.** Review installation scripts, submodules, binary assets, remote execution, CI workflow privileges, package lifecycle scripts, vulnerabilities and exposure. Record an SBOM before an install is promoted.
6. **Peer review gate.** Code author and independent reviewer must be different. Missing reviewer or physical-device validation is OPEN, not DONE.
7. **Quality gate.** Real game play loop must boot, accept keyboard/touch, start, pause/resume if applicable, restart, persist valid progress, respond to resizing/fullscreen and pass runtime regression tests. Real mobile Safari evidence required for iOS claims.
8. **Visual integrity.** Distinct Pryntor character/world canon, purposeful art direction, animation, sound and integrated assets. Do not substitute image placeholders for functioning gameplay.
9. **Safe external tooling.** PlayCanvas Editor MCP requires a specific connected editor/project and local Node 22.18+. Never silently connect AI to accounts, assets, or the network.

## Actual upstream source onboarding

Registry: [tools/git-office/upstreams.json](../../tools/git-office/upstreams.json)

From this repository's root, with Node 20+ and Git installed:

```bash
node tools/git-office/onboard.mjs --verify
node tools/git-office/onboard.mjs --list
# Explicit SOURCE-ONLY checkout of one individually approved sandbox candidate:
node tools/git-office/onboard.mjs --install pixi-open-games --ack-source-only
```

The installer clones from the exact GitHub repo, uses the pinned 40-character commit SHA, disables submodules and Git hooks for its checkout, and checks HEAD. Checkouts are created under a temporary OS directory, not added to FORGE's release bundle. The script **does not run npm/pip installers, copy artwork, start a game, authenticate an Editor, or deploy**. A checkout alone is not a safe installation: review dependencies and licenses before executing any upstream code. GitHub network access is required to clone; this cannot be demonstrated in an offline runner.

Source adoption stages: discovered → repo verified → pinned + license screened → sandbox checkout → dependency, SBOM and asset review → functional tests → independent reviewer → owner-approved merge → device acceptance → release. Each stage needs recorded evidence.

### Tech selections and known traps

- Phaser 4.2.1 (separate npm dependency, not included in the registry) is a preferred 2D gameplay runtime pilot, **not currently installed in FORGE**. Phaser 3 Rex plugins need compatibility validation before use.
- PixiJS Open Games is MIT reference code, including Bubbo Bubbo and Puzzling Potions. Their Figma design files are **read-only; do not import/reproduce the artwork**. Investigate GSAP licensing/third-party content independently.
- Phaser examples repository has no visible root license at the pinned revision. It remains **reference-only** pending a documented license determination.
- PlayCanvas engine is MIT; the Editor and any hosted account use are separate questions. The editor MCP package requires Node 22.18+.
- Kenney 3D platformer is Godot 4.6. Its readme claims the included sprite/model/sound assets are CC0, but verify rights by actual file at import time. Other kits have separate checks.
- Do not mix Phaser, PixiJS and PlayCanvas as mandatory runtime dependencies for a single game. Test small, isolated technical spikes, then standardize per game.
- No external package, sample or engine resolves poor art direction or broken touch controls on its own.

## Pull request evidence template

Every toolstack adoption PR must link: product owner; upstream revision + license evidence; direct/transitive dependency inventory; file and asset provenance; specific install/rollback commands; cost/permissions confirmation; unit and smoke logs; mobile/browser screenshots and pass/fail notes; independent reviewer; product release approval status.

**Decline merge** when any mandatory evidence is missing. Track blockers in Linear rather than making unsupported claims that they are "green".

## Launch and audit trackers

- [Department P-PRY-21](https://linear.app/pryntor/project/pryntor-git-engineering-and-open-source-office-ba9ae08d33cd)
- [PRY-340 Repo security and permissions](https://linear.app/pryntor/issue/PRY-340)
- [PRY-341 Install + lockfile and run evidence](https://linear.app/pryntor/issue/PRY-341)
- [PRY-342 ZOWIBO mobile game remediation](https://linear.app/pryntor/issue/PRY-342)
- [PRY-343 Licensing and assets](https://linear.app/pryntor/issue/PRY-343)
- [PRY-344 Game quality evidence dashboard](https://linear.app/pryntor/issue/PRY-344)

## Current verified status, 18 October 2026

- Department: created as a Linear project; operating charter drafted.
- Nine public GitHub repositories: exist; full SHA recorded and code-license screened (one reference-only).
- Sandbox installation script: committed in **draft PR**. [GitHub Actions run 39112118250](https://github.com/LLoliwe/pryntor-forge/actions/runs/39112118250) independently executed SHA-pinned PixiJS Open Games source checkout and disposable installation of exact Phaser 4.2.1 and PixiJS 8.22.0 packages, including configured dependency audit. This is an ephemeral CI sandbox, not a deployed or product-installed game.
- Offline safety suite and standard FORGE CI also passed on the onboarding PR; code-owner review and adoption signoff still remain pending.
- GitHub organizational team permissions, enforced branch protections, real mobile Safari tests, working ZOWIBO repair and production release: **not completed or verified**.
