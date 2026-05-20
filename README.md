# Ultimate PPT Master - AI PPT Desktop App + Agent Skill for Editable PowerPoint & Web Decks

> A local-first AI PPT desktop app and portable agent skill that turns real source material into editable PowerPoint decks and high-impact web presentations.

<p align="center">
  <strong>v2.0.0</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./apps/desktop">Desktop App</a> · <a href="./docs">Docs</a>
</p>

![Ultimate PPT Master Desktop hero](assets/readme/hero.svg)

<p align="center">
  <a href="#quick-start-desktop"><strong>Run Desktop</strong></a>
  ·
  <a href="./README.zh-CN.md"><strong>中文介绍</strong></a>
  ·
  <a href="./docs"><strong>Docs</strong></a>
  ·
  <a href="#for-developers--agents"><strong>Agent Setup</strong></a>
</p>

<p align="center">
  <img alt="Version 2.0.0" src="https://img.shields.io/badge/Version-2.0.0-7C3AED?style=for-the-badge">
  <img alt="AI PPT Desktop" src="https://img.shields.io/badge/AI%20PPT-Desktop%20%2B%20Skill-F97316?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-2563EB?style=for-the-badge">
  <img alt="Local First" src="https://img.shields.io/badge/Local--first-No%20Cloud%20Upload-10B981?style=for-the-badge">
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/kdnsna/ultimate-ppt-master-skill/ci.yml?branch=main&style=for-the-badge&label=CI">
</p>

If you are searching GitHub for **AI PPT**, **PowerPoint generator**, **PPTX automation**, **presentation desktop app**, **editable PPTX**, or **slide deck agent**, this project is built for the practical part of presentation work: importing real documents, choosing a delivery scene, generating a useful deck, and handing it off without losing editability.

Most AI slide tools stop at a beautiful screenshot. Ultimate PPT Master Desktop is designed around a different promise:

| Bring in | Choose | Generate |
|---|---|---|
| PDF, DOCX, XLSX, PPTX, URL, Markdown, pasted text | Editable PPTX or cinematic Web Deck | Local project, preview, outputs, logs, Agent handoff |

The desktop app and the agent skill are both first-class. Use the desktop app when you want a guided product. Use the skill when you want Codex, Claude Code, OpenClaw, Hermes, or another coding agent to run the full production pipeline and refine the deck page by page.

---

## Choose Your Path

| Path | Best for | Start |
|---|---|---|
| **Desktop App** | Ordinary creators, business users, teachers, consultants, and anyone who wants a 3-step local workflow. | `npm run setup` then `npm run desktop` |
| **Agent Skill** | GitHub users and agent operators who want the strongest current output quality with script execution, preview checks, and repair loops. | Read [Agent Setup](./docs/agent-setup.md) |
| **Desktop + Agent** | Teams that want simple intake plus production-grade final polish. | Create a project in Desktop, then copy the Workbench handoff prompt. |
| **Direct API / custom bridge** | Developers building their own worker adapter. | Read [Model and Provider Setup](./docs/model-provider-setup.md); v2.0.0 keeps this as a reserved convention. |

If you are deciding which route to use, read [Choosing a Workflow](./docs/choosing-a-workflow.md).

---

## Why Desktop

![Ultimate PPT Master Desktop showcase](assets/readme/desktop-showcase.svg)

Ultimate PPT Master Desktop is for people who want the speed of AI but still need a file they can trust.

| Desktop promise | Why it matters |
|---|---|
| **3-step creator flow** | Import sources, choose output, generate. Ordinary creators can start without reading a script manual. |
| **Editable PPTX path** | Formal decks must be revised by teams, clients, teachers, and managers in PowerPoint. |
| **Premium Web Deck path** | Launches, demo days, talks, and internal showcases need a more visual presentation surface. |
| **Real DOCX extraction** | Word meeting material is converted into `source.md` before preview generation, instead of becoming a placeholder shell. |
| **Local-first projects** | Source files, outputs, previews, manifests, and logs stay in local project folders by default. |
| **Agent-compatible depth** | The desktop shell stays simple while advanced generation remains available through `SKILL.md`. |
| **Bilingual UI** | Settings include Chinese / English switching for international users. |

This is not a full PowerPoint editor and does not claim to replace PowerPoint. It is a focused desktop studio for import, preview, orchestration, export, and agent handoff.

---

## What It Generates

![Ultimate PPT Master desktop workflow](assets/readme/desktop-workflow.svg)

### Editable PowerPoint (`.pptx`)

Use this when the deck must be reviewed, changed, delivered, or archived.

