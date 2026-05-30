# Release Notes - v3.0.0

v3.0.0 upgrades Ultimate PPT Master from a quality workbench into a formal-business delivery workbench. The product stays local-first: Web prepares the brief, Bridge writes a local handoff folder, and Codex or another local Agent performs production with the Skill.

## What Changed

- Added `qualityGate.level = "formal-business"` across Web, Bridge, project briefs, manifests, checklists, and pending quality reports.
- Added Codex-first handoff files: `asset-plan.md`, `visual-element-kit.md`, `codex-task.md`, `AGENTS.md`, and `quality-report.json`.
- Added `scripts/generate_visual_element_kit.py` for the ChatGPT/OpenAI micro-asset loop.
- Added `assets/generated/element-manifest.json`, `images/image_prompts.json`, and `images/image_prompts.md` as the expected generation state.
- Added `Needs-Manual` fallback prompts when no image backend or OpenAI key is configured.
- Added `scripts/audit_formal_delivery.py` to catch missing quality gates, repeated layouts, missing images or no-image strategy, sparse PPTX text, and logo text fragments.
- Improved the Web handoff panel so users see Bridge state, local project path, element-generation command, Agent command, and the fallback prompt location in order.

## Plain-Language Update Notes

- Codex now gets a folder it can execute, not only a prompt.
- ChatGPT image generation is used for small reusable elements such as section dividers, metric badges, process nodes, connectors, icon accents, subtle patterns, and callout stickers.
- Generated images must support the design language; body text, key numbers, charts, and labels stay editable in PPTX/Web Deck outputs.
- No image key is not a blocker. The workflow writes `Needs-Manual` prompts that can be pasted into ChatGPT and saved to the listed paths.

## Proof Matrix

Run these before publishing:

```bash
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
npm run audit:presets
npm run audit:quality
npm run audit:market
git diff --check
```

Desktop is not the v3.0.0 release surface, but its bundled worker resource is synchronized so future Tauri packaging does not drift from the source worker.
