# 终极融合PPT大师 For Claude Code

This repository is a portable Agent Skill package. When Claude Code sees this file, it should use `SKILL.md` as the primary workflow for all PPT, PowerPoint, slide deck, and presentation-generation requests.

## Required Behavior

<!-- BEGIN GENERATED:workflow-policy -->
## Generated Workflow Policy

This section is generated from `contracts/`. Do not hand-edit; run `python3 scripts/generate_contracts.py`.

### Source of truth

- Primary workflow: `SKILL.md`
- Design contract: `DESIGN.md`
- Machine policy: `contracts/workflow-policy.yaml`, `contracts/route-policy.yaml`, `contracts/visual-defaults.yaml`, `contracts/quality-modes/`

### Best-Effect Brief Enhancer

Before choosing a route or generating files, rewrite the user's short instruction into `bestEffectBrief`. Record prompt quality, auto-expanded audience/scenario/message/page-count/style/source/asset assumptions, recommended route, and which decisions came from the user vs the Agent.

### Routing

- Auto-route by policy. Do **not** force the user to choose PPTX vs Web before generation when the request is classifiable.
- Ask at most 3 focused questions, and only when facts, sources, brand/IP, compliance, or route choice would materially change the deliverable.
- Formal / editable / government / finance / training / report / `.pptx` signals → `formal-editable-pptx` with quality mode `standard`.
- HTML / web PPT / magazine / editorial / e-ink / Swiss / horizontal swipe / keynote / showcase / demo-day / browser-first signals → `magazine-web-deck`.
- Extreme-thin topic-only prompts without formal/web signals use **Style A Editorial Fixed Rhythm** → `Mode 2: Magazine Web Deck`, style `Style A · 电子杂志 × 电子墨水`, 8 pages, cover surface `light-or-warm-paper`.

### Extreme Thin Prompt Fallback page rhythm

  1. light or warm-paper cover with one strong title, minimal subtitle, and one soft-edged visual/evidence panel
  2. light context page for problem, trend, or setting
  3. image/text or restrained signal spread for tension or opportunity
  4. light structure page with a three-part framework, path, or method
  5. large-statement section divider
  6. evidence / scene / case page
  7. point-of-view page with final judgment or question; use dark only when the user, reference, or chosen direction calls for it
  8. light closing page with action, takeaway, or ending line

### Visual defaults

- Default cover surface: `light-or-warm-paper` (light / warm paper / near-white).
- Dark covers are allowed only for: user-request, brand-system, explicit-art-direction, image-led-launch.
- Do not use a full-page black cover unless the user, brand, or explicit art direction requires it.
- Ink is primarily a text color, not the default full-page background.

### Source import

- Default import mode: `copy` (`--copy`).
- `--move` / archive-and-remove-original is an explicit advanced option, not the default.
- Repo-internal generated research artifacts may still move to avoid accidental commits.

### Evidence states

Allowed values: unmapped, candidate, grounded, conflicted, missing.
Draft slides created only because sources exist must start as `unmapped`, never `grounded`.
`grounded` requires claim-level source binding.

### Quality modes

Default mode: `standard`.
Available modes: quick, standard, audit.

| Mode | Use | Key gates |
|---|---|---|
| quick | draft, internal discussion, content validation | structure/file validity fail; visual evidence warning |
| standard | most formal reports, default production path | formal delivery fail; visual evidence recommended |
| audit | board materials, government, finance compliance, external release | missing preview PNG / design report / blank-page risk fail |

Semantic assertions:
- defaultCoverSurface=light
- extremeThinAutoRoutes=True
- extremeThinDefaultFormat=web-deck
- formalSignalDefaultFormat=editable-pptx
- mustAskBeforeGenerate=False
<!-- END GENERATED:workflow-policy -->

- Trigger on PPT / PowerPoint / deck / slides / presentation / 演示文稿 / 幻灯片 requests.
- Follow the generated workflow policy above and `SKILL.md` as the primary workflow.
- Auto-route when the request is classifiable; do not force a PPTX vs Web choice first.
- Ask at most three focused questions only when facts, sources, brand/IP, compliance, or route choice would materially change the deliverable.
- Keep source files, generated projects, and exported decks inside the user’s workspace unless the user specifies another location.

## Workflow Source

Read `SKILL.md` first. Load extra files only as needed:

- Editable PPTX mode: `references/`, `templates/`, `scripts/`
- Magazine web deck mode: `assets/magazine-web/`, `references/magazine-web/`, and `scripts/validate-swiss-deck.mjs` for Swiss Style decks
- Public docs: `docs/README.md`, `docs/guides/agent-setup.md`, `docs/guides/model-provider-setup.md`, and `docs/guides/troubleshooting.md`

## Installation

Recommended location:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.claude/skills/ultimate-ppt-master
```

Then install runtime dependencies:

```bash
cd ~/.claude/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

For optional profiles:

```bash
bash scripts/bootstrap.sh --profile core
bash scripts/doctor.sh --profile pptx
```

## Traceability

When a generation or setup issue appears, keep the chain inspectable:

- command or app flow used;
- `desktop-manifest.json`;
- `sourceExtraction.status` and `sourceExtraction.detail`;
- `sources/source.md`;
- `logs/desktop-worker.log`;
- generated files under `outputs/` or `previews/`.

Do not commit private source documents, raw business outputs, `.env`, or API keys.
