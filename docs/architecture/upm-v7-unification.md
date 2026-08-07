# UPM v7 Unification: absorbing open-kimi-ppt-skill into Ultimate PPT Master

> Status: implementation baseline (Phase 1 audit + design)
> Date: 2026-08-06
> Scope: two-repo audit, capability comparison, target architecture, migration and deletion list, risks, phased plan.

## 1. Research summary

### 1.1 Main project (`ultimate-ppt-master-skill`, v6.3.9)

Current generation chain (Mode 1 editable PPTX):

```text
source → source_to_md/* converters → project_manager init/import-sources
→ ai_storyboard.py / Bridge buildDeckIR (DeckIR + storyboard + source map)
→ design_spec.md + spec_lock.md (design tokens, page role contract)
→ asset plan + image generation
→ hand-written SVG pages (svg_output/) → svg_quality_checker
→ total_md_split → finalize_svg → svg_to_pptx (native DrawingML objects)
→ visual_review / rendered review / audit_design_completion → delivery
```

Preserve-edit chain:

```text
pptx → preserve_edit_pptx.py (package-preserving OOXML edits)
→ fidelity report (safe hard gate) → render before/after → deliver
```

Key strengths confirmed in code:

- `preserve_edit_pptx.py`: part-level SHA-256 fidelity gate, only named slides/chart parts re-serialized, no-match leaves byte-identical output, NL edit plan parser, native text/style/table/geometry/chart ops.
- DeckIR / evidence: `storyboard.json`, `source-map.json`, evidence states (`unmapped/candidate/grounded/conflicted/missing`), recipe/layout contracts in `templates/page-recipes/index.json`, `review_rendered_deck.py` + `apply_review_plan.py` safe repair plans.
- Design system: `DESIGN.md`, `contracts/visual-defaults.yaml`, `templates/visual-directions/`, `templates/page-recipes/index.json`, `references/shared-standards.md`.
- Quality modes: `contracts/quality-modes/{quick,standard,audit}.yaml` with per-mode gates and budgets.
- Local editors/QA: `scripts/svg_editor/server.py` (SVG live preview + annotations), `scripts/visual_review.py` (Playwright PNG rendering, blank-page histogram), `scripts/review_rendered_deck.py`.
- Bridge (`apps/bridge/server.mjs`, ~4.1k lines): handoff project writer, deterministic DeckIR fallback, provider status, attachment/artifact security, agent spawning.
- Environment: `bootstrap.sh` profiles + `doctor.sh` (report-only) + pinned-ish `requirements*.txt`.

Weaknesses this task removes or reduces:

- Six classifier routes (`formal-editable-pptx`, `magazine-web-deck`, `guizang-web-fixed-style`, `staged-questions`, `source-first`, `dual-delivery`) with overlapping fallback logic; user-visible route fragmentation.
- Generation requires hand-written SVG pages (context-heavy, model-facing), no machine-checkable page model before SVG.
- Visual review is render-first but repairs are planning-hints only; no page-level deterministic repair loop with a round budget.
- 87 scripts at top level; user-facing command surface is large.
- 889-line SKILL.md with duplicated routing/quality rules.

### 1.2 `open-kimi-ppt-skill` (MIT, by binaryify)

Researched files: `SKILL.md`, `reference/pptd.md` (1,886 lines), `reference/shapes.md`, `reference/fonts.md`, `reference/slides_categories.md`, `scripts/export_pptx.py`, `scripts/export_images.py`, `scripts/export_host.html`, `editor/{app.js,index.html,lib.js,styles.css}`, `lib/editor-server.js`, `bin/open-kimi-ppt-skills.js`, tests, examples.

Real capabilities:

