import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ReleaseIntegrityTest(unittest.TestCase):
    def test_public_version_markers_are_aligned(self):
        version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
        desktop_version = json.loads((ROOT / "apps/desktop/package.json").read_text(encoding="utf-8"))["version"]
        tauri_config = json.loads((ROOT / "apps/desktop/src-tauri/tauri.conf.json").read_text(encoding="utf-8"))
        cargo_toml = (ROOT / "apps/desktop/src-tauri/Cargo.toml").read_text(encoding="utf-8")

        self.assertEqual(version, "2.1.0")
        self.assertEqual(desktop_version, version)
        self.assertEqual(tauri_config["version"], version)
        self.assertRegex(cargo_toml, rf'(?m)^version = "{re.escape(version)}"$')
        self.assertIn(f"v{version}", (ROOT / "README.md").read_text(encoding="utf-8"))
        self.assertIn(f"v{version}", (ROOT / "README.zh-CN.md").read_text(encoding="utf-8"))
        self.assertIn(f"v{version}", (ROOT / "assets/readme/hero.svg").read_text(encoding="utf-8"))

    def test_browser_preview_does_not_pretend_to_generate_files(self):
        desktop_api = (ROOT / "apps/desktop/src/lib/desktopApi.ts").read_text(encoding="utf-8")
        run_desktop = (ROOT / "scripts/run-desktop.sh").read_text(encoding="utf-8")

        forbidden = [
            "Desktop MVP Preview",
            "browser-preview",
            "~/UltimatePPTMasterProjects/browser-preview",
            "saveBrowserRecent(result",
        ]
        for snippet in forbidden:
            self.assertNotIn(snippet, desktop_api)

        self.assertIn("Browser diagnostic mode cannot run the Python worker", desktop_api)
        self.assertIn("npm run tauri:dev", run_desktop)
        self.assertIn("Browser UI shell cannot run the Python worker", run_desktop)


if __name__ == "__main__":
    unittest.main()
