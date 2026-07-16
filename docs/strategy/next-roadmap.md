# Next Roadmap - Content and Template Presets

> **Archived historical roadmap:** this document records the v2.5-v5.5 planning stage and is not the current v6.3.7 plan. See the [v6.3.7 release notes](../release/release-notes-v6.3.7.md) and the [current documentation index](../README.md).

v2.5 makes the first mile clearer and more checkable: visible input, preset proof, local Agent handoff, and Design Doctor review.

The next product priority is output stability. Ultimate PPT Master should become richer in content patterns and template presets, so users do not start from a blank prompt every time and Agents have stronger defaults before they generate slides.

## Current v5 Roadmap

v5.4 merges the planned Swiss Deck and Asset Factory work into one release: Style A remains the editorial/e-ink default for thin prompts, Style B becomes the Swiss International route for data and information design, and `asset_plan.json` becomes the parent contract for image generation.

v5.5+ should not add more image-backend breadth first. The next research track is HTML Deck to editable PPTX research: preserve the Web Deck's HTML/CSS layout intent, then investigate which parts can map back to editable PowerPoint text, shapes, tables, charts, and image slots without turning the deck into full-slide screenshots.

Keep v5.5+ research gated by the same product rule: formal office output remains editable PPTX first, Web Deck remains HTML/CSS first, and generated images support the deck instead of replacing editable content.

## Direction

Build a preset system that combines:

- a scenario-specific `source.md` skeleton;
- a narrative structure;
- a recommended slide roster;
- layout / brand / chart candidates from `templates/`;
- output route guidance for PPTX, Web Deck, or both;
- a quality checklist;
- at least one visible sample input and output.

This keeps the product close to Hugo-style reusable production patterns while preserving the Guizang-style Web Deck route for high-impact HTML decks.

## Preset Contract

Every stable preset should include:

| Field | Purpose |
|---|---|
| Scenario | What real user job this preset solves. |
| Audience | Who will read or watch the deck. |
| Source requirements | What the user should provide before generation. |
| Narrative skeleton | The default storyline the Agent should follow. |
| Slide roster | Recommended page types and order. |
| Template candidates | Layout, brand, chart, and Web Deck style candidates. |
| Quality checks | What must be verified before delivery. |
| Sample proof | `source.md`, generated output, screenshot, and notes. |

Seed catalog: [`templates/presets/preset-directions.json`](../../../templates/presets/preset-directions.json)

## v2.5 Stable Packs

| Preset | Main output | Why it matters |
|---|---|---|
| Executive Business Review | Editable PPTX + optional Web Deck | Common quarterly and monthly reporting use case; needs stable KPI, diagnosis, and action pages. |
| Consulting Proposal | Editable PPTX | Gives the Skill a stronger default for problem framing, options, roadmap, and commercial recommendation. |
| Product Pitch | Web Deck + optional PPTX | Helps public demos and startup/product storytelling feel less generic. |
| Tech Trend Web Deck | Web Deck | Keeps the public demo route visually strong, source-cited, and shareable. |

These four now have stable-pack folders under [`templates/presets`](../../templates/presets), visible starter proofs under `examples/*-starter/`, and `quality-report.json` files tracked in the public proof matrix. See [Quality Workbench v2.5](../quality/quality-workbench-v2.5.md).

## Candidate Later Packs

| Preset | Main output | Why it matters |
|---|---|---|
| Training Courseware | Editable PPTX | Turns internal training, workshops, and onboarding into repeatable lesson structures. |
| Research / Academic Defense | Editable PPTX | Uses existing academic templates and adds a stable research narrative. |
| Government / SOE Report | Editable PPTX | Uses existing government and state-owned enterprise templates for formal reporting. |
| Finance / Branch Solution | Editable PPTX | Builds repeatable banking and financial solution decks with stricter tone control. |

## Release Criteria

Do not call a preset "stable" until it has:

- one public or sanitized `source.md`;
- one generated output that can be opened locally;
- one screenshot in `assets/readme/` or `examples/`;
- explicit layout / brand / chart recommendations;
- a checklist that catches narrative, data, readability, export, and mobile-preview issues;
- a note saying whether it is safe for public demo use or only for local/private use.

## Backlog

| Version | Focus |
|---|---|
| v2.4 | Turn the first seed preset directions into usable starter packs, expose them in the Web Experience, and audit pack contracts in CI. |
| v2.5 | Promote current packs to stable proof contracts, add Design Doctor, and write quality profiles into handoff manifests. |
| v2.6 | Add deeper benchmark runs that compare preset output quality across PPTX and Web Deck routes. |

## Product Rule

The preset system should reduce uncertainty, not hide the workflow. Users should still see what material they provided, which preset was selected, which route will run, and which checks the Agent must pass.
