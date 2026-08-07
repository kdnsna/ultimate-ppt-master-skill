"""Deterministic text-overflow pre-check for compiled pages."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class OverflowFinding:
    page: str
    element_id: str
    message: str
    severity: str  # "warning" | "error"


def _strip_tags(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    return text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")


def _chars_per_line(width: float, font_size: float, text: str) -> float:
    """Estimate characters per line for CJK/Latin mixed text."""
    if width <= 0 or font_size <= 0:
        return 1.0
    cjk = sum(1 for char in text if "\u4e00" <= char <= "\u9fff" or "\u3000" <= char <= "\u303f")
    latin = len(text) - cjk
    average_advance = (cjk * font_size + latin * font_size * 0.55) / max(1, len(text))
    return max(1.0, width / average_advance)


def _line_count(text: str, width: float, font_size: float) -> int:
    paragraphs = _strip_tags(text).split("\n")
    total = 0
    for paragraph in paragraphs:
        if not paragraph.strip():
            continue
        chars_per_line = _chars_per_line(width, font_size, paragraph)
        total += max(1, math.ceil(len(paragraph) / chars_per_line))
    return total


def estimate_text_height(text: str, width: float, font_size: float, line_height: float = 1.6) -> float:
    lines = _line_count(text, width, font_size)
    return lines * font_size * line_height


def check_element_overflow(
    element: dict[str, Any],
    *,
    page: str,
    theme_text_styles: dict[str, Any],
    min_font_size: float = 12.0,
) -> list[OverflowFinding]:
    findings: list[OverflowFinding] = []
    if element.get("elementType") != "text":
        return findings
    content = element.get("content")
    if not isinstance(content, dict):
        return findings
    bounds = element.get("bounds")
    if not isinstance(bounds, list) or len(bounds) != 4:
        return findings
    x, y, width, height = (float(v) for v in bounds)
    if width <= 0 or height <= 0:
        return findings
    style = content.get("style")
    style_data = theme_text_styles.get(style.lstrip("$")) if isinstance(style, str) else None
    font_size = float(content.get("fontSize") or (style_data or {}).get("fontSize") or 18)
    line_height = float(content.get("lineHeight") or (style_data or {}).get("lineHeight") or 1.5)
    line_height_px = float(content.get("lineHeightPx") or 0)
    effective_line_height = (line_height_px / font_size) if line_height_px else line_height
    text = str(content.get("text") or "")
    if not text.strip():
        return findings
    lines = _line_count(text, width - 12, font_size)
    # Single-line boxes only need one em plus a small optical inset; multi-line
    # boxes need the accumulated line height plus padding.
    if lines <= 1:
        estimated = float(font_size)
    else:
        estimated = lines * font_size * effective_line_height + 6
    usable_height = max(1.0, height - 6)
    if estimated > usable_height:
        shrink = font_size * math.sqrt(usable_height / estimated)
        shrink = max(min_font_size, math.floor(shrink * 10) / 10)
        element_id = str(element.get("elementId") or "?")
        if shrink >= min_font_size:
            findings.append(
                OverflowFinding(
                    page,
                    element_id,
                    f"文本可能溢出：估算 {estimated:.0f}px，可用 {usable_height:.0f}px；建议字号 ≤{shrink:.1f}",
                    "warning",
                )
            )
        else:
            findings.append(
                OverflowFinding(
                    page,
                    element_id,
                    f"文本溢出严重：估算 {estimated:.0f}px，可用 {usable_height:.0f}px，字号低于安全下限 {min_font_size}",
                    "error",
                )
            )
    return findings


def auto_fix_font_size(element: dict[str, Any], theme_text_styles: dict[str, Any], min_font_size: float = 14.0) -> bool:
    """Shrink an overflowing text element in place. Returns True when changed."""
    content = element.get("content")
    bounds = element.get("bounds")
    if not isinstance(content, dict) or not isinstance(bounds, list) or len(bounds) != 4:
        return False
    width, height = float(bounds[2]), float(bounds[3])
    style = content.get("style")
    style_data = theme_text_styles.get(style.lstrip("$")) if isinstance(style, str) else None
    font_size = float(content.get("fontSize") or (style_data or {}).get("fontSize") or 18)
    line_height = float(content.get("lineHeight") or (style_data or {}).get("lineHeight") or 1.5)
    text = str(content.get("text") or "")
    lines = _line_count(text, width - 12, font_size)
    estimated = float(font_size) if lines <= 1 else lines * font_size * line_height + 6
    usable_height = max(1.0, height - 6)
    if estimated <= usable_height:
        return False
    shrink = font_size * math.sqrt(usable_height / estimated)
    new_size = max(min_font_size, math.floor(shrink * 10) / 10)
    if new_size >= font_size:
        return False
    content["fontSize"] = new_size
    return True
