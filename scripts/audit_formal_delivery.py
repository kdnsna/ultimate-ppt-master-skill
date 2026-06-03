#!/usr/bin/env python3
"""Static formal-business delivery audit for generated PPT/Web deck projects."""

from __future__ import annotations

import json
import re
import sys
import zipfile
from html import unescape
from pathlib import Path
from typing import Any


SKIP_DIRS = {"node_modules", ".git", ".venv", "dist", "build", "__pycache__"}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read_text(path))
    except json.JSONDecodeError:
        return {}


def discover_files(paths: list[Path]) -> tuple[list[Path], list[Path], list[Path], list[Path], list[Path], list[Path]]:
    manifests: list[Path] = []
    html_files: list[Path] = []
    pptx_files: list[Path] = []
    visual_kit_files: list[Path] = []
    element_manifests: list[Path] = []
    prompt_files: list[Path] = []

    for input_path in paths:
      path = input_path.expanduser().resolve()
      if path.is_file():
          lower_name = path.name.lower()
          if lower_name == "visual-element-kit.md":
              visual_kit_files.append(path)
          elif lower_name == "element-manifest.json":
              element_manifests.append(path)
          elif lower_name in {"image_prompts.md", "image_prompts.json"}:
              prompt_files.append(path)
          elif path.suffix.lower() == ".json":
              manifests.append(path)
          elif path.suffix.lower() in {".html", ".htm"}:
              html_files.append(path)
          elif path.suffix.lower() == ".pptx":
              pptx_files.append(path)
          continue

      if not path.exists():
          continue

      for file_path in path.rglob("*"):
          if any(part in SKIP_DIRS for part in file_path.parts):
              continue
          if not file_path.is_file():
              continue
          lower_name = file_path.name.lower()
          suffix = file_path.suffix.lower()
          if lower_name in {"manifest.json", "project-brief.json"}:
              manifests.append(file_path)
          elif lower_name == "visual-element-kit.md":
              visual_kit_files.append(file_path)
          elif lower_name == "element-manifest.json":
              element_manifests.append(file_path)
          elif lower_name in {"image_prompts.md", "image_prompts.json"}:
              prompt_files.append(file_path)
          elif suffix in {".html", ".htm"}:
              html_files.append(file_path)
          elif suffix == ".pptx":
              pptx_files.append(file_path)

    return (
        unique_paths(manifests),
        unique_paths(html_files),
        unique_paths(pptx_files),
        unique_paths(visual_kit_files),
        unique_paths(element_manifests),
        unique_paths(prompt_files),
    )


def unique_paths(paths: list[Path]) -> list[Path]:
    seen: set[Path] = set()
    result: list[Path] = []
    for path in paths:
        if path not in seen:
            seen.add(path)
            result.append(path)
    return result


def find_quality_gate(manifests: list[Path]) -> dict[str, Any]:
    for manifest_path in manifests:
        data = load_json(manifest_path)
        gate = data.get("qualityGate")
        if isinstance(gate, dict) and gate.get("level") == "formal-business":
            return gate
    return {}


def has_no_image_strategy(gate: dict[str, Any], manifests: list[Path]) -> bool:
    strategy_markers = (
        "no-image strategy",
        "no image strategy",
        "no-image",
        "image-or-no-image-strategy",
        "explicit no-image",
        "无图策略",
        "明确无图",
    )
    haystack = json.dumps(gate, ensure_ascii=False).lower()
    for manifest_path in manifests:
        haystack += "\n" + read_text(manifest_path).lower()
    return any(marker.lower() in haystack for marker in strategy_markers)


def requires_chatgpt_generation_first(gate: dict[str, Any], manifests: list[Path]) -> bool:
    haystack = json.dumps(gate, ensure_ascii=False).lower()
    for manifest_path in manifests:
        haystack += "\n" + read_text(manifest_path).lower()
    return "chatgpt-generation-first" in haystack or "primary visual asset engine" in haystack


REQUIRED_ELEMENT_TYPES = {
    "section-divider",
    "metric-badge",
    "process-node",
    "connector",
    "icon-accent",
    "subtle-pattern",
    "callout-sticker",
}


