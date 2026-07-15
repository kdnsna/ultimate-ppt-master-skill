# Ultimate PPT Master v6.3.6 — GitHub release contract

> **GitHub release contract.** The machine status for this release line is `releaseStatus: github-released`. This source file alone is not publication evidence. The authoritative evidence is the immutable [`v6.3.6` tag and GitHub Release page](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.6); if that record is unavailable, treat publication as incomplete. A GitHub Release does not publish any marketplace listing, whose state remains independent and not attested here.

[Read the primary Chinese release notes](../zh-CN/release/release-notes-v6.3.6.md)

Milestone boundaries: [v6.3.2](./release-notes-v6.3.2.md) · [v6.3.3](./release-notes-v6.3.3.md) · [v6.3.4](./release-notes-v6.3.4.md) · [v6.3.5](./release-notes-v6.3.5.md)

## Plain-Language Update Notes

- v6.3.6 closes the Chinese-first task workspace, stable storyboard contract, local Agent lifecycle, real-artifact download, Bridge hardening, rounded public proof experience, and release gates into one GitHub release.
- Root, Web, Desktop, npm locks, Cargo, Tauri, marketplace metadata, README proof surfaces, and public quality reports declare version `6.3.6` with machine status `github-released`.
- README, the benchmark, Hero, and the dual-case image present v6.3.6 as the current formal version and link users to the versioned release record.
- v6.3.2–v6.3.5 remain documented as unreleased candidate slices. They are review and rollback boundaries inside the combined v6.3.6 release, not separate published versions.
- Marketplace distribution remains a separate operation. `marketplaceStatus: independent-not-attested` means this GitHub release neither performs nor proves marketplace publication.
- The editable office proof remains `warning`: WPS has a recorded 9/9 visual pass, while PowerPoint review, LibreOffice CJK differences, and font portability remain disclosed. Internal quality scores are not third-party benchmarks.

## Release Contract

| Field | Contract |
|---|---|
| Version | `6.3.6` |
| Git tag | `v6.3.6` |
| Machine release status | `github-released` |
| Authoritative evidence | [`releases/tag/v6.3.6`](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.6) |
| Marketplace status | `independent-not-attested`; verify any marketplace record separately |

Source metadata expresses the contract expected on the release commit; it does not create a tag or GitHub Release. The tag and GitHub Release page are the authority for whether publication actually happened, and their target commit must match the release commit that passed CI.

## Verification Contract

The exact commit targeted by `v6.3.6` must pass:

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:web-bundle
npm run audit:market
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
```

Also verify Rust formatting/lint/tests, desktop/mobile browser acceptance, the Bridge attack/concurrency matrix, GitHub Markdown rendering, and the post-deploy Pages smoke test. Manual PowerPoint review remains a separate human gate; the WPS 9/9 pass does not waive font-portability checks in recipient environments.

## Independent Rollback Boundary

Revert the v6.3.6 release-semantic commit to restore candidate wording and machine status without reverting the v6.3.2–v6.3.5 runtime/security behavior. Do not move or rewrite an already published `v6.3.6` tag; publish a corrective version when a released artifact needs replacement.

## Known Limits

- current light/rounded PPTX: page-by-page PowerPoint review remains pending; WPS 9/9 passed, with the generic missing-font/portability warning retained;
- LibreOffice CJK rendering differs on this machine;
- GitHub repository social-preview upload remains an external repository setting;
- Pages runtime must be checked against the deployed Actions SHA and real URLs;
- GitHub Release publication does not automatically publish or update a marketplace listing.
