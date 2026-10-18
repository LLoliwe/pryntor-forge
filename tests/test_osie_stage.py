"""Bounded source snapshot tests: never run third-party code or model weights."""
import importlib.util
import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "tools" / "osie_stage.py"
spec = importlib.util.spec_from_file_location("osie_stage", path)
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)
SHA = "c1355e6b1986dfe8fba3c0455783a05899212342"


def make_archive(items):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tf:
        for name, contents, kind in items:
            info = tarfile.TarInfo(name)
            if kind == "file":
                payload = contents.encode()
                info.size = len(payload)
                tf.addfile(info, io.BytesIO(payload))
            elif kind == "dir":
                info.type = tarfile.DIRTYPE
                tf.addfile(info)
            elif kind == "link":
                info.type = tarfile.SYMTYPE
                info.linkname = "../../outside"
                tf.addfile(info)
    return buffer.getvalue()


class StageTests(unittest.TestCase):
    def test_revision_must_be_immutable(self):
        with self.assertRaises(ValueError):
            stage.source_url("OpenMOSS/MOSS-Image", "main")

    def test_repo_must_be_namespaced(self):
        with self.assertRaises(ValueError):
            stage.source_url("https://evil.com/name", SHA)

    def test_pinned_source_url(self):
        self.assertEqual(stage.source_url("OpenMOSS/MOSS-Image", SHA),
                         "https://api.github.com/repos/OpenMOSS/MOSS-Image/tarball/" + SHA)

    def test_unpack_real_files_after_root_directory(self):
        archive = make_archive([("repo-sha/", "", "dir"),
                                ("repo-sha/README.md", "safe", "file")])
        with tempfile.TemporaryDirectory() as tmp:
            output = stage.unpack_safely(archive, Path(tmp) / "staged")
            self.assertEqual(output["files"], 1)
            self.assertEqual((Path(tmp) / "staged/README.md").read_text(), "safe")

    def test_block_path_traversal(self):
        blob = make_archive([("repo-sha/../../outside", "evil", "file")])
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                stage.unpack_safely(blob, Path(tmp) / "staged")

    def test_block_symlink(self):
        blob = make_archive([("repo-sha/here", "", "link")])
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                stage.unpack_safely(blob, Path(tmp) / "staged")

    def test_no_overwrite(self):
        blob = make_archive([("repo-sha/README", "ok", "file")])
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "staged"
            output.mkdir()
            (output / "existing").write_text("do not replace")
            with self.assertRaises(ValueError):
                stage.unpack_safely(blob, output)

    def test_stage_emits_honest_receipt(self):
        blob = make_archive([("repo-sha/README", "ok", "file")])
        with tempfile.TemporaryDirectory() as tmp:
            receipt = stage.stage("OpenMOSS/MOSS-Image", SHA, Path(tmp) / "sandbox",
                                  downloader=lambda _: blob)
            self.assertEqual(receipt["stage"], "SOURCE_ONLY_NOT_INSTALLED_NOT_EXECUTED")
            self.assertEqual(receipt["files"], 1)
            self.assertEqual(len(receipt["archive_sha256"]), 64)


if __name__ == "__main__":
    unittest.main()
