# Release Notes - v5.4.0

v5.4.0 ships Swiss Deck + Asset Factory. The Web route now has two clear choices: Style A editorial/e-ink for narrative decks, and Style B Swiss International for information-design decks. Image work now starts with `asset_plan.json` before generation.

## What Changed

- Added a Web Console Swiss Deck / Asset Factory section with Style A and Style B choices, Swiss theme/policy preview, map-page, cover-derivative, and generated-visual intent controls.
- Added `webDeck` and `assetPlanRequired` to `project-brief.json` and `manifest.json`.
- Added `asset_plan.json` to downloaded handoff kits and Bridge-created projects, while keeping the existing `asset-plan.md`.
- Added `scripts/build_asset_plan.py` and `templates/asset_plan_reference.json` so a handoff folder can derive `asset_plan.json`, `images/image_prompts.json`, and `images/image_prompts.md`.
- Added `npm run audit:swiss-deck` and strengthened `scripts/validate-swiss-deck.mjs` for missing layouts, S22 21:9 slots, SVG visible text, risky small type, crop risk, and bottom navigation safe zones.
- Added `examples/swiss-v54-demo/index.html`, an 8-page Swiss Deck demo covering cover, KPI, comparison, process, map/location relationship, image hero, evidence, and closing.
- Extended image contract audits so `Generated` assets must include `current_generation_evidence`.

## Plain-Language Update Notes

- Users can now pick between a story-first magazine Web Deck and a grid-first Swiss Web Deck.
- Swiss decks are no longer just "a style"; they carry layout IDs, image slots, and an audit command.
- Image generation is no longer a loose checklist. The plan comes first, prompts are files, and generated outputs need current-run evidence.
- If an image backend is unavailable, the workflow can write `Needs-Manual` prompts instead of failing the whole deck.

## Upstream Boundary

- Guizang v1.1.0 informed the Swiss Style, Swiss Map, Codex image, and multi-platform cover directions.
- Baoyu Skills v2.5.2 informed the image-generation evidence chain and the rule against reusing historical generated images as current output.
- Baoyu Design v1.1.1 is tracked as a future research input: HTML/CSS stays the default for deck structure in this release, and HTML Deck to editable PPTX research moves to v5.5+.
- This MIT repository does not copy post-AGPL Guizang code. The behavior is rewritten locally.

## Compatibility

v5.4.0 is additive for v5.3 handoff files. Existing `bestEffectBrief`, `visualBrief`, `guidedBrief`, `expectationFit`, `sourceConfidence`, `deliveryScorecard`, `referenceStyle`, and `feedbackLoop` fields still work. New agents should preserve `asset-plan.md` and read `asset_plan.json` when present.

No desktop binary is attached to this release. Public distribution continues through source packages and the Web/Agent workflow unless a separate signed desktop package is produced.

## Verification

```bash
python3 -m unittest tests.test_release_integrity tests.test_upstream_sync_integrity tests.test_image_asset_contracts
npm run audit:image-contracts
npm run audit:swiss-deck
npm run audit:docs
npm run audit:web-console
npm run test:node
npm run build:web
git diff --check
```
