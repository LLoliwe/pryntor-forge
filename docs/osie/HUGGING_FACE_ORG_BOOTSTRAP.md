# Pryntor | Hugging Face organisation bootstrap

**Canonical operating record:** [PRY-349](https://linear.app/pryntor/issue/PRY-349) under Pryntor Engineering OSIE, with changes staged in the existing [FORGE OSIE draft PR #15](https://github.com/LLoliwe/pryntor-forge/pull/15).

**State on 19 October 2026:** **NOT CREATED / NOT VERIFIED.** The connected Hugging Face identity is the personal account `lebololiwe`. Its current OAuth scopes allow `read-repos`, `read-mcp`, and `jobs`, but no organisation creation, repository write, or organisation administration action is exposed. No Hugging Face organisation membership is visible to that connection. A public page lookup does not prove handle availability. These facts must not be rewritten as a successful organisation setup.

## Founder-controlled creation step

1. Sign into https://huggingface.co/organizations/new as `lebololiwe`. Never share a password, TOTP code, recovery code, or token in issues or chat.
2. Enter the display name **Pryntor**, and request `pryntor` as the handle, only if the form confirms it is available. Do not improvise a different brand handle without approval.
3. Choose **Free**. Do not select Team or Enterprise, enter a payment card, accept an auto-renewal, fund credits, create paid compute, or enable pay-as-you-go services.
4. Retain `lebololiwe` as the initial organisation administrator, and enable 2FA on that identity. Do not invite other people or enable organisation email-domain self-enrolment until their access and role have been authorised.
5. After creation, record a verified organisation URL, owner/admin role, active plan, billing and payment method state, date, and redacted evidence in the internal PRY-349 record. Do not expose billing screenshots or private account data in this public repository.
6. When approved for public publication, use [HUGGING_FACE_ORG_CARD.md](./HUGGING_FACE_ORG_CARD.md) as the source text for the organisation profile card. Hugging Face implements organisation cards as the `README.md` of a public Space named `README`. Creating that Space is a separate publication action, not part of this draft.

## R0 and independent-model guardrails

- **Organisation only:** Setup does not grant permission to run a job, GPU, Inference Endpoint, or paid Space. Hugging Face's Jobs and upgraded Space hardware are pay-as-you-go on the current plan comparison. Keep all off unless cash cost is explicitly approved in Pryntor governance.
- **No uploads by default:** Avoid uploading models, datasets, weights, training examples, character assets, private source, child/customer data or demos during organisation creation.
- **Free plan visibility:** Do not assume the Free plan can force all new repositories to be private. Review the visibility **for every future repository** and require independent privacy and IP sign-off first. Enterprise-style controls such as enforced private defaults and resource groups are paid-plan features.
- **Credentials:** The connected personal OAuth access is not an organisation administrator credential. If programmatic publishing is later approved, use a scoped and revocable credential with the minimum necessary repository permissions. Keep it outside source control. Read-only research does not require a publishing token.
- **IP and licensing:** Distinguish base model licence, weights, dataset provenance, commercial permission, output/IP rights, dependency security, and human review. Fine-tuning upstream weights must not be described as training a Pryntor foundation model from scratch.
- **No self-certification:** Publication, model release, inference serving, and licence/child-safety approvals must be independently evidenced and signed off.

## Verification gate: completion means all checks pass

- [ ] Verified organisation URL and exact handle
- [ ] `lebololiwe` is a confirmed organisation administrator
- [ ] Current active plan independently checked as Free
- [ ] Billing, stored payment methods, subscriptions, jobs and charged resources checked for R0 exposure
- [ ] 2FA on founder identity confirmed without collecting secrets
- [ ] Membership, public permissions and domain self-enrolment reviewed
- [ ] New organisation visible in a fresh authenticated Hugging Face connection
- [ ] No model, dataset, Space, or application falsely marked live
- [ ] Evidence receipt filed in PRY-349 and reviewed independently

**Acceptance state:** blocked on authenticated organisation creation and live administrative verification. Draft GitHub files alone do not satisfy these checks.

## Primary documentation (consult current versions)

- https://huggingface.co/docs/hub/organizations
- https://huggingface.co/docs/hub/organizations-managing
- https://huggingface.co/docs/hub/organizations-cards
- https://huggingface.co/docs/hub/enterprise
- https://huggingface.co/docs/hub/repositories-settings
