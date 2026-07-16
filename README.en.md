# Ultimate PPT Master v6

> **Turn real source material into a native PowerPoint that people can keep editing.** Supported text, shapes, charts, and notes remain editable; sources, assumptions, and quality findings stay inspectable before delivery.

<p align="center">
  <a href="./README.md"><strong>中文主页</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Live Workspace</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>Finished Work & Proof</strong></a> ·
  <a href="./docs/README.md"><strong>English Docs</strong></a>
</p>

<p align="center">
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/kdnsna/ultimate-ppt-master-skill?style=flat-square"></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-172033?style=flat-square"></a>
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.7"><img alt="GitHub Release v6.3.7" src="https://img.shields.io/badge/GitHub_Release-v6.3.7-1D4ED8?style=flat-square"></a>
  <img alt="local first" src="https://img.shields.io/badge/local--first-yes-10B981?style=flat-square">
  <img alt="editable PPTX" src="https://img.shields.io/badge/output-editable_PPTX-2563EB?style=flat-square">
</p>

![Finished presentation cases from Ultimate PPT Master v6](assets/readme/v6-finished-decks.png)

## Two finished artifacts you can inspect now

| Representative case | Inspect it |
|---|---|
| **Formal editable PPTX** · sanitized executive review | [Download the repository PPTX](./examples/executive-business-review-starter/executive-business-review-editable.pptx) · [View key slides](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/executive-business-review-starter/web-demo.html) · [Read the quality report](./examples/executive-business-review-starter/quality-report.json) |
| **AI Web Deck** · GPT-5.6 “Three Orbits” | [Open the complete nine-slide deck](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/ai-frontier-2026/gpt-5-6.html) · [Browse the gallery](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) |

The PPTX is a sanitized public proof artifact, not customer work. Recheck any public file in the target PowerPoint/WPS environment before using it in a real meeting.

## One-minute install

```bash
npx skills add kdnsna/ultimate-ppt-master-skill --skill ultimate-ppt-master
```

Then tell your Agent: “Use `$ultimate-ppt-master` to turn this source into a ten-slide editable PPTX for management. Lead with the decision and keep every number traceable.”

