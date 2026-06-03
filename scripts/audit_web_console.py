#!/usr/bin/env python3
"""Audit the v4.1 Web Experience console simplification contract."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps/web/src/App.tsx"
FLOW = ROOT / "apps/web/src/consoleFlow.ts"
CSS = ROOT / "apps/web/src/styles.css"
VERSION = "4.1.0"


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

    require(f'appVersion = "{VERSION}"' in app, "Web app version marker is not v4.1.0", errors)
    require('storageKey = "ultimate-ppt-master-web-brief-v4"' in app, "Web storage key should use v4", errors)
    require("v3.0" not in combined, "Web console still contains v3.0 copy", errors)

    for marker in (
        "PrimaryActionBar",
        "ConsoleStepRail",
        "QuickStartConsole",
        "SettingsDrawer",
        "GroupedPreviewTabs",
        "getPrimaryActionId",
        "getConsoleSteps",
        "previewGroupModes",
    ):
        require(marker in app or marker in flow, f"Missing v4.1 console marker: {marker}", errors)

    require("<WorkspaceNav" not in app, "Old five-item WorkspaceNav render is still used", errors)
    require("function WorkspaceNav" not in app, "Old WorkspaceNav component name should be retired", errors)
    require(".workspace-nav" not in css, "Old workspace-nav CSS should be retired", errors)
    require("grid-template-columns: repeat(4, minmax(0, 1fr));" in css, "Console step rail should use four columns", errors)
    require("previewGroupUser" in app and "previewGroupAgent" in app and "previewGroupQuality" in app, "Preview groups are not labeled", errors)
    require('useState<PreviewMode>("webdeck")' in app, "Default preview should be user-readable Web Deck", errors)
    require("<button className={previewMode ===" not in app, "Preview files should not render as eleven peer buttons", errors)
    require('app:not([data-view="configuration"]) .settings-drawer' in css, "Settings drawer should be hidden outside the connect step", errors)
    require('app[data-view="handoff"] .web-preview-panel' in css, "Deliver step should surface the Web preview panel", errors)
    require('app[data-view="handoff"] .preview-panel' in css, "Deliver step should surface grouped file preview", errors)

    if errors:
        print("Web console audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Web console audit passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
