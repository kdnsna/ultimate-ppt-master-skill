#!/usr/bin/env python3
"""Build a v5.4 asset plan and image prompt manifests for a handoff project."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


SWISS_TAGS = {
    "swiss",
    "swiss-style",
    "swiss style",
    "style b",
    "style-b",
    "瑞士",
    "瑞士风",
    "information-design",
    "information design",
    "信息设计",
}


def load_project_context(project: Path) -> dict[str, Any]:
    brief = project / "project-brief.json"
    if brief.is_file():
        return json.loads(brief.read_text(encoding="utf-8"))

    spec_lock = project / "spec_lock.md"
    if spec_lock.is_file():
        return {"title": project.name, "source": "spec_lock.md", "raw": spec_lock.read_text(encoding="utf-8")}

    return {"title": project.name, "source": "defaults"}


def normalize_tag(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def wants_swiss(context: dict[str, Any]) -> bool:
    web_deck = context.get("webDeck") if isinstance(context.get("webDeck"), dict) else {}
    if normalize_tag(web_deck.get("style")) in SWISS_TAGS:
        return True

    if normalize_tag(context.get("stylePreset")) in SWISS_TAGS:
        return True

    tags: list[Any] = []
    visual_brief = context.get("visualBrief") if isinstance(context.get("visualBrief"), dict) else {}
    guided_brief = context.get("guidedBrief") if isinstance(context.get("guidedBrief"), dict) else {}
    if isinstance(visual_brief.get("styleTags"), list):
        tags.extend(visual_brief["styleTags"])
    if guided_brief.get("style"):
        tags.append(guided_brief.get("style"))

    return any(normalize_tag(tag) in SWISS_TAGS for tag in tags)


def parse_slide_number(value: Any, fallback: int) -> int:
    text = str(value or "")
    match = re.search(r"(\d+)", text)
    if not match:
        return fallback
    return int(match.group(1))


def storyboard_items(project: Path) -> list[dict[str, Any]]:
    storyboard_path = project / "storyboard.json"
    if not storyboard_path.is_file():
        return []

    data = json.loads(storyboard_path.read_text(encoding="utf-8"))
    slides = data.get("slides")
    if not isinstance(slides, list):
        return []

    items: list[dict[str, Any]] = []
    for index, slide in enumerate(slides, start=1):
        if not isinstance(slide, dict):
            continue
        raw_requirements: list[Any] = []
        for key in ("assetRequirement", "asset_requirement", "assetRequirements", "asset_requirements"):
            value = slide.get(key)
            if isinstance(value, list):
                raw_requirements.extend(value)
            elif isinstance(value, dict):
                raw_requirements.append(value)

        for req_index, requirement in enumerate(raw_requirements, start=1):
            if not isinstance(requirement, dict):
                continue
            slot = str(requirement.get("slot") or requirement.get("imageSlot") or "").strip()
            if not slot:
                continue
            slide_number = parse_slide_number(slide.get("page") or slide.get("slide") or index, index)
            item_id = str(requirement.get("id") or f"p{slide_number:02d}-{slot}").strip()
            source_policy = str(requirement.get("source_policy") or requirement.get("sourcePolicy") or "generated").strip()
            status = "Needs-Manual" if source_policy == "needs-manual" else "Pending"
            backend = "manual" if source_policy == "needs-manual" else str(requirement.get("backend") or "codex")
            prompt_path = str(requirement.get("prompt_path") or requirement.get("promptPath") or f"prompts/{item_id}.md")
            items.append(
                {
                    "id": item_id,
                    "slide": slide_number,
                    "slot": slot,
                    "asset_type": str(requirement.get("asset_type") or requirement.get("assetType") or "hero"),
                    "aspect_ratio": str(requirement.get("aspect_ratio") or requirement.get("aspectRatio") or "16:9"),
                    "text_policy": str(requirement.get("text_policy") or requirement.get("textPolicy") or "none"),
                    "source_policy": source_policy,
                    "backend": backend,
                    "prompt_path": prompt_path,
                    "status": status,
                    "current_generation_evidence": [],
                }
            )
    return items


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
        if item.get("status") == "Pending" or not prompt_path.exists():
            prompt_path.write_text(prompt_for(item, context) + "\n", encoding="utf-8")

    generated_items = [
        {
            "filename": f"{item['id']}.png",
            "asset_type": item["asset_type"],
            "type": item["asset_type"],
            "page_role": "hero_page" if item["asset_type"] in {"hero", "cover"} else "local",
            "text_policy": item["text_policy"],
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


def merge_existing(project: Path, plan: dict[str, Any]) -> dict[str, Any]:
    path = project / "asset_plan.json"
    if not path.is_file():
        return plan

    try:
        previous = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return plan

    old_items = {
        item.get("id"): item
        for item in previous.get("items", [])
        if isinstance(item, dict) and item.get("id")
    }
    for item in plan["items"]:
        prev = old_items.get(item["id"])
        if not prev:
            continue
        item["status"] = prev.get("status", item["status"])
        item["current_generation_evidence"] = prev.get(
            "current_generation_evidence",
            item["current_generation_evidence"],
        )
        for optional_field in ("output_path", "filename", "last_error"):
            if optional_field in prev:
                item[optional_field] = prev[optional_field]
    return plan


def validate_project_folder(project: Path) -> None:
    if not project.is_dir():
        raise SystemExit(f"Project folder must already exist: {project}")
    context_files = ("project-brief.json", "spec_lock.md", "storyboard.json")
    if not any((project / name).is_file() for name in context_files):
        raise SystemExit(
            "Project folder must contain project-brief.json, spec_lock.md, "
            f"or storyboard.json: {project}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", help="Project folder containing project-brief.json or spec_lock.md")
    args = parser.parse_args()

    project = Path(args.project).resolve()
    validate_project_folder(project)
    context = load_project_context(project)
    items = storyboard_items(project)
    plan = {
        "version": "asset-plan-v5.4",
        "project": context.get("title") or project.name,
        "derived_from": "storyboard.json" if items else "defaults",
        "items": items or default_items(context),
    }
    plan = merge_existing(project, plan)
    write_outputs(project, plan, context)
    print(f"Asset plan written: {project / 'asset_plan.json'}")
    print(f"Image prompt manifest written: {project / 'images/image_prompts.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
