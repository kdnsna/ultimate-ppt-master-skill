import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts.preserve_edit_pptx import (
    fidelity_report,
    member_hashes,
    patch_slide_xml,
    replace_text,
    slide_part_name,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
REAL_FIXTURE = (
    REPO_ROOT
    / "examples/executive-business-review-starter/executive-business-review-editable.pptx"
)


def _slide_xml(title: str, body: str) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'
        ' xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        "<p:cSld><p:spTree>"
        "<p:sp><p:txBody><a:p><a:r><a:t>" + title + "</a:t></a:r></a:p></p:txBody></p:sp>"
        "<p:sp><p:txBody><a:p><a:r><a:t>" + body + "</a:t></a:r></a:p></p:txBody></p:sp>"
        "</p:spTree></p:cSld></p:sld>"
    )


def _make_deck(path: Path) -> None:
    with zipfile.ZipFile(path, "w") as package:
        package.writestr("[Content_Types].xml", "<Types></Types>")
        package.writestr("ppt/presentation.xml", "<p:presentation></p:presentation>")
        package.writestr("ppt/slideMasters/slideMaster1.xml", "<p:sldMaster></p:sldMaster>")
        package.writestr("ppt/media/image1.png", b"\x89PNG-fake-logo-bytes")
        package.writestr("ppt/slides/slide1.xml", _slide_xml("Alpha title", "alpha body"))
        package.writestr("ppt/slides/slide2.xml", _slide_xml("Beta title", "keep me"))
        package.writestr("ppt/slides/slide3.xml", _slide_xml("Gamma title", "gamma body"))


class PreserveEditFidelityTest(unittest.TestCase):
    def test_noop_edit_keeps_every_part_byte_identical(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "source.pptx"
            output = Path(temp_dir) / "noop.pptx"
            _make_deck(source)

            patch_slide_xml(source, output, 2, lambda xml: xml)

            self.assertEqual(member_hashes(source), member_hashes(output))

    def test_targeted_edit_changes_only_named_slide(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "source.pptx"
            output = Path(temp_dir) / "edited.pptx"
            _make_deck(source)
            before = member_hashes(source)

            patch_slide_xml(source, output, 2, replace_text({"Beta title": "BETA title"}))

            after = member_hashes(output)
            target = slide_part_name(2)
            self.assertNotEqual(before[target], after[target])

            untouched = [name for name in before if name != target]
            for name in untouched:
                self.assertEqual(before[name], after[name], f"part changed: {name}")

            # The edit is surgical: the other run on the same slide survives.
            with zipfile.ZipFile(output) as package:
                edited_slide = package.read(target).decode("utf-8")
            self.assertIn("BETA title", edited_slide)
            self.assertIn("keep me", edited_slide)

    def test_fidelity_report_passes_for_clean_edit(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "source.pptx"
            output = Path(temp_dir) / "edited.pptx"
            _make_deck(source)

            patch_slide_xml(source, output, 2, replace_text({"keep me": "kept"}))

            report = fidelity_report(source, output, {slide_part_name(2)})
            self.assertTrue(report["ok"], report)
            self.assertEqual(report["changed"], [slide_part_name(2)])
            self.assertEqual(report["unchanged_count"], report["total_parts"] - 1)

    def test_fidelity_report_flags_unexpected_and_missing_changes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "source.pptx"
            output = Path(temp_dir) / "edited.pptx"
            _make_deck(source)

            patch_slide_xml(source, output, 2, replace_text({"keep me": "kept"}))

            # Wrong expectation: we claim slide 3 should change, but slide 2 did.
            report = fidelity_report(source, output, {slide_part_name(3)})
            self.assertFalse(report["ok"])
            self.assertEqual(report["unexpected_changed"], [slide_part_name(2)])
            self.assertEqual(report["missing_expected"], [slide_part_name(3)])

    def test_fidelity_report_flags_added_part(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "source.pptx"
            output = Path(temp_dir) / "tampered.pptx"
            _make_deck(source)

            with zipfile.ZipFile(source) as src, zipfile.ZipFile(output, "w") as dst:
                for info in src.infolist():
                    dst.writestr(info.filename, src.read(info.filename))
                dst.writestr("ppt/media/image2.png", b"stray-new-part")

            report = fidelity_report(source, output, set())
            self.assertFalse(report["ok"])
            self.assertEqual(report["added"], ["ppt/media/image2.png"])

    @unittest.skipUnless(REAL_FIXTURE.exists(), "real example fixture not present")
    def test_noop_on_real_native_deck_preserves_all_parts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "real-noop.pptx"
            patch_slide_xml(REAL_FIXTURE, output, 1, lambda xml: xml)
            self.assertEqual(member_hashes(REAL_FIXTURE), member_hashes(output))


if __name__ == "__main__":
    unittest.main()
