import json
import tempfile
import unittest
from pathlib import Path

from scripts.pptlint_to_preserve_plan import build_edits, main


class PptlintToPreservePlanTest(unittest.TestCase):
    def test_tasks_shape(self):
        edits, skipped = build_edits(
            {
                "tasks": [
                    {"slide": 1, "replacements": {"Q2": "Q3"}},
                    {"slide": 4, "old": "线上", "new": "线上渠道"},
                ]
            }
        )
        self.assertEqual(
            edits,
            [
                {"slide": 1, "replacements": {"Q2": "Q3"}},
                {"slide": 4, "replacements": {"线上": "线上渠道"}},
            ],
        )
        self.assertEqual(skipped, [])

    def test_skips_layout_and_incomplete(self):
        edits, skipped = build_edits(
            {
                "issues": [
                    {"page": 2, "kind": "layout", "old": "a", "new": "b"},
                    {"message": "第3页有问题但没有替换"},
                    {"slide": 5, "message": "把「旧结论」改成「新结论」"},
                ]
            }
        )
        self.assertEqual(edits, [{"slide": 5, "replacements": {"旧结论": "新结论"}}])
        self.assertEqual(len(skipped), 2)

    def test_cli_writes_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = Path(tmp) / "report.json"
            out = Path(tmp) / "edits.json"
            report.write_text(
                json.dumps({"findings": [{"slide": 2, "old": "A", "new": "B"}]}),
                encoding="utf-8",
            )
            code = main([str(report), "-o", str(out)])
            self.assertEqual(code, 0)
            self.assertEqual(
                json.loads(out.read_text(encoding="utf-8")),
                [{"slide": 2, "replacements": {"A": "B"}}],
            )


if __name__ == "__main__":
    unittest.main()
