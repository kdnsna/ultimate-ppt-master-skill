#!/usr/bin/env python3
"""Audit repository hygiene for release-blocking local duplicate artifacts."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

IGNORED_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    "dist",
    "build",
    ".turbo",
    "__pycache__",
}

FINDER_DUPLICATE_RE = re.compile(r" \d+(?=\.)")


def iter_files(root: Path):
    for path in root.rglob("*"):
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.is_file():
            yield path


def find_duplicate_artifacts(root: Path) -> list[Path]:
    duplicates: list[Path] = []
    for path in iter_files(root):
        if FINDER_DUPLICATE_RE.search(path.name):
            duplicates.append(path.relative_to(root))
    return sorted(duplicates, key=lambda item: str(item))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=str(ROOT), help="Repository root to audit")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    duplicates = find_duplicate_artifacts(root)
    if duplicates:
        print("Repository hygiene audit failed: Finder-style duplicate files found.")
        for path in duplicates:
            print(f"- {path}")
        return 1

    print("Repository hygiene audit passed: no Finder-style duplicate files found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
