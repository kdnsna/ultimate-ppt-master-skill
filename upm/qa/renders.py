"""QA orchestration: render -> rubric -> repair rounds (shared by make/review)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from upm.qa.render import render_pages_local
from upm.qa.repair import MAX_REPAIR_ROUNDS
from upm.qa.rubric import run_rubric


def render_and_review(
    project: str | Path,
    *,
    deckir: dict[str, Any],
    structure_errors: list[str],
    render_backend: str = "auto",
    mode: str = "standard",
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int, list[dict[str, Any]]]:
    root = Path(project).expanduser().resolve()
    rounds = 0
    unresolved: list[dict[str, Any]] = []
    render_records: list[dict[str, Any]] = []
    rubric_findings: list[dict[str, Any]] = []
    while rounds <= MAX_REPAIR_ROUNDS:
        if render_backend == "kimi":
            from upm.adapters.kimi.renderer import export_kimi_images

            summary = export_kimi_images(root, force=True)
            render_records = [
                {"page": item["page"] or f"P{item['index']:02d}", "ok": True, "path": str(root / ".upm" / "renders" / "kimi" / item["image"])}
                for item in summary["images"]
            ]
        else:
            render_records = render_pages_local(root)
        rubric_findings = run_rubric(root, render_records, deckir=deckir, structure_errors=structure_errors)
        errors = [f for f in rubric_findings if f["severity"] == "error"]
        render_failed = [rec for rec in render_records if not rec.get("ok")]
        if not errors and not render_failed:
            break
        rounds += 1
        if rounds > MAX_REPAIR_ROUNDS:
            unresolved = [f for f in (errors + [{"id": "render-failed", "severity": "error", "message": rec.get("error"), "page": rec["page"]} for rec in render_failed])]
            break
        # Conservative repair: recompile overflow pages once, then re-render.
        if any(f["id"] == "text-overflow" for f in errors):
            deckir_path = root / ".upm" / "deckir.json"
            if deckir_path.is_file():
                from upm.compiler.compiler import compile_deck

                compile_deck(deckir_path, root, auto_fix=True)
        if render_failed:
            continue
        if errors and not render_failed:
            # Structural errors that cannot be auto-repaired: stop and report.
            unresolved = errors
            break
    return render_records, rubric_findings, rounds, unresolved
