# Release Notes - v6.1.0

v6.1.0 is the design-system release. It replaces shallow color presets with executable visual contracts, expands the registered layout library, and rebuilds the public gallery around three genuinely different finished-deck directions.

## Plain-Language Update Notes

- A new root-level `DESIGN.md` defines atmosphere, semantic color, typography roles, component grammar, layout, depth, image behavior, anti-patterns, responsive behavior, and the fields an Agent must lock before drawing slides.
- All six v6 visual directions now include typography personality, composition model, surface rhythm, shape grammar, image policy, approved components, responsive rules, and a direction-specific Agent prompt.
- The page-recipe registry now includes image stories, uniform proof grids, full-bleed product stages, single-KPI pages, direct-label native charts, editorial quotes, timelines, system maps, and source colophons.
- The workflow writes the title sequence first, names one visual protagonist per slide, plans surface rhythm, uses standard image geometry, preserves a bottom safe zone, and blocks repetitive layout families.
- Direction cards and the structural Web Deck preview now change typography, surface, composition, and motif with the selected direction instead of changing only an accent color.
- Shared Web/Desktop typography moves to Noto Sans SC, Noto Serif SC, IBM Plex Sans, and IBM Plex Mono role stacks; monospace is reserved for technical metadata.
- Three nine-slide AI frontier cases were re-art-directed as Precision Evidence, Cinematic Product, and Editorial Intelligence. Their copy, type scale, gallery, previews, and README hero were rebuilt and visually checked in a real browser.
- The production discipline was informed by `awesome-design-md`, the latest Guizang PPT Skill, and the latest Baoyu Design main branch. Ultimate PPT Master keeps original directions and does not copy third-party brand identities or templates.

## Compatibility

- `project-brief.json`, `storyboard.json`, `asset_plan.json`, `quality-report.json`, Bridge handoff, and `DeckSession` phases remain compatible with v6.0.0.
- The v5.4.1 Classic console remains available through `?classic=1` for the v6 compatibility cycle.
- PowerPoint remains the formal editing environment; Web Decks remain the browser-first storytelling route.

## Verification

```bash
npm run build:web
npm run build:desktop
npm run audit:v6-workspace
npm run audit:featured-decks
npm run audit:docs
npm run test:node
npm run test:worker
```
