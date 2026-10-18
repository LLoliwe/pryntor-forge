"""MOSS inference is blocked unless verified hardware, local weights and approvals exist."""
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import Mock, patch

path = Path(__file__).resolve().parents[1] / "tools" / "osie_moss_preflight.py"
spec = importlib.util.spec_from_file_location("osie_moss_preflight", path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def manifest():
    path = Path(__file__).resolve().parents[1] / "docs" / "osie" / "registry" / "moss-image-base.json"
    return json.loads(path.read_text())


class MOSSPreflightTests(unittest.TestCase):
    def test_actual_moss_record_is_blocked_and_does_not_run_model(self):
        result = mod.inspect_manifest(manifest(), cuda={"present": False})
        self.assertEqual(result["status"], "BLOCKED")
        self.assertIn("HF_REVISION_UNPINNED", result["blockers"])
        self.assertIn("UNRESOLVED_SOURCE_RISK", result["blockers"])
        self.assertIn("RIGHTS_SECURITY_COST_ROLLBACK_NOT_APPROVED", result["blockers"])

    def test_no_snapshot_is_not_model_installed(self):
        self.assertIn("MODEL_SNAPSHOT_NOT_SUPPLIED",
                      mod.inspect_manifest(manifest(), cuda={"present": True})["blockers"])

    def test_unknown_model_cannot_pass(self):
        data = manifest()
        data["id"] = "unverified/model"
        self.assertIn("UNKNOWN_MODEL",
                      mod.inspect_manifest(data, cuda={"present": True})["blockers"])

    def test_gpu_not_implicitly_probed_without_opt_in(self):
        self.assertEqual(mod.inspect_manifest(manifest(), cuda={"present": False})["cuda"],
                         {"present": False})

    def test_missing_gpu_command_is_reported(self):
        self.assertEqual(mod.cuda_device_report(which=lambda name: None)["reason"],
                         "NVIDIA_SMI_MISSING")

    def test_gpu_detection_only_executes_local_nvidia_smi(self):
        mock_run = Mock(return_value=Mock(returncode=0, stdout="Sample GPU, 40960\n"))
        result = mod.cuda_device_report(run=mock_run, which=lambda n: "/usr/bin/nvidia-smi")
        self.assertTrue(result["present"])
        self.assertEqual(mock_run.call_args.args[0][0], "/usr/bin/nvidia-smi")

    def test_empty_snapshot_is_not_complete(self):
        with TemporaryDirectory() as directory:
            self.assertIn("MODEL_SNAPSHOT_INCOMPLETE",
                          mod.inspect_manifest(manifest(), directory,
                                               cuda={"present": True})["blockers"])

    def test_empty_weight_files_do_not_count_as_installed_model(self):
        with TemporaryDirectory() as directory:
            path = Path(directory)
            (path / "model_index.json").write_text("{}")
            (path / "pipeline_moss_image.py").write_text("# stub")
            (path / "fake.safetensors").write_bytes(b"")
            result = mod.inspect_manifest(manifest(), directory, cuda={"present": True})
            self.assertIn("MODEL_WEIGHTS_MISSING_OR_INCOMPLETE", result["blockers"])

    def test_metadata_only_readiness_cannot_claim_model_executed(self):
        data = manifest()
        data.update({
            "id": "openmoss-moss-image-base", "status": "approved",
            "revision": "a" * 40, "license_reviewed": True,
            "data_rights_reviewed": True, "security_reviewed": True,
            "cost_reviewed": True, "rollback_tested": True,
            "unresolved_high_risk_count": 0,
            "independent_reviewer": "separately-verified-human",
        })
        with TemporaryDirectory() as directory:
            (Path(directory) / "model_index.json").write_text("{}")
            (Path(directory) / "pipeline_moss_image.py").write_text("# mock; NOT run")
            (Path(directory) / "mock.safetensors").write_bytes(b"x")
            with patch.object(mod, "MIN_SNAPSHOT_BYTES", 1):
                r = mod.inspect_manifest(data, directory, cuda={"present": True})
            self.assertEqual(r["status"], "PREREQUISITES_PRESENT_REVIEW_NOT_A_RELEASE")
            self.assertIn("No imports", r["attestation"])


if __name__ == "__main__":
    unittest.main()
