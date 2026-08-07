"""Deterministic visual rubric for PPTD projects."""

from __future__ import annotations

import io
import re
from pathlib import Path
from typing import Any

from upm.pptd.io import load_project
from upm.qa.policy import QualityPolicy, load_policy

ALL_BG_THRESHOLD = 0.9995
MIN_SAMPLE_COLORS = 8

_PLACEHOLDER = re.compile(
    r"(内容待补充|待补充（占位）|证据内容待补充|图表数据待补充|第\s*\d+\s*页内容待补充|请提供事实、数据或来源)"
)
_MD_HEADING = re.compile(r"(?:^|\n)\s*#{1,6}\s+\S")
_SOURCE_PATH = re.compile(r"(?i)\bsource\.md\b|\bsources/")


def _hex_to_rgb(value: str) -> tuple[int, int, int] | None:
    match = re.fullmatch(r"#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})", value or "")
    if not match:
        return None
    return (int(match.group(1)[0:2], 16), int(match.group(1)[2:4], 16), int(match.group(1)[4:6], 16))


def _luminance(rgb: tuple[int, int, int]) -> float:
    def channel(value: int) -> float:
        value /= 255
        return value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4

    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])


def contrast_ratio(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    la, lb = _luminance(a), _luminance(b)
    lighter, darker = max(la, lb), min(la, lb)
    return (lighter + 0.05) / (darker + 0.05)


def is_all_background(png_bytes: bytes) -> bool:
    try:
        from PIL import Image
    except ImportError:
        return False
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    pixels = list(img.getdata())
    total = max(1, len(pixels))
    counts: dict[tuple[int, int, int], int] = {}
    for r, g, b in pixels:
        key = (r >> 4, g >> 4, b >> 4)
        counts[key] = counts.get(key, 0) + 1
    sample_colors = len({pixel for pixel in pixels[:: max(1, total // 400)]})
    return max(counts.values()) / total >= ALL_BG_THRESHOLD and sample_colors < MIN_SAMPLE_COLORS


def _resolve_color(value: str, colors: dict[str, str], fallback: str) -> str:
    if isinstance(value, str) and value.startswith("$"):
        resolved = colors.get(value[1:], fallback)
        if isinstance(resolved, str) and resolved.startswith("$"):
            return colors.get(resolved[1:], fallback)
        return resolved or fallback
    return value or fallback


def _background_color(page: dict[str, Any], colors: dict[str, str]) -> str:
    background = page.get("background")
    if isinstance(background, dict) and background.get("type") == "solid":
        return _resolve_color(str(background.get("color")), colors, "#FFFFFF")
    return colors.get("paper", "#FFFFFF")


def _is_no_renderer(error: Any) -> bool:
    return str(error or "").startswith("no-renderer")


def run_rubric(
    project: str | Path,
    render_records: list[dict[str, Any]],
    *,
    deckir: dict[str, Any] | None = None,
    structure_errors: list[str] | None = None,
    policy: QualityPolicy | None = None,
    quality_mode: str = "standard",
) -> list[dict[str, Any]]:
    """Run deterministic checks and return normalized findings."""
    root = Path(project).expanduser().resolve()
    findings: list[dict[str, Any]] = []
    policy = policy or load_policy(quality_mode)
    _, manifest, pages = load_project(root)
    colors = {str(k): str(v) for k, v in (manifest.get("theme") or {}).get("colors", {}).items()}
    text_styles = (manifest.get("theme") or {}).get("textStyles", {})
    deckir = deckir or {}
    slides = deckir.get("slides") or []

    # 1. structure errors (from the structure gate)
    for message in structure_errors or []:
        findings.append({"id": "structure", "severity": "error", "message": message, "page": ""})

    # 2. render failures + blank pages
    for rec in render_records:
        page = str(rec.get("page") or "?")
        if not rec.get("ok"):
            no_renderer = _is_no_renderer(rec.get("error"))
            # Missing renderer: warning in quick, error when visual is required.
            if no_renderer:
                severity = "error" if policy.require_visual else "warning"
            else:
                severity = "error"
            findings.append(
                {
                    "id": "render-failed",
                    "severity": severity,
                    "message": f"页面渲染失败：{rec.get('error')}",
                    "page": page,
                }
            )
            continue
        path = Path(rec["path"])
        if path.is_file() and is_all_background(path.read_bytes()):
            if policy.blank_page_severity == "ignore":
                continue
            findings.append(
                {
                    "id": "blank-page",
                    "severity": policy.blank_page_severity,
                    "message": "页面接近纯背景，疑似空白页",
                    "page": page,
                }
            )

    # 3. text overflow (re-check pages)
    from upm.compiler.overflow import check_element_overflow

    for relative, page in pages:
        for element in page.get("elements", []):
            for finding in check_element_overflow(element, page=relative, theme_text_styles=dict(text_styles)):
                findings.append(
                    {
                        "id": "text-overflow",
                        "severity": finding.severity,
                        "message": finding.message,
                        "page": relative,
                        "elementId": finding.element_id,
                    }
                )

    # 4. contrast heuristic for solid backgrounds
    for relative, page in pages:
        bg = _hex_to_rgb(_background_color(page, colors))
        if bg is None:
            continue
        for element in page.get("elements", []):
            if element.get("elementType") != "text":
                continue
            content = element.get("content") or {}
            style_ref = content.get("style")
            style = text_styles.get(str(style_ref).lstrip("$"), {}) if isinstance(style_ref, str) else {}
            color_value = _resolve_color(
                str(content.get("color") or style.get("color") or "#171714"),
                colors,
                "#171714",
            )
            fg = _hex_to_rgb(color_value)
            if fg is None:
                continue
            ratio = contrast_ratio(fg, bg)
            font_size = float(content.get("fontSize") or style.get("fontSize") or 18)
            minimum = 3.0 if font_size >= 18 else 4.5
            if ratio + 1e-9 < minimum:
                findings.append(
                    {
                        "id": "low-contrast",
                        "severity": "warning",
                        "message": f"对比度不足（{ratio:.2f}:1，要求 ≥{minimum}）",
                        "page": relative,
                        "elementId": element.get("elementId"),
                    }
                )

    # 5. layout repetition from DeckIR
    families = [str(slide.get("layoutFamily") or "") for slide in slides]
    for index in range(len(families) - 2):
        if families[index] and families[index] == families[index + 1] == families[index + 2]:
            findings.append(
                {
                    "id": "repeated-layout",
                    "severity": "warning",
                    "message": f"连续三页使用同一布局族：{families[index]}",
                    "page": str(slides[index].get("page") or f"P{index + 1:02d}"),
                }
            )
    recipes = [str(slide.get("recipeId") or "") for slide in slides]
    for index in range(len(recipes) - 2):
        if recipes[index] and recipes[index] == recipes[index + 1] == recipes[index + 2]:
            findings.append(
                {
                    "id": "repeated-recipe",
                    "severity": "warning",
                    "message": f"连续三页使用同一 recipe：{recipes[index]}",
                    "page": str(slides[index].get("page") or f"P{index + 1:02d}"),
                }
            )

    # 6. missing evidence on body pages
    body_roles = {"context", "evidence", "comparison", "process", "benefit", "risk", "action"}
    for slide in slides:
        role = str(slide.get("role") or "")
        if role in body_roles and not slide.get("evidenceRefs"):
            severity = "error" if policy.block_placeholders else "warning"
            findings.append(
                {
                    "id": "missing-evidence",
                    "severity": severity,
                    "message": "正式正文页没有证据引用；请不要虚构数据",
                    "page": str(slide.get("page") or "?"),
                }
            )

    # 7. content hygiene: markdown / source-path leakage into visible page text
    for relative, page in pages:
        for element in page.get("elements", []):
            if element.get("elementType") != "text":
                continue
            content = element.get("content") or {}
            text = str(content.get("text") or "")
            if not text.strip():
                continue
            element_id = str(element.get("elementId") or "?")
            if _MD_HEADING.search(text) or re.search(r"(?:^|\n)\s*#{1,6}\s", text):
                findings.append(
                    {
                        "id": "content-leak-markdown",
                        "severity": "error",
                        "message": "页面文本含未清洗的 Markdown 标题符号（#/##）",
                        "page": relative,
                        "elementId": element_id,
                    }
                )
            if _SOURCE_PATH.search(text):
                findings.append(
                    {
                        "id": "content-leak-source-path",
                        "severity": "error",
                        "message": "页面文本泄漏本地源路径（source.md / sources/）",
                        "page": relative,
                        "elementId": element_id,
                    }
                )
            if _PLACEHOLDER.search(text):
                severity = "error" if policy.block_placeholders else "warning"
                findings.append(
                    {
                        "id": "placeholder-content",
                        "severity": severity,
                        "message": "页面含占位正文，正式模式禁止交付",
                        "page": relative,
                        "elementId": element_id,
                    }
                )

    # 8. DeckIR-level missing evidence states under formal policy
    if policy.block_placeholders:
        claims = ((deckir.get("sourceMap") or {}).get("claims")) or []
        if not claims:
            findings.append(
                {
                    "id": "no-source-claims",
                    "severity": "error",
                    "message": "无来源 claims：确定性草稿规划器产物，正式模式禁止交付",
                    "page": "",
                }
            )
        for slide in slides:
            if str(slide.get("evidenceState") or "") == "missing" and str(slide.get("role") or "") in body_roles:
                findings.append(
                    {
                        "id": "evidence-state-missing",
                        "severity": "error",
                        "message": "正文页 evidenceState=missing",
                        "page": str(slide.get("page") or "?"),
                    }
                )
    return findings
