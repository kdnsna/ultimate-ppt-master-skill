#!/usr/bin/env python3
"""Validate image acquisition manifests used by PPT Master projects."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]

PROMPT_REQUIRED_FIELDS = {
    "filename",
    "asset_type",
    "type",
    "page_role",
    "text_policy",
    "aspect_ratio",
    "backend",
    "source",
    "status",
    "prompt_path",
}

PROMPT_STATUS_VALUES = {"Pending", "Generated", "Failed", "Needs-Manual"}
TEXT_POLICY_VALUES = {"none", "limited-labels", "embedded"}
PAGE_ROLE_VALUES = {"local", "hero_page"}

ASSET_PLAN_REQUIRED_FIELDS = {
    "id",
    "slide",
    "slot",
    "asset_type",
    "aspect_ratio",
    "text_policy",
    "source_policy",
    "backend",
    "prompt_path",
    "status",
    "current_generation_evidence",
}

ASSET_TYPE_VALUES = {"hero", "evidence", "infographic", "screenshot-frame", "cover", "micro-asset"}
ASSET_TEXT_POLICY_VALUES = {"none", "limited-labels", "embedded"}
SOURCE_POLICY_VALUES = {"generated", "official", "user-provided", "public-search", "needs-manual"}
ASSET_STATUS_VALUES = {"Pending", "Generated", "Failed", "Needs-Manual"}

SOURCE_REQUIRED_FIELDS = {
    "filename",
    "provider",
    "source_page_url",
    "license_name",
    "license_tier",
    "status",
}

LICENSE_TIER_VALUES = {"no-attribution", "attribution-required"}

IGNORED_PARTS = {".git", "node_modules", ".venv", "dist", "build", "__pycache__"}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def manifest_items(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, dict) and isinstance(data.get("items"), list):
        return [item for item in data["items"] if isinstance(item, dict)]
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    return []


def audit_image_prompts(path: Path, errors: list[str]) -> None:
    data = load_json(path)
    items = manifest_items(data)
    require(bool(items), f"{path}: image prompt manifest must contain items", errors)

    for index, item in enumerate(items, start=1):
        label = item.get("filename") or f"item {index}"
        missing = sorted(field for field in PROMPT_REQUIRED_FIELDS if not item.get(field))
        require(not missing, f"{label}: missing required field(s): {', '.join(missing)}", errors)
        require(item.get("status") in PROMPT_STATUS_VALUES, f"{label}: invalid status {item.get('status')!r}", errors)
        require(item.get("text_policy") in TEXT_POLICY_VALUES, f"{label}: invalid text_policy {item.get('text_policy')!r}", errors)
        require(item.get("page_role") in PAGE_ROLE_VALUES, f"{label}: invalid page_role {item.get('page_role')!r}", errors)

        prompt_path = item.get("prompt_path")
        if isinstance(prompt_path, str) and prompt_path:
            resolved = (path.parent / prompt_path).resolve()
            require(resolved.is_file(), f"{label}: prompt_path does not exist: {prompt_path}", errors)


EVIDENCE_REQUIRED_FIELDS = {
    "run_id",
    "timestamp",
    "backend",
    "prompt_sha256",
    "file_sha256",
    "width",
    "height",
}


def evidence_is_current(value: Any) -> bool:
    if isinstance(value, list):
        return any(evidence_is_current(item) for item in value)
    if not isinstance(value, dict):
        return False

    if not EVIDENCE_REQUIRED_FIELDS.issubset(value):
        return False
    return all(value.get(field) not in (None, "") for field in EVIDENCE_REQUIRED_FIELDS)


def audit_asset_plan(path: Path, errors: list[str]) -> None:
    data = load_json(path)
    items = manifest_items(data)
    require(bool(items), f"{path}: asset plan must contain items", errors)

    for index, item in enumerate(items, start=1):
        label = item.get("id") or f"item {index}"
        missing = sorted(field for field in ASSET_PLAN_REQUIRED_FIELDS if field not in item or item.get(field) in (None, ""))
        require(not missing, f"{label}: missing required field(s): {', '.join(missing)}", errors)
        require(item.get("asset_type") in ASSET_TYPE_VALUES, f"{label}: invalid asset_type {item.get('asset_type')!r}", errors)
        require(item.get("text_policy") in ASSET_TEXT_POLICY_VALUES, f"{label}: invalid text_policy {item.get('text_policy')!r}", errors)
        require(item.get("source_policy") in SOURCE_POLICY_VALUES, f"{label}: invalid source_policy {item.get('source_policy')!r}", errors)
        require(item.get("status") in ASSET_STATUS_VALUES, f"{label}: invalid status {item.get('status')!r}", errors)

        prompt_path = item.get("prompt_path")
        if isinstance(prompt_path, str) and prompt_path:
            resolved = (path.parent / prompt_path).resolve()
            require(resolved.is_file(), f"{label}: prompt_path does not exist: {prompt_path}", errors)

        if item.get("status") == "Generated" and item.get("source_policy") == "generated":
            require(
                evidence_is_current(item.get("current_generation_evidence")),
                f"{label}: Generated assets must record current_generation_evidence from the current generation run",
                errors,
            )


def audit_image_sources(path: Path, errors: list[str]) -> None:
    data = load_json(path)
    items = manifest_items(data)
    require(bool(items), f"{path}: image source manifest must contain items", errors)

    for index, item in enumerate(items, start=1):
        label = item.get("filename") or f"item {index}"
        missing = sorted(field for field in SOURCE_REQUIRED_FIELDS if not item.get(field))
        require(not missing, f"{label}: missing required field(s): {', '.join(missing)}", errors)
        require(
            item.get("license_tier") in LICENSE_TIER_VALUES,
            f"{label}: invalid license_tier {item.get('license_tier')!r}",
            errors,
        )


def discover_manifests(root: Path) -> list[Path]:
    manifests: list[Path] = []
    for name in ("asset_plan.json", "image_prompts.json", "image_sources.json"):
        for path in root.rglob(name):
            if any(part in IGNORED_PARTS for part in path.parts):
                continue
            manifests.append(path)
    return sorted(manifests)


def audit_manifest(path: Path, errors: list[str]) -> None:
    require(path.is_file(), f"manifest does not exist: {path}", errors)
    if errors and not path.is_file():
        return
    if path.name == "asset_plan.json":
        audit_asset_plan(path, errors)
    elif path.name == "image_sources.json":
        audit_image_sources(path, errors)
    else:
        audit_image_prompts(path, errors)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "manifest",
        nargs="*",
        help="Path(s) to asset_plan.json, image_prompts.json, or image_sources.json. If omitted, scan the repository.",
    )
    args = parser.parse_args()

    errors: list[str] = []
    paths = [Path(value).resolve() for value in args.manifest] if args.manifest else discover_manifests(ROOT)
    for path in paths:
        audit_manifest(path, errors)

    if errors:
        print("Image contract audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    if paths:
        print(f"Image contract audit passed: {len(paths)} manifest(s) checked.")
    else:
        print("Image contract audit passed: no image manifests found in repository.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
