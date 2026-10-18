#!/usr/bin/env python3
"""Pryntor OSIE adoption manifest contract. Offline and metadata-only.

Executed by the centrally pinned GitHub composite action; never imports
upstream software, downloads model weights or sends repository metadata.
This check is NOT an independent approval or a GitHub branch ruleset.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

FIELDS = {
    "schema_version", "repository", "venture", "stage", "osie_issue",
    "public_metadata_only", "execute_external_code", "allow_model_weights",
    "allow_external_data_transfer", "approved_new_spend_zar",
    "independent_review_required", "independent_review_url",
    "release_approved", "candidate_adoptions"
}
STAGES = {"intake", "sandbox", "review", "approved"}
REPO = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
REV = re.compile(r"^[0-9a-f]{40}$")


def secure_https(url):
    if not isinstance(url, str):
        return False
    u = urlsplit(url)
    return (u.scheme == "https" and bool(u.hostname) and
            not u.username and not u.password and not u.fragment)


def validate(record, expected_repo=None):
    e = []
    if not isinstance(record, dict):
        return ["expected a JSON object"]
    e.extend("missing field: " + k for k in sorted(FIELDS - set(record)))
    e.extend("unexpected field: " + k for k in sorted(set(record) - FIELDS))
    if e:
        return e
    if record["schema_version"] != 1 or isinstance(record["schema_version"], bool):
        e.append("schema_version must be 1")
    repo = record["repository"]
    if not isinstance(repo, str) or not REPO.fullmatch(repo):
        e.append("invalid repository")
    if expected_repo and repo.lower() != expected_repo.lower():
        e.append("repository identity mismatch")
    if not isinstance(record["venture"], str) or not record["venture"].strip():
        e.append("venture must be nonempty")
    if record["stage"] not in STAGES:
        e.append("unrecognised stage")
    if record["osie_issue"] != "PRY-350":
        e.append("use existing canonical PRY-350, not a new backlog")
    if record["public_metadata_only"] is not True:
        e.append("OSIE adoption is public-metadata-only")
    if record["independent_review_required"] is not True:
        e.append("independent review cannot be disabled")
    for key in ("execute_external_code", "allow_model_weights",
                "allow_external_data_transfer", "release_approved"):
        if not isinstance(record[key], bool):
            e.append(f"{key} must be boolean")
    cost = record["approved_new_spend_zar"]
    if isinstance(cost, bool) or not isinstance(cost, (int, float)) or cost != 0:
        e.append("OSIE R0 rollout must have zero approved new spend")
    candidates = record["candidate_adoptions"]
    if not isinstance(candidates, list):
        e.append("candidate_adoptions must be an array")
        candidates = []
    if record["stage"] == "intake":
        if candidates:
            e.append("intake must not declare adopted candidates")
        if record["independent_review_url"] is not None:
            e.append("intake may not invent independent approval")
        if any(record.get(k) is not False for k in
               ("execute_external_code", "allow_model_weights",
                "allow_external_data_transfer", "release_approved")):
            e.append("intake must not activate external code, models, network or release")
    else:
        # A future vetted adoption requires an actual human and product-specific
        # review. This opt-in gate never grants production rights.
        if not secure_https(record["independent_review_url"]):
            e.append("non-intake requires documented HTTPS independent review")
        if not candidates:
            e.append("non-intake requires scoped candidate evidence")
        for item in candidates:
            if not isinstance(item, dict):
                e.append("candidate must be an object")
                continue
            if not secure_https(item.get("source_url")):
                e.append("candidate missing HTTPS canonical source")
            if not isinstance(item.get("immutable_sha"), str) or not REV.fullmatch(item["immutable_sha"]):
                e.append("candidate missing immutable 40-hex revision")
            if not secure_https(item.get("license_evidence")) or not secure_https(item.get("security_evidence")):
                e.append("candidate missing rights/security evidence")
        if any(record.get(k) is True for k in ("execute_external_code",
               "allow_model_weights", "allow_external_data_transfer", "release_approved")):
            e.append("OSIE manifest cannot enable runtime/external code/release")
    return e


def main(argv=None):
    import argparse
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("manifest")
    p.add_argument("--expected-repo", default=os.environ.get("GITHUB_REPOSITORY", ""))
    args = p.parse_args(argv)
    path = Path(args.manifest)
    # Manifest must be in the checked-out repository, not an arbitrary host path
    # or symlink. Do not follow symlinks into private files.
    if path.is_absolute() or ".." in path.parts or path.is_symlink():
        print("OSIE FAIL: unsafe manifest path")
        return 2
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        reasons = validate(data, args.expected_repo or None)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError):
        print("OSIE FAIL: unreadable or invalid JSON manifest")
        return 2
    if reasons:
        for item in reasons:
            print("OSIE FAIL:", item)
        return 1
    print("OSIE PASS: valid adoption metadata only; no code installed or approved")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
