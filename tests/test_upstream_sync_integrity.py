from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class UpstreamSyncIntegrityTest(unittest.TestCase):
    def assert_paths_exist(self, paths):
        missing = [path for path in paths if not (ROOT / path).exists()]
        self.assertEqual(missing, [])

    def test_ppt_master_updated_tools_are_available(self):
        self.assert_paths_exist(
            [
                "scripts/source_to_md/excel_to_md.py",
                "scripts/animation_config.py",
                "scripts/notes_to_audio.py",
                "scripts/check_annotations.py",
                "scripts/svg_editor/server.py",
                "workflows/live-preview.md",
                "workflows/customize-animations.md",
                "workflows/generate-audio.md",
                "workflows/resume-execute.md",
                "workflows/verify-charts.md",
            ]
        )

    def test_magazine_web_swiss_assets_are_integrated(self):
        self.assert_paths_exist(
            [
                "assets/magazine-web/template-swiss.html",
                "assets/magazine-web/screenshot-backgrounds/style-a/monocle-classic.webp",
                "assets/magazine-web/screenshot-backgrounds/style-b/ikb-dot-gradient.webp",
                "references/magazine-web/layouts-swiss.md",
                "references/magazine-web/themes-swiss.md",
                "references/magazine-web/swiss-layout-lock.md",
                "references/magazine-web/screenshot-framing.md",
                "references/magazine-web/image-prompts.md",
                "scripts/validate-swiss-deck.mjs",
            ]
        )

    def test_fusion_skill_mentions_adapted_upstream_capabilities(self):
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")

        required_snippets = [
            "excel_to_md.py",
            "template-swiss.html",
            "validate-swiss-deck.mjs",
            "notes_to_audio.py",
            "live-preview",
        ]

        missing = [snippet for snippet in required_snippets if snippet not in skill]
        self.assertEqual(missing, [])

    def test_requirements_include_new_optional_runtime_dependencies(self):
        requirements = (ROOT / "requirements.txt").read_text(encoding="utf-8")

        required_snippets = [
            "openpyxl",
            "edge-tts",
            "flask",
            "svglib",
            "reportlab",
        ]

        missing = [snippet for snippet in required_snippets if snippet not in requirements]
        self.assertEqual(missing, [])

    def test_upstream_sync_notes_record_reviewable_license_and_import_policy(self):
        notes = (ROOT / "UPSTREAM_SYNC.md").read_text(encoding="utf-8")

        required_snippets = [
            "remote_ref",
            "local_ref",
            "local_path",
            "license",
            "import_policy",
            "last_reviewed",
            "absorbed_capabilities",
            "deferred_capabilities",
            "AGPL-3.0",
            "Do not copy post-AGPL Guizang code directly",
            "baoyu-skills",
            "prompt files before generation",
            "forbid bitmap text overlay repair",
        ]

        missing = [snippet for snippet in required_snippets if snippet not in notes]
        self.assertEqual(missing, [])
