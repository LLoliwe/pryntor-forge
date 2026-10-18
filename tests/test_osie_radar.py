"""OSIE global search: reject unsafe URLs, attribute outages, keep claims unverified."""
import importlib.util
import unittest
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "tools" / "osie_radar.py"
spec = importlib.util.spec_from_file_location("osie_radar", path)
radar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(radar)


class RadarTests(unittest.TestCase):
    def test_exact_expected_source_endpoints(self):
        self.assertIn("api.github.com/search/repositories", radar.endpoint("github", "image", 2))
        self.assertIn("huggingface.co/api/models", radar.endpoint("huggingface", "voice", 2))
        self.assertIn("gitee.com/api/v5/search/repositories", radar.endpoint("gitee", "动画", 2))
        self.assertIn("modelscope.cn/openapi/v1/models", radar.endpoint("modelscope", "图像", 2))
        self.assertIn("api.gitflic.ru/project", radar.endpoint("gitflic", "робот", 2))

    def test_fetch_rejects_unknown_hosts_before_network(self):
        with self.assertRaises(ValueError):
            radar.fetch_json("https://evil.invalid/data")

    def test_github_records_unverified(self):
        rows = radar.records("github", {"items": [{
            "full_name": "user/repo", "html_url": "https://evil.invalid",
            "license": {"spdx_id": "MIT"},
        }]}, 4)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["url"], "https://github.com/user/repo")
        self.assertEqual(rows[0]["status"], "DISCOVERED_UNVERIFIED")

    def test_hf_chinese_slug(self):
        rows = radar.records("huggingface", [
            {"id": "OpenMOSS-Team/MOSS-Image-SFT", "tags": ["license:apache-2.0"]}
        ], 1)
        self.assertEqual(rows[0]["licence_claim"], "apache-2.0")

    def test_gitee_entries(self):
        rows = radar.records("gitee", [{"full_name": "org/repo"}], 1)
        self.assertEqual(rows[0]["url"], "https://gitee.com/org/repo")

    def test_modelscope_records(self):
        rows = radar.records("modelscope", {"data": {"models": [
            {"id": "Qwen/Qwen-Image", "license": "Apache-2.0"}
        ]}}, 2)
        self.assertEqual(rows[0]["source"], "modelscope")

    def test_gitflic_records(self):
        rows = radar.records("gitflic", {"_embedded": {"projectList": [
            {"owner": {"alias": "org"}, "alias": "proj"}
        ]}}, 1)
        self.assertEqual(rows[0]["url"], "https://gitflic.ru/project/org/proj")

    def test_provider_failure_reported_instead_of_hidden(self):
        def fake_fetch(url, headers):
            if "api.github" in url:
                return {"items": [{"full_name": "project/a"}]}
            raise ValueError("offline")
        report = radar.discover(["image"], ["github", "modelscope"], 2,
                                fetch=fake_fetch, env={})
        self.assertEqual(report["status"], "DISCOVERY_ONLY_NOT_INSTALLED")
        self.assertEqual(len(report["candidates"]), 1)
        self.assertEqual(report["provider_health"][1]["state"], "UNAVAILABLE")
        self.assertIn("gitverse", report["manual_platforms"])

    def test_bad_slug_cannot_inject_url(self):
        rows = radar.records("github", {"items": [{"full_name": "../bad"}]}, 1)
        self.assertEqual(rows, [])

    def test_query_bounds(self):
        with self.assertRaises(ValueError):
            radar.endpoint("bad-source", "x", 1)


if __name__ == "__main__":
    unittest.main()
