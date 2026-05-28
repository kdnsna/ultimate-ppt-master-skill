import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SkillMarketAuditTest(unittest.TestCase):
    def test_skill_market_audit_script_passes(self):
        script = ROOT / "scripts" / "audit_skill_market.py"
        self.assertTrue(script.is_file())
        result = subprocess.run(
            [sys.executable, str(script)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Skill market audit passed", result.stdout)

    def test_package_and_release_docs_include_market_gate(self):
        package_json = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        scripts = package_json["scripts"]
        self.assertEqual(scripts.get("audit:market"), "python3 scripts/audit_skill_market.py")

        release_doc = (ROOT / "docs" / "release-maintenance.md").read_text(encoding="utf-8")
        market_doc = (ROOT / "docs" / "skill-market-distribution.md").read_text(encoding="utf-8")
        market_doc_zh = (ROOT / "docs" / "zh-CN" / "skill-market-distribution.md").read_text(encoding="utf-8")
        ci_workflow = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")

        for text in (release_doc, market_doc, market_doc_zh):
            self.assertIn("npm run audit:market", text)

        self.assertIn("npm run audit:quality", ci_workflow)
        self.assertIn("npm run audit:market", ci_workflow)

    def test_marketplace_listing_contract_is_structured(self):
        listing_path = ROOT / "agents" / "marketplace-listing.json"
        self.assertTrue(listing_path.is_file())
        listing = json.loads(listing_path.read_text(encoding="utf-8"))

        self.assertEqual(listing["id"], "ultimate-ppt-master")
        self.assertEqual(listing["invocation"], "$ultimate-ppt-master")
        self.assertIn("quality-checked", listing["shortDescription"])
        self.assertIn("local-first", listing["positioning"].lower())
        self.assertIn("agents/openai.yaml", listing["metadata"]["openai"])
        self.assertIn("assets/skill-market/ultimate-ppt-master-icon.svg", listing["assets"]["iconSmall"])
        self.assertIn("apps/web/public/benchmark/index.html", listing["proof"]["benchmarkWall"])
        self.assertGreaterEqual(len(listing["proof"]["cases"]), 4)
        for case in listing["proof"]["cases"]:
            self.assertIn("id", case)
            self.assertIn("source", case)
            self.assertIn("demo", case)
            self.assertIn("qualityReport", case)
            self.assertIn("bestFor", case)


if __name__ == "__main__":
    unittest.main()
