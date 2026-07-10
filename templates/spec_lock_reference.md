# Execution Lock

> **⚠️ Skeleton for Strategist — do NOT copy verbatim into a project.** When producing `<project_path>/spec_lock.md`, emit only `##` sections with filled-in `-` data lines. Do NOT carry over any `>` blockquote guidance, HARD-rule notes, or override examples — those are author-time guidance, not runtime data. Every output line must be parseable data.
>
> Machine-readable execution contract. Executor MUST `read_file` this before every SVG page. Values not listed here must NOT appear in SVGs. For design narrative (rationale, audience, style), see `design_spec.md`.
>
> After SVG generation begins, this is the canonical source for color / font / icon / image values. Modifications should go through `scripts/update_spec.py` to keep this file and generated SVGs in sync.

## canvas
- viewBox: 0 0 1280 720
- format: PPT 16:9

> Strategist: fill viewBox and format for the chosen canvas. Common values: `0 0 1280 720` (PPT 16:9), `0 0 1024 768` (PPT 4:3), `0 0 1242 1660` (Xiaohongshu), `0 0 1080 1080` (WeChat Moments), `0 0 1080 1920` (Story).

## expectation_contract
- brief_mode: visual-tags
- risk_level: yellow
- score: 78
- source_adequacy: thin
- ready_for_production: true
- known_intent: executive review for company management; decision and execution focus
- missing_signals: authoritative KPI period not explicit
- assumptions: editable PPTX default; Microsoft YaHei; official assets first; no-text AI visuals only
- guided_intake_state: complete
- next_question_group: none

> Strategist: fill from `project-brief.json.briefMode`, `visualBrief`, `guidedBrief`, and `expectationFit` when available. If direct Codex intake created the brief, summarize the confirmed answers here. If `ready_for_production: false`, Executor must not start final-quality production until guided intake is completed or the user accepts a draft with assumptions.

## visual_direction
- id: finance_internal_report
- benchmark: Formal banking report with source-grounded evidence pages and restrained brand-color structure.
- atmosphere: quiet institutional authority with the feel of a management and audit report
- typography_personality: light evidence sans for conclusions; office-safe CJK sans for body; mono only for source IDs
- composition_model: asymmetric 4:8 conclusion/evidence columns on a 12-column grid
- surface_rhythm: warm-paper; white-evidence; deep-blue-section; warm-paper
- depth_model: no shadows; paper contrast, rules, crop, and scale create hierarchy
- component_grammar: evidence-strip; management-ledger; native-chart; risk-rail; source-footnote
- image_behavior: proof-bearing scenes only; record focal point, crop-safe zone, and authorized replacement
- theme_art_direction: restrained-title-lockup
- theme_motif: brand-color rule lines; source-grounded evidence panels; quiet negative space
- theme_scope: cover+section+tail
- title_treatment: restrained report title with weight contrast
- serious_context_exception: work-report/compliance tone keeps title restrained
- release_boundary: Replace temporary logo and schematic assets before external release.

> `id` must match `templates/visual-directions/index.json`, or be `custom`.
> `benchmark` is a one-sentence visual target.
> The design-system fields (`atmosphere`, `typography_personality`, `composition_model`, `surface_rhythm`, `depth_model`, `component_grammar`, `image_behavior`) come from the selected direction in `templates/visual-directions/v6-direction-manifest.json`. They prevent a direction from collapsing into a color preset.
> `theme_art_direction` is the named subject-fit concept chosen after reading the source, e.g. `山海交汇 烟火同行` for cultural-tourism or `restrained-title-lockup` for serious work reports.
> `theme_motif` lists the visual motifs Executor may reuse. Keep them specific and source-linked, not generic decoration.
> `theme_scope` is one of `deck-wide`, `cover+section+tail`, `cover+tail`, or `restrained-title-only`.
> `title_treatment` records how the main title carries the theme. Expressive decks should use an artistic lockup, motif-integrated framing, generated no-text cover support, or vector-drawn accent. Serious work-report/government/compliance decks may use restrained title treatment only when `serious_context_exception` explains why.
> `release_boundary` records asset or brand blockers for formal external use.

## brand_assets
- traffic_bank: required | text: 交通银行 | state: official-source | file: images/brand/traffic-bank-logo.png | source: https://www.bankcomm.com/... | pages: P01,P12
- haoke_shandong: required | text: 好客山东 | state: text-lockup-fallback | file: none | source: official/public-service search required | pages: P01

