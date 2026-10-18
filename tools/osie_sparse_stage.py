#!/usr/bin/env python3
"""Download only allowlisted upstream source files at a pinned immutable Git SHA.

Explicit --stage opt-in. Stage is not an installation, import, dependency install,
model inference, model weights download or security approval.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
from urllib.parse import quote, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

SHA = re.compile(r"^[0-9a-f]{40}$")
REPO = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
MAX_FILE = 256 * 1024
MAX_TOTAL = 1_200_000
MAX_FILES = 12
HOST = "raw.githubusercontent.com"


class NoRedirectOutside(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, url):
        p = urlsplit(url)
        if p.scheme != "https" or p.hostname != HOST:
            raise ValueError("redirect blocked")
        return super().redirect_request(req, fp, code, msg, headers, url)


def valid_file(path):
    p = PurePosixPath(path)
    return (bool(path) and not p.is_absolute() and len(p.parts) <= 8
            and all(x not in (".", "..") and
                    re.fullmatch(r"[a-zA-Z0-9_.-]+", x) for x in p.parts)
            and str(p) == path)


def raw_url(repo, revision, path):
    if not REPO.fullmatch(repo) or not SHA.fullmatch(revision) or not valid_file(path):
        raise ValueError("invalid repository, immutable revision, or safe path")
    return "https://" + HOST + "/" + repo + "/" + revision + "/" + "/".join(
        quote(piece, safe="") for piece in path.split("/"))


def download(url):
    p = urlsplit(url)
    if p.scheme != "https" or p.hostname != HOST:
        raise ValueError("unknown metadata host")
    opener = build_opener(NoRedirectOutside())
    req = Request(url, headers={"User-Agent": "Pryntor-OSIE/0.2"})
    with opener.open(req, timeout=9) as response:
        if urlsplit(response.geturl()).hostname != HOST:
            raise ValueError("unsafe final hostname")
        payload = response.read(MAX_FILE + 1)
        if len(payload) > MAX_FILE:
            raise ValueError("source file too large")
        return payload


def sparse_stage(repo, sha, paths, target, downloader=download):
    if len(paths) > MAX_FILES or len(set(paths)) != len(paths) or not paths:
        raise ValueError("invalid number or duplicate file paths")
    target = Path(target)
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        raise ValueError("destination must be an empty directory")
    receipts, total, files = [], 0, []
    for path in paths:
        payload = downloader(raw_url(repo, sha, path))
        if not isinstance(payload, bytes) or len(payload) > MAX_FILE:
            raise ValueError("invalid file bytes or oversized source")
        total += len(payload)
        if total > MAX_TOTAL:
            raise ValueError("source budget exceeded")
        files.append((path, payload))
        receipts.append({"path": path, "bytes": len(payload),
                         "sha256": hashlib.sha256(payload).hexdigest()})
    target.mkdir(parents=True, exist_ok=True)
    for path, payload in files:
        dest = target.joinpath(*PurePosixPath(path).parts)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(payload)
        dest.chmod(0o600)
    return {"source": repo, "revision": sha, "status": "SOURCE_FILES_STAGED_NOT_EXECUTED",
            "files": receipts, "total_bytes": total}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--file", action="append", required=True)
    parser.add_argument("--destination", required=True)
    parser.add_argument("--stage", action="store_true")
    args = parser.parse_args()
    for item in args.file:
        raw_url(args.repository, args.revision, item)
    target = Path(args.destination).resolve()
    if target in (Path("/"), Path.home()) or target.is_symlink():
        parser.error("choose safe dedicated directory")
    if not args.stage:
        print(json.dumps({"status": "DRY_RUN", "repository": args.repository,
                          "revision": args.revision, "files": args.file,
                          "note": "No remote access or model activation."}))
    else:
        print(json.dumps(sparse_stage(args.repository, args.revision, args.file, target), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
