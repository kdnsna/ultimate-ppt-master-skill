# Ultimate PPT Master - v5 AI PPT 交付系统

> 面向真实办公场景的本地优先 AI PPT 生产工具：把资料整理成可编辑 PPTX 或杂志风 Web Deck，并用一份交付简报、官方/IP 素材边界、Codex-first 生成视觉、微软雅黑默认排版、渲染审阅和正式交付审计来守住可编辑、可追溯、可复盘。

<p align="center">
  <strong>v5.0.0</strong> · <a href="./README.md">English README</a> · 中文 · <a href="./docs/zh-CN">中文文档</a> · <a href="./docs/zh-CN/release/release-notes-v5.0.0.md">v5 发布说明</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>打开 Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>公开案例墙</strong></a>
  ·
  <a href="./docs/zh-CN/release/release-notes-v5.0.0.md"><strong>v5.0.0 说明</strong></a>
  ·
  <a href="./docs/zh-CN/guides/agent-connect-bridge.md"><strong>Agent Bridge</strong></a>
  ·
  <a href="./docs/zh-CN/strategy/skill-market-distribution.md"><strong>Skill 市场分发</strong></a>
</p>

<p align="center">
  <img alt="Version 5.0.0" src="https://img.shields.io/badge/Version-5.0.0-172033?style=for-the-badge">
  <img alt="Delivery defaults" src="https://img.shields.io/badge/v5-Delivery%20Defaults-0F766E?style=for-the-badge">
  <img alt="Codex first visuals" src="https://img.shields.io/badge/Codex--first-Generated%20Visuals-2563EB?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## 为什么团队会用它

很多 AI PPT 工具能做出“看起来完成”的页面。办公团队真正需要的是：可编辑、可追溯、可审计、能二次修订。

| 需求 | Ultimate PPT Master 的做法 |
|---|---|
| 默认做真正的 PowerPoint | 泛泛地说“做个 PPT”时默认走可编辑 PPTX，不再先把用户拖进路线选择。 |
| 减少制作摩擦 | 过去多轮确认被压缩成一份交付简报：路线、受众、风格、字体、素材和约束一次记录清楚。 |
| 做出更像设计稿的 AI 视觉 | 默认把 Codex/GPT 生图当成完整构图引擎，用于无文字主视觉、支撑场景和微资产，而不是元素堆叠。 |
| 守住品牌安全 | Logo、活动 IP、卡面、二维码、合作方标识等确定性素材必须记录官方来源、用户提供、文字锁定 fallback 或待授权替换。 |
| 保持 PowerPoint 可编辑 | PPTX 保留真实文字、形状、表格、图表、备注、logo、二维码和可追溯图片来源。 |
| 避免“小字挤满页” | 微软雅黑默认字体、16:9 安全边距、标题/正文比例、卡片数量限制和版式变化都在生成前锁定。 |
| 先审阅再修订 | 渲染审阅写出 findings、安全修复计划和确认后使用的 `revision-brief.md`。 |
| 本地优先 | Bridge 只在 localhost 写项目文件；私有资料默认不上传，除非用户明确选择。 |

## 适合谁使用

| 使用者 | 常见任务 | v5 为什么适合 |
|---|---|---|
| 办公团队 | 领导汇报、工作总结、培训课件、项目复盘、销售赋能材料。 | 默认产出真正可编辑的 PPTX，同事当天就能继续改。 |
| 金融、政务和企业用户 | 对措辞、品牌边界和资料来源更敏感的正式材料。 | 官方/IP 素材有记录，外部发布不允许假 logo 式占位。 |
| 咨询和内部战略团队 | 结构化叙事、行业扫描、解决方案、管理层摘要。 | 生成前用一份 brief 锁定结构、受众和表达方式，减少返工。 |
| 活动和品牌团队 | 发布会、活动宣讲、文旅推介、产品展示、公众传播材料。 | Codex/GPT 生图负责完整构图的无文字视觉，业务内容继续可编辑。 |

## 典型使用场景

