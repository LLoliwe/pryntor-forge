# Pryntor FORGE open-source scene playground: agent and engineer instructions

This file applies to this repository unless a deeper `AGENTS.md` imposes stricter scope. It is an onboarding aid for new/existing agents and human software engineers, **not** an authorisation to publish, spend or deploy.

## Identity and status

Public, MIT-licensed **alpha** local-first scene playground. The README explicitly does not claim professional CAD, a physics engine, unrestricted AI text-to-3D, or a finished Pascal importer.

## Operating contract

1. Read this file, project README, actual source, any nested instructions and test/runbook before editing.
2. Keep PRs focused; never self-merge, add telemetry/secrets, run paid services or claim tests/deployments you did not observe.
3. Respect original/licensed assets and all contributors' rights. Work from synthetic examples and never leak customer/private data.
4. Include in every handoff: branch/commit/PR, changed paths, exact test commands and results (or `NOT_RUN`), unverified assumptions and safe next action.

## Project-specific safeguards

1. Start with `README.md` and actual scene contracts. Keep claims aligned to implemented deterministic grammar and export paths.
2. Use Node >=20. Existing documented checks are `npm test` and `npm run check`; record exact results, and never fabricate a run.
3. Keep no-login, no-API-key, no-telemetry, no-cloud-processing assumptions intact unless a change is separately justified and reviewed.
4. Preserve licences and attribution; do not introduce licensed 3D model assets or tracking scripts without proof of rights.
