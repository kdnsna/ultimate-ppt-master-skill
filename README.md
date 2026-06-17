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

## Who It Is For

| Audience | Typical work | Why v5 fits |
|---|---|---|
| Office teams | Leadership updates, work reports, training decks, project reviews, and sales enablement decks. | Defaults to a real PPTX that another colleague can edit the same day. |
| Finance, government, and enterprise users | Formal materials that need careful wording, brand boundaries, and traceable source claims. | Keeps official/IP assets documented and blocks fake logo-like placeholders. |
| Consultants and internal strategy teams | Structured narratives, industry scans, solution proposals, and executive summaries. | Builds a one-brief production contract before page generation so structure, audience, and style stay aligned. |
| Event and brand teams | Keynotes, campaign decks, culture-tourism decks, product showcases, and public-facing visuals. | Uses Codex/GPT image generation for composed no-text visuals while the business message stays editable. |

## Typical Scenarios

| Request | v5 default behavior |
|---|---|
| "Make this source into a PPT." | Create an editable PPTX first, unless the user explicitly asks for a Web Deck. |
| "Use a stronger visual style." | Read the source, name a theme art direction, generate no-text support visuals when useful, then keep titles, numbers, tables, and charts editable. |
| "This is for an external brand or public event." | Require an official/IP asset plan for logos, campaign marks, cards, QR codes, partner marks, and any generated imagery. |
| "I need to revise it after review." | Render the deck, write findings, create a safe repair plan, and produce `revision-brief.md` only after confirmation. |

## What You Get

| Deliverable | What is inside | Why it matters |
|---|---|---|
| Editable PPTX | Real text boxes, shapes, charts, tables, speaker notes, and editable brand lockups where safe. | The deck can be handed to a PowerPoint user, not only admired as screenshots. |
| Web Deck | A single-file browser presentation for talks, showcases, and magazine-style storytelling. | Useful when visual rhythm and sharing matter more than PowerPoint editing. |
| Delivery brief | Audience, route, page count, tone, visual direction, typography, image use, and missing-source assumptions. | The agent asks fewer questions but still leaves a production record. |
| Source and asset records | `source-map.json`, `image_sources.json`, `image_prompts.json`, and official/IP fallback notes. | Reviewers can see what was sourced, generated, replaced, or left for authorization. |
| Review package | Rendered previews, findings, repair candidates, and quality status. | Revisions start from observed issues instead of vague "make it better" loops. |

## What v5 Changes

v5.0.0 is the delivery-defaults release. The product is no longer described as a toolkit of separate capabilities first. It is described as a practical production system for handing a deck to a stakeholder.

| v5 default | Practical effect |
|---|---|
| Editable PPTX first | Formal reports, consulting decks, finance/government material, and normal "make PPT" requests go straight to PowerPoint-ready output. |
| One delivery brief | The agent records assumptions and proceeds unless a missing answer would materially change the deliverable. |
| Codex-first generated visuals | Generated imagery supports the page as no-text layers or reusable micro-assets; body content remains editable. |
| Official/IP asset plan | Deterministic marks are sourced or documented. Fake logo-like placeholders are blocked for external release. |
| Theme art direction | After reading the source, the agent names a subject-fit art concept, such as `山海交汇 烟火同行` for cultural tourism, then carries it through cover/tail pages and title treatment unless the deck is a serious report. |
| Typography and layout system | Microsoft YaHei is the default CJK office font; body text normally stays 18-24px with clear title/body scale and safe margins. |
| Formal-business audit | `design_spec.md`, `spec_lock.md`, `design-quality-report.md`, asset manifests, and PPTX/Web artifacts are checked before delivery. |

## v5 Delivery Standard

| Area | Standard |
|---|---|
| Fewer confirmations | Ask only when the missing answer changes the deliverable. Otherwise record the assumption in the delivery brief and proceed. |
| PPTX editability | Business content stays editable. Full-slide raster images are reserved for intentional no-text backgrounds, illustrations, or browser-only Web Deck moments. |
| Image generation | Codex/GPT visuals must be composed scenes or support assets with no embedded text, no fake logos, and prompt records. |
| Official assets | Logos, cards, QR codes, campaign IP, and partner marks must be official-source, user-provided, text-lockup fallback, or needs-authorized-replacement. |
| Typography | Microsoft YaHei is the default Chinese office font. Page titles, body text, captions, numbers, and footers must have visible hierarchy. |
| Layout | 16:9 pages use safe margins, card-count limits, readable body scale, and layout variety across summary, process, comparison, data, and closing pages. |
| Handoff | The final package should include the PPTX or Web Deck, rendered review, quality report, source records, and any asset caveats. |

## Product Loop

The production path is intentionally narrow. It should feel like a senior PPT operator turning messy material into a deliverable, not like a user configuring an engine.

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

Core artifacts in plain language:

- `design_spec.md`: human-readable design contract for visual direction, page roles, typography, assets, and completion risks.
- `spec_lock.md`: machine-readable execution lock for page recipes, visual layers, raster policy, brand assets, and aesthetic checks.
- `storyboard.json`: DeckIR page map with page roles, recipe IDs, evidence refs, raster policy, and editability targets.
- `source-map.json`: traceable source claims used by the deck.
- `images/image_sources.json` and `images/image_prompts.json`: official/public/generative asset provenance and prompt records.
- `review-findings.json`: rendered-review issues with severity, risk level, repair target, and suggested command.
- `repair-plan.json`: low-risk repair candidates; default path is dry-run.
- `revision-brief.md`: second-generation brief created only after explicit safe apply.
- `quality-report.json`: merged delivery, planning, and rendered-review status.

DeckIR is the page map. Page recipes are the layout instructions for each slide. Raster policy is the rule that decides which visual layers may become pixels and which content must remain editable.

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

## Real Production Flow

| Step | What the agent should do |
|---|---|
| Read the source | Extract the core message, audience, constraints, figures, and named assets before proposing page structure. |
| Lock the brief | Choose PPTX/Web/Dual, page count, tone, typography, theme art direction, asset boundaries, and known caveats in one brief. |
| Plan pages | Assign every page a role: cover, summary, evidence, process, comparison, data, case, route, call-to-action, or closing. |
| Build assets | Use official/user assets where required; generate no-text visuals only where they improve the message. |
| Assemble | Keep business text, charts, tables, and labels editable; use Microsoft YaHei and a restrained office hierarchy by default. |
| Review | Render the output, inspect layout and asset risks, write findings, then repair only with a safe plan. |

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

## Repository Map

| Area | Use it for |
|---|---|
| `SKILL.md` and `references/` | Agent behavior, route selection, asset sourcing, visual generation, and delivery rules. |
| `apps/web` and `apps/desktop` | Web Experience, local bridge handoff surface, and desktop worker integration. |
| `scripts/` | Audits, release checks, rendered-review repair, provider setup, and repository maintenance. |
| `templates/` | Design spec and spec lock references used by formal-business delivery. |
| `docs/` | User guides, release notes, quality workflows, strategy docs, and Chinese documentation. |
| `tests/` | Release integrity, audits, worker behavior, bridge behavior, and public-surface guarantees. |

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

## Quality Gates

Run these maintainer checks before publishing a README, version, Skill, Web, or Desktop release:

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

The README promise must stay tied to executable checks. If a capability is advertised here, it should have a doc, script, test, audit, or public proof artifact. Desktop binary packaging is not claimed by this README unless a separate packaging command is run and recorded for that release.
