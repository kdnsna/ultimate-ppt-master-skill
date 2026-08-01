# Ultimate PPT Master · Preserve-Edit

> **Turn real source material into a native PowerPoint** you can keep editing — and, when you already have a branded deck, **change only the slides you name** while everything else stays byte-for-byte intact.

Kimi, Gamma, and ChatGPT are already good at generating decks from scratch. This project does not compete there. Primary mode: surgical preserve-edit on an existing `.pptx`. Secondary mode: source → storyboard → editable PPTX or magazine Web Deck.

<p align="center">
  <a href="./README.md"><strong>中文</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Live Workspace</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Finished Work & Proof</strong></a> ·
  <a href="./docs/README.md"><strong>English Docs</strong></a>
</p>

<p align="center">
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/kdnsna/ultimate-ppt-master-skill?style=flat-square"></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-172033?style=flat-square"></a>
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.9"><img alt="GitHub Release v6.3.9" src="https://img.shields.io/badge/GitHub_Release-v6.3.9-1D4ED8?style=flat-square"></a>
  <img alt="local-first" src="https://img.shields.io/badge/local--first-yes-10B981?style=flat-square">
  <img alt="editable PPTX" src="https://img.shields.io/badge/output-editable_PPTX-2563EB?style=flat-square">
</p>

![Preserve-edit: only the title on slide 1 changes; everything else stays intact](assets/preserve-demo/before-after-real.png)

> Real sample in this repo, title on slide 1 only. `fidelity-report.json` records what changed. Reproduce: `python3 scripts/make_preserve_demo_proof.py`

---

## Why this exists

| Job | Generators (Kimi, Gamma, …) | Preserve-Edit |
|---|---|---|
| No deck yet — need a first draft | ✅ Strength | Secondary |
| Branded template — numbers / conclusions only | Tends to rebuild; masters & logos drift | ✅ Named slides only |
| Hand off to PowerPoint / WPS | Often a web deck or re-layout | ✅ Native editable `.pptx` |
| Bank / gov / legal files stay on-device | Usually requires upload | ✅ Local-first by default |

**Rule: if you did not ask for it, not one byte changes.**  
A `.pptx` is a zip of parts: untouched parts are copied verbatim; only named slides (and chart parts touched by chart ops) are re-serialized. See [product positioning](./docs/strategy/product-positioning.md).

---

## One-minute install

### Agent skill (recommended)

```bash
npx skills add kdnsna/ultimate-ppt-master-skill --skill ultimate-ppt-master
```

> Tell your agent: On this PPTX, change “Q2” to “Q3” on slide 3, replace the conclusion on slide 6 with the attachment numbers, and touch nothing else.

### CLI (stdlib-only preserve engine)

```bash
# Inspect visible text per slide
python3 scripts/preserve_edit_pptx.py --list deck.pptx

# Text replace on one slide
python3 scripts/preserve_edit_pptx.py deck.pptx out.pptx \
  --slide 1 --replace "Q2=Q3" --report fidelity.json

# Typed ops (style / table / chart / geometry)
python3 scripts/preserve_edit_pptx.py deck.pptx out.pptx \
  --slide 2 --op '{"op":"style_text","size":24,"bold":true}'

# Multi-slide batch
python3 scripts/preserve_edit_pptx.py deck.pptx out.pptx --edits edits.json
```

Example `edits.json`:

```json
[
  { "slide": 1, "replacements": { "Q2": "Q3" } },
  { "slide": 4, "operations": [
      { "op": "replace_table_cell", "row": 2, "col": 1, "text": "128" }
  ]},
  { "slide": 6, "operations": [
      { "op": "set_chart_value", "series": 1, "point": 2, "value": 42 }
  ]}
]
```

