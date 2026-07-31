import tempfile
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image

from scripts import ppt_render


def _png(path: Path, w: int, h: int, color) -> None:
    Image.new("RGB", (w, h), color).save(path)


class CompositorTest(unittest.TestCase):
    def test_side_by_side_layout_is_deterministic(self):
        with tempfile.TemporaryDirectory() as tmp:
            b = Path(tmp) / "b.png"
            a = Path(tmp) / "a.png"
            out = Path(tmp) / "out.png"
            _png(b, 200, 150, (255, 0, 0))
            _png(a, 200, 150, (0, 0, 255))

            self.assertTrue(ppt_render.compose_side_by_side(b, a, out))

            img = Image.open(out)
            # pad*2 + bw + gap + aw , header + h + pad + caption_h(16 when no caption)
            self.assertEqual(img.size, (24 * 2 + 200 + 28 + 200, 56 + 150 + 24 + 16))

    def test_side_by_side_with_caption_increases_height(self):
        with tempfile.TemporaryDirectory() as tmp:
            b = Path(tmp) / "b.png"
            a = Path(tmp) / "a.png"
            out = Path(tmp) / "out.png"
            _png(b, 200, 150, (10, 10, 10))
            _png(a, 200, 150, (20, 20, 20))
            self.assertTrue(ppt_render.compose_side_by_side(b, a, out, caption="80/81 byte-identical"))
            self.assertEqual(Image.open(out).size[1], 56 + 150 + 24 + 40)


class GracefulDegradationTest(unittest.TestCase):
    def test_backend_none_when_soffice_missing(self):
        with mock.patch.object(ppt_render, "_have_soffice", return_value=False):
            self.assertIsNone(ppt_render.backend())

    def test_backend_none_when_no_pdf_rasterizer(self):
        with mock.patch.object(ppt_render, "_have_soffice", return_value=True), mock.patch.object(
            ppt_render, "_pdf_rasterizer", return_value=None
        ):
            self.assertIsNone(ppt_render.backend())

    def test_render_returns_false_without_backend(self):
        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(ppt_render, "_have_soffice", return_value=False):
            deck = Path(tmp) / "d.pptx"
            deck.write_bytes(b"PK")
            self.assertFalse(ppt_render.render_slide_png(deck, 1, Path(tmp) / "x.png"))
            self.assertFalse(ppt_render.render_slide_diff_png(deck, deck, 1, Path(tmp) / "y.png"))
            self.assertFalse(ppt_render.render_slide_diff_gif(deck, deck, 1, Path(tmp) / "z.gif"))


if __name__ == "__main__":
    unittest.main()
