# Ultimate PPT Master - Local-first AI Presentation Quality Workbench

> Local-first + quality-checked delivery for Chinese office users: turn PDFs, Word docs, PPTX decks, spreadsheets, URLs, and rough notes into Agent-ready presentation projects, then produce editable PowerPoint decks or magazine-style Web Decks locally.

<p align="center">
  <strong>v3.0.0</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./docs">Docs</a> · <a href="./docs/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Open Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Benchmark Wall</strong></a>
  ·
  <a href="./docs/quality-workbench-v2.5.md"><strong>Quality Workbench</strong></a>
  ·
  <a href="./docs/skill-market-distribution.md"><strong>Skill Market</strong></a>
  ·
  <a href="./docs/completion-audit-v2.5-quality-workbench.md"><strong>Completion Audit</strong></a>
</p>

<p align="center">
  <a href="./docs/release-notes-v3.0.0.md"><strong>v3.0.0 Notes</strong></a>
  ·
  <a href="#60-second-quickstart"><strong>60-second quickstart</strong></a>
  ·
  <a href="#use-as-agent-skill"><strong>Use as Agent Skill</strong></a>
  ·
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/discussions"><strong>Discussions</strong></a>
</p>

<p align="center">
  <img alt="Version 3.0.0" src="https://img.shields.io/badge/Version-3.0.0-172033?style=for-the-badge">
  <img alt="Web first" src="https://img.shields.io/badge/Primary-Web%20Experience-2563EB?style=for-the-badge">
  <img alt="Local bridge" src="https://img.shields.io/badge/Local-Agent%20Bridge-0F766E?style=for-the-badge">
  <img alt="Agent skill" src="https://img.shields.io/badge/Core-Agent%20Skill-10B981?style=for-the-badge">
  <img alt="Quality Checked" src="https://img.shields.io/badge/Quality-Checked-0F766E?style=for-the-badge">
  <img alt="Design Doctor" src="https://img.shields.io/badge/Design-Doctor-7C3AED?style=for-the-badge">
  <img alt="Skill Market Ready" src="https://img.shields.io/badge/Skill%20Market-Ready-F97316?style=for-the-badge">
  <img alt="Benchmark Proofs" src="https://img.shields.io/badge/Benchmark-Proofs-2563EB?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## 60-second quickstart

For a first run, copy this and keep every source file on your own machine:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Then open [the Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/) and choose the route that matches how much local setup you want today.

| Mode | What to do first | What you get |
|---|---|---|
| **No Bridge** | Open public demos and the Benchmark Wall. | See real synthetic cases, covers, sources, and quality reports before installing anything. |
| **Bridge online** | Pick a Chinese office preset, paste a goal or upload local files, then click **Send to Bridge**. | A local handoff folder with the brief, source material, manifest, preview, quality checklist, `quality-report.json`, and Agent commands. |

First click path:

| Step | Click or action | Result |
|---|---|---|
| 1 | **Open Web Experience** | Start from the product UI instead of reading architecture first. |
| 2 | **Choose a preset** | Select business review, consulting, training/defense, pitch, or trend deck. |
| 3 | Paste a goal or add files | Keep source material local and make the task explicit. |
| 4 | **Send to Bridge** | Write a local handoff contract when the connector is running. |
| 5 | **Hand off to Agent** | Let Codex, Claude Code, Hermes, OpenClaw, or another local agent produce and review. |

| First scenario | Best default |
|---|---|
| Business review, weekly update, monthly report, or quarterly review | **Executive Business Review** |
| Consulting proposal, client recommendation, diagnosis, or decision memo | **Consulting Proposal** |
| Training courseware or academic defense | **Training Courseware / Academic Defense** |
| Product pitch or tech trend showcase | **Product Pitch / Tech Trend Web Deck** |

## v2.5 case carousel

![v2.5 Quality Workbench case carousel](assets/readme/v2.5-case-carousel.gif)

These are public synthetic proof packs: input source, selected preset, generated output, screenshot cover, and quality report are all committed so users can judge the workflow before installing anything.

