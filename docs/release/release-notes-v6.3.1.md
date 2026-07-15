# Ultimate PPT Master v6.3.1 — Chinese-first artifact delivery loop

> **Unreleased draft.** This document describes the intended v6.3.1 boundary; it is not evidence that the version, Pages site, or proof artifacts have been published. Create the tag and GitHub Release only after the milestone commit is merged, CI passes, and public links are verified.

Milestone boundaries: [v6.2.0 generation loop](./release-notes-v6.2.0.md) · [v6.3.0 default quality and public proof](./release-notes-v6.3.0.md)

The planned v6.3.1 milestone consolidates Ultimate PPT Master into a Chinese-first, local-generation workflow that ends with real downloadable artifacts. A user will be able to start with one task, approve the storyboard and visual direction, hand the project to a local Agent, and download the resulting PPTX, Web Deck, PDF, or archive only after the Workspace discovers an actual file.

[Read the primary Chinese release notes](../zh-CN/release/release-notes-v6.3.1.md)

## Plain-Language Update Notes

- **Storyboard edits now survive production.** Slide order, stable `slideId`, title, conclusion, role, and selected structure flow into DeckIR instead of being replaced by a newly generated outline.
- **Four-to-24-slide tasks stay complete.** Structural drafts, handoff files, and production contracts share the same stable slide identities without the previous 12-slide truncation.
- **The local Agent loop reaches real files.** After the Workspace creates a handoff, it launches Codex when allowed or provides a copyable command, polls artifacts during generation, pauses while hidden, and resumes from `session.projectPath` after refresh.
- **Structural previews are labeled honestly.** Pending artifacts may be downloaded, but delivery requires a passing quality state and approval for every slide.
- **Best-Effect routing is inspectable.** `project-brief.json` records `bestEffectBrief`, `promptQuality`, `recommendedRoute`, `decisionReason`, and whether the route was automatic or user-selected. When a new-handoff request omits the field, the Bridge fills it with the deterministic router.
- **Chinese is the public default.** GitHub `README.md`, the Pages Workspace, the proof gallery, buttons, quality states, and social preview use Chinese-first copy. `README.en.md` remains the complete English mirror.
- **The public proof leads with finished work.** The first view now pairs a sanitized editable executive-review PPTX with the GPT-5.6 “Three Orbits” Web Deck, each organized as `input → planning → output → quality review`.

## Bridge interfaces and security

The Bridge adds two artifact-only interfaces for validated handoff projects:

```text
GET /projects/artifacts?projectPath=<handoff>
GET /projects/artifacts/file?projectPath=<handoff>&artifact=<relative-path>
```

- `projectPath` must stay inside the Bridge `outputDir` and contain a valid `manifest.json`.
- Scanning is limited to `exports/`, `ppt/`, and allow-listed quality reports. Attachments, source files, and arbitrary directory browsing remain unavailable.
- Traversal, external symlinks, forged manifests, and Agent launch outside `outputDir` are rejected.
- Bridge signs the complete manifest contract with a local HMAC; unsigned or tampered projects cannot list artifacts, download files, or launch an Agent.
- Downloads use attachment responses; the Bridge is still not a general-purpose file server.

## Compatibility and migration

- `deck-session-v6` and DeckIR 1.0 remain contract-compatible across newly created Bridge handoffs and Desktop. Older unsigned Bridge projects must be recreated through `/projects/create`; they are not accepted through a permissive legacy path.
- `README.zh-CN.md` remains a short compatibility entry; the canonical Chinese product page is now `README.md`.
- The Classic console is removed from primary navigation but remains available through `?classic=1` until v6.4.
- Existing-PPTX work continues on the separate preservation-first path.

## What is not included

This release does not add a cloud backend, accounts, a database, telemetry, hosted files, another model provider, or a broad canvas editor. Production generation remains local Agent/orchestrator-led, and a structural preview is not a final PPTX.

## Verification

```bash
npm run build:web
npm run build:desktop
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:featured-decks
npm run audit:quality
npm run audit:market
npm run test:bridge
npm run test:node
npm run test:worker
```
