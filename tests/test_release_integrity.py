import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ReleaseIntegrityTest(unittest.TestCase):
    def test_public_version_markers_are_aligned(self):
        version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
        web_version = json.loads((ROOT / "apps/web/package.json").read_text(encoding="utf-8"))["version"]

        self.assertEqual(version, "2.3.3")
        self.assertEqual(web_version, version)
        self.assertIn(f"v{version}", (ROOT / "README.md").read_text(encoding="utf-8"))
        self.assertIn(f"v{version}", (ROOT / "README.zh-CN.md").read_text(encoding="utf-8"))
        self.assertIn(f'appVersion = "{version}"', (ROOT / "apps/web/src/App.tsx").read_text(encoding="utf-8"))
        self.assertTrue((ROOT / f"docs/release-notes-v{version}.md").is_file())
        self.assertTrue((ROOT / f"docs/zh-CN/release-notes-v{version}.md").is_file())

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

    def test_bridge_source_does_not_embed_secret_values(self):
        bridge = (ROOT / "apps/bridge/server.mjs").read_text(encoding="utf-8")

        forbidden = ["sk-test-secret", "sk-xxx", "AIza"]
        for snippet in forbidden:
            self.assertNotIn(snippet, bridge)
        self.assertRegex(bridge, r"127\\.0\\.0\\.1")
        self.assertIn("--allow-launch", bridge)


if __name__ == "__main__":
    unittest.main()
