import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts import preserve_edit_pptx as engine

P = "http://schemas.openxmlformats.org/presentationml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
C = "http://schemas.openxmlformats.org/drawingml/2006/chart"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG = "http://schemas.openxmlformats.org/package/2006/relationships"
CHART_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart"


def _slide(chart_rid: str | None, title: str) -> str:
    frame = (
        f'<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="4" name="Chart"/>'
        f'<p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>'
        f'<p:xfrm><a:off x="0" y="0"/><a:ext cx="100" cy="100"/></p:xfrm>'
        f'<a:graphic><a:graphicData uri="{C}"><c:chart xmlns:c="{C}" xmlns:r="{R}" r:id="{chart_rid}"/>'
        f"</a:graphicData></a:graphic></p:graphicFrame>"
        if chart_rid
        else ""
    )
    return (
        f'<p:sld xmlns:p="{P}" xmlns:a="{A}"><p:cSld><p:spTree>'
        f'<p:sp><p:nvSpPr><p:cNvPr id="2" name="T"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/>'
        f"<p:txBody><a:bodyPr/><a:p><a:r><a:t>{title}</a:t></a:r></a:p></p:txBody></p:sp>"
        f"{frame}</p:spTree></p:cSld></p:sld>"
    )


def _rels(target: str | None) -> str:
    rel = (
        f'<Relationship Id="rId1" Type="{CHART_REL}" Target="{target}"/>' if target else ""
    )
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="{PKG}">{rel}</Relationships>'


def _chart(series_name: str, cats: list[str], vals: list[int]) -> str:
    cat_pts = "".join(f'<c:pt idx="{i}"><c:v>{c}</c:v></c:pt>' for i, c in enumerate(cats))
    val_pts = "".join(f'<c:pt idx="{i}"><c:v>{v}</c:v></c:pt>' for i, v in enumerate(vals))
    return (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="{C}" xmlns:a="{A}" xmlns:r="{R}">'
        f"<c:chart><c:plotArea><c:barChart><c:ser><c:idx val=\"0\"/><c:order val=\"0\"/>"
        f"<c:tx><c:v>{series_name}</c:v></c:tx>"
        f'<c:cat><c:strRef><c:strCache><c:ptCount val="{len(cats)}"/>{cat_pts}</c:strCache></c:strRef></c:cat>'
        f'<c:val><c:numRef><c:numCache><c:ptCount val="{len(vals)}"/>{val_pts}</c:numCache></c:numRef></c:val>'
        f"</c:ser></c:barChart></c:plotArea></c:chart></c:chartSpace>"
    )


def _make_deck(path: Path) -> None:
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("[Content_Types].xml", "<Types></Types>")
        z.writestr("ppt/slides/slide1.xml", _slide("rId1", "untouched one"))
        z.writestr("ppt/slides/_rels/slide1.xml.rels", _rels("../charts/chart1.xml"))
        z.writestr("ppt/charts/chart1.xml", _chart("Sales", ["Q1", "Q2"], [10, 20]))
        z.writestr("ppt/slides/slide2.xml", _slide("rId1", "untouched two"))
        z.writestr("ppt/slides/_rels/slide2.xml.rels", _rels("../charts/chart2.xml"))
        z.writestr("ppt/charts/chart2.xml", _chart("Cost", ["Q3", "Q4"], [30, 40]))


class ChartPartsTest(unittest.TestCase):
    def test_resolves_chart_part_per_slide(self):
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "d.pptx"
            _make_deck(deck)
            self.assertEqual(engine.chart_parts_for_slide(deck, 1), ["ppt/charts/chart1.xml"])
            self.assertEqual(engine.chart_parts_for_slide(deck, 2), ["ppt/charts/chart2.xml"])


class ChartEditTest(unittest.TestCase):
    def test_replace_chart_text_touches_only_target_chart_part(self):
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "d.pptx"
            out = Path(tmp) / "o.pptx"
            _make_deck(deck)
            before = engine.member_hashes(deck)

            part_edits = engine.build_part_edits(deck, 1, [{"op": "replace_chart_text", "old": "Q1", "new": "H1"}])
            self.assertEqual(list(part_edits.keys()), ["ppt/charts/chart1.xml"])
            engine.patch_parts(deck, out, part_edits)

            after = engine.member_hashes(out)
            self.assertNotEqual(before["ppt/charts/chart1.xml"], after["ppt/charts/chart1.xml"])
            # slide part and the other slide's chart are byte-identical
            self.assertEqual(before["ppt/slides/slide1.xml"], after["ppt/slides/slide1.xml"])
            self.assertEqual(before["ppt/charts/chart2.xml"], after["ppt/charts/chart2.xml"])
            self.assertEqual(before["ppt/slides/slide2.xml"], after["ppt/slides/slide2.xml"])
            self.assertIn("H1", engine.part_text(out, "ppt/charts/chart1.xml"))
            self.assertNotIn("Q1", engine.part_text(out, "ppt/charts/chart1.xml"))

    def test_set_chart_value_updates_num_cache(self):
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "d.pptx"
            out = Path(tmp) / "o.pptx"
            _make_deck(deck)
            part_edits = engine.build_part_edits(
                deck, 1, [{"op": "set_chart_value", "series": 1, "point": 2, "value": 200}]
            )
            engine.patch_parts(deck, out, part_edits)
            self.assertIn("<c:v>200</c:v>", engine.part_text(out, "ppt/charts/chart1.xml"))
            self.assertIn("<c:v>10</c:v>", engine.part_text(out, "ppt/charts/chart1.xml"))

    def test_chart_index_out_of_range_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "d.pptx"
            _make_deck(deck)
            with self.assertRaises(ValueError):
                engine.build_part_edits(deck, 1, [{"op": "replace_chart_text", "chart": 5, "old": "Q1", "new": "X"}])

    def test_idempotent_chart_op_leaves_part_untouched(self):
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "d.pptx"
            out = Path(tmp) / "o.pptx"
            _make_deck(deck)
            before = engine.member_hashes(deck)
            part_edits = engine.build_part_edits(deck, 1, [{"op": "replace_chart_text", "old": "NOMATCH", "new": "X"}])
            engine.patch_parts(deck, out, part_edits)
            after = engine.member_hashes(out)
            self.assertEqual(before["ppt/charts/chart1.xml"], after["ppt/charts/chart1.xml"])


class ChartWorkerFlowTest(unittest.TestCase):
    def test_run_preserve_edit_with_chart_op_is_safe_and_summarized(self):
        from apps.desktop.worker.desktop_worker import run_preserve_edit

        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "d.pptx"
            out = Path(tmp) / "o.pptx"
            _make_deck(deck)

            result = run_preserve_edit(
                {
                    "sourcePath": str(deck),
                    "outputPath": str(out),
                    "edits": [{"slide": 1, "operations": [{"op": "set_chart_value", "series": 1, "point": 1, "value": 99}]}],
                },
                Path(__file__).resolve().parents[1],
            )

            self.assertTrue(result["safe"], result)
            self.assertEqual(result["changed"], ["ppt/charts/chart1.xml"])
            self.assertNotIn("ppt/slides/slide1.xml", result["changed"])
            self.assertTrue(any("chart value(s) changed" in line for line in result["slideChanges"][1]))


if __name__ == "__main__":
    unittest.main()
