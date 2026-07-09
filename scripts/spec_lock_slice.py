#!/usr/bin/env python3
"""Return a compact per-page slice from spec_lock.md."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


LINE_BUDGET = 120
PAGE_SCOPED_SECTIONS = {
    "page_rhythm",
    "page_roles",
    "visual_weight",
    "layout_family",
    "page_recipes",
    "visual_layers",
    "raster_policy",
    "asset_requirements",
    "anti_patterns",
    "page_layouts",
    "page_charts",
}


def spec_lock_path(project: Path) -> Path:
    return project / "spec_lock.md" if project.is_dir() else project


def section_name(line: str) -> str:
    return line.lstrip("#").strip().split()[0] if line.startswith("## ") else ""


def check_budget(path: Path, *, budget: int = LINE_BUDGET) -> bool:
    lines = path.read_text(encoding="utf-8").splitlines()
    if len(lines) > budget:
        print(f"spec_lock.md exceeds {budget} line budget: {len(lines)} lines", file=sys.stderr)
        return False
    print(f"spec_lock.md budget ok: {len(lines)}/{budget} lines")
    return True


def slice_lock(path: Path, page: str) -> str:
    page_key = page.upper()
    output: list[str] = []
    current_section = ""
    include_page_section = True

    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            current_section = section_name(line)
            include_page_section = current_section in PAGE_SCOPED_SECTIONS
            output.append(line)
            continue
        if not include_page_section:
            output.append(line)
            continue
        stripped = line.strip()
        if not stripped:
            output.append(line)
            continue
        if stripped.startswith(f"- {page_key}:") or stripped.startswith(f"- {page_key.lower()}:"):
            output.append(line)

    return "\n".join(output).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-budget", action="store_true", help="Only check the 120-line spec_lock budget")
    parser.add_argument("project", help="Project folder or spec_lock.md path")
    parser.add_argument("page", nargs="?", help="Page key such as P02")
    args = parser.parse_args()

    path = spec_lock_path(Path(args.project).resolve())
    if not path.is_file():
        print(f"spec_lock.md not found: {path}", file=sys.stderr)
        return 1
    if args.check_budget:
        return 0 if check_budget(path) else 1
    if not args.page:
        print("page is required unless --check-budget is used", file=sys.stderr)
        return 2
    print(slice_lock(path, args.page), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
