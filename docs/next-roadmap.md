# Next Roadmap - Content and Template Presets

v2.3 made the first mile clearer: visible input, proven output, local Agent handoff.

The next product priority is output stability. Ultimate PPT Master should become richer in content patterns and template presets, so users do not start from a blank prompt every time and Agents have stronger defaults before they generate slides.

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

Seed catalog: [`templates/presets/preset-directions.json`](../templates/presets/preset-directions.json)

## Candidate v2.4 Packs

| Preset | Main output | Why it matters |
|---|---|---|
| Executive Business Review | Editable PPTX + optional Web Deck | Common quarterly and monthly reporting use case; needs stable KPI, diagnosis, and action pages. |
| Consulting Proposal | Editable PPTX | Gives the Skill a stronger default for problem framing, options, roadmap, and commercial recommendation. |
| Product Pitch | Web Deck + optional PPTX | Helps public demos and startup/product storytelling feel less generic. |
| Training Courseware | Editable PPTX | Turns internal training, workshops, and onboarding into repeatable lesson structures. |
| Research / Academic Defense | Editable PPTX | Uses existing academic templates and adds a stable research narrative. |
| Government / SOE Report | Editable PPTX | Uses existing government and state-owned enterprise templates for formal reporting. |
| Finance / Branch Solution | Editable PPTX | Builds repeatable banking and financial solution decks with stricter tone control. |
| Tech Trend Web Deck | Web Deck | Keeps the public demo route visually strong and shareable. |

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
| v2.4 | Turn the seed preset directions into usable content packs and expose them in the Web Experience. |
| v2.5 | Add a template gallery with screenshots, sample prompts, and "best for" labels. |
| v2.6 | Add benchmark runs that compare preset output quality across PPTX and Web Deck routes. |

## Product Rule

The preset system should reduce uncertainty, not hide the workflow. Users should still see what material they provided, which preset was selected, which route will run, and which checks the Agent must pass.
