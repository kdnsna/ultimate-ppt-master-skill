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
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("UPM doctor", result.stdout)
        self.assertIn("契约同步", result.stdout)


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
            self.assertTrue((project / "exports").glob("*.pptx"))

    def test_make_rejects_broken_deckir_before_export(self):
        with tempfile.TemporaryDirectory() as name:
            broken = Path(name) / "broken.deckir.json"
            broken.write_text(json.dumps({"title": "空", "slides": []}), encoding="utf-8")
            result = run_upm("make", "x", "--deckir", str(broken), "--out", str(Path(name) / "out"), "--mode", "quick")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("DeckIR 没有任何页面", result.stderr)


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


if __name__ == "__main__":
    unittest.main()
