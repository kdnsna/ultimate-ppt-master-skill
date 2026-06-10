# Ultimate PPT Master - Codex-First AI PPT Launcher

> A local-first Codex handoff launcher for AI presentation production: drop source material, write one goal, create a local project folder, and let Codex produce editable PPTX or Web Deck output with DeckIR planning, rendered review, safe repair briefs, page recipes, no-text generated visual layers, and formal delivery audits.

<p align="center">
  <strong>v4.4.0</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./docs">Docs</a> · <a href="./docs/guides/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Open Codex-First Web Launcher</strong></a>
  ·
  <a href="./docs/release/release-notes-v4.4.0.md"><strong>v4.4.0 Notes</strong></a>
  ·
  <a href="./docs/quality/rendered-review-loop-v4.3.md"><strong>v4.3 Rendered Review Loop</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Benchmark Wall</strong></a>
  ·
  <a href="./docs/strategy/skill-market-distribution.md"><strong>Skill Market Distribution</strong></a>
</p>

<p align="center">
  <img alt="Version 4.4.0" src="https://img.shields.io/badge/Version-4.4.0-172033?style=for-the-badge">
  <img alt="Codex-first launcher" src="https://img.shields.io/badge/4.4-Codex--First%20Launcher-0F766E?style=for-the-badge">
  <img alt="Rendered review loop" src="https://img.shields.io/badge/4.3-Rendered%20Review%20Loop-155E75?style=for-the-badge">
  <img alt="DeckIR planning" src="https://img.shields.io/badge/4.2-DeckIR%20Planning-2563EB?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## Why v4.4 Exists

The old web surface tried to be a platform console. v4.4 turns it into a Codex project launcher.

| Need | What happens now |
|---|---|
| Start quickly | Drop files or paste material, write one goal, click one button. |
| Avoid workflow jargon | DeckIR, rendered review, repair plans, and quality reports are still generated, but they stay inside the local project and debug drawer. |
| Work with real Codex usage | Bridge writes the project folder and the page copies the Codex command immediately. |
| Keep output editable | Formal material defaults to editable PPTX; Web Deck is auto-selected for web, keynote, demo, or interactive briefs. |
| Stay local-first | The Bridge writes project files on localhost; private source material is not uploaded unless the user explicitly chooses that route. |

## Product Loop

```text
Drop files or paste notes
  -> write one goal
  -> Web launcher creates the local handoff
  -> Codex reads AGENTS.md and codex-task.md
  -> DeckIR storyboard + source-map evidence boundary
  -> editable PPTX or magazine Web Deck
  -> rendered review findings
  -> safe repair plan
  -> revision-brief.md for the approved second pass
  -> formal delivery audits
```

Core artifacts remain unchanged:

- `storyboard.json`: DeckIR page map with page roles, recipe IDs, evidence refs, raster policy, and editability targets.
- `source-map.json`: traceable source claims used by the deck.
- `planning-report.json`: route recommendation, fallback status, and planner notes.
- `review-findings.json`: rendered-review issues with severity, risk level, repair target, and suggested command.
- `repair-plan.json`: low-risk repair candidates; default path is dry-run.
- `revision-brief.md`: second-generation brief created only after explicit safe apply.
- `quality-report.json`: merged delivery, planning, and rendered-review status.

## 60-second quickstart

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Then open the [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/). v4.4 shows one screen: source files, pasted notes, one goal, one Codex handoff button, and the copied command.

| Need | Best route | Output |
|---|---|---|
| Formal report, consulting deck, training deck, editable business material | Editable PPTX | PowerPoint deck with editable text, shapes, charts, tables, notes, and quality checks. |
| Talk, showcase, demo day, editorial presentation | Web Deck | Single-file browser deck with stronger visual rhythm and shareable HTML. |
| Both formal handoff and browser preview | Dual delivery | Separate PPTX and Web projects with shared source and aligned structure. |

## Capability Matrix

| Layer | Release | What it protects |
|---|---|---|
| Codex-first web launcher | [Release Notes - v4.4.0](./docs/release/release-notes-v4.4.0.md) | One-screen source plus goal input, Bridge handoff, copied Codex command, advanced details in debug. |
| Rendered review and repair brief | [v4.3 Rendered Review Loop](./docs/quality/rendered-review-loop-v4.3.md) | Review after rendering, propose low-risk repairs with `scripts/apply_review_plan.py`, generate `revision-brief.md` only after confirmation. |
| AI planning | [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) | `scripts/ai_storyboard.py`, `storyboard.json`, evidence refs, editability targets, and no-key fallback. |
| Simplified Web Console v4.1 | [Simplified Web Console v4.1](./docs/release/release-notes-v4.1.0.md) | Historical four-step console that v4.4 replaces with the Codex-first launcher. |
| Hybrid-editable generation | [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) | page recipes, no-text generated visual layers, `scripts/audit_visual_recipes.py`, editable PPTX body content, formal raster policy. |
| Public proof surface | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) | Benchmark Wall, synthetic proof packs, Design Doctor reporting, and release checks. |

Historical release notes: [v4.3.0](./docs/release/release-notes-v4.3.0.md), [v4.2.0](./docs/release/release-notes-v4.2.0.md), [v4.1.0](./docs/release/release-notes-v4.1.0.md), [v4.0.0](./docs/release/release-notes-v4.0.0.md), [v3.0.0](./docs/release/release-notes-v3.0.0.md).

## Proofs

The [Benchmark Wall](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) keeps public synthetic proof packs visible before anyone installs the project.

| Proof | Link |
|---|---|
| Codex-first release | [Release Notes - v4.4.0](./docs/release/release-notes-v4.4.0.md) |
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
| Try the Codex-first web launcher | [Web Experience](./docs/guides/web-experience.md) |
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
