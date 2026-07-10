import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts.audit_pptx_native_objects import expectation_errors, inspect_pptx


SLIDE_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree>
    <p:sp><p:txBody><a:p><a:r><a:t>Editable title</a:t></a:r></a:p></p:txBody></p:sp>
    <p:graphicFrame><a:graphic><a:graphicData><a:tbl /></a:graphicData></a:graphic></p:graphicFrame>
  </p:spTree></p:cSld>
</p:sld>"""

NOTES_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Speaker note</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>
</p:notes>"""


class PptxNativeObjectAuditTest(unittest.TestCase):
    def test_detects_editable_object_families(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            pptx = Path(temp_dir) / "native.pptx"
            with zipfile.ZipFile(pptx, "w") as package:
                package.writestr("ppt/slides/slide1.xml", SLIDE_XML)
                package.writestr("ppt/charts/chart1.xml", "<chart />")
                package.writestr("ppt/notesSlides/notesSlide1.xml", NOTES_XML)
            report = inspect_pptx(pptx)
            self.assertEqual(report["slides"][0]["slideId"], "P01")
            self.assertEqual(report["totals"]["tables"], 1)
            self.assertEqual(report["totals"]["charts"], 1)
            self.assertEqual(expectation_errors(report, {"text", "shape", "chart", "table", "notes"}), [])

    def test_reports_missing_expected_chart(self):
        report = {"totals": {"textRuns": 1, "nativeVectorObjects": 1, "charts": 0, "tables": 0, "notesSlides": 0, "noteTextRuns": 0}}
        self.assertIn("chart", expectation_errors(report, {"chart"})[0])


if __name__ == "__main__":
    unittest.main()
