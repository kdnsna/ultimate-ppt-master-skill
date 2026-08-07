"""`upm make`: full editable-deck / web-deck generation pipeline."""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from upm.cli.common import (
    attach_tables_to_deckir,
    create_project_dir,
    extract_markdown_tables,
    import_input,
    print_delivery,
    project_title,
)
from upm.compiler.compiler import compile_deck
from upm.compiler.deckir import build_deckir, load_deckir
from upm.errors import InputError, StructureGateError
from upm.export.registry import export_pptx
from upm.pptd.io import ensure_project_layout, write_quality_artifact
from upm.pptd.schema import issues_by_severity, validate_pptd_project
from upm.qa.policy import load_policy
from upm.qa.renders import render_and_review
from upm.qa.repair import RepairState, plan_repairs, write_repair_plan
from upm.qa.report import build_quality_report
from upm.qa.rubric import run_rubric


def _parse_image_flags(flags: list[str]) -> dict[str, str]:
    images: dict[str, str] = {}
    for flag in flags:
        if "=" not in flag:
            raise InputError(f"--image 需要 P01=path 格式：{flag}")
        key, value = flag.split("=", 1)
        images[key.strip()] = value.strip()
    return images


def _build_web_deck(project: Path, title: str) -> Path:
    """Build a self-contained web deck from rendered SVG pages."""
    from upm.pptd.io import load_project
    from upm.render.svg import render_page_svg

    root, manifest, pages = load_project(project)
    theme = manifest.get("theme") or {}
    svg_pages = [render_page_svg(page, theme, href_prefix="../") for _, page in pages]
    sections: list[str] = []
    for index, content in enumerate(svg_pages, start=1):
        sections.append(
            f'<section class="slide"><div class="frame">{content}</div>'
            f'<footer><span>{index:02d} / {len(svg_pages):02d}</span></footer></section>'
        )
    html = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{title}</title>
