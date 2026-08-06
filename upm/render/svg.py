"""Deterministic PPTD page -> SVG renderer.

Used for local preview, QA page renders, and the local PPTX export fallback.
The renderer is intentionally conservative: no scripts, no external fonts, no
foreignObject, so the same SVG can flow through the existing SVG->DrawingML
converter for editable PPTX export.
"""

from __future__ import annotations

import html
import re
import xml.sax.saxutils as saxutils
from typing import Any

from upm.render.charts import render_chart


FONT_STACK = "'Microsoft YaHei', 'PingFang SC', 'Arial', sans-serif"


def _hex(color: str, fallback: str = "#171714") -> str:
    if not isinstance(color, str):
        return fallback
    if color.startswith("$"):
        return fallback
    if re.fullmatch(r"#[0-9A-Fa-f]{8}", color):
        return f"#{color[1:7]}"
    if re.fullmatch(r"#[0-9A-Fa-f]{6}", color):
        return color
    return fallback


def resolve_theme(theme: dict[str, Any]) -> tuple[dict[str, str], dict[str, dict[str, Any]]]:
    colors: dict[str, str] = {}
    for key, value in (theme.get("colors") or {}).items():
        colors[key] = _hex(str(value))
    text_styles = {str(key): value for key, value in (theme.get("textStyles") or {}).items()}
    return colors, text_styles


def _text_style(style_ref: Any, content: dict[str, Any], text_styles: dict[str, dict[str, Any]]) -> dict[str, Any]:
    merged: dict[str, Any] = {}
    if isinstance(style_ref, str) and style_ref.startswith("$"):
        merged.update(text_styles.get(style_ref[1:], {}))
    elif isinstance(style_ref, dict):
        merged.update(style_ref)
    for key in ("color", "fontSize", "fontFamily", "bold", "italic", "lineHeight", "lineHeightPx", "letterSpacing", "marginTop"):
        if key in content:
            merged[key] = content[key]
    return merged


def _rich_text_segments(text: str) -> list[dict[str, Any]]:
    """Convert the PPTD rich-text subset into (text, style) segments."""
    segments: list[dict[str, Any]] = []
    token_re = re.compile(r"(<p[^>]*>|</p>|<strong>|</strong>|<em>|</em>|<br\s*/?>|<span[^>]*>|</span>|<li[^>]*>|</li>|<ul>|</ul>|<ol>|</ol>)", re.IGNORECASE)
    position = 0
    stack: dict[str, Any] = {}
    paragraph_align = "left"
    for match in token_re.finditer(text):
        if match.start() > position:
            segments.append({"text": text[position : match.start()], "style": dict(stack), "align": paragraph_align})
        token = match.group(1)
        lower = token.lower()
        if lower.startswith("<p"):
            align_match = re.search(r"text-align\s*:\s*(\w+)", token, re.IGNORECASE)
            paragraph_align = align_match.group(1).lower() if align_match else "left"
        elif lower == "</p>":
            paragraph_align = "left"
            segments.append({"text": "\n", "style": dict(stack), "align": paragraph_align})
        elif lower.startswith("<span"):
            style_match = re.search(r'style\s*=\s*"([^"]*)"', token, re.IGNORECASE)
            if style_match:
                for declaration in style_match.group(1).split(";"):
                    if ":" not in declaration:
                        continue
                    key, value = declaration.split(":", 1)
                    key, value = key.strip().lower(), value.strip()
                    if key == "color":
                        stack["color"] = value
                    elif key == "font-size":
                        stack["fontSize"] = float(re.sub(r"[^0-9.]", "", value)) if re.search(r"\d", value) else stack.get("fontSize")
                    elif key == "font-weight" and value in {"700", "bold"}:
                        stack["bold"] = True
        elif lower == "</span>":
            stack.pop("color", None)
            stack.pop("fontSize", None)
            stack.pop("bold", None)
        elif lower == "<strong>":
            stack["bold"] = True
        elif lower == "</strong>":
            stack.pop("bold", None)
        elif lower == "<em>":
            stack["italic"] = True
        elif lower == "</em>":
            stack.pop("italic", None)
        elif lower == "<br/>":
            segments.append({"text": "\n", "style": dict(stack), "align": paragraph_align})
        position = match.end()
    if position < len(text):
        segments.append({"text": text[position:], "style": dict(stack), "align": paragraph_align})
    return segments


