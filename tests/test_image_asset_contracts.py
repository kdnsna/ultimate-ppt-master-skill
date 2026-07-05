import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ImageAssetContractTest(unittest.TestCase):
    def run_audit(self, manifest: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(ROOT / "scripts/audit_image_contracts.py"), str(manifest)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_rejects_generated_image_item_without_reproducible_prompt_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "image_prompts.json"
            manifest.write_text(
                json.dumps(
                    {
                        "project": "demo",
                        "items": [
                            {
                                "filename": "cover.png",
                                "type": "hero",
                                "page_role": "hero_page",
                                "text_policy": "none",
                                "aspect_ratio": "16:9",
                                "backend": "codex",
                                "asset_type": "generated-image",
                                "status": "Generated",
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            result = self.run_audit(manifest)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("prompt_path", result.stdout + result.stderr)

    def test_accepts_complete_image_prompt_contract(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prompt = root / "prompts" / "cover.md"
            prompt.parent.mkdir()
            prompt.write_text("full prompt\n", encoding="utf-8")
            manifest = root / "image_prompts.json"
            manifest.write_text(
                json.dumps(
                    {
                        "project": "demo",
                        "items": [
                            {
                                "filename": "cover.png",
                                "type": "hero",
                                "page_role": "hero_page",
                                "text_policy": "none",
                                "aspect_ratio": "16:9",
                                "backend": "codex",
                                "asset_type": "generated-image",
                                "status": "Generated",
                                "prompt_path": "prompts/cover.md",
                                "source": "ai",
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            result = self.run_audit(manifest)

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_rejects_generated_asset_plan_item_without_current_generation_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prompt = root / "prompts" / "s22-hero.md"
            prompt.parent.mkdir()
            prompt.write_text("Swiss 21:9 hero prompt\n", encoding="utf-8")
            manifest = root / "asset_plan.json"
            manifest.write_text(
                json.dumps(
                    {
                        "version": "asset-plan-v5.4",
                        "project": "demo",
                        "items": [
                            {
                                "id": "s22-hero",
                                "slide": 6,
                                "slot": "s22-hero-21x9",
                                "asset_type": "hero",
                                "aspect_ratio": "21:9",
                                "text_policy": "none",
                                "source_policy": "generated",
                                "backend": "codex",
                                "prompt_path": "prompts/s22-hero.md",
                                "status": "Generated",
                                "current_generation_evidence": [],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            result = self.run_audit(manifest)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("current_generation_evidence", result.stdout + result.stderr)

    def test_accepts_needs_manual_asset_plan_item_without_generation_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prompt = root / "prompts" / "screenshot-frame.md"
            prompt.parent.mkdir()
            prompt.write_text("16:10 screenshot frame prompt\n", encoding="utf-8")
            manifest = root / "asset_plan.json"
            manifest.write_text(
                json.dumps(
                    {
                        "version": "asset-plan-v5.4",
                        "project": "demo",
                        "items": [
                            {
                                "id": "screenshot-frame",
                                "slide": 3,
                                "slot": "s15-grid-16x10",
                                "asset_type": "screenshot-frame",
                                "aspect_ratio": "16:10",
                                "text_policy": "limited-labels",
                                "source_policy": "needs-manual",
                                "backend": "manual",
                                "prompt_path": "prompts/screenshot-frame.md",
                                "status": "Needs-Manual",
                                "current_generation_evidence": [],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            result = self.run_audit(manifest)

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_image_gen_asset_plan_without_backend_writes_needs_manual(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prompt = root / "prompts" / "s22-hero.md"
            prompt.parent.mkdir()
            prompt.write_text("Swiss 21:9 hero prompt\n", encoding="utf-8")
            manifest = root / "asset_plan.json"
            manifest.write_text(
                json.dumps(
                    {
                        "version": "asset-plan-v5.4",
                        "project": "demo",
                        "items": [
                            {
                                "id": "s22-hero",
                                "slide": 6,
                                "slot": "s22-hero-21x9",
                                "asset_type": "hero",
                                "aspect_ratio": "21:9",
                                "text_policy": "none",
                                "source_policy": "generated",
                                "backend": "codex",
                                "prompt_path": "prompts/s22-hero.md",
                                "status": "Pending",
                                "current_generation_evidence": [],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            env = {key: value for key, value in os.environ.items() if not key.startswith(("IMAGE_", "OPENAI_", "GEMINI_"))}
            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/image_gen.py"), "--asset-plan", str(manifest)],
                cwd=ROOT,
                env=env,
                text=True,
                capture_output=True,
                check=False,
            )

            updated = json.loads(manifest.read_text(encoding="utf-8"))
            prompt_manifest_exists = (root / "images" / "image_prompts.json").is_file()

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(updated["items"][0]["status"], "Needs-Manual")
        self.assertTrue(prompt_manifest_exists)


if __name__ == "__main__":
    unittest.main()
