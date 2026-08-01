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
    python3 scripts/preserve_edit_pptx.py --list <source.pptx>
    python3 scripts/preserve_edit_pptx.py <source.pptx> <output.pptx> \
        --slide 2 --replace "旧结论=新结论" [--report report.json]
    python3 scripts/preserve_edit_pptx.py <source.pptx> <output.pptx> \
        --slide 1 --op '{"op":"style_text","size":24,"bold":true}'
    python3 scripts/preserve_edit_pptx.py <source.pptx> <output.pptx> \
        --edits edits.json
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


def _table_previews_from_xml(xml_text: str) -> list[dict]:
    """Return compact table previews from one slide XML."""
    tbl_tag = f"{{{_A_NS}}}tbl"
    tr_tag = f"{{{_A_NS}}}tr"
    tc_tag = f"{{{_A_NS}}}tc"
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    previews: list[dict] = []
    for tbl in root.iter(tbl_tag):
        rows: list[list[str]] = []
        for tr in tbl.findall(tr_tag):
            cells = []
            for tc in tr.findall(tc_tag):
                bits = [
                    (node.text or "").strip()
                    for node in tc.iter(_TEXT_TAG)
                    if (node.text or "").strip()
                ]
                cells.append(" ".join(bits))
            if any(cells):
                rows.append(cells)
        if rows:
            previews.append(
                {
                    "rowCount": len(rows),
                    "colCount": max(len(r) for r in rows),
                    "rows": rows[:6],
                }
            )
    return previews


def _chart_previews_for_slide(pptx_path: Path, slide_number: int) -> list[dict]:
    """Return compact chart value previews for charts linked from a slide."""
    # chart_parts_for_slide / _C_NS are defined later; resolve at call time.
    chart_ns = "http://schemas.openxmlformats.org/drawingml/2006/chart"
    parts = chart_parts_for_slide(pptx_path, slide_number)
    previews: list[dict] = []
    for index, part in enumerate(parts, start=1):
        raw = part_text(pptx_path, part)
        if not raw:
            continue
        try:
            root = ET.fromstring(raw)
        except ET.ParseError:
            continue
        values: list[str] = []
        for node in root.iter(f"{{{chart_ns}}}v"):
            text = (node.text or "").strip()
            if text:
                values.append(text)
        previews.append(
            {
                "chart": index,
                "part": part,
                "sampleValues": values[:12],
                "valueCount": len(values),
            }
        )
    return previews


def inspect_deck(pptx_path: Path) -> dict:
    """Rich inspect: texts plus table/chart previews per slide (stdlib only)."""
    pptx_path = Path(pptx_path)
    texts = slide_texts(pptx_path)
    slides: list[dict] = []
    for number, runs in texts.items():
        xml = slide_xml(pptx_path, number) or ""
        slides.append(
            {
                "slide": number,
                "texts": runs,
                "tables": _table_previews_from_xml(xml) if xml else [],
                "charts": _chart_previews_for_slide(pptx_path, number),
            }
        )
    return {
        "source": str(pptx_path),
        "sourcePath": str(pptx_path),
        "slide_count": len(slides),
        "slideCount": len(slides),
        "slides": slides,
    }


_NL_SLIDE_RE = re.compile(
    r"(?:第\s*(\d+)\s*页|slide\s*(\d+)|p\.?\s*(\d+))",
    re.I,
)
_NL_REPLACE_RES = (
    re.compile(r"[「『\"“']([^」』\"”']+)[」』\"”']\s*(?:改成|改为|换成|→|->|=)\s*[「『\"“']?([^」』\"”'\n,，;；]+)[」』\"”']?"),
    re.compile(r"把\s*[「『\"“']?([^」』\"”'\n]+?)[」』\"”']?\s*(?:改成|改为|换成)\s*[「『\"“']?([^」』\"”'\n,，;；]+)[」』\"”']?"),
    re.compile(r"([^\s,，;；→\-=]{1,40}?)\s*(?:改成|改为|换成|→|->)\s*([^\s,，;；]{1,40})"),
)


