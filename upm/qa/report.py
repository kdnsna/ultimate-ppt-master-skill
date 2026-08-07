"""Quality report writer for the generation pipeline."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from upm.qa.repair import MAX_REPAIR_ROUNDS


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _gate_status(value: str) -> str:
    allowed = {"pass", "fail", "warning", "not-run", "unverified"}
    return value if value in allowed else "fail"


def overall_from_gates(gates: dict[str, str], *, quality_mode: str) -> str:
    """Compute overall status. ``not-run`` / ``unverified`` fail for standard/audit.

    In ``quick`` mode, visual QA is intentionally skipped, so ``visual=not-run``
    is treated as expected rather than a delivery failure.
    """
    effective = dict(gates)
    if quality_mode == "quick" and effective.get("visual") in {"not-run", "unverified"}:
        effective["visual"] = "pass"
    values = list(effective.values())
    if any(v == "fail" for v in values):
        return "fail"
    if any(v in {"not-run", "unverified"} for v in values):
        return "fail" if quality_mode in {"standard", "audit"} else "unverified"
    if any(v == "warning" for v in values):
        return "pass"
    if all(v == "pass" for v in values):
        return "pass"
    return "unverified"


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
    qa_skipped: bool = False,
) -> dict[str, Any]:
    root = Path(project).expanduser().resolve()
    rendered = sum(1 for rec in render_records if rec.get("ok"))
    render_failed = sum(1 for rec in render_records if not rec.get("ok"))
    errors = [issue for issue in rubric_findings if issue.get("severity") == "error"]
    warnings = [issue for issue in rubric_findings if issue.get("severity") == "warning"]
    structure_passed = not structure_errors
    overflow_errors = [f for f in overflow_findings if f.get("severity") == "error"]
    overflow_gate = "fail" if overflow_errors else "pass"

    if qa_skipped or quality_mode == "quick":
        visual_gate = "not-run"
    elif not render_records:
        # No evidence of rendering → never claim visual pass.
        visual_gate = "not-run"
    elif render_failed > 0:
        visual_gate = "fail"
    else:
        visual_gate = "pass"

    export_passed = bool(export_result and export_result.get("verified"))
    formal_fail = (
        not structure_passed
        or overflow_errors
        or visual_gate in {"fail", "not-run"} and quality_mode in {"standard", "audit"}
        or not export_passed
        or bool(errors)
        or bool(unresolved)
    )
    # quick mode: visual not-run is expected; do not fail formal on that alone
    if quality_mode == "quick":
        formal_fail = (
            not structure_passed
            or bool(overflow_errors)
            or not export_passed
            or bool(errors)
        )

    gates = {
        "structure": _gate_status("pass" if structure_passed else "fail"),
        "overflow": _gate_status(overflow_gate),
        "visual": _gate_status(visual_gate),
        "export": _gate_status("pass" if export_passed else "fail"),
        "formalDelivery": _gate_status("fail" if formal_fail else "pass"),
    }
    overall = overall_from_gates(gates, quality_mode=quality_mode)
    report = {
        "version": "upm-quality-report-v1",
        "createdAt": _now_iso(),
        "project": str(root),
        "qualityMode": quality_mode,
        "exportBackend": backend,
        "overall": overall,
        "gates": gates,
        "summary": {
            "slides": len(render_records),
            "rendered": rendered,
            "renderFailed": render_failed,
            "structureErrors": len(structure_errors),
            "structureWarnings": len(structure_warnings),
            "overflowFindings": len(overflow_findings),
            "overflowErrors": len(overflow_errors),
            "rubricFindings": len(rubric_findings),
            "rubricErrors": len(errors),
            "rubricWarnings": len(warnings),
            "repairRoundsUsed": rounds_used,
            "repairRoundsMax": MAX_REPAIR_ROUNDS,
            "unresolved": len(unresolved),
            "qaSkipped": qa_skipped,
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
