# Skill Market Distribution

Use this checklist when preparing Ultimate PPT Master for a skill marketplace, agent directory, or curated skill list.

## Listing Positioning

- Name: Ultimate PPT Master / 终极融合PPT大师
- Category: presentation generation, editable PPTX, Web Deck, office productivity
- Promise: expand short requests into a best-effect brief first, then turn local source files or thin prompts into quality-checked editable PPTX or magazine-style Web Decks.
- Primary audience: Chinese office users, consultants, operators, trainers, and agent users who need editable deliverables.
- Not a black-box cloud generator: source files stay local unless the user explicitly chooses another path.

## Required Listing Assets

| Asset | Source |
|---|---|
| UI metadata | `agents/openai.yaml` |
| Structured listing contract | `agents/marketplace-listing.json` |
| Small icon | `assets/skill-market/ultimate-ppt-master-icon.svg` |
| Listing card | `assets/skill-market/ultimate-ppt-master-card.svg` |
| First-run path | `README.md#60-second-quickstart` |
| Proof cases | `README.md#real-proof-packs`, `apps/web/public/benchmark/index.html`, and `docs/quality/quality-workbench-v2.5.md` |
| v4 workflow | `docs/quality/hybrid-editable-visual-workflow-v4.0.md` |
| Install guide | `docs/guides/agent-setup.md` |

## Marketplace Copy

Short:

> 先自动扩写 best-effect brief，再生成 quality-checked PPTX and magazine-style Web Decks.

Long:

> Ultimate PPT Master helps an agent expand short requests into a best-effect brief before turning PDFs, Word docs, PPTX decks, spreadsheets, URLs, rough notes, or topic-only prompts into an inspectable presentation project. Extremely thin prompts use Style A Editorial Fixed Rhythm by default unless the user explicitly needs a formal editable PPTX. It keeps source files local and includes visual review, audit trails, and public proof packs.

Default prompt:

```text
Use $ultimate-ppt-master with any natural-language presentation request. It will expand the request into a best-effect brief, choose PPTX or Web Deck, and run the matching quality checks.
```

## Acceptance Gates

- `agents/openai.yaml` includes display name, short description, brand color, icons, and a `$ultimate-ppt-master` default prompt.
- `agents/marketplace-listing.json` mirrors the invocation, public links, proof cases, and acceptance gates for marketplace ingestion.
- README first screen shows the quickstart, proof links, route choices, dependencies, and known limits.
- Web Experience shows first-run path, Design Doctor scoring, and public proof packs.
- Public proof packs include source, generated output, screenshot/cover, and `quality-report.json`.
- Release checklist runs `npm run audit:docs`, `npm run audit:presets`, `npm run audit:quality`, `npm run audit:market`, `npm run test:node`, `npm run test:worker`, and `npm run build:web`.
- Marketplace readiness is machine-checked with `npm run audit:market` before public promotion.

## Distribution Notes

- Lead with the Web Experience for non-technical visitors.
- Lead with `$ultimate-ppt-master` for agent marketplaces where users already know how to invoke skills.
- Keep market copy honest: the skill orchestrates local production and quality review; it is not a hosted one-click PPT SaaS.
- Add every new stable preset to the public proof packs before promoting it in a marketplace.