def _render_text_element(element: dict[str, Any], colors: dict[str, str], text_styles: dict[str, dict[str, Any]]) -> str:
    bounds = element.get("bounds")
    if not isinstance(bounds, list) or len(bounds) != 4:
        return ""
    x, y, width, height = (float(v) for v in bounds)
    content = element.get("content") or {}
    style = _text_style(content.get("style"), content, text_styles)
    font_size = float(style.get("fontSize") or 18)
    color = _hex(str(style.get("color") or "#171714"), colors.get("ink", "#171714"))
    line_height = float(style.get("lineHeight") or 1.5)
    align = content.get("align") or ["left", "top"]
    horizontal = align[0] if isinstance(align, list) and align else "left"
    vertical = align[1] if isinstance(align, list) and len(align) > 1 else "top"
    weight = "700" if style.get("bold") else "400"
    italic = "italic" if style.get("italic") else "normal"
    text = str(content.get("text") or "")
    segments = _rich_text_segments(text)
    paragraphs: list[list[dict[str, Any]]] = [[]]
    for segment in segments:
        for line in segment["text"].split("\n"):
            if line == "" and segment["text"].endswith("\n"):
                paragraphs.append([])
                continue
            if line or paragraphs[-1]:
                paragraphs[-1].append({"text": line, "style": segment["style"], "align": segment.get("align") or "left"})
    paragraphs = [p for p in paragraphs if p]
    if not paragraphs:
        return ""
    line_height_px = float(style.get("lineHeightPx") or 0)
    effective_line = line_height_px if line_height_px else font_size * line_height
    total_height = len(paragraphs) * effective_line
    if vertical == "middle":
        cursor = y + (height - total_height) / 2
    elif vertical == "bottom":
        cursor = y + height - total_height
    else:
        cursor = y + 2
    out: list[str] = []
    text_anchor = {"left": "start", "center": "middle", "right": "end"}.get(horizontal, "start")
    for paragraph in paragraphs:
        inline = "".join(
            f'<tspan x="{x:.1f}" dy="0" fill="{_hex(str(seg["style"].get("color") or color), color)}" font-size="{float(seg["style"].get("fontSize") or font_size):.1f}" font-weight="{weight if seg["style"].get("bold") else "400"}" font-style="{italic if seg["style"].get("italic") else "normal"}">{html.escape(seg["text"])}</tspan>'
            for seg in paragraph
        )
        anchor = text_anchor
        para_align = paragraph[0].get("align") or "left"
        if para_align != "left":
            anchor = {"center": "middle", "right": "end"}.get(para_align, "start")
        tx = x
        if anchor == "middle":
            tx = x + width / 2
        elif anchor == "end":
            tx = x + width
        out.append(f'<text x="{tx:.1f}" y="{cursor + font_size:.1f}" text-anchor="{anchor}" font-family="{FONT_STACK}" font-size="{font_size:.1f}" fill="{color}">{inline}</text>')
        cursor += effective_line
    return "".join(out)


