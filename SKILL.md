---
name: ultimate-ppt-master
description: >
  终极融合PPT大师 / Ultimate Fusion PPT Master: AI-driven presentation
  generation system. Converts source documents (PDF/DOCX/XLSX/URL/Markdown) into
  either editable PPTX decks or editorial/Swiss magazine web slide decks. Use
  automatically when the user asks to create or transform content into a
  presentation, slide deck, PowerPoint, PPT, or PPTX, including phrases such as
  "create PPT", "make presentation", "make a deck", "build slides",
  "turn this into slides", "生成PPT", "做PPT", "做一个ppt", "做一个 PPT",
  "做个PPT", "做个 PPT", "制作演示文稿", "生成演示文稿", "把这个做成PPT",
  "把这份材料做成PPT", "杂志风PPT", "网页PPT", "horizontal swipe deck",
  "editorial magazine presentation", or mentions "终极融合PPT大师",
  "ultimate-ppt-master", "deckweaver", or "ppt-master".
---

# 终极融合PPT大师 Skill

> Ultimate Fusion PPT Master: a Codex skill that fuses editable PPTX generation with magazine-style web deck generation.

**Core Pipeline**: `Input → Storyboard → Design & Generate → Refine & Deliver`

## v6 Task-First Operating Model

Treat this Skill as the local quality and workflow layer around PowerPoint, not as a replacement for PowerPoint's native editor. The default user-facing sequence is:

1. **Input** — accept a one-line task, files, URLs, or an existing PPTX; infer technical settings instead of exposing them first.
2. **Storyboard** — ask at most three material questions, then show slide jobs, evidence bindings, and explicit gaps.
3. **Design & Generate** — offer three complete visual directions with cover/body/data behavior, create a deterministic structural draft first, and refine only selected or audit-failed slides.
4. **Refine & Deliver** — work by stable `slideId`; preserve editable PowerPoint objects and finish formal editing in PowerPoint.

Bridge, providers, DeckIR, scripts, and JSON contracts remain available in professional/diagnostic mode. Preserve `project-brief.json`, `storyboard.json`, `asset_plan.json`, `quality-report.json`, and existing Bridge handoff compatibility. When a `DeckSession` is present, keep its phases (`intake / outline / generating / review / delivered`) and stable `slideId` values through every artifact.

When an existing PPTX is supplied as a visual or brand reference, run:

```bash
python3 ${SKILL_DIR}/scripts/pptx_template_import.py <reference.pptx> --manifest-only --reference-style-mode style-only
```

Use the resulting `reference-style.json` to reuse master/layout rhythm, theme fonts and colors, placeholders, chart treatment, and common page roles without copying private content.

### Existing PPTX Repair Mode

When a handoff includes `attachments/pptlint-repair-plan.json`, treat the source PPTX as the deliverable being repaired, not merely as source material for a new deck:

- use a fast, manual-first repair path; skip storyboard generation, visual-direction exploration, image acquisition, element-kit generation, and full-deck production steps that do not directly change the named objects;
- read the selected repair tasks before planning and touch only their named slides;
- keep every visible character, number, datum, conclusion, slide count, slide order, and unselected slide unchanged unless the user explicitly unlocks one of them;
- never import and re-export the whole source deck through Artifact Tool, SVG, or another reconstruction pipeline for a local repair; these routes can reinterpret masters, transparency, placeholders, grouped objects, links, and untouched slides;
- use only a native, package-preserving object edit path that can change the named PowerPoint objects without rebuilding the rest of the presentation;
- improve hierarchy, alignment, spacing, contrast, font consistency, and visual completion with native editable PowerPoint objects;
- if no native package-preserving editor is available, do not generate a repaired PPTX; return the short PowerPoint/WPS steps immediately instead of starting the normal deck-production pipeline;
- if a selected problem cannot be improved without breaking a lock, preserve the original page and report the exact decision the user must make;
- after an actual native edit, render the changed slides through PowerPoint, WPS, or LibreOffice and inspect the before/after at full size; missing visible objects, black/changed backgrounds, broken logos, changed links, or unintended movement are hard failures;
- write a separate repaired PPTX, run `pptlint proof`, and treat its score/rule result as supporting evidence only. Never issue a success claim or Verified credential from text/rule checks without the rendered visual review.

This mode is a targeted revision path. It must not silently turn a repair request into a new storyboard, change the narrative, regenerate unaffected pages, or spend full-generation time on a small local fix.

**Quality Pipeline Add-on**: stakeholder-facing decks must also pass `Visual Direction → Page Role Contract → Visual Completion Audit`.

## Best-Effect Brief Enhancer

Before route selection or production, convert the user's raw request into a `bestEffectBrief`. This is mandatory for direct Agent use, because many users will only write a short topic or "帮我做个 PPT".

The `bestEffectBrief` must record:

- raw user request summary;
- prompt quality: `complete`, `thin`, or `extreme-thin`;
- auto-expanded brief: audience, scenario, core message, page count, narrative arc, output route, style direction, source boundaries, asset/IP policy, and assumptions;
- recommended route: `guizang-web-fixed-style`, `formal-editable-pptx`, or `dual-delivery`;
- fixed fallback decision and why it was selected;
- what came from the user vs what the Agent inferred.

### Route Decision Order

Use this deterministic order before Default Delivery Route. First match wins; formal/editable keywords outrank prompt thinness.

| Order | Decision key | Trigger | Result |
|---:|---|---|---|
| 1 | `explicit-formal-signal` | `pptx`, `.pptx`, `PowerPoint`, 可编辑, 汇报, 报告, 政府, 金融, 培训, 审计, consulting/business report, or a stakeholder-revised file | `formal-editable-pptx` |
| 2 | `explicit-web-signal` | 杂志风, 网页PPT, HTML, 横滑, Swiss/瑞士风, editorial/e-ink, browser-first, keynote/showcase/demo-day | `magazine-web-deck` |
| 3 | `extreme-thin-fallback` | only a topic, or <=25 characters/words with no audience, scenario, source, page count, style, or core-message signal | `guizang-web-fixed-style` |
| 4 | `thin-guided-intake` | has a topic plus at least one signal above, but lacks source or core content | staged questions |
| 5 | `complete-source-first` | source and production context are sufficient | continue source-first |

When in doubt, run the fixture-backed classifier:

```bash
python3 ${SKILL_DIR}/scripts/best_effect_router.py "<raw user request>"
```

### Extreme Thin Prompt Fallback

If the user provides only a topic, a one-line request, or almost no source material, do not make the user write a perfect prompt first. Unless the user explicitly asks for formal / editable / government / finance / training PPTX, use this stable default:

- Route: `Guizang-like Magazine Web Deck fixed style`;
- Mode: `Mode 2: Magazine Web Deck`;
- Style: `Style A · 电子杂志 × 电子墨水`;
- Length: 8 pages unless the user gives another count;
- Page rhythm:
  1. dark cover with one strong title and minimal subtitle;
  2. light context page for problem, trend, or setting;
  3. dark image/text spread for tension or opportunity;
  4. light structure page with a three-part framework, path, or method;
  5. large-statement section divider;
  6. evidence / scene / case page;
  7. dark point-of-view page with final judgment or question;
  8. light closing page with action, takeaway, or ending line.

