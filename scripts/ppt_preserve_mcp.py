"""Zero-dependency MCP server for preservation-first PPTX editing.

Exposes the package-preserving engine (``preserve_edit_pptx.py``) over the Model
Context Protocol (MCP) stdio transport, so any MCP-capable agent (Claude Desktop,
Cursor, Codex, Kimi, ...) can safely inspect and edit a real ``.pptx`` without
breaking the slides, logo, masters, links or media it did not touch.

No third-party packages are required: the MCP stdio transport is newline-delimited
JSON-RPC 2.0, implemented here with the standard library only. Run with::

    python3 scripts/ppt_preserve_mcp.py

All diagnostics go to stderr; stdout carries only JSON-RPC messages (the MCP spec
forbids any other stdout output).
"""

from __future__ import annotations

import importlib.util
import json
import sys
import traceback
from pathlib import Path
from typing import Any

_HERE = Path(__file__).resolve().parent

# Load the sibling engine by path so this server works however it is launched
# (script, module, or bundled) without polluting sys.path or double-importing.
_spec = importlib.util.spec_from_file_location("ppt_preserve_engine", _HERE / "preserve_edit_pptx.py")
if _spec is None or _spec.loader is None:
    raise RuntimeError("Unable to load preserve_edit_pptx.py next to this server.")
engine = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(engine)

SERVER_NAME = "ppt-preserve"
SERVER_VERSION = "1.0.0"
PROTOCOL_VERSION = "2024-11-05"

SERVER_INSTRUCTIONS = (
    "Preservation-first PowerPoint editing. Use these tools to inspect and edit an "
    "EXISTING branded .pptx at the object level. Edit ONLY the slides the user "
    "names; every other package part (untouched slides, logo, masters, layouts, "
    "themes, media, links) is kept byte-for-byte identical. Never regenerate or "
    "round-trip the whole deck to make a local change. Treat the fidelity report "
    "from edit_pptx_preserving as a hard gate: if it is not safe (an unexpected "
    "part changed, or a part was added or removed), do NOT claim success - report "
    "the violation to the user."
)

TOOLS: list[dict[str, Any]] = [
    {
        "name": "inspect_pptx",
        "description": (
            "List the slides of an existing .pptx with the visible text on each "
            "slide. Call this first so you know what is on each slide before "
            "editing. Returns slideCount and per-slide text previews."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "source_path": {
                    "type": "string",
                    "description": "Absolute path to an existing .pptx file.",
                }
            },
            "required": ["source_path"],
        },
    },
    {
        "name": "edit_pptx_preserving",
        "description": (
            "Edit ONLY the named slides of an existing .pptx, keeping every other "
            "package part byte-for-byte identical (logo, masters, links, untouched "
            "slides). Each edit can use simple `replacements` (text find/replace) "
            "and/or typed `operations`: style_text (font/size/bold/color), "
            "replace_table_cell, set_shape_geometry (move/resize in points). Writes "
            "a new .pptx and returns a fidelity report plus a per-slide change "
            "summary. If the report is not safe, the edit failed."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "source_path": {"type": "string", "description": "Absolute path to the source .pptx."},
                "edits": {
                    "type": "array",
                    "description": "One entry per slide to change.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "slide": {"type": "integer", "description": "1-based slide number."},
                            "replacements": {
                                "type": "object",
                                "description": "Simple map of original text -> replacement text for that slide.",
                                "additionalProperties": {"type": "string"},
                            },
                            "operations": {
                                "type": "array",
                                "description": (
                                    "Typed slide-local operations. replace_text {op,old,new}; "
                                    "style_text {op, match?, font?, size?, bold?, color?} (match is 'all' "
                                    "or {text_contains|text_equals}); replace_table_cell {op, row?, col?, "
                                    "find?|old?, text?|new?}; set_shape_geometry {op, match, x?, y?, w?, "
                                    "h?} (match is {index|name|text_contains|text_equals}; geometry in points)."
                                ),
                                "items": {"type": "object"},
                            },
                        },
                        "required": ["slide"],
                    },
                },
                "output_path": {
                    "type": "string",
                    "description": "Optional output path; defaults to <source>-repaired.pptx.",
                },
            },
            "required": ["source_path", "edits"],
        },
    },
]


def _text_result(text: str, is_error: bool = False) -> dict[str, Any]:
    return {"content": [{"type": "text", "text": text}], "isError": is_error}


def tool_inspect_pptx(args: dict[str, Any]) -> dict[str, Any]:
    source = Path(str(args["source_path"])).expanduser()
    if not source.is_file():
        return _text_result(f"source file not found: {source}", is_error=True)
    texts = engine.slide_texts(source)
    lines = [f"slideCount: {len(texts)}"]
    for num, runs in texts.items():
        preview = " | ".join(runs[:4]) if runs else "(no text)"
        lines.append(f"- slide {num}: {preview}")
    return _text_result("\n".join(lines))


