"""`upm edit`: package-preserving PPTX local edit (Preserve Edit Engine)."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

from upm.cli.common import resolve_python
from upm.errors import InputError, UpmError


def _default_output(source: Path) -> Path:
    return source.with_name(f"{source.stem}_edited{source.suffix}")


def _build_edits(instruction: str, edits_file: str | None) -> list[dict[str, Any]]:
    if edits_file:
        path = Path(edits_file)
        if not path.is_file():
            raise InputError(f"edits 文件不存在：{path}")
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("edits") if isinstance(data, dict) and "edits" in data else data
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
    try:
        from preserve_edit_pptx import parse_nl_edit_plan
    except ImportError as exc:
        raise UpmError(f"保真编辑引擎不可用：{exc}") from exc
    edits = parse_nl_edit_plan(instruction)
    if not edits:
        raise InputError(
            "无法从修改要求中解析出可执行的编辑操作。",
            hint='示例："把第 2 页的 Q2 改成 Q3"，或使用 --edits edits.json。',
        )
    return edits


def run_edit(args: Any) -> int:
    source = Path(args.pptx).expanduser().resolve()
    if not source.is_file():
        raise InputError(f"源文件不存在：{source}")
    output = Path(args.output or _default_output(source)).expanduser().resolve()
    edits = _build_edits(args.instruction, args.edits)
    script = Path(__file__).resolve().parents[2] / "scripts" / "preserve_edit_pptx.py"
    with tempfile.TemporaryDirectory(prefix="upm-edit-") as name:
        edits_path = Path(name) / "edits.json"
        edits_path.write_text(json.dumps(edits, ensure_ascii=False), encoding="utf-8")
        report_path = Path(name) / "fidelity-report.json"
        command = [
            str(resolve_python()),
            str(script),
            str(source),
            str(output),
            "--edits",
            str(edits_path),
            "--report",
            str(report_path),
        ]
        if args.preview:
            command.append("--preview")
        process = subprocess.run(command, capture_output=True, text=True, timeout=600)
        stdout = process.stdout or ""
        stderr = process.stderr or ""
        if process.returncode == 0:
            print(stdout.strip())
            if report_path.is_file():
                report = json.loads(report_path.read_text(encoding="utf-8"))
                print("\n=== 保真报告 ===")
                print(f"safe: {report.get('safe')}")
                print(f"changed: {report.get('changed')}")
                print(f"unchanged_parts: {report.get('unchanged_count')}/{report.get('total_parts')}")
                print(f"requested_slides: {report.get('requested_slides')}")
            print(f"\n输出：{output}")
            return 0
        print(stderr.strip() or stdout.strip(), file=sys.stderr)
        if report_path.is_file():
            print(json.dumps(json.loads(report_path.read_text(encoding="utf-8")), ensure_ascii=False, indent=2))
        return process.returncode if process.returncode in {1, 2, 3} else 1
