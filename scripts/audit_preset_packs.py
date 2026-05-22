#!/usr/bin/env python3
"""Audit reusable preset starter packs before release."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PRESETS_DIR = ROOT / "templates" / "presets"
DIRECTIONS_PATH = PRESETS_DIR / "preset-directions.json"

REQUIRED_PRESET_FIELDS = (
    "id",
    "status",
    "scenario",
    "audience",
    "primaryOutput",
    "secondaryOutput",
    "recommendedSlideCount",
    "sourceRequirements",
    "narrativeSkeleton",
    "slideRoster",
    "templateCandidates",
    "qualityChecks",
    "sampleProof",
)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def check_path(path_value: str, errors: list[str], label: str) -> None:
    path = ROOT / path_value
    require(path.exists(), f"{label} does not exist: {path_value}", errors)


def audit_pack(preset_id: str, entry: dict[str, Any], errors: list[str]) -> None:
    pack_path = entry.get("packPath")
    require(isinstance(pack_path, str) and pack_path, f"{preset_id}: missing packPath", errors)
    if not isinstance(pack_path, str) or not pack_path:
        return

    pack_dir = ROOT / pack_path
    require(pack_dir.is_dir(), f"{preset_id}: pack directory missing: {pack_path}", errors)
    preset_path = pack_dir / "preset.json"
    source_path = pack_dir / "source.md"
    checklist_path = pack_dir / "quality-checklist.md"
    require(preset_path.is_file(), f"{preset_id}: preset.json missing", errors)
    require(source_path.is_file(), f"{preset_id}: source.md missing", errors)
    require(checklist_path.is_file(), f"{preset_id}: quality-checklist.md missing", errors)
    if not preset_path.is_file():
        return

    data = load_json(preset_path)
    for field in REQUIRED_PRESET_FIELDS:
        require(field in data, f"{preset_id}: preset.json missing field {field}", errors)

    require(data.get("id") == preset_id, f"{preset_id}: preset.json id mismatch", errors)
    require(data.get("status") in {"draft-pack", "stable-pack"}, f"{preset_id}: invalid pack status", errors)
    require(len(data.get("sourceRequirements", [])) >= 4, f"{preset_id}: sourceRequirements too short", errors)
    require(len(data.get("narrativeSkeleton", [])) >= 4, f"{preset_id}: narrativeSkeleton too short", errors)
    require(len(data.get("slideRoster", [])) >= 6, f"{preset_id}: slideRoster too short", errors)
    require(len(data.get("qualityChecks", [])) >= 5, f"{preset_id}: qualityChecks too short", errors)

    template_candidates = data.get("templateCandidates", {})
    require(bool(template_candidates.get("layouts")), f"{preset_id}: no layout candidates", errors)
    require(bool(template_candidates.get("charts")), f"{preset_id}: no chart candidates", errors)
    require(template_candidates.get("webDeckStyle") in {"editorial", "swiss"}, f"{preset_id}: invalid webDeckStyle", errors)

    sample_proof = data.get("sampleProof", {})
    require("publicDemoSafe" in sample_proof, f"{preset_id}: sampleProof.publicDemoSafe missing", errors)
    for key in ("source", "qualityChecklist", "generatedOutput", "screenshot"):
        value = sample_proof.get(key)
        require(isinstance(value, str) and value, f"{preset_id}: sampleProof.{key} missing", errors)
        if isinstance(value, str):
            require(value != "pending", f"{preset_id}: sampleProof.{key} is still pending", errors)
            check_path(value, errors, f"{preset_id}: sampleProof.{key}")

    generated = sample_proof.get("generatedOutput", "")
    screenshot = sample_proof.get("screenshot", "")
    if isinstance(generated, str) and generated != "pending":
        require(generated.endswith(".html"), f"{preset_id}: generatedOutput should be an HTML proof", errors)
    if isinstance(screenshot, str) and screenshot != "pending":
        require(screenshot.endswith(".svg"), f"{preset_id}: screenshot should be an SVG cover proof", errors)


def main() -> int:
    directions = load_json(DIRECTIONS_PATH)
    errors: list[str] = []
    pack_ids = [preset_id for preset_id, entry in directions.items() if entry.get("status") == "pack"]

    require(bool(pack_ids), "No preset directions have status=pack", errors)
    for preset_id in sorted(pack_ids):
        audit_pack(preset_id, directions[preset_id], errors)

    if errors:
        print("Preset pack audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Preset pack audit passed: {len(pack_ids)} pack(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
