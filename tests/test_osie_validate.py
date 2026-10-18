"""Offline OSIE gate regression tests; zero external dependencies."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "osie_validate.py"
spec = importlib.util.spec_from_file_location("osie_validate", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def candidate():
    return {
        "id": "example", "name": "Example", "type": "model",
        "canonical_url": "https://huggingface.co/example/model",
        "upstream_code_url": "https://github.com/example/repo",
        "revision": None,
        "declared_license": "Apache-2.0",
        "license_reviewed": False,
        "data_rights_reviewed": False,
        "security_reviewed": False,
        "cost_reviewed": False,
        "estimated_cash_cost_zar": 0,
        "spend_approval_evidence": None,
        "benchmark_evidence": [],
        "rollback_tested": False,
        "independent_reviewer": None,
        "author": "author",
        "status": "intake",
    }


class AcceptanceTests(unittest.TestCase):
    def test_intake_passes_without_falsely_claiming_approval(self):
        self.assertEqual(mod.validate_candidate(candidate()), [])

    def test_missing_mandatory_metadata_fails(self):
        record = candidate()
        del record["declared_license"]
        self.assertTrue(mod.validate_candidate(record))

    def test_insecure_url_fails(self):
        record = candidate()
        record["canonical_url"] = "http://example.com"
        self.assertIn("canonical_url must be HTTPS", mod.validate_candidate(record))

    def test_self_approval_is_rejected(self):
        record = self.approved()
        record["independent_reviewer"] = record["author"]
        self.assertTrue(any("independent" in e for e in mod.validate_candidate(record)))

    def test_unreviewed_pilot_cannot_claim_approval(self):
        record = candidate()
        record["status"] = "approved"
        self.assertTrue(mod.validate_candidate(record))

    def test_approved_requires_pin(self):
        record = self.approved()
        record["revision"] = "main"
        self.assertTrue(any("pinned" in e for e in mod.validate_candidate(record)))

    def test_approved_requires_benchmark(self):
        record = self.approved()
        record["benchmark_evidence"] = []
        self.assertTrue(mod.validate_candidate(record))

    def test_approved_blocks_unapproved_spend(self):
        record = self.approved()
        record["estimated_cash_cost_zar"] = 25
        self.assertTrue(any("spend" in e for e in mod.validate_candidate(record)))

    def test_approved_cannot_ignore_known_high_risk_source_signals(self):
        record = self.approved()
        record["unresolved_high_risk_count"] = 2
        self.assertTrue(any("high-risk" in e for e in mod.validate_candidate(record)))

    def test_approved_requires_explicit_high_risk_reconciliation(self):
        record = self.approved()
        del record["unresolved_high_risk_count"]
        self.assertTrue(any("high-risk" in e for e in mod.validate_candidate(record)))

    def test_independently_reviewed_metadata_can_pass(self):
        self.assertEqual(mod.validate_candidate(self.approved()), [])

    def test_approved_without_review_records_is_blocked(self):
        record = self.approved()
        del record["review_evidence"]
        self.assertTrue(any("review_evidence" in e for e in mod.validate_candidate(record)))

    def test_missing_security_evidence_is_blocked(self):
        record = self.approved()
        del record["review_evidence"]["security"]
        self.assertTrue(any("security review evidence" in e for e in mod.validate_candidate(record)))

    def test_review_links_must_use_https(self):
        record = self.approved()
        record["review_evidence"]["license"] = "http://example.com/review"
        self.assertTrue(any("license review evidence" in e for e in mod.validate_candidate(record)))

    def test_reviewer_whitespace_and_case_spoof_is_rejected(self):
        record = self.approved()
        record["independent_reviewer"] = " AUTHOR "
        self.assertTrue(any("independent" in e for e in mod.validate_candidate(record)))

    @staticmethod
    def approved():
        record = candidate()
        record.update({
            "status": "approved",
            "revision": "a" * 40,
            "unresolved_high_risk_count": 0,
            "license_reviewed": True,
            "data_rights_reviewed": True,
            "security_reviewed": True,
            "cost_reviewed": True,
            "rollback_tested": True,
            "benchmark_evidence": ["https://example.com/evidence"],
            "review_evidence": {kind: "https://example.com/" + kind
                                for kind in mod.REVIEW_EVIDENCE_FIELDS},
            "independent_reviewer": "reviewer",
        })
        return record


if __name__ == "__main__":
    unittest.main()
