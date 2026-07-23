# 安装指南 / Installation Guide

**中文** | [English](#english)

终极融合PPT大师是一个跨 Agent 的技能包。它不是只为 Codex 准备的：任何能读取本地 Markdown 指令、访问文件系统、运行 Python/Node/Bash 脚本的 AI 编程助手，都可以使用它。

完整文档入口见 [`docs/README.md`](./docs/README.md)，中文索引见 [`docs/zh-CN/README.md`](./docs/zh-CN/README.md)。如果你只想快速安装，继续看本文件。

## 快速选择

| 工具 | 推荐方式 |
|---|---|
| Desktop App | 克隆仓库后运行 `npm run setup` 和 `npm run desktop` |
| Codex | 安装到 `~/.codex/skills/ultimate-ppt-master` 后运行 `npm run setup` |
| Claude Code | 安装到 `~/.claude/skills/ultimate-ppt-master` 后运行 `npm run setup` |
| OpenClaw / Hermes / 类 Claude Code Agent | 克隆仓库，运行 `npm run setup`，并在工具的规则/技能/项目上下文里引用 `AGENTS.md` 或 `SKILL.md` |
| Cursor / Cline / Roo Code / Windsurf 等 AI IDE | 克隆到项目或全局目录，并把 `AGENTS.md` / `PROMPT.md` 加入项目规则 |
| 不支持 skill 目录的工具 | 复制 `PROMPT.md` 到系统提示、项目规则或自定义指令 |

## 一键桌面端安装

推荐从仓库根目录启动，避免手动进入多个子目录：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

如果你不想使用根目录 npm 脚本，可以直接运行：

```bash
bash scripts/bootstrap.sh
# or profiled: bash scripts/bootstrap.sh --profile pptx
bash scripts/run-desktop.sh
```

环境检查：

```bash
npm run doctor
```

`npm run setup` 会创建 `.venv`、安装 Python 依赖、安装桌面端 npm 依赖，并生成 `~/.ppt-master/.env` 模板。它不会自动安装 Rust、Homebrew、Cairo 这类系统依赖；缺什么可以用 `npm run doctor` 看清楚。

## 1. Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
# 如果 Agent 环境没有 Node/npm，可用：bash scripts/bootstrap.sh
# or profiled: bash scripts/bootstrap.sh --profile pptx
```

重启 Codex 后使用：

```text
使用 $ultimate-ppt-master 帮我做一个 PPT
```

## 2. Claude Code

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.claude/skills/ultimate-ppt-master
cd ~/.claude/skills/ultimate-ppt-master
npm run setup
# 如果 Agent 环境没有 Node/npm，可用：bash scripts/bootstrap.sh
# or profiled: bash scripts/bootstrap.sh --profile pptx
```

Claude Code 可读取 `CLAUDE.md` 和 `SKILL.md`。如果你的 Claude Code 环境没有自动发现该 skill，请在对话中说明：

```text
请使用 ~/.claude/skills/ultimate-ppt-master/SKILL.md 作为 PPT 生成技能。
```

## 3. OpenClaw / Hermes / 类 Claude Code Agent

不同工具的技能目录名称可能不同，因此不要强依赖某个固定路径。推荐通用方式：

```bash
mkdir -p ~/agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
npm run setup
# 如果 Agent 环境没有 Node/npm，可用：bash scripts/bootstrap.sh
# or profiled: bash scripts/bootstrap.sh --profile pptx
```

然后在 OpenClaw、Hermes 或类似工具的项目规则、技能配置、上下文文件里引用：

```text
Use ~/agent-skills/ultimate-ppt-master/AGENTS.md as the entry file.
For PPT generation, follow ~/agent-skills/ultimate-ppt-master/SKILL.md.
```

如果工具支持“项目级规则文件”，也可以把 `AGENTS.md` 的内容复制进去。

## 4. Cursor / Cline / Roo Code / Windsurf 等 AI IDE

推荐放到项目根目录的工具目录里，例如：

```bash
mkdir -p .agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git .agent-skills/ultimate-ppt-master
```

然后把这句加入你的项目规则：

```text
When asked to make a PPT, presentation, slide deck, PowerPoint, 演示文稿, or 幻灯片, read .agent-skills/ultimate-ppt-master/AGENTS.md and follow .agent-skills/ultimate-ppt-master/SKILL.md.
```

## 5. 没有技能目录的工具

1. 克隆仓库到任意本地目录。
2. 打开 `PROMPT.md`。
3. 把里面的提示复制到工具的 system prompt、custom instruction、project rules 或长期记忆中。
4. 把仓库路径告诉工具。

## 依赖

至少需要 Python 3.10+。推荐直接使用一键脚本：

```bash
npm run setup
```

手动安装方式仍然可用：

```bash
python3.10 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

如果使用网页 PPT 的 Swiss Style 校验器，需要本机有 Node.js：

```bash
node --version
node scripts/validate-swiss-deck.mjs <project_path>/ppt/index.html
```

macOS 上如果要保证 PPTX 兼容导出，建议安装 Cairo：

```bash
brew install cairo pkg-config
```

## 桌面应用

桌面应用位于 `apps/desktop`，第一版使用 Tauri + React/TypeScript + 本地 Python worker。

从仓库根目录运行桌面端：

```bash
npm run desktop
```

构建前端：

```bash
npm run build:desktop
```

运行原生 Tauri 应用需要安装 Rust：

```bash
npm run app:desktop
```

如果没有 Rust，仍然可以使用 `npm run desktop` 验证桌面 UI 和浏览器 fallback 流程。

## 更新

```bash
cd <ultimate-ppt-master path>
git pull
npm run setup
```

## 验证

检查文件：

```bash
ls SKILL.md AGENTS.md CLAUDE.md PROMPT.md README.md
```

检查 Python 环境：

```bash
.venv/bin/python --version
npm run doctor
```

如果你使用 Codex 的 skill 校验脚本，可以运行：

```bash
python ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
```

发布前本地检查：

```bash
npm run doctor
npm run build:desktop
npm --prefix apps/desktop audit
npm run test:worker
git diff --check
```

公开脱敏样例见 `examples/desktop-cultural-tourism-demo`。真实业务 DOCX 和原样生成件默认只保留在本地 `projects/` 目录，不应提交到公开仓库。

---

## English

Ultimate Fusion PPT Master is a cross-agent skill package. It is not Codex-only: any AI coding assistant that can read local Markdown instructions, access the filesystem, and run Python/Node/Bash scripts can use it.

The full documentation map lives at [`docs/README.md`](./docs/README.md). If you only want installation commands, continue here.

## Quick Pick

| Tool | Recommended method |
|---|---|
| Desktop App | Clone the repo, then run `npm run setup` and `npm run desktop` |
| Codex | Install to `~/.codex/skills/ultimate-ppt-master`, then run `npm run setup` |
| Claude Code | Install to `~/.claude/skills/ultimate-ppt-master`, then run `npm run setup` |
| OpenClaw / Hermes / Claude Code-like agents | Clone the repo, run `npm run setup`, and point the tool at `AGENTS.md` or `SKILL.md` |
| Cursor / Cline / Roo Code / Windsurf-style AI IDEs | Clone into a project/global folder and reference `AGENTS.md` / `PROMPT.md` in project rules |
| Tools without native skills | Paste `PROMPT.md` into system prompt, project rules, or custom instructions |

## One-command Desktop Setup

Start from the repository root:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

Script fallback:

```bash
bash scripts/bootstrap.sh
# or profiled: bash scripts/bootstrap.sh --profile pptx
bash scripts/run-desktop.sh
```

Environment check:

```bash
npm run doctor
```

`npm run setup` creates `.venv`, installs Python dependencies, installs desktop npm dependencies, and creates a `~/.ppt-master/.env` template. It does not install system dependencies such as Rust, Homebrew, or Cairo automatically; `npm run doctor` tells you exactly what is missing.

## 1. Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
# No Node/npm in this agent environment? Use: bash scripts/bootstrap.sh
# or profiled: bash scripts/bootstrap.sh --profile pptx
```

Restart Codex, then ask:

```text
Use $ultimate-ppt-master to make a PPT.
```

## 2. Claude Code

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.claude/skills/ultimate-ppt-master
cd ~/.claude/skills/ultimate-ppt-master
npm run setup
# No Node/npm in this agent environment? Use: bash scripts/bootstrap.sh
# or profiled: bash scripts/bootstrap.sh --profile pptx
```

If your Claude Code setup does not auto-discover the skill, tell it:

```text
Use ~/.claude/skills/ultimate-ppt-master/SKILL.md as the PPT generation skill.
```

## 3. OpenClaw / Hermes / Claude Code-like Agents

Because agent tools use different directory conventions, use a neutral location:

```bash
mkdir -p ~/agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
npm run setup
# No Node/npm in this agent environment? Use: bash scripts/bootstrap.sh
# or profiled: bash scripts/bootstrap.sh --profile pptx
```

Then add this to the tool's rules, skill config, or project context:

```text
Use ~/agent-skills/ultimate-ppt-master/AGENTS.md as the entry file.
For PPT generation, follow ~/agent-skills/ultimate-ppt-master/SKILL.md.
```

## 4. Cursor / Cline / Roo Code / Windsurf-style AI IDEs

For project-local use:

```bash
mkdir -p .agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git .agent-skills/ultimate-ppt-master
```

Add this to project rules:

```text
When asked to make a PPT, presentation, slide deck, PowerPoint, 演示文稿, or 幻灯片, read .agent-skills/ultimate-ppt-master/AGENTS.md and follow .agent-skills/ultimate-ppt-master/SKILL.md.
```

## 5. Tools Without Native Skills

1. Clone the repo anywhere locally.
2. Open `PROMPT.md`.
3. Paste its contents into the tool's system prompt, custom instructions, project rules, or long-term memory.
4. Tell the tool the local repository path.

## Dependencies

Python 3.10+ is required. Recommended:

```bash
npm run setup
```

Manual setup is still available:

```bash
python3.10 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

Node.js is needed only for the Magazine Web Deck Swiss Style validator:

```bash
node --version
node scripts/validate-swiss-deck.mjs <project_path>/ppt/index.html
```

For robust PPTX compatibility output on macOS:

```bash
brew install cairo pkg-config
```

## Desktop App

The desktop app lives in `apps/desktop` and uses Tauri + React/TypeScript + a local Python worker.

Run the desktop app from the repository root:

```bash
npm run desktop
```

Build the frontend:

```bash
npm run build:desktop
```

Native Tauri mode requires Rust:

```bash
npm run app:desktop
```

Without Rust, `npm run desktop` still validates the desktop UI and browser fallback flow.

## Update

```bash
cd <ultimate-ppt-master path>
git pull
npm run setup
```

## Verify

```bash
ls SKILL.md AGENTS.md CLAUDE.md PROMPT.md README.md
.venv/bin/python --version
npm run doctor
```

Release candidate checks:

```bash
npm run build:desktop
npm --prefix apps/desktop audit
npm run test:worker
git diff --check
```

The public sanitized demo lives in `examples/desktop-cultural-tourism-demo`. Raw business DOCX files and raw generated outputs should stay under local ignored project folders.
