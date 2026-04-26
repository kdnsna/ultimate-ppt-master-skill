# DeckWeaver

**中文** | [English](#english)

DeckWeaver 是一个面向 Codex 的演示文稿生成 skill。它把 PDF、DOCX、网页、Markdown 或对话中的内容整理为高质量 SVG 页面，再导出为真正可编辑的 PowerPoint `.pptx` 文件。

这个仓库基于 Hugo He 的开源项目 [ppt-master](https://github.com/hugohe3/ppt-master) 整理而来，保留其核心工作流、脚本、模板和 MIT 许可署名，并增加了适合 Codex 直接安装和复用的开源包装。

## 亮点

- **可编辑 PPTX**：输出真实 PowerPoint 元素，而不是整页截图。
- **多源输入**：支持 PDF、DOCX、PPTX、网页、Markdown 和直接粘贴的文本。
- **设计工作流**：包含策略规划、设计规格锁定、页面生成、质量检查和导出步骤。
- **模板资源**：内置布局、图表、图标和多种专业演示风格参考。
- **本地优先**：材料处理和文件生成主要在本地完成。

## 安装

把仓库克隆到 Codex skills 目录：

```bash
git clone https://github.com/kdnsna/deckweaver-skill.git ~/.codex/skills/deckweaver
```

安装 Python 依赖：

```bash
cd ~/.codex/skills/deckweaver
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

macOS 上如果需要兼容导出 PNG 后备图，建议安装 Cairo：

```bash
brew install cairo pkg-config
```

重启 Codex 后即可使用。

## 使用方式

在 Codex 里直接说：

```text
使用 $deckweaver 帮我把 reports/q3-report.pdf 做成 10 页中文 PPT。
```

或：

```text
Use $deckweaver to create an editable 16:9 PPTX from this Markdown file.
```

skill 会按以下主流程执行：

1. 转换或读取源材料。
2. 创建项目目录。
3. 确认画布、页数、受众、风格、配色、字体、图标和图片策略。
4. 生成 `design_spec.md` 和 `spec_lock.md`。
5. 按页生成 SVG。
6. 后处理、质量检查并导出 PPTX。

## 重要目录

- `SKILL.md`：Codex skill 主工作流。
- `scripts/`：源材料转换、项目管理、SVG 检查、SVG 转 PPTX 等脚本。
- `templates/`：布局、图表、图标和设计规格模板。
- `references/`：策略师、执行器、图片生成和共享标准等角色说明。
- `workflows/`：独立扩展工作流，例如创建新模板。

## 致谢与许可

DeckWeaver 基于 [ppt-master](https://github.com/hugohe3/ppt-master) 整理，原作者为 Hugo He。原项目和本仓库均采用 MIT License。使用、修改或分发时请保留版权和许可声明。

---

## English

**DeckWeaver** is a Codex skill for generating editable presentation decks. It turns PDFs, DOCX files, web pages, Markdown, or pasted conversation content into polished SVG pages and exports them as real, editable PowerPoint `.pptx` files.

This repository is packaged from Hugo He's open-source [ppt-master](https://github.com/hugohe3/ppt-master). It preserves the original workflow, scripts, templates, and MIT attribution, while adding a Codex-ready open-source wrapper.

## Highlights

- **Editable PPTX output**: Generates real PowerPoint elements instead of slide screenshots.
- **Multi-source input**: Supports PDF, DOCX, PPTX, web pages, Markdown, and pasted text.
- **Structured design workflow**: Covers strategy, design spec locking, page generation, quality checks, and export.
- **Built-in resources**: Includes layouts, charts, icons, and professional presentation references.
- **Local-first pipeline**: Source processing and file generation primarily run on your machine.

## Installation

Clone the repository into your Codex skills directory:

```bash
git clone https://github.com/kdnsna/deckweaver-skill.git ~/.codex/skills/deckweaver
```

Install Python dependencies:

```bash
cd ~/.codex/skills/deckweaver
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

On macOS, install Cairo if you want robust PNG fallback generation for PowerPoint compatibility:

```bash
brew install cairo pkg-config
```

Restart Codex after installation.

## Usage

Ask Codex:

```text
Use $deckweaver to create a 10-slide editable PPTX from reports/q3-report.pdf.
```

Or:

```text
使用 $deckweaver 帮我把这篇 Markdown 做成 16:9 演示文稿。
```

The skill follows this pipeline:

1. Convert or read source material.
2. Create a project directory.
3. Confirm canvas, page count, audience, style, colors, typography, icons, and image strategy.
4. Generate `design_spec.md` and `spec_lock.md`.
5. Generate SVG pages sequentially.
6. Post-process, quality-check, and export to PPTX.

## Repository Layout

- `SKILL.md`: Main Codex skill workflow.
- `scripts/`: Source conversion, project management, SVG checks, and SVG-to-PPTX export.
- `templates/`: Layout, chart, icon, and design-spec templates.
- `references/`: Strategist, executor, image-generation, and shared-standard references.
- `workflows/`: Standalone extensions such as template creation.

## Credits and License

DeckWeaver is packaged from [ppt-master](https://github.com/hugohe3/ppt-master), created by Hugo He. The original project and this repository are released under the MIT License. Keep the copyright and license notices when using, modifying, or redistributing the software.
