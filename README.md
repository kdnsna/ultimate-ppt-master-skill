# Ultimate PPT Master - Web Experience + Local Agent Bridge + Agent Skill

> A web-first fusion workflow for AI presentations: import source files, assemble a structured deck brief, connect to a local Agent Bridge, stage a real handoff project, then let Codex, Claude Code, Hermes, OpenClaw, or another local agent produce editable PPTX and Web Decks.

<p align="center">
  <strong>v2.2.0</strong> · English · <a href="./README.zh-CN.md">中文 README</a> · <a href="./docs">Docs</a> · <a href="./docs/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>Open Web Experience</strong></a>
  ·
  <a href="#connect-local-agent"><strong>Connect Local Agent</strong></a>
  ·
  <a href="#use-as-agent-skill"><strong>Install / Use as Agent Skill</strong></a>
  ·
  <a href="#desktop-later--local-preview"><strong>Desktop Later</strong></a>
  ·
  <a href="./docs"><strong>Docs</strong></a>
</p>

<p align="center">
  <img alt="Version 2.2.0" src="https://img.shields.io/badge/Version-2.2.0-7C3AED?style=for-the-badge">
  <img alt="Web first" src="https://img.shields.io/badge/Primary-Web%20Experience-2563EB?style=for-the-badge">
  <img alt="Local bridge" src="https://img.shields.io/badge/Local-Agent%20Bridge-0F766E?style=for-the-badge">
  <img alt="Agent skill" src="https://img.shields.io/badge/Second%20Core-Agent%20Skill-10B981?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/kdnsna/ultimate-ppt-master-skill/ci.yml?branch=main&style=for-the-badge&label=CI">
</p>

Ultimate PPT Master is now positioned around three practical entry points:

| Entry | Role |
|---|---|
| **Open Web Experience** | The low-friction public front door. Import files, build a structured deck brief, preview a local Web Deck, inspect model/Agent status, and export `handoff-kit.zip`. |
| **Connect Local Agent** | The v2.2 bridge route. Run one local command, let the page talk to `127.0.0.1`, parse PDF/Word/PPTX/Excel/URL sources locally, and create a ready-to-open handoff project. |
| **Install / Use as Agent Skill** | The high-quality production route. Let a local agent read real files, run scripts, preview output, fix layout issues, and export editable PPTX or single-file Web Decks. |

The desktop app remains in the repository, but it is no longer the first promotion path. Signing, notarization, Homebrew distribution, and native packaging are treated as release-maintenance work for later.

---

## Open Web Experience

Open the static web app:

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

The web experience is now an **Agent Connect Hub**:

- choose source type, target scenario, output mode, visual style, language, agent tool, and model preference;
- drag in `.md`, `.txt`, `.pdf`, `.docx`, `.pptx`, `.xlsx`, or add URLs;
- pre-read text sources in the browser and mark binary sources for local Bridge parsing;
- generate a slide outline and brief-readiness check;
- see the Hugo He / ppt-master PPTX route and op7418 / Guizang Web Deck route side by side;
- detect whether the local Bridge, Codex, Claude Code, Hermes, OpenClaw, and provider keys are available;
- preview and download `preview-web-deck.html` as a browser-local rough deck;
- send the task to the local Bridge or download a complete `handoff-kit.zip` containing `source.md`, `extracted-source.md`, `attachments/`, `manifest.json`, `agent-prompt.md`, `project-brief.json`, `preview-web-deck.html`, `engine-plan.md`, `quality-checklist.md`, and `README.md`;
- open the sanitized Web Deck demo;
- jump directly to Skill installation instructions.

Boundaries are explicit: there is no hosted backend, no hosted model, no account system, and no browser-side API key storage. The static page can export files by itself; when Bridge is running, source files are sent only to your own `127.0.0.1` service.

For local development:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm --prefix apps/web install
npm run dev:web
```

Build the static Pages artifact:

```bash
npm run build:web
```

---

## Connect Local Agent

Start the local Bridge from a clone:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run bridge
```

