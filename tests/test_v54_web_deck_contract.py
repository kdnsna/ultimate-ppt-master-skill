import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class V54WebDeckContractTest(unittest.TestCase):
    def test_web_console_emits_swiss_deck_and_asset_factory_contract(self):
        app = (ROOT / "apps/web/src/App.tsx").read_text(encoding="utf-8")

        required_snippets = [
            "assetPlanRequired",
            "webDeck",
            "layoutPolicy",
            "swiss-locked-sxx",
            "free-layout-skeletons",
            "pageRhythm",
            "asset_plan.json",
            "Swiss Deck / Asset Factory",
            "Style A · Editorial/E-ink",
            "Style B · Swiss International",
            "audit:swiss-deck",
        ]

        missing = [snippet for snippet in required_snippets if snippet not in app]
        self.assertEqual(missing, [])

    def test_swiss_keyword_route_keeps_formal_pptx_exception(self):
        app = (ROOT / "apps/web/src/App.tsx").read_text(encoding="utf-8")

        required_snippets = [
            "swissIntentDetected",
            "information design",
            "Helvetica",
            "grid",
            "KPI",
            "formalEditable",
            "Style B · Swiss International",
            "Style A · 电子杂志 × 电子墨水",
        ]

        missing = [snippet for snippet in required_snippets if snippet not in app]
        self.assertEqual(missing, [])


if __name__ == "__main__":
    unittest.main()