| Capability | Implementation | Verdict |
|---|---|---|
| PPTD v2 intermediate format | `.pptd` manifest + per-page `.page` + `media/`; theme tokens, text/shape/line/image/icon/table/chart elements; rich text; image fit/crop; OOXML-aligned shape adjustments | **Absorb as the visual compilation layer**, re-designed with schema/validator/versioning |
| Browser-side PPTX writer | `export_pptx.py` + `export_host.html`: localhost SDK host → `https://www.kimi.com/neo-ppt/` iframe → penpal RPC (`setSlideConfig/setPPTD/setEditable/getSlideStatus`) → click 导出/下载 → capture download → transition patch → ZIP verify | **Absorb behind a replaceable adapter** (no auto-install, explicit healthcheck, versioned selectors) |
| Whole-deck image export + contact sheet | `export_images.py`: same browser flow, CDP into OOPIF to switch 图片 format, download ZIP, unzip, Pillow overview stitch | **Absorb into unified visual QA** (render → contact sheet → review → repair) |
| Local PPTD editor | `editor/` + `lib/editor-server.js`: File System Access API, path safety (`normalizeRelativePath`, no `..`, no absolute), `.pptd`/`.page` write allowlist, rollback on save failure | **Absorb** as `upm open` localhost editor; no Kimi iframe dependency for browsing/editing |
| Path safety | `lib.js` + `safe_project_path` in exporters | **Absorb** into `upm/pptd/paths.py` |
| PPTD validation | spec-only + script checks (v2, pages list, elements array) | **Rewrite**: JSON Schema + structured validator with error locations |
| Agent-facing docs | scenario guides, fonts list, shape tables | **Selectively absorb** (font system, scenario rules) into tokens/recipes |

What we deliberately do NOT take:

- Kimi's "default dual delivery (PPTD + PPTX)" product model — UPM delivers one project with PPTX as the primary artifact.
- Kimi's `npx open-kimi-ppt-skills install` skill-install lifecycle — UPM has its own bootstrap/doctor.
- Auto `npm install -g agent-browser@latest` and auto `pip install --user` — prohibited by UPM dependency policy.
- Kimi as the only export path — it becomes one adapter among others; local exporter is the default.
- The full 13-type ECharts-style chart DSL as a first-class contract — we support the core subset (`bar/line/area/pie/table/waterfall`) and treat advanced charts as shapes/render-only.

## 2. Target architecture

Two engines, three user paths, replaceable backends:

```text
Engine A: Preserve Edit Engine        preserve_edit_pptx.py + fidelity gate
Engine B: Deck Generation Engine      DeckIR → PPTD → export → QA loop
```

User paths:

| Path | Command | Default chain |
|---|---|---|
| `preserve-edit` | `upm edit file.pptx "..."` | inspect → native OOXML patch → fidelity report → render proof |
| `editable-deck` | `upm make <source-or-topic>` | normalize → DeckIR → tokens/recipes → PPTD compile → structure gate → render → contact sheet → review/repair (≤2 rounds) → PPTX export → quality report |
| `web-deck` | `upm make ... --format web` | same DeckIR → existing magazine-web templates (visual preset + delivery config, not a separate engine) |

Demotions:

| Old concept | New status |
|---|---|
| `source-first` | input strategy (normalization mode) |
| `staged-questions` | interaction state inside `upm make` intake |
| `guizang-web-fixed-style` | visual preset name |
| `dual-delivery` | delivery config (generate both formats) |

## 3. Target directory structure (new code)

```text
upm/
  errors.py                 # actionable error hierarchy
  paths.py                  # safe relative path rules
  pptd/
    model.py                # PPTD v2 data model
    schema.py               # JSON Schema + validator (precise errors)
    io.py                   # project load/save/scan
  compiler/
    deckir.py               # deterministic DeckIR builder (claims/roles/recipes)
    tokens.py               # design tokens → PPTD theme
    compiler.py             # DeckIR → PPTD (deterministic)
    overflow.py             # text overflow pre-check
  render/
    svg.py                  # PPTD page → SVG (local preview/render)
    charts.py               # bar/line/pie/table SVG renderers
  export/
    base.py                 # Exporter protocol + ExportResult + record
    local.py                # PPTD → SVG → existing svg_to_pptx engine
    registry.py             # backend selection (local default; kimi opt-in)
  adapters/kimi/
    manifest.json           # versioned selectors/URLs/RPC surface
    healthcheck.py
    exporter.py             # PPTD → PPTX (browser)
    renderer.py             # PPTD → page images + overview (browser)
  qa/
    render.py               # page image rendering (local/browser backends)
    contact_sheet.py        # Pillow overview
    rubric.py               # deterministic visual checks
    repair.py               # page-level repair plan + round budget
    report.py               # quality report
  cli/
    common.py               # project/open helpers
    make.py  edit.py  open_server.py  review.py  doctor.py
  __main__.py
bin/upm                     # executable entry
contracts/schemas/pptd.schema.json
docs/guides/upm-cli.md
```

Project layout (new generation projects):

```text
<project>/
  deck.pptd
  pages/*.page
  media/                     # images referenced by pages
  sources/                   # imported source material (copy default)
  exports/<name>.pptx
  preview/                   # overview.jpg + pages/*.png
  .upm/
    deckir.json
    quality-report.json
    repair-plan.json
    export-record.json
    cache/  renders/  qa/  intermediate/
```

