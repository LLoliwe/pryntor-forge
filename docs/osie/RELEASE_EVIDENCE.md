# Shared release evidence check

This optional, offline check extends the existing OSIE QA work. It can be reused by existing Pryntor products. It is not deployed company-wide, does not collect live evidence, and does not grant release permission or certify enterprise readiness.

Run `node tools/release_evidence_gate.mjs TRUSTED_POLICY.json EVIDENCE.json`.
Exit 0 means internally consistent supplied evidence only. Exit 1 blocks inconsistent evidence; exit 2 indicates an input/runtime error. No packages, API keys, network requests or paid services are required.

The trusted policy must be maintained separately from candidate-generated evidence. Required fields: `expectedHead` (full Git SHA), nonempty unique arrays `requiredChecks`, `requiredGates`, `allowedReviewers`, and `maxAgeHours` (1 through 168). Obtain the head and reviewer identities from authoritative repository records. An agent must not supply its own reviewer allowlist or reduce required gates.

Evidence requires `head`, `author`, `collectedAt`, `checks`, `gates`, and `reviews`. Each check/gate needs `name`, `head`, `status: passed`, `url` (HTTPS evidence link), `completedAt`. Each check also needs positive integer `passed` and zero `failed` and `skipped`. Each review needs `reviewer`, `head`, `state`, `url`, `submittedAt`. Supply the full current review history, including dismissals and changes requested, not only favorable approvals. The latest record per reviewer wins; equal timestamps use the later input record. Tests contain a complete synthetic example, not company release proof.

Production collectors must authenticate provider responses, enforce repository and workflow identity, verify completeness and pagination, and compare fresh branch heads before making a decision. HTTPS syntax alone does not establish provenance. This checker cannot detect fabricated or omitted records. Do not use it as a branch-protection replacement.

## Required adoption scope within existing ventures

Owners must select measurable acceptance requirements before a candidate is built. Suggested coverage:

- Every software product: functional journeys, security review, dependency rights, accessibility, rollback exercise, monitoring/incident ownership and independent review.
- Games and child-facing learning: physical-device interactions, visual/character continuity, educator review, privacy and child safety.
- Studios and brand assets: source and commercial rights, character continuity, editability, actual target-app import, audiovisual review.
- Robotics: reproducible simulation conditions, latency/failure evidence and qualified safety review; simulation does not authorize hardware use.
- Enterprise customer systems: tenant isolation, access revocation, audit trails, restore exercise and explicit service/recovery targets verified in the real deployment.

These requirements are acceptance work, not features this checker implements. No new venture or backlog is created. Existing PRY-348 independent review and PRY-340 repository protections remain the appropriate control paths. A production rollout still requires independent human review and venture owner acceptance.

## Local verification

29 new targeted tests passed. Existing QA tests also passed (33 combined). Full repository run: 48 passed, 4 optional native-parser tests skipped, 0 failed. Syntax checks and existing workflow guard passed. New CI result must be checked at the committed head; no native parser revalidation or physical-device validation is claimed here.
