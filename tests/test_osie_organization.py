"""Pryntor group OSIE R0: product-level adoption gate and negative tests."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / ".github" / "actions" / "osie-review" / "validate.py"
spec = importlib.util.spec_from_file_location("osie_org_adoption", path)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def fixture():
    return {
        "schema_version": 1,
        "repository": "LLoliwe/pryntor-forge",
        "venture": "Pryntor FORGE",
        "stage": "intake",
        "osie_issue": "PRY-350",
        "public_metadata_only": True,
        "execute_external_code": False,
        "allow_model_weights": False,
        "allow_external_data_transfer": False,
        "approved_new_spend_zar": 0,
        "independent_review_required": True,
        "independent_review_url": None,
        "release_approved": False,
        "candidate_adoptions": [],
    }


class OrganizationRolloutTests(unittest.TestCase):
    def test_metadata_intake_passes(self):
        self.assertEqual(gate.validate(fixture(), "LLoliwe/pryntor-forge"), [])

    def test_actual_central_manifest_passes(self):
        data = json.loads((ROOT / "docs/osie/adoption.json").read_text())
        self.assertEqual(gate.validate(data, "LLoliwe/pryntor-forge"), [])

    def test_cross_repo_impersonation_rejected(self):
        self.assertIn("repository identity mismatch",
                      gate.validate(fixture(), "attacker/unrelated"))

    def test_unsupported_cost_rejected(self):
        x = fixture()
        x["approved_new_spend_zar"] = 100
        self.assertTrue(any("spend" in m for m in gate.validate(x)))

    def test_approval_cannot_be_fake(self):
        x = fixture()
        x["independent_review_url"] = "https://example.com/fake"
        self.assertTrue(gate.validate(x))

    def test_candidate_claim_is_blocked_at_intake(self):
        x = fixture()
        x["candidate_adoptions"] = [{"source_url": "https://example.com"}]
        self.assertTrue(gate.validate(x))

    def test_runtime_external_code_rejected(self):
        x = fixture()
        x["execute_external_code"] = True
        self.assertTrue(gate.validate(x))

    def test_release_rejected(self):
        x = fixture()
        x["release_approved"] = True
        self.assertTrue(gate.validate(x))

    def test_cross_venture_data_rejected(self):
        x = fixture()
        x["allow_external_data_transfer"] = True
        self.assertTrue(gate.validate(x))

    def test_no_independent_review_waiver(self):
        x = fixture()
        x["independent_review_required"] = False
        self.assertTrue(gate.validate(x))

    def test_false_approved_stage_requires_evidence(self):
        x = fixture()
        x["stage"] = "approved"
        self.assertTrue(gate.validate(x))

    def test_future_reviews_still_cannot_activate_runtime(self):
        x = fixture()
        x.update({
            "stage": "review",
            "independent_review_url": "https://github.com/owner/repo/pull/1",
            "execute_external_code": True,
            "candidate_adoptions": [{
                "source_url": "https://github.com/owner/repo",
                "immutable_sha": "a" * 40,
                "license_evidence": "https://github.com/owner/repo/blob/main/LICENSE",
                "security_evidence": "https://github.com/owner/repo/security",
            }],
        })
        self.assertTrue(any("cannot enable runtime" in m for m in gate.validate(x)))

    def test_symlink_manifest_blocked_before_read(self):
        with tempfile.TemporaryDirectory() as folder:
            import os
            os.chdir(folder)
            try:
                Path("external.json").write_text(json.dumps(fixture()))
                Path("link.json").symlink_to("external.json")
                with patch("sys.argv", ["gate", "link.json",
                                        "--expected-repo", "LLoliwe/pryntor-forge"]):
                    self.assertEqual(gate.main(), 2)
            finally:
                os.chdir(str(ROOT))


if __name__ == "__main__":
    unittest.main()
