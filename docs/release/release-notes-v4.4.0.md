# Release Notes - v4.4.0

v4.4.0 rebuilds the Web Experience as a Codex-first project launcher. The generation engine, Bridge handoff contract, DeckIR AI Planning Pack, rendered-review loop, and formal delivery audits remain compatible; the main change is that the first screen no longer behaves like a platform console.

## What Changed

- Replaced the multi-panel web console with one primary flow: drop files or paste source material, write one goal, create a local project, and copy the Codex command.
- Added the `CodexFirstFlow`, `SourceDropzone`, `CodexPrimaryAction`, `CodexResult`, and `DebugDrawer` surface so the main screen stays simple while advanced proof artifacts remain available.
- Replaced the v4.1 console navigation state with a smaller Codex flow state machine: `needs_input`, `needs_bridge`, `ready_to_create`, `creating`, `ready_for_codex`, and `error`.
- Kept the v4.2 and v4.3 handoff files in every Bridge project: `storyboard.json`, `source-map.json`, `planning-report.json`, `review-findings.json`, `repair-plan.json`, and `revision-brief.md`.
- Moved Benchmark Wall, quality report, page-map, and rendered-review details into the debug drawer instead of the primary workflow.

## Plain-Language Update Notes

The web page is no longer trying to be the place where you manage everything. It now does one job: prepare a clean local project for Codex. The user sees source input, a goal box, one button, the project path, and the copied Codex command.

## Checks

```bash
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run audit:docs
npm run audit:web-console
npm run audit:quality
npm run audit:market
git diff --check
```

## Compatibility

This release does not remove the underlying DeckIR, rendered-review, repair-plan, or formal-business audit workflows. It changes the product front door so ordinary use starts with Codex instead of a complex web platform.