## 4. Absorb / rewrite / drop list

Absorb (re-designed):

- PPTD v2 manifest/page/media layout, element vocabulary (text/shape/line/image/table/chart), theme tokens, image `cover/contain`, rich text.
- Browser export mechanics (localhost SDK host, penpal RPC, download capture, transition patch, ZIP verify) as `adapters/kimi`.
- Whole-deck image export + overview stitch as `qa/contact_sheet.py`.
- Local editor interaction model and path-safety rules as `upm open` + `upm/pptd/paths.py`.
- Scenario/font guidance into `compiler/tokens.py` and recipe data.

Rewrite:

- PPTD validation (Schema + structured validator with file/line/field errors).
- DeckIR → PPTD compiler (deterministic; model no longer hand-writes coordinates).
- Visual QA loop with repair rounds and quality report.
- CLI (`upm make/edit/open/review/doctor`), doctor (no-install).

Drop / demote:

- `npx open-kimi-ppt-skills install` lifecycle; Kimi URL/selector details scattered in docs.
- Auto-install behavior (`npm -g`, `pip --user`) inside export/QA tools.
- Dual-delivery as a route; kept only as an optional delivery flag.
- `guizang-web-fixed-style` as a classifier route; kept as a visual preset.
- `staged-questions` / `source-first` as classifier routes; kept as intake state / input strategy.

## 5. Deletion & migration list

Phase 8 deletions (after the new flow is end-to-end green):

- `docs/choosing-a-workflow.md` (superseded by `docs/guides/upm-cli.md`).
- Old route names from `contracts/route-policy.yaml`, `contracts/workflow-policy.yaml`, generated policy files, TS/JS/Python classifier implementations and fixtures.
- `SKILL.md` legacy Mode 1/2 duplicated routing and long SVG-execution rules (rewritten, not kept in parallel).
- Top-level user-facing script exposure reduced via `bin/upm`; internal scripts remain but are no longer the primary user surface.
- `.preview/`-style ad-hoc QA dirs replaced by `.upm/qa/` + `preview/` for new projects (existing projects untouched).

Migration:

- Old projects keep `svg_output/`, `storyboard.json`, `design_spec.md` working via existing scripts (no forced migration).
- New projects use the PPTD layout; `upm review` can also audit an old project's rendered PNGs when present.
- `preserve-edit` continues to operate directly on PPTX (never PPTD round-trip).

## 6. Data flow (editable-deck)

```text
input (file/url/text)
  → sources/ normalization (copy default)
  → DeckIR (deterministic claims/roles/recipes; optional storyboard.json override)
  → design tokens (visual direction + page recipes + DESIGN.md defaults)
  → PPTD compile (theme, pages, elements, notes, evidence markers)
  → structure validation (schema + paths + overflow pre-check)   [fail gate]
  → page renders + contact sheet
  → rubric review (blank/bounds/overflow/repetition/contrast)
  → repair plan → re-render failed pages (max 2 rounds)
  → PPTX export (local default / kimi opt-in) + record backend
  → final quality report
```

## 7. Risks

| Risk | Mitigation |
|---|---|
| Kimi public editor changes | versioned selector manifest, healthcheck, adapter-scoped errors, local exporter default |
| Local PPTD→PPTX fidelity below browser writer | local exporter reuses proven SVG→DrawingML engine; charts documented as shapes |
| Route contract drift across 4 implementations | single fixture + parity test, regenerated policy |
| Repo size / token budget | compact core (~5k LOC), no duplicated parallel systems |
| Existing tests depend on old routes | fixture + tests updated in the same commit |

## 8. Phased plan

1. Audit + design (this document) ✅
2. PPTD core (model/schema/io/paths/fixtures/tests)
3. DeckIR → PPTD compiler
4. Kimi adapter (exporter/renderer/healthcheck/manifest/tests)

### Compatibility-risk declaration (K1)

As of 2026-08-07, the Kimi public-editor export delivery channel is non-functional in this environment and for the current upstream tool (see `docs/quality/upm-v7-rc-known-issues.md` K1 and its follow-up issue). The adapter remains opt-in and is not part of the formal delivery guarantee; `local` is the default backend. Re-validation triggers: upstream fix, upstream exporter works again, Kimi frontend/SDK version change, or an official stable export API.
5. Unified visual QA
6. Unified CLI + local exporter fallback
7. Contract/routing convergence, SKILL.md shortening, third-party notices, docs
8. Real regression samples + deletion of superseded routes + commits/PR
