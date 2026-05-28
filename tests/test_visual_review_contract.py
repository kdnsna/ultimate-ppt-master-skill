import unittest
from pathlib import Path
import importlib.util


ROOT = Path(__file__).resolve().parents[1]


def load_visual_review_module():
    spec = importlib.util.spec_from_file_location("visual_review", ROOT / "scripts" / "visual_review.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class VisualReviewContractTest(unittest.TestCase):
    def test_design_doctor_summary_is_report_first_and_actionable(self):
        module = load_visual_review_module()
        records = [
            {"page": "01_cover.svg", "ok": True, "all_background": False},
            {"page": "02_kpi.svg", "ok": True, "all_background": True},
            {"page": "03_actions.svg", "ok": False, "error": "render failed"},
        ]

        summary = module.build_design_doctor_summary(records)

        self.assertEqual(summary["repairPolicy"]["default"], "report-only")
        self.assertFalse(summary["repairPolicy"]["autoRepair"])
        self.assertGreaterEqual(len(summary["scorecard"]), 3)
        self.assertGreaterEqual(len(summary["repairRecommendations"]), 2)
        self.assertIn("01_cover.svg", summary["pageFindings"][0]["page"])
        self.assertTrue(any("explicitly asks" in item["en"] for item in summary["repairRecommendations"]))


if __name__ == "__main__":
    unittest.main()
