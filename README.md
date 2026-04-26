# 终极融合PPT大师

**中文** | [English](#english)

终极融合PPT大师是一个跨 Agent 的演示文稿生成技能包。它支持 Codex、Claude Code、OpenClaw、Hermes，以及其他能读取 Markdown 指令并运行本地脚本的 AI 编程助手。

当用户说“做一个 PPT”时，它会先帮你选择要做哪种 PPT：适合正式交付的**可编辑 PowerPoint `.pptx`**，或适合演讲分享的**杂志风网页 PPT `index.html`**。

这个仓库基于 Hugo He 的开源项目 [ppt-master](https://github.com/hugohe3/ppt-master) 和 op7418 的 [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) 整理融合而来，保留核心工作流、脚本、模板和 MIT 许可署名，并增加了适合 Codex 直接安装和复用的开源包装。

## 亮点

- **先选风格**：用户泛泛说“做个 PPT”时，先解释两种输出的区别，再让用户选择。
- **跨 Agent 可用**：提供 `SKILL.md`、`AGENTS.md`、`CLAUDE.md`、`PROMPT.md`，适配 Codex、Claude Code、OpenClaw、Hermes 和通用 AI IDE。
- **可编辑 PPTX**：输出真实 PowerPoint 元素，而不是整页截图，适合正式汇报、咨询报告、培训课件。
- **杂志风网页 PPT**：输出单文件 HTML 横向翻页 deck，电子杂志/电子墨水视觉，适合线下分享、发布会、demo day。
- **多源输入**：支持 PDF、DOCX、PPTX、网页、Markdown 和直接粘贴的文本。
- **设计工作流**：包含策略规划、设计规格锁定、页面生成、质量检查和导出步骤。
- **模板资源**：内置布局、图表、图标和多种专业演示风格参考。
- **本地优先**：材料处理和文件生成主要在本地完成。

## 两种输出模式

| 模式 | 输出 | 适合 | 特点 |
|---|---|---|---|
| 可编辑 PowerPoint | `.pptx` | 正式汇报、商业/咨询报告、培训课件、需要交给别人继续改 | PowerPoint 里可编辑文字、形状和图表 |
| 杂志风网页 PPT | `index.html` | 线下分享、产品发布、个人演讲、demo day、强视觉展示 | 横向翻页、WebGL 背景、电子杂志风、动效更强 |

## 安装

完整多平台安装说明见 [INSTALL.md](./INSTALL.md)。

| 平台 / 工具 | 推荐入口 |
|---|---|
| Codex | `~/.codex/skills/ultimate-ppt-master` |
| Claude Code | `~/.claude/skills/ultimate-ppt-master` |
| OpenClaw / Hermes | 克隆仓库后在规则或技能配置中引用 `AGENTS.md` / `SKILL.md` |
| Cursor / Cline / Roo Code / Windsurf 等 AI IDE | 克隆到项目或全局目录，把 `AGENTS.md` / `PROMPT.md` 加入项目规则 |
| 不支持 skill 目录的工具 | 复制 `PROMPT.md` 到 system prompt / project rules / custom instructions |

Codex 快速安装：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
```

安装 Python 依赖：

```bash
cd ~/.codex/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

macOS 上如果需要兼容导出 PNG 后备图，建议安装 Cairo：

```bash
brew install cairo pkg-config
```

重启对应 Agent 工具后即可使用。

## 使用方式

在 Codex 里直接说：

```text
使用 $ultimate-ppt-master 帮我把 reports/q3-report.pdf 做成 10 页中文 PPT。
```

终极融合PPT大师会先问你选哪一种：

```text
1. 可编辑 PowerPoint（PPTX）
2. 杂志风网页 PPT（HTML）
```

你也可以直接指定：

```text
Use $ultimate-ppt-master to create an editable 16:9 PPTX from this Markdown file.
```

```text
使用 $ultimate-ppt-master 做一份杂志风网页 PPT，用于 20 分钟线下分享。
```

可编辑 PPTX 模式会按以下主流程执行：

1. 转换或读取源材料。
2. 创建项目目录。
3. 确认画布、页数、受众、风格、配色、字体、图标和图片策略。
4. 生成 `design_spec.md` 和 `spec_lock.md`。
5. 按页生成 SVG。
6. 后处理、质量检查并导出 PPTX。

杂志风网页 PPT 模式会按以下主流程执行：

1. 澄清受众、时长、素材、图片、主题和硬约束。
2. 复制 `assets/magazine-web/template.html` 到项目目录。
3. 从 5 套主题和 10 种布局骨架中选择。
4. 填充单文件 HTML deck。
5. 对照 `references/magazine-web/checklist.md` 自检。
6. 直接在浏览器打开 `index.html` 预览和迭代。

## 重要目录

- `SKILL.md`：Codex skill 主工作流。
- `AGENTS.md`：OpenClaw、Hermes、Codex CLI、通用 Agent 工具入口。
- `CLAUDE.md`：Claude Code / 类 Claude Code 工具入口。
- `PROMPT.md`：无原生 skill 目录工具的复制粘贴提示。
- `INSTALL.md`：多平台安装指南。
- `scripts/`：源材料转换、项目管理、SVG 检查、SVG 转 PPTX 等脚本。
- `assets/magazine-web/`：杂志风网页 PPT 的 HTML 模板和本地动效兜底。
- `templates/`：布局、图表、图标和设计规格模板。
- `references/`：策略师、执行器、图片生成和共享标准等角色说明。
- `references/magazine-web/`：杂志风网页 PPT 的主题、布局、组件和检查清单。
- `workflows/`：独立扩展工作流，例如创建新模板。

## 致谢与许可

终极融合PPT大师基于 [ppt-master](https://github.com/hugohe3/ppt-master) 和 [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) 整理融合。原作者分别为 Hugo He 和 op7418（歸藏）。原项目和本仓库均采用 MIT License。使用、修改或分发时请保留版权和许可声明，详见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

---

## English

**Ultimate Fusion PPT Master** is a cross-agent presentation-generation skill package. It works with Codex, Claude Code, OpenClaw, Hermes, and other AI coding assistants that can read Markdown instructions and run local scripts.

For generic PPT requests, it first helps the user choose between an editable PowerPoint `.pptx` deck and an editorial magazine-style web deck (`index.html`).

This repository combines Hugo He's open-source [ppt-master](https://github.com/hugohe3/ppt-master) with op7418's [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill). It preserves the original workflows, scripts, templates, and MIT attribution, while adding a Codex-ready open-source wrapper.

## Highlights

- **Style chooser first**: For generic "make a PPT" requests, Ultimate Fusion PPT Master explains both output modes before generating.
- **Cross-agent friendly**: Ships `SKILL.md`, `AGENTS.md`, `CLAUDE.md`, and `PROMPT.md` for Codex, Claude Code, OpenClaw, Hermes, and generic AI IDEs.
- **Editable PPTX output**: Generates real PowerPoint elements instead of slide screenshots, ideal for formal reports, consulting decks, and training material.
- **Magazine-style web decks**: Generates a single-file horizontal-swipe HTML deck with an editorial/e-ink aesthetic, ideal for talks, launches, and demo days.
- **Multi-source input**: Supports PDF, DOCX, PPTX, web pages, Markdown, and pasted text.
- **Structured design workflow**: Covers strategy, design spec locking, page generation, quality checks, and export.
- **Built-in resources**: Includes layouts, charts, icons, and professional presentation references.
- **Local-first pipeline**: Source processing and file generation primarily run on your machine.

## Output Modes

| Mode | Output | Best for | Traits |
|---|---|---|---|
| Editable PowerPoint | `.pptx` | formal reporting, business/consulting decks, training decks, files others need to edit | editable text, shapes, and charts in PowerPoint |
| Magazine Web Deck | `index.html` | talks, launches, personal keynotes, demo days, visual showcases | horizontal swipe navigation, WebGL background, editorial style, stronger motion |

## Installation

See [INSTALL.md](./INSTALL.md) for the full multi-platform guide.

| Platform / Tool | Recommended entry |
|---|---|
| Codex | `~/.codex/skills/ultimate-ppt-master` |
| Claude Code | `~/.claude/skills/ultimate-ppt-master` |
| OpenClaw / Hermes | Clone the repo and reference `AGENTS.md` / `SKILL.md` in rules or skill config |
| Cursor / Cline / Roo Code / Windsurf-style AI IDEs | Clone into a project/global folder and include `AGENTS.md` / `PROMPT.md` in project rules |
| Tools without native skills | Paste `PROMPT.md` into system prompt / project rules / custom instructions |

Quick Codex install:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
```

Install Python dependencies:

```bash
cd ~/.codex/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

On macOS, install Cairo if you want robust PNG fallback generation for PowerPoint compatibility:

```bash
brew install cairo pkg-config
```

Restart your agent tool after installation.

## Usage

Ask Codex:

```text
Use $ultimate-ppt-master to create a 10-slide editable PPTX from reports/q3-report.pdf.
```

For generic PPT requests, Ultimate Fusion PPT Master first asks you to choose:

```text
1. Editable PowerPoint (PPTX)
2. Magazine-style web deck (HTML)
```

You can also specify the mode directly:

```text
使用 $ultimate-ppt-master 帮我把这篇 Markdown 做成 16:9 演示文稿。
```

```text
Use $ultimate-ppt-master to make a magazine-style web deck for a 20-minute talk.
```

Editable PPTX mode follows this pipeline:

1. Convert or read source material.
2. Create a project directory.
3. Confirm canvas, page count, audience, style, colors, typography, icons, and image strategy.
4. Generate `design_spec.md` and `spec_lock.md`.
5. Generate SVG pages sequentially.
6. Post-process, quality-check, and export to PPTX.

Magazine Web Deck mode follows this pipeline:

1. Clarify audience, duration, source material, images, theme, and constraints.
2. Copy `assets/magazine-web/template.html` into the project.
3. Pick from five themes and ten layout skeletons.
4. Fill a single-file HTML deck.
5. Check against `references/magazine-web/checklist.md`.
6. Open `index.html` directly in the browser for preview and iteration.

## Repository Layout

- `SKILL.md`: Main Codex skill workflow.
- `AGENTS.md`: Entry file for OpenClaw, Hermes, Codex CLI, and generic agent tools.
- `CLAUDE.md`: Entry file for Claude Code and Claude Code-like tools.
- `PROMPT.md`: Copy-paste prompt for tools without native skill directories.
- `INSTALL.md`: Multi-platform installation guide.
- `scripts/`: Source conversion, project management, SVG checks, and SVG-to-PPTX export.
- `assets/magazine-web/`: HTML template and local motion fallback for magazine-style web decks.
- `templates/`: Layout, chart, icon, and design-spec templates.
- `references/`: Strategist, executor, image-generation, and shared-standard references.
- `references/magazine-web/`: Themes, layouts, components, and checklist for magazine-style web decks.
- `workflows/`: Standalone extensions such as template creation.

## Credits and License

Ultimate Fusion PPT Master combines [ppt-master](https://github.com/hugohe3/ppt-master), created by Hugo He, and [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill), created by op7418 (歸藏). The original projects and this repository are released under the MIT License. Keep the copyright and license notices when using, modifying, or redistributing the software. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
