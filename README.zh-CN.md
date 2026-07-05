# Ultimate PPT Master - v5.3 最佳效果提示增强器

> 面向真实办公场景的本地优先 AI PPT 生产工具：先把短指令自动扩写成最佳效果 brief，再把一句话需求、杂乱资料或结构化 brief 变成可编辑 PPTX 或杂志风 Web Deck。v5.3 增加 Guizang-like 固定样式 fallback，让极短指令也能先出稳定高质量版本，同时保留来源可信度、官方/IP 素材边界、渲染审阅和正式交付审计。

<p align="center">
  <strong>v5.3.0</strong> · <a href="./README.md">English README</a> · 中文 · <a href="./docs/zh-CN">中文文档</a> · <a href="./docs/zh-CN/release/release-notes-v5.3.0.md">v5.3 发布说明</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>打开 Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>公开案例墙</strong></a>
  ·
  <a href="./docs/zh-CN/release/release-notes-v5.3.0.md"><strong>v5.3.0 说明</strong></a>
  ·
  <a href="./docs/zh-CN/guides/agent-connect-bridge.md"><strong>Agent Bridge</strong></a>
  ·
  <a href="./docs/zh-CN/strategy/skill-market-distribution.md"><strong>Skill 市场分发</strong></a>
</p>

<p align="center">
  <img alt="Version 5.3.0" src="https://img.shields.io/badge/Version-5.3.0-172033?style=for-the-badge">
  <img alt="Best-effect brief" src="https://img.shields.io/badge/v5.3-Best--Effect%20Brief-0F766E?style=for-the-badge">
  <img alt="Visual Brief tags" src="https://img.shields.io/badge/Web-Visual%20Brief%20Tags-2563EB?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## 最佳使用提示

用 Codex、ChatGPT、Claude Code、Hermes、OpenClaw、Cursor 或其他 Agent 调用这个技能时，建议直接复制这句：

```text
Use $ultimate-ppt-master to expand my short request into a best-effect brief first. If my prompt is extremely thin, use the Guizang-like Magazine Web Deck fixed style by default; if I explicitly need a formal editable deck, use PPTX and keep the same quality checks.
```

v5.3 的核心是：用户不需要会写完美提示词，Agent 必须先做“最佳效果提示增强器”。

| 用户输入 | v5.3 的处理 |
|---|---|
| 只有主题或一句话 | 先生成**自动扩写 brief**，默认走 **Guizang-like Magazine Web Deck fixed style**，除非用户明确要正式可编辑 PPTX。 |
| “帮我做一个关于 X 的 PPT”但没有资料 | 判定为**极短指令**；默认做 8 页 Style A 电子杂志 × 电子墨水 Web Deck，先确保第一版稳定、好看、有节奏。 |
| 正式汇报、政务/金融/培训、必须可编辑 | 改走 PPTX：微软雅黑、formal-business 门禁、来源可信度、官方/IP 素材计划、同样写入 bestEffectBrief。 |
| 已有资料或详细 brief | 保留用户意图，记录假设，继续走 v5.2 的预期契合合同和质量检查。 |

## 为什么团队会用它

很多 AI PPT 工具能做出“看起来完成”的页面。办公团队真正需要的是：哪怕用户一开始只说“帮我做个 PPT”，最后仍然可编辑、可追溯、可审计、能二次修订。

| 需求 | Ultimate PPT Master 的做法 |
|---|---|
| 让短提示也能出好结果 | v5.3 先把一句话自动扩写成 `bestEffectBrief`，再决定路线、风格、页奏和默认假设。 |
| 极短指令有稳定默认 | 用户只给主题时，默认用 Guizang-like Magazine Web Deck fixed style，避免产出一套平庸通用 PPT。 |
| 需要正式可编辑时仍做 PPTX | 明确写正式汇报、可编辑、政务/金融/培训/报告时，走可编辑 PPTX、微软雅黑和 formal-business 检查。 |
| 避免预期偏差 | v5.2 把清晰度闸门升级成交付契约：标签、访谈答案、来源可信度、参考样板、交付评分卡和反馈归因都写进 handoff。 |
| 问对关键问题 | 当答案会影响交付物时，Agent 会先问清受众、场景、目的、内容状态、核心观点、页数、风格、素材边界、输出格式和合规禁忌。 |
| 做出更像设计稿的 AI 视觉 | 默认把 Codex/GPT 生图当成完整构图引擎，用于无文字主视觉、支撑场景和微资产，而不是元素堆叠。 |
| 守住品牌安全 | Logo、活动 IP、卡面、二维码、合作方标识等确定性素材必须记录官方来源、用户提供、文字锁定 fallback 或待授权替换。 |
| 保持 PowerPoint 可编辑 | PPTX 保留真实文字、形状、表格、图表、备注、logo、二维码和可追溯图片来源。 |
| 避免“小字挤满页” | 微软雅黑默认字体、16:9 安全边距、标题/正文比例、卡片数量限制和版式变化都在生成前锁定。 |
| 先审阅再修订 | 渲染审阅写出 findings、安全修复计划和确认后使用的 `revision-brief.md`。 |
| 本地优先 | Bridge 只在 localhost 写项目文件；私有资料默认不上传，除非用户明确选择。 |

