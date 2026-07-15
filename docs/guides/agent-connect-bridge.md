# Agent Connect Bridge

Agent Connect Bridge is the v6.3.6 companion for the static Web Experience. It lets the GitHub Pages app talk to a service on `127.0.0.1`, stage real source files, preserve the user-approved `DeckSession` as the production storyboard, hand the project to Codex, and expose only finished artifacts that pass the local path boundary. The v6.3.6 source is marked **unreleased candidate**: it may exist on `main` or be served by Pages, but that marker does not attest to a tag, GitHub Release, marketplace publication, or any particular Pages deployment.

## Quick Start

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

Open the Web Experience:

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

Drop source files into the page, confirm the storyboard and visual direction, then click **Create local project**. If Bridge was started with `--allow-launch` and Codex is available, the primary action becomes **Create project and launch Codex**.

If automatic launch is disabled, Bridge returns a ready-to-copy Codex command. If Bridge is offline, the web page shows the local startup command instead of pretending that a project was created.

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
- `storyboard.json` - DeckIR 1.0 production map that preserves the approved order, `slideId`, title, takeaway, role, and selected structural variant.
- `source-map.json` - extracted claims and their per-slide evidence bindings.
- `agent-prompt.md` - the production prompt for Codex / Claude Code / Hermes / OpenClaw.
- `project-brief.json` - structured choices from the Web Experience.
- `project-brief.json.briefMode` / `visualBrief` / `guidedBrief` / `expectationFit` - user intent from visual tags, pasted background, guided-intake state, assumptions, and production readiness.
- `preview-web-deck.html` - browser-local rough preview.
- `engine-plan.md` - PPTX / Web Deck / Fusion route split.
- `quality-checklist.md` - checks before delivery.
- `asset-plan.md` - public references, ChatGPT generated assets, source/license notes, and insertion targets.
- `asset_plan.json` - v5.4 Asset Factory contract with slide, slot, type, aspect ratio, source policy, prompt path, status, and `current_generation_evidence` rules.
- `prompts/*.md` - per-asset prompt files referenced by `asset_plan.json`.
- `visual-element-kit.md` - ChatGPT-generation-first micro-asset checklist.
- `codex-task.md` - Codex-specific production sequence.
- `AGENTS.md` - local Codex rules for privacy, assets, and quality gates.
- `quality-report.json` - pending or completed Design Doctor / formal-business review status. Its status controls the artifact verification label shown in the workspace.

Codex should read `AGENTS.md`, `codex-task.md`, `visual-element-kit.md`, `asset-plan.md`, `asset_plan.json`, `quality-checklist.md`, `manifest.json`, and `project-brief.json` first. If `expectationFit.readyForProduction` is false, Codex should run Guided Intake before final-quality deck production, asking one related question group per turn until audience, scenario, purpose, sources, core message, page count, style, asset boundary, output format, and must-avoid rules are clear. The expected next local command after the brief is production-ready is:

```bash
cd <repoRoot> && python3 scripts/generate_visual_element_kit.py <projectPath>
```

If no image backend or OpenAI key is configured, the script writes `Needs-Manual` prompts to `images/image_prompts.md`; paste them into ChatGPT and save outputs to the listed paths.

## Agent-to-artifact loop

The Bridge does not manufacture a final file during `POST /handoff`. It creates the local production contract, then either launches Codex when explicitly allowed or returns a command for the user to run.

During `generating` and `review`, the Web Experience requests both the artifact list and `GET /agent/status` every three seconds. Polling pauses while the page is hidden and resumes when it becomes visible. A restored `delivered` session performs one discovery check from the saved `session.projectPath`, but does not keep polling after that check.

Agent runtime status is `idle`, `accepted`, `running`, `completed`, or `failed`. A `warning` artifact does not become a quality block while the Agent is still running; once the Agent finishes, required artifacts must pass verification before delivery. In command-only mode Bridge cannot observe a manually started terminal process, so artifact discovery remains the authoritative completion signal.

Bridge scans only these locations:

- `exports/` for `.pptx`, `.html`, `.pdf`, and archive deliverables;
- `ppt/` for generated deck files;
- an explicit root-level quality-report allowlist.

