"""Backend selection for PPTX export.

Default is ``local`` (deterministic, offline). ``kimi`` is opt-in via
``--export-backend kimi`` or the project's upm manifest. Every export records
the backend actually used in .upm/export-record.json.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from upm.errors import ConfigError
from upm.export.base import ExportResult
from upm.export.local import export_local, local_healthcheck


def list_backends() -> list[str]:
    return ["local", "kimi"]


def _load_kimi():
    from upm.adapters.kimi.exporter import export_kimi, kimi_healthcheck

    return export_kimi, kimi_healthcheck


def export_pptx(
    project_dir: str | Path,
    output: str | Path | None = None,
    *,
    backend: str = "local",
    transition: str = "fade",
    mode: str = "standard",
    force: bool = True,
    **options: Any,
) -> ExportResult:
    project = Path(project_dir).expanduser().resolve()
    if backend == "local":
        result = export_local(project, output, transition=transition, mode=mode, force=force)
    elif backend == "kimi":
        # Experimental: environment-ready ≠ end-to-end verified formal delivery.
        if str(mode) in {"standard", "audit"} and not options.get("allow_kimi_formal"):
            raise ConfigError(
                "Kimi 导出不能作为 standard/audit 正式交付后端（实验插件，e2e 未验证）。",
                hint="使用 --export-backend local，或仅在 quick 实验路径显式尝试 kimi。",
            )
        export_kimi, _ = _load_kimi()
        result = export_kimi(project, output, transition=transition, mode=mode, force=force, **options)
        if result.warnings is not None:
            result.warnings.append(
                "Kimi backend is experimental: dependency readiness does not imply PPTX delivery works."
            )
    else:
        raise ConfigError(f"未知导出后端：{backend}（可用：{', '.join(list_backends())}）")
    record = result.to_record(project)
    record_path = project / ".upm" / "export-record.json"
    record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


def backend_healthcheck(backend: str) -> dict[str, Any]:
    if backend == "local":
        return local_healthcheck()
    if backend == "kimi":
        from upm.adapters.kimi.exporter import kimi_healthcheck

        return kimi_healthcheck()
    raise ConfigError(f"未知导出后端：{backend}")
