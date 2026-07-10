# Ultimate PPT Master v6

> Turn real source material into editable, reviewable presentation deliverables — locally, with evidence and quality gates.

<p align="center">
  <a href="./README.zh-CN.md"><strong>中文</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Live Workspace</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Proof Packs</strong></a> ·
  <a href="./docs/release/release-notes-v6.0.0.md"><strong>v6 Release Notes</strong></a>
</p>

<p align="center">
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/kdnsna/ultimate-ppt-master-skill?style=flat-square"></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-172033?style=flat-square"></a>
  <img alt="version 6.0.0" src="https://img.shields.io/badge/version-6.0.0-EF5B3F?style=flat-square">
  <img alt="local first" src="https://img.shields.io/badge/local--first-yes-10B981?style=flat-square">
  <img alt="editable PPTX" src="https://img.shields.io/badge/output-editable_PPTX-2563EB?style=flat-square">
</p>

![Ultimate PPT Master v6 finished presentation cases](assets/readme/v6-finished-decks.png)

Most AI presentation tools optimize for the first preview. Ultimate PPT Master optimizes for the moment the deck is opened in a real meeting, revised in PowerPoint, challenged on its sources, and handed to someone else.

It is not another free-form slide editor. It is a local presentation Agent and quality operating system for formal reports, consulting work, training, finance/government material, branded communication, and high-stakes handoff.

## What changed in v6

v6 replaces the old settings-first console with a task-first workspace:

1. **Input** — describe the job, add files/URLs/existing PPTX, choose the delivery use.
2. **Storyboard** — the Agent asks no more than three material questions, then shows slide jobs, evidence and gaps.
3. **Design & Generate** — compare three real visual directions, generate a fast structural draft, then refine progressively.
4. **Refine & Deliver** — work by stable `slideId`, regenerate one slide, review quality findings, and finish in PowerPoint.

![The real v6 task-first workspace](assets/readme/v6-workspace.png)

Bridge, providers, scripts, DeckIR and JSON contracts still exist, but they now live in professional and diagnostic paths instead of blocking the first screen. The previous four-step console remains available for one compatibility cycle at `?classic=1`.

## Why people use it

| Typical AI PPT failure | Ultimate PPT Master response |
|---|---|
| An extremely thin prompt becomes a confident but generic deck | The **Best-Effect Brief Enhancer** creates an **Auto-expanded brief** and exposes assumptions before production. |
| A polished preview is actually a flat image | Keeps PowerPoint text, shapes, tables, charts, notes and other supported objects editable. |
| Sources disappear during generation | Preserves source maps, evidence bindings, asset provenance and confidence boundaries. |
| One small edit regenerates the whole deck | Uses stable `slideId`, slide-level revision requests, checkpoints and reusable asset hashes. |
| Every page becomes “big title + three cards” | Uses visual direction packs, page roles, page recipes and repeated-layout audits. |
| Missing image/model keys break the workflow | Degrades to explicit `Needs-Manual` prompts instead of silently faking completion. |
| The final file looks right but cannot survive handoff | Runs rendered review, native-object checks and export gates tied to the current artifact digest. |

## Routes: choose the output that fits the job

| You need | Recommended route | Deliverable |
|---|---|---|
| A formal report, consulting proposal, training deck, finance/government material, or anything others must revise | **Editable PowerPoint** | `.pptx` with editable content, notes and quality evidence |
| A keynote, public talk, demo day, editorial story or browser-first showcase | **Magazine Web Deck** | responsive HTML with **Style A Editorial Fixed Rhythm** or Style B Swiss International |
| A browser experience plus a formal handoff | **Dual delivery** | separate Web and PPTX projects sharing the same source and planning record |

PowerPoint remains the primary final editing environment. Ultimate PPT Master handles the work around it: source intake, narrative planning, visual direction, asset policy, generation, QA, review and recovery.

## 60-second quickstart · Dependencies and Degradation

