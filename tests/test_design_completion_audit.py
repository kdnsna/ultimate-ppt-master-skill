import json
import subprocess
import unittest
import zipfile
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]


def write_manifest(project: Path) -> None:
    (project / "manifest.json").write_text(
        json.dumps(
            {
                "qualityGate": {
                    "level": "formal-business",
                    "reviewCommands": [
                        "python3 scripts/audit_formal_delivery.py <project_path>",
                        "python3 scripts/audit_design_completion.py <project_path>",
                    ],
                }
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def write_design_spec(project: Path) -> None:
    (project / "design_spec.md").write_text(
        """
# Design Specification

## III. Visual Theme
- Visual Direction: finance_internal_report
- Benchmark Sentence: formal banking service deck with explicit page roles

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
| P04 | decision | high | action_roadmap | action_roadmap.owner_timeline | none | schematic | prohibited-formal-body | repeated-card-grid |
""",
        encoding="utf-8",
    )


def write_spec_lock(project: Path, *, repeated: bool = False, missing_sections: bool = False) -> None:
    layout_lines = (
        ["- P01: cover_brand", "- P02: repeated_grid", "- P03: repeated_grid", "- P04: repeated_grid"]
        if repeated
        else ["- P01: cover_brand", "- P02: statement_plus_evidence", "- P03: process_flow", "- P04: action_roadmap"]
    )
    recipe_lines = (
        ["- P01: cover_brand.hero_left_visual", "- P02: repeated.recipe", "- P03: repeated.recipe", "- P04: repeated.recipe"]
        if repeated
        else ["- P01: cover_brand.hero_left_visual", "- P02: statement_plus_evidence.left_rule_panel", "- P03: process_flow.horizontal_steps", "- P04: action_roadmap.owner_timeline"]
    )
    sections = [
        """
## visual_direction
- id: finance_internal_report
- benchmark: Formal banking service deck with explicit page roles.
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
- whitespace_strategy: one dominant quiet zone per page
- logo_strategy: official-assets-first
- polish_risks: title-too-small; body-below-18; overcrowded-cards; fake-logo

## page_roles
- P01: anchor
- P02: context
- P03: process
- P04: decision

## visual_weight
- P01: hero
- P02: medium
- P03: high
- P04: high

## layout_family
""",
        "\n".join(layout_lines),
        """

## page_recipes
""",
        "\n".join(recipe_lines),
    ]
    if not missing_sections:
        sections.append(
            """

## visual_layers
- P01: generated-background | no-text | 16:9 | assets/generated/page-visuals/P01-background.png
- P02: subtle-pattern | no-text | 16:9 | assets/generated/page-visuals/P02-pattern.png
- P03: generated-process-accent | no-text | 16:9 | assets/generated/page-visuals/P03-process.png
- P04: schematic | no-text | 16:9 | assets/generated/page-visuals/P04-action.png

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
"""
        )
    (project / "spec_lock.md").write_text("".join(sections), encoding="utf-8")


def write_html(project: Path) -> None:
    (project / "index.html").write_text(
        """
<main>
  <section class="slide" data-layout="cover"><h1>服务介绍</h1></section>
  <section class="slide" data-layout="statement"><h2>为什么办</h2></section>
  <section class="slide" data-layout="process"><h2>怎么办</h2></section>
  <section class="slide" data-layout="table"><h2>风险边界</h2></section>
</main>
""",
        encoding="utf-8",
    )


def write_pptx(project: Path) -> None:
    with zipfile.ZipFile(project / "deck.pptx", "w") as deck:
        for index in range(1, 5):
            deck.writestr(
                f"ppt/slides/slide{index}.xml",
                (
                    "<?xml version='1.0' encoding='UTF-8'?>"
                    "<p:sld xmlns:p='http://schemas.openxmlformats.org/presentationml/2006/main' "
                    "xmlns:a='http://schemas.openxmlformats.org/drawingml/2006/main'>"
                    f"<p:cSld><p:spTree><a:t>Slide {index}</a:t></p:spTree></p:cSld></p:sld>"
                ),
            )


def write_project(project: Path, *, repeated: bool = False, missing_sections: bool = False) -> None:
    write_manifest(project)
    write_design_spec(project)
    write_spec_lock(project, repeated=repeated, missing_sections=missing_sections)
    write_html(project)
    write_pptx(project)


class DesignCompletionAuditTest(unittest.TestCase):
    def test_complete_project_passes_and_writes_report(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_project(project)

            result = subprocess.run(
                ["python3", "scripts/audit_design_completion.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["status"], "pass")
            self.assertTrue((project / "design-quality-report.md").exists())

    def test_repeated_layout_family_fails_without_intentional_reason(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_project(project, repeated=True)

            result = subprocess.run(
                ["python3", "scripts/audit_design_completion.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("layout_family repeated", result.stdout + result.stderr)

    def test_missing_visual_lock_sections_fail(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_project(project, missing_sections=True)

            result = subprocess.run(
                ["python3", "scripts/audit_design_completion.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("spec_lock.md missing section", result.stdout + result.stderr)

    def test_too_small_body_font_fails(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_project(project)
            lock_path = project / "spec_lock.md"
            lock_path.write_text(lock_path.read_text(encoding="utf-8").replace("- body: 20", "- body: 16"), encoding="utf-8")

            result = subprocess.run(
                ["python3", "scripts/audit_design_completion.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("below formal minimum", result.stdout + result.stderr)

    def test_known_ip_requires_brand_asset_plan(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_project(project)
            spec_path = project / "design_spec.md"
            spec_path.write_text(
                spec_path.read_text(encoding="utf-8") + "\n交通银行、好客山东与交通银行文旅大戏共同发布。\n",
                encoding="utf-8",
            )

            result = subprocess.run(
                ["python3", "scripts/audit_design_completion.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        combined = result.stdout + result.stderr
        self.assertIn("known IP mark", combined)
        self.assertIn("交通银行", combined)


if __name__ == "__main__":
    unittest.main()
