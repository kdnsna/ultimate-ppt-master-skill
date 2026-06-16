# Ultimate PPT Master - v5 Delivery System for AI Presentations

> Local-first AI presentation production for real office work: turn source material into editable PPTX or magazine-style Web Decks with one delivery brief, official/IP asset boundaries, Codex-first generated visuals, Microsoft YaHei typography defaults, rendered review, and formal delivery audits.

<p align="center">
  <strong>v5.0.0</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./docs">Docs</a> · <a href="./docs/release/release-notes-v5.0.0.md">v5 Release Notes</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Open Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Benchmark Wall</strong></a>
  ·
  <a href="./docs/release/release-notes-v5.0.0.md"><strong>v5.0.0 Notes</strong></a>
  ·
  <a href="./docs/guides/agent-connect-bridge.md"><strong>Agent Bridge</strong></a>
  ·
  <a href="./docs/strategy/skill-market-distribution.md"><strong>Skill Market Distribution</strong></a>
</p>

<p align="center">
  <img alt="Version 5.0.0" src="https://img.shields.io/badge/Version-5.0.0-172033?style=for-the-badge">
  <img alt="Delivery defaults" src="https://img.shields.io/badge/v5-Delivery%20Defaults-0F766E?style=for-the-badge">
  <img alt="Codex first visuals" src="https://img.shields.io/badge/Codex--first-Generated%20Visuals-2563EB?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## Why Teams Use It

Most AI PPT tools can make something that looks finished. Office teams need something they can trust, edit, audit, and revise.

| Need | What Ultimate PPT Master gives you |
|---|---|
| Make a real PowerPoint by default | Generic requests such as "make a deck" or "做个 PPT" default to editable PPTX instead of another route-selection loop. |
| Reduce production friction | The old multi-confirmation flow is compressed into one delivery brief with route, audience, style, typography, assets, and constraints. |
| Use better AI visuals | Codex/GPT image generation is treated as a composed visual engine for no-text backgrounds, support scenes, and micro-assets, not element stacking. |
| Keep brands safe | Official/IP marks such as logos, campaign names, cards, QR codes, and partner marks require official-source, user-provided, text-lockup fallback, or replacement status. |
| Keep PowerPoint editable | PPTX output keeps real text, shapes, tables, charts, notes, logos, QR codes, and traceable image sources. |
| Avoid "small PPT" syndrome | Microsoft YaHei defaults, 16:9 spacing guardrails, title/body scale, card-count limits, and layout variety are locked before final assembly. |
| Review before revising | Rendered review writes findings, a safe repair plan, and a user-approved `revision-brief.md` for the second pass. |
| Stay local-first | The Bridge writes project files on localhost; private source material is not uploaded unless the user explicitly chooses that route. |

## What v5 Changes

v5.0.0 is the delivery-defaults release. The product is no longer described as a toolkit of separate capabilities first. It is described as a practical production system for handing a deck to a stakeholder.

| v5 default | Practical effect |
|---|---|
| Editable PPTX first | Formal reports, consulting decks, finance/government material, and normal "make PPT" requests go straight to PowerPoint-ready output. |
| One delivery brief | The agent records assumptions and proceeds unless a missing answer would materially change the deliverable. |
| Codex-first generated visuals | Generated imagery supports the page as no-text layers or reusable micro-assets; body content remains editable. |
| Official/IP asset plan | Deterministic marks are sourced or documented. Fake logo-like placeholders are blocked for external release. |
| Typography and layout system | Microsoft YaHei is the default CJK office font; body text normally stays 18-24px with clear title/body scale and safe margins. |
| Formal-business audit | `design_spec.md`, `spec_lock.md`, `design-quality-report.md`, asset manifests, and PPTX/Web artifacts are checked before delivery. |

## Product Loop

```text
Source material
  -> Web Experience / Desktop / Bridge
  -> one delivery brief
  -> official/IP asset plan
  -> page roles + recipes + editability/raster policy
  -> Codex/GPT no-text visual assets when useful
  -> editable PPTX or magazine Web Deck
  -> rendered review findings
  -> safe repair plan + revision-brief.md
  -> formal delivery audits
```

