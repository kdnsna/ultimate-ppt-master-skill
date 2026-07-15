# Ultimate PPT Master v6.2.0 — generation loop boundary

> **Unreleased draft.** This file defines the intended, independently reversible v6.2.0 boundary. The tag and GitHub Release may be created only after the milestone commit is merged and CI passes.

The planned v6.2.0 milestone is limited to storyboard-contract fidelity and the local artifact loop:

- `DeckSession → DeckIR` preserves order, `slideId`, title, takeaway, role, and selected structure;
- four-to-24-slide tasks stay complete and missing evidence continues to block production;
- the Bridge exposes allow-listed artifact listing, artifact downloads served as attachments, and safe Agent launch;
- the Workspace polls every three seconds, pauses while hidden, and restores from `projectPath`;
- structural drafts are labeled, while delivery requires a passed artifact and approval on every slide.

Rollback boundary: the V6 Workspace, Bridge artifact API, and DeckIR conversion can be reverted as one unit without depending on v6.3 public proof or localization work.
