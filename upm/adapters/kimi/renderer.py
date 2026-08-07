"""Kimi browser-side page-image renderer (opt-in QA backend)."""

from __future__ import annotations

import json
import os
import re
import shutil
import sys
import tempfile
import time
import zipfile
from pathlib import Path
from typing import Any

from upm.adapters.kimi.protocol import (
    HOST_HTML,
    OOPIF_URL_HINT,
    BrowserSession,
    build_payload,
    configure_downloads,
    ensure_agent_browser,
    find_download,
    is_image_zip,
    ref_by_name,
    serve,
    wait_for_export_dialog,
)
from upm.errors import AdapterProtocolError, AdapterUnavailableError, ExportError
from upm.pptd.io import find_manifest
from upm.qa.contact_sheet import stitch_overview

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}

IMAGE_FORMAT_CLICK_JS = """
(() => {
  const items = [...document.querySelectorAll('.radio-group-item')];
  const pool = items.length
    ? items
    : [...document.querySelectorAll('div,span,label,button')].filter(
        (el) => el.children.length === 0
      );
  const target = pool.find((el) => el.textContent.trim() === '图片');
  if (!target) return null;
  target.click();
  return 'clicked';
})()
""".strip()
ACTIVE_FORMAT_JS = """
(() => {
  const active = document.querySelector('.radio-group-item.active');
  return active ? active.textContent.trim() : null;
})()
""".strip()


def _ensure_websocket() -> Any:
    try:
        import websocket

        return websocket
    except ImportError as exc:
        raise AdapterUnavailableError(
            "Kimi 图片导出需要 websocket-client（CDP 对话框自动化）。",
            hint="显式安装：.venv/bin/pip install websocket-client（bootstrap --profile kimi）。",
        ) from exc


def _browser_cdp_url(browser: BrowserSession) -> str:
    process = browser.run(["get", "cdp-url"], timeout=30)
    match = re.search(r"ws://\S+", process.stdout)
    if not match:
        raise AdapterProtocolError(f"无法获取 CDP URL：\n{process.stdout[-500:]}")
    return match.group(0)


def _evaluate_in_iframe(cdp_url: str, url_hint: str, expression: str) -> Any:
    websocket = _ensure_websocket()

    def call(socket: Any, request_id: int, method: str, params: dict[str, Any]) -> dict[str, Any]:
        socket.send(json.dumps({"id": request_id, "method": method, "params": params}))
        while True:
            message = json.loads(socket.recv())
            if message.get("id") != request_id:
                continue
            if "error" in message:
                raise AdapterProtocolError(f"CDP {method} 失败：{message['error']}")
            return message.get("result", {})

    proxy_env = ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy", "ALL_PROXY")
    saved_proxy = {name: os.environ.pop(name) for name in proxy_env if name in os.environ}
    try:
        socket = websocket.create_connection(cdp_url, timeout=30, suppress_origin=True)
    finally:
        os.environ.update(saved_proxy)
    try:
        targets = call(socket, 1, "Target.getTargets", {}).get("targetInfos", [])
        target = next((item for item in targets if url_hint in str(item.get("url", ""))), None)
        if target is None:
            visible = ", ".join(f"{item.get('type')}:{str(item.get('url', ''))[:80]}" for item in targets)
            raise AdapterProtocolError(f"没有匹配 {url_hint!r} 的浏览器目标；观察到：{visible}")
        attached = call(socket, 2, "Target.attachToTarget", {"targetId": target["targetId"], "flatten": True})
        session_id = attached["sessionId"]
        socket.send(
            json.dumps(
                {
                    "id": 3,
                    "sessionId": session_id,
                    "method": "Runtime.evaluate",
                    "params": {"expression": expression, "returnByValue": True},
                }
            )
        )
        while True:
            message = json.loads(socket.recv())
            if message.get("id") != 3:
                continue
            if "error" in message:
                raise AdapterProtocolError(f"iframe Runtime.evaluate 失败：{message['error']}")
            result = message.get("result", {})
            if result.get("exceptionDetails"):
                raise AdapterProtocolError(f"iframe 脚本失败：{result['exceptionDetails'].get('text')}")
            return result.get("result", {}).get("value")
    finally:
        socket.close()


