# Ultimate PPT Master - v5.3 Best-Effect Brief Enhancer

> Local-first AI presentation production for real office work: first expand short prompts into a best-effect brief, then turn unclear requests, messy source material, or structured briefs into editable PPTX or magazine-style Web Decks with a Guizang-like fixed-style fallback, Visual Brief tags, source confidence, delivery scorecards, official/IP asset boundaries, Codex/GPT no-text visuals, rendered review, and formal delivery audits.

<p align="center">
  <strong>v5.3.0</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./docs">Docs</a> · <a href="./docs/release/release-notes-v5.3.0.md">v5.3 Release Notes</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Open Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Benchmark Wall</strong></a>
  ·
  <a href="./docs/release/release-notes-v5.3.0.md"><strong>v5.3.0 Notes</strong></a>
  ·
  <a href="./docs/guides/agent-connect-bridge.md"><strong>Agent Bridge</strong></a>
  ·
  <a href="./docs/strategy/skill-market-distribution.md"><strong>Skill Market Distribution</strong></a>
</p>

<p align="center">
  <img alt="Version 5.3.0" src="https://img.shields.io/badge/Version-5.3.0-172033?style=for-the-badge">
  <img alt="Best-effect brief" src="https://img.shields.io/badge/v5.3-Best--Effect%20Brief-0F766E?style=for-the-badge">
  <img alt="Visual Brief tags" src="https://img.shields.io/badge/Web-Visual%20Brief%20Tags-2563EB?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## Best Results Prompt

Use this prompt when calling the skill from Codex, ChatGPT, Claude Code, Hermes, OpenClaw, Cursor, or any Agent that can read this repo:

```text
Use $ultimate-ppt-master to expand my short request into a best-effect brief first. If my prompt is extremely thin, use the Guizang-like Magazine Web Deck fixed style by default; if I explicitly need a formal editable deck, use PPTX and keep the same quality checks.
```

What v5.3 does before production:

| User input | v5.3 behavior |
|---|---|
| Only a topic or one sentence | Create an **Auto-expanded brief**, then use **Guizang-like Magazine Web Deck fixed style** unless the user explicitly asks for formal editable PPTX. |
| "Make me a PPT about X" with no sources | Treat it as an **extremely thin prompt**; default to an 8-page Style A editorial/e-ink Web Deck so the first result is stable and visually strong. |
| Formal report, government/finance/training, or editable file request | Use editable PPTX, Microsoft YaHei, formal-business quality gate, source confidence, official/IP asset plan, and the same best-effect brief record. |
| Source files or a detailed brief | Preserve the user's intent, write assumptions, and proceed through the normal expectation-fit and quality checks. |

The point is simple: the user should not need to know the perfect prompt. The Agent must first turn a rough instruction into the production brief that would normally lead to the best result.

## Why Teams Use It

Most AI PPT tools can make something that looks finished. Office teams need something they can trust, edit, audit, and revise, even when the first user request is only "make me a PPT".

| Need | What Ultimate PPT Master gives you |
|---|---|
| Make short prompts useful | v5.3 adds a Best-Effect Brief Enhancer so the Agent expands vague requests before choosing route, style, page rhythm, and assumptions. |
| Get a strong first version from little input | An extremely thin prompt defaults to Guizang-like Magazine Web Deck fixed style instead of a bland generic PPT or another long interrogation. |
| Make a real PowerPoint when needed | Formal, editable, government, finance, training, and report requests still go to editable PPTX with Microsoft YaHei and formal-business checks. |
| Avoid expectation drift | v5.2 turns the clarity gate into a contract: tags, guided answers, source confidence, reference style, delivery scorecard, and feedback taxonomy are all written into the handoff. |
| Ask the right questions | The agent clarifies audience, scenario, purpose, source status, core message, page count, visual style, asset rules, output format, and compliance boundaries before production when those answers matter. |
| Use better AI visuals | Codex/GPT image generation is treated as a composed visual engine for no-text backgrounds, support scenes, and micro-assets, not element stacking. |
| Keep brands safe | Official/IP marks such as logos, campaign names, cards, QR codes, and partner marks require official-source, user-provided, text-lockup fallback, or replacement status. |
| Keep PowerPoint editable | PPTX output keeps real text, shapes, tables, charts, notes, logos, QR codes, and traceable image sources. |
| Avoid "small PPT" syndrome | Microsoft YaHei defaults, 16:9 spacing guardrails, title/body scale, card-count limits, and layout variety are locked before final assembly. |
| Review before revising | Rendered review writes findings, a safe repair plan, and a user-approved `revision-brief.md` for the second pass. |
| Stay local-first | The Bridge writes project files on localhost; private source material is not uploaded unless the user explicitly chooses that route. |

