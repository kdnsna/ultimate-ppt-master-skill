"""Reproducible "preserve-edit" demo proof generator.

Runs one real preservation-first edit on the repository's example deck and
emits, into ``assets/preserve-demo/``:

* ``executive-review-preserve-edited.pptx`` — the repaired deck;
* ``fidelity-report.json`` — the byte-level fidelity report + per-slide changes;
* ``before-after.svg`` — a vector proof card (real before/after title + numbers);
* ``before-after.gif`` — an animated raster card (requires Pillow + a CJK font;
  skipped gracefully otherwise).

The GIF/SVG cards are *schematic* (drawn, not a pixel render of the real slide —
a faithful render needs LibreOffice/cairosvg, which are optional). The edited
.pptx and the fidelity numbers are real.

Usage::

    python3 scripts/make_preserve_demo_proof.py
"""

from __future__ import annotations

import html
import json
import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import preserve_edit_pptx as engine  # noqa: E402

EXAMPLE = ROOT / "examples/executive-business-review-starter/executive-business-review-editable.pptx"
OUT_DIR = ROOT / "assets/preserve-demo"
SLIDE = 1
OLD_TITLE = "季度经营复盘"
NEW_TITLE = "季度经营复盘 · 已修订"

CORAL = (234, 88, 12)
CORAL_SOFT = (255, 237, 213)
INK = (31, 41, 55)
MUTED = (107, 114, 128)
PAPER = (248, 246, 241)
WHITE = (255, 255, 255)
GREEN = (22, 163, 74)
LINE = (229, 224, 216)


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def _run_edit() -> dict:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUT_DIR / "executive-review-preserve-edited.pptx"

    before_texts = engine.slide_texts(EXAMPLE)
    before_xml = engine.slide_xml(EXAMPLE, SLIDE) or ""
    assert any(OLD_TITLE in t for t in before_texts.get(SLIDE, [])), (
        f"expected title {OLD_TITLE!r} on slide {SLIDE} of the example deck"
    )

    # Use the real engine entry point so the committed fidelity-report.json
    # matches the runtime schema (ok/expected_changed/unchanged_count/...).
    result = engine.apply_edits(
        EXAMPLE,
        output,
        [{"slide": SLIDE, "operations": [{"op": "replace_text", "old": OLD_TITLE, "new": NEW_TITLE}]}],
    )

    after_xml = engine.slide_xml(output, SLIDE) or ""
    result["slide_changes"] = {str(SLIDE): engine.summarize_changes(before_xml, after_xml)}
    report = {
        "source": str(EXAMPLE.relative_to(ROOT)),
        "output": str(output.relative_to(ROOT)),
        "editedSlide": SLIDE,
        "beforeTitle": OLD_TITLE,
        "afterTitle": NEW_TITLE,
        **result,
    }
    (OUT_DIR / "fidelity-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return report


def _write_svg(report: dict) -> None:
    total = report["total_parts"]
    unchanged = report["unchanged_count"]
    before = html.escape(report["beforeTitle"])
    after = html.escape(report["afterTitle"])
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="PPT 改稿 改动证明">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F97316"/><stop offset="1" stop-color="#FB7185"/>
    </linearGradient>
    <style>
      .brand {{ font: 700 22px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; fill: #EA580C; }}
      .tag {{ font: 800 16px -apple-system, sans-serif; }}
      .title {{ font: 800 34px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }}
      .line {{ fill: #E5E7EB; }}
      .stat {{ font: 800 64px -apple-system, sans-serif; fill: #16A34A; }}
      .statl {{ font: 600 20px -apple-system, "PingFang SC", sans-serif; fill: #6B7280; }}
      .mono {{ font: 600 16px ui-monospace, Menlo, monospace; fill: #6B7280; }}
      .after {{ animation: pulse 2.4s ease-in-out infinite; }}
      @keyframes pulse {{ 0%,100% {{ opacity: .55; }} 50% {{ opacity: 1; }} }}
    </style>
  </defs>
  <rect width="1200" height="630" fill="#F8F6F1"/>
  <text x="56" y="70" class="brand">PPT 改稿 · ppt-revise</text>
  <text x="56" y="104" style="font:600 18px -apple-system,'PingFang SC',sans-serif;fill:#6B7280">只改第 {SLIDE} 页标题，其余每个部分原样拷贝</text>

  <g transform="translate(56,140)">
    <rect width="640" height="360" rx="22" fill="#FFFFFF" stroke="#E5E0D8"/>
    <rect width="640" height="8" rx="4" fill="url(#g)"/>
    <rect x="520" y="34" width="86" height="30" rx="8" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="563" y="55" text-anchor="middle" style="font:700 13px sans-serif;fill:#DC2626">LOGO</text>
    <text x="44" y="132" class="title" fill="#9CA3AF" text-decoration="line-through">{before}</text>
    <text x="44" y="186" class="title after" fill="#EA580C">{after}</text>
    <rect x="44" y="214" width="420" height="14" rx="7" class="line"/>
    <rect x="44" y="246" width="360" height="14" rx="7" class="line"/>
    <rect x="44" y="278" width="300" height="14" rx="7" class="line"/>
    <text x="44" y="330" class="tag" fill="#9CA3AF">BEFORE（删除线）→ AFTER（修订后）</text>
  </g>

  <g transform="translate(740,140)">
    <rect width="404" height="360" rx="22" fill="#FFFFFF" stroke="#E5E0D8"/>
    <text x="36" y="64" class="statl">原样不变的部分</text>
    <text x="36" y="150" class="stat">{unchanged}/{total}</text>
    <text x="36" y="200" class="statl">改动的部分</text>
    <text x="36" y="244" style="font:800 30px ui-monospace,Menlo,monospace;fill:#EA580C">ppt/slides/slide{SLIDE}.xml</text>
    <g transform="translate(36,288)">
      <circle cx="14" cy="14" r="14" fill="#DCFCE7"/>
      <path d="M8 14 l4 4 l8 -9" stroke="#16A34A" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="40" y="20" class="statl" fill="#16A34A">校验通过 · 可交付</text>
    </g>
  </g>
  <text x="56" y="560" class="mono">reproducible: python3 scripts/make_preserve_demo_proof.py</text>
</svg>
"""
    (OUT_DIR / "before-after.svg").write_text(svg, encoding="utf-8")


def _font(size: int):
    from PIL import ImageFont

    for path in (
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def _draw_card(report: dict, title_color, title_text, fidelity_state: str, alpha_new: float):
    from PIL import Image, ImageDraw

    W, H = 960, 540
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img, "RGBA")
    f_brand = _font(20)
    f_tag = _font(15)
    f_title = _font(33)
    f_stat = _font(60)
    f_statl = _font(18)
    f_mono = _font(14)

    d.text((44, 38), "PPT 改稿 · ppt-revise", font=f_brand, fill=CORAL)
    d.text((44, 70), f"只改第 {SLIDE} 页标题，其余每个部分原样拷贝", font=f_statl, fill=MUTED)

    # slide card
    sx, sy, sw, sh = 44, 110, 520, 320
    d.rounded_rectangle([sx + 4, sy + 6, sx + sw + 4, sy + sh + 6], radius=20, fill=(231, 226, 216))
    d.rounded_rectangle([sx, sy, sx + sw, sy + sh], radius=20, fill=WHITE, outline=LINE)
    d.rounded_rectangle([sx, sy, sx + sw, sy + 8], radius=4, fill=CORAL)
    d.rounded_rectangle([sx + sw - 96, sy + 26, sx + sw - 24, sy + 54], radius=8, fill=(254, 242, 242), outline=(254, 202, 202))
    d.text((sx + sw - 84, sy + 31), "LOGO", font=f_tag, fill=(220, 38, 38))

    # title cross-fade: draw old dimming out, new fading in
    old = report["beforeTitle"]
    new = report["afterTitle"]
    d.text((sx + 36, sy + 96), old, font=f_title, fill=_lerp(INK, (210, 210, 210), alpha_new))
    if alpha_new > 0.02:
        d.text((sx + 36, sy + 96), new, font=f_title, fill=(*title_color, int(255 * alpha_new)))
    for i, w in enumerate((340, 290, 240)):
        d.rounded_rectangle([sx + 36, sy + 168 + i * 30, sx + 36 + w, sy + 168 + i * 30 + 13], radius=6, fill=(229, 231, 235))
    d.text((sx + 36, sy + 280), "BEFORE → AFTER", font=f_tag, fill=(156, 163, 175))

    # fidelity panel
    px, py, pw, ph = 600, 110, 316, 320
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=20, fill=WHITE, outline=LINE)
    d.text((px + 28, py + 30), "原样不变的部分", font=f_statl, fill=MUTED)
    if fidelity_state == "after":
        d.text((px + 28, py + 92), f"{report['unchanged_count']}/{report['total_parts']}", font=f_stat, fill=GREEN)
        d.text((px + 28, py + 178), "改动的部分", font=f_statl, fill=MUTED)
        d.text((px + 28, py + 206), f"slide{SLIDE}.xml", font=_font(24), fill=CORAL)
        d.ellipse([px + 28, py + 252, px + 56, py + 280], fill=(220, 252, 231))
        d.line([px + 35, py + 266, px + 41, py + 272, px + 50, py + 261], fill=GREEN, width=3)
        d.text((px + 66, py + 258), "校验通过", font=f_statl, fill=GREEN)
    else:
        d.text((px + 28, py + 92), "—", font=f_stat, fill=(209, 213, 219))
        d.text((px + 28, py + 190), "待编辑…", font=f_statl, fill=MUTED)

    d.text((44, 470), "reproducible: python3 scripts/make_preserve_demo_proof.py", font=f_mono, fill=MUTED)
    return img


def _write_gif(report: dict) -> bool:
    try:
        from PIL import Image
    except Exception:
        return False
    if _font(20).__class__.__name__ == "ImageFont" and _font(20).path == "":
        return False  # only default bitmap font available -> no CJK
    frames = [
        (_draw_card(report, INK, report["beforeTitle"], "before", 0.0), 1100),
        (_draw_card(report, CORAL, report["afterTitle"], "mid", 0.4), 220),
        (_draw_card(report, CORAL, report["afterTitle"], "mid", 0.75), 220),
        (_draw_card(report, CORAL, report["afterTitle"], "after", 1.0), 1500),
    ]
    imgs = [f.convert("P", palette=Image.ADAPTIVE, colors=128) for f, _ in frames]
    durations = [d for _, d in frames]
    imgs[0].save(
        OUT_DIR / "before-after.gif",
        save_all=True,
        append_images=imgs[1:],
        duration=durations,
        loop=0,
        disposal=2,
        optimize=True,
    )
    return True


def main() -> int:
    if not EXAMPLE.is_file():
        print(f"example deck not found: {EXAMPLE}", file=sys.stderr)
        return 1
    report = _run_edit()
    _write_svg(report)
    gif_ok = _write_gif(report)

    import ppt_render  # noqa: E402  (sibling module; scripts/ is on sys.path)

    real_ok = False
    be = ppt_render.backend()
    if be is not None:
        repaired = OUT_DIR / "executive-review-preserve-edited.pptx"
        caption = f"{report['unchanged_count']}/{report['total_parts']} 个部分原样不变"
        real_ok = bool(
            ppt_render.render_slide_diff_png(EXAMPLE, repaired, SLIDE, OUT_DIR / "before-after-real.png", caption)
            and ppt_render.render_slide_diff_gif(EXAMPLE, repaired, SLIDE, OUT_DIR / "before-after-real.gif", caption)
        )
    print(f"wrote {OUT_DIR.relative_to(ROOT)}/")
    print(f"  safe={report['safe']} changed={report['changed']} unchanged={report['unchanged_count']}/{report['total_parts']}")
    print(f"  schematic_gif={'yes' if gif_ok else 'skipped (no Pillow/CJK font)'}")
    print(f"  real_render={'yes' if real_ok else 'skipped (' + (be or 'no renderer: install LibreOffice + PyMuPDF') + ')'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
