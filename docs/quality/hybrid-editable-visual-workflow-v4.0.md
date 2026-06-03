# Hybrid-Editable Visual Workflow v4.0

v4.0 adds a stronger visual production contract for formal decks: generated visuals can improve the page, but they must not replace the editable content model of a PPTX body slide.

## Core Rule

Formal body pages use this order:

```text
Page role -> page recipe -> editable layout -> optional no-text visual layer -> audit
```

The important content stays editable: headings, body copy, numbers, tables, charts, diagrams, logos, and QR codes.

## Page Recipes

Page recipes define the structural job of a slide before the generator draws it. They reduce the default drift toward "every page is another card grid."

Typical recipe families include:

- anchor or title pages for the first signal
- comparison pages for tradeoffs
- process pages for steps and handoffs
- metric pages for data focus
- risk or caveat pages for formal business material
- action or closing pages for decision and next step

The recipe catalog lives in `templates/page-recipes/index.json`.

## Visual Layers

Generated visual layers are allowed when they support the editable page:

- no-text background texture
- subject-matter scene or atmosphere
- device or screen mockup without embedded claims
- small illustration, icon-like support element, or material detail
- section and cover artwork where the page is intentionally visual-led

Generated visual layers must not carry policy facts, business numbers, legal claims, customer instructions, financial amounts, QR codes, or brand marks that should remain verifiable.

## Raster Policy

Full-page generated images are allowed only for:

- cover pages
- section divider pages
- tail or closing pages
- poster/KV pages
- Web showcase pages
- explicit user override recorded in `spec_lock.md`

Formal body pages should fail the audit if they are replaced by full-page raster artwork.

## Required Files

- `spec_lock.md`: locks recipes, visual layers, and raster policy.
- `assets/generated/page-visuals/manifest.json`: records generated or manual visual-layer prompts.
- `quality-report.json`: records delivery checks and remaining risks.

## Commands

```bash
python3 scripts/generate_visual_layers.py <project_path>
python3 scripts/audit_visual_recipes.py <project_path>
python3 scripts/audit_design_completion.py <project_path>
python3 scripts/audit_formal_delivery.py <project_path>
```

## Why This Matters

The goal is not to make slides look like images. The goal is to keep the deck editable enough for real office work while giving each page a deliberate visual role and enough texture to avoid the stale, repeated-template look.
