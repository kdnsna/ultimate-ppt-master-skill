"""Pluggable DeckIR planner surface.

The offline deterministic draft planner is the default fallback. External
Agent/LLM planners must emit the same DeckIR shape (upm-v7). Formal modes
continue to reject no-source placeholder delivery at the quality gate.
"""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

from upm.compiler.deckir import build_deckir


@runtime_checkable
class DeckIRPlanner(Protocol):
    """Contract for anything that produces DeckIR JSON."""

    name: str

    def plan(
        self,
        title: str,
        source_text: str = "",
        *,
        page_count: int | None = None,
        direction_id: str = "formal-finance",
        output_mode: str = "editable-deck",
        quality_mode: str = "standard",
    ) -> dict[str, Any]:
        """Return a complete DeckIR document."""


class DeterministicDraftPlanner:
    """Offline rule planner — structural drafts, not formal content GA."""

    name = "deterministic-draft-planner"

    def plan(
        self,
        title: str,
        source_text: str = "",
        *,
        page_count: int | None = None,
        direction_id: str = "formal-finance",
        output_mode: str = "editable-deck",
        quality_mode: str = "standard",
    ) -> dict[str, Any]:
        deckir = build_deckir(
            title,
            source_text,
            page_count=page_count,
            direction_id=direction_id,
            output_mode=output_mode,
            quality_mode=quality_mode,
        )
        # Canonical naming for consumers (Bridge/Desktop/CLI reports).
        deckir["planner"] = self.name
        return deckir


_DEFAULT_PLANNER: DeckIRPlanner = DeterministicDraftPlanner()


def get_planner(name: str | None = None) -> DeckIRPlanner:
    """Resolve a planner by name. Only the deterministic draft planner ships today."""
    if name in (None, "", "default", "deterministic", "deterministic-draft-planner", "deterministic-fallback"):
        return _DEFAULT_PLANNER
    raise ValueError(
        f"未知 planner：{name}。"
        "当前仅内置 deterministic-draft-planner；Agent/LLM planner 须输出符合 DeckIR schema 的 JSON 后经 --deckir 导入。"
    )


def plan_deckir(
    title: str,
    source_text: str = "",
    *,
    page_count: int | None = None,
    direction_id: str = "formal-finance",
    output_mode: str = "editable-deck",
    quality_mode: str = "standard",
    planner: str | DeckIRPlanner | None = None,
) -> dict[str, Any]:
    engine: DeckIRPlanner
    if isinstance(planner, DeckIRPlanner):
        engine = planner
    else:
        engine = get_planner(planner if isinstance(planner, str) or planner is None else None)
    return engine.plan(
        title,
        source_text,
        page_count=page_count,
        direction_id=direction_id,
        output_mode=output_mode,
        quality_mode=quality_mode,
    )


def to_bridge_payload(deckir: dict[str, Any]) -> dict[str, Any]:
    """Split canonical DeckIR into Bridge storyboard / sourceMap / planningReport files."""
    slides = list(deckir.get("slides") or [])
    created = str(deckir.get("createdAt") or "")
    storyboard = {
        "deckIRVersion": deckir.get("deckIRVersion") or "upm-v7",
        "createdAt": created,
        "planningMode": deckir.get("planningMode") or "deterministic-fallback",
        "planner": deckir.get("planner") or "deterministic-draft-planner",
        "delivery": deckir.get("delivery") or {},
        "directionId": deckir.get("directionId"),
        "title": deckir.get("title"),
        "pipeline": [
            "source.md",
            "DeckIR/storyboard",
            "PPTD compile",
            "editable PPTX or Web Deck",
            "quality gates",
        ],
        "slides": slides,
        "canonicalSource": "upm.compiler.planner",
    }
    source_map = dict(deckir.get("sourceMap") or {})
    if "slideEvidence" not in source_map:
        source_map["slideEvidence"] = [
            {
                "slideId": slide.get("slideId"),
                "page": slide.get("page"),
                "evidenceRefs": slide.get("evidenceRefs") or [],
            }
            for slide in slides
            if isinstance(slide, dict)
        ]
    planning_report = dict(deckir.get("planningReport") or {})
    planning_report.setdefault(
        "provider",
        {
            "configured": False,
            "mode": deckir.get("planningMode") or "deterministic-fallback",
            "planner": deckir.get("planner") or "deterministic-draft-planner",
            "fallbackReason": "Python upm deterministic draft planner (canonical core).",
        },
    )
    return {
        "storyboard": storyboard,
        "sourceMap": source_map,
        "planningReport": planning_report,
        "deckir": deckir,
    }
