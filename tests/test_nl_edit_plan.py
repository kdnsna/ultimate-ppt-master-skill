import unittest
from pathlib import Path

from scripts.preserve_edit_pptx import inspect_deck, parse_nl_edit_plan

ROOT = Path(__file__).resolve().parents[1]
REAL = ROOT / "examples/executive-business-review-starter/executive-business-review-editable.pptx"


class ParseNlEditPlanTest(unittest.TestCase):
    def test_chinese_multi_slide(self):
        plan = parse_nl_edit_plan("第1页的「Q2」改成「Q3」；第4页 线上 改成 线上渠道")
        self.assertEqual(
            plan,
            [
                {"slide": 1, "replacements": {"Q2": "Q3"}},
                {"slide": 4, "replacements": {"线上": "线上渠道"}},
            ],
        )

    def test_english_slide_arrow(self):
        plan = parse_nl_edit_plan("slide 2: Hello -> Hi")
        self.assertEqual(plan, [{"slide": 2, "replacements": {"Hello": "Hi"}}])

    def test_default_slide_when_omitted(self):
        plan = parse_nl_edit_plan("把「旧」改成「新」", default_slide=3)
        self.assertEqual(plan, [{"slide": 3, "replacements": {"旧": "新"}}])

    def test_empty_and_unparseable(self):
        self.assertEqual(parse_nl_edit_plan(""), [])
        self.assertEqual(parse_nl_edit_plan("随便写点什么"), [])


class InspectDeckTest(unittest.TestCase):
    @unittest.skipUnless(REAL.exists(), "real fixture missing")
    def test_inspect_real_deck_has_texts(self):
        detail = inspect_deck(REAL)
        self.assertGreaterEqual(detail["slideCount"], 1)
        self.assertTrue(detail["slides"][0]["texts"])
        self.assertIn("tables", detail["slides"][0])
        self.assertIn("charts", detail["slides"][0])


if __name__ == "__main__":
    unittest.main()
