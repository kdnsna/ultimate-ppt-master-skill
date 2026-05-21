# 终极融合 PPT 大师 - Web Experience + 本地 Agent Bridge + Agent Skill

> 现在主打“网页端优先 + 本地深度生产”的融合路线：用户先打开静态在线体验页，导入资料、整理 Deck Brief、检测本地 Agent 和模型配置，再通过本地 Bridge 生成真实 handoff 项目，交给 Codex、Claude Code、Hermes、OpenClaw 等 Agent 生成可编辑 PPTX 或高质感 Web Deck。

<p align="center">
  <strong>v2.2.0</strong> · <a href="./README.md">English README</a> · 中文 · <a href="./docs/zh-CN">中文文档</a> · <a href="./docs/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/agent-setup.md">Agent Skill</a>
</p>

![终极融合 PPT 大师 Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>打开 Web Experience</strong></a>
  ·
  <a href="#连接本地-agent"><strong>连接本地 Agent</strong></a>
  ·
  <a href="#作为-agent-skill-使用"><strong>安装 / 使用 Agent Skill</strong></a>
  ·
  <a href="#桌面端-later--本地预览"><strong>桌面端 Later</strong></a>
  ·
  <a href="./docs/zh-CN"><strong>中文文档</strong></a>
</p>

<p align="center">
  <img alt="Version 2.2.0" src="https://img.shields.io/badge/Version-2.2.0-7C3AED?style=for-the-badge">
  <img alt="Web first" src="https://img.shields.io/badge/Primary-Web%20Experience-2563EB?style=for-the-badge">
  <img alt="Local bridge" src="https://img.shields.io/badge/Local-Agent%20Bridge-0F766E?style=for-the-badge">
  <img alt="Agent skill" src="https://img.shields.io/badge/Second%20Core-Agent%20Skill-10B981?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/kdnsna/ultimate-ppt-master-skill/ci.yml?branch=main&style=for-the-badge&label=CI">
</p>

这个项目现在保留三个真正重要的入口：

| 入口 | 作用 |
|---|---|
| **打开 Web Experience** | 低门槛推广入口。用户在线导入文件、整理资料 brief、预览 Web Deck、检测本地 Agent / provider 状态，并下载完整 `handoff-kit.zip`。 |
| **连接本地 Agent** | v2.2 的关键升级。一条命令启动 Bridge，让网页连接 `127.0.0.1`，本地解析 PDF/Word/PPTX/Excel/URL 并生成可打开的 handoff 项目。 |
| **安装 / 使用 Agent Skill** | 高质量生产路线。让本地 Agent 读取真实资料、运行脚本、预览输出、修复版式问题，并导出可编辑 PPTX 或单文件 Web Deck。 |

桌面端代码继续保留，但不再作为近期首推安装路径。签名、公证、Homebrew 分发和原生打包都放入发布维护文档，等网页端获客路径跑顺后再继续推进。

---

## 打开 Web Experience

在线体验页：

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

网页端现在是浏览器里的 **Agent Connect Hub**：

- 选择资料类型、目标场景、输出形式、视觉风格、语言、Agent 工具和模型偏好；
- 拖入 `.md`、`.txt`、`.pdf`、`.docx`、`.pptx`、`.xlsx`，或添加 URL；
- 文本类资料在浏览器预读，Office/PDF 资料交给本地 Bridge 解析；
- 自动生成页纲和 brief 完整度检查；
- 同屏展示 Hugo He / ppt-master 的 PPTX 路线和 op7418 / 歸藏的 Web Deck 路线；
- 检测本地 Bridge、Codex、Claude Code、Hermes、OpenClaw 和 provider key 状态；
- 实时预览并下载浏览器本地的 `preview-web-deck.html`；
- 发送到本地 Bridge，或下载包含 `source.md`、`extracted-source.md`、`attachments/`、`manifest.json`、`agent-prompt.md`、`project-brief.json`、`preview-web-deck.html`、`engine-plan.md`、`quality-checklist.md` 和 `README.md` 的 `handoff-kit.zip`；
- 打开脱敏 Web Deck 示例；
- 直接跳转到 Skill 安装说明。

边界也写清楚：没有托管后端、不托管模型、不做账号系统、浏览器不保存 API key。静态网页可以独立导出文件；连接 Bridge 时，资料只发往用户自己的 `127.0.0.1`。

本地开发：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm --prefix apps/web install
npm run dev:web
```

构建 GitHub Pages 静态产物：

```bash
npm run build:web
```

---

## 连接本地 Agent

从本地 clone 启动 Bridge：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run bridge
```

然后打开 Web Experience，点击 **发送到本地 Bridge**。它会在 `~/UltimatePPTMaster/handoffs/...` 生成本地项目：

- `source.md` 和 `extracted-source.md`；
- `attachments/` 中的原始文件；
- `manifest.json` 记录解析状态和建议命令；
- `agent-prompt.md`、`project-brief.json`、`engine-plan.md`、`quality-checklist.md`；
- `preview-web-deck.html`。

Bridge 默认安全策略：

- 只绑定 `127.0.0.1`；
- 从环境变量、仓库 `.env` 或 `~/.ppt-master/.env` 读取 provider 配置；
- 只告诉网页 key 是否存在，不返回 key 值；
- 本地调用 `scripts/source_to_md/*` 解析 PDF/Word/PPTX/Excel/URL；
- 不会自动拉起 Agent，除非用户显式开启。

可选自动拉起模式：

```bash
npm run bridge -- --allow-launch
```

完整说明：[Agent Connect Bridge](./docs/agent-connect-bridge.md)。

---

## 作为 Agent Skill 使用

当用户已经在用 Codex、Claude Code、Hermes、OpenClaw、Cursor 类 IDE 或其他可读文件、可跑脚本的本地 Agent 时，Skill 是第二核心入口，而且是当前质量最强的生产路线。

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

Skill 适合做这些事：

- 把真实资料整理成干净的 `source.md`；
- 先做叙事结构，再生成页面；
- 生成商务汇报、咨询方案、培训课件、投资人路演等可编辑 PPTX；
- 生成发布会、Demo Day、产品故事、视觉分享用的单文件 Web Deck；
- 预览或渲染输出，检查问题，修复明显版式错误，并列出最终文件。

完整说明：[Agent Setup](./docs/agent-setup.md)。

---

## 选择你的入口

| 路线 | 适合谁 | 怎么开始 |
|---|---|---|
| **Web Experience** | 新用户、GitHub 访客、公开传播、轻量试用。 | [打开 Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/) |
| **Web Experience + Bridge** | 想导入真实文件，但不想上传到托管服务的用户。 | 运行 `npm run bridge`，然后点击 **发送到本地 Bridge**。 |
| **Agent Skill** | 已经使用 Codex、Claude Code、Hermes、OpenClaw、Cursor、Cline、Roo、Windsurf 的用户。 | [Agent Setup](./docs/agent-setup.md) |
| **Web Experience + Skill** | 推荐生产流程：网页端组装或落盘 handoff kit，再把项目交给 Agent。 | 打开网页端，下载 `handoff-kit.zip` 或通过 Bridge 生成本地项目。 |
| **Desktop Later / 本地预览** | 高级本地模式和后续签名桌面端分发。 | 看 [Quickstart Desktop](./docs/quickstart-desktop.md)。 |

如果还不确定选哪条路线，看 [Choosing a Workflow](./docs/choosing-a-workflow.md)。

---

## 它能生成什么

Ultimate PPT Master 是建立在两条互补生产路线上的融合前台。仓库在 [LICENSE](./LICENSE) 和 [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES) 中保留上游版权和第三方声明。

### 可编辑 PowerPoint (`.pptx`)

适合需要评审、修改、交付和归档的正式材料。

- 商务汇报、咨询方案、培训课件、学术材料、投资人更新。
- 重视文本、形状、图表、备注和导出检查，而不是整页截图。
- 当前最强生产路径由 Agent Skill 完成：资料分析、策略结构、设计锁定、逐页生成、预览、修复和导出。

### 杂志风 Web Deck (`index.html`)

适合“演示本身就是体验”的场景。

- 单文件 HTML 演示，适合发布会、keynote、demo day、产品故事和强视觉内部分享。
- 支持电子杂志和 Swiss Style 两条视觉方向。
- Web Experience 会先生成一个 `preview-web-deck.html` 粗预览；正式生产和 QA 仍由 Agent Skill 完成。
- 公开脱敏示例：
  - [Agentic Developer Stack 2026](./examples/agentic-developer-tools-2026)
  - [Desktop Cultural Tourism Demo](./examples/desktop-cultural-tourism-demo)

---

## 工作方式

| 层 | 作用 |
|---|---|
| **静态 Web Experience** | 导入文件、组装结构化 deck brief、预览 `preview-web-deck.html`、检测 Bridge/provider 状态，并导出 `handoff-kit.zip`。 |
| **本地 Agent Bridge** | 运行在 `127.0.0.1`，本地解析源文件、写入 handoff 项目、检查 provider 状态，并返回建议 Agent 命令。 |
| **Fusion engine plan** | 在 handoff 前明确 PPTX 路线、Web Deck 路线、视觉路线、质量检查和版权声明要求。 |
| **Agent Skill** | 让 Codex / Claude Code / Hermes / OpenClaw 读取 `AGENTS.md` 和 `SKILL.md`，在本地执行生产工作流。 |
| **Python + 模板** | 创建项目目录、整理源资料、生成 PPTX/Web 输出，并保留日志和中间产物。 |
| **Desktop Later** | Tauri 桌面端继续保留，用于本地预览和未来签名分发，但不是近期获客主路径。 |

---

## 桌面端 Later / 本地预览

桌面端代码仍在 [apps/desktop](./apps/desktop)，但现在归为高级本地模式。

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

---

## 文档

| 需求 | 文档 |
|---|---|
| 使用静态在线入口 | [Web Experience](./docs/zh-CN/web-experience.md) |
| 连接网页、本地资料和 Agent | [Agent Connect Bridge](./docs/zh-CN/agent-connect-bridge.md) |
| 安装和调用 Skill | [Agent Setup](./docs/agent-setup.md) |
| 选择 Web / Skill / Desktop Later | [Choosing a Workflow](./docs/choosing-a-workflow.md) |
| 从源码运行桌面端 | [Quickstart Desktop](./docs/quickstart-desktop.md) |
| 配置模型和 Provider key | [Model and Provider Setup](./docs/model-provider-setup.md) |
| 排查安装、解析、输出、provider、Tauri 或 Agent 加载问题 | [Troubleshooting](./docs/troubleshooting.md) |
| 发布、Pages、Homebrew、签名、公证、隐私和维护 | [Release and Maintenance](./docs/release-maintenance.md) |

---

## Roadmap

- 验证 GitHub Pages + Local Bridge 作为主推广入口。
- 扩展中文汇报、英文 pitch、咨询方案、培训课件四类网页端示例。
- 让 Codex、Claude Code、Hermes、OpenClaw 和通用 Agent 的 Skill 安装路径更轻、更好记。
- 为公开示例 Deck 增加 gallery 自动化。
- 网页端路径验证有效后，再继续桌面端签名、公证和 Homebrew 分发。

---

## v2.2.0 重点变化

| 更新 | 变化 |
|---|---|
| **Agent Connect Hub** | 网页端从 brief-only 升级为资料导入、Bridge 检测、provider dashboard、Agent 状态、预览和增强 handoff kit。 |
| **本地 Agent Bridge** | 新增 `npm run bridge`，提供 localhost-only 的 health、provider、handoff 和可选 Agent launch 接口。 |
| **真实资料导入** | handoff kit 新增 `extracted-source.md`、`attachments/`、`manifest.json`，并记录 PDF/Word/PPTX/Excel/URL 的本地解析状态。 |
| **Skill 生产路线** | README 和文档首屏保留 Agent Skill，明确它是生产级高质量路线。 |
| **桌面端降级为 Later** | Tauri 桌面端继续保留，但 Homebrew、签名、公证移入发布维护文档。 |
| **回归检查** | Bridge 测试覆盖密钥脱敏、handoff 落盘、浏览器文本预读和默认不自动启动 Agent。 |

上游同步与本地适配策略见 [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md)。

---

## License

MIT. See [LICENSE](./LICENSE).
