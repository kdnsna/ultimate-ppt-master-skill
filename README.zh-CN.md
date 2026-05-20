# 终极融合 PPT 大师 - AI PPT 生成器 / 可编辑 PowerPoint / 网页演示

> 面向 Agent 的 AI PPT 生成器：把 PDF、Word、Excel、旧 PPT、网页、Markdown 和粘贴文本，变成可编辑 PPTX 或高质感网页 PPT。

<p align="center">
  <strong>v2.0.0</strong> · <a href="./README.md">English README</a> · 中文
</p>

![终极融合 PPT 大师封面](assets/readme/hero.svg)

<p align="center">
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill"><img alt="GitHub Repo" src="https://img.shields.io/badge/GitHub-ultimate--ppt--master--skill-111827?style=for-the-badge&logo=github"></a>
  <img alt="Version 2.0.0" src="https://img.shields.io/badge/Version-2.0.0-7C3AED?style=for-the-badge">
  <img alt="AI PPT Generator" src="https://img.shields.io/badge/AI%20PPT-Generator-F97316?style=for-the-badge">
  <img alt="PowerPoint Automation" src="https://img.shields.io/badge/PowerPoint-Automation-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-C8A24A?style=for-the-badge">
  <img alt="Python 3.10+" src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img alt="PowerPoint" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="HTML Decks" src="https://img.shields.io/badge/Output-Magazine%20HTML-111827?style=for-the-badge">
  <img alt="Local first" src="https://img.shields.io/badge/Local--first-Agent%20Workflow-10B981?style=for-the-badge">
</p>

如果你是在 GitHub 搜 **PPT**、**AI PPT**、**PPT 生成器**、**PowerPoint 自动化**、**PPTX 生成**、**演示文稿 Agent**，这个项目想解决的是最痛的那一步：不只是生成一组漂亮截图，而是生成能编辑、能复盘、能交付、能继续迭代的 PPT。

大多数 AI PPT 工具能给你一份“看起来像 PPT”的结果，但真正的问题往往在生成之后：页面不可编辑、品牌体系不稳定、内容没有来源约束、想改一页就要重做。**终极融合 PPT 大师解决的是初稿之后的真实工作流。**

它是一个面向 Codex、Claude Code、OpenClaw、Hermes、Cursor 类 IDE 和通用 Agent 的本地技能包。把真实材料拖进来，选择交付场景，然后生成两类可交付成果：

| 你的需求 | 它输出什么 |
|---|---|
| 商务汇报、咨询报告、培训课件、投资人更新、客户交付 | **可编辑 PowerPoint (`.pptx`)**：真实文本框、形状、图表、演讲备注、动画和可选旁白 |
| 发布会、demo day、产品故事、内部分享、强视觉演讲 | **杂志风网页 PPT (`index.html`)**：横向翻页、动效、WebGL 氛围和高设计感版式 |

核心不是“一句话随机生成 PPT”，而是：先理解资料和场景，锁定设计规范，逐页生成，预览检查，最后导出真正能使用的演示文稿。

**一句话定位：**把杂乱真实资料变成可编辑 PowerPoint 和高级网页演示，同时尽量不把你的文件锁进某个 SaaS。

---

## v2.0.0 本次更新

v2.0.0 是一次融合型大版本：同步两位开源作者的最新能力，并把它们适配成一个统一、可复用、跨 Agent 的工作流。

| 更新项 | 具体变化 |
|---|---|
| **同步上游更新** | 同步 `hugohe3/ppt-master` 与 `op7418/guizang-ppt-skill` 的最新实现，同时保留本仓库自己的跨 Agent 适配层。 |
| **双模式选择器** | 当用户只说“帮我做 PPT”时，先明确选择“可编辑 PPTX”还是“杂志风网页 PPT”，避免输出方向错位。 |
| **资料输入增强** | 强化 PDF、DOCX、XLSX、PPTX、URL、Markdown 和直接粘贴文本的处理流程。 |
| **PPTX 引擎升级** | 更新源文件转换、SVG 到 PPTX、质量检查、图表模板、动画配置、演讲备注、旁白音频和实时预览能力。 |
| **网页 PPT 引擎升级** | 保留默认“电子杂志 x 电子墨水”风格，并新增可选“瑞士国际主义 / Swiss Style”风格，适合数据、产品、工程和信息设计类演示。 |
| **图片工作流扩展** | 增加图片搜索、AI 生图、多提供商配置、提示词模板、配色参考、渲染风格参考和图片版式模式。 |
| **README 重构** | 重新设计 GitHub 首页，加入产品化定位、高端风格配图、用户需求分析、双语入口和更清晰的项目卖点表达。 |
| **多 Agent 安装指南** | 补充 Codex、Claude Code、OpenClaw、Hermes、通用 Agent 和只支持 Prompt 的工具接入方式。 |

