import tempfile
import unittest
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from scripts import preserve_edit_pptx as engine
from scripts.preserve_edit_pptx import apply_operations, summarize_changes

A = "http://schemas.openxmlformats.org/drawingml/2006/main"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
NS = f'xmlns:p="{P}" xmlns:a="{A}"'


def _a(tag: str) -> str:
    return f"{{{A}}}{tag}"


def _slide_with_run(text: str, extra_run: str = "") -> str:
    runs = f'<a:r><a:t>{text}</a:t></a:r>' + extra_run
    return (
        f"<p:sld {NS}><p:cSld><p:spTree>"
        f'<p:sp><p:nvSpPr><p:cNvPr id="2" name="S"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
        f"<p:spPr/><p:txBody><a:bodyPr/><a:p>{runs}</a:p></p:txBody></p:sp>"
        f"</p:spTree></p:cSld></p:sld>"
    )


def _slide_with_shape_and_table() -> str:
    return (
        f"<p:sld {NS}><p:cSld><p:spTree>"
        f'<p:sp><p:nvSpPr><p:cNvPr id="2" name="Box1"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="100" cy="100"/></a:xfrm></p:spPr>'
        f"<p:txBody><a:bodyPr/><a:p><a:r><a:t>Box</a:t></a:r></a:p></p:txBody></p:sp>"
        f"<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id=\"3\" name=\"T\"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>"
        f"<p:xfrm><a:off x=\"0\" y=\"0\"/><a:ext cx=\"100\" cy=\"100\"/></p:xfrm>"
        f"<a:graphic><a:graphicData><a:tbl>"
        f"<a:tr><a:tc><a:txBody><a:p><a:r><a:t>r1c1</a:t></a:r></a:p></a:txBody></a:tc>"
        f"<a:tc><a:txBody><a:p><a:r><a:t>r1c2</a:t></a:r></a:p></a:txBody></a:tc></a:tr>"
        f"<a:tr><a:tc><a:txBody><a:p><a:r><a:t>r2c1</a:t></a:r></a:p></a:txBody></a:tc>"
        f"<a:tc><a:txBody><a:p><a:r><a:t>old</a:t></a:r></a:p></a:txBody></a:tc></a:tr>"
        f"</a:tbl></a:graphicData></a:graphic></p:graphicFrame>"
        f"</p:spTree></p:cSld></p:sld>"
    )


def _apply(xml: str, ops):
    return apply_operations(ops)(xml)


class StyleTextTest(unittest.TestCase):
    def test_style_all_runs_sets_font_size_bold_color(self):
        out = _apply(_slide_with_run("Hello"), [{"op": "style_text", "font": "Microsoft YaHei", "size": 24, "bold": True, "color": "FF0000"}])
        root = ET.fromstring(out)
        rpr = root.find(f".//{_a('r')}").find(_a("rPr"))
        self.assertIsNotNone(rpr)
        self.assertEqual(rpr.get("sz"), "2400")
        self.assertEqual(rpr.get("b"), "1")
        self.assertEqual(rpr.find(_a("latin")).get("typeface"), "Microsoft YaHei")
        self.assertEqual(rpr.find(_a("ea")).get("typeface"), "Microsoft YaHei")
        self.assertEqual(rpr.find(f"{_a('solidFill')}/{_a('srgbClr')}").get("val"), "FF0000")

    def test_style_match_only_targets_matching_run(self):
        xml = _slide_with_run("Title", extra_run='<a:r><a:t>body</a:t></a:r>')
        out = _apply(xml, [{"op": "style_text", "match": {"text_contains": "Title"}, "size": 30}])
        root = ET.fromstring(out)
        runs = root.findall(f".//{_a('r')}")
        self.assertEqual(runs[0].find(_a("rPr")).get("sz"), "3000")
        self.assertIsNone(runs[1].find(_a("rPr")))


