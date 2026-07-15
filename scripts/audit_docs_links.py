#!/usr/bin/env python3
"""Audit repository documentation links and current release markers."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
VERSION = "6.3.6"
CANDIDATE_VERSIONS = tuple(f"6.3.{patch}" for patch in range(2, 6))
RELEASE_STATUS = "github-released"
RELEASE_EVIDENCE = "https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.6"
MARKETPLACE_STATUS = "independent-not-attested"
README_BANNED_PHRASES = (
    "Best Results Prompt",
    "What v5 Changes",
    "v5 Delivery Standard",
    "Repository Map",
    "Production Stability Guardrails",
    "Quality Gates",
    "Guizang-like",
    "Benchmark Wall",
    "Skill Market Distribution",
    "UPSTREAM_SYNC.md",
    "audit:repo-hygiene",
)
README_CLAIM_ARTIFACTS = (
    "asset_plan.json",
    "current_generation_evidence",
    "pipeline-state.json",
    "Needs-Manual",
    "bestEffectBrief",
    "quality-report.json",
)

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
    desktop_package = load_json("apps/desktop/package.json")
    desktop_lock = load_json("apps/desktop/package-lock.json")
    tauri_config = load_json("apps/desktop/src-tauri/tauri.conf.json")
    app = read(ROOT / "apps/web/src/V6Workspace.tsx")
    readme_zh = read(ROOT / "README.md")
    readme_en = read(ROOT / "README.en.md")
    compatibility = read(ROOT / "README.zh-CN.md")
    hero = read(ROOT / "assets/readme/hero.svg")
    listing = load_json("agents/marketplace-listing.json")
    cargo_toml = read(ROOT / "apps/desktop/src-tauri/Cargo.toml")
    cargo_lock = read(ROOT / "apps/desktop/src-tauri/Cargo.lock")
    benchmark = read(ROOT / "apps/web/public/benchmark/index.html")
    proof_reports = tuple(
        load_json(f"{prefix}/{case}/quality-report.json")
        for prefix in ("examples", "apps/web/public/examples")
        for case in (
            "executive-business-review-starter",
            "consulting-proposal-starter",
            "product-pitch-starter",
            "tech-trend-web-deck-starter",
        )
    )

    require(package.get("version") == VERSION, f"package.json version is not v{VERSION}", errors)
    require(web_package.get("version") == VERSION, f"apps/web/package.json version is not v{VERSION}", errors)
    require(web_lock.get("version") == VERSION, f"apps/web/package-lock.json root version is not v{VERSION}", errors)
    require(web_lock.get("packages", {}).get("", {}).get("version") == VERSION, f"apps/web package-lock package version is not v{VERSION}", errors)
    require(desktop_package.get("version") == VERSION, f"apps/desktop/package.json version is not v{VERSION}", errors)
    require(desktop_lock.get("version") == VERSION, f"apps/desktop/package-lock.json root version is not v{VERSION}", errors)
    require(desktop_lock.get("packages", {}).get("", {}).get("version") == VERSION, f"apps/desktop package-lock package version is not v{VERSION}", errors)
    require(tauri_config.get("version") == VERSION, f"apps/desktop/src-tauri/tauri.conf.json version is not v{VERSION}", errors)
    require(f'version = "{VERSION}"' in cargo_toml, f"apps/desktop/src-tauri/Cargo.toml version is not v{VERSION}", errors)
    require(
        re.search(r'\[\[package\]\]\s+name = "ultimate-ppt-master-desktop"\s+version = "' + re.escape(VERSION) + r'"', cargo_lock) is not None,
        f"apps/desktop/src-tauri/Cargo.lock package version is not v{VERSION}",
        errors,
    )
    require(listing.get("version") == VERSION, f"agents/marketplace-listing.json version is not v{VERSION}", errors)
    require(listing.get("releaseStatus") == RELEASE_STATUS, "marketplace listing must use the GitHub release status", errors)
    require(listing.get("releaseEvidence") == RELEASE_EVIDENCE, "marketplace listing must link the authoritative GitHub Release", errors)
    require(listing.get("marketplaceStatus") == MARKETPLACE_STATUS, "marketplace listing must keep marketplace publication independent", errors)
    require(f'appVersion = "{VERSION}"' in app, f"apps/web/src/V6Workspace.tsx appVersion is not v{VERSION}", errors)
    require(f"v{VERSION} 正式版本" in benchmark, f"benchmark page is missing the v{VERSION} formal-release marker", errors)

    for report in proof_reports:
        require(report.get("releaseVersion") == VERSION, f"public proof releaseVersion is not v{VERSION}", errors)
        require(report.get("releaseStatus") == RELEASE_STATUS, "public proof must use the GitHub release status", errors)
        require(report.get("releaseEvidence") == RELEASE_EVIDENCE, "public proof must link the authoritative GitHub Release", errors)
        require(report.get("marketplaceStatus") == MARKETPLACE_STATUS, "public proof must keep marketplace publication independent", errors)

    for label, text in (("README.md", readme_zh), ("README.en.md", readme_en), ("README.zh-CN.md", compatibility), ("assets/readme/hero.svg", hero)):
        require(f"v{VERSION}" in text or VERSION in text, f"{label} missing v{VERSION} marker", errors)

    require((ROOT / f"docs/release/release-notes-v{VERSION}.md").is_file(), "missing English current release notes", errors)
    require((ROOT / f"docs/zh-CN/release/release-notes-v{VERSION}.md").is_file(), "missing Chinese current release notes", errors)
    release_en = read(ROOT / f"docs/release/release-notes-v{VERSION}.md")
    release_zh = read(ROOT / f"docs/zh-CN/release/release-notes-v{VERSION}.md")
    for marker in ("GitHub release contract", "releaseStatus: github-released", "marketplaceStatus: independent-not-attested", RELEASE_EVIDENCE, "Plain-Language Update Notes", "Independent Rollback Boundary"):
        require(marker in release_en, f"v{VERSION} English release notes missing release-contract marker: {marker}", errors)
    for marker in ("GitHub 发布合同", "releaseStatus: github-released", "marketplaceStatus: independent-not-attested", RELEASE_EVIDENCE, "白话更新栏", "独立回滚边界"):
        require(marker in release_zh, f"v{VERSION} Chinese release notes missing release-contract marker: {marker}", errors)
    require("把真实资料变成可继续修改的原生 PowerPoint" in readme_zh, "README.md is not the Chinese canonical homepage", errors)
    require("Turn real source material into a native PowerPoint" in readme_en, "README.en.md is not the English mirror", errors)
    require("中文 README 已迁移" in compatibility and "./README.md" in compatibility, "README.zh-CN.md is not a compatibility entry", errors)
    require("GitHub_Release" in readme_zh and "GitHub_Release" in readme_en, "README release badges are missing", errors)
    require("GITHUB RELEASE" in hero, "README hero is missing the GitHub release marker", errors)

    docs_en = read(ROOT / "docs/README.md")
    docs_zh = read(ROOT / "docs/zh-CN/README.md")
    for candidate in CANDIDATE_VERSIONS:
        release_en_path = ROOT / f"docs/release/release-notes-v{candidate}.md"
        release_zh_path = ROOT / f"docs/zh-CN/release/release-notes-v{candidate}.md"
        require(release_en_path.is_file(), f"missing English v{candidate} candidate notes", errors)
        require(release_zh_path.is_file(), f"missing Chinese v{candidate} candidate notes", errors)
        if release_en_path.is_file():
            release_en = read(release_en_path)
            require("Unreleased candidate" in release_en, f"v{candidate} English notes do not disclose unreleased candidate status", errors)
            require("Plain-Language Update Notes" in release_en, f"v{candidate} English notes missing plain-language section", errors)
            require("Independent Rollback Boundary" in release_en, f"v{candidate} English notes missing rollback boundary", errors)
        if release_zh_path.is_file():
            release_zh = read(release_zh_path)
            require("未发布候选" in release_zh, f"v{candidate} Chinese notes do not disclose unreleased candidate status", errors)
            require("白话更新栏" in release_zh, f"v{candidate} Chinese notes missing plain-language section", errors)
            require("独立回滚边界" in release_zh, f"v{candidate} Chinese notes missing rollback boundary", errors)
        release_link = f"release/release-notes-v{candidate}.md"
        require(release_link in docs_en, f"English docs index missing v{candidate}", errors)
        require(release_link in docs_zh, f"Chinese docs index missing v{candidate}", errors)


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
        ROOT / "README.en.md",
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


def support_corpus() -> str:
    files: list[Path] = [ROOT / "SKILL.md"]
    for folder in ("scripts", "tests"):
        for suffix in ("*.py", "*.mjs", "*.js", "*.json"):
            files.extend((ROOT / folder).rglob(suffix))
    self_path = Path(__file__).resolve()
    return "\n".join(read(path) for path in files if path.is_file() and path.resolve() != self_path)


def count_doc_map_rows(text: str, heading: str) -> int:
    lines = text.splitlines()
    try:
        start = lines.index(heading)
    except ValueError:
        return -1
    count = 0
    for line in lines[start + 1:]:
        if line.startswith("## "):
            break
        stripped = line.strip()
        if stripped.startswith("|") and not stripped.startswith("|---") and "Read" not in stripped and "阅读" not in stripped:
            count += 1
    return count


def audit_readme_truthfulness(errors: list[str]) -> None:
    readmes = {
        "README.md": read(ROOT / "README.md"),
        "README.en.md": read(ROOT / "README.en.md"),
    }
    compatibility = read(ROOT / "README.zh-CN.md")
    corpus = support_corpus()

    for label, text in readmes.items():
        for phrase in README_BANNED_PHRASES:
            require(phrase not in text, f"{label} contains banned public README phrase: {phrase}", errors)

        for artifact in README_CLAIM_ARTIFACTS:
            if f"`{artifact}`" in text or artifact in text:
                require(artifact in corpus, f"{label} claims {artifact} but no SKILL/scripts/tests anchor exists", errors)

    for label, text in readmes.items():
        require(180 <= len(text.splitlines()) <= 220, f"{label} must stay between 180 and 220 lines", errors)
    require("## 文档入口" in readmes["README.md"], "README.md missing Chinese documentation entry", errors)
    require("## Documentation" in readmes["README.en.md"], "README.en.md missing documentation entry", errors)
    require(len(compatibility.splitlines()) <= 20, "README.zh-CN.md compatibility entry is too long", errors)
    require("中文 README 已迁移" in compatibility, "README.zh-CN.md missing migration notice", errors)


def audit_canonical_public_paths(errors: list[str]) -> None:
    readme_zh = read(ROOT / "README.md")
    readme_en = read(ROOT / "README.en.md")
    compatibility = read(ROOT / "README.zh-CN.md")
    app = read(ROOT / "apps/web/src/App.tsx")
    listing = load_json("agents/marketplace-listing.json")

    required_en = [
        "./docs/guides/agent-connect-bridge.md",
        "./docs/guides/agent-setup.md",
        f"./docs/release/release-notes-v{VERSION}.md",
        "./docs/README.md",
    ]
    for link in required_en:
        require(link in readme_en, f"README.en.md missing canonical link {link}", errors)

    required_zh = [
        "./docs/zh-CN/guides/agent-connect-bridge.md",
        f"./docs/zh-CN/release/release-notes-v{VERSION}.md",
        "./docs/zh-CN/README.md",
        "./README.en.md",
    ]
    for link in required_zh:
        require(link in readme_zh, f"README.md missing canonical link {link}", errors)

    require("[./README.md]" not in compatibility, "README.zh-CN.md contains malformed README link", errors)
    require("(./README.md)" in compatibility and "(./README.en.md)" in compatibility, "README.zh-CN.md missing compatibility links", errors)

    docs_en = read(ROOT / "docs/README.md")
    docs_zh = read(ROOT / "docs/zh-CN/README.md")
    release_link = f"release/release-notes-v{VERSION}.md"
    require(release_link in docs_en, "English docs index missing current release", errors)
    require(release_link in docs_zh, "Chinese docs index missing current release", errors)

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
    audit_readme_truthfulness(errors)
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