def parse_nl_edit_plan(instruction: str, default_slide: int | None = None) -> list[dict]:
    """Parse a short Chinese/English revise instruction into preserve edits.

    Supports patterns like:
      - 第3页的「Q2」改成「Q3」
      - 第1页 Q2 改成 Q3，第4页 线上 改成 线上渠道
      - slide 2: old -> new
    Returns ``[{slide, replacements}]`` (may be empty if nothing matched).
    """
    text = (instruction or "").strip()
    if not text:
        return []

    # Split on Chinese/English separators while keeping slide markers attached.
    chunks = re.split(r"[;；\n]+|(?=\s*第\s*\d+\s*页)|(?=\s*slide\s*\d+)", text, flags=re.I)
    chunks = [c.strip(" ,，") for c in chunks if c and c.strip(" ,，")]
    if not chunks:
        chunks = [text]

    edits: list[dict] = []
    for chunk in chunks:
        slide = default_slide
        slide_match = _NL_SLIDE_RE.search(chunk)
        if slide_match:
            slide = int(next(g for g in slide_match.groups() if g))
        remainder = _NL_SLIDE_RE.sub(" ", chunk)
        remainder = re.sub(r"的\s*", " ", remainder).strip(" :：,，")
        old = new = None
        for pattern in _NL_REPLACE_RES:
            m = pattern.search(remainder)
            if m:
                old, new = m.group(1).strip(), m.group(2).strip()
                break
        if not old or new is None or slide is None:
            continue
        # Merge into existing slide entry when possible.
        for edit in edits:
            if edit["slide"] == slide:
                edit["replacements"][old] = new
                break
        else:
            edits.append({"slide": slide, "replacements": {old: new}})
    return edits


def slide_xml(pptx_path: Path, slide_number: int) -> str | None:
    """Return the raw XML of one slide part, or None if the slide is absent."""
    name = slide_part_name(slide_number)
    with zipfile.ZipFile(pptx_path, "r") as package:
        names = {info.filename for info in package.infolist()}
        if name not in names:
            return None
        return package.read(name).decode("utf-8", errors="replace")


def part_text(pptx_path: Path, part_name: str) -> str | None:
    """Return the decoded text of an arbitrary package part, or None if absent."""
    with zipfile.ZipFile(pptx_path, "r") as package:
        names = {info.filename for info in package.infolist()}
        if part_name not in names:
            return None
        return package.read(part_name).decode("utf-8", errors="replace")


def patch_parts(
    source: Path,
    output: Path,
    part_edits: dict[str, EditFn],
) -> dict:
    """Write ``output`` from ``source`` re-serializing only the named parts.

    ``part_edits`` maps a package part name to an edit_fn applied to that part's
    decoded XML. Every part not in the mapping is copied verbatim (same content
    bytes), so the byte-level preservation guarantee holds for all of them; an
    edit_fn that returns its input unchanged leaves that part byte-identical too.
    """
    rewritten: list[str] = []
    with zipfile.ZipFile(source, "r") as src, zipfile.ZipFile(
        output, "w", zipfile.ZIP_DEFLATED
    ) as dst:
        names = [info.filename for info in src.infolist() if not info.is_dir()]
        missing = [part for part in part_edits if part not in names]
        if missing:
            slides = sorted(n for n in names if n.startswith("ppt/slides/slide"))
            raise FileNotFoundError(
                f"parts not found in {source.name}: {missing}; "
                f"deck has slides: {slides} (run --list to see each slide's text)"
            )
        for name in names:
            raw = src.read(name)
            if name in part_edits:
                text = raw.decode("utf-8")
                edited = part_edits[name](text)
                if edited != text:
                    rewritten.append(name)
                raw = edited.encode("utf-8")
            dst.writestr(name, raw)
    return {"source": str(source), "output": str(output), "rewritten": rewritten}


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
    with zipfile.ZipFile(source, "r") as src:
        names = {info.filename for info in src.infolist() if not info.is_dir()}
    if target not in names:
        raise FileNotFoundError(
            f"{target} not found in {source.name}; "
            f"deck has slides: {sorted(n for n in names if n.startswith('ppt/slides/slide'))}"
        )
    return patch_parts(source, output, {target: edit_fn})


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
        before = ET.fromstring(xml_text)
        root = ET.fromstring(xml_text)
        for op in operations:
            _OP_DISPATCH[op["op"]](root, op)
        out = ET.tostring(root, encoding="unicode", xml_declaration=False)
        # Idempotent safety: if the re-serialized result is identical to the
        # re-serialized input, no op actually changed anything. Return the
        # original bytes so the named part stays byte-identical too — only
        # touch what we really change.
        if out == ET.tostring(before, encoding="unicode", xml_declaration=False):
            return xml_text
        return out

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


