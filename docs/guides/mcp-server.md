# MCP Server Guide · Preserve-Edit PPT

`scripts/ppt_preserve_mcp.py` is a **zero-dependency** MCP (Model Context Protocol) server that exposes the preserve-edit engine to any MCP-capable agent (Claude Desktop, Cursor, Codex, Kimi, Cline, etc.). It lets an agent **safely edit a real `.pptx`** — changing only the slides the user names while every other package part (untouched slides, logo, masters, layouts, theme, media, links) stays byte-for-byte intact.

It uses only the Python standard library — **no `pip install` needed**, just a local `python3`.

## Two tools

| Tool | Purpose |
|---|---|
| `inspect_pptx` | Lists the visible text of every slide in a `.pptx`. Call this first so you know what is on each slide and which slide to edit. |
| `edit_pptx_preserving` | Edits only the named slides ("original text → new text"), writes a new `.pptx`, and returns a **fidelity report**. |

`edit_pptx_preserving` arguments:

- `source_path`: absolute path to the source `.pptx`.
- `edits`: array of `{ "slide": 1-based page number, "replacements": { "old": "new" } }`.
- `output_path`: optional; defaults to `<source>-repaired.pptx`.

## Hard rule (already in the server instructions)

The fidelity report is a **gate**: if the report is not `safe` (an unrequested part changed, or a part was added/removed), the agent **must not** claim success and must report the violation honestly. The server marks the tool result as an error when the report is unsafe.

A report with status `no-op` means none of the requested text/operations matched — nothing changed. Inspect the deck and adjust the edit.

## Run

No dependencies to install; start it over stdio:

```bash
python3 /absolute/path/ultimate-ppt-master-skill/scripts/ppt_preserve_mcp.py
```

> Use an **absolute path** to the script. MCP clients do not control the working directory, so an absolute path is the most reliable.

## Client configuration

Add the snippet below to your MCP client configuration, replacing `/absolute/path/...` with your real path.

Claude Desktop (`claude_desktop_config.json`) / generic stdio clients:

```json
{
  "mcpServers": {
    "ppt-preserve": {
      "command": "python3",
      "args": ["/absolute/path/ultimate-ppt-master-skill/scripts/ppt_preserve_mcp.py"]
    }
  }
}
```

Cursor (`.cursor/mcp.json` or MCP settings):

```json
{
  "mcpServers": {
    "ppt-preserve": {
      "command": "python3",
      "args": ["/absolute/path/ultimate-ppt-master-skill/scripts/ppt_preserve_mcp.py"]
    }
  }
}
```

If your `python3` is not on `PATH`, set `command` to the absolute path of the interpreter (for example the Python in a virtualenv). The server has no third-party dependencies, so any interpreter works.

## Local-first

The server reads and writes files only in local processes — **no network, no upload**. This matches the repository's local-first stance: source files and outputs stay on your machine.

## Typical usage (prompt reference for agents)

> Use `inspect_pptx` to see what each slide says; then change "Q2" to "Q3" in the chart title on slide 5 with `edit_pptx_preserving`, and do not touch any other slide. If the fidelity report is unsafe, stop and tell me what crossed the line.
