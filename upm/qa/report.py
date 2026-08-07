"""Quality report writer for the generation pipeline."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from upm.qa.policy import QualityPolicy, load_policy, planning_source_of
from upm.qa.repair import MAX_REPAIR_ROUNDS


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _gate_status(value: str) -> str:
    allowed = {"pass", "fail", "warning", "not-run", "unverified"}
    return value if value in allowed else "fail"


def overall_from_gates(gates: dict[str, str], *, policy: QualityPolicy) -> str:
    """Compute overall status from gate map and quality policy."""
    effective = dict(gates)
    if not policy.visual_not_run_fails and effective.get("visual") in {"not-run", "unverified"}:
        effective["visual"] = "pass"
    values = list(effective.values())
    if any(v == "fail" for v in values):
        return "fail"
    if any(v in {"not-run", "unverified"} for v in values):
        return "fail" if policy.visual_not_run_fails else "unverified"
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
    policy: QualityPolicy | None = None,
    deckir: dict[str, Any] | None = None,
    delivery_path: str = "formal",
    office_render: dict[str, Any] | None = None,
) -> dict[str, Any]:
    root = Path(project).expanduser().resolve()
    policy = policy or load_policy(quality_mode)
    quality_mode = policy.mode
    rendered = sum(1 for rec in render_records if rec.get("ok"))
    render_failed = sum(1 for rec in render_records if not rec.get("ok"))
    errors = [issue for issue in rubric_findings if issue.get("severity") == "error"]
    warnings = [issue for issue in rubric_findings if issue.get("severity") == "warning"]
    structure_passed = not structure_errors
    overflow_errors = [f for f in overflow_findings if f.get("severity") == "error"]
    overflow_gate = "fail" if overflow_errors else "pass"

    if qa_skipped or not policy.require_visual:
        visual_gate = "not-run"
    elif not render_records:
        visual_gate = "not-run"
    elif render_failed > 0:
        visual_gate = "fail"
    else:
        visual_gate = "pass"

    export_passed = bool(export_result and export_result.get("verified"))
    if policy.require_export_verified and not export_passed:
        export_gate = "fail"
    elif export_passed:
        export_gate = "pass"
    else:
        export_gate = "not-run"

    office = dict(office_render or {})
    office_status = str(office.get("status") or "not-run")
    office_blocks = (
        policy.require_office_render_when_available
        and office_status == "fail"
        and office.get("tool")  # only when soffice was present and failed
    )

    visual_blocks = visual_gate in {"fail", "not-run"} and policy.visual_not_run_fails
    formal_fail = (
        not structure_passed
        or bool(overflow_errors)
        or visual_blocks
        or (policy.require_export_verified and not export_passed)
        or bool(errors)
        or bool(unresolved)
        or bool(office_blocks)
    )

    gates = {
        "structure": _gate_status("pass" if structure_passed else "fail"),
        "overflow": _gate_status(overflow_gate),
        "visual": _gate_status(visual_gate),
        "export": _gate_status(export_gate),
        "officeRender": _gate_status(
            "pass" if office_status == "ok" else "fail" if office_status == "fail" else "not-run"
        ),
        "formalDelivery": _gate_status("fail" if formal_fail else "pass"),
    }
    # officeRender not-run must not fail overall unless policy requires available tool.
    overall = overall_from_gates(
        {k: v for k, v in gates.items() if k != "officeRender" or v != "not-run" or office_blocks},
        policy=policy,
    )
    if office_blocks:
        overall = "fail"
    export_meta = dict(export_result or {})
    export_meta["formal"] = overall == "pass" and delivery_path == "formal"
    export_meta["deliveryPath"] = delivery_path
    export_meta["officeRender"] = office_status
    export_meta["officeRenderDetail"] = office
    report = {
        "version": "upm-quality-report-v1",
        "createdAt": _now_iso(),
        "project": str(root),
        "qualityMode": quality_mode,
        "exportBackend": backend,
        "overall": overall,
        "planningSource": planning_source_of(deckir),
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
            "deliveryPath": delivery_path,
            "officeRender": office_status,
        },
        "evidence": {
            "overview": str(root / "preview" / "overview.jpg"),
            "renderBackend": "playwright/agent-browser" if rendered else "none",
            "renderRecords": render_records,
            "export": export_meta,
            "officeRender": office,
        },
        "unresolved": unresolved,
    }
    path = root / ".upm" / "quality-report.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(__import__("json").dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report
