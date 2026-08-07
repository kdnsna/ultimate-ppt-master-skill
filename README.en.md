<p align="center">
  <img src="assets/readme/hero.svg" alt="Ultimate PPT Master" width="800">
</p>

<h1 align="center">Ultimate PPT Master</h1>

<p align="center">
  <strong>Restrained editing. Sharp generation.</strong><br>
  Turn real source material into a native PowerPoint — and, when you already have<br>
  a branded deck, change only the slides you name while everything else stays byte-for-byte intact.
</p>

<br>

<p align="center">
  <a href="./README.md"><strong>中文</strong></a>&ensp;·&ensp;<a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Live Workspace</strong></a>&ensp;·&ensp;<a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Gallery</strong></a>&ensp;·&ensp;<a href="./docs/README.md"><strong>Docs</strong></a>
</p>

<p align="center">
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/kdnsna/ultimate-ppt-master-skill?style=flat-square&color=171714"></a>&ensp;
  <a href="./LICENSE"><img alt="MIT" src="https://img.shields.io/badge/license-MIT-171714?style=flat-square"></a>&ensp;
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.9"><img alt="v6.3.9" src="https://img.shields.io/badge/GitHub_Release-v6.3.9-1D4ED8?style=flat-square"></a>&ensp;
  <img alt="v7.0.0-beta.1" src="https://img.shields.io/badge/main-7.0.0--beta.1-73866C?style=flat-square">&ensp;
  <img alt="local-first" src="https://img.shields.io/badge/local--first-yes-73866C?style=flat-square">&ensp;
  <img alt="editable PPTX" src="https://img.shields.io/badge/output-editable_PPTX-1D4ED8?style=flat-square">
</p>

<br>

---

<br>

## v7 Unified Architecture (upm CLI)

Two engines: **Preserve Edit Engine** (byte-stable edits to an existing branded PPTX) and **Deck Generation Engine** (DeckIR → PPTD → export → visual QA). Three user paths: `preserve-edit` / `editable-deck` / `web-deck` (Web Deck is enabled only on an explicit request).

Export backends: `local` (default, offline; tables/charts become editable DrawingML shapes, not native data objects) and `kimi` (experimental external compatibility adapter; its delivery channel is currently broken against the upstream editor and is not a delivery guarantee; opt-in only).

```bash
bin/upm make <source-or-topic>     # generate an editable PPTX (default)
bin/upm edit <file.pptx> "change"  # fidelity-preserving local edit
bin/upm open <project>             # open the PPTD visual editor
bin/upm review <project>           # re-run visual/delivery audit
bin/upm doctor                     # environment check (report only)
```

See [upm-cli.md](docs/guides/upm-cli.md), [upm-v7-unification.md](docs/architecture/upm-v7-unification.md), and [upm-migration.md](docs/guides/upm-migration.md).

<br>

## Capability Matrix

