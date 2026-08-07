"""Regression tests for cross-platform Python resolution (Windows venv paths)."""

import tempfile
import unittest
from pathlib import Path
from unittest import mock

from upm.cli import common
from upm.cli.doctor import _venv_python_exists


class ResolvePythonTest(unittest.TestCase):
    def test_prefers_windows_venv_python_exe(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            script = root / ".venv" / "Scripts" / "python.exe"
            script.parent.mkdir(parents=True)
            script.write_text("", encoding="utf-8")
            with mock.patch.object(common, "ROOT", root):
                self.assertEqual(common.resolve_python(), script)

    def test_falls_back_to_python_name_when_no_venv(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            fake = Path("C:/Python312/python.exe")
            with mock.patch.object(common, "ROOT", root), mock.patch.object(
                common.shutil, "which", return_value=str(fake)
            ):
                self.assertEqual(common.resolve_python(), fake)

    def test_windows_venv_detected_by_doctor(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            script = root / ".venv" / "Scripts" / "python.exe"
            script.parent.mkdir(parents=True)
            script.write_text("", encoding="utf-8")
            with mock.patch("upm.cli.doctor.ROOT", root):
                self.assertTrue(_venv_python_exists())


if __name__ == "__main__":
    unittest.main()