## 适合谁使用

| 使用者 | 常见任务 | v5.3 为什么适合 |
|---|---|---|
| 办公团队 | 领导汇报、工作总结、培训课件、项目复盘、销售赋能材料。 | 面对一句话需求时先自动扩写 brief，再开始生成正式 deck。 |
| 金融、政务和企业用户 | 对措辞、品牌边界和资料来源更敏感的正式材料。 | 官方/IP 素材有记录，外部发布不允许假 logo 式占位。 |
| 咨询和内部战略团队 | 结构化叙事、行业扫描、解决方案、管理层摘要。 | 生成前用统一的 `project-brief.json` 锁定结构、受众和表达方式。 |
| 活动和品牌团队 | 发布会、活动宣讲、文旅推介、产品展示、公众传播材料。 | Codex/GPT 生图负责完整构图的无文字视觉，业务内容继续可编辑。 |

## 典型使用场景

| 用户请求 | v5.3 默认处理 |
|---|---|
| “帮我做个 PPT。” | 创建 `bestEffectBrief`；如果是极短指令且没有正式可编辑信号，默认走 Guizang-like Magazine Web Deck fixed style。 |
| “把这份资料做成 PPT。” | 如果资料没有受众或目的，先问使用场景、目标受众和希望达成的结果；之后默认做可编辑 PPTX。 |
| “视觉再高级一点。” | 先读资料并命名主题艺术方向，必要时生成无文字支撑视觉，同时保持标题、数字、表格和图表可编辑。 |
| “这个要对外发，涉及品牌。” | 为 logo、活动 IP、卡面、二维码、合作方标识和生成图片建立官方/IP 素材计划。 |
| “评审后还要继续改。” | 先渲染审阅，写出 findings 和安全修复计划，确认后再生成 `revision-brief.md`。 |

## 你会得到什么

| 交付物 | 包含什么 | 为什么重要 |
|---|---|---|
| `bestEffectBrief` | 提示质量、自动扩写 brief、推荐路线、Extreme Thin Prompt Fallback、固定样式和默认假设。 | Agent 不再直接拿用户粗略一句话当生产 brief。 |
| 可编辑 PPTX | 真实文本框、形状、图表、表格、备注，以及安全场景下的可编辑品牌文字锁定。 | 交付物能给 PowerPoint 用户继续改，不是只能看的截图。 |
| Web Deck | 用于演讲、展示和杂志化表达的单文件浏览器演示。 | 当视觉节奏和快速分享比 PowerPoint 编辑更重要时使用。 |
| `project-brief.json` | `briefMode`、`visualBrief`、`guidedBrief`、`expectationFit`、`sourceConfidence`、`deliveryScorecard`、`referenceStyle`、`feedbackLoop` 和 `confirmationBrief` 统一进入 handoff 契约。 | 系统能分清哪些信号来自用户、哪些来自标签、哪些是默认假设，以及用户不满意时该修哪一层。 |
| 可视化 brief | 场景、受众、目的、内容状态、视觉风格、排版密度、素材策略、输出偏好、背景文本、链接和特殊要求。 | Web 用户不用填长问卷，也能表达一份足够丰富的 PPT 需求。 |
| 分步访谈 brief | Codex 收集的场景、受众、目的、核心观点、资料来源、页数、章节、风格、素材、输出、必含和禁忌。 | 聊天入口会把制作 PPT 所需的核心要素一步步问清楚。 |
| 预期契合度 | 绿色/黄色/红色风险、来源可信度、缺失信号、默认假设、交付评分卡和是否可进入正式制作。 | 高风险的模糊 brief 会在生成前暴露出来。 |
| 来源和素材记录 | `source-map.json`、`image_sources.json`、`image_prompts.json` 和官方/IP fallback 说明。 | 审阅者能看到哪些内容来自资料、生成、替换或待授权。 |
| 审阅包 | 渲染预览、问题清单、修复候选和质量状态。 | 修订从可观察问题出发，而不是反复说“再高级一点”。 |

