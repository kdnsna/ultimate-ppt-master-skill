import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_asset_plan  # noqa: E402
import image_gen  # noqa: E402


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

    def test_asset_planner_does_not_treat_kpi_content_as_swiss_style(self):
        context = {
            "title": "Q3 business KPI review",
            "coreMessage": "Use the latest KPI trend and customer renewal data.",
            "visualBrief": {"styleTags": ["formal-business"]},
        }

        self.assertFalse(build_asset_plan.wants_swiss(context))

    def test_asset_planner_detects_swiss_only_from_explicit_style_fields(self):
        self.assertTrue(build_asset_plan.wants_swiss({"webDeck": {"style": "swiss"}}))
        self.assertTrue(build_asset_plan.wants_swiss({"stylePreset": "Swiss Style"}))
        self.assertTrue(build_asset_plan.wants_swiss({"visualBrief": {"styleTags": ["information-design"]}}))
        self.assertTrue(build_asset_plan.wants_swiss({"guidedBrief": {"style": "瑞士风"}}))
        self.assertFalse(build_asset_plan.wants_swiss({"raw": "客户明确说不喜欢 Swiss 风格"}))

    def test_build_asset_plan_preserves_limited_labels_policy_in_prompt_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            (project / "project-brief.json").write_text(
                json.dumps({"title": "Swiss launch", "webDeck": {"style": "swiss"}}),
                encoding="utf-8",
            )

            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/build_asset_plan.py"), str(project)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

            manifest = json.loads((project / "images/image_prompts.json").read_text(encoding="utf-8"))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        policies = {item["filename"]: item["text_policy"] for item in manifest["items"]}
        self.assertEqual(policies["limited-labels-infographic.png"], "limited-labels")

    def test_build_asset_plan_merges_existing_status_evidence_and_keeps_completed_prompt(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            (project / "project-brief.json").write_text(
                json.dumps({"title": "Swiss launch", "webDeck": {"style": "swiss"}}),
                encoding="utf-8",
            )
            prompt = project / "prompts/s22-hero.md"
            prompt.parent.mkdir()
            prompt.write_text("custom approved prompt\n", encoding="utf-8")
            evidence = {
                "run_id": "run-123",
                "timestamp": "2026-07-09T08:00:00Z",
                "backend": "codex",
                "prompt_sha256": "abc",
                "file_sha256": "def",
                "width": 1792,
                "height": 768,
            }
            (project / "asset_plan.json").write_text(
                json.dumps(
                    {
                        "version": "asset-plan-v5.4",
                        "project": "Swiss launch",
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
                                "current_generation_evidence": evidence,
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/build_asset_plan.py"), str(project)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            updated = json.loads((project / "asset_plan.json").read_text(encoding="utf-8"))
            prompt_text = prompt.read_text(encoding="utf-8")

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        s22 = next(item for item in updated["items"] if item["id"] == "s22-hero")
        self.assertEqual(s22["status"], "Generated")
        self.assertEqual(s22["current_generation_evidence"], evidence)
        self.assertEqual(prompt_text, "custom approved prompt\n")

    def test_build_asset_plan_requires_existing_project_with_context(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp) / "typo-target"

            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/build_asset_plan.py"), str(project)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Project folder must already exist", result.stderr)
        self.assertFalse(project.exists())

    def test_build_asset_plan_derives_items_from_storyboard_before_defaults(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = Path(tmp)
            (project / "project-brief.json").write_text(
                json.dumps({"title": "Storyboard assets", "stylePreset": "formal"}),
                encoding="utf-8",
            )
            (project / "storyboard.json").write_text(
                json.dumps(
                    {
                        "slides": [
                            {
                                "page": "P02",
                                "title": "Customer workflow",
                                "assetRequirement": {
                                    "id": "workflow-scene",
                                    "slot": "workflow-16x9",
                                    "asset_type": "evidence",
                                    "aspect_ratio": "16:9",
                                    "text_policy": "none",
                                    "source_policy": "generated",
                                },
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                [sys.executable, str(ROOT / "scripts/build_asset_plan.py"), str(project)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            plan = json.loads((project / "asset_plan.json").read_text(encoding="utf-8"))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(plan["derived_from"], "storyboard.json")
        self.assertEqual([item["id"] for item in plan["items"]], ["workflow-scene"])

    def test_image_gen_asset_plan_manifest_preserves_limited_labels(self):
        plan = {
            "project": "demo",
            "items": [
                {
                    "id": "limited-labels-infographic",
                    "slide": 4,
                    "slot": "s16-grid-21x9",
                    "asset_type": "infographic",
                    "aspect_ratio": "21:9",
                    "text_policy": "limited-labels",
                    "source_policy": "generated",
                    "backend": "codex",
                    "prompt_path": "prompts/limited-labels-infographic.md",
                    "status": "Pending",
                    "current_generation_evidence": [],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prompt = root / "prompts/limited-labels-infographic.md"
            prompt.parent.mkdir()
            prompt.write_text("limited labels prompt\n", encoding="utf-8")

            manifest, _mapping = image_gen._asset_plan_manifest(str(root / "asset_plan.json"), plan, regenerate=False)

        self.assertEqual(manifest["items"][0]["text_policy"], "limited-labels")

    def test_image_gen_writes_verifiable_generation_evidence_schema(self):
        plan = {
            "items": [
                {
                    "id": "hero",
                    "status": "Pending",
                    "source_policy": "generated",
                    "current_generation_evidence": [],
                }
            ]
        }
        manifest = {
            "items": [
                {
                    "filename": "hero.png",
                    "status": "Generated",
                    "generated_at": "2026-07-09T08:00:00Z",
                    "output_file": "images/hero.png",
                    "prompt": "hero prompt",
                }
            ]
        }

        with mock.patch("image_gen._image_dimensions", return_value=(1792, 1024)):
            failed = image_gen._mirror_manifest_to_asset_plan(plan, manifest, [(0, 0)], "codex")

        evidence = plan["items"][0]["current_generation_evidence"]
        self.assertEqual(failed, 0)
        self.assertEqual(
            set(evidence),
            {"run_id", "timestamp", "backend", "prompt_sha256", "file_sha256", "width", "height"},
        )
        self.assertEqual(evidence["backend"], "codex")


if __name__ == "__main__":
    unittest.main()
