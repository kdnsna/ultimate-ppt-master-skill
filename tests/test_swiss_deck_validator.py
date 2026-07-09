import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def swiss_deck(slides: str) -> str:
    return f"""<!doctype html>
<html>
<head>
<style>
.canvas-card {{ display: grid; }}
.light {{ color: #111; }}
.dark {{ color: #fff; }}
.slide {{ min-height: 100vh; }}
.t-meta {{ font-size: 14px; }}
.caption {{ font-size: 16px; }}
.body-copy {{ font-size: 18px; }}
.tiny-copy {{ font-size: 15px; }}
.vh-copy {{ font-size: 1.4vh; }}
.nav-safe-bottom {{ padding-bottom: 8vh; }}
.frame-img {{ overflow: hidden; }}
.r-21x9 {{ aspect-ratio: 21 / 9; }}
</style>
</head>
<body>
<main id="deck">
{slides}
</main>
</body>
</html>
"""


class SwissDeckValidatorTest(unittest.TestCase):
    def run_validator(self, html: str) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "index.html"
            deck.write_text(html, encoding="utf-8")
            return subprocess.run(
                ["node", str(ROOT / "scripts/validate-swiss-deck.mjs"), str(deck)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

    def test_rejects_body_text_below_swiss_minimum(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S11">
  <div class="canvas-card">
    <p class="t-meta" style="font-size:14px">METHODOLOGY</p>
    <p style="font-size:15px">This body copy is too small for Swiss presentation mode.</p>
  </div>
</section>
"""
            )
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("body text below 18px", result.stderr)

    def test_rejects_bottom_nav_collision_without_safe_class(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S15">
  <div class="canvas-card">
    <div style="align-self:end">
      <p class="caption" style="font-size:16px">Caption hugs the nav.</p>
    </div>
  </div>
</section>
"""
            )
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("bottom nav safe zone", result.stderr)

    def test_rejects_flex_end_bottom_nav_collision(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S15">
  <div class="canvas-card">
    <div style="align-items:flex-end">
      <p class="caption" style="font-size:16px">Caption hugs the nav.</p>
    </div>
  </div>
</section>
"""
            )
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("bottom nav safe zone", result.stderr)

    def test_rejects_class_defined_small_body_text(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S11">
  <div class="canvas-card">
    <p class="tiny-copy">This body copy is too small through a class.</p>
  </div>
</section>
"""
            )
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("body text below 18px", result.stderr)

    def test_warns_for_non_px_class_font_units(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S11">
  <div class="canvas-card">
    <p class="vh-copy">This font size needs human conversion review.</p>
  </div>
</section>
"""
            )
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("non-px font-size", result.stderr)

    def test_rejects_undefined_body_class(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S11">
  <div class="canvas-card missing-class">
    <p class="body-copy">Readable copy with a misspelled class.</p>
  </div>
</section>
"""
            )
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("undefined CSS class", result.stderr)

    def test_rejects_unclosed_slide_that_regex_extraction_would_skip(self):
        result = self.run_validator(
            """<!doctype html>
<html>
<head><style>.slide{min-height:100vh}.light{color:#111}.canvas-card{display:grid}.body-copy{font-size:18px}</style></head>
<body>
<main id="deck">
<section class="slide light" data-layout="S11">
  <div class="canvas-card">
    <p class="body-copy">Missing closing section.</p>
  </div>
</main>
</body>
</html>
"""
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("slide section count mismatch", result.stderr)

    def test_rejects_s22_top_object_position_variants(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S22">
  <div class="canvas-card nav-safe-bottom">
    <h2 style="font-size:min(5.8vw,10.2vh)">Swiss image hero</h2>
    <div class="frame-img r-21x9">
      <img src="images/06-hero.jpg" data-image-slot="s22-hero-21x9" style="object-position:center top">
    </div>
    <p class="body-copy">Readable body copy.</p>
  </div>
</section>
"""
            )
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("object-position", result.stderr)

    def test_rejects_s22_without_registered_frame_signature(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S22">
  <div class="canvas-card nav-safe-bottom">
    <h2 style="font-size:min(5.8vw,10.2vh)">Swiss image hero</h2>
    <img src="images/06-hero.jpg" data-image-slot="s22-hero-21x9" style="object-position:center 35%">
    <p class="body-copy">Readable body copy.</p>
  </div>
</section>
"""
            )
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("layout signature", result.stderr)

    def test_accepts_registered_s22_with_slot_and_safe_sizes(self):
        result = self.run_validator(
            swiss_deck(
                """
<section class="slide light" data-layout="S22">
  <div class="canvas-card nav-safe-bottom">
    <p class="t-meta" style="font-size:14px;font-weight:600">EVIDENCE</p>
    <h2 style="font-size:min(5.8vw,10.2vh);font-weight:200">Swiss image hero</h2>
    <div class="frame-img r-21x9">
      <img src="images/06-hero.jpg" data-image-slot="s22-hero-21x9" style="object-position:center 35%">
    </div>
    <p class="caption" style="font-size:16px">Readable caption.</p>
    <p style="font-size:18px">Readable body copy.</p>
  </div>
</section>
"""
            )
        )

        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