This fallback is the "stable high-quality output" path. The Agent may ask one focused question only when missing facts, brand/IP permission, compliance boundaries, or source authority would materially change the deck. Ordinary style gaps are filled by the fixed style.

If the user explicitly asks for a formal editable deck, government/finance/training/report material, or `.pptx`, switch to `formal-editable-pptx`: create a 8-12 page editable PPTX brief with Microsoft YaHei, formal-business quality gate, source confidence, official/IP asset plan, and the same `bestEffectBrief` record.

## Brief Clarity Gate

Before production, decide whether the request came through a visual Web brief or through direct Codex conversation:

- **Web Visual Brief Builder**: read `project-brief.json.visualBrief`, `guidedBrief`, and `expectationFit`. The Web tags are user intent, not decoration. Pasted background and special requirements override tag defaults when they conflict.
- **Codex Guided Intake**: when a direct Codex request does not provide enough detail, do not jump straight into final-quality PPT production. Ask step by step until the production frame is clear.
- **Source-first**: when strong source files and target context are already present, record assumptions and continue.
- **Draft-with-assumptions**: only use this when the user explicitly asks for a draft, first pass, or "先按默认做一版".

For direct Agent use, run the Best-Effect Brief Enhancer before guided intake. Ask staged questions only when `bestEffectBrief` cannot safely infer a production path.

Guided intake may inspect these items, but ask no more than three user-facing questions before presenting a storyboard. Infer non-risky technical choices and expose remaining details as editable assumptions:

1. usage scenario and target audience;
2. desired audience action or decision;
3. source material and authoritative content boundary;
4. core message and must-include points;
5. page count, chapter structure, and speaker-note needs;
6. visual style and density;
7. brand, official/IP assets, AI-image permission, and must-avoid rules;
8. output format, defaulting to editable PPTX.

After the user answers, write a concise confirmation brief. Proceed only when `expectationFit.readyForProduction = true`, or when the user explicitly accepts a draft with recorded assumptions.

## Default Delivery Route

The skill is optimized for real office PPT delivery. Keep the route decision simple:

- For generic but non-empty business requests with enough formal context, default to **Mode 1: Editable PPTX** and proceed after the `bestEffectBrief`.
- For extreme-thin requests such as "做一个关于 AI 的 PPT", "帮我做 PPT", "make a deck", or only a topic with no formal/editable signal, default to **Mode 2: Magazine Web Deck** using the **Guizang-like Magazine Web Deck fixed style**.
- Choose **Mode 1: Editable PPTX** when the user asks for PowerPoint, `.pptx`, editable files, business reports, consulting decks, training material, government/finance material, or anything another person may need to revise.
- Choose **Mode 2: Magazine Web Deck** when the user explicitly asks for magazine style, web PPT, HTML slides, horizontal swipe deck, editorial/e-ink, Swiss Style, keynote/showcase/demo-day style, browser-first delivery, or when the Extreme Thin Prompt Fallback is active.
- If the user asks for both, produce separate deliverables in separate project folders.
- Ask the user to choose only when the request is genuinely route-ambiguous and the scenario cannot decide it. Ask one concise question, then continue.

Plain-language wording for generic requests:

> 我会先把你的简短指令自动扩写成最佳效果 brief；如果只有主题/一句话且没有明确要求正式可编辑 PPTX，我会默认走 Guizang-like 杂志风网页 PPT，先出一版稳定高质量版本。若你要正式汇报或可编辑文件，我会改走 PPTX。

## Formal Business Delivery Gate

Default to `qualityGate.level = "formal-business"` for business/report/consulting/training/government/finance decks and for any deliverable expected to be handed to a real stakeholder. This is the default quality bar unless the user explicitly asks for a quick draft.

Before generating final PPTX or Web Deck files, lock these items in `design_spec.md`, `spec_lock.md`, and `design-quality-report.md`:
- Visual direction selection from `templates/visual-directions/`, or a documented `custom` benchmark when no direction fits.
- Page role and recipe contract: every page has `page_role`, `visual_weight`, `layout_family`, `page_recipe_id`, `asset_requirement`, `visual_layer`, `raster_policy`, and `anti_patterns` in `design_spec.md` / `spec_lock.md`.
- Brand assets or a documented fallback strategy.
- Official/IP asset plan for deterministic marks mentioned by the source or user, such as company logos, campaign logos, tourism IP, product marks, QR codes, seals, and partner marks. Search official or authorized sources first; never draw a fake logo-shaped placeholder.
- Traceable evidence sources and data interpretation boundaries.
- Codex native GPT image generation (`image2` when available) as the default visual asset engine for custom visuals; this is the Codex execution path for "ChatGPT/OpenAI as the primary visual asset engine". Record prompts, filenames, target slides, and manual edits in `asset-plan.md` or `images/image_prompts.md`.
- Reusable small element asset plan when useful: section dividers, metric badges, process nodes, connectors, icon accents, textures, and callout stickers.
- Local element generation state from `scripts/generate_visual_element_kit.py`: `assets/generated/element-manifest.json`, `images/image_prompts.json`, and `images/image_prompts.md`.
- Public asset search plan for evidence, official references, and brand boundaries, or explicit no-search rationale; record source URL, publisher, license/usage note, and insertion target for each selected public asset.
- `spec_lock.md brand_assets` and `asset-plan.md` / `images/image_sources.json` entries for every deterministic IP mark that will appear in the deck. Each entry must record `official-source`, `user-provided`, `text-lockup-fallback`, or `needs-authorized-replacement`.
- Image, chart, and infographic plan, or an explicit no-image strategy.
- Page rhythm, layout variety, and the role of each slide.
- `spec_lock.md aesthetic_checks` covering body font baseline, title/body scale, card count, card padding, whitespace target, logo handling, and repeated-layout risk.
- 4.0 hybrid-editable visual strategy: generated visuals support the page as no-text layers; formal body pages remain editable.
- Visual completion status: screenshots/PNGs rendered, repeated-layout risk checked, placeholder assets labeled, and design-quality-report written.
- Artifact checks for editable PPTX objects and complete Web Deck visual rendering.

