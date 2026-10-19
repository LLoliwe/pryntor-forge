# Open Source Intelligence & Engineering (OSIE)

A **draft, review-gated** GitHub and Hugging Face upstream-intelligence workflow. This directory contains only public, non-confidential process material and candidate metadata, **not** deployed model weights, client materials, or approved integrations.

## Why this exists
Adoption decisions need reproducible evidence, not GitHub stars, likes, marketing screenshots, or arbitrary model rankings. OSIE records which upstream version was assessed, what licence and rights were checked, exactly what was tested, and which independent human accepted the residual risk.

## Candidate lifecycle
`intake` → `screening` → `sandbox` → `independent-review` → `approved` or `rejected` or `on-hold`.

An intake record does **not** authorize cloning and executing scripts, model download, live GPU inference, paid compute, connection to production, customer data, or commercial release. A candidate must not become `approved` until each gate in the registry manifest is supported by durable evidence.

## Technical contract
- Record canonical upstream URL, exact git commit or immutable Hub revision, SPDX expression, licence evidence, model/dataset provenance evidence, maintainer, security posture, expected infra spend, evaluation methodology and rollback evidence.
- Verify weights and inference code separately, including transitive dependencies and training/asset rights. A licence tag alone is not complete legal clearance.
- No `trust_remote_code=True`, `curl | bash`, custom install hooks, third-party tokens, or untrusted model artefacts without separate security review in isolation.
- No private source, customer inputs, children's data or unreleased IP in public records.
- Run independent benchmark on synthetic/releasable fixtures, compare against an incumbent baseline; show failure cases and device/resource measurements.
- Run independent reviewer approval. The PR author cannot certify their own work. Product/brand owner approval is separate.
- Any GPU or hosted job requires explicit cost visibility and approval before execution. **R0 unapproved spend.**
- Vendor attribution is not vendor endorsement.

## Offline validator
```bash
python3 tools/osie_validate.py docs/osie/registry/*.json
python3 -m unittest discover -s tests -p 'test_osie_validate.py'
```
No model download, GPU, network connection, pip install, or paid service is required for this metadata validation.

## First pilot
MOSS-Image Base and SFT: https://github.com/OpenMOSS/MOSS-Image , with official model cards at https://huggingface.co/OpenMOSS-Team/MOSS-Image-Base and https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT . Reported Apache-2.0 licensing, 5B-class architecture, text/layout control. These records intentionally remain **intake / not approved** until pins, licence audit, remote code security review, independent evaluations and actual testing are complete.

## Measure outcomes, not activity
Candidates assessed; reproducibly tested; independently approved; integrations delivered; defects prevented; upstream contributions accepted; licence/security exceptions; actual cash cost. Do not report task creation as adoption, workflow scripts as installed protections, or simulated tests as production proof.

Internal SOP and ownership stay in Pryntor Engineering's controlled tracker. Public files deliberately disclose no internal confidential evidence.