> Formal-business decks MUST include this section. Use one row per deterministic IP mark mentioned in the source/user request, or a single `none-detected: none` row when the scan finds no marks.
>
> Valid `state` values: `official-source`, `user-provided`, `text-lockup-fallback`, `needs-authorized-replacement`.
>
> Official/company/campaign/tourism/product/QR/seal marks are deterministic assets, not decorative icons. Insert real sourced/user-provided files when safe; otherwise use text lockup and block external release. Never fake, generate, or approximate a logo.

## colors
- bg: #FFFFFF
- primary: #......
- accent: #......
- secondary_accent: #......
- text: #......
- text_secondary: #......
- border: #......
- image_rendering: vector-illustration
- image_palette: cool-corporate

> Strategist: fill only colors actually used. Add extra rows as needed; delete unused rows rather than leave as `#......`.
>
> **`image_rendering` and `image_palette`** — required only when `images` section below contains `ai`-sourced files. Values MUST be valid names from `references/image-renderings/_index.md` and `references/image-palettes/_index.md`. Image_Generator reads these and applies them deck-wide. Omit both rows when the deck has no AI-generated images.

## typography
- font_family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif
- title_family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif
- body_family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif
- emphasis_family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif
- code_family: Consolas, "Courier New", monospace
- body: 20
- title: 36
- subtitle: 24
- annotation: 14

> **All five family lines are listed explicitly** so Strategist considers every role — `code_family` and `emphasis_family` are easily forgotten. In a real `spec_lock.md`:
> - Keep any `*_family` whose role genuinely differs from `font_family`.
> - **Omit** any `*_family` equal to `font_family` — Executor falls back to `font_family` for missing roles, so writing it twice is noise. (Exception: keep `code_family` even when equal — monospace is conceptually distinct.)
>
> `font_family` is the default fallback. Every declared family is a CSS font-stack string.
>
> **Source**: copy verbatim from the *Per-role font stacks* list in `design_spec.md §IV Font Plan`. Stack **order** encodes browser-rendering intent (Latin-led vs. CJK-led) that the breakdown table cannot — strings here must match character-for-character. See `design_spec.md §IV` for the explainer. For Chinese office deliverables, default to `"Microsoft YaHei", "PingFang SC", Arial, sans-serif`.
>
> Sizes (`body` / `title` / etc.) are in px, matching SVG units. `body` is the **required baseline anchor** — all other sizes derive as ratios of it (ramp table: `design_spec_reference.md §IV`).
>
> **Size slots are anchors, not a closed menu.** Common slots (`title` / `subtitle` / `annotation`) cover frequent cases. Add role-specific slots (e.g. `cover_title: 72`, `section_title: 52`, `hero_number: 48`, `chart_annotation: 13`) when needed — common for cover-heavy decks, consulting-style hero numbers, dense pages. Executor may use intermediate sizes as long as the ratio to `body` sits in the role's ramp band.
>
> **⚠️ PPT-safe stack discipline (HARD rule).** PPTX stores one `typeface` per run with no runtime fallback. Every stack MUST end with a cross-platform pre-installed font: `"Microsoft YaHei", sans-serif` / `SimSun, serif` / `Arial, sans-serif` / `"Times New Roman", serif` / `Consolas, "Courier New", monospace`. Non-preinstalled fonts (Inter / Google Fonts / brand typefaces) may lead the stack only when the Design Spec notes the font-install or embedding requirement.
>
> **Stack length discipline.** 3-4 fonts per stack is the sweet spot. Converter only writes the **first** Latin and **first** CJK font into PPTX — everything after is silently dropped. macOS-only families (`Songti SC`, `Menlo`, `Monaco`, `Helvetica`) are auto-mapped to Windows equivalents via `FONT_FALLBACK_WIN` (see `scripts/svg_to_pptx/drawingml_utils.py`); stacking both is redundant. Lead with Windows-preinstalled fonts (`Microsoft YaHei` / `SimSun` / `Arial` / `Georgia` / `Consolas`); keep at most **one** macOS-exclusive family (typically `"PingFang SC"`) as a browser-preview nicety.

## aesthetic_checks
- min_body_px: 18
- target_body_px: 20-22
- title_body_ratio: 1.6-2.0
- card_title_body_ratio: 1.15-1.35
- max_peer_cards_per_slide: 6
- min_card_padding_px: 20
- theme_art_direction: required
- title_art_treatment: expressive-unless-serious
- cover_tail_motif: required
- whitespace_strategy: one dominant quiet zone per page
- logo_strategy: official-assets-first
- polish_risks: title-too-small; body-below-18; overcrowded-cards; fake-logo; logo-crowding; weak-dominant-element; random-decoration; low-contrast-secondary-text