Formal delivery rules:
- Do not build a whole deck from repeated title-and-card pages.
- Do not let three consecutive content pages use the same layout family unless the Design Spec records a deliberate reason.
- Do not let three consecutive content pages use the same page recipe unless the Design Spec records a deliberate reason.
- Do not use full-page generated images for formal PPTX body pages. Full-page raster is allowed only for covers, section/tail pages, poster/KV pages, Web showcase pages, or explicit user override recorded in `raster_policy`.
- Do not proceed with only slide titles unless the deck is clearly marked as a draft and the user accepts that limitation.
- Do not use a generic "free design" look when a visual direction pack matches the deck context. Select the direction pack first, then adapt.
- Treat Codex native GPT image generation (`image2` when available) as the primary visual asset engine when visuals can improve the deck. Generate composed supporting visuals and small reusable micro-assets before final slide assembly.
- Do not rely on random stock imagery or pure element stacking. Each AI visual must have a scene/composition role: background atmosphere, evidence illustration, process accent, conceptual metaphor, product/context scene, or no-text visual layer.
- Generate and reuse a coherent element kit when it helps: small section dividers, metric badges, process nodes, connectors, icon accents, subtle patterns, and callout stickers.
- Run `python3 scripts/generate_visual_element_kit.py <project_path>` before final slide assembly for formal decks with repeated micro-assets. If no image backend/key and no host-native image tool is available, continue with `Needs-Manual` prompts in `images/image_prompts.md`; do not block the whole deck.
- Use public/official/reusable asset search mainly for factual evidence, official references, and brand boundaries; document the source and usage boundary before insertion.
- For fixed IP names in the source, run official-source search before generation. Examples: `交通银行`, `好客山东`, `文旅大戏`, product/card names, partner organizations, city/tourism brands, app/mini-program marks, event marks. Prefer official websites, press releases, media kits, government/public-service portals, or user-provided files. Third-party logo download sites may be used only as search clues, not as final source evidence.
- Deterministic IP assets are not decorative icons. Insert the real asset when officially sourced or user-provided; otherwise use a clean text lockup with a visible/documented replacement note. Do not create a fake symbol, generic badge, or "looks similar" mark.
- Store Codex/GPT/OpenAI generated assets under `assets/generated/` or the project image folder, and insert them as real assets.
- Private source material, internal screenshots, customer data, and API keys stay local unless the user explicitly approves upload.
- PPTX output must use editable text, shapes, charts, images, and notes; do not flatten slides into full-page screenshots.
- Logo and brand marks must use real assets, clean vector treatment, or a documented text fallback; logo must not degrade into text fragments such as `b` / `c`.
- Known logos and campaign IP marks must not be replaced by arbitrary shapes, initials, icon badges, or generated approximations. If the official asset cannot be acquired safely, block external release in `design-quality-report.md` and record `needs-authorized-replacement`.
- For Web Decks, verify desktop/mobile visual completeness, media rendering, and layout variety.
- Design Doctor is report-only by default. Do not auto-repair SVG unless the user explicitly requests automatic repair.

## Delivery Design Defaults

Use these defaults unless the user, brand guide, or selected template explicitly overrides them:

- **Font family**: default CJK and body font is `"Microsoft YaHei"` (微软雅黑), with `"PingFang SC"` only as a preview fallback and `Arial` as Latin fallback. This keeps PowerPoint handoff practical and avoids web-font copyright or install risk.
- **Title/body relationship**: use Microsoft YaHei throughout for most formal decks, with weight contrast instead of extra fonts. Use serif/display contrast only when the deck needs an editorial, academic, or keynote tone and the font is pre-installed or clearly documented.
- **Theme art direction**: after reading the source and selecting the visual direction, name one subject-fit artistic concept before generation. It should be concrete enough to guide cover/tail pages and optional recurring motifs across the deck, e.g. a cultural-tourism deck might use `山海交汇 烟火同行` with coastlines, mountain silhouettes, travel-stamp rhythm, warm market lights, and restrained bank-brand structure. Do not leave the deck at "business blue" when the source has a richer theme.
- **Artistic title treatment**: unless the deck is a work report, serious government/finance compliance document, or another context where expressive titling would be inappropriate, the main title should carry the theme art direction through custom composition: layered text lockup, calligraphic-feeling strokes drawn as shapes, image-mask accents, large negative space, or motif-integrated title framing. Body copy still uses Microsoft YaHei; any display font must be installed, licensed, or replaced with drawn/vector treatment.
- **Font sizes on 16:9 PPT**: cover title 60-92px, section title 44-60px, page title 30-40px, subtitle 22-28px, body 18-24px, chart labels/captions 12-16px. Dense consulting pages usually use body 18-20px; training or keynote pages use 22-24px.
- **Scale and generosity**: avoid "small PPT" syndrome. Formal body text should normally be 20-22px when the page has 3-5 text groups; 18px is the lower bound for dense reports. If text must go below 18px, split the slide, convert prose to a table/process, or move detail to notes. Page titles should feel visibly dominant at roughly 1.6-2.0× body; card titles 1.15-1.35× body; footnotes stay visually secondary.
- **Margins and grid**: 16:9 safe margin 48-64px, title band 72-96px, footer 28-40px, primary content area aligned to a 12-column grid or a deliberate asymmetric split. No text should touch canvas edges, chart axes, or decorative layers.
- **Single-slide content limit**: one page communicates one primary judgment. Body pages should normally contain one dominant visual system plus 2-4 support points, or a dense table/chart with a clear takeaway title.
- **Layout variety**: alternate page families across body pages: chart + takeaway, image/text split, process flow, evidence table, negative-space statement, matrix, timeline, FAQ/risk stack. Avoid repeated title + three cards as the default.
- **Element discipline**: use flat shapes, crisp dividers, subtle fills, and restrained shadows. Cards are for grouped items, not for every paragraph. Icons support scanning; they do not replace content.
- **Image discipline**: generated visuals are no-text support layers unless the page is a cover, section divider, poster/showcase, or intentionally image-led Web Deck page. Formal body PPTX remains editable.
- **Polish discipline**: avoid tiny gutters, over-rounded cards, equal-weight boxes everywhere, weak title hierarchy, low-contrast gray text, orphan labels, crowded logos, random decorative lines, and unlicensed official-looking marks. Use whitespace, scale, alignment, and one clear dominant element before adding decoration.

Run the formal audit when project artifacts exist:

```bash
python3 scripts/audit_formal_delivery.py <project_path_or_artifact>
python3 scripts/audit_design_completion.py <project_path_or_artifact>
python3 scripts/audit_visual_recipes.py <project_path_or_artifact>
python3 scripts/audit_pptx_native_objects.py <final.pptx> --expect text,shape
```

If the audit fails, report the concrete issues and fix the deck before final delivery unless the user explicitly chooses to ship with known risks.

