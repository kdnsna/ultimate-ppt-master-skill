#!/usr/bin/env python3
"""Generate or prepare ChatGPT-first reusable visual elements for a handoff.

The script turns visual-element-kit.md into runnable local state:

- assets/generated/element-manifest.json
- images/image_prompts.json
- images/image_prompts.md

When a configured image backend is available, it delegates to scripts/image_gen.py
with the generated manifest. Without credentials, it stays non-blocking and
writes paste-ready ChatGPT prompts with Needs-Manual status.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from config import load_prefixed_env_file
except ImportError:  # pragma: no cover - defensive fallback for unusual cwd
    load_prefixed_env_file = None


IMAGE_ENV_PREFIXES = (
    "IMAGE_",
    "GEMINI_",
    "OPENAI_",
    "MINIMAX_",
    "STABILITY_",
    "BFL_",
    "IDEOGRAM_",
    "QWEN_",
    "DASHSCOPE_",
    "ZHIPU_",
    "BIGMODEL_",
    "VOLCENGINE_",
    "ARK_",
    "MODELSCOPE_",
    "SILICONFLOW_",
    "FAL_",
    "REPLICATE_",
    "OPENROUTER_",
)

BACKEND_KEY_HINTS = {
    "openai": ("OPENAI_API_KEY",),
    "gemini": ("GEMINI_API_KEY",),
    "minimax": ("MINIMAX_API_KEY",),
    "stability": ("STABILITY_API_KEY",),
    "bfl": ("BFL_API_KEY",),
    "ideogram": ("IDEOGRAM_API_KEY",),
    "qwen": ("QWEN_API_KEY", "DASHSCOPE_API_KEY"),
    "zhipu": ("ZHIPU_API_KEY", "BIGMODEL_API_KEY"),
    "volcengine": ("VOLCENGINE_API_KEY", "ARK_API_KEY"),
    "modelscope": ("MODELSCOPE_API_KEY",),
    "siliconflow": ("SILICONFLOW_API_KEY",),
    "fal": ("FAL_KEY", "FAL_API_KEY"),
    "replicate": ("REPLICATE_API_TOKEN", "REPLICATE_API_KEY"),
    "openrouter": ("OPENROUTER_API_KEY",),
}

REQUIRED_ELEMENT_TYPES = [
    {
        "type": "section-divider",
        "label": "section divider",
        "targetUse": "chapter breaks and narrative transitions",
        "style": "wide restrained divider, premium official report style, clean banking and government tone",
        "transparent": True,
        "aspectRatio": "16:9",
    },
    {
        "type": "metric-badge",
        "label": "metric badge",
        "targetUse": "editable benefit numbers and KPI figures",
        "style": "badge frame for editable numbers, polished finance presentation accent, no numbers inside",
        "transparent": True,
        "aspectRatio": "1:1",
    },
    {
        "type": "process-node",
        "label": "process node",
        "targetUse": "application steps and service process pages",
        "style": "rounded process marker with empty center, official service workflow visual language",
        "transparent": True,
        "aspectRatio": "1:1",
    },
    {
        "type": "connector",
        "label": "connector",
        "targetUse": "connect process nodes, timelines, and comparison paths",
        "style": "thin connector line with subtle arrow rhythm, modern corporate presentation asset",
        "transparent": True,
        "aspectRatio": "16:9",
    },
    {
        "type": "icon-accent",
        "label": "icon accent",
        "targetUse": "small category accents beside editable labels",
        "style": "abstract service icon accent, simple geometric motif, no literal brand logo",
        "transparent": True,
        "aspectRatio": "1:1",
    },
    {
        "type": "subtle-pattern",
        "label": "subtle pattern",
        "targetUse": "low-contrast background texture for section and cover pages",
        "style": "very subtle security-line or civic-service pattern, quiet texture, low contrast",
        "transparent": False,
        "aspectRatio": "16:9",
    },
    {
        "type": "callout-sticker",
        "label": "callout sticker",
        "targetUse": "reminder markers and risk notes without embedding copy",
        "style": "restrained callout sticker shape, formal not playful, empty space for editable text nearby",
        "transparent": True,
        "aspectRatio": "1:1",
    },
]

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJc"
    "Ew2j5wAAAABJRU5ErkJggg=="
)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned or "element"


def load_image_env() -> None:
    if load_prefixed_env_file is None:
        return
    load_prefixed_env_file(IMAGE_ENV_PREFIXES)


def resolve_backend(explicit_backend: str | None) -> tuple[str | None, str]:
    if explicit_backend:
        return explicit_backend.strip().lower(), "explicit --backend"

    configured = os.environ.get("IMAGE_BACKEND", "").strip().lower()
    if configured:
        return configured, "IMAGE_BACKEND"

    if os.environ.get("OPENAI_API_KEY", "").strip():
        return "openai", "OPENAI_API_KEY"

    return None, "no IMAGE_BACKEND or OPENAI_API_KEY"


def has_backend_credentials(backend: str | None) -> bool:
    if not backend:
        return False
    hints = BACKEND_KEY_HINTS.get(backend, ())
    if not hints:
        return bool(os.environ.get("IMAGE_BACKEND", "").strip())
    return any(os.environ.get(key, "").strip() for key in hints)


def project_title(project: Path) -> str:
    brief = read_json(project / "project-brief.json")
    for key in ("title", "projectTitle", "name"):
        value = brief.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return project.name


def prompt_for(element: dict[str, Any], title: str, visual_kit_text: str) -> str:
    transparent_clause = (
        "transparent background, isolated reusable asset"
        if element["transparent"]
        else "full-bleed but low-contrast background texture"
    )
    kit_tone = "formal business, finance/service, official but contemporary"
    if re.search(r"government|政务|bank|银行", visual_kit_text, flags=re.IGNORECASE):
        kit_tone = "formal banking and civic-service visual language"
    return (
        f"Create one reusable {element['label']} for a formal business PowerPoint/Web deck titled "
        f"'{title}'. Style: {element['style']}; {kit_tone}; {transparent_clause}; polished vector-like "
        "raster asset; clean edges; compatible with editable PPTX text and charts. Do not include readable "
        "text, letters, numbers, brand logos, watermarks, UI screenshots, or body copy inside the image."
    )


def build_items(project: Path, visual_kit_text: str, backend: str, status: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    title = project_title(project)
    prompt_items: list[dict[str, Any]] = []
    element_items: list[dict[str, Any]] = []
    for index, element in enumerate(REQUIRED_ELEMENT_TYPES, start=1):
        asset_type = element["type"]
        asset_id = f"{asset_type}-{index:02d}"
        filename = f"{asset_id}.png"
        output_path = f"assets/generated/{filename}"
        prompt = prompt_for(element, title, visual_kit_text)
        prompt_items.append(
            {
                "asset_id": asset_id,
                "type": asset_type,
                "filename": filename,
                "prompt": prompt,
                "aspect_ratio": element["aspectRatio"],
                "image_size": "1K",
                "status": status,
                "purpose": element["targetUse"],
                "output_path": output_path,
            }
        )
        element_items.append(
            {
                "assetId": asset_id,
                "type": asset_type,
                "prompt": prompt,
                "outputPath": output_path,
                "targetUse": element["targetUse"],
                "status": "Needs-Manual" if status == "Needs-Manual" else "Pending",
                "backend": backend,
                "failureReason": "" if status != "Needs-Manual" else "No configured image backend; paste prompt into ChatGPT and save outputPath.",
                "insertedTargets": [],
            }
        )
    return prompt_items, element_items


def write_prompt_markdown(path: Path, prompt_manifest: dict[str, Any], *, manual: bool) -> None:
    lines = [
        "# ChatGPT Visual Element Prompts",
        "",
        "Paste into ChatGPT and save each output to the listed path when local image generation is unavailable.",
        "",
        f"Status: {'Needs-Manual' if manual else 'Pending/Generated'}",
        "",
    ]
    for item in prompt_manifest["items"]:
        lines.extend(
            [
                f"## {item['asset_id']} ({item['type']})",
                "",
                f"- Output: `{item['output_path']}`",
                f"- Aspect ratio: `{item['aspect_ratio']}`",
                f"- Status: `{item['status']}`",
                "",
                "```text",
                item["prompt"],
                "```",
                "",
            ]
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def write_asset_plan_note(path: Path, element_manifest_path: Path, prompt_markdown_path: Path) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8", errors="ignore")
    marker = "<!-- visual-element-kit-generator -->"
    note = (
        f"\n{marker}\n"
        "## Visual Element Kit Run\n"
        f"- Element manifest: `{element_manifest_path.as_posix()}`\n"
        f"- Paste-ready prompts: `{prompt_markdown_path.as_posix()}`\n"
        "- Inserted targets should be updated after final PPTX/Web assembly.\n"
    )
    if marker in text:
        text = text[: text.index(marker)].rstrip() + note
    else:
        text = text.rstrip() + "\n" + note
    path.write_text(text + "\n", encoding="utf-8")


def mock_generate(project: Path, element_items: list[dict[str, Any]]) -> None:
    for item in element_items:
        output_path = project / item["outputPath"]
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(TINY_PNG)
        item["status"] = "Generated"
        item["backend"] = "mock"
        item["failureReason"] = ""


def mirror_image_gen_results(
    prompt_manifest_path: Path,
    element_items: list[dict[str, Any]],
    *,
    backend: str,
    fallback_reason: str,
) -> list[dict[str, Any]]:
    prompt_manifest = read_json(prompt_manifest_path)
    prompt_by_asset = {
        item.get("asset_id"): item
        for item in prompt_manifest.get("items", [])
        if isinstance(item, dict) and item.get("asset_id")
    }
    for item in element_items:
        prompt_item = prompt_by_asset.get(item["assetId"], {})
        prompt_status = prompt_item.get("status", "Needs-Manual")
        if prompt_status == "Generated":
            item["status"] = "Generated"
            item["backend"] = backend
            item["failureReason"] = ""
        elif prompt_status == "Needs-Manual":
            item["status"] = "Needs-Manual"
            item["backend"] = "manual-chatgpt"
            item["failureReason"] = prompt_item.get("last_error", fallback_reason)
        else:
            item["status"] = "Needs-Manual"
            item["backend"] = "manual-chatgpt"
            item["failureReason"] = prompt_item.get("last_error", fallback_reason)
    return element_items


def run_image_gen(repo_root: Path, project: Path, prompt_manifest_path: Path, backend: str) -> tuple[bool, str]:
    env = os.environ.copy()
    env.setdefault("IMAGE_BACKEND", backend)
    result = subprocess.run(
        [
            sys.executable,
            str(repo_root / "scripts" / "image_gen.py"),
            "--manifest",
            str(prompt_manifest_path),
            "-o",
            str(project / "assets" / "generated"),
        ],
        cwd=repo_root,
        env=env,
        check=False,
        capture_output=True,
        text=True,
    )
    output = (result.stdout + "\n" + result.stderr).strip()
    return result.returncode == 0, output


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate ChatGPT-first visual element kit assets.")
    parser.add_argument("project_path", help="Handoff/project folder containing visual-element-kit.md")
    parser.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--backend", default=None, help="Image backend override; defaults to IMAGE_BACKEND, then openai when OPENAI_API_KEY exists")
    parser.add_argument("--no-generate", action="store_true", help="Do not call image_gen.py; write Needs-Manual prompts")
    parser.add_argument("--mock-generate", action="store_true", help="Write tiny placeholder PNGs and mark all elements Generated for tests")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    project = Path(args.project_path).expanduser().resolve()
    repo_root = Path(args.repo_root).expanduser().resolve()
    visual_kit_path = project / "visual-element-kit.md"

    if not project.exists():
        print(f"Error: project path does not exist: {project}", file=sys.stderr)
        return 2
    if not visual_kit_path.exists():
        print(f"Error: visual-element-kit.md is required in {project}", file=sys.stderr)
        return 2

    load_image_env()
    backend, backend_source = resolve_backend(args.backend)
    can_generate = bool(backend and has_backend_credentials(backend) and not args.no_generate)
    if args.mock_generate:
        can_generate = False
        backend = "mock"

    manual = not args.mock_generate and not can_generate
    prompt_status = "Needs-Manual" if manual else "Pending"
    element_backend = "manual-chatgpt" if manual else (backend or "openai")
    visual_kit_text = visual_kit_path.read_text(encoding="utf-8", errors="ignore")

    prompt_items, element_items = build_items(project, visual_kit_text, element_backend, prompt_status)
    generated_at = now_iso()
    prompt_manifest = {
        "generated_at": generated_at,
        "project": project_title(project),
        "mode": "chatgpt-generation-first",
        "items": prompt_items,
    }

    images_dir = project / "images"
    generated_dir = project / "assets" / "generated"
    prompt_manifest_path = images_dir / "image_prompts.json"
    prompt_markdown_path = images_dir / "image_prompts.md"
    element_manifest_path = generated_dir / "element-manifest.json"

    write_json(prompt_manifest_path, prompt_manifest)
    write_prompt_markdown(prompt_markdown_path, prompt_manifest, manual=manual)

    image_gen_note = ""
    if args.mock_generate:
        mock_generate(project, element_items)
        prompt_manifest["items"] = [{**item, "status": "Generated"} for item in prompt_manifest["items"]]
        write_json(prompt_manifest_path, prompt_manifest)
        write_prompt_markdown(prompt_markdown_path, prompt_manifest, manual=False)
    elif can_generate and backend:
        ok, image_gen_output = run_image_gen(repo_root, project, prompt_manifest_path, backend)
        fallback_reason = image_gen_output or "image_gen.py did not complete; paste prompt into ChatGPT and save outputPath."
        if not ok:
            prompt_manifest = read_json(prompt_manifest_path)
            for item in prompt_manifest.get("items", []):
                if isinstance(item, dict) and item.get("status") != "Generated":
                    item["status"] = "Needs-Manual"
                    item["last_error"] = fallback_reason[:500]
            write_json(prompt_manifest_path, prompt_manifest)
            write_prompt_markdown(prompt_markdown_path, prompt_manifest, manual=True)
        element_items = mirror_image_gen_results(
            prompt_manifest_path,
            element_items,
            backend=backend,
            fallback_reason=fallback_reason[:500],
        )
        if not ok:
            image_gen_note = f"image_gen.py returned non-zero; prompts remain usable manually. {fallback_reason[:500]}"
    else:
        reason = f"{backend_source}; no configured credentials. Paste prompts into ChatGPT."
        for item in element_items:
            item["failureReason"] = reason

    element_manifest = {
        "generatedAt": generated_at,
        "mode": "chatgpt-generation-first",
        "backend": element_backend,
        "backendSource": backend_source,
        "items": element_items,
    }
    write_json(element_manifest_path, element_manifest)
    write_asset_plan_note(project / "asset-plan.md", element_manifest_path.relative_to(project), prompt_markdown_path.relative_to(project))

    status_counts: dict[str, int] = {}
    for item in element_items:
        status_counts[item["status"]] = status_counts.get(item["status"], 0) + 1
    print(
        "Visual element kit prepared: "
        f"{element_manifest_path} | "
        + ", ".join(f"{status}={count}" for status, count in sorted(status_counts.items()))
    )
    if image_gen_note:
        print(f"Warning: {image_gen_note}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