def tool_edit_pptx_preserving(args: dict[str, Any]) -> dict[str, Any]:
    source = Path(str(args["source_path"])).expanduser()
    if not source.is_file():
        return _text_result(f"source file not found: {source}", is_error=True)
    edits = args.get("edits") or []
    if not isinstance(edits, list) or not edits:
        return _text_result("edits must be a non-empty array", is_error=True)

    output_raw = args.get("output_path")
    output = Path(str(output_raw)).expanduser() if output_raw else source.with_name(f"{source.stem}-repaired.pptx")
    if output.resolve() == source.resolve():
        return _text_result("output_path must differ from source_path", is_error=True)
    output.parent.mkdir(parents=True, exist_ok=True)

    requested: set[int] = set()
    intermediates: list[Path] = []
    current = source
    try:
        for index, edit in enumerate(edits):
            slide = int(edit["slide"])
            operations: list[dict[str, Any]] = []
            for k, v in (edit.get("replacements") or {}).items():
                if str(k):
                    operations.append({"op": "replace_text", "old": str(k), "new": str(v)})
            extra = edit.get("operations")
            if isinstance(extra, list):
                operations.extend(extra)
            if not operations:
                return _text_result(f"edits[{index}] needs replacements or operations", is_error=True)
            requested.add(slide)
            last = index == len(edits) - 1
            target = output if last else output.with_name(f".{output.stem}.preserve{index}.pptx")
            if not last:
                intermediates.append(target)
            engine.patch_slide_xml(current, target, slide, engine.apply_operations(operations))
            current = target
    except Exception as exc:  # noqa: BLE001
        return _text_result(f"edit failed: {exc}", is_error=True)
    finally:
        for temp in intermediates:
            with _suppress_oserror():
                temp.unlink()

    before = engine.member_hashes(source)
    after = engine.member_hashes(output)
    changed = sorted(name for name in before if name in after and before[name] != after[name])
    added = sorted(set(after) - set(before))
    removed = sorted(set(before) - set(after))
    requested_parts = {engine.slide_part_name(slide) for slide in requested}
    unexpected = [name for name in changed if name not in requested_parts]
    safe = not unexpected and not added and not removed
    unchanged = sum(1 for name in before if name in after and before[name] == after[name])

    slide_changes: dict[int, list[str]] = {}
    for slide in sorted(requested):
        before_xml = engine.slide_xml(source, slide)
        after_xml = engine.slide_xml(output, slide)
        if before_xml is not None and after_xml is not None:
            delta = engine.summarize_changes(before_xml, after_xml)
            if delta:
                slide_changes[slide] = delta

    summary = [
        f"status: {'ok' if safe else 'FIDELITY VIOLATION'}",
        f"output: {output}",
        f"changed: {changed}",
        f"unchanged parts: {unchanged} / {len(before)}",
    ]
    if not safe:
        if unexpected:
            summary.append(f"unexpected changes: {unexpected}")
        if added:
            summary.append(f"added parts: {added}")
        if removed:
            summary.append(f"removed parts: {removed}")
        summary.append("DO NOT treat this edit as successful.")
    for slide in sorted(slide_changes):
        summary.append(f"slide {slide}: " + "; ".join(slide_changes[slide]))
    return _text_result("\n".join(summary), is_error=not safe)


class _suppress_oserror:
    def __enter__(self) -> "_suppress_oserror":
        return self

    def __exit__(self, exc_type, exc, tb) -> bool:
        return isinstance(exc, OSError)


_HANDLERS = {
    "inspect_pptx": tool_inspect_pptx,
    "edit_pptx_preserving": tool_edit_pptx_preserving,
}


def handle_request(method: str, params: dict[str, Any] | None) -> tuple[Any, dict[str, Any] | None]:
    """Resolve a JSON-RPC request to (result, error). Notifications are handled by serve()."""
    params = params or {}
    if method == "initialize":
        return {
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": {"tools": {}},
            "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            "instructions": SERVER_INSTRUCTIONS,
        }, None
    if method == "ping":
        return {}, None
    if method == "tools/list":
        return {"tools": TOOLS}, None
    if method == "tools/call":
        name = params.get("name")
        handler = _HANDLERS.get(name or "")
        if handler is None:
            return None, {"code": -32602, "message": f"unknown tool: {name}"}
        try:
            return handler(params.get("arguments") or {}), None
        except Exception as exc:  # noqa: BLE001
            return None, {"code": -32603, "message": f"{exc}\n{traceback.format_exc()}"}
    return None, {"code": -32601, "message": f"method not found: {method}"}


def _write(obj: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def serve(input_stream=None) -> None:
    """Read newline-delimited JSON-RPC messages and respond. Exposed for testing."""
    stream = input_stream if input_stream is not None else sys.stdin
    while True:
        raw = stream.readline()
        if not raw:
            break
        line = raw.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError as exc:
            _write({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": f"parse error: {exc}"}})
            continue
        msg_id = msg.get("id")
        if msg_id is None:  # notification: no response per JSON-RPC 2.0 / MCP
            continue
        result, error = handle_request(msg.get("method"), msg.get("params"))
        if error is not None:
            _write({"jsonrpc": "2.0", "id": msg_id, "error": error})
        else:
            _write({"jsonrpc": "2.0", "id": msg_id, "result": result})


def main() -> None:
    sys.stderr.write(f"[{SERVER_NAME}] MCP server ready (stdio, zero-dependency)\n")
    sys.stderr.flush()
    try:
        serve()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
