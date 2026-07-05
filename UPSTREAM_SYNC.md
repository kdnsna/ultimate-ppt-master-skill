# Upstream Sync Notes

This repository is a fusion package. Do not replace `SKILL.md`, `README.md`,
`INSTALL.md`, `AGENTS.md`, `CLAUDE.md`, or `PROMPT.md` wholesale from any
upstream project; those files are the adaptation layer that makes the package
work across Codex, Claude Code, OpenClaw, Hermes, and generic agent tools.

## Review Matrix

| source | repo | remote_ref | local_ref | local_path | license | import_policy | last_reviewed |
|---|---|---:|---:|---|---|---|---|
| PPT Master | `hugohe3/ppt-master` | `668131f0ac05289c169a05a66c03182066fdccaf` | `668131f0ac05289c169a05a66c03182066fdccaf` | `upstream-ppt-benchmark/upstreams/ppt-master` | MIT-compatible upstream package at last sync | Sync implementation assets, manually adapt fusion entry files | 2026-07-05 |
| Guizang PPT Skill | `op7418/guizang-ppt-skill` | `82fe5ae129e8c2a12e1155fcabed6703342749d6` | `6bfa520b86ed5a3dffdac0a3323155e2b6f516b6` | `upstream-ppt-benchmark/upstreams/guizang-ppt-skill` plus installed `~/.agents/skills/guizang-ppt-skill` at `e09f931` | AGPL-3.0 on current `main` after 2026-05-28 | Do not copy post-AGPL Guizang code directly; absorb behavior requirements and reimplement locally | 2026-07-05 |
| Baoyu Skills | `JimLiu/baoyu-skills` | `main` skill versions around `1.117.x` / `2.x` | Hermes ports: infographic/comic `1.56.1`, article illustrator `1.57.0` | `~/.hermes/skills/creative/*` | MIT upstream with Hermes-local adaptations | Absorb workflow discipline first; do not import the full raster skill matrix into the PPTX/Web Deck core | 2026-07-05 |
| Baoyu Design | `baoyu/design` | `v1.1.1` notes | research only | external reference | MIT-compatible design workflow reference at review time | Use as research input; do not add an HTML-to-PPTX exporter to v5.4 | 2026-07-05 |

## Absorbed Capabilities

### PPT Master

absorbed_capabilities:
- Source conversion tools including `excel_to_md.py`, `doc_to_md.py`, `ppt_to_md.py`, and Python-first `web_to_md.py`.
- PPTX export support, speaker notes splitting, optional animation config, narration generation, and live SVG preview.
- Formal delivery audits, visual review workflow, preset proof packs, and local-first bridge entry points.

### Guizang PPT Skill

absorbed_capabilities:
- Guizang v1.1.0: Swiss Style is treated as a product route, not a one-off template.
- Style A editorial/e-ink web deck remains the default Magazine Web Deck.
- Style B Swiss Style exists as an opt-in web deck mode with `template-swiss.html`.
- Swiss Map / location-relationship semantics inform S08-style map pages without copying post-AGPL code.
- Codex image prompt discipline and multi-platform cover ideas are adapted into the local Asset Factory, with prompt files and source policy tracking.
- Swiss readability rules are part of the local contract: meta/labels at least 14px, captions/list text at least 16px, body text at least 18px, and large titles/KPI with a light 200-300 weight ladder.
- Screenshot framing semantics, screenshot backgrounds, image prompt references, Swiss map component notes, and `scripts/validate-swiss-deck.mjs` are part of the local Web Deck QA surface.

### Baoyu Skills

absorbed_capabilities:
- Baoyu Skills v2.5.2: generated-image status requires a current evidence chain, not a reused historical folder.
- prompt files before generation: every generated visual must have a durable prompt file path before the backend is invoked.
- Backend selection is recorded as data rather than hidden agent state.
- Generated assets record type, target slot, aspect ratio, status, source, text policy, and prompt provenance.
- `current_generation_evidence` records current thread output, generation time, file path, backend run id, or an explicit tool event before an asset can be marked `Generated`.
- forbid bitmap text overlay repair: if generated text is wrong, regenerate from a corrected prompt or reduce in-image text instead of painting over the bitmap.

### Baoyu Design

absorbed_capabilities:
- Baoyu Design v1.1.1 reinforces the rule that HTML/CSS stays the default structure layer for Web Decks, and images supplement the deck instead of replacing editable text.
- HTML Deck to editable PPTX research is tracked for v5.5+; it is intentionally not shipped in v5.4.

## Deferred Capabilities

deferred_capabilities:
- Guizang code committed after the AGPL-3.0 switch is not directly copied into this MIT fusion repository.
- `baoyu-slide-deck` remains a separate raster slide-image workflow. It is not the default because this repository's core promise is editable PPTX plus Magazine Web Deck.
- `baoyu-cover-image`, `baoyu-xhs-images`, `baoyu-diagram`, and `baoyu-image-gen` are candidates for optional future modules, not production-critical dependencies for v5.4.x.
- Runtime-native image batch generation can be added later after the manifest contract is stable.
- Baoyu Design v1.1.1 HTML Deck to editable PPTX exporter work is deferred to v5.5+ research; v5.4 keeps HTML/CSS stays the default for Web Deck structure.

## Adaptation Policy

- Keep the top-level output chooser: Mode 1 editable PPTX, Mode 2 magazine web deck.
- Keep Style A (`template.html`) as the default magazine/e-ink web deck aesthetic.
- Add Style B (`template-swiss.html`) as an opt-in Swiss Style variant; do not mix Style A and Style B classes in a deck.
- Preserve the local `web_to_md.cjs` fallback even though current `ppt-master` prefers the Python `web_to_md.py` path.
- Keep `--trace-conversion` as an optional diagnostics path; it should not become part of the default export unless a failure or QA investigation needs it.
- Prefer syncing upstream implementation assets mechanically, then manually adapting the fusion entry files.
- Run `python3 -m unittest discover -s tests` after every sync to verify the expected upstream capability surface remains wired into the fusion package.

## Future Sync Checklist

1. Clone fresh upstream snapshots to temporary directories.
2. Compare `hugohe3/ppt-master/skills/ppt-master` against this repository.
3. Compare `op7418/guizang-ppt-skill` against `assets/magazine-web/`, `references/magazine-web/`, and `scripts/validate-swiss-deck.mjs`.
4. Review `JimLiu/baoyu-skills` for workflow-level changes to prompt files, backend selection, batching, and text repair policy.
5. Sync implementation files only when the license and adaptation policy allow it.
6. Manually merge `SKILL.md` and docs according to the adaptation policy above.
7. Run unit tests and at least one CLI smoke test.
