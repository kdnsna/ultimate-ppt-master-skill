import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ContractsGenerationTest(unittest.TestCase):
    def test_generate_contracts_check_is_clean(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/generate_contracts.py"), "--check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_agent_entries_share_semantic_assertions(self):
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        claude = (ROOT / "CLAUDE.md").read_text(encoding="utf-8")
        prompt = (ROOT / "PROMPT.md").read_text(encoding="utf-8")
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        route = json.loads((ROOT / "contracts/generated/route-policy.json").read_text(encoding="utf-8"))

        for text in (agents, claude, prompt, skill):
            self.assertIn("Best-Effect Brief Enhancer", text)
            self.assertIn("Extreme Thin Prompt Fallback", text)
            self.assertIn("Style A Editorial Fixed Rhythm", text)
            self.assertIn("light-or-warm-paper", text)
            self.assertNotIn("dark cover, light context, dark tension/opportunity", text)
            self.assertIn("unmapped", text)

        self.assertIn("Do not force a PPTX vs Web choice", prompt)
        self.assertIn("do not force a PPTX vs Web choice first", claude)
        self.assertIn("Auto-route by policy", agents)
        self.assertIn("import-sources <project_path> <source_files...> --copy", skill)
        self.assertNotIn("MUST use `--move`", skill)

        assertions = route["semanticAssertions"]
        self.assertEqual(assertions["defaultCoverSurface"], "light")
        self.assertTrue(assertions["extremeThinAutoRoutes"])
        self.assertFalse(assertions["mustAskBeforeGenerate"])
        self.assertEqual(assertions["extremeThinDefaultFormat"], "web-deck")

    def test_quality_modes_define_audit_fail_gates(self):
        modes = json.loads((ROOT / "contracts/generated/quality-modes.json").read_text(encoding="utf-8"))
        self.assertEqual(set(modes), {"quick", "standard", "audit"})
        self.assertEqual(modes["audit"]["gates"]["missingPreviewPng"], "fail")
        self.assertEqual(modes["audit"]["gates"]["missingDesignReport"], "fail")
        self.assertEqual(modes["quick"]["assets"]["allowAiImages"], False)
        self.assertEqual(modes["standard"]["assets"]["maxGeneratedImages"], 4)


if __name__ == "__main__":
    unittest.main()
