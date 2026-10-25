# Context.dev public-source evidence pilot for Pryntor FORGE OSIE

**Status: experimental, off by default; no production integration.** Implemented in the existing OSIE review branch, not in the default application workflow. This public guide documents the source-only adapter and does not contain private account details or grant terms.

## Separation of responsibilities

Context.dev is a hosted, potentially metered way to acquire public web evidence; Rusteerio is the optional local parser of supplied HTML. Neither is a factual-verification engine. Outputs are treated as untrusted, provisional third-party content. Public source citations must be checked against original pages by independent reviewers before supporting any conclusion.

This optional pilot is for already-public technical documentation, developer releases, licensed educational resources and scientific research references. **Never** submit nonpublic repository material, customer or child data, secrets, cookies, payment records, patient data or confidential documents to a hosted web-research system.

## Relevant public documentation

- Credits, overage behavior and pricing: https://docs.context.dev/account/credits
- Search REST API contract: https://docs.context.dev/api-reference/web-scraping/search
- Read-only usage endpoint: https://docs.context.dev/api-reference/usage/retrieve
- Cursor integration guide: https://docs.context.dev/integrations/cursor-plugin

Prices and plan limits are provider-controlled and may change. Before using any hosted API, check the actual account plan, current balance, hard spending limits, optional auto-reload and commercial-use rights. Do not rely on a promotional grant, assumed rollover or third-party aggregator to establish a zero-cost call. A user-owned Context.dev connection and a third-party aggregator's instant account can have **different meters and payers**.

## Implemented adapter and tests

- \`tools/contextdev_evidence.mjs\` is dependency-free. It plans or performs **one** short source-only search (up to 10 results). It has no automatic crawling, batch processing, scheduled monitors, enrichment, result downloading or production hooks.
- \`searchPublicEvidence\` will refuse all live calls unless \`enabled: true\` and an own-account API key are passed by a reviewed caller. Do not place the enable flag in default app, CI or scheduled agents.
- Result normalization requires provider-reported credit consumption metadata and blocks the pilot if usage exceeds its one-credit limit. It deduplicates links, accepts only externally formatted HTTPS domain URLs, records observed time and request ID, and labels all snippets \`UNVERIFIED_WEB_SNIPPET\`.
- URL filtering covers returned hyperlinks only; it is **not** an SSRF-safe recursive fetch implementation and must never be used as a crawl permission check.
- \`tests/contextdev_evidence.test.mjs\` provides nine deterministic test cases using an injected in-memory transport. All tests avoid live network activity and metered API calls.

## Run the offline checks

\`\`\`bash
node --test tests/contextdev_evidence.test.mjs
npm test
\`\`\`

Test success establishes only that the offline code behaves as expected on fixtures. It does not establish source accuracy, production adoption, entitlement, billability, OAuth completion, browser compatibility or independent security approval.

## Controlled acceptance steps

1. Verify the review branch and its actual CI status on the proposed commit. Require independent review and version-matched evidence.
2. In the account owner’s dashboard, independently verify an account-owned connection, credit balance, plan, auto-topup/spend settings, expiry and applicable terms. Keep actual grant, credit balance, invoice and billing details in **private** company records.
3. Store any REST API key exclusively in a server-side secret manager. Never commit it, print it or pass it to public content.
4. After express, narrowly scoped budget authorization, allow one query returning up to five public search results. Compare actual provider credit usage with the account dashboard. Abort on a mismatch, unverified connection or unexpected charges.
5. Human-review source accuracy, date, provenance, licences, duplication, unsafe content and relevance. Compare against a free/offline baseline on at least 20 preregistered public fixtures.
6. Promote only after accepted engineering, legal, privacy, quality and cost gates. No self-approved release, automatic merge, scheduled spend, publication or third-party outreach.

## Research candidates (not active automation)

Official tool changelogs, open-source licence updates, public benchmark datasets, scientific articles and public learning standards can be reviewed. Do not scrape login-protected resources, copy copyrighted art, ingest private research, or assume website terms grant redistribution rights.

**Disposition:** Review-branch code and offline tests exist. No real Context.dev request was run during this pilot staging, and the account-owned authorization and production approval remain separate requirements.
