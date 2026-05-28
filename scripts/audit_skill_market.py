#!/usr/bin/env python3
"""Audit skill marketplace readiness before public promotion."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

PROOF_CASES = (
    "executive-business-review-starter",
    "consulting-proposal-starter",
    "product-pitch-starter",
    "tech-trend-web-deck-starter",
)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def parse_openai_interface(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in read_text(path).splitlines():
        match = re.match(r"^\s{2}([a-z_]+):\s*(.+?)\s*$", line)
        if not match:
            continue
        key, raw_value = match.groups()
        values[key] = raw_value.strip().strip('"').strip("'")
    return values


def audit_openai_metadata(errors: list[str]) -> None:
    path = ROOT / "agents" / "openai.yaml"
    require(path.is_file(), "agents/openai.yaml is missing", errors)
    if not path.is_file():
        return

    text = read_text(path)
    interface = parse_openai_interface(path)
    for key in ("display_name", "short_description", "icon_small", "icon_large", "brand_color", "default_prompt"):
        require(bool(interface.get(key)), f"agents/openai.yaml missing interface.{key}", errors)

    require("policy:" in text, "agents/openai.yaml missing policy block", errors)
    require("$ultimate-ppt-master" in interface.get("default_prompt", ""), "default prompt must mention $ultimate-ppt-master", errors)
    require("quality-checked" in interface.get("default_prompt", ""), "default prompt must promise quality-checked output", errors)
    require(bool(re.fullmatch(r"#[0-9A-Fa-f]{6}", interface.get("brand_color", ""))), "brand_color must be a hex color", errors)
    require(len(interface.get("short_description", "")) <= 80, "short_description should stay marketplace-chip friendly", errors)

    for key in ("icon_small", "icon_large"):
        value = interface.get(key, "")
        asset = ROOT / value
        require(asset.is_file(), f"{key} asset does not exist: {value}", errors)
        if asset.is_file():
            asset_text = read_text(asset)
            require("<svg" in asset_text, f"{key} asset must be SVG: {value}", errors)
            require("TODO" not in asset_text and "PENDING" not in asset_text, f"{key} asset contains placeholder text", errors)


def audit_marketplace_listing(errors: list[str]) -> None:
    listing_path = ROOT / "agents" / "marketplace-listing.json"
    require(listing_path.is_file(), "agents/marketplace-listing.json is missing", errors)
    if not listing_path.is_file():
        return

    listing = json.loads(read_text(listing_path))
    interface = parse_openai_interface(ROOT / "agents" / "openai.yaml")
    openai_short = interface.get("short_description", "")
    listing_short = listing.get("shortDescription", "")

    require(listing.get("id") == "ultimate-ppt-master", "marketplace listing id must be ultimate-ppt-master", errors)
    require(listing.get("invocation") == "$ultimate-ppt-master", "marketplace listing invocation must be $ultimate-ppt-master", errors)
    require(listing.get("version") == json.loads(read_text(ROOT / "package.json")).get("version"), "marketplace listing version must match package.json", errors)
    require(listing.get("defaultPrompt") == interface.get("default_prompt"), "marketplace listing defaultPrompt must match agents/openai.yaml", errors)
    require("quality-checked" in listing_short, "marketplace listing shortDescription must promise quality-checked output", errors)
    require("PPTX" in listing_short and "Web Deck" in listing_short, "marketplace listing shortDescription must name PPTX and Web Deck", errors)
    require(openai_short.split("PPTX", 1)[0].strip() in listing_short, "marketplace listing shortDescription must align with agents/openai.yaml", errors)
    require("local-first" in listing.get("positioning", "").lower(), "marketplace listing positioning must mention local-first", errors)

    metadata = listing.get("metadata", {})
    for key in ("openai", "skillEntrypoint", "distributionGuide", "distributionGuideZh"):
        value = metadata.get(key, "")
        require(isinstance(value, str) and (ROOT / value).is_file(), f"marketplace listing metadata path missing: {key}", errors)

    assets = listing.get("assets", {})
    for key in ("iconSmall", "listingCard", "readmeCarousel"):
        value = assets.get(key, "")
        require(isinstance(value, str) and (ROOT / value).is_file(), f"marketplace listing asset path missing: {key}", errors)

    links = listing.get("links", {})
    for key in ("repository", "webExperience", "benchmarkWall", "quickstart", "agentSetup"):
        require(isinstance(links.get(key), str) and links[key], f"marketplace listing link missing: {key}", errors)
    require(links.get("repository") == "https://github.com/kdnsna/ultimate-ppt-master-skill", "marketplace listing repository link mismatch", errors)
    require(links.get("benchmarkWall", "").endswith("/benchmark/"), "marketplace listing benchmark link must target /benchmark/", errors)

    proof = listing.get("proof", {})
    require((ROOT / proof.get("benchmarkWall", "")).is_file(), "marketplace listing proof.benchmarkWall path missing", errors)
    require((ROOT / proof.get("qualityWorkbench", "")).is_file(), "marketplace listing proof.qualityWorkbench path missing", errors)
    require("report-only" in proof.get("repairPolicy", ""), "marketplace listing must state report-only repair policy", errors)

    cases = proof.get("cases", [])
    require(len(cases) >= len(PROOF_CASES), "marketplace listing needs all public proof cases", errors)
    case_ids = {case.get("id") for case in cases if isinstance(case, dict)}
    for case_id in PROOF_CASES:
        require(case_id in case_ids, f"marketplace listing missing proof case: {case_id}", errors)
    for case in cases:
        if not isinstance(case, dict):
            errors.append("marketplace listing proof case must be an object")
            continue
        for key in ("source", "demo", "qualityReport"):
            value = case.get(key, "")
            require(isinstance(value, str) and (ROOT / value).is_file(), f"marketplace listing proof case path missing: {case.get('id')}.{key}", errors)
        require(bool(case.get("bestFor")), f"marketplace listing proof case missing bestFor: {case.get('id')}", errors)

    gates = listing.get("acceptanceGates", [])
    for command in ("npm run audit:presets", "npm run audit:quality", "npm run audit:market", "npm run test:node", "npm run test:worker", "npm run build:web"):
        require(command in gates, f"marketplace listing acceptance gate missing: {command}", errors)


def audit_skill_entrypoint(errors: list[str]) -> None:
    skill = ROOT / "SKILL.md"
    require(skill.is_file(), "SKILL.md is missing", errors)
    if not skill.is_file():
        return

    text = read_text(skill)
    frontmatter = text.split("---", 2)[1] if text.startswith("---") and text.count("---") >= 2 else ""
    require("name: ultimate-ppt-master" in frontmatter, "SKILL.md frontmatter must name ultimate-ppt-master", errors)
    for keyword in ("PPTX", "presentation", "PowerPoint", "网页PPT", "ultimate-ppt-master"):
        require(keyword in text, f"SKILL.md should mention {keyword}", errors)


def audit_readme_surfaces(errors: list[str]) -> None:
    readme = read_text(ROOT / "README.md")
    readme_zh = read_text(ROOT / "README.zh-CN.md")

    for needle in (
        "60-second quickstart",
        "v2.5 case carousel",
        "https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/",
        "Skill Market Distribution",
        "./docs/skill-market-distribution.md",
    ):
        require(needle in readme, f"README.md missing marketplace surface: {needle}", errors)

    for needle in (
        "60 秒开箱即用",
        "v2.5 案例动态展示",
        "https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/",
        "Skill 市场分发",
        "./docs/zh-CN/skill-market-distribution.md",
    ):
        require(needle in readme_zh, f"README.zh-CN.md missing marketplace surface: {needle}", errors)

    for case in PROOF_CASES:
        for filename in ("web-demo.html", "source.sanitized.md", "quality-report.json"):
            require(f"examples/{case}/{filename}" in readme, f"README.md missing proof link: {case}/{filename}", errors)
            require(f"examples/{case}/{filename}" in readme_zh, f"README.zh-CN.md missing proof link: {case}/{filename}", errors)


def audit_benchmark_wall(errors: list[str]) -> None:
    benchmark = ROOT / "apps" / "web" / "public" / "benchmark" / "index.html"
    require(benchmark.is_file(), "public benchmark page is missing", errors)
    if not benchmark.is_file():
        return

    text = read_text(benchmark)
    require("Ultimate PPT Master Benchmark Wall" in text, "benchmark page missing title", errors)
    require("input → preset → output → review" in text, "benchmark page missing proof chain", errors)
    require("Skill Market Distribution" in text, "benchmark page missing skill-market link", errors)
    require("Design Doctor scorecard" in text, "benchmark page missing Design Doctor scorecard", errors)
    require("report-only repair policy" in text, "benchmark page missing report-only repair policy", errors)

    for case in PROOF_CASES:
        public_dir = ROOT / "apps" / "web" / "public" / "examples" / case
        for filename in ("source.sanitized.md", "web-demo.html", "quality-report.json"):
            require((public_dir / filename).is_file(), f"public proof artifact missing: {case}/{filename}", errors)
            require(f"examples/{case}/{filename}" in text, f"benchmark page missing link: {case}/{filename}", errors)


def audit_distribution_docs(errors: list[str]) -> None:
    docs = {
        "docs/skill-market-distribution.md": ROOT / "docs" / "skill-market-distribution.md",
        "docs/zh-CN/skill-market-distribution.md": ROOT / "docs" / "zh-CN" / "skill-market-distribution.md",
        "docs/release-maintenance.md": ROOT / "docs" / "release-maintenance.md",
        "docs/README.md": ROOT / "docs" / "README.md",
        "docs/zh-CN/README.md": ROOT / "docs" / "zh-CN" / "README.md",
    }
    for label, path in docs.items():
        require(path.is_file(), f"{label} is missing", errors)

    market = read_text(docs["docs/skill-market-distribution.md"]) if docs["docs/skill-market-distribution.md"].is_file() else ""
    market_zh = read_text(docs["docs/zh-CN/skill-market-distribution.md"]) if docs["docs/zh-CN/skill-market-distribution.md"].is_file() else ""
    release = read_text(docs["docs/release-maintenance.md"]) if docs["docs/release-maintenance.md"].is_file() else ""
    docs_index = read_text(docs["docs/README.md"]) if docs["docs/README.md"].is_file() else ""
    docs_index_zh = read_text(docs["docs/zh-CN/README.md"]) if docs["docs/zh-CN/README.md"].is_file() else ""

    for text, label in ((market, "English market doc"), (market_zh, "Chinese market doc")):
        for needle in ("agents/openai.yaml", "agents/marketplace-listing.json", "assets/skill-market", "npm run audit:market", "benchmark"):
            require(needle in text, f"{label} missing {needle}", errors)

    require("npm run audit:market" in release, "release maintenance missing audit:market", errors)
    require("Skill Market Distribution" in docs_index, "docs index missing Skill Market Distribution", errors)
    require("Skill 市场分发" in docs_index_zh, "Chinese docs index missing Skill 市场分发", errors)


def audit_package_script(errors: list[str]) -> None:
    package = json.loads(read_text(ROOT / "package.json"))
    command = package.get("scripts", {}).get("audit:market")
    require(command == "python3 scripts/audit_skill_market.py", "package.json missing audit:market script", errors)


def main() -> int:
    errors: list[str] = []
    audit_openai_metadata(errors)
    audit_marketplace_listing(errors)
    audit_skill_entrypoint(errors)
    audit_readme_surfaces(errors)
    audit_benchmark_wall(errors)
    audit_distribution_docs(errors)
    audit_package_script(errors)

    if errors:
        print("Skill market audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Skill market audit passed: {len(PROOF_CASES)} proof case(s), metadata, docs, and listing assets ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
