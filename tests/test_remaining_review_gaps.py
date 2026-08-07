"""Regression tests for remaining review gaps (audit, open save, kimi media, cross-run)."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
PYTHON = ROOT / ".venv" / "bin" / "python" if (ROOT / ".venv" / "bin" / "python").is_file() else Path(sys.executable)


def run_upm(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(PYTHON), "-m", "upm", *args],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        timeout=300,
    )


class AuditGatesTest(unittest.TestCase):
    def test_audit_rejects_no_qa(self):
        with tempfile.TemporaryDirectory() as name:
            result = run_upm(
                "make",
                "审计禁止跳过QA",
                "--out",
                name,
                "--pages",
                "4",
                "--mode",
                "audit",
                "--no-qa",
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("不允许 --no-qa", result.stderr)

    def test_standard_no_qa_demotes_formal_export(self):
        with tempfile.TemporaryDirectory() as name:
            out = Path(name) / "out"
            result = run_upm(
                "make",
                "无来源正式主题",
                "--title",
                "标准模式无QA",
                "--out",
                str(out),
                "--pages",
                "4",
                "--mode",
                "standard",
                "--no-qa",
            )
            self.assertEqual(result.returncode, 2, result.stderr + result.stdout)
            project = next(p for p in out.iterdir() if p.is_dir())
            self.assertTrue(any((project / "exports" / "draft").glob("*.pptx")))
            formal = [p for p in (project / "exports").glob("*.pptx") if p.is_file()]
            self.assertEqual(formal, [])
            report = json.loads((project / ".upm" / "quality-report.json").read_text(encoding="utf-8"))
            self.assertEqual(report["overall"], "fail")
            self.assertIn(report["gates"].get("officeRender"), {"pass", "fail", "not-run"})
            self.assertEqual(report["evidence"]["export"].get("officeRender"), report["summary"].get("officeRender"))

    def test_kimi_blocked_in_standard(self):
        with tempfile.TemporaryDirectory() as name:
            result = run_upm(
                "make",
                "有来源的一点文字用于测试Kimi禁止",
                "--out",
                name,
                "--pages",
                "4",
                "--mode",
                "standard",
                "--no-qa",
                "--export-backend",
                "kimi",
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertTrue(
                "Kimi" in result.stderr or "kimi" in result.stderr.lower() or "不允许" in result.stderr,
                result.stderr + result.stdout,
            )


class OpenSaveSecurityTest(unittest.TestCase):
    def test_save_validated_yaml_rejects_bad_and_accepts_good(self):
        from upm.cli.open_server import save_validated_yaml
        from upm.compiler.compiler import compile_deck
        from upm.compiler.planner import plan_deckir

        with tempfile.TemporaryDirectory() as name:
            project = Path(name) / "proj"
            deckir = plan_deckir("保存测试", "一句话资料用于生成。", page_count=4, quality_mode="quick")
            compile_deck(deckir, project)
            page = next((project / "pages").glob("*.page"))
            good = page.read_text(encoding="utf-8")
            result = save_validated_yaml(project, page.relative_to(project).as_posix(), good)
            self.assertTrue(result["ok"])
            with self.assertRaises(ValueError):
                save_validated_yaml(project, page.relative_to(project).as_posix(), "not: a: mapping: [")
            with self.assertRaises(ValueError):
                save_validated_yaml(project, page.relative_to(project).as_posix(), "just a string")

    def test_session_token_required_on_post(self):
        from upm.cli.open_server import EditorServer
        from upm.compiler.compiler import compile_deck
        from upm.compiler.planner import plan_deckir
        from http.client import HTTPConnection

        with tempfile.TemporaryDirectory() as name:
            project = Path(name) / "proj"
            compile_deck(plan_deckir("token", "资料一句。", page_count=4), project)
            server = EditorServer(("127.0.0.1", 0), project)
            host, port = server.server_address
            import threading

            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                conn = HTTPConnection("127.0.0.1", port, timeout=5)
                conn.request("POST", "/api/save", body=json.dumps({"path": "deck.pptd", "content": "{}"}), headers={"Content-Type": "application/json"})
                res = conn.getresponse()
                body = json.loads(res.read().decode("utf-8"))
                self.assertEqual(res.status, 403)
                self.assertIn("session", body.get("error", "").lower())
            finally:
                server.shutdown()
                server.server_close()


class KimiMediaFilterTest(unittest.TestCase):
    def test_build_image_map_only_referenced(self):
        from upm.adapters.kimi.protocol import build_image_map, collect_referenced_media_paths

        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            (root / "media").mkdir()
            ref = root / "media" / "used.png"
            orphan = root / "media" / "orphan.png"
            # minimal PNG
            ref.write_bytes(
                bytes.fromhex(
                    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082"
                )
            )
            orphan.write_bytes(ref.read_bytes())
            (root / "pages").mkdir()
            (root / "pages" / "01_page.page").write_text(
                "pageType: content\nelements:\n  - elementType: image\n    src: media/used.png\n    bounds: [0,0,100,100]\n",
                encoding="utf-8",
            )
            (root / "deck.pptd").write_text("version: pptd-v2\ntitle: t\nsize: [960,540]\npages: [pages/01_page.page]\n", encoding="utf-8")
            refs = collect_referenced_media_paths(root)
            self.assertIn("media/used.png", refs)
            image_map = build_image_map(root)
            self.assertIn("media/used.png", image_map)
            self.assertNotIn("media/orphan.png", image_map)


class CrossRunReplaceTest(unittest.TestCase):
    def _slide_xml(self, *run_texts: str) -> str:
        runs = "".join(f"<a:r><a:t>{text}</a:t></a:r>" for text in run_texts)
        return (
            '<?xml version="1.0"?>'
            '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            f"<p:cSld><p:spTree><p:sp><p:txBody><a:p>{runs}</a:p></p:txBody></p:sp>"
            "</p:spTree></p:cSld></p:sld>"
        )

    def _joined_text(self, xml: str) -> str:
        return "".join(
            (node.text or "")
            for node in ET.fromstring(xml).iter(
                "{http://schemas.openxmlformats.org/drawingml/2006/main}t"
            )
        )

    def test_replace_text_spans_multiple_runs(self):
        sys.path.insert(0, str(ROOT / "scripts"))
        from preserve_edit_pptx import replace_text  # type: ignore

        edited = replace_text({"HelloWorld": "HiThere"})(self._slide_xml("Hello", "World"))
        self.assertEqual(self._joined_text(edited), "HiThere")

    def test_replace_when_new_contains_old_does_not_hang(self):
        sys.path.insert(0, str(ROOT / "scripts"))
        from preserve_edit_pptx import replace_text  # type: ignore

        # Single-run: Hello → Hello! must not loop forever.
        edited = replace_text({"Hello": "Hello!"})(self._slide_xml("Hello"))
        self.assertEqual(self._joined_text(edited), "Hello!")
        # Multi-run: ab|cd → abcdX (new contains old contiguous "abcd")
        edited2 = replace_text({"abcd": "abcdX"})(self._slide_xml("ab", "cd"))
        self.assertEqual(self._joined_text(edited2), "abcdX")

    def test_apply_edits_unlinks_partial_output_on_failure(self):
        sys.path.insert(0, str(ROOT / "scripts"))
        from preserve_edit_pptx import apply_edits  # type: ignore

        with tempfile.TemporaryDirectory() as name:
            # Minimal valid pptx zip with one slide part so patch can start.
            source = Path(name) / "src.pptx"
            output = Path(name) / "out.pptx"
            import zipfile

            slide_xml = (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
                'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
                "<p:cSld><p:spTree>"
                '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>'
                "</p:spTree></p:cSld></p:sld>"
            )
            with zipfile.ZipFile(source, "w") as archive:
                archive.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>')
                archive.writestr("ppt/slides/slide1.xml", slide_xml)
            # Invalid op should fail build_part_edits / dispatch and not leave output.
            with self.assertRaises(Exception):
                apply_edits(
                    source,
                    output,
                    [{"slide": 1, "operations": [{"op": "not_a_real_op", "old": "x", "new": "y"}]}],
                )
            self.assertFalse(output.exists(), "failed apply_edits must not leave partial output.pptx")


class VersionClaimsTest(unittest.TestCase):
    def test_version_files_aligned_to_beta(self):
        pyproject = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
        package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        version_file = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
        self.assertIn("7.0.0b1", pyproject)
        self.assertEqual(version_file, "7.0.0b1")
        self.assertTrue(package["version"].startswith("7.0.0"))
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        for needle in ("Preserve Edit", "Editable Deck", "Experimental", "shape-editable", "v7.0.0-beta"):
            self.assertIn(needle, readme)
        self.assertIn("RC", skill)
        self.assertIn("Beta", skill)
        self.assertIn("Experimental", skill)


if __name__ == "__main__":
    unittest.main()
