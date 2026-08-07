import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from upm.compiler.compiler import compile_deck  # noqa: E402
from upm.compiler.deckir import build_deckir  # noqa: E402
from upm.qa.contact_sheet import stitch_overview  # noqa: E402
from upm.qa.policy import load_policy  # noqa: E402
from upm.qa.repair import RepairState, plan_repairs  # noqa: E402
from upm.qa.report import build_quality_report  # noqa: E402
from upm.qa.rubric import run_rubric  # noqa: E402


class ContactSheetTest(unittest.TestCase):
    def test_stitch_overview_dimensions(self):
        try:
            from PIL import Image
        except ImportError:
            self.skipTest("Pillow 不可用")
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            images = []
            for index in range(1, 5):
                path = root / f"{index}.png"
                Image.new("RGB", (320, 180), (index * 40 % 255, 30, 60)).save(path)
                images.append(path)
            overview = stitch_overview(images, root / "overview.jpg")
            with Image.open(overview) as result:
                self.assertEqual(result.width, 3 * 640 + 4 * 12)
                self.assertEqual(result.height, 2 * (32 + 360) + 3 * 12)


class RubricTest(unittest.TestCase):
    def _project(self):
        deckir = build_deckir("质检测试", "连续三页同一内容。" * 40, page_count=5)
        temp = tempfile.mkdtemp()
        project = Path(temp) / "qa"
        compile_deck(deckir, project)
        return project, deckir

    def test_rubric_finds_missing_evidence_and_overflow(self):
        deckir = build_deckir("质检测试", "", page_count=5)
        temp = tempfile.mkdtemp()
        project = Path(temp) / "qa"
        compile_deck(deckir, project)
        findings = run_rubric(project, [], deckir=deckir, quality_mode="quick")
        ids = {f["id"] for f in findings}
        self.assertIn("missing-evidence", ids)

    def test_rubric_blocks_placeholders_in_standard(self):
        deckir = build_deckir("无来源", "", page_count=4)
        temp = tempfile.mkdtemp()
        project = Path(temp) / "qa"
        compile_deck(deckir, project)
        findings = run_rubric(project, [], deckir=deckir, policy=load_policy("standard"))
        ids = {f["id"] for f in findings}
        self.assertTrue({"placeholder-content", "no-source-claims"} & ids)
        self.assertTrue(any(f["severity"] == "error" for f in findings if f["id"] in ids))

    def test_no_renderer_prefix_is_warning_in_quick(self):
        deckir = build_deckir("渲染", "有一句完整资料用于生成正文。", page_count=4)
        temp = tempfile.mkdtemp()
        project = Path(temp) / "qa"
        compile_deck(deckir, project)
        records = [{"page": "01", "ok": False, "error": "no-renderer: 缺少 playwright"}]
        findings = run_rubric(project, records, deckir=deckir, quality_mode="quick")
        render_findings = [f for f in findings if f["id"] == "render-failed"]
        self.assertTrue(render_findings)
        self.assertEqual(render_findings[0]["severity"], "warning")

    def test_rubric_finds_overflow(self):
        deckir = build_deckir("溢出质检测试", "长文本" * 300, page_count=4)
        temp = tempfile.mkdtemp()
        project = Path(temp) / "qa"
        compile_deck(deckir, project)
        findings = run_rubric(project, [], deckir=deckir)
        self.assertTrue(any(f["id"] == "text-overflow" for f in findings))

    def test_rubric_detects_blank_page(self):
        project, deckir = self._project()
        try:
            from PIL import Image
        except ImportError:
            self.skipTest("Pillow 不可用")
        png = project / "preview" / "pages" / "01_blank.png"
        png.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (960, 540), "#F6F3ED").save(png)
        records = [{"page": "01_blank", "ok": True, "path": str(png)}]
        findings = run_rubric(project, records, deckir=deckir)
        self.assertTrue(any(f["id"] == "blank-page" for f in findings))

    def test_repair_plan_round_budget(self):
        findings = [{"id": "text-overflow", "page": "pages/01.page"}]
        state = RepairState()
        plan = plan_repairs(findings, state)
        self.assertEqual(plan["status"], "proposed")
        self.assertFalse(plan["roundBudgetExceeded"])
        state.rounds = 2
        plan = plan_repairs(findings, state)
        self.assertTrue(plan["roundBudgetExceeded"])
        self.assertEqual(plan["status"], "blocked")

    def test_quality_report_gates(self):
        report = build_quality_report(
            Path(tempfile.mkdtemp()),
            structure_errors=[],
            structure_warnings=[],
            overflow_findings=[],
            render_records=[{"page": "01", "ok": True}],
            rubric_findings=[],
            export_result={"verified": True, "slides": 1},
            rounds_used=0,
            unresolved=[],
            quality_mode="standard",
            backend="local",
        )
        self.assertEqual(report["gates"]["structure"], "pass")
        self.assertEqual(report["gates"]["export"], "pass")
        self.assertEqual(report["gates"]["visual"], "pass")
        self.assertEqual(report["overall"], "pass")

    def test_quality_report_empty_render_not_pass(self):
        report = build_quality_report(
            Path(tempfile.mkdtemp()),
            structure_errors=[],
            structure_warnings=[],
            overflow_findings=[],
            render_records=[],
            rubric_findings=[],
            export_result={"verified": True, "slides": 1},
            rounds_used=0,
            unresolved=[],
            quality_mode="standard",
            backend="local",
        )
        self.assertEqual(report["gates"]["visual"], "not-run")
        self.assertEqual(report["overall"], "fail")
        self.assertEqual(report["gates"]["formalDelivery"], "fail")

    def test_quality_report_quick_allows_visual_not_run(self):
        report = build_quality_report(
            Path(tempfile.mkdtemp()),
            structure_errors=[],
            structure_warnings=[],
            overflow_findings=[],
            render_records=[],
            rubric_findings=[],
            export_result={"verified": True, "slides": 1},
            rounds_used=0,
            unresolved=[],
            quality_mode="quick",
            backend="local",
            qa_skipped=True,
        )
        self.assertEqual(report["gates"]["visual"], "not-run")
        self.assertEqual(report["overall"], "pass")
        self.assertEqual(report["summary"]["renderFailed"], 0)


if __name__ == "__main__":
    unittest.main()
