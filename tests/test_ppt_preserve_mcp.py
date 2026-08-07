import json
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts import ppt_preserve_mcp as mcp

REPO_ROOT = Path(__file__).resolve().parents[1]
SERVER_SCRIPT = REPO_ROOT / "scripts" / "ppt_preserve_mcp.py"


def _make_deck(path: Path) -> None:
    ns = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
    with zipfile.ZipFile(path, "w") as package:
        package.writestr("[Content_Types].xml", "<Types></Types>")
        package.writestr("ppt/media/image1.png", b"\x89PNG-fake-logo")
        package.writestr(
            "ppt/slides/slide1.xml",
            f"<p:sld {ns}><p:cSld><p:spTree>"
            '<p:sp><p:txBody><a:p><a:r><a:t>Alpha</a:t></a:r></a:p></p:txBody></p:sp>'
            "</p:spTree></p:cSld></p:sld>",
        )
        package.writestr(
            "ppt/slides/slide2.xml",
            f"<p:sld {ns}><p:cSld><p:spTree>"
            '<p:sp><p:txBody><a:p><a:r><a:t>Beta</a:t></a:r></a:p></p:txBody></p:sp>'
            "</p:spTree></p:cSld></p:sld>",
        )


class McpHandlerTest(unittest.TestCase):
    def test_initialize_advertises_tools_capability(self):
        result, error = mcp.handle_request("initialize", {})
        self.assertIsNone(error)
        self.assertEqual(result["protocolVersion"], mcp.PROTOCOL_VERSION)
        self.assertIn("tools", result["capabilities"])
        self.assertEqual(result["serverInfo"]["name"], mcp.SERVER_NAME)
        self.assertIn("Preservation-first", result["instructions"])

    def test_tools_list_exposes_two_tools_with_schemas(self):
        result, error = mcp.handle_request("tools/list", {})
        self.assertIsNone(error)
        names = [tool["name"] for tool in result["tools"]]
        self.assertEqual(names, ["inspect_pptx", "edit_pptx_preserving"])
        for tool in result["tools"]:
            self.assertIn("inputSchema", tool)
            self.assertEqual(tool["inputSchema"]["type"], "object")

    def test_unknown_method_returns_method_not_found(self):
        result, error = mcp.handle_request("nope", {})
        self.assertIsNone(result)
        self.assertEqual(error["code"], -32601)

    def test_inspect_pptx_lists_slide_previews(self):
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "deck.pptx"
            _make_deck(deck)
            result = mcp.tool_inspect_pptx({"source_path": str(deck)})
            self.assertFalse(result["isError"])
            self.assertIn("slideCount: 2", result["content"][0]["text"])
            self.assertIn("Alpha", result["content"][0]["text"])

    def test_inspect_pptx_missing_file_is_error(self):
        result = mcp.tool_inspect_pptx({"source_path": "/no/such/deck.pptx"})
        self.assertTrue(result["isError"])

    def test_edit_pptx_preserving_is_safe_and_writes_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "deck.pptx"
            output = Path(tmp) / "out.pptx"
            _make_deck(deck)
            before = mcp.engine.member_hashes(deck)

            result = mcp.tool_edit_pptx_preserving(
                {"source_path": str(deck), "output_path": str(output), "edits": [{"slide": 2, "replacements": {"Beta": "BETA"}}]}
            )

            self.assertFalse(result["isError"], result["content"][0]["text"])
            self.assertIn("status: ok", result["content"][0]["text"])
            after = mcp.engine.member_hashes(output)
            changed = [name for name in before if name in after and before[name] != after[name]]
            self.assertEqual(changed, ["ppt/slides/slide2.xml"])


class McpStdioTransportTest(unittest.TestCase):
    def test_jsonrpc_roundtrip_over_stdio(self):
        with tempfile.TemporaryDirectory() as tmp:
            deck = Path(tmp) / "deck.pptx"
            _make_deck(deck)

            proc = subprocess.Popen(
                [sys.executable, str(SERVER_SCRIPT)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            messages = [
                {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
                {"jsonrpc": "2.0", "method": "notifications/initialized"},
                {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
                {
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "tools/call",
                    "params": {"name": "inspect_pptx", "arguments": {"source_path": str(deck)}},
                },
            ]
            for message in messages:
                proc.stdin.write(json.dumps(message) + "\n")
            proc.stdin.flush()
            proc.stdin.close()

            # communicate() after an explicit stdin.close() raises ValueError on
            # Python >=3.11 (it tries to flush a closed pipe). Read stdout until
            # EOF instead; the MCP stdio server exits once stdin reaches EOF.
            out = proc.stdout.read()
            _err = proc.stderr.read()
            proc.wait(timeout=30)
            proc.stdout.close()
            proc.stderr.close()

        responses = [json.loads(line) for line in out.splitlines() if line.strip()]
        self.assertEqual([response["id"] for response in responses], [1, 2, 3])
        self.assertIn("protocolVersion", responses[0]["result"])
        self.assertEqual(len(responses[1]["result"]["tools"]), 2)
        self.assertIn("slideCount: 2", responses[2]["result"]["content"][0]["text"])


if __name__ == "__main__":
    unittest.main()