> Formal-business decks MUST include this section. It prevents small-looking slides by making the scale contract explicit. `body` in `typography` must be >= `min_body_px`; page title ratio should stay inside `title_body_ratio`; primary card/body copy must not shrink below the minimum. If content does not fit, split or restructure the page.
>
> `theme_art_direction`, `title_art_treatment`, and `cover_tail_motif` make sure the deck is not only typographically clean but also thematically designed. For cultural/tourism/brand/showcase decks, the main title must show the chosen art direction unless the serious-context exception in `visual_direction` applies.

## icons
- library: chunk-filled
- brand_library: simple-icons
- inventory: target, bolt, shield, users, chart-bar, lightbulb

> `library` MUST be exactly one of `chunk-filled` / `tabler-filled` / `tabler-outline` / `phosphor-duotone` — mixing is forbidden. `brand_library: simple-icons` is optional; include only when the deck uses real company / product brand marks, otherwise omit. `inventory` lists approved icon names (no library prefix); Executor may only use icons from this list.
>
> **`stroke_width` (stroke-style libraries only)** — required when `library` is stroke-based (currently `tabler-outline`); allowed values `1.5` / `2` / `3`. Executor MUST apply this value to every `<use data-icon="...">` placeholder via `stroke-width`, deck-wide. Omit for non-stroke libraries (`chunk-filled` / `tabler-filled` / `phosphor-duotone`) — ignored there. For heavier weight switch library; do not exceed `3` (at 24×24 strokes merge and the icon stops reading as line art).
>
> Example for stroke-style libraries:
> ```
> - library: tabler-outline
> - stroke_width: 2
> - inventory: home, chart-bar, users, bulb
> ```

## images
- cover_bg: images/cover_bg.jpg
- q3_revenue_chart: images/q3_revenue.png | no-crop

> One entry per image file used. Append ` | no-crop` only for images that must not lose pixels (data screenshots, charts, certificates) — Executor will size the container to native ratio and use `preserveAspectRatio="xMidYMid meet"`. Untagged entries default to croppable (`slice`). Remove the section entirely if no images.

## page_rhythm
- P01: anchor
- P02: dense
- P03: breathing
- P04: dense
- P05: dense
- P06: breathing
- P07: anchor

> One entry per page. Key: `P<NN>` (zero-padded, matching `§IX Content Outline` in `design_spec.md`). Value: one of the three rhythm tags. Executor reads per page and applies the tag's layout discipline — breaks the "every page looks the same" pattern.
>
> **Vocabulary** (exactly these three values):
> - `anchor` — Structural pages (cover / chapter opener / TOC / ending). Follow the template as-is.
> - `dense` — Information-heavy pages (data, KPIs, comparisons, multi-point lists). Card grids, multi-column layouts, tables, charts all permitted.
> - `breathing` — Low-density pages (single concept, hero quote, big image + caption, section transition). Avoid **multi-card grid layouts** (multiple parallel rounded containers as the primary structure); organize via naked text, dividers, whitespace, or full-bleed imagery. Single rounded elements (hero image corners, callouts, tags, one emphasis block) are fine. Proportions follow information weight — not a preset ratio menu.
>
> **Rhythm follows narrative**: `breathing` pages appear where narrative genuinely pauses — section transitions, a single argument worth standalone emphasis, a deliberate stop after a dense sequence. A data briefing or consulting analysis may legitimately be nearly all `dense` — **do not invent filler pages** to pad rhythm. Validation: every `breathing` page must answer "what independent thing is this page saying?".
>
> **Missing or empty section** → Executor falls back to `dense` for every page (legacy pre-rhythm behavior). Remove the section only for legacy decks; new decks MUST fill it.

## page_roles
- P01: anchor
- P02: context
- P03: evidence
- P04: process
- P05: risk

> One entry per page. Values describe why the page exists, not how it is drawn. Use the vocabulary from the active visual direction pack where possible.

## visual_weight
- P01: hero
- P02: medium
- P03: high
- P04: medium
- P05: medium

> One entry per page. Allowed common values: `hero`, `high`, `medium`, `low`. This guides hierarchy: the primary judgment, chart, image, or process must visibly dominate according to the weight.

## layout_family
- P01: cover_brand
- P02: statement_plus_evidence
- P03: table_evidence
- P04: process_flow
- P05: faq_grid

> One entry per page. Use concise stable names. Three consecutive non-anchor pages MUST NOT share the same value unless `anti_patterns` records `intentional-repeat:<reason>`.

## page_recipes
- P01: cover_brand.hero_left_visual
- P02: statement_plus_evidence.left_rule_panel
- P03: evidence_board.source_table
- P04: process_flow.horizontal_steps
- P05: risk_callout.qa_stack

> One entry per page. Values should match `templates/page-recipes/index.json`, or be a documented custom recipe. A recipe is the structural builder contract for the page, not just a visual label.

