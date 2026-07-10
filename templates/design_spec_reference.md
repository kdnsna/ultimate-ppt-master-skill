# {project_name} - Design Spec

> Human-readable design narrative — rationale, audience, style, color choices, content outline. Read once by downstream roles for context.
>
> Machine-readable execution contract: `spec_lock.md` (color / typography / icon / image short form). Executor re-reads `spec_lock.md` before every SVG page to resist context-compression drift. Keep both in sync; on divergence, `spec_lock.md` wins.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | {project_name} |
| **Canvas Format** | {canvas_info['name']} ({canvas_info['dimensions']}) |
| **Page Count** | [Filled by Strategist] |
| **Design Style** | {design_style} |
| **Theme Art Direction** | [Filled by Strategist, e.g., `山海交汇 烟火同行` for cultural-tourism decks, or `restrained-title-lockup` for serious work reports] |
| **Target Audience** | [Filled by Strategist] |
| **Use Case** | [Filled by Strategist] |
| **Created Date** | {date_str} |

### Expectation Contract

| Item | Value |
| ---- | ----- |
| **Brief Mode** | [visual-tags / codex-guided-intake / source-first / draft-with-assumptions] |
| **Expectation Fit** | [green/yellow/red + score + readyForProduction] |
| **Source Adequacy** | [substantive / thin / topic-only / private-unparsed / conflicting / no-source] |
| **Known User Intent** | [scenario, audience, purpose, and style in plain words] |
| **Missing Signals** | [what is still unclear, or `none`] |
| **Assumptions** | [defaults being used, such as PPTX, Microsoft YaHei, official assets first] |
| **Codex Guided Intake State** | [complete / required-before-production / draft accepted with assumptions] |
| **Next Question Group** | [one staged question group if intake is required, or `none`] |

Rules:
- If `readyForProduction` is false, Codex must ask staged clarification questions before final-quality production unless the user explicitly asks for a draft with assumptions.
- Web tags are a source of user intent. Pasted background and special requirements override tag defaults when they conflict.
- Copy the machine-readable summary into `spec_lock.md expectation_contract`.

---

## II. Canvas Specification

| Property | Value |
| -------- | ----- |
| **Format** | {canvas_info['name']} |
| **Dimensions** | {canvas_info['dimensions']} |
| **viewBox** | `{canvas_info['viewbox']}` |
| **Margins** | [Recommended by Strategist, e.g., left/right 60px, top/bottom 50px] |
| **Content Area** | [Calculated from canvas] |

---

## III. Visual Theme

### Theme Style

- **Style**: {design_style}
- **Theme**: [Light theme / Dark theme]
- **Tone**: [Filled by Strategist, e.g., tech, professional, modern, innovative]
- **Visual Direction**: [direction id from `templates/visual-directions/index.json`, or `custom`]
- **Benchmark Sentence**: [one concrete sentence describing what this deck should visually resemble]
- **Atmosphere**: [one sensory sentence; do not write only modern / clean / professional]
- **Typography Personality**: [how display, body, and evidence roles contrast]
- **Composition Model**: [grid logic plus the deliberate asymmetry or grid break]
- **Surface Rhythm**: [ordered surface changes, e.g. paper -> evidence white -> dark product -> paper]
- **Depth Model**: [how depth is created; color block / crop / overlap / surface change / limited shadow]
- **Component Grammar**: [approved structural components, not a list of decorative widgets]
- **Image Behavior**: [subject, narrative role, focal point, crop-safe zone, and replacement path]
- **Top Aesthetic Risks**: [3 concise risks, e.g., "too many generic cards", "fake brand assets", "text-only proof"]
- **External Release Boundary**: [what must be replaced or verified before formal external release]
- **Visual Strategy Mode**: [default `hybrid-editable`; generated no-text visual layers support editable PPTX structure]
- **Raster Slide Mode**: [default `disabled_for_formal_body`; full-page raster only for cover/section/poster/showcase pages]

### Theme Art Direction