## v5 做对了什么

v5.0.0 把产品升级成真实办公 PPT 的交付默认系统。v5.1.0 加入模糊需求的分步访谈。v5.2.0 把这些信号变成预期契合合同。v5.3.0 补上 Agent 真正好用的前置层：短指令先自动扩写为最佳效果 brief，只有主题时用固定高质量 Guizang-like Web Deck 默认样式兜底。

| v5 默认 | 实际效果 |
|---|---|
| 最佳效果提示增强器 | 每次 Agent 运行先写 `bestEffectBrief`：提示质量、自动扩写 brief、默认假设、推荐路线、固定 fallback 和用户可见 caveat。 |
| 极短指令 fallback | 只有主题或一句话时，默认走 Guizang-like Magazine Web Deck fixed style；明确正式可编辑时才切 PPTX。 |
| 预期契合合同 | `project-brief.json` 和 `quality-report.json` 会携带 `sourceConfidence`、`deliveryScorecard`、`referenceStyle`、`feedbackLoop`、`failureTaxonomy`、`confirmationBrief` 和 `imageAcceptance`。 |
| 可编辑 PPTX 优先 | 正式汇报、咨询方案、金融/政务材料和普通“做 PPT”请求，在 brief 足够清晰后直接进入 PowerPoint 可交付路线。 |
| Visual Brief Builder | Web 端支持多样标签组合，并允许粘贴背景资料、会议纪要、领导要求、参考链接和特殊要求。 |
| Codex 分步访谈 | 请求模糊时，Codex 分阶段追问：受众和场景、资料和核心观点、页数和章节、视觉风格、素材策略、输出格式和合规边界。 |
| 统一需求契约 | Web 标签和 Codex 访谈答案都进入 `project-brief.json`，Bridge、Desktop Worker、审计和提示词读同一份意图。 |
| 预期契合闸门 | 绿色代表可制作；黄色代表带 caveat 推进；红色代表先澄清，或用户明确接受默认假设后再做草稿。 |
| 反馈归因 | 如果用户不满意，下一版先归因：需求理解偏差、资料不足、风格不符合、排版密度不合适、素材/IP 边界不清或输出格式不匹配。 |
| Codex-first 生成视觉 | 生图只做无文字支撑层或可复用微资产；正文、数字、图表和表格保持可编辑。 |
| 官方/IP 素材计划 | 确定性标识必须可溯源或有替代说明；外部发布禁止假 logo 式占位。 |
| 主题艺术方向 | Agent 读完素材后先命名贴合主题的艺术概念，例如文旅材料可用 `山海交汇 烟火同行`，再把它贯穿首尾页、主标题和必要的章节 motif；严肃汇报场景走克制例外。 |
| 字体与版式体系 | 默认 CJK 办公字体是微软雅黑；正文通常 18-24px，标题/正文比例、边距和留白有明确下限。 |
| 正式商务审计 | `design_spec.md`、`spec_lock.md`、`design-quality-report.md`、素材清单和 PPTX/Web 产物都进入检查。 |

## v5 交付标准

