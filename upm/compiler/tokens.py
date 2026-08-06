"""Design tokens -> PPTD theme mapping.

The visual direction manifest is the source of truth for colors/typography;
DESIGN.md defaults provide the size scale. The compiler maps tokens to the
PPTD theme model so pages reference ``$primary`` etc. instead of raw values.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from upm.errors import CompilerError


DIRECTIONS_FILE = Path(__file__).resolve().parents[2] / "templates" / "visual-directions" / "v6-direction-manifest.json"


def _load_directions() -> dict[str, Any]:
    if not DIRECTIONS_FILE.is_file():
        raise CompilerError(f"视觉方向清单不存在：{DIRECTIONS_FILE}")
    try:
        data = json.loads(DIRECTIONS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise CompilerError(f"视觉方向清单解析失败：{exc}") from exc
    return data if isinstance(data, dict) else {}


def direction_for(direction_id: str) -> dict[str, Any]:
    manifest = _load_directions()
    for direction in manifest.get("directions", []):
        if direction.get("id") == direction_id:
            return direction
    if direction_id == "custom":
        return {"id": "custom", "colors": {"paper": "#F6F3ED", "ink": "#171714", "primary": "#1D4ED8", "accent": "#D9573B", "muted": "#687078"}, "typography": {"body": "Microsoft YaHei"}}
    raise CompilerError(
        f"未知视觉方向：{direction_id}。可用：{', '.join(d.get('id', '?') for d in manifest.get('directions', []))}"
    )


def build_theme(direction_id: str = "formal-finance") -> dict[str, Any]:
    direction = direction_for(direction_id)
    colors = direction.get("colors", {})
    typography = direction.get("typography", {})
    body_font = typography.get("body") or "Microsoft YaHei"
    return {
        "colors": {
            "paper": colors.get("paper", "#F6F3ED"),
            "ink": colors.get("ink", "#171714"),
            "primary": colors.get("primary", "#1D4ED8"),
            "accent": colors.get("accent", "#D9573B"),
            "muted": colors.get("muted", "#687078"),
            "white": "#FFFFFF",
            "surface": "#FFFFFF",
        },
        "textStyles": {
            "coverTitle": {
                "fontSize": 60,
                "color": "$ink",
                "bold": True,
                "fontFamily": body_font,
                "lineHeight": 1.15,
            },
            "coverSubtitle": {"fontSize": 22, "color": "$muted", "fontFamily": body_font, "lineHeight": 1.5},
            "sectionTitle": {"fontSize": 48, "color": "$ink", "bold": True, "fontFamily": body_font},
            "pageTitle": {"fontSize": 34, "color": "$ink", "bold": True, "fontFamily": body_font, "lineHeight": 1.2},
            "eyebrow": {"fontSize": 14, "color": "$primary", "bold": True, "fontFamily": body_font, "letterSpacing": 2},
            "body": {"fontSize": 18, "color": "$ink", "fontFamily": body_font, "lineHeight": 1.6},
            "lead": {"fontSize": 20, "color": "$ink", "fontFamily": body_font, "lineHeight": 1.55},
            "note": {"fontSize": 12, "color": "$muted", "fontFamily": body_font, "lineHeight": 1.4},
            "statNum": {"fontSize": 40, "color": "$primary", "bold": True, "fontFamily": body_font},
            "statLabel": {"fontSize": 14, "color": "$muted", "fontFamily": body_font, "lineHeight": 1.4},
            "cell": {"fontSize": 15, "color": "$ink", "fontFamily": body_font, "lineHeight": 1.3},
        },
        "tableStyles": {
            "default": {
                "cellStyle": {"align": ["left", "middle"], "border": {"style": "solid", "width": 1, "color": "#E5E1D8"}},
                "firstRowStyle": {"fill": {"type": "solid", "color": "$primary"}, "color": "#FFFFFF", "bold": True, "align": ["left", "middle"]},
                "bodyStyles": [
                    {"fill": {"type": "solid", "color": "#FFFFFF"}},
                    {"fill": {"type": "solid", "color": "#F7F5F0"}},
                ],
            }
        },
    }

