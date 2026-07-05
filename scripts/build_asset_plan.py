#!/usr/bin/env python3
"""Build a v5.4 asset plan and image prompt manifests for a handoff project."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def load_project_context(project: Path) -> dict[str, Any]:
    brief = project / "project-brief.json"
    if brief.is_file():
        return json.loads(brief.read_text(encoding="utf-8"))

    spec_lock = project / "spec_lock.md"
    if spec_lock.is_file():
        return {"title": project.name, "source": "spec_lock.md", "raw": spec_lock.read_text(encoding="utf-8")}

    return {"title": project.name, "source": "defaults"}


def wants_swiss(context: dict[str, Any]) -> bool:
    web_deck = context.get("webDeck") if isinstance(context.get("webDeck"), dict) else {}
    if web_deck.get("style") == "swiss":
        return True
    style = str(context.get("stylePreset") or "").lower()
    text = json.dumps(context, ensure_ascii=False).lower()
    return style == "swiss" or any(marker in text for marker in ("swiss", "瑞士", "helvetica", "kpi", "information design"))


def default_items(context: dict[str, Any]) -> list[dict[str, Any]]:
    swiss = wants_swiss(context)
    backend = "codex"
    if swiss:
        return [
            {
                "id": "s22-hero",
                "slide": 6,
                "slot": "s22-hero-21x9",
                "asset_type": "hero",
                "aspect_ratio": "21:9",
                "text_policy": "none",
                "source_policy": "generated",
                "backend": backend,
                "prompt_path": "prompts/s22-hero.md",
                "status": "Pending",
                "current_generation_evidence": [],
            },
            {
                "id": "screenshot-frame",
                "slide": 3,
                "slot": "s15-grid-16x10",
                "asset_type": "screenshot-frame",
                "aspect_ratio": "16:10",
                "text_policy": "limited-labels",
                "source_policy": "needs-manual",
                "backend": "manual",
                "prompt_path": "prompts/screenshot-frame.md",
                "status": "Needs-Manual",
                "current_generation_evidence": [],
            },
            {
                "id": "limited-labels-infographic",
                "slide": 4,
                "slot": "s16-grid-21x9",
                "asset_type": "infographic",
                "aspect_ratio": "21:9",
                "text_policy": "limited-labels",
                "source_policy": "generated",
                "backend": backend,
                "prompt_path": "prompts/limited-labels-infographic.md",
                "status": "Pending",
                "current_generation_evidence": [],
            },
        ]

    return [
        {
            "id": "editorial-hero",
            "slide": 1,
            "slot": "hero-16x9",
            "asset_type": "hero",
            "aspect_ratio": "16:9",
            "text_policy": "none",
            "source_policy": "generated",
            "backend": backend,
            "prompt_path": "prompts/editorial-hero.md",
            "status": "Pending",
            "current_generation_evidence": [],
        }
    ]


def prompt_for(item: dict[str, Any], context: dict[str, Any]) -> str:
    title = context.get("title") or context.get("coreMessage") or "Untitled deck"
    style = "Swiss International, strict grid, straight edges, no shadows, no rounded corners" if wants_swiss(context) else "editorial e-ink magazine, restrained, cinematic but readable"
    text_rule = "No embedded text." if item["text_policy"] == "none" else "Use only short, legible labels; do not draw page titles, footers, page numbers, or logos."
    return "\n".join(
        [
            f"Deck: {title}",
            f"Asset id: {item['id']}",
            f"Target slide: {item['slide']}",
            f"Slot: {item['slot']}",
            f"Aspect ratio: {item['aspect_ratio']}",
            f"Style: {style}",
            text_rule,
            "Return only the image asset for the slot, not a whole slide.",
        ]
    )


def write_outputs(project: Path, plan: dict[str, Any], context: dict[str, Any]) -> None:
    prompts_dir = project / "prompts"
    images_dir = project / "images"
    prompts_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)

    for item in plan["items"]:
        prompt_path = project / item["prompt_path"]
        prompt_path.parent.mkdir(parents=True, exist_ok=True)
        prompt_path.write_text(prompt_for(item, context) + "\n", encoding="utf-8")

    generated_items = [
        {
            "filename": f"{item['id']}.png",
            "asset_type": item["asset_type"],
            "type": item["asset_type"],
            "page_role": "hero_page" if item["asset_type"] in {"hero", "cover"} else "local",
            "text_policy": "embedded" if item["text_policy"] == "embedded" else "none",
            "aspect_ratio": item["aspect_ratio"],
            "backend": item["backend"],
            "source": "ai",
            "status": item["status"],
            "prompt_path": f"../{item['prompt_path']}",
        }
        for item in plan["items"]
        if item["source_policy"] == "generated"
    ]

    (project / "asset_plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (images_dir / "image_prompts.json").write_text(
        json.dumps({"project": plan["project"], "items": generated_items}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (images_dir / "image_prompts.md").write_text(
        "\n\n".join(f"## {item['id']}\n\n{prompt_for(item, context)}" for item in plan["items"]),
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", help="Project folder containing project-brief.json or spec_lock.md")
    args = parser.parse_args()

    project = Path(args.project).resolve()
    project.mkdir(parents=True, exist_ok=True)
    context = load_project_context(project)
    plan = {
        "version": "asset-plan-v5.4",
        "project": context.get("title") or project.name,
        "items": default_items(context),
    }
    write_outputs(project, plan, context)
    print(f"Asset plan written: {project / 'asset_plan.json'}")
    print(f"Image prompt manifest written: {project / 'images/image_prompts.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
