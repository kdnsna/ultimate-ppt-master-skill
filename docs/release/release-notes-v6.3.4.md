# Ultimate PPT Master v6.3.4 — session ownership and truthful delivery

> **Unreleased candidate.** This is a documented rollback slice inside the combined v6.3 hardening work. Its presence on `main` or Pages does not attest to a dedicated v6.3.4 tag, GitHub Release, or marketplace publication.

[Read the primary Chinese candidate notes](../zh-CN/release/release-notes-v6.3.4.md)

## Plain-Language Update Notes

- Every handoff owns a session identifier; SSE subscribers and the Workspace accept progress only for that session.
- Concurrent same-title projects use distinct directories instead of sharing a timestamp-derived path.
- Artifact discovery stays inside validated handoffs and scans only approved output/report locations.
- A report is supporting evidence, never the final deliverable. Delivery requires a real PPTX, Web Deck, PDF, or archive with `passed` verification plus approval for every slide.
- Manifest HMAC validation is shared by artifact listing/download, Agent launch, and slide revision so one endpoint cannot trust a project another endpoint rejects.

## Candidate Boundary

This slice owns session-scoped progress, unique project identity, validated artifact discovery, and the final-artifact delivery predicate. It leaves source truthfulness to v6.3.3 and user-facing refinement behavior to v6.3.5.

## Required Evidence Before Publication

- parallel and cross-session SSE tests, including two tabs;
- high-concurrency same-title project creation with no overwritten files;
- report-only, zero-byte, partial, and non-allow-listed artifacts never satisfy delivery;
- Agent launch and downloads reject projects that fail the shared identity boundary.

## Independent Rollback Boundary

Revert session filtering, unique-directory creation, artifact discovery metadata, and the final-delivery predicate as one unit. Preserve v6.3.3 source identities/provenance and v6.3.2 project authentication. Never delete already-created project folders during rollback.

Before a versioned release, preserve this unit in a dedicated commit or documented revert map and review its persisted-field compatibility. This source note is a logical boundary, not an independently addressable release artifact.
