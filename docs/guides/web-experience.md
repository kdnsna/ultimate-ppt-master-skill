# Web Experience

The Web Experience is the primary public entry point for Ultimate PPT Master. It is a static React/Vite guided workspace deployed to GitHub Pages, and it now acts as the fusion front door for source intake, local Bridge handoff, PPTX production, and Web Deck production.

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## What It Does

- lets users choose source type, scenario, output mode, visual style, language, agent tool, and model preference;
- exposes reusable preset starter packs with pack paths, template candidates, and scenario-specific quality checks;
- explains Bridge, Agent, API key, and handoff in plain language before the first configuration step;
- splits the workspace into Start, Sources, Configuration, Handoff, and Preview pages so first-time users do not face every control at once;
- accepts pasted source notes, source URLs, and dropped `.md`, `.txt`, `.pdf`, `.docx`, `.pptx`, `.xlsx`, and related files;
- pre-reads browser-safe text files and marks binary files for local Bridge parsing;
- generates a slide outline and brief-readiness check;
- shows the Hugo He / ppt-master PPTX route and the op7418 / Guizang Web Deck route side by side;
- detects the local Agent Bridge, local Agent commands, and provider readiness when Bridge is running;
- provides one-click checks for Bridge, installed agents, and configured providers;
- provides Bridge-backed one-click Skill install / update actions for Codex and a generic Agent folder, with terminal-command fallback when Bridge is offline;
- generates a browser-local `preview-web-deck.html` and live iframe preview;
- generates copy-ready Agent instructions, `source.md`, `extracted-source.md`, `manifest.json`, and `project-brief.json`;
- downloads a full `handoff-kit.zip` or sends the task to the local Bridge;
- includes `source.md`, `extracted-source.md`, `attachments/`, `manifest.json`, `agent-prompt.md`, `project-brief.json`, `preview-web-deck.html`, `engine-plan.md`, `quality-checklist.md`, `asset-plan.md`, `visual-element-kit.md`, `codex-task.md`, `AGENTS.md`, `quality-report.json`, and `README.md` in the handoff kit;
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

v4.0.0 keeps the Handoff page executable and adds hybrid-editable visual governance to the production contract. Bridge offline means the user sees only the Bridge startup command and zip download. Bridge online means the primary action is sending the task to Bridge. After handoff creation, the page shows the local project path, the element-generation command, the Agent command, and the `images/image_prompts.md` fallback location.

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
| Open Web Experience | The studio, source intake, outline, readiness check, Bridge status, provider cards, preview tabs, and CTA buttons render. |
| Bridge offline state | The page shows a copyable Bridge startup command that finds or clones the local repo before running `npm run bridge`, and still allows zip download. |
| Bridge online state | `GET /health` populates local Agent and provider status. |
| Drop text source | The file appears as browser pre-read and is included in `extracted-source.md`. |
| Drop binary source | The file appears as pending local Bridge parsing and is included in `attachments/`. |
| Live Web Deck preview | The preview frame renders `preview-web-deck.html` without backend calls or script dependencies. |
| Copy Agent prompt | Clipboard receives the generated prompt with outline and kit context. |
| Copy `source.md` | Clipboard receives the generated source markdown. |
| Download `source.md` | Browser downloads a Markdown brief with current form values and outline. |
| Download `preview-web-deck.html` | Browser downloads a standalone HTML preview with the current brief and storyboard. |
| Download `handoff-kit.zip` | Browser downloads a zip containing source files, manifest, attachments, prompt, preview, engine plan, checklist, asset plan, visual element kit, Codex task, AGENTS guide, quality report, and README. |
| Send to Bridge | Bridge writes a local handoff folder and returns suggested Agent commands. |
| Handoff execution panel | After Bridge writes a folder, the page shows `python3 scripts/generate_visual_element_kit.py <projectPath>`, the Agent command, and the `Needs-Manual` prompt fallback. |
| Install Skill via Bridge | `POST /skill/install` links or updates an allowlisted local Skill target without accepting arbitrary paths. |
| Open Web Deck demo | `examples/agentic-developer-tools-2026/web-demo.html` opens from the static build. |
| Skill setup link | Opens the README Skill section or `docs/guides/agent-setup.md`. |
| Mobile viewport | CTA buttons wrap cleanly and the Skill route remains visible. |

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
