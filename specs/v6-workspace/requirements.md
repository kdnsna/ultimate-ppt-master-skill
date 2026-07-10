# Ultimate PPT Master v6 Workspace Requirements

## Problem

The v5.4.1 production pipeline is capable and auditable, but the primary Web flow exposes system concepts before user tasks. The v6 workspace must make source intake, outline confirmation, visual direction, generation, review, and delivery understandable without removing the existing local-first handoff contracts.

## Scope

- Make the v6 workspace the default Web entry and retain the v5.4.1 console as Classic mode for one release.
- Share one `DeckSession` phase model between Web and Desktop.
- Move Bridge/provider/Skill details into an environment and diagnostics surface.
- Preserve current handoff artifacts and Bridge endpoints while adding read-only progress events.
- Add stable `slideId` values, page-level review state, visual-direction previews, accessible navigation, and responsive behavior.

## Non-goals

- Building a free-form Canva-style canvas.
- Replacing PowerPoint as the final formal editing surface.
- Adding multi-user collaboration, deal-room analytics, or more model providers.
- Removing the current v5.4.1 generation pipeline or artifact schemas.

## User Stories and Acceptance Criteria

### R1. Task-first intake

As an office user, I want to describe the task and add sources without understanding Bridge, DeckIR, or model settings.

- When the v6 workspace opens, the system shall show one primary task input, source import, and output-purpose choice within the initial desktop viewport.
- While no real source exists, the system shall label the outline and preview as a draft and shall not report the task as fully ready.
- On mobile, the system shall use a compact horizontal phase indicator rather than four vertically stacked navigation cards.

### R2. Outline before generation

As a user, I want to confirm the narrative and evidence gaps before generation.

- When intake contains enough context, the system shall present a stable-slide-id outline with evidence state and at most three focused questions.
- When the user changes a slide title, takeaway, or role, the system shall update only that slide in the session model.

### R3. Previewable visual directions

As a user, I want to choose among meaningful visual directions rather than technical style names.

- When the user enters the design phase, the system shall show three previewable directions with cover/body/data examples and plain-language fit notes.
- When a direction is selected, the system shall record its id in the handoff brief without changing legacy visual-brief fields.

### R4. Review and delivery

As a user, I want to refine individual slides and clearly understand what is ready to deliver.

- When generation or handoff completes, the system shall show slide thumbnails, the selected preview, review findings, and three primary delivery actions.
- When no real source exists, the system shall not present the browser sample as a final deliverable.
- When the user switches phases, the system shall scroll to the workspace heading, focus it, and announce the phase change.

### R5. Environment and progress

As a user, I want local setup details to stay out of the task flow unless attention is required.

- While Bridge is healthy, the system shall show only a compact connected status in the workspace.
- When Bridge is unavailable, the system shall show one repair action and keep commands/provider details in diagnostics.
- When a Bridge handoff is running, the system shall expose read-only progress events and a recoverable failure event.

### R6. Compatibility and quality

- The system shall preserve `project-brief.json`, `storyboard.json`, `asset_plan.json`, `quality-report.json`, and current Bridge handoff behavior.
- The system shall keep Classic mode accessible for one release.
- The system shall meet keyboard focus, tab semantics, status announcement, reduced-motion, and responsive visual-regression checks.
- The existing audit and test suite shall continue to pass, with new behavioral assertions for v6.
