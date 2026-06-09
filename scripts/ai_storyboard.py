#!/usr/bin/env python3
"""Create DeckIR v1 storyboard files for Ultimate PPT Master projects.

The planner is intentionally useful without an LLM key. When a provider is not
configured, it writes a deterministic rule-planned DeckIR so the rest of the
pipeline can still audit page roles, recipes, evidence, and editability.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


BODY_RASTER_PROHIBITED_ROLES = {"context", "evidence", "comparison", "process", "benefit", "risk", "action"}

ROLE_RECIPES = {
    "anchor": ("cover_brand", "cover_brand.hero_left_visual", "generated-background | no-text | 16:9"),
    "context": ("statement_plus_evidence", "statement_plus_evidence.left_rule_panel", "subtle-pattern | no-text | 16:9"),
    "evidence": ("evidence_board", "evidence_board.source_table", "none"),
    "comparison": ("comparison_matrix", "comparison_matrix.two_column_delta", "none"),
    "process": ("process_flow", "process_flow.horizontal_steps", "generated-process-accent | no-text | 16:9"),
    "benefit": ("metric_panel", "metric_panel.large_number_strip", "generated-metric-accent | no-text | 16:9"),
    "risk": ("risk_callout", "risk_callout.qa_stack", "none"),
    "action": ("action_roadmap", "action_roadmap.owner_timeline", "schematic | no-text | 16:9"),
    "closing": ("closing_commitment", "closing_commitment.brand_tail", "generated-background | no-text | 16:9"),
}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clean_line(raw: str) -> str:
    line = raw.strip()
    line = re.sub(r"^#{1,6}\s*", "", line)
    line = re.sub(r"^[-*+]\s*", "", line)
    line = re.sub(r"^\d+[、.)．]\s*", "", line)
    return re.sub(r"\s+", " ", line).strip()


def source_claims(text: str) -> list[dict[str, Any]]:
    claims: list[dict[str, Any]] = []
    for line_no, raw in enumerate(text.splitlines(), start=1):
        line = clean_line(raw)
        if not line:
            continue
        claims.append(
            {
                "id": f"S{len(claims) + 1:03d}",
                "sourceLine": line_no,
                "text": line[:180],
            }
        )
    if not claims:
        claims.append({"id": "S001", "sourceLine": 1, "text": "Untitled presentation"})
    return claims[:80]


def clip(value: str, limit: int = 44) -> str:
    text = re.sub(r"\s+", " ", value).strip()
    return text if len(text) <= limit else text[: limit - 1] + "…"


def infer_role(index: int, total: int, text: str) -> str:
    lowered = text.lower()
    if index == 0:
        return "anchor"
    if index == total - 1:
        return "closing"
    if re.search(r"流程|路径|步骤|办理|申请|开通|推进|process|workflow|step", lowered):
        return "process"
    if re.search(r"权益|数字|指标|数据|结果|kpi|metric|benefit|效率|触达", lowered):
        return "benefit"
    if re.search(r"风险|提醒|边界|问题|疑问|注意|risk|issue|caveat", lowered):
        return "risk"
    if re.search(r"对比|比较|差异|原流程|新流程|compare|comparison|before|after", lowered):
        return "comparison"
    if re.search(r"计划|行动|下一步|落地|安排|owner|action|roadmap|复盘", lowered):
        return "action"
    if index == 1:
        return "context"
    return "evidence"


def chunk_claims(claims: list[dict[str, Any]], target: int) -> list[list[dict[str, Any]]]:
    body = claims[1:] or claims
    body_slots = max(1, target - 2)
    size = max(1, (len(body) + body_slots - 1) // body_slots)
    chunks = [body[idx: idx + size] for idx in range(0, len(body), size)]
    while len(chunks) < body_slots:
        chunks.append(body[-1:])
    return [claims[:1], *chunks[:body_slots], claims[-1:]]


def load_reference_style(path: str | None, mode: str) -> dict[str, Any]:
    if not path:
        return {"mode": "none", "functionalTypes": [], "layoutFamilies": []}
    data = json.loads(read_text(Path(path).expanduser().resolve()))
    if not isinstance(data, dict):
        data = {}
    return {
        "mode": mode,
        "path": str(Path(path).expanduser().resolve()),
        "functionalTypes": data.get("functionalTypes", []),
        "layoutFamilies": data.get("layoutFamilies", []),
        "brandConstraints": data.get("brandConstraints", {}),
    }


def provider_configured(no_llm: bool, provider_config: str | None) -> bool:
    if no_llm:
        return False
    if provider_config and Path(provider_config).expanduser().exists():
        try:
            data = json.loads(read_text(Path(provider_config).expanduser()))
        except json.JSONDecodeError:
            data = {}
        if isinstance(data, dict) and (data.get("modelProvider") or data.get("textModelId")):
            return True
    return any(os.environ.get(key) for key in ("OPENAI_API_KEY", "GEMINI_API_KEY", "QWEN_API_KEY", "DASHSCOPE_API_KEY", "DEEPSEEK_API_KEY", "LLM_API_KEY"))


def build_deck_ir(
    text: str,
    *,
    title_hint: str = "",
    output_mode: str = "pptx",
    style_preset: str = "business",
    preset: str = "auto",
    audience: str = "",
    quality_gate: str = "formal-business",
    no_llm: bool = True,
    provider_config: str | None = None,
    reference_style: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    claims = source_claims(text)
    title = title_hint.strip() or claims[0]["text"]
    target = max(6, min(10, len(claims) + 2))
    slide_claim_chunks = chunk_claims(claims, target)
    slides: list[dict[str, Any]] = []
    for index, chunk in enumerate(slide_claim_chunks[:target]):
        claim_text = " ".join(item["text"] for item in chunk)
        role = infer_role(index, len(slide_claim_chunks[:target]), claim_text)
        layout_family, recipe, visual_layer = ROLE_RECIPES[role]
        page = f"P{index + 1:02d}"
        raster_policy = "prohibited-formal-body" if role in BODY_RASTER_PROHIBITED_ROLES else "allowed-cover" if role == "anchor" else "allowed-section-tail"
        title_text = title if role == "anchor" else clip(chunk[0]["text"])
        if role == "closing":
            title_text = "下一步与交付检查" if re.search(r"[\u4e00-\u9fff]", text) else "Next Steps and Delivery Check"
        slides.append(
            {
                "page": page,
                "role": role,
                "title": title_text,
                "intent": intent_for_role(role),
                "recipeId": recipe,
                "layoutFamily": layout_family,
                "evidenceRefs": [item["id"] for item in chunk],
                "visualLayer": visual_layer,
                "rasterPolicy": raster_policy,
                "editabilityTarget": editability_for_role(role),
                "speakerIntent": speaker_intent_for_role(role),
            }
        )

    configured = provider_configured(no_llm, provider_config)
    planning_mode = "llm-assisted-planner" if configured else "fallback-rule-planner"
    reference_payload = reference_style or {"mode": "none", "functionalTypes": [], "layoutFamilies": []}
    storyboard = {
        "deckIRVersion": "1.0",
        "createdAt": now_iso(),
        "planningMode": planning_mode,
        "delivery": {
            "outputMode": output_mode,
            "stylePreset": style_preset,
            "preset": preset,
            "audience": audience,
            "qualityGate": quality_gate,
        },
        "referenceStyle": reference_payload,
        "pipeline": [
            "source.md",
            "DeckIR/storyboard",
            "page recipes/reference style",
            "editable PPTX or Web Deck",
            "rendered review",
            "human/agent revision",
        ],
        "slides": slides,
    }
    source_map = {
        "version": "source-map-v1",
        "createdAt": storyboard["createdAt"],
        "source": "source.md",
        "claims": claims,
        "slideEvidence": [
            {
                "page": slide["page"],
                "evidenceRefs": slide["evidenceRefs"],
            }
            for slide in slides
        ],
    }
    report = {
        "version": "planning-report-v1",
        "status": "planned",
        "createdAt": storyboard["createdAt"],
        "provider": {
            "configured": configured,
            "mode": planning_mode,
            "fallbackReason": "" if configured else "No model provider key/config was required; deterministic rule planner used.",
        },
        "summary": {
            "slides": len(slides),
            "roles": sorted({slide["role"] for slide in slides}),
            "layoutFamilies": sorted({slide["layoutFamily"] for slide in slides}),
            "evidenceClaims": len(claims),
        },
    }
    return storyboard, source_map, report


def intent_for_role(role: str) -> str:
    return {
        "anchor": "Set the first-viewport signal and delivery context.",
        "context": "State the main judgment and frame the problem.",
        "evidence": "Tie claims to source-backed evidence.",
        "comparison": "Make the before/after or option tradeoff explicit.",
        "process": "Show the service or execution flow as editable steps.",
        "benefit": "Surface editable numbers, units, and conditions.",
        "risk": "Keep caveats and operating boundaries visible.",
        "action": "Convert analysis into owners, timing, and next moves.",
        "closing": "Close with the delivery check and next step.",
    }[role]


def editability_for_role(role: str) -> str:
    if role == "anchor":
        return "editable title, subtitle, date, and brand fallback"
    if role == "benefit":
        return "editable metrics, units, labels, and notes"
    if role == "process":
        return "editable process nodes, connectors, labels, and notes"
    if role == "comparison":
        return "editable columns, delta markers, labels, and conclusion"
    if role == "closing":
        return "editable closing statement and follow-up actions"
    return "editable body text, evidence captions, shapes, and speaker notes"


def speaker_intent_for_role(role: str) -> str:
    return {
        "anchor": "Open with the business question and final direction.",
        "context": "Explain why this deck exists now.",
        "evidence": "Point each claim back to source material.",
        "comparison": "Explain what changes and what stays constrained.",
        "process": "Walk through the steps in order.",
        "benefit": "Clarify numbers, units, and measurement boundaries.",
        "risk": "Keep assumptions and caveats explicit.",
        "action": "Name owners, cadence, and follow-up.",
        "closing": "Confirm artifacts and review commands.",
    }[role]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Write DeckIR storyboard.json, source-map.json, and planning-report.json.")
    parser.add_argument("--source", required=True, help="Path to source.md")
    parser.add_argument("--project", required=True, help="Project folder where DeckIR files should be written")
    parser.add_argument("--output-mode", default="pptx", choices=("pptx", "web", "both"))
    parser.add_argument("--style-preset", default="business")
    parser.add_argument("--preset", default="auto")
    parser.add_argument("--audience", default="")
    parser.add_argument("--title", default="")
    parser.add_argument("--quality-gate", default="formal-business")
    parser.add_argument("--provider-config", default="")
    parser.add_argument("--reference-style", default="")
    parser.add_argument("--reference-mode", default="style-only", choices=("follow-reference", "style-only", "none"))
    parser.add_argument("--no-llm", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    source = Path(args.source).expanduser().resolve()
    project = Path(args.project).expanduser().resolve()
    if not source.exists():
        print(f"ai_storyboard failed: source file does not exist: {source}", file=sys.stderr)
        return 2
    project.mkdir(parents=True, exist_ok=True)
    reference = load_reference_style(args.reference_style or None, args.reference_mode)
    storyboard, source_map, report = build_deck_ir(
        read_text(source),
        title_hint=args.title,
        output_mode=args.output_mode,
        style_preset=args.style_preset,
        preset=args.preset,
        audience=args.audience,
        quality_gate=args.quality_gate,
        no_llm=args.no_llm,
        provider_config=args.provider_config or None,
        reference_style=reference,
    )
    write_json(project / "storyboard.json", storyboard)
    write_json(project / "source-map.json", source_map)
    write_json(project / "planning-report.json", report)
    print(json.dumps({"status": "ok", "slides": len(storyboard["slides"]), "planningMode": storyboard["planningMode"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
