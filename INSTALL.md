# 安装指南 / Installation Guide

**中文** | [English](#english)

终极融合PPT大师是一个跨 Agent 的技能包。它不是只为 Codex 准备的：任何能读取本地 Markdown 指令、访问文件系统、运行 Python/Node/Bash 脚本的 AI 编程助手，都可以使用它。

## 快速选择

| 工具 | 推荐方式 |
|---|---|
| Codex | 安装到 `~/.codex/skills/ultimate-ppt-master` |
| Claude Code | 安装到 `~/.claude/skills/ultimate-ppt-master` |
| OpenClaw / Hermes / 类 Claude Code Agent | 克隆仓库，并在工具的规则/技能/项目上下文里引用 `AGENTS.md` 或 `SKILL.md` |
| Cursor / Cline / Roo Code / Windsurf 等 AI IDE | 克隆到项目或全局目录，并把 `AGENTS.md` / `PROMPT.md` 加入项目规则 |
| 不支持 skill 目录的工具 | 复制 `PROMPT.md` 到系统提示、项目规则或自定义指令 |

## 1. Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

重启 Codex 后使用：

```text
使用 $ultimate-ppt-master 帮我做一个 PPT
```

## 2. Claude Code

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.claude/skills/ultimate-ppt-master
cd ~/.claude/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
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
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
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

至少需要 Python 3.10+。

```bash
python3.10 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

macOS 上如果要保证 PPTX 兼容导出，建议安装 Cairo：

```bash
brew install cairo pkg-config
```

## 更新

```bash
cd <ultimate-ppt-master path>
git pull
.venv/bin/python -m pip install -r requirements.txt
```

## 验证

检查文件：

```bash
ls SKILL.md AGENTS.md CLAUDE.md PROMPT.md README.md
```

检查 Python 环境：

```bash
.venv/bin/python --version
```

如果你使用 Codex 的 skill 校验脚本，可以运行：

```bash
python ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
```

---

## English

Ultimate Fusion PPT Master is a cross-agent skill package. It is not Codex-only: any AI coding assistant that can read local Markdown instructions, access the filesystem, and run Python/Node/Bash scripts can use it.

## Quick Pick

| Tool | Recommended method |
|---|---|
| Codex | Install to `~/.codex/skills/ultimate-ppt-master` |
| Claude Code | Install to `~/.claude/skills/ultimate-ppt-master` |
| OpenClaw / Hermes / Claude Code-like agents | Clone the repo and point the tool at `AGENTS.md` or `SKILL.md` |
| Cursor / Cline / Roo Code / Windsurf-style AI IDEs | Clone into a project/global folder and reference `AGENTS.md` / `PROMPT.md` in project rules |
| Tools without native skills | Paste `PROMPT.md` into system prompt, project rules, or custom instructions |

## 1. Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

Restart Codex, then ask:

```text
Use $ultimate-ppt-master to make a PPT.
```

## 2. Claude Code

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.claude/skills/ultimate-ppt-master
cd ~/.claude/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
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
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
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

Python 3.10+ is required.

```bash
python3.10 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

For robust PPTX compatibility output on macOS:

```bash
brew install cairo pkg-config
```

## Update

```bash
cd <ultimate-ppt-master path>
git pull
.venv/bin/python -m pip install -r requirements.txt
```

## Verify

```bash
ls SKILL.md AGENTS.md CLAUDE.md PROMPT.md README.md
.venv/bin/python --version
```
