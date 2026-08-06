# 安装指南 / Installation Guide

**中文** | [English](#english)

**保真改 PPT**（仓库名 `ultimate-ppt-master-skill`）是一个跨 Agent 的技能包：主能力是**在已有品牌 PPT 上指哪改哪、其余原样不动**；次要能力才是从资料生成可编辑 PPTX / 杂志风 Web Deck。

它不是只为 Codex 准备的：任何能读取本地 Markdown 指令、访问文件系统、运行 Python/Node/Bash 脚本的 AI 编程助手，都可以使用它。产品说明见根目录 [`README.md`](./README.md)。

完整文档入口见 [`docs/README.md`](./docs/README.md)，中文索引见 [`docs/zh-CN/README.md`](./docs/zh-CN/README.md)。如果你只想快速安装，继续看本文件。

## 快速选择

| 你想… | 推荐方式 |
|---|---|
| 统一 CLI 生成/修改/精修 | 克隆后 `bash scripts/bootstrap.sh --profile core` → `bin/upm doctor` → `bin/upm make "主题"` |
| Python 安装 `upm` 命令 | 仓库内 `.venv/bin/pip install .`，或在任意目录 `pip install .`（暴露 `upm` 命令） |
| 桌面拖拽改 PPT | 克隆后 `npm run setup` → `npm run desktop`（`setup` 会下载约 150MB Chromium；只改 PPT 可用 `--profile pptx`） |
| 一句话让 Agent 改 | `npx skills add kdnsna/ultimate-ppt-master-skill --skill ultimate-ppt-master` |
| 接任意 MCP 客户端 | `python3 scripts/ppt_preserve_mcp.py` |
| Codex | 装到 `~/.codex/skills/ultimate-ppt-master` 后 `npm run setup` |
| Claude Code | 装到 `~/.claude/skills/ultimate-ppt-master` 后 `npm run setup` |
| Cursor / Cline / Roo / Windsurf | 克隆到项目或全局，引用 `AGENTS.md` / `PROMPT.md` / `SKILL.md` |
| 无 skill 目录的工具 | 把 `PROMPT.md` 放进系统提示或项目规则 |

## 一键桌面端安装

推荐从仓库根目录启动，避免手动进入多个子目录：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

> ⚠️ `npm run setup`（profile `all`）会安装完整 Python 依赖、Web/桌面 npm 依赖，**并下载约 150MB 的 Chromium**（供视觉复核）。网速慢或只想改 PPT 时，建议用轻量 profile：`bash scripts/bootstrap.sh --profile pptx`（只装 Python 核心依赖，无 Chromium、无 npm 安装）。

如果你不想使用根目录 npm 脚本，可以直接运行：

```bash
bash scripts/bootstrap.sh --profile pptx   # 无 Node/npm 环境的推荐方式
bash scripts/run-desktop.sh                # 桌面端（需要 Node/npm 与 Python）
```

环境检查：

```bash
npm run doctor
bin/upm doctor --profile core   # v7 统一 CLI 环境检查（只报告，不安装）
```

## 0. v7 统一 CLI（推荐）

v7 之后，普通用户只需五条命令：

```bash
bin/upm make <source-or-topic>     # 生成可编辑 PPTX（DeckIR → PPTD → 导出 → 视觉 QA）
bin/upm edit <file.pptx> "修改要求" # 保真局部修改
bin/upm open <project>             # PPTD 视觉精修（127.0.0.1）
bin/upm review <project>           # 重新审计
bin/upm doctor [--profile ...]     # 环境检查
```

也可用 pip 安装：`pip install .` 会把 `upm` 命令安装到当前 Python 环境（仓库内推荐 `.venv/bin/pip install .`，避免污染全局环境）。

`npm run setup` 会创建 `.venv`、按 profile 安装 Python 依赖、安装桌面端 npm 依赖，并生成 `~/.ppt-master/.env` 模板。它不会自动安装 Rust 这类系统依赖；缺什么可以用 `npm run doctor` 看清楚（Rust 缺失只会告警——桌面端会降级为浏览器 UI，不会阻断保真编辑）。

## 1. Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
# 如果 Agent 环境没有 Node/npm：只装轻量 Python 依赖（保真编辑足够用）
bash scripts/bootstrap.sh --profile pptx
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
# 如果 Agent 环境没有 Node/npm：只装轻量 Python 依赖（保真编辑足够用）
bash scripts/bootstrap.sh --profile pptx
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
# 如果 Agent 环境没有 Node/npm：只装轻量 Python 依赖（保真编辑足够用）
bash scripts/bootstrap.sh --profile pptx
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
# Uses any Python 3.10+ found on PATH (python3.13 / 3.12 / 3.11 / 3.10 / python3)
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

如果使用网页 PPT 的 Swiss Style 校验器，需要本机有 Node.js：

```bash
node --version
node scripts/validate-swiss-deck.mjs <project_path>/ppt/index.html
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

Script fallback (no Node/npm? use `--profile pptx` — light Python deps only):

```bash
bash scripts/bootstrap.sh --profile pptx
bash scripts/run-desktop.sh
```

Environment check:

```bash
npm run doctor
```

`npm run setup` (profile `all`) creates `.venv`, installs Python dependencies, installs desktop npm dependencies, and creates a `~/.ppt-master/.env` template — and it downloads ~150MB of Chromium for visual review. Slow network or preserve-edit only? Use the light path: `bash scripts/bootstrap.sh --profile pptx` (no Chromium, no npm installs). Rust is not installed automatically; a missing Rust is only a warning — the desktop app degrades to a browser UI shell, and preserve-edit does not need it. `npm run doctor` tells you exactly what is missing.

## 1. Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
# No Node/npm in this agent environment? Install the light Python deps only:
bash scripts/bootstrap.sh --profile pptx
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
# No Node/npm in this agent environment? Install the light Python deps only:
bash scripts/bootstrap.sh --profile pptx
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
# No Node/npm in this agent environment? Install the light Python deps only:
bash scripts/bootstrap.sh --profile pptx
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
# Uses any Python 3.10+ found on PATH (python3.13 / 3.12 / 3.11 / 3.10 / python3)
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

Node.js is needed only for the Magazine Web Deck Swiss Style validator:

```bash
node --version
node scripts/validate-swiss-deck.mjs <project_path>/ppt/index.html
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
