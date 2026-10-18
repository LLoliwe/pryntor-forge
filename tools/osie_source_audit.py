#!/usr/bin/env python3
"""Source-only static signal scanner. Findings are REVIEW REQUIRED, not exploit proof.

Scans bounded small UTF-8 text from already staged public upstream source.
No dependency installation, imports of candidate code, execution or network.
"""
import argparse
import json
from pathlib import Path
import re
import sys

RULES = {
    "REMOTE_CODE_OPT_IN": ("high", re.compile(r"\btrust_remote_code\s*=\s*True\b")),
    "UNSAFE_DESERIALIZATION": ("high", re.compile(r"\b(?:pickle\.loads?|torch\.load)\s*\(")),
    "DYNAMIC_CODE_EXECUTION": ("high", re.compile(r"\b(?:eval|exec)\s*\(")),
    "SHELL_PIPE_INSTALL": ("high", re.compile(r"\b(?:curl|wget)\b.{0,160}\|\s*(?:bash|sh)\b")),
    "UNBOUNDED_INSTALL": ("medium", re.compile(r"\b(?:pip\d?|uv)\s+install\b")),
    "EXTERNAL_NETWORK": ("medium", re.compile(r"\b(?:requests\.get|urllib\.request\.urlopen|httpx\.get)\s*\(")),
}
SKIP = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".safetensors", ".pt",
        ".pth", ".ckpt", ".onnx", ".bin", ".mp4", ".zip", ".tar", ".gz"}
MAX_FILE = 256 * 1024
MAX_FILES = 500


def scan(root):
    root = Path(root)
    if not root.is_dir() or root.is_symlink():
        raise ValueError("expected real staging directory")
    findings, count = [], 0
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise ValueError("staged source contains symlink")
        if not path.is_file() or path.suffix.lower() in SKIP:
            continue
        count += 1
        if count > MAX_FILES:
            raise ValueError("scan file limit")
        if path.stat().st_size > MAX_FILE:
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeError:
            continue
        for no, line in enumerate(lines, 1):
            for name, (severity, regex) in RULES.items():
                if regex.search(line):
                    findings.append({"file": str(path.relative_to(root)),
                                     "line": no, "rule": name, "severity": severity})
    return {"status": "STATIC_SIGNALS_NOT_SECURITY_APPROVAL",
            "scanned_text_files": count, "findings": findings,
            "high_count": sum(x["severity"] == "high" for x in findings)}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("source_dir")
    args = p.parse_args(argv)
    try:
        print(json.dumps(scan(args.source_dir), indent=2))
        return 0
    except (OSError, ValueError) as e:
        print("SCAN_ERROR: " + type(e).__name__, file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
