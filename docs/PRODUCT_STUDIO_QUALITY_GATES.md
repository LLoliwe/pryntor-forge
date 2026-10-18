# Product Studio R0: browser quality gate (opt-in pilot)

Status: **draft, not installed company-wide, not merged, not evidence of device certification**. This pilot addresses FORGE's documented missing end-to-end browser and mobile viewport verification. It is a reusable pattern for other Pryntor web apps, not a universal engine migration.

## Why this exists

Unit tests and a passing JavaScript syntax check do not prove a button responds, a download works, or an iPhone-sized layout fits. A manual founder review is needed to assess distinctive visual craft, interaction feel, meaningful utility and whether any brand assets feel pasted on.

## Free / locally runnable tool selected

- Playwright Test 1.64.1 (Apache-2.0), pinned as a development dependency only.
- Chromium, Firefox and WebKit plus emulated Pixel 7 and iPhone 13.
- Zero required SaaS accounts, API keys, runtime telemetry, cloud hosting, subscriptions or payment data.
- No GitHub Actions workflow is added or triggered by this change. Real Safari hardware verification remains a separate release gate. Playwright WebKit is not the Apple Safari app.

## Run

1. Use Node 22+ and run `npm install` in the FORGE repository. This adds developer dependencies; it does not change the zero-dependency production runtime. Review the npm dependency tree and produce a lockfile before any merge.
2. Run `npx playwright install chromium firefox webkit` on a development machine with sufficient disk space.
3. Run `npm run test:e2e` to exercise all five projects. For a quick focused run: `npm run test:e2e:chromium`.
4. Read failed assertions and inspect local Playwright traces/screenshots. Never edit the test to hide a broken button or overflow.
5. Record which browser/OS actually ran, attach screenshots, and obtain independent review.

The tests cover rendering, scene-generation state change, add/remove, actual download, reset response, a narrow-screen overflow check, and uncaught exceptions during the core scene flow. The suite does **not** establish graphics quality, accessibility compliance, native device support, CAD correctness, Blender/UE5 interoperability, or production approval.

## Proposed Pryntor-wide quality standard (not automatically applied)

| Gate | Evidence required | Escalation |
| --- | --- | --- |
| Distinctive visual direction | Approved references; bespoke type/color/characters/illustration; screenshots, not generic AI output | Human art-direction review |
| Working first action | The primary CTA causes an observable state transition on phone and desktop | Block public preview |
| Complete interactive loop | Start -> interact -> result -> restart, including offline/error states | Block public preview |
| Mobile-first layout | 360/390/430 widths, landscape, safe-area, touch target and keyboard checks | Fix and retest |
| Cross-browser | Chromium, Firefox, WebKit, plus **real iPhone Safari** and Android hardware verification | WebKit-only is insufficient |
| Accessibility | Keyboard, screen reader review, contrast, focus order, reduced motion; appropriate safeguarding | Independent review |
| Performance and errors | Mobile frame time / FPS, startup, console errors, asset size, crash repro | Define product-specific budgets |
| Provenance/privacy | Asset rights ledger, no unwanted child telemetry, no PII in screenshots/replay | Rights/privacy review |
| Release evidence | URL, exact commit, test run, device records, QA decision, rollback | Independent release approval |

## Stack choices, evaluated rather than indiscriminately installed

- Web-playable 2D games: **Phaser 4** where a real game loop is required. Keep FORGE's smaller deterministic Canvas engine unless an engine migration demonstrably improves it.
- Mobile web apps: **Capacitor 8** as an optional native wrapper only after web functionality passes device QA.
- New native-heavy applications: **Expo/React Native**, not an automatic migration for every web project.
- 2D content: **Tiled** for level maps; **Krita** and **Blender Grease Pencil** for original art and animation, with licenses reviewed.
- Component/UI consistency: existing **Figma**, or **Penpot** where open formats / free cloud access matter, plus design tokens and **Storybook** for React interfaces. Don't force Storybook into vanilla JS unnecessarily.
- Animation: evaluate Rive but do not assume free editor means free export/shipping; current Rive shipping is paid.
- Error monitoring: evaluate Sentry only for projects whose privacy/child-safety review allows it. Never switch on child session recording by default.

No tool in this table is claimed to have been installed by this pull request beyond the proposed Playwright development dependency.

## Next independent checks

- Run the suite on a developer host with browsers installed and record real pass/fail outcomes.
- Capture and approve visual baselines at 360, 390, 430, 768, 1024 and 1440 widths.
- Test touch and browser UI on physical iPhone Safari and Android Chrome.
- For ZOWIBO and LVL7, build a separately reviewed interactive-game harness and authored art pipeline. Do not reuse FORGE's CAD-specific controls as a game test.
- Obtain code/security, accessibility, visual and release review before merging or publishing.

Commercial and privacy constraint: **R0 unapproved spend; no paid add-ons, no automatic renewal, no cloud CI activation, no release without independent approval.**
