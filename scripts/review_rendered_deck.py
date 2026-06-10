#!/usr/bin/env python3
"""Review rendered PPT/Web artifacts and merge findings into quality-report.json."""

from __future__ import annotations

import json
import re
import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SKIP_DIRS = {"node_modules", ".git", ".venv", "dist", "build", "__pycache__"}
BODY_ROLES = {"context", "evidence", "comparison", "process", "benefit", "risk", "action"}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def read_json(path: Path) -> Any:
    if not path.exists():
        return {}
    try:
        return json.loads(read_text(path))
    except Exception:
        return {}


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def discover_html(project: Path) -> list[Path]:
    html_files: list[Path] = []
    for item in project.rglob("*"):
        if not item.is_file() or any(part in SKIP_DIRS for part in item.parts):
            continue
        if item.suffix.lower() in {".html", ".htm"}:
            html_files.append(item)
    return html_files


def html_layouts(html_files: list[Path]) -> list[str]:
    layouts: list[str] = []
    for path in html_files:
        html = read_text(path)
        layouts.extend(re.findall(r"data-layout=[\"']([^\"']+)[\"']", html, flags=re.IGNORECASE))
    return layouts


def repeated(items: list[str], threshold: int = 3) -> bool:
    if len(items) < threshold:
        return False
    return any(items[idx: idx + threshold] == [items[idx]] * threshold for idx in range(0, len(items) - threshold + 1))


def review_command() -> str:
    return "python3 scripts/apply_review_plan.py <project_path> --safe-only --apply"


def add_finding(
    findings: list[dict[str, Any]],
    *,
    fid: str,
    severity: str,
    message: str,
    suggestion: str,
    auto_fixable: bool,
    risk_level: str,
    target_artifact: str,
    page: str = "",
) -> None:
    findings.append(
        {
            "id": fid,
            "severity": severity,
            "message": message,
            "suggestion": suggestion,
            "autoFixable": auto_fixable,
            "riskLevel": risk_level,
            "targetArtifact": target_artifact,
            "suggestedCommand": review_command(),
            "page": page,
        }
    )


def repair_action_for(fid: str) -> str:
    return {
        "layout-variety": "add-layout-variety-brief",
        "repeated-layout": "add-layout-variety-brief",
        "repeated-recipe": "suggest-recipe-swap",
        "missing-evidence": "add-evidence-placeholder",
        "body-raster-policy": "set-editable-raster-policy",
        "missing-storyboard": "run-storyboard-planner",
    }.get(fid, "add-human-review-note")


