"""Shared CLI helpers."""

from __future__ import annotations

import re
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any

from upm.errors import ProjectError

ROOT = Path(__file__).resolve().parents[2]


def project_title(input_text: str, override: str | None) -> str:
    if override:
        return override.strip()
    candidate = input_text.strip()
    candidate = re.sub(r"^[「『【\[]|[」』】\]]+$", "", candidate)
    candidate = re.sub(r"\.(?:pdf|docx?|xlsx?|pptx?|md|txt)$", "", candidate, flags=re.IGNORECASE)
    candidate = re.sub(r"^https?://[^\s]+", "", candidate).strip()
    return candidate[:24] or "未命名演示文稿"


def slugify(name: str) -> str:
    value = re.sub(r"[^\w\u4e00-\u9fff-]+", "_", name).strip("_")
    return value[:60] or "deck"


def create_project_dir(base: str, title: str) -> Path:
    base_path = Path(base).expanduser().resolve()
    base_path.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d")
    name = f"{slugify(title)}_{stamp}"
    path = base_path / name
    counter = 2
    while path.exists():
        path = base_path / f"{name}_{counter}"
        counter += 1
    return path


def import_input(input_text: str, project: Path) -> tuple[str, str]:
    """Normalize input into source material. Returns (source_text, note)."""
    candidate = Path(input_text).expanduser()
    if candidate.is_file():
        sources = project / "sources"
        sources.mkdir(parents=True, exist_ok=True)
        target = sources / candidate.name
        counter = 2
        while target.exists():
            target = sources / f"{candidate.stem}_{counter}{candidate.suffix}"
            counter += 1
        shutil.copy2(candidate, target)
        suffix = candidate.suffix.lower()
        note = f"已复制 {candidate.name} 到 sources/"
        if suffix in {".md", ".markdown", ".txt"}:
            return target.read_text(encoding="utf-8", errors="replace"), note
        converted = _convert_source(target, suffix)
        if converted:
            return converted.read_text(encoding="utf-8", errors="replace"), note
        return "", note + "（该格式尚未自动转换，请补充文本或文档）"
    if re.match(r"^https?://", input_text.strip()):
        return _import_url(input_text.strip(), project)
    return input_text, "输入为直接主题/文字"


def _convert_source(source: Path, suffix: str) -> Path | None:
    script_map = {
        ".pdf": "source_to_md/pdf_to_md.py",
        ".docx": "source_to_md/doc_to_md.py",
        ".xlsx": "source_to_md/excel_to_md.py",
        ".pptx": "source_to_md/ppt_to_md.py",
    }
    script = script_map.get(suffix)
    if not script:
        return None
    python = resolve_python()
    output = source.with_suffix(".md")
    if output.exists():
        return output
    result = subprocess.run(
        [str(python), str(ROOT / "scripts" / script), str(source), "-o", str(output)],
        capture_output=True,
        text=True,
        timeout=300,
    )
    if result.returncode == 0 and output.is_file():
        return output
    raise ProjectError(f"资料转换失败（{source.name}）：\n{(result.stderr or result.stdout)[-1500:]}")


def _import_url(url: str, project: Path) -> tuple[str, str]:
    sources = project / "sources"
    sources.mkdir(parents=True, exist_ok=True)
    python = resolve_python()
    script = ROOT / "scripts" / "source_to_md" / "web_to_md.py"
    result = subprocess.run(
        [str(python), str(script), url],
        capture_output=True,
        text=True,
        timeout=300,
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip(), f"已抓取 URL：{url}"
    name = re.sub(r"[^\w-]+", "_", url.split("//")[-1][:40])
    (sources / f"{name}.url.txt").write_text(f"URL: {url}\n", encoding="utf-8")
    return "", f"URL 抓取不可用（{url}），已记录链接；请补充文本或文档。"


def resolve_python() -> Path:
    venv = ROOT / ".venv" / "bin" / "python"
    if venv.is_file():
        return venv
    for name in ("python3.13", "python3.12", "python3.11", "python3.10"):
        candidate = shutil.which(name)
        if candidate:
            return Path(candidate)
    raise ProjectError(
        "需要 Python 3.10+。",
        hint="运行 bash scripts/bootstrap.sh --profile core 创建仓库本地 .venv。",
    )


def extract_markdown_tables(text: str) -> list[dict[str, Any]]:
    """Extract markdown pipe tables into {headers, rows} dicts."""
    tables: list[dict[str, Any]] = []
    lines = text.splitlines()
    index = 0
    while index < len(lines):
        if "|" not in lines[index]:
            index += 1
            continue
        header = [cell.strip() for cell in lines[index].strip().strip("|").split("|")]
        if index + 1 >= len(lines) or not re.match(r"^[\s|:-]+$", lines[index + 1]):
            index += 1
            continue
        rows: list[list[str]] = []
        index += 2
        while index < len(lines) and "|" in lines[index] and lines[index].strip():
            rows.append([cell.strip() for cell in lines[index].strip().strip("|").split("|")])
            index += 1
        if rows:
            tables.append({"headers": header, "rows": rows})
        else:
            index += 1
    return tables


def attach_tables_to_deckir(deckir: dict[str, Any], tables: list[dict[str, Any]]) -> None:
    """Assign extracted tables to evidence/chart/benefit slides deterministically."""
    if not tables:
        return
    slides = deckir.get("slides") or []
    chart_candidates = [
        slide for slide in slides
        if str(slide.get("role")) in {"benefit", "chart"} and not slide.get("table")
    ]
    table_candidates = [
        slide for slide in slides
        if str(slide.get("role")) in {"evidence", "context"} and not slide.get("table")
    ]
    candidates = chart_candidates + table_candidates
    for index, table in enumerate(tables):
        if index >= len(candidates):
            break
        slide = candidates[index]
        slide["table"] = table
        if slide in chart_candidates and len(table["rows"]) >= 2:
            cols = table["headers"]
            numeric_cols = []
            for col_index, col in enumerate(cols):
                if all(re.fullmatch(r"-?\d[\d,.]*%?", str(row[col_index])) for row in table["rows"] if col_index < len(row)):
                    numeric_cols.append(col_index)
            if numeric_cols:
                first = numeric_cols[0]
                slide["chart"] = {
                    "type": "bar",
                    "title": slide.get("title") or "关键指标",
                    "data": {
                        "cols": cols,
                        "rows": table["rows"],
                    },
                    "series": [
                        {
                            "type": "bar",
                            "encode": {"x": cols[0], "y": cols[first]},
                            "name": cols[first],
                            "fill": "$primary",
                        }
                    ],
                }


def print_delivery(project: Path, title: str, summary: dict[str, Any]) -> None:
    print("\n=== 交付摘要 ===")
    print(f"标题：{title}")
    print(f"项目：{project}")
    print(f"页面：{summary.get('slides', '?')}")
    print(f"导出后端：{summary.get('backend', '?')}")
    print(f"质量门：{summary.get('gates', {})}")
    if summary.get("warnings"):
        for warning in summary["warnings"]:
            print(f"[warn] {warning}")
    print("\n最终交付物：")
    label = "Web Deck" if str(summary.get("pptx") or "").endswith("index.html") else "PPTX"
    print(f"  {label}:  {summary.get('pptx')}")
    print(f"  预览:  {summary.get('overview')}")
    print(f"  工程:  {project / 'deck.pptd'}")
    print(f"  报告:  {project / '.upm' / 'quality-report.json'}")
    print(f"\n继续编辑：upm open {project}")
