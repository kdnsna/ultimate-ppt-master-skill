import json
import subprocess
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
            self.assertTrue(any(path.endswith("manifest.json") for path in result["generatedFiles"]))
            self.assertIn("产品发布", result["previewHtml"])
            self.assertEqual(result["outputMode"], "web")
            self.assertIn("recommendations", result)
            self.assertIn("checks", result)
            self.assertIn("nextActions", result)
            self.assertIn("thumbnailSvg", result)
            self.assertIn("providerConfig", result)
            manifest = json.loads((Path(result["projectPath"]) / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["qualityGate"]["level"], "formal-business")
            self.assertIn("no-image strategy", json.dumps(manifest, ensure_ascii=False))
            self.assertTrue(any(path.endswith("codex-task.md") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("AGENTS.md") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("design_spec.md") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("spec_lock.md") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("asset-plan.md") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("visual-element-kit.md") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("images/image_prompts.md") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("images/page_visual_prompts.md") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("assets/generated/page-visuals/manifest.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("storyboard.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("source-map.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("planning-report.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("review-findings.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("repair-plan.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("revision-brief.md") for path in result["generatedFiles"]))
            storyboard = json.loads((Path(result["projectPath"]) / "storyboard.json").read_text(encoding="utf-8"))
            self.assertEqual(storyboard["deckIRVersion"], "1.0")
            self.assertGreaterEqual(len(storyboard["slides"]), 4)
            report = json.loads((Path(result["projectPath"]) / "quality-report.json").read_text(encoding="utf-8"))
            self.assertIn("reviewFindings", report)
            self.assertIn("reviewRepairPlan", report)
            codex_task = (Path(result["projectPath"]) / "codex-task.md").read_text(encoding="utf-8")
            self.assertIn("design_spec.md", codex_task)
            self.assertIn("spec_lock.md", codex_task)
            self.assertIn("storyboard.json", codex_task)
            self.assertIn("source-map.json", codex_task)
            self.assertIn("asset-plan.md", codex_task)
            self.assertIn("visual-element-kit.md", codex_task)
            self.assertIn("audit_formal_delivery.py", codex_task)
            self.assertIn("audit_storyboard.py", codex_task)
            self.assertIn("review_rendered_deck.py", codex_task)
            self.assertIn("apply_review_plan.py", codex_task)
            self.assertIn("revision-brief.md", codex_task)
            self.assertIn("audit_design_completion.py", codex_task)
            self.assertIn("audit_visual_recipes.py", codex_task)
            self.assertIn("generate_visual_element_kit.py", codex_task)
            self.assertIn("generate_visual_layers.py", codex_task)
            self.assertIn("Needs-Manual", codex_task)
            self.assertRegex(codex_task, r"ChatGPT|generated asset|生成素材")
            self.assertRegex(codex_task, r"micro-assets|small element|小元素|元素素材")

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
            self.assertTrue(any(path.endswith("project-brief.json") for path in result["generatedFiles"]))
            self.assertIn("Editable Deck", result["previewSvg"])
            self.assertEqual(result["outputMode"], "pptx")
            self.assertTrue(result["thumbnailSvg"].startswith("<svg"))
            manifest = json.loads((Path(result["projectPath"]) / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["qualityGate"]["level"], "formal-business")
            self.assertIn("python3 scripts/audit_formal_delivery.py <project_path>", manifest["reviewCommands"])
            self.assertIn("python3 scripts/audit_design_completion.py <project_path>", manifest["reviewCommands"])
            self.assertIn("python3 scripts/audit_visual_recipes.py <project_path>", manifest["reviewCommands"])
            self.assertIn("visualDirection", manifest)
            self.assertIn("pageContractSummary", manifest)
            self.assertIn("visualStrategy", manifest)
            self.assertIn("deckIR", manifest)
            self.assertIn("briefMode", manifest)
            self.assertIn("visualBrief", manifest)
            self.assertIn("guidedBrief", manifest)
            self.assertIn("expectationFit", manifest)
            self.assertIn("readyForProduction", manifest["expectationFit"])
            self.assertEqual(manifest["deckIR"]["storyboard"], "storyboard.json")
            self.assertTrue(any(path.endswith("storyboard.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("source-map.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("planning-report.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("review-findings.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("repair-plan.json") for path in result["generatedFiles"]))
            self.assertTrue(any(path.endswith("revision-brief.md") for path in result["generatedFiles"]))
            spec_lock = (Path(result["projectPath"]) / "spec_lock.md").read_text(encoding="utf-8")
            self.assertIn("## expectation_contract", spec_lock)
            self.assertIn("## page_roles", spec_lock)
            self.assertIn("## layout_family", spec_lock)
            self.assertIn("## page_recipes", spec_lock)
            self.assertIn("## visual_layers", spec_lock)
            self.assertIn("## raster_policy", spec_lock)
            asset_plan = (Path(result["projectPath"]) / "asset-plan.md").read_text(encoding="utf-8")
            self.assertRegex(asset_plan, r"Public asset search|公开素材检索|素材检索")
            self.assertRegex(asset_plan, r"ChatGPT|generated asset|生成素材")
            self.assertRegex(asset_plan, r"license|授权|来源")
            element_kit = (Path(result["projectPath"]) / "visual-element-kit.md").read_text(encoding="utf-8")
            self.assertIn("chatgpt-generation-first", element_kit)
            self.assertRegex(element_kit, r"section divider|metric badge|process node|connector")
            brief = json.loads((Path(result["projectPath"]) / "project-brief.json").read_text(encoding="utf-8"))
            self.assertIn("visualBrief", brief)
            self.assertIn("guidedBrief", brief)
            self.assertIn("expectationFit", brief)
            codex_task = (Path(result["projectPath"]) / "codex-task.md").read_text(encoding="utf-8")
            self.assertIn("Expectation Fit and Guided Intake", codex_task)

    def test_desktop_formal_business_outputs_pass_audit(self):
        source = {
            "kind": "markdown",
            "value": "\n".join(
                [
                    "# 示例银行政务服务升级方案",
                    "1、办理体验：网点、手机端和政务窗口协同",
                    "客户等待时间下降 18%，线上预审覆盖 62%",
                    "重点人群需要更清晰的办理提醒",
                    "2、权益数字：服务触达与使用效率",
                    "月均触达 32 万人次，重点权益核销率 41%",
                    "3、流程页：申请、核验、开通、提醒",
                    "每一步必须写清办理材料、责任窗口和风险提示",
                    "4、对比表：原流程与新流程",
                    "原流程跨渠道重复填报，新流程一次采集多端复用",
                    "5、行动计划：三周上线、双周复盘",
                    "设定 owner、截止时间和可追踪指标",
                ]
            ),
            "name": "formal-bank-service.md",
        }
        with tempfile.TemporaryDirectory() as tmp:
            web_result = run_job(
                {
                    "source": source,
                    "outputMode": "web",
                    "stylePreset": "swiss",
                    "projectDir": tmp,
                },
                ROOT,
            )
            pptx_result = run_job(
                {
                    "source": source,
                    "outputMode": "pptx",
                    "stylePreset": "business",
                    "projectDir": tmp,
                },
                ROOT,
            )

            result = subprocess.run(
                [
                    "python3",
                    "scripts/audit_formal_delivery.py",
                    web_result["projectPath"],
                    pptx_result["projectPath"],
                ],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            visual_result = subprocess.run(
                [
                    "python3",
                    "scripts/audit_visual_recipes.py",
                    web_result["projectPath"],
                    pptx_result["projectPath"],
                ],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Formal delivery audit passed", result.stdout)
        self.assertEqual(visual_result.returncode, 0, visual_result.stdout + visual_result.stderr)
        self.assertIn('"status": "pass"', visual_result.stdout)

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
