import json
import tempfile
import unittest
from pathlib import Path

from apps.desktop.worker.desktop_worker import (
    inspect_environment,
    list_recent_projects,
    recommend_settings,
    run_job,
    validate_job,
)


ROOT = Path(__file__).resolve().parents[1]


class DesktopWorkerTest(unittest.TestCase):
    def test_validate_job_accepts_minimal_markdown_pptx_job(self):
        job = validate_job(
            {
                "source": {"kind": "markdown", "value": "# Demo\n\n- One", "name": "demo.md"},
                "outputMode": "pptx",
                "stylePreset": "business",
            }
        )

        self.assertEqual(job["outputMode"], "pptx")
        self.assertEqual(job["stylePreset"], "business")
        self.assertEqual(job["source"]["kind"], "markdown")
        self.assertEqual(job["providerConfig"]["modelProvider"], "auto")
        self.assertEqual(job["providerConfig"]["voiceProvider"], "none")

    def test_validate_job_normalizes_provider_and_voice_config(self):
        job = validate_job(
            {
                "source": {"kind": "markdown", "value": "# Demo", "name": "demo.md"},
                "outputMode": "pptx",
                "stylePreset": "business",
                "providerConfig": {
                    "modelProvider": "qwen",
                    "textModelId": "qwen-plus",
                    "imageProvider": "pexels",
                    "narrationEnabled": True,
                    "voiceProvider": "edge",
                    "voiceId": "zh-CN-YunjianNeural",
                    "voiceRate": "-5%",
                },
            }
        )

        self.assertEqual(job["providerConfig"]["modelProvider"], "qwen")
        self.assertEqual(job["providerConfig"]["textModelId"], "qwen-plus")
        self.assertEqual(job["providerConfig"]["imageProvider"], "pexels")
        self.assertTrue(job["providerConfig"]["narrationEnabled"])
        self.assertEqual(job["providerConfig"]["voiceId"], "zh-CN-YunjianNeural")

    def test_validate_job_rejects_unknown_output_mode(self):
        with self.assertRaises(ValueError):
            validate_job(
                {
                    "source": {"kind": "text", "value": "demo"},
                    "outputMode": "video",
                    "stylePreset": "business",
                }
            )

    def test_recommend_settings_prefers_web_for_url(self):
        recommendation = recommend_settings(
            {
                "kind": "url",
                "value": "https://example.com/product-launch",
                "name": "",
            }
        )

        self.assertEqual(recommendation["outputMode"], "web")
        self.assertEqual(recommendation["stylePreset"], "editorial")
        self.assertIn("reason", recommendation)

    def test_inspect_environment_does_not_expose_secret_values(self):
        env = inspect_environment(ROOT)
        payload = json.dumps(env, ensure_ascii=False)

        self.assertIn("python", env)
        self.assertNotIn("OPENAI_API_KEY", payload)
        self.assertNotIn("sk-", payload)

    def test_run_job_creates_web_preview_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = run_job(
                {
                    "source": {
                        "kind": "markdown",
                        "value": "# 产品发布\n\n- 本地优先\n- 可编辑输出",
                        "name": "launch.md",
                    },
                    "outputMode": "web",
                    "stylePreset": "swiss",
                    "projectDir": tmp,
                },
                ROOT,
            )

            self.assertEqual(result["status"], "complete")
            self.assertTrue(Path(result["projectPath"]).exists())
            self.assertTrue(Path(result["logsPath"]).exists())
            self.assertTrue(any(path.endswith("index.html") for path in result["generatedFiles"]))
            self.assertIn("产品发布", result["previewHtml"])
            self.assertEqual(result["outputMode"], "web")
            self.assertIn("recommendations", result)
            self.assertIn("checks", result)
            self.assertIn("nextActions", result)
            self.assertIn("thumbnailSvg", result)
            self.assertIn("providerConfig", result)

    def test_run_job_creates_pptx_preview_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = run_job(
                {
                    "source": {
                        "kind": "markdown",
                        "value": "# Editable Deck\n\n- Real PPTX\n- Local preview",
                        "name": "editable.md",
                    },
                    "outputMode": "pptx",
                    "stylePreset": "business",
                    "projectDir": tmp,
                },
                ROOT,
            )

            self.assertEqual(result["status"], "complete")
            self.assertTrue(Path(result["projectPath"]).exists())
            self.assertTrue(any(path.endswith(".pptx") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("cover.svg") for path in result["generatedFiles"]))
            self.assertIn("Editable Deck", result["previewSvg"])
            self.assertEqual(result["outputMode"], "pptx")
            self.assertTrue(result["thumbnailSvg"].startswith("<svg"))

    def test_run_job_creates_narration_handoff_when_enabled(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = run_job(
                {
                    "source": {
                        "kind": "markdown",
                        "value": "# Narrated Deck\n\n- Voice one\n- Voice two",
                        "name": "narrated.md",
                    },
                    "outputMode": "pptx",
                    "stylePreset": "business",
                    "projectDir": tmp,
                    "providerConfig": {
                        "narrationEnabled": True,
                        "voiceProvider": "edge",
                        "voiceId": "zh-CN-XiaoxiaoNeural",
                    },
                },
                ROOT,
            )

            project_path = Path(result["projectPath"])
            self.assertTrue((project_path / "narration-settings.json").exists())
            self.assertTrue((project_path / "notes" / "slide-01.md").exists())
            self.assertTrue(any(path.endswith("narration-settings.json") for path in result["generatedFiles"]))
            self.assertTrue(result["providerConfig"]["narrationEnabled"])

    def test_list_recent_projects_reads_real_manifests(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = run_job(
                {
                    "source": {
                        "kind": "markdown",
                        "value": "# Manifest Project\n\n- Recent item",
                        "name": "manifest.md",
                    },
                    "outputMode": "pptx",
                    "stylePreset": "business",
                    "projectDir": tmp,
                },
                ROOT,
            )

            recent = list_recent_projects(ROOT, tmp)

            self.assertEqual(len(recent), 1)
            self.assertEqual(recent[0]["path"], result["projectPath"])
            self.assertEqual(recent[0]["status"], "complete")
            self.assertTrue(recent[0]["generatedFiles"])
            self.assertTrue(recent[0]["thumbnail"].startswith("<svg"))


if __name__ == "__main__":
    unittest.main()
