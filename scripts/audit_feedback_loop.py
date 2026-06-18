#!/usr/bin/env python3
"""Audit v5.2 feedback loop and dissatisfaction taxonomy."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NEEDLES = [
    "brief-mismatch",
    "source-gap",
    "style-mismatch",
    "visual-density",
    "asset-boundary",
    "format-mismatch",
    "feedbackLoop",
    "failureTaxonomy",
]


def main() -> int:
    failures: list[str] = []
    for relative in [
        "apps/web/src/App.tsx",
        "apps/bridge/server.mjs",
        "apps/desktop/worker/desktop_worker.py",
    ]:
        text = (ROOT / relative).read_text(encoding="utf-8")
        for needle in NEEDLES:
            if needle not in text:
                failures.append(f"{relative}: missing {needle}")
    if failures:
        print("v5.2 feedback loop audit failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("v5.2 feedback loop audit passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
