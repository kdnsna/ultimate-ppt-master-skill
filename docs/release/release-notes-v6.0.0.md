# Release Notes - v6.0.0

v6.0.0 turns Ultimate PPT Master from a component-first console into a task-first local presentation workspace. It keeps the v5.4.1 production contracts and Classic console for one release cycle while making the new workspace the default.

## Plain-Language Update Notes

- Start with one task, real source files or URLs, and the delivery purpose. Bridge, providers, DeckIR, scripts, and JSON details live in diagnostics.
- Confirm a storyboard before generation. The workspace infers requests such as “10 slides”, asks at most three material questions, and shows three structural variants per slide.
- Choose from three recommended complete visual directions, selected from six v6 packs covering cover, body, data, chart, image, section, and closing pages.
- Refine by stable `slideId` in a three-column workspace. A slide-level revision writes `revision-requests/Pxx.json` instead of rebuilding the full deck.
- Bridge progress is delivered through a read-only SSE stream. Health polling pauses while the page is hidden.
- Repeated local sources reuse a SHA-256 extraction cache. PPTX reference import preserves a stable page identity, theme, font, color, layout, and placeholder metadata.
- A new PPTX native-object audit can verify editable text, shapes, charts, tables, and notes when those object families are expected.
- Direct Lucide icon imports reduce the Web production build from 1,573 transformed modules to 69 on the audited machine; the default v6 bundle is split from Classic mode.

## Compatibility

- `project-brief.json`, `storyboard.json`, `asset_plan.json`, `quality-report.json`, and existing Bridge handoff behavior remain compatible.
- The shared `DeckSession` phases are `intake / outline / generating / review / delivered`.
- The v5.4.1 console remains available through `?classic=1` for one release cycle.
- PowerPoint remains the formal editing environment; the Skill is the workflow, source, brand, and quality layer around it.

## Verification

```bash
npm run build:web
npm run build:desktop
npm run audit:v6-workspace
npm run audit:web-console
npm run audit:image-contracts
npm run test:bridge
python3 scripts/audit_pptx_native_objects.py <final.pptx> --expect text,shape
```