<style>
html,body{{margin:0;background:#171714;color:#F6F3ED;font-family:'Microsoft YaHei',sans-serif}}
.slide{{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px}}
.frame{{width:min(960px,92vw);background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.4)}}
.frame svg{{display:block;width:100%;height:auto}}
footer{{margin-top:10px;font-size:12px;color:#8a8f98}}
</style></head>
<body><main>{"".join(sections)}</main></body></html>"""
    web_dir = project / "web"
    web_dir.mkdir(parents=True, exist_ok=True)
    output = web_dir / "index.html"
    output.write_text(html, encoding="utf-8")
    return output


def _demote_export_to_draft(export_result: dict[str, Any] | None) -> dict[str, Any] | None:
    """Move formal PPTX out of exports/ into exports/draft/ when quality fails."""
    if not export_result:
        return export_result
    output = export_result.get("output")
    if not output:
        return export_result
    path = Path(str(output))
    if not path.is_file():
        return export_result
    # Already under draft/
    if path.parent.name == "draft":
        return export_result
    draft_dir = path.parent / "draft"
    draft_dir.mkdir(parents=True, exist_ok=True)
    target = draft_dir / path.name
    if target.exists():
        target.unlink()
    shutil.move(str(path), str(target))
    export_result = dict(export_result)
    export_result["output"] = str(target)
    export_result["deliveryPath"] = "draft"
    print(f"[quality] 非正式交付：产物已移至 {target}", flush=True)
    return export_result


def run_make(args: Any) -> int:
    policy = load_policy(args.mode)
    if args.no_qa and not policy.allow_skip_qa:
        raise InputError(
            f"质量模式 {policy.mode} 不允许 --no-qa（契约要求视觉证据）。",
            hint="去掉 --no-qa，或改用 --mode standard/quick；调试可用 --allow-quality-fail。",
        )

    title = project_title(args.input, args.title)
    project = create_project_dir(args.out, title)
    ensure_project_layout(project)

    source_text, import_note = import_input(args.input, project)
    tables = extract_markdown_tables(source_text)
    print(f"资料导入：{import_note}")
    if tables:
        print(f"检测到 {len(tables)} 个 Markdown 表格，将绑定到证据/图表页。")

    if args.deckir:
        deckir = load_deckir(args.deckir)
        deckir["_imported"] = True
    else:
        deckir = build_deckir(
            title,
            source_text,
            page_count=args.pages,
            direction_id=args.direction,
            output_mode=args.deck_format,
            quality_mode=args.mode,
        )
    attach_tables_to_deckir(deckir, tables)

    images = _parse_image_flags(args.image)
    compile_summary = compile_deck(deckir, project, direction_id=args.direction, images=images)
    print(f"PPTD 编译完成：{compile_summary['pages']} 页 → {project / 'deck.pptd'}")
    print(f"规划来源：{deckir.get('planningMode') or 'imported-deckir'}")

    issues = validate_pptd_project(project)
    structure_errors, structure_warnings = issues_by_severity(issues)
    for issue in structure_errors[:10]:
        print(issue.render())
    if structure_errors:
        raise StructureGateError(
            f"结构校验未通过（{len(structure_errors)} 个错误），禁止导出。",
            hint="检查上方的错误定位并修复 .pptd/.page 后重跑 upm make。",
        )

    render_records: list[dict[str, Any]] = []
    rubric_findings: list[dict[str, Any]] = []
    rounds_used = 0
    unresolved: list[dict[str, Any]] = []
    qa_skipped = bool(args.no_qa) or not policy.require_visual
    if not qa_skipped:
        render_records, rubric_findings, rounds_used, unresolved = render_and_review(
            project,
            deckir=deckir,
            structure_errors=[issue.render() for issue in structure_errors],
            render_backend=args.render_backend,
            mode=policy.mode,
            policy=policy,
        )
        plan = plan_repairs(
            rubric_findings
            + [{"id": "render-failed", "page": "?"} for rec in render_records if not rec.get("ok")],
            RepairState(rounds=rounds_used),
        )
        write_repair_plan(project, plan)
        if plan["roundBudgetExceeded"]:
            print(f"[warn] 达到修复轮次上限（{plan['maxRounds']} 轮），剩余问题记录在质量报告。")
    else:
        # Still run page-level rubric (placeholders, leaks, overflow) without visual renders.
        rubric_findings = run_rubric(
            project,
            [],
            deckir=deckir,
            structure_errors=[issue.render() for issue in structure_errors],
            policy=policy,
            quality_mode=policy.mode,
        )

    export_result = None
    if args.deck_format == "editable-deck":
        result = export_pptx(
            project,
            backend=args.export_backend,
            mode=policy.mode,
            force=True,
        )
        export_result = result.to_record(project)
        print(f"PPTX 导出完成（backend={result.backend}）：{result.output}")
        print(f"  页面 {result.slides} · 校验 {'通过' if result.verified else '失败'} · {result.bytes} 字节")
        for warning in result.warnings:
            print(f"[warn] {warning}")
    else:
        web_path = _build_web_deck(project, title)
        export_result = {
            "backend": "web-deck",
            "verified": True,
            "output": str(web_path),
            "slides": len(list((project / ".upm" / "intermediate" / "svg").glob("*.svg"))),
            "bytes": web_path.stat().st_size,
        }
        print(f"Web Deck 导出完成：{web_path}")

    # Provisional report to decide formal vs draft delivery.
    provisional = build_quality_report(
        project,
        structure_errors=structure_errors,
        structure_warnings=structure_warnings,
        overflow_findings=compile_summary["overflowFindings"],
        render_records=render_records,
        rubric_findings=rubric_findings,
        export_result=export_result,
        rounds_used=rounds_used,
        unresolved=unresolved,
        quality_mode=policy.mode,
        backend=args.export_backend if args.deck_format == "editable-deck" else "web-deck",
        qa_skipped=qa_skipped,
        policy=policy,
        deckir=deckir,
        delivery_path="formal",
    )

    allow_fail = bool(getattr(args, "allow_quality_fail", False))
    overall = str(provisional.get("overall") or "fail")
    delivery_path = "formal"
    if overall != "pass" and not allow_fail:
        export_result = _demote_export_to_draft(export_result)
        delivery_path = "draft"
    elif overall != "pass" and allow_fail:
        delivery_path = "formal"  # kept in place but marked non-formal in report

    report = build_quality_report(
        project,
        structure_errors=structure_errors,
        structure_warnings=structure_warnings,
        overflow_findings=compile_summary["overflowFindings"],
        render_records=render_records,
        rubric_findings=rubric_findings,
        export_result=export_result,
        rounds_used=rounds_used,
        unresolved=unresolved,
        quality_mode=policy.mode,
        backend=args.export_backend if args.deck_format == "editable-deck" else "web-deck",
        qa_skipped=qa_skipped,
        policy=policy,
        deckir=deckir,
        delivery_path=delivery_path,
    )
    # Keep overall based on gates, not on draft path (draft is a consequence).
    report["overall"] = overall
    report["gates"]["formalDelivery"] = "pass" if overall == "pass" else "fail"
    write_quality_artifact(project, "make-summary.json", report)
    # Rewrite quality-report with corrected overall
    report_path = project / ".upm" / "quality-report.json"
    report_path.write_text(
        __import__("json").dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    summary = {
        "slides": compile_summary["pages"],
        "backend": report["exportBackend"],
        "gates": report["gates"],
        "overall": report.get("overall"),
        "planningSource": report.get("planningSource"),
        "warnings": [issue["message"] for issue in rubric_findings if issue["severity"] == "warning"][:8],
        "pptx": str((export_result or {}).get("output") or ""),
        "overview": str(project / "preview" / "overview.jpg"),
    }
    print_delivery(project, title, summary)

    if overall != "pass" and not allow_fail:
        print(
            f"\n[quality] 质量门未通过（overall={overall}）。"
            f" gates={report['gates']}。"
            f" 使用 --allow-quality-fail 可强制以 0 退出（非正式交付）。",
            flush=True,
        )
        return 2
    if overall != "pass" and allow_fail:
        print(f"\n[quality] 质量门未通过但已 --allow-quality-fail（overall={overall}）。", flush=True)
    return 0
