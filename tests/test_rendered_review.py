import json
import subprocess
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[1]


def write_review_project(project: Path) -> None:
    (project / "source.md").write_text("# 原始资料\n\n客户等待时间下降 18%，线上预审覆盖 62%。\n", encoding="utf-8")
    (project / "codex-task.md").write_text("# Codex Task\n\nUse DeckIR before final generation.\n", encoding="utf-8")
    (project / "AGENTS.md").write_text("# Agent Guide\n\nKeep facts editable and sourced.\n", encoding="utf-8")
    (project / "project-brief.json").write_text(
        json.dumps({"title": "示例项目", "notes": ["keep source facts unchanged"]}, ensure_ascii=False),
        encoding="utf-8",
    )
    (project / "manifest.json").write_text(
        json.dumps(
            {
                "qualityGate": {"level": "formal-business"},
                "pageContractSummary": {
                    "pageRecipes": ["statement_plus_evidence.left_rule_panel"],
                    "layoutFamilies": ["statement_plus_evidence"],
                },
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    (project / "storyboard.json").write_text(
        json.dumps(
            {
                "deckIRVersion": "1.0",
                "slides": [
                    {
                        "page": "P01",
                        "role": "anchor",
                        "recipeId": "cover_brand.hero_left_visual",
                        "evidenceRefs": ["S001"],
                        "rasterPolicy": "allowed-cover",
                        "editabilityTarget": "editable title",
                    },
                    {
                        "page": "P02",
                        "role": "context",
                        "recipeId": "statement_plus_evidence.left_rule_panel",
                        "evidenceRefs": [],
                        "rasterPolicy": "prohibited-formal-body",
                        "editabilityTarget": "editable body",
                    },
                    {
                        "page": "P03",
                        "role": "process",
                        "recipeId": "statement_plus_evidence.left_rule_panel",
                        "evidenceRefs": ["S002"],
                        "rasterPolicy": "allowed-body-raster",
                        "editabilityTarget": "editable process",
                    },
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (project / "index.html").write_text(
        """
        <main>
          <section class="slide card" data-layout="card"><h1>封面</h1></section>
          <section class="slide card" data-layout="card"><h2>正文</h2></section>
          <section class="slide card" data-layout="card"><h2>流程</h2></section>
        </main>
        """,
        encoding="utf-8",
    )
    (project / "quality-report.json").write_text(
        json.dumps({"status": "pending", "checks": []}, ensure_ascii=False),
        encoding="utf-8",
    )


class RenderedReviewTest(unittest.TestCase):
    def test_review_writes_findings_and_updates_quality_report(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_review_project(project)

            result = subprocess.run(
                ["python3", "scripts/review_rendered_deck.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
            findings = json.loads((project / "review-findings.json").read_text(encoding="utf-8"))
            repair_plan = json.loads((project / "repair-plan.json").read_text(encoding="utf-8"))
            report = json.loads((project / "quality-report.json").read_text(encoding="utf-8"))

        ids = {item["id"] for item in findings["findings"]}
        self.assertIn("layout-variety", ids)
        self.assertIn("missing-evidence", ids)
        self.assertIn("body-raster-policy", ids)
        for item in findings["findings"]:
            self.assertIn("riskLevel", item)
            self.assertIn("targetArtifact", item)
            self.assertIn("suggestedCommand", item)
        self.assertGreaterEqual(len(findings["repairCandidates"]), 3)
        self.assertEqual(repair_plan["version"], "review-repair-plan-v1")
        self.assertEqual(repair_plan["status"], "proposed")
        self.assertGreaterEqual(repair_plan["summary"]["candidateCount"], 3)
        for candidate in repair_plan["candidates"]:
            self.assertIn(candidate["riskLevel"], {"low", "medium"})
            self.assertIn("targetArtifact", candidate)
            self.assertIn("suggestedCommand", candidate)
        self.assertEqual(report["reviewFindings"]["status"], "needs-attention")
        self.assertGreaterEqual(report["reviewFindings"]["repairCandidateCount"], 3)
        self.assertTrue(report["checks"])
        self.assertIn("review_rendered_deck.py", result.stdout)

    def test_apply_review_plan_dry_run_does_not_modify_project_files(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_review_project(project)
            subprocess.run(
                ["python3", "scripts/review_rendered_deck.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            watched = [project / "storyboard.json", project / "quality-report.json", project / "codex-task.md", project / "AGENTS.md", project / "project-brief.json"]
            before = {path.name: path.read_text(encoding="utf-8") for path in watched}

            result = subprocess.run(
                ["python3", "scripts/apply_review_plan.py", str(project), "--safe-only", "--dry-run"],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            after = {path.name: path.read_text(encoding="utf-8") for path in watched}

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(before, after)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["dryRun"])
        self.assertGreaterEqual(payload["safeCandidates"], 3)

    def test_apply_review_plan_apply_only_updates_safe_planning_artifacts(self):
        with TemporaryDirectory() as tmp:
            project = Path(tmp)
            write_review_project(project)
            source_before = (project / "source.md").read_text(encoding="utf-8")
            subprocess.run(
                ["python3", "scripts/review_rendered_deck.py", str(project)],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            result = subprocess.run(
                ["python3", "scripts/apply_review_plan.py", str(project), "--safe-only", "--apply"],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )

            storyboard = json.loads((project / "storyboard.json").read_text(encoding="utf-8"))
            report = json.loads((project / "quality-report.json").read_text(encoding="utf-8"))
            brief = json.loads((project / "project-brief.json").read_text(encoding="utf-8"))
            codex_task = (project / "codex-task.md").read_text(encoding="utf-8")
            agent_guide = (project / "AGENTS.md").read_text(encoding="utf-8")
            repair_plan = json.loads((project / "repair-plan.json").read_text(encoding="utf-8"))
            source_after = (project / "source.md").read_text(encoding="utf-8")

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(source_before, source_after)
        self.assertIn("reviewRepairHints", storyboard)
        self.assertGreaterEqual(len(storyboard["reviewRepairHints"]), 3)
        self.assertEqual(report["reviewRepairPlan"]["status"], "applied")
        self.assertEqual(brief["reviewRepairPlan"]["status"], "applied")
        self.assertIn("v4.3 Rendered Review Repair Brief", codex_task)
        self.assertIn("v4.3 Rendered Review Repair Brief", agent_guide)
        self.assertEqual(repair_plan["status"], "applied")

    def test_review_loop_handles_three_chinese_fixture_types_without_rewriting_source(self):
        fixtures = [
            ("中文办公汇报", "客户等待时间下降 18%，线上预审覆盖 62%。"),
            ("咨询方案", "建议三个月内完成流程诊断和试点复盘。"),
            ("培训课件", "学员需要先理解流程，再完成案例演练。"),
        ]
        for title, source_line in fixtures:
            with self.subTest(title=title), TemporaryDirectory() as tmp:
                project = Path(tmp)
                write_review_project(project)
                (project / "source.md").write_text(f"# {title}\n\n{source_line}\n", encoding="utf-8")
                before = (project / "source.md").read_text(encoding="utf-8")
                review = subprocess.run(
                    ["python3", "scripts/review_rendered_deck.py", str(project)],
                    cwd=ROOT,
                    check=False,
                    capture_output=True,
                    text=True,
                )
                apply = subprocess.run(
                    ["python3", "scripts/apply_review_plan.py", str(project), "--safe-only", "--apply"],
                    cwd=ROOT,
                    check=False,
                    capture_output=True,
                    text=True,
                )
                findings = json.loads((project / "review-findings.json").read_text(encoding="utf-8"))

                self.assertEqual(review.returncode, 1, review.stdout + review.stderr)
                self.assertEqual(apply.returncode, 0, apply.stdout + apply.stderr)
                self.assertGreaterEqual(len(findings["repairCandidates"]), 3)
                self.assertEqual(before, (project / "source.md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
