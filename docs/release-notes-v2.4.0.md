# Release Notes - v2.4.0

v2.4.0 is a reuse and release-readiness release. It keeps the same production boundary:

> Web Experience prepares the project, Bridge writes it locally, and the Agent Skill remains the high-quality production route.

## Biggest Improvement

Reusable preset starter packs are now a first-class release surface. The project no longer only exposes scenario directions in the web UI; it also ships pack folders with a machine-readable contract, source skeleton, and quality checklist.

## Plain-Language Update Notes

- Pick a starter pack instead of writing a blank prompt. It gives the Agent a starting story, source checklist, template direction, and QA list.
- The GitHub technology scan explains the "why" behind the release: Markdown handoff, local agent tools, editable PPTX, and Web Decks are all active directions in the ecosystem.
- Each starter pack has a visible proof now: a source skeleton, web preview, cover image, and checklist.
- `npm run audit:presets` is the maintainer safety check. If a pack is missing files or still says `pending`, the release should fail.

## What Changed

- Added [GitHub Technology Scan - May 2026](./github-tech-scan-2026-05.md), mapping current open-source signals to product decisions.
- Promoted `consulting_proposal` and `tech_trend_web_deck` into starter packs under `templates/presets/`.
- Kept `executive_business_review` and `product_pitch` as starter packs, giving the catalog four reusable handoff starters.
- Added visible starter proofs under `examples/*-starter/` for all four v2.4 packs.
- Added `scripts/audit_preset_packs.py` and `npm run audit:presets` to verify pack contracts before release.
- Wired the preset audit into CI so reusable packs cannot silently lose required files or fields.
- Updated the Web Experience preset catalog with pack paths and stronger quality checks.
- Updated README, docs, and version markers for v2.4.0.

## Quality Bar

v2.4.0 treats a starter pack as releasable only if it has:

- `preset.json` with scenario, audience, source requirements, narrative skeleton, slide roster, template candidates, quality checks, and sample proof metadata;
- `source.md` as a sanitized starting point;
- `quality-checklist.md` as the Agent delivery contract;
- visible `generatedOutput` and `screenshot` proof paths;
- an entry in `preset-directions.json` with `status: "pack"` and `packPath`;
- a passing preset-pack audit in CI.

## Still Not Claimed

The packs are still `draft-pack`, not `stable-pack`. A stable pack still needs a full production-grade generated deck, screenshot set, and benchmark or QA note before public promotion.

## Upgrade

```bash
cd ultimate-ppt-master-skill
npm run update
npm run audit:presets
```
