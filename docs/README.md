# Documentation Map

Ultimate PPT Master v6 uses a categorized documentation structure. Start with the route that matches the work you are doing.

The canonical GitHub homepage is the Chinese [`README.md`](../README.md). Use [`README.en.md`](../README.en.md) for the complete English product overview.

## Guides

| Need | Read |
|---|---|
| Understand the web front door | [Web Experience](./guides/web-experience.md) |
| Connect the web page to local files and Agents | [Agent Connect Bridge](./guides/agent-connect-bridge.md) |
| Install and invoke the Skill | [Agent Setup](./guides/agent-setup.md) |
| Choose PPTX, Web Deck, dual delivery, or desktop preview | [Choosing a Workflow](./guides/choosing-a-workflow.md) |
| Configure provider keys locally | [Model and Provider Setup](./guides/model-provider-setup.md) |
| Use the desktop preview path | [Quickstart Desktop](./guides/quickstart-desktop.md) |
| Debug setup, parsing, output, provider, or Agent issues | [Troubleshooting](./guides/troubleshooting.md) |

## Quality

| Need | Read |
|---|---|
| Turn rendered issues into safe revision briefs | [Rendered Review Loop v4.3](./quality/rendered-review-loop-v4.3.md) |
| Plan AI-generated decks with DeckIR, page maps, and rendered review | [DeckIR AI Planning Workflow v4.2](./quality/deckir-ai-planning-workflow-v4.2.md) |
| Understand the v4.0 visual contract | [Hybrid-Editable Visual Workflow v4.0](./quality/hybrid-editable-visual-workflow-v4.0.md) |
| Review the stable proof matrix | [Quality Workbench v2.5](./quality/quality-workbench-v2.5.md) |
| Audit the v2.5 quality-workbench completion evidence | [Completion Audit v2.5](./quality/completion-audit-v2.5.md) |
| Compare with upstream presentation tooling | [Upstream Benchmark - May 2026](./quality/upstream-benchmark-2026-05.md) |
| Review technology signals that influenced the roadmap | [GitHub Technology Scan - May 2026](./quality/github-tech-scan-2026-05.md) |

## Release

| Need | Read |
|---|---|
| Review the current GitHub release | [Release Notes - v6.3.8](./release/release-notes-v6.3.8.md) |
| Review the previous formal release | [Release Notes - v6.3.7](./release/release-notes-v6.3.7.md) |
| Review the v6.3.5 refinement and runtime slice | [Candidate Notes - v6.3.5](./release/release-notes-v6.3.5.md) |
| Review the v6.3.4 session and delivery slice | [Candidate Notes - v6.3.4](./release/release-notes-v6.3.4.md) |
| Review the v6.3.3 source and evidence slice | [Candidate Notes - v6.3.3](./release/release-notes-v6.3.3.md) |
| Review the v6.3.2 visual and security slice | [Candidate Notes - v6.3.2](./release/release-notes-v6.3.2.md) |
| Review the v6.3.1 Chinese-first boundary | [Draft Notes - v6.3.1](./release/release-notes-v6.3.1.md) |
| Review the v5.4 Swiss Deck and Asset Factory release | [Release Notes - v5.4.1](./release/release-notes-v5.4.1.md) |
| Review the v5.3 best-effect brief enhancer | [Release Notes - v5.3.0](./release/release-notes-v5.3.0.md) |
| Review the v5.2 expectation-fit contract | [Release Notes - v5.2.0](./release/release-notes-v5.2.0.md) |
| Review the v5.1 guided-intake release | [Release Notes - v5.1.0](./release/release-notes-v5.1.0.md) |
| Review the v5 delivery-defaults release | [Release Notes - v5.0.0](./release/release-notes-v5.0.0.md) |
| Review the rendered-review loop release | [Release Notes - v4.3.0](./release/release-notes-v4.3.0.md) |
| Review the AI planning release | [Release Notes - v4.2.0](./release/release-notes-v4.2.0.md) |
| Review the hybrid-editable release | [Release Notes - v4.0.0](./release/release-notes-v4.0.0.md) |
| Review the formal handoff release | [Release Notes - v3.0.0](./release/release-notes-v3.0.0.md) |
| Maintain release checks, Pages, Homebrew, signing, and privacy | [Release and Maintenance](./release/release-maintenance.md) |
| Prepare Homebrew distribution | [Homebrew Distribution Plan](./release/homebrew-distribution.md) |

## Strategy

| Need | Read |
|---|---|
| Understand product positioning | [Product Positioning](./strategy/product-positioning.md) |
| Review the v5.2 deep optimization PRD | [v5.2 Deep Optimization Guide / PRD](./zh-CN/strategy/prd-v5.2-deep-optimization-guide.md) |
| Improve public GitHub exposure | [Public Growth Playbook](./strategy/public-growth-playbook.md) |
| Prepare marketplace or agent-directory distribution | [Skill Market Distribution](./strategy/skill-market-distribution.md) |
| Review the archived v2.5–v5.5 content/template roadmap | [Historical Roadmap - Content and Template Presets](./strategy/next-roadmap.md) |
| Review the archived v2.5 optimization backlog | [Historical Optimization Directions](./strategy/next-optimization-directions.md) |

## Trace Map

| Question | First check | Evidence to keep |
|---|---|---|
| Does the web app build? | `npm run build:web` | `apps/web/dist`, Pages workflow logs. |
| Did the local handoff work? | Bridge manifest and generated folder | `source.md`, `extracted-source.md`, `storyboard.json`, `source-map.json`, `manifest.json`, `quality-report.json`, `codex-task.md`. |
| Did v4.0 visual governance run? | `npm run audit:docs` and visual recipe commands | `spec_lock.md`, `assets/generated/page-visuals/manifest.json`, audit output. |
| Is marketplace readiness still true? | `npm run audit:market` | `agents/openai.yaml`, `agents/marketplace-listing.json`, benchmark page. |
| Is CI healthy? | `.github/workflows/ci.yml` | Web build, desktop build, worker tests, Node tests, audits, whitespace check. |

中文用户请从 [中文主 README](../README.md) 或 [中文文档索引](./zh-CN/README.md) 开始。

## Active consolidation

- [v6.3.8 consolidation working note](./strategy/v6-3-8-consolidation.md)

