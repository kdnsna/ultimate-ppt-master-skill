import json
from pathlib import Path
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

        for preset_id in ("executive_business_review", "product_pitch"):
            with self.subTest(preset_id=preset_id):
                entry = directions[preset_id]
                self.assertEqual(entry["status"], "pack")
                pack_path = entry["packPath"]
                pack_dir = ROOT / pack_path
                self.assertTrue(pack_dir.is_dir(), pack_path)
                self.assertTrue((pack_dir / "preset.json").is_file())
                self.assertTrue((pack_dir / "source.md").is_file())
                self.assertTrue((pack_dir / "quality-checklist.md").is_file())

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


if __name__ == "__main__":
    unittest.main()
