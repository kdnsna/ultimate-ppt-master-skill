"""Minimal deterministic chart renderers (bar / line / pie) used by SVG pages.

These are preview-quality renderers: they keep the argument visible in QA
images. PPTX export keeps chart elements as native chart objects when the
backend supports them, or as editable DrawingML shapes otherwise.
"""

from __future__ import annotations

import math
import re
from typing import Any


def _num(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _hex_color(color: str, fallback: str = "#1D4ED8") -> str:
    if color.startswith("$"):
        return fallback
    if re.fullmatch(r"#[0-9A-Fa-f]{8}", color):
        return f"#{color[1:7]}"
    if re.fullmatch(r"#[0-9A-Fa-f]{6}", color):
        return color
    return fallback


def render_chart(chart: dict[str, Any], width: float, height: float, colors: dict[str, str]) -> str:
    data = chart.get("data") or {}
    cols = data.get("cols") or []
    rows = data.get("rows") or []
    series = chart.get("series") or []
    chart_type = str((series[0] or {}).get("type", "bar")) if series else "bar"
    if chart_type == "pie":
        return _render_pie(chart, cols, rows, series, width, height, colors)
    if chart_type == "line":
        return _render_line(chart, cols, rows, series, width, height, colors)
    return _render_bar(chart, cols, rows, series, width, height, colors)


def _axis_limits(series: list[dict[str, Any]], cols: list[str], rows: list[list[Any]]) -> tuple[float, float]:
    values: list[float] = []
    for item in series:
        encode = item.get("encode") or {}
        y_col = encode.get("y")
        if not y_col:
            continue
        index = cols.index(y_col) if y_col in cols else -1
        if index < 0:
            continue
        values.extend(_num(row[index]) for row in rows if index < len(row))
    if not values:
        return 0.0, 1.0
    low, high = min(values), max(values)
    if high == low:
        high = low + 1
    pad = (high - low) * 0.1
    return low - pad, high + pad


def _render_bar(chart: dict[str, Any], cols: list[str], rows: list[list[Any]], series: list[dict[str, Any]], width: float, height: float, colors: dict[str, str]) -> str:
    if not cols or not rows or not series:
        return ""
    x_col = str((series[0].get("encode") or {}).get("x", cols[0]))
    categories = [str(row[cols.index(x_col)]) for row in rows] if x_col in cols else []
    low, high = _axis_limits(series, cols, rows)
    pad_left, pad_right, pad_top, pad_bottom = 44, 16, 24, 36
    plot_w = width - pad_left - pad_right
    plot_h = height - pad_top - pad_bottom
    slot = plot_w / max(1, len(categories))
    bar_width = max(4.0, slot * 0.5 / max(1, len(series)))
    out = [f'<g transform="translate({pad_left},{pad_top})">']
    for step in range(5):
        ratio = step / 4
        y = plot_h * (1 - ratio)
        out.append(
            f'<line x1="0" y1="{y:.1f}" x2="{plot_w:.1f}" y2="{y:.1f}" stroke="#E5E1D8" stroke-width="1"/>'
        )
        value = low + (high - low) * ratio
        out.append(
            f'<text x="-8" y="{y + 4:.1f}" text-anchor="end" font-size="11" fill="#687078">{value:,.0f}</text>'
        )
    palette = [colors.get("primary", "#1D4ED8"), colors.get("accent", "#D9573B"), colors.get("muted", "#687078")]
    for series_index, item in enumerate(series):
        encode = item.get("encode") or {}
        y_col = encode.get("y")
        if y_col not in cols:
            continue
        y_index = cols.index(y_col)
        fill = _hex_color(str(item.get("fill") or ""), palette[series_index % len(palette)])
        for category_index, row in enumerate(rows):
            if y_index >= len(row):
                continue
            value = _num(row[y_index])
            bar_h = max(0.0, plot_h * (value - low) / (high - low))
            x = pad_center = (category_index + 0.5) * slot - (bar_width * len(series)) / 2 + series_index * bar_width
            out.append(
                f'<rect x="{x:.1f}" y="{plot_h - bar_h:.1f}" width="{bar_width:.1f}" height="{bar_h:.1f}" fill="{fill}"/>'
            )
            out.append(
                f'<text x="{x + bar_width / 2:.1f}" y="{plot_h - bar_h - 5:.1f}" text-anchor="middle" font-size="11" fill="#171714">{value:g}</text>'
            )
    for category_index, category in enumerate(categories):
        out.append(
            f'<text x="{(category_index + 0.5) * slot:.1f}" y="{plot_h + 20:.1f}" text-anchor="middle" font-size="11" fill="#687078">{category}</text>'
        )
    out.append("</g>")
    return "".join(out)


def _render_line(chart: dict[str, Any], cols: list[str], rows: list[list[Any]], series: list[dict[str, Any]], width: float, height: float, colors: dict[str, str]) -> str:
    if not cols or not rows or not series:
        return ""
    x_col = str((series[0].get("encode") or {}).get("x", cols[0]))
    categories = [str(row[cols.index(x_col)]) for row in rows] if x_col in cols else []
    low, high = _axis_limits(series, cols, rows)
    pad_left, pad_right, pad_top, pad_bottom = 44, 16, 24, 36
    plot_w = width - pad_left - pad_right
    plot_h = height - pad_top - pad_bottom
    out = [f'<g transform="translate({pad_left},{pad_top})">']
    for step in range(5):
        ratio = step / 4
        y = plot_h * (1 - ratio)
        out.append(f'<line x1="0" y1="{y:.1f}" x2="{plot_w:.1f}" y2="{y:.1f}" stroke="#E5E1D8" stroke-width="1"/>')
        value = low + (high - low) * ratio
        out.append(f'<text x="-8" y="{y + 4:.1f}" text-anchor="end" font-size="11" fill="#687078">{value:,.0f}</text>')
    palette = [colors.get("primary", "#1D4ED8"), colors.get("accent", "#D9573B"), colors.get("muted", "#687078")]
    for series_index, item in enumerate(series):
        encode = item.get("encode") or {}
        y_col = encode.get("y")
        if y_col not in cols:
            continue
        y_index = cols.index(y_col)
        stroke = _hex_color(str(item.get("lineColor") or item.get("fill") or ""), palette[series_index % len(palette)])
        points: list[str] = []
        for category_index, row in enumerate(rows):
            if y_index >= len(row) or row[y_index] is None:
                continue
            x = (category_index + 0.5) * plot_w / max(1, len(categories))
            y = plot_h * (1 - (_num(row[y_index]) - low) / (high - low))
            points.append(f"{x:.1f},{y:.1f}")
        if len(points) >= 2:
            out.append(f'<polyline points="{" ".join(points)}" fill="none" stroke="{stroke}" stroke-width="2.5"/>')
            for point in points:
                x, y = point.split(",")
                out.append(f'<circle cx="{x}" cy="{y}" r="3.5" fill="{stroke}"/>')
    for category_index, category in enumerate(categories):
        out.append(
            f'<text x="{(category_index + 0.5) * plot_w / max(1, len(categories)):.1f}" y="{plot_h + 20:.1f}" text-anchor="middle" font-size="11" fill="#687078">{category}</text>'
        )
    out.append("</g>")
    return "".join(out)


def _render_pie(chart: dict[str, Any], cols: list[str], rows: list[list[Any]], series: list[dict[str, Any]], width: float, height: float, colors: dict[str, str]) -> str:
    if not cols or not rows or not series:
        return ""
    item = series[0]
    encode = item.get("encode") or {}
    category_col = encode.get("category", cols[0])
    value_col = encode.get("value", cols[-1])
    if category_col not in cols or value_col not in cols:
        return ""
    cat_index, val_index = cols.index(category_col), cols.index(value_col)
    slices = [(str(row[cat_index]), _num(row[val_index])) for row in rows if val_index < len(row) and _num(row[val_index]) > 0]
    total = sum(value for _, value in slices)
    if total <= 0:
        return ""
    palette = [colors.get("primary", "#1D4ED8"), colors.get("accent", "#D9573B"), colors.get("muted", "#687078"), "#73866C"]
    cx, cy, radius = width / 2, height / 2 - 10, min(width, height) / 2 - 40
    out: list[str] = []
    angle = -90.0
    for index, (label, value) in enumerate(slices):
        sweep = 360.0 * value / total
        fill = _hex_color(str(item.get("fill") or ""), palette[index % len(palette)])
        if isinstance(item.get("fill"), list):
            fills = item["fill"]
            if index < len(fills):
                fill = _hex_color(str(fills[index]), palette[index % len(palette)])
        large = 1 if sweep > 180 else 0
        end = angle + sweep
        x1 = cx + radius * math.cos(math.radians(angle))
        y1 = cy + radius * math.sin(math.radians(angle))
        x2 = cx + radius * math.cos(math.radians(end))
        y2 = cy + radius * math.sin(math.radians(end))
        out.append(
            f'<path d="M {cx:.1f},{cy:.1f} L {x1:.1f},{y1:.1f} A {radius:.1f},{radius:.1f} 0 {large} 1 {x2:.1f},{y2:.1f} Z" fill="{fill}"/>'
        )
        mid = math.radians((angle + end) / 2)
        lx = cx + (radius * 0.62) * math.cos(mid)
        ly = cy + (radius * 0.62) * math.sin(mid)
        out.append(
            f'<text x="{lx:.1f}" y="{ly + 4:.1f}" text-anchor="middle" font-size="12" fill="#FFFFFF">{value:g}</text>'
        )
        angle = end
    legend_y = cy + radius + 24
    for index, (label, value) in enumerate(slices[:6]):
        fill = _hex_color(str(item.get("fill") or ""), palette[index % len(palette)])
        lx = width / 2 - 200 + (index % 3) * 140
        ly = legend_y + (index // 3) * 18
        out.append(f'<rect x="{lx:.1f}" y="{ly - 10:.1f}" width="10" height="10" fill="{fill}"/>')
        out.append(f'<text x="{lx + 15:.1f}" y="{ly:.1f}" font-size="11" fill="#171714">{label}</text>')
    return "".join(out)
