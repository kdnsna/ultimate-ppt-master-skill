"""Kimi protocol surface (versioned by manifest.json) and browser helpers."""

from __future__ import annotations

import base64
import json
import os
import re
import shutil
import subprocess
import threading
import time
import uuid
import zipfile
from collections.abc import Callable, Iterable, Sequence
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import yaml

from upm.errors import AdapterProtocolError, AdapterUnavailableError, ExportError
from upm.paths import normalize_relative_path

MANIFEST = json.loads((Path(__file__).with_name("manifest.json")).read_text(encoding="utf-8"))
EDITOR_ORIGIN = MANIFEST["editor"]["origin"]
PENPAL_MODULE = MANIFEST["editor"]["penpalModule"]
OOPIF_URL_HINT = MANIFEST["exportDialog"]["oopifUrlHint"]
MIN_AGENT_BROWSER = tuple(int(part) for part in MANIFEST["minAgentBrowser"].split("."))

PPTX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
)
FADE_TRANSITION_XML = '<p:transition spd="fast" advClick="1"><p:fade/></p:transition>'
IMAGE_MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml"}
MAX_IMAGE_BYTES = 20 * 1024 * 1024
MAX_EMBEDDED_MEDIA_BYTES = 200 * 1024 * 1024


HOST_HTML = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"/><title>UPM Kimi Export Host</title>
<style>html,body,iframe{width:100%;height:100%;margin:0;border:0}#status{position:fixed;z-index:10;top:8px;left:50%;transform:translateX(-50%);padding:4px 10px;border-radius:6px;background:rgba(0,0,0,.72);color:white;font:12px/1.5 system-ui;pointer-events:none}</style>
</head><body><div id="status">starting</div><iframe id="editor" allow="fullscreen; clipboard-read; clipboard-write"></iframe>
<script type="module">
import { i as connect, r as WindowMessenger } from "%PENPAL%";
const status = document.querySelector("#status");
const frame = document.querySelector("#editor");
const setStatus = (v) => { status.textContent = v; document.documentElement.dataset.deckStatus = v; };
const normalizePath = (v) => {
  if (typeof v !== "string") return "";
  if (/^(?:data:image\\/|https?:\\/\\/|blob:)/i.test(v)) return v;
  let c = v.replace(/^file:\\/\\/+/,"").replaceAll("\\\\","/");
  const parts = [];
  for (const part of c.split("/")) { if (!part || part === ".") continue; if (part === "..") parts.pop(); else parts.push(part); }
  return parts.join("/");
};
const resolveImage = (requested, imageMap) => {
  if (/^(?:data:image\\/|https?:\\/\\/|blob:)/i.test(requested || "")) return requested;
  const normalized = normalizePath(requested);
  if (imageMap[normalized]) return imageMap[normalized];
  const suffix = Object.keys(imageMap).find((p) => normalized.endsWith("/" + p) || p.endsWith("/" + normalized));
  return suffix ? imageMap[suffix] : "";
};
try {
  const payload = await fetch("./payload.json", { cache: "no-store" }).then((r) => r.json());
  const query = new URLSearchParams({
    sdkMode: "ppt-editor",
    pptPlatform: "upm-local-export",
    functional: JSON.stringify({fullscreen:false,present:false,export:true,close:false,annotation:false,feedback:false,share:false,versionHistory:false}),
    sdkSaveMode: "external",
    sdkImageMode: "external"
  });
  frame.addEventListener("load", async () => {
    setStatus("iframe-loaded");
    try {
      const messenger = new WindowMessenger({ remoteWindow: frame.contentWindow, allowedOrigins: ["%ORIGIN%"] });
      const connection = connect({ messenger, methods: {
        close(){}, reenter(){}, toggleFullScreen(v){ return v; }, showFeedback(){}, sendPrompt(){},
        showMessage(){}, hideMessage(){},
        onSave(savePayload){ return { fileContent: savePayload?.fileContent, lastModifiedTime: Date.now() }; },
        getImages(imagePayload = {}) {
          const paths = Array.isArray(imagePayload.filePath) ? imagePayload.filePath : [];
          return paths.map((p) => resolveImage(p, payload.imageMap || {}));
        },
        setAnnotationMode(){}, setAnnotationCurrentPage(){}, upsertAnnotation(){}, removeAnnotation(){}, clearAnnotations(){}
      }});
      const remote = await connection.promise;
      window.exportRemote = remote;
      await remote.setSlideConfig({ editable: true, locale: "zh-CN", theme: "light", slideId: payload.id });
      await remote.setPPTD(payload.id, { pptdContent: payload.manifestContent, pages: payload.pages, pptdPath: payload.manifestPath, basePath: "", isCreate: true });
      await remote.setEditable(true);
      window.exportSlideStatus = await remote.getSlideStatus();
      setStatus("ready");
    } catch (error) { window.exportHostError = String(error?.stack || error); setStatus("error"); }
  }, { once: true });
  frame.src = "%ORIGIN%/neo-ppt/?" + query;
} catch (error) { window.exportHostError = String(error?.stack || error); setStatus("error"); }
</script></body></html>
""".replace("%PENPAL%", PENPAL_MODULE).replace("%ORIGIN%", EDITOR_ORIGIN)


def parse_version(output: str) -> tuple[int, int, int]:
    match = re.search(r"(\d+)\.(\d+)\.(\d+)\b", output)
    if not match:
        raise AdapterUnavailableError(f"无法解析 agent-browser 版本：{output.strip()!r}")
    return tuple(int(part) for part in match.groups())


def ensure_agent_browser() -> str:
    """Locate agent-browser >= min version. Never installs anything."""
    executable = shutil.which("agent-browser")
    if not executable:
        raise AdapterUnavailableError(
            "Kimi 适配器需要 agent-browser CLI（>= " + MANIFEST["minAgentBrowser"] + "）。",
            hint="请显式安装后重试：npm install -g agent-browser@latest（bootstrap --profile kimi 只检查，不自动安装）。",
        )
    process = subprocess.run(
        [executable, "--version"],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=30,
    )
    if process.returncode != 0:
        raise AdapterUnavailableError(f"agent-browser --version 失败：\n{process.stdout[-1000:]}")
    version = parse_version(process.stdout)
    minimum = ".".join(str(part) for part in MIN_AGENT_BROWSER)
    if version < MIN_AGENT_BROWSER:
        raise AdapterUnavailableError(
            f"agent-browser 版本过低（{'.'.join(str(v) for v in version)} < {minimum}）。",
            hint="升级：npm install -g agent-browser@latest，然后运行 upm doctor --profile kimi。",
        )
    return executable


def build_payload(manifest_path: Path) -> dict[str, Any]:
    manifest_text = manifest_path.read_text(encoding="utf-8")
    try:
        manifest_data = yaml.safe_load(manifest_text)
    except yaml.YAMLError as exc:
        raise ExportError(f"PPTD 清单 YAML 解析失败：{exc}") from exc
    if not isinstance(manifest_data, dict) or manifest_data.get("version") != "v2":
        raise ExportError("Kimi 适配器仅支持 PPTD version: v2")
    pages = manifest_data.get("pages")
    if not isinstance(pages, list) or not pages:
        raise ExportError("PPTD 清单缺少 pages 列表")
    root = manifest_path.parent.resolve()
    page_payloads: list[dict[str, str]] = []
    for entry in pages:
        normalized = normalize_relative_path(entry)
        page_path = root / normalized
        if not page_path.is_file():
            raise ExportError(f"页面文件不存在：{normalized}")
        page_payloads.append({"path": normalized, "content": page_path.read_text(encoding="utf-8")})
    return {
        "id": f"upm-export-{uuid.uuid4().hex}",
        "title": str(manifest_data.get("title") or manifest_path.stem),
        "manifestPath": manifest_path.name,
        "manifestContent": manifest_text,
        "pages": page_payloads,
        "imageMap": build_image_map(root),
    }


def build_image_map(root: Path) -> dict[str, str]:
    image_map: dict[str, str] = {}
    total = 0
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in IMAGE_MIME:
            continue
        size = path.stat().st_size
        if size > MAX_IMAGE_BYTES:
            continue
        if total + size > MAX_EMBEDDED_MEDIA_BYTES:
            raise ExportError("本地图片总大小超过 200 MiB，请压缩 media/ 后重试。")
        image_map[path.relative_to(root).as_posix()] = (
            f"data:{IMAGE_MIME[path.suffix.lower()]};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"
        )
        total += size
    return image_map


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format: str, *args: Any) -> None:
        return


def serve(directory: Path) -> tuple[ThreadingHTTPServer, threading.Thread, str]:
    handler = lambda *args, **kwargs: QuietHandler(*args, directory=str(directory), **kwargs)  # noqa: E731
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    return server, thread, f"http://{host}:{port}/export_host.html"


class BrowserSession:
    def __init__(self, executable: str, session: str, cwd: Path, download_dir: Path) -> None:
        self.executable = executable
        self.session = session
        self.cwd = cwd
        self.download_dir = download_dir
        self.env = os.environ.copy()
        self.env.setdefault("AGENT_BROWSER_DEFAULT_TIMEOUT", "60000")
        self.env.setdefault("AGENT_BROWSER_IDLE_TIMEOUT_MS", "180000")

    def run(self, args: Sequence[str], *, timeout: int = 90, check: bool = True) -> subprocess.CompletedProcess[str]:
        process = subprocess.run(
            [self.executable, "--session", self.session, *args],
            cwd=self.cwd,
            env=self.env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
        )
        if check and process.returncode != 0:
            raise AdapterProtocolError(
                f"agent-browser 命令失败（{process.returncode}）：{' '.join(args)}\n{process.stdout[-2000:]}"
            )
        return process

    def open(self, url: str) -> None:
        self.run(["--download-path", str(self.download_dir), "open", url], timeout=90)

    def snapshot(self) -> dict[str, Any]:
        process = self.run(["snapshot", "-i", "-C", "--json"])
        return json_result(process.stdout)

    def close(self) -> None:
        self.run(["close"], timeout=20, check=False)


def json_result(output: str) -> dict[str, Any]:
    for line in reversed(output.splitlines()):
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            value = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            return value
    raise AdapterProtocolError(f"agent-browser 未返回 JSON：\n{output[-2000:]}")


def ref_by_name(snapshot: dict[str, Any], name: str, role: str | None = None) -> str:
    data = snapshot.get("data")
    refs = data.get("refs") if isinstance(data, dict) else None
    if not isinstance(refs, dict):
        raise AdapterProtocolError("快照中没有交互 refs")
    matches = []
    for ref, metadata in refs.items():
        if not isinstance(metadata, dict) or metadata.get("name") != name:
            continue
        if role is not None and str(metadata.get("role", "")).lower() != role.lower():
            continue
        matches.append(ref)
    if not matches:
        raise AdapterProtocolError(f"找不到名为 {name!r} 的元素（Kimi 前端可能已变更）")
    return matches[-1]


def wait_for_export_dialog(browser: BrowserSession, timeout: float = 20.0) -> dict[str, Any]:
    deadline = time.monotonic() + timeout
    last: dict[str, Any] | None = None
    while time.monotonic() < deadline:
        last = browser.snapshot()
        try:
            ref_by_name(last, "下载", "button")
            return last
        except AdapterProtocolError:
            time.sleep(0.35)
    raise AdapterProtocolError(f"导出对话框未就绪：{last}")


def switch_state(snapshot: dict[str, Any]) -> tuple[str, bool, bool] | None:
    text = str((snapshot.get("data") or {}).get("snapshot") or "")
    match = re.search(r"switch \[(?P<attrs>[^\]]*?)ref=(?P<ref>e\d+)\]", text)
    if not match:
        return None
    attrs = match.group("attrs")
    return match.group("ref"), "checked=true" in attrs, "disabled" in attrs


def find_download(search_roots: Iterable[Path], timeout: float = 150.0, accept: Callable[[Path], bool] | None = None) -> Path:
    accept = accept or is_pptx
    deadline = time.monotonic() + timeout
    last_sizes: dict[Path, int] = {}
    stable: dict[Path, int] = {}
    while time.monotonic() < deadline:
        candidates: list[Path] = []
        for root in search_roots:
            if not root.exists():
                continue
            candidates.extend(path for path in root.rglob("*") if path.is_file())
        for path in sorted(candidates, key=lambda item: item.stat().st_mtime, reverse=True):
            try:
                size = path.stat().st_size
            except OSError:
                continue
            if size == last_sizes.get(path) and size > 0:
                stable[path] = stable.get(path, 0) + 1
            else:
                stable[path] = 0
            last_sizes[path] = size
            if stable[path] >= 1 and accept(path):
                return path
        time.sleep(0.5)
    raise AdapterProtocolError(f"等待下载超时；观察到的文件：{', '.join(str(p) for p in last_sizes) or '(无)'}")


def is_pptx(path: Path) -> bool:
    if not path.is_file() or path.name.endswith(".crdownload"):
        return False
    try:
        with zipfile.ZipFile(path) as archive:
            if "ppt/presentation.xml" not in archive.namelist():
                return False
            return PPTX_CONTENT_TYPE.encode("utf-8") in archive.read("[Content_Types].xml")
    except (OSError, KeyError, zipfile.BadZipFile):
        return False


def is_image_zip(path: Path) -> bool:
    if not path.is_file() or path.name.endswith(".crdownload"):
        return False
    try:
        with zipfile.ZipFile(path) as archive:
            return any(
                Path(name).suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
                for name in archive.namelist()
            )
    except (OSError, zipfile.BadZipFile):
        return False


def patch_transitions(pptx: Path, transition: str) -> int:
    temporary = pptx.with_name(f".{pptx.name}.{uuid.uuid4().hex}.tmp")
    slide_count = 0
    try:
        with zipfile.ZipFile(pptx, "r") as source, zipfile.ZipFile(temporary, "w") as target:
            target.comment = source.comment
            for info in source.infolist():
                data = source.read(info.filename)
                if re.fullmatch(r"ppt/slides/slide\d+\.xml", info.filename):
                    data = replace_transition(data, transition)
                    slide_count += 1
                target.writestr(info, data, compress_type=info.compress_type)
        if slide_count == 0:
            raise ExportError("导出的 PPTX 中没有 slide XML")
        temporary.replace(pptx)
    finally:
        temporary.unlink(missing_ok=True)
    return slide_count


def replace_transition(slide_xml: bytes, transition: str) -> bytes:
    text = slide_xml.decode("utf-8")
    pattern = re.compile(r"<p:transition\b[^>]*(?:/>|>.*?</p:transition>)", re.DOTALL)
    text = pattern.sub("", text)
    if transition == "none":
        return text.encode("utf-8")
    color_map = re.search(r"<p:clrMapOvr\b[^>]*(?:/>|>.*?</p:clrMapOvr>)", text, re.DOTALL)
    common_slide = re.search(r"<p:cSld\b[^>]*(?:/>|>.*?</p:cSld>)", text, re.DOTALL)
    anchor = color_map or common_slide
    if anchor is None:
        raise ExportError("slide XML 缺少 cSld/clrMapOvr 插入锚点")
    position = anchor.end()
    return (text[:position] + FADE_TRANSITION_XML + text[position:]).encode("utf-8")


def validate_transition_order(slide_xml: bytes, transition: str) -> None:
    import xml.etree.ElementTree as ET

    root = ET.fromstring(slide_xml)
    names = [child.tag.rsplit("}", 1)[-1] for child in root]
    indexes = [index for index, name in enumerate(names) if name == "transition"]
    if transition == "none":
        if indexes:
            raise ExportError("transition=none 后仍存在根级 transition")
        return
    if len(indexes) != 1:
        raise ExportError("slide 必须包含恰好一个根级 transition")
    transition_index = indexes[0]
    for required_before in ("cSld", "clrMapOvr"):
        if required_before in names and names.index(required_before) > transition_index:
            raise ExportError(f"{required_before} 出现在 transition 之后")
    for required_after in ("timing", "extLst"):
        if required_after in names and names.index(required_after) < transition_index:
            raise ExportError(f"{required_after} 出现在 transition 之前")


def verify_output(pptx: Path, transition: str, expect_fonts: bool) -> dict[str, Any]:
    if not is_pptx(pptx):
        raise ExportError(f"输出不是有效 PPTX ZIP：{pptx}")
    with zipfile.ZipFile(pptx) as archive:
        broken = archive.testzip()
        if broken:
            raise ExportError(f"PPTX CRC 校验失败：{broken}")
        slide_names = [name for name in archive.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)]
        for name in slide_names:
            validate_transition_order(archive.read(name), transition)
        fonts = [name for name in archive.namelist() if name.startswith("ppt/fonts/") and not name.endswith("/")]
    return {"slides": len(slide_names), "fonts": len(fonts)}