- **Preserve-Edit** — edit existing branded PPTX in place; masters, logos, and links stay byte-identical.
- **One-minute install** — paste one command, run locally; no sign-in, no API dependency.
- **Formal editable PPTX** — generate editable PowerPoint from source material; masters, links, and native objects stay byte-faithful.
- **AI Web Deck (experimental)** — browser preview (SVG HTML Preview); the magazine/Swiss-style finished Web Deck is still converging (see the v7 notes above).
- **Finished Work & Proof** — every case ships with before/after renders, quality reports, and Release evidence.
- **Known limits** — honest boundaries in [FAQ](#faq) and [Known Boundaries](#known-boundaries); no inflated promises.

<br>

## Design Philosophy

> *"Content determines rhythm; decoration never substitutes for argument."*

Ultimate PPT Master is not another "enter a topic, get a template" slide generator. It is designed as an **editorial studio** — treating every slide the way a magazine editor treats a proof: composition backed by evidence, color carrying structural roles, whitespace as rhythm.

It solves two problems, each with its own edge:

<br>

<table>
<tr>
<td width="50%" valign="top">

### &ensp;&#9698;&ensp;Preserve-Edit

**You already have a branded PPTX.**

A real file from leadership, a client, or a locked template — you need to change a few numbers or conclusions without breaking masters, logos, stamps, or hyperlinks.

Ultimate PPT Master treats `.pptx` as a zip archive: **unnamed parts are copied verbatim; only the slides you point to get rewritten.** A fidelity report documents exactly what changed and what stayed intact.

```
3 edits · cover / slide 4 / slide 6
78 other parts unchanged
```

</td>
<td width="50%" valign="top">

### &ensp;&#9700;&ensp;Generate from Source

**You don't have a deck yet — just scattered material.**

PDF, Word, Excel, web pages, pasted text — the system confirms the storyboard and evidence chain first, then selects a visual direction, generates page by page, and delivers:

- **Editable PPTX** — formal reports, consulting, government
- **Magazine Web Deck** — launches, roadshows, Demo Day

Every page goes through brief enhancement, evidence grading, and visual review — not template fill-in.

</td>
</tr>
</table>

<br>

![Preserve-edit: only the title on slide 1 changes; everything else stays intact](assets/preserve-demo/before-after-real.png)

<p align="center"><sub>Real sample: only slide 1 title modified. Reproducible — <code>python3 scripts/make_preserve_demo_proof.py</code></sub></p>

<br>

---

<br>

## Quick Start

<details open>
<summary><strong>Agent Skill</strong> (recommended)</summary>

<br>

```bash
npx skills add kdnsna/ultimate-ppt-master-skill --skill ultimate-ppt-master
```

This copies the whole skill package to your machine (~100MB, including desktop app and examples). One more step installs the light Python deps (the preserve-edit engine is stdlib-only, but generation routes need them):

```bash
cd ~/.agents/skills/ultimate-ppt-master
bash scripts/bootstrap.sh --profile core
```

Then tell your agent:

> *Change "Q2" to "Q3" on slide 3, replace the conclusion on slide 6 with the new numbers from the attachment, and touch nothing else.*

> *Turn this material into a 10-slide editable PPTX, formal report style.*

</details>

<details>
<summary><strong>CLI</strong> (stdlib-only)</summary>

<br>

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

</details>

<details>
<summary><strong>Desktop</strong></summary>

<br>

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup && npm run desktop
```

Drop a `.pptx` → pick slides → edit → save. Original is never overwritten.

</details>

<details>
<summary><strong>MCP Server</strong> (any agent)</summary>

<br>

```bash
python3 scripts/ppt_preserve_mcp.py
```

Zero-dep stdio MCP exposing `inspect_pptx` / `edit_pptx_preserving`. See [MCP guide](./docs/guides/mcp-server.md).

</details>

<br>

---

<br>

## Editing Capabilities

| Operation | Notes |
|:---|:---|
| **Text** | Titles, body, labels — find/replace |
| **Style** | Font / size / bold / color, with optional text matching |
| **Tables** | Cell by row/col or content search |
| **Shapes** | Move / resize (points) |
| **Charts** | Legend/label text and data-point values |
| **Fidelity gate** | Change manifest + unexpected mutation = hard failure |

<sub>Not yet supported: add/remove slides, insert new images, rebuild table structure, free-form redesign — finish those in PowerPoint / WPS.</sub>

<br>

---

<br>

## Visual System

<img src="assets/readme/style-matrix.svg" alt="Four output strengths" width="100%">

<br>

Ultimate PPT Master ships a full design contract, not random beautification:

<table>
<tr>
<td align="center" width="20%">
<br>
<strong>Paper</strong><br>
<code>#F6F3ED</code><br>
<sub>Warm editorial surface</sub>
<br><br>
</td>
<td align="center" width="20%">
<br>
<strong>Ink</strong><br>
<code>#171714</code><br>
<sub>Titles & body</sub>
<br><br>
</td>
<td align="center" width="20%">
<br>
<strong>Mineral Blue</strong><br>
<code>#1D4ED8</code><br>
<sub>Evidence & emphasis</sub>
<br><br>
</td>
<td align="center" width="20%">
<br>
<strong>Signal Coral</strong><br>
<code>#D9573B</code><br>
<sub>Decisive conclusion</sub>
<br><br>
</td>
<td align="center" width="20%">
<br>
<strong>Sage</strong><br>
<code>#73866C</code><br>
<sub>Long-horizon accent</sub>
<br><br>
</td>
</tr>
</table>

- **Typography as role system** — Serif for display, sans for evidence, body in gothic, mono for metadata only
- **Light covers by default** — Dark covers are an explicit art-direction choice, never automatic
- **Color as structure** — Marks section boundaries, evidence ownership, risk, and action — not decoration
- **Soft-edge contract** — Container radii 8-14 pt (PPTX) / 12-20 px (Web), maintaining editorial discipline

Full design system in [DESIGN.md](./DESIGN.md).

<br>

---

<br>

## Architecture

```
scripts/preserve_edit_pptx.py        Preserve engine (stdlib, CLI + apply_edits API)
        │
        ├── apps/desktop             Desktop · drag-and-drop editing
        ├── scripts/ppt_preserve_mcp.py   MCP Server · any agent
        ├── SKILL.md                 Agent Skill · Cursor / Claude / Codex
        └── apps/web + apps/bridge   Web Workspace · browser + local bridge
```

| You are… | Use |
|:---|:---|
| Business user | Desktop — drop it in, edit, done |
| Cursor / Claude / Codex user | Install the Skill, talk naturally |
| Building your own agent | MCP or CLI / `apply_edits` API |
| Developer / CI | CLI + fidelity report gate |

<br>

---

<br>

## Gallery

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/">
    <img src="assets/readme/output-gallery.svg" alt="Gallery" width="720">
  </a>
</p>

| Sample | View |
|:---|:---|
| Formal editable PPTX · sanitized executive review | [Download PPTX](./examples/executive-business-review-starter/executive-business-review-editable.pptx)&ensp;·&ensp;[Key slides](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/executive-business-review-starter/web-demo.html) |
| Magazine Web Deck · editorial aesthetic | [Full demo](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) |

<br>

---

<br>

## Local-First

Files stay on your machine by default. Desktop and MCP run locally; sources and outputs never leave. Model calls use your own [provider config](./docs/guides/model-provider-setup.md) when needed; pure preserve-edit works fully offline.

Designed for banking, government, and legal environments.

<br>

---

<br>

## Documentation

| | |
|:---|:---|
| **Install** | [INSTALL](./INSTALL.md)&ensp;·&ensp;[Agent Setup](./docs/guides/agent-setup.md) |
| **Preserve-Edit** | [Product Positioning](./docs/strategy/product-positioning.md)&ensp;·&ensp;[Edit Prompts](./docs/guides/preserve-edit-prompts.md) |
| **Generate** | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md)&ensp;·&ensp;[Web Experience](./docs/guides/web-experience.md) |
| **Integration** | [MCP Server](./docs/guides/mcp-server.md)&ensp;·&ensp;[Agent Bridge](./docs/guides/agent-connect-bridge.md)&ensp;·&ensp;[Providers](./docs/guides/model-provider-setup.md) |
| **Design** | [Design System](./DESIGN.md)&ensp;·&ensp;[Visual Contract](./contracts/visual-defaults.yaml) |
| **Troubleshooting** | [troubleshooting](./docs/guides/troubleshooting.md) |
| **Release** | [v6.3.9 notes](./docs/release/release-notes-v6.3.9.md) |
| **English docs index** | [docs/README.md](./docs/README.md) |

<br>

---

<br>

## FAQ

**Will it touch my template or logo?**<br>
No. Unnamed package parts are copied byte-for-byte.

**WPS compatible?**<br>
Yes. Standard `.pptx` output — works in both WPS and PowerPoint.

**What if an edit goes wrong?**<br>
The original is never overwritten. Every edit ships with a fidelity report.

**Relationship with pptlint?**<br>
[pptlint](https://github.com/kdnsna/pptlint) runs delivery checks; Ultimate PPT Master does the preserve-repair on named issues.

<br>

---

<br>

## Known Boundaries

- Preserve-edit covers text, style, table cells, shape geometry, and chart values — not add/remove slides, new images, or structural rebuilds
- **No import-and-re-export of a whole deck**: existing PPTX files get per-slide faithful repair only, never a full-deck re-export
- Pixel-level before/after comparison requires local LibreOffice; otherwise a vector diff card is produced
- From-scratch generation is agent-driven, not hosted SaaS
- No Canva-style multiplayer canvas or cloud accounts

<br>

---

<p align="center">
  <sub><a href="./LICENSE">MIT</a>&ensp;·&ensp;If this turns "almost ready" slides into something you can actually hand over, a star helps the next person find it.</sub>
</p>
