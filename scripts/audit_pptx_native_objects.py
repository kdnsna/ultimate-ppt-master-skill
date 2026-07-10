#!/usr/bin/env python3
"""Inspect a PPTX package for editable native PowerPoint objects."""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}
SUPPORTED_EXPECTATIONS = {"text", "shape", "chart", "table", "notes"}
SLIDE_RE = re.compile(r"ppt/slides/slide(\d+)\.xml$")


def parse_xml(package: zipfile.ZipFile, name: str) -> ET.Element:
    return ET.fromstring(package.read(name))


def inspect_pptx(path: Path) -> dict:
    with zipfile.ZipFile(path) as package:
        names = package.namelist()
        slide_names = sorted(
            (name for name in names if SLIDE_RE.fullmatch(name)),
            key=lambda name: int(SLIDE_RE.fullmatch(name).group(1)),
        )
        slides = []
        for name in slide_names:
            root = parse_xml(package, name)
            text_runs = [node.text.strip() for node in root.findall(".//a:t", NS) if node.text and node.text.strip()]
            slides.append(
                {
                    "slideId": f"P{len(slides) + 1:02d}",
                    "textRuns": len(text_runs),
                    "shapes": len(root.findall(".//p:sp", NS)),
                    "pictures": len(root.findall(".//p:pic", NS)),
                    "graphicFrames": len(root.findall(".//p:graphicFrame", NS)),
                    "tables": len(root.findall(".//a:tbl", NS)),
                }
            )

        notes_names = [name for name in names if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", name)]
        note_text_runs = 0
        for name in notes_names:
            root = parse_xml(package, name)
            note_text_runs += sum(1 for node in root.findall(".//a:t", NS) if node.text and node.text.strip())

        totals = {
            "slides": len(slides),
            "textRuns": sum(slide["textRuns"] for slide in slides),
            "shapes": sum(slide["shapes"] for slide in slides),
            "pictures": sum(slide["pictures"] for slide in slides),
            "graphicFrames": sum(slide["graphicFrames"] for slide in slides),
            "tables": sum(slide["tables"] for slide in slides),
            "charts": sum(1 for name in names if re.fullmatch(r"ppt/charts/chart\d+\.xml", name)),
            "notesSlides": len(notes_names),
            "noteTextRuns": note_text_runs,
        }
        totals["nativeVectorObjects"] = totals["shapes"] + totals["graphicFrames"]
        return {"schemaVersion": "pptx-native-object-audit-v1", "file": str(path), "totals": totals, "slides": slides}


def expectation_errors(report: dict, expectations: set[str]) -> list[str]:
    totals = report["totals"]
    checks = {
        "text": totals["textRuns"] > 0,
        "shape": totals["nativeVectorObjects"] > 0,
        "chart": totals["charts"] > 0,
        "table": totals["tables"] > 0,
        "notes": totals["notesSlides"] > 0 and totals["noteTextRuns"] > 0,
    }
    return [f"expected editable {name} objects, but none were found" for name in sorted(expectations) if not checks[name]]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pptx", help="PPTX file to inspect")
    parser.add_argument("--expect", default="text,shape", help="Comma-separated: text,shape,chart,table,notes")
    parser.add_argument("--json", dest="json_path", help="Optional report output path")
    args = parser.parse_args(argv)

    path = Path(args.pptx).expanduser().resolve()
    expectations = {value.strip() for value in args.expect.split(",") if value.strip()}
    unsupported = expectations - SUPPORTED_EXPECTATIONS
    if unsupported:
        print(f"Unsupported expectation(s): {', '.join(sorted(unsupported))}", file=sys.stderr)
        return 2
    if not path.is_file() or path.suffix.lower() != ".pptx":
        print(f"PPTX file not found: {path}", file=sys.stderr)
        return 2

    try:
        report = inspect_pptx(path)
    except (zipfile.BadZipFile, ET.ParseError, KeyError, OSError) as exc:
        print(f"Could not inspect PPTX: {exc}", file=sys.stderr)
        return 2

    if args.json_path:
        Path(args.json_path).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    errors = expectation_errors(report, expectations)
    if errors:
        print("PPTX native object audit failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    totals = report["totals"]
    print(
        "PPTX native object audit passed: "
        f"{totals['slides']} slides, {totals['textRuns']} text runs, "
        f"{totals['nativeVectorObjects']} vector objects, {totals['charts']} charts, "
        f"{totals['tables']} tables, {totals['notesSlides']} notes slides."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
