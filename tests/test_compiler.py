import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from upm.compiler.compiler import compile_deck  # noqa: E402
from upm.compiler.deckir import build_deckir, source_claims  # noqa: E402
from upm.compiler.tokens import build_theme  # noqa: E402
from upm.pptd.schema import validate_pptd_project  # noqa: E402

SOURCE = """2024 年公司营业收入达到 96.3 亿元，同比增长 16.7%。
净利润 15.8 亿元，毛利率提升至 41%。
研发投入 11.4 亿元，占营收比重 11.8%。
主要风险包括供应链波动和汇率变化。
下一步将推进国际化布局，并加强本地化服务能力。
"""


class DeckIrTest(unittest.TestCase):
    def test_source_claims_are_stable(self):
        claims = source_claims(SOURCE)
        self.assertEqual(len(claims), 5)
        self.assertEqual(claims[0]["sourceLine"], "1")
        self.assertEqual(claims[0]["text"].startswith("2024 年公司营业收入"), True)

    def test_build_deckir(self):
        deckir = build_deckir("经营分析汇报", SOURCE)
        slides = deckir["slides"]
        self.assertGreaterEqual(len(slides), 5)
        self.assertEqual(slides[0]["role"], "anchor")
        self.assertEqual(slides[-1]["role"], "closing")
        self.assertTrue(any(slide["role"] == "benefit" for slide in slides))
        self.assertTrue(any(slide["role"] == "risk" for slide in slides))
        self.assertEqual(deckir["sourceMap"]["claims"][0]["id"], "c001")

    def test_build_deckir_without_source(self):
        deckir = build_deckir("只有一个主题")
        self.assertGreaterEqual(len(deckir["slides"]), 4)
        self.assertEqual(deckir["slides"][0]["evidenceState"], "missing")

    def test_theme_maps_tokens(self):
        theme = build_theme("formal-finance")
        self.assertEqual(theme["colors"]["primary"], "#173A63")
        self.assertIn("coverTitle", theme["textStyles"])
        self.assertIn("default", theme["tableStyles"])


class CompilerTest(unittest.TestCase):
    def test_compile_deterministic_project(self):
        deckir = build_deckir("经营分析汇报", SOURCE, page_count=6)
        with tempfile.TemporaryDirectory() as name:
            project = Path(name) / "sample"
            summary = compile_deck(deckir, project)
            self.assertEqual(summary["pages"], 6)
            self.assertTrue((project / "deck.pptd").is_file())
            self.assertTrue((project / ".upm" / "deckir.json").is_file())
            page_files = sorted((project / "pages").glob("*.page"))
            self.assertEqual(len(page_files), 6)
            errors = [issue for issue in validate_pptd_project(project) if issue.severity == "error"]
            self.assertEqual(errors, [])

    def test_compile_is_repeatable(self):
        deckir = build_deckir("重复编译", SOURCE, page_count=5)
        with tempfile.TemporaryDirectory() as name:
            project_a = Path(name) / "a"
            project_b = Path(name) / "b"
            first = compile_deck(deckir, project_a)
            second = compile_deck(deckir, project_b)
            self.assertEqual(first["pages"], second["pages"])
            for path in sorted(p.relative_to(project_a) for p in (project_a / "pages").glob("*.page")):
                a_bytes = (project_a / path).read_bytes()
                b_bytes = (project_b / path).read_bytes()
                self.assertEqual(a_bytes, b_bytes, str(path))
            import yaml

            a_manifest = yaml.safe_load((project_a / "deck.pptd").read_text(encoding="utf-8"))
            b_manifest = yaml.safe_load((project_b / "deck.pptd").read_text(encoding="utf-8"))
            a_manifest["upm"].pop("projectName")
            b_manifest["upm"].pop("projectName")
            self.assertEqual(a_manifest, b_manifest)

    def test_compile_rejects_empty_slides(self):
        from upm.errors import CompilerError

        with self.assertRaises(CompilerError):
            compile_deck({"title": "x", "slides": []}, Path(tempfile.mkdtemp()))

    def test_overflow_auto_fix_reduces_font_size(self):
        deckir = build_deckir("溢出测试", "长文本" * 300, page_count=4)
        with tempfile.TemporaryDirectory() as name:
            project = Path(name) / "overflow"
            summary = compile_deck(deckir, project)
            sizes: list[float | None] = []
            for page_path in sorted((project / "pages").glob("*.page")):
                page = __import__("yaml").safe_load(page_path.read_text(encoding="utf-8"))
                sizes.extend(el["content"].get("fontSize") for el in page["elements"] if el.get("elementType") == "text")
            self.assertTrue(any(size is not None and size < 18 for size in sizes))
            self.assertTrue(any(finding["severity"] == "warning" for finding in summary["overflowFindings"]))


if __name__ == "__main__":
    unittest.main()
