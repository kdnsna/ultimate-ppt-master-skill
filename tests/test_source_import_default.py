import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SourceImportDefaultTest(unittest.TestCase):
    def test_default_import_copies_user_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            project = tmp_path / "demo_project"
            source = tmp_path / "outside" / "notes.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Hello\n\nBody\n", encoding="utf-8")

            init = subprocess.run(
                [sys.executable, str(ROOT / "scripts/project_manager.py"), "init", "demo_project", "--dir", str(tmp_path)],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(init.returncode, 0, init.stdout + init.stderr)

            # init may create nested path; discover project dir
            project_dirs = [p for p in tmp_path.iterdir() if p.is_dir()]
            self.assertTrue(project_dirs)
            project = project_dirs[0]

            result = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "scripts/project_manager.py"),
                    "import-sources",
                    str(project),
                    str(source),
                ],
                cwd=ROOT,
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertTrue(source.exists(), "default import must not remove user originals")
            archived = list((project / "sources").rglob("notes.md"))
            self.assertTrue(archived, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
