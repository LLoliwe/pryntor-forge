"""Sparse-stage security tests, no network, model runtime or paid jobs."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "tools" / "osie_sparse_stage.py"
spec = importlib.util.spec_from_file_location("osie_sparse_stage", p)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
SHA = "c1355e6b1986dfe8fba3c0455783a05899212342"


class SparseStageTests(unittest.TestCase):
    def test_immutable_pin(self):
        with self.assertRaises(ValueError):
            mod.raw_url("OpenMOSS/MOSS-Image", "main", "LICENSE")

    def test_prevent_traversal(self):
        for invalid in ("../secrets", "a/../../passwd", "/etc/passwd", "foo//bar"):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                mod.raw_url("OpenMOSS/MOSS-Image", SHA, invalid)

    def test_approved_upstream_host(self):
        u = mod.raw_url("OpenMOSS/MOSS-Image", SHA, "README.md")
        self.assertIn("raw.githubusercontent.com/OpenMOSS/MOSS-Image/", u)

    def test_reject_overlong_file_list(self):
        with tempfile.TemporaryDirectory() as d, self.assertRaises(ValueError):
            mod.sparse_stage("OpenMOSS/MOSS-Image", SHA,
                             ["file" + str(i) for i in range(13)], Path(d) / "out",
                             downloader=lambda _: b"test")

    def test_reject_oversize(self):
        with tempfile.TemporaryDirectory() as d, self.assertRaises(ValueError):
            mod.sparse_stage("OpenMOSS/MOSS-Image", SHA, ["README.md"],
                             Path(d) / "out", downloader=lambda _: b"0" * (mod.MAX_FILE + 1))

    def test_source_only_fingerprint_receipt(self):
        with tempfile.TemporaryDirectory() as d:
            r = mod.sparse_stage("OpenMOSS/MOSS-Image", SHA,
                                 ["LICENSE", "README.md"], Path(d) / "stage",
                                 downloader=lambda url: b"public source bytes")
            self.assertEqual(r["status"], "SOURCE_FILES_STAGED_NOT_EXECUTED")
            self.assertEqual(len(r["files"]), 2)
            self.assertEqual(len(r["files"][0]["sha256"]), 64)
            self.assertEqual((Path(d) / "stage/README.md").read_bytes(), b"public source bytes")

    def test_no_write_into_populated_directory(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "existing").write_text("preserve")
            with self.assertRaises(ValueError):
                mod.sparse_stage("OpenMOSS/MOSS-Image", SHA, ["README.md"],
                                 Path(d), downloader=lambda _: b"ok")

    def test_reject_duplicate_paths(self):
        with tempfile.TemporaryDirectory() as d, self.assertRaises(ValueError):
            mod.sparse_stage("OpenMOSS/MOSS-Image", SHA,
                             ["README.md", "README.md"], Path(d) / "out",
                             downloader=lambda _: b"ok")


if __name__ == "__main__":
    unittest.main()
