# 终极融合 PPT 大师桌面端 - AI PPT Studio / 可编辑 PowerPoint / 高质感网页演示

> 本地优先的 AI PPT 桌面应用和 Agent 工作流：把真实资料变成可编辑 PowerPoint 或高视觉 Web Deck。

<p align="center">
  <strong>v2.0.0</strong> · <a href="./README.md">English README</a> · 中文 · <a href="./apps/desktop">桌面端</a>
</p>

![终极融合 PPT 大师桌面端主图](assets/readme/hero.svg)

<p align="center">
  <a href="#快速运行桌面端"><strong>运行桌面端</strong></a>
  ·
  <a href="./README.md"><strong>English README</strong></a>
  ·
  <a href="#开发者--agent-接入"><strong>Agent 接入</strong></a>
</p>

<p align="center">
  <img alt="Version 2.0.0" src="https://img.shields.io/badge/Version-2.0.0-7C3AED?style=for-the-badge">
  <img alt="AI PPT Desktop" src="https://img.shields.io/badge/AI%20PPT-Desktop%20Studio-F97316?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-2563EB?style=for-the-badge">
  <img alt="Local First" src="https://img.shields.io/badge/Local--first-No%20Cloud%20Upload-10B981?style=for-the-badge">
</p>

如果你在 GitHub 搜 **AI PPT**、**PPT 生成器**、**PowerPoint 自动化**、**PPTX 生成**、**演示文稿桌面应用** 或 **slide deck agent**，这个项目主打的是更实用的那一步：导入真实资料，选择交付场景，生成能继续编辑、能检查、能交付的演示文稿。

很多 AI 幻灯片工具停在“好看的截图”。终极融合 PPT 大师桌面端想做的是另一件事：

| 导入 | 选择 | 生成 |
|---|---|---|
| PDF、DOCX、XLSX、PPTX、URL、Markdown、粘贴文本 | 可编辑 PPTX 或高质感 Web Deck | 本地项目、预览、输出文件、日志、Agent handoff |

桌面端是产品入口。底层 Agent 工作流保留专业能力：Codex、Claude Code、OpenClaw、Hermes 或其他代码 Agent 可以读取生成项目，继续执行生产级生成流程，逐页修正并导出。

---

## 为什么主打桌面端

![终极融合 PPT 大师桌面端展示](assets/readme/desktop-showcase.svg)

终极融合 PPT 大师桌面端面向的是想用 AI 提速、但仍然需要可信交付文件的人。

| 桌面端承诺 | 为什么重要 |
|---|---|
| **三步创作流** | 导入资料、选择输出、生成导出。普通创作者不用先读脚本说明。 |
| **可编辑 PPTX 路线** | 正式材料需要在 PowerPoint 里被团队、客户、老师、领导继续修改。 |
| **高质感 Web Deck 路线** | 发布会、demo day、分享会和内部展示需要更强视觉表达。 |
| **本地优先项目** | 源文件、输出、预览、manifest 和日志默认留在本地项目目录。 |
| **Agent 兼容深水区** | 首页保持简单，专业生成能力通过 `SKILL.md` 保留。 |
| **中英双语界面** | Settings 已支持中文 / English 切换，方便国际用户。 |

它不是完整 PowerPoint 编辑器，也不声称替代 PowerPoint。它是一个聚焦导入、预览、编排、导出和 Agent handoff 的 AI PPT 桌面工作台。

---

## 它能生成什么

![终极融合 PPT 大师桌面工作流](assets/readme/desktop-workflow.svg)

### 可编辑 PowerPoint (`.pptx`)

适合需要评审、修改、交付、归档的正式材料。

- 面向真实 PowerPoint 交付，不是整页截图思路。
- 适合商务汇报、咨询方案、培训课件、学术答辩、投资人更新。
- 关注真实文件价值：文本、形状、图表、备注和导出检查比表面截图更重要。
- 生产级生成由完整 Agent 工作流接管：读取资料、锁定设计规范、逐页生成、预览、校验、导出。

### 杂志风网页 PPT (`index.html`)

适合“演示本身就是体验”的场景。

- 单文件 HTML 演示，适合发布会、keynote、demo day、产品故事和强视觉内部分享。
- 内置电子杂志和 Swiss Style 两条视觉方向。
- 适合横向翻页、强视觉节奏和本地可分享输出。
- 是可编辑 PPTX 的视觉表达补充。

---

## 工作方式

桌面端保持简单，深层能力交给本地 worker 和 Agent 工作流。

| 层 | 作用 |
|---|---|
| **Tauri 桌面壳** | 轻量原生应用包装，优先 macOS，后续扩展 Windows/Linux。 |
| **React + TypeScript UI** | Projects、Create、Workbench、Settings、语言切换、Provider 状态、模型配置引导。 |
| **Python worker** | 创建本地项目、写入预览、manifest、日志和 handoff 文件。 |
| **Agent 工作流** | Codex / Claude Code / OpenClaw / Hermes 读取 `SKILL.md`，运行脚本，完成生产级生成和修正。 |