TERMINAL_ELEMENT_STATUSES = {"Generated", "Needs-Manual", "Inserted"}

REQUIRED_DESIGN_LOCK_SECTIONS = {
    "visual_direction",
    "page_roles",
    "visual_weight",
    "layout_family",
    "page_recipes",
    "visual_layers",
    "raster_policy",
    "asset_requirements",
    "anti_patterns",
}


def parse_spec_lock(path: Path) -> dict[str, dict[str, str]]:
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


def discover_design_contracts(paths: list[Path]) -> tuple[list[Path], list[Path]]:
    design_specs: list[Path] = []
    spec_locks: list[Path] = []
    for input_path in paths:
        path = input_path.expanduser().resolve()
        candidates = [path] if path.is_file() else [
            file_path for file_path in path.rglob("*")
            if file_path.is_file() and not any(part in SKIP_DIRS for part in file_path.parts)
        ] if path.exists() else []
        for file_path in candidates:
            if file_path.name == "design_spec.md":
                design_specs.append(file_path)
            elif file_path.name == "spec_lock.md":
                spec_locks.append(file_path)
    return unique_paths(design_specs), unique_paths(spec_locks)


def audit_element_manifests(element_manifests: list[Path]) -> tuple[list[str], bool]:
    errors: list[str] = []
    has_terminal_record = False
    for manifest_path in element_manifests:
        data = load_json(manifest_path)
        items = data.get("items")
        if not isinstance(items, list) or not items:
            errors.append(f"{manifest_path.name} must contain a non-empty items array.")
            continue
        item_types = {item.get("type") for item in items if isinstance(item, dict)}
        missing_types = sorted(REQUIRED_ELEMENT_TYPES - item_types)
        if missing_types:
            errors.append(f"{manifest_path.name} is missing visual element type(s): {', '.join(missing_types)}.")
        for item in items:
            if not isinstance(item, dict):
                continue
            status = item.get("status")
            if status in TERMINAL_ELEMENT_STATUSES:
                has_terminal_record = True
    return errors, has_terminal_record


def prompt_files_have_manual_fallback(prompt_files: list[Path]) -> bool:
    for prompt_path in prompt_files:
        text = read_text(prompt_path)
        if "Needs-Manual" in text or "manual-chatgpt" in text or "Paste into ChatGPT" in text:
            return True
        data = load_json(prompt_path) if prompt_path.suffix.lower() == ".json" else {}
        items = data.get("items") if isinstance(data, dict) else None
        if isinstance(items, list) and any(isinstance(item, dict) and item.get("status") == "Needs-Manual" for item in items):
            return True
    return False


def extract_html_layouts(html: str) -> set[str]:
    layouts = set(re.findall(r"data-layout=[\"']([^\"']+)[\"']", html, flags=re.IGNORECASE))
    for match in re.finditer(r"<section\b[^>]*class=[\"']([^\"']+)[\"']", html, flags=re.IGNORECASE):
        classes = {item.strip() for item in match.group(1).split()}
        layouts.update(classes - {"slide", "page", "active", "light", "dark", "cover"})
    return {layout for layout in layouts if layout}


def html_has_real_image(html: str) -> bool:
    lowered = html.lower()
    if re.search(r"<img\b|<picture\b|<image\b", lowered):
        return True
    if "background-image" in lowered or re.search(r"url\([^)]+\)", lowered):
        return True
    return False


