"""Kimi browser-side PPTX exporter (opt-in backend)."""

from __future__ import annotations

import base64
import shutil
import tempfile
import time
from pathlib import Path
from typing import Any

from upm.adapters.kimi.healthcheck import kimi_healthcheck
from upm.adapters.kimi.protocol import (
    HOST_HTML,
    BrowserSession,
    build_payload,
    click_iframe_button,
    configure_downloads,
    ensure_agent_browser,
    install_host_save_picker_stub,
    install_save_picker_stub,
    patch_transitions,
    ref_by_name,
    retrieve_host_saved_file,
    retrieve_saved_file,
    serve,
    switch_state,
    verify_output,
    wait_for_export_dialog,
)
from upm.errors import ExportError
from upm.export.base import ExportResult
from upm.pptd.io import find_manifest


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
            configure_downloads(browser, download_dir)
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
            install_save_picker_stub(browser)
            install_host_save_picker_stub(browser)
            if not click_iframe_button(browser, "下载"):
                browser.run(["click", f"@{download_ref}"], timeout=60)
            # Kimi delivers the PPTX through showSaveFilePicker (File System
            # Access API). Our injected stub captures the bytes; fall back to
            # scanning the CDP download directory.
            payload_bytes = None
            downloaded = None
            deadline = time.monotonic() + 600
            while time.monotonic() < deadline:
                saved = retrieve_saved_file(browser)
                if not saved or saved.startswith("{"):
                    saved = retrieve_host_saved_file(browser)
                if saved and not saved.startswith("{"):
                    try:
                        decoded = base64.b64decode(saved)
                        if decoded[:2] == b"PK":
                            payload_bytes = decoded
                            break
                    except (ValueError, TypeError):
                        # Invalid base64 from the page probe; keep polling.
                        continue
                candidates = [
                    p for p in list(download_dir.rglob("*.pptx")) + list(temp_dir.glob("*.pptx"))
                    if p.name.endswith(".pptx") and not p.name.endswith(".crdownload")
                ]
                if candidates:
                    downloaded = max(candidates, key=lambda p: p.stat().st_mtime)
                    break
                time.sleep(3)
            if payload_bytes is not None:
                output.write_bytes(payload_bytes)
            elif downloaded is not None:
                shutil.copy2(downloaded, output)
            else:
                raise ExportError("Kimi 导出完成但未获得 PPTX 文件（保存通道捕获失败）。")
            if keep_download:
                if payload_bytes is not None:
                    output.with_name(f"{output.stem}.browser-raw.pptx").write_bytes(payload_bytes)
                elif downloaded is not None:
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