- Native PowerPoint-style output for formal handoff.
- Designed for business reports, consulting decks, training material, academic decks, and investor updates.
- DOCX sources are extracted locally into `sources/source.md`, then used for immediate PPTX preview generation.
- Keeps the "real file" mindset: text, shapes, charts, notes, and export checks matter more than flattened screenshots.
- Production-grade generation is handled by the full agent workflow, where the agent can read source material, lock a design spec, generate pages, preview, verify, and export.

### Magazine Web Deck (`index.html`)

Use this when the presentation itself is the experience.

- Single-file HTML presentation for launches, keynotes, demo days, product stories, and high-visual internal sharing.
- Includes editorial magazine and Swiss Style directions.
- Uses the same extracted `source.md` as the PPTX path, so one source can validate both delivery modes.
- Built for horizontal navigation, strong visual rhythm, and shareable local output.
- Works as the expressive counterpart to editable PPTX.

---

## Real-World Sanitized Demo

The release candidate was locally validated with a real DOCX meeting brief and generated both:

- a 10-slide editable PPTX preview for formal meeting review;
- an 8-slide Web Deck preview for visual sharing.

The raw DOCX and raw generated outputs are not committed because they may contain sensitive business context. A sanitized public demo is available at [examples/desktop-cultural-tourism-demo](./examples/desktop-cultural-tourism-demo), with generalized organization names, locations, budget wording, and approval details.

---

## How It Works

Ultimate PPT Master Desktop keeps the product surface simple and leaves the deep work to the local worker and agent pipeline.

| Layer | Role |
|---|---|
| **Tauri desktop shell** | Lightweight native app wrapper, macOS first, Windows/Linux later. |
| **React + TypeScript UI** | Projects, Create, Workbench, Settings, language switch, provider status, model setup guide. |
| **Python worker** | Creates local projects, writes previews, manifests, logs, and handoff files. |
| **Agent workflow** | Codex / Claude Code / OpenClaw / Hermes reads `SKILL.md`, runs scripts, handles full generation and refinement. |

The app currently focuses on the user-facing experience loop: import, recommend, preview, inspect, open outputs, and continue through an agent. Direct LLM API driving is documented as a future worker adapter, not as a complete replacement for the current `SKILL.md` workflow.

---

## Quick Start Desktop

First run, one-command setup:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

What the setup command does:

| Command | Purpose |
|---|---|
| `npm run setup` | Creates `.venv`, installs Python dependencies, installs desktop npm dependencies, and creates `~/.ppt-master/.env` from the template. |
| `npm run desktop` | Launches the desktop web shell without requiring you to enter `apps/desktop`. |
| `npm run doctor` | Checks Python, Node/npm, Rust/Cargo, Cairo, provider keys, and reserved model config without printing secrets. |
| `npm run app:desktop` | Runs the native Tauri app after Rust/Cargo are installed. |
| `npm run package:desktop` | Builds the stable macOS `.app` bundle. |

If your environment does not use npm from the repository root, the same flow works through scripts:

```bash
bash scripts/bootstrap.sh
bash scripts/run-desktop.sh
```

Build the frontend from the root:

```bash
npm run build:desktop
```

Run as a native Tauri app after installing Rust:

```bash
npm run app:desktop
```

Build the native macOS `.app` bundle:

```bash
npm run package:desktop
```

Create a DMG release package when Finder automation is available:

```bash
npm run package:desktop:dmg
```

The bootstrap script intentionally does not install system packages such as Rust, Homebrew, or Cairo for you. `npm run doctor` tells you exactly which optional native pieces are missing. Without Rust, `npm run desktop` still gives you the browser-backed desktop shell; Rust is only required for native Tauri mode and packaging.

---

## Model Setup

Production-quality decks need a model, but this project does not bundle or resell a cloud model. The recommended path is **Agent-driven generation**.

| Driver mode | Current status | Best for |
|---|---|---|
| **Codex / Claude Code / OpenClaw / Hermes** | Recommended and supported | Source reading, strategy, design lock, page writing, script execution, preview, correction, export. |
| **Agent + provider keys** | Supported | The agent runs the main workflow; provider keys unlock image generation, image search, narration, and media capabilities. |
| **Direct LLM API driver** | Reserved convention | Future desktop worker adapter for OpenAI-compatible, Gemini, Qwen, or self-hosted APIs. |

Current recommendation: Desktop is the easiest way to start; Agent Skill gives the best results today because the agent can read source files, run scripts, inspect previews, and repair exports. Direct API variables are useful for custom bridges, but they are not a complete built-in generator in v2.0.0.

Recommended local provider config:

```bash
mkdir -p ~/.ppt-master
cp .env.example ~/.ppt-master/.env
```

Then edit `~/.ppt-master/.env`:

```dotenv
IMAGE_BACKEND=openai
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-image-2

# Optional image search
PEXELS_API_KEY=your-pexels-key
PIXABAY_API_KEY=your-pixabay-key

# Reserved for future direct API worker adapters
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4.1
```

