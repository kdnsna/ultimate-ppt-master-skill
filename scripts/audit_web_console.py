#!/usr/bin/env python3
"""Audit the v6 default workspace and the one-cycle classic console fallback."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "apps/web/src/App.tsx"
FLOW = ROOT / "apps/web/src/consoleFlow.ts"
CSS = ROOT / "apps/web/src/styles.css"
MAIN = ROOT / "apps/web/src/main.tsx"
V6 = ROOT / "apps/web/src/V6Workspace.tsx"
V6_CSS = ROOT / "apps/web/src/v6-workspace.css"
CORE = ROOT / "packages/workspace-core/src/index.ts"
CLASSIC_VERSION = "5.4.1"
V6_VERSION = "6.3.7"


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
    main_source = read(MAIN)
    v6 = read(V6)
    v6_css = read(V6_CSS)
    core = read(CORE)
    combined = "\n".join([app, flow, css])

    require(f'appVersion = "{CLASSIC_VERSION}"' in app, f"Classic Web app version marker is not v{CLASSIC_VERSION}", errors)
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

    require('import { V6Workspace } from "./V6Workspace"' in main_source, "v6 workspace is not the default entry", errors)
    require('lazy(() => import("./ClassicApp"))' in main_source, "Classic console must be lazy loaded", errors)
    require('from "./App"' not in main_source, "Default entry must not eagerly import the classic console", errors)
    require(f'appVersion = "{V6_VERSION}"' in v6, f"v6 workspace version marker is not v{V6_VERSION}", errors)
    require("new URLSearchParams({ sessionId: session.sessionId })" in v6 and 'new EventSource(`${bridgeUrl}/events?${query}`)' in v6, "v6 workspace must consume session-scoped Bridge progress events", errors)
    require("if (!document.hidden)" in v6, "Bridge health polling must pause when the document is hidden", errors)
    require('aria-current={current ? "step" : undefined}' in v6, "Phase navigation needs aria-current", errors)
    require('@media (prefers-reduced-motion: reduce)' in v6_css, "v6 workspace must respect reduced motion", errors)
    for phase in ('"intake"', '"outline"', '"generating"', '"review"', '"delivered"'):
        require(phase in core, f"DeckSession is missing phase {phase}", errors)

    if errors:
        print("Web console audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Web console audit passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
