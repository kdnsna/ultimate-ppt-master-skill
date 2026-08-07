"""DeckIR -> PPTD deterministic compiler.

The model decides WHAT the deck says (DeckIR). This compiler decides HOW pages
are laid out: page size, safe margins, title/body/note sizes, recipe skeletons,
layer order, image fit, footers, sources, and the theme. All geometry is
deterministic so the same DeckIR always produces the same PPTD.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from upm.compiler.deckir import load_deckir
from upm.compiler.overflow import OverflowFinding, auto_fix_font_size, check_element_overflow
from upm.compiler.tokens import build_theme
from upm.errors import CompilerError, InputError
from upm.pptd.io import import_media_file, write_yaml
from upm.pptd.model import (
    create_manifest,
    create_page,
    image_element,
    shape_element,
    solid_fill,
    table_element,
    text_element,
)
from upm.pptd.paths import page_path_from_index

W, H = 960.0, 540.0
MARGIN = 56.0
TITLE_Y = 48.0
BODY_Y = 148.0
FOOTER_Y = 502.0
MAX_PAGES = 40


def _text(
    element_id: str,
    x: float,
    y: float,
    width: float,
    height: float,
    text: str,
    *,
    style: str | None = None,
    font_size: float | None = None,
    color: str | None = None,
    bold: bool | None = None,
    align: list[str] | None = None,
    line_height: float | None = None,
) -> dict[str, Any]:
    return text_element(
        element_id,
        (x, y, width, height),
        text,
        style=style,
        font_size=font_size,
        color=color,
        bold=bold,
        align=align,
        line_height=line_height,
    )


def _rule(x: float, y: float, width: float, color: str = "$primary", height: float = 3.0) -> dict[str, Any]:
    return shape_element(f"rule-{x:.0f}-{y:.0f}", (x, y, width, height), "rect", fill=solid_fill(color))


def _card(x: float, y: float, width: float, height: float, fill: str = "$surface", radius: int = 10000) -> dict[str, Any]:
    return shape_element(
        f"card-{x:.0f}-{y:.0f}",
        (x, y, width, height),
        "roundRect",
        adjustments=[radius],
        fill=solid_fill(fill),
        border={"style": "solid", "width": 1, "color": "#E5E1D8"},
    )


def _header(title: str, eyebrow: str, page_index: int, total: int) -> list[dict[str, Any]]:
    elements: list[dict[str, Any]] = []
    if eyebrow:
        elements.append(_text("eyebrow", MARGIN, TITLE_Y, 700, 26, eyebrow.upper(), style="$eyebrow"))
    title_y = TITLE_Y + 34 if eyebrow else TITLE_Y
    elements.append(_text("page-title", MARGIN, title_y, 848, 52, title, style="$pageTitle"))
    elements.append(_rule(MARGIN, title_y + 62, 96))
    elements.append(
        _text(
            "page-num",
            W - MARGIN - 100,
            FOOTER_Y,
            100,
            22,
            f"{page_index:02d} / {total:02d}",
            style="$note",
            align=["right", "middle"],
        )
    )
    return elements


def _source_note(slide: dict[str, Any], claim_by_id: dict[str, dict[str, Any]]) -> str:
    """Footer caption for evidence. Never leaks local paths like ``source.md``.

    Evidence line numbers and claim text live in speaker notes (``_notes_text``).
    On-slide footers stay empty unless a claim carries an explicit human
    ``citation`` / ``sourceLabel`` that does not look like a filesystem path.
    """
    refs = slide.get("evidenceRefs") or []
    if not refs:
        return ""
    labels: list[str] = []
    path_leak = re.compile(r"(?i)(source\.md|sources/|\\\\|/[\w.-]+\.(md|txt|docx?))")
    for ref in refs[:3]:
        claim = claim_by_id.get(str(ref))
        if not claim:
            continue
        citation = str(claim.get("citation") or claim.get("sourceLabel") or "").strip()
        if citation and not path_leak.search(citation):
            labels.append(citation)
    if not labels:
        return ""
    return " · ".join(labels)


def _notes_text(slide: dict[str, Any], claim_by_id: dict[str, dict[str, Any]]) -> str:
    parts: list[str] = []
    if slide.get("takeaway"):
        parts.append(f"核心信息：{slide['takeaway']}")
    refs = slide.get("evidenceRefs") or []
    for ref in refs:
        claim = claim_by_id.get(str(ref))
        if claim:
            parts.append(f"[{ref}] L{claim.get('sourceLine')}: {claim.get('text')}")
    if not parts:
        parts.append(str(slide.get("intent") or "本页为结构性占位，请在生成前补充内容与证据。"))
    return "\n".join(parts)


def _body_text(slide: dict[str, Any], claim_by_id: dict[str, dict[str, Any]]) -> str:
    lines: list[str] = []
    refs = slide.get("evidenceRefs") or []
    for ref in refs:
        claim = claim_by_id.get(str(ref))
        if claim:
            lines.append(str(claim.get("text")))
    if not lines:
        lines.extend(str(item) for item in (slide.get("body") or []) if item)
    return "<p>" + "</p><p>".join(lines) + "</p>" if lines else ""


def _extract_number(text: str) -> tuple[str, str]:
    match = re.search(r"([+\-]?\d[\d,.]*\s*[%％万亿元]?|[零一二三四五六七八九十百]+%)", text or "")
    if not match:
        return "", ""
    value = match.group(1)
    remainder = (text or "").replace(value, "", 1).strip(" ：:，。、")
    return value, remainder


def _split_items(text: str, separators: tuple[str, ...] = ("；", ";", "，", "、")) -> list[str]:
    if not text:
        return []
    for separator in separators:
        parts = [part.strip() for part in text.split(separator) if part.strip()]
        if len(parts) > 1:
            return parts
    return [text]


def _layout(
    slide: dict[str, Any],
    claim_by_id: dict[str, dict[str, Any]],
    page_index: int,
    total: int,
    images: dict[str, str],
) -> tuple[list[dict[str, Any]], str, str]:
    """Return (elements, background, notes) for a slide."""
    role = str(slide.get("role") or "context")
    recipe = str(slide.get("recipeId") or "")
    title = str(slide.get("title") or f"第 {page_index} 页")
    notes = _notes_text(slide, claim_by_id)
    source = _source_note(slide, claim_by_id)
    body = _body_text(slide, claim_by_id)

    if role == "anchor" or recipe.startswith("cover_brand"):
        elements = [
            _text("eyebrow", MARGIN, 120, 500, 26, "ULTIMATE PPT MASTER · 正式汇报", style="$eyebrow"),
            _text("cover-title", MARGIN, 170, 560, 180, title, style="$coverTitle"),
            _text("cover-subtitle", MARGIN, 366, 540, 100, str(slide.get("takeaway") or "以 DeckIR 规划、PPTD 编译、视觉复检和可编辑导出为生产链路。"), style="$coverSubtitle"),
            _text("cover-note", MARGIN, FOOTER_Y, 480, 22, "可编辑 PPTX · 视觉复检 · 证据可追溯", style="$note"),
        ]
        image = images.get(str(slide.get("slideId") or slide.get("page") or ""))
        if image:
            elements.append(_card(W - MARGIN - 300, 140, 300, 300, fill="$surface", radius=20000))
            elements.append(image_element("cover-panel", (W - MARGIN - 300, 140, 300, 300), image, fit={"mode": "cover"}))
        return elements, "", notes

    if role == "section" or recipe.startswith("section_divider"):
        elements = [
            _text("section-number", MARGIN, 200, 120, 40, f"{page_index:02d}", style="$pageTitle", color="$primary"),
            _text("section-title", MARGIN + 10, 260, 700, 80, title, style="$sectionTitle"),
            _rule(MARGIN, 350, 160),
        ]
        return elements, "", notes

    if role == "closing" or recipe.startswith("closing_commitment"):
        elements = [
            _text("closing-title", MARGIN, 190, 848, 80, title, style="$coverTitle", font_size=44),
            _text("closing-body", MARGIN, 300, 800, 120, body or "决策与行动建议见演讲者备注。", style="$lead"),
        ]
        if source:
            elements.append(_text("closing-source", MARGIN, FOOTER_Y, 700, 22, source, style="$note"))
        return elements, "", notes

    elements = _header(title, str(slide.get("intent") or ""), page_index, total)
    y = BODY_Y

    table = slide.get("table")
    if isinstance(table, dict) and table.get("headers") and table.get("rows"):
        elements.append(
            table_element(
                "evidence-table",
                (MARGIN, y, 848, 320),
                [str(h) for h in table["headers"]],
                [[str(cell) for cell in row] for row in table["rows"]],
            )
        )
        if source:
            elements.append(
                _text(
                    "evidence-source",
                    MARGIN,
                    FOOTER_Y - 22,
                    700,
                    22,
                    source,
                    style="$note",
                )
            )
        return elements, "", notes

    image = images.get(str(slide.get("slideId") or slide.get("page") or ""))
    if image is not None or recipe.startswith("image_story") or recipe.startswith("product_stage"):
        if image:
            elements.append(_card(W - MARGIN - 400, y - 10, 400, 320, fill="$surface", radius=16000))
            elements.append(image_element("story-image", (W - MARGIN - 400, y - 10, 400, 320), image, fit={"mode": "cover"}))
            elements.append(_text("story-body", MARGIN, y + 10, 400, 300, body, style="$body"))
        else:
            elements.append(_text("body", MARGIN, y, 848, 300, body or "内容待补充（占位）。", style="$body"))
        if source:
            elements.append(_text("story-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
        return elements, "", notes

    if recipe.startswith("evidence_board") or role == "evidence":
        elements.append(_text("evidence-body", MARGIN, y, 848, 300, body or "证据内容待补充（占位）。", style="$body"))
        if source:
            elements.append(_text("evidence-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
        return elements, "", notes

    if recipe.startswith("comparison_matrix"):
        columns = _split_items(body.replace("<p>", "").replace("</p>", "\n"), ("vs", "VS", "对比", "相较"))
        elements.append(_card(MARGIN, y, 412, 300))
        elements.append(_text("col-a", MARGIN + 20, y + 18, 372, 240, columns[0] if columns else "方案 A", style="$body"))
        elements.append(_card(W - MARGIN - 412, y, 412, 300))
        elements.append(_text("col-b", W - MARGIN - 412 + 20, y + 18, 372, 240, columns[1] if len(columns) > 1 else "方案 B", style="$body"))
        if source:
            elements.append(_text("comparison-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
        return elements, "", notes

    if recipe.startswith("process_flow"):
        steps = _split_items(body.replace("<p>", "").replace("</p>", "；"))
        steps = steps[:4]
        if len(steps) < 2:
            steps = ["第一步：明确目标", "第二步：收集证据", "第三步：形成判断", "第四步：落地行动"]
        slot_width = (848 - 3 * 24) / 4
        for index, step in enumerate(steps):
            x = MARGIN + index * (slot_width + 24)
            elements.append(_card(x, y, slot_width, 220))
            elements.append(
                _text(f"step-{index}", x + 12, y + 16, 44, 44, f"{index + 1}", style="$statNum", font_size=26, align=["center", "middle"])
            )
            elements.append(_text(f"step-label-{index}", x + 16, y + 76, slot_width - 32, 120, step, style="$body", font_size=16))
        if source:
            elements.append(_text("process-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
        return elements, "", notes

    if recipe.startswith("metric_panel") or recipe.startswith("data_hero"):
        value, label = _extract_number(body or title)
        if value:
            elements.append(_text("metric-value", MARGIN, y + 10, 500, 120, value, style="$statNum", font_size=64))
            elements.append(_text("metric-label", MARGIN, y + 150, 700, 60, label or title, style="$statLabel", font_size=18))
            elements.append(_text("metric-definition", MARGIN, y + 220, 848, 100, body, style="$body"))
            if source:
                elements.append(_text("metric-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
            return elements, "", notes
        # No metric value found: fall back to the standard statement layout
        # instead of rendering a fake "待补充" number.

    if recipe.startswith("risk_callout"):
        rows = _split_items(body.replace("<p>", "").replace("</p>", "；"))
        row_height = 60
        for index, row in enumerate(rows[:4]):
            ry = y + index * row_height
            elements.append(_rule(MARGIN, ry + 6, 8, color="$accent", height=34))
            elements.append(_text(f"risk-{index}", MARGIN + 24, ry, 820, row_height - 8, row, style="$body", font_size=16))
        if source:
            elements.append(_text("risk-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
        return elements, "", notes

    if recipe.startswith("action_roadmap"):
        rows = _split_items(body.replace("<p>", "").replace("</p>", "；"))
        row_height = 72
        for index, row in enumerate(rows[:4]):
            ry = y + index * row_height
            elements.append(_rule(MARGIN, ry + 10, 848, color="#D9D5CC"))
            elements.append(_text(f"action-{index}", MARGIN + 16, ry + 8, 820, row_height - 16, f"□ {row}", style="$body", font_size=16))
        if source:
            elements.append(_text("action-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
        return elements, "", notes

    if recipe.startswith("native_chart"):
        chart = slide.get("chart")
        if isinstance(chart, dict) and chart.get("data") and chart.get("series"):
            chart_element_dict: dict[str, Any] = {
                "elementId": "chart-1",
                "elementType": "chart",
                "bounds": [MARGIN, y + 20, 700, 300],
                "data": chart["data"],
                "series": chart["series"],
                "legend": {"show": True, "position": "bottom"},
            }
            if chart.get("title"):
                chart_element_dict["title"] = chart["title"]
            elements.append(chart_element_dict)
            elements.append(_text("chart-takeaway", MARGIN + 716, y + 40, 150, 220, body or title, style="$note", font_size=13))
        else:
            elements.append(_text("body", MARGIN, y, 848, 300, body or "图表数据待补充（占位）。", style="$body"))
        if source:
            elements.append(_text("chart-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
        return elements, "", notes

    if recipe.startswith("editorial_quote"):
        elements.append(_text("quote", MARGIN + 40, y + 20, 768, 160, f"“{title}”", style="$lead", font_size=30, line_height=1.5))
        elements.append(_text("quote-body", MARGIN + 40, y + 210, 700, 120, body, style="$body"))
        if source:
            elements.append(_text("quote-source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
        return elements, "", notes

    # default: statement + evidence
    elements.append(_rule(MARGIN, y - 14, 8, color="$primary", height=64))
    elements.append(_text("statement", MARGIN + 28, y - 20, 620, 120, str(slide.get("takeaway") or title), style="$lead"))
    elements.append(_text("body", MARGIN + 28, y + 110, 820, 220, body, style="$body"))
    if source:
        elements.append(_text("source", MARGIN, FOOTER_Y - 22, 700, 22, source, style="$note"))
    return elements, "", notes


def _apply_auto_fix(theme: dict[str, Any], page: dict[str, Any], page_name: str) -> list[OverflowFinding]:
    findings: list[OverflowFinding] = []
    text_styles = theme.get("textStyles", {})
    for element in page.get("elements", []):
        findings.extend(check_element_overflow(element, page=page_name, theme_text_styles=text_styles))
        auto_fix_font_size(element, text_styles)
    return findings


def compile_deck(
    deckir_path_or_data: str | Path | dict[str, Any],
    project_dir: str | Path,
    *,
    direction_id: str | None = None,
    images: dict[str, str] | None = None,
    auto_fix: bool = True,
) -> dict[str, Any]:
    """Compile a DeckIR document into a PPTD project on disk.

    ``images`` maps slideId/page -> local image path (copied into media/).
    Returns a summary with manifest path, page count, and overflow findings.
    """
    deckir = (
        load_deckir(deckir_path_or_data)
        if isinstance(deckir_path_or_data, (str, Path))
        else deckir_path_or_data
    )
    if not isinstance(deckir, dict) or not isinstance(deckir.get("slides"), list):
        raise InputError("DeckIR 必须包含 slides 数组")
    slides = deckir["slides"]
    if not slides:
        raise CompilerError("DeckIR 没有任何页面")
    if len(slides) > MAX_PAGES:
        raise CompilerError(f"页面数量超过上限 {MAX_PAGES}：{len(slides)}")
    project_root = Path(project_dir).expanduser().resolve()
    project_root.mkdir(parents=True, exist_ok=True)
    for relative in ("pages", "media", "sources", "exports", "preview", ".upm/cache", ".upm/renders", ".upm/qa", ".upm/intermediate"):
        (project_root / relative).mkdir(parents=True, exist_ok=True)

    direction = str(direction_id or deckir.get("directionId") or "formal-finance")
    theme = build_theme(direction)
    claim_by_id = {
        str(claim.get("id")): claim
        for claim in (deckir.get("sourceMap") or {}).get("claims", [])
        if isinstance(claim, dict)
    }
    media_map: dict[str, str] = {}
    for slide_id, source in (images or {}).items():
        media_map[slide_id] = import_media_file(project_root, source, fallback_stem="asset")

    page_paths: list[str] = []
    total = len(slides)
    all_findings: list[OverflowFinding] = []
    for index, slide in enumerate(slides, start=1):
        elements, background, notes = _layout(slide, claim_by_id, index, total, media_map)
        upm_block = {
            "slideId": str(slide.get("slideId") or f"P{index:02d}"),
            "role": str(slide.get("role") or ""),
            "recipeId": str(slide.get("recipeId") or ""),
            "evidenceRefs": slide.get("evidenceRefs") or [],
            "evidenceState": str(slide.get("evidenceState") or "unmapped"),
        }
        page = create_page(
            str(slide.get("role") or "content"),
            elements,
            background={"type": "solid", "color": "$paper"} if not background else background,
            notes=notes,
            upm=upm_block,
        )
        page_name = page_path_from_index(index, total)
        if auto_fix:
            all_findings.extend(_apply_auto_fix(theme, page, page_name))
        write_yaml(project_root / page_name, page)
        page_paths.append(page_name)

    manifest = create_manifest(
        str(deckir.get("title") or "未命名演示文稿"),
        (int(W), int(H)),
        page_paths,
        theme=theme,
        upm={
            "projectName": project_root.name,
            "qualityMode": str((deckir.get("delivery") or {}).get("qualityGate") or "standard"),
            "directionId": direction,
            "deckir": "deckir.json",
        },
    )
    write_yaml(project_root / "deck.pptd", manifest)
    deckir_path = project_root / ".upm" / "deckir.json"
    deckir_path.write_text(json.dumps(deckir, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    summary = {
        "manifest": str(project_root / "deck.pptd"),
        "project": str(project_root),
        "pages": len(page_paths),
        "directionId": direction,
        "theme": theme,
        "overflowFindings": [
            {
                "page": finding.page,
                "elementId": finding.element_id,
                "message": finding.message,
                "severity": finding.severity,
            }
            for finding in all_findings
        ],
        "media": media_map,
    }
    return summary