For a guided intake surface, open the [v6 Workspace](https://kdnsna.github.io/ultimate-ppt-master-skill/). The hosted page is only a UI; generation connects to the local Bridge on your computer.

> **Local boundary:** source files, provider secrets, and generated projects stay on your machine by default. This is not a hosted one-click PPT SaaS, and the current Bridge should not be exposed directly to the public internet.

Already have a PowerPoint to inspect? Use [PPTLint](https://github.com/kdnsna/pptlint) for a local delivery check, then let Ultimate work only on the named slides and objects.

## It optimizes for delivery, not only preview

Most AI presentation tools optimize the first impression. Ultimate asks whether the result can:

- remain editable in PowerPoint instead of becoming full-slide images;
- explain where each number, claim, and asset came from;
- preserve stable `slideId` values when only one slide changes;
- degrade explicitly when models or assets are unavailable;
- pass rendered review, native-object inspection, and an artifact-bound quality report.

It is designed for formal reports, business reviews, consulting proposals, training, finance/government material, branded communication, and browser-first editorial Web Decks.

## Three delivery routes

| What you need | Recommended route | Deliverable |
|---|---|---|
| Formal reports, consulting, training, finance/government work, or files another person must revise | **Editable PowerPoint** | `.pptx`, notes, sources, and quality evidence |
| Keynotes, public talks, demo days, or browser-first storytelling | **Magazine Web Deck** | responsive HTML with editorial or Swiss information design |
| A browser experience and a formal handoff | **Dual delivery** | separate Web and PPTX projects sharing the same source and plan |

PowerPoint remains the primary final editing environment. Ultimate handles the work around it: source intake, narrative planning, visual direction, asset policy, generation, review, and recovery.

## What you can start with

- PDF, Word, Excel, Markdown, a URL, or text pasted into the task;
- a topic-only instruction expanded by the Best-Effect brief;
- an existing PPTX used as source, visual reference, or a precisely scoped repair target;
- user-provided brand guides, logos, images, and a previous deck.

A reference deck is style-only by default: reuse master/layout rhythm, theme typography, and colors without copying private content. Office vector assets are preserved as first-class inputs when the toolchain supports them.

## From one task to a finished handoff

1. **Input** — add files, URLs, text, or an existing PPTX; state the audience and job.
2. **Storyboard** — answer at most three material questions, then inspect slide jobs, evidence, and gaps.
3. **Design & Generate** — compare complete visual directions, build a structural draft, and refine only what needs work.
4. **Refine & Deliver** — revise by stable `slideId`, inspect artifacts, and complete the final check in PowerPoint.

![The v6 task-first workspace](assets/readme/v6-workspace.png)

The first screen no longer leads with Bridge, provider, DeckIR, or script settings. Professional contracts and diagnostics remain available; the Classic console stays temporarily accessible through `?classic=1`.

## Stable defaults for thin prompts

The **Best-Effect Brief Enhancer** turns an extremely thin prompt into an inspectable **Auto-expanded brief** covering audience, scenario, message, page count, route, source boundaries, and Agent assumptions.

- An explicit editable/formal/report/government/finance/training or `.pptx` signal selects formal PPTX.
- An explicit HTML/editorial/magazine/Swiss/browser-first signal selects a Web Deck.
- A topic-only prompt with no formal signal uses **Style A Editorial Fixed Rhythm** as a stable eight-slide default.

The Agent asks only when facts, source authority, brand/IP permission, or delivery format materially change the result.

## Built for formal, editable work

- Office-safe CJK typography and presentation-scale text are the default.
- Slide jobs and conclusions come before charts, images, tables, and layout choices.
- Official logos, QR codes, seals, card faces, and campaign IP require a real source or an explicit replacement blocker.
- Numbers and claims enter a source map; missing evidence stays visible instead of becoming invented certainty.
- Six visual directions cover cover, body, data, chart, image, section, and closing behavior.
- Repeated layout and page-recipe checks resist the “big title plus three cards” default.

The executable design contract lives in [`DESIGN.md`](./DESIGN.md). Production ideas from [`guizang-ppt-skill`](https://github.com/op7418/guizang-ppt-skill), [`baoyu-design`](https://github.com/JimLiu/baoyu-design), and [`awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) informed the discipline. We also reviewed the light-canvas, reading-rhythm, and rendered-QA methods in [`gzh-design-skill`](https://github.com/isjiamu/gzh-design-skill) through a clean-room process. Because that project is AGPL-3.0, this repository copies none of its code, prompts, components, or templates.

## How to read the public proof

The [Finished Work & Proof page](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) follows `input → planning → output → quality review`:

- the formal PPTX case exposes sanitized source, editable output, key slides, native-object evidence, and a quality report;
- the Web Deck case exposes the full deck, source links, and responsive result;
- business review, consulting, product pitch, and technology trend cases remain in the secondary library;
- Proof Pack scores are **self-assessed by Design Doctor**, not third-party benchmarks.

For an existing-deck before/after trail, inspect the [PPTLint Proof Loop](https://kdnsna.github.io/pptlint/proof-loop/comparison.html). Scores support the evidence; they never replace full-size visual review in PowerPoint or WPS.

## Inspectable, resumable artifacts

| Artifact | What it records |
|---|---|
| `project-brief.json` | task, expanded brief, route, assumptions, and `expectationFit` |
| `storyboard.json` | stable `slideId`, page roles, selected variants, and evidence links |
| `asset_plan.json` | asset source policy, status, and `current_generation_evidence` |
| `source-map.json` | sources and claims actually used |
| `spec_lock.md` | compact visual and page execution contract |
| `quality-report.json` | rendered findings, delivery state, and known blockers |
| `pipeline-state.json` | digest proving export follows the latest passing checks |

If an image backend is unavailable, an asset becomes `Needs-Manual` with a prompt, filename, and placement target. The workflow does not silently report success.

## Full workspace setup

Use this path when you need the Web Workspace, local Bridge, and repository scripts:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Then open the hosted Workspace. It connects only to `127.0.0.1`; the Bridge is not a public authenticated queue, multi-tenant service, or general file server.

## Existing-PPTX repair boundary

Existing-deck work is preservation-first: edit only selected slides and objects while locking visible copy, numbers, conclusions, slide count, order, links, and all unselected slides.

Never import and re-export the whole deck to simulate a local repair. If no native, package-preserving object editor is available, return concise PowerPoint/WPS steps instead of producing a file that may damage masters, transparency, groups, or links.

After a real edit, render and compare the changed slides in PowerPoint, WPS, or LibreOffice; then run PPTLint as supporting evidence.

## Known limits

- Production-quality generation remains Agent/orchestrator-led; the Bridge is not a standalone cloud `POST /generate` API.
- Decks above roughly 16 slides should use the resume workflow after planning to reduce context drift.
- Rendering varies with Office version and installed fonts; public proof cannot guarantee pixel identity everywhere.
- Canva-style free-form editing, multiplayer collaboration, cloud accounts, and marketing deal rooms remain out of scope.
- A structural preview is not a final PPTX; a real artifact, quality state, and human review complete delivery together.

## Documentation

| Goal | Read |
|---|---|
| Browse English documentation | [Documentation Map](./docs/README.md) |
| Understand the v6 Workspace | [Web Experience](./docs/guides/web-experience.md) |
| Connect local files and Agents | [Agent Connect Bridge](./docs/guides/agent-connect-bridge.md) |
| Install the Agent Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| Choose PPTX, Web Deck, or Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| Configure models and providers | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| Troubleshoot | [Troubleshooting](./docs/guides/troubleshooting.md) |
| Review the current release | [v6.3.7 Release Notes](./docs/release/release-notes-v6.3.7.md) |

Detailed HTTP interfaces, artifact tables, contributor gates, and compatibility notes live in [`docs/`](./docs/README.md), outside the first-run path.

## License and acknowledgments

MIT. Reproducible source cases, proof artifacts, visual directions, and quality checks are welcome. Public claims should stay tied to a real artifact, executable audit, or explicit release note.

If this project helps turn “AI-generated slides” into work you can actually hand off, consider starring it so the next person can find it more easily.
