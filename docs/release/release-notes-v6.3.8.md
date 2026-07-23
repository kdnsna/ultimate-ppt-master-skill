# Ultimate PPT Master v6.3.8 — GitHub release contract

> **GitHub release contract.** This release uses machine state `releaseStatus: github-released`. Source metadata alone is not publication evidence; the authority is the immutable [`v6.3.8` tag and GitHub Release page](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.8). A GitHub Release does not publish a marketplace listing, whose state remains `marketplaceStatus: independent-not-attested`.

[Read the primary Chinese release notes](../zh-CN/release/release-notes-v6.3.8.md)

Previous formal release: [v6.3.7](./release-notes-v6.3.7.md)

## Plain-Language Update Notes

- Turns the multi-entry natural-language policy into one machine-readable contract under `contracts/`, then regenerates `AGENTS.md`, `CLAUDE.md`, `PROMPT.md`, and the shared policy region in `SKILL.md`.
- Stops the old dark-cover default rhythm and forced PPTX/Web choice drift: auto-route when classifiable, light/warm-paper cover by default, formal signals to editable PPTX.
- Makes source import default to `--copy` so desktop/download/shared originals are no longer moved away by accident.
- Makes draft evidence honest: source presence starts as `unmapped`, not `grounded`; claim binding is required before grounding.
- Adds quality-mode contracts for `quick` / `standard` / `audit`, and makes audit mode fail when preview PNGs or the design report are missing.
- Profiles install/doctor as `core`, `pptx`, `web`, `visual-review`, `desktop`, and `all`, and aligns Node messaging to `^20.19.0 || >=22.12.0`.
- Lets `visual_review.py` auto-start a temporary preview server, then shut it down; removes stale `skills/ppt-master/...` paths.
- Adds `scripts/sync_desktop_worker.py` so the desktop worker source and Tauri resource copy stay in sync.
- This is a consolidation and reliability release. It does not add a cloud backend, account system, database, model provider, or large new editor surface.

## Release Contract

| Field | Contract |
|---|---|
| Version | `6.3.8` |
| Git tag | `v6.3.8` |
| Machine release status | `github-released` |
| Authoritative evidence | [`releases/tag/v6.3.8`](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.8) |
| Marketplace status | `independent-not-attested`; verify any marketplace record separately |

## Verification Contract

The exact commit targeted by `v6.3.8` must pass:

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
npm run test:web-browser
npm run build:web
npm run build:desktop
```

Focused consolidation checks:

```bash
python3 -m unittest tests.test_contracts_generation tests.test_source_import_default tests.test_evidence_draft_states tests.test_design_completion_audit tests.test_visual_review_contract
node --test tests/best-effect-routing-parity.test.mjs
bash scripts/doctor.sh --profile core
python3 scripts/sync_desktop_worker.py --check
```

Browser regression still covers the 1440×900 and 390×844 workspace and benchmark, keyboard/focus behavior, session recovery, local Agent states, and the real-artifact download contract.

## Independent Rollback Boundary

Revert the v6.3.8 commit to remove this consolidation, policy-generation, install/import, evidence-state, and visual-review reliability patch without moving or rewriting the already published `v6.3.7` tag. If v6.3.8 needs correction after publication, publish a new patch version instead of rewriting the tag.

## Known Limits

- the main Web bundle remains close to its 80KB gzip ceiling and needs continued budget checks;
- the editable office PPTX retains the PowerPoint, LibreOffice, and font-portability disclosures from earlier v6.3 releases;
- native PowerPoint recipe composition, `deck-ir-v1`, and the single `upm make` pipeline remain follow-on work after this consolidation release;
- GitHub repository social-preview upload remains an external repository setting;
- Pages deployment must be verified against Actions and the deployed SHA;
- GitHub Release publication does not automatically publish or update a marketplace listing.
