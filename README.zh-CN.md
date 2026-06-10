# Ultimate PPT Master - AI PPT 生产工作台

> 面向中文办公场景的本地优先 AI PPT 生产工具：把资料整理成可编辑 PPTX 或杂志风 Web Deck，再用 DeckIR 策划、渲染审阅、安全修订 brief、页面配方、无文字生成式视觉层和正式交付审计，守住真实办公里的可编辑、可追溯、可复盘。

<p align="center">
  <strong>v4.3.0</strong> · <a href="./README.md">English README</a> · 中文 · <a href="./docs/zh-CN">中文文档</a> · <a href="./docs/guides/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>打开 Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>公开案例墙</strong></a>
  ·
  <a href="./docs/zh-CN/quality/rendered-review-loop-v4.3.md"><strong>v4.3 渲染审阅闭环</strong></a>
  ·
  <a href="./docs/zh-CN/release/release-notes-v4.3.0.md"><strong>v4.3.0 说明</strong></a>
  ·
  <a href="./docs/zh-CN/strategy/skill-market-distribution.md"><strong>Skill 市场分发</strong></a>
</p>

<p align="center">
  <img alt="Version 4.3.0" src="https://img.shields.io/badge/Version-4.3.0-172033?style=for-the-badge">
  <img alt="Rendered review loop" src="https://img.shields.io/badge/4.3-Rendered%20Review%20Loop-0F766E?style=for-the-badge">
  <img alt="DeckIR planning" src="https://img.shields.io/badge/4.2-DeckIR%20Planning-2563EB?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## 为什么团队会用它

很多 AI PPT 工具能做出“看起来完成”的页面。办公团队真正需要的是：可编辑、可追溯、可审计、能二次修订。

| 需求 | Ultimate PPT Master 的做法 |
|---|---|
| 把混乱资料变成演示结构 | 本地 handoff 文件夹包含 source markdown、DeckIR 页面地图、证据引用和 Agent brief。 |
| 保持 PowerPoint 可编辑 | PPTX 保留真实文字、形状、表格、图表、备注、logo、二维码和可追溯图片来源。 |
| 避免 AI 重复版式 | 页面配方和 `scripts/audit_visual_recipes.py` 拦截重复标题卡片、重复配方和正文整页 raster。 |
| 先审阅再修订 | v4.3 写出 `review-findings.json`、`repair-plan.json`，确认后生成 `revision-brief.md`。 |
| 本地优先 | Bridge 只在 localhost 写项目文件；私有资料默认不上传，除非用户明确选择。 |

## 产品闭环

```text
源资料
  -> Web Experience / Desktop / Bridge
  -> DeckIR storyboard + source-map 证据边界
  -> 页面配方 + 可编辑/raster 策略
  -> 可编辑 PPTX 或杂志风 Web Deck
  -> 渲染后审阅发现
  -> 安全修复计划
  -> revision-brief.md 给确认后的二次生成
  -> 正式交付审计
```

核心产物：

- `storyboard.json`：DeckIR 页面地图，包含页面角色、recipe id、证据引用、raster 策略和可编辑目标。
- `source-map.json`：deck 使用或保留的可追溯来源 claim。
- `planning-report.json`：路线建议、fallback 状态和 planner 说明。
- `review-findings.json`：渲染审阅问题，包含严重性、风险级别、修复目标和建议命令。
- `repair-plan.json`：低风险修复候选；默认只 dry-run。
- `revision-brief.md`：只有用户明确 safe apply 后才生成的二次修订 brief。
- `quality-report.json`：合并交付、策划和渲染审阅状态。

## v4.3 渲染审阅闭环

v4.3 让审阅结果可执行，但不危险。`scripts/review_rendered_deck.py` 检查生成项目并写出 findings。`scripts/apply_review_plan.py --safe-only --dry-run` 只展示计划。`--apply` 只写 planning 提示、报告、Agent 指令和 `revision-brief.md`；不会改写 `source.md`、业务事实或最终正文结论。

工作流说明：[v4.3 渲染审阅闭环](./docs/zh-CN/quality/rendered-review-loop-v4.3.md)。发布说明：[v4.3.0](./docs/zh-CN/release/release-notes-v4.3.0.md)。

## 60 秒开箱即用

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

然后打开 [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/)。v4.1 精简网页控制台仍然每次只给一个状态驱动主按钮：准备 brief、添加资料、连接本机、生成交付。