# ---------------------------------------------------------------------------
# Chart editing. Charts live in their own parts (ppt/charts/chartN.xml),
# referenced from a slide via a graphicFrame -> c:chart r:id -> slide rels.
# Editing a chart therefore re-serializes the chart part, not the slide part;
# build_part_edits() composes the per-part edit_fns so patch_parts() keeps the
# byte-level guarantee for every other part (other slides, media, masters, and
# charts that are not targeted).
# ---------------------------------------------------------------------------

_C_NS = "http://schemas.openxmlformats.org/drawingml/2006/chart"
ET.register_namespace("c", _C_NS)
_R_NS = _NAMESPACES["r"]
_PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
_CHART_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart"
_CHART_GDATA_URI = "http://schemas.openxmlformats.org/drawingml/2006/chart"
_C_V = f"{{{_C_NS}}}v"
_C_SER = f"{{{_C_NS}}}ser"
_C_VAL = f"{{{_C_NS}}}val"
_C_NUMCACHE = f"{{{_C_NS}}}numCache"
_C_PT = f"{{{_C_NS}}}pt"
_A_GRAPHICDATA = f"{{{_A_NS}}}graphicData"
_C_CHART = f"{{{_C_NS}}}chart"


def _resolve_part(base_part: str, target: str) -> str:
    base_dir = base_part.rsplit("/", 1)[0]
    out: list[str] = []
    for piece in (base_dir + "/" + target).split("/"):
        if piece in ("", "."):
            continue
        if piece == "..":
            if out:
                out.pop()
        else:
            out.append(piece)
    return "/".join(out)


def chart_parts_for_slide(pptx_path: Path, slide_number: int) -> list[str]:
    """Return the chart part names referenced by a slide, in document order."""
    slide = slide_part_name(slide_number)
    rels_part = f"ppt/slides/_rels/slide{slide_number}.xml.rels"
    with zipfile.ZipFile(pptx_path, "r") as package:
        names = {info.filename for info in package.infolist()}
        if slide not in names:
            return []
        slide_xml = package.read(slide).decode("utf-8", errors="replace")
        rels_xml = package.read(rels_part).decode("utf-8", errors="replace") if rels_part in names else ""

    rel_targets: dict[str, str] = {}
    if rels_xml:
        for rel in ET.fromstring(rels_xml).findall(f"{{{_PKG_REL_NS}}}Relationship"):
            if rel.get("Type") == _CHART_REL_TYPE:
                rel_targets[rel.get("Id") or ""] = rel.get("Target") or ""

    parts: list[str] = []
    for gdata in ET.fromstring(slide_xml).iter(_A_GRAPHICDATA):
        if gdata.get("uri") != _CHART_GDATA_URI:
            continue
        chart_el = gdata.find(_C_CHART)
        if chart_el is None:
            continue
        target = rel_targets.get(chart_el.get(f"{{{_R_NS}}}id") or "")
        if target:
            parts.append(_resolve_part(slide, target))
    return parts


