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


def slide_xml(pptx_path: Path, slide_number: int) -> str | None:
    """Return the raw XML of one slide part, or None if the slide is absent."""
    name = slide_part_name(slide_number)
    with zipfile.ZipFile(pptx_path, "r") as package:
        names = {info.filename for info in package.infolist()}
        if name not in names:
            return None
        return package.read(name).decode("utf-8", errors="replace")


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


# ---------------------------------------------------------------------------
# Typed, slide-local operations. Every op mutates only the parsed named slide,
# so the byte-level preservation guarantee (untouched parts copied verbatim by
# patch_slide_xml) still holds. Units for geometry are points (1pt = 12700 EMU).
# ---------------------------------------------------------------------------

_P_NS = _NAMESPACES["p"]
_A_R = f"{{{_A_NS}}}r"
_A_RPR = f"{{{_A_NS}}}rPr"
_A_LATIN = f"{{{_A_NS}}}latin"
_A_EA = f"{{{_A_NS}}}ea"
_A_CS = f"{{{_A_NS}}}cs"
_A_SOLIDFILL = f"{{{_A_NS}}}solidFill"
_A_SRGBCLR = f"{{{_A_NS}}}srgbClr"
_A_XFRM = f"{{{_A_NS}}}xfrm"
_A_OFF = f"{{{_A_NS}}}off"
_A_EXT = f"{{{_A_NS}}}ext"
_A_TBL = f"{{{_A_NS}}}tbl"
_A_TR = f"{{{_A_NS}}}tr"
_A_TC = f"{{{_A_NS}}}tc"
_P_SP = f"{{{_P_NS}}}sp"
_P_SPPR = f"{{{_P_NS}}}spPr"
_P_NVSPR = f"{{{_P_NS}}}nvSpPr"
_P_TXBODY = f"{{{_P_NS}}}txBody"

_EMU_PER_POINT = 12700


def _run_text(run) -> str:
    return "".join(node.text or "" for node in run.findall(_TEXT_TAG))


def _run_style_sig(run) -> tuple:
    rpr = run.find(_A_RPR)
    if rpr is None:
        return (None, None, None, None, None)
    latin = rpr.find(_A_LATIN)
    ea = rpr.find(_A_EA)
    fill = rpr.find(_A_SOLIDFILL)
    clr = fill.find(_A_SRGBCLR) if fill is not None else None
    return (
        rpr.get("sz"),
        rpr.get("b"),
        latin.get("typeface") if latin is not None else None,
        ea.get("typeface") if ea is not None else None,
        clr.get("val") if clr is not None else None,
    )


def _matches(match, text: str) -> bool:
    if match in (None, "all"):
        return True
    if isinstance(match, dict):
        if "text_equals" in match:
            return text == match["text_equals"]
        if "text_contains" in match:
            return str(match["text_contains"]) in text
    return False


def _set_typeface(rpr, font: str) -> None:
    for tag in (_A_LATIN, _A_EA, _A_CS):
        node = rpr.find(tag)
        if node is None:
            node = ET.SubElement(rpr, tag)
        node.set("typeface", font)


def _set_color(rpr, color: str) -> None:
    value = color.lstrip("#")
    fill = rpr.find(_A_SOLIDFILL)
    if fill is None:
        fill = ET.Element(_A_SOLIDFILL)
        rpr.insert(0, fill)  # fill group precedes latin/ea/cs in the schema
    clr = fill.find(_A_SRGBCLR)
    if clr is None:
        clr = ET.SubElement(fill, _A_SRGBCLR)
    clr.set("val", value)


def _op_replace_text(root, op: dict) -> None:
    old = str(op["old"])
    new = str(op.get("new", ""))
    for elem in root.iter(_TEXT_TAG):
        if elem.text and old in elem.text:
            elem.text = elem.text.replace(old, new)


def _op_style_text(root, op: dict) -> None:
    match = op.get("match", "all")
    font = op.get("font")
    size = op.get("size")
    bold = op.get("bold")
    color = op.get("color")
    for run in root.iter(_A_R):
        if not _matches(match, _run_text(run)):
            continue
        rpr = run.find(_A_RPR)
        if rpr is None:
            rpr = ET.Element(_A_RPR)
            run.insert(0, rpr)
        if size is not None:
            rpr.set("sz", str(int(round(float(size) * 100))))
        if bold is not None:
            rpr.set("b", "1" if bold else "0")
        if font:
            _set_typeface(rpr, str(font))
        if color:
            _set_color(rpr, str(color))


def _cell_text(cell) -> str:
    return "".join(node.text or "" for node in cell.iter(_TEXT_TAG))


def _set_cell_text(cell, text: str) -> None:
    runs = list(cell.iter(_TEXT_TAG))
    if not runs:
        return
    runs[0].text = text
    for extra in runs[1:]:
        extra.text = ""


def _op_replace_table_cell(root, op: dict) -> None:
    find = op.get("find", op.get("old"))
    new = op.get("text", op.get("new"))
    row = op.get("row")
    col = op.get("col")
    for table in root.iter(_A_TBL):
        rows = table.findall(_A_TR)
        if row is not None and col is not None:
            cells = rows[int(row) - 1].findall(_A_TC) if 1 <= int(row) <= len(rows) else []
            target = [cells[int(col) - 1]] if 1 <= int(col) <= len(cells) else []
        else:
            target = list(table.iter(_A_TC))
        for cell in target:
            if find is not None:
                for elem in cell.iter(_TEXT_TAG):
                    if elem.text and str(find) in elem.text:
                        elem.text = elem.text.replace(str(find), str(new))
            elif new is not None:
                _set_cell_text(cell, str(new))


