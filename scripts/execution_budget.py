#!/usr/bin/env python3
"""Decide whether SVG execution must be split into resume-execute mode."""

from __future__ import annotations

import argparse
import json


DEFAULT_PAGE_THRESHOLD = 16


def budget_decision(page_count: int, threshold: int = DEFAULT_PAGE_THRESHOLD) -> dict[str, object]:
    split = page_count > threshold
    return {
        "page_count": page_count,
        "threshold": threshold,
        "mode": "resume-execute" if split else "continuous",
        "requires_resume_execute": split,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--page-count", type=int, required=True)
    parser.add_argument("--threshold", type=int, default=DEFAULT_PAGE_THRESHOLD)
    args = parser.parse_args()

    decision = budget_decision(args.page_count, args.threshold)
    print(json.dumps(decision, ensure_ascii=False, indent=2))
    return 1 if decision["requires_resume_execute"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