> [!CAUTION]
> ## 🚨 Global Execution Discipline (MANDATORY)
>
> **This workflow is a strict serial pipeline. The following rules have the highest priority — violating any one of them constitutes execution failure:**
>
> 1. **LEAN SERIAL EXECUTION** — Steps run in order, but do not manufacture extra waits. Once prerequisites are available, continue through non-blocking steps without asking the user to say "continue".
> 2. **BEST-EFFECT BRIEF BEFORE GUIDED INTAKE** — If the user asks directly in Codex and has not provided enough detail for a real PPT, first write `bestEffectBrief`. If the prompt is merely thin, ask staged questions only for facts, sources, brand/IP, compliance, or route decisions that materially change the deliverable. If the prompt is `extreme-thin` and the user did not explicitly request formal editable PPTX, use the Extreme Thin Prompt Fallback and produce the Guizang-like Magazine Web Deck fixed style.
> 3. **STOP ONLY FOR REAL BLOCKERS AFTER INTAKE** — After the brief is clear enough, stop only when a required source, route choice, legal/brand permission, or missing manual asset makes proceeding risky. Otherwise make reasonable assumptions, record them, and continue.
> 4. **ONE DELIVERY BRIEF AFTER INTAKE** — The guided intake may take multiple short turns when the request is vague; after that, replace further multi-round confirmations with one concise delivery brief. The Strategist still decides canvas, page count, audience, style, colors, icons, typography, and images, but these are recorded as one production contract rather than a chain of user-facing checkpoints.
> 5. **GATE BEFORE ENTRY** — Each Step has prerequisites (🚧 GATE) listed at the top; these MUST be verified before starting that Step
> 6. **NO SPECULATIVE EXECUTION** — "Pre-preparing" content for subsequent Steps is FORBIDDEN (e.g., writing SVG code during the Strategist phase)
> 7. **NO SUB-AGENT SVG GENERATION** — Executor Step 6 SVG generation is context-dependent and MUST be completed by the current main agent end-to-end. Delegating page SVG generation to sub-agents is FORBIDDEN
> 8. **SEQUENTIAL PAGE GENERATION ONLY** — In Executor Step 6, after the global design context is locked, SVG pages MUST be generated sequentially page by page in one continuous pass. Grouped page batches (for example, 5 pages at a time) are FORBIDDEN
> 9. **SPEC_LOCK RE-READ PER PAGE** — Before generating each SVG page, Executor MUST `read_file <project_path>/spec_lock.md`. All colors / fonts / icons / images MUST come from this file — no values from memory or invented on the fly. Executor MUST also look up the current page's `page_rhythm` tag and apply the matching layout discipline (`anchor` / `dense` / `breathing` — see executor-base.md §2.1). This rule exists to resist context-compression drift on long decks and to break the uniform "every page is a card grid" default
> 10. **SVG MUST BE HAND-WRITTEN, NOT SCRIPT-GENERATED** — Editable PPTX SVG pages are written by the main agent directly, one page at a time. Do not batch-generate deck SVGs with Python / Node / shell scripts.

> [!IMPORTANT]
> ## 🌐 Language & Communication Rule
>
> - **Response language**: Always match the language of the user's input and provided source materials. For example, if the user asks in Chinese, respond in Chinese; if the source material is in English, respond in English.
> - **Explicit override**: If the user explicitly requests a specific language (e.g., "请用英文回答" or "Reply in Chinese"), use that language instead.
> - **Template format**: The `design_spec.md` file MUST always follow its original English template structure (section headings, field names), regardless of the conversation language. Content values within the template may be in the user's language.

> [!IMPORTANT]
> ## 🔌 Compatibility With Generic Coding Skills
>
> - `ultimate-ppt-master` is a repository-specific workflow skill, not a general application scaffold
> - Do NOT create or require `.worktrees/`, `tests/`, branch workflows, or other generic engineering structure by default
> - If another generic coding skill suggests repository conventions that conflict with this workflow, follow this skill first unless the user explicitly asks otherwise

> [!IMPORTANT]
> ## Local Runtime Rule
>
> - Resolve `SKILL_DIR` to this skill directory before running scripts.
> - Prefer the bundled virtual environment when it exists: `${SKILL_DIR}/.venv/bin/python`.
> - Otherwise use a Python 3.10+ interpreter (`python3.13`, `python3.12`, `python3.11`, or `python3.10`). Do not run PPT Master scripts with Python 3.9 or older.
> - When command examples below say `python3`, substitute the resolved Python interpreter.

## Main Pipeline Scripts

| Script | Purpose |
|--------|---------|
| `${SKILL_DIR}/scripts/source_to_md/pdf_to_md.py` | PDF to Markdown |
| `${SKILL_DIR}/scripts/source_to_md/doc_to_md.py` | Documents to Markdown — native Python for DOCX/HTML/EPUB/IPYNB, pandoc fallback for legacy formats (.doc/.odt/.rtf/.tex/.rst/.org/.typ) |
| `${SKILL_DIR}/scripts/source_to_md/excel_to_md.py` | Excel workbooks to Markdown — supports .xlsx/.xlsm; legacy .xls should be resaved as .xlsx |
| `${SKILL_DIR}/scripts/source_to_md/ppt_to_md.py` | PowerPoint to Markdown |
| `${SKILL_DIR}/scripts/source_to_md/web_to_md.py` | Web page to Markdown (supports WeChat/high-security pages via `curl_cffi`) |
| `${SKILL_DIR}/scripts/source_to_md/web_to_md.cjs` | Legacy Node.js fallback kept for this fusion package; prefer `web_to_md.py` first |
| `${SKILL_DIR}/scripts/project_manager.py` | Project init / validate / manage |
| `${SKILL_DIR}/scripts/best_effect_router.py` | Deterministic Best-Effect route classifier backed by routing fixtures |
| `${SKILL_DIR}/scripts/analyze_images.py` | Image analysis |
| `${SKILL_DIR}/scripts/build_asset_plan.py` | Build / merge `asset_plan.json`, prompt files, and generated-item manifests before image generation |
| `${SKILL_DIR}/scripts/image_gen.py` | AI image generation (multi-provider) |
| `${SKILL_DIR}/scripts/image_search.py` | Web image search helper for PPTX image acquisition |
| `${SKILL_DIR}/scripts/svg_quality_checker.py` | SVG quality check |
| `${SKILL_DIR}/scripts/spec_lock_slice.py` | Enforce `spec_lock.md` line budget and return a per-page lock slice |
| `${SKILL_DIR}/scripts/execution_budget.py` | Require `resume-execute` split mode for decks above the page threshold |
| `${SKILL_DIR}/scripts/total_md_split.py` | Speaker notes splitting |
| `${SKILL_DIR}/scripts/finalize_svg.py` | SVG post-processing (unified entry) |
| `${SKILL_DIR}/scripts/svg_to_pptx.py` | Export to PPTX |
| `${SKILL_DIR}/scripts/validate-magazine-deck.mjs` | Static Style A magazine deck validation: placeholders, classes, rhythm, and image refs |
| `${SKILL_DIR}/scripts/validate-swiss-deck.mjs` | Static Style B Swiss deck validation using `references/magazine-web/swiss-layout-registry.json` |
| `${SKILL_DIR}/scripts/animation_config.py` | Optional object-level PPTX animation sidecar scaffolding |
| `${SKILL_DIR}/scripts/notes_to_audio.py` | Optional recorded narration audio generation |
| `${SKILL_DIR}/scripts/update_spec.py` | Propagate a `spec_lock.md` color / font_family change across all generated SVGs |
| `${SKILL_DIR}/scripts/visual_review.py` | Optional rubric-based visual review pass for generated SVG pages |
| `${SKILL_DIR}/scripts/audit_design_completion.py` | Visual-completion audit for page roles, layout repetition, assets, notes, and handoff readiness |
| `${SKILL_DIR}/scripts/generate_visual_layers.py` | Prepare no-text page visual layer prompts/manifests for hybrid-editable decks |
| `${SKILL_DIR}/scripts/audit_visual_recipes.py` | Audit page recipes, visual layers, and raster policy for 4.0 hybrid-editable decks |

For complete tool documentation, see `${SKILL_DIR}/scripts/README.md`.

## Template Index

