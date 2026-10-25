# Pryntor toolkit: Rusteerio local HTML extraction pilot

**Status: draft, opt-in, not production.** This is part of the existing Open Source Intelligence & Engineering function in Engineering P-PRY-22. Track in existing [PRY-350](https://linear.app/pryntor/issue/PRY-350) and independent review [PRY-348](https://linear.app/pryntor/issue/PRY-348). No new venture, department, or repository.

## Canonical upstream and rights

- Source: https://github.com/context-dot-dev/rusteerio
- Inspected revision: `af21a24cc14c1fac870405b276ae7514a8c80dfd` (upstream main on 18 Oct 2026; manifest says 2.0.0).
- Original code: MIT licensed at https://github.com/context-dot-dev/rusteerio/blob/af21a24cc14c1fac870405b276ae7514a8c80dfd/LICENSE
- Third-party terms still require independent review: https://github.com/context-dot-dev/rusteerio/blob/af21a24cc14c1fac870405b276ae7514a8c80dfd/THIRD_PARTY_NOTICES.md
- Node.js >=20.19.0. NPM package includes native binaries. MIT licensing does not itself prove the release artifact's provenance or security.

## Practical implementation

`tools/rusteerio_extract.mjs` is an **executable, local-only** adapter for already-obtained HTML. It returns JSON source URL, title, description, headings and safe HTTP(S) links. `extractBatch` uses the upstream native `loadAll` API, with at most 16 pages and two threads per batch. The application hosting the adapter must configure any process-wide worker budget before starting work.

Guards: input capped at 2 MiB each, 32 headings, 256 links, 2048-char URLs; provenance must be HTTPS with no embedded credentials; output link schemes restricted to HTTP(S); local CLI rejects symlinks. No web fetching, browser scripting, telemetry, API key, HTTP crawlers, billed service calls or production endpoint modifications.

An isolated demonstration, **only after reviewing the pinned package and binaries**:

```bash
npm install --no-save --no-package-lock --ignore-scripts --no-audit --no-fund rusteerio@2.0.0
node tools/rusteerio_extract.mjs ./sample.html https://example.org/sample
node --test tests/rusteerio_extract.test.mjs
```

This deliberately does not modify FORGE's package.json dependencies or affect its zero-dependency `npm start`. Default offline contract tests work without the package. Dedicated PR smoke CI tests actual native import after a version-pinned isolated install. Never commit `node_modules`, real customer records, secrets, private HTML or children's data.

First trial: human-reviewed public company/product page research supporting existing PRY-154 / PRY-105. Possible follow-ons need separate venture owner acceptance and evidence-led tests. Parse output is **not** a verified factual assertion about a company.

**Different product:** Context.dev's hosted web data API is metered. Contact with its founder and a request for pilot credits does not confirm credit issuance, API credentials, billing ceilings, or permission to make chargeable calls. Keep it disabled until independently verified.

## Remaining gates

- Check npm package integrity, native addon provenance and bundled third-party licences.
- Complete actual Rusteerio import and parser smoke on target Node/runtime in CI.
- Reproduce accuracy, source attribution, parity and cost/performance against an existing Cheerio baseline with identical public fixtures.
- Independently review native security, license notices, third-party website content rights, privacy, memory caps and owner acceptance.
- No autonomous outreach, production rollout, auto-merge, new recurring spend or use of customer/child data without explicit approval.

**A green unit test is not proof of production integration or independent approval.**