The desktop Settings page detects process environment variables, repository `.env`, and `~/.ppt-master/.env`. It only shows status flags and never exposes secret values.

For a quick environment check after editing provider values:

```bash
npm run doctor
```

Full guide: [Model and Provider Setup](./docs/model-provider-setup.md).

---

## For Developers / Agents

Ultimate PPT Master is also a portable agent skill. Use this path when you want Codex, Claude Code, OpenClaw, Hermes, or another coding agent to run the full production workflow.

### Install for Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
# No Node/npm in this agent environment? Use: bash scripts/bootstrap.sh
```

Then ask Codex:

```text
Use $ultimate-ppt-master to turn reports/q3-review.pdf into a 12-slide editable PPTX for an executive meeting.
```

### Install for Claude Code, OpenClaw, Hermes, and Generic Agents

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
npm run setup
# No Node/npm in this agent environment? Use: bash scripts/bootstrap.sh
```

Agent prompt:

```text
Read ~/agent-skills/ultimate-ppt-master/AGENTS.md and follow the ultimate-ppt-master workflow.
Use the repository path as SKILL_DIR. Turn reports/q3-review.pdf into a 12-slide editable PPTX.
```

| Agent / Tool | Recommended setup | Invocation |
|---|---|---|
| **Codex** | `~/.codex/skills/ultimate-ppt-master` | `Use $ultimate-ppt-master ...` |
| **Claude Code** | `~/.claude/skills/ultimate-ppt-master` or a project-readable path | Ask Claude to read `CLAUDE.md`. |
| **OpenClaw** | Stable local path such as `~/agent-skills/ultimate-ppt-master` | Ask it to read `AGENTS.md`. |
| **Hermes** | Stable local path such as `~/agent-skills/ultimate-ppt-master` | Ask Hermes to read `AGENTS.md`; use the repo as `SKILL_DIR`. |
| **Prompt-only agent** | No native skill directory required | Paste or attach `PROMPT.md`. |

Full guide: [Agent Setup](./docs/agent-setup.md). For generic repository instructions, agents should start from [AGENTS.md](./AGENTS.md); Claude Code users can start from [CLAUDE.md](./CLAUDE.md); prompt-only tools can use [PROMPT.md](./PROMPT.md).

---

## Documentation

| Need | Guide |
|---|---|
| Pick Desktop vs Skill vs Direct API | [Choosing a Workflow](./docs/choosing-a-workflow.md) |
| Run the desktop app | [Quickstart Desktop](./docs/quickstart-desktop.md) |
| Configure Codex, Claude Code, OpenClaw, Hermes, Cursor, Cline, Roo, Windsurf | [Agent Setup](./docs/agent-setup.md) |
| Configure model/provider keys | [Model and Provider Setup](./docs/model-provider-setup.md) |
| Debug setup, DOCX extraction, output, provider, Tauri, or agent loading issues | [Troubleshooting](./docs/troubleshooting.md) |
| Release/CI/privacy/upstream maintenance | [Release and Maintenance](./docs/release-maintenance.md) |

---

## Roadmap

Desktop improvements planned after v2.0.0:

- Natural-language edits for a selected slide.
- Single-slide regeneration from the project workbench.
- Template import wizard.
- Image search / image generation panel.
- Poster and cover generation for sharing the deck.
- Direct API worker adapter for OpenAI-compatible, Gemini, Qwen, and self-hosted models.
- Gallery automation for GitHub README examples.

---

## What Changed in v2.0.0

| Update | What changed |
|---|---|
| **Desktop foundation** | Added Tauri + React/TypeScript + local Python worker app under `apps/desktop`. |
| **Desktop UX upgrade** | Added Projects, Create, Workbench, Settings, real manifests, trust checks, language switching, and model setup guidance. |
| **DOCX input loop** | Desktop worker now extracts DOCX text into `source.md` and records `sourceExtraction` status in the manifest. |
| **Release checks** | Added CI for desktop build, worker tests, dependency audit, and whitespace checks. |
| **Sanitized demo** | Added a public cultural-tourism meeting-material demo without committing raw private source files. |
| **Native build hardening** | Added Tauri icon assets, `Cargo.lock`, stable `.app` build command, and explicit DMG command. |
| **Fresh upstream sync** | Synced `hugohe3/ppt-master` and `op7418/guizang-ppt-skill` updates while preserving this repository's adaptation layer. |
| **Two output routes** | Editable PPTX and magazine-style HTML decks are both kept as first-class outputs. |
| **Multi-agent guide** | Added setup paths for Codex, Claude Code, OpenClaw, Hermes, generic agents, and prompt-only environments. |

See [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md) for upstream baselines and adaptation policy.

---

## License

MIT. See [LICENSE](./LICENSE).
