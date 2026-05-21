# Ultimate PPT Master

> 把 PDF、Word、PPTX、Excel、URL 和零散笔记整理成 Agent 能直接接手的演示项目，再在本地生成可编辑 PowerPoint 或杂志风 Web Deck。

<p align="center">
  <strong>v2.3.4</strong> · <a href="./README.md">English README</a> · 中文 · <a href="./docs/zh-CN">中文文档</a> · <a href="./docs/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>打开 Web Experience</strong></a>
  ·
  <a href="#三步用起来"><strong>三步用起来</strong></a>
  ·
  <a href="#作为-agent-skill-使用"><strong>作为 Agent Skill 使用</strong></a>
  ·
  <a href="#桌面端-later"><strong>桌面端 Later</strong></a>
</p>

<p align="center">
  <img alt="Version 2.3.4" src="https://img.shields.io/badge/Version-2.3.4-172033?style=for-the-badge">
  <img alt="Web first" src="https://img.shields.io/badge/Primary-Web%20Experience-2563EB?style=for-the-badge">
  <img alt="Local bridge" src="https://img.shields.io/badge/Local-Agent%20Bridge-0F766E?style=for-the-badge">
  <img alt="Agent skill" src="https://img.shields.io/badge/Core-Agent%20Skill-10B981?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
</p>

## 三步用起来

