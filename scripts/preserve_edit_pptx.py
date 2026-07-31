"""Package-preserving single-slide editor for an existing .pptx.

This is the mechanical core of the "preservation-first" promise: edit only the
slide(s) the user names, and keep every other package part byte-for-byte
identical so the logo, masters, layouts, themes, media, links, grouping and
untouched slides survive exactly.

The mechanism is deliberately low-level: the source .pptx is a zip of XML/media
parts. We copy every part verbatim and re-serialize only the named slide part.
Untouched parts therefore keep identical content bytes (verified by
``fidelity_report``), which a whole-deck SVG round-trip cannot guarantee.

CLI:
    python3 scripts/preserve_edit_pptx.py <source.pptx> <output.pptx> \
        --slide 2 --replace "旧结论=新结论" [--report report.json]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from typing import Callable, Iterable

# OOXML namespaces, registered so re-serialized slide parts keep readable
# prefixes instead of ns0:/ns1:. The edited slide is allowed to change bytes;
# every other part is copied verbatim and never re-serialized.
_NAMESPACES = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "p14": "http://schemas.microsoft.com/office/powerpoint/2010/main",
    "mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
}
for _prefix, _uri in _NAMESPACES.items():
    ET.register_namespace(_prefix, _uri)

_A_NS = _NAMESPACES["a"]
_TEXT_TAG = f"{{{_A_NS}}}t"

EditFn = Callable[[str], str]


def slide_part_name(slide_number: int) -> str:
    """Return the package part path for a 1-based slide number."""
    if slide_number < 1:
        raise ValueError("slide_number must be >= 1")
    return f"ppt/slides/slide{slide_number}.xml"


def member_hashes(pptx_path: Path) -> dict[str, str]:
    """Map every package part name to the sha256 of its decompressed content."""
    hashes: dict[str, str] = {}
    with zipfile.ZipFile(pptx_path, "r") as package:
        for info in package.infolist():
            if info.is_dir():
                continue
            hashes[info.filename] = hashlib.sha256(package.read(info.filename)).hexdigest()
    return hashes


_SLIDE_PART_RE = re.compile(r"ppt/slides/slide(\d+)\.xml$")
_TEXT_RUN_RE = re.compile(r"<a:t[^>]*>(.*?)</a:t>", re.S)


def slide_texts(pptx_path: Path) -> dict[int, list[str]]:
    """Extract the visible ``<a:t>`` text runs per slide, keyed by 1-based index.

    Used to let a user pick a slide and see what is on it before editing.
    """
    result: dict[int, list[str]] = {}
    with zipfile.ZipFile(pptx_path, "r") as package:
        for info in package.infolist():
            match = _SLIDE_PART_RE.search(info.filename)
            if not match:
                continue
            xml = package.read(info.filename).decode("utf-8", errors="replace")
            texts = [text.strip() for text in _TEXT_RUN_RE.findall(xml)]
            result[int(match.group(1))] = [text for text in texts if text]
    return dict(sorted(result.items()))


def patch_slide_xml(
    source: Path,
    output: Path,
    slide_number: int,
    edit_fn: EditFn,
) -> dict:
    """Write ``output`` from ``source`` editing only ``ppt/slides/slideN.xml``.

    Every other part is copied verbatim (same content bytes). Returns a small
    report describing which part was rewritten.
    """
    target = slide_part_name(slide_number)
    rewritten: list[str] = []

    with zipfile.ZipFile(source, "r") as src, zipfile.ZipFile(
        output, "w", zipfile.ZIP_DEFLATED
    ) as dst:
        names = [info.filename for info in src.infolist() if not info.is_dir()]
        if target not in names:
            raise FileNotFoundError(
                f"{target} not found in {source.name}; "
                f"deck has slides: {sorted(n for n in names if n.startswith('ppt/slides/slide'))}"
            )
        for name in names:
            content = src.read(name)
            if name == target:
                edited = edit_fn(content.decode("utf-8"))
                content = edited.encode("utf-8")
                rewritten.append(name)
            dst.writestr(name, content)

    return {"source": str(source), "output": str(output), "rewritten": rewritten}


def replace_text(replacements: dict[str, str]) -> EditFn:
    """Build an edit_fn that replaces text inside ``<a:t>`` runs of one slide.

    Replacement happens on the run text only; the surrounding shape structure,
    formatting and every other run on the slide are left intact.
    """
    if not replacements:
        raise ValueError("replacements must not be empty")

    def _edit(xml_text: str) -> str:
        root = ET.fromstring(xml_text)
        changed = False
        for elem in root.iter(_TEXT_TAG):
            if elem.text:
                for old, new in replacements.items():
                    if old in elem.text:
                        elem.text = elem.text.replace(old, new)
                        changed = True
        # Idempotent safety: if nothing matched, leave the named slide
        # byte-identical too — we only touch what we actually change.
        if not changed:
            return xml_text
        return ET.tostring(root, encoding="unicode", xml_declaration=False)

    return _edit


def fidelity_report(
    source: Path,
    edited: Path,
    expected_changed: Iterable[str],
) -> dict:
    """Compare two packages part-by-part and verify only expected parts changed.

    ``ok`` is True when the set of changed parts equals ``expected_changed`` and
    no parts were added or removed. This is the byte-level preservation gate.
    """
    before = member_hashes(source)
    after = member_hashes(edited)

    expected = set(expected_changed)
    changed = {name for name in before if name in after and before[name] != after[name]}
    added = set(after) - set(before)
    removed = set(before) - set(after)
    unchanged = {name for name in before if name in after and before[name] == after[name]}

    unexpected_changed = changed - expected
    missing_expected = expected - changed

    return {
        "ok": not unexpected_changed and not missing_expected and not added and not removed,
        "changed": sorted(changed),
        "expected_changed": sorted(expected),
        "unexpected_changed": sorted(unexpected_changed),
        "missing_expected": sorted(missing_expected),
        "added": sorted(added),
        "removed": sorted(removed),
        "unchanged_count": len(unchanged),
        "total_parts": len(before),
    }


def _parse_replacements(pairs: list[str]) -> dict[str, str]:
    result: dict[str, str] = {}
    for pair in pairs:
        if "=" not in pair:
            raise SystemExit(f"--replace expects OLD=NEW, got: {pair!r}")
        old, new = pair.split("=", 1)
        if not old:
            raise SystemExit(f"--replace OLD must not be empty: {pair!r}")
        result[old] = new
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Package-preserving single-slide PPTX editor."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--slide", type=int, required=True, help="1-based slide number to edit")
    parser.add_argument(
        "--replace",
        action="append",
        default=[],
        metavar="OLD=NEW",
        help="text replacement inside the named slide; repeatable",
    )
    parser.add_argument("--report", type=Path, help="write a fidelity report JSON here")
    args = parser.parse_args(argv)

    replacements = _parse_replacements(args.replace)
    target = slide_part_name(args.slide)
    patch_slide_xml(args.source, args.output, args.slide, replace_text(replacements))

    report = fidelity_report(args.source, args.output, {target})
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # CLI safety gate: at most the named slide may change, and no part may be
    # added or removed. A no-match (nothing changed) is a success, not a fault.
    safe = (
        not report["unexpected_changed"]
        and not report["added"]
        and not report["removed"]
    )
    if not safe:
        print("[FIDELITY VIOLATION]", file=sys.stderr)
        print(json.dumps(report, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

    if report["changed"]:
        print(
            f"[OK] edited slide {args.slide}; changed={report['changed']} "
            f"unchanged_parts={report['unchanged_count']}"
        )
    else:
        print(
            f"[OK] no matching text on slide {args.slide}; output is byte-identical "
            f"to source (unchanged_parts={report['unchanged_count']})"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
