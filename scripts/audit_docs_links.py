#!/usr/bin/env python3
"""Audit repository documentation links and current release markers."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
VERSION = "5.1.0"

MOVED_DOCS = {
    "docs/web-experience.md": "docs/guides/web-experience.md",
    "docs/agent-connect-bridge.md": "docs/guides/agent-connect-bridge.md",
    "docs/agent-setup.md": "docs/guides/agent-setup.md",
    "docs/choosing-a-workflow.md": "docs/guides/choosing-a-workflow.md",
    "docs/model-provider-setup.md": "docs/guides/model-provider-setup.md",
    "docs/troubleshooting.md": "docs/guides/troubleshooting.md",
    "docs/quickstart-desktop.md": "docs/guides/quickstart-desktop.md",
    "docs/quality-workbench-v2.5.md": "docs/quality/quality-workbench-v2.5.md",
    "docs/completion-audit-v2.5-quality-workbench.md": "docs/quality/completion-audit-v2.5.md",
    "docs/upstream-benchmark-2026-05.md": "docs/quality/upstream-benchmark-2026-05.md",
    "docs/github-tech-scan-2026-05.md": "docs/quality/github-tech-scan-2026-05.md",
    "docs/release-notes-v2.3.0.md": "docs/release/release-notes-v2.3.0.md",
    "docs/release-notes-v2.3.3.md": "docs/release/release-notes-v2.3.3.md",
    "docs/release-notes-v2.3.4.md": "docs/release/release-notes-v2.3.4.md",
    "docs/release-notes-v2.4.0.md": "docs/release/release-notes-v2.4.0.md",
    "docs/release-notes-v2.5.0.md": "docs/release/release-notes-v2.5.0.md",
    "docs/release-notes-v3.0.0.md": "docs/release/release-notes-v3.0.0.md",
    "docs/release-maintenance.md": "docs/release/release-maintenance.md",
    "docs/homebrew-distribution.md": "docs/release/homebrew-distribution.md",
    "docs/product-positioning.md": "docs/strategy/product-positioning.md",
    "docs/public-growth-playbook.md": "docs/strategy/public-growth-playbook.md",
    "docs/skill-market-distribution.md": "docs/strategy/skill-market-distribution.md",
    "docs/next-roadmap.md": "docs/strategy/next-roadmap.md",
    "docs/next-optimization-directions.md": "docs/strategy/next-optimization-directions.md",
    "docs/zh-CN/web-experience.md": "docs/zh-CN/guides/web-experience.md",
    "docs/zh-CN/agent-connect-bridge.md": "docs/zh-CN/guides/agent-connect-bridge.md",
    "docs/zh-CN/quality-workbench-v2.5.md": "docs/zh-CN/quality/quality-workbench-v2.5.md",
    "docs/zh-CN/upstream-benchmark-2026-05.md": "docs/zh-CN/quality/upstream-benchmark-2026-05.md",
    "docs/zh-CN/github-tech-scan-2026-05.md": "docs/zh-CN/quality/github-tech-scan-2026-05.md",
    "docs/zh-CN/release-notes-v2.3.0.md": "docs/zh-CN/release/release-notes-v2.3.0.md",
    "docs/zh-CN/release-notes-v2.3.3.md": "docs/zh-CN/release/release-notes-v2.3.3.md",
    "docs/zh-CN/release-notes-v2.3.4.md": "docs/zh-CN/release/release-notes-v2.3.4.md",
    "docs/zh-CN/release-notes-v2.4.0.md": "docs/zh-CN/release/release-notes-v2.4.0.md",
    "docs/zh-CN/release-notes-v2.5.0.md": "docs/zh-CN/release/release-notes-v2.5.0.md",
    "docs/zh-CN/release-notes-v3.0.0.md": "docs/zh-CN/release/release-notes-v3.0.0.md",
    "docs/zh-CN/product-positioning.md": "docs/zh-CN/strategy/product-positioning.md",
    "docs/zh-CN/skill-market-distribution.md": "docs/zh-CN/strategy/skill-market-distribution.md",
    "docs/zh-CN/next-roadmap.md": "docs/zh-CN/strategy/next-roadmap.md",
}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def load_json(path: str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def audit_version_markers(errors: list[str]) -> None:
    package = load_json("package.json")
    web_package = load_json("apps/web/package.json")
    web_lock = load_json("apps/web/package-lock.json")
    app = read(ROOT / "apps/web/src/App.tsx")
    readme = read(ROOT / "README.md")
    readme_zh = read(ROOT / "README.zh-CN.md")
    hero = read(ROOT / "assets/readme/hero.svg")
    listing = load_json("agents/marketplace-listing.json")

    require(package.get("version") == VERSION, f"package.json version is not v{VERSION}", errors)
    require(web_package.get("version") == VERSION, f"apps/web/package.json version is not v{VERSION}", errors)
    require(web_lock.get("version") == VERSION, f"apps/web/package-lock.json root version is not v{VERSION}", errors)
    require(web_lock.get("packages", {}).get("", {}).get("version") == VERSION, f"apps/web package-lock package version is not v{VERSION}", errors)
    require(listing.get("version") == VERSION, f"agents/marketplace-listing.json version is not v{VERSION}", errors)
    require(f'appVersion = "{VERSION}"' in app, f"apps/web/src/App.tsx appVersion is not v{VERSION}", errors)

    for label, text in (("README.md", readme), ("README.zh-CN.md", readme_zh), ("assets/readme/hero.svg", hero)):
        require(f"v{VERSION}" in text or VERSION in text, f"{label} missing v{VERSION} marker", errors)

    require((ROOT / f"docs/release/release-notes-v{VERSION}.md").is_file(), "missing English current release notes", errors)
    require((ROOT / f"docs/zh-CN/release/release-notes-v{VERSION}.md").is_file(), "missing Chinese current release notes", errors)
    require("Hybrid-Editable Visual Workflow v4.0" in readme, "README missing v4 hybrid workflow entry", errors)
    require("v4.0 混合可编辑视觉工作流" in readme_zh, "Chinese README missing v4 hybrid workflow entry", errors)
    require("Simplified Web Console v4.1" in readme, "README missing v4.1 console entry", errors)
    require("v4.1 精简网页控制台" in readme_zh, "Chinese README missing v4.1 console entry", errors)
    require("DeckIR AI Planning Workflow v4.2" in readme, "README missing v4.2 AI planning entry", errors)
    require("v4.2 DeckIR AI 策划工作流" in readme_zh, "Chinese README missing v4.2 AI planning entry", errors)
    require("v4.3 Rendered Review Loop" in readme, "README missing v4.3 rendered review entry", errors)
    require("v4.3 渲染审阅闭环" in readme_zh, "Chinese README missing v4.3 rendered review entry", errors)


def audit_moved_stubs(errors: list[str]) -> None:
    for old, new in MOVED_DOCS.items():
        old_path = ROOT / old
        new_path = ROOT / new
        require(new_path.is_file(), f"canonical doc missing: {new}", errors)
        require(old_path.is_file(), f"moved stub missing: {old}", errors)
        if old_path.is_file():
            text = read(old_path)
            require("Document Moved" in text or "文档已迁移" in text, f"moved stub lacks moved marker: {old}", errors)
            require(new in text, f"moved stub does not point to canonical path: {old}", errors)


LINK_RE = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)|href=[\"']([^\"']+)[\"']|src=[\"']([^\"']+)[\"']")


def iter_text_files() -> list[Path]:
    roots = [
        ROOT / "README.md",
        ROOT / "README.zh-CN.md",
        ROOT / "AGENTS.md",
        ROOT / "CLAUDE.md",
        ROOT / "SKILL.md",
        ROOT / "docs",
        ROOT / "agents",
        ROOT / "apps/web/src",
    ]
    files: list[Path] = []
    for root in roots:
        if root.is_file():
            files.append(root)
        else:
            for suffix in ("*.md", "*.json", "*.yaml", "*.yml", "*.tsx"):
                files.extend(root.rglob(suffix))
    return sorted(set(files))


def is_external(target: str) -> bool:
    return target.startswith(("http://", "https://", "mailto:", "tel:", "javascript:", "data:", "#"))


def normalize_target(target: str) -> str:
    target = unquote(target.strip())
    target = target.split("#", 1)[0].split("?", 1)[0]
    return target


def audit_local_links(errors: list[str]) -> None:
    for path in iter_text_files():
        text = read(path)
        for match in LINK_RE.finditer(text):
            target = next(group for group in match.groups() if group)
            target = normalize_target(target)
            if not target or is_external(target):
                continue
            if target.startswith("/"):
                candidate = ROOT / target.lstrip("/")
            else:
                candidate = (path.parent / target).resolve()
            try:
                candidate.relative_to(ROOT)
            except ValueError:
                continue
            require(candidate.exists(), f"broken local link in {path.relative_to(ROOT)} -> {target}", errors)


def audit_canonical_public_paths(errors: list[str]) -> None:
    readme = read(ROOT / "README.md")
    readme_zh = read(ROOT / "README.zh-CN.md")
    app = read(ROOT / "apps/web/src/App.tsx")
    listing = load_json("agents/marketplace-listing.json")

    required = [
        "./docs/guides/agent-connect-bridge.md",
        "./docs/guides/agent-setup.md",
        "./docs/quality/hybrid-editable-visual-workflow-v4.0.md",
        "./docs/quality/rendered-review-loop-v4.3.md",
        "./docs/release/release-notes-v5.1.0.md",
        "./docs/release/release-notes-v5.0.0.md",
        "./docs/release/release-notes-v4.2.0.md",
        "./docs/release/release-notes-v4.3.0.md",
        "./docs/strategy/skill-market-distribution.md",
    ]
    for link in required:
        require(link in readme, f"README missing canonical link {link}", errors)

    required_zh = [
        "./docs/zh-CN/guides/agent-connect-bridge.md",
        "./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md",
        "./docs/zh-CN/quality/rendered-review-loop-v4.3.md",
        "./docs/zh-CN/release/release-notes-v5.1.0.md",
        "./docs/zh-CN/release/release-notes-v5.0.0.md",
        "./docs/zh-CN/release/release-notes-v4.2.0.md",
        "./docs/zh-CN/release/release-notes-v4.3.0.md",
        "./docs/zh-CN/strategy/skill-market-distribution.md",
    ]
    for link in required_zh:
        require(link in readme_zh, f"Chinese README missing canonical link {link}", errors)

    require("docs/guides/agent-connect-bridge.md" in app, "Web app still points to old bridge docs path", errors)
    require("docs/strategy/skill-market-distribution.md" in app, "Web app still points to old skill market docs path", errors)
    require(listing.get("metadata", {}).get("distributionGuide") == "docs/strategy/skill-market-distribution.md", "marketplace listing uses old English distribution guide path", errors)
    require(listing.get("metadata", {}).get("distributionGuideZh") == "docs/zh-CN/strategy/skill-market-distribution.md", "marketplace listing uses old Chinese distribution guide path", errors)
    require(listing.get("links", {}).get("agentSetup") == "docs/guides/agent-setup.md", "marketplace listing uses old agent setup path", errors)
    require(listing.get("proof", {}).get("qualityWorkbench") == "docs/quality/quality-workbench-v2.5.md", "marketplace listing uses old quality workbench path", errors)


def main() -> int:
    errors: list[str] = []
    audit_version_markers(errors)
    audit_moved_stubs(errors)
    audit_local_links(errors)
    audit_canonical_public_paths(errors)
    if errors:
        print("Documentation audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Documentation audit passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
