# Ultimate PPT Master Desktop

Desktop product shell for Ultimate PPT Master: Tauri + React/TypeScript + local Python worker.

The app keeps the first workflow intentionally simple:

1. Import source material.
2. Choose editable PPTX or Web Deck.
3. Generate a local project, preview results, inspect logs, and hand off to an Agent when deeper generation is needed.

## What the Desktop App Does

- Projects: reads real `desktop-manifest.json` files instead of static examples.
- Create: supports drag/drop, Markdown/text/URL/file paths, smart recommendations, and style presets.
- Workbench: shows generation progress, preview, outputs, logs, trust checks, and Agent handoff.
- Settings: checks Python, Node, Rust/Cargo, Cairo, provider keys, model setup, output directory, and Chinese / English UI language.

The desktop app does not upload user files and does not expose secret key values. Production-grade deck generation still uses the full repository workflow in `SKILL.md`.

## Run the Web Shell

```bash
cd apps/desktop
npm install
npm run dev
```

## Build the Frontend

```bash
npm run build
```

## Run with Tauri

Rust is required for native Tauri commands and app packaging.

```bash
npm run tauri:dev
```

## Build Native Packages

Build a stable macOS `.app` bundle:

```bash
npm run tauri:build
```

Create a DMG release package when Finder automation is available:

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

## Worker Smoke Test

```bash
python3 worker/desktop_worker.py inspect
```
