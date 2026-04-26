# 终极融合PPT大师 For Claude Code

This repository is a portable Agent Skill package. When Claude Code sees this file, it should use `SKILL.md` as the primary workflow for all PPT, PowerPoint, slide deck, and presentation-generation requests.

## Required Behavior

- Trigger on PPT / PowerPoint / deck / slides / presentation / 演示文稿 / 幻灯片 requests.
- For generic “make a PPT” requests, ask the user to choose:
  1. Editable PowerPoint (`.pptx`)
  2. Magazine-style web deck (`index.html`)
- Do not generate slides before the user chooses a mode, unless the mode is already explicit.
- Keep source files, generated projects, and exported decks inside the user’s workspace unless the user specifies another location.

## Workflow Source

Read `SKILL.md` first. Load extra files only as needed:

- Editable PPTX mode: `references/`, `templates/`, `scripts/`
- Magazine web deck mode: `assets/magazine-web/`, `references/magazine-web/`

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
