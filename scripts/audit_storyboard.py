#!/usr/bin/env python3
"""Audit DeckIR storyboard files before final presentation generation."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


BODY_ROLES = {"context", "evidence", "comparison", "process", "benefit", "risk", "action"}
REQUIRED_SLIDE_FIELDS = {"page", "role", "title", "intent", "recipeId", "layoutFamily", "evidenceRefs", "visualLayer", "rasterPolicy", "editabilityTarget", "speakerIntent"}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def read_json(path: Path) -> Any:
    try:
        return json.loads(read_text(path))
    except Exception:
        return {}


def audit_project(project: Path) -> dict[str, Any]:
    storyboard_path = project / "storyboard.json"
    source_map_path = project / "source-map.json"
    failures: list[str] = []
    warnings: list[str] = []
    if not storyboard_path.exists():
        failures.append("missing storyboard.json")
        return {"path": str(project), "status": "fail", "failures": failures, "warnings": warnings}
    if not source_map_path.exists():
        failures.append("missing source-map.json")
        return {"path": str(project), "status": "fail", "failures": failures, "warnings": warnings}

    storyboard = read_json(storyboard_path)
    source_map = read_json(source_map_path)
    if storyboard.get("deckIRVersion") != "1.0":
        failures.append("storyboard.json deckIRVersion must be 1.0")
    slides = storyboard.get("slides")
    if not isinstance(slides, list) or not slides:
        failures.append("storyboard.json slides must be a non-empty array")
        return {"path": str(project), "status": "fail", "failures": failures, "warnings": warnings}

    claim_ids = {
        item.get("id")
        for item in source_map.get("claims", [])
        if isinstance(item, dict) and item.get("id")
    }
    for index, slide in enumerate(slides, start=1):
        if not isinstance(slide, dict):
            failures.append(f"slide {index} must be an object")
            continue
        page = str(slide.get("page") or f"slide {index}")
        missing = sorted(REQUIRED_SLIDE_FIELDS - set(slide))
        if missing:
            failures.append(f"{page} missing field(s): {', '.join(missing)}")
        if not re.fullmatch(r"P\d{2}", page):
            failures.append(f"{page} page must use PNN format")
        recipe = str(slide.get("recipeId") or "")
        if "." not in recipe:
            failures.append(f"{page} recipeId must be a registered page recipe id")
        evidence_refs = slide.get("evidenceRefs")
        if not isinstance(evidence_refs, list) or not evidence_refs:
            failures.append(f"{page} evidenceRefs must contain at least one source-map claim id")
        elif claim_ids:
            missing_refs = sorted(ref for ref in evidence_refs if ref not in claim_ids)
            if missing_refs:
                failures.append(f"{page} evidenceRefs reference missing source-map claim id(s): {', '.join(missing_refs)}")
        if "editable" not in str(slide.get("editabilityTarget", "")).lower():
            failures.append(f"{page} editabilityTarget must describe editable output")
        role = str(slide.get("role") or "")
        raster = str(slide.get("rasterPolicy") or "").lower()
        if role in BODY_ROLES:
            if "prohibited-formal-body" not in raster:
                failures.append(f"{page} rasterPolicy must be prohibited-formal-body for formal body role `{role}`")
            if "allowed" in raster and "prohibited-formal-body" not in raster:
                failures.append(f"{page} rasterPolicy allows full-page raster on formal body role `{role}`")

    return {
        "path": str(project),
        "status": "pass" if not failures else "fail",
        "failures": failures,
        "warnings": warnings,
        "counts": {"slides": len(slides), "claims": len(claim_ids)},
    }


def main(argv: list[str]) -> int:
    if not argv:
        print("Usage: python3 scripts/audit_storyboard.py <project_path> [...]", file=sys.stderr)
        return 2
    results = [audit_project(Path(arg).expanduser().resolve()) for arg in argv]
    status = "pass" if all(result["status"] == "pass" for result in results) else "fail"
    print(json.dumps({"status": status, "results": results}, ensure_ascii=False, indent=2))
    return 0 if status == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