精确的上游同步基线和后续同步策略见 [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md)。

---

## 为什么这个项目值得 Star

GitHub 用户真正需要的不是“漂亮截图”，而是能进入工作流的演示文稿工具。

| 用户需求 | 痛点 | 本项目的解决方式 |
|---|---|---|
| **输出可编辑** | AI 生成后还要给团队、客户、领导继续改 | 输出原生 PPTX 元素，不是整页截图 |
| **基于真实资料** | 正式汇报通常来自报告、表格、网页、旧 PPT 和 Markdown | 支持 PDF、DOCX、XLSX、PPTX、URL、Markdown 和粘贴文本 |
| **本地优先** | 开发者不想被单一 SaaS 锁死 | 本地脚本 + Agent 技能包，模型和文件都可控 |
| **设计质量稳定** | AI 容易随机装饰、版式漂移、风格混乱 | 策略阶段、设计锁定、模板体系、逐页生成和质量检查 |
| **生成后能迭代** | 第一版通常还需要调图、调字、调节奏 | 支持实时预览、标注、质量检查和图表验证 |
| **多种演示场景** | 商务交付和发布会演讲不是一种产品 | 同时提供可编辑 PPTX 和高视觉网页演示 |

![工作流](assets/readme/workflow.svg)

---

## 两个引擎

### 1. 可编辑 PowerPoint 引擎

适合需要交付、评审、归档、二次修改的正式材料。

- 输出真实 PowerPoint 元素：文本框、形状、表格、图表、图片和媒体。
- 支持从 PDF、DOCX、XLSX、PPTX、URL、Markdown、粘贴文本进入。
- 先锁定受众、页数、风格、颜色、字体、图片策略和页面节奏。
- 每页生成前重新读取 `spec_lock.md`，减少长文档生成时的风格漂移。
- 支持浏览器实时预览、页面标注、质量检查和最终 PPTX 导出。
- 可选支持转场、对象级动画、演讲备注、旁白音频和图表坐标校准。

### 2. 杂志风网页 PPT 引擎

适合演讲、发布会、分享会、demo day、产品故事和强视觉传播。

- 输出单文件 `index.html`。
- 支持键盘、滚轮、触控横向翻页。
- 内置 WebGL 视觉运行时和本地 motion fallback。
- Style A：**电子杂志 x 电子墨水**，适合叙事型、行业型、人文型表达。
- Style B：**瑞士国际主义 / Swiss Style**，适合产品、工程、数据、系统架构和信息设计。
- 内置截图框架、图片提示词、主题规则、版式骨架和 QA 清单。

![风格矩阵](assets/readme/style-matrix.svg)

---

## 桌面应用 MVP

新的桌面应用放在 `apps/desktop`。第一屏刻意保持克制：导入资料、选择交付格式、生成，然后打开本地项目文件夹。

| 层 | 选择 | 原因 |
|---|---|---|
| 桌面壳 | Tauri | 体积小，优先 macOS，后续可扩展 Windows/Linux |
| 前端 | React + TypeScript + Vite | 方便做高质感界面，结构不重 |
| Worker | 本地 Python worker | 复用现有仓库和脚本，不重写 PPT 引擎 |

运行桌面 Web 壳：

```bash
cd apps/desktop
npm install
npm run dev
```

构建前端：

```bash
npm run build
```

安装 Rust 后可运行原生 Tauri 应用：

```bash
npm run tauri:dev
```

构建原生 macOS `.app`：

```bash
npm run tauri:build
```

在 Finder 自动化可用时生成 DMG 发布包：

```bash
npm run tauri:build:dmg
```

当前 MVP 会创建本地项目目录、检查环境、生成 Web Deck 预览和轻量可编辑 PPTX 预览。生产级高质量生成仍然走完整 `SKILL.md` 工作流。

桌面端 Settings 里已加入 **Language / 界面语言** 切换，支持中文和 English。选择会保存在本机，并影响首页、创建流程、工作台、环境检查和模型配置引导。

---

## 大模型与 Provider 配置

