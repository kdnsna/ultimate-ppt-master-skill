import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from best_effect_router import classify_request  # noqa: E402


class BestEffectRoutingTest(unittest.TestCase):
    def test_fixture_contains_at_least_fifty_route_cases(self):
        cases = json.loads((ROOT / "tests/fixtures/best_effect_routing.json").read_text(encoding="utf-8"))

        self.assertGreaterEqual(len(cases), 50)

    def test_fixture_routes_are_stable(self):
        cases = json.loads((ROOT / "tests/fixtures/best_effect_routing.json").read_text(encoding="utf-8"))
        mismatches = []

        for case in cases:
            result = classify_request(case["input"])
            if result["route"] != case["route"] or result["prompt_quality"] != case["prompt_quality"]:
                mismatches.append((case["input"], case, result))

        self.assertEqual(mismatches, [])

    def test_formal_keywords_win_before_extreme_thin(self):
        result = classify_request("帮我做一份 Q3 销售汇报 PPT")

        self.assertEqual(result["route"], "formal-editable-pptx")
        self.assertEqual(result["prompt_quality"], "extreme-thin")
        self.assertEqual(result["decision"], "explicit-formal-signal")

    def test_generic_topic_only_ppt_uses_fixed_web_style(self):
        result = classify_request("做一个关于 AI 的 PPT")

        self.assertEqual(result["route"], "guizang-web-fixed-style")
        self.assertEqual(result["prompt_quality"], "extreme-thin")


if __name__ == "__main__":
    unittest.main()
