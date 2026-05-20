# Quickstart Desktop

The desktop app is the recommended starting point for ordinary creators.

## One-command Setup

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

What happens:

- `.venv` is created if needed.
- Python dependencies are installed.
- desktop npm dependencies are installed.
- `~/.ppt-master/.env` is created from `.env.example` if missing.
- the native Tauri desktop app starts when Rust/Cargo are available;
- without Rust/Cargo, the browser UI shell starts for inspection only.

## Environment Check

```bash
npm run doctor
```

The doctor command checks:

- Python and `.venv`;
- Node and npm;
- Rust/Cargo for native Tauri mode;
- Cairo/pkg-config for stronger PPTX compatibility;
- optional provider keys;
- reserved direct LLM variables.

It should not print secret values.

## Native App

Rust is only needed for native Tauri mode and packaging:

```bash
npm run app:desktop
```

Build a macOS `.app`:

```bash
npm run package:desktop
```

Create a DMG when Finder automation is available:

```bash
npm run package:desktop:dmg
```

## First Useful Smoke Test

1. Start the app with `npm run desktop`.
2. Confirm the console says `Launching native Tauri desktop app`. If it says browser UI shell, install Rust/Cargo before testing generation.
3. Open Create.
4. Paste a short Markdown brief or provide a `.docx` path.
5. Choose `PPTX` or `Web Deck`.
6. Generate.
7. Open the Workbench and check:
   - `sourceExtraction.status`;
   - preview content;
   - output buttons;
   - Agent handoff prompt.

## Where Projects Live

Generated projects are local. Look for:

```text
projects/
  desktop-.../
    desktop-manifest.json
    sources/source.md
    logs/desktop-worker.log
    outputs/
    previews/
```

Do not commit private source files or raw generated business outputs.
