import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from upm.cli.common import attach_tables_to_deckir  # noqa: E402
from upm.compiler.compiler import compile_deck  # noqa: E402
from upm.compiler.deckir import (  # noqa: E402
    ROLE_RECIPE_PREFERENCE,
    _fallback_recipe,
    _load_recipe_index,
    build_deckir,
    sanitize_claim_text,
    source_claims,
)
from upm.compiler.overflow import check_element_overflow  # noqa: E402
from upm.compiler.planner import plan_deckir, to_bridge_payload  # noqa: E402
from upm.compiler.tokens import build_theme  # noqa: E402
from upm.pptd.schema import validate_pptd_project  # noqa: E402
from upm.render.svg import render_page_svg, resolve_color  # noqa: E402

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

    def test_sanitize_strips_markdown_headings(self):
        self.assertEqual(sanitize_claim_text("# 个人养老金制度简介"), "个人养老金制度简介")
        self.assertEqual(sanitize_claim_text("## 一、制度定位"), "一、制度定位")
        self.assertEqual(sanitize_claim_text("**重点**与议题 #3"), "重点与议题 #3")
        self.assertEqual(sanitize_claim_text("### 标题"), "标题")

    def test_deckir_sanitizes_markdown_source(self):
        md = """# 个人养老金制度简介（2026 年版）

## 一、制度定位

个人养老金是政府政策支持、个人自愿参加的补充养老保险制度。

## 二、参与条件

年满 16 周岁的中国公民均可参加。
"""
        deckir = build_deckir("养老金", md, page_count=6)
        for claim in deckir["sourceMap"]["claims"]:
            self.assertFalse(claim["text"].lstrip().startswith("#"), claim["text"])
            self.assertNotIn("##", claim["text"])
        for slide in deckir["slides"]:
            self.assertFalse(str(slide.get("title") or "").lstrip().startswith("#"))
            self.assertNotIn("source.md", str(slide.get("title") or ""))

    def test_fallback_recipe_breaks_diversity_after_candidates_exhausted(self):
        # evidence 只有 2 个候选 recipe；用完后再调用必须借用未使用的 recipe，
        # 而不是直接回退到第一个候选（回归：P04-P07 四连重复 evidence_board）。
        used = list(ROLE_RECIPE_PREFERENCE["evidence"])
        recipe_id, family, _ = _fallback_recipe("evidence", used)
        self.assertNotIn(recipe_id, used)
        self.assertTrue(family)

    def test_fallback_recipe_prefers_same_role_then_whole_library(self):
        used = list(ROLE_RECIPE_PREFERENCE["evidence"])
        # 全部 20 个 recipe 逐个消耗：同 role 的 evidence 应先用尽，
        # 之后借用其他 role 的 recipe，且始终不与已用项重复。
        while len(used) < 20:
            recipe_id, _, _ = _fallback_recipe("evidence", used)
            self.assertNotIn(recipe_id, used)
            used.append(recipe_id)
        # 全库用尽后：返回的 layoutFamily 必须与上一次使用不同（打破连续重复）。
        _, family, _ = _fallback_recipe("evidence", used)
        last_family = _load_recipe_index().get(used[-1], {}).get("layoutFamily")
        self.assertNotEqual(family, last_family)


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
            self.assertTrue(any(finding["severity"] in {"warning", "error"} for finding in summary["overflowFindings"]))
            # Hard residual (below min font) is error; mild residual may stay warning.
            hard = [f for f in summary["overflowFindings"] if "仍溢出" in f["message"]]
            for finding in hard:
                self.assertEqual(finding["severity"], "error")

    def test_compiler_no_source_path_in_page_body(self):
        md = """# 个人养老金制度简介

## 一、定位

个人养老金是补充养老保险制度。

## 二、条件

年满 16 周岁可参加。
"""
        deckir = build_deckir("个人养老金制度简介", md, page_count=6)
        with tempfile.TemporaryDirectory() as name:
            project = Path(name) / "clean"
            compile_deck(deckir, project)
            for page_path in (project / "pages").glob("*.page"):
                text = page_path.read_text(encoding="utf-8")
                self.assertNotIn("source.md", text)
                # ATX heading markers must not appear in compiled text content
                self.assertNotRegex(text, r"text:\s*[\"']?#")

    def test_overflow_severe_is_error(self):
        element = {
            "elementId": "tiny",
            "elementType": "text",
            "bounds": [0, 0, 80, 24],
            "content": {
                "text": "这是一段非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的中文文本，" * 8,
                "fontSize": 18,
                "lineHeight": 1.5,
            },
        }
        findings = check_element_overflow(element, page="p1", theme_text_styles={}, min_font_size=12.0)
        self.assertTrue(findings)
        self.assertEqual(findings[0].severity, "error")

    def test_plan_deckir_is_canonical_and_bridge_shaped(self):
        deckir = plan_deckir("规划测试", "营业收入 12 亿元，同比增长 18%。风险包括汇率波动。", page_count=5)
        self.assertEqual(deckir.get("planner"), "deterministic-draft-planner")
        self.assertIn("slides", deckir)
        self.assertIn("sourceMap", deckir)
        bridge = to_bridge_payload(deckir)
        self.assertEqual(bridge["storyboard"]["canonicalSource"], "upm.compiler.planner")
        self.assertEqual(len(bridge["storyboard"]["slides"]), len(deckir["slides"]))
        self.assertEqual(bridge["sourceMap"]["claims"][0]["id"], deckir["sourceMap"]["claims"][0]["id"])

    def test_chart_preferred_over_table_when_visual_chart(self):
        deckir = build_deckir(
            "指标汇报",
            "营收 10 亿。利润 2 亿。费用 1 亿。增长 18%。风险可控。下一步扩张。",
            page_count=6,
        )
        table = {
            "headers": ["指标", "数值"],
            "rows": [["营收", "10"], ["利润", "2"], ["费用", "1"]],
        }
        attach_tables_to_deckir(deckir, [table])
        chart_slides = [s for s in deckir["slides"] if s.get("chart")]
        self.assertTrue(chart_slides, "numeric table should attach chart on benefit/chart slide")
        self.assertEqual(chart_slides[0].get("visual", {}).get("type"), "chart")
        with tempfile.TemporaryDirectory() as name:
            project = Path(name) / "chart"
            compile_deck(deckir, project)
            # At least one compiled page should contain a chart element, not only a table.
            found_chart = False
            for page_path in (project / "pages").glob("*.page"):
                page = __import__("yaml").safe_load(page_path.read_text(encoding="utf-8"))
                for el in page.get("elements") or []:
                    if el.get("elementType") == "chart":
                        found_chart = True
            self.assertTrue(found_chart, "compiler must render chart when visual.type=chart")

    def test_svg_resolves_paper_token(self):
        theme = build_theme("formal-finance")
        paper = theme["colors"]["paper"]
        ink = theme["colors"]["ink"]
        self.assertEqual(resolve_color("$paper", theme["colors"], "#000000"), paper)
        self.assertEqual(resolve_color("$ink", theme["colors"], "#FFFFFF"), ink)
        page = {
            "pageType": "content",
            "size": {"width": 960, "height": 540},
            "background": {"type": "solid", "color": "$paper"},
            "elements": [
                {
                    "elementId": "t",
                    "elementType": "text",
                    "bounds": [56, 48, 800, 40],
                    "content": {"text": "标题", "style": "$pageTitle"},
                }
            ],
        }
        svg = render_page_svg(page, theme)
        # Background rect should use paper, not the old ink/black fallback.
        self.assertIn(f'fill="{paper}"', svg)
        self.assertIn(ink, svg)


if __name__ == "__main__":
    unittest.main()
