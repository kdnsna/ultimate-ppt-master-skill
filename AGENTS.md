# 终极融合PPT大师 Agent Entry

Use this repository as a portable presentation-generation skill package for agentic coding tools such as Codex, OpenClaw, Hermes, Cursor, Cline, Roo Code, and other assistants that can read local Markdown instructions and run local scripts.

## How To Load

1. Treat `SKILL.md` as the source of truth.
2. Resolve this repository root as `SKILL_DIR`.
3. Follow `SKILL.md` before generating any presentation files.
4. Use `assets/`, `references/`, `templates/`, `workflows/`, and `scripts/` only when the selected workflow needs them.
5. Keep both public entry points discoverable: the v6 task-first workspace / Agent Bridge for guided local handoff, and the Agent Skill for production workflow use. The v5.4.1 console remains a one-cycle Classic fallback only.

## v6 Session Contract

Prefer the shared `DeckSession` phases `intake / outline / generating / review / delivered`. Preserve stable `slideId` values across storyboard, source map, preview, PPTX, review findings, repair plans, and resumable handoffs. Generate a fast structural draft before expensive visual refinement, and regenerate a selected slide instead of rebuilding the full deck whenever possible.

## Invocation

Use this skill when the user asks to create, rewrite, convert, or polish a PPT, PowerPoint, deck, slide deck, presentation, 演示文稿, or 幻灯片.

Best-Effect Brief Enhancer: before choosing a route or generating files, rewrite the user's short instruction into `bestEffectBrief`. Record prompt quality, auto-expanded audience/scenario/message/page-count/style/source/asset assumptions, recommended route, and which decisions came from the user vs the Agent.

Extreme Thin Prompt Fallback: for generic requests like "做一个 PPT", "make a deck", or a topic-only prompt with no formal/editable signal, default to Style A Editorial Fixed Rhythm. Use Mode 2, Style A · 电子杂志 × 电子墨水, 8 pages by default, and a stable page rhythm: dark cover, light context, dark tension/opportunity, light structure, large divider, evidence/scene, dark point-of-view, light closing.

If the user explicitly asks for a formal editable deck, `.pptx`, government/finance/training/report material, or files that another person must revise, switch to formal editable PPTX while keeping the same `bestEffectBrief` and quality checks.

1. Editable PowerPoint (`.pptx`)
2. Magazine-style web deck (`index.html`; default editorial/e-ink style, optional Swiss Style)

Use the web deck route when the user explicitly asks for HTML, web PPT, magazine/editorial/e-ink, Swiss Style, horizontal swipe, keynote/showcase/demo-day, browser-first delivery, or when the Extreme Thin Prompt Fallback selects Style A Editorial Fixed Rhythm.

## Runtime

Use Python 3.10+ for scripts. If a local `.venv` exists, prefer `.venv/bin/python`; otherwise create one and install `requirements.txt`. Node.js is only needed when validating Swiss Style web decks with `scripts/validate-swiss-deck.mjs`.

For macOS PPTX compatibility output, Cairo may be required:

```bash
brew install cairo pkg-config
```

## Tool Notes

- Codex can install this repository under `~/.codex/skills/ultimate-ppt-master`.
- Claude Code can install it under `~/.claude/skills/ultimate-ppt-master`.
- OpenClaw, Hermes, and similar tools can either place this repository in their skills/rules directory if they provide one, or reference this `AGENTS.md` / `SKILL.md` from the project workspace.
- Tools without a skill system can paste `PROMPT.md` into their system prompt or project rules.

## Docs And Traceability

- Human docs start at `docs/README.md`.
- Agent setup details live in `docs/guides/agent-setup.md`.
- Provider/model configuration lives in `docs/guides/model-provider-setup.md`.
- Troubleshooting evidence paths live in `docs/guides/troubleshooting.md`.
- Public issue templates live in `.github/ISSUE_TEMPLATE/`.

When reporting or fixing issues, preserve the trace path: command run, project path, `desktop-manifest.json`, `sourceExtraction`, `sources/source.md`, `logs/desktop-worker.log`, and generated file paths. Do not commit private source documents, raw business outputs, `.env`, or API keys.