| Case | Fits | Proof |
|---|---|---|
| Executive Business Review | Operations review, CEO/department update, KPI story | [Demo](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/executive-business-review-starter/web-demo.html) · [Source](./examples/executive-business-review-starter/source.sanitized.md) · [Quality report](./examples/executive-business-review-starter/quality-report.json) |
| Consulting Proposal | Client diagnosis, transformation proposal, decision memo | [Demo](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/consulting-proposal-starter/web-demo.html) · [Source](./examples/consulting-proposal-starter/source.sanitized.md) · [Quality report](./examples/consulting-proposal-starter/quality-report.json) |
| Product Pitch | Launch story, demo day, stakeholder buy-in | [Demo](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/product-pitch-starter/web-demo.html) · [Source](./examples/product-pitch-starter/source.sanitized.md) · [Quality report](./examples/product-pitch-starter/quality-report.json) |
| Tech Trend Web Deck | Public trend briefing, conference talk, thought leadership | [Demo](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/tech-trend-web-deck-starter/web-demo.html) · [Source](./examples/tech-trend-web-deck-starter/source.sanitized.md) · [Quality report](./examples/tech-trend-web-deck-starter/quality-report.json) |

## Why People Star It

| If you need... | Ultimate PPT Master gives you... |
|---|---|
| An AI presentation generator that does not hide your source files | A local-first Web Experience plus Bridge handoff folder. |
| Editable PowerPoint output, not screenshots pasted into slides | A PPTX-oriented Agent Skill path with quality checks. |
| Better first drafts from messy PDFs, Word docs, PPTX, URLs, and notes | Stable packs, source skeletons, manifests, QA checklists, and quality reports. |
| Web-native, magazine-style decks for demos or reports | A Web Deck route with browser previews and shareable HTML output. |

## What It Is

Ultimate PPT Master is a **local-first AI presentation hub**. It gives non-technical users a friendly web page, then gives power users a real local handoff folder that Codex, Claude Code, Hermes, OpenClaw, or another agent can continue from.

It is designed as a practical fusion layer around two strong routes:

- the editable PPTX route inspired by Hugo He's PPT Master direction;
- the high-impact single-file Web Deck route inspired by op7418 / Guizang-style presentation skills.

The goal is simple: **the web page should make the workflow easy to understand; the local Skill should keep the production quality high.**

![Agent connect flow](assets/readme/agent-connect-flow.svg)

## v3.0.0 Release Focus

v3.0.0 turns Ultimate PPT Master into a **formal-business PPT delivery workbench**. It keeps the local-first Web + Bridge + Skill architecture, but now makes the Codex handoff directly executable and treats ChatGPT/OpenAI visual generation as the default micro-asset loop for polished decks.

This release focuses on practical office delivery:

- Formal-business quality gates are the default for stakeholder-facing business, finance, government, training, and consulting decks.
- Handoff folders now include `design_spec.md`, `spec_lock.md`, `asset-plan.md`, `visual-element-kit.md`, `codex-task.md`, `AGENTS.md`, and `quality-report.json`.
- Codex receives one execution order: read the handoff files, lock the visual direction and page-role contract, run or handle `scripts/generate_visual_element_kit.py`, produce PPTX/Web Deck outputs, update asset records, then run the delivery and design-completion audits.
- ChatGPT/OpenAI-generated micro-assets now have a real local loop: `assets/generated/element-manifest.json`, `images/image_prompts.json`, and `images/image_prompts.md`.
- No image key is still a supported path: the workflow writes `Needs-Manual` prompts that can be pasted into ChatGPT.
- Visual direction packs now define context-specific aesthetic guardrails before slide generation, so business decks are not judged only by file completeness.

### v3.0.0 In Plain Words

- The web page does not ask users to understand every technical file. It shows the current handoff step and the next command to run.
- Codex no longer receives only a big prompt. It receives a structured folder, a micro-asset checklist, a quality checklist, and a review command.
- The strategist must declare what each page is doing: anchor, context, evidence, comparison, process, metric, risk, action, or closing.
- ChatGPT image generation is used for small reusable elements, not for flattening whole slides or hiding editable text.
- If image generation is not configured, the project still moves forward with `Needs-Manual` prompts.

## 4.0 Capability Track

The next capability layer is **hybrid-editable visual generation**. It keeps formal PPTX pages editable while using ChatGPT/OpenAI for no-text visual support layers.

- Page recipes from `templates/page-recipes/index.json` now define the intended structure before a page is drawn.
- `spec_lock.md` can lock `page_recipes`, `visual_layers`, and `raster_policy` so the generator does not drift back to repeated card grids.
- `scripts/generate_visual_layers.py` writes page-level ChatGPT prompts and `assets/generated/page-visuals/manifest.json`.
- `scripts/audit_visual_recipes.py` blocks repeated page recipes and full-page raster use on formal body pages.
- Full-page generated images are reserved for cover, section/tail, poster/KV, Web showcase, or explicit override; formal body pages keep editable copy, numbers, tables, charts, logos, and QR codes.

## Quality Proofs

