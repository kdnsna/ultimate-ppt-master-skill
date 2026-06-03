# Skill Market Distribution

Use this checklist when preparing Ultimate PPT Master for a skill marketplace, agent directory, or curated skill list.

## Listing Positioning

- Name: Ultimate PPT Master / 终极融合PPT大师
- Category: presentation generation, editable PPTX, Web Deck, office productivity
- Promise: turn source files into a local handoff project, then produce quality-checked PPTX or magazine-style Web Decks.
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
| Proof cases | `README.md#proofs`, `apps/web/public/benchmark/index.html`, and `docs/quality/quality-workbench-v2.5.md` |
| v4 workflow | `docs/quality/hybrid-editable-visual-workflow-v4.0.md` |
| Install guide | `docs/guides/agent-setup.md` |

## Marketplace Copy

Short:

> Generate quality-checked PPTX and magazine-style Web Decks from local source files.

Long:

> Ultimate PPT Master helps an agent turn PDFs, Word docs, PPTX decks, spreadsheets, URLs, and rough notes into an inspectable presentation project. It supports editable PowerPoint and magazine-style Web Deck output, keeps source files local, and includes Design Doctor review commands plus public proof packs.

Default prompt:

```text
Use $ultimate-ppt-master to turn my source material into a quality-checked PPTX or Web Deck with a visual review report.
```

## Acceptance Gates

- `agents/openai.yaml` includes display name, short description, brand color, icons, and a `$ultimate-ppt-master` default prompt.
- `agents/marketplace-listing.json` mirrors the invocation, public links, proof cases, and acceptance gates for marketplace ingestion.
- README first screen shows the quickstart, v4 hybrid-editable workflow, proof links, and skill-market link.
- Web Experience shows first-run path, Design Doctor scoring, and benchmark case wall.
- Public proof packs include source, generated output, screenshot/cover, and `quality-report.json`.
- Release checklist runs `npm run audit:docs`, `npm run audit:presets`, `npm run audit:quality`, `npm run audit:market`, `npm run test:node`, `npm run test:worker`, and `npm run build:web`.
- Marketplace readiness is machine-checked with `npm run audit:market` before public promotion.

## Distribution Notes

- Lead with the Web Experience for non-technical visitors.
- Lead with `$ultimate-ppt-master` for agent marketplaces where users already know how to invoke skills.
- Keep market copy honest: the skill orchestrates local production and quality review; it is not a hosted one-click PPT SaaS.
- Add every new stable preset to the public benchmark wall before promoting it in a marketplace.
