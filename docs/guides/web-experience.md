# Web Experience

The Web Experience is the v4.4 Codex-first launcher for Ultimate PPT Master. It is a static React/Vite page deployed to GitHub Pages, but its job is deliberately small: gather source material and one goal, write a local handoff project through Bridge, and copy the Codex command.

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## What It Does

- accepts dropped `.md`, `.txt`, `.pdf`, `.docx`, `.pptx`, `.xlsx`, and related files;
- accepts pasted source notes and a single goal for Codex;
- pre-reads browser-safe text files and marks binary files for local Bridge parsing;
- auto-selects editable PPTX for formal business material unless the brief asks for Web Deck or both outputs;
- keeps page count, audience, language, and output override behind one advanced section;
- detects the local Agent Bridge when it is running;
- copies the safe Bridge startup command when Bridge is offline;
- creates a local project through `POST /handoff` when Bridge is online;
- immediately copies the suggested Codex command after the local project is created;
- can call `/agent/launch` for Codex when the Bridge was started with launch permission;
- keeps `storyboard.json`, `source-map.json`, `planning-report.json`, `review-findings.json`, `repair-plan.json`, `revision-brief.md`, `quality-report.json`, Benchmark Wall, and other proof details in the debug drawer.

## Handoff Contents

The local project still receives the full production contract:

- `source.md`
- `extracted-source.md`
- `attachments/`
- `manifest.json`
- `agent-prompt.md`
- `project-brief.json`
- `preview-web-deck.html`
- `engine-plan.md`
- `quality-checklist.md`
- `asset-plan.md`
- `visual-element-kit.md`
- `codex-task.md`
- `AGENTS.md`
- `storyboard.json`
- `source-map.json`
- `planning-report.json`
- `review-findings.json`
- `repair-plan.json`
- `revision-brief.md`
- `quality-report.json`

## What It Does Not Do

- no hosted model API;
- no account system;
- no hosted source-material upload or server storage;
- no browser-side API key storage;
- no full presentation production inside the web page;
- no complex provider setup on the main screen.

Brief assembly is handled in the browser. If users run `npm run bridge`, source files are sent only to `127.0.0.1` for local parsing and project staging.

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

| Check | Expected result |
|---|---|
| Open Web Experience | One Codex-first screen renders with source dropzone, pasted notes, one goal, one primary action, and status panel. |
| Local connection offline | The primary action copies the startup command that finds the local repo before running `npm run bridge`. |
| Local connection online | `GET /health` marks Bridge connected and the primary action creates a local project. |
| Drop text source | The file appears as browser pre-read and is included in the handoff payload. |
| Drop binary source | The file appears as Bridge-parsed attachment and is included in `attachments/`. |
| Create local project | The local connector writes a project folder and returns the suggested Codex command. |
| Completion state | The page shows project path, Codex command, and the copied-command message. |
| Debug drawer | Advanced proof artifacts remain visible without blocking the primary flow. |
| Mobile viewport | Input, action, result, and debug drawer wrap without overlap. |

## Scenario Coverage

The current launcher should keep these source-to-handoff cases working:

- Chinese executive report to editable PPTX;
- consulting proposal to editable PPTX;
- training courseware to editable PPTX;
- keynote or demo brief to Web Deck;
- explicit dual-output brief to PPTX plus Web Deck.

The web route is now only the launcher. The Skill and Codex route remains the production path for final quality, source parsing, rendering, repair, and export.

## Implementation Notes

- App source: [apps/web](../../apps/web)
- Bridge source: [apps/bridge/server.mjs](../../apps/bridge/server.mjs)
- Pages workflow: [.github/workflows/pages.yml](../../.github/workflows/pages.yml)
