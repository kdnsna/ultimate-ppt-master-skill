#!/usr/bin/env python3
"""Copy the canonical desktop worker into the Tauri resources bundle.

Canonical source:
  apps/desktop/worker/desktop_worker.py

Bundled copy:
  apps/desktop/src-tauri/resources/desktop_worker.py
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "apps" / "desktop" / "worker" / "desktop_worker.py"
TARGET = ROOT / "apps" / "desktop" / "src-tauri" / "resources" / "desktop_worker.py"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if bundled copy drifts")
    args = parser.parse_args()
    if not SOURCE.is_file():
        print(f"missing canonical worker: {SOURCE}", file=sys.stderr)
        return 2
    if args.check:
        if not TARGET.is_file() or TARGET.read_bytes() != SOURCE.read_bytes():
            print("desktop worker resource copy is out of sync")
            print("Run: python3 scripts/sync_desktop_worker.py")
            return 1
        print("desktop worker resource copy is in sync")
        return 0
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE, TARGET)
    print(f"synced {SOURCE.relative_to(ROOT)} -> {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