class TableCellTest(unittest.TestCase):
    def test_replace_cell_by_index(self):
        out = _apply(_slide_with_shape_and_table(), [{"op": "replace_table_cell", "row": 2, "col": 1, "text": "X"}])
        root = ET.fromstring(out)
        cells = list(root.iter(_a("tc")))
        self.assertEqual(cells[2].find(f".//{_a('t')}").text, "X")
        self.assertEqual(cells[0].find(f".//{_a('t')}").text, "r1c1")
        self.assertEqual(cells[3].find(f".//{_a('t')}").text, "old")

    def test_replace_cell_by_find(self):
        out = _apply(_slide_with_shape_and_table(), [{"op": "replace_table_cell", "find": "old", "text": "new"}])
        root = ET.fromstring(out)
        texts = [node.text for node in root.iter(_a("t"))]
        self.assertIn("new", texts)
        self.assertNotIn("old", texts)


class ShapeGeometryTest(unittest.TestCase):
    def test_move_and_resize_by_text_match(self):
        out = _apply(_slide_with_shape_and_table(), [{"op": "set_shape_geometry", "match": {"text_contains": "Box"}, "x": 10, "y": 20, "w": 100, "h": 50}])
        root = ET.fromstring(out)
        off = root.find(f".//{_a('xfrm')}/{_a('off')}")
        ext = root.find(f".//{_a('xfrm')}/{_a('ext')}")
        self.assertEqual(off.get("x"), str(10 * 12700))
        self.assertEqual(off.get("y"), str(20 * 12700))
        self.assertEqual(ext.get("cx"), str(100 * 12700))
        self.assertEqual(ext.get("cy"), str(50 * 12700))

    def test_no_match_raises(self):
        with self.assertRaises(ValueError):
            _apply(_slide_with_shape_and_table(), [{"op": "set_shape_geometry", "match": {"text_contains": "nope"}, "x": 1}])


class ComposeAndSummaryTest(unittest.TestCase):
    def test_apply_operations_composes_replace_and_style(self):
        out = _apply(
            _slide_with_run("Hello"),
            [{"op": "replace_text", "old": "Hello", "new": "Hi"}, {"op": "style_text", "bold": True}],
        )
        root = ET.fromstring(out)
        self.assertEqual(root.find(f".//{_a('t')}").text, "Hi")
        self.assertEqual(root.find(f".//{_a('rPr')}").get("b"), "1")

    def test_summarize_changes_reports_text_style_and_geometry(self):
        before = _slide_with_shape_and_table()
        after = _apply(before, [
            {"op": "replace_table_cell", "row": 1, "col": 1, "text": "CHANGED"},
            {"op": "style_text", "match": {"text_equals": "Box"}, "bold": True},
            {"op": "set_shape_geometry", "match": {"text_contains": "Box"}, "x": 5},
        ])
        summary = summarize_changes(before, after)
        joined = " | ".join(summary)
        self.assertIn("run(s) restyled", joined)
        self.assertIn("shape(s) moved/resized", joined)
        self.assertIn("table cell(s) changed", joined)


class WorkerOperationsFlowTest(unittest.TestCase):
    def test_run_preserve_edit_accepts_operations_and_reports_changes(self):
        from apps.desktop.worker.desktop_worker import run_preserve_edit

        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "deck.pptx"
            output = Path(tmp) / "out.pptx"
            with zipfile.ZipFile(source, "w") as package:
                package.writestr("[Content_Types].xml", "<Types></Types>")
                package.writestr("ppt/slides/slide1.xml", _slide_with_run("Hello"))
                package.writestr("ppt/slides/slide2.xml", _slide_with_run("Untouched"))

            result = run_preserve_edit(
                {
                    "sourcePath": str(source),
                    "outputPath": str(output),
                    "edits": [{"slide": 1, "operations": [{"op": "style_text", "size": 18}]}],
                },
                Path(__file__).resolve().parents[1],
            )

            self.assertTrue(result["safe"], result)
            self.assertEqual(result["changed"], ["ppt/slides/slide1.xml"])
            self.assertIn(1, result["slideChanges"])
            self.assertTrue(any("restyled" in line for line in result["slideChanges"][1]))


if __name__ == "__main__":
    unittest.main()
