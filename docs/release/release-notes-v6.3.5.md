# Ultimate PPT Master v6.3.5 — reliable refinement and accessible runtime

> **Unreleased candidate.** This document defines the v6.3.5 candidate boundary. It may be present on `main` or Pages without implying a dedicated tag, GitHub Release, or marketplace publication.

[Read the primary Chinese candidate notes](../zh-CN/release/release-notes-v6.3.5.md)

## Plain-Language Update Notes

- Slide refinement stays keyed by stable `slideId`; unknown slides or variants are rejected before a revision is written.
- Artifact polling is single-flight, cancellable, paused while hidden, restored from the current project, and stopped after delivery.
- Radio groups support arrow keys and Home/End with roving tabindex.
- Diagnostic dialogs trap focus, close with Escape, and return focus to their trigger; reduced-motion users do not receive smooth-scrolling or nonessential animation.
- Recoverable Bridge, URL, and revision errors appear next to the affected control, while a manual Agent command remains visibly selectable when clipboard access fails.

## Candidate Boundary

This slice owns slide-level refinement validation/history, polling lifecycle, keyboard/dialog behavior, reduced motion, inline errors, and the visible manual Agent fallback. Classic remains frozen behind `?classic=1`; Desktop receives contract compatibility only.

## Required Evidence Before Publication

- unknown `slideId` and variant rejection plus revision-history tests;
- keyboard-only radio/dialog acceptance and reduced-motion checks;
- refresh, hidden-tab, stale-request, and delivered-state polling tests;
- one unambiguous primary action across offline, no-Agent, launchable, generating, complete, and quality-blocked states.

## Independent Rollback Boundary

Revert the refinement/polling/accessibility group without reverting v6.3.4 project/session identity or v6.3.3 evidence truthfulness. Keep persisted `slideId` values and existing revision files readable. The Classic compatibility entry must remain functional throughout rollback.

Before a versioned release, represent this group with a dedicated commit or documented revert map. The candidate marker itself neither creates nor attests to a standalone v6.3.5 tag.