| 维度 | 标准 |
|---|---|
| 先扩写最佳 brief | Agent 必须先把短指令扩写成 `bestEffectBrief`，并记录自动推断的假设。 |
| 极短指令默认 | 未明确要求正式可编辑 PPTX 时，默认使用 Guizang-like Magazine Web Deck fixed style。 |
| 先问关键问题 | 当缺失答案会改变交付物时，Codex 进入分步访谈，不静默猜测。 |
| 草稿兜底 | 如果用户明确说“按默认做一版”或“先做草稿”，系统可以带假设推进，但必须记录假设。 |
| PPTX 可编辑性 | 业务内容保持可编辑；整页栅格图片只用于有意设计的无文字背景、插画或 Web Deck 浏览器场景。 |
| 生图方式 | Codex/GPT 视觉必须是完整构图场景或支撑资产，不嵌文字、不伪造 logo，并保留提示词记录。 |
| 官方素材 | Logo、卡面、二维码、活动 IP 和合作方标识必须标明 official-source、user-provided、text-lockup fallback 或 needs-authorized-replacement。 |
| 字体 | 中文办公默认微软雅黑；标题、正文、注释、数字和页脚必须有清晰层级。 |
| 排版 | 16:9 页面使用安全边距、卡片数量限制、可读正文尺度，并在总览、流程、对比、数据、案例和收尾页之间保持版式变化。 |
| 交付 | 最终包应包含 PPTX 或 Web Deck、渲染审阅、质量报告、来源记录、预期 caveat 和素材 caveat。 |

## 产品闭环

生产路径被刻意收窄。它应该像一位熟练 PPT 制作者把杂乱资料整理成可交付文件，而不是让用户配置一堆引擎选项。

```text
用户需求或源资料
  -> 最佳效果提示增强器
  -> 清晰度判断 / 极短指令 fallback
  -> Web 可视化标签或 Codex 分步访谈
  -> 带 bestEffectBrief + expectationFit 的 project-brief.json
  -> 官方/IP 素材计划
  -> 页面角色 + 页面配方 + 可编辑/raster 策略
  -> 必要时生成 Codex/GPT 无文字视觉资产
  -> 可编辑 PPTX 或杂志风 Web Deck
  -> 渲染审阅发现
  -> 安全修复计划 + revision-brief.md
  -> 正式交付审计
```

核心产物，用白话说：

- `project-brief.json`：生产 brief；v5.3 记录 `bestEffectBrief`、`briefMode`、`visualBrief`、`guidedBrief` 和 `expectationFit`。
- `design_spec.md`：人能读懂的设计契约，记录视觉方向、页面角色、字体、素材、预期风险和完成 caveat。
- `spec_lock.md`：机器可读执行锁，记录页面配方、视觉层、raster 策略、品牌素材、预期契约和审美检查。
- `storyboard.json`：DeckIR 页面地图，包含页面角色、recipe id、证据引用、raster 策略和可编辑目标。
- `source-map.json`：deck 使用或保留的可追溯来源 claim。
- `images/image_sources.json` 与 `images/image_prompts.json`：官方/公开/生成式素材来源和提示词记录。
- `review-findings.json`：渲染审阅问题，包含严重性、风险级别、修复目标和建议命令。
- `repair-plan.json`：低风险修复候选；默认只 dry-run。
- `revision-brief.md`：只有用户明确 safe apply 后才生成的二次修订 brief。
- `quality-report.json`：合并交付、策划、预期契合和渲染审阅状态。

DeckIR 就是页面地图；页面配方就是每页怎么排、怎么组织信息；raster 策略就是哪些视觉层可以变成图片、哪些内容必须继续可编辑。

## 60 秒开箱即用

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

然后打开 [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/)。选择推荐标签组合、补充标签、粘贴背景资料、连接本机，再生成 handoff 项目。

| 需求 | 推荐路线 | 产出 |
|---|---|---|
| 只有主题或一句话 | Guizang-like 固定 Web Deck | 稳定 8 页 Style A 电子杂志 × 电子墨水 HTML deck。 |
| 正式汇报、咨询方案、培训课件、需要别人继续改的材料 | 可编辑 PPTX | 文字、形状、图表、表格、备注和质量检查都保留的 PowerPoint。 |
| 演讲、展示、发布会、demo day、杂志化表达 | Web Deck | 单文件浏览器演示，视觉节奏更强，适合快速分享预览。 |
| 同时要正式转发和现场演示 | 双版本交付 | PPTX 与 Web 项目分开生成，但共享资料和结构口径。 |
| 需求模糊但期待很高 | Codex 分步访谈 | 先分阶段问清楚，确认 brief 后再进入 PPTX/Web 制作。 |

## 真实生产流程