Requirements: Python 3.10+, Node.js 18+, npm. Rust is only needed for native desktop packaging.

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Then open the [v6 Web Workspace](https://kdnsna.github.io/ultimate-ppt-master-skill/). The hosted UI talks only to the local Bridge on `127.0.0.1`; source files and generated handoff projects remain on your machine.

For an Agent-first workflow, install or link the Skill and ask naturally:

```text
Use $ultimate-ppt-master to turn this quarterly review and the attached workbook
into a 10-slide editable PPTX for the management committee. Lead with the decision,
keep every number traceable, and use our previous deck only as a style reference.
```

You do not need a special prompt. v6 infers low-risk settings and asks only when audience, evidence, brand/IP permission or delivery expectations materially change the result.

## What you get

- Editable PPTX route with safe Office typography, speaker notes and native-object regression checks.
- Style A editorial/e-ink and Style B Swiss Web Deck routes with structural validators.
- Existing-PPTX reference learning for masters, layout rhythm, theme fonts/colors, placeholders and common page roles.
- Six complete visual directions covering cover, body, data, chart, image, section and closing behavior.
- Three structural variants per slide before expensive refinement.
- Single-slide regeneration, checkpoint recovery, attachment hashing and incremental progress events.
- Local-first source handling, provider-secret isolation and explicit official/IP asset rules.
- Web and Desktop surfaces sharing the same `DeckSession` stages and design tokens.

## Finished presentations · Real Proof Packs

Start with the public [presentation gallery](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/): three complete nine-slide editorial decks sit above the stable Proof Packs. GPT-5.6 and Claude Fable 5 use official release material; the requested “Grok 4.6” was corrected to the latest verified official release, Grok 4.5, as of 10 July 2026. Proof Pack scores remain self-assessed by Design Doctor, not external benchmarks.

| Case | Inspectable output |
|---|---|
| GPT-5.6 · Three Orbits | [Open 9-slide deck](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/ai-frontier-2026/gpt-5-6.html) |
| Grok 4.5 · Engineering Efficiency | [Open 9-slide deck](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/ai-frontier-2026/grok-4-5.html) |
| Claude Fable 5 · Long Horizon | [Open 9-slide deck](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/ai-frontier-2026/claude-fable-5.html) |
| Executive Business Review | [Open stable proof](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/executive-business-review-starter/web-demo.html) |
| Consulting Proposal | [Open stable proof](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/consulting-proposal-starter/web-demo.html) |
| Product Pitch | [Open stable proof](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/product-pitch-starter/web-demo.html) |
| Tech Trend Web Deck | [Open stable proof](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/tech-trend-web-deck-starter/web-demo.html) |

## HTTP API and server deployment

v6 includes a real HTTP Bridge for preparation and orchestration:

| Endpoint | Role |
|---|---|
| `POST /handoff` | stage the brief, attachments, storyboard and production contracts |
| `GET /events` | stream read-only progress events with SSE |
| `POST /slides/regenerate` | write a stable-slide revision request |
| `GET /health`, `GET /providers` | inspect runtime and provider readiness without returning secrets |
| `POST /agent/launch` | return or explicitly launch an allowlisted local Agent command |

The current Bridge is intentionally **not** a public, authenticated, standalone `POST /generate` service. It binds to localhost for safety. A server deployment still needs either:

1. an Agent runner such as Codex/Claude Code/OpenClaw that executes the Skill; or
2. your own orchestrator that calls the repository scripts, persists `DeckSession`, runs quality gates and publishes artifacts.

Do not expose the current Bridge directly to the internet. See [Agent Connect Bridge](./docs/guides/agent-connect-bridge.md) for the exact boundary and deployment patterns.

## The artifact contract

The workflow is inspectable and resumable because important decisions are written to files:

| Artifact | What it proves |
|---|---|
| `project-brief.json` | user request, inferred brief, route, assumptions and `expectationFit` |
| `storyboard.json` | stable slide IDs, page roles, variants, evidence references and editability targets |
| `asset_plan.json` | every image slot, source policy and status; generated rows carry `current_generation_evidence` |
| `source-map.json` | traceable source claims used by the deck |
| `spec_lock.md` | compact execution contract for visual consistency |
| `quality-report.json` | rendered-review findings, delivery readiness and known blockers |
| `pipeline-state.json` | digest proving export is tied to the latest passing checks |

## Quality gates contributors can run

```bash
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
npm run audit:v6-workspace
npm run audit:web-console
npm run audit:docs
npm run audit:image-contracts
npm run audit:featured-decks
```

Formal PPTX projects also support:

```bash
python3 scripts/audit_formal_delivery.py <project>
python3 scripts/audit_design_completion.py <project>
python3 scripts/audit_visual_recipes.py <project>
python3 scripts/audit_pptx_native_objects.py <final.pptx> --expect text,shape
```

## Architecture at a glance

```text
Web / Desktop workspace
        │
        ▼
DeckSession  ── intake → outline → generating → review → delivered
        │
        ▼
Local Bridge ── source extraction · SSE · handoff · slide revisions · cache
        │
        ▼
Agent / orchestrator ── storyboard · asset plan · generation · audits
        │
        ├── Editable PPTX
        └── Magazine Web Deck
```

The legacy contracts (`project-brief.json`, `storyboard.json`, `asset_plan.json`, `quality-report.json` and Bridge handoff) remain compatible in v6.

## Safety and graceful degradation

- The Bridge binds to localhost and never returns provider secrets to the browser.
- Private source material stays local unless the user explicitly approves upload.
- Official logos, QR codes, seals, card faces and campaign IP require an official/user-provided asset or an explicit replacement blocker.
- Generated visuals should not contain Chinese body copy; editable/vector layers carry labels and text.
- Missing image backends produce actionable prompts and filenames instead of fabricated success.
- The system does not pretend a sample preview is a finished deliverable when no real source has been provided.

## Known Limits

- The production-quality generation path is still Agent/orchestrator-led; the Bridge is not yet a multi-tenant headless generation service.
- Decks above roughly 16 pages should use the resume workflow after planning.
- PowerPoint-specific rendering can vary by Office version and installed fonts; use the native-object and visual checks before external delivery.
- Free-form Canva-style canvas editing, deal-room analytics and complex multiplayer collaboration are intentionally out of scope for v6.

<details><summary><strong>Capability history and canonical release links</strong></summary>

[Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) · [Simplified Web Console v4.1](./docs/release/release-notes-v4.1.0.md) · [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) · [v4.3 Rendered Review Loop](./docs/quality/rendered-review-loop-v4.3.md) · [Release Notes - v5.0.0](./docs/release/release-notes-v5.0.0.md) · [Release Notes - v5.1.0](./docs/release/release-notes-v5.1.0.md) · [Release Notes - v5.2.0](./docs/release/release-notes-v5.2.0.md) · [Release Notes - v5.3.0](./docs/release/release-notes-v5.3.0.md) · [v5.4 Swiss Deck and Asset Factory](./docs/release/release-notes-v5.4.1.md) (`examples/swiss-v54-demo/index.html`, `npm run audit:swiss-deck`) · [v6.0.0](./docs/release/release-notes-v6.0.0.md)
</details>

## Documentation Map

| Goal | Guide |
|---|---|
| Understand the v6 workspace | [Web Experience](./docs/guides/web-experience.md) |
| Connect local files and Agents | [Agent Connect Bridge](./docs/guides/agent-connect-bridge.md) |
| Install the Agent Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| Choose PPTX, Web Deck or Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| Configure models and providers | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| Review v6 changes | [v6.0.0 Release Notes](./docs/release/release-notes-v6.0.0.md) |
| Troubleshoot | [Troubleshooting](./docs/guides/troubleshooting.md) |

## Contributing

Issues, reproducible source examples, proof packs, layout directions, provider adapters and quality checks are welcome. Please keep public claims tied to an executable test, audit, documented proof or release note.

## License and Acknowledgments

MIT. Guizang v1.1.0 informed the fixed editorial rhythm; Baoyu Skills v2.5.2 informed parts of the generation-evidence chain. This repository maintains its own implementation, safety rules and quality contracts.

If this project helps you turn “AI-generated slides” into something you can actually deliver, consider starring the repository — it makes the work easier for the next person to discover.