| 用户请求 | v5 默认处理 |
|---|---|
| “把这份资料做成 PPT。” | 先做可编辑 PPTX，除非用户明确说要 Web Deck。 |
| “视觉再高级一点。” | 先读资料并命名主题艺术方向，必要时生成无文字支撑视觉，同时保持标题、数字、表格和图表可编辑。 |
| “这个要对外发，涉及品牌。” | 为 logo、活动 IP、卡面、二维码、合作方标识和生成图片建立官方/IP 素材计划。 |
| “评审后还要继续改。” | 先渲染审阅，写出 findings 和安全修复计划，确认后再生成 `revision-brief.md`。 |

## 你会得到什么

| 交付物 | 包含什么 | 为什么重要 |
|---|---|---|
| 可编辑 PPTX | 真实文本框、形状、图表、表格、备注，以及安全场景下的可编辑品牌文字锁定。 | 交付物能给 PowerPoint 用户继续改，不是只能看的截图。 |
| Web Deck | 用于演讲、展示和杂志化表达的单文件浏览器演示。 | 当视觉节奏和快速分享比 PowerPoint 编辑更重要时使用。 |
| 交付简报 | 受众、路线、页数、语气、视觉方向、字体、图片策略和缺失素材假设。 | 少问问题，但保留生产记录。 |
| 来源和素材记录 | `source-map.json`、`image_sources.json`、`image_prompts.json` 和官方/IP fallback 说明。 | 审阅者能看到哪些内容来自资料、生成、替换或待授权。 |
| 审阅包 | 渲染预览、问题清单、修复候选和质量状态。 | 修订从可观察问题出发，而不是反复说“再高级一点”。 |

## v5 做对了什么

v5.0.0 是交付默认规范版本。仓库首页不再先像功能清单，而是先说明怎样把一份资料交付成可以给真实利益相关方看的 PPT。

| v5 默认 | 实际效果 |
|---|---|
| 可编辑 PPTX 优先 | 正式汇报、咨询方案、金融/政务材料和普通“做 PPT”请求直接进入 PowerPoint 可交付路线。 |
| 一份交付简报 | Agent 记录假设并继续推进；只有缺失答案会实质改变交付物时才停下来问。 |
| Codex-first 生成视觉 | 生图只做无文字支撑层或可复用微资产；正文、数字、图表和表格保持可编辑。 |
| 官方/IP 素材计划 | 确定性标识必须可溯源或有替代说明；外部发布禁止假 logo 式占位。 |
| 主题艺术方向 | Agent 读完素材后先命名贴合主题的艺术概念，例如文旅材料可用 `山海交汇 烟火同行`，再把它贯穿首尾页、主标题和必要的章节 motif；严肃汇报场景走克制例外。 |
| 字体与版式体系 | 默认 CJK 办公字体是微软雅黑；正文通常 18-24px，标题/正文比例、边距和留白有明确下限。 |
| 正式商务审计 | `design_spec.md`、`spec_lock.md`、`design-quality-report.md`、素材清单和 PPTX/Web 产物都进入检查。 |

## v5 交付标准

| 维度 | 标准 |
|---|---|
| 更少确认 | 只有缺失答案会改变交付物时才询问；其余假设写进交付简报并继续推进。 |
| PPTX 可编辑性 | 业务内容保持可编辑；整页栅格图片只用于有意设计的无文字背景、插画或 Web Deck 浏览器场景。 |
| 生图方式 | Codex/GPT 视觉必须是完整构图场景或支撑资产，不嵌文字、不伪造 logo，并保留提示词记录。 |
| 官方素材 | Logo、卡面、二维码、活动 IP 和合作方标识必须标明 official-source、user-provided、text-lockup fallback 或 needs-authorized-replacement。 |
| 字体 | 中文办公默认微软雅黑；标题、正文、注释、数字和页脚必须有清晰层级。 |
| 排版 | 16:9 页面使用安全边距、卡片数量限制、可读正文尺度，并在总览、流程、对比、数据、案例和收尾页之间保持版式变化。 |
| 交付 | 最终包应包含 PPTX 或 Web Deck、渲染审阅、质量报告、来源记录和素材 caveat。 |

## 产品闭环

生产路径被刻意收窄。它应该像一位熟练 PPT 制作者把杂乱资料整理成可交付文件，而不是让用户配置一堆引擎选项。

