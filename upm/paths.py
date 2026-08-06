"""Shared path-safety rules for UPM projects.

PPTD projects are self-contained: every referenced file must live inside the
project directory, references are relative, absolute paths and ``..`` are
rejected, and editors may only write whitelisted extensions.
"""

from __future__ import annotations

import re
from pathlib import PurePosixPath

from .errors import PathSafetyError

_DRIVE_RE = re.compile(r"^[A-Za-z]:/")
_WRITABLE_SUFFIXES = {".pptd", ".page"}


def normalize_relative_path(value: str) -> str:
    """Return a safe relative posix path or raise PathSafetyError."""
    if not isinstance(value, str) or not value.strip():
        raise PathSafetyError("文件路径必须是非空字符串。")
    path = value.strip().replace("\\", "/")
    try:
        path = __import__("urllib.parse", fromlist=["unquote"]).unquote(path)
    except Exception:  # pragma: no cover - literal percent sign path
        pass
    path = re.sub(r"^file://+", "", path)
    path = re.sub(r"^\./", "", path)
    if not path or "\0" in path or path.startswith("/") or _DRIVE_RE.match(path):
        raise PathSafetyError(f"不允许的绝对路径：{value}")
    parts: list[str] = []
    for part in path.split("/"):
        if not part or part == ".":
            continue
        if part == "..":
            raise PathSafetyError(f"不允许越过项目目录：{value}")
        parts.append(part)
    if not parts:
        raise PathSafetyError(f"无效文件路径：{value}")
    return "/".join(parts)


def dirname(path: str) -> str:
    normalized = normalize_relative_path(path)
    index = normalized.rfind("/")
    return "" if index == -1 else normalized[:index]


def basename(path: str) -> str:
    normalized = normalize_relative_path(path)
    return normalized.rsplit("/", 1)[-1]


def join_relative(base: str, path: str) -> str:
    child = normalize_relative_path(path)
    if not base:
        return child
    normalized_base = normalize_relative_path(base)
    if child == normalized_base or child.startswith(f"{normalized_base}/"):
        return child
    return normalize_relative_path(f"{normalized_base}/{child}")


def is_within(root: str, relative: str) -> bool:
    normalized = normalize_relative_path(relative)
    return normalized not in {"", ".", ".."} and ".." not in normalized.split("/")


def assert_writable(path: str) -> str:
    normalized = normalize_relative_path(path)
    if PurePosixPath(normalized).suffix.lower() not in _WRITABLE_SUFFIXES:
        raise PathSafetyError(f"为安全起见，仅允许编辑 .pptd/.page 文件：{path}")
    return normalized


def resolve_inside(root: str, relative: str) -> str:
    """Resolve ``root/relative`` after verifying relative stays inside root."""
    from pathlib import Path

    normalized = normalize_relative_path(relative)
    candidate = (Path(root) / normalized).resolve()
    root_resolved = Path(root).resolve()
    try:
        candidate.relative_to(root_resolved)
    except ValueError as exc:
        raise PathSafetyError(f"项目路径越界：{relative}") from exc
    return str(candidate)