> Strategist: after reading the source and selecting the visual direction, name one artistic concept that can carry the deck. Keep it specific to the topic, not a generic mood label.

- **Art Direction Name**: [e.g., `山海交汇 烟火同行` / `Urban Service Flow` / `Restrained Compliance Ledger`]
- **Why It Fits The Source**: [one concrete sentence linking source topic, audience, and emotional tone]
- **Motif System**: [3-5 motifs, e.g., mountain/sea contour, travel stamp, night-market glow, route line, bank-brand red accent]
- **Scope**: [deck-wide / cover+section+tail / cover+tail only / restrained-title-only]
- **Main Title Treatment**: [artistic lockup / motif-integrated framing / generated no-text cover visual + editable title / restrained report title]
- **Serious Context Exception**: [write `not-applicable`, or explain why a work report / serious government / compliance deck uses a restrained title treatment]
- **AI Visual Prompt Seed**: [one no-text prompt seed for Codex/GPT visuals; must describe composition, not just list elements]

Machine field mapping: copy this section into `spec_lock.md visual_direction` as `theme_art_direction`, `theme_motif`, `theme_scope`, `title_treatment`, and `serious_context_exception`.

Rules:
- Cultural, tourism, brand, training, campaign, education, keynote, showcase, and public-facing decks should usually have an expressive theme art direction. Example: a cultural-tourism finance deck can use `山海交汇 烟火同行` to blend coastline, mountain silhouettes, travel route marks, warm market lights, and disciplined banking structure.
- Work reports, serious government briefings, compliance/finance risk decks, and highly regulated material may use a restrained title lockup. Still name the direction, but document the exception and keep the cover/tail professional.
- Body copy remains editable and office-safe. Use Microsoft YaHei for body text; create title artistry through composition, weight, spacing, vector strokes, masks, and generated no-text visual support rather than unlicensed fonts.
- The art direction must appear in `spec_lock.md visual_direction` and `spec_lock.md aesthetic_checks`, then show up at least on cover and closing pages unless the serious-context exception says otherwise.

### Brand / IP Assets

> List every deterministic official mark mentioned in the source or user request. This includes company logos, campaign/event IP (`文旅大戏`), tourism brands (`好客山东`), product/card/app marks, QR codes, seals, government/partner marks, and official badges. Do not leave this table out for formal-business decks; if none are detected, write one row: `none-detected`.

| Asset ID | Display Text / Mark | State | Source URL / Provenance | File Path | Target Pages | Release Boundary |
| -------- | ------------------- | ----- | ----------------------- | --------- | ------------ | ---------------- |
| traffic_bank | 交通银行 | official-source / user-provided / text-lockup-fallback / needs-authorized-replacement | [official or user source] | images/brand/... | P01,P12 | [e.g., replace before external release] |

Rules:
- Use official or authorized sources first: official website, press release, media kit, government/public-service portal, official campaign page, or user-provided asset.
- Third-party logo-download sites are clues only, not final proof.
- Never approximate official logos with arbitrary shapes, initials, generated lookalikes, or decorative icons.
- If a safe asset is unavailable, use exact text lockup only and flag `needs-authorized-replacement` / release blocker.

### Color Scheme

> Strategist: determine values from project content, industry, brand colors.

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#......` | Page background (light theme typically white; dark theme dark gray/navy) |
| **Secondary bg** | `#......` | Card background, section background |
| **Primary** | `#......` | Title decorations, key sections, icons |
| **Accent** | `#......` | Data highlights, key information, links |
| **Secondary accent** | `#......` | Secondary emphasis, gradient transitions |
| **Body text** | `#......` | Main body text (dark theme uses light text) |
| **Secondary text** | `#......` | Captions, annotations |
| **Tertiary text** | `#......` | Supplementary info, footers |
| **Border/divider** | `#......` | Card borders, divider lines |
| **Success** | `#......` | Positive indicators (green family) |
| **Warning** | `#......` | Issue markers (red family) |

