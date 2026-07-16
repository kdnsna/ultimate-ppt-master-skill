# Ultimate PPT Master v6.3.7 — GitHub release contract

> **GitHub release contract.** This release uses machine state `releaseStatus: github-released`. Source metadata alone is not publication evidence; the authority is the immutable [`v6.3.7` tag and GitHub Release page](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.7). A GitHub Release does not publish a marketplace listing, whose state remains `marketplaceStatus: independent-not-attested`.

[Read the primary Chinese release notes](../zh-CN/release/release-notes-v6.3.7.md)

Previous formal release: [v6.3.6](./release-notes-v6.3.6.md)

## Plain-Language Update Notes

- Redesigns the task workspace, benchmark, showcase, and secondary cases around a consistent warm-paper, rounded, Chinese-first public experience.
- Expands the executive review proof from three to six slides and turns the consulting, product-pitch, and technology-trend examples into coherent lightweight Web Decks.
- Gives the AI examples a shared rounded, textured navigation layer while preserving distinct visual directions.
- Fixes the 1440px benchmark overflow caused by a decorative footer glow.
- Prevents orphaned single-character CJK title lines, enlarges pager touch targets, and reserves mobile safe space for fixed navigation.
- This is a public-surface and usability patch. It adds no cloud backend, account system, database, model provider, or large editor.

## Release Contract

| Field | Contract |
|---|---|
| Version | `6.3.7` |
| Git tag | `v6.3.7` |
| Machine release status | `github-released` |
| Authoritative evidence | [`releases/tag/v6.3.7`](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.7) |
| Marketplace status | `independent-not-attested`; verify any marketplace record separately |

## Verification Contract

The exact commit targeted by `v6.3.7` must pass:

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:web-bundle
npm run audit:featured-decks
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run test:web-browser
npm run build:web
npm run build:desktop
```

Browser regression covers the 1440×900 and 390×844 workspace and benchmark, keyboard/focus behavior, session recovery, local Agent states, and the real-artifact download contract.

## Independent Rollback Boundary

Revert the v6.3.7 commit to remove this public-surface, case-layout, and release-semantic patch without moving or rewriting the already published `v6.3.6` tag. If v6.3.7 needs correction after publication, publish a new patch version instead of rewriting the tag.

## Known Limits

- the main Web bundle remains close to its 80KB gzip ceiling and needs continued budget checks;
- the editable office PPTX retains the PowerPoint, LibreOffice, and font-portability disclosures from v6.3.6;
- GitHub repository social-preview upload remains an external repository setting;
- Pages deployment must be verified against Actions and the deployed SHA;
- GitHub Release publication does not automatically publish or update a marketplace listing.
