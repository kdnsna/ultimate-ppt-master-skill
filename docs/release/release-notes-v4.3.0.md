# Release Notes - v4.3.0

v4.3.0 promotes the Rendered Review Loop from a report-only check into a safer revision workflow. It keeps the v4.2 DeckIR AI Planning Pack, the v4.1 simplified Web console, and the v4.0 hybrid-editable contract, then adds a human-approved repair plan and a second-generation revision brief.

## What Changed

- Extended `review-findings.json` with repair metadata: `riskLevel`, `autoFixable`, `targetArtifact`, `suggestedCommand`, and `repairCandidates`.
- Extended `repair-plan.json` with top-level candidate counts, dry-run/apply commands, and the `revision-brief.md` path.
- Added `revision-brief.md` generation through `scripts/apply_review_plan.py --safe-only --apply`.
- Kept `scripts/apply_review_plan.py --safe-only --dry-run` as the default safe path; dry-run prints the plan and writes no project files.
- Hardened `scripts/review_rendered_deck.py` CLI behavior so `--help` is safe and missing project paths fail cleanly.
- Refactored the repository homepage README around the current product loop instead of listing historical releases first.

## Plain-Language Update Notes

- The tool now shows what should be repaired after a deck is rendered.
- Safe repairs are suggestions and planning hints, not silent factual edits.
- `revision-brief.md` gives an AI assistant a clean second-pass brief after the user approves the repair direction.
- `source.md` and extracted source facts are never rewritten by the automatic repair path.

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

v4.3 keeps existing DeckIR handoff files, Bridge endpoints, Desktop Worker output modes, and formal-business audits compatible. The new repair brief is additive and only appears after the safe apply command is explicitly run.