## visual_layers
- P01: generated-background | no-text | 16:9 | assets/generated/page-visuals/P01-background.png
- P02: subtle-pattern | no-text | 16:9 | assets/generated/page-visuals/P02-pattern.png
- P03: none
- P04: generated-process-accent | no-text | 16:9 | assets/generated/page-visuals/P04-process.png
- P05: none

> One entry per page. Generated layers must be no-text support assets. They may provide background, pattern, device mockup, process accent, or symbolic visual support, but must not replace editable text, numbers, charts, tables, QR codes, or official logos.

## raster_policy
- P01: allowed-cover
- P02: prohibited-formal-body
- P03: prohibited-formal-body
- P04: prohibited-formal-body
- P05: prohibited-formal-body

> One entry per page. Full-page raster is prohibited for formal body pages unless the user explicitly requested poster/showcase mode and the quality report flags the editability risk.

## asset_requirements
- P01: real-logo-or-text-fallback
- P02: none-or-schematic
- P03: data-table
- P04: schematic
- P05: none

> One entry per page. Common values: `real`, `generated`, `schematic`, `placeholder-labeled`, `none`, plus short custom values. If an asset is not available, the page must show a labeled placeholder or the quality report must block external release.

## anti_patterns
- P01: fake-logo; generic-gradient
- P02: 2x2-card-grid; vague-context
- P03: table-without-takeaway
- P04: disconnected-icons; no-flow-direction
- P05: buried-risk; overconfident-policy-claim

> One entry per page. Semicolon-separated failure modes. Executor must check this before drawing each page. Use `intentional-repeat:<reason>` only when repeating the same `layout_family` across three or more non-anchor pages is deliberate.

## page_layouts
- P01: 01_cover
- P03: 02a_chapter
- P04: 03a_content_abstract

> One entry per page **that uses a template SVG**. Key: `P<NN>` matching §IX. Value: the template's SVG basename without extension (e.g., `01_cover`, `03a_content_image_text`) — Executor resolves it to `templates/<chosen_template>/<value>.svg`. Modern templates ship many content-page variants (`03a_content_abstract`, `03b_content_image_text`, `03c_content_three_items` …); the page-type → single-file mapping in `executor-base.md §1` no longer covers them, so this section is the per-page truth.
>
> **No entry for a page** → that page is free design (no template inheritance). Mixed decks are supported: e.g., cover/chapter pages inherit a template while content pages are free.
>
> **Hard rule**: Use both `page_layouts` and `page_charts` for the same page only when the layout template is a compatible shell for the chart. Do not assign a conflicting layout just to fill every page: a waterfall chart should not inherit a timeline layout, and KPI cards should not inherit a circle-diagram layout unless that is the intended visual structure. When no compatible layout exists, omit the page from `page_layouts`.
>
> **Whole section omitted** → entire deck is free design. Equivalent to no rows but cleaner; do this when zero pages reference a template.
>
> **Strategist source**: copy the per-page SVG choices from `design_spec.md §VI Page Roster` (or §IX outline if Roster is absent). Names must match files in `templates/<chosen_template>/` exactly — typos cause silent fallback to free design.

## page_charts
- P05: bar_chart
- P09: timeline_horizontal
- P12: quadrant_bubble_scatter

> One entry per page **that adapts a `templates/charts/` chart template**. Key: `P<NN>` matching §IX. Value: chart template basename without `.svg` (must match a key in `templates/charts/charts_index.json`).
>
> **No entry for a page** → no chart on that page (or a chart that did not match any catalog template — Strategist's `no-template-match` fallback). Both cases mean Executor designs the visualization from scratch per `design_spec.md §VII`.
>
> **Whole section omitted** → no data-visualization pages in this deck.
>
> **Strategist source**: copy from `design_spec.md §VII Visualization Reference List` — only the rows whose `reference template path` points to a `templates/charts/` file. Pages marked `no-template-match` in §VII MUST NOT appear here.

## forbidden
- Mixing icon libraries
- rgba()
- `<style>`, `class`, `<foreignObject>`, `textPath`, `@font-face`, `<animate*>`, `<script>`, `<iframe>`, `<symbol>`+`<use>`
- `<g opacity>` (set opacity on each child element individually)
- HTML named entities in text (`&nbsp;`, `&mdash;`, `&copy;`, `&ndash;`, `&reg;`, `&hellip;`, `&bull;` …) — write as raw Unicode (`—`, `©`, `→`, NBSP, etc.); XML reserved chars `& < > " '` must be escaped as `&amp; &lt; &gt; &quot; &apos;`. See shared-standards.md §1.0
