"""Kimi browser-side PPTX exporter (opt-in backend)."""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from typing import Any

from upm.adapters.kimi.healthcheck import kimi_healthcheck
from upm.adapters.kimi.protocol import (
    HOST_HTML,
    BrowserSession,
    build_payload,
    ensure_agent_browser,
    find_download,
    find_manifest,
    patch_transitions,
    ref_by_name,
    serve,
    switch_state,
    verify_output,
    wait_for_export_dialog,
)
from upm.errors import ExportError
from upm.export.base import ExportResult


def export_kimi(
    project_dir: str | Path,
    output: str | Path | None = None,
    *,
    transition: str = "fade",
    mode: str = "standard",
    force: bool = False,
    embed_fonts: bool = True,
    keep_download: bool = False,
) -> ExportResult:
    project = Path(project_dir).expanduser().resolve()
    manifest = find_manifest(project)
    payload = build_payload(manifest)
    if output is None:
        output = project / "exports" / f"{project.name}.pptx"
    output = Path(output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists() and not force:
        raise ExportError(f"输出已存在（--force 覆盖）：{output}")
    agent_browser = ensure_agent_browser()

    with tempfile.TemporaryDirectory(prefix="upm-kimi-export-") as temp_name:
        temp_dir = Path(temp_name)
        download_dir = temp_dir / "downloads"
        download_dir.mkdir()
        (temp_dir / "export_host.html").write_text(HOST_HTML, encoding="utf-8")
        (temp_dir / "payload.json").write_text(
            __import__("json").dumps(payload, ensure_ascii=False),
            encoding="utf-8",
        )
        server, thread, url = serve(temp_dir)
        session = f"upm-kimi-export-{__import__('os').getpid()}-{payload['id'][-8:]}"
        browser = BrowserSession(agent_browser, session, temp_dir, download_dir)
        try:
            browser.open(url)
            browser.run(["wait", "--fn", 'document.documentElement.dataset.deckStatus === "ready"'], timeout=120)
            browser.run(["set", "viewport", "1280", "720"])
            snapshot = browser.snapshot()
            export_ref = ref_by_name(snapshot, "导出", "button")
            browser.run(["click", f"@{export_ref}"])
            dialog = wait_for_export_dialog(browser)
            state = switch_state(dialog)
            if state is not None:
                switch_ref, checked, disabled = state
                if disabled and checked != embed_fonts:
                    pass  # official switch disabled for this deck
                elif checked != embed_fonts:
                    browser.run(["click", f"@{switch_ref}"])
                    dialog = wait_for_export_dialog(browser)
            download_ref = ref_by_name(dialog, "下载", "button")
            result = browser.run(
                ["download", f"@{download_ref}", str(temp_dir / "browser-output.pptx")],
                timeout=180,
                check=False,
            )
            if result.returncode != 0:
                pass  # fall through to download scanning
            downloaded = find_download((download_dir, temp_dir), timeout=120)
            shutil.copy2(downloaded, output)
            if keep_download:
                shutil.copy2(downloaded, output.with_name(f"{output.stem}.browser-raw.pptx"))
        finally:
            browser.close()
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    patch_transitions(output, transition)
    summary = verify_output(output, transition, embed_fonts)
    return ExportResult(
        output=output,
        backend="kimi",
        slides=summary["slides"],
        verified=True,
        bytes=output.stat().st_size,
        transition=transition,
        font_parts=summary["fonts"],
        warnings=[
            "Kimi 公共编辑器为逆向兼容协议，可能随官方前端更新失效；如失败请使用本地后端（默认）。"
        ],
        meta={"mode": mode, "adapter": "kimi-public-editor"},
    )


def kimi_healthcheck_export() -> dict[str, Any]:
    return kimi_healthcheck()
