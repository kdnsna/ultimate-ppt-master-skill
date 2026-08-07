"""Optional final-PPTX render probe via LibreOffice / soffice."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any


def find_soffice() -> str | None:
    for name in ("soffice", "libreoffice"):
        path = shutil.which(name)
        if path:
            return path
    return None


def probe_pptx_office_render(pptx_path: str | Path, *, timeout: int = 120) -> dict[str, Any]:
    """Convert PPTX to PDF with LibreOffice when available.

    Returns a record with status in {ok, fail, not-run}.
    """
    path = Path(pptx_path).expanduser().resolve()
    if not path.is_file():
        return {"status": "fail", "error": f"PPTX 不存在：{path}", "tool": None}
    tool = find_soffice()
    if not tool:
        return {
            "status": "not-run",
            "error": None,
            "tool": None,
            "message": "未安装 soffice/libreoffice；最终 Office 渲染未验证",
        }
    with tempfile.TemporaryDirectory(prefix="upm-office-") as tmp:
        out_dir = Path(tmp)
        try:
            process = subprocess.run(
                [
                    tool,
                    "--headless",
                    "--nologo",
                    "--nolockcheck",
                    "--nodefault",
                    "--norestore",
                    "--convert-to",
                    "pdf",
                    "--outdir",
                    str(out_dir),
                    str(path),
                ],
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except (OSError, subprocess.TimeoutExpired) as exc:
            return {
                "status": "fail",
                "tool": tool,
                "error": f"{type(exc).__name__}: {exc}",
            }
        pdfs = list(out_dir.glob("*.pdf"))
        if process.returncode == 0 and pdfs and pdfs[0].stat().st_size > 0:
            return {
                "status": "ok",
                "tool": tool,
                "pdfBytes": pdfs[0].stat().st_size,
                "message": "LibreOffice headless PPTX→PDF 成功",
            }
        detail = (process.stderr or process.stdout or "")[-500:]
        return {
            "status": "fail",
            "tool": tool,
            "error": f"convert failed rc={process.returncode}: {detail}",
        }
