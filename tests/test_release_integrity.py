import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ReleaseIntegrityTest(unittest.TestCase):
    def test_public_version_markers_are_aligned(self):
        version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
        web_version = json.loads((ROOT / "apps/web/package.json").read_text(encoding="utf-8"))["version"]

        self.assertEqual(version, "2.5.0")
        self.assertEqual(web_version, version)
        self.assertIn(f"v{version}", (ROOT / "README.md").read_text(encoding="utf-8"))
        self.assertIn(f"v{version}", (ROOT / "README.zh-CN.md").read_text(encoding="utf-8"))
        self.assertIn(f'appVersion = "{version}"', (ROOT / "apps/web/src/App.tsx").read_text(encoding="utf-8"))
        self.assertTrue((ROOT / f"docs/release-notes-v{version}.md").is_file())
        self.assertTrue((ROOT / f"docs/zh-CN/release-notes-v{version}.md").is_file())
        self.assertIn(
            "Plain-Language Update Notes",
            (ROOT / f"docs/release-notes-v{version}.md").read_text(encoding="utf-8"),
        )
        self.assertIn(
            "白话更新栏",
            (ROOT / f"docs/zh-CN/release-notes-v{version}.md").read_text(encoding="utf-8"),
        )

    def test_core_entry_scripts_exist(self):
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        scripts = package["scripts"]

        self.assertIn("npm --prefix apps/web run build", scripts["build:web"])
        self.assertEqual(scripts["bridge"], "node apps/bridge/server.mjs")
        self.assertTrue((ROOT / "scripts/bootstrap.sh").is_file())
        self.assertTrue((ROOT / "scripts/doctor.sh").is_file())
        self.assertTrue((ROOT / "scripts/run-desktop.sh").is_file())
        self.assertTrue((ROOT / "apps/bridge/server.mjs").is_file())

    def test_bridge_docs_are_linked(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")

        self.assertIn("./docs/agent-connect-bridge.md", readme)
        self.assertIn("./docs/zh-CN/agent-connect-bridge.md", readme_zh)
        self.assertTrue((ROOT / "docs/agent-connect-bridge.md").is_file())
        self.assertTrue((ROOT / "docs/zh-CN/agent-connect-bridge.md").is_file())

    def test_readme_first_screen_shows_quickstart_and_case_carousel(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        readme_zh = (ROOT / "README.zh-CN.md").read_text(encoding="utf-8")
        carousel = ROOT / "assets" / "readme" / "v2.5-case-carousel.gif"

        self.assertTrue(carousel.is_file())
        self.assertGreater(carousel.stat().st_size, 10_000)

        for expected in (
            "60-second quickstart",
            "assets/readme/v2.5-case-carousel.gif",
            "examples/executive-business-review-starter/web-demo.html",
            "examples/consulting-proposal-starter/web-demo.html",
            "examples/product-pitch-starter/web-demo.html",
            "examples/tech-trend-web-deck-starter/web-demo.html",
        ):
            self.assertIn(expected, readme)

        for expected in (
            "60 秒开箱即用",
            "assets/readme/v2.5-case-carousel.gif",
            "经营复盘",
            "咨询方案",
            "产品路演",
            "科技趋势",
        ):
            self.assertIn(expected, readme_zh)

    def test_release_docs_include_v25_quality_gate(self):
        release_maintenance = (ROOT / "docs/release-maintenance.md").read_text(encoding="utf-8")
        growth_playbook = (ROOT / "docs/public-growth-playbook.md").read_text(encoding="utf-8")

        self.assertIn("npm run audit:quality", release_maintenance)
        self.assertNotIn("For v2.4.0", release_maintenance)
        self.assertNotIn("v2.4.0 positions", release_maintenance)
        self.assertNotIn("v2.4.0 release link", growth_playbook)

    def test_readme_images_match_current_product_positioning(self):
        hero = (ROOT / "assets/readme/hero.svg").read_text(encoding="utf-8")
        web_preview = (ROOT / "assets/readme/web-hub-preview.svg").read_text(encoding="utf-8")
        flow = (ROOT / "assets/readme/agent-connect-flow.svg").read_text(encoding="utf-8")
        combined = "\n".join([hero, web_preview, flow])

        self.assertIn("v2.5.0", hero)
        self.assertIn("Local connector", hero)
        self.assertIn("Plain-language glossary", web_preview)
        self.assertIn("Write handoff", flow)
        self.assertNotIn("v2.3.0", combined)
        self.assertNotIn("STATIC MVP", combined)

    def test_public_demos_do_not_show_stale_version_markers(self):
        demo_paths = [
            ROOT / "examples" / "agentic-developer-tools-2026" / "web-demo.html",
            ROOT / "apps" / "web" / "public" / "examples" / "agentic-developer-tools-2026" / "web-demo.html",
        ]

        for demo_path in demo_paths:
            with self.subTest(path=demo_path):
                demo = demo_path.read_text(encoding="utf-8")
                self.assertIn("v2.5", demo)
                self.assertNotIn("v2.3 Demo", demo)
                self.assertNotIn("v2.3 Proof", demo)

    def test_bridge_source_does_not_embed_secret_values(self):
        bridge = (ROOT / "apps/bridge/server.mjs").read_text(encoding="utf-8")

        forbidden = ["sk-test-secret", "sk-xxx", "AIza"]
        for snippet in forbidden:
            self.assertNotIn(snippet, bridge)
        self.assertRegex(bridge, r"127\\.0\\.0\\.1")
        self.assertIn("--allow-launch", bridge)


if __name__ == "__main__":
    unittest.main()
