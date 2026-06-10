#!/usr/bin/env python3
"""Audit the v4.4 Codex-first Web Experience contract."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps/web/src/App.tsx"
FLOW = ROOT / "apps/web/src/consoleFlow.ts"
CSS = ROOT / "apps/web/src/styles.css"
VERSION = "4.4.0"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> int:
    errors: list[str] = []
    app = read(APP)
    flow = read(FLOW)
    css = read(CSS)
    combined = "\n".join([app, flow, css])

    require(f'appVersion = "{VERSION}"' in app, f"Web app version marker is not v{VERSION}", errors)
    require('storageKey = "ultimate-ppt-master-codex-first-v44"' in app, "Web storage key should use v4.4 Codex-first key", errors)
    require("CodexFirstFlow" in app, "Missing CodexFirstFlow primary surface", errors)
    require("SourceDropzone" in app, "Missing SourceDropzone", errors)
    require("CodexPrimaryAction" in app, "Missing CodexPrimaryAction", errors)
    require("CodexResult" in app, "Missing CodexResult", errors)
    require("DebugDrawer" in app, "Missing DebugDrawer", errors)
    require("把资料交给 Codex 做 PPT" in app, "Chinese Codex-first headline missing", errors)
    require("项目路径" in app and "Codex 命令" in app, "Completion state should show path and command", errors)
    require("已复制，打开 Codex 执行这条命令" in app, "Completion state should explain copied Codex command", errors)
    require("buildCodexFirstBridgePayload" in app, "Missing Codex-first Bridge payload builder", errors)

    for artifact in (
        "storyboard.json",
        "source-map.json",
        "planning-report.json",
        "review-findings.json",
        "repair-plan.json",
        "revision-brief.md",
        "quality-report.json",
        "codex-task.md",
        "AGENTS.md",
        "asset-plan.md",
        "visual-element-kit.md",
    ):
        require(artifact in app, f"Missing handoff artifact marker: {artifact}", errors)

    for marker in (
        "export type CodexFlowState",
        "needs_input",
        "needs_bridge",
        "ready_to_create",
        "creating",
        "ready_for_codex",
        "error",
        "getCodexFlowState",
        "getCodexPrimaryAction",
    ):
        require(marker in flow, f"Missing Codex flow marker: {marker}", errors)

    for retired in (
        "ConsoleStepRail",
        "QuickStartConsole",
        "GroupedPreviewTabs",
        "getConsoleSteps",
        "getPrimaryActionId",
        "previewGroupModes",
        "WorkspaceNav",
        ".workspace-nav",
    ):
        require(retired not in combined, f"Retired console marker still present: {retired}", errors)

    require(".codex-layout" in css, "CSS missing Codex layout", errors)
    require(".single-flow" in css, "CSS missing single-flow layout", errors)
    require(".debug-drawer" in css, "CSS missing debug drawer", errors)
    require("@media (max-width: 900px)" in css, "CSS missing responsive tablet/mobile rules", errors)

    if errors:
        print("Web console audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Web console audit passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
