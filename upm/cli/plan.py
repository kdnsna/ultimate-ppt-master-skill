"""`upm plan`: emit canonical DeckIR JSON for CLI / Bridge / Desktop adapters."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from upm.cli.common import project_title
from upm.compiler.planner import plan_deckir, to_bridge_payload
from upm.errors import InputError


def run_plan(args: Any) -> int:
    title = project_title(args.input if hasattr(args, "input") else args.source, args.title)
    source_text = ""
    if getattr(args, "source_file", None):
        path = Path(args.source_file).expanduser()
        if not path.is_file():
            raise InputError(f"源文件不存在：{path}")
        source_text = path.read_text(encoding="utf-8", errors="replace")
    elif getattr(args, "input", None):
        # Reuse import_input semantics without creating a full project tree.
        candidate = Path(str(args.input)).expanduser()
        if candidate.is_file():
            source_text = candidate.read_text(encoding="utf-8", errors="replace")
            if not args.title:
                title = project_title(str(candidate), None)
        else:
            source_text = str(args.input)
            if not args.title:
                title = project_title(source_text, None)
    else:
        source_text = ""

    deckir = plan_deckir(
        title,
        source_text,
        page_count=args.pages,
        direction_id=args.direction,
        output_mode=args.deck_format if hasattr(args, "deck_format") else args.output_mode,
        quality_mode=args.mode,
        planner=getattr(args, "planner", None),
    )

    fmt = str(getattr(args, "format", "deckir") or "deckir")
    payload: dict[str, Any] = to_bridge_payload(deckir) if fmt == "bridge" else deckir

    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    out = getattr(args, "output", None)
    if out:
        path = Path(out).expanduser().resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        print(f"DeckIR 已写入：{path}", file=sys.stderr)
    else:
        sys.stdout.write(text)
    return 0