```text
源资料
  -> Web Experience / Desktop / Bridge
  -> 一份交付简报
  -> 官方/IP 素材计划
  -> 页面角色 + 页面配方 + 可编辑/raster 策略
  -> 必要时生成 Codex/GPT 无文字视觉资产
  -> 可编辑 PPTX 或杂志风 Web Deck
  -> 渲染审阅发现
  -> 安全修复计划 + revision-brief.md
  -> 正式交付审计
```

核心产物，用白话说：

- `design_spec.md`：人能读懂的设计契约，记录视觉方向、页面角色、字体、素材和完成风险。
- `spec_lock.md`：机器可读执行锁，记录页面配方、视觉层、raster 策略、品牌素材和审美检查。
- `storyboard.json`：DeckIR 页面地图，包含页面角色、recipe id、证据引用、raster 策略和可编辑目标。
- `source-map.json`：deck 使用或保留的可追溯来源 claim。
- `images/image_sources.json` 与 `images/image_prompts.json`：官方/公开/生成式素材来源和提示词记录。
- `review-findings.json`：渲染审阅问题，包含严重性、风险级别、修复目标和建议命令。
- `repair-plan.json`：低风险修复候选；默认只 dry-run。
- `revision-brief.md`：只有用户明确 safe apply 后才生成的二次修订 brief。
- `quality-report.json`：合并交付、策划和渲染审阅状态。

DeckIR 就是页面地图；页面配方就是每页怎么排、怎么组织信息；raster 策略就是哪些视觉层可以变成图片、哪些内容必须继续可编辑。

## 60 秒开箱即用

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

然后打开 [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/)。网页控制台始终保留一个状态驱动主按钮：准备 brief、添加资料、连接本机、生成交付。

| 需求 | 推荐路线 | 产出 |
|---|---|---|
| 正式汇报、咨询方案、培训课件、需要别人继续改的材料 | 可编辑 PPTX | 文字、形状、图表、表格、备注和质量检查都保留的 PowerPoint。 |
| 演讲、展示、发布会、demo day、杂志化表达 | Web Deck | 单文件浏览器演示，视觉节奏更强，适合快速分享预览。 |
| 同时要正式转发和现场演示 | 双版本交付 | PPTX 与 Web 项目分开生成，但共享资料和结构口径。 |

## 真实生产流程

| 步骤 | Agent 应该做什么 |
|---|---|
| 读资料 | 先提炼核心信息、受众、限制、关键数字和具名素材，再规划页面结构。 |
| 锁 brief | 一次确定 PPTX/Web/Dual、页数、语气、字体、主题艺术方向、素材边界和已知 caveat。 |
| 规划页面 | 每页都有明确角色：封面、总览、证据、流程、对比、数据、案例、路线、行动号召或尾页。 |
| 制作素材 | 必须用官方或用户素材的地方不猜；只有能强化表达时才生成无文字视觉。 |
| 组装页面 | 业务文字、图表、表格和标签保持可编辑；默认使用微软雅黑和克制的办公层级。 |
| 渲染审阅 | 导出预览后检查版式和素材风险，写 findings，再按安全计划修。 |

## 能力矩阵

| 层级 | 发布 | 保护什么 |
|---|---|---|
| 交付默认规范 | [发布说明 - v5.0.0](./docs/zh-CN/release/release-notes-v5.0.0.md) | 默认 PPTX、一份交付简报、官方/IP 素材处理、微软雅黑版式尺度和 Codex-first 生图。 |
| 渲染审阅和修订 brief | [v4.3 渲染审阅闭环](./docs/zh-CN/quality/rendered-review-loop-v4.3.md) | 渲染后审阅、低风险修复计划、确认后生成 `revision-brief.md`。 |
| AI 策划 | [v4.2 DeckIR AI 策划工作流](./docs/zh-CN/quality/deckir-ai-planning-workflow-v4.2.md) | `scripts/ai_storyboard.py`、`storyboard.json`、证据引用、可编辑目标和无 key fallback。 |
| 精简网页控制台 | [v4.1 精简网页控制台](./docs/zh-CN/release/release-notes-v4.1.0.md) | 四步控制台、一个状态驱动主按钮、分组预览、更低首屏复杂度。 |
| 混合可编辑生成 | [v4.0 混合可编辑视觉工作流](./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md) | 页面配方、无文字生成式视觉层、可编辑 PPTX 正文、正式 raster 策略。 |
| 公开证明面 | [v2.5 质量工作台](./docs/zh-CN/quality/quality-workbench-v2.5.md) | 公开案例墙、合成 proof packs、Design Doctor 报告和发布检查。 |

