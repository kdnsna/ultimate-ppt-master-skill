# Release Notes - v4.1.0

v4.1.0 focuses on the Web Experience console. It does not rewrite the PPT generation pipeline; it makes the existing local-first workflow easier to operate by reducing visible choices and repeated actions.

## What Changed

- Replaced the five-page workspace navigation with a four-step console: prepare, add sources, connect locally, deliver.
- Added a state-driven primary action so the page always exposes one recommended next step.
- Moved setup checks, provider status, skill install, proof walls, glossary, and generated-file details into drawers or collapsed sections.
- Grouped preview artifacts into user preview, AI-helper files, and quality report instead of showing eleven peer tabs.
- Added `scripts/audit_web_console.py` and `npm run audit:web-console` to block regressions such as stale v3 copy, old five-tab navigation, ungrouped previews, or missing v4.1 console components.

## Plain-Language Update Notes

- The Web Experience should now feel less like a feature catalog and more like a control panel.
- Users should be able to open the page and follow one main button through the normal path.
- Advanced settings are still available, but they no longer compete with the first-run path.
- v4.0 remains the generation-quality contract: page recipes, editable body content, and no-text generated visual layers are unchanged.

## Release Checks

```bash
npm run audit:docs
npm run audit:web-console
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

Bridge APIs, handoff payloads, generated project files, desktop build behavior, and agent skill invocation remain compatible with v4.0.0.