| Index | Path | Purpose |
|-------|------|---------|
| Layout templates | `${SKILL_DIR}/templates/layouts/layouts_index.json` | Query available page layout templates |
| Scenario preset directions | `${SKILL_DIR}/templates/presets/preset-directions.json` | Seed common deck structures, source requirements, template candidates, and QA checks |
| Visual direction packs | `${SKILL_DIR}/templates/visual-directions/index.json` | Select context-specific aesthetic guardrails before Strategist writes `design_spec.md` |
| Page recipes | `${SKILL_DIR}/templates/page-recipes/index.json` | Select per-page structural recipes before generating PPTX/Web pages |
| Brand presets | `${SKILL_DIR}/templates/brands/brands_index.json` | Query available brand identity presets (color / typography / logo / voice) |
| Visualization templates | `${SKILL_DIR}/templates/charts/charts_index.json` | Query available visualization SVG templates (charts, infographics, diagrams, frameworks) |
| Icon library | `${SKILL_DIR}/templates/icons/` | See `${SKILL_DIR}/templates/icons/README.md`; search icons on demand with `ls templates/icons/<library>/ \| grep <keyword>` |
| Magazine Web Style A template | `${SKILL_DIR}/assets/magazine-web/template.html` | Single-file editorial/e-ink web deck seed |
| Magazine Web Style B template | `${SKILL_DIR}/assets/magazine-web/template-swiss.html` | Single-file Swiss Style web deck seed |
| Magazine Web references | `${SKILL_DIR}/references/magazine-web/` | Themes, layouts, components, image prompts, screenshot framing, and QA checklists |

## Standalone Workflows

| Workflow | Path | Purpose |
|----------|------|---------|
| `topic-research` | `workflows/topic-research.md` | Pre-pipeline research when the user supplies only a topic with no source files |
| `create-template` | `workflows/create-template.md` | Standalone template creation workflow |
| `create-brand` | `workflows/create-brand.md` | Standalone brand-only template creation workflow |
| `resume-execute` | `workflows/resume-execute.md` | Resume SVG execution in a fresh chat after Step 1-5 |
| `verify-charts` | `workflows/verify-charts.md` | Chart coordinate calibration before export |
| `customize-animations` | `workflows/customize-animations.md` | Optional object-level PPTX animation customization |
| `generate-audio` | `workflows/generate-audio.md` | Optional recorded narration/audio workflow |
| `live-preview` | `workflows/live-preview.md` | Browser-based live preview and annotation workflow |
| `visual-review` | `workflows/visual-review.md` | Optional per-page visual review pass after SVG generation and before post-processing |

---

## Mode 2: Magazine Web Deck Workflow

Use this workflow only when the Default Delivery Route selects the magazine-style web deck.

### Web Step 1: Clarify the Deck Brief

Choose one visual sub-style before copying a template:

| Style | Use when | Template | References |
|---|---|---|---|
| **A · 电子杂志 × 电子墨水** (default) | the user says magazine, editorial, e-ink, Monocle-like, humanistic, narrative, or does not specify a sub-style | `assets/magazine-web/template.html` | `themes.md`, `layouts.md`, `components.md` |
| **B · 瑞士国际主义 / Swiss Style** | the user says Swiss Style, 瑞士风, Helvetica, grid, information design, data-driven, product/engineering/KPI deck | `assets/magazine-web/template-swiss.html` | `themes-swiss.md`, `layouts-swiss.md`, `swiss-layout-lock.md` |

If the user has not already provided these details, ask concise questions one at a time: sub-style A/B, audience/scenario, talk duration or target page count, source material, image availability/screenshot handling, theme preference, and hard constraints. If enough information is present, proceed with a stated assumption. Preserve Style A as the default so the original magazine/e-ink aesthetic remains unchanged.

If the user needs help with structure, propose a narrative arc:

`Hook → Context → Core → Shift → Takeaway`

### Web Step 2: Create the HTML Deck Folder

Create a folder for the web deck, usually `<project_name>/ppt/`, with an adjacent `images/` directory. Copy the seed template:

```bash
mkdir -p "<project_path>/ppt/images" "<project_path>/ppt/assets"
cp "${SKILL_DIR}/assets/magazine-web/motion.min.js" "<project_path>/ppt/assets/motion.min.js"
```

Style A · editorial/e-ink:

```bash
cp "${SKILL_DIR}/assets/magazine-web/template.html" "<project_path>/ppt/index.html"
```

Style B · Swiss Style:

```bash
cp "${SKILL_DIR}/assets/magazine-web/template-swiss.html" "<project_path>/ppt/index.html"
```

Immediately replace the `<title>` placeholder in `index.html`; grep for `[必填]` and remove all remaining placeholders before delivery.

### Web Step 3: Choose Theme and Layouts

Read only the needed magazine references based on selected style:

- Style A theme choice: `${SKILL_DIR}/references/magazine-web/themes.md`
- Style A layout skeletons and theme rhythm rules: `${SKILL_DIR}/references/magazine-web/layouts.md`
- Style B theme choice: `${SKILL_DIR}/references/magazine-web/themes-swiss.md`
- Style B locked layout skeletons: `${SKILL_DIR}/references/magazine-web/layouts-swiss.md`
- Style B layout lock rules: `${SKILL_DIR}/references/magazine-web/swiss-layout-lock.md`
- Style B layout registry: `${SKILL_DIR}/references/magazine-web/swiss-layout-registry.json`
- Shared component details: `${SKILL_DIR}/references/magazine-web/components.md`
- Screenshot framing: `${SKILL_DIR}/references/magazine-web/screenshot-framing.md` (only when screenshots/UI captures are used)
- Optional generated image prompts: `${SKILL_DIR}/references/magazine-web/image-prompts.md`
- Final QA: `${SKILL_DIR}/references/magazine-web/checklist.md`

Rules:
- For Style A, use one of the five curated themes; for Style B, use one of the Swiss theme presets. Do not invent custom hex colors unless the user explicitly overrides the aesthetic system.
- Do not mix Style A and Style B class systems in one deck. Copy one template and use the matching layout reference only.
- Plan page rhythm before writing slides: every `<section>` must include `light`, `dark`, `hero light`, or `hero dark`.
- Use the layout skeletons instead of writing slides from scratch.
- Before adding slide markup, inspect the `<style>` block in `index.html` and confirm every class used by the chosen skeleton exists.
- Put images under `ppt/images/` and reference them with relative paths like `images/01-cover.jpg`.
- For Style B, every slide should carry a registered `data-layout` value from `swiss-layout-registry.json`, and local images should include `data-image-slot` when the layout defines an image slot.

### Web Step 4: Generate, Preview, and Check

Fill `<main id="deck">` with the selected sections, then run these checks:

```bash
grep -n "\\[必填\\]" "<project_path>/ppt/index.html"
grep -n 'class="slide' "<project_path>/ppt/index.html"
node "${SKILL_DIR}/scripts/validate-magazine-deck.mjs" "<project_path>/ppt/index.html"
```

For Style B, also run the static Swiss lock validator:

```bash
node "${SKILL_DIR}/scripts/validate-swiss-deck.mjs" "<project_path>/ppt/index.html"
```

Open the file directly in a browser:

```bash
open "<project_path>/ppt/index.html"
```

