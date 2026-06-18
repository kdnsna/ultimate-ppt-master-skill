# Release Notes - v5.2.0

v5.2.0 turns expectation fit from a readiness signal into a production contract. v5.1 added Visual Brief tags and Codex Guided Intake; v5.2 adds the fields that explain why a deck may still miss user expectations and how the agent should fix it without blindly remaking everything.

## What Changed

- Added the v5.2 `project-brief.json` contract with `schemaVersion`, `referenceStyle`, `sourceConfidence`, `deliveryScorecard`, `feedbackLoop`, `failureTaxonomy`, `confirmationBrief`, and `imageAcceptance`.
- Added concrete reference-style directions in the Web Visual Brief Builder, including consulting report, financial steady, management dashboard, solution roadmap, launch keynote, clean courseware, research evidence, and culture-tourism editorial.
- Added source confidence checks so Codex can separate user-provided facts from assumptions, missing sources, and claims that need evidence.
- Added a delivery scorecard covering brief clarity, source confidence, style specificity, asset boundary, and editable output.
- Added a feedback taxonomy for dissatisfaction: brief mismatch, source gap, style mismatch, visual-density mismatch, asset/IP boundary, and format mismatch.
- Added slide-level `slideTask` fields to DeckIR previews so every page has a job, primary question, takeaway, layout family, editability rule, and evidence refs.
- Updated Bridge and Desktop Worker so all local handoffs preserve the same v5.2 contract in `project-brief.json`, `manifest.json`, `quality-report.json`, `codex-task.md`, and `AGENTS.md`.
- Added v5.2 audits: `npm run audit:brief`, `npm run audit:visual-intent`, and `npm run audit:feedback-loop`.

## Plain-Language Update Notes

- Users can choose a concrete visual reference instead of only writing vague words like "formal and polished."
- Codex can now say which parts are known, which parts are assumptions, and which claims must not be invented.
- If a user says the PPT is not satisfying, the next revision starts by classifying the reason, then fixes the right layer.
- AI image generation remains allowed for no-text hero visuals, atmosphere, micro-assets, and textures; factual images still prefer official or user-provided sources.
- The default remains editable PPTX, Microsoft YaHei typography, official/IP asset boundaries, rendered review, and formal-business audit.

## Compatibility

v5.2.0 is additive for v5.1 handoff files. Existing `briefMode`, `visualBrief`, `guidedBrief`, and `expectationFit` fields still work. New agents should preserve the v5.2 fields and write them back after guided intake or revision.

No desktop binary is attached to this release. Desktop build verification remains part of the gate, but public distribution continues through source packages and the Web/Agent workflow unless a separate signed desktop package is produced.

## Verification

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:market
npm run audit:brief
npm run audit:visual-intent
npm run audit:feedback-loop
python3 -m unittest tests/test_release_integrity.py
npm run audit:presets
npm run audit:quality
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```
