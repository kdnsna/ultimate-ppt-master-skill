# Ultimate PPT Master - Hybrid-Editable AI Presentation Workbench

> Local-first presentation production for Chinese office work: turn source material into editable PPTX decks or magazine-style Web Decks, with a v4.1 simplified Web console, v4.0 page recipes, no-text generated visual layers, and delivery audits that protect editability.

<p align="center">
  <strong>v4.1.0</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./docs">Docs</a> · <a href="./docs/guides/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Open Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Benchmark Wall</strong></a>
  ·
  <a href="./docs/quality/hybrid-editable-visual-workflow-v4.0.md"><strong>v4.0 Workflow</strong></a>
  ·
  <a href="./docs/release/release-notes-v4.1.0.md"><strong>v4.1.0 Notes</strong></a>
  ·
  <a href="./docs/strategy/skill-market-distribution.md"><strong>Skill Market</strong></a>
</p>

<p align="center">
  <img alt="Version 4.1.0" src="https://img.shields.io/badge/Version-4.1.0-172033?style=for-the-badge">
  <img alt="Simplified console" src="https://img.shields.io/badge/4.1-Simplified%20Console-0F766E?style=for-the-badge">
  <img alt="Hybrid editable" src="https://img.shields.io/badge/4.0-Hybrid%20Editable-2563EB?style=for-the-badge">
  <img alt="Visual recipes" src="https://img.shields.io/badge/Page-Recipes-7C3AED?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## 60-second quickstart

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Then open the [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/). v4.1 shows one primary next action at a time; use **No Bridge** for public demos and the benchmark wall, or connect locally when you want source parsing and a project folder for Codex or another AI helper.

| Need | Best route | Output |
|---|---|---|
| Formal report, consulting deck, training deck, editable business material | Editable PPTX | PowerPoint deck with editable text, shapes, charts, tables, notes, and quality checks. |
| Talk, showcase, demo day, editorial presentation | Web Deck | Single-file browser deck with stronger visual rhythm and shareable HTML. |
| Both formal handoff and browser preview | Dual delivery | Separate PPTX and Web projects with shared source and aligned structure. |

## What v4.1 Fixes

v4.1 keeps the v4.0 generation contract, but makes the Web console easier to operate.

| Problem | v4.1 answer |
|---|---|
| Five navigation tabs plus a workflow wizard compete for attention | One four-step console: prepare, add sources, connect locally, deliver. |
| The screen repeats copy/send/launch/download buttons | One state-driven primary action plus a small "more actions" menu. |
| Advanced setup, proof walls, and technical files crowd the first screen | Settings, proofs, glossary, and generated files are grouped behind drawers. |
| Eleven preview tabs feel like implementation detail | Preview is grouped into user preview, AI-helper files, and quality report. |

Release: [Simplified Web Console v4.1](./docs/release/release-notes-v4.1.0.md).

## What v4.0 Fixes

v4.0 is built around one uncomfortable truth: many AI-generated PPTs look polished at first glance but fail in real office use because they are repetitive, text-heavy, or flattened into images.

Ultimate PPT Master now uses a hybrid-editable contract:

| Problem | v4.0 answer |
|---|---|
| Every page becomes another card grid | `templates/page-recipes/index.json` defines page roles before generation. |
| Generated images hide the content | Visual generation is limited to no-text support layers on formal body pages. |
| PPTX output is hard to edit | Copy, numbers, tables, charts, logos, and QR codes stay editable or traceable. |
| Quality checks pass file completeness but miss visual sameness | `scripts/audit_visual_recipes.py` blocks recipe repetition and full-page raster body slides. |

Read the workflow: [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md).

## How It Works

```text
Source material
  -> Web Experience or Agent brief
  -> local handoff folder
  -> page role and page recipe contract
  -> editable PPTX or magazine Web Deck
  -> visual layer prompts when useful
  -> formal delivery and recipe audits
```

Key 4.0 artifacts:

- `spec_lock.md`: locks page recipes, visual layers, and raster policy.
- `assets/generated/page-visuals/manifest.json`: records generated or manual page visual prompts.
- `quality-report.json`: records delivery checks and remaining risks.
- `scripts/generate_visual_layers.py`: prepares page-level visual-layer prompts.
- `scripts/audit_visual_recipes.py`: enforces recipe variety and body-slide raster policy.

## Proofs

The [Benchmark Wall](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) keeps public synthetic proof packs visible before anyone installs the project.

| Proof | Link |
|---|---|
| Stable proof matrix | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) |
| Formal handoff release | [Release Notes - v3.0.0](./docs/release/release-notes-v3.0.0.md) |
| Hybrid-editable release | [Release Notes - v4.0.0](./docs/release/release-notes-v4.0.0.md) |
| Simplified Web console | [Release Notes - v4.1.0](./docs/release/release-notes-v4.1.0.md) |
| Skill marketplace readiness | [Skill Market Distribution](./docs/strategy/skill-market-distribution.md) |

## Use As Agent Skill

Copyable marketplace prompt:

```text
Use $ultimate-ppt-master to turn my source material into a quality-checked PPTX or Web Deck with a visual review report.
```

Expert users can install the Skill directly:

```bash
bash -lc 'set -e; dir="$HOME/.codex/skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

Guide: [Agent Setup](./docs/guides/agent-setup.md). Local connector: [Agent Connect Bridge](./docs/guides/agent-connect-bridge.md).

## Documentation Map

| Need | Read |
|---|---|
| Try the web front door | [Web Experience](./docs/guides/web-experience.md) |
| Connect browser, local files, and Agents | [Agent Connect Bridge](./docs/guides/agent-connect-bridge.md) |
| Install and invoke the Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| Choose PPTX vs Web Deck vs Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| Configure provider keys locally | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| Understand the simplified Web console | [Simplified Web Console v4.1](./docs/release/release-notes-v4.1.0.md) |
| Understand the v4.0 visual contract | [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) |
| Review release maintenance | [Release and Maintenance](./docs/release/release-maintenance.md) |
| Debug setup or generation issues | [Troubleshooting](./docs/guides/troubleshooting.md) |

Full map: [docs/README.md](./docs/README.md). Chinese map: [docs/zh-CN/README.md](./docs/zh-CN/README.md).

## Maintainer Checks

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:presets
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

The README promise must stay tied to executable checks. If a capability is advertised here, it should have a doc, script, test, audit, or public proof artifact.
