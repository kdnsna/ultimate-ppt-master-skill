"""Local PPTD -> PPTX exporter (default backend).

Chain: PPTD -> deterministic SVG -> existing SVG->DrawingML native-shape engine
(scripts/svg_to_pptx). Everything runs locally; tables and charts become
editable DrawingML shapes (not native a:tbl/chart data objects).
"""

from __future__ import annotations

import importlib
import importlib.util
import shutil
import sys
import zipfile
from pathlib import Path
from typing import Any

from upm.errors import AdapterUnavailableError, ExportError
from upm.export.base import ExportResult, healthcheck_shape
from upm.pptd.io import load_project
from upm.render.svg import render_page_svg

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT / "scripts"
PPTX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
)


def local_healthcheck() -> dict[str, Any]:
    try:
        import pptx  # noqa: F401

        pptx_ok = True
    except ImportError:
        pptx_ok = False
    return healthcheck_shape(
        "local",
        pptx_ok,
        "本地导出需要 python-pptx（bootstrap --profile core/pptx）" if not pptx_ok else "可用",
        required=["python-pptx"],
    )


def _load_builder():
    if str(SCRIPTS_DIR) not in sys.path:
        sys.path.insert(0, str(SCRIPTS_DIR))
    try:
        from svg_to_pptx.pptx_builder import create_pptx_with_native_svg  # type: ignore

        return create_pptx_with_native_svg
    except ImportError as exc:
        raise AdapterUnavailableError(
            "本地导出引擎不可用（svg_to_pptx 无法导入）。",
            hint="运行 bash scripts/bootstrap.sh --profile pptx 后重试。",
        ) from exc


def render_project_svgs(project_dir: Path) -> tuple[list[Path], dict[str, str]]:
    """Render every page to .upm/intermediate/svg and return (svgs, notes)."""
    svg_dir = project_dir / ".upm" / "intermediate" / "svg"
    if svg_dir.exists():
        shutil.rmtree(svg_dir)
    svg_dir.mkdir(parents=True, exist_ok=True)
    root, manifest, pages = load_project(project_dir)
    theme = manifest.get("theme") or {}
    svg_files: list[Path] = []
    notes: dict[str, str] = {}
    for index, (relative, page) in enumerate(pages, start=1):
        stem = f"{index:02d}_page"
        svg = render_page_svg(page, theme, href_prefix="../../../")
        target = svg_dir / f"{stem}.svg"
        target.write_text(svg, encoding="utf-8")
        svg_files.append(target)
        notes[stem] = str(page.get("notes") or "")
    return svg_files, notes


def verify_pptx(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise ExportError(f"导出文件不存在：{path}")
    try:
        with zipfile.ZipFile(path) as archive:
            broken = archive.testzip()
            if broken:
                raise ExportError(f"PPTX CRC 校验失败：{broken}")
            names = archive.namelist()
            if "ppt/presentation.xml" not in names:
                raise ExportError("PPTX 缺少 ppt/presentation.xml")
            slides = [name for name in names if name.startswith("ppt/slides/slide") and name.endswith(".xml")]
            content_types = archive.read("[Content_Types].xml").decode("utf-8", errors="replace")
            if PPTX_CONTENT_TYPE not in content_types:
                raise ExportError("[Content_Types].xml 缺少 presentation 主内容类型")
            fonts = [name for name in names if name.startswith("ppt/fonts/") and not name.endswith("/")]
    except zipfile.BadZipFile as exc:
        raise ExportError(f"输出不是有效的 PPTX ZIP：{path}") from exc
    return {"slides": len(slides), "fonts": len(fonts)}


def export_local(
    project_dir: str | Path,
    output: str | Path | None = None,
    *,
    transition: str = "fade",
    mode: str = "standard",
    force: bool = True,
) -> ExportResult:
    project = Path(project_dir).expanduser().resolve()
    if output is None:
        output = project / "exports" / f"{project.name}.pptx"
    output = Path(output).expanduser().resolve()
    if output.exists() and not force:
        raise ExportError(f"输出已存在（--force 覆盖）：{output}")
    output.parent.mkdir(parents=True, exist_ok=True)

    svg_files, notes = render_project_svgs(project)
    create_pptx = _load_builder()
    try:
        ok = create_pptx(
            svg_files=svg_files,
            output_path=output,
            canvas_format="ppt169",
            use_native_shapes=True,
            use_compat_mode=False,
            notes=notes,
            transition=transition,
            merge_paragraphs=True,
            verbose=False,
        )
    except Exception as exc:
        raise ExportError(f"本地 PPTX 导出失败：{exc}") from exc
    if not ok:
        raise ExportError("本地导出引擎返回失败（未生成 PPTX）。")
    summary = verify_pptx(output)
    warnings: list[str] = []
    if not importlib.util.find_spec("svglib"):
        warnings.append("未安装 svglib/reportlab：输出为原生可编辑对象（Office 2019+），无 PNG 兼容层。")
    return ExportResult(
        output=output,
        backend="local",
        slides=summary["slides"],
        verified=True,
        bytes=output.stat().st_size,
        transition=transition,
        font_parts=summary["fonts"],
        warnings=warnings,
        meta={"mode": mode, "svgFiles": len(svg_files)},
    )
