# PRYNTOR ENGINEERING / GIT & OPEN-SOURCE SYSTEMS

**P0 company operating standard | issued 18 October 2026 | status: department workspace established, staffing and permissions still to be verified.**

## Mandate and position

The Git Department is an operating function **within existing Pryntor Engineering**, not a new legal entity, and does not supersede the Pryntor Source Vault, Agent Fabric or existing Engineering Director. It owns source custody, OSS discovery, licence and dependency intake, verification evidence, reproducible builds, company-wide repository maps and cross-venture integration controls. The group-wide operating project is [Pryntor Git Department](https://linear.app/pryntor/project/pryntor-engineering-git-and-open-source-systems-department-791494feb98e).

### Organisational roles (appointments not yet verified)

- Accountable: Founder through Engineering Director, who appoints a *Head of Git & Source Engineering*.
- Delivery: maintainers for repository/source mapping, OSS research, developer experience and build engineering.
- Independent: a different accountable reviewer for security, software supply chain, legal/rights and release acceptance.
- Venture owners: approve integration into their private project and its own QA.
- No fictional employees, worker identities or silently delegated scopes. GitHub is currently connected as owner LLoliwe; that account does **not** prove independent peer review.

### Git source custody and release gates

- Authorised canonical repository only; document explicit owner, venture, public/private data classification and licence.
- New project tools are introduced through a procurement/intake ticket with GitHub upstream URL, pinned tag/commit, release cadence, transitive licence/security scan, data permissions, cost and fallback.
- Install only inside isolated branches/containers and run actual import/build/smoke tests. Package manifests or prompts are **not** verified installs.
- Protect main branches and require separate PR review, passing CI on exact head, signed/attributed identity as supported, secret scan, licence and provenance ledger, reproducible lockfile and rollback.
- Apps require mobile/touch, keyboard, accessibility, interaction, web and physical Safari proof. Games additionally require playability and age-appropriate review. Film additionally needs moving performances and visual art-direction QA.
- Never self-approve or auto-merge. Preserve previously approved blockers; fail closed when branch rules, independent review or native engine installation is unavailable.
- Production release, credential access, customer outreach, unbudgeted services and distribution require separate authorisation.
- R0 unapproved spend; no new subscriptions, hidden usage billing or renewals. No client/customer/child data, secrets or private venture IP in public repositories.
- Release failures and incidents create durable tickets, not invented "resolved" labels.

### Repeatable OSS onboarding sequence

DISCOVER -> EVALUATE -> APPROVE PILOT -> INSTALL IN ISOLATION -> RUN REAL QA -> DOCUMENT EVIDENCE -> INDEPENDENT REVIEW -> VENTURE OWNER ACCEPTANCE -> AUTHORISED RELEASE -> MONITOR OR ROLLBACK.

Record for every adoption: URL, upstream SHA/tag, licence, dependency graph, exact package version + lockfile, risks, use case, usage permissions, scan results, runtime install result, test run and timestamp, owner, rollback step and next review date.

### Initial intake: SceneBridge Cinema

| Upstream | Purpose | Proposed licence path | Status |
| --- | --- | --- | --- |
| pmndrs/react-three-fiber | true 3D canvas | MIT | package declared in isolated CI pilot |
| pmndrs/drei | orbit and helper geometry | MIT | package declared in isolated CI pilot |
| pmndrs/react-postprocessing | cinematic effects | MIT | package declared in isolated CI pilot |
| theatre-js/theatre: @theatre/core | sequence API, future keyframes | Apache 2.0 | core only, basic integration |
| 14islands/r3f-scroll-rig | editorial scroll | MIT | scrollbar subset in isolated pilot |
| AcademySoftwareFoundation/MaterialX | material interchange research | Apache 2.0 | research only, NOT installed |
| @theatre/studio | visual authoring UI | AGPL separate | EXCLUDED pending licence review |

Neither a **studio-quality art direction claim** nor a **UE5 interoperability claim** can be established by these dependencies alone.

### First operating metrics

Track weekly: mapped canonical repos with confirmed owner; % repo main branches verified protected; PRs with independent approval; reproducible passing head checks; unreviewed high/critical dependency risk; source/IP incidents; first-pass build success; cross-browser UX quality; rollback lead time; licence exceptions; outstanding blocked migrations.

Do not claim headcount, active staff, actual repo protection, installed packages or CI without direct evidence. Public policies are a baseline; enforce organisation rules once organisational access and protected-branch controls are verified.

### Source of truth / escalation

- [Linear Git Department](https://linear.app/pryntor/project/pryntor-engineering-git-and-open-source-systems-department-791494feb98e)
- [Source Vault, PRY-284](https://linear.app/pryntor/issue/PRY-284)
- [Repository map, PRY-217](https://linear.app/pryntor/issue/PRY-217)
- [SceneBridge, PRY-336](https://linear.app/pryntor/issue/PRY-336)
- Existing group evidence principles: OMEGA R3 PRY-330.
