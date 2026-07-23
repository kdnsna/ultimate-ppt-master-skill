# 终极融合PPT大师 Portable Prompt

Copy this prompt into any AI coding assistant, project rule, system prompt, or custom instruction field when the tool does not support a native skills directory.

```text
You have access to the local repository "终极融合PPT大师 / Ultimate Fusion PPT Master".

Repository root: set this as SKILL_DIR.

Use SKILL_DIR/SKILL.md as the source of truth whenever the user asks to create, convert, polish, or redesign a PPT, PowerPoint, slide deck, presentation, 演示文稿, or 幻灯片.

/* BEGIN GENERATED:workflow-policy */
Best-Effect Brief Enhancer: before route selection or production, rewrite the user's short instruction into `bestEffectBrief`. Record prompt quality (`complete`, `thin`, or `extreme-thin`), auto-expanded audience/scenario/message/page-count/style/source/asset assumptions, recommended route, and what was inferred.

Extreme Thin Prompt Fallback: for a generic request such as "做一个 PPT", "做个 PPT", "帮我做 PPT", "make a deck", "turn this into slides", or only a topic with no source material, do not make the user write a perfect prompt. Unless the user explicitly asks for formal / editable / government / finance / training PPTX, use Style A Editorial Fixed Rhythm by default:

- Mode 2: Magazine Web Deck;
- Style A · 电子杂志 × 电子墨水;
- 8 pages by default;
- cover surface: light-or-warm-paper;
- page rhythm: light or warm-paper cover with one strong title, minimal subtitle, and one soft-edged visual/evidence panel; light context page for problem, trend, or setting; image/text or restrained signal spread for tension or opportunity; light structure page with a three-part framework, path, or method; large-statement section divider; evidence / scene / case page; point-of-view page with final judgment or question; use dark only when the user, reference, or chosen direction calls for it; light closing page with action, takeaway, or ending line;
- ask only when facts, sources, brand/IP, compliance, or route choice would materially change the deliverable.

If the user explicitly asks for a formal editable deck, government/finance/training/report material, or `.pptx`, switch to formal editable PPTX while keeping `bestEffectBrief` and the same quality checks. Default formal cover is light/near-white; dark covers only when user/brand/art-direction require them.

Do not force a PPTX vs Web choice before generation when the request is classifiable. Auto-route from policy. Quality modes: quick / standard (default) / audit. Source import defaults to --copy; --move is advanced. Draft evidence states start as unmapped when sources exist but claims are not bound.
Default visual foundation: paper #F6F3ED, ink #171714.
/* END GENERATED:workflow-policy */

For user-facing setup, configuration, or troubleshooting questions, read SKILL_DIR/docs/README.md first, then follow the specific guide for desktop, agent setup, provider setup, or troubleshooting.

1. Editable PowerPoint (PPTX)
   Best for formal reports, consulting/business decks, training material, and files that others must edit later. Output is a .pptx with editable text, shapes, charts, and slide elements.

2. Magazine-style web deck (HTML)
   Best for talks, launches, demo days, personal keynotes, and highly visual presentations. Output is a single index.html with horizontal navigation, editorial magazine / e-ink visual style, and motion. The original editorial/e-ink style is the default; Swiss Style is available when the user asks for Swiss, grid, Helvetica, product, data, or engineering presentation aesthetics. WebGL backgrounds are optional, not required by default.

Use the web deck route when the user explicitly asks for HTML, web PPT, magazine/editorial/e-ink, Swiss Style, horizontal swipe, keynote/showcase/demo-day, browser-first delivery, or when the Extreme Thin Prompt Fallback selects Style A Editorial Fixed Rhythm.

For editable PPTX mode, follow SKILL_DIR/SKILL.md "Mode 1: Editable PPTX Workflow".
For magazine web deck mode, follow SKILL_DIR/SKILL.md "Mode 2: Magazine Web Deck Workflow".

Use Python 3.10+ for scripts. Prefer SKILL_DIR/.venv/bin/python if available.
Node.js is only needed for Swiss Style web deck validation and Web Experience tooling.
Load references progressively: only read the files needed for the selected mode.
```

After pasting this prompt, point the assistant at the cloned repository path and ask it to use the skill.
