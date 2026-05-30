import json
import subprocess
import unittest
import zipfile
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "tests" / "fixtures" / "formal_delivery" / "bad_repeated_cards"


def write_good_artifacts(project: Path) -> None:
    (project / "index.html").write_text(
        """
        <main>
          <section class="slide hero" data-layout="hero"><img src="images/cover.png" alt="cover"><h1>示例银行服务</h1></section>
          <section class="slide compare" data-layout="comparison"><h2>二代与三代对比</h2></section>
          <section class="slide process" data-layout="timeline"><h2>办理流程</h2></section>
          <section class="slide metrics" data-layout="metric"><h2>权益数字</h2></section>
        </main>
        """,
        encoding="utf-8",
    )
    write_pptx(
        project / "deck.pptx",
        [
            ["示例银行服务", "品牌标识使用文字替代策略"],
            ["办理流程", "步骤一", "步骤二"],
        ],
    )


def write_formal_manifest(project: Path, *, chatgpt_first: bool = False) -> None:
    quality_gate = {
        "level": "formal-business",
        "requiredInputs": ["brand-assets-or-fallback", "evidence-sources", "image-or-no-image-strategy"],
        "acceptanceCriteria": ["brand expression is explicit"],
        "artifactChecks": ["editable PPTX text objects"],
        "reviewCommands": ["python3 scripts/audit_formal_delivery.py <project_path>"],
    }
    if chatgpt_first:
        quality_gate["assetStrategy"] = {
            "mode": "chatgpt-generation-first",
            "primaryEngine": "ChatGPT/OpenAI image generation",
        }
    (project / "manifest.json").write_text(
        json.dumps({"qualityGate": quality_gate}, ensure_ascii=False),
        encoding="utf-8",
    )


def write_pptx(path: Path, slide_texts: list[list[str]]) -> None:
    with zipfile.ZipFile(path, "w") as deck:
        for index, texts in enumerate(slide_texts, 1):
            runs = "".join(f"<a:t>{text}</a:t>" for text in texts)
            deck.writestr(
                f"ppt/slides/slide{index}.xml",
                (
                    "<?xml version='1.0' encoding='UTF-8'?>"
                    "<p:sld xmlns:p='http://schemas.openxmlformats.org/presentationml/2006/main' "
                    "xmlns:a='http://schemas.openxmlformats.org/drawingml/2006/main'>"
                    f"<p:cSld><p:spTree>{runs}</p:spTree></p:cSld></p:sld>"
                ),
            )


class FormalDeliveryAuditTest(unittest.TestCase):
    def test_bad_fixture_reports_repeated_layouts_missing_gate_and_logo_fragments(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            (project / "index.html").write_text((FIXTURE / "index.html").read_text(encoding="utf-8"), encoding="utf-8")
            (project / "manifest.json").write_text((FIXTURE / "manifest.json").read_text(encoding="utf-8"), encoding="utf-8")
            write_pptx(project / "deck.pptx", [["b", "c", "办服务，到示例银行"]])

            result = subprocess.run(
                ["python3", "scripts/audit_formal_delivery.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        combined = result.stdout + result.stderr
        self.assertIn("qualityGate.level must be formal-business", combined)
        self.assertIn("layout variety", combined)
        self.assertIn("real images or a no-image strategy", combined)
        self.assertIn("logo fragments", combined)

    def test_good_synthetic_project_passes(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_good_artifacts(project)
            write_formal_manifest(project)

            result = subprocess.run(
                ["python3", "scripts/audit_formal_delivery.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Formal delivery audit passed", result.stdout)

    def test_chatgpt_first_handoff_requires_visual_element_kit_or_manifest(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_good_artifacts(project)
            write_formal_manifest(project, chatgpt_first=True)

            result = subprocess.run(
                ["python3", "scripts/audit_formal_delivery.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("visual-element-kit.md", result.stdout + result.stderr)

    def test_chatgpt_first_needs_manual_prompt_fallback_passes(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_good_artifacts(project)
            write_formal_manifest(project, chatgpt_first=True)
            (project / "visual-element-kit.md").write_text(
                "# visual-element-kit.md\n\nMode: chatgpt-generation-first\nStatus: Needs-Manual\n",
                encoding="utf-8",
            )
            (project / "images").mkdir()
            (project / "images" / "image_prompts.md").write_text(
                "# ChatGPT prompts\n\nStatus: Needs-Manual\nPaste into ChatGPT and save to assets/generated/.\n",
                encoding="utf-8",
            )

            result = subprocess.run(
                ["python3", "scripts/audit_formal_delivery.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Formal delivery audit passed", result.stdout)

    def test_chatgpt_first_manifest_record_passes_with_type_coverage(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_good_artifacts(project)
            write_formal_manifest(project, chatgpt_first=True)
            generated = project / "assets" / "generated"
            generated.mkdir(parents=True)
            (generated / "element-manifest.json").write_text(
                json.dumps(
                    {
                        "items": [
                            {
                                "assetId": item,
                                "type": item,
                                "prompt": "formal reusable element, no text",
                                "outputPath": f"assets/generated/{item}.png",
                                "targetUse": "deck visual language",
                                "status": "Generated",
                                "backend": "mock",
                                "failureReason": "",
                                "insertedTargets": [],
                            }
                            for item in [
                                "section-divider",
                                "metric-badge",
                                "process-node",
                                "connector",
                                "icon-accent",
                                "subtle-pattern",
                                "callout-sticker",
                            ]
                        ]
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )

            result = subprocess.run(
                ["python3", "scripts/audit_formal_delivery.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Formal delivery audit passed", result.stdout)


if __name__ == "__main__":
    unittest.main()
