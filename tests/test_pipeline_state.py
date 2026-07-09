import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


VALID_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <rect x="0" y="0" width="1600" height="900" fill="#ffffff"/>
  <text x="120" y="160" font-family="Arial, sans-serif" font-size="48">Title</text>
</svg>
"""


class PipelineStateTest(unittest.TestCase):
    def test_project_init_creates_pipeline_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/project_manager.py"), "init", "demo", "--dir", tmp],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            project = next(Path(tmp).glob("demo_ppt169_*"))
            state = json.loads((project / "pipeline-state.json").read_text(encoding="utf-8"))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(state["version"], "pipeline-state-v1")
        self.assertEqual(state["quality_check"]["passed"], False)

    def test_svg_quality_checker_records_digest_and_svg_to_pptx_blocks_stale_exports(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            svg_dir = project / "svg_output"
            svg_dir.mkdir()
            svg = svg_dir / "01_title.svg"
            svg.write_text(VALID_SVG, encoding="utf-8")

            check = subprocess.run(
                [sys.executable, str(ROOT / "scripts/svg_quality_checker.py"), str(project)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            state = json.loads((project / "pipeline-state.json").read_text(encoding="utf-8"))
            svg.write_text(VALID_SVG.replace("Title", "Changed"), encoding="utf-8")
            export = subprocess.run(
                [sys.executable, str(ROOT / "scripts/svg_to_pptx.py"), str(project), "--only", "native", "--no-notes"],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

        self.assertEqual(check.returncode, 0, check.stdout + check.stderr)
        self.assertTrue(state["quality_check"]["passed"])
        self.assertIn("svg_digest", state["quality_check"])
        self.assertNotEqual(export.returncode, 0)
        self.assertIn("BLOCKED: svg_quality_checker", export.stdout + export.stderr)
