import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


STYLE = """
.slide{min-height:100vh}
.light{color:#111}
.dark{color:#fff}
.hero{display:grid}
.frame-img{display:block}
.body{font-size:18px}
"""


def deck(sections: str) -> str:
    return f"""<!doctype html>
<html>
<head>
<title>Magazine Deck</title>
<style>{STYLE}</style>
</head>
<body>
<main id="deck">
{sections}
</main>
</body>
</html>
"""


VALID_EIGHT = """
<section class="slide hero dark"><p class="body">Cover</p></section>
<section class="slide light"><p class="body">Context</p></section>
<section class="slide dark"><p class="body">Tension</p></section>
<section class="slide light"><p class="body">Structure</p></section>
<section class="slide hero light"><p class="body">Divider</p></section>
<section class="slide dark"><figure class="frame-img"><img src="images/scene.jpg"></figure></section>
<section class="slide dark"><p class="body">Point of view</p></section>
<section class="slide light"><p class="body">Closing</p></section>
"""


class MagazineDeckValidatorTest(unittest.TestCase):
    def run_validator(self, html: str, *, image: bool = True) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            if image:
                (root / "images").mkdir()
                (root / "images/scene.jpg").write_bytes(b"fake")
            deck_path = root / "index.html"
            deck_path.write_text(html, encoding="utf-8")
            return subprocess.run(
                ["node", str(ROOT / "scripts/validate-magazine-deck.mjs"), str(deck_path)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )

    def test_accepts_valid_style_a_eight_page_rhythm(self):
        result = self.run_validator(deck(VALID_EIGHT))

        self.assertEqual(result.returncode, 0, result.stderr)

    def test_rejects_required_placeholder(self):
        result = self.run_validator(deck(VALID_EIGHT).replace("Magazine Deck", "[必填]"))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("[必填]", result.stderr)

    def test_rejects_undefined_class(self):
        result = self.run_validator(deck(VALID_EIGHT.replace("body\">Context", "missing-class\">Context")))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("undefined CSS class", result.stderr)

    def test_rejects_missing_image_file(self):
        result = self.run_validator(deck(VALID_EIGHT), image=False)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing image file", result.stderr)

    def test_rejects_invalid_fixed_eight_page_rhythm(self):
        result = self.run_validator(deck(VALID_EIGHT.replace('class="slide light"><p class="body">Context', 'class="slide dark"><p class="body">Context')))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("fixed 8-page rhythm", result.stderr)


if __name__ == "__main__":
    unittest.main()
