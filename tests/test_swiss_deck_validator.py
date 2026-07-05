import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def swiss_deck(slides: str) -> str:
    return f"""<!doctype html>
<html>
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
