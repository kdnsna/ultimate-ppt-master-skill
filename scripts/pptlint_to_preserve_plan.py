#!/usr/bin/env python3
"""Convert a pptlint-style JSON report into a preserve-edit edits.json draft.

This is intentionally conservative and half-automatic:
- only emits text replacements when both old/new (or message + suggestion) are clear;
- never invents layout rebuilds;
- always prints a human review checklist.

Supported input shapes (best-effort):

1) Ultimate handoff repair plan::
      {"tasks":[{"slide":1,"replacements":{"旧":"新"}}, ...]}

2) Flat findings::
      {"findings":[{"slide":3,"old":"Q2","new":"Q3","kind":"text"}, ...]}

3) pptlint-like issues::
      {"issues":[{"page":2,"message":"...","suggestion":"...","fix":{"old":"..","new":".."}}]}

Usage::

    python3 scripts/pptlint_to_preserve_plan.py report.json -o edits.json
    python3 scripts/pptlint_to_preserve_plan.py report.json --stdout
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


def _slide_of(item: dict[str, Any]) -> int | None:
    for key in ("slide", "page", "slideNumber", "slideIndex", "pageNumber"):
        if key in item and item[key] is not None:
            try:
                value = int(item[key])
            except (TypeError, ValueError):
                continue
            # Some tools are 0-based.
            if key in ("slideIndex",) and value >= 0:
                return value + 1 if value == 0 or "index" in key.lower() else value
            return value if value >= 1 else value + 1
    message = str(item.get("message") or item.get("detail") or "")
    match = re.search(r"(?:第\s*)?(\d+)\s*页|slide\s*(\d+)", message, re.I)
    if match:
        return int(next(g for g in match.groups() if g))
    return None


def _pair_of(item: dict[str, Any]) -> tuple[str, str] | None:
    fix = item.get("fix") if isinstance(item.get("fix"), dict) else {}
    for old_key, new_key in (
        ("old", "new"),
        ("from", "to"),
        ("before", "after"),
        ("original", "replacement"),
        ("source", "target"),
    ):
        old = item.get(old_key, fix.get(old_key) if fix else None)
        new = item.get(new_key, fix.get(new_key) if fix else None)
        if isinstance(old, str) and isinstance(new, str) and old.strip():
            return old, new
    replacements = item.get("replacements")
    if isinstance(replacements, dict) and replacements:
        old, new = next(iter(replacements.items()))
        return str(old), str(new)
    # Weak fallback: message "把A改成B"
    blob = " ".join(
        str(item.get(k) or "")
        for k in ("message", "detail", "suggestion", "title")
    )
    match = re.search(
        r"[「\"']([^」\"']+)[」\"']\s*(?:改成|改为|换成|→|->)\s*[「\"']?([^」\"'\n]+)[」\"']?",
        blob,
    )
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None


def _kind_ok(item: dict[str, Any]) -> bool:
    kind = str(item.get("kind") or item.get("type") or item.get("category") or "text").lower()
    blocked = ("layout", "image", "master", "theme", "add-slide", "delete", "geometry-rebuild")
    return not any(token in kind for token in blocked)


def findings_from_report(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if not isinstance(data, dict):
        return []
    for key in ("tasks", "findings", "issues", "items", "problems", "results"):
        value = data.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    # Single nested repair plan
    plan = data.get("repairPlan") or data.get("repair_plan")
    if isinstance(plan, dict):
        return findings_from_report(plan)
    return []


def build_edits(report: Any) -> tuple[list[dict[str, Any]], list[str]]:
    """Return (edits, skipped_notes)."""
    edits_by_slide: dict[int, dict[str, str]] = {}
    skipped: list[str] = []
    for index, item in enumerate(findings_from_report(report)):
        if not _kind_ok(item):
            skipped.append(f"[{index}] skipped non-text kind: {item.get('kind') or item.get('type')}")
            continue
        slide = _slide_of(item)
        pair = _pair_of(item)
        if slide is None or pair is None:
            skipped.append(f"[{index}] needs human review (no clear slide/old/new): {item.get('message') or item}")
            continue
        old, new = pair
        edits_by_slide.setdefault(slide, {})[old] = new
    edits = [
        {"slide": slide, "replacements": replacements}
        for slide, replacements in sorted(edits_by_slide.items())
    ]
    return edits, skipped


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Draft preserve-edit JSON from a pptlint-like report.")
    parser.add_argument("report", type=Path, help="pptlint / repair-plan JSON file")
    parser.add_argument("-o", "--output", type=Path, help="write edits.json here")
    parser.add_argument("--stdout", action="store_true", help="print edits JSON to stdout")
    args = parser.parse_args(argv)

    if not args.report.is_file():
        print(f"report not found: {args.report}", file=sys.stderr)
        return 2
    try:
        data = json.loads(args.report.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"invalid JSON: {exc}", file=sys.stderr)
        return 2

    edits, skipped = build_edits(data)
    payload = {
        "edits": edits,
        "meta": {
            "sourceReport": str(args.report),
            "editCount": len(edits),
            "skippedCount": len(skipped),
            "reviewRequired": True,
            "note": "Half-automatic draft. Review before applying with preserve_edit_pptx.py.",
        },
        "skipped": skipped,
    }

    text = json.dumps(payload if args.stdout else edits, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        # File form is the engine-native array unless --stdout meta is requested.
        args.output.write_text(
            json.dumps(edits, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"[OK] wrote {len(edits)} edit group(s) -> {args.output}", file=sys.stderr)
    if args.stdout or not args.output:
        print(text if args.stdout else json.dumps(edits, ensure_ascii=False, indent=2))
    if skipped:
        print(f"[REVIEW] {len(skipped)} finding(s) need human judgment:", file=sys.stderr)
        for line in skipped[:20]:
            print(f"  - {line}", file=sys.stderr)
    if not edits:
        print("[WARN] no safe text replacements extracted.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
