import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class RepositoryHygieneTest(unittest.TestCase):
    def run_hygiene(self, root: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(ROOT / "scripts/audit_repository_hygiene.py"), "--root", str(root)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_rejects_finder_style_duplicate_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README 2.md").write_text("# duplicate\n", encoding="utf-8")

            result = self.run_hygiene(root)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("README 2.md", result.stdout + result.stderr)

    def test_accepts_clean_tree_and_package_exposes_audit(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text("# clean\n", encoding="utf-8")

            result = self.run_hygiene(root)

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        self.assertEqual(
            package["scripts"].get("audit:repo-hygiene"),
            "python3 scripts/audit_repository_hygiene.py",
        )


if __name__ == "__main__":
    unittest.main()
