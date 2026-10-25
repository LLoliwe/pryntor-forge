# Context.dev public-web evidence pilot | Pryntor OSIE

**25 October 2026: opt-in engineering pilot, not live or production.** Existing Engineering project, OSIE PRY-350, independent review PRY-348, FORGE PR #18. This does not create a new venture, repo, subscription or scheduled job.

## Intended use

Context.dev provides optional **metered** public-web source acquisition. Pryntor FORGE's Rusteerio adapter remains the local-only HTML parser. The research layer preserves retrieved URLs, timestamps, request IDs, source snippets and credit metadata, marks all claims unverified, and routes accepted evidence through existing OSIE quality and PRY-AIG-001 agent-integrity gates.

First evaluation: public technical release notes, known developer documentation, licensed educational references and publicly available research. Per-venture approval before applying to ZOWIBO, LVL7, Robotics, VEC, Tirisano or Recover. Never use child, customer, payment, internal credential, private workspace or patient information as web-search inputs.

## Credits and pricing (read on 25 October 2026)

- Context.dev founder confirmed 25,000 complimentary pilot credits in an 18 October email, with 50 concurrent batches and 25 concurrent API requests.
- A 19 October broadcast stated another 50,000 credits had been added. This is **75,000 reported allocated** in total, NOT a verified live balance.
- Free tier now advertises 1,000 monthly credits and no overage. Grants above free allowance are preserved on monthly refill per vendor docs. Verify current entitlement, expiry, auto-topup OFF and plan in the account dashboard.
- Base search costs 1 credit per up to 10 returned results. The pilot intentionally does not request Markdown, highlights, structured JSON or PDF OCR. Those increase cost.
- A user-owned connection is essential. Composio's instant-account connection is NOT the same as Pryntor's sponsored credits and may charge cash. It must NOT be used for this pilot.
- Founder-approved R0 constraint: no new payment method, subscription, overages, auto topup or automatic recurring charges.

References: https://docs.context.dev/account/credits ; https://docs.context.dev/api-reference/web-scraping/search ; https://docs.context.dev/api-reference/usage/retrieve ; https://docs.context.dev/integrations/cursor-plugin

## Implementation delivered in this review branch

- tools/contextdev_evidence.mjs: zero-dependency, network-disabled-by-default single-query adapter. Up to 10 results, one base-credit estimate, only HTTPS public-domain result URLs, no duplicate links, source metadata retained.
- tests/contextdev_evidence.test.mjs: nine deterministic, offline unit tests exercising disabled by default, absent keys, oversized/malformed inputs, unsafe URLs, deduplication, provenance, billing metadata, mocked one-request execution, and secret-redacted failures.
- No keys, customer data, local config changes, installed dependencies, hosted API calls or production product changes. Running tests does not spend credits.

## Acceptance and staged activation

1. Run offline tests with node --test tests/contextdev_evidence.test.mjs and npm test. Record the commit SHA and independent CI result.
2. Founder completes already-open Cursor Context.dev OAuth from the official Context.dev connection page, then checks MCP tools from a fresh Cursor chat. Cursor OAuth is distinct from application REST API keys.
3. In the Context.dev dashboard, verify remaining credits, Free plan, auto-topup disabled, pilot entitlement and any expiry. Context.dev's read-only GET /v1/org/usage can corroborate the balance without using credits.
4. On an approved server-side environment, store CONTEXT_DEV_API_KEY as a secret. Never commit or print keys. Use an approved account-owned connection, not Composio instant-account metering.
5. After account-level R0 controls and owner authorization, execute **one** public test of 5 results. Compare provider key_metadata.credits_consumed and credits_remaining with the usage dashboard. Any unexpected credit count, auth failure, missing metadata or unexpected site content is a STOP gate.
6. Hand-verify source URLs and claims against original pages. Compare citation fidelity, false positives, source freshness, duplicates, latency and usable verified results per consumed credit against existing baselines. Target at least 20 diverse public fixtures before wider adoption.
7. Do not enable live use in FORGE main, production services, scheduled agents, auto-outreach or automatic web-content publication without independent security/legal review and acceptance from each venture owner.

## First source watchlists (proposed, not yet created)

- OSIE / PRIME: official tool changelogs, open-source licences, model releases and reproducible benchmark datasets.
- ZOWIBO: official children's game release notes and developer docs, public family-safety/accessibility sources; do not ingest third-party art as training content.
- LVL7: official South African educational resources, open licensed content and education research; independently confirm curriculum versions and copyright.
- Robotics / VEC: official datasets, peer-reviewed research and publicly documented methods; sources cannot replace real physics or biology acceptance tests.
- Growth: public competitor/product changes supporting existing authorized Pryntor service lines, with independent human review before any client promise.

**Disposition:** Code staged, offline pilot locally tested 9/9. Context.dev provider calls 0 in this work. Live integration, balance and production acceptance remain unverified.