def _render_shape_element(
    element: dict[str, Any],
    colors: dict[str, str],
    defs: list[str],
    href_prefix: str = "",
) -> str:
    bounds = element.get("bounds")
    if not isinstance(bounds, list) or len(bounds) != 4:
        return ""
    x, y, width, height = (float(v) for v in bounds)
    shape = str(element.get("shapeName") or "rect")
    fill = element.get("fill") or {"type": "solid", "color": "#000000"}
    fill_svg = _fill_parts(fill, colors, width, height, defs, href_prefix)
    border = element.get("border")
    stroke = ""
    if isinstance(border, dict):
        stroke = f' stroke="{_hex(str(border.get("color") or "#000000"), "#000000")}" stroke-width="{float(border.get("width") or 1):.1f}"'
    adjustments = element.get("adjustments") or []
    if shape in {"rect", "roundRect", "ellipse", "triangle", "diamond", "chevron", "rightArrow", "donut", "star5", "homePlate"}:
        if shape == "rect":
            return f'<rect x="{x:.1f}" y="{y:.1f}" width="{width:.1f}" height="{height:.1f}" fill="{fill_svg}"{stroke}/>'
        if shape == "roundRect":
            radius = float(adjustments[0]) / 100000 * min(width, height) if adjustments else min(width, height) * 0.08
            return f'<rect x="{x:.1f}" y="{y:.1f}" width="{width:.1f}" height="{height:.1f}" rx="{radius:.1f}" fill="{fill_svg}"{stroke}/>'
        if shape == "ellipse":
            return f'<ellipse cx="{x + width / 2:.1f}" cy="{y + height / 2:.1f}" rx="{width / 2:.1f}" ry="{height / 2:.1f}" fill="{fill_svg}"{stroke}/>'
        if shape == "triangle":
            apex = float(adjustments[0]) / 100000 if adjustments else 0.5
            return f'<polygon points="{x + width * apex:.1f},{y:.1f} {x:.1f},{y + height:.1f} {x + width:.1f},{y + height:.1f}" fill="{fill_svg}"{stroke}/>'
        if shape == "diamond":
            return f'<polygon points="{x + width / 2:.1f},{y:.1f} {x + width:.1f},{y + height / 2:.1f} {x + width / 2:.1f},{y + height:.1f} {x:.1f},{y + height / 2:.1f}" fill="{fill_svg}"{stroke}/>'
        if shape == "chevron":
            tip = float(adjustments[0]) / 100000 if adjustments else 0.5
            return f'<polygon points="{x:.1f},{y:.1f} {x + width * tip:.1f},{y + height / 2:.1f} {x:.1f},{y + height:.1f} {x + width * tip + 8:.1f},{y + height:.1f} {x + width:.1f},{y + height / 2:.1f} {x + width * tip + 8:.1f},{y:.1f}" fill="{fill_svg}"{stroke}/>'
        if shape == "rightArrow":
            shaft = float(adjustments[0]) / 100000 if adjustments else 0.5
            head = float(adjustments[1]) / 100000 if len(adjustments) > 1 else 0.5
            return (
                f'<polygon points="{x:.1f},{y + height * (1 - shaft) / 2:.1f} {x + width * (1 - head):.1f},{y + height * (1 - shaft) / 2:.1f} '
                f'{x + width * (1 - head):.1f},{y:.1f} {x + width:.1f},{y + height / 2:.1f} {x + width * (1 - head):.1f},{y + height:.1f} '
                f'{x + width * (1 - head):.1f},{y + height * (1 + shaft) / 2:.1f} {x:.1f},{y + height * (1 + shaft) / 2:.1f} Z" fill="{fill_svg}"{stroke}/>'
            )
        if shape == "donut":
            return (
                f'<path d="M {x + width / 2:.1f},{y:.1f} A {width / 2:.1f},{height / 2:.1f} 0 1 1 {x + width / 2 - 0.1:.1f},{y:.1f} Z '
                f'M {x + width / 2:.1f},{y + height * 0.25:.1f} A {width * 0.25:.1f},{height * 0.25:.1f} 0 1 0 {x + width / 2 - 0.1:.1f},{y + height * 0.25:.1f} Z" '
                f'fill-rule="evenodd" fill="{fill_svg}"{stroke}/>'
            )
        if shape == "star5":
            return _star_polygon(x, y, width, height, fill_svg, stroke)
        if shape == "homePlate":
            tip = float(adjustments[0]) / 100000 if adjustments else 0.5
            return f'<polygon points="{x + width * tip:.1f},{y:.1f} {x + width:.1f},{y + height * 0.5:.1f} {x + width * tip:.1f},{y + height:.1f} {x:.1f},{y + height:.1f} {x:.1f},{y:.1f}" fill="{fill_svg}"{stroke}/>'
    if shape == "custom" and element.get("path"):
        return f'<path d="{saxutils.quoteattr(str(element["path"]))[1:-1]}" transform="translate({x:.1f},{y:.1f}) scale({width / max(1, float(element.get("viewBox", [100, 100])[0])):.4f},{height / max(1, float(element.get("viewBox", [100, 100])[1])):.4f})" fill="{fill_svg}"{stroke}/>'
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{width:.1f}" height="{height:.1f}" fill="{fill_svg}"{stroke}/>'


def _star_polygon(x: float, y: float, width: float, height: float, fill: str, stroke: str) -> str:
    cx, cy = x + width / 2, y + height / 2
    outer = min(width, height) / 2
    inner = outer * 0.4
    points: list[str] = []
    for index in range(10):
        radius = outer if index % 2 == 0 else inner
        angle = -90 + index * 36
        import math

        points.append(f"{cx + radius * math.cos(math.radians(angle)):.1f},{cy + radius * math.sin(math.radians(angle)):.1f}")
    return f'<polygon points="{" ".join(points)}" fill="{fill}"{stroke}/>'