## Who It Is For

| Audience | Typical work | Why v5.3 fits |
|---|---|---|
| Office teams | Leadership updates, work reports, training decks, project reviews, and sales enablement decks. | Handles vague one-line requests by auto-expanding a best-effect brief before production. |
| Finance, government, and enterprise users | Formal materials that need careful wording, brand boundaries, and traceable source claims. | Keeps official/IP assets documented and blocks fake logo-like placeholders for external release. |
| Consultants and internal strategy teams | Structured narratives, industry scans, solution proposals, and executive summaries. | Builds a single `project-brief.json` contract before page generation so structure, audience, and style stay aligned. |
| Event and brand teams | Keynotes, campaign decks, culture-tourism decks, product showcases, and public-facing visuals. | Uses Codex/GPT image generation for composed no-text visuals while the business message stays editable. |

## Typical Scenarios

| Request | v5.3 default behavior |
|---|---|
| "Make me a PPT." | Create `bestEffectBrief`; if it is extremely thin and not explicitly formal/editable, produce the Guizang-like Magazine Web Deck fixed style. |
| "Make this source into a PPT." | If the source has no audience or purpose, ask for scenario, audience, and desired outcome first; then create editable PPTX by default. |
| "Use a stronger visual style." | Read the source, name a theme art direction, generate no-text support visuals when useful, then keep titles, numbers, tables, and charts editable. |
| "This is for an external brand or public event." | Require an official/IP asset plan for logos, campaign marks, cards, QR codes, partner marks, and any generated imagery. |
| "I need to revise it after review." | Render the deck, write findings, create a safe repair plan, and produce `revision-brief.md` only after confirmation. |

## What You Get

| Deliverable | What is inside | Why it matters |
|---|---|---|
| `bestEffectBrief` | Prompt quality, auto-expanded brief, recommended route, Extreme Thin Prompt Fallback state, fixed style, and assumptions. | Agents no longer use the user's rough sentence as the production brief. |
| Editable PPTX | Real text boxes, shapes, charts, tables, speaker notes, and editable brand lockups where safe. | The deck can be handed to a PowerPoint user, not only admired as screenshots. |
| Web Deck | A single-file browser presentation for talks, showcases, and magazine-style storytelling. | Useful when visual rhythm and sharing matter more than PowerPoint editing. |
| `project-brief.json` | `briefMode`, `visualBrief`, `guidedBrief`, `expectationFit`, `sourceConfidence`, `deliveryScorecard`, `referenceStyle`, `feedbackLoop`, and `confirmationBrief` in one handoff contract. | The system knows which signals came from the user, which came from tags, which are assumptions, and what to fix if the user is unsatisfied. |
| Visual Brief | Scenario, audience, purpose, content status, visual style, density, asset strategy, output preference, pasted background, links, and extra requirements. | Web users can express a rich PPT request without filling a long form. |
| Guided Brief | Codex-collected answers for scenario, audience, purpose, core message, sources, page count, outline, style, assets, output, must-include, and must-avoid. | Chat users are walked through the missing essentials before serious production. |
| Expectation Fit | Green/yellow/red risk level, source confidence, missing signals, assumptions, delivery scorecard, and readiness for production. | High-risk vague briefs are visible before the deck is generated. |
| Source and asset records | `source-map.json`, `image_sources.json`, `image_prompts.json`, and official/IP fallback notes. | Reviewers can see what was sourced, generated, replaced, or left for authorization. |
| Review package | Rendered previews, findings, repair candidates, and quality status. | Revisions start from observed issues instead of vague "make it better" loops. |

## What v5 Changes

v5.0.0 made the product a delivery-defaults system. v5.1.0 added staged intake for unclear requests. v5.2.0 turned those signals into an expectation-fit contract. v5.3.0 adds the layer that was missing for real Agent use: short instructions are auto-expanded into a best-effect brief before route selection, and topic-only prompts get a fixed high-quality Guizang-like Web Deck default.

