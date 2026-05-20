import json
import os
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch
from xml.sax.saxutils import escape

from apps.desktop.worker.desktop_worker import (
    inspect_environment,
    list_recent_projects,
    recommend_settings,
    run_job,
    validate_job,
)


ROOT = Path(__file__).resolve().parents[1]


def write_minimal_docx(path: Path, paragraphs: list[str]) -> None:
    body = "".join(
        f"<w:p><w:r><w:t>{escape(paragraph)}</w:t></w:r></w:p>"
        for paragraph in paragraphs
    )
    with zipfile.ZipFile(path, "w") as docx:
        docx.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>""",
        )
        docx.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>""",
        )
        docx.writestr(
            "word/_rels/document.xml.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>""",
        )
        docx.writestr(
            "word/document.xml",
            f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>{body}<w:sectPr/></w:body>
</w:document>""",
        )


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

    def test_inspect_environment_reads_env_file_flags_without_secret_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            repo_root = tmp_path / "repo"
            run_dir = tmp_path / "run"
            repo_root.mkdir()
            run_dir.mkdir()
            (repo_root / ".env").write_text(
                "IMAGE_BACKEND=openai\nOPENAI_API_KEY=sk-test-secret\nLLM_PROVIDER=openai-compatible\nLLM_MODEL=gpt-4.1\n",
                encoding="utf-8",
            )

            original_cwd = Path.cwd()
            try:
                os.chdir(run_dir)
                with patch.dict(os.environ, {"IMAGE_BACKEND": "", "OPENAI_API_KEY": ""}, clear=False):
                    env = inspect_environment(repo_root)
            finally:
                os.chdir(original_cwd)

        payload = json.dumps(env, ensure_ascii=False)

        self.assertTrue(env["providers"]["openai"])
        self.assertEqual(env["config"]["imageBackend"], "openai")
        self.assertEqual(env["config"]["envFile"], str(repo_root / ".env"))
        self.assertTrue(env["config"]["directLlmConfigured"])
        self.assertEqual(env["config"]["llmProvider"], "openai-compatible")
        self.assertEqual(env["config"]["llmModel"], "gpt-4.1")
        self.assertNotIn("sk-test-secret", payload)

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

    def test_run_job_extracts_docx_text_for_pptx_preview(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "brief.docx"
            write_minimal_docx(
                source,
                [
                    "文旅消费活动行办会材料",
                    "活动目标是联动城市文旅资源和金融服务。",
                    "本次汇报需要形成可编辑 PPTX。",
                ],
            )

            result = run_job(
                {
                    "source": {"kind": "file", "value": str(source), "name": "brief.docx"},
                    "outputMode": "pptx",
                    "stylePreset": "business",
                    "projectDir": tmp,
                },
                ROOT,
            )

            source_md = Path(result["projectPath"]) / "sources" / "source.md"
            self.assertEqual(result["sourceExtraction"]["status"], "extracted")
            self.assertEqual(result["sourceExtraction"]["generatedMarkdownPath"], str(source_md))
            self.assertIn("文旅消费活动行办会材料", source_md.read_text(encoding="utf-8"))
            self.assertIn("文旅消费活动行办会材料", result["previewSvg"])
            self.assertNotIn("Imported file:", source_md.read_text(encoding="utf-8"))

    def test_run_job_extracts_docx_text_for_web_preview(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "web-brief.docx"
            write_minimal_docx(
                source,
                [
                    "城市文旅消费展示方案",
                    "展示重点包括主题活动、消费权益和线上传播。",
                ],
            )

            result = run_job(
                {
                    "source": {"kind": "file", "value": str(source), "name": "web-brief.docx"},
                    "outputMode": "web",
                    "stylePreset": "editorial",
                    "projectDir": tmp,
                },
                ROOT,
            )

            self.assertEqual(result["sourceExtraction"]["status"], "extracted")
            self.assertIn("城市文旅消费展示方案", result["previewHtml"])
            self.assertNotIn("Imported file:", result["previewHtml"])

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
