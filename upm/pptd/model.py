"""PPTD v2 data model and typed constructors.

The model mirrors the Kimi public PPTD v2 vocabulary so the optional browser
adapter can consume it unchanged, while adding UPM-specific metadata
(``upm`` block: schema version, deckir refs, evidence refs per page).
"""

from __future__ import annotations

from typing import Any

MANIFEST_VERSION = "v2"
UPM_SCHEMA_VERSION = "upm-pptd-v1"


def create_manifest(
    title: str,
    size: tuple[int, int],
    page_paths: list[str],
    *,
    theme: dict[str, Any] | None = None,
    upm: dict[str, Any] | None = None,
) -> dict[str, Any]:
    manifest: dict[str, Any] = {
        "version": MANIFEST_VERSION,
        "title": title,
        "size": [size[0], size[1]],
        "pages": list(page_paths),
    }
    if theme:
        manifest["theme"] = theme
    if upm:
        manifest["upm"] = {
            "schemaVersion": UPM_SCHEMA_VERSION,
            **upm,
        }
    return manifest


def create_page(
    page_type: str,
    elements: list[dict[str, Any]],
    *,
    background: dict[str, Any] | None = None,
    notes: str = "",
    upm: dict[str, Any] | None = None,
) -> dict[str, Any]:
    page: dict[str, Any] = {
        "pageType": page_type,
        "elements": elements,
    }
    if background:
        page["background"] = background
    if notes:
        page["notes"] = notes
    if upm:
        page["upm"] = {
            "schemaVersion": UPM_SCHEMA_VERSION,
            **upm,
        }
    return page


def text_element(
    element_id: str,
    bounds: tuple[float, float, float, float],
    text: str,
    *,
    style: str | None = None,
    font_size: float | None = None,
    color: str | None = None,
    bold: bool | None = None,
    align: list[str] | None = None,
    line_height: float | None = None,
) -> dict[str, Any]:
    content: dict[str, Any] = {"text": text}
    if style:
        content["style"] = style
    if font_size is not None:
        content["fontSize"] = font_size
    if color:
        content["color"] = color
    if bold is not None:
        content["bold"] = bold
    if align:
        content["align"] = align
    if line_height is not None:
        content["lineHeight"] = line_height
    return {
        "elementId": element_id,
        "elementType": "text",
        "bounds": [bounds[0], bounds[1], bounds[2], bounds[3]],
        "content": content,
    }


def shape_element(
    element_id: str,
    bounds: tuple[float, float, float, float],
    shape_name: str,
    *,
    fill: dict[str, Any] | None = None,
    border: dict[str, Any] | None = None,
    adjustments: list[int] | None = None,
    shadow: dict[str, Any] | None = None,
) -> dict[str, Any]:
    element: dict[str, Any] = {
        "elementId": element_id,
        "elementType": "shape",
        "bounds": [bounds[0], bounds[1], bounds[2], bounds[3]],
        "shapeName": shape_name,
    }
    if adjustments:
        element["adjustments"] = adjustments
    if fill:
        element["fill"] = fill
    if border:
        element["border"] = border
    if shadow:
        element["shadow"] = shadow
    return element


def image_element(
    element_id: str,
    bounds: tuple[float, float, float, float],
    src: str,
    *,
    fit: dict[str, str] | None = None,
    crop_shape: dict[str, Any] | None = None,
    border: dict[str, Any] | None = None,
    shadow: dict[str, Any] | None = None,
    opacity: float | None = None,
) -> dict[str, Any]:
    element: dict[str, Any] = {
        "elementId": element_id,
        "elementType": "image",
        "bounds": [bounds[0], bounds[1], bounds[2], bounds[3]],
        "src": src,
    }
    if fit:
        element["fit"] = fit
    if crop_shape:
        element["cropShape"] = crop_shape
    if border:
        element["border"] = border
    if shadow:
        element["shadow"] = shadow
    if opacity is not None:
        element["opacity"] = opacity
    return element


def table_element(
    element_id: str,
    bounds: tuple[float, float, float, float],
    headers: list[str],
    rows: list[list[str]],
    *,
    column_widths: list[float] | None = None,
    row_heights: list[float] | None = None,
    style: str = "$default",
) -> dict[str, Any]:
    if column_widths is None:
        column_widths = [1.0 / len(headers)] * len(headers)
    body_rows = [[{"text": header} for header in headers]]
    body_rows.extend([{"text": str(cell)} for cell in row] for row in rows)
    if row_heights is None:
        row_heights = [1.0 / len(body_rows)] * len(body_rows)
    return {
        "elementId": element_id,
        "elementType": "table",
        "bounds": [bounds[0], bounds[1], bounds[2], bounds[3]],
        "columnWidths": column_widths,
        "rowHeights": row_heights,
        "style": style,
        "rows": body_rows,
    }


def chart_element(
    element_id: str,
    bounds: tuple[float, float, float, float],
    chart_type: str,
    data: dict[str, Any],
    series: list[dict[str, Any]],
    *,
    title: str | None = None,
    legend: bool | dict[str, Any] = True,
    x_axis: dict[str, Any] | None = None,
    y_axis: dict[str, Any] | None = None,
) -> dict[str, Any]:
    element: dict[str, Any] = {
        "elementId": element_id,
        "elementType": "chart",
        "bounds": [bounds[0], bounds[1], bounds[2], bounds[3]],
        "data": data,
        "series": series,
        "legend": legend,
    }
    if title:
        element["title"] = title
    if x_axis is not None:
        element["xAxis"] = x_axis
    if y_axis is not None:
        element["yAxis"] = y_axis
    if chart_type == "table":
        # Tables are first-class table elements; keep this constructor for
        # callers that want a chart-like API but emit a table instead.
        element["elementType"] = "table"
    return element


def solid_fill(color: str) -> dict[str, Any]:
    return {"type": "solid", "color": color}


def image_fill(src: str, mode: str = "cover", opacity: float = 1.0) -> dict[str, Any]:
    fill: dict[str, Any] = {"type": "image", "src": src, "fit": {"mode": mode}}
    if opacity != 1.0:
        fill["opacity"] = opacity
    return fill