Use `${SKILL_DIR}/references/magazine-web/checklist.md` for final QA. P0 issues must be fixed before delivery. The output is `index.html`, not a `.pptx`.

---

## Mode 1: Editable PPTX Workflow

### Step 1: Source Content Processing

🚧 **GATE**: User has provided source material (PDF / DOCX / EPUB / URL / Markdown file / text description / conversation content — any form is acceptable).

If the user has not provided enough PPT-making context, run the **Brief Clarity Gate** before source conversion. For direct Codex requests, ask staged questions rather than assuming the full frame. If the user provides only "做个 PPT" with no topic, audience, source, or objective, do not enter topic research or production yet.

If the user provides only a topic name or brief requirements with no source files or substantive source content, run `workflows/topic-research.md` first, then return here with the generated Markdown/source materials.

When the user provides non-Markdown content, convert immediately:

| User Provides | Command |
|---------------|---------|
| PDF file | `python3 ${SKILL_DIR}/scripts/source_to_md/pdf_to_md.py <file>` |
| DOCX / Word / Office document | `python3 ${SKILL_DIR}/scripts/source_to_md/doc_to_md.py <file>` |
| XLSX / XLSM / Excel workbook | `python3 ${SKILL_DIR}/scripts/source_to_md/excel_to_md.py <file>` |
| CSV / TSV | Read directly as plain-text table source |
| PPTX / PowerPoint deck | `python3 ${SKILL_DIR}/scripts/source_to_md/ppt_to_md.py <file>` |
| EPUB / HTML / LaTeX / RST / other | `python3 ${SKILL_DIR}/scripts/source_to_md/doc_to_md.py <file>` |
| Web link | `python3 ${SKILL_DIR}/scripts/source_to_md/web_to_md.py <URL>` |
| WeChat / high-security site | `python3 ${SKILL_DIR}/scripts/source_to_md/web_to_md.py <URL>` (requires `curl_cffi`; falls back to `node web_to_md.cjs <URL>` only if that package is unavailable) |
| Markdown | Read directly |

> **Office vector assets (EMF/WMF) from DOCX/PPTX sources**: preserve extracted EMF/WMF files as first-class vector assets. Do not convert them to PNG unless the user explicitly accepts rasterization; `finalize_svg.py` skips them and `svg_to_pptx.py` embeds them as native Office media.

**✅ Checkpoint — Confirm source content is ready, proceed to Step 2.**

---

### Step 2: Project Initialization

🚧 **GATE**: Step 1 complete; source content is ready (Markdown file, user-provided text, or requirements described in conversation are all valid).

```bash
python3 ${SKILL_DIR}/scripts/project_manager.py init <project_name> --format <format>
```

Format options: `ppt169` (default), `ppt43`, `xhs`, `story`, etc. For the full format list, see `references/canvas-formats.md`.

Import source content (choose based on the situation):

| Situation | Action |
|-----------|--------|
| Has source files (PDF/MD/etc.) | `python3 ${SKILL_DIR}/scripts/project_manager.py import-sources <project_path> <source_files...> --move` |
| User provided text directly in conversation | No import needed — content is already in conversation context; subsequent steps can reference it directly |

> ⚠️ **MUST use `--move`**: All source files (original PDF / MD / images) MUST be **moved** (not copied) into `sources/` for archiving.
> - Markdown files generated in Step 1, original PDFs, original MDs — **all** must be moved into the project via `import-sources --move`
> - Intermediate artifacts (e.g., `_files/` directories) are handled automatically by `import-sources`
> - After execution, source files no longer exist at their original location

**✅ Checkpoint — Confirm project structure created successfully, `sources/` contains all source files, converted materials are ready. Proceed to Step 3.**

---

### Step 3: Template Option

🚧 **GATE**: Step 2 complete; project directory structure is ready.

**Default path — free design, no question asked.** Proceed directly to Step 4. Do NOT query `layouts_index.json` and do NOT ask the user an A/B template-vs-free-design question. Free design is the standard mode: the AI tailors structure and style to the specific content.

**Template flow is opt-in.** Enter it only when one of these explicit triggers appears in the user's prior messages:

1. User names a specific template (e.g., "用 mckinsey 模板" / "use the academic_defense template")
2. User names a style / brand reference that maps to a template (e.g., "McKinsey 那种" / "Google style" / "学术答辩样式")
3. User explicitly asks what templates exist (e.g., "有哪些模板可以用")

**Scenario preset hint (non-blocking).** If the task clearly matches a common scenario, read `${SKILL_DIR}/templates/presets/preset-directions.json` and use the matching preset to seed the narrative, source requirements, recommended slide roster, candidate charts, and quality checks. This does not force a visual template. Only copy layout/brand template files when the user explicitly requests that template, asks what templates exist and chooses one, or the handoff manifest already contains an explicit preset/template selection.

Only when a trigger fires: read `${SKILL_DIR}/templates/layouts/layouts_index.json`, resolve the match (or list available options for trigger 3), and copy template files to the project directory:

```bash
cp ${SKILL_DIR}/templates/layouts/<template_name>/*.svg <project_path>/templates/
cp ${SKILL_DIR}/templates/layouts/<template_name>/design_spec.md <project_path>/templates/
cp ${SKILL_DIR}/templates/layouts/<template_name>/*.png <project_path>/images/ 2>/dev/null || true
cp ${SKILL_DIR}/templates/layouts/<template_name>/*.jpg <project_path>/images/ 2>/dev/null || true
```

**Soft hint (non-blocking, optional).** Before Step 4, if the user's content is an obvious strong match for an existing template (e.g., clearly an academic defense, a government report, a McKinsey-style consulting deck) AND the user has given no template signal, the AI MAY emit a single-sentence notice and continue without waiting:

> Note: the library has a template `<name>` that matches this scenario closely. Say the word if you want to use it; otherwise I'll continue with free design.

This is a hint, not a question — do NOT block, do NOT require an answer. Skip the hint entirely when the match is weak or ambiguous.

> To create a new global template, read `workflows/create-template.md`

**✅ Checkpoint — Default path proceeds to Step 4 without user interaction. If a template trigger fired, template files are copied before advancing.**

---

### Step 4: Delivery Brief & Strategist Phase (MANDATORY — cannot be skipped)

🚧 **GATE**: Step 3 complete; default free-design path taken, or (if triggered) template files copied into the project.

First, read the role definition:
```
Read references/strategist.md
```

> ⚠️ **Mandatory gate in `strategist.md`**: Before writing `design_spec.md`, Strategist MUST `read_file templates/design_spec_reference.md` and produce the spec following its full I–XI section structure. See `strategist.md` Section 1 for the explicit gate rule.

> ⚠️ **Visual Direction gate**: Strategist MUST read `templates/visual-directions/index.json`, select the closest visual direction pack (or `custom`), and record why it fits, top aesthetic risks, required page roles, page recipes, and anti-patterns.

**Must complete one delivery brief**:

