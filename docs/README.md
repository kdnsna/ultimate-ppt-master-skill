# Documentation Map

Ultimate PPT Master has two first-class entry points:

1. **Desktop App** for creators who want a guided local product.
2. **Agent Skill** for Codex, Claude Code, OpenClaw, Hermes, Cursor-style IDEs, and other local agents that can read Markdown instructions and run scripts.

The desktop app is the easiest way to start. The agent skill is the strongest path today when you need production-grade deck strategy, visual iteration, script execution, preview checks, and export repair.

## Start Here

| Need | Best entry | Read |
|---|---|---|
| I want an app and a simple flow. | Desktop App | [Quickstart Desktop](./quickstart-desktop.md) |
| I want Codex, Claude Code, Hermes, OpenClaw, Cursor, Cline, Roo, or Windsurf to generate decks. | Agent Skill | [Agent Setup](./agent-setup.md) |
| I want to know which workflow gives better results. | Decision guide | [Choosing a Workflow](./choosing-a-workflow.md) |
| I need model/API/provider keys. | Provider setup | [Model and Provider Setup](./model-provider-setup.md) |
| Something failed. | Traceable debugging | [Troubleshooting](./troubleshooting.md) |
| I maintain or release this repository. | Release checklist | [Release and Maintenance](./release-maintenance.md) |
| 中文用户想快速定位。 | 中文索引 | [中文文档索引](./zh-CN/README.md) |

## Current Recommendation

| User type | Recommended path | Why |
|---|---|---|
| Non-technical creator | `npm run setup` then `npm run desktop` | Least cognitive load, local-first project folders, guided output choice. |
| GitHub/agent user | Install as a skill and ask the agent to read `AGENTS.md` / `SKILL.md` | Best quality today because the agent can inspect source files, run the pipeline, preview, fix, and export. |
| Team maintaining polished decks | Desktop for intake + Agent Skill for final production | Keeps the interface simple while preserving deep control. |
| API integrator | Use the documented direct API variables only as a reserved convention | The complete direct API worker adapter is not shipped in v2.0.0. |

## Trace Map

Every public support path should point to an inspectable artifact:

| Question | First check | Evidence to keep |
|---|---|---|
| Why will the app not start? | `npm run doctor` | Terminal output with secrets removed. |
| Did source extraction work? | `projects/.../desktop-manifest.json` | `sourceExtraction.status`, `sources/source.md`. |
| Where did the output go? | Workbench export panel or manifest | `generatedFiles`, `outputs/`, `previews/`. |
| Why does a deck look wrong? | Project log and source markdown | `logs/desktop-worker.log`, redacted source excerpt. |
| Which agent instructions are active? | `AGENTS.md`, `CLAUDE.md`, `PROMPT.md` | Agent prompt and local skill path. |
| Is CI healthy? | `.github/workflows/ci.yml` | Desktop build, worker tests, audit, whitespace check. |
| How was upstream synced? | `UPSTREAM_SYNC.md` | Upstream baseline and adaptation notes. |

## External References

These docs informed the repository guidance:

- [OpenAI Codex CLI](https://developers.openai.com/codex/cli): Codex can run locally, read/change code, and run commands in the selected directory.
- [OpenAI AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md): Codex reads `AGENTS.md` before work.
- [OpenAI API authentication](https://developers.openai.com/api/reference/overview): API keys are secrets and should be loaded from environment variables or key management.
- [Claude Code settings](https://code.claude.com/docs/en/settings): Claude Code uses `CLAUDE.md`, settings, skills, and MCP configuration.
- [Claude Code memory](https://code.claude.com/docs/en/memory): project-level `CLAUDE.md` is the shared place for build commands and project conventions.
- [GitHub issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository): issue forms provide structured support paths.
- [Tauri distribution](https://v2.tauri.app/distribute/): native desktop distribution uses Tauri build and bundle commands.

