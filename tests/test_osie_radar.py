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

    def test_gitflic_official_public_list_shape(self):
        rows = radar.records("gitflic", [{"owner": {"alias": "team"},
                                         "alias": "engine"}], 2)
        self.assertEqual(rows[0]["url"], "https://gitflic.ru/project/team/engine")

    def test_github_license_object_is_normalised_to_spdx(self):
        rows = radar.records("github", {"items": [
            {"full_name": "org/code", "license": {"spdx_id": "MIT"}}
        ]}, 2)
        self.assertEqual(rows[0]["licence_claim"], "MIT")

    def test_permission_failure_not_mislabeled_as_empty_catalogue(self):
        from urllib.error import HTTPError
        def blocked(url, headers):
            raise HTTPError(url, 403, "Forbidden", {}, None)
        report = radar.discover(["robotics"], ["gitflic"], 2,
                                fetch=blocked, env={})
        self.assertEqual(report["provider_health"][0]["state"], "AUTH_REQUIRED")
        self.assertFalse(report["coverage"]["complete"])

    def test_empty_success_is_distinguishable_from_provider_outage(self):
        report = radar.discover(["image"], ["gitflic"], 2,
                                fetch=lambda url, headers: [], env={})
        self.assertEqual(report["provider_health"][0]["state"], "OK_EMPTY")
        self.assertTrue(report["coverage"]["complete"])

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
        self.assertEqual(report["coverage"]["unavailable"], 1)

    def test_distinct_productive_provider_count_not_query_count(self):
        def fake(url, headers):
            if "api.github.com" in url:
                return {"items": [{"full_name": "team/repo"}]}
            return []
        report = radar.discover(["image", "voice"], ["github", "gitflic"], 2,
                                fetch=fake, env={})
        self.assertEqual(report["coverage"]["healthy_source_count"], 1)
        self.assertEqual(report["coverage"]["healthy_sources"], ["github"])

    def test_live_health_threshold_can_fail_closed_without_fetching_models(self):
        from unittest.mock import patch
        import contextlib
        import io
        report = radar.discover(["image"], ["github"], 2,
                                fetch=lambda url, headers: {"items": []}, env={})
        self.assertEqual(report["coverage"]["healthy_source_count"], 0)
        with patch.object(radar, "discover", return_value=report):
            with contextlib.redirect_stdout(io.StringIO()):
                with contextlib.redirect_stderr(io.StringIO()):
                    self.assertEqual(radar.main(["--live", "--sources", "github",
                                                 "--min-healthy-sources", "1"]), 3)

    def test_bad_slug_cannot_inject_url(self):
        rows = radar.records("github", {"items": [{"full_name": "../bad"}]}, 1)
        self.assertEqual(rows, [])

    def test_query_bounds(self):
        with self.assertRaises(ValueError):
            radar.endpoint("bad-source", "x", 1)


if __name__ == "__main__":
    unittest.main()
