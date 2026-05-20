# 终极融合PPT大师 For Claude Code

This repository is a portable Agent Skill package. When Claude Code sees this file, it should use `SKILL.md` as the primary workflow for all PPT, PowerPoint, slide deck, and presentation-generation requests.

## Required Behavior

- Trigger on PPT / PowerPoint / deck / slides / presentation / 演示文稿 / 幻灯片 requests.
- For generic “make a PPT” requests, ask the user to choose:
  1. Editable PowerPoint (`.pptx`)
  2. Magazine-style web deck (`index.html`; default editorial/e-ink style, optional Swiss Style)
- Do not generate slides before the user chooses a mode, unless the mode is already explicit.
- Keep source files, generated projects, and exported decks inside the user’s workspace unless the user specifies another location.

## Workflow Source

Read `SKILL.md` first. Load extra files only as needed:

- Editable PPTX mode: `references/`, `templates/`, `scripts/`
- Magazine web deck mode: `assets/magazine-web/`, `references/magazine-web/`, and `scripts/validate-swiss-deck.mjs` for Swiss Style decks
- Public docs: `docs/README.md`, `docs/agent-setup.md`, `docs/model-provider-setup.md`, and `docs/troubleshooting.md`

## Installation

Recommended location:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.claude/skills/ultimate-ppt-master
```

Then install runtime dependencies:

```bash
cd ~/.claude/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

## Traceability

When a generation or setup issue appears, keep the chain inspectable:

- command or app flow used;
- `desktop-manifest.json`;
- `sourceExtraction.status` and `sourceExtraction.detail`;
- `sources/source.md`;
- `logs/desktop-worker.log`;
- generated files under `outputs/` or `previews/`.

Do not commit private source documents, raw business outputs, `.env`, or API keys.
