"""`upm doctor`: report-only environment check."""

from __future__ import annotations

import importlib.util
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from upm.cli.common import ROOT, resolve_python


def _check_python() -> tuple[bool, str]:
    python = resolve_python()
    process = subprocess.run([str(python), "--version"], capture_output=True, text=True, timeout=30)
    version = (process.stdout or process.stderr or "").strip()
    return True, f"{python} · {version}"


def _module_ok(name: str) -> bool:
    python = resolve_python()
    return importlib.util.find_spec(name) is not None or subprocess.run(
        [str(python), "-c", f"import {name}"],
        capture_output=True,
        timeout=30,
    ).returncode == 0


def _contracts_sync() -> tuple[bool, str]:
    process = subprocess.run(
        [str(resolve_python()), str(ROOT / "scripts" / "generate_contracts.py"), "--check"],
        capture_output=True,
        text=True,
        timeout=120,
    )
    return process.returncode == 0, "契约生成物与 YAML 同步" if process.returncode == 0 else "契约生成物过期（运行 generate_contracts.py）"


def run_doctor(args: Any) -> int:
    checks: list[tuple[str, bool, str]] = []
    ok, message = _check_python()
    checks.append(("Python 3.10+", ok, message))
    checks.append(("仓库本地 .venv", (ROOT / ".venv" / "bin" / "python").is_file(), str(ROOT / ".venv")))
    checks.append(("PyYAML", _module_ok("yaml"), "PPTD 读写需要"))
    checks.append(("Pillow", _module_ok("PIL"), "联系表/空白页检测需要"))
    if args.profile in {"pptx", "all"}:
        checks.append(("python-pptx", _module_ok("pptx"), "本地 PPTX 导出需要"))
    if args.profile in {"visual-review", "all"}:
        checks.append(("Playwright", _module_ok("playwright"), "高质量本地渲染（可选）"))
        checks.append(("agent-browser", shutil.which("agent-browser") is not None, "本地渲染兜底"))
    if args.profile in {"kimi", "all"}:
        from upm.adapters.kimi.healthcheck import kimi_healthcheck

        kimi = kimi_healthcheck()
        checks.append(("Kimi 适配器", kimi["available"], kimi["reason"]))
        checks.append(("websocket-client", _module_ok("websocket"), "Kimi 图片导出对话框自动化"))
    if args.profile in {"core", "pptx", "visual-review", "kimi", "all"}:
        checks.append(("契约同步", *_contracts_sync()))

    print("UPM doctor（只报告，不安装）")
    print(f"Profile: {args.profile}\n")
    failures = 0
    warnings = 0
    for name, passed, detail in checks:
        if passed:
            print(f"[ok]     {name}: {detail}")
        else:
            print(f"[missing] {name}: {detail}")
            failures += 1
    print(f"\n摘要：{failures} 个缺失 / {warnings} 个警告")
    if failures:
        print("修复方式：bash scripts/bootstrap.sh --profile " + args.profile)
        return 1
    print("环境可用。")
    return 0
