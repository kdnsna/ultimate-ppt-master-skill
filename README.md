# Ultimate PPT Master - v5.4.1

Local-first AI presentation production for real office work. Give it a natural-language request, notes, a file, or a URL; the agent first writes a `bestEffectBrief`, then chooses editable PPTX, Style A Editorial Fixed Rhythm Web Deck, or Style B Swiss International Web Deck with source, image, and quality records.

<p align="center">
  <strong>v5.4.1</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./docs">Docs</a> · <a href="./docs/release/release-notes-v5.4.1.md">v5.4.1 Release Notes</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Open Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Proof Packs</strong></a>
  ·
  <a href="./docs/release/release-notes-v5.4.1.md"><strong>v5.4.1 Notes</strong></a>
  ·
  <a href="./docs/guides/agent-connect-bridge.md"><strong>Agent Bridge</strong></a>
</p>

## Real Proof Packs

The public proof page keeps the existing `/benchmark/` URL for compatibility, but the surface is a Proof Packs gallery: input -> preset -> output -> review. Scores are self-assessed by Design Doctor, and the rubric is linked instead of presented as an external benchmark.

| Proof pack | Thin input signal | Output |
|---|---|---|
| Executive Business Review | 159-word sanitized source, first line: "Executive Business Review Starter Source" | [web-demo](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/executive-business-review-starter/web-demo.html) |
| Consulting Proposal | 120-word sanitized source, first line: "Consulting Proposal Starter Source" | [web-demo](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/consulting-proposal-starter/web-demo.html) |
| Product Pitch | 127-word sanitized source, first line: "Product Pitch Starter Source" | [web-demo](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/product-pitch-starter/web-demo.html) |
| Tech Trend Web Deck | 128-word sanitized source, first line: "Tech Trend Web Deck Starter Source" | [web-demo](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/tech-trend-web-deck-starter/web-demo.html) |

![Executive review proof cover](examples/executive-business-review-starter/cover.svg)
![Consulting proof cover](examples/consulting-proposal-starter/cover.svg)
![Product pitch proof cover](examples/product-pitch-starter/cover.svg)

## Routes

| Need | Route | Output |
|---|---|---|
| Formal report, consulting deck, training deck, government/finance material, or explicit editable request | Editable PPTX | PowerPoint-ready deck with editable text, shapes, charts, tables, notes, and quality checks. |
| Only a topic or extremely thin prompt with no formal/editable signal | Style A Editorial Fixed Rhythm | Stable 8-page editorial/e-ink HTML deck, with the request expanded into an Auto-expanded brief first. |
| Data, KPI, grid, methodology, product analysis, Helvetica, or information-design signal | Style B Swiss International | Locked Sxx layout Web Deck checked by `npm run audit:swiss-deck`. |
| Browser showcase plus formal handoff | Dual delivery | Separate Web and PPTX projects with shared source and route records. |

The user does not need a special prompt. Use natural language; the Best-Effect Brief Enhancer expands an extremely thin prompt before production.

## What It Can Do

| Work | How the system handles it |
|---|---|
| Leadership update | Clarifies audience, source confidence, owner actions, and final decision ask before PPTX production. |
| Consulting proposal | Converts diagnosis, options, recommendation, and roadmap into an editable business deck. |
| Training material | Keeps structure, examples, exercises, and speaker notes editable for later teaching use. |
| Product or KPI story | Uses Style B when grid, metric, method, comparison, or evidence density matters. |
| Public talk or demo day | Uses Web Deck rhythm when visual pacing matters more than PowerPoint editing. |
| One-line idea | Expands the request into `bestEffectBrief` before choosing route, style, assumptions, and risk notes. |
| Branded or IP-heavy material | Requires official/user-provided assets or blocks external release until replacements are authorized. |

## Product Loop

```text
request or source
  -> Best-Effect Brief Enhancer
  -> route decision
  -> project-brief.json
  -> source and asset planning
  -> page roles and storyboard
  -> generated no-text visuals when useful
  -> PPTX or Web Deck assembly
  -> rendered review
  -> quality report and safe repair plan
```

## Handoff Guarantees

| Guarantee | What to inspect |
|---|---|
| Brief is not just the raw user sentence | `project-brief.json.bestEffectBrief` |
| Image generation is not historical reuse | `asset_plan.json.items[].current_generation_evidence` |
| Manual image gaps are visible | `Needs-Manual` rows and expected filenames |
| Export is tied to current checks | `pipeline-state.json` digest and quality result |
| Public proof is inspectable | proof source, web demo, and `quality-report.json` |

## 60-second quickstart

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Then open the [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/). The Bridge writes local handoff files; the Agent Skill remains the production engine.

Agent invocation example:

```text
Use $ultimate-ppt-master with any natural-language presentation request. It will expand the request into a best-effect brief, choose PPTX or Web Deck, and run the matching quality checks.
```

## Dependencies and Degradation