def _fill_parts(
    fill: Any,
    colors: dict[str, str],
    width: float,
    height: float,
    defs: list[str],
    href_prefix: str = "",
) -> str:
    """Return the SVG fill attribute and append any needed defs."""
    if not isinstance(fill, dict):
        return "#000000"
    fill_type = fill.get("type")
    if fill_type == "solid":
        return _hex(str(fill.get("color") or "#000000"), "#000000")
    if fill_type == "gradient":
        stops = fill.get("stops") or []
        if len(stops) < 2:
            return "#000000"
        gradient_id = f"g{abs(hash(str(stops))) % 100000}"
        angle = float(fill.get("angle") or 0)
        stops_xml = "".join(
            f'<stop offset="{float(stop.get("position") or 0) * 100:.1f}%" stop-color="{_hex(str(stop.get("color")), "#000000")}"/>'
            for stop in stops
        )
        if fill.get("gradientType") == "radial":
            defs.append(
                f'<radialGradient id="{gradient_id}" cx="50%" cy="50%" r="70%">{stops_xml}</radialGradient>'
            )
        else:
            import math

            radians = math.radians(angle)
            x1 = 50 - 50 * math.cos(radians)
            y1 = 50 - 50 * math.sin(radians)
            defs.append(
                f'<linearGradient id="{gradient_id}" x1="{x1:.1f}%" y1="{y1:.1f}%" '
                f'x2="{100 - x1:.1f}%" y2="{100 - y1:.1f}%">{stops_xml}</linearGradient>'
            )
        return f"url(#{gradient_id})"
    if fill_type == "image":
        src = str(fill.get("src") or "")
        mode = str((fill.get("fit") or {}).get("mode") or "cover")
        preserve = "xMidYMid slice" if mode == "cover" else "xMidYMid meet" if mode == "contain" else "none"
        href = _href(src, href_prefix)
        pattern_id = f"img-{abs(hash(src)) % 100000}"
        defs.append(
            f'<pattern id="{pattern_id}" width="100%" height="100%" patternUnits="objectBoundingBox">'
            f'<image href="{href}" width="100%" height="100%" preserveAspectRatio="{preserve}"/></pattern>'
        )
        return f"url(#{pattern_id})"
    return "#000000"


def _href(src: str, href_prefix: str) -> str:
    if re.match(r"^(?:https?|data|blob):", src, re.IGNORECASE):
        return src
    return f"{href_prefix}{src}" if href_prefix else src


def _render_image_element(element: dict[str, Any], href_prefix: str = "") -> str:
    bounds = element.get("bounds")
    if not isinstance(bounds, list) or len(bounds) != 4:
        return ""
    x, y, width, height = (float(v) for v in bounds)
    src = _href(str(element.get("src") or ""), href_prefix)
    mode = str((element.get("fit") or {}).get("mode") or "cover")
    preserve = "xMidYMid slice" if mode == "cover" else "xMidYMid meet" if mode == "contain" else "none"
    opacity = float(element.get("opacity") or 1.0)
    clip = ""
    crop_shape = element.get("cropShape")
    if isinstance(crop_shape, dict) and crop_shape.get("shapeName") == "roundRect":
        radius = float((crop_shape.get("adjustments") or [15000])[0]) / 100000 * min(width, height)
        clip = f'<clipPath id="clip-{x:.0f}-{y:.0f}"><rect x="{x:.1f}" y="{y:.1f}" width="{width:.1f}" height="{height:.1f}" rx="{radius:.1f}"/></clipPath>'
        clip_attr = f'clip-path="url(#clip-{x:.0f}-{y:.0f})"'
    elif isinstance(crop_shape, dict) and crop_shape.get("shapeName") == "ellipse":
        clip = f'<clipPath id="clip-{x:.0f}-{y:.0f}"><ellipse cx="{x + width / 2:.1f}" cy="{y + height / 2:.1f}" rx="{width / 2:.1f}" ry="{height / 2:.1f}"/></clipPath>'
        clip_attr = f'clip-path="url(#clip-{x:.0f}-{y:.0f})"'
    else:
        clip_attr = ""
    return (
        f"{clip}"
        f'<image x="{x:.1f}" y="{y:.1f}" width="{width:.1f}" height="{height:.1f}" href="{src}" '
        f'preserveAspectRatio="{preserve}" opacity="{opacity:.2f}" {clip_attr}/>'
    )


