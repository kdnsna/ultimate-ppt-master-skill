import unittest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from scripts.pptx_template_import import build_reference_style_from_manifest


class ReferenceStyleImportTest(unittest.TestCase):
    def test_build_reference_style_from_template_manifest(self):
        manifest = {
            "slideSize": {"width": 13.333, "height": 7.5},
            "theme": {
                "colors": {"accent1": "2563EB", "accent2": "0F766E"},
                "fonts": {"major": "Aptos Display", "minor": "Aptos"},
            },
            "slides": [
                {
                    "index": 1,
                    "name": "Cover",
                    "layoutName": "Title Slide",
                    "shapeCount": 6,
                    "textCount": 2,
                    "imageCount": 1,
                },
                {
                    "index": 2,
                    "name": "Evidence",
                    "layoutName": "Title and Content",
                    "shapeCount": 12,
                    "textCount": 8,
                    "tableCount": 1,
                },
                {
                    "index": 3,
                    "name": "Process",
                    "layoutName": "Process",
                    "shapeCount": 14,
                    "textCount": 6,
                    "connectorCount": 4,
                },
            ],
        }

        style = build_reference_style_from_manifest(manifest, mode="style-only")

        self.assertEqual(style["version"], "reference-style-v1")
        self.assertEqual(style["mode"], "style-only")
        self.assertIn("cover", style["functionalTypes"])
        self.assertIn("evidence", style["functionalTypes"])
        self.assertIn("process", style["functionalTypes"])
        self.assertIn("cover_brand", style["layoutFamilies"])
        self.assertIn("evidence_board", style["layoutFamilies"])
        self.assertIn("process_flow", style["layoutFamilies"])
        self.assertEqual(style["brandConstraints"]["fonts"]["major"], "Aptos Display")
        self.assertEqual(style["slideSchemas"][0]["slideId"], "P01")


if __name__ == "__main__":
    unittest.main()
