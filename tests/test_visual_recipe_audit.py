import json
import subprocess
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]


def write_project(project: Path, *, body_raster: bool = False, repeated_recipe: bool = False) -> None:
    recipes = (
        ["cover_brand.hero_left_visual", "process_flow.horizontal_steps", "process_flow.horizontal_steps", "process_flow.horizontal_steps"]
        if repeated_recipe
        else ["cover_brand.hero_left_visual", "statement_plus_evidence.left_rule_panel", "process_flow.horizontal_steps", "closing_commitment.brand_tail"]
    )
    raster_p02 = "allowed-poster-or-showcase" if body_raster else "prohibited-formal-body"
    (project / "project-brief.json").write_text(
        json.dumps({"title": "示例社保卡服务", "qualityGate": {"level": "formal-business"}}, ensure_ascii=False),
        encoding="utf-8",
    )
    (project / "spec_lock.md").write_text(
        f"""
## page_roles
- P01: anchor
- P02: context
- P03: process
- P04: closing

## page_recipes
- P01: {recipes[0]}
- P02: {recipes[1]}
- P03: {recipes[2]}
- P04: {recipes[3]}

## visual_layers
- P01: generated-background | no-text | 16:9 | assets/generated/page-visuals/P01-background.png
- P02: subtle-pattern | no-text | 16:9 | assets/generated/page-visuals/P02-pattern.png
- P03: generated-process-accent | no-text | 16:9 | assets/generated/page-visuals/P03-process.png
- P04: generated-background | no-text | 16:9 | assets/generated/page-visuals/P04-background.png

## raster_policy
- P01: allowed-cover
- P02: {raster_p02}
- P03: prohibited-formal-body
- P04: allowed-section-tail
""",
        encoding="utf-8",
    )


class VisualRecipeAuditTest(unittest.TestCase):
    def test_generate_visual_layers_and_audit_pass(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_project(project)

            gen = subprocess.run(
                ["python3", "scripts/generate_visual_layers.py", str(project), "--no-generate"],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(gen.returncode, 0, gen.stdout + gen.stderr)

            audit = subprocess.run(
                ["python3", "scripts/audit_visual_recipes.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(audit.returncode, 0, audit.stdout + audit.stderr)
        self.assertIn('"status": "pass"', audit.stdout)

    def test_body_page_raster_policy_fails(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_project(project, body_raster=True)
            subprocess.run(
                ["python3", "scripts/generate_visual_layers.py", str(project), "--no-generate"],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            audit = subprocess.run(
                ["python3", "scripts/audit_visual_recipes.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(audit.returncode, 1, audit.stdout + audit.stderr)
        self.assertIn("raster_policy allows full-page raster", audit.stdout + audit.stderr)

    def test_repeated_page_recipe_fails(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_project(project, repeated_recipe=True)
            subprocess.run(
                ["python3", "scripts/generate_visual_layers.py", str(project), "--no-generate"],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            audit = subprocess.run(
                ["python3", "scripts/audit_visual_recipes.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(audit.returncode, 1, audit.stdout + audit.stderr)
        self.assertIn("page_recipe repeated", audit.stdout + audit.stderr)


if __name__ == "__main__":
    unittest.main()