The delivery brief is one compact production decision, not eight separate user-facing confirmations. For Web handoff projects, read `bestEffectBrief`, `briefMode`, `visualBrief`, `guidedBrief`, and `expectationFit` from `project-brief.json` first. For direct Codex requests, create `bestEffectBrief` before any guided intake. If `bestEffectBrief.strategy = best-effect-fixed-style`, proceed with the Guizang-like Magazine Web Deck fixed style unless a fact, source, brand/IP, or compliance blocker would materially change the deliverable. Otherwise run guided intake when `expectationFit.readyForProduction` would be false. If the source, audience, and output route are sufficient, record assumptions and continue without waiting.

1. Canvas format
2. Page count range
3. Target audience
4. Style objective
5. Color scheme
6. Icon usage approach
7. Typography plan
8. Image usage approach

Also record the expectation contract:

- `bestEffectBrief`: v5.3 auto-expanded best-effect brief, prompt quality, recommended route, Extreme Thin Prompt Fallback state, fixed style, and assumptions;
- `briefMode`: `visual-tags`, `codex-guided-intake`, `source-first`, `draft-with-assumptions`, `best-effect-expanded`, or `best-effect-fixed-style`;
- `visualBrief`: selected tags, pasted background, special requirements, and reference links;
- `guidedBrief`: scenario, audience, purpose, core message, sources, page count, style, asset rules, output format, must-include, and must-avoid;
- `expectationFit`: risk level, missing signals, assumptions, conflicts, source adequacy, success criteria, and whether production is ready.

Use plain user-facing words in the brief. Avoid exposing specialist labels unless they are useful: say "可编辑正文", "页面角色", "主视觉", "图文分栏", "图表页", "风险页" instead of relying on `raster_policy`, `page_recipe_id`, or `layout_family` in chat. Keep the technical field names inside `design_spec.md` and `spec_lock.md`.

For large page counts or bulky sources, add one short split-mode note in the user's language recommending `workflows/resume-execute.md` after Step 5 by opening a fresh chat and entering `继续生成 projects/<project_name>`. For normal scale, continuous mode is the default.

Before finalizing `spec_lock.md`, enforce the context budget:

```bash
python3 ${SKILL_DIR}/scripts/spec_lock_slice.py --check-budget <project_path>
python3 ${SKILL_DIR}/scripts/execution_budget.py --page-count <N>
```

`spec_lock.md line budget`: keep `spec_lock.md` at <=120 lines. If it must grow, Executor uses `python3 ${SKILL_DIR}/scripts/spec_lock_slice.py <project_path> PNN` before each page instead of rereading the whole lock. Decks over 16 pages must use `workflows/resume-execute.md` after Step 5; the `execution_budget.py` result is authoritative.

If the user has provided images, run the analysis script **before outputting the design spec** (do NOT directly read/open image files — use the script output only):
```bash
python3 ${SKILL_DIR}/scripts/analyze_images.py <project_path>/images
```

> ⚠️ **Image handling rule**: The AI must NEVER directly read, open, or view image files (`.jpg`, `.png`, etc.). All image information must come from the `analyze_images.py` script output or the Design Specification's Image Resource List.

**Output**:
- `<project_path>/design_spec.md` — human-readable design narrative
- `<project_path>/spec_lock.md` — machine-readable execution contract (distilled from the decisions in design_spec.md; Executor re-reads this before every page). See `templates/spec_lock_reference.md` for the skeleton.
- `<project_path>/design-quality-report.md` — created or updated during verification; summarizes visual direction fit, page role coverage, assets, repeated-layout risk, and remaining blockers.

**✅ Checkpoint — Phase deliverables complete, auto-proceed to next step**:
```markdown
## ✅ Strategist Phase Complete
- [x] One delivery brief completed (or assumptions recorded)
- [x] Design Specification & Content Outline generated
- [x] Execution lock (spec_lock.md) generated
- [ ] **Next**: Auto-proceed to [Image_Generator / Executor] phase
```

---

### Step 5: Image Acquisition Phase (Conditional)

🚧 **GATE**: Step 4 complete; Design Specification & Content Outline generated, and any real blocker has been resolved.

> **Trigger condition**: at least one Design Spec image row needs `Acquire Via: ai` and/or `Acquire Via: web`. If every row is `user` or `placeholder`, skip directly to Step 6.

First build or merge the Asset Factory parent contract:

```bash
python3 ${SKILL_DIR}/scripts/build_asset_plan.py <project_path>
```

`asset_plan.json` is the source of truth. `asset-plan.md` is only the human-readable view. The builder preserves existing item `status`, `current_generation_evidence`, and completed prompt files by id; it must never wipe Generated evidence on a rerun.

Always read the common framework first:

```
Read references/image-base.md
```

Then lazy-load only the needed path-specific reference:

| Acquire Via | Load reference | Run |
|---|---|---|
| `ai` | `references/image-generator.md` | Default to Codex native GPT image generation (`image2` when available); otherwise run `python3 ${SKILL_DIR}/scripts/image_gen.py --asset-plan <project_path>/asset_plan.json` |
| `web` | `references/image-searcher.md` | `python3 ${SKILL_DIR}/scripts/image_search.py ...` |
| `user` / `placeholder` | skip | skip |

Generated asset evidence schema:

```json
{"run_id":"...","timestamp":"...","backend":"...","prompt_sha256":"...","file_sha256":"...","width":1792,"height":1024}
```

Every Generated `asset_plan.json.items[]` row must have non-empty `current_generation_evidence` matching this schema. Run `python3 ${SKILL_DIR}/scripts/audit_image_contracts.py <project_path>/asset_plan.json` before Step 6.

**✅ Checkpoint — Confirm image generation attempted for every row, proceed to Step 6**:
```markdown
## ✅ Image_Generator Phase Complete
- [x] Prompt document created
- [x] Each image: status is either `Generated` (file present in images/) or `Needs-Manual` (reported to user with filename + reason)
- [x] No row remains `Pending`
```

> On generation failure, do NOT halt — follow the Failure Handling rule in `references/image-generator.md`: retry once, fall back between Codex/image2 and configured backend when possible, then mark the row `Needs-Manual`, report filename + reason, and continue to Step 6.

🚧 **Needs-Manual image rows block Step 6**: if any `asset_plan.json` item is `Needs-Manual`, the expected file must exist at `project/images/<filename>` or the Executor must draw a clearly labeled placeholder box with the expected filename. Do not start SVG generation with silent missing image references.

---

### Step 6: Executor Phase

🚧 **GATE**: Step 4 (and Step 5 if triggered) complete; `asset_plan.json` has no unresolved `Pending` row; any `Needs-Manual` row has a real file or an explicit labeled-placeholder plan; all prerequisite deliverables are ready.

Read the role definition based on the selected style:
```
Read references/executor-base.md          # REQUIRED: common guidelines
Read references/shared-standards.md       # REQUIRED: SVG/PPT technical constraints
Read references/executor-general.md       # General flexible style
Read references/executor-consultant.md    # Consulting style
Read references/executor-consultant-top.md # Top consulting style (MBB level)
```

> Only need to read executor-base + shared-standards + one style file.

**Design Parameter Confirmation (Mandatory)**: Before generating the first SVG, the Executor MUST review and output key design parameters from the Design Specification (canvas dimensions, color scheme, font plan, body font size) to ensure spec adherence. See executor-base.md Section 2 for details.

