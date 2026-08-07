"""Repair planning and round-budget control for visual QA."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

MAX_REPAIR_ROUNDS = 2


@dataclass
class RepairState:
    rounds: int = 0
    applied: list[str] = field(default_factory=list)


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def plan_repairs(findings: list[dict[str, Any]], state: RepairState) -> dict[str, Any]:
    """Convert findings into a page-level repair plan.

    Repairs are conservative: text overflow is fixed by deterministic
    recompilation (font shrink / box growth); blank and render failures
    re-render; evidence gaps only get placeholders (never invented facts).
    """
    candidates: list[dict[str, Any]] = []
    by_id = {str(f.get("id")): f for f in findings}
    if "text-overflow" in by_id:
        candidates.append(
            {
                "id": "RC-overflow",
                "action": "recompile-with-auto-fix",
                "title": "重新编译溢出页面（自动收缩字号至安全下限）",
                "riskLevel": "low",
                "pages": sorted({str(f.get("page")) for f in findings if f.get("id") == "text-overflow"}),
            }
        )
    if "render-failed" in by_id:
        candidates.append(
            {
                "id": "RC-render",
                "action": "re-render-failed-pages",
                "title": "重新渲染失败页面",
                "riskLevel": "low",
                "pages": sorted({str(f.get("page")) for f in findings if f.get("id") == "render-failed"}),
            }
        )
    if "blank-page" in by_id:
        candidates.append(
            {
                "id": "RC-blank",
                "action": "review-blank-page",
                "title": "人工确认空白页（不自动删除内容）",
                "riskLevel": "medium",
                "pages": sorted({str(f.get("page")) for f in findings if f.get("id") == "blank-page"}),
            }
        )
    blocked = state.rounds >= MAX_REPAIR_ROUNDS
    return {
        "version": "upm-repair-plan-v1",
        "createdAt": _now_iso(),
        "status": "blocked" if blocked else "proposed",
        "roundsUsed": state.rounds,
        "maxRounds": MAX_REPAIR_ROUNDS,
        "roundBudgetExceeded": blocked,
        "candidateCount": len(candidates),
        "candidates": candidates,
    }


def write_repair_plan(project: str | Path, plan: dict[str, Any]) -> Path:
    path = Path(project).expanduser().resolve() / ".upm" / "repair-plan.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(__import__("json").dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path