def _op_replace_chart_text(root, op: dict) -> bool:
    old = str(op["old"])
    new = str(op.get("new", ""))
    changed = False
    for v in root.iter(_C_V):
        if v.text and old in v.text:
            v.text = v.text.replace(old, new)
            changed = True
    return changed


def _op_set_chart_value(root, op: dict) -> bool:
    series = int(op["series"])
    point = int(op["point"])
    new_text = str(op["value"])
    sers = list(root.iter(_C_SER))
    if not 1 <= series <= len(sers):
        return False
    cache = sers[series - 1].find(f".//{_C_VAL}//{_C_NUMCACHE}")
    if cache is None:
        return False
    pts = cache.findall(_C_PT)
    target_pt = next((pt for pt in pts if pt.get("idx") == str(point - 1)), None)
    if target_pt is None and 1 <= point <= len(pts):
        target_pt = pts[point - 1]
    if target_pt is None:
        return False
    v = target_pt.find(_C_V)
    if v is None:
        v = ET.SubElement(target_pt, _C_V)
    if v.text == new_text:
        return False
    v.text = new_text
    return True


_CHART_OP_DISPATCH = {
    "replace_chart_text": _op_replace_chart_text,
    "set_chart_value": _op_set_chart_value,
}


def apply_chart_operations(operations: list[dict]) -> EditFn:
    """Build an idempotent edit_fn applying chart-part operations."""
    if not operations:
        raise ValueError("chart operations must not be empty")
    for index, op in enumerate(operations):
        if not isinstance(op, dict) or op.get("op") not in _CHART_OP_DISPATCH:
            raise ValueError(f"chart operations[{index}] has unknown or missing 'op'")

    def _edit(xml_text: str) -> str:
        root = ET.fromstring(xml_text)
        changed = False
        for op in operations:
            if _CHART_OP_DISPATCH[op["op"]](root, op):
                changed = True
        if not changed:
            return xml_text
        return ET.tostring(root, encoding="unicode", xml_declaration=False)

    return _edit


def build_part_edits(
    pptx_path: Path, slide_number: int, operations: list[dict]
) -> dict[str, EditFn]:
    """Split a slide edit's operations into per-part edit_fns (slide + its charts)."""
    slide_ops = [op for op in operations if op.get("op") in _OP_DISPATCH]
    chart_ops = [op for op in operations if op.get("op") in _CHART_OP_DISPATCH]
    unknown = [
        op.get("op")
        for op in operations
        if op.get("op") not in _OP_DISPATCH and op.get("op") not in _CHART_OP_DISPATCH
    ]
    if unknown:
        raise ValueError(f"unknown operation(s): {unknown}")
    if not slide_ops and not chart_ops:
        raise ValueError("no operations supplied")

    part_edits: dict[str, EditFn] = {}
    if slide_ops:
        part_edits[slide_part_name(slide_number)] = apply_operations(slide_ops)
    if chart_ops:
        parts = chart_parts_for_slide(pptx_path, slide_number)
        groups: dict[str, list[dict]] = {}
        for op in chart_ops:
            match = op.get("chart", "all")
            if match == "all":
                targets = parts
            else:
                idx = int(match) - 1
                if not 0 <= idx < len(parts):
                    raise ValueError(
                        f"chart index {match} out of range (slide {slide_number} has {len(parts)} chart(s))"
                    )
                targets = [parts[idx]]
            for part in targets:
                groups.setdefault(part, []).append(op)
        for part, ops_for_part in groups.items():
            part_edits[part] = apply_chart_operations(ops_for_part)
    return part_edits


def summarize_chart_changes(before_xml: str, after_xml: str) -> list[str]:
    before = [node.text or "" for node in ET.fromstring(before_xml).iter(_C_V)]
    after = [node.text or "" for node in ET.fromstring(after_xml).iter(_C_V)]
    changed = sum(1 for a, b in zip(before, after) if a != b)
    return [f"{changed} chart value(s) changed"] if changed else []


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


