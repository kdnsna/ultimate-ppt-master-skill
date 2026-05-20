# 终极融合 PPT 大师 - Web Experience + Agent Skill / 可编辑 PPTX / 网页演示

> 现在主打“网页端优先”的融合路线：用户先打开静态在线体验页，把零散资料整理成结构化 Deck Brief、实时 Web Deck 预览、双引擎计划和本地 handoff-kit；再把任务交给 Codex、Claude Code、Hermes、OpenClaw 等 Agent 生成可编辑 PPTX 或高质感 Web Deck。

<p align="center">
  <strong>v2.1.0</strong> · <a href="./README.md">English README</a> · 中文 · <a href="./docs/zh-CN">中文文档</a> · <a href="./docs/agent-setup.md">Agent Skill</a>
</p>

![终极融合 PPT 大师 Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>打开 Web Experience</strong></a>
  ·
  <a href="#作为-agent-skill-使用"><strong>安装 / 使用 Agent Skill</strong></a>
  ·
  <a href="#桌面端-later--本地预览"><strong>桌面端 Later</strong></a>
  ·
  <a href="./docs/zh-CN"><strong>中文文档</strong></a>
</p>

<p align="center">
  <img alt="Version 2.1.0" src="https://img.shields.io/badge/Version-2.1.0-7C3AED?style=for-the-badge">
  <img alt="Web first" src="https://img.shields.io/badge/Primary-Web%20Experience-2563EB?style=for-the-badge">
  <img alt="Agent skill" src="https://img.shields.io/badge/Second%20Core-Agent%20Skill-10B981?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/kdnsna/ultimate-ppt-master-skill/ci.yml?branch=main&style=for-the-badge&label=CI">
</p>

这个项目现在保留两个真正重要的入口：

| 入口 | 作用 |
|---|---|
| **打开 Web Experience** | 低门槛推广入口。用户在线整理资料 brief、预览 Web Deck、生成双引擎计划、复制 Agent 指令，并下载完整 `handoff-kit.zip`。 |
| **安装 / 使用 Agent Skill** | 高质量生产路线。让本地 Agent 读取真实资料、运行脚本、预览输出、修复版式问题，并导出可编辑 PPTX 或单文件 Web Deck。 |

桌面端代码继续保留，但不再作为近期首推安装路径。签名、公证、Homebrew 分发和原生打包都放入发布维护文档，等网页端获客路径跑顺后再继续推进。

---

## 打开 Web Experience

在线体验页：

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

网页端现在是浏览器里的 **Deck Brief Studio**：

- 选择资料类型、目标场景、输出形式、视觉风格、语言、Agent 工具和模型偏好；
- 粘贴资料摘要或粗稿；
- 自动生成页纲和 brief 完整度检查；
- 同屏展示 Hugo He / ppt-master 的 PPTX 路线和 op7418 / 歸藏的 Web Deck 路线；
- 实时预览并下载浏览器本地的 `preview-web-deck.html`；
- 复制 Agent prompt 或 `source.md`；
- 下载包含 `source.md`、`agent-prompt.md`、`project-brief.json`、`preview-web-deck.html`、`engine-plan.md`、`quality-checklist.md` 和 `README.md` 的 `handoff-kit.zip`；
- 打开脱敏 Web Deck 示例；
- 直接跳转到 Skill 安装说明。

MVP 边界也写清楚：不接后端、不托管模型、不上传用户资料。Brief 组装完全在浏览器本地完成，下载文件只保存在用户本机。

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
| **Agent Skill** | 已经使用 Codex、Claude Code、Hermes、OpenClaw、Cursor、Cline、Roo、Windsurf 的用户。 | [Agent Setup](./docs/agent-setup.md) |
| **Web Experience + Skill** | 推荐生产流程：网页端组装 handoff kit，再把本地资料交给 Agent。 | 打开网页端，下载 `handoff-kit.zip`，必要时再提供真实资料路径。 |
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
- 公开脱敏示例：[examples/desktop-cultural-tourism-demo](./examples/desktop-cultural-tourism-demo)。

---

## 工作方式

| 层 | 作用 |
|---|---|
| **静态 Web Experience** | 组装结构化 deck brief、生成页纲、预览 `preview-web-deck.html`，并导出给本地 Agent 使用的 `handoff-kit.zip`。 |
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
| 安装和调用 Skill | [Agent Setup](./docs/agent-setup.md) |
| 选择 Web / Skill / Desktop Later | [Choosing a Workflow](./docs/choosing-a-workflow.md) |
| 从源码运行桌面端 | [Quickstart Desktop](./docs/quickstart-desktop.md) |
| 配置模型和 Provider key | [Model and Provider Setup](./docs/model-provider-setup.md) |
| 排查安装、解析、输出、provider、Tauri 或 Agent 加载问题 | [Troubleshooting](./docs/troubleshooting.md) |
| 发布、Pages、Homebrew、签名、公证、隐私和维护 | [Release and Maintenance](./docs/release-maintenance.md) |

---

## Roadmap

- 验证 GitHub Pages 作为主推广入口。
- 扩展中文汇报、英文 pitch、咨询方案、培训课件四类网页端示例。
- 让 Codex、Claude Code、Hermes、OpenClaw 和通用 Agent 的 Skill 安装路径更轻、更好记。
- 为公开示例 Deck 增加 gallery 自动化。
- 网页端路径验证有效后，再继续桌面端签名、公证和 Homebrew 分发。

---

## v2.1.0 重点变化

| 更新 | 变化 |
|---|---|
| **Web-first 方向** | 新增静态 Vite Deck Brief Studio，支持页纲生成、实时 Web Deck 预览、双引擎计划、`source.md`、`project-brief.json`、handoff zip、Skill 跳转和 Web Deck 示例。 |
| **Skill 第二核心** | README 和文档首屏保留 Agent Skill，明确它是生产级高质量路线。 |
| **桌面端降级为 Later** | Tauri 桌面端继续保留，但 Homebrew、签名、公证移入发布维护文档。 |
| **更好的桌面端草稿** | Desktop PPTX 输出使用有样式的可编辑布局，不再是纯 bullet smoke test。 |
| **Web Deck 资产恢复** | Web Deck 输出继续使用 magazine/Swiss HTML 模板、本地 `motion.min.js` 和原有翻页系统。 |
| **回归检查** | Worker 测试覆盖模板资产、占位符清理、DOCX 解析和生产草稿预览标记。 |

上游同步与本地适配策略见 [UPSTREAM_SYNC.md](./UPSTREAM_SYNC.md)。

---

## License

MIT. See [LICENSE](./LICENSE).