| v5 default | Practical effect |
|---|---|
| Best-Effect Brief Enhancer | Every Agent run starts by writing `bestEffectBrief`: prompt quality, auto-expanded brief, assumptions, route, fixed fallback, and user-visible caveats. |
| Extreme Thin Prompt Fallback | Topic-only or one-line prompts default to Guizang-like Magazine Web Deck fixed style unless the user explicitly needs formal editable PPTX. |
| Expectation-fit contract | `project-brief.json` and `quality-report.json` now carry `sourceConfidence`, `deliveryScorecard`, `referenceStyle`, `feedbackLoop`, `failureTaxonomy`, `confirmationBrief`, and `imageAcceptance`. |
| Editable PPTX first | Formal reports, consulting decks, finance/government material, and normal "make PPT" requests go straight to PowerPoint-ready output after the brief is clear enough. |
| Visual Brief Builder | Web users pick diverse tags and paste background material, meeting notes, leadership requirements, links, and special constraints. |
| Codex Guided Intake | If the request is vague, Codex asks by stage: audience and scenario, content source and core message, page structure, visual style, asset policy, output format, and compliance boundaries. |
| Unified brief contract | Web tags and Codex interview answers both flow into `project-brief.json`, so Bridge, Desktop Worker, audits, and prompts read the same intent. |
| Expectation Fit gate | Green means production-ready; yellow means proceed with caveats; red means clarify or explicitly draft with assumptions. |
| Feedback taxonomy | If the user is unhappy, the next revision classifies the reason first: brief mismatch, source gap, style mismatch, visual-density mismatch, asset/IP boundary, or format mismatch. |
| Codex-first generated visuals | Generated imagery supports the page as no-text layers or reusable micro-assets; body content remains editable. |
| Official/IP asset plan | Deterministic marks are sourced or documented. Fake logo-like placeholders are blocked for external release. |
| Theme art direction | After reading the source, the agent names a subject-fit art concept, such as `山海交汇 烟火同行` for cultural tourism, then carries it through cover/tail pages and title treatment unless the deck is a serious report. |
| Typography and layout system | Microsoft YaHei is the default CJK office font; body text normally stays 18-24px with clear title/body scale and safe margins. |
| Formal-business audit | `design_spec.md`, `spec_lock.md`, `design-quality-report.md`, asset manifests, and PPTX/Web artifacts are checked before delivery. |

## v5 Delivery Standard

| Area | Standard |
|---|---|
| Best-effect brief first | Agents must expand short requests before production and record the inferred assumptions in `bestEffectBrief`. |
| Extremely thin prompts | Default to Guizang-like Magazine Web Deck fixed style unless the user explicitly requests formal editable PPTX. |
| Right questions first | When a missing answer can change the deck, Codex pauses for staged intake instead of silently guessing. |
| Draft escape hatch | If the user says "draft with defaults" or "先做一版草稿", the system may proceed with assumptions and must record them. |
| PPTX editability | Business content stays editable. Full-slide raster images are reserved for intentional no-text backgrounds, illustrations, or browser-only Web Deck moments. |
| Image generation | Codex/GPT visuals must be composed scenes or support assets with no embedded text, no fake logos, and prompt records. |
| Official assets | Logos, cards, QR codes, campaign IP, and partner marks must be official-source, user-provided, text-lockup fallback, or needs-authorized-replacement. |
| Typography | Microsoft YaHei is the default Chinese office font. Page titles, body text, captions, numbers, and footers must have visible hierarchy. |
| Layout | 16:9 pages use safe margins, card-count limits, readable body scale, and layout variety across summary, process, comparison, data, and closing pages. |
| Handoff | The final package should include the PPTX or Web Deck, rendered review, quality report, source records, expectation caveats, and any asset caveats. |

## Product Loop

The production path is intentionally narrow. It should feel like a senior PPT operator turning messy material into a deliverable, not like a user configuring an engine.

```text
User request or source material
  -> Best-Effect Brief Enhancer
  -> clarity gate / Extreme Thin Prompt Fallback
  -> Web Visual Brief tags or Codex Guided Intake
  -> project-brief.json with bestEffectBrief + expectationFit
  -> official/IP asset plan
  -> page roles + recipes + editability/raster policy
  -> Codex/GPT no-text visual assets when useful
  -> editable PPTX or magazine Web Deck
  -> rendered review findings
  -> safe repair plan + revision-brief.md
  -> formal delivery audits
```

Core artifacts in plain language:

- `project-brief.json`: the production brief; v5.3 records `bestEffectBrief`, `briefMode`, `visualBrief`, `guidedBrief`, and `expectationFit`.
- `design_spec.md`: human-readable design contract for visual direction, page roles, typography, assets, expectation risks, and completion caveats.
- `spec_lock.md`: machine-readable execution lock for page recipes, visual layers, raster policy, brand assets, expectation contract, and aesthetic checks.
- `storyboard.json`: DeckIR page map with page roles, recipe IDs, evidence refs, raster policy, and editability targets.
- `source-map.json`: traceable source claims used by the deck.
- `images/image_sources.json` and `images/image_prompts.json`: official/public/generative asset provenance and prompt records.
- `review-findings.json`: rendered-review issues with severity, risk level, repair target, and suggested command.
- `repair-plan.json`: low-risk repair candidates; default path is dry-run.
- `revision-brief.md`: second-generation brief created only after explicit safe apply.
- `quality-report.json`: merged delivery, planning, expectation, and rendered-review status.

