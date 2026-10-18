# SceneBridge R0 cloud execution: 18 October 2026

## Current verified status
- Blender 4.0.2 original four-material fixture exported, preflight validated and planned in existing GitHub CI: PASS.
- New cloud-worker launcher `scenebridge/cloud_ue5_runner.sh` and manual workflow `.github/workflows/scenebridge-native-ue5.yml`: SOURCE ADDED, NOT YET EXECUTED WITH UNREAL.
- Native UE5 import, rendered parity, collision and game QA: PENDING ACTUAL ENGINE EXECUTION.
- All company ventures inherit the same optional adapter only after explicit owner acceptance. No production or public-brand claim.

## AWS account read-only verification and quota work
- At 2026-10-18, us-east-1 EC2 instance inventory returned zero running or stopped instances.
- The AWS budget `Pryntor-R0-Early-Warning-USD1` was active; the latest computed actual spend was USD 0.00. **Budget alarms are not spending caps**.
- Cost Explorer GetCostAndUsage returned DataUnavailable, so current account-wide spend is not independently reconciled.
- EC2 G/VT On-Demand quota `L-DB2E81BA` was **0 vCPUs** before the request.
- Quota-increase request submitted for **4 vCPUs**, request id `4be41c55c478491db83fad2cfa44a31cqN4WSai4`, status **PENDING**. A quota approval is neither a GPU instance, a credit entitlement, nor a cost approval.
- **No EC2 instance, EBS volume, NAT gateway, image, paid runner or GPU has been provisioned.**

## Cloud-native execution contract

The added workflow uses `workflow_dispatch`, so ordinary pushes never start a potentially billed UE5 job. It requests runner labels `self-hosted, linux, x64, unreal-engine-5` and expects all of these on a separately approved Linux cloud worker:

1. `blender` with Python ABI dependencies and `python3`.
2. Legal Unreal Engine 5 Editor Linux build with Python Editor Script plugin available and an executable `UnrealEditor-Cmd`. Set runner environment `UE5_EDITOR_CMD` to its absolute executable path.
3. Sufficient disk, memory, and GPU/software-RHI support for the chosen UE5 release. The automation invokes `-nullrhi` for nonvisual asset-import smoke, and does not claim GPU-rendered parity.
4. GitHub Actions self-hosted runner registered privately to this repo with `unreal-engine-5` label, secured, limited to authorised workflows and de-registered after QA. Do not attach privileged long-lived AWS keys. Do not run untrusted PR code on a privileged runner.
5. Cloud spending preauthorised at an agreed **hard ceiling**; AWS Budgets alone will not physically stop instances or network/storage charges. Avoid idle recurring costs; delete only resources created specifically for this pilot once logs are preserved.

The workflow generates original synthetic geometry, validates manifest, writes a new isolated .uproject, executes the real UE5 Python importer, captures the editor log and a machine-readable `cloud-validation.json`. Report `native_unreal_success=true` is only possible when UE process exits zero, importer produces a report, at least one asset imported and there are zero unmatched material slots. If not, job fails closed. It never asserts visual or gameplay QA.

## Immediate blockers
1. **Zero-spend constraint:** no verified free GPU worker / authorised spend cap yet, so leave the self-hosted job queued or untriggered. Do not assume AWS startup credits pay for a specific EC2 GPU instance.
2. **GPU quota:** request is pending, not approved.
3. **Epic UE access / entitlement:** must authenticate through authorised Epic/EULA access, not publicize proprietary engine binaries. Never put tokens in source or CI logs.
4. **UE install + runtime:** no enrolled, compatible UE5 cloud runner has been independently demonstrated.
5. **Visual parity review:** requires rendered images and independent check after native import proof.

## Recommended next gate
Verify quota/credits and Epic authorization. Then provision a *temporary isolated* UE5 Linux cloud worker only with a proven zero-charge entitlement or separately approved capped spend. Run manual CI; retain engine version, importer report, same-camera captures, hashes, licensing ledger. Independent sign-off before ready-for-review, merge or brand adoption.

References:
- PR: https://github.com/LLoliwe/pryntor-forge/pull/8
- Existing successful Blender CI: https://github.com/LLoliwe/pryntor-forge/actions/runs/39108822697
- Group issue: https://linear.app/pryntor/issue/PRY-336
- Company runbook: https://docs.google.com/document/d/1pGCDigkVN0_NWzSrd2D5ORW4UDZ2hA0iiOyYyF4ipDs/edit
