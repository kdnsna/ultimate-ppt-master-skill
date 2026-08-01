# Ultimate PPT Master v6.3.9 — GitHub release contract

> **GitHub release contract.** This release uses machine state `releaseStatus: github-released`. Source metadata alone is not publication evidence; the authority is the immutable [`v6.3.9` tag and GitHub Release page](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.9). A GitHub Release does not publish a marketplace listing, whose state remains `marketplaceStatus: independent-not-attested`.

[Read the primary Chinese release notes](../zh-CN/release/release-notes-v6.3.9.md)

Previous formal release: [v6.3.8](./release-notes-v6.3.8.md)

## Plain-Language Update Notes

- Aligns the product’s primary path to **preserve-edit**: desktop opens on Revise; dropping a `.pptx` revises in place; other sources go to generate-from-scratch.
- Desktop revise UX: built-in sample deck, multi-slide edit queue, natural-language plan parsing, style/table ops, human-readable fidelity report, and a change-memo file beside the output.
- Post-save trust preview: always writes a vector before/after card; CLI `--preview` can also attempt a real pixel diff when LibreOffice is available (`PRESERVE_REAL_PREVIEW=1` for desktop real PNG).
- Shared engine surface across CLI / MCP / desktop worker: `apply_edits`, inspect with table/chart summaries, multi-slide edits, fidelity gate.
- Web hero dual path: default “revise existing PPT”, secondary generate workspace; SEO/OG match preserve positioning; main bundle stays under the 80KB gzip budget.
- Adds copy-paste revise prompt cards and a half-automatic `pptlint_to_preserve_plan.py` draft path (human review required).
- Skill marketplace copy prioritizes preserve-edit with quality-checked generation as secondary.

## Release Contract

| Field | Contract |
|---|---|
| Version | `6.3.9` |
| Git tag | `v6.3.9` |
| Machine release status | `github-released` |
| Authoritative evidence | [`releases/tag/v6.3.9`](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.9) |
| Marketplace status | `independent-not-attested`; verify any marketplace record separately |

## Verification Contract

The exact commit targeted by `v6.3.9` must pass:

```bash
npm run check:contracts
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:web-bundle
npm run audit:featured-decks
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
python3 scripts/sync_desktop_worker.py --check
python3 -m unittest tests.test_preserve_edit_fidelity tests.test_nl_edit_plan tests.test_pptlint_to_preserve_plan tests.test_desktop_worker.PreserveEditWorkerTest
```

## Independent Rollback Boundary

Revert the v6.3.9 commit to remove this preserve-edit UX, dual-path Web, and preview/docs work without moving or rewriting the already published `v6.3.8` tag. If v6.3.9 needs correction after publication, publish a new patch version instead of rewriting the tag.

## Known Limits

- the main Web bundle remains close to its 80KB gzip ceiling;
- real pixel before/after is opt-in for desktop save speed;
- preserve-edit still does not add/remove slides, insert images, or rebuild table structure;
- from-scratch generation remains local-Agent driven, not hosted SaaS;
- GitHub Release does not update marketplace listings; Pages deploy is judged by Actions and the live SHA.
