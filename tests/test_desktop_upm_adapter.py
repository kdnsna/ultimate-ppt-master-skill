"""Desktop worker must call canonical Python DeckIR planner (not invent outline alone)."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER_DIR = ROOT / "apps" / "desktop" / "worker"
CANONICAL = WORKER_DIR / "desktop_worker.py"
RESOURCES = ROOT / "apps" / "desktop" / "src-tauri" / "resources" / "desktop_worker.py"
PYTHON = ROOT / ".venv" / "bin" / "python" if (ROOT / ".venv" / "bin" / "python").is_file() else Path(sys.executable)


class DesktopUpmAdapterTest(unittest.TestCase):
    def test_canonical_and_resources_are_synced(self):
        self.assertTrue(CANONICAL.is_file())
        self.assertTrue(RESOURCES.is_file())
        self.assertEqual(
            CANONICAL.read_bytes(),
            RESOURCES.read_bytes(),
            "resources/desktop_worker.py drifted; run scripts/sync_desktop_worker.py",
        )
        check = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "sync_desktop_worker.py"), "--check"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
        )
        self.assertEqual(check.returncode, 0, check.stdout + check.stderr)

    def test_canonical_run_job_wires_upm_core(self):
        source = CANONICAL.read_text(encoding="utf-8")
        self.assertIn("def plan_deckir_via_upm_core", source)
        self.assertIn("core_payload = plan_deckir_via_upm_core", source)
        self.assertIn("try_generate_pptx_via_upm_make", source)

    def test_plan_deckir_via_upm_core_matches_cli_plan(self):
        sys.path.insert(0, str(WORKER_DIR))
        import desktop_worker as dw  # noqa: WPS433 — import shipped worker

        text = "一、定位\n个人养老金是补充养老保险。\n二、条件\n年满 16 周岁可参加。\n三、缴费\n上限 12000 元。\n"
        payload = dw.plan_deckir_via_upm_core(
            ROOT,
            "桌面规划测试",
            text,
            page_count=5,
            output_mode="editable-deck",
        )
        self.assertIsNotNone(payload)
        self.assertEqual(payload["storyboard"]["canonicalSource"], "upm.compiler.planner")
        self.assertEqual(payload["storyboard"]["desktopAdapter"], "python-upm-plan")

        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as handle:
            handle.write(text)
            source_path = handle.name
        try:
            result = subprocess.run(
                [
                    str(PYTHON),
                    "-m",
                    "upm",
                    "plan",
                    source_path,
                    "--title",
                    "桌面规划测试",
                    "--pages",
                    "5",
                    "--emit",
                    "bridge",
                    "--mode",
                    "quick",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                env={**dict(**{k: v for k, v in __import__("os").environ.items()}), "PYTHONPATH": str(ROOT)},
            )
        finally:
            Path(source_path).unlink(missing_ok=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        cli_payload = json.loads(result.stdout)

        def fields(body: dict) -> list[dict]:
            return [
                {key: slide.get(key) for key in ("slideId", "role", "recipeId", "title")}
                for slide in body["storyboard"]["slides"]
            ]

        self.assertEqual(fields(payload), fields(cli_payload))


if __name__ == "__main__":
    unittest.main()
