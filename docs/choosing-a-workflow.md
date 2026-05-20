# Choosing a Workflow

Ultimate PPT Master is intentionally not a single-path product. Different users need different levels of control.

## Quick Decision

| Choose this | When | Tradeoff |
|---|---|---|
| **Desktop App** | You want to drag in material, choose a delivery scene, preview, and export without learning the script system. | Fastest start, simplest UX; deep generation still hands off to an agent. |
| **Agent Skill** | You want the best current output quality and are comfortable with Codex, Claude Code, Hermes, OpenClaw, Cursor, Cline, Roo, or Windsurf-style tools. | More powerful but requires an agent that can read files and run commands. |
| **Desktop + Agent** | You want a product-like intake flow and production-grade final polishing. | Best release workflow today: simple front door, deep back office. |
| **Direct API** | You are building your own integration or worker adapter. | Reserved convention in v2.0.0; not a complete built-in generation engine yet. |

## Best Results Today

For quality, the best route is:

1. Use Desktop App to create a local project and extract/normalize source material.
2. Open the Workbench and copy the Agent handoff prompt.
3. Let Codex, Claude Code, Hermes, OpenClaw, or another coding agent read `AGENTS.md` and `SKILL.md`.
4. Have the agent run the full workflow: source analysis, strategy, design spec, page generation, preview, validation, PPTX export, and repair.

This works better than a plain direct model call because a local agent can:

- inspect the real files and generated outputs;
- run Python/Node validation scripts;
- revise individual slides after seeing failures;
- preserve local privacy and logs;
- use repository-specific design references instead of a one-shot prompt.

## Desktop App

Use it when the user needs a normal product experience:

- file import or text/Markdown input;
- recommended output mode and style;
- local project folder;
- PPTX/Web preview;
- open output folder;
- provider status and language switch;
- handoff to an agent only when the user wants deeper control.

The desktop app is not a full PowerPoint editor. It is the product surface for intake, preview, orchestration, export, and handoff.

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

## Direct API

The `.env.example` includes reserved variables such as:

```dotenv
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4.1
```

These variables are for future adapters or custom bridges. In v2.0.0, they do not replace the agent workflow.

