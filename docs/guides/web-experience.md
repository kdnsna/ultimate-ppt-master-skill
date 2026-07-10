# Web Experience

The Web Experience is the primary public entry point for Ultimate PPT Master. v6 is a static React/Vite task-first workspace deployed to GitHub Pages; the v5.4.1 console remains available through `?classic=1` for one release cycle.

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## What It Does

- accepts a task sentence, files, a URL, or an existing PPTX, then infers slide count and hides technical settings;
- asks at most three material questions and produces an editable storyboard with stable `slideId` values, evidence state, and three structural variants per slide;
- recommends three complete directions from six v6 visual packs instead of presenting abstract style tags;
- creates a deterministic structural preview first and mounts its iframe only in review;
- shows slide thumbnails, preview, quality findings, slide approval, and slide-level revision in one three-column workspace;
- detects the local Bridge, consumes read-only SSE progress, pauses polling while hidden, and writes backward-compatible handoff artifacts;
- reuses source extraction by SHA-256 content hash and records slide-level requests under `revision-requests/Pxx.json`;
- keeps Bridge commands, provider status, paths, and production files in the Environment & Diagnostics dialog;
- keeps PowerPoint as the formal editor while the Skill handles sources, brand rules, ChatGPT-assisted assets, the `formal-business` gate, editable-object checks, and quality review.

## What It Does Not Do

- no backend;
- no hosted model API;
- no account system;
- no hosted source-material upload or server storage;
- no browser-side API key storage;
- no analytics requirement for MVP.

Brief assembly is handled in the browser. If users run `npm run bridge`, source files are sent only to `127.0.0.1` for local parsing and project staging.

v6 keeps the v5.4.1 artifact contracts. Offline mode opens a focused repair dialog; online mode creates a local project and streams progress. The classic component-first console is available at `?classic=1` during the compatibility cycle.

## Local Development

```bash
npm --prefix apps/web install
npm run dev:web
```

Build:

```bash
npm run build:web
```

GitHub Pages build:

```bash
GITHUB_PAGES=true npm run build:web
```

The `GITHUB_PAGES=true` flag sets the asset base path to `/ultimate-ppt-master-skill/`.

## Smoke Checks

Use these checks before promoting a release:

| Check | Expected result |
|---|---|
| Open Web Experience | The v6 task-first workspace, compact phase rail, and one primary action render; no preview iframe is mounted during intake. |
| Local connection offline | Environment & Diagnostics shows one executable `npm run bridge` repair command. |
| Local connection online | `GET /health` populates local AI helper and provider status. |
| Drop text source | The file appears as browser pre-read and is included in `extracted-source.md`. |
| Drop binary source | The file appears as pending local Bridge parsing and is included in `attachments/`. |
| Storyboard | A request such as “10 slides” produces P01-P10, no more than three questions, and three variants per slide. |
| Live Web Deck preview | The preview frame mounts only in review and renders `preview-web-deck.html` without script dependencies. |
| Copy Agent prompt | Clipboard receives the generated prompt with outline and kit context. |
| Select visual tags | `project-brief.json` records `visualBrief.selectedTags`, selected tag labels, background text, special requirements, and reference links. |
| Select Swiss route | `project-brief.json` records `webDeck.style`, `webDeck.theme`, `webDeck.layoutPolicy`, page rhythm, and `assetPlanRequired`; the handoff includes `asset_plan.json`. |
| Thin or vague brief | `expectationFit` turns yellow/red and the Agent prompt tells Codex to run Guided Intake before final production. |
| Copy `source.md` | Clipboard receives the generated source markdown. |
| Download `source.md` | Browser downloads a Markdown brief with current form values and outline. |
| Download `preview-web-deck.html` | Browser downloads a standalone HTML preview with the current brief and storyboard. |
| Download `handoff-kit.zip` | Browser downloads a zip containing source files, manifest, attachments, prompt, preview, engine plan, checklist, asset plan markdown, `asset_plan.json`, prompt files, visual element kit, Codex task, AGENTS guide, quality report, and README. |
| Create local project | The local connector writes a project folder and returns suggested AI-helper commands. |
| Delivery details | After the local project is created, the collapsed detail panel shows `python3 scripts/generate_visual_element_kit.py <projectPath>`, the AI-helper command, and the `Needs-Manual` prompt fallback. |
| Install Skill via local connector | `POST /skill/install` links or updates an allowlisted local Skill target without accepting arbitrary paths. |
| Open Web Deck demo | `examples/agentic-developer-tools-2026/web-demo.html` opens from the static build. |
| Skill setup link | Opens the README Skill section or `docs/guides/agent-setup.md`. |
| Mobile viewport | At 390px the compact rail does not overflow and the first task input is visible in the initial viewport. |

## Scenario Coverage

The current MVP should keep these brief-generation cases working:

- Chinese executive report PPTX;
- English pitch Web Deck;
- consulting proposal Skill workflow;
- training courseware Skill workflow.

The page should also keep both engine paths visible. The web route is for onboarding, preview, and handoff; the Skill route remains the production path for final quality, source parsing, rendering, repair, and export.

## Implementation Notes

- App source: [apps/web](../../apps/web)
- Pages workflow: [.github/workflows/pages.yml](../../.github/workflows/pages.yml)
- Shared public demo source: [examples/agentic-developer-tools-2026](../../examples/agentic-developer-tools-2026)
