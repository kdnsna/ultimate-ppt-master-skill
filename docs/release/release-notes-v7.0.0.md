# Ultimate PPT Master v7.0.0 — GitHub release contract

> **GitHub release contract.** This version uses machine state `releaseStatus: unreleased`. Source metadata alone is not publication evidence; until the `v7.0.0` tag and GitHub Release page exist, the reviewable authority is [PR #15](https://github.com/kdnsna/ultimate-ppt-master-skill/pull/15). A GitHub Release does not publish a marketplace listing, whose state remains `marketplaceStatus: independent-not-attested`.

[Read the primary Chinese release notes](../zh-CN/release/release-notes-v7.0.0.md)

## Plain-Language Update Notes

- **Two engines, three user paths.** Preserve Edit Engine keeps byte-stable local edits to existing branded PPTX; Deck Generation Engine runs `DeckIR → PPTD → export → visual QA`. User paths are `preserve-edit`, `editable-deck`, and `web-deck` (Web Deck only on explicit request).
- **PPTD as the default visual compilation layer.** The Kimi PPTD v2 vocabulary is re-designed with a JSON Schema, a structured validator with precise error locations, project-relative path safety, and versioned UPM metadata.
- **Replaceable export backends.** `local` (PPTD → SVG → native DrawingML objects, offline, default) and `kimi` (public-editor browser export, versioned selector manifest, healthcheck, no auto-install). Every export records the backend actually used.
- **Unified visual QA.** Render all pages, build a contact sheet, run a deterministic rubric (blank/overflow/contrast/repetition/missing-evidence), repair failed pages with a two-round budget, and write a quality report. `quick` / `standard` (default) / `audit` modes.
- **Unified CLI.** `upm make / edit / open / review / doctor`; `upm open` is a 127.0.0.1 PPTD visual editor restricted to project-relative `.pptd`/`.page` writes.
- **Route convergence.** Six legacy routes were demoted or removed; Python, TypeScript, Bridge, Web, and 52 routing fixtures stay in parity.
- **Leaner skill.** `SKILL.md` shrinks from 889 to ~264 lines; legacy visual-QA scripts are marked deprecated for new projects.
- This is a local-first reliability and unification release. It does not add a cloud backend, account system, database, or model provider.

## Release Contract

| Field | Contract |
|---|---|
| Version | `7.0.0` |
| Git tag | `v7.0.0` (to be published after review) |
| Machine release status | `unreleased` |
| Authoritative evidence | [PR #15](https://github.com/kdnsna/ultimate-ppt-master-skill/pull/15) until the tag exists |
| Marketplace status | `independent-not-attested`; verify any marketplace record separately |

## Verification Contract

The exact commit targeted by v7.0.0 must pass:

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
bin/upm doctor --profile core
```

## Independent Rollback Boundary

Rollback to the previous formal release (`v6.3.9`) restores the legacy dual-mode skill and its routing. The v7 pipeline keeps old projects readable; no data migration is forced, and no long-term dual-write is introduced for new projects.
