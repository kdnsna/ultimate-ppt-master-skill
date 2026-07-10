#!/usr/bin/env python3
"""Static contract gate for the v6 task-first workspace."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    errors: list[str] = []

    def require(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    main_source = (ROOT / "apps/web/src/main.tsx").read_text(encoding="utf-8")
    desktop_main = (ROOT / "apps/desktop/src/main.tsx").read_text(encoding="utf-8")
    workspace = (ROOT / "apps/web/src/V6Workspace.tsx").read_text(encoding="utf-8")
    css = (ROOT / "apps/web/src/v6-workspace.css").read_text(encoding="utf-8")
    core = (ROOT / "packages/workspace-core/src/index.ts").read_text(encoding="utf-8")
    bridge = (ROOT / "apps/bridge/server.mjs").read_text(encoding="utf-8")
    directions = json.loads((ROOT / "templates/visual-directions/v6-direction-manifest.json").read_text(encoding="utf-8"))

    require('lazy(() => import("./ClassicApp"))' in main_source, "Classic mode is not code-split")
    require("design-tokens.css" in main_source and "design-tokens.css" in desktop_main, "Web and Desktop must share v6 design tokens")
    require('from "./App"' not in main_source, "Classic App is still eagerly imported")
    require("useDeferredValue" in workspace, "Preview derivation is not deferred")
    require("document.hidden" in workspace, "Hidden-page polling is not paused")
    require("new EventSource" in workspace and 'request.url === "/events"' in bridge, "SSE progress path is incomplete")
    require('data-slide-id="${escapeHtml(slide.slideId)}"' in workspace, "Preview lacks stable slideId")
    require("slideId: `P${String(index + 1).padStart(2, \"0\")}`" in bridge, "Bridge DeckIR lacks stable slideId")
    require('session.phase === "review" || session.phase === "delivered"' in workspace, "Preview must mount only in review/delivered")
    require("window.scrollTo({ top: 0" in workspace and "workspaceHeadingRef.current?.focus" in workspace, "Phase changes must reset scroll and focus")
    require('aria-live="polite"' in workspace, "Progress changes need a live region")
    require('role="radiogroup"' in workspace and 'aria-checked=' in workspace, "Selection controls need radio semantics")
    require(":focus-visible" in css, "Visible keyboard focus styles are missing")
    require("prefers-reduced-motion: reduce" in css, "Reduced-motion support is missing")
    require("@media (max-width: 760px)" in css, "390px/mobile layout contract is missing")
    require("DeckSession" in core and "deck-session-v6" in core, "Shared DeckSession model is missing")
    require(len(directions.get("directions", [])) >= 6, "At least six complete visual directions are required")
    required_roles = {"cover", "body", "data", "chart", "image", "section", "closing"}
    for direction in directions.get("directions", []):
        roles = set(direction.get("examples", {}).keys())
        require(required_roles.issubset(roles), f"{direction.get('id', 'unknown')} lacks complete page-role previews")

    if errors:
        print("v6 workspace audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"v6 workspace audit passed: {len(directions['directions'])} complete visual directions checked.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