The public proof surface is now a product feature, not a footnote. Open the [Benchmark Wall](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) to see the current "input -> preset -> output -> review" chain before you run the project locally.

Each proof pack includes:

- `source.sanitized.md`: synthetic source material that can be inspected publicly;
- generated demo output: Web Deck or starter output for the selected preset;
- screenshot or cover asset for quick visual judgment;
- `quality-report.json`: machine-readable review result;
- Design Doctor scorecard: report-only visual review with recommended fixes.

Design Doctor is intentionally report-first. It combines SVG checks, browser visual review, `workflows/visual-review.md`, `quality-report.json`, and a plain-language summary; automatic SVG repair only happens when the user explicitly asks for it.

Read the benchmark note: [Quality Workbench v2.5](./docs/quality-workbench-v2.5.md). Review the completion evidence: [Completion Audit](./docs/completion-audit-v2.5-quality-workbench.md). Preset catalog: [templates/presets](./templates/presets).

## Skill Market Distribution

The next growth path is not only GitHub Pages. The repository is now ready to be described as an installable Agent Skill instead of only a code repo.

Marketplace distribution assets:

- `agents/openai.yaml`: OpenAI/Codex-style skill metadata and invocation examples;
- `agents/marketplace-listing.json`: structured listing contract for marketplace review;
- `assets/skill-market/*`: icon and card artwork for listing surfaces;
- public benchmark packs: proof that the skill can produce quality-checked outputs;
- `npm run audit:market`: machine check for marketplace metadata, links, and assets.

Copyable marketplace prompt:

```text
Use $ultimate-ppt-master to turn my source material into a quality-checked PPTX or Web Deck with a visual review report.
```

Read the checklist: [Skill Market Distribution](./docs/skill-market-distribution.md). Chinese checklist: [Skill 市场分发](./docs/zh-CN/skill-market-distribution.md).

## Why Not Just Use Codex To Install A Skill?

You can. For expert users, direct Skill install is still the fastest path.

Ultimate PPT Master exists for the moment before that: when the user has files, a rough goal, uncertain model setup, and no clear idea whether the job should become editable PPTX, a Web Deck, or both.

The product adds value by:

- turning a vague request into a structured brief;
- packaging real source files into a local handoff folder;
- showing Bridge, Agent, and provider readiness before production;
- generating an engine plan, quality checklist, and quality report;
- preserving the original upstream quality routes instead of replacing them with a weaker web-only generator.

Read the deeper positioning note: [Product Positioning](./docs/product-positioning.md).

## One-Line Updates

This project is moving quickly. If you already installed it, update before producing serious client or team-facing material.

Update a local clone:

```bash
cd ultimate-ppt-master-skill
npm run update
```

Update the Codex Skill install:

```bash
bash -lc 'set -e; dir="$HOME/.codex/skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

Update a generic Agent Skill install:

```bash
bash -lc 'set -e; dir="$HOME/agent-skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else mkdir -p "$HOME/agent-skills"; git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

Or ask Codex:

```text
Update ~/.codex/skills/ultimate-ppt-master to the latest GitHub version, run npm run setup, then use the README demo to confirm it works.
```

## Input To Output Demo

![Agentic Developer Stack generated deck](assets/readme/agentic-demo-preview.png)

This public sample shows what users should provide and what they get back:

| What you provide | What it produces |
|---|---|
| A sanitized `source.md` with topic, public references, narrative, slide outline, and constraints. | A self-contained Web Deck plus a handoff structure that a local Agent can continue into PPTX / Web Deck production. |
| A clear Agent prompt with audience, output route, and quality requirements. | Reproducible production files such as `agent-prompt.md`, `engine-plan.md`, and `quality-checklist.md`. |

Input material excerpt:

```text
Topic: Agentic Developer Stack 2026
Goal: use a non-sensitive tech trend to explain why the web page is the front door and the Skill is the production engine.
Sources: Google I/O 2026 developer highlights, Google Developers Blog, and public technology coverage.
Output: an 11-slide magazine-style Web Deck, with a handoff path ready for editable PPTX production.
```

Example Agent prompt:

```text
Use $ultimate-ppt-master with examples/agentic-developer-tools-2026/source.sanitized.md.
Create a polished magazine-style Web Deck for GitHub Pages and keep the handoff ready for an editable PPTX route.
Verify layout, mobile readability, source references, and final exported files before delivery.
```

Open the full sample:

- [Input material: source.sanitized.md](./examples/agentic-developer-tools-2026/source.sanitized.md)
- [Generated Web Deck](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/agentic-developer-tools-2026/web-demo.html)
- [Example notes](./examples/agentic-developer-tools-2026)