| 步骤 | Agent 应该做什么 |
|---|---|
| 先扩写 | 把原始请求改写成 `bestEffectBrief`，包含路线、风格、页数、假设和固定 fallback 状态。 |
| 判断清晰度 | 判断需求是否可制作、黄色风险，还是太模糊。 |
| 选择标签或追问 | Web 端使用 Visual Brief 标签；聊天入口缺关键上下文时使用 Codex 分步访谈。 |
| 确认 brief | 制作前汇总目标、受众、内容框架、页数、风格、素材、输出格式和默认假设。 |
| 读资料 | 先提炼核心信息、限制、关键数字和具名素材，再规划页面结构。 |
| 规划页面 | 每页都有明确角色：封面、总览、证据、流程、对比、数据、案例、路线、行动号召或尾页。 |
| 制作素材 | 必须用官方或用户素材的地方不猜；只有能强化表达时才生成无文字视觉。 |
| 组装页面 | 业务文字、图表、表格和标签保持可编辑；默认使用微软雅黑和克制的办公层级。 |
| 渲染审阅 | 导出预览后检查版式和素材风险，写 findings，再按安全计划修。 |

## 能力矩阵

| 层级 | 发布 | 保护什么 |
|---|---|---|
| 最佳效果 brief 与固定 fallback | [发布说明 - v5.3.0](./docs/zh-CN/release/release-notes-v5.3.0.md) | 自动扩写 brief、极短指令 fallback、Guizang-like Magazine Web Deck fixed style 和 PPTX 例外路径。 |
| 分步访谈与预期契合 | [发布说明 - v5.1.0](./docs/zh-CN/release/release-notes-v5.1.0.md) | 可视化标签、Codex 分阶段追问、统一 `project-brief.json` 和生成前风险判断。 |
| 预期契合合同 | [发布说明 - v5.2.0](./docs/zh-CN/release/release-notes-v5.2.0.md) | 来源可信度、参考样板选择、交付评分卡、反馈归因、需求确认稿和图片验收。 |
| 交付默认规范 | [发布说明 - v5.0.0](./docs/zh-CN/release/release-notes-v5.0.0.md) | 默认 PPTX、一份交付简报、官方/IP 素材处理、微软雅黑版式尺度和 Codex-first 生图。 |
| 渲染审阅和修订 brief | [v4.3 渲染审阅闭环](./docs/zh-CN/quality/rendered-review-loop-v4.3.md) | 渲染后审阅、低风险修复计划、确认后生成 `revision-brief.md`。 |
| AI 策划 | [v4.2 DeckIR AI 策划工作流](./docs/zh-CN/quality/deckir-ai-planning-workflow-v4.2.md) | `scripts/ai_storyboard.py`、`storyboard.json`、证据引用、可编辑目标和无 key fallback。 |
| 精简网页控制台 | [v4.1 精简网页控制台](./docs/zh-CN/release/release-notes-v4.1.0.md) | 四步控制台、一个状态驱动主按钮、分组预览、更低首屏复杂度。 |
| 混合可编辑生成 | [v4.0 混合可编辑视觉工作流](./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md) | 页面配方、无文字生成式视觉层、可编辑 PPTX 正文、正式 raster 策略。 |
| 公开证明面 | [v2.5 质量工作台](./docs/zh-CN/quality/quality-workbench-v2.5.md) | 公开案例墙、合成 proof packs、Design Doctor 报告和发布检查。 |

历史发布说明：[v5.2.0](./docs/zh-CN/release/release-notes-v5.2.0.md)、[v5.1.0](./docs/zh-CN/release/release-notes-v5.1.0.md)、[v5.0.0](./docs/zh-CN/release/release-notes-v5.0.0.md)、[v4.3.0](./docs/zh-CN/release/release-notes-v4.3.0.md)、[v4.2.0](./docs/zh-CN/release/release-notes-v4.2.0.md)、[v4.1.0](./docs/zh-CN/release/release-notes-v4.1.0.md)、[v4.0.0](./docs/zh-CN/release/release-notes-v4.0.0.md)、[v3.0.0](./docs/zh-CN/release/release-notes-v3.0.0.md)。

## 证明材料

[公开案例墙](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) 保留合成 proof packs，用户不安装也能先判断产出。

