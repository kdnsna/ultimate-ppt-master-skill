#!/usr/bin/env python3
"""Prepare ChatGPT-first page visual layers for hybrid-editable decks.

The script reads ``spec_lock.md`` and writes:

- ``assets/generated/page-visuals/manifest.json``
- ``images/page_visual_prompts.json``
- ``images/page_visual_prompts.md``

Generated visual layers must be no-text support assets. They are intended for
backgrounds, patterns, process accents, or symbolic layers while PPTX text,
numbers, charts, and tables remain editable.
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJc"
    "Ew2j5wAAAABJRU5ErkJggg=="
)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(read_text(path))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


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


def project_title(project: Path) -> str:
    brief = read_json(project / "project-brief.json")
    title = brief.get("title") or brief.get("projectTitle") or brief.get("name")
    return title.strip() if isinstance(title, str) and title.strip() else project.name


def split_layer(value: str, page: str) -> dict[str, str] | None:
    if not value or value.strip().lower() == "none":
        return None
    parts = [part.strip() for part in value.split("|")]
    layer_type = parts[0] if parts else "subtle-pattern"
    no_text = "no-text" if any(part == "no-text" for part in parts[1:]) else "no-text"
    aspect_ratio = next((part for part in parts[1:] if re.fullmatch(r"\d+:\d+", part)), "16:9")
    output_path = next((part for part in parts[1:] if part.startswith("assets/") or part.startswith("images/")), "")
    if not output_path:
        output_path = f"assets/generated/page-visuals/{page}-{layer_type}.png"
    return {
        "layerType": layer_type,
        "textPolicy": no_text,
        "aspectRatio": aspect_ratio,
        "outputPath": output_path,
    }


def prompt_for(project: Path, page: str, layer: dict[str, str], role: str, recipe: str, title: str) -> str:
    layer_type = layer["layerType"]
    role_phrase = role or "formal business page"
    recipe_phrase = recipe or "hybrid editable layout"
    return (
        f"Create a no-text visual support layer for page {page} of a formal business presentation titled "
        f"'{title}'. Page role: {role_phrase}. Page recipe: {recipe_phrase}. Layer type: {layer_type}. "
        "Use a polished official finance/government service visual language. The image must contain no readable "
        "text, no numbers, no letters, no brand logos, no QR codes, no UI screenshots, no policy wording, and no "
        "watermark. It should work behind or beside editable PPTX text, charts, tables, and shapes."
    )


def build_manifests(project: Path, *, generated: bool) -> tuple[dict[str, Any], dict[str, Any]]:
    lock_path = project / "spec_lock.md"
    if not lock_path.exists():
        raise FileNotFoundError(f"Missing spec_lock.md at {lock_path}")
    lock = parse_lock(lock_path)
    layers = lock.get("visual_layers", {})
    roles = lock.get("page_roles", {})
    recipes = lock.get("page_recipes", {})
    title = project_title(project)
    status = "Generated" if generated else "Needs-Manual"
    backend = "mock" if generated else "manual-chatgpt"

    items: list[dict[str, Any]] = []
    prompt_items: list[dict[str, Any]] = []
    for page in sorted(layers):
        if not re.fullmatch(r"P\d{2}", page):
            continue
        layer = split_layer(layers[page], page)
        if layer is None:
            continue
        prompt = prompt_for(project, page, layer, roles.get(page, ""), recipes.get(page, ""), title)
        item = {
            "page": page,
            "layerType": layer["layerType"],
            "textPolicy": layer["textPolicy"],
            "aspectRatio": layer["aspectRatio"],
            "prompt": prompt,
            "outputPath": layer["outputPath"],
            "targetUse": "hybrid-editable page support layer",
            "status": status,
            "backend": backend,
            "insertedTargets": [],
        }
        items.append(item)
        prompt_items.append(
            {
                "page": page,
                "layer_type": layer["layerType"],
                "aspect_ratio": layer["aspectRatio"],
                "image_size": "1K",
                "prompt": prompt,
                "output_path": layer["outputPath"],
                "status": status,
            }
        )

    created_at = now_iso()
    return (
        {
            "version": "page-visual-layers-v1",
            "createdAt": created_at,
            "mode": "hybrid-editable",
            "items": items,
        },
        {
            "version": "page-visual-prompts-v1",
            "createdAt": created_at,
            "status": status,
            "items": prompt_items,
        },
    )


def write_prompt_markdown(path: Path, prompt_manifest: dict[str, Any]) -> None:
    lines = [
        "# ChatGPT Page Visual Layer Prompts",
        "",
        "Paste each prompt into ChatGPT when local image generation is unavailable.",
        "Save each output to the listed path. Do not add text, numbers, logos, QR codes, or UI screenshots.",
        "",
    ]
    for item in prompt_manifest["items"]:
        lines.extend(
            [
                f"## {item['page']} - {item['layer_type']}",
                "",
                f"- Output path: `{item['output_path']}`",
                f"- Aspect ratio: `{item['aspect_ratio']}`",
                f"- Status: `{item['status']}`",
                "",
                item["prompt"],
                "",
            ]
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def write_mock_images(project: Path, manifest: dict[str, Any]) -> None:
    for item in manifest["items"]:
        output = project / item["outputPath"]
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(TINY_PNG)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Prepare ChatGPT page visual layer prompts and manifest.")
    parser.add_argument("project_path")
    parser.add_argument("--mock-generate", action="store_true", help="Write tiny placeholder PNGs and mark generated.")
    parser.add_argument("--no-generate", action="store_true", help="Write prompt manifests only.")
    args = parser.parse_args(argv)

    project = Path(args.project_path).expanduser().resolve()
    generated = bool(args.mock_generate)
    try:
        manifest, prompts = build_manifests(project, generated=generated)
    except Exception as err:
        print(f"generate_visual_layers failed: {err}", file=sys.stderr)
        return 1

    write_json(project / "assets" / "generated" / "page-visuals" / "manifest.json", manifest)
    write_json(project / "images" / "page_visual_prompts.json", prompts)
    write_prompt_markdown(project / "images" / "page_visual_prompts.md", prompts)
    if generated:
        write_mock_images(project, manifest)

    print(json.dumps({"status": "ok", "items": len(manifest["items"]), "generated": generated}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

