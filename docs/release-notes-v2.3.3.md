# Release Notes - v2.3.3

v2.3.3 is a Web Experience onboarding release. It keeps the production boundary honest:

> the web page prepares the project, Bridge writes it locally, and the Agent Skill remains the high-quality production route.

## Biggest Improvement

First-time users no longer have to understand every technical term before taking the first step. The home page now explains:

- **Local connector (Bridge)**: the localhost service that lets the static page read local files, detect installed agents, and write handoff projects.
- **AI helper (Agent)**: Codex, Hermes, OpenClaw, Claude Code, or another local tool that continues the deck work.
- **Model account (API key)**: the local secret used by model providers; the browser only shows readiness status.
- **Local project folder (handoff)**: the folder containing sources, instructions, previews, manifests, and the command for the agent.

## What Changed

- Split the dense Web Experience into guided menu pages: Start, Sources, Configuration, AI helper handoff, and Preview.
- Added one-click Bridge / agent / provider checks and automatic selection of an available local agent.
- Made Codex, Hermes, OpenClaw, and Claude Code detection generic so the page does not assume one specific local tool.
- Exposed content preset packs in the web UI, including source requirements, template candidates, recommended routes, and quality checks.
- Kept the handoff artifacts inspectable: `source.md`, `extracted-source.md`, `manifest.json`, `agent-prompt.md`, `project-brief.json`, `preview-web-deck.html`, `engine-plan.md`, `quality-checklist.md`, and `README.md`.

## Quality Bar

v2.3.3 verifies the current promise through Web + Bridge output: the static page can prepare a brief, Bridge can create a real local project folder, and the generated files are ready for a local AI helper.

It does **not** claim that the browser directly generates final production PPTX files or hosted model outputs. Final quality still belongs to the local Agent Skill workflow.

## Upgrade

```bash
cd ultimate-ppt-master-skill
npm run update
```

Then run:

```bash
npm run doctor
npm run bridge
```

Open the Web Experience, check the Configuration page, and send a sample brief to Bridge.