def strip_html_text(html: str) -> str:
    text = re.sub(r"<script\b.*?</script>", " ", html, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<style\b.*?</style>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    return unescape(text)


def extract_pptx_texts(path: Path) -> list[str]:
    texts: list[str] = []
    try:
        with zipfile.ZipFile(path) as deck:
            for name in deck.namelist():
                if not name.startswith("ppt/slides/") or not name.endswith(".xml"):
                    continue
                xml = deck.read(name).decode("utf-8", errors="ignore")
                texts.extend(unescape(item) for item in re.findall(r"<a:t[^>]*>(.*?)</a:t>", xml, flags=re.DOTALL))
    except zipfile.BadZipFile:
        texts.append("")
    return texts


def has_logo_fragments(text: str) -> bool:
    tokens = [token.lower() for token in re.findall(r"[A-Za-z0-9]+", text)]
    token_set = set(tokens)
    return "b" in token_set and "c" in token_set


def audit_design_contract(design_specs: list[Path], spec_locks: list[Path]) -> list[str]:
    errors: list[str] = []
    if not design_specs:
        errors.append("design_spec.md is required for formal-business deliveries.")
    else:
        combined = "\n".join(read_text(path) for path in design_specs)
        for token in ("Visual Direction", "Page Role / Visual Weight Contract", "page_recipe_id", "visual_layer", "raster_policy"):
            if token not in combined:
                errors.append(f"design_spec.md must include {token}.")
    if not spec_locks:
        errors.append("spec_lock.md is required for formal-business deliveries.")
    else:
        lock = parse_spec_lock(spec_locks[0])
        missing_sections = sorted(REQUIRED_DESIGN_LOCK_SECTIONS - set(lock))
        if missing_sections:
            errors.append("spec_lock.md is missing visual-completion section(s): " + ", ".join(missing_sections))
        for section in REQUIRED_DESIGN_LOCK_SECTIONS - {"visual_direction"}:
            if section in lock and not any(re.fullmatch(r"P\d{2}", key) for key in lock[section]):
                errors.append(f"spec_lock.md section {section} must contain PNN page entries.")
    return errors


def audit(paths: list[Path]) -> list[str]:
    errors: list[str] = []
    manifests, html_files, pptx_files, visual_kit_files, element_manifests, prompt_files = discover_files(paths)
    design_specs, spec_locks = discover_design_contracts(paths)
    quality_gate = find_quality_gate(manifests)

    if not quality_gate:
        errors.append("qualityGate.level must be formal-business in manifest.json or project-brief.json.")
    else:
        errors.extend(audit_design_contract(design_specs, spec_locks))

    chatgpt_first = requires_chatgpt_generation_first(quality_gate, manifests)
    if chatgpt_first and not visual_kit_files and not element_manifests:
        errors.append("chatgpt-generation-first deliveries require visual-element-kit.md or assets/generated/element-manifest.json.")

    element_errors, has_element_record = audit_element_manifests(element_manifests)
    errors.extend(element_errors)

    if html_files:
        combined_html = "\n".join(read_text(path) for path in html_files)
        layouts = extract_html_layouts(combined_html)
        if len(layouts) < 3:
            errors.append(f"layout variety is too low: found {len(layouts)} layout type(s), expected at least 3.")
        if not html_has_real_image(combined_html) and not has_no_image_strategy(quality_gate, manifests):
            errors.append("real images or a no-image strategy are required for formal-business web decks.")
        if has_logo_fragments(strip_html_text(combined_html)):
            errors.append("logo fragments detected: standalone b/c-style text should not replace a brand mark.")

    if pptx_files:
        all_texts: list[str] = []
        for pptx_path in pptx_files:
            all_texts.extend(extract_pptx_texts(pptx_path))
        useful_texts = [text.strip() for text in all_texts if text.strip()]
        if len(useful_texts) < 2:
            errors.append("editable text objects are missing or too sparse in PPTX output.")
        if has_logo_fragments("\n".join(useful_texts)):
            errors.append("logo fragments detected in PPTX text: standalone b/c-style text should not replace a brand mark.")

    if not html_files and not pptx_files:
        errors.append("no HTML or PPTX artifact was found to audit.")

    if chatgpt_first and (html_files or pptx_files):
        has_manual_fallback = prompt_files_have_manual_fallback(prompt_files)
        if not has_element_record and not has_manual_fallback:
            errors.append("chatgpt-generation-first artifacts require generated element records or explicit Needs-Manual prompt fallback.")

    return errors


def main(argv: list[str]) -> int:
    if not argv:
        print("Usage: python3 scripts/audit_formal_delivery.py <project_path_or_artifact> [...]", file=sys.stderr)
        return 2

    errors = audit([Path(item) for item in argv])
    if errors:
        print("Formal delivery audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Formal delivery audit passed: formal-business gate and artifacts are present.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
