#!/usr/bin/env python3
"""Audit 4.0 page recipes, visual layers, and raster policies."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


REQUIRED_SECTIONS = {"page_roles", "page_recipes", "visual_layers", "raster_policy"}
SKIP_DIRS = {"node_modules", ".git", ".venv", "dist", "build", "__pycache__"}
TERMINAL_LAYER_STATUSES = {"Generated", "Needs-Manual", "Inserted", "Pending"}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def read_json(path: Path) -> Any:
    try:
        return json.loads(read_text(path))
    except Exception:
        return {}


def parse_lock(path: Path) -> dict[str, dict[str, str]]:
    sections: dict[str, dict[str, str]] = {}
    current: str | None = None
    for raw in read_text(path).splitlines():
        line = raw.strip()
        if line.startswith("## "):
            current = line[3:].strip()
            sections.setdefault(current, {})
            continue
        if not current or not line.startswith("- ") or ":" not in line:
            continue
        key, value = line[2:].split(":", 1)
        sections[current][key.strip()] = value.strip()
    return sections


def find_files(root: Path) -> dict[str, list[Path]]:
    files = {"spec_lock": [], "recipe_index": [], "layer_manifest": [], "pptx": [], "html": []}
    path = root.expanduser().resolve()
    candidates = [path] if path.is_file() else [
        item for item in path.rglob("*")
        if item.is_file() and not any(part in SKIP_DIRS for part in item.parts)
    ]
    for item in candidates:
        lower = item.name.lower()
        if lower == "spec_lock.md":
            files["spec_lock"].append(item)
        elif str(item).endswith("templates/page-recipes/index.json"):
            files["recipe_index"].append(item)
        elif str(item).endswith("assets/generated/page-visuals/manifest.json"):
            files["layer_manifest"].append(item)
        elif item.suffix.lower() == ".pptx":
            files["pptx"].append(item)
        elif item.suffix.lower() in {".html", ".htm"}:
            files["html"].append(item)
    return files


def page_keys(section: dict[str, str]) -> list[str]:
    return sorted(key for key in section if re.fullmatch(r"P\d{2}", key))


def recipe_family(recipe: str) -> str:
    return recipe.split(".", 1)[0] if recipe else ""


def repeated_recipe_failures(recipes: dict[str, str], roles: dict[str, str]) -> list[str]:
    failures: list[str] = []
    window: list[str] = []
    last = ""
    for page in page_keys(recipes):
        role = roles.get(page, "")
        recipe = recipes.get(page, "")
        if role == "anchor":
            window = []
            last = ""
            continue
        if recipe == last:
            window.append(page)
        else:
            window = [page]
            last = recipe
        if len(window) >= 3:
            failures.append(f"page_recipe repeated across {', '.join(window)}: {recipe}")
    return failures


def layer_required(value: str) -> bool:
    return bool(value.strip()) and value.strip().lower() != "none"


def audit_path(path: Path) -> dict[str, Any]:
    files = find_files(path)
    failures: list[str] = []
    warnings: list[str] = []

    if not files["spec_lock"]:
        failures.append("missing spec_lock.md")
        return {"path": str(path), "status": "fail", "failures": failures, "warnings": warnings}

    lock = parse_lock(files["spec_lock"][0])
    missing = sorted(REQUIRED_SECTIONS - set(lock))
    if missing:
        failures.append("spec_lock.md missing 4.0 recipe section(s): " + ", ".join(missing))
        return {"path": str(path), "status": "fail", "failures": failures, "warnings": warnings}

    roles = lock["page_roles"]
    recipes = lock["page_recipes"]
    layers = lock["visual_layers"]
    raster = lock["raster_policy"]
    role_pages = set(page_keys(roles))
    if not role_pages:
        failures.append("page_roles has no PNN entries")
    for section_name, section in (("page_recipes", recipes), ("visual_layers", layers), ("raster_policy", raster)):
        missing_pages = sorted(role_pages - set(page_keys(section)))
        if missing_pages:
            failures.append(f"{section_name} missing page(s): {', '.join(missing_pages)}")

    failures.extend(repeated_recipe_failures(recipes, roles))

    for page, policy in raster.items():
        if not re.fullmatch(r"P\d{2}", page):
            continue
        role = roles.get(page, "")
        policy_lower = policy.lower()
        if "allowed" in policy_lower and role not in {"anchor", "closing", "section", "poster", "web_showcase"}:
            failures.append(f"{page}: raster_policy allows full-page raster on formal body role `{role}`")
        if "prohibited-formal-body" not in policy_lower and role not in {"anchor", "closing", "section", "poster", "web_showcase"}:
            warnings.append(f"{page}: body page raster_policy is not explicitly prohibited-formal-body")

    layer_pages = {page for page, value in layers.items() if re.fullmatch(r"P\d{2}", page) and layer_required(value)}
    if layer_pages and not files["layer_manifest"]:
        failures.append("visual_layers require assets/generated/page-visuals/manifest.json")
    elif files["layer_manifest"]:
        manifest = read_json(files["layer_manifest"][0])
        items = manifest.get("items") if isinstance(manifest, dict) else None
        if not isinstance(items, list):
            failures.append("page-visuals manifest must contain items array")
        else:
            manifest_pages = {item.get("page") for item in items if isinstance(item, dict)}
            missing_manifest_pages = sorted(layer_pages - manifest_pages)
            if missing_manifest_pages:
                failures.append("page-visuals manifest missing page(s): " + ", ".join(missing_manifest_pages))
            for item in items:
                if not isinstance(item, dict):
                    continue
                page = item.get("page")
                status = item.get("status")
                text_policy = str(item.get("textPolicy", "")).lower()
                prompt = str(item.get("prompt", "")).lower()
                if status not in TERMINAL_LAYER_STATUSES:
                    failures.append(f"{page}: invalid visual layer status `{status}`")
                if "no-text" not in text_policy:
                    failures.append(f"{page}: visual layer textPolicy must include no-text")
                for forbidden in ("readable text", "brand logos", "qr codes"):
                    if forbidden not in prompt:
                        warnings.append(f"{page}: visual layer prompt should explicitly forbid {forbidden}")

    recipe_index = Path(__file__).resolve().parents[1] / "templates" / "page-recipes" / "index.json"
    known_recipes = set(read_json(recipe_index).keys()) if recipe_index.exists() else set()
    for page, recipe in recipes.items():
        if re.fullmatch(r"P\d{2}", page) and recipe and recipe not in known_recipes and not recipe.startswith("custom."):
            warnings.append(f"{page}: page_recipe `{recipe}` is not in templates/page-recipes/index.json")

    return {
        "path": str(path),
        "status": "pass" if not failures else "fail",
        "failures": failures,
        "warnings": warnings,
        "counts": {key: len(value) for key, value in files.items()},
    }


def main(argv: list[str]) -> int:
    if not argv:
        print("Usage: python3 scripts/audit_visual_recipes.py <project_path_or_artifact> [...]", file=sys.stderr)
        return 2
    results = [audit_path(Path(arg)) for arg in argv]
    status = "pass" if all(result["status"] == "pass" for result in results) else "fail"
    print(json.dumps({"status": status, "results": results}, ensure_ascii=False, indent=2))
    return 0 if status == "pass" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

