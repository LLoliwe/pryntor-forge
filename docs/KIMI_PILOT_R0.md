# Pryntor Kimi | OMEGA R0 evidence-gated pilot

Status: **offline synthetic prototype only**, 18 October 2026. No authenticated Kimi session, API key, credits, partner acceptance, live calls or production integration is implied by this repository addition.

## The core offer to Moonshot

Pryntor proposes to contribute independently verifiable integration patterns for a South African developer/venture studio, with two focused research tracks: (1) FORGE structured scene-plan and safe tool-use evaluation; (2) optional Recover read-only synthetic merchant operations. Additional product use requires a separate owner review. We seek a written, non-exclusive 60-day sponsored evaluation, hard R0 non-billable stop, technical partner/FDE contact and clarity on South African eligibility and data usage. Pryntor has no claimed enterprise deployments, customers or bank-confirmed revenue.

## Model and surface selection (not interchangeable)

- Kimi Chat Projects: instructions and files, manual onboarding. No API key implied.
- Kimi K3: current flagship with 1M-context claim. Intended for long-context evidence review, only when granted or through permitted UI usage.
- Kimi K2.7 Code: coding-specific API offer with 256k context, subject to actual access, cost and measured benefit.
- Kimi K3 Swarm: large research task delegation, product membership/credit eligibility must be checked. Do not assume free credits or spawn expensive swarms.
- Kimi Code: local CLI-based engineering where environment permitted.
- Kimi Claw: unattended actions present greater security and recurring cost risk. Excluded from R0 until independently reviewed.

Official sources (read on 18 Oct):
- https://www.kimi.com/news/kimi-enterprise-partner-program
- https://www.kimi.com/en/help/features/project
- https://www.kimi.com/en/help/agent/agent-swarm
- https://www.kimi.com/en/help/plugins-and-skills/overview
- https://platform.kimi.ai/

## Activation requirements

Run `evaluateAccessGate` using independently verified booleans. It intentionally fails closed on every missing requirement. A passed gate is **permission to have a human review activation**, not approval to trigger API spend. API-side charges must be technically impossible before use: a written credit grant is not itself a hard cap. No payment instrument, usage overage, auto-renewal or personal/child/merchant data.

## Blind controlled comparison

Use the *same* 40-100 synthetic tasks for Kimi and baselines (where legitimately available); fix schemas before scoring. Balance task classes: structured FORGE scene edit, uncertainty/abstention, code patch triage, evidence-based global sourcing, consent/privacy, and Recover sandbox decisions. Record input hash, model/version, prompts, timestamps, output hash, latency, nominal tokens, billed amount, model source, evaluator and blinded independent rating. No favorable-case cherry-picking. No benchmark claims without actual provider calls and independent evaluation.

Primary metrics: contract-valid outputs, task success, false approvals, correct abstentions, unauthorized tool calls, citation support (human-verified separately), latency p50/p95, attempted and actual USD cost, reproducibility and negative regressions. Passing the offline harness does **not** establish citation truth, creative quality, security or product readiness.

## 20-Fury adversarial review checklist

1. Strategic fit and differentiated value. 2. Actual South African eligibility. 3. Corporate identity credibility. 4. Baseline and counterfactual. 5. Model selection drift. 6. Tool-call reliability. 7. Coding regression risk. 8. Cost and token burn. 9. Non-billable cap enforcement. 10. Data minimisation. 11. Retention and training rights. 12. IP ownership and licence. 13. POPIA and cross-border transfer. 14. Children's data exclusion. 15. Partner commercial leverage. 16. Non-exclusivity. 17. Binding obligations. 18. Evidence quality. 19. Independent reproducibility. 20. Founder final approval.

## Evidence labels

- **PASS: offline evaluator** means deterministic harness unit tests ran, nothing more.
- **BLOCKED: live inference** means no documented sponsor grant and approved isolated credentials.
- **BLOCKED: partnership submitted** until official receipt exists.
- **BLOCKED: production** until independent privacy, quality, security and product gates clear.

## Local verification

```bash
node --test test/kimi-pilot-gate.test.mjs
```

The code is opt-in, pure Node and has no network, telemetry, secrets, npm dependency or Kimi call. Do not add an API client to this path until provider sponsorship and the access gate are verified.

Safety red-team fix: a single actual charge, unauthorized tool call, malformed case, missing evidence or other integrity violation blocks the review-ready flag even when accuracy exceeds 95%. Only exact locally allowlisted read operations and HTTPS citations are accepted by the offline contract checker; citation truth still needs independent verification.

## OMEGA R3 verified offline hardening, 18 October 2026

The R2 model map above is superseded by current official Kimi Code documentation:
`k3`, `k3-256k`, `kimi-for-coding` (K2.8 Preview), and
`kimi-for-coding-highspeed` (K2.7 Code HighSpeed). Code membership endpoints and
Open Platform token billing are different entitlements. No account quota is verified.
Source: https://www.kimi.com/en/help/kimi-code/models

Independent audit reproduced sparse arrays, inherited access flags, missing IDs,
credential-bearing citations and arbitrary evidence labels bypassing the old gate.
Repairs require own access declarations, dense validation and SHA256 references
whose bytes exist in a trusted caller registry. Byte identity does not establish
provider authenticity, truthful billing or factual source support. Never pass
model-generated registry entries as independent evidence.

`src/kimi-offline-runner.mjs` is a vendor-neutral recorded-response import adapter,
not a network API client. It checks exact model version, source SHA, frozen fixture
hash, case ordering, output hash and p50/p95 latency. No tool execution, automatic
fallback, retry, hosted job or API spending is available. Rollback: stop importing
the opt-in modules or revert this PR. Nothing is wired into the web application.

40 synthetic decision cases in `test/fixtures/kimi/portfolio-v1.json` cover ZOWIBO,
FORGE, Recover, Robotics and Studios/LVL7. They test approval discipline only,
not animation taste, geometry execution, game responsiveness or model skill.
Oracle fixture replay is NOT a baseline model result. Recordings must later come
from approved provider calls under independently verified entitlement; independent
human scoring of correctness, creativity, maintainability, real-device behavior
and regressions remains required.

Reproduce: `npm test` and `npm run check`. Original 30 gate tests plus 15 separately
authored independent regression tests and 6 replay tests pass, along with 8 existing
FORGE tests: 59 total. See `KIMI_INDEPENDENT_AUDIT_20261018.txt` for the 20-category
dispositions and explicit activation refusal. No Kimi response has been benchmarked.
