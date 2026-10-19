"""OSIE static-review signals: safe by construction, not security certification."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

p=Path(__file__).resolve().parents[1]/"tools"/"osie_source_audit.py"
spec=importlib.util.spec_from_file_location("osie_source_audit",p)
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class AuditTests(unittest.TestCase):
    def test_reports_remote_execution_opt_in_without_executing(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/"model.py").write_text("pipe = load(trust_remote_code=True)\n")
            result=audit.scan(d)
            self.assertEqual(result["high_count"],1)
            self.assertEqual(result["findings"][0]["rule"],"REMOTE_CODE_OPT_IN")

    def test_reports_untrusted_deserialization(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/"model.py").write_text("data = pickle.load(handle)")
            self.assertEqual(audit.scan(d)["findings"][0]["rule"],"UNSAFE_DESERIALIZATION")

    def test_no_signals_not_security_certification(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/"safe.txt").write_text("no executable code")
            self.assertEqual(audit.scan(d)["status"],"STATIC_SIGNALS_NOT_SECURITY_APPROVAL")
            self.assertEqual(audit.scan(d)["findings"],[])

    def test_binary_skipped(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d)/"weights.safetensors").write_bytes(b"trust_remote_code=True")
            self.assertEqual(audit.scan(d)["scanned_text_files"],0)

    def test_disallow_symlinks(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d,"outside").write_text("test")
            Path(d,"sym.py").symlink_to(Path(d,"outside"))
            with self.assertRaises(ValueError):
                audit.scan(d)


if __name__=="__main__":
    unittest.main()