def _svg_escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _svg_lines(lines: list[str], limit: int = 3, width: int = 28) -> list[str]:
    out: list[str] = []
    for raw in lines:
        text = (raw or "").strip()
        if not text:
            continue
        if len(text) > width:
            text = text[: width - 1] + "…"
        out.append(_svg_escape(text))
        if len(out) >= limit:
            break
    return out or ["(empty)"]


def build_trust_card_svg(
    *,
    safe: bool,
    slide: int,
    before_lines: list[str],
    after_lines: list[str],
    change_lines: list[str],
    unchanged_count: int,
    total_parts: int,
) -> str:
    """Stdlib-only before/after trust card (always available, no LibreOffice)."""
    before = _svg_lines(before_lines)
    after = _svg_lines(after_lines)
    changes = " · ".join(_svg_escape(line) for line in change_lines[:3]) or "no text delta"
    if len(changes) > 90:
        changes = changes[:89] + "…"
    status = "SAFE" if safe else "CHECK"
    status_color = "#16A34A" if safe else "#DC2626"
    ratio = f"{unchanged_count}/{total_parts}"
    before_tspans = "".join(
        f'<tspan x="56" dy="{"0" if i == 0 else "26"}">{line}</tspan>' for i, line in enumerate(before)
    )
    after_tspans = "".join(
        f'<tspan x="514" dy="{"0" if i == 0 else "26"}">{line}</tspan>' for i, line in enumerate(after)
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="960" height="420" viewBox="0 0 960 420" role="img">
  <rect width="960" height="420" fill="#F8F6F1"/>
  <text x="36" y="42" fill="#EA580C" font-size="18" font-weight="700" font-family="system-ui,PingFang SC,Microsoft YaHei,sans-serif">保真改稿 · trust card</text>
  <text x="36" y="72" fill="#6B7280" font-size="14" font-family="system-ui,sans-serif">slide {slide} · {ratio} package parts unchanged</text>
  <rect x="36" y="96" width="430" height="210" rx="18" fill="#FFFFFF" stroke="#E5E0D6"/>
  <text x="56" y="128" fill="#9CA3AF" font-size="13" font-weight="700" font-family="system-ui,sans-serif">BEFORE</text>
  <text x="56" y="168" fill="#1F2937" font-size="18" font-weight="600" font-family="system-ui,PingFang SC,Microsoft YaHei,sans-serif">{before_tspans}</text>
  <rect x="494" y="96" width="430" height="210" rx="18" fill="#FFF7ED" stroke="#FDBA74"/>
  <text x="514" y="128" fill="#EA580C" font-size="13" font-weight="700" font-family="system-ui,sans-serif">AFTER</text>
  <text x="514" y="168" fill="#9A3412" font-size="18" font-weight="600" font-family="system-ui,PingFang SC,Microsoft YaHei,sans-serif">{after_tspans}</text>
  <rect x="36" y="328" width="888" height="60" rx="14" fill="#FFFFFF" stroke="#E5E0D6"/>
  <text x="56" y="354" fill="{status_color}" font-size="16" font-weight="800" font-family="system-ui,sans-serif">{status}</text>
  <text x="56" y="376" fill="#6B7280" font-size="13" font-family="system-ui,PingFang SC,Microsoft YaHei,sans-serif">{changes}</text>
</svg>
"""


def write_trust_preview(
    source: Path,
    output: Path,
    result: dict,
    *,
    real: bool | None = None,
) -> dict:
    """Write trust-card SVG (+ optional real PNG) next to the repaired deck.

    Returns a preview dict for CLI/desktop UI. SVG is always free and instant.
    Real pixel render is optional (LibreOffice + rasterizer via ppt_render) and
    defaults to off unless ``real=True`` or env ``PRESERVE_REAL_PREVIEW=1``, so
    desktop save stays snappy.
    """
    import os

    slides = result.get("requested_slides") or []
    slide = int(slides[0]) if slides else 1
    before_lines = (slide_texts(source).get(slide) or [])[:4]
    after_lines = (slide_texts(output).get(slide) or [])[:4]
    change_map = result.get("slide_changes") or {}
    change_lines = change_map.get(slide) or change_map.get(str(slide)) or []
    if not isinstance(change_lines, list):
        change_lines = [str(change_lines)]

    svg = build_trust_card_svg(
        safe=bool(result.get("safe")),
        slide=slide,
        before_lines=before_lines,
        after_lines=after_lines,
        change_lines=[str(line) for line in change_lines],
        unchanged_count=int(result.get("unchanged_count") or 0),
        total_parts=int(result.get("total_parts") or 0),
    )
    svg_path = output.with_name(f"{output.stem}-before-after.svg")
    svg_path.write_text(svg, encoding="utf-8")

    preview: dict = {
        "kind": "svg",
        "slide": slide,
        "svgPath": str(svg_path),
        "svg": svg,
        "pngPath": None,
        "backend": None,
        "label": "vector trust card",
    }

    want_real = real if real is not None else os.environ.get("PRESERVE_REAL_PREVIEW", "0") == "1"
    if not want_real:
        return preview

    # Optional real render — never fail the edit if rendering is unavailable.
    try:
        scripts_dir = Path(__file__).resolve().parent
        if str(scripts_dir) not in sys.path:
            sys.path.insert(0, str(scripts_dir))
        import ppt_render  # type: ignore

        backend = ppt_render.backend()
        if backend:
            png_path = output.with_name(f"{output.stem}-before-after.png")
            caption = (
                f"{result.get('unchanged_count', 0)}/{result.get('total_parts', 0)} "
                "package parts unchanged"
            )
            ok = ppt_render.render_slide_diff_png(source, output, slide, png_path, caption)
            if ok and png_path.is_file():
                preview.update(
                    {
                        "kind": "png",
                        "pngPath": str(png_path),
                        "backend": backend,
                        "label": "real render",
                    }
                )
    except Exception:
        pass
    return preview


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


def _operations_from_edit(edit: dict, index: int = 0) -> tuple[int, list[dict]]:
    """Normalize one edit dict into ``(slide_number, operations)``."""
    if not isinstance(edit, dict):
        raise ValueError(f"edits[{index}] must be an object")
    slide = edit.get("slide")
    if not isinstance(slide, int) or isinstance(slide, bool) or slide < 1:
        raise ValueError(f"edits[{index}].slide must be a positive integer")
    operations: list[dict] = []
    replacements = edit.get("replacements")
    if isinstance(replacements, dict):
        for key, value in replacements.items():
            if str(key):
                operations.append({"op": "replace_text", "old": str(key), "new": str(value)})
    extra = edit.get("operations")
    if isinstance(extra, list):
        operations.extend(extra)
    if not operations:
        raise ValueError(f"edits[{index}] needs non-empty replacements or operations")
    return slide, operations


def apply_edits(
    source: Path,
    output: Path,
    edits: list[dict],
) -> dict:
    """Apply multi-slide package-preserving edits and return a fidelity summary.

    Each edit is ``{"slide": N, "replacements": {old: new}, "operations": [...]}``.
    Only the package parts required by those edits are re-serialized; everything
    else is copied byte-for-byte. The returned dict is the shared contract used by
    the CLI, MCP server, and desktop worker:

    ``safe``, ``output``, ``changed``, ``unexpected_changed``, ``added``,
    ``removed``, ``unchanged_count``, ``requested_slides``, ``slide_changes``,
    ``total_parts``.
    """
    source = Path(source)
    output = Path(output)
    if not source.is_file():
        raise FileNotFoundError(f"source PPTX not found: {source}")
    if output.resolve() == source.resolve():
        raise ValueError("output path must differ from source path")
    if not isinstance(edits, list) or not edits:
        raise ValueError("edits must be a non-empty list")

    output.parent.mkdir(parents=True, exist_ok=True)

    requested: set[int] = set()
    intended_parts: set[str] = set()
    slide_parts_map: dict[int, list[str]] = {}
    intermediates: list[Path] = []
    current = source
    try:
        for index, edit in enumerate(edits):
            slide, operations = _operations_from_edit(edit, index)
            requested.add(slide)
            last = index == len(edits) - 1
            target = output if last else output.with_name(f".{output.stem}.preserve{index}.pptx")
            if not last:
                intermediates.append(target)
            part_edits = build_part_edits(current, slide, operations)
            intended_parts.update(part_edits.keys())
            slide_parts_map.setdefault(slide, []).extend(part_edits.keys())
            patch_parts(current, target, part_edits)
            current = target
    finally:
        for temp in intermediates:
            try:
                temp.unlink()
            except OSError:
                pass

    before = member_hashes(source)
    after = member_hashes(output)
    changed = sorted(name for name in before if name in after and before[name] != after[name])
    added = sorted(set(after) - set(before))
    removed = sorted(set(before) - set(after))
    unexpected = [name for name in changed if name not in intended_parts]
    safe = not unexpected and not added and not removed
    unchanged = sum(1 for name in before if name in after and before[name] == after[name])

    slide_changes: dict[int, list[str]] = {}
    for slide in sorted(requested):
        delta: list[str] = []
        before_xml = slide_xml(source, slide)
        after_xml = slide_xml(output, slide)
        if before_xml is not None and after_xml is not None:
            delta.extend(summarize_changes(before_xml, after_xml))
        for part in slide_parts_map.get(slide, []):
            if part.startswith("ppt/charts/"):
                cb = part_text(source, part)
                ca = part_text(output, part)
                if cb is not None and ca is not None:
                    delta.extend(summarize_chart_changes(cb, ca))
        if delta:
            slide_changes[slide] = delta

    return {
        "safe": safe,
        "status": "ok" if safe else "fidelity-violation",
        "no_op": not changed,
        "output": str(output),
        "changed": changed,
        "expected_changed": sorted(intended_parts),
        "unexpected_changed": unexpected,
        "added": added,
        "removed": removed,
        "unchanged_count": unchanged,
        "total_parts": len(before),
        "requested_slides": sorted(requested),
        "slide_changes": slide_changes,
    }


def inspect_pptx(source: Path) -> dict:
    """Return slide count and per-slide text/table/chart previews for CLI / tooling."""
    return inspect_deck(Path(source))


def _load_edits_file(path: Path) -> list[dict]:
    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
    except OSError as exc:
        raise SystemExit(f"--edits file unreadable: {path} ({exc})") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(
            f"--edits file is not valid JSON: {path} (line {exc.lineno}, column {exc.colno}: {exc.msg})"
        ) from exc
    if isinstance(data, dict) and "edits" in data:
        data = data["edits"]
    if not isinstance(data, list) or not data:
        raise SystemExit(f"--edits must be a non-empty JSON array (or {{edits:[...]}}): {path}")
    return data


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Package-preserving PPTX editor: change only the slides you name, "
            "keep every other package part byte-for-byte identical."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  %(prog)s --list deck.pptx\n"
            "  %(prog)s deck.pptx out.pptx --slide 1 --replace 'Q2=Q3'\n"
            "  %(prog)s deck.pptx out.pptx --slide 2 --op '{\"op\":\"style_text\",\"size\":24}'\n"
            "  %(prog)s deck.pptx out.pptx --edits edits.json\n"
        ),
    )
    parser.add_argument(
        "--list",
        dest="list_source",
        type=Path,
        metavar="PPTX",
        help="inspect slides and visible text, then exit",
    )
    parser.add_argument("source", type=Path, nargs="?", help="source .pptx")
    parser.add_argument("output", type=Path, nargs="?", help="output .pptx (never overwrites source)")
    parser.add_argument("--slide", type=int, help="1-based slide number to edit (single-slide mode)")
    parser.add_argument(
        "--replace",
        action="append",
        default=[],
        metavar="OLD=NEW",
        help="text replacement on --slide; repeatable",
    )
    parser.add_argument(
        "--op",
        action="append",
        default=[],
        metavar="JSON",
        help="one typed operation JSON object for --slide; repeatable",
    )
    parser.add_argument(
        "--edits",
        type=Path,
        metavar="FILE",
        help="JSON file of multi-slide edits: [{slide, replacements?, operations?}, ...]",
    )
    parser.add_argument("--report", type=Path, help="write a fidelity report JSON here")
    parser.add_argument(
        "--preview",
        action="store_true",
        help="write before/after trust card SVG (and real PNG if LibreOffice is available)",
    )
    args = parser.parse_args(argv)

    if args.list_source is not None:
        source = args.list_source
        if not source.is_file():
            print(f"source not found: {source}", file=sys.stderr)
            return 2
        try:
            info = inspect_pptx(source)
        except zipfile.BadZipFile:
            print(
                f"[ERROR] {source} is not a valid .pptx (bad zip). "
                "Only real PowerPoint/WPS .pptx files are supported.",
                file=sys.stderr,
            )
            return 2
        print(f"slides: {info['slide_count']}")
        for item in info["slides"]:
            preview = " | ".join(item["texts"][:6]) if item["texts"] else "(no text)"
            print(f"  {item['slide']}: {preview}")
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
        return 0

    if args.source is None or args.output is None:
        parser.error("source and output are required unless --list is used")

    edits: list[dict]
    if args.edits is not None:
        edits = _load_edits_file(args.edits)
    else:
        if args.slide is None:
            parser.error("provide --slide (with --replace/--op) or --edits FILE")
        operations: list[dict] = []
        replacements = _parse_replacements(args.replace)
        for old, new in replacements.items():
            operations.append({"op": "replace_text", "old": old, "new": new})
        for raw in args.op:
            try:
                op = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise SystemExit(f"--op must be JSON object: {exc}") from exc
            if not isinstance(op, dict) or "op" not in op:
                raise SystemExit("--op must be a JSON object with an 'op' field")
            operations.append(op)
        if not operations:
            parser.error("provide at least one --replace or --op, or use --edits")
        edits = [{"slide": args.slide, "operations": operations}]

    try:
        result = apply_edits(args.source, args.output, edits)
    except zipfile.BadZipFile:
        print(
            f"[ERROR] {args.source} is not a valid .pptx (bad zip). "
            "Only real PowerPoint/WPS .pptx files are supported.",
            file=sys.stderr,
        )
        return 2
    except (OSError, ValueError, FileNotFoundError) as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 2

    preview = None
    if args.preview and result.get("safe"):
        try:
            preview = write_trust_preview(args.source, args.output, result, real=True)
            result["preview"] = preview
        except Exception as exc:  # noqa: BLE001
            print(f"[WARN] preview failed: {exc}", file=sys.stderr)

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    if not result["safe"]:
        print("[FIDELITY VIOLATION]", file=sys.stderr)
        print(json.dumps(result, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

    slides = ",".join(str(s) for s in result["requested_slides"])
    if result["changed"]:
        print(
            f"[OK] edited slide(s) {slides}; changed={result['changed']} "
            f"unchanged_parts={result['unchanged_count']}/{result['total_parts']}"
        )
        for slide, lines in sorted(result["slide_changes"].items()):
            print(f"  slide {slide}: " + "; ".join(lines))
    else:
        print(
            f"[NOOP] nothing matched on slide(s) {slides}; output is byte-identical "
            f"to source (unchanged_parts={result['unchanged_count']}/{result['total_parts']}). "
            "Check the text you asked to replace actually exists (run --list to inspect).",
            file=sys.stderr,
        )
        return 3
    if preview:
        print(f"  preview={preview.get('kind')} svg={preview.get('svgPath')}")
        if preview.get("pngPath"):
            print(f"  real_png={preview['pngPath']} backend={preview.get('backend')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
