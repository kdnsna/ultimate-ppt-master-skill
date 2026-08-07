import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from upm.adapters.kimi.healthcheck import kimi_healthcheck  # noqa: E402
from upm.adapters.kimi.protocol import (  # noqa: E402
    build_payload,
    is_pptx,
    parse_version,
    patch_transitions,
    replace_transition,
    validate_transition_order,
)
from upm.errors import AdapterUnavailableError  # noqa: E402


class ProtocolTest(unittest.TestCase):
    def test_parse_version(self):
        self.assertEqual(parse_version("agent-browser 0.33.2"), (0, 33, 2))

    def test_ensure_agent_browser_never_installs_and_rejects_old_version(self):
        with patch("upm.adapters.kimi.protocol.shutil.which", return_value="/bin/agent-browser"), patch(
            "upm.adapters.kimi.protocol.subprocess.run"
        ) as run:
            run.return_value = MagicMock(returncode=0, stdout="agent-browser 0.26.0\n")
            with self.assertRaises(AdapterUnavailableError):
                from upm.adapters.kimi.protocol import ensure_agent_browser

                ensure_agent_browser()

    def test_build_payload_uses_project_relative_paths(self):
        fixture = ROOT / "tests" / "fixtures" / "pptd" / "minimal"
        payload = build_payload(fixture / "deck.pptd")
        self.assertEqual(len(payload["pages"]), 2)
        self.assertTrue(all(page["path"].startswith("pages/") for page in payload["pages"]))
        self.assertIn("imageMap", payload)

    def test_transition_ordering(self):
        source = (
            b'<?xml version="1.0" encoding="UTF-8"?>'
            b'<p:sld xmlns:p="urn:test"><p:cSld><p:spTree/></p:cSld>'
            b'<p:clrMapOvr/><p:timing/></p:sld>'
        )
        result = replace_transition(source, "fade")
        validate_transition_order(result, "fade")
        cleared = replace_transition(result, "none")
        validate_transition_order(cleared, "none")

    def test_patch_transitions_preserves_zip(self):
        with tempfile.TemporaryDirectory() as name:
            deck = Path(name) / "deck.pptx"
            import zipfile

            with zipfile.ZipFile(deck, "w", zipfile.ZIP_DEFLATED) as archive:
                archive.writestr(
                    "[Content_Types].xml",
                    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>',
                )
                archive.writestr("ppt/presentation.xml", "<p:presentation xmlns:p=\"urn:test\"/>")
                archive.writestr("ppt/slides/slide1.xml", '<p:sld xmlns:p="urn:test"><p:cSld/></p:sld>')
            self.assertEqual(patch_transitions(deck, "fade"), 1)
            self.assertTrue(is_pptx(deck))

    def test_healthcheck_reports_unavailable_without_agent_browser(self):
        with patch("upm.adapters.kimi.healthcheck.shutil.which", return_value=None):
            result = kimi_healthcheck()
        self.assertFalse(result["available"])
        self.assertEqual(result["backend"], "kimi")


if __name__ == "__main__":
    unittest.main()
