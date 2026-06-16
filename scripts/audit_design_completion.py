#!/usr/bin/env python3
"""Audit presentation design-completion contracts.

This is stricter than ``audit_formal_delivery.py``. It checks whether a deck
has a visual direction, per-page roles, layout-family variety, asset
requirements, notes, and a handoff-ready quality report.
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path
from typing import Any


REQUIRED_LOCK_SECTIONS = {
    "visual_direction",
    "typography",
    "brand_assets",
    "aesthetic_checks",
    "page_roles",
    "visual_weight",
    "layout_family",
    "page_recipes",
    "visual_layers",
    "raster_policy",
    "asset_requirements",
    "anti_patterns",
}

PAGE_LOCK_SECTIONS = REQUIRED_LOCK_SECTIONS - {
    "visual_direction",
    "typography",
    "brand_assets",
    "aesthetic_checks",
}

KNOWN_IP_MARKERS = {
    "交通银行": ("traffic_bank", "bankcomm", "bank of communications", "bocom"),
    "好客山东": ("haoke_shandong", "friendly_shandong", "hospitality_shandong"),
    "文旅大戏": ("wenlv_daxi", "culture_tourism_show", "cultural_tourism_show"),
}

VALID_BRAND_STATES = {
    "official-source",
    "user-provided",
    "text-lockup-fallback",
    "needs-authorized-replacement",
}

SKIP_DIRS = {"node_modules", ".git", ".venv", "dist", "build", "__pycache__"}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def load_json(path: Path) -> Any:
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


def find_project_files(path: Path) -> dict[str, list[Path]]:
    root = path.expanduser().resolve()
    files = {
        "manifest": [],
        "design_spec": [],
        "spec_lock": [],
        "quality_report": [],
        "design_report": [],
        "html": [],
        "pptx": [],
        "source": [],
        "preview_png": [],
    }

    candidates = [root] if root.is_file() else [
        p for p in root.rglob("*")
        if p.is_file() and not any(part in SKIP_DIRS for part in p.parts)
    ]
    for p in candidates:
        lower = p.name.lower()
        suffix = p.suffix.lower()
        if lower in {"manifest.json", "project-brief.json"}:
            files["manifest"].append(p)
        elif lower == "design_spec.md":
            files["design_spec"].append(p)
        elif lower == "spec_lock.md":
            files["spec_lock"].append(p)
        elif lower == "quality-report.json":
            files["quality_report"].append(p)
        elif lower == "design-quality-report.md":
            files["design_report"].append(p)
        elif lower == "source.md":
            files["source"].append(p)
        elif suffix in {".html", ".htm"}:
            files["html"].append(p)
        elif suffix == ".pptx":
            files["pptx"].append(p)
        elif suffix == ".png" and (".preview" in p.parts or "screenshots" in p.parts):
            files["preview_png"].append(p)
    return files


def find_quality_gate(manifests: list[Path]) -> dict[str, Any]:
    for manifest in manifests:
        data = load_json(manifest)
        gate = data.get("qualityGate")
        if isinstance(gate, dict):
            return gate
    return {}


def pptx_counts(path: Path) -> tuple[int, int]:
    try:
        with zipfile.ZipFile(path) as zf:
            names = zf.namelist()
    except zipfile.BadZipFile:
        return 0, 0
    slides = len([n for n in names if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)])
    notes = len([n for n in names if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", n)])
    return slides, notes


def section_pages(section: dict[str, str]) -> list[str]:
    return sorted(k for k in section if re.fullmatch(r"P\d{2}", k))


def repeated_layout_failures(layouts: dict[str, str], roles: dict[str, str], anti: dict[str, str]) -> list[str]:
    pages = section_pages(layouts)
    failures: list[str] = []
    window: list[str] = []
    last_layout: str | None = None
    for page in pages:
        role = roles.get(page, "")
        layout = layouts.get(page, "")
        if role == "anchor":
            window = []
            last_layout = None
            continue
        if layout == last_layout:
            window.append(page)
        else:
            window = [page]
            last_layout = layout
        if len(window) >= 3:
            has_reason = all("intentional-repeat:" in anti.get(p, "") for p in window)
            if not has_reason:
                failures.append(f"layout_family repeated across {', '.join(window)}: {layout}")
    return failures


def first_number(value: str) -> float | None:
    match = re.search(r"\d+(?:\.\d+)?", value)
    return float(match.group(0)) if match else None


def number_range(value: str) -> tuple[float, float] | None:
    numbers = [float(item) for item in re.findall(r"\d+(?:\.\d+)?", value)]
    if not numbers:
        return None
    if len(numbers) == 1:
        return numbers[0], numbers[0]
    return min(numbers[0], numbers[1]), max(numbers[0], numbers[1])


def typography_scale_failures(lock: dict[str, dict[str, str]]) -> list[str]:
    failures: list[str] = []
    typography = lock.get("typography", {})
    checks = lock.get("aesthetic_checks", {})
    body = first_number(typography.get("body", ""))
    if body is None:
        return ["spec_lock.md typography must declare body font size"]
    min_body = first_number(checks.get("min_body_px", "18")) or 18
    if body < min_body:
        failures.append(f"body font size {body:g}px is below formal minimum {min_body:g}px")
    title = first_number(typography.get("title", ""))
    ratio_range = number_range(checks.get("title_body_ratio", "1.6-2.0")) or (1.6, 2.0)
    if title is not None:
        ratio = title / body
        if ratio < ratio_range[0] or ratio > ratio_range[1]:
            failures.append(f"title/body ratio {ratio:.2f} outside formal range {ratio_range[0]:g}-{ratio_range[1]:g}")
    for field in ("max_peer_cards_per_slide", "min_card_padding_px", "logo_strategy"):
        if field not in checks:
            failures.append(f"aesthetic_checks missing {field}")
    return failures


def theme_art_direction_failures(lock: dict[str, dict[str, str]]) -> list[str]:
    failures: list[str] = []
    visual_direction = lock.get("visual_direction", {})
    checks = lock.get("aesthetic_checks", {})
    for field in (
        "theme_art_direction",
        "theme_motif",
        "theme_scope",
        "title_treatment",
        "serious_context_exception",
    ):
        if not visual_direction.get(field, "").strip():
            failures.append(f"visual_direction missing {field}")
    scope = visual_direction.get("theme_scope", "").strip()
    if scope and scope not in {"deck-wide", "cover+section+tail", "cover+tail", "restrained-title-only"}:
        failures.append("visual_direction theme_scope has invalid value")
    for field in ("theme_art_direction", "title_art_treatment", "cover_tail_motif"):
        if field not in checks:
            failures.append(f"aesthetic_checks missing {field}")
    title_treatment = visual_direction.get("title_treatment", "").lower()
    serious_exception = visual_direction.get("serious_context_exception", "").lower()
    if "restrained" in title_treatment and serious_exception in {"", "none", "not-applicable", "n/a"}:
        failures.append("restrained title_treatment requires serious_context_exception")
    return failures


def brand_asset_failures(lock: dict[str, dict[str, str]], spec_text: str) -> list[str]:
    failures: list[str] = []
    rows = lock.get("brand_assets", {})
    if not rows:
        return ["spec_lock.md brand_assets has no entries"]
    asset_text = "\n".join(f"{key}: {value}" for key, value in rows.items())
    lowered_assets = asset_text.lower()
    if "fake" in lowered_assets or "lookalike" in lowered_assets or "approximate-logo" in lowered_assets:
        failures.append("brand_assets must not contain fake/lookalike/approximate logo handling")
    if set(rows) != {"none-detected"}:
        for key, value in rows.items():
            if key == "none-detected":
                continue
            state_match = re.search(r"state:\s*([a-z-]+)", value)
            if not state_match:
                failures.append(f"brand_assets {key} missing state")
            elif state_match.group(1) not in VALID_BRAND_STATES:
                failures.append(f"brand_assets {key} has invalid state {state_match.group(1)}")
    for marker, aliases in KNOWN_IP_MARKERS.items():
        if marker in spec_text:
            marker_present = marker.lower() in lowered_assets or any(alias in lowered_assets for alias in aliases)
            if not marker_present:
                failures.append(f"known IP mark `{marker}` missing from brand_assets")
    return failures


def audit_project(path: Path) -> dict[str, Any]:
    files = find_project_files(path)
    failures: list[str] = []
    warnings: list[str] = []

    gate = find_quality_gate(files["manifest"])
    if gate and gate.get("level") != "formal-business":
        warnings.append("qualityGate exists but level is not formal-business")

    if not files["design_spec"]:
        failures.append("missing design_spec.md")
        spec_text = ""
    else:
        spec_text = "\n".join(read_text(p) for p in files["design_spec"])
        for token in ["Visual Direction", "Theme Art Direction", "Brand / IP Assets", "Page Role / Visual Weight Contract", "page_recipe_id", "visual_layer", "raster_policy", "anti_patterns", "Aesthetic"]:
            if token not in spec_text:
                failures.append(f"design_spec.md missing visual-completion token: {token}")

    if not files["spec_lock"]:
        failures.append("missing spec_lock.md")
    else:
        lock = parse_lock(files["spec_lock"][0])
        missing = sorted(REQUIRED_LOCK_SECTIONS - set(lock))
        if missing:
            failures.append("spec_lock.md missing section(s): " + ", ".join(missing))
        else:
            role_pages = section_pages(lock["page_roles"])
            if not role_pages:
                failures.append("spec_lock.md page_roles has no PNN entries")
            for section_name in sorted(PAGE_LOCK_SECTIONS - {"page_roles"}):
                missing_pages = sorted(set(role_pages) - set(section_pages(lock[section_name])))
                if missing_pages:
                    failures.append(f"spec_lock.md {section_name} missing page(s): {', '.join(missing_pages)}")
            for page, value in lock.get("anti_patterns", {}).items():
                if re.fullmatch(r"P\d{2}", page) and not value:
                    failures.append(f"anti_patterns is blank for {page}")
            failures.extend(repeated_layout_failures(lock["layout_family"], lock["page_roles"], lock["anti_patterns"]))
            failures.extend(repeated_layout_failures(lock["page_recipes"], lock["page_roles"], lock["anti_patterns"]))
            if lock["visual_direction"].get("id", "") in {"", "custom"} and not lock["visual_direction"].get("benchmark"):
                failures.append("visual_direction custom requires a benchmark")
            failures.extend(brand_asset_failures(lock, spec_text))
            failures.extend(typography_scale_failures(lock))
            failures.extend(theme_art_direction_failures(lock))
            for page, policy in lock["raster_policy"].items():
                if re.fullmatch(r"P\d{2}", page):
                    role = lock["page_roles"].get(page, "")
                    if "allowed" in policy.lower() and role not in {"anchor", "closing", "section", "poster", "web_showcase"}:
                        failures.append(f"{page}: raster_policy allows full-page raster on formal body role `{role}`")

    for html_path in files["html"]:
        html = read_text(html_path)
        sections = html.count('<section class="slide') + html.count("<section class='slide")
        if sections and sections < 3:
            warnings.append(f"{html_path.name}: low slide section count ({sections})")
        if "[必填]" in html or "TODO" in html:
            failures.append(f"{html_path.name}: placeholder/TODO remains")
        if "<img " in html and ("示意" not in html and "placeholder" not in html.lower()):
            warnings.append(f"{html_path.name}: images present but schematic/placeholder labeling not detected")

    for pptx in files["pptx"]:
        slides, notes = pptx_counts(pptx)
        if slides == 0:
            failures.append(f"{pptx.name}: no slide XML found")
        elif notes == 0:
            warnings.append(f"{pptx.name}: no notesSlides found")
        elif notes < slides:
            warnings.append(f"{pptx.name}: notesSlides count {notes} is lower than slide count {slides}")

    if not files["preview_png"]:
        warnings.append("no rendered PNG screenshots found under .preview/ or screenshots/")

    if not files["design_report"]:
        warnings.append("design-quality-report.md missing; this script will report findings but no handoff report exists yet")

    return {
        "path": str(path),
        "status": "pass" if not failures else "fail",
        "failures": failures,
        "warnings": warnings,
        "counts": {key: len(value) for key, value in files.items()},
    }


def render_markdown(results: list[dict[str, Any]]) -> str:
    lines = ["# Design Quality Report", ""]
    for result in results:
        lines.append(f"## {result['path']}")
        lines.append("")
        lines.append(f"- Status: {result['status']}")
        lines.append(f"- Failures: {len(result['failures'])}")
        lines.append(f"- Warnings: {len(result['warnings'])}")
        if result["failures"]:
            lines.append("")
            lines.append("### Failures")
            for item in result["failures"]:
                lines.append(f"- {item}")
        if result["warnings"]:
            lines.append("")
            lines.append("### Warnings")
            for item in result["warnings"]:
                lines.append(f"- {item}")
        lines.append("")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    if not argv:
        print("Usage: python3 scripts/audit_design_completion.py <project_path_or_artifact> [...]", file=sys.stderr)
        return 2

    results = [audit_project(Path(arg)) for arg in argv]
    print(json.dumps({"status": "pass" if all(r["status"] == "pass" for r in results) else "fail", "results": results}, ensure_ascii=False, indent=2))

    for arg, result in zip(argv, results):
        project = Path(arg).expanduser().resolve()
        if project.is_dir():
            (project / "design-quality-report.md").write_text(render_markdown([result]), encoding="utf-8")

    return 0 if all(r["status"] == "pass" for r in results) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
