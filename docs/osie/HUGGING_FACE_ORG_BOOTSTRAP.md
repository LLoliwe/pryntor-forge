# Pryntor | Hugging Face organisation bootstrap

**Canonical operating record:** [PRY-349](https://linear.app/pryntor/issue/PRY-349) under Pryntor Engineering OSIE, with changes staged in the existing [FORGE OSIE draft PR #15](https://github.com/LLoliwe/pryntor-forge/pull/15).

**State on 19 October 2026:** **CREATED / VERIFIED MEMBERSHIP; ADMINISTRATION AND BILLING VERIFICATION PENDING.** A founder-supplied signed-in screenshot shows an existing Company profile named Pryntor, one member, the website pryntor.co.za, an Organization settings link and no organisation card. A fresh, authenticated Hugging Face `hf_whoami` response independently confirms `lebololiwe` belongs to the organisation **Pryntor**, URL **https://huggingface.co/Pryntor**. The screenshot's Team/Enterprise upgrade prompt suggests a non-upgraded tier but does not prove absence of payment methods, charged resources or future billing. OAuth scopes `read-repos`, `read-mcp`, and `jobs` do not grant this connector organisation settings, admin or repository-write capabilities. Membership is not proof of the administrator role. No public card, model training, dataset, model weights or deployed inference are verified.

## Organisation created, complete safe configuration

1. **DONE:** Founder created Pryntor. The exact verified Hub organisation URL is https://huggingface.co/Pryntor. Authenticated `lebololiwe` lists it as an organisation membership.
2. **CHECK ADMIN:** In Organization settings > Members, verify the signed-in founder's role is administrator, not simply member. Enable founder-account 2FA and securely store recovery codes outside source, public discussions and chat.
3. **CHECK R0 BILLING:** In organization and personal billing settings, confirm active plan, payment methods, subscriptions, spending exposure and running Jobs, paid Spaces and Inference Endpoints. Do not assume that an account with no Pro subscription cannot start a metered job. Do not add a payment method or enable paid resources.
4. **CHECK MEMBERSHIP:** Keep membership restricted to authorised people. Do not turn on open joining or organisation email-domain self-enrolment without a security review. Confirm public/private repository permissions for each future repo.
5. **PROFILE DRAFT:** The screenshot showed **AI & ML interests: None defined yet**, and no organisation card. Proposed interests: open-weight foundation models, evaluation and reliability, African-language NLP, multimodal and voice systems, AI for original learning and interactive media, and privacy-first tooling. Use [HUGGING_FACE_ORG_CARD.md](./HUGGING_FACE_ORG_CARD.md) as a prepared profile card source. The official Hub documentation states organisation cards are the `README.md` in a **public Space named README**, or can be edited via the organization's profile. This requires a separate deliberate public publishing action and write access. Do not claim it is published yet.
6. **RECORD EVIDENCE:** Put confirmation of role, billing, permissions and MFA into the private PRY-349 operational receipt without exposing payment details or credentials publicly. A reviewer independent of the author verifies the final gates.

## R0 and independent-model guardrails

- **Organisation only:** Setup does not grant permission to run a job, GPU, Inference Endpoint, or paid Space. Hugging Face's Jobs and upgraded Space hardware are pay-as-you-go on the current plan comparison. Keep all off unless cash cost is explicitly approved in Pryntor governance.
- **No uploads by default:** Avoid uploading models, datasets, weights, training examples, character assets, private source, child/customer data or demos during organisation creation.
- **Free plan visibility:** Do not assume the Free plan can force all new repositories to be private. Review the visibility **for every future repository** and require independent privacy and IP sign-off first. Enterprise-style controls such as enforced private defaults and resource groups are paid-plan features.
- **Credentials:** The connected personal OAuth access is not an organisation administrator credential. If programmatic publishing is later approved, use a scoped and revocable credential with the minimum necessary repository permissions. Keep it outside source control. Read-only research does not require a publishing token.
- **IP and licensing:** Distinguish base model licence, weights, dataset provenance, commercial permission, output/IP rights, dependency security, and human review. Fine-tuning upstream weights must not be described as training a Pryntor foundation model from scratch.
- **No self-certification:** Publication, model release, inference serving, and licence/child-safety approvals must be independently evidenced and signed off.

## Verification gate: completion means all checks pass

- [x] Verified organisation URL and exact handle
- [ ] `lebololiwe` is a confirmed organisation administrator
- [ ] Current active plan independently checked as Free
- [ ] Billing, stored payment methods, subscriptions, jobs and charged resources checked for R0 exposure
- [ ] 2FA on founder identity confirmed without collecting secrets
- [ ] Membership, public permissions and domain self-enrolment reviewed
- [x] New organisation visible in a fresh authenticated Hugging Face connection
- [ ] No model, dataset, Space, or application falsely marked live
- [ ] Evidence receipt filed in PRY-349 and reviewed independently

**Acceptance state:** organisation creation and membership verification complete. Remaining gates: founder admin role, 2FA, complete R0 billing/resource audit, organisation membership and privacy settings, independent receipt and any separately authorised public profile publication. Draft files alone do not satisfy these checks.

## Primary documentation (consult current versions)

- https://huggingface.co/docs/hub/organizations
- https://huggingface.co/docs/hub/organizations-managing
- https://huggingface.co/docs/hub/organizations-cards
- https://huggingface.co/docs/hub/enterprise
- https://huggingface.co/docs/hub/repositories-settings