| Dependency | Used for | If missing |
|---|---|---|
| Python 3.10+ | source conversion, audits, PPTX/SVG workflows | `npm run doctor` marks this as critical. |
| Node.js 18+ and npm | Web Experience, Bridge, Node tests | Web/Bridge commands are unavailable until installed. |
| `.venv` Python packages | `python-pptx`, source tools, audits | `npm run setup` installs them; doctor reports missing modules. |
| Provider keys in `~/.ppt-master/.env` | LLM and image generation | no image key writes `Needs-Manual` prompts instead of failing the whole deck. |
| `curl_cffi` | WeChat or high-security page fetches | source fetch falls back to Node/plain requests where possible. |
| Rust/Cargo | native desktop packaging | Web Experience and Bridge still work. |

`npm run doctor` is the first troubleshooting command. It names what is missing and whether the missing piece is critical or only affects a provider-specific path.

## Capabilities

| Capability | Executable contract |
|---|---|
| Best-Effect Brief Enhancer | `project-brief.json` records `bestEffectBrief`, prompt quality, route, assumptions, and caveats. |
| Asset Factory | `asset_plan.json` is created before `image_prompts.json`; generated rows require `current_generation_evidence`. |
| Image evidence | `scripts/image_gen.py --asset-plan` writes run id, backend, prompt hash, file hash, width, height, and timestamp. |
| Image audit | `npm run audit:image-contracts` rejects stale or missing generated evidence. |
| Swiss Web Deck | `examples/swiss-v54-demo/index.html` is checked by `npm run audit:swiss-deck`. |
| Style A Web Deck | `examples/magazine-v54-demo/index.html` is checked by `npm run audit:magazine-deck`. |
| Quality proof | `pipeline-state.json` records the latest quality pass before PPTX export. |
| Review loop | rendered review writes findings first; repair remains explicit and report-first. |

## Core Artifacts

- `project-brief.json`: the production brief with `bestEffectBrief`, `visualBrief`, `guidedBrief`, and `expectationFit`.
- `asset_plan.json`: parent image plan with slot, source policy, prompt path, status, and evidence expectations.
- `images/image_prompts.json`: generated-item prompt manifest derived from the asset plan.
- `source-map.json`: traceable source claims used by the deck.
- `storyboard.json`: page map with roles, recipes, evidence refs, and editability targets.
- `spec_lock.md`: compact execution lock; long decks use page slices instead of rereading a swollen file.
- `quality-report.json`: delivery, planning, expectation, and rendered-review status.
- `pipeline-state.json`: current quality-gate digest for export safety.

## Known Limits

- Generated images should not contain Chinese body text; labels and titles belong in editable/vector layers.
- Decks above about 16 pages should use resume-execute slices after planning, not one long continuous run.
- `Needs-Manual` image rows must be supplied as files or replaced with explicit labeled placeholders before page assembly.
- If an official logo, QR code, card face, or campaign mark cannot be sourced safely, the external-release path is blocked until an authorized replacement is provided.
- Style A has a structural magazine validator; Style B has stricter Swiss layout signatures and image-slot checks.
- The hosted Web Experience prepares and exports handoff projects; the production-quality deck generation path is still Agent/Skill-led.

## Capability Matrix

| Layer | Proof |
|---|---|
| v5.4 Swiss Deck and Asset Factory | [Release Notes - v5.4.1](./docs/release/release-notes-v5.4.1.md) |
| v5.3 Best-Effect Brief Enhancer | [Release Notes - v5.3.0](./docs/release/release-notes-v5.3.0.md) |
| v5.2 expectation-fit contract | [Release Notes - v5.2.0](./docs/release/release-notes-v5.2.0.md) |
| v5.1 guided intake | [Release Notes - v5.1.0](./docs/release/release-notes-v5.1.0.md) |
| v5.0 delivery defaults | [Release Notes - v5.0.0](./docs/release/release-notes-v5.0.0.md) |
| v4.3 Rendered Review Loop | [Rendered Review Loop v4.3](./docs/quality/rendered-review-loop-v4.3.md) |
| v4.2 DeckIR AI Planning Workflow | [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) |
| Simplified Web Console v4.1 | [Release Notes - v4.1.0](./docs/release/release-notes-v4.1.0.md) |
| v4.0 Hybrid-Editable Visual Workflow | [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) |
| Quality Workbench v2.5 | [Quality Workbench v2.5](./docs/quality/quality-workbench-v2.5.md) |

## Documentation Map

| Need | Read |
|---|---|
| Use the Web Experience | [Web Experience](./docs/guides/web-experience.md) |
| Connect local files and agents | [Agent Connect Bridge](./docs/guides/agent-connect-bridge.md) |
| Install the Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| Choose PPTX vs Web Deck vs Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| Configure local providers | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| Review release maintenance | [Release and Maintenance](./docs/release/release-maintenance.md) |
| Troubleshoot setup | [Troubleshooting](./docs/guides/troubleshooting.md) |
| Browse all docs | [Docs Index](./docs/README.md) |

## Acknowledgments

Guizang v1.1.0 informed the fixed editorial rhythm and Swiss-style validation expectations. Baoyu Skills v2.5.2 informed the generation evidence chain. This MIT repository keeps its own implementation and documents upstream review in the maintenance docs rather than using upstream project names as public feature names.

The README promise must stay tied to executable checks: public claims here are backed by a script, test, audit, documented proof pack, or release note.
