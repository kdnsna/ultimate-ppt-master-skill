# Ultimate PPT Master Design System

> A presentation design contract for agents. Read this file before choosing a visual direction, writing `design_spec.md`, or drawing a slide.

## 1. Visual theme and atmosphere

Ultimate PPT Master should feel like an editorial studio with an evidence desk: composed, literate, exact, and visibly made for the subject. It must not look like a generic AI dashboard exported to slides.

The default visual attitude is **editorial intelligence**. Content determines the page rhythm; decoration never substitutes for an argument, image, chart, or source. A deck may be quiet, cinematic, institutional, or highly structured, but every choice must have a named role.

## 2. Color palette and roles

The project-wide neutral foundation is intentionally small. A selected direction may replace these values, but it must preserve semantic roles and use one dominant accent rather than distributing many colors evenly.

| Role | Default | Use |
|---|---:|---|
| Paper | `#F6F3ED` | Primary light canvas and warm editorial surfaces |
| Ink | `#171714` | Titles, body text, and quiet rules; never the automatic full-page surface |
| Mineral blue | `#1D4ED8` | Evidence, links, selected states, quantitative emphasis |
| Signal coral | `#D9573B` | One decisive conclusion or editorial annotation |
| Sage | `#73866C` | Secondary institutional or long-horizon emphasis |

Rules:

- Use color as structure: section changes, evidence ownership, risk, or action.
- Avoid purple/violet/indigo/fuchsia and blue-purple gradients.
- Avoid ornamental gradients in interfaces and formal slides. Generated or photographic imagery may contain natural tonal transitions.
- Body text must meet WCAG AA in Web Decks. Never use low-opacity gray for primary content.

## 3. Typography rules

Typography is a role system, not one font applied everywhere.

| Role | Web / preview | Editable PPTX fallback | Default behavior |
|---|---|---|---|
| Editorial display | `Noto Serif SC` | `SimSun` | Weight 400-500; measured titles; never fake luxury with extreme letter spacing |
| Evidence display | `IBM Plex Sans`, `Noto Sans SC` | `Microsoft YaHei` | Weight 300-500; numerical clarity; sentence case |
| Body | `Noto Sans SC` | `Microsoft YaHei` | Weight 400; comfortable line length; Chinese body >= 18 px |
| Technical metadata | `IBM Plex Mono` | `Consolas` | Versions, code, timestamps, source IDs only |

Recommended 16:9 scale:

- Cover: 64-84 px, up to 92 px only for short Latin titles.
- Section: 48-60 px.
- Page title: 34-48 px.
- Body: 18-24 px.
- Caption/source: 12-16 px.

For browser-first 1920×1080 decks, start near 64 px title / 34 px body / 28 px small and scale proportionally. For editable 1280×720 formal PPTX, body may drop to 18-22 px when the page is genuinely dense, but primary content must not use Web-UI density.

Do not use monospace for ordinary navigation labels, eyebrows, or whole paragraphs. Avoid all-caps CJK. A cover must not rely on 120-160 px type to create impact. Write the full title sequence before drawing slides: choose one grammatical style and make the titles alone explain the story. Avoid repeating AI-style constructions such as “不是 X，而是 Y” as a substitute for precise titles.

### Cover surface default

- Default formal, consulting, training, and automatic-topic covers to white, warm paper, or another near-white surface. Ink is primarily a text color, not the default full-page background.
- A dark cover is an explicit art-direction choice, allowed only when the user, reference image, brand system, or image-led launch direction clearly calls for it.
- Prefer one asymmetric light hero composition: a title cluster plus one large soft-edged evidence/image panel. Do not build the first page from many small KPI cards.
- If the cover is light, the deck does not need a dark page merely to manufacture contrast. Create rhythm through paper tones, image ownership, density, and a restrained signal surface.

## 4. Component styling

Use naked structure before containers. A rule, aligned baseline, image edge, or surface change is preferred when grouping is already obvious. When a container is genuinely useful, use a consistent, restrained corner radius instead of defaulting to a wall of hard 90-degree boxes.