| 需求 | 推荐路线 | 产出 |
|---|---|---|
| 正式汇报、咨询方案、培训课件、需要别人继续改的材料 | 可编辑 PPTX | 文字、形状、图表、表格、备注和质量检查都保留的 PowerPoint。 |
| 演讲、展示、发布会、demo day、杂志化表达 | Web Deck | 单文件浏览器演示，视觉节奏更强，适合快速分享预览。 |
| 同时要正式转发和现场演示 | 双版本交付 | PPTX 与 Web 项目分开生成，但共享资料和结构口径。 |

## 能力矩阵

| 层级 | 发布 | 保护什么 |
|---|---|---|
| 渲染审阅和修订 brief | [v4.3 渲染审阅闭环](./docs/zh-CN/quality/rendered-review-loop-v4.3.md) | 渲染后审阅、低风险修复计划、确认后生成 `revision-brief.md`。 |
| AI 策划 | [v4.2 DeckIR AI 策划工作流](./docs/zh-CN/quality/deckir-ai-planning-workflow-v4.2.md) | `scripts/ai_storyboard.py`、`storyboard.json`、证据引用、可编辑目标和无 key fallback。 |
| 精简网页控制台 | [v4.1 精简网页控制台](./docs/zh-CN/release/release-notes-v4.1.0.md) | 四步控制台、一个状态驱动主按钮、分组预览、更低首屏复杂度。 |
| 混合可编辑生成 | [v4.0 混合可编辑视觉工作流](./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md) | 页面配方、无文字生成式视觉层、可编辑 PPTX 正文、正式 raster 策略。 |
| 公开证明面 | [v2.5 质量工作台](./docs/zh-CN/quality/quality-workbench-v2.5.md) | 公开案例墙、合成 proof packs、Design Doctor 报告和发布检查。 |

历史发布说明：[v4.2.0](./docs/zh-CN/release/release-notes-v4.2.0.md)、[v4.1.0](./docs/zh-CN/release/release-notes-v4.1.0.md)、[v4.0.0](./docs/zh-CN/release/release-notes-v4.0.0.md)、[v3.0.0](./docs/zh-CN/release/release-notes-v3.0.0.md)。

## 证明材料

[公开案例墙](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) 保留合成 proof packs，用户不安装也能先判断产出。

| 证明 | 链接 |
|---|---|
| 稳定证明矩阵 | [v2.5 质量工作台](./docs/zh-CN/quality/quality-workbench-v2.5.md) |
| 渲染审阅发布 | [发布说明 - v4.3.0](./docs/zh-CN/release/release-notes-v4.3.0.md) |
| DeckIR AI 策划包 | [发布说明 - v4.2.0](./docs/zh-CN/release/release-notes-v4.2.0.md) |
| 混合可编辑发布 | [发布说明 - v4.0.0](./docs/zh-CN/release/release-notes-v4.0.0.md) |
| Skill 市场准备 | [Skill 市场分发](./docs/zh-CN/strategy/skill-market-distribution.md) |

## 作为 Agent Skill 使用

可复制的 marketplace prompt：

```text
Use $ultimate-ppt-master to turn my source material into a quality-checked PPTX or Web Deck with a visual review report.
```

熟练用户可以直接安装 Skill：

```bash
bash -lc 'set -e; dir="$HOME/.codex/skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

使用说明：[Agent Setup](./docs/guides/agent-setup.md)。本地连接器：[Agent Connect Bridge](./docs/zh-CN/guides/agent-connect-bridge.md)。

## 文档地图

| 需求 | 阅读 |
|---|---|
| 尝试网页入口 | [Web Experience](./docs/zh-CN/guides/web-experience.md) |
| 连接浏览器、本地资料和 Agent | [Agent Connect Bridge](./docs/zh-CN/guides/agent-connect-bridge.md) |
| 安装和调用 Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| 选择 PPTX / Web Deck / Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| 本地配置 provider key | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| 查看 v4.3 修订闭环 | [v4.3 渲染审阅闭环](./docs/zh-CN/quality/rendered-review-loop-v4.3.md) |
| 理解 DeckIR AI 策划 | [v4.2 DeckIR AI 策划工作流](./docs/zh-CN/quality/deckir-ai-planning-workflow-v4.2.md) |
| 理解 v4.0 视觉契约 | [v4.0 混合可编辑视觉工作流](./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md) |
| 查看发布维护 | [Release and Maintenance](./docs/release/release-maintenance.md) |
| 排查安装或生成问题 | [Troubleshooting](./docs/guides/troubleshooting.md) |

完整地图：[docs/README.md](./docs/README.md)。中文地图：[docs/zh-CN/README.md](./docs/zh-CN/README.md)。

## 维护者检查

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:presets
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

README 首页承诺必须和可执行检查绑定。凡是在首页宣传的能力，都应该有文档、脚本、测试、审计或公开证明材料支撑。
