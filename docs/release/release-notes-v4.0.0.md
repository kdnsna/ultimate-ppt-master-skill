# Release Notes - v4.0.0

v4.0.0 turns the 4.0 capability track into the official release surface for Ultimate PPT Master. The headline change is **hybrid-editable visual generation**: formal PPTX pages stay editable, while generated imagery is constrained to no-text support layers.

## What Changed

- Page recipes now define the intended structure before a page is generated.
- Visual layers can be generated as background, texture, device mockup, or illustration support, but not as flattened body-slide screenshots.
- `spec_lock.md` can lock `page_recipes`, `visual_layers`, and `raster_policy` so production does not drift back to repeated card grids.
- `scripts/generate_visual_layers.py` writes page-level visual prompts and `assets/generated/page-visuals/manifest.json`.
- `scripts/audit_visual_recipes.py` blocks repeated page recipes and full-page raster use on formal body pages.
- Repository docs now use a categorized information architecture under `docs/guides`, `docs/quality`, `docs/release`, and `docs/strategy`.

## Plain-Language Update Notes

- This release is aimed at the complaint that AI-made PPTs are often ugly, repetitive, or impossible to edit.
- The new default is not "generate one beautiful screenshot per slide." It is "decide the page structure first, keep the important content editable, and use generated visuals only where they improve the page."
- Cover, section, tail, poster/KV, and explicit showcase pages may still use full-page generated imagery.
- Formal body pages keep editable copy, numbers, tables, charts, logos, and QR codes.

## Release Checks

```bash
npm run audit:docs
npm run audit:presets
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

## Compatibility

Older public documentation URLs are preserved as moved stubs for at least one release cycle. New links should point to the canonical categorized docs.
