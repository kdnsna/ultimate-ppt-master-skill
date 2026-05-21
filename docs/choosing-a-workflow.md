# Choosing a Workflow

Ultimate PPT Master is intentionally not a single-path product. The public direction is web-first, with Local Agent Bridge for real source intake and Agent Skill as the production route.

## Quick Decision

| Choose this | When | Tradeoff |
|---|---|---|
| **Web Experience** | You want a quick public trial, a shareable front door, a live Web Deck preview, or a guided way to assemble a deck brief and Agent handoff kit. | Fastest start; it generates a useful preview and handoff kit, but final decks still come from the Skill route in MVP. |
| **Web Experience + Bridge** | You want to drag in PDF/Word/PPTX/Excel/URL sources and keep them local. | Requires one local command, but it creates a real handoff folder and local parse status. |
| **Agent Skill** | You want the best current output quality and are comfortable with Codex, Claude Code, Hermes, OpenClaw, Cursor, Cline, Roo, or Windsurf-style tools. | More powerful, but requires an agent that can read files and run commands. |
| **Web Experience + Bridge + Agent Skill** | You want a polished intake flow and production-grade local generation. | Recommended path: simple web front door, local parsing, deep agent production loop. |
| **Desktop Later / Local Preview** | You want to inspect the Tauri app or help maintain future native packaging. | Useful for development, but not the near-term public install path. |
| **Direct API / Provider Dashboard** | You want local provider readiness checks. | Bridge can test providers without exposing keys; final deck production still uses Agent/Skill. |

## Best Results Today

For quality and low-friction onboarding, the best route is:

1. Open the Web Experience and choose source type, scenario, output mode, visual style, language, agent tool, and model preference.
2. Paste rough source notes, add URLs, or drag in PDF/Word/PPTX/Excel/Markdown files.
3. Run `npm run bridge` and send the task to the local Bridge, or download `handoff-kit.zip`.
4. Open the generated handoff folder in Codex, Claude Code, Hermes, OpenClaw, or another capable local agent.
5. Let the agent read `AGENTS.md` and `SKILL.md`, then run source analysis, strategy, design spec, page generation, preview, validation, PPTX export, and repair.

This works better than a plain direct model call because a local agent can:

- inspect the real files and generated outputs;
- run Python/Node validation scripts;
- revise individual slides after seeing failures;
- preserve local privacy and logs;
- use repository-specific design references instead of a one-shot prompt.

## Web Experience

Use it when the user needs a normal public first touch:

- no install;
- no account;
- no backend upload;
- no model key;
- optional local Bridge detection;
- clear choices for source, scenario, output, style, language, agent, and model preference;
- pasted notes, URL intake, and file drop area;
- generated outline and readiness check;
- dual-engine route cards for Hugo He / ppt-master PPTX and op7418 / Guizang Web Deck production;
- live `preview-web-deck.html` iframe and HTML download;
- copy-ready Agent prompt, `source.md`, `extracted-source.md`, and `manifest.json`;
- downloadable `handoff-kit.zip` with `attachments/`, `engine-plan.md`, and `quality-checklist.md`;
- visible Skill setup route.

The Web Experience is not a hosted slide generator. It is the low-cost product explanation, source intake, and handoff surface.

## Agent Connect Bridge

Use it when source types need to be real, not decorative:

- PDF, Word, PPTX, Excel, Markdown, text, and URL intake;
- local parsing through `scripts/source_to_md/*`;
- provider status without browser-side key storage;
- local handoff project under `~/UltimatePPTMaster/handoffs`;
- safe default that returns Agent commands instead of auto-launching.

Start it with:

```bash
npm run bridge
```

## Agent Skill

Use it when the user wants production depth:

- real narrative strategy;
- editable PPTX generation;
- magazine-style Web Decks;
- custom template and visual references;
- chart/data/image/audio workflows;
- iterative verification.

The agent entry files are:

- `AGENTS.md`: neutral entry for Codex and generic coding agents.
- `CLAUDE.md`: Claude Code project memory.
- `SKILL.md`: authoritative generation workflow.
- `PROMPT.md`: fallback for tools without a native skill directory.

## Desktop Later / Local Preview

The desktop app is not removed. It remains useful for:

- local product experiments;
- Tauri UI work;
- future signed and notarized app packaging;
- future Homebrew distribution;
- advanced local workflows after the web funnel proves useful.

Developer setup lives in [Quickstart Desktop](./quickstart-desktop.md). Signing, notarization, and Homebrew work live in [Release and Maintenance](./release-maintenance.md) and [Homebrew Distribution Plan](./homebrew-distribution.md).

## Direct API

The `.env.example` includes reserved variables such as:

```dotenv
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4.1
```

These variables are read by the v2.3 Bridge provider dashboard and can be used by custom adapters. They do not replace the agent workflow.
