import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSION = "6.1.0"


class ReleaseIntegrityTest(unittest.TestCase):
    def test_public_version_markers_are_aligned(self):
        version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
        web_version = json.loads((ROOT / "apps/web/package.json").read_text(encoding="utf-8"))["version"]
        web_lock = json.loads((ROOT / "apps/web/package-lock.json").read_text(encoding="utf-8"))
        listing = json.loads((ROOT / "agents/marketplace-listing.json").read_text(encoding="utf-8"))

        self.assertEqual(version, VERSION)
        self.assertEqual(web_version, version)
        self.assertEqual(web_lock["version"], version)
        self.assertEqual(web_lock["packages"][""]["version"], version)
        self.assertEqual(listing["version"], version)
        self.assertIn(f"v{version}", (ROOT / "README.md").read_text(encoding="utf-8"))
        self.assertIn(f"v{version}", (ROOT / "README.zh-CN.md").read_text(encoding="utf-8"))
        self.assertIn(f'appVersion = "{version}"', (ROOT / "apps/web/src/V6Workspace.tsx").read_text(encoding="utf-8"))
        self.assertTrue((ROOT / f"docs/release/release-notes-v{version}.md").is_file())
        self.assertTrue((ROOT / f"docs/zh-CN/release/release-notes-v{version}.md").is_file())
        self.assertIn(
            "Plain-Language Update Notes",
            (ROOT / f"docs/release/release-notes-v{version}.md").read_text(encoding="utf-8"),
        )
        self.assertIn(
            "白话更新栏",
            (ROOT / f"docs/zh-CN/release/release-notes-v{version}.md").read_text(encoding="utf-8"),
        )
        self.assertIn(f"release/release-notes-v{version}.md", (ROOT / "docs/README.md").read_text(encoding="utf-8"))
        self.assertIn(f"release/release-notes-v{version}.md", (ROOT / "docs/zh-CN/README.md").read_text(encoding="utf-8"))

    def test_core_entry_scripts_exist(self):
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        scripts = package["scripts"]

        self.assertIn("npm --prefix apps/web run build", scripts["build:web"])
        self.assertEqual(scripts["audit:docs"], "python3 scripts/audit_docs_links.py")
        self.assertEqual(scripts["audit:web-console"], "python3 scripts/audit_web_console.py")
        self.assertEqual(scripts["audit:v6-workspace"], "python3 scripts/audit_v6_workspace.py")
        self.assertIn(f'appVersion = "{VERSION}"', (ROOT / "apps/web/src/V6Workspace.tsx").read_text(encoding="utf-8"))
        self.assertEqual(scripts["audit:brief"], "python3 scripts/audit_brief_contract.py")
        self.assertEqual(scripts["audit:visual-intent"], "python3 scripts/audit_visual_intent.py")
        self.assertEqual(scripts["audit:feedback-loop"], "python3 scripts/audit_feedback_loop.py")
        self.assertEqual(scripts["bridge"], "node apps/bridge/server.mjs")
        self.assertTrue((ROOT / "scripts/bootstrap.sh").is_file())
        self.assertTrue((ROOT / "scripts/doctor.sh").is_file())
        self.assertTrue((ROOT / "scripts/run-desktop.sh").is_file())
        self.assertTrue((ROOT / "apps/bridge/server.mjs").is_file())

    def test_docs_audit_passes(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/audit_docs_links.py")],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Documentation audit passed", result.stdout)

    def test_docs_information_architecture_and_stubs_exist(self):
        for path in (
            "docs/guides/agent-connect-bridge.md",
            "docs/guides/agent-setup.md",
            "docs/guides/web-experience.md",
            "docs/quality/hybrid-editable-visual-workflow-v4.0.md",
            "docs/quality/deckir-ai-planning-workflow-v4.2.md",
            "docs/quality/rendered-review-loop-v4.3.md",
            "docs/release/release-notes-v6.1.0.md",
            "docs/release/release-notes-v5.4.1.md",
            "docs/release/release-notes-v5.3.0.md",
            "docs/release/release-notes-v5.2.0.md",
            "docs/release/release-notes-v5.1.0.md",
            "docs/release/release-notes-v5.0.0.md",
            "docs/release/release-notes-v4.3.0.md",
            "docs/quality/quality-workbench-v2.5.md",
            "docs/release/release-notes-v4.2.0.md",
            "docs/release/release-notes-v4.1.0.md",
            "docs/release/release-notes-v4.0.0.md",
            "docs/release/release-maintenance.md",
            "docs/strategy/skill-market-distribution.md",
            "docs/zh-CN/guides/agent-connect-bridge.md",
            "docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md",
            "docs/zh-CN/quality/deckir-ai-planning-workflow-v4.2.md",
            "docs/zh-CN/quality/rendered-review-loop-v4.3.md",
            "docs/zh-CN/release/release-notes-v6.1.0.md",
            "docs/zh-CN/release/release-notes-v5.4.1.md",
            "docs/zh-CN/release/release-notes-v5.3.0.md",
            "docs/zh-CN/release/release-notes-v5.2.0.md",
            "docs/zh-CN/release/release-notes-v5.1.0.md",
            "docs/zh-CN/release/release-notes-v5.0.0.md",
            "docs/zh-CN/release/release-notes-v4.3.0.md",
            "docs/zh-CN/release/release-notes-v4.2.0.md",
            "docs/zh-CN/release/release-notes-v4.1.0.md",
            "docs/zh-CN/release/release-notes-v4.0.0.md",
            "docs/zh-CN/strategy/skill-market-distribution.md",
        ):
            self.assertTrue((ROOT / path).is_file(), path)

        for old, canonical in (
            ("docs/agent-connect-bridge.md", "docs/guides/agent-connect-bridge.md"),
            ("docs/skill-market-distribution.md", "docs/strategy/skill-market-distribution.md"),
            ("docs/release-notes-v3.0.0.md", "docs/release/release-notes-v3.0.0.md"),
            ("docs/zh-CN/agent-connect-bridge.md", "docs/zh-CN/guides/agent-connect-bridge.md"),
            ("docs/zh-CN/skill-market-distribution.md", "docs/zh-CN/strategy/skill-market-distribution.md"),
        ):
            text = (ROOT / old).read_text(encoding="utf-8")
            self.assertTrue("Document Moved" in text or "文档已迁移" in text)
            self.assertIn(canonical, text)

    def test_v5_readmes_are_refactored_as_truthful_homepages(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")

        for expected in (
            "60-second quickstart",
            "Real Proof Packs",
            "Routes",
            "Dependencies and Degradation",
            "Known Limits",
            "Acknowledgments",
            "Style A Editorial Fixed Rhythm",
            "Proof Packs",
            "Release Notes - v5.2.0",
            "Release Notes - v5.1.0",
            "self-assessed by Design Doctor",
            "project-brief.json",
            "asset_plan.json",
            "current_generation_evidence",
            "pipeline-state.json",
            "Needs-Manual",
            "expectationFit",
            "./docs/release/release-notes-v5.2.0.md",
            "./docs/release/release-notes-v5.1.0.md",
            "./docs/release/release-notes-v5.0.0.md",
        ):
            self.assertIn(expected, readme)

        for expected in (
            "60 秒开箱即用",
            "真实 Proof Packs",
            "路线选择",
            "依赖与降级",
            "已知限制",
            "致谢",
            "Style A Editorial Fixed Rhythm",
            "Proof Packs",
            "发布说明 - v5.2.0",
            "发布说明 - v5.1.0",
            "Design Doctor 自评",
            "project-brief.json",
            "asset_plan.json",
            "current_generation_evidence",
            "pipeline-state.json",
            "Needs-Manual",
            "expectationFit",
            "./docs/zh-CN/release/release-notes-v5.2.0.md",
            "./docs/zh-CN/release/release-notes-v5.1.0.md",
            "./docs/zh-CN/release/release-notes-v5.0.0.md",
        ):
            self.assertIn(expected, readme_zh)

        for banned in (
            "Best Results Prompt",
            "What v5 Changes",
            "v5 Delivery Standard",
            "Repository Map",
            "Production Stability Guardrails",
            "Quality Gates",
            "Guizang-like",
            "Benchmark Wall",
            "Skill Market Distribution",
        ):
            self.assertNotIn(banned, readme)
            self.assertNotIn(banned, readme_zh)

        self.assertLessEqual(len(readme.splitlines()), 240)
        self.assertLessEqual(len(readme_zh.splitlines()), 240)

        for content in (readme, readme_zh):
            self.assertIn("</p>\n\n![", content)
            self.assertIn(".png)\n\n[![", content)
            self.assertIn("comparison.html)\n\n", content)

    def test_readme_top_routes_existing_powerpoints_to_pptlint(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")
        english_top = "\n".join(readme.splitlines()[:10])
        chinese_top = "\n".join(readme_zh.splitlines()[:10])

        self.assertIn("Already have a PowerPoint", english_top)
        self.assertIn("已有 PPT", chinese_top)
        self.assertIn("https://github.com/kdnsna/pptlint", english_top)
        self.assertIn("https://github.com/kdnsna/pptlint", chinese_top)
        for jargon in ("quality gate", "regression gate", "质量门禁", "回归门禁"):
            self.assertNotIn(jargon, english_top + chinese_top)

    def test_maintainer_guardrails_live_outside_readme(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")
        release_maintenance = (ROOT / "docs/release/release-maintenance.md").read_text(encoding="utf-8")

        for expected in (
            "UPSTREAM_SYNC.md",
            "audit:repo-hygiene",
            "Do not copy post-AGPL Guizang code directly",
            "prompt files before generation",
            "forbid bitmap text overlay repair",
        ):
            self.assertIn(expected, release_maintenance)
            self.assertNotIn(expected, readme)

        self.assertIn("audit:image-contracts", release_maintenance)
        self.assertIn("audit:image-contracts", readme)

        for expected in (
            "UPSTREAM_SYNC.md",
            "audit:repo-hygiene",
            "不直接复制 AGPL 后的归藏代码",
            "先写 prompt 文件再生成",
            "禁止用位图覆盖方式修补生成图文字",
        ):
            self.assertNotIn(expected, readme_zh)

        self.assertIn("audit:image-contracts", readme_zh)

    def test_v54_swiss_deck_asset_factory_surface_is_documented(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

        self.assertEqual(
            package["scripts"]["audit:swiss-deck"],
            "node scripts/validate-swiss-deck.mjs examples/swiss-v54-demo/index.html",
        )
        self.assertEqual(
            package["scripts"]["audit:magazine-deck"],
            "node scripts/validate-magazine-deck.mjs examples/magazine-v54-demo/index.html",
        )
        for expected in (
            "v5.4 Swiss Deck and Asset Factory",
            "Style B Swiss International",
            "asset_plan.json",
            "current_generation_evidence",
            "npm run audit:swiss-deck",
            "examples/swiss-v54-demo/index.html",
            "Baoyu Design",
            "latest Guizang PPT Skill",
        ):
            self.assertIn(expected, readme)

        for expected in (
            "v5.4 瑞士风 Deck 与资产工厂",
            "Style B 瑞士国际主义",
            "asset_plan.json",
            "current_generation_evidence",
            "npm run audit:swiss-deck",
            "examples/swiss-v54-demo/index.html",
            "Baoyu Design",
            "最新版 Guizang PPT Skill",
        ):
            self.assertIn(expected, readme_zh)

    def test_skill_market_distribution_surface_is_ready(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")
        docs_index = (ROOT / "docs/README.md").read_text(encoding="utf-8")
        docs_index_zh = (ROOT / "docs/zh-CN/README.md").read_text(encoding="utf-8")
        openai_yaml = (ROOT / "agents/openai.yaml").read_text(encoding="utf-8")
        listing = json.loads((ROOT / "agents/marketplace-listing.json").read_text(encoding="utf-8"))

        self.assertTrue((ROOT / "docs/strategy/skill-market-distribution.md").is_file())
        self.assertTrue((ROOT / "docs/zh-CN/strategy/skill-market-distribution.md").is_file())
        self.assertNotIn("Skill Market Distribution", readme)
        self.assertNotIn("Skill 市场分发", readme_zh)
        self.assertIn("Skill Market Distribution", docs_index)
        self.assertIn("Skill 市场分发", docs_index_zh)
        self.assertEqual(listing["metadata"]["distributionGuide"], "docs/strategy/skill-market-distribution.md")
        self.assertEqual(listing["metadata"]["distributionGuideZh"], "docs/zh-CN/strategy/skill-market-distribution.md")
        self.assertEqual(listing["links"]["agentSetup"], "docs/guides/agent-setup.md")
        self.assertEqual(listing["proof"]["qualityWorkbench"], "docs/quality/quality-workbench-v2.5.md")
        self.assertIn("npm run audit:docs", listing["acceptanceGates"])
        self.assertIn("npm run audit:web-console", listing["acceptanceGates"])
        self.assertIn('brand_color: "#0F766E"', openai_yaml)
        self.assertIn('icon_small: "./assets/skill-market/ultimate-ppt-master-icon.svg"', openai_yaml)
        self.assertIn('icon_large: "./assets/skill-market/ultimate-ppt-master-card.svg"', openai_yaml)
        self.assertIn("$ultimate-ppt-master", openai_yaml)
        self.assertIn("quality-checked PPTX", openai_yaml)

    def test_v53_best_effect_brief_enhancer_is_public_and_actionable(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        prompt = (ROOT / "PROMPT.md").read_text(encoding="utf-8")
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        openai_yaml = (ROOT / "agents/openai.yaml").read_text(encoding="utf-8")
        listing = json.loads((ROOT / "agents/marketplace-listing.json").read_text(encoding="utf-8"))

        best_effect_prompt = (
            "Use $ultimate-ppt-master with any natural-language presentation request. "
            "It will expand the request into a best-effect brief, choose PPTX or Web Deck, "
            "and run the matching quality checks."
        )

        for expected in (
            "Best-Effect Brief Enhancer",
            "Style A Editorial Fixed Rhythm",
            "extremely thin prompt",
            "Auto-expanded brief",
        ):
            self.assertIn(expected, readme)

        for expected in (
            "最佳效果提示增强器",
            "Style A Editorial Fixed Rhythm",
            "极短指令",
            "自动扩写 brief",
        ):
            self.assertIn(expected, readme_zh)

        for text in (prompt, agents):
            self.assertIn("Best-Effect Brief Enhancer", text)
            self.assertIn("Extreme Thin Prompt Fallback", text)
            self.assertIn("Style A Editorial Fixed Rhythm", text)
            self.assertNotIn("Guizang-like Magazine Web Deck fixed style", text)
            self.assertIn("bestEffectBrief", text)

        self.assertIn("Best-Effect Brief Enhancer", skill)
        self.assertIn("Extreme Thin Prompt Fallback", skill)
        self.assertIn("guizang-web-fixed-style", skill)
        self.assertIn("bestEffectBrief", skill)

        self.assertEqual(listing["defaultPrompt"], best_effect_prompt)
        self.assertIn("best-effect brief", listing["positioning"])

    def test_skill_workflow_wires_route_asset_and_execution_guards(self):
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))

        for expected in (
            "Route Decision Order",
            "explicit-formal-signal",
            "formal/editable keywords outrank prompt thinness",
            "python3 ${SKILL_DIR}/scripts/best_effect_router.py",
            "scripts/build_asset_plan.py",
            "asset_plan.json",
            "python3 ${SKILL_DIR}/scripts/image_gen.py --asset-plan",
            "current_generation_evidence",
            "pipeline-state.json",
            "scripts/spec_lock_slice.py",
            "scripts/execution_budget.py",
            "spec_lock.md line budget",
            "resume-execute",
            "node \"${SKILL_DIR}/scripts/validate-magazine-deck.mjs\"",
            "references/magazine-web/swiss-layout-registry.json",
            "Needs-Manual image rows block Step 6",
        ):
            self.assertIn(expected, skill)

        for script in (
            "scripts/build_asset_plan.py",
            "scripts/best_effect_router.py",
            "scripts/spec_lock_slice.py",
            "scripts/execution_budget.py",
            "scripts/validate-magazine-deck.mjs",
            "references/magazine-web/swiss-layout-registry.json",
        ):
            self.assertTrue((ROOT / script).is_file(), script)

        self.assertIn("audit:magazine-deck", package["scripts"])

    def test_public_proof_packs_page_lists_all_quality_proofs(self):
        benchmark = ROOT / "apps/web/public/benchmark/index.html"
        self.assertTrue(benchmark.is_file())
        page = benchmark.read_text(encoding="utf-8")

        self.assertIn("Ultimate PPT Master Proof Packs", page)
        self.assertIn("input -> preset -> output -> review", page)
        self.assertIn("self-assessed by Design Doctor", page)
        self.assertIn("Input excerpt", page)
        self.assertIn("Rubric", page)
        self.assertNotIn("Skill Market Distribution", page)
        self.assertNotIn("Benchmark Wall", page)
        for path in (
            "examples/executive-business-review-starter/web-demo.html",
            "examples/consulting-proposal-starter/web-demo.html",
            "examples/product-pitch-starter/web-demo.html",
            "examples/tech-trend-web-deck-starter/web-demo.html",
            "examples/executive-business-review-starter/quality-report.json",
            "examples/consulting-proposal-starter/quality-report.json",
            "examples/product-pitch-starter/quality-report.json",
            "examples/tech-trend-web-deck-starter/quality-report.json",
        ):
            self.assertIn(path, page)

        self.assertIn("Design Doctor scorecard", page)
        self.assertIn("report-only repair policy", page)

    def test_v6_featured_gallery_contains_three_finished_source_grounded_decks(self):
        benchmark = (ROOT / "apps/web/public/benchmark/index.html").read_text(encoding="utf-8")
        cases = {
            "gpt-5-6.html": ("GPT-5.6", "openai.com/index/previewing-gpt-5-6-sol"),
            "grok-4-5.html": ("Grok 4.5", "x.ai/news/grok-4-5"),
            "claude-fable-5.html": ("Claude Fable 5", "anthropic.com/claude/fable"),
        }
        case_root = ROOT / "apps/web/public/examples/ai-frontier-2026"

        for filename, (title, source_host) in cases.items():
            path = case_root / filename
            self.assertTrue(path.is_file(), filename)
            text = path.read_text(encoding="utf-8")
            self.assertEqual(text.count('<section class="slide'), 9, filename)
            self.assertIn(title, text)
            self.assertIn(source_host, text)
            self.assertIn("deck.js", text)
            self.assertIn(f"examples/ai-frontier-2026/{filename}", benchmark)

        grok = (case_root / "grok-4-5.html").read_text(encoding="utf-8")
        self.assertIn("\u672a\u627e\u5230 Grok 4.6", grok)
        self.assertNotIn("<title>Grok 4.6", grok)
        self.assertTrue((ROOT / "apps/web/public/benchmark/showcase.html").is_file())
        self.assertTrue((ROOT / "assets/readme/v6-finished-decks.png").is_file())

        design_system = (ROOT / "DESIGN.md").read_text(encoding="utf-8")
        for heading in (
            "Visual theme and atmosphere",
            "Color palette and roles",
            "Typography rules",
            "Component styling",
            "Layout principles",
            "Depth and elevation",
            "Do / do not",
            "Responsive behavior",
            "Agent prompt guide",
        ):
            self.assertIn(heading, design_system)

        directions = json.loads((ROOT / "templates/visual-directions/v6-direction-manifest.json").read_text(encoding="utf-8"))
        required = {
            "atmosphere", "colors", "typography", "compositionModel", "surfaceRhythm",
            "depthModel", "shapeGrammar", "componentGrammar", "imageBehavior",
            "antiPatterns", "responsiveBehavior", "agentPrompt",
        }
        for direction in directions["directions"]:
            self.assertTrue(required.issubset(direction), direction["id"])

        guardrails = directions["generationGuardrails"]
        for key in ("titleSequence", "visualProtagonist", "layoutRegistry", "layoutDiversity", "surfaceRhythm", "imageGeometry", "browserReview"):
            self.assertTrue(guardrails[key], key)

        recipes = json.loads((ROOT / "templates/page-recipes/index.json").read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(recipes), 18)
        for recipe in ("image_story.text_image_7_5", "image_proof.uniform_grid", "product_stage.full_bleed_safe", "native_chart.direct_label", "source_colophon.editorial"):
            self.assertIn(recipe, recipes)

    def test_release_docs_include_v3_and_v4_generation_loops(self):
        release_maintenance = (ROOT / "docs/release/release-maintenance.md").read_text(encoding="utf-8")
        growth_playbook = (ROOT / "docs/strategy/public-growth-playbook.md").read_text(encoding="utf-8")
        completion_audit = (ROOT / "docs/quality/completion-audit-v2.5.md").read_text(encoding="utf-8")
        bridge_doc = (ROOT / "docs/guides/agent-connect-bridge.md").read_text(encoding="utf-8")
        bridge_doc_zh = (ROOT / "docs/zh-CN/guides/agent-connect-bridge.md").read_text(encoding="utf-8")
        web_doc = (ROOT / "docs/guides/web-experience.md").read_text(encoding="utf-8")
        web_doc_zh = (ROOT / "docs/zh-CN/guides/web-experience.md").read_text(encoding="utf-8")
        release_v3 = (ROOT / "docs/release/release-notes-v3.0.0.md").read_text(encoding="utf-8")
        release_v3_zh = (ROOT / "docs/zh-CN/release/release-notes-v3.0.0.md").read_text(encoding="utf-8")
        release_v4 = (ROOT / "docs/release/release-notes-v4.0.0.md").read_text(encoding="utf-8")
        release_v4_zh = (ROOT / "docs/zh-CN/release/release-notes-v4.0.0.md").read_text(encoding="utf-8")
        release_v41 = (ROOT / "docs/release/release-notes-v4.1.0.md").read_text(encoding="utf-8")
        release_v41_zh = (ROOT / "docs/zh-CN/release/release-notes-v4.1.0.md").read_text(encoding="utf-8")
        release_v42 = (ROOT / "docs/release/release-notes-v4.2.0.md").read_text(encoding="utf-8")
        release_v42_zh = (ROOT / "docs/zh-CN/release/release-notes-v4.2.0.md").read_text(encoding="utf-8")
        release_v43 = (ROOT / "docs/release/release-notes-v4.3.0.md").read_text(encoding="utf-8")
        release_v43_zh = (ROOT / "docs/zh-CN/release/release-notes-v4.3.0.md").read_text(encoding="utf-8")
        release_v5 = (ROOT / "docs/release/release-notes-v5.0.0.md").read_text(encoding="utf-8")
        release_v5_zh = (ROOT / "docs/zh-CN/release/release-notes-v5.0.0.md").read_text(encoding="utf-8")
        release_v51 = (ROOT / "docs/release/release-notes-v5.1.0.md").read_text(encoding="utf-8")
        release_v51_zh = (ROOT / "docs/zh-CN/release/release-notes-v5.1.0.md").read_text(encoding="utf-8")
        release_v52 = (ROOT / "docs/release/release-notes-v5.2.0.md").read_text(encoding="utf-8")
        release_v52_zh = (ROOT / "docs/zh-CN/release/release-notes-v5.2.0.md").read_text(encoding="utf-8")
        release_v53 = (ROOT / "docs/release/release-notes-v5.3.0.md").read_text(encoding="utf-8")
        release_v53_zh = (ROOT / "docs/zh-CN/release/release-notes-v5.3.0.md").read_text(encoding="utf-8")

        self.assertIn("npm run audit:docs", release_maintenance)
        self.assertIn("npm run audit:web-console", release_maintenance)
        self.assertIn("npm run audit:quality", release_maintenance)
        self.assertIn("npm run audit:market", release_maintenance)
        self.assertIn("Skill Market Distribution", completion_audit)
        self.assertIn("agents/marketplace-listing.json", completion_audit)
        self.assertIn("Design Doctor", completion_audit)
        self.assertIn("npm run build:desktop", completion_audit)
        self.assertNotIn("For v2.4.0", release_maintenance)
        self.assertNotIn("v2.4.0 release link", growth_playbook)

        for text in (bridge_doc, bridge_doc_zh):
            for expected in ("asset-plan.md", "visual-element-kit.md", "codex-task.md", "AGENTS.md", "quality-report.json"):
                self.assertIn(expected, text)

        for text in (web_doc, web_doc_zh, release_v3, release_v3_zh):
            self.assertIn("formal-business", text)
            self.assertIn("generate_visual_element_kit.py", text)
            self.assertIn("Needs-Manual", text)
            self.assertIn("ChatGPT", text)

        for text in (release_v4, release_v4_zh):
            self.assertIn("generate_visual_layers.py", text)
            self.assertIn("audit_visual_recipes.py", text)
            self.assertIn("page", text.lower())

        self.assertIn("audit_web_console.py", release_v41)
        self.assertIn("npm run audit:web-console", release_v41)
        self.assertIn("four-step", release_v41.lower())
        self.assertIn("audit_web_console.py", release_v41_zh)
        self.assertIn("npm run audit:web-console", release_v41_zh)
        self.assertIn("四步", release_v41_zh)
        self.assertIn("ai_storyboard.py", release_v42)
        self.assertIn("audit_storyboard.py", release_v42)
        self.assertIn("review_rendered_deck.py", release_v42)
        self.assertIn("Plain-Language Update Notes", release_v42)
        self.assertIn("ai_storyboard.py", release_v42_zh)
        self.assertIn("audit_storyboard.py", release_v42_zh)
        self.assertIn("review_rendered_deck.py", release_v42_zh)
        self.assertIn("白话更新栏", release_v42_zh)
        self.assertIn("apply_review_plan.py", release_v43)
        self.assertIn("revision-brief.md", release_v43)
        self.assertIn("Plain-Language Update Notes", release_v43)
        self.assertIn("apply_review_plan.py", release_v43_zh)
        self.assertIn("revision-brief.md", release_v43_zh)
        self.assertIn("白话更新栏", release_v43_zh)
        self.assertIn("Codex native GPT image generation", release_v5)
        self.assertIn("theme art direction", release_v5)
        self.assertIn("山海交汇 烟火同行", release_v5)
        self.assertIn("Microsoft YaHei", release_v5)
        self.assertIn("Plain-Language Update Notes", release_v5)
        self.assertIn("Visual Brief Builder", release_v51)
        self.assertIn("Codex Guided Intake", release_v51)
        self.assertIn("project-brief.json", release_v51)
        self.assertIn("expectationFit", release_v51)
        self.assertIn("Plain-Language Update Notes", release_v51)
        self.assertIn("sourceConfidence", release_v52)
        self.assertIn("deliveryScorecard", release_v52)
        self.assertIn("feedbackLoop", release_v52)
        self.assertIn("Plain-Language Update Notes", release_v52)
        self.assertIn("bestEffectBrief", release_v53)
        self.assertIn("Guizang-like Magazine Web Deck fixed style", release_v53)
        self.assertIn("Plain-Language Update Notes", release_v53)
        self.assertIn("Codex 原生 GPT 生图", release_v5_zh)
        self.assertIn("主题艺术方向", release_v5_zh)
        self.assertIn("山海交汇 烟火同行", release_v5_zh)
        self.assertIn("微软雅黑", release_v5_zh)
        self.assertIn("白话更新栏", release_v5_zh)
        self.assertIn("Visual Brief Builder", release_v51_zh)
        self.assertIn("Codex 分步访谈", release_v51_zh)
        self.assertIn("project-brief.json", release_v51_zh)
        self.assertIn("expectationFit", release_v51_zh)
        self.assertIn("白话更新栏", release_v51_zh)
        self.assertIn("sourceConfidence", release_v52_zh)
        self.assertIn("deliveryScorecard", release_v52_zh)
        self.assertIn("feedbackLoop", release_v52_zh)
        self.assertIn("白话更新栏", release_v52_zh)
        self.assertIn("bestEffectBrief", release_v53_zh)
        self.assertIn("Guizang-like Magazine Web Deck fixed style", release_v53_zh)
        self.assertIn("白话更新栏", release_v53_zh)

    def test_web_handoff_panel_has_executable_next_step_ui(self):
        app = (ROOT / "apps/web/src/App.tsx").read_text(encoding="utf-8")

        self.assertIn("handoffExecutionTitle", app)
        self.assertIn("elementGenerationCommand", app)
        self.assertIn("generate_visual_element_kit.py", app)
        self.assertIn("generatedNowTitle", app)
        self.assertIn("codexNextTitle", app)
        self.assertNotIn("<span>quality-checklist.md</span>\n              <span>quality-checklist.md</span>", app)

    def test_desktop_worker_resource_copy_is_in_sync(self):
        source = (ROOT / "apps/desktop/worker/desktop_worker.py").read_text(encoding="utf-8")
        bundled = (ROOT / "apps/desktop/src-tauri/resources/desktop_worker.py").read_text(encoding="utf-8")

        self.assertEqual(bundled, source)

    def test_readme_images_match_current_product_positioning(self):
        hero = (ROOT / "assets/readme/hero.svg").read_text(encoding="utf-8")
        web_preview = (ROOT / "assets/readme/web-hub-preview.svg").read_text(encoding="utf-8")
        flow = (ROOT / "assets/readme/agent-connect-flow.svg").read_text(encoding="utf-8")
        combined = "\n".join([hero, web_preview, flow])

        self.assertIn("v6.1.0", hero)
        self.assertIn("Best-effect", hero)
        self.assertIn("sourceConfidence", hero)
        self.assertIn("Plain-language glossary", web_preview)
        self.assertIn("Write handoff", flow)
        self.assertNotIn("v2.3.0", combined)
        self.assertNotIn("STATIC MVP", combined)

    def test_public_demos_do_not_show_stale_version_markers(self):
        demo_paths = [
            ROOT / "examples/agentic-developer-tools-2026/web-demo.html",
            ROOT / "apps/web/public/examples/agentic-developer-tools-2026/web-demo.html",
        ]

        for demo_path in demo_paths:
            with self.subTest(path=demo_path):
                demo = demo_path.read_text(encoding="utf-8")
                self.assertIn("v2.5", demo)
                self.assertNotIn("v2.3 Demo", demo)
                self.assertNotIn("v2.3 Proof", demo)

    def test_web_experience_does_not_advertise_unearned_progress(self):
        app = (ROOT / "apps/web/src/App.tsx").read_text(encoding="utf-8")

        self.assertNotIn('meta: `${sourceCount} files · ${readiness}%`', app)
        self.assertNotIn('id: "handoff", label: t.navHandoff, meta: t.commandReady', app)
        self.assertIn("sourceProgressLabel", app)
        self.assertIn("handoffProgressLabel", app)
        self.assertIn("noRealSourcesYet", app)
        self.assertIn("handoffNotCreated", app)

    def test_formal_business_quality_gate_is_release_guarded(self):
        app = (ROOT / "apps/web/src/App.tsx").read_text(encoding="utf-8")
        bridge = (ROOT / "apps/bridge/server.mjs").read_text(encoding="utf-8")
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        design_spec_reference = (ROOT / "templates/design_spec_reference.md").read_text(encoding="utf-8")
        spec_lock_reference = (ROOT / "templates/spec_lock_reference.md").read_text(encoding="utf-8")

        for text in (app, bridge):
            self.assertIn("qualityGate", text)
            self.assertIn("formal-business", text)
            self.assertIn("workflowState", text)
            self.assertIn("visual-element-kit.md", text)
            self.assertIn("chatgpt-generation-first", text)
            self.assertIn("generate_visual_element_kit.py", text)
            self.assertIn("Needs-Manual", text)

        self.assertTrue((ROOT / "scripts/audit_formal_delivery.py").is_file())
        self.assertTrue((ROOT / "scripts/generate_visual_element_kit.py").is_file())
        self.assertTrue((ROOT / "scripts/generate_visual_layers.py").is_file())
        self.assertTrue((ROOT / "scripts/audit_visual_recipes.py").is_file())
        self.assertIn("Formal Business Delivery Gate", skill)
        self.assertIn("logo must not degrade into text fragments", skill)
        self.assertIn("Codex native GPT image generation", skill)
        self.assertIn("Theme art direction", skill)
        self.assertIn("generate_visual_element_kit.py", skill)
        for text in (design_spec_reference, spec_lock_reference):
            self.assertIn("theme_art_direction", text)
            self.assertIn("title_treatment", text)

    def test_bridge_source_does_not_embed_secret_values(self):
        bridge = (ROOT / "apps/bridge/server.mjs").read_text(encoding="utf-8")

        forbidden = ["sk-test-secret", "sk-xxx", "AIza"]
        for snippet in forbidden:
            self.assertNotIn(snippet, bridge)
        self.assertRegex(bridge, r"127\\.0\\.0\\.1")
        self.assertIn("--allow-launch", bridge)


if __name__ == "__main__":
    unittest.main()
