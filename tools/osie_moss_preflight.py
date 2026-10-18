#!/usr/bin/env python3
"""OSIE MOSS-Image local runtime readiness gate (never installs or executes a model).

This gate checks model/rights/reviewer metadata and opt-in local CUDA visibility.
It cannot independently verify reviewer identity, licensing, GPU quota or model
safety. Passing means prerequisites are documented, NOT clearance to infer.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

MODEL_IDS = frozenset({
    "openmoss-moss-image-base",
    "openmoss-moss-image-sft",
})
HEX40 = re.compile(r"^[0-9a-f]{40}$")
MIN_SNAPSHOT_GIB = 20


def cuda_device_report(run=subprocess.run, which=shutil.which):
    binary = which("nvidia-smi")
    if not binary:
        return {"present": False, "reason": "NVIDIA_SMI_MISSING"}
    try:
        p = run([binary, "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=5, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return {"present": False, "reason": "NVIDIA_SMI_FAILED"}
    if p.returncode != 0 or not p.stdout.strip():
        return {"present": False, "reason": "GPU_NOT_VISIBLE"}
    return {"present": True, "details": p.stdout.strip().splitlines()[:4]}


def inspect_manifest(record, local_snapshot=None, cuda=None):
    reasons = []
    if record.get("id") not in MODEL_IDS:
        reasons.append("UNKNOWN_MODEL")
    if record.get("status") != "approved":
        reasons.append("MODEL_NOT_APPROVED")
    if not isinstance(record.get("revision"), str) or not HEX40.fullmatch(record["revision"]):
        reasons.append("HF_REVISION_UNPINNED")
    if any(record.get(name) is not True for name in
           ("license_reviewed", "data_rights_reviewed", "security_reviewed",
            "cost_reviewed", "rollback_tested")):
        reasons.append("RIGHTS_SECURITY_COST_ROLLBACK_NOT_APPROVED")
    if record.get("unresolved_high_risk_count") != 0:
        reasons.append("UNRESOLVED_SOURCE_RISK")
    if not record.get("independent_reviewer"):
        reasons.append("INDEPENDENT_REVIEW_MISSING")
    if local_snapshot is None:
        reasons.append("MODEL_SNAPSHOT_NOT_SUPPLIED")
    else:
        snapshot = Path(local_snapshot)
        if not snapshot.is_dir() or snapshot.is_symlink():
            reasons.append("LOCAL_SNAPSHOT_MISSING")
        elif not (snapshot / "model_index.json").is_file() or not (
            snapshot / "pipeline_moss_image.py").is_file():
            reasons.append("MODEL_SNAPSHOT_INCOMPLETE")
    if cuda is None:
        cuda = cuda_device_report()
    if not cuda.get("present"):
        reasons.append("CUDA_UNAVAILABLE")
    return {"model": record.get("id"),
            "status": "BLOCKED" if reasons else "PREREQUISITES_PRESENT_REVIEW_NOT_A_RELEASE",
            "blockers": sorted(set(reasons)),
            "cuda": {"present": bool(cuda.get("present"))},
            "attestation": "No imports, weight downloads, model code or inference executed."}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--manifest", type=Path, required=True)
    p.add_argument("--snapshot", type=Path, default=None,
                   help="existing, independently reviewed local model snapshot path")
    p.add_argument("--probe-cuda", action="store_true",
                   help="opt in to executing only the trusted installed nvidia-smi utility")
    args = p.parse_args()
    try:
        data = json.loads(args.manifest.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("invalid manifest")
        cuda = cuda_device_report() if args.probe_cuda else {
            "present": False, "reason": "PROBE_NOT_REQUESTED"}
        result = inspect_manifest(data, local_snapshot=args.snapshot, cuda=cuda)
    except (OSError, ValueError, json.JSONDecodeError):
        print(json.dumps({"status": "ERROR", "reason": "INVALID_MANIFEST"}))
        return 2
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PREREQUISITES_PRESENT_REVIEW_NOT_A_RELEASE" else 3


if __name__ == "__main__":
    raise SystemExit(main())
