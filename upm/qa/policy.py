"""Quality mode policies for make/review delivery gates.

Modes are real strategy objects, not just labels written into the report.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ModeName = Literal["quick", "standard", "audit"]
Severity = Literal["ignore", "warning", "error"]


@dataclass(frozen=True)
class QualityPolicy:
    mode: ModeName
    require_visual: bool
    allow_skip_qa: bool
    blank_page_severity: Severity
    block_placeholders: bool
    require_export_verified: bool
    exit_on_gate_fail: bool
    visual_not_run_fails: bool

    @property
    def label(self) -> str:
        return self.mode


_POLICIES: dict[str, QualityPolicy] = {
    "quick": QualityPolicy(
        mode="quick",
        require_visual=False,
        allow_skip_qa=True,
        blank_page_severity="ignore",
        block_placeholders=False,
        require_export_verified=True,
        exit_on_gate_fail=True,
        visual_not_run_fails=False,
    ),
    "standard": QualityPolicy(
        mode="standard",
        require_visual=True,
        allow_skip_qa=True,  # allowed, but visual becomes not-run → fail
        blank_page_severity="warning",
        block_placeholders=True,
        require_export_verified=True,
        exit_on_gate_fail=True,
        visual_not_run_fails=True,
    ),
    "audit": QualityPolicy(
        mode="audit",
        require_visual=True,
        allow_skip_qa=False,
        blank_page_severity="error",
        block_placeholders=True,
        require_export_verified=True,
        exit_on_gate_fail=True,
        visual_not_run_fails=True,
    ),
}


def load_policy(mode: str) -> QualityPolicy:
    key = (mode or "standard").strip().lower()
    if key not in _POLICIES:
        raise ValueError(f"未知质量模式：{mode}（支持 quick/standard/audit）")
    return _POLICIES[key]


def planning_source_of(deckir: dict | None) -> str:
    if not deckir:
        return "unknown"
    if deckir.get("_imported"):
        return "imported-deckir"
    mode = str(deckir.get("planningMode") or "")
    if "fallback" in mode:
        return "deterministic-fallback"
    if "source" in mode or mode == "deterministic-source-planner":
        return "deterministic-source-planner"
    if mode:
        return mode
    return "deterministic-fallback"