Pending or warning artifacts remain downloadable for review. The workspace exposes **Mark delivered** only when every artifact kind required by the selected output mode has verification `passed` and every slide is approved. A structural HTML preview remains labeled as a draft and is never presented as the final PPTX.

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

After a successful handoff, the response includes the authoritative `storyboard` and `sourceMap`. The Web Experience reconciles verified source state plus per-slide `evidenceState` and `evidenceRefs`; it never replaces the user's slide order, `slideId`, title, takeaway, role, or selected variant.

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
| `GET /events` | Read-only SSE stream for phase, artifact, finding, failure, recovery, and completion progress. |
| `GET /providers` | Provider status without secrets. |
| `POST /providers/test` | Test a configured provider through Bridge. |
| `POST /handoff` | Create a local handoff project. |
| `POST /slides/regenerate` | Save a revision request for one stable `slideId` inside an existing Bridge handoff. |
| `GET /projects/artifacts?projectPath=<handoff>` | List allowlisted deliverables and quality reports with kind, size, modification time, and verification status. |
| `GET /projects/artifacts/file?projectPath=<handoff>&artifact=<relative-path>` | Download one listed artifact as an attachment. |
| `POST /agent/launch` | Return an Agent command, or launch only when explicitly allowed. |
| `GET /agent/status?projectPath=<handoff>` | Read the persisted Agent job as `idle`, `accepted`, `running`, `completed`, or `failed`. |
| `POST /skill/install` | Install or update the Skill into an allowlisted local Agent target (`codex` or `generic`). |

CORS is limited to GitHub Pages and local development origins.

## HTTP API Boundary and Server Deployment

The v6.3.6 candidate Bridge is an HTTP preparation and orchestration API, not a public multi-tenant generation service. `POST /handoff` creates the project contract; `GET /events` reports progress; `POST /slides/regenerate` records a slide-level revision; the artifact endpoints discover and download files already produced by the local Agent. Final PPTX/Web generation still needs one of these execution layers:

1. **Agent runner** - install Codex, Claude Code, Hermes, or OpenClaw on the worker and let it execute the Skill against the handoff directory.
2. **Custom orchestrator** - call the repository scripts directly, persist `DeckSession`, schedule retries/checkpoints, run the quality gates, and publish the final artifacts yourself.

There is no authenticated standalone `POST /generate` endpoint. The current server deliberately rejects non-loopback binding, has no tenant isolation or job queue, and must not be exposed directly to the internet. A remote deployment should place an authenticated API gateway and job queue in front of isolated workers, while keeping the Bridge/Skill process private.

## Safety Defaults

- Bridge binds to localhost only.
- Maximum request body is 60 MB by default. Override with `UPM_BRIDGE_MAX_MB`.
- Output directory defaults to `~/UltimatePPTMaster/handoffs`. Override with `UPM_BRIDGE_OUTPUT_DIR`.
- Automatic Agent launch is disabled by default.
- API key values are never returned to the browser.
- Skill installation only writes fixed allowlisted targets and never accepts arbitrary browser-provided filesystem paths.
- Every artifact or launch request resolves `outputDir`, the project directory, and `manifest.json` with `realpath` before use.
- `projectPath` must be a real directory inside `outputDir`, not a symlink, and its regular `manifest.json` must contain the matching absolute `projectPath` plus a Bridge HMAC signature over the complete manifest except the signature block itself. Empty, unsigned, tampered, or forged manifests are rejected.
- Bridge keeps the private signing key at `outputDir/.bridge-manifest.key` with mode `0600`; it is never returned by health, manifest, artifact-list, or download responses. Keep that file when restarting Bridge. Older unsigned handoffs must be recreated through `/projects/create` before launch or download.
- Artifact paths must be project-relative and may not contain `..`, absolute paths, backslashes, or symlink hops.
- Only `exports/`, `ppt/`, and the quality-report allowlist are visible. `attachments/`, source files, and arbitrary directory browsing are never exposed.
- Downloads use attachment responses; Bridge is not a general-purpose local file server.

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

If a generated file does not appear, confirm that it is under `<projectPath>/exports/` or `<projectPath>/ppt/`, then refresh the artifact panel. Do not move or edit `manifest.json`: the complete handoff contract is signed, so any edit invalidates it. Mutable review results belong in `quality-report.json`. If an older project reports a missing authenticity signature, recreate it through `/projects/create`.
