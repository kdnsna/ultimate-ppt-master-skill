# Preserve-Edit · Copyable Scenario Prompts

Paste any block below to an agent with `$ultimate-ppt-master` installed (Codex / Claude Code / Cursor, etc.).
Principle: **change only the named slides/objects; leave everything else byte-for-byte intact**; report the fidelity report when done.

## 1. Business review — update numbers

```text
Use $ultimate-ppt-master to preserve-edit this PPTX (path: <your.pptx>):
1) Change "Q2" to "Q3" in the cover title;
2) On slide 4, replace the old table numbers with the new table from the attachment (edit cell text only, do not change the table structure);
3) On slide 6, change the bar chart legend "Online" to "Online channel".
Do not touch any other slides, masters, logo, notes, or hyperlinks.
Inspect first, then edit; output a new file + a fidelity report (what changed / how many parts stayed intact).
```

## 2. Client draft — swap conclusion

```text
Use $ultimate-ppt-master to preserve-edit <client-proposal.pptx>:
- Only change the conclusion paragraph on slide 2: replace "recommend delaying the launch" with "recommend a small pilot before launch";
- On the risk slide 7, reword the "red" wording to "manageable risk"; do not change colors or shapes;
- Do not re-layout, do not add/remove slides, do not regenerate the deck.
Return the editable .pptx and a change list.
```

## 3. Training deck — update data

```text
Use $ultimate-ppt-master to preserve-edit <last-term-course.pptx>:
- Slide 1 subtitle "2025 Spring" → "2026 Spring";
- Slide 5 case numbers per the table in notes.md;
- Slide 9 "Homework" paragraph replaced with the new homework text in notes.md.
Keep all other slides and the brand master as-is. Run locally; do not upload files.
```

## CLI equivalent (no agent)

```bash
python3 scripts/preserve_edit_pptx.py --list deck.pptx
python3 scripts/preserve_edit_pptx.py deck.pptx out.pptx --edits edits.json --report fidelity.json --preview
```

`--preview` writes:

- `<out>-before-after.svg`: vector trust card (always available)
- `<out>-before-after.png`: real pixel diff (when LibreOffice is present locally; CLI `--preview` attempts it)

The desktop app shows the vector trust card immediately after a successful save and writes a `.md` change memo alongside. To also generate a real PNG from the desktop, start it with `PRESERVE_REAL_PREVIEW=1`.

Natural language → plan draft:

```bash
python3 -c "from scripts.preserve_edit_pptx import parse_nl_edit_plan; import json; print(json.dumps(parse_nl_edit_plan('第1页的「Q2」改成「Q3」'), ensure_ascii=False, indent=2))"
```

## Chaining with PPTLint

1. Scan the deck with [PPTLint](https://kdnsna.github.io/pptlint/) or local pptlint
2. `python3 scripts/pptlint_to_preserve_plan.py report.json -o edits.json`
3. Review `edits.json` manually, then:
   `python3 scripts/preserve_edit_pptx.py deck.pptx fixed.pptx --edits edits.json --report fidelity.json`

See [MCP Server](./mcp-server.md) and [Product Positioning](../strategy/product-positioning.md).
