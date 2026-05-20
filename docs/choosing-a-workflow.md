# Choosing a Workflow

Ultimate PPT Master is intentionally not a single-path product. The public direction is web-first, with Agent Skill as the important production route.

## Quick Decision

| Choose this | When | Tradeoff |
|---|---|---|
| **Web Experience** | You want a quick public trial, a shareable front door, or a guided way to generate an Agent prompt. | Fastest start; it does not generate decks by itself in MVP. |
| **Agent Skill** | You want the best current output quality and are comfortable with Codex, Claude Code, Hermes, OpenClaw, Cursor, Cline, Roo, or Windsurf-style tools. | More powerful, but requires an agent that can read files and run commands. |
| **Web Experience + Agent Skill** | You want a polished intake flow and production-grade local generation. | Recommended path: simple web front door, deep agent production loop. |
| **Desktop Later / Local Preview** | You want to inspect the Tauri app or help maintain future native packaging. | Useful for development, but not the near-term public install path. |
| **Direct API** | You are building your own integration or worker adapter. | Reserved convention in v2.1.0; not a complete built-in generation engine yet. |

## Best Results Today

For quality and low-friction onboarding, the best route is:

1. Open the Web Experience and choose source type, scenario, output mode, visual style, language, agent tool, and model preference.
2. Copy the generated Agent handoff prompt.
3. Provide the prompt plus local source path to Codex, Claude Code, Hermes, OpenClaw, or another capable local agent.
4. Let the agent read `AGENTS.md` and `SKILL.md`, then run source analysis, strategy, design spec, page generation, preview, validation, PPTX export, and repair.

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
- clear choices for source, scenario, output, style, language, agent, and model preference;
- copy-ready Agent prompt;
- downloadable `source.md` template;
- visible Skill setup route.

The Web Experience is not a hosted slide generator in MVP. It is the low-cost product explanation and handoff surface.

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

These variables are for future adapters or custom bridges. In v2.1.0, they do not replace the agent workflow.
