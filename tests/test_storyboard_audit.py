import json
import subprocess
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]


def write_storyboard(
    project: Path,
    *,
    missing_evidence: bool = False,
    body_raster: bool = False,
    repeated_field: str | None = None,
) -> None:
    slides = [
        {
            "page": "P01",
            "role": "anchor",
            "title": "示例银行政务服务升级方案",
            "intent": "建立第一眼交付信号。",
            "recipeId": "cover_brand.hero_left_visual",
            "layoutFamily": "cover_brand",
            "evidenceRefs": ["S001"],
            "visualLayer": "generated-background | no-text | 16:9",
            "rasterPolicy": "allowed-cover",
            "editabilityTarget": "editable title, subtitle, logo fallback",
            "speakerIntent": "先讲业务背景。",
        },
        {
            "page": "P02",
            "role": "context",
            "title": "办理体验需要跨渠道协同",
            "intent": "说明核心判断和证据。",
            "recipeId": "statement_plus_evidence.left_rule_panel",
            "layoutFamily": "statement_plus_evidence",
            "evidenceRefs": [] if missing_evidence else ["S002"],
            "visualLayer": "subtle-pattern | no-text | 16:9",
            "rasterPolicy": "allowed-poster" if body_raster else "prohibited-formal-body",
            "editabilityTarget": "editable text, editable evidence table",
            "speakerIntent": "解释变化原因。",
        },
    ]
    if repeated_field:
        for page, recipe, layout in [
            ("P03", "timeline.vertical_kpi", "timeline"),
            ("P04", "image_story.text_image_7_5", "image_story"),
        ]:
            slides.append(
                {
                    "page": page,
                    "role": "context",
                    "title": f"连续性门禁测试 {page}",
                    "intent": "验证结构多样性。",
                    "recipeId": "statement_plus_evidence.left_rule_panel" if repeated_field == "recipeId" else recipe,
                    "layoutFamily": "statement_plus_evidence" if repeated_field == "layoutFamily" else layout,
                    "evidenceRefs": ["S002"],
                    "visualLayer": "subtle-pattern | no-text | 16:9",
                    "rasterPolicy": "prohibited-formal-body",
                    "editabilityTarget": "editable text, editable evidence table",
                    "speakerIntent": "验证结构多样性。",
                }
            )
    (project / "storyboard.json").write_text(
        json.dumps(
            {
                "deckIRVersion": "1.0",
                "planningMode": "fallback-rule-planner",
                "delivery": {"outputMode": "pptx", "qualityGate": "formal-business"},
                "slides": slides,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (project / "source-map.json").write_text(
        json.dumps(
            {
                "claims": [
                    {"id": "S001", "text": "标题", "sourceLine": 1},
                    {"id": "S002", "text": "办理体验", "sourceLine": 2},
                ]
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


class StoryboardAuditTest(unittest.TestCase):
    def test_valid_storyboard_passes(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_storyboard(project)

            result = subprocess.run(
                ["python3", "scripts/audit_storyboard.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('"status": "pass"', result.stdout)

    def test_missing_evidence_refs_fail(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_storyboard(project, missing_evidence=True)

            result = subprocess.run(
                ["python3", "scripts/audit_storyboard.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("P02 evidenceRefs", result.stdout + result.stderr)

    def test_formal_body_raster_policy_fails(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_storyboard(project, body_raster=True)

            result = subprocess.run(
                ["python3", "scripts/audit_storyboard.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("P02 rasterPolicy", result.stdout + result.stderr)

    def test_three_consecutive_layout_families_fail_even_when_recipes_differ(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_storyboard(project, repeated_field="layoutFamily")

            result = subprocess.run(
                ["python3", "scripts/audit_storyboard.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("repeat layoutFamily", result.stdout + result.stderr)
        self.assertNotIn("repeat recipeId", result.stdout + result.stderr)

    def test_three_consecutive_recipes_fail_even_when_layout_families_differ(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_storyboard(project, repeated_field="recipeId")

            result = subprocess.run(
                ["python3", "scripts/audit_storyboard.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("repeat recipeId", result.stdout + result.stderr)
        self.assertNotIn("repeat layoutFamily", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
