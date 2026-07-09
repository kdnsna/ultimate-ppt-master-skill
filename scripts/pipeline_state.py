#!/usr/bin/env python3
"""Shared pipeline-state helpers for hard generation gates."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


STATE_FILENAME = "pipeline-state.json"
STATE_VERSION = "pipeline-state-v1"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def state_path(project: Path) -> Path:
    return project / STATE_FILENAME


def initial_state() -> dict[str, Any]:
    return {
        "version": STATE_VERSION,
        "created_at": utc_now(),
        "quality_check": {
            "passed": False,
            "checked_at": None,
            "svg_digest": None,
            "summary": {},
        },
    }


def load_state(project: Path) -> dict[str, Any]:
    path = state_path(project)
    if not path.is_file():
        return initial_state()
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return initial_state()
    if not isinstance(state, dict):
        return initial_state()
    state.setdefault("version", STATE_VERSION)
    state.setdefault("quality_check", {})
    return state


def save_state(project: Path, state: dict[str, Any]) -> None:
    state_path(project).write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def init_pipeline_state(project: Path) -> None:
    save_state(project, initial_state())


def digest_dir(path: Path) -> str:
    digest = hashlib.sha256()
    if not path.is_dir():
        return ""
    for file_path in sorted(p for p in path.rglob("*") if p.is_file()):
        rel = file_path.relative_to(path).as_posix()
        stat = file_path.stat()
        digest.update(rel.encode("utf-8"))
        digest.update(str(stat.st_size).encode("ascii"))
        digest.update(str(stat.st_mtime_ns).encode("ascii"))
        with file_path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
    return digest.hexdigest()


def project_from_target(target: Path) -> Path | None:
    resolved = target.resolve()
    if resolved.is_file():
        if resolved.parent.name == "svg_output":
            return resolved.parent.parent
        return resolved.parent
    if (resolved / "svg_output").is_dir():
        return resolved
    if resolved.name == "svg_output":
        return resolved.parent
    return None


def record_quality_check(project: Path, *, passed: bool, summary: dict[str, Any]) -> None:
    state = load_state(project)
    state["quality_check"] = {
        "passed": passed,
        "checked_at": utc_now(),
        "svg_digest": digest_dir(project / "svg_output"),
        "summary": summary,
    }
    save_state(project, state)


def verify_quality_gate(project: Path) -> tuple[bool, str]:
    state = load_state(project)
    quality = state.get("quality_check") if isinstance(state.get("quality_check"), dict) else {}
    current_digest = digest_dir(project / "svg_output")
    if not quality.get("passed"):
        return False, "BLOCKED: svg_quality_checker has not passed for this project."
    if not quality.get("svg_digest") or quality.get("svg_digest") != current_digest:
        return False, "BLOCKED: svg_quality_checker passed before, but SVG files changed afterward. Re-run svg_quality_checker.py."
    return True, ""
