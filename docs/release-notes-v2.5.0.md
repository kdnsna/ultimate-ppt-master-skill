# Release Notes - v2.5.0

v2.5.0 reframes Ultimate PPT Master as a quality workbench for Chinese office users. The product stays local-first: the web page prepares the brief, Bridge writes a local handoff project, and the Agent Skill remains the high-quality production route.

## What Changed

- Reworked the Web first screen so the right side shows current task preview, next step, quality status, and delivery gates.
- Promoted the four current preset packs to `stable-pack` with `userLevel`, `qualityProfile`, `proofArtifacts`, and `notFor`.
- Added Design Doctor as the visible quality review step, combining SVG checks, browser visual review, and `quality-report.json`.
- Extended Bridge handoff contracts with `qualityProfile`, `expectedArtifacts`, and `reviewCommands`.
- Added `scripts/audit_quality_proofs.py` and `npm run audit:quality` for stable proof gates.

## Plain-Language Update Notes

- Users do not need to understand the whole toolchain before starting. The first screen now says what the deck task is, what to do next, and what will be checked.
- A stable preset now needs proof: synthetic source, generated output, screenshot, quality report, and suitability boundary.
- The Agent receives an acceptance contract, not only a prompt.
- Design Doctor reports problems first. Automatic SVG repair stays opt-in.

## Proof Matrix

See [Quality Workbench v2.5](./quality-workbench-v2.5.md) for the public synthetic benchmark matrix.
