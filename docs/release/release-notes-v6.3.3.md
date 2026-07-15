# Ultimate PPT Master v6.3.3 — truthful sources and evidence

> **Unreleased candidate.** This source slice documents a review boundary, not a published version. Source or Pages visibility does not attest to a dedicated v6.3.3 tag, GitHub Release, or marketplace publication.

[Read the primary Chinese candidate notes](../zh-CN/release/release-notes-v6.3.3.md)

## Plain-Language Update Notes

- Task instructions guide planning but no longer count as factual evidence.
- A URL remains pending until the Bridge converts it and records provenance; a failed or unresolved URL cannot make the deck production-ready.
- Browser sources receive collision-resistant identities, and file count, per-file size, and total-size limits fail with recoverable inline feedback.
- Same-name attachments receive unique disk names and decoded payload size is checked instead of trusting the browser declaration.
- After refresh, URL metadata can recover; local file metadata is marked for reselection and stops contributing to grounded status.

## Candidate Boundary

This slice owns the Web source-state serialization, Bridge ingestion/provenance rules, attachment naming and size validation, and production-readiness evidence separation. It builds on v6.3.2 security and does not change the DeckIR schema version.

## Required Evidence Before Publication

- real Web payload-to-Bridge integration tests;
- no-source and unresolved-URL tasks remain `readyForProduction=false`;
- two same-name files remain independently removable and independently written;
- refresh recovery never reclassifies unavailable local bytes as verified evidence.

## Independent Rollback Boundary

Revert the source-state model, evidence mapping, URL-ingestion handoff, and attachment collision/limit block together while retaining the v6.3.2 request/path/HMAC guards. Existing on-disk attachments must remain untouched; rollback may change new-ingestion behavior only.

Preserve this boundary in a dedicated commit or documented revert map before a versioned release. This note defines the rollback point but does not assert the existence or absence of a tag.
