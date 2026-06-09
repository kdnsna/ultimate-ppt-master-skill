# Release Notes - v4.2.0

v4.2.0 formalizes the DeckIR AI Planning Pack. It keeps the v4.1 simplified Web console and the v4.0 hybrid-editable contract, then adds a planner-first layer so every handoff can start from page roles, evidence, editability targets, and rendered-review checks.

## What Changed

- Added DeckIR v1 planning files to Web, Bridge, and Desktop handoff: `storyboard.json`, `source-map.json`, `planning-report.json`, and `review-findings.json`.
- Added `scripts/ai_storyboard.py` with no-key fallback, plus `scripts/audit_storyboard.py` for page role, recipe, evidence, editability, and raster-policy checks.
- Added `scripts/review_rendered_deck.py` so generated previews can be reviewed after rendering and merged into `quality-report.json`.
- Added Web Experience panels for the one-click best route and AI page map, without exposing engineering jargon to normal users.
- Extended PPTX reference import to write `reference-style.json` for future reference-deck style learning.

## Plain-Language Update Notes

- The product now plans the deck before asking an AI assistant to build it.
- Users still choose PPTX, Web Deck, or both, but the handoff package now includes a page map and evidence boundary.
- Formal body pages remain editable-first: DeckIR and visual recipe audits both block full-page raster body slides.
- No provider key is required for planning; the local fallback planner still writes usable project files.

## Release Checks

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:presets
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

## Compatibility

The v4.2 handoff adds DeckIR files but keeps existing v4.1 Web console behavior, Bridge endpoints, Desktop Worker output modes, and v4.0 formal-business quality gates compatible.