DeckIR is the page map. Page recipes are the layout instructions for each slide. Raster policy is the rule that decides which visual layers may become pixels and which content must remain editable.

## 60-second quickstart

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Then open the [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/). Choose a recommended Visual Brief combination, add tags, paste background material, connect locally, and deliver the handoff project.

| Need | Best route | Output |
|---|---|---|
| Only a topic or one-line request | Guizang-like fixed Web Deck | Stable 8-page Style A editorial/e-ink HTML deck. |
| Formal report, consulting deck, training deck, editable business material | Editable PPTX | PowerPoint deck with editable text, shapes, charts, tables, notes, and quality checks. |
| Talk, showcase, demo day, editorial presentation | Web Deck | Single-file browser deck with stronger visual rhythm and shareable HTML. |
| Both formal handoff and browser preview | Dual delivery | Separate PPTX and Web projects with shared source and aligned structure. |
| Vague request with high expectations | Codex Guided Intake | Staged questions, confirmed brief, then PPTX/Web production. |

## Real Production Flow

| Step | What the agent should do |
|---|---|
| Expand first | Convert the raw request into `bestEffectBrief`, including route, style, page count, assumptions, and fixed fallback state. |
| Judge clarity | Decide whether the request is production-ready, yellow-risk, or too vague. |
| Ask or tag | Use Visual Brief tags on Web; use Codex Guided Intake in chat when essential context is missing. |
| Confirm brief | Summarize target, audience, content frame, page count, style, assets, output format, and assumptions before production. |
| Read the source | Extract the core message, constraints, figures, and named assets before proposing page structure. |
| Plan pages | Assign every page a role: cover, summary, evidence, process, comparison, data, case, route, call-to-action, or closing. |
| Build assets | Use official/user assets where required; generate no-text visuals only where they improve the message. |
| Assemble | Keep business text, charts, tables, and labels editable; use Microsoft YaHei and a restrained office hierarchy by default. |
| Review | Render the output, inspect layout and asset risks, write findings, then repair only with a safe plan. |

## Capability Matrix

| Layer | Release | What it protects |
|---|---|---|
| Best-effect brief and fixed fallback | [Release Notes - v5.3.0](./docs/release/release-notes-v5.3.0.md) | Auto-expanded brief, extreme-thin prompt fallback, Guizang-like Magazine Web Deck fixed style, and PPTX exception path. |
| Guided intake and expectation fit | [Release Notes - v5.1.0](./docs/release/release-notes-v5.1.0.md) | Visual Brief tags, Codex staged questions, unified `project-brief.json`, and readiness risk before generation. |
| Expectation-fit contract | [Release Notes - v5.2.0](./docs/release/release-notes-v5.2.0.md) | Source confidence, reference-style choices, delivery scorecard, feedback taxonomy, confirmation brief, and image acceptance. |
| Delivery defaults | [Release Notes - v5.0.0](./docs/release/release-notes-v5.0.0.md) | Default PPTX route, one delivery brief, official/IP asset handling, Microsoft YaHei layout scale, and Codex-first image generation. |
| Rendered review and repair brief | [v4.3 Rendered Review Loop](./docs/quality/rendered-review-loop-v4.3.md) | Review after rendering, propose low-risk repairs, generate `revision-brief.md` only after confirmation. |
| AI planning | [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) | `scripts/ai_storyboard.py`, `storyboard.json`, evidence refs, editability targets, and no-key fallback. |
| Simplified Web console | [Simplified Web Console v4.1](./docs/release/release-notes-v4.1.0.md) | Four-step console, one primary next action, grouped previews, lower first-screen complexity. |
| Hybrid-editable generation | [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) | page recipes, no-text generated visual layers, editable PPTX body content, formal raster policy. |
| Public proof surface | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) | Benchmark Wall, synthetic proof packs, Design Doctor reporting, and release checks. |

