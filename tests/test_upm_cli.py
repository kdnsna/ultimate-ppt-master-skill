"""CLI-level tests for `upm make / edit / doctor` (end-to-end, no mocks)."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PYTHON = ROOT / ".venv" / "bin" / "python" if (ROOT / ".venv" / "bin" / "python").is_file() else Path(sys.executable)


def run_upm(*args: str, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(PYTHON), "-m", "upm", *args],
        cwd=cwd or ROOT,
        capture_output=True,
        text=True,
        timeout=600,
    )


class UpmDoctorTest(unittest.TestCase):
    def test_doctor_core_reports_environment(self):
        result = run_upm("doctor", "--profile", "core")
        self.assertIn("UPM doctor", result.stdout)
        self.assertIn("契约同步", result.stdout)
        # Return 0 when env is healthy; return 1 when contracts are stale
        # (pre-existing dirty workspace). Either way the report must print.
        self.assertIn(result.returncode, {0, 1}, result.stderr + result.stdout)


class UpmMakeTest(unittest.TestCase):
    def _make_project(self, base: Path) -> Path:
        result = run_upm(
            "make",
            "主题测试：数据平台建设，覆盖数据治理、实时计算与安全合规三个方向。",
            "--title",
            "CLI 测试主题",
            "--out",
            str(base),
            "--pages",
            "4",
            "--mode",
            "quick",
        )
        self.assertEqual(result.returncode, 0, result.stderr[-2000:])
        projects = [p for p in base.iterdir() if p.is_dir()]
        self.assertEqual(len(projects), 1)
        return projects[0]

    def test_make_quick_produces_valid_project(self):
        with tempfile.TemporaryDirectory() as name:
            project = self._make_project(Path(name) / "out")
            self.assertTrue((project / "deck.pptd").is_file())
            pages = list((project / "pages").glob("*.page"))
            self.assertEqual(len(pages), 4)
            report = json.loads((project / ".upm" / "quality-report.json").read_text(encoding="utf-8"))
            self.assertEqual(report["gates"]["structure"], "pass")
            self.assertTrue(any((project / "exports").glob("*.pptx")))

    def test_make_rejects_broken_deckir_before_export(self):
        with tempfile.TemporaryDirectory() as name:
            broken = Path(name) / "broken.deckir.json"
            broken.write_text(json.dumps({"title": "空", "slides": []}), encoding="utf-8")
            result = run_upm("make", "x", "--deckir", str(broken), "--out", str(Path(name) / "out"), "--mode", "quick")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("DeckIR 没有任何页面", result.stderr)

    def test_make_markdown_input_is_clean(self):
        with tempfile.TemporaryDirectory() as name:
            source = Path(name) / "source.md"
            source.write_text(
                "# 个人养老金制度简介（2026 年版）\n\n"
                "## 一、制度定位\n\n"
                "个人养老金是政府政策支持、个人自愿参加的补充养老保险制度。\n\n"
                "## 二、参与条件\n\n"
                "年满 16 周岁的中国公民均可参加个人养老金。\n\n"
                "## 三、缴费与税收\n\n"
                "每年缴费上限 12000 元，享受税前扣除优惠。\n",
                encoding="utf-8",
            )
            out = Path(name) / "out"
            result = run_upm(
                "make",
                str(source),
                "--title",
                "个人养老金制度简介",
                "--out",
                str(out),
                "--pages",
                "6",
                "--mode",
                "quick",
            )
            self.assertEqual(result.returncode, 0, result.stderr[-2000:] + result.stdout[-2000:])
            project = next(p for p in out.iterdir() if p.is_dir())
            for page in (project / "pages").glob("*.page"):
                body = page.read_text(encoding="utf-8")
                self.assertNotIn("source.md", body)
                self.assertNotRegex(body, r"text:\s*[\"']?#[^\"']")
            # Light theme paper color should appear in intermediate SVG after export
            svgs = list((project / ".upm" / "intermediate" / "svg").glob("*.svg"))
            self.assertTrue(svgs)
            svg_text = svgs[0].read_text(encoding="utf-8")
            self.assertIn("#F7F5F0", svg_text)

    def test_plan_emits_bridge_payload(self):
        with tempfile.TemporaryDirectory() as name:
            source = Path(name) / "src.md"
            source.write_text("一、制度定位\n个人养老金是补充养老保险。\n二、条件\n年满 16 周岁可参加。\n", encoding="utf-8")
            out = Path(name) / "deckir-bridge.json"
            result = run_upm(
                "plan",
                str(source),
                "--title",
                "计划测试",
                "--pages",
                "5",
                "--emit",
                "bridge",
                "-o",
                str(out),
            )
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            payload = json.loads(out.read_text(encoding="utf-8"))
            self.assertIn("storyboard", payload)
            self.assertIn("sourceMap", payload)
            self.assertEqual(payload["storyboard"]["canonicalSource"], "upm.compiler.planner")
            self.assertGreaterEqual(len(payload["storyboard"]["slides"]), 4)
            # Same planner field set as CLI make path
            self.assertIn("planningMode", payload["storyboard"])
            self.assertTrue(any(s.get("evidenceRefs") is not None for s in payload["storyboard"]["slides"]))

    def test_make_audit_rejects_no_qa(self):
        with tempfile.TemporaryDirectory() as name:
            result = run_upm(
                "make",
                "审计拒绝跳过QA",
                "--out",
                str(Path(name) / "out"),
                "--pages",
                "4",
                "--mode",
                "audit",
                "--no-qa",
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("不允许 --no-qa", result.stderr)

    def test_make_standard_no_source_fails_and_drafts(self):
        with tempfile.TemporaryDirectory() as name:
            out = Path(name) / "out"
            result = run_upm(
                "make",
                "只有一个主题没有资料",
                "--title",
                "无来源正式模式",
                "--out",
                str(out),
                "--pages",
                "4",
                "--mode",
                "standard",
                "--no-qa",
            )
            self.assertEqual(result.returncode, 2, result.stderr + result.stdout)
            project = next(p for p in out.iterdir() if p.is_dir())
            report = json.loads((project / ".upm" / "quality-report.json").read_text(encoding="utf-8"))
            self.assertEqual(report["overall"], "fail")
            self.assertTrue(any((project / "exports" / "draft").glob("*.pptx")))
            self.assertFalse(any(p for p in (project / "exports").glob("*.pptx") if p.is_file()))


class UpmEditTest(unittest.TestCase):
    def test_edit_roundtrip_with_fidelity_report(self):
        with tempfile.TemporaryDirectory() as name:
            project = UpmMakeTest()._make_project(Path(name) / "out")
            source = next((project / "exports").glob("*.pptx"))
            output = Path(name) / "edited.pptx"
            result = run_upm(
                "edit",
                str(source),
                "把第 1 页的 CLI 测试主题 改成 修改后的标题",
                "--output",
                str(output),
            )
            self.assertEqual(result.returncode, 0, result.stderr[-2000:])
            self.assertTrue(output.is_file())
            self.assertIn("保真报告", result.stdout)

    def test_edit_edits_json_without_instruction(self):
        with tempfile.TemporaryDirectory() as name:
            project = UpmMakeTest()._make_project(Path(name) / "out")
            source = next((project / "exports").glob("*.pptx"))
            edits = Path(name) / "edits.json"
            edits.write_text(
                json.dumps(
                    {
                        "edits": [
                            {
                                "slide": 1,
                                "operations": [
                                    {
                                        "op": "replace_text",
                                        "old": "CLI 测试主题",
                                        "new": "JSON编辑标题",
                                    }
                                ],
                            }
                        ]
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            output = Path(name) / "edited2.pptx"
            result = run_upm("edit", str(source), "--edits", str(edits), "--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr[-2000:] + result.stdout[-2000:])
            self.assertTrue(output.is_file())


if __name__ == "__main__":
    unittest.main()
