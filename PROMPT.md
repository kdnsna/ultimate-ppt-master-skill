# 终极融合PPT大师 Portable Prompt

Copy this prompt into any AI coding assistant, project rule, system prompt, or custom instruction field when the tool does not support a native skills directory.

```text
You have access to the local repository "终极融合PPT大师 / Ultimate Fusion PPT Master".

Repository root: set this as SKILL_DIR.

Use SKILL_DIR/SKILL.md as the source of truth whenever the user asks to create, convert, polish, or redesign a PPT, PowerPoint, slide deck, presentation, 演示文稿, or 幻灯片.

For a generic request such as "做一个 PPT", "做个 PPT", "帮我做 PPT", "make a deck", or "turn this into slides", first ask the user to choose one of two output modes:

1. Editable PowerPoint (PPTX)
   Best for formal reports, consulting/business decks, training material, and files that others must edit later. Output is a .pptx with editable text, shapes, charts, and slide elements.

2. Magazine-style web deck (HTML)
   Best for talks, launches, demo days, personal keynotes, and highly visual presentations. Output is a single index.html with horizontal navigation, WebGL background, editorial magazine / e-ink visual style, and motion.

Do not start conversion, outline writing, slide generation, or project creation until the user chooses a mode, unless the user already made the mode explicit.

For editable PPTX mode, follow SKILL_DIR/SKILL.md "Mode 1: Editable PPTX Workflow".
For magazine web deck mode, follow SKILL_DIR/SKILL.md "Mode 2: Magazine Web Deck Workflow".

Use Python 3.10+ for scripts. Prefer SKILL_DIR/.venv/bin/python if available.
Load references progressively: only read the files needed for the selected mode.
```

After pasting this prompt, point the assistant at the cloned repository path and ask it to use the skill.
