# Troubleshooting

Start every support request with:

```bash
npm run doctor
```

Then keep the relevant local evidence. Do not paste private documents or real API keys into GitHub issues.

## Quick Trace Table

| Symptom | Check | Fix |
|---|---|---|
| Web Experience is blank | browser console, `npm run build:web` | Reinstall `apps/web` dependencies and confirm the Pages asset base path. |
| Web demo link is 404 | `apps/web/public/examples/desktop-cultural-tourism-demo/web-demo.html` | Rebuild with `GITHUB_PAGES=true npm run build:web` for Pages. |
| Copy prompt fails | browser clipboard permission | Select the prompt preview manually and copy it. |
| Handoff zip does not download | browser download permission | Allow downloads for the site, or use copy/download `source.md` as fallback. |
| Web page shows Bridge offline | `npm run bridge`, `curl http://127.0.0.1:43188/health` | Start Bridge from the repo root; confirm no other process is using port `43188`. |
| Send to Bridge fails | Bridge terminal output, request size | Keep files below `UPM_BRIDGE_MAX_MB` or raise the limit locally. |
| Bridge parsed file as `attachedOnly` | `manifest.json`, `extracted-source.md` | Run `npm run setup`, then try the matching `scripts/source_to_md/*` converter manually. |
| `npm run desktop` fails | `node --version`, `npm --version`, `npm run doctor` | Run `npm run setup`; install Node/npm if missing. |
| Python worker fails | `.venv/bin/python --version`, `pip show python-pptx` | Run `npm run setup` or `bash scripts/bootstrap.sh`. |
| DOCX imports as empty/placeholder | `desktop-manifest.json`, `sources/source.md` | Confirm the file exists and is readable; attach redacted `sourceExtraction` fields. |
| PDF/XLSX/PPTX not fully parsed | Bridge `manifest.json` or `sourceExtraction.status` | These may be marked `attachedOnly` / `handoffRequired`; use Agent handoff for full workflow. |
| Browser mode cannot read a binary path | Workbench message | Use native Tauri mode or enter a path accessible to the local worker. |
| Provider key missing | Settings provider status, `npm run doctor` | Add keys to `~/.ppt-master/.env`; do not commit `.env`. |
| Native app cannot build | `cargo --version`, `rustc --version` | Install Rust/Cargo, then run `npm run app:desktop`. |
| DMG build fails | Tauri bundle output | Use `npm run package:desktop` for `.app`; DMG may require Finder automation permission. |
| Agent ignores this skill | Agent transcript | Tell it to read absolute `AGENTS.md` and set `SKILL_DIR` to the repo path. |
| Direct API vars do not generate a deck by themselves | `.env`, Bridge provider dashboard | Expected in v2.2.1; Bridge checks provider readiness, while production still runs through Agent/Skill. |

## Evidence to Attach to Issues

For setup/config issues:

```text
OS:
Node version:
npm version:
Python version:
Rust/Cargo version:
Command run:
Doctor output with secrets removed:
```

For generation issues:

```text
Input type: DOCX / PDF / XLSX / PPTX / URL / Markdown / text
Output mode: PPTX / Web Deck
Style preset:
Project path:
sourceExtraction.status:
sourceExtraction.detail:
generatedFiles:
Relevant log lines with private content removed:
```

Useful local files:

```text
projects/.../desktop-manifest.json
projects/.../sources/source.md
projects/.../logs/desktop-worker.log
projects/.../outputs/
projects/.../previews/
```

## Privacy Rules

- Do not commit raw private DOCX/PDF/PPTX/XLSX files.
- Do not commit raw generated decks that expose business context.
- Do not paste API keys in issues.
- For public examples, sanitize organization names, people names, exact budgets, approval paths, and internal responsibilities.
