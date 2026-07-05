# Web Experience

The Web Experience is the primary public entry point for Ultimate PPT Master. It is a static React/Vite four-step console deployed to GitHub Pages, and it now acts as the fusion front door for source intake, local project creation, PPTX production, and Web Deck production.

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## What It Does

- shows one state-driven primary action for the normal path: prepare, add sources, connect locally, deliver;
- keeps source type, scenario, output mode, visual style, language, AI helper, and model preference behind progressive settings;
- exposes reusable preset starter packs with pack paths, template candidates, and scenario-specific quality checks;
- groups help, examples, glossary, setup checks, provider status, and generated-file details behind drawers or collapsed sections;
- accepts pasted source notes, source URLs, and dropped `.md`, `.txt`, `.pdf`, `.docx`, `.pptx`, `.xlsx`, and related files;
- adds a Visual Brief Builder with diverse selectable tags for scenario, audience, purpose, content state, visual style, layout density, asset strategy, and output preference;
- adds a Swiss Deck / Asset Factory block for Style A editorial/e-ink, Style B Swiss International, map-page intent, cover derivatives, and generated-visual planning;
- keeps free-form areas for background context, special requirements, must-avoid rules, official/reference links, and related notes;
- pre-reads browser-safe text files and marks binary files for local Bridge parsing;
- generates a slide outline, brief-readiness check, and `expectationFit` risk signal for unclear or conflicting requirements;
- shows the Hugo He / ppt-master PPTX route and the op7418 / Guizang Web Deck route side by side;
- detects the local Agent Bridge, local Agent commands, and provider readiness when Bridge is running;
- provides one-click checks for the local connector, installed AI helpers, and configured providers;
- provides Bridge-backed one-click Skill install / update actions for Codex and a generic Agent folder, with terminal-command fallback when Bridge is offline;
- generates a browser-local `preview-web-deck.html` and live iframe preview;
- generates copy-ready Agent instructions, `source.md`, `extracted-source.md`, `manifest.json`, and `project-brief.json`;
- writes `briefMode`, `visualBrief`, `guidedBrief`, and `expectationFit` into `project-brief.json` so Codex knows whether to produce immediately, ask staged clarification questions, or proceed as a draft with assumptions;
- downloads a full `handoff-kit.zip` or creates a local project through the local connector;
- includes `source.md`, `extracted-source.md`, `attachments/`, `manifest.json`, `agent-prompt.md`, `project-brief.json`, `preview-web-deck.html`, `engine-plan.md`, `quality-checklist.md`, `asset-plan.md`, `asset_plan.json`, generated prompt files, `visual-element-kit.md`, `codex-task.md`, `AGENTS.md`, `quality-report.json`, and `README.md` in the handoff kit;
- writes a `formal-business` quality gate into the handoff so Codex gets acceptance criteria, artifact checks, and review commands;
- creates a ChatGPT-generation-first visual element plan for section dividers, metric badges, process nodes, connectors, icon accents, subtle patterns, and callout stickers;
- shows the exact `generate_visual_element_kit.py` command after Bridge creates a local handoff folder;
- explains the `Needs-Manual` path when no image backend or OpenAI key is configured;
- opens the sanitized Agentic Developer Stack 2026 Web Deck demo;
- keeps Skill installation visible as a second core path.

## What It Does Not Do

- no backend;
- no hosted model API;
- no account system;
- no hosted source-material upload or server storage;
- no browser-side API key storage;
- no analytics requirement for MVP.

Brief assembly is handled in the browser. If users run `npm run bridge`, source files are sent only to `127.0.0.1` for local parsing and project staging.

v4.1.0 keeps the v4.0 hybrid-editable visual governance contract, but simplifies the console. Offline means the primary action copies the local connection command. Online means the primary action creates a local project. After project creation, the primary action launches or copies the AI-helper command, while command details and file manifests stay behind collapsed sections.

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
| Open Web Experience | The studio, four-step rail, quick console, one primary action, and collapsed help/settings areas render. |
| Local connection offline | The primary action copies the startup command that finds or clones the local repo before running `npm run bridge`, and zip download remains available under more actions. |
| Local connection online | `GET /health` populates local AI helper and provider status. |
| Drop text source | The file appears as browser pre-read and is included in `extracted-source.md`. |
| Drop binary source | The file appears as pending local Bridge parsing and is included in `attachments/`. |
| Live Web Deck preview | The preview frame renders `preview-web-deck.html` without backend calls or script dependencies. |
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
| Mobile viewport | Four-step rail, primary action, settings drawer, and grouped preview controls wrap cleanly. |

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