def _select_image_format(browser: BrowserSession) -> None:
    cdp_url = _browser_cdp_url(browser)
    value = _evaluate_in_iframe(cdp_url, OOPIF_URL_HINT, IMAGE_FORMAT_CLICK_JS)
    if value != "clicked":
        raise AdapterProtocolError("导出对话框中找不到“图片”选项（Kimi 前端可能已变更）")
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        active = _evaluate_in_iframe(cdp_url, OOPIF_URL_HINT, ACTIVE_FORMAT_JS)
        if active == "图片":
            return
        time.sleep(0.3)
    raise AdapterProtocolError(f"图片格式未激活；当前选项：{active!r}")


def _page_sort_key(path: Path) -> tuple[int, str]:
    match = re.match(r"(\d+)", path.stem)
    return (int(match.group(1)) if match else sys.maxsize, path.name)


def _unzip_images(archive_path: Path, pages_dir: Path) -> list[Path]:
    pages_dir.mkdir(parents=True, exist_ok=True)
    images: list[Path] = []
    with zipfile.ZipFile(archive_path) as archive:
        for info in archive.infolist():
            if info.is_dir() or Path(info.filename).suffix.lower() not in IMAGE_SUFFIXES:
                continue
            target = pages_dir / Path(info.filename).name
            with archive.open(info) as source, target.open("wb") as out:
                shutil.copyfileobj(source, out)
            images.append(target)
    images.sort(key=_page_sort_key)
    if not images:
        raise ExportError(f"图片 ZIP 中没有图片：{archive_path}")
    return images


def export_kimi_images(
    project_dir: str | Path,
    output_dir: str | Path | None = None,
    *,
    force: bool = False,
    keep_download: bool = False,
) -> dict[str, Any]:
    project = Path(project_dir).expanduser().resolve()
    manifest = find_manifest(project)
    payload = build_payload(manifest)
    output = Path(output_dir or project / ".upm" / "renders" / "kimi").expanduser().resolve()
    if output.exists() and any(output.iterdir()) and not force:
        raise ExportError(f"输出目录已存在（--force 覆盖）：{output}")
    agent_browser = ensure_agent_browser()
    with tempfile.TemporaryDirectory(prefix="upm-kimi-images-") as temp_name:
        temp_dir = Path(temp_name)
        download_dir = temp_dir / "downloads"
        download_dir.mkdir()
        (temp_dir / "export_host.html").write_text(HOST_HTML, encoding="utf-8")
        (temp_dir / "payload.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        server, thread, url = serve(temp_dir)
        session = f"upm-kimi-images-{os.getpid()}-{payload['id'][-8:]}"
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
            _select_image_format(browser)
            dialog = wait_for_export_dialog(browser)
            download_ref = ref_by_name(dialog, "下载", "button")
            browser.run(["click", f"@{download_ref}"], timeout=60)
            downloaded = find_download((download_dir, temp_dir), timeout=240, accept=is_image_zip)
        finally:
            browser.close()
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
        if output.exists():
            shutil.rmtree(output)
        output.mkdir(parents=True)
        images = _unzip_images(downloaded, output / "pages")
        if keep_download:
            shutil.copy2(downloaded, output / "browser-raw.zip")
        overview = stitch_overview(images, output / "overview.jpg")
    page_paths = [entry["path"] for entry in payload["pages"]]
    mapping = [
        {
            "index": index,
            "image": f"pages/{path.name}",
            "page": page_paths[index - 1] if index - 1 < len(page_paths) else None,
        }
        for index, path in enumerate(images, start=1)
    ]
    return {
        "backend": "kimi",
        "pages": len(images),
        "overview": str(overview),
        "output": str(output),
        "images": mapping,
    }
