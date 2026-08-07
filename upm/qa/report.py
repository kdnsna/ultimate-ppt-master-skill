"""Quality report writer for the generation pipeline."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from upm.qa.repair import MAX_REPAIR_ROUNDS


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def build_quality_report(
    project: str | Path,
    *,
    structure_errors: list[Any],
    structure_warnings: list[Any],
    overflow_findings: list[dict[str, Any]],
    render_records: list[dict[str, Any]],
    rubric_findings: list[dict[str, Any]],
    export_result: dict[str, Any] | None,
    rounds_used: int,
    unresolved: list[dict[str, Any]],
    quality_mode: str = "standard",
    backend: str = "local",
) -> dict[str, Any]:
    root = Path(project).expanduser().resolve()
    rendered = sum(1 for rec in render_records if rec.get("ok"))
    render_failed = sum(1 for rec in render_records if not rec.get("ok"))
    errors = [issue for issue in rubric_findings if issue.get("severity") == "error"]
    warnings = [issue for issue in rubric_findings if issue.get("severity") == "warning"]
    structure_passed = not structure_errors
    visual_passed = render_failed == 0
    export_passed = bool(export_result and export_result.get("verified"))
    report = {
        "version": "upm-quality-report-v1",
        "createdAt": _now_iso(),
        "project": str(root),
        "qualityMode": quality_mode,
        "exportBackend": backend,
        "gates": {
            "structure": "pass" if structure_passed else "fail",
            "overflow": "pass" if not any(f.get("severity") == "error" for f in overflow_findings) else "fail",
            "visual": "pass" if visual_passed else "fail",
            "export": "pass" if export_passed else "fail",
            "formalDelivery": "pass" if not errors else "fail",
        },
        "summary": {
            "slides": len(render_records),
            "rendered": rendered,
            "renderFailed": render_failed,
            "structureErrors": len(structure_errors),
            "structureWarnings": len(structure_warnings),
            "overflowFindings": len(overflow_findings),
            "rubricFindings": len(rubric_findings),
            "rubricErrors": len(errors),
            "rubricWarnings": len(warnings),
            "repairRoundsUsed": rounds_used,
            "repairRoundsMax": MAX_REPAIR_ROUNDS,
            "unresolved": len(unresolved),
        },
        "evidence": {
            "overview": str(root / "preview" / "overview.jpg"),
            "renderBackend": "playwright/agent-browser" if rendered else "none",
            "renderRecords": render_records,
            "export": export_result or {},
        },
        "unresolved": unresolved,
    }
    path = root / ".upm" / "quality-report.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(__import__("json").dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report
