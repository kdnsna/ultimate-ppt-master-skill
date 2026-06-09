import json
import subprocess
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]


SOURCE_TEXT = "\n".join(
    [
        "# 示例银行政务服务升级方案",
        "1、办理体验：网点、手机端和政务窗口协同",
        "客户等待时间下降 18%，线上预审覆盖 62%",
        "重点人群需要更清晰的办理提醒",
        "2、权益数字：服务触达与使用效率",
        "月均触达 32 万人次，重点权益核销率 41%",
        "3、流程页：申请、核验、开通、提醒",
        "每一步必须写清办理材料、责任窗口和风险提示",
        "4、对比表：原流程与新流程",
        "原流程跨渠道重复填报，新流程一次采集多端复用",
        "5、行动计划：三周上线、双周复盘",
        "设定 owner、截止时间和可追踪指标",
    ]
)


class AIStoryboardTest(unittest.TestCase):
    def test_fallback_planner_writes_deckir_triple(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            source = project / "source.md"
            source.write_text(SOURCE_TEXT, encoding="utf-8")

            result = subprocess.run(
                [
                    "python3",
                    "scripts/ai_storyboard.py",
                    "--source",
                    str(source),
                    "--project",
                    str(project),
                    "--output-mode",
                    "pptx",
                    "--style-preset",
                    "business",
                    "--preset",
                    "finance_branch_solution",
                    "--quality-gate",
                    "formal-business",
                    "--no-llm",
                ],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            storyboard = json.loads((project / "storyboard.json").read_text(encoding="utf-8"))
            source_map = json.loads((project / "source-map.json").read_text(encoding="utf-8"))
            report = json.loads((project / "planning-report.json").read_text(encoding="utf-8"))

        self.assertEqual(storyboard["deckIRVersion"], "1.0")
        self.assertEqual(storyboard["planningMode"], "fallback-rule-planner")
        self.assertEqual(storyboard["delivery"]["outputMode"], "pptx")
        self.assertEqual(storyboard["delivery"]["qualityGate"], "formal-business")
        self.assertGreaterEqual(len(storyboard["slides"]), 6)
        for slide in storyboard["slides"]:
            self.assertRegex(slide["page"], r"^P\d{2}$")
            self.assertIn(slide["role"], {"anchor", "context", "evidence", "comparison", "process", "benefit", "risk", "action", "closing"})
            self.assertIn(".", slide["recipeId"])
            self.assertTrue(slide["evidenceRefs"])
            self.assertIn("editable", slide["editabilityTarget"])
            if slide["role"] not in {"anchor", "closing", "section", "poster", "web_showcase"}:
                self.assertEqual(slide["rasterPolicy"], "prohibited-formal-body")
        self.assertIn("claims", source_map)
        self.assertTrue(source_map["claims"])
        self.assertFalse(report["provider"]["configured"])
        self.assertEqual(report["status"], "planned")

    def test_planner_accepts_reference_style(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            source = project / "source.md"
            source.write_text(SOURCE_TEXT, encoding="utf-8")
            reference_style = project / "reference-style.json"
            reference_style.write_text(
                json.dumps(
                    {
                        "version": "reference-style-v1",
                        "mode": "style-only",
                        "functionalTypes": ["cover", "evidence", "process"],
                        "layoutFamilies": ["cover_brand", "evidence_board", "process_flow"],
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    "python3",
                    "scripts/ai_storyboard.py",
                    "--source",
                    str(source),
                    "--project",
                    str(project),
                    "--reference-style",
                    str(reference_style),
                    "--reference-mode",
                    "style-only",
                    "--no-llm",
                ],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            storyboard = json.loads((project / "storyboard.json").read_text(encoding="utf-8"))

        self.assertEqual(storyboard["referenceStyle"]["mode"], "style-only")
        self.assertIn("evidence_board", storyboard["referenceStyle"]["layoutFamilies"])


if __name__ == "__main__":
    unittest.main()
