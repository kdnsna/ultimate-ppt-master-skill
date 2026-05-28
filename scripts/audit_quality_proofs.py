#!/usr/bin/env python3
"""Audit v2.5 stable preset proof artifacts."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PRESETS_DIR = ROOT / "templates" / "presets"
REQUIRED_PROOF_KEYS = ("source", "generatedOutput", "screenshot", "qualityReport", "benchmarkNote")
REQUIRED_PROFILE_KEYS = ("label", "acceptanceCriteria", "reviewCommands", "expectedArtifacts")
STALE_MARKERS = ("v2.3 Demo", "v2.3 Proof", "draft-pack")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def check_path(root_value: str, label: str, errors: list[str]) -> Path:
    path = ROOT / root_value
    require(path.exists(), f"{label} missing: {root_value}", errors)
    return path


def audit_preset(preset_path: Path, errors: list[str]) -> None:
    data = load_json(preset_path)
    preset_id = data.get("id", preset_path.parent.name)
    require(data.get("status") == "stable-pack", f"{preset_id}: status must be stable-pack", errors)
    require("中文办公用户" in str(data.get("userLevel", "")), f"{preset_id}: userLevel must name Chinese office users", errors)
    require(len(data.get("notFor", [])) >= 2, f"{preset_id}: notFor must list at least two unsuitable cases", errors)

    profile = data.get("qualityProfile", {})
    for key in REQUIRED_PROFILE_KEYS:
        require(key in profile, f"{preset_id}: qualityProfile.{key} missing", errors)
    require(len(profile.get("acceptanceCriteria", [])) >= 4, f"{preset_id}: acceptanceCriteria too short", errors)
    require(len(profile.get("expectedArtifacts", [])) >= 4, f"{preset_id}: expectedArtifacts too short", errors)
    require(
        any("visual_review.py" in command for command in profile.get("reviewCommands", [])),
        f"{preset_id}: visual_review.py command missing",
        errors,
    )

    proof = data.get("proofArtifacts", {})
    for key in REQUIRED_PROOF_KEYS:
        value = proof.get(key)
        require(isinstance(value, str) and value and value != "pending", f"{preset_id}: proofArtifacts.{key} missing", errors)
        if isinstance(value, str) and value and value != "pending":
            check_path(value, f"{preset_id}: proofArtifacts.{key}", errors)
            if value.startswith("examples/"):
                check_path(f"apps/web/public/{value}", f"{preset_id}: public mirror for proofArtifacts.{key}", errors)

    report_value = proof.get("qualityReport")
    if isinstance(report_value, str) and report_value:
        report_path = ROOT / report_value
        if report_path.exists():
            report = load_json(report_path)
            require(report.get("version") == "2.5.0", f"{preset_id}: quality report version must be 2.5.0", errors)
            require(report.get("presetId") == preset_id, f"{preset_id}: quality report presetId mismatch", errors)
            require(report.get("status") in {"passed", "reviewed"}, f"{preset_id}: quality report status invalid", errors)
            require(report.get("publicDemoSafe") is True, f"{preset_id}: quality report must be public demo safe", errors)
            doctor = report.get("designDoctor", {})
            require(isinstance(doctor, dict), f"{preset_id}: designDoctor must be an object", errors)
            repair_policy = doctor.get("repairPolicy", {})
            require(repair_policy.get("default") == "report-only", f"{preset_id}: designDoctor repair policy must be report-only", errors)
            require(repair_policy.get("autoRepair") is False, f"{preset_id}: designDoctor autoRepair must default to false", errors)
            require(len(doctor.get("scorecard", [])) >= 3, f"{preset_id}: designDoctor scorecard too short", errors)
            require(len(doctor.get("repairRecommendations", [])) >= 2, f"{preset_id}: designDoctor repair recommendations too short", errors)

    for proof_key in ("generatedOutput", "benchmarkNote"):
        proof_value = proof.get(proof_key)
        if isinstance(proof_value, str) and (ROOT / proof_value).exists():
            content = (ROOT / proof_value).read_text(encoding="utf-8", errors="ignore")
            for marker in STALE_MARKERS:
                require(marker not in content, f"{preset_id}: stale marker {marker!r} found in {proof_value}", errors)


def main() -> int:
    errors: list[str] = []
    preset_paths = sorted(PRESETS_DIR.glob("*/preset.json"))
    require(bool(preset_paths), "No preset.json files found", errors)
    for preset_path in preset_paths:
        audit_preset(preset_path, errors)

    if errors:
        print("Quality proof audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Quality proof audit passed: {len(preset_paths)} stable pack(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