是的，生产级生成需要大模型驱动。但这个项目不内置、不转售、不托管云模型。当前最推荐的是 **Agent 驱动模式**：内容策略、逐页写稿、版式决策主要由你正在使用的 Agent 模型完成，例如 Codex、Claude Code、OpenClaw、Hermes、Cursor 类 IDE 或其他本地 Agent。

桌面 app 负责产品体验层：导入资料、推荐输出设置、创建项目目录、检查依赖、展示预览，并把项目交给完整 Agent 工作流。它默认不上传你的文件，也不会显示密钥明文。

| 驱动方式 | 当前状态 | 适合场景 |
|---|---|---|
| **Codex / Claude Code / OpenClaw / Hermes Agent** | 推荐，已支持 | 完整工作流：读资料、做策略、锁设计、逐页生成、跑脚本、预览、修正、导出 |
| **Agent + Provider Keys** | 已支持 | 主流程仍由 Agent 执行；provider key 用来开启生图、搜图、旁白等媒体能力 |
| **Direct LLM API Driver** | 已预留配置约定 | 后续桌面 worker 可直接用 OpenAI-compatible、Gemini、Qwen 或自托管 API 驱动完整生成循环 |

| 能力 | 由谁提供 | 在哪里配置 |
|---|---|---|
| 内容策略、故事线、逐页写稿、版式决策 | 你使用的 Agent 大模型 | 在 Codex、Claude Code、Hermes、OpenClaw 或 IDE Agent 里配置 |
| AI 生图 | OpenAI、Gemini、Qwen/DashScope、智谱、火山、MiniMax、OpenRouter 等 | `.env` 或当前进程环境变量 |
| 图片搜索 | Pexels / Pixabay，另有 Openverse 和 Wikimedia fallback | `.env` 或当前进程环境变量 |
| 旁白 / TTS | 默认 edge-tts；可选 ElevenLabs、MiniMax、Qwen、CosyVoice | `.env` 或当前进程环境变量 |

推荐本地配置方式：

```bash
mkdir -p ~/.ppt-master
cp .env.example ~/.ppt-master/.env
```

然后编辑 `~/.ppt-master/.env`：

```dotenv
IMAGE_BACKEND=openai
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-image-2

# 可选：图片搜索
PEXELS_API_KEY=your-pexels-key
PIXABAY_API_KEY=your-pixabay-key

# 可选：为后续 Direct API Worker 预留的直连配置约定
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4.1
```

桌面端 **Settings** 页已经加入 Model Setup 引导，会检测当前进程环境变量、仓库 `.env` 或 `~/.ppt-master/.env` 里的 provider 配置状态和预留直连 API 字段，只显示是否配置成功，不暴露密钥值。

v2.0.0 阶段建议正式生成优先走 Agent 驱动模式。Direct API Driver 目前是面向后续 worker adapter 的配置约定，还不是完整替代 `SKILL.md` 的内置生成引擎。

---

## 快速安装

### 1. 安装到 Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

然后在 Codex 里说：

```text
使用 $ultimate-ppt-master 把 reports/q3-review.pdf 做成 12 页可编辑 PPTX，用于高管汇报。
```

### 2. 安装到 Claude Code、OpenClaw、Hermes 和通用 Agent

终极融合 PPT 大师尽量做成跨 Agent 的本地技能包。只要你的 Agent 能读取本地文件、执行 shell 命令、写入输出文件，就可以接入。仓库里准备了多个入口文件，方便不同工具加载同一套工作流。

| Agent / 工具 | 推荐安装方式 | 调用方式 |
|---|---|---|
| **Codex** | 克隆到 `~/.codex/skills/ultimate-ppt-master` | 直接说 `使用 $ultimate-ppt-master ...` |
| **Claude Code** | 克隆到 `~/.claude/skills/ultimate-ppt-master` 或项目可读路径 | 让 Claude 先读取 `CLAUDE.md` 再生成 PPT |
| **OpenClaw** | 克隆到稳定本地路径，例如 `~/agent-skills/ultimate-ppt-master` | 让 Agent 读取 `AGENTS.md` 并按 `ultimate-ppt-master` 工作流执行 |
| **Hermes** | 克隆到稳定本地路径，例如 `~/agent-skills/ultimate-ppt-master` | 让 Hermes 读取 `AGENTS.md`；运行脚本时把仓库根目录当作 `SKILL_DIR` |
| **只支持 Prompt 的 Agent** | 不需要原生 skill 目录 | 复制或附加 `PROMPT.md`，再提供源材料 |

