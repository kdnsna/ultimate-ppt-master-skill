import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


SPEC_LOCK = """# Execution Lock

## colors
- bg: #FFFFFF
- text: #111111

## typography
- font_family: Arial, sans-serif
- body: 20
- title: 36

## page_rhythm
- P01: anchor
- P02: dense
- P03: breathing

## page_roles
- P01: cover
- P02: evidence
- P03: close

## images
- P02-chart: images/chart.png
- P03-photo: images/photo.png
"""


class ExecutionBudgetTest(unittest.TestCase):
    def test_spec_lock_slice_returns_global_context_and_current_page_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            (project / "spec_lock.md").write_text(SPEC_LOCK, encoding="utf-8")

            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/spec_lock_slice.py"), str(project), "P02"],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("## colors", result.stdout)
        self.assertIn("- P02: dense", result.stdout)
        self.assertIn("- P02: evidence", result.stdout)
        self.assertNotIn("- P03: breathing", result.stdout)
        self.assertNotIn("- P03: close", result.stdout)

    def test_spec_lock_budget_check_rejects_oversized_lock(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            lines = ["# Execution Lock", "", "## colors"] + [f"- color_{i}: #000000" for i in range(130)]
            (project / "spec_lock.md").write_text("\n".join(lines), encoding="utf-8")

            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/spec_lock_slice.py"), "--check-budget", str(project)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("spec_lock.md exceeds 120 line budget", result.stderr)

    def test_execution_budget_requires_resume_execute_above_sixteen_pages(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/execution_budget.py"), "--page-count", "17"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

        self.assertEqual(result.returncode, 1)
        self.assertIn("resume-execute", result.stdout)

    def test_execution_budget_allows_continuous_mode_at_sixteen_pages(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/execution_budget.py"), "--page-count", "16"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0)
        self.assertIn("continuous", result.stdout)


if __name__ == "__main__":
    unittest.main()
