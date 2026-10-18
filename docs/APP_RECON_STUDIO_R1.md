# Pryntor App Recon Studio R1 | working implementation

**Status:** Working local research prototype. Draft code only. No third-party app copied; no live external URL capture independently verified; no released app and no completed physical iPhone Safari evidence. Existing R0 source policies apply.

## Why R1 exists
R0 produced plans and release gates but could not inspect rendered interfaces, capture screenshots, discover visible controls, or compare a working candidate. R1 adds a genuine, zero-dependency Chromium DevTools Protocol adapter, browser-screen captures (mobile, tablet and desktop), UI semantics inventory, offline owned-source journeys, design-research blueprints, and interactive visual comparison reports with measured pixel scores. The original PATCH pocket-arcade fixture is fully playable and is **not** a clone of a commercial app.

## Run offline, no network or subscriptions

Requires Node >=22 and installed Chromium. Run from the repository root:

```bash
node tools/recon-studio.mjs capture-file examples/recon-demo/index.html --out ./tmp/build
node tools/recon-studio.mjs capture-file examples/recon-demo/baseline.html --out ./tmp/reference
node tools/recon-studio.mjs compare ./tmp/reference ./tmp/build --out ./tmp/report
node tools/recon-studio.mjs blueprint ./tmp/build --out ./tmp/blueprint
node tools/recon-studio.mjs journey-file examples/recon-demo/index.html examples/recon-demo/full-journey.json --out ./tmp/journey.json
```

Open `tmp/report/index.html` to inspect the draggable pixel overlay, percentage diagnostics and control differences. Open `examples/recon-demo/index.html` in any normal browser to play the original mini-game. `capture-file` uses a **locally owned** HTML fixture inserted into an isolated blank Chromium tab with HTTP/HTTPS/file requests blocked. It does not scrape or fetch a target website. External resources or remote imports may not render.

For **public, authorised** research only, an advanced external URL capture exists:

```bash
node tools/recon-studio.mjs capture https://example.com/ --allow-host example.com --out ./tmp/example
```

The external mode needs security and source-rights approval. Only the explicitly approved hostname is allowed through Chromium request interception, remote IP literals and private-hostname targets are blocked, and its behavior is unverified in environments with browser enterprise policies. Redirects and external font/CDN requests can fail. Never supply customer credentials, bypass access controls, access authenticated third-party accounts or browse internal/private networks. External URLs **do not** support scripted click journeys. An explicit `--allow-host` is an *operator approval*, not proof of legal rights. Do not run this as a publicly exposed service or treat hostname rules as an enterprise-grade SSRF boundary.

## What is actually verified
- Offline Chromium source rendering and screenshots on desktop/mobile.
- Original PATCH demo's Play, score update, 100-point win state, visible restart and reset behavior across 17 browser steps.
- Deliberately changed baseline styles yield non-100% visual similarity, with an HTML drag-to-compare viewer.
- Measured controls, heading hierarchy, font/color signals and 44px touch-target audits.
- Captures blocked URLs fail closed instead of being misclassified as successful screenshots.

## Known limitations and gates
- No agent independently reconstructs arbitrary multi-screen third-party apps yet. No backend synthesis, database extraction, asset copying, authentication reverse engineering or hosted AI is included.
- Pixel similarity is a diagnostic, not an aesthetic judge. Identical images do not prove interaction parity. Different images may both be good.
- A CDP `click()` on an owned test file proves DOM event behavior, **not** a physical touch event on iOS Safari. Physical iOS/Android tests are unverified.
- Chrome's enterprise policy can block local/remote navigation. Offline owned-source injection is a *test fixture technique*, not a workaround to access forbidden sites.
- Public URL capture may load third-party code; use disposable sandboxed environments with no secrets or mounted company data. Never use root Chrome without sandbox outside ephemeral dev testing.
- Demo uses original shapes, text and interaction. It does not use any existing ZOWIBO canon, customer data, or owned client assets.
- The repository CI runs dependency-free Node tests. Real browser tests are opt-in with `RUN_RECON_BROWSER_TESTS=1 npm test` where Chromium is installed and allowed.

## Company-wide adoption as optional shared infrastructure
FORGE owns the reusable capture, blueprint, comparison and journey-test code. Venture owners opt in individually and provide original or licensed references, brand rules, accessibility/privacy review, and a physical-device acceptance plan.

| Venture | First real application | Additional proof required |
| --- | --- | --- |
| ZOWIBO | Play/restart, cinematic onboarding and touchscreen UX, canon-locked assets | Child safety, artist signoff, physical Safari, real game loop |
| LVL7 | Actual playable physics/biology activities | Educator assessment review, correctness, child privacy |
| BTWW | Original editorial/audio and mobile navigation patterns | Media rights and real audio playback |
| Recover | Onboarding, merchant dashboard, automation controls | Merchant isolation, PayPal sandbox and decision traces |
| Tirisano | Mobile consumer/institutional booking flows | Data handling, form correctness and local travel compliance |
| Studios / AFTERLIGHT | Responsive playback and original art direction | Proven media decode, accessibility, source licenses |
| Lens | Local phone-first permission and camera flows | Camera privacy and hardware permission review |
| Robotics | Industrial dashboard and simulation QA | Enterprise security and fail-safe control boundaries |

No automatic cross-repo installation, production deploy or third-party code execution. Keep R0 unapproved spending, independent QA and rights/provenance checks. Merge only after review, including code security and on-device evidence.
