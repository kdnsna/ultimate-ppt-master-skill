"""Pillow contact-sheet stitching shared by all render backends."""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any

from upm.errors import AdapterUnavailableError


OVERVIEW_COLUMNS = 3
OVERVIEW_THUMB_WIDTH = 640
OVERVIEW_LABEL_HEIGHT = 32
OVERVIEW_GAP = 12


def stitch_overview(images: list[Path], output: Path) -> Path:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as exc:
        raise AdapterUnavailableError(
            "联系表拼接需要 Pillow。",
            hint="显式安装：.venv/bin/pip install Pillow（bootstrap --profile core）。",
        ) from exc
    thumbs: list[tuple[str, Any]] = []
    for index, path in enumerate(images, start=1):
        with Image.open(path) as opened:
            frame = opened.convert("RGB")
            ratio = OVERVIEW_THUMB_WIDTH / frame.width
            thumb = frame.resize((OVERVIEW_THUMB_WIDTH, max(1, round(frame.height * ratio))))
        thumbs.append((f"P{index}", thumb))
    columns = OVERVIEW_COLUMNS
    rows = math.ceil(len(thumbs) / columns)
    cell_height = OVERVIEW_LABEL_HEIGHT + max(thumb.height for _, thumb in thumbs)
    width = columns * OVERVIEW_THUMB_WIDTH + (columns + 1) * OVERVIEW_GAP
    height = rows * cell_height + (rows + 1) * OVERVIEW_GAP
    overview = Image.new("RGB", (width, height), "#e5e7eb")
    draw = ImageDraw.Draw(overview)
    try:
        font = ImageFont.load_default(size=18)
    except TypeError:
        font = ImageFont.load_default()
    for position, (label, thumb) in enumerate(thumbs):
        column = position % columns
        row = position // columns
        x = OVERVIEW_GAP + column * (OVERVIEW_THUMB_WIDTH + OVERVIEW_GAP)
        y = OVERVIEW_GAP + row * (cell_height + OVERVIEW_GAP)
        draw.rectangle((x, y, x + OVERVIEW_THUMB_WIDTH, y + OVERVIEW_LABEL_HEIGHT - 4), fill="#111827")
        draw.text((x + 8, y + 5), label, fill="#ffffff", font=font)
        overview.paste(thumb, (x, y + OVERVIEW_LABEL_HEIGHT))
    overview.save(output, "JPEG", quality=85)
    return output
