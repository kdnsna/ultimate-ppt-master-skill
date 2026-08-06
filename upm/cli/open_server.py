"""`upm open`: localhost PPTD visual editor (binds 127.0.0.1 only).

The editor browses the project, previews pages as deterministic SVG, edits
``.pptd``/``.page`` YAML, re-validates before saving, re-exports PPTX and
shows QA results. Path writes are restricted to project-relative .pptd/.page.
"""

from __future__ import annotations

import json
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import yaml

from upm.errors import PathSafetyError
from upm.paths import assert_writable, normalize_relative_path
from upm.pptd.io import load_project, write_yaml
from upm.render.svg import render_page_svg


EDITOR_HTML = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>UPM PPTD 视觉精修</title>
<style>
*{box-sizing:border-box} body{margin:0;font:14px/1.5 -apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#101216;color:#E7E9ED}
header{padding:12px 20px;background:#1A1D23;border-bottom:1px solid #2A2E36;display:flex;gap:12px;align-items:center}
header h1{font-size:15px;margin:0;font-weight:600} .pill{padding:2px 10px;border-radius:99px;background:#232832;font-size:12px}
main{display:grid;grid-template-columns:240px 1fr 1fr;height:calc(100vh - 49px)}
nav{border-right:1px solid #2A2E36;overflow:auto;padding:8px}
nav button{display:block;width:100%;text-align:left;padding:8px 10px;border:0;background:none;color:#C9CED6;cursor:pointer;border-radius:6px;font-size:13px}
nav button:hover{background:#232832} nav button.active{background:#2B3A67;color:#fff}
section{border-right:1px solid #2A2E36;display:flex;flex-direction:column}
iframe{flex:1;border:0;background:#fff}
textarea{flex:1;border:0;background:#14171C;color:#D7DBE1;padding:14px;font:12px/1.5 'SF Mono',Menlo,monospace;resize:none;outline:none}
.bar{padding:8px 12px;border-bottom:1px solid #2A2E36;display:flex;gap:8px;align-items:center}
button.action{background:#2B5BD7;color:#fff;border:0;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px}
button.secondary{background:#232832;color:#C9CED6;border:1px solid #333A45;padding:6px 12px;border-radius:6px;cursor:pointer}
#status{margin-left:auto;font-size:12px;color:#8A919E}
#qa{margin:0;padding:12px;overflow:auto;font-size:12px;color:#C9CED6;background:#0D0F12;white-space:pre-wrap}
</style></head><body>
<header><h1>PPTD 视觉精修</h1><span class="pill" id="project-name">-</span><span id="status">加载中</span></header>
<main>
<nav id="pages"></nav>
<section><div class="bar"><button class="secondary" id="refresh">刷新预览</button><button class="action" id="save">保存</button><button class="action" id="export">导出 PPTX</button><button class="secondary" id="qa">重新审计</button></div>
<iframe id="preview"></iframe></section>
<section><div class="bar"><span>pages/… 或 deck.pptd（仅允许工程内相对路径）</span></div><textarea id="editor" spellcheck="false"></textarea>
<pre id="qa"></pre></section>
</main>
<script>
let current = "";
const pagesNav = document.querySelector("#pages");
const editor = document.querySelector("#editor");
const preview = document.querySelector("#preview");
const statusEl = document.querySelector("#status");
const qaEl = document.querySelector("#qa");
async function api(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
  return data;
}
async function load() {
  const project = await api("/api/project");
  document.querySelector("#project-name").textContent = project.title;
  pagesNav.replaceChildren();
  for (const page of project.pages) {
    const button = document.createElement("button");
    button.textContent = page.path;
    button.onclick = () => openPage(page.path);
    pagesNav.append(button);
  }
  const manifest = document.createElement("button");
  manifest.textContent = "deck.pptd";
  manifest.onclick = () => openPage("deck.pptd");
  pagesNav.prepend(manifest);
  if (project.pages.length) openPage(project.pages[0].path);
  statusEl.textContent = "已加载 " + project.pages.length + " 页";
}
async function openPage(path) {
  current = path;
  [...pagesNav.children].forEach((b) => b.classList.toggle("active", b.textContent === path));
  const data = await api("/api/page?path=" + encodeURIComponent(path));
  editor.value = data.content;
  preview.src = "/api/svg?path=" + encodeURIComponent(path);
}
async function save() {
  try {
    await api("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: current, content: editor.value }) });
    statusEl.textContent = "已保存 " + current;
    preview.src = "/api/svg?path=" + encodeURIComponent(current) + "&_=" + Date.now();
  } catch (error) { statusEl.textContent = "保存失败：" + error.message; }
}
async function exportPptx() {
  statusEl.textContent = "正在导出（本地引擎）…";
  try {
    const data = await api("/api/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    statusEl.textContent = "导出完成：" + data.output;
    await showQa();
  } catch (error) { statusEl.textContent = "导出失败：" + error.message; }
}
async function showQa() {
  try {
    const data = await api("/api/qa");
    qaEl.textContent = JSON.stringify(data, null, 2);
  } catch (error) { qaEl.textContent = "审计不可用：" + error.message; }
}
document.querySelector("#save").onclick = save;
document.querySelector("#export").onclick = exportPptx;
document.querySelector("#qa").onclick = showQa;
document.querySelector("#refresh").onclick = () => { preview.src = "/api/svg?path=" + encodeURIComponent(current) + "&_=" + Date.now(); };
load();
</script></body></html>
"""


class EditorHandler(BaseHTTPRequestHandler):
    server_version = "UPMEditor/1.0"

    def log_message(self, _format: str, *args: Any) -> None:
        return

    def _json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _html(self, body: bytes) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self._html(EDITOR_HTML.encode("utf-8"))
            return
        if parsed.path == "/api/project":
            self._json(200, self.server.project_payload())  # type: ignore[attr-defined]
            return
        if parsed.path == "/api/page":
            path = parse_qs(parsed.query).get("path", [""])[0]
            try:
                normalized = normalize_relative_path(path)
                content = (self.server.project / normalized).read_text(encoding="utf-8")  # type: ignore[attr-defined]
                self._json(200, {"path": normalized, "content": content})
            except (PathSafetyError, OSError) as exc:
                self._json(404, {"error": str(exc)})
            return
        if parsed.path == "/api/svg":
            path = parse_qs(parsed.query).get("path", [""])[0]
            try:
                normalized = normalize_relative_path(path)
                root, manifest, pages = load_project(self.server.project)  # type: ignore[attr-defined]
                theme = manifest.get("theme") or {}
                if normalized == "deck.pptd":
                    page_data = pages[0][1] if pages else {"elements": []}
                else:
                    page_data = next((page for rel, page in pages if rel == normalized), None)
                if page_data is None:
                    self._json(404, {"error": f"页面不存在：{normalized}"})
                    return
                svg = render_page_svg(page_data, theme, href_prefix="/api/media?path=")
                body = svg.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "image/svg+xml; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
            except (PathSafetyError, OSError) as exc:
                self._json(404, {"error": str(exc)})
            return
        if parsed.path == "/api/media":
            path = parse_qs(parsed.query).get("path", [""])[0]
            try:
                from upm.pptd.paths import validate_element_src

                normalized = validate_element_src(path)
                media_path = (self.server.project / normalized).resolve()  # type: ignore[attr-defined]
                if not media_path.is_file() or not media_path.is_relative_to(self.server.project.resolve()):  # type: ignore[attr-defined]
                    self._json(404, {"error": "媒体文件不存在"})
                    return
                body = media_path.read_bytes()
                content_type = {
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".gif": "image/gif",
                    ".svg": "image/svg+xml",
                    ".webp": "image/webp",
                }.get(media_path.suffix.lower(), "application/octet-stream")
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
            except (PathSafetyError, OSError) as exc:
                self._json(404, {"error": str(exc)})
            return
        if parsed.path == "/api/qa":
            report = self.server.project / ".upm" / "quality-report.json"  # type: ignore[attr-defined]
            if report.is_file():
                self._json(200, json.loads(report.read_text(encoding="utf-8")))
            else:
                self._json(404, {"error": "尚无质量报告，先导出或运行 upm review"})
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"error": "请求体不是 JSON"})
            return
        if parsed.path == "/api/save":
            path = str(payload.get("path") or "")
            content = str(payload.get("content") or "")
            try:
                normalized = assert_writable(path)
                parsed_yaml = yaml.safe_load(content)
                if not isinstance(parsed_yaml, dict):
                    self._json(400, {"error": "YAML 顶层必须是映射对象"})
                    return
                target = self.server.project / normalized  # type: ignore[attr-defined]
                if not target.resolve().is_relative_to(self.server.project.resolve()):  # type: ignore[attr-defined]
                    self._json(403, {"error": "路径越界"})
                    return
                write_yaml(target, parsed_yaml)
                self._json(200, {"ok": True, "path": normalized})
            except (PathSafetyError, Exception) as exc:  # noqa: BLE001
                self._json(400, {"error": str(exc)})
            return
        if parsed.path == "/api/export":
            try:
                from upm.export.registry import export_pptx

                result = export_pptx(self.server.project, backend="local", force=True)  # type: ignore[attr-defined]
                self._json(200, {"ok": True, "output": str(result.output), "slides": result.slides})
            except Exception as exc:  # noqa: BLE001
                self._json(500, {"error": str(exc)})
            return
        self._json(404, {"error": "not found"})


class EditorServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address: tuple[str, int], project: Path) -> None:
        super().__init__(address, EditorHandler)
        self.project = project.resolve()

    def project_payload(self) -> dict[str, Any]:
        root, manifest, pages = load_project(self.project)
        return {
            "title": str(manifest.get("title") or root.name),
            "size": manifest.get("size"),
            "pages": [{"path": relative, "pageType": page.get("pageType"), "role": (page.get("upm") or {}).get("role")} for relative, page in pages],
        }


def run_open(args: Any) -> int:
    project = Path(args.project).expanduser().resolve()
    if not (project / "deck.pptd").is_file():
        from upm.errors import ProjectError

        raise ProjectError(f"不是 PPTD 项目：{project}")
    server = EditorServer(("127.0.0.1", args.port), project)
    host, port = server.server_address
    url = f"http://127.0.0.1:{port}/"
    print(f"UPM PPTD 视觉精修：{url}")
    print(f"项目：{project}")
    print("按 Ctrl+C 停止服务。")
    if not args.no_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0