Then open the Web Experience and click **Send to local Bridge**. The page will create a local project under `~/UltimatePPTMaster/handoffs/...` with:

- `source.md` and `extracted-source.md`;
- original files in `attachments/`;
- `manifest.json` with parse status and suggested commands;
- `agent-prompt.md`, `project-brief.json`, `engine-plan.md`, `quality-checklist.md`;
- `preview-web-deck.html`.

Bridge safety defaults:

- binds to `127.0.0.1`;
- reads provider config from environment, repo `.env`, or `~/.ppt-master/.env`;
- reports only whether keys exist, never key values;
- parses PDF/Word/PPTX/Excel/URL locally through `scripts/source_to_md/*`;
- does not launch an Agent unless explicitly enabled.

Optional auto-launch mode:

```bash
npm run bridge -- --allow-launch
```

Full guide: [Agent Connect Bridge](./docs/agent-connect-bridge.md).

---

## Use as Agent Skill

Use the Skill route when quality matters more than the fastest first click. This is the route for Codex, Claude Code, Hermes, OpenClaw, Cursor-style IDEs, and other local agents that can read instructions and run scripts.

### Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
```

Ask:

```text
Use $ultimate-ppt-master to turn reports/q3-review.pdf into a 12-slide editable PPTX for an executive meeting. Verify the deck before delivery.
```

### Claude Code, Hermes, OpenClaw, and Generic Agents

```bash
mkdir -p ~/agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
npm run setup
```

Agent prompt:

```text
Read ~/agent-skills/ultimate-ppt-master/AGENTS.md and follow SKILL.md.
Use that repository path as SKILL_DIR.
Turn the provided source material into an editable PPTX and preview the result before delivery.
```

What the Skill is good at:

- converting real source material into clean `source.md`;
- building narrative structure before slide writing;
- generating editable PPTX for business reports, consulting proposals, training decks, and investor pitches;
- generating high-impact single-file Web Decks for launches, demos, and visual sharing;
- rendering or previewing output, inspecting issues, repairing obvious layout problems, and listing final files.

Full guide: [Agent Setup](./docs/agent-setup.md).

---

## Choose Your Path

| Path | Best for | Start |
|---|---|---|
| **Web Experience** | New users, GitHub visitors, demos, social sharing, lightweight trial. | [Open Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/) |
| **Web Experience + Bridge** | Users who want real file intake without uploading anything to a hosted service. | Run `npm run bridge`, then click **Send to local Bridge**. |
| **Agent Skill** | Users who already use Codex, Claude Code, Hermes, OpenClaw, Cursor, Cline, Roo, or Windsurf. | [Agent Setup](./docs/agent-setup.md) |
| **Web Experience + Skill** | Recommended production flow: assemble or stage the handoff kit, then give the folder to an agent. | Open the web app, download `handoff-kit.zip` or send it through Bridge. |
| **Desktop Later / Local Preview** | Advanced local mode and future signed desktop distribution. | See [Quickstart Desktop](./docs/quickstart-desktop.md). |

If you are deciding which route to use, read [Choosing a Workflow](./docs/choosing-a-workflow.md).

---

## What It Generates

Ultimate PPT Master is a fusion shell over two complementary production routes. The repository preserves upstream attribution in [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES).

### Editable PowerPoint (`.pptx`)

Use this when the deck must be reviewed, changed, delivered, or archived in PowerPoint.

- Business reports, consulting proposals, training material, academic decks, and investor updates.
- Editable text, shapes, charts, notes, and export checks matter more than flat screenshots.
- The Agent Skill handles the strongest current production path: source analysis, strategy, design lock, page generation, preview, repair, and export.

### Magazine Web Deck (`index.html`)

Use this when the presentation itself is the experience.

- Single-file HTML presentation for launches, keynotes, demo days, product stories, and visual internal sharing.
- Editorial magazine and Swiss Style directions are both supported.
- The Web Experience can generate a `preview-web-deck.html` first draft; the Agent Skill remains responsible for final production and QA.
- Public sanitized demos:
  - [Agentic Developer Stack 2026](./examples/agentic-developer-tools-2026)
  - [Desktop Cultural Tourism Demo](./examples/desktop-cultural-tourism-demo)

---

## How It Works

| Layer | Role |
|---|---|
| **Static Web Experience** | Imports files, builds a structured deck brief, previews `preview-web-deck.html`, checks Bridge/provider status, and exports `handoff-kit.zip`. |
| **Local Agent Bridge** | Runs on `127.0.0.1`, parses source files locally, writes handoff projects, checks provider readiness, and returns suggested Agent commands. |
| **Fusion engine plan** | Makes the PPTX route, Web Deck route, visual style route, quality checklist, and copyright/notice expectations explicit before handoff. |
| **Agent Skill** | Lets Codex / Claude Code / Hermes / OpenClaw read `AGENTS.md` and `SKILL.md`, then run the production workflow locally. |
| **Python + templates** | Create project folders, normalize sources, generate PPTX/Web outputs, and keep logs/artifacts inspectable. |
| **Desktop Later** | Tauri app remains available for local preview and future signed distribution, but is not the near-term acquisition path. |

---

## Desktop Later / Local Preview

The desktop app code is still maintained under [apps/desktop](./apps/desktop), but desktop installation is now documented as an advanced local mode.

Developer source preview:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

Release-maintenance references:

- [Quickstart Desktop](./docs/quickstart-desktop.md)
- [Homebrew Distribution Plan](./docs/homebrew-distribution.md)
- [Release and Maintenance](./docs/release-maintenance.md)

---

## Documentation

| Need | Guide |
|---|---|
| Use the static online front door | [Web Experience](./docs/web-experience.md) |
| Connect the web page to local files and Agents | [Agent Connect Bridge](./docs/agent-connect-bridge.md) |
| Install and invoke the Skill | [Agent Setup](./docs/agent-setup.md) |
| Pick Web vs Skill vs Desktop Later | [Choosing a Workflow](./docs/choosing-a-workflow.md) |
| Run the desktop app from source | [Quickstart Desktop](./docs/quickstart-desktop.md) |
| Configure model/provider keys | [Model and Provider Setup](./docs/model-provider-setup.md) |
| Debug setup, extraction, output, provider, Tauri, or agent loading issues | [Troubleshooting](./docs/troubleshooting.md) |
| Release, Pages, Homebrew, signing, privacy, and maintenance | [Release and Maintenance](./docs/release-maintenance.md) |

---

## Roadmap

- Validate GitHub Pages + Local Bridge as the main public experience.
- Expand Web Experience examples for Chinese reporting, English pitch decks, consulting workflows, and training courseware.
- Keep Skill installation lightweight and memorable across Codex, Claude Code, Hermes, OpenClaw, and generic agents.
- Add gallery automation for public demo decks.
- Resume desktop signing/notarization/Homebrew work after the web-first funnel proves useful.

---

## What Changed in v2.2.0

| Update | What changed |
|---|---|
| **Agent Connect Hub** | Upgraded the Web Experience from brief-only flow to source intake, Bridge detection, provider dashboard, Agent status, richer previews, and upgraded handoff kit. |
| **Local Agent Bridge** | Added `npm run bridge` with localhost-only health, provider, handoff, and optional Agent launch endpoints. |
| **Real source intake** | Handoff kits now include `extracted-source.md`, `attachments/`, `manifest.json`, and local parse status for PDF/Word/PPTX/Excel/URL sources. |
| **Skill as production route** | README and docs keep Agent Skill visible as the production-quality route, not buried in developer notes. |
| **Desktop repositioned** | Tauri desktop remains available, but Homebrew/signing/notarization now live in release-maintenance documentation. |
| **Regression checks** | Bridge tests cover secret masking, handoff writes, browser text extraction, and safe default command-only Agent launch. |

See [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md) for upstream baselines and adaptation policy.

---

## License

MIT. See [LICENSE](./LICENSE).