Core artifacts:

- `design_spec.md`: human-readable design contract for visual direction, page roles, typography, assets, and completion risks.
- `spec_lock.md`: machine-readable execution lock for page recipes, visual layers, raster policy, brand assets, and aesthetic checks.
- `storyboard.json`: DeckIR page map with page roles, recipe IDs, evidence refs, raster policy, and editability targets.
- `source-map.json`: traceable source claims used by the deck.
- `images/image_sources.json` and `images/image_prompts.json`: official/public/generative asset provenance and prompt records.
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

Then open the [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/). The console keeps one primary next action visible: prepare the brief, add source material, connect locally, and deliver the handoff project.

| Need | Best route | Output |
|---|---|---|
| Formal report, consulting deck, training deck, editable business material | Editable PPTX | PowerPoint deck with editable text, shapes, charts, tables, notes, and quality checks. |
| Talk, showcase, demo day, editorial presentation | Web Deck | Single-file browser deck with stronger visual rhythm and shareable HTML. |
| Both formal handoff and browser preview | Dual delivery | Separate PPTX and Web projects with shared source and aligned structure. |

## Capability Matrix

| Layer | Release | What it protects |
|---|---|---|
| Delivery defaults | [Release Notes - v5.0.0](./docs/release/release-notes-v5.0.0.md) | Default PPTX route, one delivery brief, official/IP asset handling, Microsoft YaHei layout scale, and Codex-first image generation. |
| Rendered review and repair brief | [v4.3 Rendered Review Loop](./docs/quality/rendered-review-loop-v4.3.md) | Review after rendering, propose low-risk repairs, generate `revision-brief.md` only after confirmation. |
| AI planning | [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) | `scripts/ai_storyboard.py`, `storyboard.json`, evidence refs, editability targets, and no-key fallback. |
| Simplified Web console | [Simplified Web Console v4.1](./docs/release/release-notes-v4.1.0.md) | Four-step console, one primary next action, grouped previews, lower first-screen complexity. |
| Hybrid-editable generation | [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) | page recipes, no-text generated visual layers, editable PPTX body content, formal raster policy. |
| Public proof surface | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) | Benchmark Wall, synthetic proof packs, Design Doctor reporting, and release checks. |

Historical release notes: [v4.3.0](./docs/release/release-notes-v4.3.0.md), [v4.2.0](./docs/release/release-notes-v4.2.0.md), [v4.1.0](./docs/release/release-notes-v4.1.0.md), [v4.0.0](./docs/release/release-notes-v4.0.0.md), [v3.0.0](./docs/release/release-notes-v3.0.0.md).

## Proofs

The [Benchmark Wall](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) keeps public synthetic proof packs visible before anyone installs the project.

| Proof | Link |
|---|---|
| v5 delivery-defaults release | [Release Notes - v5.0.0](./docs/release/release-notes-v5.0.0.md) |
| Rendered review release | [Release Notes - v4.3.0](./docs/release/release-notes-v4.3.0.md) |
| DeckIR AI planning pack | [Release Notes - v4.2.0](./docs/release/release-notes-v4.2.0.md) |
| Hybrid-editable release | [Release Notes - v4.0.0](./docs/release/release-notes-v4.0.0.md) |
| Stable proof matrix | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) |
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
| Review v5 delivery defaults | [Release Notes - v5.0.0](./docs/release/release-notes-v5.0.0.md) |
| Review v4.3 repair flow | [Rendered Review Loop v4.3](./docs/quality/rendered-review-loop-v4.3.md) |
| Apply rendered repair plan | [`scripts/apply_review_plan.py`](./scripts/apply_review_plan.py) |
| Understand DeckIR AI planning | [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) |
| Understand the v4.0 visual contract | [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) |
| Audit visual recipes | [`scripts/audit_visual_recipes.py`](./scripts/audit_visual_recipes.py) |
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
