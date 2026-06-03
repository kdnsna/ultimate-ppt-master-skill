# Agent Setup

Use this guide when you want Ultimate PPT Master to run as a portable agent skill.

For the lowest-friction public entry, start from the [Web Experience](./web-experience.md). Its Configuration page can install or update the Skill for Codex / generic local agents through Bridge; if Bridge is offline, it copies the same terminal commands shown below. Download the generated `handoff-kit.zip` when you want to continue production from a local project folder.

For skill marketplaces and agent directories, keep the public listing aligned
with [Skill Market Distribution](../strategy/skill-market-distribution.md). The listing
metadata lives in `agents/openai.yaml`; visual assets live in
`assets/skill-market/`.

## Prerequisites

- Python 3.10+
- Node.js/npm for desktop/Web Deck validation flows
- optional Rust/Cargo for native desktop packaging
- optional Cairo/pkg-config for stronger PPTX compatibility on macOS

Run:

```bash
npm run setup
npm run doctor
```

## Codex

Codex can run locally, inspect repositories, edit files, and run commands. This repository includes `AGENTS.md` because Codex reads `AGENTS.md` before work.

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
```

Ask:

```text
Use $ultimate-ppt-master to turn reports/q3-review.pdf into a 12-slide editable PPTX for an executive meeting.
```

If your Codex environment does not resolve skills by name, use:

```text
Read ~/.codex/skills/ultimate-ppt-master/AGENTS.md and follow SKILL.md.
Use that repository path as SKILL_DIR.
```

## Claude Code

Claude Code supports `CLAUDE.md` memory files, settings, skills, and MCP configuration. This repository includes `CLAUDE.md` so Claude has a concise project-level entry.

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.claude/skills/ultimate-ppt-master
cd ~/.claude/skills/ultimate-ppt-master
npm run setup
```

Ask:

```text
Use ~/.claude/skills/ultimate-ppt-master/SKILL.md as the PPT generation workflow.
Create an editable PPTX and verify it before delivery.
```

Recommended secret guardrail for Claude Code project settings:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./projects/private/**)"
    ]
  }
}
```

Use this only if it matches your workflow. The desktop Settings page can still detect whether keys exist without printing them.

## OpenClaw, Hermes, and Generic Local Agents

Directory conventions vary, so use a neutral local path:

```bash
mkdir -p ~/agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
npm run setup
```

Add this to the tool's project rules, skill config, bootstrap prompt, or local memory:

```text
Use ~/agent-skills/ultimate-ppt-master/AGENTS.md as the entry file.
For PPT, PowerPoint, slide deck, Web Deck, 演示文稿, or 幻灯片 requests, follow ~/agent-skills/ultimate-ppt-master/SKILL.md.
Set SKILL_DIR to ~/agent-skills/ultimate-ppt-master.
Keep private source documents and raw outputs outside git.
```

## Cursor, Cline, Roo Code, Windsurf, and AI IDEs

Project-local setup:

```bash
mkdir -p .agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git .agent-skills/ultimate-ppt-master
```

Project rule:

```text
When asked to make a PPT, presentation, slide deck, PowerPoint, 演示文稿, or 幻灯片, read .agent-skills/ultimate-ppt-master/AGENTS.md and follow .agent-skills/ultimate-ppt-master/SKILL.md.
```

## Prompt-only Tools

If the tool cannot read a skill directory:

1. Clone the repository locally.
2. Open `PROMPT.md`.
3. Paste it into the tool's system prompt, custom instructions, project rules, or long-term memory.
4. Tell the tool the absolute local path of this repository.

## Agent Handoff from Web Experience

The Web Experience creates a local Agent handoff kit without uploading source material. Prefer it for public onboarding because it captures:

- source type;
- delivery scenario;
- output mode;
- visual style;
- dual-engine route selection for PPTX and Web Deck;
- browser-local `preview-web-deck.html`;
- language;
- agent tool;
- model preference;
- extra requirements.

The zip includes `source.md`, `agent-prompt.md`, `project-brief.json`, `preview-web-deck.html`, `engine-plan.md`, `quality-checklist.md`, and `README.md`. After downloading it, provide the zip or extracted folder plus any real source file, source folder, or URL to your agent.

## Agent Handoff from Desktop

The desktop Workbench creates an Agent handoff prompt. Prefer that prompt because it contains:

- project directory;
- selected output mode;
- style preset;
- generated source markdown path;
- log path;
- next actions.
