"""Page image rendering with replaceable backends.

Preferred: Playwright (Chromium). Fallback: agent-browser CLI. When neither is
available, SVG pages are still produced and render records mark the gap so the
quality report never claims visual evidence that does not exist.
"""

from __future__ import annotations

import importlib.util
import shutil
import subprocess
from pathlib import Path
from typing import Any

from upm.qa.contact_sheet import stitch_overview

# Process-level cache: True/False once probed; None = not yet.
_PLAYWRIGHT_READY: bool | None = None


def _render_svgs(project: Path) -> list[Path]:
    svg_dir = project / ".upm" / "intermediate" / "svg"
    if svg_dir.is_dir() and any(svg_dir.glob("*.svg")):
        return sorted(svg_dir.glob("*.svg"))
    # Render on demand into the standard intermediate location.
    from upm.export.local import render_project_svgs

    render_project_svgs(project)
    return sorted(svg_dir.glob("*.svg"))


def _playwright_available() -> bool:
    """True only when playwright is importable AND Chromium can launch."""
    global _PLAYWRIGHT_READY
    if _PLAYWRIGHT_READY is not None:
        return _PLAYWRIGHT_READY
    if importlib.util.find_spec("playwright") is None:
        _PLAYWRIGHT_READY = False
        return False
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.launch()
            browser.close()
        _PLAYWRIGHT_READY = True
    except Exception:  # noqa: BLE001 — any launch failure means unavailable
        _PLAYWRIGHT_READY = False
    return _PLAYWRIGHT_READY


def _no_renderer_records(svg_files: list[Path], detail: str) -> list[dict[str, Any]]:
    return [
        {
            "page": svg.stem,
            "ok": False,
            "error": f"no-renderer: {detail}",
        }
        for svg in svg_files
    ]


def _render_with_playwright(svg_files: list[Path], output_dir: Path) -> list[dict[str, Any]]:
    from playwright.sync_api import sync_playwright

    records: list[dict[str, Any]] = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(viewport={"width": 960, "height": 540})
            for svg in svg_files:
                rec: dict[str, Any] = {"page": svg.stem, "ok": False}
                try:
                    page = context.new_page()
                    page.goto(svg.resolve().as_uri(), wait_until="domcontentloaded")
                    page.wait_for_timeout(120)
                    target = output_dir / f"{svg.stem}.png"
                    page.screenshot(path=str(target), full_page=False)
                    page.close()
                    rec.update(ok=True, path=str(target), bytes=target.stat().st_size)
                except Exception as exc:  # noqa: BLE001
                    rec["error"] = f"{type(exc).__name__}: {exc}"
                records.append(rec)
        finally:
            browser.close()
    return records


def _render_with_agent_browser(svg_files: list[Path], output_dir: Path) -> list[dict[str, Any]]:
    executable = shutil.which("agent-browser")
    if not executable:
        return _no_renderer_records(svg_files, "缺少可用的 Playwright Chromium 与 agent-browser")
    records: list[dict[str, Any]] = []
    for svg in svg_files:
        rec: dict[str, Any] = {"page": svg.stem, "ok": False}
        try:
            subprocess.run([executable, "open", svg.resolve().as_uri()], check=True, timeout=60)
            subprocess.run([executable, "set", "viewport", "960", "540"], check=True, timeout=20)
            target = output_dir / f"{svg.stem}.png"
            subprocess.run([executable, "screenshot", str(target)], check=True, timeout=30)
            rec.update(ok=True, path=str(target), bytes=target.stat().st_size)
        except Exception as exc:  # noqa: BLE001
            rec["error"] = f"{type(exc).__name__}: {exc}"
        records.append(rec)
    return records


def render_pages_local(project: str | Path) -> list[dict[str, Any]]:
    """Render all pages to <project>/preview/pages/*.png and build overview.jpg."""
    project_path = Path(project).expanduser().resolve()
    svg_files = _render_svgs(project_path)
    preview_dir = project_path / "preview"
    pages_dir = preview_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    for old in pages_dir.glob("*.png"):
        old.unlink()
    if not svg_files:
        return []
    records: list[dict[str, Any]]
    if _playwright_available():
        try:
            records = _render_with_playwright(svg_files, pages_dir)
        except Exception as exc:  # noqa: BLE001 — fall back to agent-browser
            records = _render_with_agent_browser(svg_files, pages_dir)
            if all(not rec.get("ok") for rec in records):
                # Prefer explicit no-renderer if agent-browser also missing.
                if records and str(records[0].get("error", "")).startswith("no-renderer"):
                    pass
                else:
                    records = _no_renderer_records(
                        svg_files, f"Playwright 启动失败且 agent-browser 不可用（{type(exc).__name__}: {exc}）"
                    )
    else:
        records = _render_with_agent_browser(svg_files, pages_dir)
    rendered = [rec for rec in records if rec.get("ok")]
    if rendered:
        images = [Path(rec["path"]) for rec in rendered]
        stitch_overview(images, preview_dir / "overview.jpg")
    return records