| 步骤 | 你做什么 | 得到什么 |
|---|---|---|
| **1. 打开 Web Experience** | 进入 [静态网页](https://kdnsna.github.io/ultimate-ppt-master-skill/)，选一个内容预设，再写一句任务或粘贴资料摘要。 | 清晰的 brief、网页预览、`source.md` 模板和通俗配置指引。 |
| **2. 连接这台电脑** | 如果要解析真实 PDF/Word/PPTX/Excel/URL，在本地 clone 后运行 `npm run bridge`。 | 本机连接器（Bridge）会检测 Codex / Hermes / OpenClaw / Claude Code，并把资料留在 `127.0.0.1`。 |
| **3. 交给 AI 助手** | 点击 **发送到本机连接器**，再复制或启动生成的命令。 | 一个本地项目包，里面有资料、manifest、Agent prompt、预览和质量检查清单。 |

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run bridge
```

然后打开网页，点击 **发送到本机连接器**。

## 这是个什么项目

Ultimate PPT Master 是一个 **本地优先的 AI 演示生产中枢**。它不是单纯的 prompt 生成器，也不是把资料上传到云端的 PPT 网站，而是先用一个亲民网页把需求讲清楚，再把真实资料整理成本地 Agent 可以继续生产的 handoff 项目。

它想融合两条优秀路线：

- Hugo He / PPT Master 代表的可编辑 PPTX 生产路线；
- op7418 / 歸藏风格 Skill 代表的高质感单文件 Web Deck 路线。

一句话：**网页负责让普通用户一眼看懂、一键开始；Skill 负责让本地 Agent 做深度、高质量生产。**

![Agent connect flow](assets/readme/agent-connect-flow.svg)

## v2.3.4 发布重点

v2.3.4 继续守住产品承诺，同时补上 Bridge 第一次启动最容易踩的坑：**输入看得懂，本地配置更安全，Agent 接得住。**

这次重点不是把功能挤在一个页面，而是把 Web Experience 打磨成新手也能顺着走的本地交接台：

- 首页先用通俗话解释 Bridge、Agent、API key、handoff，再让用户配置；
- Web Experience 拆成开始、资料与目标、配置检测、交付给 AI 助手、预览与文件等菜单页，不再把所有功能挤在一起；
- 一键检测可以检查本机 Bridge、Codex / Hermes / OpenClaw / Claude Code 等 Agent，以及已配置模型 provider，且不泄露密钥；
- 配置页可以通过 Bridge 一键把 Skill 安装或更新到 Codex / 通用本地 Agent 目录；Bridge 离线时会复制终端命令；
- 网页复制的 Bridge 启动命令会先寻找本机 checkout，再运行 `npm run bridge`，即使从 `~` 等其他目录粘贴也不会找错 `package.json`；
- 内容预设包已经在网页端露出，包含资料要求、模板候选和质量检查；
- Bridge / handoff kit 继续保留 `manifest`、`engine-plan`、`quality-checklist`，让 Agent 有明确验收标准。

## 下一步方向

v2.3.4 在内容预设基础上补强了 **Bridge + Skill 配置路径**。下一步建议继续加深这些预设包：补更多可见样板、品牌 / 模板覆盖和场景化质量检查。

路线文档：[下一步路线 - 内容与模板预设](./docs/zh-CN/next-roadmap.md)。预设种子目录：[templates/presets](./templates/presets)。

## 为什么不直接让 Codex 安装 Skill？

可以。对专家用户来说，直接安装 Skill 仍然是最快路径。

Ultimate PPT Master 解决的是这之前的一分钟：用户有文件、有粗略目标、模型配置不确定，也不知道应该输出可编辑 PPTX、Web Deck，还是两者都要。

这个产品的价值是：

- 把模糊需求变成结构化 brief；
- 把真实资料整理成本地 handoff 文件夹；
- 在生产前显示 Bridge、Agent、provider 是否可用；
- 自动生成 engine plan 和质量检查清单；
- 保留原作者路线的质量上限，而不是替换成弱网页生成器。

更完整的反思见：[产品定位反思](./docs/zh-CN/product-positioning.md)。

## 一键更新

最近版本迭代比较快，已经安装过的用户建议先更新再生产正式材料。

本地仓库更新：

```bash
cd ultimate-ppt-master-skill
npm run update
```

Codex Skill 更新：

```bash
bash -lc 'set -e; dir="$HOME/.codex/skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

通用 Agent Skill 更新：

```bash
bash -lc 'set -e; dir="$HOME/agent-skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else mkdir -p "$HOME/agent-skills"; git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

也可以直接让 Codex 做：

```text
请把 ~/.codex/skills/ultimate-ppt-master 更新到 GitHub 最新版，运行 npm run setup，然后用 README 里的示例确认它可用。
```

## 输入到产出示例

![Agentic Developer Stack generated deck](assets/readme/agentic-demo-preview.png)

这个公开样板把“用户应该给什么”和“最终能看到什么”放在一起：

| 你给它 | 它生成 |
|---|---|
| 一份脱敏 `source.md`，包含主题、公开资料来源、叙事方向、页纲和约束。 | 一个可打开的单文件 Web Deck，以及给本地 Agent 继续生产 PPTX / Web Deck 的 handoff 结构。 |
| 一段明确的 Agent prompt，说明目标受众、输出形式和质量检查要求。 | `agent-prompt.md`、`engine-plan.md`、`quality-checklist.md` 这类可复现生产文件。 |

示例输入材料节选：

```text
主题：Agentic Developer Stack 2026
目标：用一个非敏感科技热点解释“网页负责入口，Skill 负责生产”的产品方向。
资料：Google I/O 2026 developer highlights、Google Developers Blog、公开技术报道。
输出：11 页杂志风 Web Deck；同时保留可交给 Agent 继续生成 PPTX 的 handoff 路线。
```

示例 Agent prompt：

```text
Use $ultimate-ppt-master with examples/agentic-developer-tools-2026/source.sanitized.md.
Create a polished magazine-style Web Deck for GitHub Pages and keep the handoff ready for an editable PPTX route.
Verify layout, mobile readability, source references, and final exported files before delivery.
```

查看完整样板：

- [输入材料 source.sanitized.md](./examples/agentic-developer-tools-2026/source.sanitized.md)
- [生成产品 Web Deck](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/agentic-developer-tools-2026/web-demo.html)
- [示例说明](./examples/agentic-developer-tools-2026)

## Web Experience

![Web Experience guided workspace](assets/readme/web-hub-preview.svg)

Web Experience 是项目的主推广入口。它可以直接跑在 GitHub Pages 上，不需要后端、不需要账号、不托管模型，也不会在浏览器保存 API key。

它可以帮用户：

- 导入 `.md`、`.txt`、`.pdf`、`.docx`、`.pptx`、`.xlsx`、URL 或粘贴文本；
- 选择目标场景、受众、输出路线、视觉风格、语言、Agent 工具和模型偏好；
- 看清每个资料是“浏览器已读”“Bridge 可解析”还是“作为附件保留”；
- 生成可复制的 Agent handoff prompt，并下载 `source.md` 模板；
- 预览一个粗版 `preview-web-deck.html`；
- Bridge 离线时下载 `handoff-kit.zip`；
- Bridge 在线时直接把项目写入本地工作区；
- 一键跳转到 Skill 安装说明。

在线入口：

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

本地开发网页：

```bash
npm --prefix apps/web install
npm run dev:web
```

构建 GitHub Pages 静态产物：

```bash
npm run build:web
```

## 连接本地 Agent

Bridge 会把静态网页升级成本地生产控制台。

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run bridge
```

Bridge 会把 handoff 项目写到：

```text
~/UltimatePPTMaster/handoffs/
```

默认安全策略：

- 只绑定 `127.0.0.1`；
- 从环境变量、仓库 `.env` 或 `~/.ppt-master/.env` 读取 provider 配置；
- 只返回 provider 是否可用和模型名，不返回 API key 内容；
- 通过 `scripts/source_to_md/*` 在本地解析资料；
- 默认不自动拉起任何 Agent。

高级自动拉起模式需要显式开启：

```bash
npm run bridge -- --allow-launch
```

完整说明：[Agent Connect Bridge](./docs/agent-connect-bridge.md)。

## Handoff Kit 长什么样

![Handoff kit contents](assets/readme/handoff-kit.svg)

每个 handoff 项目都同时给人和 Agent 看：

- `source.md`：干净的兜底资料；
- `extracted-source.md`：Bridge 尽量解析出的正文；
- `attachments/`：保留原始文件；
- `manifest.json`：资料状态、解析状态和建议命令；
- `agent-prompt.md`：可复制给 Agent 的完整提示词；
- `project-brief.json`：目标场景、受众、风格和输出配置；
- `engine-plan.md`：PPTX / Web Deck 生产计划；
- `quality-checklist.md`：交付前检查清单；
- `preview-web-deck.html`：浏览器本地粗预览；
- `README.md`：handoff 文件夹说明。

## 作为 Agent Skill 使用

当用户已经在用 Codex、Claude Code、Hermes、OpenClaw、Cursor 类 IDE 或其他能读文件、能跑脚本的本地 Agent 时，Skill 是第二核心入口，也是当前质量最强的生产路线。

### Codex

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/.codex/skills/ultimate-ppt-master
cd ~/.codex/skills/ultimate-ppt-master
npm run setup
```

然后这样问：

```text
Use $ultimate-ppt-master to turn reports/q3-review.pdf into a 12-slide editable PPTX for an executive meeting. Verify the deck before delivery.
```

### Claude Code、Hermes、OpenClaw 和通用 Agent

```bash
mkdir -p ~/agent-skills
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git ~/agent-skills/ultimate-ppt-master
cd ~/agent-skills/ultimate-ppt-master
npm run setup
```

Agent prompt：

```text
Read ~/agent-skills/ultimate-ppt-master/AGENTS.md and follow SKILL.md.
Use that repository path as SKILL_DIR.
Turn the provided source material into an editable PPTX and preview the result before delivery.
```

完整说明：[Agent Setup](./docs/agent-setup.md)。

## 输出路线

![Output gallery](assets/readme/output-gallery.svg)

| 输出 | 适合什么 | 推荐路线 |
|---|---|---|
| **可编辑 PowerPoint (`.pptx`)** | 商务汇报、咨询方案、培训课件、投资人更新，以及需要反复评审修改的正式材料。 | Agent Skill 读取真实资料，运行脚本，预览，修复，再导出。 |
| **杂志风 Web Deck (`index.html`)** | 发布会、Demo Day、产品故事、keynote、强视觉分享。 | Web Experience 先出粗预览，Skill 做最终打磨和 QA。 |
| **Agent Handoff Project** | 已经在用 Codex、Claude Code、Hermes、OpenClaw、Cursor、Cline、Roo、Windsurf 的用户。 | Bridge 生成本地项目，或下载 `handoff-kit.zip`。 |

公开脱敏示例：

- [Agentic Developer Stack 2026](./examples/agentic-developer-tools-2026)
- [Desktop Cultural Tourism Demo](./examples/desktop-cultural-tourism-demo)

## 选择你的入口

| 路线 | 适合谁 | 怎么开始 |
|---|---|---|
| **打开 Web Experience** | 新用户、GitHub 访客、公开传播、轻量试用。 | [打开 Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/) |
| **Web + Bridge** | 想导入真实文件，但不想上传资料到托管服务的用户。 | 运行 `npm run bridge`，再从网页发送。 |
| **Agent Skill** | 已经在用 Codex、Claude Code、Hermes、OpenClaw、Cursor、Cline、Roo、Windsurf。 | [Agent Setup](./docs/agent-setup.md) |
| **Web + Skill** | 推荐生产流程：网页端先整理 handoff kit，再让 Agent 本地深度生产。 | 使用 Web Experience，然后走 Bridge 或 `handoff-kit.zip`。 |
| **桌面端 Later** | 高级本地预览和后续签名桌面端分发。 | [Quickstart Desktop](./docs/quickstart-desktop.md) |

## 桌面端 Later

Tauri 桌面端仍保留在 [apps/desktop](./apps/desktop)，但不再作为近期首推安装路径。签名、公证、Homebrew 分发和原生打包都放到发布维护路线里。

开发者源码预览：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

发布维护参考：

- [Quickstart Desktop](./docs/quickstart-desktop.md)
- [Homebrew Distribution Plan](./docs/homebrew-distribution.md)
- [Release and Maintenance](./docs/release-maintenance.md)

## 文档

| 需求 | 文档 |
|---|---|
| 使用静态在线入口 | [Web Experience](./docs/zh-CN/web-experience.md) |
| 连接网页、本地资料和 Agent | [Agent Connect Bridge](./docs/zh-CN/agent-connect-bridge.md) |
| 安装和调用 Skill | [Agent Setup](./docs/agent-setup.md) |
| 选择 Web / Skill / Desktop Later | [Choosing a Workflow](./docs/choosing-a-workflow.md) |
| 本地配置 provider key | [Model and Provider Setup](./docs/model-provider-setup.md) |
| 理解它为什么不只是“多装一个 Skill” | [产品定位反思](./docs/zh-CN/product-positioning.md) |
| 查看下一步内容 / 模板方向 | [下一步路线 - 内容与模板预设](./docs/zh-CN/next-roadmap.md) |
| 查看 v2.3.4 发布重点 | [发布说明 - v2.3.4](./docs/zh-CN/release-notes-v2.3.4.md) |
| 查看本机上游基准测试 | [上游基准测试 - 2026 年 5 月](./docs/zh-CN/upstream-benchmark-2026-05.md) |
| 排查安装、解析、输出、provider、Tauri 或 Agent 加载问题 | [Troubleshooting](./docs/troubleshooting.md) |
| 发布、Pages、Homebrew、签名、公证、隐私和维护 | [Release and Maintenance](./docs/release-maintenance.md) |

## v2.3.4 重点变化

- 修复网页复制的 Bridge 启动命令，避免用户在非仓库目录粘贴时触发 `package.json` 找不到的问题。
- 配置页新增由 Bridge 执行的 Skill 安装 / 更新动作，覆盖 Codex 和通用本地 Agent 目录。
- 保留一键检测和一键选择可用 AI 助手，覆盖 Codex、Hermes、OpenClaw、Claude Code。
- 内容预设包在网页端可选，能看到资料要求、模板候选和质量检查。
- Bridge / handoff kit 继续负责本地资料打包、provider 状态、Agent 命令、预览文件和质量检查。
- Skill 仍然是高质量生产路线，负责最终 PPTX / Web Deck 的深度生成、预览和修复。

上游同步与本地适配策略见 [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md)。

## 项目 About

AI presentation hub: source files in, local Agent handoff out, editable PPTX and magazine Web Decks delivered.<br>
AI 演示生产中枢：资料进来，本地 Agent 接手，输出可编辑 PPTX / 杂志风网页演示。

## License

MIT. See [LICENSE](./LICENSE)。