**Live Preview Auto-Startup (Mandatory)**: before generating the first SVG, start the browser editor in live mode and keep it running through Executor + export:
```bash
python3 ${SKILL_DIR}/scripts/svg_editor/server.py <project_path> --live
```
- Start it immediately when Executor begins; `svg_output/` may still be empty.
- Default URL is `http://localhost:5050`; if the port is occupied, use `--port <other>` and report the actual URL.
- Run it as a long-running side process. Do not wait for it to exit before generating pages.
- Do not read or apply submitted annotations during generation. If the user later asks to apply annotations, use `workflows/live-preview.md` after export.

**Pre-generation Batch Read (Mandatory)**: before the first SVG, batch-read every distinct layout SVG referenced in `spec_lock.page_layouts` and every distinct chart SVG referenced in `spec_lock.page_charts` (plus backup chart references). One read per file, up front.

**Per-page spec_lock re-read (Mandatory)**: Before generating **each** SVG page, Executor MUST read the lock. If the lock is within budget, `read_file <project_path>/spec_lock.md`; if it exceeds the budget or the deck resumed in a fresh chat, run `python3 ${SKILL_DIR}/scripts/spec_lock_slice.py <project_path> PNN` and use that slice. Use only the colors / fonts / icons / images listed there, plus the per-page `page_rhythm`, `page_layouts`, and `page_charts` lookups. See executor-base.md §2.1 for details.

Generation discipline comes from Global Execution Discipline rules 7-10: main agent only, sequential page generation, per-page lock read/slice, and hand-written SVG.

**Visual Construction Phase**:
- Generate SVG pages sequentially, one page at a time, in one continuous pass → `<project_path>/svg_output/`

**Quality Check Gate (Mandatory)** — after all SVGs are generated and BEFORE speaker notes:
```bash
python3 ${SKILL_DIR}/scripts/svg_quality_checker.py <project_path>
```
- Any `error` (banned SVG features, viewBox mismatch, spec_lock drift, etc.) MUST be fixed on the offending page before proceeding — go back to Visual Construction, re-generate that page, re-run the check.
- `warning` entries (e.g., low-resolution image, non-PPT-safe font tail) should be reviewed and fixed when straightforward; may be acknowledged and released otherwise.
- Running the checker against `svg_output/` is required — running it only after `finalize_svg.py` is too late (finalize rewrites SVG and some violations get masked).
- On success, the checker writes `pipeline-state.json` with the `svg_output` digest. `svg_to_pptx.py` blocks export if SVG files changed after the last passing check.

**Logic Construction Phase**:
- Generate speaker notes → `<project_path>/notes/total.md`

**✅ Checkpoint — Confirm all SVGs and notes are fully generated and quality-checked. Proceed directly to Step 7 post-processing**:
```markdown
## ✅ Executor Phase Complete
- [x] All SVGs generated to svg_output/
- [x] svg_quality_checker.py passed (0 errors)
- [x] Speaker notes generated at notes/total.md
```

> **Chart pages?** If this deck contains data charts, run `workflows/verify-charts.md` before Step 7 to calibrate coordinates. Skip when the deck has no chart pages.

---

### Step 7: Post-processing & Export

🚧 **GATE**: Step 6 complete; all SVGs generated to `svg_output/`; speaker notes `notes/total.md` generated; `pipeline-state.json` records a passing SVG quality check for the current `svg_output` digest.

🚧 **Image readiness GATE**: if Step 5 left any `Needs-Manual` image rows, every expected file must exist at `project/images/<filename>` before running Step 7.1. If files are missing, pause and report filenames plus required locations.

> ⚠️ The following three sub-steps MUST be **executed individually one at a time**. Each command must complete and be confirmed successful before running the next.
> ❌ **NEVER** put all three commands in a single code block or single shell invocation.

Run the canonical three-command pipeline (same as `references/shared-standards.md` §5):

**Step 7.1** — Split speaker notes:
```bash
python3 ${SKILL_DIR}/scripts/total_md_split.py <project_path>
```

**Step 7.2** — SVG post-processing (icon embedding / image crop & embed / text flattening / rounded rect to path):
```bash
python3 ${SKILL_DIR}/scripts/finalize_svg.py <project_path>
```

**Step 7.3** — Export PPTX (embeds speaker notes by default):
```bash
python3 ${SKILL_DIR}/scripts/svg_to_pptx.py <project_path>
# Output: exports/<project_name>_<timestamp>.pptx
#
# Optional SVG snapshot preview:
# python3 ${SKILL_DIR}/scripts/svg_to_pptx.py <project_path> --svg-snapshot
#
# Optional conversion diagnostics:
# python3 ${SKILL_DIR}/scripts/svg_to_pptx.py <project_path> --trace-conversion
```

**Step 7.4** — Visual completion audit:
```bash
python3 ${SKILL_DIR}/scripts/visual_review.py <project_path>
python3 ${SKILL_DIR}/scripts/audit_design_completion.py <project_path>
```
- `visual_review.py` may fail if browser rendering dependencies are unavailable; if so, record the blocker in `design-quality-report.md` rather than silently skipping visual QA.
- `audit_design_completion.py` must pass before formal delivery unless the user explicitly accepts the listed visual blockers.

> ❌ **NEVER** use `cp` as a substitute for `finalize_svg.py` — it performs multiple critical processing steps
> ❌ **NEVER** add extra flags like `--only`

**Optional animation flags**: defaults already enable rich entrance animations. Adjust only when the user asks:
- `-t <effect>` page transition; default `fade`
- `-a <effect>` per-element entrance animation; default `mixed`
- `--animation-trigger {on-click,with-previous,after-previous}`
- `--animation-config <path>` optional object-level sidecar, usually created through `workflows/customize-animations.md`
- `--auto-advance <seconds>` kiosk-style auto-play

**Optional recorded narration**: only when the user asks for narration/audio/video export, run `workflows/generate-audio.md`. Do not call `notes_to_audio.py` directly without that workflow, because backend/voice/rate/embed choices must be confirmed once.

> **Post-export annotation window**: if the live preview service is still running and the user submitted annotations, apply them only after export via `workflows/live-preview.md`.

---

## Role Switching Protocol

Before switching roles, you **MUST first read** the corresponding reference file — skipping is FORBIDDEN. Output marker:

```markdown
## [Role Switch: <Role Name>]
📖 Reading role definition: references/<filename>.md
📋 Current task: <brief description>
```

---

## Reference Resources

| Resource | Path |
|----------|------|
| Shared technical constraints | `references/shared-standards.md` |
| Canvas format specification | `references/canvas-formats.md` |
| Image layout specification | `references/image-layout-spec.md` |
| SVG image embedding | `references/svg-image-embedding.md` |
| Icon library | `templates/icons/README.md` |

---

## Notes

- Local preview: `python3 -m http.server -d <project_path>/svg_final 8000`
- **Troubleshooting**: If the user encounters issues during generation (layout overflow, export errors, blank images, etc.), recommend checking `docs/faq.md` — it contains known solutions sourced from real user reports and is continuously updated
