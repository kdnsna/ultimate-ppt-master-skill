import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from upm.errors import PathSafetyError  # noqa: E402
from upm.paths import join_relative, normalize_relative_path  # noqa: E402
from upm.pptd.io import find_manifest, load_project, require_valid_project  # noqa: E402
from upm.pptd.model import create_manifest, create_page, text_element  # noqa: E402
from upm.pptd.paths import assert_page_path, validate_element_src  # noqa: E402
from upm.pptd.schema import validate_pptd_project  # noqa: E402


FIXTURES = ROOT / "tests" / "fixtures" / "pptd"


class PathSafetyTest(unittest.TestCase):
    def test_rejects_absolute_and_parent_traversal(self):
        for value in ("/etc/passwd", "C:/windows", "../outside.page", "pages/../../x.page", ""):
            with self.assertRaises(PathSafetyError, msg=value):
                normalize_relative_path(value)

    def test_normalizes_backslashes_and_dot_segments(self):
        self.assertEqual(normalize_relative_path("./pages\\01.page"), "pages/01.page")
        self.assertEqual(normalize_relative_path("media/a.png"), "media/a.png")

    def test_join_relative(self):
        self.assertEqual(join_relative("pages", "02_b.page"), "pages/02_b.page")

    def test_page_and_media_rules(self):
        self.assertEqual(assert_page_path("pages/01_cover.page"), "pages/01_cover.page")
        with self.assertRaises(PathSafetyError):
            assert_page_path("01_cover.page")
        with self.assertRaises(PathSafetyError):
            assert_page_path("pages/01_cover.txt")
        with self.assertRaises(PathSafetyError):
            validate_element_src("../media/a.png")
        self.assertEqual(validate_element_src("media/a.png"), "media/a.png")
        self.assertEqual(validate_element_src("https://example.com/a.png"), "https://example.com/a.png")


class ModelTest(unittest.TestCase):
    def test_manifest_model(self):
        manifest = create_manifest("测试", (960, 540), ["pages/01.page"])
        self.assertEqual(manifest["version"], "v2")
        self.assertEqual(manifest["size"], [960, 540])

    def test_text_element_model(self):
        element = text_element("t1", (10, 20, 300, 50), "标题", style="$title")
        self.assertEqual(element["elementType"], "text")
        self.assertEqual(element["content"]["style"], "$title")

    def test_page_model(self):
        page = create_page("content", [text_element("t1", (0, 0, 100, 20), "x")], notes="备注")
        self.assertEqual(page["pageType"], "content")
        self.assertEqual(page["notes"], "备注")


class ValidationTest(unittest.TestCase):
    def test_minimal_fixture_passes(self):
        issues = validate_pptd_project(FIXTURES / "minimal")
        errors = [issue for issue in issues if issue.severity == "error"]
        self.assertEqual(errors, [])

    def test_broken_fixture_reports_precise_errors(self):
        issues = validate_pptd_project(FIXTURES / "broken")
        messages = [issue.render() for issue in issues if issue.severity == "error"]
        joined = "\n".join(messages)
        self.assertIn("超出页面边界", joined)
        self.assertIn("elementId 重复", joined)

    def test_path_traversal_is_a_hard_manifest_error(self):
        import tempfile

        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            (root / "pages").mkdir()
            (root / "pages" / "01.page").write_text(
                "pageType: content\nelements: []\n", encoding="utf-8"
            )
            (root / "deck.pptd").write_text(
                "version: v2\nsize: [960, 540]\npages:\n  - ../outside.page\n",
                encoding="utf-8",
            )
            issues = validate_pptd_project(root)
            errors = [issue for issue in issues if issue.severity == "error"]
            self.assertTrue(any("越过项目目录" in issue.message for issue in errors))

    def test_require_valid_project_raises_on_broken(self):
        from upm.errors import ValidationError

        with self.assertRaises(ValidationError):
            require_valid_project(FIXTURES / "broken")

    def test_io_load_project(self):
        root, manifest, pages = load_project(FIXTURES / "minimal")
        self.assertEqual(len(manifest["pages"]), 2)
        self.assertEqual(len(pages), 2)
        self.assertEqual(pages[0][0], "pages/01_cover.page")
        self.assertEqual(pages[0][1]["pageType"], "cover")

    def test_find_manifest(self):
        manifest = find_manifest(FIXTURES / "minimal")
        self.assertEqual(manifest.name, "deck.pptd")


if __name__ == "__main__":
    unittest.main()
