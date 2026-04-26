# 终极融合PPT大师 Agent Entry

Use this repository as a portable presentation-generation skill package for agentic coding tools such as Codex, OpenClaw, Hermes, Cursor, Cline, Roo Code, and other assistants that can read local Markdown instructions and run local scripts.

## How To Load

1. Treat `SKILL.md` as the source of truth.
2. Resolve this repository root as `SKILL_DIR`.
3. Follow `SKILL.md` before generating any presentation files.
4. Use `assets/`, `references/`, `templates/`, `workflows/`, and `scripts/` only when the selected workflow needs them.

## Invocation

Use this skill when the user asks to create, rewrite, convert, or polish a PPT, PowerPoint, deck, slide deck, presentation, 演示文稿, or 幻灯片.

For generic requests like “做一个 PPT” or “make a deck”, first show the two output modes and wait for the user to choose:

1. Editable PowerPoint (`.pptx`)
2. Magazine-style web deck (`index.html`)

Do not start conversion or generation before the user chooses a mode unless the user already made the mode explicit.

## Runtime

Use Python 3.10+ for scripts. If a local `.venv` exists, prefer `.venv/bin/python`; otherwise create one and install `requirements.txt`.

For macOS PPTX compatibility output, Cairo may be required:

```bash
brew install cairo pkg-config
```

## Tool Notes

- Codex can install this repository under `~/.codex/skills/ultimate-ppt-master`.
- Claude Code can install it under `~/.claude/skills/ultimate-ppt-master`.
- OpenClaw, Hermes, and similar tools can either place this repository in their skills/rules directory if they provide one, or reference this `AGENTS.md` / `SKILL.md` from the project workspace.
- Tools without a skill system can paste `PROMPT.md` into their system prompt or project rules.
