"""Per-slide pixel rendering + before/after diff for .pptx decks.

Faithful rendering of an arbitrary PowerPoint slide requires a real renderer;
there is no pure-Python path. This module supports a LibreOffice-based pipeline
(``soffice`` headless converts the deck to PDF, then PyMuPDF/``fitz`` or
``pdftoppm`` rasterizes the requested page) and degrades gracefully when no
renderer is installed: :func:`backend` returns ``None`` and the diff helpers
return ``False`` so callers can fall back to a schematic proof card.

The Pillow compositor (:func:`compose_side_by_side`) has no external dependency
and is used both for the real render and (with synthetic inputs) in tests.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

_PDF_BACKEND_FITZ = "fitz"
_PDF_BACKEND_PDFTOPPM = "pdftoppm"
_MAC_SOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"


def _cjk_font(size: int):
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


def _soffice_path() -> str | None:
    return (
        shutil.which("soffice")
        or shutil.which("libreoffice")
        or (_MAC_SOFFICE if os.path.exists(_MAC_SOFFICE) else None)
    )


def _have_soffice() -> bool:
    return _soffice_path() is not None


def _pdf_rasterizer() -> str | None:
    try:
        import fitz  # noqa: F401

        return _PDF_BACKEND_FITZ
    except Exception:
        pass
    if shutil.which("pdftoppm") is not None:
        return _PDF_BACKEND_PDFTOPPM
    return None


def backend() -> str | None:
    """Return the active render backend name, or None if none is available.

    ``libreoffice+sofficepng`` means only the first slide can be rasterized
    (LibreOffice's ``--convert-to png`` emits the first slide); arbitrary slides
    need ``libreoffice+fitz`` or ``libreoffice+pdftoppm``.
    """
    if not _have_soffice():
        return None
    raster = _pdf_rasterizer()
    if raster is not None:
        return f"libreoffice+{raster}"
    return "libreoffice+sofficepng"


def _soffice_bin() -> str:
    return _soffice_path() or "soffice"


def _pptx_to_pdf(pptx: Path, out_dir: Path) -> Path | None:
    """Convert a deck to PDF with headless LibreOffice. Returns the PDF path."""
    profile = out_dir / "profile"
    profile.mkdir(parents=True, exist_ok=True)
    cmd = [
        _soffice_bin(),
        "-headless",
        f"-env:UserInstallation=file://{profile}",
        "--convert-to",
        "pdf",
        "--outdir",
        str(out_dir),
        str(pptx),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=180)
    except (subprocess.SubprocessError, OSError):
        return None
    pdf = out_dir / f"{pptx.stem}.pdf"
    return pdf if pdf.is_file() else None


def _rasterize_first_slide_via_soffice(pptx: Path, out_png: Path) -> bool:
    """Render the first slide to PNG using only LibreOffice (no PDF rasterizer)."""
    with tempfile.TemporaryDirectory() as tmp:
        profile = Path(tmp) / "profile"
        profile.mkdir(parents=True, exist_ok=True)
        cmd = [
            _soffice_bin(),
            "-headless",
            f"-env:UserInstallation=file://{profile}",
            "--convert-to",
            "png",
            "--outdir",
            tmp,
            str(pptx),
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=180)
        except (subprocess.SubprocessError, OSError):
            return False
        produced = Path(tmp) / f"{pptx.stem}.png"
        if not produced.is_file():
            return False
        out_png.parent.mkdir(parents=True, exist_ok=True)
        out_png.write_bytes(produced.read_bytes())
        return True


def _rasterize_page(pdf: Path, page: int, out_png: Path, dpi: int = 144) -> bool:
    raster = _pdf_rasterizer()
    if raster == _PDF_BACKEND_FITZ:
        import fitz

        doc = fitz.open(str(pdf))
        if not 1 <= page <= len(doc):
            return False
        pix = doc[page - 1].get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72))
        pix.save(str(out_png))
        return True
    if raster == _PDF_BACKEND_PDFTOPPM:
        with tempfile.TemporaryDirectory() as tmp:
            prefix = str(Path(tmp) / "page")
            cmd = ["pdftoppm", "-png", "-r", str(dpi), "-f", str(page), "-l", str(page), str(pdf), prefix]
            try:
                subprocess.run(cmd, check=True, capture_output=True, timeout=120)
            except (subprocess.SubprocessError, OSError):
                return False
            produced = sorted(Path(tmp).glob("page*.png"))
            if not produced:
                return False
            out_png.write_bytes(produced[0].read_bytes())
            return True
    return False


def render_slide_png(pptx: Path, slide: int, out_png: Path) -> bool:
    """Render one slide (1-based) of a deck to PNG. False if no backend."""
    be = backend()
    if be is None:
        return False
    out_png.parent.mkdir(parents=True, exist_ok=True)
    if be == "libreoffice+sofficepng":
        return slide == 1 and _rasterize_first_slide_via_soffice(pptx, out_png)
    with tempfile.TemporaryDirectory() as tmp:
        pdf = _pptx_to_pdf(pptx, Path(tmp))
        if pdf is None:
            return False
        return _rasterize_page(pdf, slide, out_png)


def compose_side_by_side(
    before_png: Path, after_png: Path, out_png: Path, caption: str = ""
) -> bool:
    """Lay two slide renders side by side with BEFORE/AFTER labels + caption."""
    from PIL import Image, ImageDraw

    try:
        before = Image.open(before_png).convert("RGB")
        after = Image.open(after_png).convert("RGB")
    except Exception:
        return False

    header, gap, pad, caption_h = 56, 28, 24, 40 if caption else 16
    h = max(before.height, after.height)
    scale = min(1.0, 560 / max(before.height, 1))
    bw, bh = int(before.width * scale), int(before.height * scale)
    aw, ah = int(after.width * scale), int(after.height * scale)
    h = max(bh, ah)
    W = pad * 2 + bw + gap + aw
    H = header + h + pad + caption_h
    canvas = Image.new("RGB", (W, H), (248, 246, 241))
    d = ImageDraw.Draw(canvas)
    d.text((pad, 16), "PPT 改稿 · 真实渲染 BEFORE → AFTER", font=_cjk_font(20), fill=(234, 88, 12))
    canvas.paste(before.resize((bw, bh)), (pad, header))
    canvas.paste(after.resize((aw, ah)), (pad + bw + gap, header))
    d.text((pad, header + h + 6), "BEFORE", font=_cjk_font(15), fill=(107, 114, 128))
    d.text((pad + bw + gap, header + h + 6), "AFTER", font=_cjk_font(15), fill=(234, 88, 12))
    if caption:
        d.text((pad, header + h + 24), caption, font=_cjk_font(13), fill=(107, 114, 128))
    out_png.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_png)
    return True


def render_slide_diff_png(
    before_pptx: Path, after_pptx: Path, slide: int, out_png: Path, caption: str = ""
) -> bool:
    """Render slide ``slide`` of both decks and compose a side-by-side PNG."""
    if backend() is None:
        return False
    with tempfile.TemporaryDirectory() as tmp:
        bp = Path(tmp) / "before.png"
        ap = Path(tmp) / "after.png"
        if not render_slide_png(before_pptx, slide, bp) or not render_slide_png(after_pptx, slide, ap):
            return False
        return compose_side_by_side(bp, ap, out_png, caption)


def render_slide_diff_gif(
    before_pptx: Path, after_pptx: Path, slide: int, out_gif: Path, caption: str = ""
) -> bool:
    """Render slide ``slide`` of both decks into a 2-state before→after GIF."""
    from PIL import Image

    if backend() is None:
        return False
    with tempfile.TemporaryDirectory() as tmp:
        bp = Path(tmp) / "before.png"
        ap = Path(tmp) / "after.png"
        if not render_slide_png(before_pptx, slide, bp) or not render_slide_png(after_pptx, slide, ap):
            return False
        # Reuse the compositor layout for each frame (label-only difference).
        comp_b = Path(tmp) / "comp_b.png"
        comp_a = Path(tmp) / "comp_a.png"
        if not compose_side_by_side(bp, ap, comp_b, caption) or not compose_side_by_side(bp, ap, comp_a, caption):
            return False
        frames = [Image.open(comp_b).convert("P", palette=Image.ADAPTIVE, colors=128)]
        frames.append(Image.open(comp_a).convert("P", palette=Image.ADAPTIVE, colors=128))
        out_gif.parent.mkdir(parents=True, exist_ok=True)
        frames[0].save(out_gif, save_all=True, append_images=frames[1:], duration=[1200, 1500], loop=0, disposal=2)
        return True