> **Reference**: Industry colors in `references/strategist.md` or `scripts/config.py` under `INDUSTRY_COLORS`

### AI Image Strategy (fill only when §VIII has `ai` rows)

- **Image Rendering**: [one of the 16 names in `references/image-renderings/_index.md`, e.g. `vector-illustration`]
- **Image Palette**: [one of the 10 names in `references/image-palettes/_index.md`, e.g. `cool-corporate`]

> Strategist: lock these once per deck in h.5; every AI image inherits them. Cross-check the rendering × palette compatibility matrix in `image-palettes/_index.md` — avoid `✗` combinations. Leave the section out entirely if §VIII has no `ai` rows.

### Gradient Scheme (if needed, using SVG syntax)

```xml
<!-- Title gradient -->
<linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#[primary]"/>
  <stop offset="100%" stop-color="#[secondary accent]"/>
</linearGradient>

<!-- Background decorative gradient (note: rgba forbidden, use stop-opacity) -->
<radialGradient id="bgDecor" cx="80%" cy="20%" r="50%">
  <stop offset="0%" stop-color="#[primary]" stop-opacity="0.15"/>
  <stop offset="100%" stop-color="#[primary]" stop-opacity="0"/>
</radialGradient>
```

---

## IV. Typography System

### Font Plan

> **Per-role families are expected, not optional.** Title / Body / Emphasis / Code may each use a different family (e.g., display serif title + geometric sans body). One family throughout is not required. See [strategist.md §g — Font Combinations](../references/strategist.md) for starting directions; you may propose a combination not listed.
>
> **Default Chinese office delivery**: use `"Microsoft YaHei"` / 微软雅黑 for title and body unless the user, brand guide, or selected template explicitly requires another installed font. Make the deck feel premium through weight, scale, spacing, hierarchy, and layout, not through risky web fonts.
>
> **Theme title treatment**: when §III Theme Art Direction is expressive, the main title should receive an artistic lockup or motif-integrated framing while remaining editable or drawn as safe vector treatment. Do not use unlicensed display fonts. In serious work-report/government/compliance contexts, use a restrained title lockup and document the exception in §III.
>
> **⚠️ PPT-safe stack discipline (HARD rule).** PPTX stores a single `typeface` per run — no runtime fallback. Every stack MUST end with a cross-platform pre-installed font: `"Microsoft YaHei", sans-serif` / `SimSun, serif` / `Arial, sans-serif` / `"Times New Roman", serif` / `Consolas, "Courier New", monospace`. Stacks led by a non-preinstalled font (Inter / Google Fonts / brand typefaces) are allowed only when this spec notes the font-install or embedding requirement.

**Typography direction**: [Fill in one phrase, e.g., "Microsoft YaHei office delivery with weight contrast" / "academic serif with installed fallback" / "brand-specific: McKinsey Bower (requires font install)"]

Two views on the same font decisions — fill both, keep them consistent:

- **Role breakdown** (table below) — lists the *pieces* per role: CJK font, Latin font, CSS generic fallback. Human-readable design language.
- **Per-role font stacks** (after the table) — the *ordered* CSS `font-family` strings that actually go into SVG `font-family=""` and `spec_lock.md`'s `*_family` lines. Order controls browser rendering (Latin-led vs. CJK-led), so this is the **actual data** — not derivable from the table alone.

| Role | Chinese | English | Fallback tail |
| ---- | ------- | ------- | ------------- |
| **Title** | [default `"Microsoft YaHei", "PingFang SC"`] | [default `Arial`] | [default `sans-serif`] |
| **Body** | [default `"Microsoft YaHei", "PingFang SC"`] | [default `Arial`] | [default `sans-serif`] |
| **Emphasis** | [default same as title/body, or a safe contrast such as `SimHei` / `SimSun` when justified] | [default `Arial`] | [default `sans-serif`] |
| **Code** | — | [e.g., `Consolas, "Courier New"`] | [e.g., `monospace`] |

