# Release Notes - v5.4.1

v5.4.1 is the guardrail patch for Swiss Deck + Asset Factory. It keeps the v5.4 Web Deck routes, then tightens the execution path so README promises, asset planning, generated-image evidence, layout validation, and export gates are all tied to executable checks.

## What Changed

- Reworked route selection into a deterministic table and fixture set so formal/editable signals, web signals, Swiss information-design signals, and extreme-thin prompts resolve predictably.
- Rewired Step 5 around `scripts/build_asset_plan.py`, making `asset_plan.json` the parent image contract before `image_prompts.json`.
- Preserved existing asset status and `current_generation_evidence` when rebuilding an asset plan, and stopped silently creating project folders for invalid inputs.
- Added current-run evidence writing in `scripts/image_gen.py` with run id, backend, prompt hash, file hash, dimensions, and timestamp.
- Added `pipeline-state.json` quality-gate state so PPTX export rejects stale or missing quality proof.
- Added `scripts/validate-magazine-deck.mjs` for Style A and moved Swiss layout signatures into `references/magazine-web/swiss-layout-registry.json`.
- Strengthened Swiss validation for slide-count mismatch, undefined classes, font-size checks, `flex-end`, and unsafe S22 `object-position`.
- Added `spec_lock` budget slicing and a hard resume-execute threshold for decks above 16 pages.
- Rewrote the README and public proof page around Proof Packs, known limits, dependencies, and executable claim checks.

## Plain-Language Update Notes

- Short or vague requests now route more predictably.
- Generated images can no longer be marked done without evidence from the current run.
- Manual image gaps are visible earlier, before page assembly hides the problem.
- The README no longer leads with a magic prompt or overclaims ahead of the workflow.
- The old public benchmark language is now a Proof Packs gallery with visible inputs, outputs, and Design Doctor self-assessment.

## Compatibility

v5.4.1 is additive for v5.4.0 projects. Existing `bestEffectBrief`, `webDeck`, `visualBrief`, `guidedBrief`, `expectationFit`, `asset-plan.md`, and `asset_plan.json` files remain valid. Re-running `scripts/build_asset_plan.py` now preserves completed rows and evidence by item id.

No desktop binary is attached to this release. Public distribution continues through source packages and the Web/Agent workflow unless a separate signed desktop package is produced.

## Verification

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests
npm run audit:docs
npm run audit:market
npm run audit:quality
npm run audit:image-contracts
npm run audit:magazine-deck
npm run audit:swiss-deck
npm run audit:presets
npm run audit:web-console
npm run test:node
npm run test:bridge
npm run build:web
npm run build:desktop
npm run doctor
git diff --check
```
