"""`upm review`: re-run visual and delivery audit for a PPTD project."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from upm.errors import ProjectError
from upm.pptd.io import require_valid_project
from upm.pptd.schema import issues_by_severity, validate_pptd_project
from upm.qa.render import render_pages_local
from upm.qa.repair import RepairState, plan_repairs, write_repair_plan
from upm.qa.report import build_quality_report
from upm.qa.rubric import run_rubric


def run_review(args: Any) -> int:
    project = Path(args.project).expanduser().resolve()
    if not (project / "deck.pptd").is_file():
        raise ProjectError(f"不是 PPTD 项目：{project}")
    require_valid_project(project)
    issues = validate_pptd_project(project)
    structure_errors, structure_warnings = issues_by_severity(issues)
    deckir_path = project / ".upm" / "deckir.json"
    deckir: dict[str, Any] = {}
    if deckir_path.is_file():
        deckir = json.loads(deckir_path.read_text(encoding="utf-8"))

    if args.render_backend == "kimi":
        from upm.adapters.kimi.renderer import export_kimi_images

        summary = export_kimi_images(project, force=True)
        render_records = [
            {
                "page": item["page"] or f"P{item['index']:02d}",
                "ok": True,
                "path": str(project / ".upm" / "renders" / "kimi" / item["image"]),
            }
            for item in summary["images"]
        ]
    else:
        render_records = render_pages_local(project)
    findings = run_rubric(project, render_records, deckir=deckir, structure_errors=[issue.render() for issue in structure_errors])
    plan = plan_repairs(findings, RepairState())
    write_repair_plan(project, plan)
    export_record = {}
    export_path = project / ".upm" / "export-record.json"
    if export_path.is_file():
        export_record = json.loads(export_path.read_text(encoding="utf-8"))
    report = build_quality_report(
        project,
        structure_errors=structure_errors,
        structure_warnings=structure_warnings,
        overflow_findings=[],
        render_records=render_records,
        rubric_findings=findings,
        export_result=export_record,
        rounds_used=0,
        unresolved=[f for f in findings if f["severity"] == "error"],
        quality_mode=args.mode,
        backend=str(export_record.get("backend") or "local"),
    )
    print("\n=== 审计结果 ===")
    print(json.dumps(report["gates"], ensure_ascii=False, indent=2))
    print(f"渲染成功：{report['summary']['rendered']}/{report['summary']['slides']}")
    for finding in findings:
        print(f"[{finding['severity']}] {finding.get('page')}: {finding['message']}")
    print(f"\n联系表：{project / 'preview' / 'overview.jpg'}")
    print(f"质量报告：{project / '.upm' / 'quality-report.json'}")
    allow_fail = bool(getattr(args, "allow_quality_fail", False))
    overall = str(report.get("overall") or "fail")
    if overall != "pass" and not allow_fail:
        print(f"[quality] 审计未通过（overall={overall}）。使用 --allow-quality-fail 强制 exit 0。", flush=True)
        return 2
    return 0
