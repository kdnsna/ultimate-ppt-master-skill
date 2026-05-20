# Documentation Map

Ultimate PPT Master now has a web-first public direction and two important user routes:

1. **Web Experience** is the main front door for discovery, lightweight trial, prompt generation, and demo viewing.
2. **Agent Skill** is the second core route for high-quality local production with Codex, Claude Code, Hermes, OpenClaw, Cursor-style IDEs, and other agents.

The desktop app remains available as an advanced local preview and future distribution path, but it is not the near-term acquisition path.

## Start Here

| Need | Best entry | Read |
|---|---|---|
| I want to understand and try the product quickly. | Web Experience | [Web Experience](./web-experience.md) |
| I want Codex, Claude Code, Hermes, OpenClaw, Cursor, Cline, Roo, or Windsurf to generate decks. | Agent Skill | [Agent Setup](./agent-setup.md) |
| I want to know which workflow gives better results. | Decision guide | [Choosing a Workflow](./choosing-a-workflow.md) |
| I need model/API/provider keys. | Provider setup | [Model and Provider Setup](./model-provider-setup.md) |
| I want the local desktop preview. | Desktop Later | [Quickstart Desktop](./quickstart-desktop.md) |
| I maintain release packaging, signing, notarization, or Homebrew. | Distribution | [Release and Maintenance](./release-maintenance.md) |
| Something failed. | Traceable debugging | [Troubleshooting](./troubleshooting.md) |
| 中文用户想快速定位。 | 中文索引 | [中文文档索引](./zh-CN/README.md) |

## Current Recommendation

| User type | Recommended path | Why |
|---|---|---|
| Curious visitor | Open the Web Experience | Fastest path: no install, no backend account, no model key, no local environment setup. |
| GitHub/agent user | Install as a Skill and ask the agent to read `AGENTS.md` / `SKILL.md` | Best quality today because the agent can inspect source files, run the pipeline, preview, fix, and export. |
| Team maintaining polished decks | Web Experience for intake + Agent Skill for production | Keeps the front door simple while preserving deep local control. |
| Desktop user or maintainer | Use desktop as an advanced local preview | Native distribution still depends on signing, notarization, and packaging maturity. |
| API integrator | Use the documented direct API variables only as a reserved convention | The complete direct API worker adapter is not shipped in v2.1.0. |

## Trace Map

Every public support path should point to an inspectable artifact:

| Question | First check | Evidence to keep |
|---|---|---|
| Does the web app build? | `npm run build:web` | `apps/web/dist`, Pages workflow logs. |
| Does the prompt generator work? | Web Experience form and copy button | Generated Agent prompt for the selected scenario. |
| Did source extraction work in a local project? | `projects/.../desktop-manifest.json` | `sourceExtraction.status`, `sources/source.md`. |
| Where did the output go? | Workbench export panel or manifest | `generatedFiles`, `outputs/`, `previews/`. |
| Why does a deck look wrong? | Project log and source markdown | `logs/desktop-worker.log`, redacted source excerpt. |
| Which agent instructions are active? | `AGENTS.md`, `CLAUDE.md`, `PROMPT.md` | Agent prompt and local skill path. |
| Is CI healthy? | `.github/workflows/ci.yml` | Web build, desktop build, worker tests, audit, whitespace check. |
| Is Pages healthy? | `.github/workflows/pages.yml` | Static artifact upload and deploy logs. |

## External References

These docs informed the repository guidance:

- [OpenAI Codex CLI](https://developers.openai.com/codex/cli): Codex can run locally, read/change code, and run commands in the selected directory.
- [OpenAI AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md): Codex reads `AGENTS.md` before work.
- [Claude Code settings](https://code.claude.com/docs/en/settings): Claude Code uses `CLAUDE.md`, settings, skills, and MCP configuration.
- [Claude Code memory](https://code.claude.com/docs/en/memory): project-level `CLAUDE.md` is the shared place for build commands and project conventions.
- [GitHub Pages](https://docs.github.com/en/pages): static site deployment from GitHub Actions.
- [Tauri distribution](https://v2.tauri.app/distribute/): native desktop distribution uses Tauri build and bundle commands.
