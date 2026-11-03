# Pryntor App Recon Kit R0

Status: Draft technical pilot, opt-in only. Not a blanket installation or a clone-any-app guarantee.

## Purpose

An app is not a screenshot. Study authorised experiences, define actual navigation and state transitions, implement working interactions with original art and copy, and independently verify them on browsers and physical devices. This local-first kit extends existing FORGE and production quality gates rather than creating a separate company brain.

## Working commands (Node 20+)

- npm run recon -- catalog
- npm run recon -- init my-product game
- npm run recon -- plan my-product.app-recon.json
- npm run recon -- verify my-product.app-recon.json ./evidence/evidence.json
- npm test
- npm run check

The default manifest refuses release, third-party asset copying, outside connections, automatic downloads and nonzero unapproved spending. The verifier checks proof files in the specified evidence directory and binds them to a spec hash. Missing, duplicate, unsafe, or false-status gate entries cause a blocked result. A fully populated bundle is only EVIDENCE_COMPLETE_REQUIRES_HUMAN_VALIDATION, never automatically production-ready. Proof authenticity and reviewer identity must be confirmed independently.

## Source registry

See docs/app-recon-sources.json. Its six upstream projects are reference candidates, not vendored or executed code. MIT licenses apply to the selected projects; Clone Wars is an AGPL-3.0 index whose individual links carry separate rights. Open Lovable requires potentially metered APIs and sandboxes. Android Agent defaults to an unauthenticated 0.0.0.0 service, so it is restricted from all devices/accounts until security approval.

## Opt-in venture map

- ZOWIBO: original game and character art, child safety, working Play and Restart, full-screen, real iOS Safari.
- LVL7: true physics/biology interactions, accessibility, assessment and educator review.
- BTWW: mobile editorial/music discovery, copyright-clean media, ticket journeys.
- Recover: merchant isolation, PayPal sandbox proof, decision trace and test data boundaries.
- Tirisano: forms/search, institutional and travel journeys, real mobile usability.
- Studios: cinematic playback, rights, performance and reduced-motion support.
- Robotics: simulation and enterprise consoles, no unrestricted hardware control.
- Lens: private camera/microphone permissioning, phone-first demo, no production device access.

Sequence: test a wholly original non-child/non-customer demo first. Each venture must opt in, produce its own spec, retain actual logs/screenshots, pass independent visual/device QA and obtain owner release approval. No automatic company-wide repo edits.

## Not yet implemented

No live URL scraping or screenshot cloning, no third-party repo installation, no hosted model calls, no device farm, no hardware pairing and no production deployments. Existing FORGE PRs remain untouched. Keep project manifests and customer evidence in appropriately private storage; do not publish proprietary material in this public repository.
