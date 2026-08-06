"""PPTD project I/O: load, save, scan, and safe media copy."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

import yaml

from upm.errors import ProjectError, ValidationError
from upm.paths import normalize_relative_path, resolve_inside
from upm.pptd.paths import assert_media_path, assert_page_path, media_basename
from upm.pptd.schema import validate_pptd_project


def find_manifest(source: str | Path) -> Path:
    path = Path(source).expanduser().resolve()
    if path.is_file():
        if path.suffix.lower() != ".pptd":
            raise ProjectError(f"输入必须是 .pptd 清单或项目目录：{path}")
        return path
    if path.is_dir():
        manifests = sorted(path.glob("*.pptd"))
        if not manifests:
            raise ProjectError(f"目录中没有 .pptd 清单：{path}")
        if len(manifests) > 1:
            choices = "\n  ".join(str(p) for p in manifests[:10])
            raise ProjectError(f"目录中有多个 .pptd 清单，请显式指定：\n  {choices}")
        return manifests[0]
    raise ProjectError(f"输入不存在：{path}")


def read_yaml(path: Path, *, strict: bool = True) -> Any:
    text = path.read_text(encoding="utf-8")
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        where = f"line {mark.line + 1}, column {mark.column + 1}" if mark else "unknown position"
        raise ValidationError(f"{path.name} 的 YAML 解析失败（{where}）：{exc}") from exc


def write_yaml(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = yaml.safe_dump(data, allow_unicode=True, sort_keys=False, default_flow_style=False)
    path.write_text(text, encoding="utf-8")


def load_project(project_dir: str | Path) -> tuple[Path, dict[str, Any], list[tuple[str, dict[str, Any]]]]:
    """Return (root, manifest_data, [(page_path, page_data), ...])."""
    root = Path(project_dir).expanduser().resolve()
    manifest_path = find_manifest(root)
    manifest = read_yaml(manifest_path)
    if not isinstance(manifest, dict) or not isinstance(manifest.get("pages"), list):
        raise ValidationError(f"{manifest_path.name} 缺少 pages 列表")
    pages: list[tuple[str, dict[str, Any]]] = []
    for entry in manifest["pages"]:
        normalized = normalize_relative_path(entry)
        page_path = root / normalized
        if not page_path.is_file():
            raise ProjectError(f"页面文件不存在：{normalized}")
        page_data = read_yaml(page_path)
        if not isinstance(page_data, dict):
            raise ValidationError(f"{normalized} 顶层必须是 YAML 映射")
        pages.append((normalized, page_data))
    return root, manifest, pages


def ensure_project_layout(project_dir: str | Path) -> Path:
    root = Path(project_dir).expanduser().resolve()
    for relative in ("pages", "media", "sources", "exports", "preview", ".upm/cache", ".upm/renders", ".upm/qa", ".upm/intermediate"):
        (root / relative).mkdir(parents=True, exist_ok=True)
    return root


def import_media_file(project_dir: str | Path, source: str | Path, fallback_stem: str = "asset") -> str:
    """Copy a local image into media/ and return its project-relative path."""
    root = Path(project_dir).expanduser().resolve()
    source_path = Path(source)
    if not source_path.is_file():
        raise ProjectError(f"媒体文件不存在：{source_path}")
    suffix = source_path.suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}:
        raise ProjectError(f"不支持的媒体类型：{suffix or '(无扩展名)'}")
    name = media_basename(str(source_path), fallback_stem)
    target = root / "media" / name
    shutil.copy2(source_path, target)
    relative = f"media/{name}"
    assert_media_path(relative)
    return relative


def write_quality_artifact(project_dir: str | Path, name: str, payload: dict[str, Any]) -> Path:
    """Write a JSON artifact under .upm/qa (or .upm/ for canonical files)."""
    root = Path(project_dir).expanduser().resolve()
    path = root / ".upm" / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def read_quality_artifact(project_dir: str | Path, name: str) -> dict[str, Any]:
    path = Path(project_dir).expanduser().resolve() / ".upm" / name
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def require_valid_project(project_dir: str | Path) -> Path:
    """Validate the project and raise on any structural error."""
    root = Path(project_dir).expanduser().resolve()
    issues = validate_pptd_project(root)
    errors = [issue for issue in issues if issue.severity == "error"]
    if errors:
        details = "\n".join(issue.render() for issue in errors[:20])
        raise ValidationError(f"结构校验未通过（{len(errors)} 个错误）：\n{details}")
    return root