历史发布说明：[v4.3.0](./docs/zh-CN/release/release-notes-v4.3.0.md)、[v4.2.0](./docs/zh-CN/release/release-notes-v4.2.0.md)、[v4.1.0](./docs/zh-CN/release/release-notes-v4.1.0.md)、[v4.0.0](./docs/zh-CN/release/release-notes-v4.0.0.md)、[v3.0.0](./docs/zh-CN/release/release-notes-v3.0.0.md)。

## 证明材料

[公开案例墙](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) 保留合成 proof packs，用户不安装也能先判断产出。

| 证明 | 链接 |
|---|---|
| v5 交付默认规范发布 | [发布说明 - v5.0.0](./docs/zh-CN/release/release-notes-v5.0.0.md) |
| 渲染审阅发布 | [发布说明 - v4.3.0](./docs/zh-CN/release/release-notes-v4.3.0.md) |
| DeckIR AI 策划包 | [发布说明 - v4.2.0](./docs/zh-CN/release/release-notes-v4.2.0.md) |
| 混合可编辑发布 | [发布说明 - v4.0.0](./docs/zh-CN/release/release-notes-v4.0.0.md) |
| 稳定证明矩阵 | [v2.5 质量工作台](./docs/zh-CN/quality/quality-workbench-v2.5.md) |
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

## 仓库地图

| 区域 | 用来做什么 |
|---|---|
| `SKILL.md` 与 `references/` | Agent 行为、路线选择、素材来源、视觉生成和交付规则。 |
| `apps/web` 与 `apps/desktop` | Web Experience、本地 handoff 入口和 desktop worker 集成。 |
| `scripts/` | 审计、发布检查、渲染审阅修复、provider 设置和仓库维护。 |
| `templates/` | formal-business 交付使用的设计规格和 spec lock 参考。 |
| `docs/` | 使用指南、发布说明、质量工作流、策略文档和中文文档。 |
| `tests/` | 发布完整性、审计、worker 行为、bridge 行为和公开承诺检查。 |

## 文档地图

| 需求 | 阅读 |
|---|---|
| 尝试网页入口 | [Web Experience](./docs/zh-CN/guides/web-experience.md) |
| 连接浏览器、本地资料和 Agent | [Agent Connect Bridge](./docs/zh-CN/guides/agent-connect-bridge.md) |
| 安装和调用 Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| 选择 PPTX / Web Deck / Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| 本地配置 provider key | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| 查看 v5 交付默认规范 | [发布说明 - v5.0.0](./docs/zh-CN/release/release-notes-v5.0.0.md) |
| 查看 v4.3 修订闭环 | [v4.3 渲染审阅闭环](./docs/zh-CN/quality/rendered-review-loop-v4.3.md) |
| 应用渲染修订计划 | [`scripts/apply_review_plan.py`](./scripts/apply_review_plan.py) |
| 理解 DeckIR AI 策划 | [v4.2 DeckIR AI 策划工作流](./docs/zh-CN/quality/deckir-ai-planning-workflow-v4.2.md) |
| 理解 v4.0 视觉契约 | [v4.0 混合可编辑视觉工作流](./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md) |
| 审计页面配方 | [`scripts/audit_visual_recipes.py`](./scripts/audit_visual_recipes.py) |
| 查看发布维护 | [Release and Maintenance](./docs/release/release-maintenance.md) |
| 排查安装或生成问题 | [Troubleshooting](./docs/guides/troubleshooting.md) |

完整地图：[docs/README.md](./docs/README.md)。中文地图：[docs/zh-CN/README.md](./docs/zh-CN/README.md)。

## 质量门禁

发布 README、版本、Skill、Web 或 Desktop 改动前，运行这些维护者检查：

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

README 首页承诺必须和可执行检查绑定。凡是在首页宣传的能力，都应该有文档、脚本、测试、审计或公开证明材料支撑。除非单独运行并记录桌面打包命令，否则 README 不宣称已经完成桌面二进制发行包。