## Web Experience

![Web Experience guided workspace](assets/readme/web-hub-preview.svg)

The Web Experience is the public front door. It can run from GitHub Pages without a backend, account, model host, or API key storage.

It helps users:

- import `.md`, `.txt`, `.pdf`, `.docx`, `.pptx`, `.xlsx`, URLs, or pasted text;
- choose scenario, audience, output route, style, language, target agent, and model preference;
- see whether each source is browser-readable, locally parsed, or preserved as an attachment;
- generate an Agent handoff prompt and download a `source.md` template;
- preview a rough `preview-web-deck.html`;
- download `handoff-kit.zip` when Bridge is offline;
- send the same project to the local Bridge when Bridge is online;
- jump directly to Skill installation instructions.

Open it here:

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

For local web development:

```bash
npm --prefix apps/web install
npm run dev:web
```

Build the GitHub Pages artifact:

```bash
npm run build:web
```

## Connect Local Agent

Bridge turns the static web page into a local production console.

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run bridge
```

Bridge writes handoff projects under:

```text
~/UltimatePPTMaster/handoffs/
```

Safety defaults:

- binds only to `127.0.0.1`;
- reads provider config from environment variables, repo `.env`, or `~/.ppt-master/.env`;
- returns provider readiness and model names, never API key values;
- parses source files locally through `scripts/source_to_md/*`;
- does not launch an Agent unless you explicitly opt in.

Optional advanced launch mode:

```bash
npm run bridge -- --allow-launch
```

Full guide: [Agent Connect Bridge](./docs/agent-connect-bridge.md).

## Handoff Kit

![Handoff kit contents](assets/readme/handoff-kit.svg)

Every handoff project is meant to be understandable by both humans and agents:

- `source.md`: clean fallback source;
- `extracted-source.md`: locally parsed source text when available;
- `attachments/`: original files preserved for the Agent;
- `manifest.json`: parse status, source metadata, and suggested commands;
- `agent-prompt.md`: ready-to-copy Agent prompt;
- `project-brief.json`: structured scenario, audience, style, and output settings;
- `engine-plan.md`: PPTX / Web Deck production plan;
- `quality-checklist.md`: review checklist before final delivery;
- `quality-report.json`: Design Doctor and delivery-gate result;
- `preview-web-deck.html`: browser-local rough preview;
- `README.md`: handoff folder instructions.

## Use as Agent Skill

Use the Skill route when quality matters more than the fastest first click. This is the route for Codex, Claude Code, Hermes, OpenClaw, Cursor-style IDEs, and other local agents that can read files and run scripts.

### Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
```

Ask:

```text
Use $ultimate-ppt-master to turn reports/q3-review.pdf into a 12-slide editable PPTX for an executive meeting. Verify the deck before delivery.
```

### Claude Code, Hermes, OpenClaw, And Generic Agents

```bash
mkdir -p ~/agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
npm run setup
```

Agent prompt:

```text
Read ~/agent-skills/ultimate-ppt-master/AGENTS.md and follow SKILL.md.
Use that repository path as SKILL_DIR.
Turn the provided source material into an editable PPTX and preview the result before delivery.
```

Full guide: [Agent Setup](./docs/agent-setup.md).

## Output Gallery

![Output gallery](assets/readme/output-gallery.svg)

| Output | Best for | Production route |
|---|---|---|
| **Editable PowerPoint (`.pptx`)** | Business reports, consulting proposals, training decks, investor updates, and review-heavy work. | Agent Skill with local files, scripts, preview, repair, and export checks. |
| **Magazine Web Deck (`index.html`)** | Launches, demo days, product stories, keynotes, and visually rich sharing. | Web Experience preview first, then Skill for final polish and QA. |
| **Agent Handoff Project** | Users who already have Codex, Claude Code, Hermes, OpenClaw, Cursor, Cline, Roo, or Windsurf. | Bridge-generated folder or `handoff-kit.zip`. |

Public sanitized demos:

- [Executive Business Review Starter](./examples/executive-business-review-starter)
- [Consulting Proposal Starter](./examples/consulting-proposal-starter)
- [Product Pitch Starter](./examples/product-pitch-starter)
- [Tech Trend Web Deck Starter](./examples/tech-trend-web-deck-starter)
- [Agentic Developer Stack 2026](./examples/agentic-developer-tools-2026)
- [Desktop Cultural Tourism Demo](./examples/desktop-cultural-tourism-demo)

## Pick Your Path

| Path | Use it when | Start |
|---|---|---|
| **Open Web Experience** | You want the fastest way to understand the project and build a prompt. | [Open Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/) |
| **Web + Bridge** | You want real file intake without uploading source material to a hosted service. | Run `npm run bridge`, then send from the web page. |
| **Agent Skill** | You already work inside Codex, Claude Code, Hermes, OpenClaw, Cursor, Cline, Roo, or Windsurf. | [Agent Setup](./docs/agent-setup.md) |
| **Web + Skill** | Recommended production flow: prepare the handoff kit visually, then let the agent finish it locally. | Use Web Experience, then Bridge or `handoff-kit.zip`. |
| **Desktop Later** | You want advanced local preview or future signed desktop packaging. | [Quickstart Desktop](./docs/quickstart-desktop.md) |

## Desktop Later

The Tauri desktop app remains in [apps/desktop](./apps/desktop), but it is no longer the first promotion path. Signing, notarization, Homebrew distribution, and native packaging are now release-maintenance work.

Developer preview:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

Maintenance references:

- [Quickstart Desktop](./docs/quickstart-desktop.md)
- [Homebrew Distribution Plan](./docs/homebrew-distribution.md)
- [Release and Maintenance](./docs/release-maintenance.md)

## Documentation

| Need | Guide |
|---|---|
| Use the static online front door | [Web Experience](./docs/web-experience.md) |
| Connect the web page to local files and Agents | [Agent Connect Bridge](./docs/agent-connect-bridge.md) |
| Install and invoke the Skill | [Agent Setup](./docs/agent-setup.md) |
| Pick Web vs Skill vs Desktop Later | [Choosing a Workflow](./docs/choosing-a-workflow.md) |
| Configure provider keys locally | [Model and Provider Setup](./docs/model-provider-setup.md) |
| Understand why this exists beside direct Skill install | [Product Positioning](./docs/product-positioning.md) |
| See the next content/template direction | [Next Roadmap - Content and Template Presets](./docs/next-roadmap.md) |
| Review v3.0.0 release focus | [Release Notes - v3.0.0](./docs/release-notes-v3.0.0.md) |
| Review the quality proof matrix | [Quality Workbench v2.5](./docs/quality-workbench-v2.5.md) |
| Browse public proof packs | [Benchmark Wall](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) |
| Prepare marketplace or agent-directory distribution | [Skill Market Distribution](./docs/skill-market-distribution.md) |
| Verify the v2.5 quality workbench is complete | [Completion Audit](./docs/completion-audit-v2.5-quality-workbench.md) |
| Review GitHub technology signals | [GitHub Technology Scan - May 2026](./docs/github-tech-scan-2026-05.md) |
| Review the local upstream benchmark | [Upstream Benchmark - May 2026](./docs/upstream-benchmark-2026-05.md) |
| Debug setup, extraction, output, provider, Tauri, or agent loading issues | [Troubleshooting](./docs/troubleshooting.md) |
| Release, Pages, Homebrew, signing, privacy, and maintenance | [Release and Maintenance](./docs/release-maintenance.md) |

## Pre-Push Stability Gates

Maintainers should keep the README promise tied to executable checks:

```bash
npm run doctor
npm run audit:presets
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

The latest push-prep pass also verified the Web homepage, Benchmark Wall, and four public proof decks at desktop and mobile widths.

## v3.0.0 Highlights

- Added the formal-business quality gate to Web, Bridge, Skill, and local audit paths.
- Added visual direction packs plus `design_spec.md` / `spec_lock.md` page-role contracts for formal-business decks.
- Added the Codex + ChatGPT micro-asset generation loop with scriptable and `Needs-Manual` modes.
- Made the Web handoff panel show Bridge state, local project path, element-generation command, and Agent command in order.
- Added `asset-plan.md`, `visual-element-kit.md`, `codex-task.md`, and `AGENTS.md` to handoff kits.
- Added `scripts/audit_formal_delivery.py`, `scripts/audit_design_completion.py`, and regression fixtures for repeated-card, repeated-layout, no-image, sparse PPTX, visual-lock, and logo-fragment failures.
- Synchronized the Desktop worker so local draft projects also emit the visual contract and both audit commands.

See [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md) for upstream baselines and adaptation policy.

## Repo About

AI presentation hub: source files in, local Agent handoff out, editable PPTX and magazine Web Decks delivered.<br>
AI 演示生产中枢：资料进来，本地 Agent 接手，输出可编辑 PPTX / 杂志风网页演示。

## License

MIT. See [LICENSE](./LICENSE).
