"""Exporter protocol shared by all backends."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class ExportResult:
    output: Path
    backend: str
    slides: int
    verified: bool
    bytes: int
    transition: str = "fade"
    font_parts: int = 0
    warnings: list[str] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)

    def to_record(self, project: Path) -> dict[str, Any]:
        return {
            "schemaVersion": "upm-export-record-v1",
            "exportedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "project": str(Path(project).resolve()),
            "backend": self.backend,
            "output": str(self.output.resolve()),
            "slides": self.slides,
            "verified": self.verified,
            "bytes": self.bytes,
            "transition": self.transition,
            "fontParts": self.font_parts,
            "warnings": self.warnings,
            "meta": self.meta,
        }


def healthcheck_shape(backend: str, available: bool, reason: str, required: list[str] | None = None) -> dict[str, Any]:
    return {
        "backend": backend,
        "available": available,
        "reason": reason,
        "required": required or [],
    }