def _render_table_element(element: dict[str, Any], colors: dict[str, str], text_styles: dict[str, dict[str, Any]]) -> str:
    bounds = element.get("bounds")
    if not isinstance(bounds, list) or len(bounds) != 4:
        return ""
    x, y, width, height = (float(v) for v in bounds)
    rows = element.get("rows") or []
    column_widths = [float(v) for v in (element.get("columnWidths") or [])]
    row_heights = [float(v) for v in (element.get("rowHeights") or [])]
    if not column_widths:
        column_widths = [1.0 / max(1, len(rows[0] or []))] * max(1, len(rows[0] or []))
    if not row_heights:
        row_heights = [1.0 / len(rows)] * len(rows)
    out: list[str] = []
    cursor_y = y
    for row_index, row in enumerate(rows):
        row_h = height * row_heights[min(row_index, len(row_heights) - 1)]
        cursor_x = x
        is_header = row_index == 0
        for cell_index, cell in enumerate(row):
            col_w = width * column_widths[min(cell_index, len(column_widths) - 1)]
            fill = colors.get("primary", "#1D4ED8") if is_header else "#FFFFFF"
            text_color = "#FFFFFF" if is_header else colors.get("ink", "#171714")
            out.append(
                f'<rect x="{cursor_x:.1f}" y="{cursor_y:.1f}" width="{col_w:.1f}" height="{row_h:.1f}" fill="{fill}" stroke="#E5E1D8" stroke-width="1"/>'
            )
            cell_text = str((cell or {}).get("text") or "") if isinstance(cell, dict) else str(cell or "")
            font_size = 15 if not is_header else 14
            out.append(
                f'<text x="{cursor_x + 10:.1f}" y="{cursor_y + row_h / 2 + font_size / 2 - 2:.1f}" font-size="{font_size:.1f}" fill="{text_color}" font-family="{FONT_STACK}">{html.escape(cell_text[:60])}</text>'
            )
            cursor_x += col_w
        cursor_y += row_h
    return "".join(out)


def _render_line_element(element: dict[str, Any], colors: dict[str, str]) -> str:
    bounds = element.get("bounds")
    if not isinstance(bounds, list) or len(bounds) != 4:
        return ""
    x, y, width, height = (float(v) for v in bounds)
    view_box = element.get("viewBox") or [1, 1]
    points = str(element.get("points") or "")
    if not points:
        return ""
    border = element.get("border") or {}
    stroke = _hex(str(border.get("color") or "#171714"), colors.get("ink", "#171714"))
    stroke_width = float(border.get("width") or 1)
    sx, sy = width / float(view_box[0]), height / float(view_box[1])
    coords = points.replace(",", " ").split()
    if len(coords) < 2:
        return ""
    first = coords[:2]
    rest = coords[2:]
    path = f"M {x + float(first[0]) * sx:.1f},{y + float(first[1]) * sy:.1f} "
    if len(rest) >= 2:
        path += f"Q {x + float(rest[0]) * sx:.1f},{y + float(rest[1]) * sy:.1f} "
        tail = rest[2:] or coords[-2:]
        path += f"{x + float(tail[0]) * sx:.1f},{y + float(tail[1]) * sy:.1f}"
    else:
        path += f"L {x + float(coords[-2]) * sx:.1f},{y + float(coords[-1]) * sy:.1f}"
    return f'<path d="{path}" fill="none" stroke="{stroke}" stroke-width="{stroke_width:.1f}"/>'


def render_page_svg(
    page: dict[str, Any],
    theme: dict[str, Any],
    canvas_size: tuple[int, int] = (960, 540),
    href_prefix: str = "",
) -> str:
    colors, text_styles = resolve_theme(theme)
    width, height = canvas_size
    background = page.get("background") or {"type": "solid", "color": "$paper"}
    defs: list[str] = []
    background_svg = _fill_parts(background, colors, float(width), float(height), defs, href_prefix)
    bg = f'<rect width="{width}" height="{height}" fill="{background_svg}"/>'
    body: list[str] = []
    for element in page.get("elements", []):
        element_type = element.get("elementType")
        if element_type == "text":
            body.append(_render_text_element(element, colors, text_styles))
        elif element_type == "shape":
            body.append(_render_shape_element(element, colors, defs, href_prefix))
        elif element_type == "image":
            body.append(_render_image_element(element, href_prefix))
        elif element_type == "table":
            body.append(_render_table_element(element, colors, text_styles))
        elif element_type == "line":
            body.append(_render_line_element(element, colors))
        elif element_type == "chart":
            bounds = element.get("bounds")
            if isinstance(bounds, list) and len(bounds) == 4:
                body.append(render_chart(element, float(bounds[2]), float(bounds[3]), colors))
        elif element_type == "icon":
            body.append("")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}"><defs>{"".join(defs)}</defs>{bg}{"".join(body)}</svg>'
    )