| 证明 | 链接 |
|---|---|
| v5.3 最佳效果提示增强器 | [发布说明 - v5.3.0](./docs/zh-CN/release/release-notes-v5.3.0.md) |
| v5.2 预期契合合同 | [发布说明 - v5.2.0](./docs/zh-CN/release/release-notes-v5.2.0.md) |
| v5.1 分步访谈发布 | [发布说明 - v5.1.0](./docs/zh-CN/release/release-notes-v5.1.0.md) |
| v5 交付默认规范发布 | [发布说明 - v5.0.0](./docs/zh-CN/release/release-notes-v5.0.0.md) |
| 渲染审阅发布 | [发布说明 - v4.3.0](./docs/zh-CN/release/release-notes-v4.3.0.md) |
| DeckIR AI 策划包 | [发布说明 - v4.2.0](./docs/zh-CN/release/release-notes-v4.2.0.md) |
| 混合可编辑发布 | [发布说明 - v4.0.0](./docs/zh-CN/release/release-notes-v4.0.0.md) |
| 稳定证明矩阵 | [v2.5 质量工作台](./docs/zh-CN/quality/quality-workbench-v2.5.md) |
| Skill 市场准备 | [Skill 市场分发](./docs/zh-CN/strategy/skill-market-distribution.md) |

## 作为 Agent Skill 使用

可复制的 marketplace prompt：

```text
Use $ultimate-ppt-master to expand my short request into a best-effect brief first. If my prompt is extremely thin, use the Guizang-like Magazine Web Deck fixed style by default; if I explicitly need a formal editable deck, use PPTX and keep the same quality checks.
```

熟练用户可以直接安装 Skill：

```bash
bash -lc 'set -e; dir="$HOME/.codex/skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

使用说明：[Agent Setup](./docs/guides/agent-setup.md)。本地连接器：[Agent Connect Bridge](./docs/zh-CN/guides/agent-connect-bridge.md)。

## 仓库地图

| 区域 | 用来做什么 |
|---|---|
| `SKILL.md` 与 `references/` | Agent 行为、分步访谈、路线选择、素材来源、视觉生成和交付规则。 |
| `apps/web` 与 `apps/desktop` | Web Experience、Visual Brief Builder、本地 handoff 入口和 desktop worker 集成。 |
| `apps/bridge` | 本地 `project-brief.json` 创建、预期契合 handoff、源资料解析和 agent task 文件。 |
| `scripts/` | 审计、发布检查、渲染审阅修复、provider 设置和仓库维护。 |
| `templates/` | formal-business 交付使用的设计规格和 spec lock 参考。 |
| `docs/` | 使用指南、发布说明、质量工作流、策略文档和中文文档。 |
| `tests/` | 发布完整性、审计、worker 行为、bridge 行为和公开承诺检查。 |

## 生产稳定性门禁

v5.3 的稳定升级路线先把上游来源、许可证边界和仓库卫生固定下来，再继续吸收归藏和宝玉的新范式。

| 门禁 | 检查什么 |
|---|---|
| `UPSTREAM_SYNC.md` | 记录 PPT Master、归藏和宝玉来源的 `remote_ref`、`local_ref`、`license`、`import_policy`、已吸收能力、暂缓能力和复核日期。 |
| `npm run audit:repo-hygiene` | 拦截 `README 2.md`、`test_release_integrity 2.py`、复制图标资产等 Finder/WPS 式副本。 |
| `npm run audit:image-contracts` | 校验生成图片 manifest，确保每个资产记录 `prompt_path`、backend、source、asset type、aspect ratio、status、page role 和 text policy。 |
| 归藏许可证边界 | 不直接复制 AGPL 后的归藏代码；只吸收行为要求，并在本仓库内重新实现。 |
| 宝玉流程纪律 | 先写 prompt 文件再生成，记录后端选择，并禁止用位图覆盖方式修补生成图文字；文本错误时改 prompt 后重生成。 |

## 文档地图

| 需求 | 阅读 |
|---|---|
| 尝试网页入口 | [Web Experience](./docs/zh-CN/guides/web-experience.md) |
| 连接浏览器、本地资料和 Agent | [Agent Connect Bridge](./docs/zh-CN/guides/agent-connect-bridge.md) |
| 安装和调用 Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| 选择 PPTX / Web Deck / Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| 本地配置 provider key | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| 查看 v5.2 预期契合合同 | [发布说明 - v5.2.0](./docs/zh-CN/release/release-notes-v5.2.0.md) |
| 查看 v5.1 分步访谈 | [发布说明 - v5.1.0](./docs/zh-CN/release/release-notes-v5.1.0.md) |
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
npm run audit:repo-hygiene
npm run audit:image-contracts
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
