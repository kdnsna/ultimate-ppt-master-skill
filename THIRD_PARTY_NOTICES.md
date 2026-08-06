# Third-Party Notices

终极融合PPT大师 / Ultimate Fusion PPT Master packages and adapts MIT-licensed presentation skill resources from:

## ppt-master

- Source: https://github.com/hugohe3/ppt-master
- Copyright: Copyright (c) 2025-2026 Hugo He
- License: MIT
- Used for: editable PPTX workflow, SVG-to-PPTX scripts, live preview/animation/narration helpers, layouts, charts, icons, and role references.

## guizang-ppt-skill

- Source: https://github.com/op7418/guizang-ppt-skill
- Copyright: Copyright (c) 2026 op7418 (歸藏)
- License: MIT
- Used for: magazine-style single-file HTML deck workflow, editorial and Swiss templates, Motion One local fallback, themes, layouts, screenshot backgrounds, components, validators, and checklist.

## open-kimi-ppt-skill

- Source: https://github.com/kdnsna/open-kimi-ppt-skill (upstream: https://github.com/Binaryify/open-kimi-ppt-skill)
- Copyright: Copyright (c) 2026 binaryify
- License: MIT
- Used for (adapted, not copied wholesale):
  - PPTD v2 intermediate format (`.pptd` manifest + per-page `.page` + `media/`) as the visual compilation layer, re-designed with JSON Schema, structured validator, path safety, and UPM metadata;
  - browser-side PPTX export mechanics (localhost SDK host → Kimi public editor iframe RPC → download capture → transition patch → ZIP verify) encapsulated as the replaceable `upm/adapters/kimi/` backend;
  - whole-deck image export + contact-sheet stitching absorbed into the unified visual QA pipeline (`upm/qa/`);
  - local editor interaction model and path-safety rules (relative paths only, no `..`, `.pptd`/`.page` write allowlist) absorbed into `upm open`.
- Compatibility note: the Kimi public editor is an unofficial reverse-engineered external frontend; URLs, selectors and RPC surfaces are versioned in `upm/adapters/kimi/manifest.json` and may break without notice. It is an opt-in adapter, not the default backend, and never a dependency of the local pipeline.