当前应用重点是用户体验闭环：导入、推荐、预览、检查、打开输出、交给 Agent 深加工。Direct LLM API Driver 已保留配置约定，但还不是完整替代 `SKILL.md` 的内置生成引擎。

---

## 快速运行桌面端

运行桌面 Web 壳：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill/apps/desktop
npm install
npm run dev
```

构建前端：

```bash
npm run build
```

安装 Rust 后运行原生 Tauri 应用：

```bash
npm run tauri:dev
```

构建 macOS `.app`：

```bash
npm run tauri:build
```

在 Finder 自动化可用时生成 DMG 发布包：

```bash
npm run tauri:build:dmg
```

默认原生构建会稳定输出 `.app`。DMG 生成依赖 macOS Finder 自动化，可能需要本机桌面权限。

---

## 大模型与 Provider 配置

生产级 PPT 需要大模型，但本项目不内置、不转售、不托管云模型。当前推荐方式是 **Agent 驱动生成**。

| 驱动方式 | 当前状态 | 适合场景 |
|---|---|---|
| **Codex / Claude Code / OpenClaw / Hermes** | 推荐，已支持 | 读资料、做策略、锁设计、逐页写稿、跑脚本、预览、修正、导出。 |
| **Agent + Provider Keys** | 已支持 | 主流程由 Agent 执行；provider key 开启生图、搜图、旁白等媒体能力。 |
| **Direct LLM API Driver** | 预留配置约定 | 后续 worker adapter 可接入 OpenAI-compatible、Gemini、Qwen 或自托管 API。 |

推荐本地 provider 配置：

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

# 为后续 Direct API worker adapter 预留
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4.1
```

桌面端 Settings 会检测当前进程环境变量、仓库 `.env` 和 `~/.ppt-master/.env`，只显示配置状态，不暴露密钥明文。

---

## 开发者 / Agent 接入

终极融合 PPT 大师也是一个可移植 Agent skill。需要让 Codex、Claude Code、OpenClaw、Hermes 或其他代码 Agent 执行完整生产流程时，用这条路径。

### 安装到 Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

然后对 Codex 说：

```text
使用 $ultimate-ppt-master 把 reports/q3-review.pdf 做成 12 页可编辑 PPTX，用于高管汇报。
```

### Claude Code、OpenClaw、Hermes 和通用 Agent

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
python3.10 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
```

通用 Agent prompt：

```text
Read ~/agent-skills/ultimate-ppt-master/AGENTS.md and follow the ultimate-ppt-master workflow.
Use the repository path as SKILL_DIR. Turn reports/q3-review.pdf into a 12-slide editable PPTX.
```

| Agent / 工具 | 推荐安装方式 | 调用方式 |
|---|---|---|
| **Codex** | `~/.codex/skills/ultimate-ppt-master` | `使用 $ultimate-ppt-master ...` |
| **Claude Code** | `~/.claude/skills/ultimate-ppt-master` 或项目可读路径 | 让 Claude 先读 `CLAUDE.md`。 |
| **OpenClaw** | 稳定本地路径，例如 `~/agent-skills/ultimate-ppt-master` | 让它读取 `AGENTS.md`。 |
| **Hermes** | 稳定本地路径，例如 `~/agent-skills/ultimate-ppt-master` | 让 Hermes 读取 `AGENTS.md`，仓库目录作为 `SKILL_DIR`。 |
| **Prompt-only Agent** | 不需要原生 skill 目录 | 粘贴或附加 `PROMPT.md`。 |

---

## Roadmap

v2.0.0 之后的桌面端方向：

- 对单页进行自然语言修改。
- 在项目工作台重新生成单页。
- 模板导入向导。
- 图片搜索 / AI 生图面板。
- 分享海报和封面生成。
- Direct API worker adapter，接入 OpenAI-compatible、Gemini、Qwen 和自托管模型。
- GitHub README 示例画廊自动生成。

---

## v2.0.0 更新内容

| 更新项 | 变化 |
|---|---|
| **桌面端 MVP** | 新增 `apps/desktop`，采用 Tauri + React/TypeScript + 本地 Python worker。 |
| **桌面 UX 增强** | 新增 Projects、Create、Workbench、Settings、真实 manifest、信任检查、语言切换和模型配置引导。 |
| **原生构建加固** | 补齐 Tauri 图标、`Cargo.lock`、稳定 `.app` 构建命令和显式 DMG 命令。 |
| **同步上游** | 同步 `hugohe3/ppt-master` 与 `op7418/guizang-ppt-skill` 更新，并保留本仓库适配层。 |
| **双输出路线** | 可编辑 PPTX 与杂志风 HTML Deck 都作为一等输出。 |
| **多 Agent 安装指南** | 补充 Codex、Claude Code、OpenClaw、Hermes、通用 Agent 和 prompt-only 环境。 |

上游基线和适配策略见 [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md)。

---

## License

MIT. See [LICENSE](./LICENSE).
