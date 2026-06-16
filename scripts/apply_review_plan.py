#!/usr/bin/env python3
"""Apply low-risk rendered-review repair plans.

The script deliberately avoids changing source facts or final slide content. It
only writes planning hints into DeckIR, project briefs, quality reports, and
Agent instructions so a human or Agent can perform the next revision safely.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ALLOWED_ARTIFACTS = {"storyboard.json", "project-brief.json", "quality-report.json", "codex-task.md", "AGENTS.md", "repair-plan.json", "revision-brief.md"}
BRIEF_MARKER = "## v4.3 Rendered Review Repair Brief"
REVISION_BRIEF = "revision-brief.md"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> Any:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def safe_candidates(plan: dict[str, Any], safe_only: bool) -> list[dict[str, Any]]:
    items = plan.get("candidates")
    if not isinstance(items, list):
        return []
    candidates = [item for item in items if isinstance(item, dict)]
    if not safe_only:
        return candidates
    return [
        item
        for item in candidates
        if item.get("autoFixable") is True
        and item.get("riskLevel") == "low"
        and str(item.get("targetArtifact") or "") in ALLOWED_ARTIFACTS
    ]


def compact_candidate(candidate: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": candidate.get("id"),
        "findingId": candidate.get("findingId"),
        "title": candidate.get("title"),
        "action": candidate.get("action"),
        "targetArtifact": candidate.get("targetArtifact"),
        "page": candidate.get("page") or "",
        "riskLevel": candidate.get("riskLevel"),
    }


def candidate_bullets(candidates: list[dict[str, Any]]) -> str:
    if not candidates:
        return "- No safe rendered-review repair candidates.\n"
    lines = []
    for item in candidates:
        page = f" `{item.get('page')}`" if item.get("page") else ""
        lines.append(f"- {item.get('id')}{page}: {item.get('title')} ({item.get('targetArtifact')})")
    return "\n".join(lines) + "\n"


def build_revision_brief(candidates: list[dict[str, Any]], applied_at: str) -> str:
    candidate_lines = candidate_bullets(candidates)
    return (
        "# v5 Delivery Review Revision Brief\n\n"
        f"Generated at: `{applied_at}`\n\n"
        "This brief is generated from `review-findings.json` and `repair-plan.json`.\n"
        "Do not rewrite source facts, business conclusions, or final body copy automatically.\n"
        "Use it as a second-generation instruction layer after the user confirms the repair direction.\n\n"
        "## Safe Candidates\n\n"
        f"{candidate_lines}\n"
        "## Required Guardrails\n\n"
        "- Keep `source.md` and extracted source material unchanged.\n"
        "- Use evidence placeholders only to request human source-map selection; never invent evidence.\n"
        "- Prefer recipe variety, density relief, raster-policy correction, and visual prompt reinforcement.\n"
        "- Re-run `python3 scripts/review_rendered_deck.py <project_path>` after the next generation.\n"
    )


def append_markdown_brief(path: Path, candidates: list[dict[str, Any]], applied_at: str) -> None:
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    section = (
        f"\n{BRIEF_MARKER}\n\n"
        f"Applied at: `{applied_at}`\n\n"
        "These are low-risk planning hints from `review-findings.json`. They do not rewrite source facts or final slide claims.\n\n"
        f"{candidate_bullets(candidates)}"
    )
    if BRIEF_MARKER in text:
        text = text.split(BRIEF_MARKER, 1)[0].rstrip() + section
    else:
        text = text.rstrip() + "\n" + section
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def update_storyboard(path: Path, candidates: list[dict[str, Any]], applied_at: str) -> None:
    data = read_json(path)
    if not isinstance(data, dict):
        return
    hints = data.get("reviewRepairHints")
    if not isinstance(hints, list):
        hints = []
    existing_ids = {item.get("id") for item in hints if isinstance(item, dict)}
    for candidate in candidates:
        summary = compact_candidate(candidate)
        summary["appliedAt"] = applied_at
        if summary["id"] not in existing_ids:
            hints.append(summary)
    data["reviewRepairHints"] = hints

    slides = data.get("slides")
    if isinstance(slides, list):
        by_page = {str(item.get("page") or ""): item for item in candidates if item.get("page")}
        for slide in slides:
            if not isinstance(slide, dict):
                continue
            page = str(slide.get("page") or "")
            candidate = by_page.get(page)
            if not candidate:
                continue
            slide_hints = slide.get("repairHints")
            if not isinstance(slide_hints, list):
                slide_hints = []
            slide_hints.append(compact_candidate(candidate))
            slide["repairHints"] = slide_hints
            if candidate.get("action") == "set-editable-raster-policy":
                slide["rasterPolicy"] = "prohibited-formal-body"
            if candidate.get("action") == "add-evidence-placeholder":
                slide["evidencePlaceholder"] = "Needs human source-map claim selection before final generation; do not invent evidence."

    write_json(path, data)


def update_json_summary(path: Path, candidates: list[dict[str, Any]], applied_at: str) -> None:
    data = read_json(path)
    if not isinstance(data, dict):
        data = {}
    data["reviewRepairPlan"] = {
        "status": "applied",
        "appliedAt": applied_at,
        "candidateCount": len(candidates),
        "mode": "safe-only",
        "candidates": [compact_candidate(item) for item in candidates],
    }
    write_json(path, data)


def apply_plan(project: Path, candidates: list[dict[str, Any]]) -> None:
    applied_at = now_iso()
    update_storyboard(project / "storyboard.json", candidates, applied_at)
    update_json_summary(project / "project-brief.json", candidates, applied_at)
    update_json_summary(project / "quality-report.json", candidates, applied_at)
    append_markdown_brief(project / "codex-task.md", candidates, applied_at)
    append_markdown_brief(project / "AGENTS.md", candidates, applied_at)
    (project / REVISION_BRIEF).write_text(build_revision_brief(candidates, applied_at), encoding="utf-8")

    plan = read_json(project / "repair-plan.json")
    if isinstance(plan, dict):
        plan["status"] = "applied"
        plan["appliedAt"] = applied_at
        plan["appliedCandidateCount"] = len(candidates)
        plan["appliedCandidates"] = [compact_candidate(item) for item in candidates]
        plan["revisionBrief"] = REVISION_BRIEF
        plan["revisionBriefUpdatedAt"] = applied_at
        write_json(project / "repair-plan.json", plan)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Dry-run or apply safe rendered-review repair plans.")
    parser.add_argument("project_path")
    parser.add_argument("--safe-only", action="store_true", help="Only use low-risk candidates targeting planning/report files.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Print what would be applied without writing files.")
    mode.add_argument("--apply", action="store_true", help="Apply safe planning hints.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    project = Path(args.project_path).expanduser().resolve()
    plan = read_json(project / "repair-plan.json")
    if not isinstance(plan, dict) or plan.get("version") != "review-repair-plan-v1":
        print(f"Missing or invalid repair-plan.json in {project}", file=sys.stderr)
        return 1

    dry_run = not args.apply
    candidates = safe_candidates(plan, safe_only=args.safe_only or True)
    payload = {
        "script": "apply_review_plan.py",
        "dryRun": dry_run,
        "safeOnly": True,
        "projectPath": str(project),
        "safeCandidates": len(candidates),
        "candidateIds": [item.get("id") for item in candidates],
        "revisionBrief": REVISION_BRIEF,
    }

    if not dry_run:
        apply_plan(project, candidates)
        payload["status"] = "applied"
    else:
        payload["status"] = "dry-run"

    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