Historical release notes: [v5.2.0](./docs/release/release-notes-v5.2.0.md), [v5.1.0](./docs/release/release-notes-v5.1.0.md), [v5.0.0](./docs/release/release-notes-v5.0.0.md), [v4.3.0](./docs/release/release-notes-v4.3.0.md), [v4.2.0](./docs/release/release-notes-v4.2.0.md), [v4.1.0](./docs/release/release-notes-v4.1.0.md), [v4.0.0](./docs/release/release-notes-v4.0.0.md), [v3.0.0](./docs/release/release-notes-v3.0.0.md).

## Proofs

The [Benchmark Wall](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) keeps public synthetic proof packs visible before anyone installs the project.

| Proof | Link |
|---|---|
| v5.3 best-effect brief enhancer | [Release Notes - v5.3.0](./docs/release/release-notes-v5.3.0.md) |
| v5.2 expectation-fit contract | [Release Notes - v5.2.0](./docs/release/release-notes-v5.2.0.md) |
| v5.1 guided-intake release | [Release Notes - v5.1.0](./docs/release/release-notes-v5.1.0.md) |
| v5 delivery-defaults release | [Release Notes - v5.0.0](./docs/release/release-notes-v5.0.0.md) |
| Rendered review release | [Release Notes - v4.3.0](./docs/release/release-notes-v4.3.0.md) |
| DeckIR AI planning pack | [Release Notes - v4.2.0](./docs/release/release-notes-v4.2.0.md) |
| Hybrid-editable release | [Release Notes - v4.0.0](./docs/release/release-notes-v4.0.0.md) |
| Stable proof matrix | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) |
| Skill marketplace readiness | [Skill Market Distribution](./docs/strategy/skill-market-distribution.md) |

## Use As Agent Skill

Copyable marketplace prompt:

```text
Use $ultimate-ppt-master to expand my short request into a best-effect brief first. If my prompt is extremely thin, use the Guizang-like Magazine Web Deck fixed style by default; if I explicitly need a formal editable deck, use PPTX and keep the same quality checks.
```

Expert users can install the Skill directly:

```bash
bash -lc 'set -e; dir="$HOME/.codex/skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

Guide: [Agent Setup](./docs/guides/agent-setup.md). Local connector: [Agent Connect Bridge](./docs/guides/agent-connect-bridge.md).

## Repository Map

| Area | Use it for |
|---|---|
| `SKILL.md` and `references/` | Agent behavior, guided intake, route selection, asset sourcing, visual generation, and delivery rules. |
| `apps/web` and `apps/desktop` | Web Experience, Visual Brief Builder, local bridge handoff surface, and desktop worker integration. |
| `apps/bridge` | Local `project-brief.json` creation, expectation-fit handoff, source parsing, and agent task files. |
| `scripts/` | Audits, release checks, rendered-review repair, provider setup, and repository maintenance. |
| `templates/` | Design spec and spec lock references used by formal-business delivery. |
| `docs/` | User guides, release notes, quality workflows, strategy docs, and Chinese documentation. |
| `tests/` | Release integrity, audits, worker behavior, bridge behavior, and public-surface guarantees. |

## Production Stability Guardrails

The v5.3 stability route keeps upstream inspiration visible without turning the
package into an unreviewed bundle of copied skills.

| Guardrail | What is checked |
|---|---|
| `UPSTREAM_SYNC.md` | Records `remote_ref`, `local_ref`, `license`, `import_policy`, absorbed capabilities, deferred capabilities, and the review date for PPT Master, Guizang, and Baoyu sources. |
| `npm run audit:repo-hygiene` | Fails on Finder-style duplicate files such as `README 2.md`, `test_release_integrity 2.py`, or copied icon assets. |
| `npm run audit:image-contracts` | Validates generated-image manifests so every asset records `prompt_path`, backend, source, asset type, aspect ratio, status, page role, and text policy. |
| Guizang license boundary | Do not copy post-AGPL Guizang code directly; absorb behavior requirements and reimplement locally when needed. |
| Baoyu workflow discipline | Use prompt files before generation, record backend decisions, and forbid bitmap text overlay repair. Regenerate from corrected prompts instead. |

## Documentation Map

| Need | Read |
|---|---|
| Try the web front door | [Web Experience](./docs/guides/web-experience.md) |
| Connect browser, local files, and Agents | [Agent Connect Bridge](./docs/guides/agent-connect-bridge.md) |
| Install and invoke the Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| Choose PPTX vs Web Deck vs Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| Configure provider keys locally | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| Review v5.2 expectation contract | [Release Notes - v5.2.0](./docs/release/release-notes-v5.2.0.md) |
| Review v5.1 guided intake | [Release Notes - v5.1.0](./docs/release/release-notes-v5.1.0.md) |
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
npm run audit:repo-hygiene
npm run audit:image-contracts
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
