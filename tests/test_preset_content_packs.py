import json
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]
PRESETS_DIR = ROOT / "templates" / "presets"


class PresetContentPackTest(unittest.TestCase):
    def load_directions(self):
        return json.loads(
            (PRESETS_DIR / "preset-directions.json").read_text(encoding="utf-8")
        )

    def test_core_v24_preset_packs_exist(self):
        directions = self.load_directions()

        for preset_id in (
            "executive_business_review",
            "consulting_proposal",
            "product_pitch",
            "tech_trend_web_deck",
        ):
            with self.subTest(preset_id=preset_id):
                entry = directions[preset_id]
                self.assertEqual(entry["status"], "pack")
                pack_path = entry["packPath"]
                pack_dir = ROOT / pack_path
                self.assertTrue(pack_dir.is_dir(), pack_path)
                self.assertTrue((pack_dir / "preset.json").is_file())
                self.assertTrue((pack_dir / "source.md").is_file())
                self.assertTrue((pack_dir / "quality-checklist.md").is_file())

    def test_preset_pack_audit_script_passes(self):
        result = subprocess.run(
            ["python3", "scripts/audit_preset_packs.py"],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_preset_pack_contract_is_actionable(self):
        for preset_path in sorted(PRESETS_DIR.glob("*/preset.json")):
            with self.subTest(preset=preset_path.parent.name):
                data = json.loads(preset_path.read_text(encoding="utf-8"))
                for key in (
                    "id",
                    "scenario",
                    "audience",
                    "sourceRequirements",
                    "narrativeSkeleton",
                    "slideRoster",
                    "templateCandidates",
                    "qualityChecks",
                    "sampleProof",
                ):
                    self.assertIn(key, data)

                self.assertGreaterEqual(len(data["sourceRequirements"]), 4)
                self.assertGreaterEqual(len(data["narrativeSkeleton"]), 4)
                self.assertGreaterEqual(len(data["slideRoster"]), 6)
                self.assertGreaterEqual(len(data["qualityChecks"]), 5)
                self.assertIn("publicDemoSafe", data["sampleProof"])
                for proof_key in ("source", "qualityChecklist", "generatedOutput", "screenshot"):
                    proof_path = data["sampleProof"][proof_key]
                    self.assertNotEqual(proof_path, "pending")
                    self.assertTrue((ROOT / proof_path).exists(), proof_path)


if __name__ == "__main__":
    unittest.main()