通用安装路径：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

通用 Agent 提示词：

```text
请读取 ~/agent-skills/ultimate-ppt-master/AGENTS.md，并按照 ultimate-ppt-master 工作流执行。
把这个仓库路径当作 SKILL_DIR。请把 reports/q3-review.pdf 做成 12 页可编辑 PPTX。
```

Prompt 兜底方式：

```text
请使用这个仓库里 PROMPT.md 的说明作为 PPT 生成工作流。
如果需要脚本路径，请把仓库根目录当作 SKILL_DIR。
```

macOS 上如果需要更稳的 PPTX 兼容性，建议安装 Cairo：

```bash
brew install cairo pkg-config
```

Swiss Style 网页 PPT 的静态校验需要 Node.js：

```bash
node scripts/validate-swiss-deck.mjs path/to/index.html
```

---

## 使用示例

```text
使用 $ultimate-ppt-master 把 reports/q3-review.pdf 做成 12 页可编辑 PPTX，用于高管汇报。
```

```text
使用 $ultimate-ppt-master 把这份 Markdown 做成杂志风网页 PPT，用于 20 分钟线下分享。
```

```text
使用 $ultimate-ppt-master 基于这个产品发布大纲生成一份 Swiss Style 网页 PPT。
```

如果你只说“帮我做个 PPT”，技能会先让你选择：

1. **可编辑 PowerPoint (`.pptx`)**：正式汇报、咨询报告、培训课件、客户交付。
2. **杂志风网页 PPT (`index.html`)**：发布会、演讲、demo day、视觉展示。

---

## 支持输入与输出

| 输入 | 可编辑 PPTX | 网页 PPT |
|---|---:|---:|
| PDF | 支持 | 转 Markdown 后使用 |
| DOCX / Word | 支持 | 转 Markdown 后使用 |
| XLSX / Excel | 支持 | 转 Markdown 后使用 |
| 旧 PPTX | 支持 | 转 Markdown 或作为模板参考 |
| URL / 网页 | 支持 | 转 Markdown 后使用 |
| Markdown | 支持 | 支持 |
| 粘贴文本 / 大纲 | 支持 | 支持 |

| 输出 | 适合场景 | 说明 |
|---|---|---|
| `.pptx` | 商务交付、正式汇报、客户评审 | 尽量保留原生 PowerPoint 可编辑元素 |
| `.pptx` + 动画 | 主讲人控场或自动播放 | 支持转场和对象级进入动画 |
| `.pptx` + 旁白 | 异步汇报、视频导出 | 可从演讲备注生成音频 |
| `index.html` | 演讲、发布会、强视觉传播 | 单文件网页演示 |

---

## 仓库结构

| 路径 | 作用 |
|---|---|
| `apps/desktop/` | Tauri + React 桌面 MVP 和本地 Python worker |
| `README.md` | 英文 GitHub 首页 |
| `README.zh-CN.md` | 中文 README |
| `SKILL.md` | Codex 和兼容 Agent 的主工作流入口 |
| `AGENTS.md` | 通用 Agent 工具入口 |
| `CLAUDE.md` | Claude Code 入口 |
| `PROMPT.md` | 不支持 skill 目录的工具可直接复制使用 |
| `scripts/` | 源文件转换、项目初始化、预览、校验、PPTX 导出、图片和音频辅助 |
| `templates/` | PPTX 版式、图表、图标库和设计规范参考 |
| `assets/magazine-web/` | 网页 PPT 模板、动效运行时、截图背景 |
| `references/` | 策略、执行、图片生成、通用标准和网页 PPT 参考 |
| `workflows/` | 可选工作流：模板创建、实时预览、图表验证、动画、旁白 |
| `UPSTREAM_SYNC.md` | 上游同步基线和融合适配策略 |

---

## 开源基础

本项目基于两个 MIT 许可项目融合适配：

- [ppt-master](https://github.com/hugohe3/ppt-master) by Hugo He：可编辑 PPTX 工作流、SVG 到 PPTX 导出、模板、图表、角色参考、实时预览、动画、旁白和质量工具。
- [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) by op7418：杂志风网页 PPT 工作流、电子杂志和瑞士风模板、主题、版式、截图处理和网页演示 QA。

版权与许可说明见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)，同步基线见 [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md)。

---

## License

MIT. See [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
