# Pryntor Engineering | OSIE R0 company adoption

**Scope:** Pryntor's existing Engineering / Git & Open-Source Systems Department, under [existing Linear PRY-350](https://linear.app/pryntor/issue/PRY-350). This file is a public operating contract, not a production release or organisation-wide GitHub permission rule.

## One tested shared control, independently opted in per existing repo

The central **read-only metadata gate** lives at `.github/actions/osie-review/` in [the same OSIE draft PR](https://github.com/LLoliwe/pryntor-forge/pull/15). Product repositories pin that composite action to an **immutable 40-hex commit**; they do not reference a mutable branch, execute discovered code, or implicitly approve a vendor.

Each vetted existing repo uses:
- `docs/osie/adoption.json` identifying its **own** GitHub repository, its actual venture, canonical `PRY-350`, initial `intake` stage, zero approved new spend, no external code/weights/customer-data transfer/publication, and required independent review.
- A narrowly scoped GitHub workflow watching only the OSIE metadata and workflow changes, with `contents: read`, four-minute timeout, pinned checkout, pinned OSIE action and **no secrets**.

A green check proves **metadata contract validation only**; it does not prove product runtime install, source licences, model safety, role permissions, independent review, contractual clearance, a successful app/device test, or production release. Review is external to the action and cannot be automatically satisfied by the same contributor. Branch ruleset enforcement must be independently verified.

## Public repository pilots, 18 October 2026

- [Corporate website — draft PR #3](https://github.com/LLoliwe/pryntor-company-site/pull/3)
- [Shared OPEN-AI-skills — draft PR #14](https://github.com/LLoliwe/OPEN-AI-skills/pull/14)
- [Knowledge-work-plugins — draft PR #4](https://github.com/LLoliwe/knowledge-work-plugins/pull/4)
- [Shared Anthropic-skills — draft PR #59](https://github.com/LLoliwe/Anthropic-skills/pull/59)
- [Agent-spend-proof — draft PR #17](https://github.com/LLoliwe/agent-spend-proof/pull/17)

All five pilot manifests were independently checked by the same immutable action in **actual pull-request GitHub Actions runs**. Check the individual PRs' latest exact-head checks rather than assuming present-day green from this historical snapshot.

Other privately owned or unmapped operations are recorded **only in the internal Linear inventory**. Do not publish private repository names, client/child assets or secret credential references to a public repo merely to demonstrate coverage.

## Release boundaries

1. **Discover:** use global radar as a metadata reference; provider errors are not empty catalogs.
2. **Inspect:** pin source revision, exact files and hashes, licence and dependency risk; never execute untrusted code at intake.
3. **Sandbox:** zero-approved-spend opt-in, isolated from production/children/customers and recorded at the specific venture.
4. **Independent security, rights and brand/child-safety review:** verifiable human reviewer who did not author the change.
5. **Production:** exact-head app/browser/real-device tests and explicit venture owner/founder signoff, separate from OSIE metadata acceptance.
6. **Operate:** responsible maintainer, dependency monitoring, rollback evidence, incident process and funding caps.

**Hard STOP:** custom model code not independently evaluated; unclear licence/weights/training data; API key or paid GPU requests without authorisation; branch protection not demonstrably enforced; missing independent reviewer; physical-product or child-safety QA absent; production deployment unverified.

## R0 and source-of-truth constraints

- No new Pryntor ventures, departments, repositories or duplicate issue/project records. OSIE remains part of the existing Engineering group.
- No automatic spending, remote publication, subscription activation, server deployment, model weights/inference or outbound communications.
- Existing user-owned GitHub repos **are not proof of a true GitHub organization account** or centrally enforced organisation rulesets.
- For private repos where CI minutes may carry cost, stage documentation without new workflows until resource permissions and financial gate are verified. Keep those names inside private Linear records.
- Existing safety-denied repository edits must not be rerouted to evade the restriction.

Central engineering standard: [OSIE charter](https://linear.app/pryntor/document/engineering-osie-charter-hugging-face-model-registry-and-independent-2f6ddfb938e9).
