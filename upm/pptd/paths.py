"""PPTD-specific path constraints.

Rules enforced everywhere (compiler, editor, adapters):
- page files live under ``pages/`` with ``.page`` suffix;
- media live under ``media/`` (or a safe subdirectory);
- image src values are either remote http(s) URLs or project-relative paths;
- no absolute paths, no ``..``.
"""

from __future__ import annotations

import re
from pathlib import Path, PurePosixPath

from upm.errors import PathSafetyError
from upm.paths import basename, normalize_relative_path


_REMOTE_SRC_RE = re.compile(r"^(https?|data|blob):", re.IGNORECASE)


def page_path_from_index(index: int, total: int, slug: str = "page") -> str:
    return f"pages/{index:02d}_{slug}.page"


def assert_page_path(path: str) -> str:
    normalized = normalize_relative_path(path)
    parts = normalized.split("/")
    if len(parts) != 2 or parts[0] != "pages":
        raise PathSafetyError(f"页面文件必须位于 pages/ 下：{path}")
    if PurePosixPath(normalized).suffix.lower() != ".page":
        raise PathSafetyError(f"页面文件必须使用 .page 后缀：{path}")
    return normalized


def assert_media_path(path: str) -> str:
    normalized = normalize_relative_path(path)
    parts = normalized.split("/")
    if parts[0] != "media":
        raise PathSafetyError(f"媒体文件必须位于 media/ 下：{path}")
    return normalized


def validate_element_src(src: str) -> str:
    if _REMOTE_SRC_RE.match(src or ""):
        return src
    normalized = normalize_relative_path(src)
    if not normalized.startswith("media/"):
        raise PathSafetyError(f"图片路径必须位于 media/ 下或是 http(s) URL：{src}")
    return normalized


def media_basename(source: str, fallback: str = "asset") -> str:
    """Derive a safe media filename from an arbitrary source path/URL."""
    import uuid
    from urllib.parse import unquote, urlparse

    candidate = ""
    if "://" in source:
        candidate = basename(urlparse(source).path)
    else:
        candidate = Path(source).name if "/" in source or "\\" in source else source
    suffix = PurePosixPath(candidate).suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}:
        suffix = ".png"
        candidate = ""
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", PurePosixPath(candidate).stem) if candidate else ""
    if not stem:
        stem = fallback
    unique = uuid.uuid4().hex[:8]
    return f"{stem}_{unique}{suffix}"
