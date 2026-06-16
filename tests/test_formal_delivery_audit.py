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
    (project / "design_spec.md").write_text(
        """
# Design Specification

## III. Visual Theme
- Visual Direction: finance_internal_report
- Benchmark Sentence: formal banking report with source-grounded evidence pages

### Theme Art Direction
- Art Direction Name: restrained-title-lockup
- Why It Fits The Source: formal banking material needs a calm evidence-led title system.
- Motif System: brand-color rule lines; source-grounded evidence panels; quiet negative space
- Scope: cover+section+tail
- Main Title Treatment: restrained report title with weight contrast
- Serious Context Exception: work-report/compliance tone keeps title restrained

### Brand / IP Assets
| Asset ID | Display Text / Mark | State | Source URL / Provenance | File Path | Target Pages | Release Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| none-detected | none | text-lockup-fallback | none | none | none | none |

### Scale Guardrail
- Body baseline: 20px

## V. Layout Principles
### Aesthetic Polish Checks
- Dominant element: title and primary visual

### Page Role / Visual Weight Contract
| page | page_role | visual_weight | layout_family | page_recipe_id | asset_requirement | visual_layer | raster_policy | anti_patterns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | anchor | hero | cover_brand | cover_brand.hero_left_visual | real-logo-or-text-fallback | generated-background | allowed-cover | fake-logo |
| P02 | context | medium | statement_plus_evidence | statement_plus_evidence.left_rule_panel | none | subtle-pattern | prohibited-formal-body | 2x2-card-grid |
| P03 | process | high | process_flow | process_flow.horizontal_steps | schematic | generated-process-accent | prohibited-formal-body | disconnected-icons |
| P04 | benefit | high | metric_panel | metric_panel.large_number_strip | none | generated-metric-accent | prohibited-formal-body | repeated-card-grid |
""",
        encoding="utf-8",
    )
    (project / "spec_lock.md").write_text(
        """
## visual_direction
- id: finance_internal_report
- benchmark: Formal banking report with source-grounded evidence pages.
- theme_art_direction: restrained-title-lockup
- theme_motif: brand-color rule lines; source-grounded evidence panels; quiet negative space
- theme_scope: cover+section+tail
- title_treatment: restrained report title with weight contrast
- serious_context_exception: work-report/compliance tone keeps title restrained
- release_boundary: internal-review

## typography
- font_family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif
- body: 20
- title: 36
- subtitle: 24
- annotation: 14

## brand_assets
- none-detected: none

## aesthetic_checks
- min_body_px: 18
- target_body_px: 20-22
- title_body_ratio: 1.6-2.0
- card_title_body_ratio: 1.15-1.35
- max_peer_cards_per_slide: 6
- min_card_padding_px: 20
- theme_art_direction: required
- title_art_treatment: expressive-unless-serious
- cover_tail_motif: required
- whitespace_strategy: one dominant quiet zone per page
- logo_strategy: official-assets-first
- polish_risks: title-too-small; body-below-18; overcrowded-cards; fake-logo

## page_roles
- P01: anchor
- P02: context
- P03: process
- P04: benefit

## visual_weight
- P01: hero
- P02: medium
- P03: high
- P04: high

## layout_family
- P01: cover_brand
- P02: statement_plus_evidence
- P03: process_flow
- P04: metric_panel

## page_recipes
- P01: cover_brand.hero_left_visual
- P02: statement_plus_evidence.left_rule_panel
- P03: process_flow.horizontal_steps
- P04: metric_panel.large_number_strip

## visual_layers
- P01: generated-background | no-text | 16:9 | assets/generated/page-visuals/P01-background.png
- P02: subtle-pattern | no-text | 16:9 | assets/generated/page-visuals/P02-pattern.png
- P03: generated-process-accent | no-text | 16:9 | assets/generated/page-visuals/P03-process.png
- P04: generated-metric-accent | no-text | 16:9 | assets/generated/page-visuals/P04-metric.png

## raster_policy
- P01: allowed-cover
- P02: prohibited-formal-body
- P03: prohibited-formal-body
- P04: prohibited-formal-body

## asset_requirements
- P01: real-logo-or-text-fallback
- P02: none
- P03: schematic
- P04: none

## anti_patterns
- P01: fake-logo
- P02: 2x2-card-grid
- P03: disconnected-icons
- P04: repeated-card-grid
""",
        encoding="utf-8",
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

    def test_missing_theme_art_direction_fails(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_good_artifacts(project)
            write_formal_manifest(project)
            lock_path = project / "spec_lock.md"
            lock_path.write_text(
                "\n".join(
                    line
                    for line in lock_path.read_text(encoding="utf-8").splitlines()
                    if "theme_art_direction" not in line
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

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("theme_art_direction", result.stdout + result.stderr)

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

    def test_known_ip_requires_brand_asset_plan(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_good_artifacts(project)
            write_formal_manifest(project)
            spec_path = project / "design_spec.md"
            spec_path.write_text(
                spec_path.read_text(encoding="utf-8") + "\n交通银行、好客山东与文旅大戏为本项目确定 IP。\n",
                encoding="utf-8",
            )

            result = subprocess.run(
                ["python3", "scripts/audit_formal_delivery.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("known IP mark", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