**Per-role font stacks** (CSS `font-family` strings, one per role — arrange the table's pieces in the order your design intends):

- Title: `[Default: "Microsoft YaHei", "PingFang SC", Arial, sans-serif]`
- Body: `[Default: "Microsoft YaHei", "PingFang SC", Arial, sans-serif]`
- Emphasis: `[Fill in stack, or write "same as Body" to omit the override]`
- Code: `[Fill in monospace stack, e.g. Consolas, "Courier New", monospace]`

> **Stack ordering — why it matters**: CSS `font-family` falls back font-by-font (not char-by-char) — the browser uses the **first installed** font for everything it can render, skipping to the next only when a glyph is missing. So:
> - `Georgia, "Microsoft YaHei", serif` → Latin in Georgia (elegant serif), CJK falls through to Microsoft YaHei. **Use when Latin typography is the primary design statement** (academic / editorial / Latin-heavy covers).
> - `"Microsoft YaHei", Georgia, serif` → Everything in Microsoft YaHei (Latin uses YaHei's Latin glyphs — a different design tone). **Use when the deck is CJK-primary and Latin is incidental**.
>
> The converter (`drawingml_utils.py parse_font_family`) maps these to PPTX `<a:latin>` / `<a:ea>` regardless of order — but browser preview and SVG native rendering reflect stack order. Pick the order matching your design intent.

> **Why two views**: the breakdown shows role assignment at a glance; stacks carry the ordering info the breakdown can't encode. Keep both consistent — table cells should be exactly the fonts in the stacks (any order).

### Font Size Hierarchy

> **Ramp discipline, not a fixed menu.** `body` is the single anchor; every other size is a ratio of it. Each row below gives the role's allowed ratio band — Executor may pick any px value inside the band (e.g., 40px hero number, 13px chart annotation, 72px cover headline) without pre-declaring intermediates in `spec_lock.md`.
> **Unit**: px uniformly (SVG native) to avoid pt/px conversion errors.
> **Baseline selection**: drive by **content density**, not design style.

**Baseline**: Body font size = [fill in]px (any reasonable integer — `18` and `24` are most common; `16` for chart-heavy, `20`/`22` for medium density, `28-32` for poster / cover decks are all valid. Drive by content density.)

**Common 16:9 delivery ranges**: cover title 60-92px, section title 44-60px, page title 30-40px, subtitle 22-28px, body 18-24px, chart labels/captions 12-16px. Dense consulting pages usually use body 18-20px; training/keynote pages use 22-24px. For business / government / finance / stakeholder handoff, default body is 20-22px and 18px is the lower bound. Do not let body text fall below 18px in a formal handoff unless it is a chart label, footnote, or legal/source note rather than primary content.

| Purpose | Ratio to body | Example @ body=24 (relaxed) | Example @ body=18 (dense) | Weight |
| ------- | ------------- | --------------------------- | ------------------------- | ------ |
| Cover title (hero headline) | 2.5-5x | 60-120px | 45-90px | Bold / Heavy |
| Chapter / section opener | 2-2.5x | 48-60px | 36-45px | Bold |
| Page title | 1.5-2x | 36-48px | 27-36px | Bold |
| Hero number (consulting KPIs) | 1.5-2x | 36-48px | 27-36px | Bold |
| Subtitle | 1.2-1.5x | 29-36px | 22-27px | SemiBold |
| **Body content** | **1x** | **24px** | **18px** | Regular |
| Annotation / caption | 0.7-0.85x | 17-20px | 13-15px | Regular |
| Page number / footnote | 0.5-0.65x | 12-16px | 9-12px | Regular |

> The two px columns are illustrations for common baselines. For any other `body` value, multiply by each row's ratio — the checker (`svg_quality_checker._check_spec_lock_drift`) reads the live `body` from `spec_lock.md` and applies the bands, so no code change is needed for a different baseline.

> Sizes outside **every** band remain forbidden — surface the need and extend `spec_lock.md typography` (e.g., `cover_title: 96`) rather than invent a one-off value.

### Scale Guardrail

| Check | Current Project |
| ----- | --------------- |
| Body baseline | [20-22px recommended; 18px lower bound] |
| Page title/body ratio | [1.6-2.0×] |
| Card title/body ratio | [1.15-1.35×] |
| Smallest primary-content text | [must be >=18px in formal PPTX] |
| Smallest secondary text | [chart/caption/source only; normally 12-16px] |
| Exception handling | [split slide / reduce copy / table/process conversion / none] |

---

## V. Layout Principles

### Page Structure

- **Header area**: [Default 72-96px on 16:9; title, section label, or page number only]
- **Content area**: [Default safe area within 48-64px side margins; one dominant visual system plus support text]
- **Footer area**: [Default 28-40px; source, confidentiality, page number, or none]

### Single-slide Delivery Rules

- One slide communicates one primary judgment; the title should carry that judgment when the deck is analytical.
- Body pages should normally contain one dominant visual system plus 2-4 support points, or one dense table/chart with a visible takeaway.
- Avoid more than 6 peer cards on one 16:9 slide; split the page or convert to table/timeline when density grows.
- Align all major elements to a 12-column grid or a deliberate asymmetric split. Optical alignment beats decorative symmetry.
- Keep text away from chart axes, image focal points, logos, and page edges. Minimum edge-safe margin is 48px for formal 16:9.
- Use callouts sparingly: 1-2 emphasis blocks per slide. If everything is highlighted, nothing is highlighted.

### Layout Pattern Library (combine or break as content demands)

> **Principle — proportion follows information weight, not preset ratios.** The table below is a pattern library, not a menu. Combine two patterns on one page, break the grid entirely for a `breathing` page, or propose a pattern not listed when content calls for it. Defaulting every page to a symmetric grid produces the "AI-generated" look — vary intentionally.

| Pattern | Suitable Scenarios |
| ------- | ----------------- |
| **Single column centered** | Covers, conclusions, key points |
| **Symmetric split (5:5)** | Comparisons where two sides carry equal weight |
| **Asymmetric split (3:7 / 2:8)** | One side dominates — data chart vs. brief takeaway, image vs. caption |
| **Top-bottom split** | Processes, timelines, ultra-wide image + text |
| **Three/four column cards** | Feature lists, parallel points, team intros |
| **Matrix grid (2×2)** | Two-axis classifications, strategic quadrants |
| **Z-pattern / waterfall** | Storytelling, case studies — content blocks alternate left/right guiding the eye |
| **Center-radiating** | Core concept + surrounding nodes, ecosystem / stakeholder maps |
| **Full-bleed + floating text** | `breathing` / feature pages — image fills canvas, text floats with opacity overlay |
| **Figure-text overlap** | Hero moments — headline / big number sits over or against an image edge instead of beside it |
| **Negative-space-driven** | A single element in 40-60% whitespace — lets one idea land with weight |

### Spacing Specification

> Spacing defaults depend on **container type**. Cards are one option, not the universal default. Tables below split by container type; a page may consult only one set (e.g., a `breathing` page with no cards uses only universal + non-card entries).

**Universal** (any container type):

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Safe margin from canvas edge | 40-60px | [fill in] |
| Content block gap | 24-40px | [fill in] |
| Icon-text gap | 8-16px | [fill in] |

**Card-based layouts** (consult only when the page uses cards — typically `dense` pages with parallel containers):

| Element | Recommended Range | Current Project |
| ------- | ---------------- | --------------- |
| Card gap | 20-32px | [fill in] |
| Card padding | 20-32px | [fill in] |
| Card border radius | 8-16px | [fill in] |
| Single-row card height | 530-600px | [fill in] |
| Double-row card height | 265-295px each | [fill in] |
| Three-column card width | 360-380px each | [fill in] |

**Non-card containers** (naked text blocks / full-bleed imagery / divider-separated content — typical for `breathing` pages or minimalist designs):

- Vertical rhythm carried by **whitespace**, not gutters — block gaps run wider than card gaps since there's no container edge to separate content.
- **Line-height**: 1.4-1.6× body font size.
- **Full-bleed text placement**: inset text away from the image's focal points; legibility over photographic backgrounds typically needs a gradient or opacity overlay.
- **Content width** is driven by reading comfort and image composition, not a card grid slot — don't back-compute "column width" when there's no column.

### Aesthetic Polish Checks

| Check | Current Project |
| ----- | --------------- |
| Dominant element | [What should be seen first on most pages] |
| Whitespace strategy | [Where the quiet/empty zone lives; avoid filling every corner] |
| Card count bound | [Prefer 3-5 peer cards; max 6 on 16:9 unless table/matrix] |
| Card padding bound | [24-36px normal; never below 20px formal] |
| Corner radius | [Usually 6-12px; avoid overly pill-shaped cards unless brand requires] |
| Shadow/depth | [0-2 focal shadows per page; peer grids remain flat] |
| Logo placement | [Reserved zone; official marks do not compete with title] |
| Contrast | [Secondary text remains readable; no low-contrast gray body copy] |
| Decoration rule | [Accent lines/tags/patterns must support hierarchy, not fill space] |

Common anti-patterns to record per page: `title-too-small`, `body-below-18`, `overcrowded-cards`, `fake-logo`, `logo-crowding`, `weak-dominant-element`, `random-decoration`, `low-contrast-secondary-text`, `all-boxes-equal-weight`.

### Page Role / Visual Weight Contract

Every page must have one role and one primary visual job. These values must be copied into `spec_lock.md`.

| Page | page_role | visual_weight | layout_family | page_recipe_id | asset_requirement | visual_layer | raster_policy | anti_patterns |
| ---- | --------- | ------------- | ------------- | -------------- | ----------------- | ------------ | ------------- | ------------- |
| P01 | anchor | hero | cover_brand | cover_brand.hero_left_visual | real-logo-or-text-fallback | generated-background | allowed-cover | fake-logo; generic-gradient |
| P02 | context | medium | statement_plus_evidence | statement_plus_evidence.left_rule_panel | none-or-schematic | subtle-pattern | prohibited-formal-body | 2x2-card-grid |

Definitions:

- **page_role**: semantic role such as `anchor`, `context`, `evidence`, `process`, `risk`, `benefit`, `tldr`, `closing`, `hero`, `practice`.
- **visual_weight**: `hero`, `high`, `medium`, or `low`; determines what should dominate the viewer's eye.
- **layout_family**: a stable family name such as `cover_brand`, `chart_plus_takeaway`, `timeline`, `process_flow`, `faq_grid`, `image_hero`, `table_evidence`, `negative_space`.
- **page_recipe_id**: a structural recipe from `templates/page-recipes/index.json`, or a documented custom recipe.
- **asset_requirement**: `real`, `generated`, `schematic`, `placeholder-labeled`, `none`, or a short custom requirement.
- **visual_layer**: generated/schematic support layer; must be no-text and must not replace editable content.
- **raster_policy**: full-page raster policy. Formal body pages default to `prohibited-formal-body`.
- **anti_patterns**: semicolon-separated page-specific failure modes. Do not leave blank.

Hard rule: three consecutive non-anchor pages must not share the same `layout_family` unless this table explicitly states the reason in the anti-patterns cell as `intentional-repeat:<reason>`.
Hard rule: three consecutive non-anchor pages must not share the same `page_recipe_id` unless this table explicitly states the reason in the anti-patterns cell as `intentional-repeat:<reason>`.

---

## VI. Icon Usage Specification

### Source

- **Built-in icon library**: `templates/icons/` (11,600+ icons across five libraries; see `templates/icons/README.md`)
- **Usage method**: SVG placeholder `<use data-icon="library/icon-name" .../>`; Design Spec should list approved `library/icon-name` entries for Executor.

### Recommended Icon List (fill as needed)

| Purpose | Icon Path | Page |
| ------- | --------- | ---- |
| [example] | `chunk-filled/circle-checkmark` | Slide XX |

---

## VII. Visualization Reference List (if needed)

> When pages map to a chart-library template (data charts OR structural patterns — team rosters, agendas, frameworks, etc.), Strategist lists them here for Executor reference. Single combined table — `summary-quote` column is the anti-fabrication audit, `path` + `usage` columns serve Executor lookup.

Catalog read: 71 templates

| Page | Template | Path | Summary-quote (verbatim from `charts_index.json`) | Usage |
| ---- | -------- | ---- | ------------------------------------------------- | ----- |
| P05 | grouped_bar_chart | `templates/charts/grouped_bar_chart.svg` | "Pick for 2-4 series side-by-side across the same categories (e.g. YoY/QoQ). Skip if showing composition within each category (use stacked_bar_chart)." | YoY revenue comparison by product line |

**Runners-up considered** (3 entries minimum, drawn from real second-best matches in this deck):

- `<key_A>` | rejected for P05: `<reason citing this deck's specifics>`
- `<key_B>` | rejected for P##: `<reason>`
- `<key_C>` | rejected for P##: `<reason>`

> **Audit rule**: `Summary-quote` must be copy-pasted verbatim — paraphrasing breaks the audit. Every template name listed must `grep` cleanly inside `charts_index.json` (so misspellings/inventions fail). If fewer than 3 viz pages exist, list what exists and note "fewer than 3 viz pages"; runners-up still required for each page that does exist.

---

## VIII. Image Resource List (if needed)

| Filename | Dimensions | Ratio | Purpose | Type | Layout pattern | Acquire Via | Status | Reference | text_policy | page_role |
| -------- | --------- | ----- | ------- | ---- | -------------- | ----------- | ------ | --------- | ----------- | --------- |
| cover_bg.png | {canvas_info['dimensions']} | [ratio] | Cover background | Background | #1 full-bleed background with floating title + #29 two-stop scrim | ai | Pending | [subject + intent + composition, no style/HEX] | | |

> **Layout pattern column is MANDATORY** — value is one or more `#<id> <name>` joined by ` + ` drawn verbatim from [`references/image-layout-patterns.md`](../references/image-layout-patterns.md) (Primary + optional Modifiers). Empty cells, paraphrased names, or invented ids invalidate the row. See `strategist.md §h` GATE for the three-layer requirement (read → produce → image-as-canvas coverage).

**Status**:

- **Pending** — needs AI generation or web sourcing
- **Existing** — user-supplied, place in `images/`
- **Placeholder** — not yet processed, use dashed border in SVG

**Type** (narrative shorthand — kept for backward compatibility; Image_Generator infers its 9-way internal-composition type from `Purpose`):

- **Background** — full-page (covers / chapters); reserve text area
- **Photography** — real scenes, people, products, architecture
- **Illustration** — flat / vector / cartoon / concept diagrams
- **Diagram** — flowcharts, architecture diagrams, concept maps
- **Decorative** — partial decorations, textures, borders, dividers

**text_policy** (`ai` rows only; leave blank for default):

- *blank / `none`* — image carries no text; SVG overlays labels
- `embedded` — image contains in-artwork text: decorative lettering, a designed title, or hand-lettered keywords. Body copy / data points / long quotes never go inside the image regardless. English text renders most reliably; CJK characters fail in most models

**page_role** (`ai` rows only; leave blank for default):

- *blank / `local`* — image is a region block on an SVG page
- `hero_page` — image is the page's main voice; SVG overlay is minimal or empty. Use on covers, chapter dividers, mood transitions, single-number data heroes, closing quotes. Same rendering and palette as the rest of the deck regardless

**Reference grammar** (`ai` rows): write **subject + intent + composition** only. Do NOT repeat style words ("flat design", "modern") or HEX values — both are already locked deck-wide by `design_spec §III AI Image Strategy` (rendering + palette) and `§III Color Scheme` (HEX triplet). Image_Generator's prompt assembler injects them.

---

## IX. Content Outline

### Part 1: [Chapter Name]

#### Slide 01 - Cover

- **Layout**: Full-screen background image + centered title
- **page_role**: anchor
- **visual_weight**: hero
- **layout_family**: cover_brand
- **page_recipe_id**: cover_brand.hero_left_visual
- **asset_requirement**: real-logo-or-text-fallback
- **visual_layer**: generated-background | no-text | 16:9
- **raster_policy**: allowed-cover
- **anti_patterns**: fake-logo; generic-gradient; title-too-small
- **Primary judgment**: [one sentence this page must make obvious]
- **Title**: [Main title]
- **Subtitle**: [Subtitle]
- **Info**: [Author / Date / Organization]

#### Slide 02 - [Page Name]

- **Layout**: [Choose a pattern from §V, combine two, or break the grid as the content demands]
- **page_role**: [context / evidence / process / risk / benefit / tldr / etc.]
- **visual_weight**: [hero / high / medium / low]
- **layout_family**: [chart_plus_takeaway / process_flow / table_evidence / negative_space / etc.]
- **page_recipe_id**: [recipe id from `templates/page-recipes/index.json`, or custom]
- **asset_requirement**: [real / generated / schematic / placeholder-labeled / none]
- **visual_layer**: [none / subtle-pattern / generated-background / generated-process-accent / generated-metric-accent]
- **raster_policy**: [prohibited-formal-body / allowed-cover / allowed-section-tail / allowed-poster-or-showcase]
- **anti_patterns**: [semicolon-separated failure modes]
- **Primary judgment**: [one sentence this page must deliver]
- **Title**: [Page title]
- **Visualization**: [visualization_type] (see VII. Visualization Reference List)
- **Content**:
  - [Point 1]
  - [Point 2]
  - [Point 3]

> **Visualization field**: add only when the page has data visualization or structured infographic elements. Type must be listed in §VII.

---

[Strategist continues adding more pages based on source document content and page count planning...]

---

## X. Speaker Notes Requirements

One speaker note file per page, saved to `notes/`:

- **Filename**: match SVG name (e.g., `01_cover.md`)
- **Content**: script key points, timing cues, transition phrases

---

## XI. Technical Constraints Reminder

### SVG Generation Must Follow:

1. viewBox: `{canvas_info['viewbox']}`
2. Background uses `<rect>` elements
3. Text wrapping uses `<tspan>` (`<foreignObject>` FORBIDDEN)
4. Transparency uses `fill-opacity` / `stroke-opacity`; `rgba()` FORBIDDEN
5. FORBIDDEN: `mask`, `<style>`, `class`, `foreignObject`
6. FORBIDDEN: `textPath`, `animate*`, `script`
7. Text characters: write typography & symbols as raw Unicode (em dash `—`, en dash `–`, `©`, `®`, `→`, NBSP, etc.); HTML named entities (`&nbsp;`, `&mdash;`, `&copy;`, `&reg;` …) are FORBIDDEN. XML reserved chars in text MUST be escaped as `&amp;` `&lt;` `&gt;` `&quot;` `&apos;` (e.g. `R&amp;D`, `error &lt; 5%`). See shared-standards.md §1.0
7. `marker-start` / `marker-end` conditionally allowed: `<marker>` must be in `<defs>`, `orient="auto"`, shape must be triangle / diamond / circle (see shared-standards.md §1.1)
8. `clipPath` conditionally allowed **only on `<image>` elements**: `<clipPath>` in `<defs>`, single shape child (circle / ellipse / rect with rx,ry / path / polygon). Do NOT apply to shapes / groups / text — draw the target geometry directly with the matching native element (`<circle>` / `<ellipse>` / `<rect rx>` / `<polygon>` / `<path>`). See shared-standards.md §1.2

### PPT Compatibility Rules:

- `<g opacity="...">` FORBIDDEN (group opacity); set on each child element individually
- Image transparency uses overlay mask layer (`<rect fill="bg-color" opacity="0.x"/>`)
- Inline styles only; external CSS and `@font-face` FORBIDDEN