def build_repair_candidates(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for index, finding in enumerate(findings, 1):
        if not finding.get("autoFixable"):
            continue
        fid = str(finding.get("id") or f"finding-{index}")
        target = str(finding.get("targetArtifact") or "quality-report.json")
        candidates.append(
            {
                "id": f"RC{index:03d}",
                "findingId": fid,
                "title": str(finding.get("suggestion") or finding.get("message") or fid),
                "action": repair_action_for(fid),
                "riskLevel": str(finding.get("riskLevel") or "low"),
                "autoFixable": True,
                "targetArtifact": target,
                "page": str(finding.get("page") or ""),
                "suggestedCommand": review_command(),
                "status": "proposed",
                "notes": "Safe repair writes planning hints only; it must not rewrite source facts or final slide conclusions.",
            }
        )
    return candidates


def build_repair_plan(project: Path, review: dict[str, Any]) -> dict[str, Any]:
    candidates = list(review.get("repairCandidates") or [])
    return {
        "version": "review-repair-plan-v1",
        "createdAt": review.get("createdAt") or now_iso(),
        "status": "proposed" if candidates else "pass",
        "projectPath": str(project),
        "mode": "safe-only",
        "dryRunDefault": True,
        "candidateCount": len(candidates),
        "safeCandidateCount": sum(1 for item in candidates if item.get("autoFixable") and item.get("riskLevel") == "low"),
        "revisionBrief": "revision-brief.md",
        "dryRunCommand": "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run",
        "applyCommand": review_command(),
        "candidates": candidates,
        "summary": {
            "candidateCount": len(candidates),
            "safeCandidateCount": sum(1 for item in candidates if item.get("autoFixable") and item.get("riskLevel") == "low"),
            "targetArtifacts": sorted({str(item.get("targetArtifact") or "") for item in candidates if item.get("targetArtifact")}),
        },
        "guardrails": [
            "Do not change source.md, extracted-source.md, or factual slide claims automatically.",
            "Only write DeckIR, project brief, quality report, and Agent instruction hints.",
            "Require an explicit --apply invocation for any mutation.",
        ],
    }


def review_project(project: Path) -> dict[str, Any]:
    storyboard = read_json(project / "storyboard.json")
    manifest = read_json(project / "manifest.json")
    slides = storyboard.get("slides") if isinstance(storyboard, dict) else []
    slides = slides if isinstance(slides, list) else []
    findings: list[dict[str, Any]] = []

    layouts = html_layouts(discover_html(project))
    if len(layouts) >= 3 and len(set(layouts)) < 2:
        add_finding(
            findings,
            fid="layout-variety",
            severity="medium",
            message="Rendered HTML uses too little layout variety.",
            suggestion="Switch at least one body page to comparison, process, metric, evidence, or action layout.",
            auto_fixable=True,
            risk_level="low",
            target_artifact="codex-task.md",
        )
    if repeated(layouts):
        add_finding(
            findings,
            fid="repeated-layout",
            severity="medium",
            message="Three consecutive rendered pages share the same layout.",
            suggestion="Use DeckIR page roles to redistribute body pages across different layout families.",
            auto_fixable=True,
            risk_level="low",
            target_artifact="codex-task.md",
        )

    recipes = [str(slide.get("recipeId") or "") for slide in slides if isinstance(slide, dict)]
    if repeated(recipes):
        add_finding(
            findings,
            fid="repeated-recipe",
            severity="medium",
            message="Three consecutive DeckIR pages share the same recipe.",
            suggestion="Replace one repeated recipe with a nearby page recipe from templates/page-recipes/index.json.",
            auto_fixable=True,
            risk_level="low",
            target_artifact="storyboard.json",
        )

    for slide in slides:
        if not isinstance(slide, dict):
            continue
        page = str(slide.get("page") or "slide")
        role = str(slide.get("role") or "")
        evidence = slide.get("evidenceRefs")
        if role in BODY_ROLES and (not isinstance(evidence, list) or not evidence):
            add_finding(
                findings,
                fid="missing-evidence",
                severity="high",
                message=f"{page} has a formal body role but no source evidence refs.",
                suggestion="Add a human evidence-mapping placeholder before final generation; do not invent source facts.",
                auto_fixable=True,
                risk_level="low",
                target_artifact="storyboard.json",
                page=page,
            )
        raster = str(slide.get("rasterPolicy") or "").lower()
        if role in BODY_ROLES and "prohibited-formal-body" not in raster:
            add_finding(
                findings,
                fid="body-raster-policy",
                severity="high",
                message=f"{page} allows raster output on formal body role `{role}`.",
                suggestion="Set rasterPolicy to prohibited-formal-body and keep body content editable.",
                auto_fixable=True,
                risk_level="low",
                target_artifact="storyboard.json",
                page=page,
            )

    if not findings and manifest.get("qualityGate", {}).get("level") == "formal-business" and not slides:
        add_finding(
            findings,
            fid="missing-storyboard",
            severity="medium",
            message="Formal-business project has no storyboard.json slides for rendered review.",
            suggestion="Run scripts/ai_storyboard.py before final generation.",
            auto_fixable=True,
            risk_level="low",
            target_artifact="planning-report.json",
        )

    status = "pass" if not findings else "needs-attention"
    repair_candidates = build_repair_candidates(findings)
    return {
        "version": "rendered-review-v1",
        "createdAt": now_iso(),
        "status": status,
        "projectPath": str(project),
        "findings": findings,
        "repairCandidates": repair_candidates,
        "summary": {
            "findingCount": len(findings),
            "autoFixableCount": sum(1 for item in findings if item.get("autoFixable")),
            "repairCandidateCount": len(repair_candidates),
            "layoutsSeen": sorted(set(layouts)),
            "slidesReviewed": len(slides),
        },
    }


def merge_quality_report(project: Path, review: dict[str, Any]) -> None:
    report_path = project / "quality-report.json"
    report = read_json(report_path)
    if not isinstance(report, dict):
        report = {}
    report["reviewFindings"] = {
        "status": review["status"],
        "path": "review-findings.json",
        "findingCount": len(review["findings"]),
        "autoFixableCount": review["summary"]["autoFixableCount"],
        "repairCandidateCount": review["summary"].get("repairCandidateCount", 0),
        "repairPlan": "repair-plan.json",
    }
    report["reviewRepairPlan"] = {
        "status": "proposed" if review["summary"].get("repairCandidateCount", 0) else "pass",
        "path": "repair-plan.json",
        "candidateCount": review["summary"].get("repairCandidateCount", 0),
        "dryRunCommand": "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run",
        "applyCommand": review_command(),
    }
    checks = report.get("checks")
    if not isinstance(checks, list):
        checks = []
    checks.append(
        {
            "id": "rendered-review",
            "status": "pass" if review["status"] == "pass" else "needs-attention",
            "summary": f"review_rendered_deck.py found {len(review['findings'])} issue(s).",
        }
    )
    report["checks"] = checks
    write_json(report_path, report)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Review rendered PPT/Web artifacts and write review-findings.json plus repair-plan.json."
    )
    parser.add_argument("project_path", help="Project folder containing storyboard.json, manifest.json, rendered HTML, or PPTX artifacts.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    project = Path(args.project_path).expanduser().resolve()
    if not project.exists() or not project.is_dir():
        print(f"Project path does not exist or is not a directory: {project}", file=sys.stderr)
        return 2
    review = review_project(project)
    write_json(project / "review-findings.json", review)
    write_json(project / "repair-plan.json", build_repair_plan(project, review))
    merge_quality_report(project, review)
    print(json.dumps({"script": "review_rendered_deck.py", "status": review["status"], "findings": len(review["findings"])}, ensure_ascii=False))
    return 0 if review["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
