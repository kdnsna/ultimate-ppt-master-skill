import json
import os
import subprocess
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]


def write_handoff(project: Path) -> None:
    (project / "visual-element-kit.md").write_text(
        """# visual-element-kit.md

Mode: chatgpt-generation-first

| Type | Purpose | Count | Style constraints | Transparent background | No embedded body text | Output directory | Status |
|---|---|---:|---|---|---|---|---|
| section divider | Split chapters | 2 | formal banking/government tone | yes | yes | assets/generated/section-divider | Pending |
| metric badge | Highlight benefit numbers | 2 | clean official accent | yes | yes | assets/generated/metric-badge | Pending |
| process node |办理流程节点|3|rounded official marker|yes|yes|assets/generated/process-node|Pending|
| connector | Link process nodes | 2 | thin clean stroke | yes | yes | assets/generated/connector | Pending |
| icon accent | Small supporting icon | 4 | no letters, no logos | yes | yes | assets/generated/icon-accent | Pending |
| subtle pattern | Background texture | 1 | low contrast | no | yes | assets/generated/subtle-pattern | Pending |
| callout sticker | Reminder marker | 2 | restrained, not cute | yes | yes | assets/generated/callout-sticker | Pending |
""",
        encoding="utf-8",
    )
    (project / "asset-plan.md").write_text(
        "# Asset Plan\n\nUse ChatGPT/OpenAI first; no private source upload.\n",
        encoding="utf-8",
    )
    (project / "project-brief.json").write_text(
        json.dumps(
            {
                "title": "示例银行社保卡服务",
                "audience": "formal business review",
                "qualityGate": {"level": "formal-business"},
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def stripped_image_env() -> dict[str, str]:
    prefixes = (
        "IMAGE_",
        "OPENAI_",
        "GEMINI_",
        "MINIMAX_",
        "STABILITY_",
        "BFL_",
        "IDEOGRAM_",
        "QWEN_",
        "DASHSCOPE_",
        "ZHIPU_",
        "BIGMODEL_",
        "VOLCENGINE_",
        "ARK_",
        "MODELSCOPE_",
        "SILICONFLOW_",
        "FAL_",
        "REPLICATE_",
        "OPENROUTER_",
    )
    env = os.environ.copy()
    for key in list(env):
        if key.startswith(prefixes):
            env.pop(key)
    return env


class VisualElementGeneratorTest(unittest.TestCase):
    def test_no_backend_writes_needs_manual_prompts(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_handoff(project)

            result = subprocess.run(
                ["python3", "scripts/generate_visual_element_kit.py", str(project), "--no-generate"],
                cwd=ROOT,
                env=stripped_image_env(),
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            prompt_manifest = json.loads((project / "images" / "image_prompts.json").read_text(encoding="utf-8"))
            element_manifest = json.loads((project / "assets" / "generated" / "element-manifest.json").read_text(encoding="utf-8"))
            prompt_markdown = (project / "images" / "image_prompts.md").read_text(encoding="utf-8")

        self.assertEqual(len(prompt_manifest["items"]), 7)
        self.assertEqual(len(element_manifest["items"]), 7)
        self.assertTrue(all(item["status"] == "Needs-Manual" for item in prompt_manifest["items"]))
        self.assertTrue(all(item["status"] == "Needs-Manual" for item in element_manifest["items"]))
        self.assertTrue(all(item["backend"] == "manual-chatgpt" for item in element_manifest["items"]))
        self.assertIn("Paste into ChatGPT", prompt_markdown)
        self.assertIn("section-divider", {item["type"] for item in element_manifest["items"]})
        self.assertTrue(all("insertedTargets" in item for item in element_manifest["items"]))

    def test_mock_generate_marks_generated_and_covers_required_types(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_handoff(project)

            result = subprocess.run(
                ["python3", "scripts/generate_visual_element_kit.py", str(project), "--mock-generate"],
                cwd=ROOT,
                env=stripped_image_env(),
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            element_manifest = json.loads((project / "assets" / "generated" / "element-manifest.json").read_text(encoding="utf-8"))

            generated_paths_exist = all((project / item["outputPath"]).exists() for item in element_manifest["items"])

        required_types = {
            "section-divider",
            "metric-badge",
            "process-node",
            "connector",
            "icon-accent",
            "subtle-pattern",
            "callout-sticker",
        }
        self.assertEqual({item["type"] for item in element_manifest["items"]}, required_types)
        self.assertTrue(all(item["status"] == "Generated" for item in element_manifest["items"]))
        self.assertTrue(generated_paths_exist)


if __name__ == "__main__":
    unittest.main()
