import json
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


if __name__ == "__main__":
    unittest.main()
