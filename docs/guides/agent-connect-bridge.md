# Agent Connect Bridge

Agent Connect Bridge is the v3.0 local companion for the static Web Experience. It lets the GitHub Pages app talk to a local service on `127.0.0.1`, stage real source files, run local source converters, inspect provider readiness, and hand a formal-business project folder to Codex or another Agent.

## Quick Start

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run bridge
```

Open the Web Experience:

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

Drop source files into the page, fill the brief, then click **Send to local Bridge**.

The Configuration page can also install or update the Skill for local helpers. With Bridge running, **Install to Codex** links this checkout into `~/.codex/skills/ultimate-ppt-master`; **Install to generic Agent** links it into `~/agent-skills/ultimate-ppt-master`. If Bridge is offline, the page copies a terminal command instead.

## What It Creates

Bridge writes a local handoff project under:

```text
~/UltimatePPTMaster/handoffs/<project-title>-<timestamp>/
```

The folder includes:

- `source.md` - structured brief from the web page.
- `extracted-source.md` - browser pre-read text plus Bridge conversion output.
- `attachments/` - original uploaded files.
- `manifest.json` - parse status, project metadata, suggested Agent commands.
- `agent-prompt.md` - the production prompt for Codex / Claude Code / Hermes / OpenClaw.
- `project-brief.json` - structured choices from the Web Experience.
- `preview-web-deck.html` - browser-local rough preview.
- `engine-plan.md` - PPTX / Web Deck / Fusion route split.
- `quality-checklist.md` - checks before delivery.
- `asset-plan.md` - public references, ChatGPT generated assets, source/license notes, and insertion targets.
- `visual-element-kit.md` - ChatGPT-generation-first micro-asset checklist.
- `codex-task.md` - Codex-specific production sequence.
- `AGENTS.md` - local Codex rules for privacy, assets, and quality gates.
- `quality-report.json` - pending Design Doctor / formal-business review status.

Codex should read `AGENTS.md`, `codex-task.md`, `visual-element-kit.md`, `asset-plan.md`, `quality-checklist.md`, `manifest.json`, and `project-brief.json` first. The expected next local command is:

```bash
cd <repoRoot> && python3 scripts/generate_visual_element_kit.py <projectPath>
```

If no image backend or OpenAI key is configured, the script writes `Needs-Manual` prompts to `images/image_prompts.md`; paste them into ChatGPT and save outputs to the listed paths.

## Source Parsing

Bridge calls the existing local converters:

| Source | Converter |
|---|---|
| PDF | `scripts/source_to_md/pdf_to_md.py` |
| DOCX / Word | `scripts/source_to_md/doc_to_md.py` |
| PPTX / PPTM | `scripts/source_to_md/ppt_to_md.py` |
| XLSX / XLSM | `scripts/source_to_md/excel_to_md.py` |
| URL | `scripts/source_to_md/web_to_md.py` |

If a converter is missing, dependency installation fails, or the file type is unsupported, Bridge keeps the original file in `attachments/` and marks it as `attachedOnly` in `manifest.json`.

## Provider Dashboard

The web page never stores API keys. Bridge checks these local sources:

1. current process environment variables;
2. repository `.env`;
3. `~/.ppt-master/.env`.

It returns provider status only: configured or missing, model name, base URL, and key source label. It never returns secret values.

Supported status checks:

- OpenAI / OpenAI-compatible: `OPENAI_API_KEY` or `LLM_API_KEY`
- Gemini: `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- Qwen / DashScope: `QWEN_API_KEY` or `DASHSCOPE_API_KEY`
- DeepSeek: `DEEPSEEK_API_KEY`
- Custom bridge: `LLM_BASE_URL` + `LLM_API_KEY`

## Endpoints

Bridge listens on `http://127.0.0.1:43188`.

| Endpoint | Purpose |
|---|---|
| `GET /health` | Bridge version, output directory, local Agent detection, provider status. |
| `GET /providers` | Provider status without secrets. |
| `POST /providers/test` | Test a configured provider through Bridge. |
| `POST /handoff` | Create a local handoff project. |
| `POST /agent/launch` | Return an Agent command, or launch only when explicitly allowed. |
| `POST /skill/install` | Install or update the Skill into an allowlisted local Agent target (`codex` or `generic`). |

CORS is limited to GitHub Pages and local development origins.

## Safety Defaults

- Bridge binds to localhost only.
- Maximum request body is 60 MB by default. Override with `UPM_BRIDGE_MAX_MB`.
- Output directory defaults to `~/UltimatePPTMaster/handoffs`. Override with `UPM_BRIDGE_OUTPUT_DIR`.
- Automatic Agent launch is disabled by default.
- API key values are never returned to the browser.
- Skill installation only writes fixed allowlisted targets and never accepts arbitrary browser-provided filesystem paths.

Enable optional Agent auto-launch:

```bash
npm run bridge -- --allow-launch
```

When auto-launch is disabled, the web page still returns a ready-to-copy command such as:

```bash
cd ~/UltimatePPTMaster/handoffs/my-deck-... && codex "Read AGENTS.md, codex-task.md, visual-element-kit.md, asset-plan.md, quality-checklist.md, manifest.json, and project-brief.json first..."
```

## Troubleshooting

If the web page shows Bridge offline:

```bash
npm run bridge
```

If a file was not parsed:

```bash
npm run setup
python3 scripts/source_to_md/pdf_to_md.py path/to/file.pdf
```

If provider status is missing:

```bash
mkdir -p ~/.ppt-master
cp .env.example ~/.ppt-master/.env
$EDITOR ~/.ppt-master/.env
```

Then restart Bridge.
