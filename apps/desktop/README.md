# Ultimate PPT Master Desktop

Desktop product shell for Ultimate PPT Master: Tauri + React/TypeScript + local Python worker.

Public user docs:

- [Quickstart Desktop](../../docs/quickstart-desktop.md)
- [Choosing a Workflow](../../docs/choosing-a-workflow.md)
- [Model and Provider Setup](../../docs/model-provider-setup.md)
- [Troubleshooting](../../docs/troubleshooting.md)

The app keeps the first workflow intentionally simple:

1. Import source material.
2. Choose editable PPTX or Web Deck.
3. Generate a local project, preview results, inspect logs, and hand off to an Agent when deeper generation is needed.

## What the Desktop App Does

- Projects: reads real `desktop-manifest.json` files instead of static examples.
- Create: supports drag/drop, Markdown/text/URL/file paths, DOCX text extraction status, smart recommendations, and style presets.
- Workbench: shows generation progress, source extraction state, preview, outputs, logs, trust checks, source.md access, and Agent handoff prompt copy.
- Settings: checks Python, Node, Rust/Cargo, Cairo, provider keys, model setup, output directory, and Chinese / English UI language.

The desktop app does not upload user files and does not expose secret key values. Production-grade deck generation still uses the full repository workflow in `SKILL.md`.

## Real DOCX Input

Native desktop mode now extracts `.docx` sources into `sources/source.md` before generating PPTX/Web previews. Other binary office formats are copied into the project and clearly marked for Agent handoff until their full parsers are wired into the desktop worker.

Each `desktop-manifest.json` includes:

```json
{
  "sourceExtraction": {
    "status": "extracted",
    "detail": "已解析 DOCX 正文并生成可用于 PPTX/Web 的 source.md。",
    "generatedMarkdownPath": "projects/desktop/.../sources/source.md"
  }
}
```

## Fast Start from Repository Root

The easiest path is to stay at the repository root:

```bash
npm run setup
npm run desktop
```

Use `npm run doctor` when the app cannot launch or a worker/provider check fails. It checks Python, Node/npm, Rust/Cargo, Cairo, provider keys, and reserved model config without printing secret values.

## Run the Web Shell Directly

```bash
cd apps/desktop
npm install
npm run dev
```

## Build the Frontend

From the repository root:

```bash
npm run build:desktop
```

Or from this directory:

```bash
npm run build
```

## Run with Tauri

Rust is required for native Tauri commands and app packaging.

```bash
npm run app:desktop
```

Or from this directory:

```bash
npm run tauri:dev
```

## Build Native Packages

Build a stable macOS `.app` bundle:

```bash
npm run package:desktop
```

Or from this directory:

```bash
npm run tauri:build
```

Create a DMG release package when Finder automation is available:

```bash
npm run package:desktop:dmg
```

Or from this directory:

```bash
npm run tauri:build:dmg
```

The default build target is `.app` because DMG packaging depends on macOS Finder automation and can fail when the current process lacks desktop automation permission.

## Model and Provider Setup

Recommended path: run production generation through an Agent such as Codex, Claude Code, OpenClaw, or Hermes.

Optional provider capabilities are configured with environment variables or `.env`:

```bash
mkdir -p ~/.ppt-master
cp ../../.env.example ~/.ppt-master/.env
```

Then configure values such as:

```dotenv
IMAGE_BACKEND=openai
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-image-2
PEXELS_API_KEY=your-pexels-key
PIXABAY_API_KEY=your-pixabay-key
```

Direct API worker driving is reserved for a future adapter and should not be described as complete in this app yet.

For the full model/provider matrix, see [Model and Provider Setup](../../docs/model-provider-setup.md).

## Worker Smoke Test

```bash
python3 worker/desktop_worker.py inspect
```
