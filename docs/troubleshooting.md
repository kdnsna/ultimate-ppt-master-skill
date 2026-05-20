# Troubleshooting

Start every support request with:

```bash
npm run doctor
```

Then keep the relevant local evidence. Do not paste private documents or real API keys into GitHub issues.

## Quick Trace Table

| Symptom | Check | Fix |
|---|---|---|
| `npm run desktop` fails | `node --version`, `npm --version`, `npm run doctor` | Run `npm run setup`; install Node/npm if missing. |
| Python worker fails | `.venv/bin/python --version`, `pip show python-pptx` | Run `npm run setup` or `bash scripts/bootstrap.sh`. |
| DOCX imports as empty/placeholder | `desktop-manifest.json`, `sources/source.md` | Confirm the file exists and is readable; attach redacted `sourceExtraction` fields. |
| PDF/XLSX/PPTX not fully parsed | `sourceExtraction.status` | These may be marked `handoffRequired`; use Agent handoff for full workflow. |
| Browser mode cannot read a binary path | Workbench message | Use native Tauri mode or enter a path accessible to the local worker. |
| Provider key missing | Settings provider status, `npm run doctor` | Add keys to `~/.ppt-master/.env`; do not commit `.env`. |
| Native app cannot build | `cargo --version`, `rustc --version` | Install Rust/Cargo, then run `npm run app:desktop`. |
| DMG build fails | Tauri bundle output | Use `npm run package:desktop` for `.app`; DMG may require Finder automation permission. |
| Agent ignores this skill | Agent transcript | Tell it to read absolute `AGENTS.md` and set `SKILL_DIR` to the repo path. |
| Direct API vars do nothing | `.env`, README status | Expected in v2.0.0; direct worker adapter is reserved, not complete. |

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

