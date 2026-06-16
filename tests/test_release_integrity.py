import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSION = "5.0.0"


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
        self.assertIn(f'appVersion = "{version}"', (ROOT / "apps/web/src/App.tsx").read_text(encoding="utf-8"))
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

    def test_v5_readmes_are_refactored_as_delivery_homepages(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")
        marketplace_prompt = (
            "Use $ultimate-ppt-master to turn my source material into a "
            "quality-checked PPTX or Web Deck with a visual review report."
        )

        for expected in (
            "60-second quickstart",
            "Why Teams Use It",
            "What v5 Changes",
            "Product Loop",
            "v5.0.0 Notes",
            "Release Notes - v5.0.0",
            "Editable PPTX first",
            "one delivery brief",
            "official/IP asset plan",
            "Codex-first generated visuals",
            "Microsoft YaHei",
            "formal delivery audits",
            "v4.3 Rendered Review Loop",
            "revision-brief.md",
            "repair-plan.json",
            "Simplified Web Console v4.1",
            "DeckIR AI Planning Workflow v4.2",
            "Hybrid-Editable Visual Workflow v4.0",
            "one primary next action",
            "storyboard.json",
            "scripts/ai_storyboard.py",
            "scripts/apply_review_plan.py",
            "page recipes",
            "no-text generated visual layers",
            "npm run audit:web-console",
            "scripts/audit_visual_recipes.py",
            "Benchmark Wall",
            "Skill Market Distribution",
            "npm run audit:docs",
            "./docs/quality/hybrid-editable-visual-workflow-v4.0.md",
            "./docs/quality/deckir-ai-planning-workflow-v4.2.md",
            "./docs/quality/rendered-review-loop-v4.3.md",
            "./docs/release/release-notes-v5.0.0.md",
            "./docs/release/release-notes-v4.3.0.md",
            "./docs/strategy/skill-market-distribution.md",
            marketplace_prompt,
        ):
            self.assertIn(expected, readme)

        for expected in (
            "60 秒开箱即用",
            "为什么团队会用它",
            "v5 做对了什么",
            "产品闭环",
            "v5.0.0 说明",
            "发布说明 - v5.0.0",
            "可编辑 PPTX 优先",
            "一份交付简报",
            "官方/IP 素材计划",
            "Codex-first 生成视觉",
            "微软雅黑",
            "正式交付审计",
            "v4.3 渲染审阅闭环",
            "revision-brief.md",
            "repair-plan.json",
            "v4.1 精简网页控制台",
            "v4.2 DeckIR AI 策划工作流",
            "v4.0 混合可编辑视觉工作流",
            "一个状态驱动主按钮",
            "storyboard.json",
            "scripts/ai_storyboard.py",
            "scripts/apply_review_plan.py",
            "页面配方",
            "无文字生成式视觉层",
            "npm run audit:web-console",
            "scripts/audit_visual_recipes.py",
            "公开案例墙",
            "Skill 市场分发",
            "npm run audit:docs",
            "./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md",
            "./docs/zh-CN/quality/deckir-ai-planning-workflow-v4.2.md",
            "./docs/zh-CN/quality/rendered-review-loop-v4.3.md",
            "./docs/zh-CN/release/release-notes-v5.0.0.md",
            "./docs/zh-CN/release/release-notes-v4.3.0.md",
            "./docs/zh-CN/strategy/skill-market-distribution.md",
            marketplace_prompt,
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
        self.assertIn("Skill Market Distribution", readme)
        self.assertIn("Skill 市场分发", readme_zh)
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

    def test_public_benchmark_page_lists_all_quality_proofs(self):
        benchmark = ROOT / "apps/web/public/benchmark/index.html"
        self.assertTrue(benchmark.is_file())
        page = benchmark.read_text(encoding="utf-8")

        self.assertIn("Ultimate PPT Master Benchmark Wall", page)
        self.assertIn("input → preset → output → review", page)
        self.assertIn("Skill Market Distribution", page)
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
        self.assertIn("Microsoft YaHei", release_v5)
        self.assertIn("Plain-Language Update Notes", release_v5)
        self.assertIn("Codex 原生 GPT 生图", release_v5_zh)
        self.assertIn("微软雅黑", release_v5_zh)
        self.assertIn("白话更新栏", release_v5_zh)

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

        self.assertIn("v5.0.0", hero)
        self.assertIn("Delivery defaults", hero)
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
        self.assertIn("generate_visual_element_kit.py", skill)

    def test_bridge_source_does_not_embed_secret_values(self):
        bridge = (ROOT / "apps/bridge/server.mjs").read_text(encoding="utf-8")

        forbidden = ["sk-test-secret", "sk-xxx", "AIza"]
        for snippet in forbidden:
            self.assertNotIn(snippet, bridge)
        self.assertRegex(bridge, r"127\\.0\\.0\\.1")
        self.assertIn("--allow-launch", bridge)


if __name__ == "__main__":
    unittest.main()
