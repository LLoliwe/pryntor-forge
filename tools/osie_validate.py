#!/usr/bin/env python3
"""Offline, dependency-free OSIE candidate metadata review. Does NOT install or run models."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse

REQUIRED = (
    "id", "name", "type", "canonical_url", "upstream_code_url",
    "revision", "declared_license", "license_reviewed",
    "data_rights_reviewed", "security_reviewed", "cost_reviewed",
    "estimated_cash_cost_zar", "spend_approval_evidence",
    "benchmark_evidence", "rollback_tested", "independent_reviewer",
    "author", "status",
)
STATUSES = {"intake", "screening", "sandbox", "independent-review",
            "approved", "rejected", "on-hold"}
KINDS = {"repository", "model", "dataset", "space", "paper", "tool"}
REVIEW_EVIDENCE_FIELDS = (
    "license", "data_rights", "security", "cost", "rollback", "independent_signoff",
)
# The offline gate only checks evidence references and metadata consistency.
# It cannot authenticate signatures, reviewer identity or actual rights clearance.


def is_https_url(value: object) -> bool:
    if not isinstance(value, str):
        return False
    parts = urlparse(value)
    return parts.scheme == "https" and bool(parts.netloc) and not parts.username


def validate_candidate(record: object) -> list[str]:
    if not isinstance(record, dict):
        return ["manifest must be a JSON object"]
    errors: list[str] = []
    for field in REQUIRED:
        if field not in record:
            errors.append(f"missing required field: {field}")
    if errors:
        return errors
    if record["status"] not in STATUSES:
        errors.append("unknown status")
    if record["type"] not in KINDS:
        errors.append("unknown candidate type")
    for field in ("canonical_url", "upstream_code_url"):
        if not is_https_url(record[field]):
            errors.append(f"{field} must be HTTPS")
    for field in ("id", "name", "declared_license", "author"):
        if not isinstance(record[field], str) or not record[field].strip():
            errors.append(f"{field} must be nonempty")
    for field in ("license_reviewed", "data_rights_reviewed",
                  "security_reviewed", "cost_reviewed", "rollback_tested"):
        if not isinstance(record[field], bool):
            errors.append(f"{field} must be boolean")
    cost = record["estimated_cash_cost_zar"]
    if cost is not None and (isinstance(cost, bool) or not isinstance(cost, (int, float)) or cost < 0):
        errors.append("estimated_cash_cost_zar must be nonnegative number or null when unknown")
    if not isinstance(record["benchmark_evidence"], list):
        errors.append("benchmark_evidence must be a list")
    if record["status"] == "approved":
        if cost is None:
            errors.append("approved candidate must have a verified numeric cash cost estimate")
        for field in ("license_reviewed", "data_rights_reviewed",
                      "security_reviewed", "cost_reviewed", "rollback_tested"):
            if record[field] is not True:
                errors.append(f"approved candidate requires {field}=true")
        rev = record["revision"]
        if not isinstance(rev, str) or re.fullmatch(r"[0-9a-fA-F]{40}", rev) is None:
            errors.append("approved candidate requires pinned 40-character revision SHA")
        reviewer = record["independent_reviewer"]
        author = record["author"]
        if (not isinstance(reviewer, str) or not reviewer.strip()
                or not isinstance(author, str)
                or reviewer.strip().casefold() == author.strip().casefold()):
            errors.append("approved candidate requires reviewer independent of author")
        reviews = record.get("review_evidence")
        if not isinstance(reviews, dict):
            errors.append("approved candidate requires itemized review_evidence")
        else:
            for field in REVIEW_EVIDENCE_FIELDS:
                if not is_https_url(reviews.get(field)):
                    errors.append(f"approved candidate requires HTTPS {field} review evidence")
        unresolved = record.get("unresolved_high_risk_count")
        if isinstance(unresolved, bool) or not isinstance(unresolved, int) or unresolved != 0:
            errors.append("approved candidate requires zero documented unresolved high-risk signals")
        evidence = record["benchmark_evidence"]
        if not isinstance(evidence, list) or not evidence or not all(is_https_url(x) for x in evidence):
            errors.append("approved candidate requires HTTPS benchmark evidence")
        if isinstance(cost, (int, float)) and cost > 0 and not is_https_url(record["spend_approval_evidence"]):
            errors.append("nonzero spend requires explicit HTTPS approval evidence")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifests", nargs="+", type=Path)
    args = parser.parse_args()
    failures = 0
    for path in args.manifests:
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
            errors = validate_candidate(record)
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            errors = [str(exc)]
            record = {}
        if errors:
            failures += 1
            for error in errors:
                print(f"FAIL {path}: {error}")
        else:
            status = record["status"]
            print(f"PASS {path}: valid manifest, status={status}; "
                  + ("approval fields and evidence URLs present; human validity UNVERIFIED"
                     if status == "approved"
                     else "NOT APPROVED; review gates still required"))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
