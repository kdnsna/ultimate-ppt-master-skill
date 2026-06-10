# Ultimate PPT Master - AI Presentation Production Workbench

> Local-first AI presentation production for Chinese office work: turn source material into editable PPTX decks or magazine-style Web Decks, then use DeckIR planning, rendered review, safe repair briefs, page recipes, no-text generated visual layers, and formal delivery audits to keep the result usable in real office workflows.

<p align="center">
  <strong>v4.3.0</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./docs">Docs</a> · <a href="./docs/guides/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Open Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Benchmark Wall</strong></a>
  ·
  <a href="./docs/quality/rendered-review-loop-v4.3.md"><strong>v4.3 Rendered Review Loop</strong></a>
  ·
  <a href="./docs/release/release-notes-v4.3.0.md"><strong>v4.3.0 Notes</strong></a>
  ·
  <a href="./docs/strategy/skill-market-distribution.md"><strong>Skill Market Distribution</strong></a>
</p>

<p align="center">
  <img alt="Version 4.3.0" src="https://img.shields.io/badge/Version-4.3.0-172033?style=for-the-badge">
  <img alt="Rendered review loop" src="https://img.shields.io/badge/4.3-Rendered%20Review%20Loop-0F766E?style=for-the-badge">
  <img alt="DeckIR planning" src="https://img.shields.io/badge/4.2-DeckIR%20Planning-2563EB?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## Why Teams Use It

Most AI PPT tools can make something that looks finished. Office teams need something they can trust, edit, audit, and revise.

| Need | What Ultimate PPT Master gives you |
|---|---|
| Turn messy source material into slides | A local handoff folder with source markdown, DeckIR page map, evidence refs, and an Agent-ready brief. |
| Keep PowerPoint editable | PPTX output keeps real text, shapes, tables, charts, notes, logos, QR codes, and traceable image sources. |
| Avoid repetitive AI layouts | page recipes and `scripts/audit_visual_recipes.py` prevent repeated title-card grids and body-slide raster shortcuts. |
| Review before revising | v4.3 writes `review-findings.json`, `repair-plan.json`, and user-approved `revision-brief.md` for the second pass. |
| Stay local-first | The Bridge writes project files on localhost; private source material is not uploaded unless the user explicitly chooses that route. |

## Product Loop

```text
Source material
  -> Web Experience / Desktop / Bridge
  -> DeckIR storyboard + source-map evidence boundary
  -> page recipes + editability/raster policy
  -> editable PPTX or magazine Web Deck
  -> rendered review findings
  -> safe repair plan
  -> revision-brief.md for the approved second pass
  -> formal delivery audits
```

Core artifacts:

- `storyboard.json`: DeckIR page map with page roles, recipe IDs, evidence refs, raster policy, and editability targets.
- `source-map.json`: traceable source claims used by the deck.
- `planning-report.json`: route recommendation, fallback status, and planner notes.
- `review-findings.json`: rendered-review issues with severity, risk level, repair target, and suggested command.
- `repair-plan.json`: low-risk repair candidates; default path is dry-run.
- `revision-brief.md`: second-generation brief created only after explicit safe apply.
- `quality-report.json`: merged delivery, planning, and rendered-review status.

## v4.3 Rendered Review Loop

v4.3 makes the review step actionable without making it dangerous. `scripts/review_rendered_deck.py` inspects the generated project and writes findings. `scripts/apply_review_plan.py --safe-only --dry-run` shows what would be applied. `--apply` only writes planning hints, reports, Agent instructions, and `revision-brief.md`; it does not rewrite `source.md`, business facts, or final body claims.

Read the workflow: [Rendered Review Loop v4.3](./docs/quality/rendered-review-loop-v4.3.md). Release: [v4.3.0](./docs/release/release-notes-v4.3.0.md).

## 60-second quickstart

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Then open the [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/). The v4.1 console still gives one primary next action at a time: prepare the brief, add source material, connect locally, and deliver the handoff project.

| Need | Best route | Output |
|---|---|---|
| Formal report, consulting deck, training deck, editable business material | Editable PPTX | PowerPoint deck with editable text, shapes, charts, tables, notes, and quality checks. |
| Talk, showcase, demo day, editorial presentation | Web Deck | Single-file browser deck with stronger visual rhythm and shareable HTML. |
| Both formal handoff and browser preview | Dual delivery | Separate PPTX and Web projects with shared source and aligned structure. |

## Capability Matrix

| Layer | Release | What it protects |
|---|---|---|
| Rendered review and repair brief | [v4.3 Rendered Review Loop](./docs/quality/rendered-review-loop-v4.3.md) | Review after rendering, propose low-risk repairs, generate `revision-brief.md` only after confirmation. |
| AI planning | [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) | `scripts/ai_storyboard.py`, `storyboard.json`, evidence refs, editability targets, and no-key fallback. |
| Simplified Web console | [Simplified Web Console v4.1](./docs/release/release-notes-v4.1.0.md) | Four-step console, one primary next action, grouped previews, lower first-screen complexity. |
| Hybrid-editable generation | [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) | page recipes, no-text generated visual layers, editable PPTX body content, formal raster policy. |
| Public proof surface | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) | Benchmark Wall, synthetic proof packs, Design Doctor reporting, and release checks. |

Historical release notes: [v4.2.0](./docs/release/release-notes-v4.2.0.md), [v4.1.0](./docs/release/release-notes-v4.1.0.md), [v4.0.0](./docs/release/release-notes-v4.0.0.md), [v3.0.0](./docs/release/release-notes-v3.0.0.md).

## Proofs

The [Benchmark Wall](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) keeps public synthetic proof packs visible before anyone installs the project.

| Proof | Link |
|---|---|
| Stable proof matrix | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) |
| Rendered review release | [Release Notes - v4.3.0](./docs/release/release-notes-v4.3.0.md) |
| DeckIR AI planning pack | [Release Notes - v4.2.0](./docs/release/release-notes-v4.2.0.md) |
| Hybrid-editable release | [Release Notes - v4.0.0](./docs/release/release-notes-v4.0.0.md) |
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
| Review v4.3 repair flow | [Rendered Review Loop v4.3](./docs/quality/rendered-review-loop-v4.3.md) |
| Understand DeckIR AI planning | [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) |
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
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

The README promise must stay tied to executable checks. If a capability is advertised here, it should have a doc, script, test, audit, or public proof artifact.
