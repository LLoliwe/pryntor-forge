#!/usr/bin/env python3
"""OSIE: bounded, read-only global public repository/model discovery. No installation.

Offline by default. --live explicitly opts into public HTTPS metadata requests.
Unsupported or unauthenticated platforms are reported, never silently omitted.
No model files, model code, install scripts or user content are downloaded.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

HOSTS = frozenset({
    "api.github.com", "huggingface.co", "api.gitflic.ru",
    "gitee.com", "modelscope.cn", "modelscope.ai",
})
MAX_RESPONSE_BYTES = 900_000
USER_AGENT = "Pryntor-OSIE/0.2 (+https://github.com/LLoliwe/pryntor-forge)"
SOURCES = {
    "github": "Global/GitHub",
    "huggingface": "Global/Hugging Face",
    "gitee": "China/Gitee",
    "modelscope": "China/ModelScope",
    "gitflic": "Russia/GitFlic",
}
MANUAL_ONLY = {
    "gitverse": "Russia/GitVerse: verified API docs; public unauthenticated search not established",
    "gitcode": "China/GitCode: public search API contract not independently established",
}


class BoundedRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urlsplit(newurl).hostname not in HOSTS or urlsplit(newurl).scheme != "https":
            raise ValueError("redirect outside OSIE metadata host allowlist")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch_json(url, headers=None, opener=None):
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in HOSTS or parsed.username:
        raise ValueError("not an allowlisted HTTPS metadata host")
    if opener is None:
        opener = build_opener(BoundedRedirect())
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json", **(headers or {})})
    with opener.open(request, timeout=8) as response:
        if urlsplit(response.geturl()).hostname not in HOSTS:
            raise ValueError("unexpected response host")
        blob = response.read(MAX_RESPONSE_BYTES + 1)
    if len(blob) > MAX_RESPONSE_BYTES:
        raise ValueError("oversize metadata response")
    return json.loads(blob.decode("utf-8"))


def endpoint(source, query, limit):
    q = quote(query, safe="")
    if source == "github":
        return "https://api.github.com/search/repositories?" + urlencode({
            "q": query + " archived:false", "per_page": limit,
            "sort": "updated", "order": "desc",
        })
    if source == "huggingface":
        return "https://huggingface.co/api/models?" + urlencode({
            "search": query, "limit": limit, "sort": "lastModified", "direction": "-1",
        })
    if source == "gitee":
        return "https://gitee.com/api/v5/search/repositories?" + urlencode({
            "q": query, "page": 1, "per_page": limit,
        })
    if source == "modelscope":
        return "https://modelscope.cn/openapi/v1/models?" + urlencode({
            "search": query, "page_size": limit, "sort": "last_modified",
        })
    if source == "gitflic":
        return "https://api.gitflic.ru/project?" + urlencode({"q": query, "size": limit})
    raise ValueError("unsupported source")


def records(source, payload, limit):
    if source == "github":
        items = payload.get("items", [])
    elif source == "huggingface":
        items = payload
    elif source == "gitee":
        items = payload if isinstance(payload, list) else payload.get("items", [])
    elif source == "modelscope":
        items = payload.get("data", {}).get("models", [])
    elif source == "gitflic":
        # GET /project returns a public-project array in current upstream docs;
        # _embedded.projectList is used by other paged GitFlic methods.
        items = payload if isinstance(payload, list) else payload.get("_embedded", {}).get("projectList", [])
    else:
        items = []
    if not isinstance(items, list):
        raise ValueError("unexpected upstream metadata response")
    result = []
    for item in items[:limit]:
        if not isinstance(item, dict):
            continue
        slug = str(item.get("full_name") or item.get("id") or item.get("path") or item.get("Path") or "")
        if source == "gitflic":
            owner = item.get("owner") or {}
            slug = str(owner.get("alias", "")) + "/" + str(item.get("alias", ""))
        if not slug or len(slug) > 200:
            continue
        urls = {
            "github": "https://github.com/",
            "huggingface": "https://huggingface.co/",
            "gitee": "https://gitee.com/",
            "modelscope": "https://modelscope.cn/models/",
            "gitflic": "https://gitflic.ru/project/",
        }
        # URLs are generated from validated upstream slug components only.
        parts = slug.split("/")
        if not all(part and part not in (".", "..") and
                   all(c.isalnum() or c in "-_." for c in part) for part in parts):
            continue
        url = urls[source] + "/".join(quote(p, safe="") for p in parts)
        lic = item.get("license")
        # GitHub Search returns a license object, not an SPDX string.
        if source == "github" and isinstance(lic, dict):
            lic = lic.get("spdx_id")
        if not lic and isinstance(item.get("tags"), list):
            lic = next((v[8:] for v in item["tags"] if isinstance(v, str) and v.startswith("license:")), None)
        result.append({
            "source": source,
            "id": slug,
            "url": url,
            "licence_claim": lic if isinstance(lic, str) else None,
            "status": "DISCOVERED_UNVERIFIED",
        })
    return result


def discover(queries, sources, limit, fetch=fetch_json, env=None):
    env = os.environ if env is None else env
    found, health = [], []
    for source in sources:
        for query in queries:
            headers = {}
            key = {"gitee": "GITEE_TOKEN", "modelscope": "MODELSCOPE_API_KEY",
                   "github": "GITHUB_TOKEN"}.get(source)
            if key and env.get(key):
                headers["Authorization"] = ("token " if source == "gitee" else "Bearer ") + env[key]
            try:
                response = fetch(endpoint(source, query, limit), headers)
                entries = records(source, response, limit)
                found.extend(entries)
                health.append({"source": source, "query": query,
                               "state": "OK" if entries else "OK_EMPTY", "count": len(entries)})
            except (HTTPError, URLError, ValueError, KeyError, TimeoutError, json.JSONDecodeError) as exc:
                # Never log token-bearing headers, payloads or exception URLs.
                if isinstance(exc, HTTPError) and exc.code in (401, 403):
                    state = "AUTH_REQUIRED"
                elif isinstance(exc, HTTPError) and exc.code == 429:
                    state = "RATE_LIMITED"
                else:
                    state = "UNAVAILABLE"
                health.append({"source": source, "query": query,
                               "state": state, "reason": type(exc).__name__})
    dedup = {item["url"]: item for item in found}
    attempted = len(health)
    available = sum(h["state"] in ("OK", "OK_EMPTY") for h in health)
    return {"generated_at": datetime.now(timezone.utc).isoformat(),
            "status": "DISCOVERY_ONLY_NOT_INSTALLED",
            "coverage": {"attempted": attempted, "reachable": available,
                         "unavailable": attempted - available,
                         "complete": available == attempted},
            "candidates": sorted(dedup.values(), key=lambda x: (x["source"], x["id"])),
            "provider_health": health,
            "manual_platforms": MANUAL_ONLY,
            "attestation": "No code, model weights or paid compute executed."}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--live", action="store_true", help="opt in to bounded public API requests")
    p.add_argument("--query", action="append", default=[], help="upstream keyword; repeat for more")
    p.add_argument("--sources", default=",".join(SOURCES), help="comma-separated approved adapters")
    p.add_argument("--limit", type=int, default=5, help="maximum results per source and query (1 to 10)")
    args = p.parse_args(argv)
    sources = [v.strip() for v in args.sources.split(",")]
    if not sources or any(s not in SOURCES for s in sources):
        p.error("use recognised sources: " + ",".join(SOURCES))
    if not (1 <= args.limit <= 10) or len(args.query) > 6 or any(len(q) > 90 or not q.strip() for q in args.query):
        p.error("use 1-10 results, <=6 nonempty queries, <=90 characters each")
    if not args.live:
        print(json.dumps({"status": "OFFLINE_NO_NETWORK", "sources": sources,
                          "manual_platforms": MANUAL_ONLY,
                          "instruction": "pass --live --query keyword for public metadata only"}, indent=2))
        return 0
    queries = args.query or ["image generation"]
    print(json.dumps(discover(queries, sources, args.limit), indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
