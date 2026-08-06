"""Structured PPTD validator with precise error locations.

The JSON Schema in ``contracts/schemas/pptd.schema.json`` documents the same
rules; this module is the executable validator that reports the exact file,
page, element and field for every issue.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from upm.errors import ValidationError
from upm.paths import normalize_relative_path
from upm.pptd.model import MANIFEST_VERSION
from upm.pptd.paths import assert_page_path, validate_element_src


@dataclass(frozen=True)
class ValidationIssue:
    location: str
    severity: str  # "error" | "warning"
    message: str

    def render(self) -> str:
        return f"{self.severity.upper()}: {self.location}: {self.message}"


class PptdValidator:
    """Walks manifest + pages and collects issues without throwing early."""

    def __init__(self, canvas_size: tuple[float, float] | None = None) -> None:
        self.canvas_size = canvas_size

    # ------------------------------------------------------------------
    # manifest
    # ------------------------------------------------------------------
    def validate_manifest(self, data: Any, location: str = "deck.pptd") -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []
        if not isinstance(data, dict):
            return [ValidationIssue(location, "error", "清单必须是 YAML 映射对象")]
        if data.get("version") != MANIFEST_VERSION:
            issues.append(
                ValidationIssue(
                    f"{location}.version",
                    "error",
                    f"仅支持 version: {MANIFEST_VERSION}（当前：{data.get('version')!r}）",
                )
            )
        size = data.get("size")
        if not isinstance(size, list) or len(size) != 2:
            issues.append(ValidationIssue(f"{location}.size", "error", "size 必须为 [width, height]"))
        else:
            for axis, value in zip(("width", "height"), size):
                if not isinstance(value, (int, float)) or value <= 0:
                    issues.append(
                        ValidationIssue(f"{location}.size[{axis}]", "error", "尺寸必须为正数")
                    )
                if not isinstance(value, int) and not float(value).is_integer():
                    issues.append(
                        ValidationIssue(f"{location}.size[{axis}]", "warning", "建议使用整数尺寸")
                    )
            if self.canvas_size is None and isinstance(size, list) and len(size) == 2:
                self.canvas_size = (float(size[0]), float(size[1]))

        pages = data.get("pages")
        if not isinstance(pages, list) or not pages:
            issues.append(ValidationIssue(f"{location}.pages", "error", "pages 必须是非空列表"))
        else:
            seen: set[str] = set()
            for index, entry in enumerate(pages):
                loc = f"{location}.pages[{index}]"
                if not isinstance(entry, str):
                    issues.append(ValidationIssue(loc, "error", "页面路径必须是字符串"))
                    continue
                try:
                    normalized = assert_page_path(entry)
                except ValidationError as exc:
                    issues.append(ValidationIssue(loc, "error", exc.message))
                    continue
                if normalized in seen:
                    issues.append(ValidationIssue(loc, "error", f"页面路径重复：{normalized}"))
                seen.add(normalized)

        theme = data.get("theme")
        if theme is not None:
            issues.extend(self._validate_theme(theme, f"{location}.theme"))
        upm = data.get("upm")
        if upm is not None:
            if not isinstance(upm, dict) or upm.get("schemaVersion") != "upm-pptd-v1":
                issues.append(
                    ValidationIssue(f"{location}.upm.schemaVersion", "warning", "缺少 upm.schemaVersion=upm-pptd-v1")
                )
        return issues

    def _validate_theme(self, theme: Any, location: str) -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []
        if not isinstance(theme, dict):
            return [ValidationIssue(location, "error", "theme 必须是映射对象")]
        for key in ("colors", "textStyles", "tableStyles"):
            section = theme.get(key)
            if section is None:
                continue
            if not isinstance(section, dict):
                issues.append(ValidationIssue(f"{location}.{key}", "error", "必须是映射对象"))
                continue
            if key == "colors":
                for name, color in section.items():
                    if not isinstance(color, str) or not (
                        color.startswith("#") or color.startswith("$")
                    ):
                        issues.append(
                            ValidationIssue(
                                f"{location}.colors.{name}",
                                "warning",
                                f"颜色建议使用 #RRGGBB/#RRGGBBAA 或 $theme 引用（当前：{color!r}）",
                            )
                        )
        return issues

    # ------------------------------------------------------------------
    # pages
    # ------------------------------------------------------------------
    def validate_page(self, data: Any, location: str) -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []
        if not isinstance(data, dict):
            return [ValidationIssue(location, "error", "页面必须是 YAML 映射对象")]
        if "elements" not in data or not isinstance(data["elements"], list):
            return [ValidationIssue(f"{location}.elements", "error", "elements 必须是数组")]
        elements = data["elements"]
        ids: set[str] = set()
        for index, element in enumerate(elements):
            el_loc = f"{location}.elements[{index}]"
            issues.extend(self._validate_element(element, el_loc))
            if isinstance(element, dict):
                element_id = element.get("elementId")
                if isinstance(element_id, str):
                    if element_id in ids:
                        issues.append(
                            ValidationIssue(f"{el_loc}.elementId", "error", f"elementId 重复：{element_id}")
                        )
                    ids.add(element_id)
        background = data.get("background")
        if background is not None:
            issues.extend(self._validate_fill(background, f"{location}.background"))
        notes = data.get("notes")
        if notes is not None and not isinstance(notes, str):
            issues.append(ValidationIssue(f"{location}.notes", "warning", "notes 应为字符串"))
        return issues

    def _validate_element(self, element: Any, location: str) -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []
        if not isinstance(element, dict):
            return [ValidationIssue(location, "error", "元素必须是映射对象")]
        element_id = element.get("elementId")
        if not isinstance(element_id, str) or not element_id.strip():
            issues.append(ValidationIssue(f"{location}.elementId", "error", "缺少非空 elementId"))
        element_type = element.get("elementType")
        allowed_types = {"text", "shape", "line", "image", "icon", "table", "chart"}
        if element_type not in allowed_types:
            issues.append(
                ValidationIssue(f"{location}.elementType", "error", f"不支持的元素类型：{element_type!r}")
            )
        bounds = element.get("bounds")
        if not isinstance(bounds, list) or len(bounds) != 4:
            issues.append(ValidationIssue(f"{location}.bounds", "error", "bounds 必须为 [x, y, width, height]"))
        else:
            x, y, width, height = (float(v) for v in bounds)
            if width <= 0 or height <= 0:
                issues.append(ValidationIssue(f"{location}.bounds", "error", "width/height 必须为正数"))
            if self.canvas_size is not None:
                canvas_w, canvas_h = self.canvas_size
                if x < 0 or y < 0 or x + width > canvas_w or y + height > canvas_h:
                    issues.append(
                        ValidationIssue(
                            f"{location}.bounds",
                            "error",
                            f"元素超出页面边界（页面 {canvas_w:.0f}x{canvas_h:.0f}，元素 {x:.0f},{y:.0f} {width:.0f}x{height:.0f}）",
                        )
                    )

        if element_type == "text":
            content = element.get("content")
            if not isinstance(content, dict) or not isinstance(content.get("text"), str):
                issues.append(ValidationIssue(f"{location}.content.text", "error", "文本元素必须包含 content.text"))
            if isinstance(content, dict) and content.get("style") is not None:
                if not isinstance(content["style"], str) or not content["style"].startswith("$"):
                    issues.append(
                        ValidationIssue(f"{location}.content.style", "warning", "style 建议使用 $theme 引用")
                    )
        elif element_type == "shape":
            if not isinstance(element.get("shapeName"), str):
                issues.append(ValidationIssue(f"{location}.shapeName", "error", "形状元素必须包含 shapeName"))
        elif element_type == "image":
            src = element.get("src")
            if not isinstance(src, str) or not src.strip():
                issues.append(ValidationIssue(f"{location}.src", "error", "图片元素必须包含 src"))
            else:
                try:
                    validate_element_src(src)
                except ValidationError as exc:
                    issues.append(ValidationIssue(f"{location}.src", "error", exc.message))
        elif element_type == "table":
            for field in ("columnWidths", "rowHeights"):
                values = element.get(field)
                if not isinstance(values, list) or not values:
                    issues.append(ValidationIssue(f"{location}.{field}", "error", f"{field} 必须是数组"))
                    continue
                total = sum(float(v) for v in values)
                if abs(total - 1.0) > 0.02:
                    issues.append(
                        ValidationIssue(
                            f"{location}.{field}",
                            "warning",
                            f"{field} 之和应为 1（当前 {total:.3f}）",
                        )
                    )
            rows = element.get("rows")
            if not isinstance(rows, list) or not rows or not all(isinstance(row, list) for row in rows):
                issues.append(ValidationIssue(f"{location}.rows", "error", "rows 必须是二维数组"))
        elif element_type == "chart":
            if not isinstance(element.get("data"), dict):
                issues.append(ValidationIssue(f"{location}.data", "error", "图表必须包含 data"))
            series = element.get("series")
            if not isinstance(series, list) or not series:
                issues.append(ValidationIssue(f"{location}.series", "error", "图表必须包含 series 数组"))
        return issues

    def _validate_fill(self, fill: Any, location: str) -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []
        if not isinstance(fill, dict):
            return [ValidationIssue(location, "error", "fill 必须是映射对象")]
        fill_type = fill.get("type")
        if fill_type == "solid":
            if not isinstance(fill.get("color"), str):
                issues.append(ValidationIssue(f"{location}.color", "error", "solid fill 需要 color"))
        elif fill_type == "gradient":
            stops = fill.get("stops")
            if not isinstance(stops, list) or len(stops) < 2:
                issues.append(ValidationIssue(f"{location}.stops", "error", "gradient 至少需要 2 个 stops"))
        elif fill_type == "image":
            src = fill.get("src")
            if not isinstance(src, str) or not src.strip():
                issues.append(ValidationIssue(f"{location}.src", "error", "image fill 需要 src"))
            else:
                try:
                    validate_element_src(src)
                except ValidationError as exc:
                    issues.append(ValidationIssue(f"{location}.src", "error", exc.message))
        else:
            issues.append(ValidationIssue(f"{location}.type", "error", f"不支持的 fill 类型：{fill_type!r}"))
        return issues


def _load_yaml(path: Path, location: str) -> Any:
    text = path.read_text(encoding="utf-8")
    try:
        return yaml.safe_load(text)
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        where = f"line {mark.line + 1}, column {mark.column + 1}" if mark else "unknown position"
        raise ValidationError(f"{location} 的 YAML 解析失败（{where}）：{exc}") from exc


def validate_pptd_text(text: str, location: str = "pptd") -> tuple[Any, list[ValidationIssue]]:
    """Parse PPTD YAML text and return (data, issues) without raising on shape errors."""
    try:
        data = yaml.safe_load(text)
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        where = f"line {mark.line + 1}, column {mark.column + 1}" if mark else "unknown position"
        raise ValidationError(f"{location} 的 YAML 解析失败（{where}）：{exc}") from exc
    if not isinstance(data, dict):
        return data, [ValidationIssue(location, "error", "顶层必须是 YAML 映射")]
    validator = PptdValidator()
    issues = validator.validate_manifest(data, location)
    return data, issues


def validate_pptd_project(project_dir: str | Path) -> list[ValidationIssue]:
    """Validate an entire PPTD project on disk.

    Returns a flat issue list. Callers treat severity == "error" as a hard
    structure-gate failure.
    """
    root = Path(project_dir)
    manifests = sorted(root.glob("*.pptd"))
    if not manifests:
        return [ValidationIssue(str(root), "error", "项目中没有 .pptd 清单文件")]
    if len(manifests) > 1:
        return [
            ValidationIssue(
                str(root),
                "error",
                f"项目中有多个 .pptd 清单：{', '.join(p.name for p in manifests[:5])}",
            )
        ]
    manifest_path = manifests[0]
    manifest_data = _load_yaml(manifest_path, manifest_path.name)
    validator = PptdValidator()
    issues = validator.validate_manifest(manifest_data, manifest_path.name)
    if any(issue.severity == "error" for issue in issues):
        return issues

    page_paths = manifest_data.get("pages") or []
    for index, relative in enumerate(page_paths):
        try:
            normalized = normalize_relative_path(relative)
        except ValidationError as exc:
            issues.append(ValidationIssue(f"{manifest_path.name}.pages[{index}]", "error", exc.message))
            continue
        page_path = root / normalized
        if not page_path.is_file():
            issues.append(
                ValidationIssue(
                    f"{manifest_path.name}.pages[{index}]",
                    "error",
                    f"页面文件不存在：{normalized}",
                )
            )
            continue
        page_data = _load_yaml(page_path, normalized)
        issues.extend(validator.validate_page(page_data, normalized))
    return issues


def issues_by_severity(issues: Iterable[ValidationIssue]) -> tuple[list[ValidationIssue], list[ValidationIssue]]:
    errors = [issue for issue in issues if issue.severity == "error"]
    warnings = [issue for issue in issues if issue.severity == "warning"]
    return errors, warnings

