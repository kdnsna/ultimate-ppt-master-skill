# Ultimate PPT Master v6.3.6 — verification and release candidate alignment

> **Unreleased candidate.** v6.3.6 is the version declared by source metadata. This status may appear on `main` or Pages, but it does not mean a tag, GitHub Release, or marketplace publication exists, and it makes no claim about the currently deployed Pages revision.

[Read the primary Chinese candidate notes](../zh-CN/release/release-notes-v6.3.6.md)

Milestone boundaries: [v6.3.2](./release-notes-v6.3.2.md) · [v6.3.3](./release-notes-v6.3.3.md) · [v6.3.4](./release-notes-v6.3.4.md) · [v6.3.5](./release-notes-v6.3.5.md)

## Plain-Language Update Notes

- Root, Web, Desktop, npm locks, Cargo, Tauri, marketplace metadata, the v6 Workspace marker, README proof surfaces, and candidate reports declare one unreleased candidate version.
- README and documentation use “unreleased candidate” and explicitly separate source/Pages visibility from tag, GitHub Release, and marketplace publication state.
- Every v6.3.2–v6.3.6 slice has Chinese-first notes, an English mirror, required evidence, and an explicit rollback boundary.
- Version-consistency tests cover package metadata, locks, Cargo/Tauri, marketplace status, app/public markers, proof reports, documentation indexes, and the release-note contract.
- The editable office proof remains `warning`: WPS has a recorded 9/9 visual pass, while PowerPoint review, LibreOffice CJK differences, and font portability still require explicit treatment. Internal quality scores remain explicitly non-third-party.

## Candidate Boundary

This slice owns version alignment, documentation truthfulness, release-note/index completeness, candidate metadata, browser/build/audit evidence, and the final pre-publication checklist. The metadata does not itself create or attest to tags, GitHub Releases, marketplace publication, or Pages deployment.

## Verification Contract

Before any public release, all of the following must be evidenced on the exact commit intended for the tag:

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

Also run Rust formatting/lint/tests, desktop/mobile browser acceptance, the Bridge attack/concurrency matrix, GitHub Markdown rendering checks, and the post-deploy Pages smoke test. Manual PowerPoint review remains a separate human gate; the existing WPS 9/9 pass does not waive font-portability checks on the recipient environment.

## Independent Rollback Boundary

Revert only version metadata, candidate wording, release notes/indexes, and version-consistency gates to the previously reviewed candidate. Do not revert the v6.3.2–v6.3.5 runtime/security behavior merely to change a version label, and do not rewrite historical published tags.

Before a versioned release, preserve the slices as reviewable commits or document an intentionally squashed commit with a per-slice revert map, then run CI on the exact intended SHA. Only a separately authorized publication step may create a tag, GitHub Release, or marketplace record. Source presence on `main` or Pages does not upgrade this candidate status.

## Known Pending Checks

- current light/rounded PPTX: page-by-page PowerPoint review; WPS 9/9 visual review has passed, with the generic missing-font/portability warning retained;
- LibreOffice CJK rendering differences on this machine;
- GitHub repository social-preview upload, which remains an external repository setting and is not attested by this source candidate;
- exact-SHA public Pages links and downloads, which must be checked after each successful trusted-`main` deployment rather than inferred from this note.