def _shape_text(shape) -> str:
    body = shape.find(_P_TXBODY)
    if body is None:
        return ""
    return "".join(node.text or "" for node in body.iter(_TEXT_TAG))


def _pick_shape(shapes, match):
    if isinstance(match, dict) and "index" in match:
        index = int(match["index"]) - 1
        return shapes[index] if 0 <= index < len(shapes) else None
    if isinstance(match, dict) and "name" in match:
        name = str(match["name"])
        for shape in shapes:
            nv = shape.find(_P_NVSPR)
            c_nv_pr = nv.find(f"{{{_P_NS}}}cNvPr") if nv is not None else None
            if c_nv_pr is not None and c_nv_pr.get("name") == name:
                return shape
        return None
    text_match = match if isinstance(match, dict) else {"text_contains": match}
    for shape in shapes:
        if _matches(text_match, _shape_text(shape)):
            return shape
    return None


def _op_set_shape_geometry(root, op: dict) -> None:
    shapes = list(root.iter(_P_SP))
    shape = _pick_shape(shapes, op.get("match"))
    if shape is None:
        raise ValueError(f"set_shape_geometry: no shape matched {op.get('match')!r}")
    spr = shape.find(_P_SPPR)
    if spr is None:
        spr = ET.Element(_P_SPPR)
        nv = shape.find(_P_NVSPR)
        shape.insert(list(shape).index(nv) + 1 if nv is not None else 0, spr)
    xfrm = spr.find(_A_XFRM)
    if xfrm is None:
        xfrm = ET.Element(_A_XFRM)
        spr.insert(0, xfrm)
    off = xfrm.find(_A_OFF)
    if off is None:
        off = ET.SubElement(xfrm, _A_OFF)
    ext = xfrm.find(_A_EXT)
    if ext is None:
        ext = ET.SubElement(xfrm, _A_EXT)
    for attr, key in (("x", "x"), ("y", "y")):
        if key in op:
            off.set(attr, str(int(round(float(op[key]) * _EMU_PER_POINT))))
    for attr, key in (("cx", "w"), ("cy", "h")):
        if key in op:
            ext.set(attr, str(int(round(float(op[key]) * _EMU_PER_POINT))))


_OP_DISPATCH = {
    "replace_text": _op_replace_text,
    "style_text": _op_style_text,
    "replace_table_cell": _op_replace_table_cell,
    "set_shape_geometry": _op_set_shape_geometry,
}


def apply_operations(operations: list[dict]) -> EditFn:
    """Build an edit_fn that applies a sequence of typed, slide-local operations."""
    if not operations:
        raise ValueError("operations must not be empty")
    for index, op in enumerate(operations):
        if not isinstance(op, dict) or op.get("op") not in _OP_DISPATCH:
            raise ValueError(f"operations[{index}] has unknown or missing 'op'")

    def _edit(xml_text: str) -> str:
        root = ET.fromstring(xml_text)
        for op in operations:
            _OP_DISPATCH[op["op"]](root, op)
        return ET.tostring(root, encoding="unicode", xml_declaration=False)

    return _edit


def summarize_changes(before_xml: str, after_xml: str) -> list[str]:
    """Coarse structural diff of one slide: what text / geometry / cells changed."""
    before = ET.fromstring(before_xml)
    after = ET.fromstring(after_xml)
    summary: list[str] = []

    before_runs = [node.text or "" for node in before.iter(_TEXT_TAG)]
    after_runs = [node.text or "" for node in after.iter(_TEXT_TAG)]
    text_changes = sum(1 for a, b in zip(before_runs, after_runs) if a != b)
    if text_changes:
        summary.append(f"{text_changes} text run(s) changed")

    before_sigs = [_run_style_sig(run) for run in before.iter(_A_R)]
    after_sigs = [_run_style_sig(run) for run in after.iter(_A_R)]
    restyled = sum(1 for a, b in zip(before_sigs, after_sigs) if a != b)
    if restyled:
        summary.append(f"{restyled} run(s) restyled")

    def geoms(root):
        out = []
        for shape in root.iter(_P_SP):
            xfrm = shape.find(f".//{_A_XFRM}")
            off = xfrm.find(_A_OFF) if xfrm is not None else None
            ext = xfrm.find(_A_EXT) if xfrm is not None else None
            out.append((
                off.get("x") if off is not None else None,
                off.get("y") if off is not None else None,
                ext.get("cx") if ext is not None else None,
                ext.get("cy") if ext is not None else None,
            ))
        return out

    moved = sum(1 for a, b in zip(geoms(before), geoms(after)) if a != b)
    if moved:
        summary.append(f"{moved} shape(s) moved/resized")

    before_cells = [_cell_text(cell) for cell in before.iter(_A_TC)]
    after_cells = [_cell_text(cell) for cell in after.iter(_A_TC)]
    cell_changes = sum(1 for a, b in zip(before_cells, after_cells) if a != b)
    if cell_changes:
        summary.append(f"{cell_changes} table cell(s) changed")

    return summary


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