### Desktop

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup && npm run desktop
```

Drop a `.pptx` → pick slides → edit → save. Original is never overwritten. See [INSTALL.md](./INSTALL.md) and [Agent Setup](./docs/guides/agent-setup.md).

### MCP (any agent)

```bash
python3 scripts/ppt_preserve_mcp.py
```

Zero third-party deps, stdio MCP: `inspect_pptx` / `edit_pptx_preserving`. Chinese MCP write-up: [mcp-server](./docs/zh-CN/guides/mcp-server.md).

---

## What you can edit today

| Capability | Notes |
|---|---|
| Text | Titles, body, labels — find/replace |
| Style | Font / size / bold / color (optional match) |
| Tables | Cell by row/col or find text |
| Shapes | Move / resize (points) |
| Charts | Legend/label text and data-point values |
| Fidelity gate | Change list; unexpected mutations fail delivery |

**Not yet (use PowerPoint / WPS):** add/remove slides, insert new images, rebuild table structure, free-form redesign.

---

## A concrete example

Quarterly review from leadership: cover “Q2” → “Q3”; a few table cells on slide 4; chart legend on slide 6.

Only those slides (and related chart parts) change. Masters, logo, notes, and hyperlinks stay as-is:

> 3 edits on cover / slide 4 / slide 6; 78 other parts unchanged.

---

## Secondary: generate from scratch

If you do not have a deck yet: PDF / Word / Excel / URL / paste → storyboard → editable PPTX or magazine Web Deck.

- [Live Workspace](https://kdnsna.github.io/ultimate-ppt-master-skill/) (UI in browser; work via local [Bridge](./docs/guides/agent-connect-bridge.md))
- Agent: `Use $ultimate-ppt-master to turn this source into a 10-slide editable PPTX`
- Routes: [choosing a workflow](./docs/guides/choosing-a-workflow.md) · [Web Experience](./docs/guides/web-experience.md)

| Public sample | Open |
|---|---|
| Formal editable PPTX · sanitized executive review | [Download PPTX](./examples/executive-business-review-starter/executive-business-review-editable.pptx) · [Key slides](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/executive-business-review-starter/web-demo.html) |
| AI Web Deck · magazine | [Gallery](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) |

Primary product remains **fix the deck you already have**.

---

## Three surfaces, one engine

```
scripts/preserve_edit_pptx.py   ← preserve engine (stdlib CLI + apply_edits API)
        ├── Desktop  apps/desktop
        ├── MCP      scripts/ppt_preserve_mcp.py
        └── Skill    SKILL.md
```

| You are… | Use |
|---|---|
| Business user | Desktop drag-and-drop |
| Cursor / Claude / Codex | Install the Skill |
| Building an agent | MCP or CLI / `apply_edits` |
| Developer / CI | CLI + fidelity report gate |

---

## Local-first

Desktop and MCP run on your machine; sources and outputs stay local by default. Model calls use your [local providers](./docs/guides/model-provider-setup.md) when needed; pure preserve-edit can run fully offline.

---

## FAQ

- **Template / logo?** Untouched package parts are copied byte-for-byte.
- **WPS?** Yes — standard `.pptx`.
- **Bad edit?** Original never overwritten; check the fidelity report.
- **pptlint?** [pptlint](https://github.com/kdnsna/pptlint) for delivery check, then preserve-edit named issues.
- **Hard layout?** Finish in PowerPoint / WPS; see [troubleshooting](./docs/guides/troubleshooting.md).

---

## Known limits

- Preserve-edit covers text, style, table cells, shape geometry, and chart values — not add/remove slides, new images, or free redesign.
- Pixel before/after needs LibreOffice; otherwise a vector card is produced.
- From-scratch generation is Agent-driven, not hosted SaaS.
- No Canva-style multiplayer canvas or cloud accounts.

---

## Documentation

| Goal | Link |
|---|---|
| English docs index | [docs/README.md](./docs/README.md) |
| Install | [INSTALL](./INSTALL.md) · [Agent Setup](./docs/guides/agent-setup.md) |
| Positioning | [product-positioning](./docs/strategy/product-positioning.md) |
| Local Bridge | [agent-connect-bridge](./docs/guides/agent-connect-bridge.md) |
| Web workspace | [web-experience](./docs/guides/web-experience.md) |
| Choose a route | [choosing-a-workflow](./docs/guides/choosing-a-workflow.md) |
| Providers | [model-provider-setup](./docs/guides/model-provider-setup.md) |
| Troubleshooting | [troubleshooting](./docs/guides/troubleshooting.md) |
| Current release | [v6.3.9](./docs/release/release-notes-v6.3.9.md) |

Maintainer APIs and release gates live under [`docs/`](./docs/README.md).

---

## License

[MIT](./LICENSE). If this turns “almost ready” slides into something you can hand over, a star helps the next person find it.
