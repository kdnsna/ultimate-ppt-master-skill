"""Deterministic DeckIR builder.

DeckIR is the semantic and evidence fact source: it decides what the deck
says, why each page exists, and which source claims back it. The compiler
later maps DeckIR roles/recipes/evidence into PPTD pages.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from upm.errors import InputError

BODY_ROLES = {"context", "evidence", "comparison", "process", "benefit", "risk", "action"}
RECIPE_INDEX = Path(__file__).resolve().parents[2] / "templates" / "page-recipes" / "index.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _clean_line(raw: str) -> str:
    line = raw.strip()
    line = re.sub(r"\s+", " ", line)
    return line


def source_claims(text: str) -> list[dict[str, str]]:
    """Split source text into stable, claim-sized chunks.

    Each claim carries an id, sourceLine, and text. Lines that look like
    headers, list markers, or formulas are preserved as-is; long paragraphs
    are split at sentence boundaries up to a target length.
    """
    claims: list[dict[str, str]] = []
    lines = [line for line in text.splitlines() if line.strip()]
    for line_index, raw in enumerate(lines, start=1):
        line = _clean_line(raw)
        if not line:
            continue
        if line.count("|") >= 2 and re.match(r"^\|", line):
            # Markdown table rows are handled by extract_markdown_tables;
            # they are not narrative claims.
            continue
        sentences = [
            sentence.strip()
            for sentence in re.split(r"(?<=[。！？!?；;])\s*", line)
            if sentence.strip()
        ]
        if len(sentences) > 1:
            for sentence in sentences:
                claims.append({"id": f"c{len(claims) + 1:03d}", "sourceLine": str(line_index), "text": sentence})
            continue
        sentences = re.split(r"(?<=[，,：:])\s*", line)
        sentences = [sentence.strip() for sentence in sentences if sentence.strip()]
        buffer = ""
        for sentence in sentences:
            if len(buffer) + len(sentence) <= 110:
                buffer = f"{buffer}{sentence}".strip()
                continue
            if buffer:
                claims.append({"id": f"c{len(claims) + 1:03d}", "sourceLine": str(line_index), "text": buffer})
            buffer = sentence
        if buffer:
            claims.append({"id": f"c{len(claims) + 1:03d}", "sourceLine": str(line_index), "text": buffer})
    return claims


def _infer_role(index: int, total: int, text: str) -> str:
    if index == 0:
        return "anchor"
    if index == total - 1:
        return "closing"
    lowered = text.lower()
    if re.search(r"(风险|风险点|边界|caveat|risk|限制|注意)", text):
        return "risk"
    if re.search(r"(流程|步骤|路径|阶段|process|workflow|how to)", lowered):
        return "process"
    if re.search(r"(对比|比较|差异|versus|vs\.?|comparison|对比表)", lowered):
        return "comparison"
    if re.search(r"(行动|下一步|时间表|owner|负责人|roadmap|action|timeline)", lowered):
        return "action"
    if re.search(r"(\d+%|\d+\.\d+|\d+亿|亿元|营收|利润|增长|kpi|metric|指标|数据)", lowered):
        return "benefit"
    if re.search(r"(背景|现状|趋势|context|background|overview|概况)", lowered):
        return "context"
    if re.search(r"(证据|来源|数据|案例|依据|evidence|source|proof)", lowered):
        return "evidence"
    if total >= 8 and index in {1, 2}:
        return "context"
    return "evidence"


def _chunk_claims(claims: list[dict[str, str]], target: int) -> list[list[dict[str, str]]]:
    if not claims:
        return [[]]
    if len(claims) <= target:
        return [[claim] for claim in claims]
    # Aim for roughly even groups without splitting a claim.
    chunk_count = max(2, target)
    per_chunk = max(1, (len(claims) + chunk_count - 1) // chunk_count)
    return [claims[start : start + per_chunk] for start in range(0, len(claims), per_chunk)]


def _load_recipe_index() -> dict[str, Any]:
    if not RECIPE_INDEX.is_file():
        return {}
    try:
        data = json.loads(RECIPE_INDEX.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


ROLE_RECIPE_PREFERENCE: dict[str, list[str]] = {
    "anchor": ["cover_brand.hero_left_visual", "product_stage.full_bleed_safe"],
    "context": ["statement_plus_evidence.left_rule_panel", "image_story.text_image_7_5", "timeline.vertical_kpi"],
    "evidence": ["evidence_board.source_table", "image_proof.uniform_grid"],
    "comparison": ["comparison_matrix.two_column_delta"],
    "process": ["process_flow.horizontal_steps", "system_map.layered"],
    "benefit": ["metric_panel.large_number_strip", "data_hero.single_kpi"],
    "risk": ["risk_callout.qa_stack"],
    "action": ["action_roadmap.owner_timeline"],
    "closing": ["closing_commitment.brand_tail", "source_colophon.editorial"],
    "section": ["section_divider.hero_light"],
    "hero": ["product_stage.full_bleed_safe"],
    "data": ["data_hero.single_kpi"],
    "chart": ["native_chart.direct_label"],
    "breathing": ["editorial_quote.pull_quote"],
}


def _fallback_recipe(role: str, used: list[str]) -> tuple[str, str, str]:
    index = _load_recipe_index()
    candidates = ROLE_RECIPE_PREFERENCE.get(role, ["statement_plus_evidence.left_rule_panel"])
    for recipe_id in candidates:
        recipe = index.get(recipe_id)
        if recipe and recipe_id not in used:
            return recipe_id, str(recipe.get("layoutFamily") or "generic"), str(recipe.get("visualLayer") or "none")
    recipe_id = candidates[0]
    recipe = index.get(recipe_id, {})
    return recipe_id, str(recipe.get("layoutFamily") or "generic"), str(recipe.get("visualLayer") or "none")


def build_deckir(
    title: str,
    source_text: str = "",
    *,
    page_count: int | None = None,
    direction_id: str = "formal-finance",
    output_mode: str = "editable-deck",
    quality_mode: str = "standard",
) -> dict[str, Any]:
    """Build a complete DeckIR document (storyboard + source map + planning report)."""
    claims = source_claims(source_text)
    target = page_count if page_count and page_count >= 4 else max(4, min(10, len(claims) + 2))
    body_slots = max(2, target - 2)
    if claims:
        groups = _chunk_claims(claims, body_slots)
        chunks = [[]] + groups + [[]]
        while len(chunks) < target:
            chunks.insert(1, [])
        chunks = chunks[:target]
    else:
        chunks = [[] for _ in range(target)]
    slides: list[dict[str, Any]] = []
    used_recipes: list[str] = []
    for index, chunk in enumerate(chunks):
        if index == 0:
            role = "anchor"
        elif index == len(chunks) - 1:
            role = "closing"
        else:
            role = _infer_role(index, len(chunks), " ".join(item["text"] for item in chunk))
        recipe_id, layout_family, visual_layer = _fallback_recipe(role, used_recipes)
        used_recipes.append(recipe_id)
        claim_text = " ".join(item["text"] for item in chunk)
        if not claim_text:
            claim_text = f"（第 {index + 1} 页内容待补充：请提供事实、数据或来源）"
        is_anchor = role == "anchor"
        is_closing = role == "closing"
        body_role = role in BODY_ROLES
        slides.append(
            {
                "page": f"P{index + 1:02d}",
                "slideId": f"P{index + 1:02d}",
                "role": role,
                "title": _slide_title(role, claim_text, title, index, len(chunks)),
                "takeaway": claim_text[:80] if claim_text and not is_anchor and not is_closing else "",
                "intent": _intent_for_role(role),
                "recipeId": recipe_id,
                "layoutFamily": layout_family,
                "visualLayer": visual_layer,
                "rasterPolicy": "allowed-cover" if is_anchor else "allowed-section-tail" if role in {"section", "closing"} else "prohibited-formal-body",
                "editabilityTarget": "editable text, shapes, charts, evidence captions, and speaker notes",
                "evidenceState": "candidate" if claims and body_role else "missing" if not claims else "unmapped",
                "evidenceRefs": [item["id"] for item in chunk if item.get("id")],
                "sourceLines": sorted({int(item["sourceLine"]) for item in chunk if item.get("sourceLine")}),
                "speakerIntent": _intent_for_role(role),
                "status": "draft",
            }
        )
    now = _now_iso()
    return {
        "deckIRVersion": "upm-v7",
        "createdAt": now,
        "planningMode": "deterministic-fallback" if not claims else "deterministic-source-planner",
        "delivery": {"outputMode": output_mode, "qualityGate": quality_mode},
        "directionId": direction_id,
        "title": title,
        "slides": slides,
        "sourceMap": {
            "version": "source-map-v1",
            "createdAt": now,
            "source": "sources/source.md",
            "claims": claims,
        },
        "planningReport": {
            "version": "planning-report-v1",
            "status": "planned",
            "createdAt": now,
            "summary": {
                "slides": len(slides),
                "roles": sorted({slide["role"] for slide in slides}),
                "layoutFamilies": sorted({slide["layoutFamily"] for slide in slides}),
                "evidenceClaims": len(claims),
            },
        },
    }


def _slide_title(role: str, claim_text: str, deck_title: str, index: int, total: int) -> str:
    if role == "anchor":
        return deck_title
    if role == "section":
        return f"第 {index} 部分"
    if role == "closing":
        return "总结与下一步"
    text = claim_text[:44]
    return text or f"第 {index + 1} 页"


def _intent_for_role(role: str) -> str:
    return {
        "anchor": "建立主题与核心信息",
        "context": "解释为什么现在值得关注",
        "evidence": "用证据支撑主张",
        "comparison": "呈现可验证的差异",
        "process": "让路径可执行",
        "benefit": "突出价值与关键指标",
        "risk": "明确边界与不确定性",
        "action": "把洞察转为下一步行动",
        "closing": "强化结论或行动号召",
        "section": "章节过渡与节奏重置",
        "hero": "建立视觉主角",
        "data": "呈现一个投影级指标",
        "chart": "用可编辑图表说明一个主张",
        "breathing": "低密度编辑停顿",
    }.get(role, "支持叙事")


def load_deckir(path: str | Path) -> dict[str, Any]:
    deckir_path = Path(path)
    if not deckir_path.is_file():
        raise InputError(f"DeckIR 文件不存在：{deckir_path}")
    try:
        data = json.loads(deckir_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise InputError(f"DeckIR JSON 解析失败：{deckir_path}（{exc}）") from exc
    if not isinstance(data, dict) or not isinstance(data.get("slides"), list):
        raise InputError(f"DeckIR 结构无效：{deckir_path}（需要包含 slides 数组）")
    return data
