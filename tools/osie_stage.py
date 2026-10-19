#!/usr/bin/env python3
"""OSIE source-only staging: pinned GitHub snapshots, no code execution or dependencies.

Not a model weights installer. One immutable revision, bounded archive, safe extraction.
Explicit --stage required; dry-run by default. Use only ephemeral throwaway directories.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import tarfile
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

ALLOWED = {"api.github.com", "codeload.github.com"}
MAX_ARCHIVE = 16 * 1024 * 1024
MAX_UNPACKED = 32 * 1024 * 1024
MAX_FILES = 1500
PIN = re.compile(r"^[0-9a-f]{40}$")
NAME = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")


class StageRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, url):
        u = urlsplit(url)
        if u.scheme != "https" or u.hostname not in ALLOWED:
            raise ValueError("blocked archive redirect")
        return super().redirect_request(req, fp, code, msg, headers, url)


def source_url(repository, revision):
    if not NAME.fullmatch(repository) or not PIN.fullmatch(revision):
        raise ValueError("must supply owner/repo and exact 40-character lowercase commit SHA")
    return "https://api.github.com/repos/" + repository + "/tarball/" + revision


def unpack_safely(data, destination):
    """Reject path escapes, symlinks, hardlinks, devices, huge files and duplicate paths."""
    destination = Path(destination)
    if destination.exists() and any(destination.iterdir()):
        raise ValueError("destination is not empty")
    seen = set()
    total = 0
    planned = []
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as archive:
        members = archive.getmembers()
        if len(members) > MAX_FILES:
            raise ValueError("archive member limit")
        for member in members:
            path = PurePosixPath(member.name)
            if path.is_absolute() or ".." in path.parts or not path.parts:
                raise ValueError("unsafe archive path")
            if len(path.parts) == 1 and member.isdir():
                continue
            if len(path.parts) < 2:
                raise ValueError("unsafe archive path")
            if not member.isfile() and not member.isdir():
                raise ValueError("links or special file rejected")
            relative = PurePosixPath(*path.parts[1:])
            if str(relative) in seen and member.isfile():
                raise ValueError("duplicate file")
            seen.add(str(relative))
            if member.isfile():
                if member.size < 0 or member.size > MAX_UNPACKED:
                    raise ValueError("oversized archive member")
                total += member.size
                if total > MAX_UNPACKED:
                    raise ValueError("unpacked archive size limit")
                planned.append((member, relative))
        destination.mkdir(parents=True, exist_ok=True)
        for member, relative in planned:
            target = destination.joinpath(*relative.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            stream = archive.extractfile(member)
            if stream is None:
                raise ValueError("missing archive member bytes")
            with target.open("xb") as fh:
                left = member.size
                while left:
                    block = stream.read(min(65536, left))
                    if not block:
                        raise ValueError("truncated archive member")
                    fh.write(block)
                    left -= len(block)
            target.chmod(0o600)
    return {"files": len(planned), "unpacked_bytes": total}


def retrieve(url):
    u = urlsplit(url)
    if u.scheme != "https" or u.hostname not in ALLOWED:
        raise ValueError("unsupported host")
    opener = build_opener(StageRedirect())
    req = Request(url, headers={"User-Agent": "Pryntor-OSIE/0.2", "Accept": "application/vnd.github+json"})
    with opener.open(req, timeout=12) as response:
        if urlsplit(response.geturl()).hostname not in ALLOWED:
            raise ValueError("unapproved final archive host")
        payload = response.read(MAX_ARCHIVE + 1)
        if len(payload) > MAX_ARCHIVE:
            raise ValueError("compressed archive limit")
        return payload


def stage(repository, revision, destination, downloader=retrieve):
    url = source_url(repository, revision)
    data = downloader(url)
    if len(data) > MAX_ARCHIVE:
        raise ValueError("compressed archive limit")
    output = unpack_safely(data, destination)
    return {"source": repository, "immutable_revision": revision,
            "archive_sha256": hashlib.sha256(data).hexdigest(),
            "stage": "SOURCE_ONLY_NOT_INSTALLED_NOT_EXECUTED",
            **output, "destination": str(destination)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--revision", required=True)
    parser.add_argument("--destination", required=True)
    parser.add_argument("--stage", action="store_true", help="explicitly download and inspect source")
    args = parser.parse_args()
    url = source_url(args.repository, args.revision)
    if not args.stage:
        print(json.dumps({"status": "DRY_RUN", "source_archive": url,
                          "note": "Use --stage for bounded source-only snapshot; no model weights"}))
        return 0
    destination = Path(args.destination).resolve()
    if destination == Path("/") or destination == Path.home() or destination.is_symlink():
        parser.error("use a fresh, dedicated sandbox directory")
    print(json.dumps(stage(args.repository, args.revision, destination), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