- **Evidence strip**: conclusion, number, source, and confidence share one alignment line.
- **Editorial folio**: title and body occupy unequal columns; annotations sit at the outer edge.
- **Image stage**: one dominant image with declared focal point, crop-safe zone, narrative role, and replacement note.
- **Native chart**: one visual claim, direct labels, conclusion annotation, source footnote; no chart chrome.
- **Product surface**: a dark or light working surface containing a real UI, code, document, or workflow state—not an abstract SaaS card.
- **Decision table**: quiet rules, explicit criteria, highlighted recommendation, and at most a subtle 2-4 pt outer radius.

Cards are allowed only when the content is genuinely a set of peers. Maximum peer cards per page: four by default, six for dense comparison pages.

### Soft-edge contract

- Default editable-PPTX container radius: `8-14 pt`; default Web surface radius: `12-20 px`. The single cover hero/evidence panel may use `18-24 pt` or `24-32 px`.
- Use rounded rectangles for peer cards, action contracts, decision callouts, proof panels, and buttons. Use pill geometry only for compact status labels or tags.
- Keep charts, baselines, table grids, and evidence rules straight so the deck retains editorial discipline.
- A page should not be dominated by multiple large hard-corner rectangles. If more than two boxed surfaces are visible, either soften their corners or remove unnecessary containers.
- Do not round every object equally. One radius family per deck is enough; hierarchy should still come from scale, spacing, type, and color.

## 5. Layout principles

- Start with a 12-column grid, then break it deliberately with one dominant visual, a narrow evidence rail, or an offset title block.
- Give every slide one **visual protagonist**: a title, image, chart, number, diagram, or quote. Supporting elements must reinforce it rather than compete with it.
- Keep a single quiet zone on every page. Do not distribute all elements evenly.
- Change surface, density, and visual ownership across the deck: `anchor -> dense -> breathing -> evidence -> anchor` is a rhythm, not a mandatory sequence.
- Three consecutive body pages must not share the same layout family.
- Three consecutive pages must not share the same surface treatment. An eight-page Web Deck should use at least six registered layout families, but a formal editable deck does not require a dark anchor. Dark surfaces appear only when the selected direction or source material gives them a real role.
- Titles should usually align to a strong edge, not center by default.
- Full-bleed imagery is reserved for image-led narratives and section moments; it must not hide the subject with blur or overlays.
- Use registered recipes from [`templates/page-recipes/index.json`](templates/page-recipes/index.json). Match content shape to recipe; do not force a concept page into a data layout or invent an untested skeleton mid-generation.
- Preserve a structural bottom safe zone. Open space in the lower third is often correct slide composition, not something to fill automatically.

### Image geometry

- Use standard slots: 16:9 for full stage, 16:10 or 4:3 for text/image spreads, 3:2 or 1:1 for smaller evidence, and a consistent height for peer screenshots.
- Align an image with the body or proof it supports, not automatically with the top of a large title.
- Use `cover` for photos with a declared focal point and `contain` for screenshots, charts, certificates, and labeled infographics.

## 6. Depth and elevation

Depth comes from color blocks, scale, crop, overlap, and surface transitions.

- Formal, consulting, editorial, and Swiss directions use no shadows.
- Brand-launch imagery may use one subtle elevation layer for a real product/device surface.
- Border radius is direction-specific: `6-10` for precision/evidence outer frames, `12-20` for editorial surfaces, and large circular geometry only for the orbital institutional direction. Charts, rules, and table internals may remain square.
- Do not create a wall of floating cards with identical shadows.

## 7. Direction families

The executable values live in [`templates/visual-directions/v6-direction-manifest.json`](templates/visual-directions/v6-direction-manifest.json).

| Direction | Character | Typography | Composition |
|---|---|---|---|
| Formal finance | Quiet institutional authority | Evidence sans + Office-safe body | Ledger, controlled rules, narrow risk accent |
| Consulting evidence | Precision and decision logic | Light grotesk / sans | Asymmetric evidence grid, chart-led pages |
| Brand launch | Cinematic product narrative | Restrained single sans | Full-bleed subject, scene cuts, minimal interface |
| Training narrative | Clear editorial teaching | Humanist sans + selective serif | Lesson spine, example stage, practice checkpoint |
| Editorial narrative | Warm literary intelligence | Serif display + humanist sans | Story grid, folios, pull quotes, product surfaces |
| Swiss information | Objective information architecture | Light sans + technical mono | Baseline grid, numbering, native charts, square geometry |

## 8. Do / do not

Do:

- Name the atmosphere and art direction before choosing colors.
- Give every font, color, image, and shape a role.
- Use real screenshots, photography, charts, diagrams, or source material when the topic requires visible proof.
- Separate official facts from interpretation on the slide and in notes.
- Generate two or three structurally different variants for an important page.
- Give functional containers a restrained shared radius so formal slides feel approachable without becoming a SaaS card wall.

Do not:

- Create one master template and recolor it into several “directions.”
- Repeat “large title + three equal cards” as the default body page.
- Use huge type, grid lines, monospace labels, or rounded pills as automatic signs of taste.
- Build most body pages from large hard-corner boxes; preserve straight geometry for charts and evidence rules instead.
- Approximate official brand marks or copy another company’s identity.
- Claim a deck is finished when imagery, fonts, evidence, or editable objects are still placeholders.

## 9. Responsive behavior

Web Decks preserve the argument rather than shrinking a 16:9 canvas mechanically:

- At narrow widths, split layouts stack in reading order and decorative geometry retreats.
- Primary text stays at least 16 px; source text stays at least 11 px.
- Navigation never covers slide content and supports keyboard, wheel, touch, and reduced motion.
- A mobile cover shows the title and one primary visual without requiring users to pass through desktop navigation chrome.

## 10. Agent prompt guide

Before generating, write these fields into `design_spec.md` and `spec_lock.md`:

1. `atmosphere`: one sensory sentence, not “modern/clean/professional.”
2. `typography_personality`: the intended contrast between title, body, and evidence roles.
3. `composition_model`: the recurring alignment logic and the deliberate grid break.
4. `surface_rhythm`: when the deck changes paper/dark/image/data surfaces.
5. `image_behavior`: subject, narrative role, crop-safe zone, and replacement path.
6. `component_grammar`: approved structural components.
7. `anti_patterns`: at least three subject-specific failure modes.
8. `title_sequence`: the complete, grammatically consistent list of slide titles.
9. `rhythm_table`: one row per slide with surface, density, registered recipe, and visual protagonist.

Then select the closest direction pack and copy its locked tokens. If none fits, use `custom`, but keep this contract and record one concrete visual benchmark sentence.

## Provenance

The structure of this document was informed by the public [`awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) project (reviewed at commit `664b3e78fd1a298ba11973822da988483256d4b4`). The registered-layout, theme-rhythm, standard-image-slot, and browser-review discipline was informed by the latest [`guizang-ppt-skill`](https://github.com/op7418/guizang-ppt-skill) main branch reviewed at commit `82fe5ae129e8c2a12e1155fcabed6703342749d6`. The title-sequence, projection-scale, per-slide composition, design-system binding, and editable HTML-to-PPTX ideas were informed by the latest [`baoyu-design`](https://github.com/JimLiu/baoyu-design) main branch reviewed at commit `222ccbfcf83929fe0e5a8b6aaca3011fe7aabad6`. We also reviewed the design-system method of [`gzh-design-skill`](https://github.com/isjiamu/gzh-design-skill) at commit `ba1f4175519b481cb3566616c9e5178705067904`: light-first surfaces, semantic theme variables, component recipes, and source/output verification informed this independent contract. That project is AGPL-3.0, so Ultimate PPT Master copied none of its theme code, component markup, scripts, gallery assets, names, or layouts. Ultimate PPT Master uses original directions and does not reproduce third-party brand identities or templates.
