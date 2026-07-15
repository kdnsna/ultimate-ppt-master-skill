# v5.2 深度优化指南 / PRD

> **历史记录（v5.2，2026-06-18）。** 本文保留 v5.2 当时的问题判断与优化路线；文中的“当前”“下一阶段”和“持续优化”均以 v5.2 时点为准，不代表当前 v6 的发布状态。

> 日期：2026-06-18  
> 方法：按 `pm-execution:create-prd` 的 PRD 思路组织，覆盖问题定义、用户场景、成功指标、需求拆解、实施路线、验收标准和风险。  
> 适用项目：Ultimate PPT Master v5.1.0 之后的持续优化。

## 1. 一句话结论

v5.1 已经解决了“用户需求太模糊就直接开做”的最大风险。下一阶段的核心不应该继续堆更多入口，而应该把系统升级成一个可以持续学习的 PPT 交付闭环：

```text
需求澄清 -> 资料理解 -> 叙事策划 -> 视觉决策 -> 可编辑生成 -> 渲染审阅 -> 用户反馈 -> 规则/预设/样板沉淀
```

真正要优化的不是“再多一个功能”，而是让每一次交付都更稳定地命中用户的真实预期，并把失败经验沉淀成下一次更好的默认判断。

## 2. 当前状态判断

### 已经很强的部分

| 模块 | 已有能力 | 价值 |
|---|---|---|
| 默认交付路线 | 普通 PPT 请求默认可编辑 PPTX | 避免用户得到不可改的截图式结果。 |
| 分步需求访谈 | `briefMode`、`visualBrief`、`guidedBrief`、`expectationFit` | 降低需求不清导致的偏差。 |
| Web Visual Brief | 场景、受众、目的、内容状态、风格、密度、素材、输出标签 | 让非专业用户能快速表达需求。 |
| Codex 任务包 | `codex-task.md`、`AGENTS.md`、`quality-checklist.md` | 让 Agent 不是只拿到一句 prompt。 |
| 资产治理 | 官方/IP 素材边界、AI 生图提示词、素材来源记录 | 降低品牌和版权风险。 |
| 正式商务审计 | formal-business gate、视觉配方、渲染审阅、repair plan | 从“生成”升级到“可验收”。 |
| 本地优先 | Bridge 只写本地 handoff，私有资料默认不上传 | 适合办公、金融、政务和企业用户。 |

### 仍然会导致“不满意”的部分

| 风险 | 表现 | 根因 |
|---|---|---|
| 需求虽然被问清，但没有被验证 | 用户回答了问题，生成结果仍可能不像他心中的 PPT | 缺少“预期样板选择”和“满意度回写”。 |
| 资料理解没有置信度 | Agent 可能把不完整资料当完整资料处理 | 缺少 source confidence 和 claim coverage。 |
| 叙事质量依赖 Agent 临场发挥 | 同一类材料可能结构不稳定 | 预设包数量少，稳定样板不足。 |
| 视觉方向可描述，但不够可选择 | “正式大气”“科技简洁”仍然宽泛 | 缺少可视化风格参考、风格反例和强约束 token。 |
| 生图资产有计划，但缺少质量闭环 | 有 prompts，不一定有可用图 | 缺少 image acceptance rubric 和失败替换策略。 |
| 审计偏工程，用户感知偏弱 | audit pass 不等于用户满意 | 缺少“用户可读质量报告”和“交付评分”。 |
| 产物学习没有闭环 | 每次修好以后规则不一定沉淀 | 缺少失败案例库、规则回写和 preset 升级机制。 |

## 3. 产品目标

### 北极星目标

让用户从一句话、半结构化资料或完整 brief 出发，最终得到一份“接近真实 PPT 制作者交付”的结果，并且每一次不满意都能被记录、归因、修正和沉淀。

### 阶段目标

| 阶段 | 目标 | 衡量方式 |
|---|---|---|
| v5.2 | 建立交付预期闭环 | 每个项目都有 expectation fit、source confidence、delivery scorecard、feedback summary。 |
| v5.3 | 建立稳定样板闭环 | 新增 3-4 个稳定预设包，每个有 source、输出、截图和质量报告。 |
| v5.4 | 建立视觉资产闭环 | 生图提示词、官方素材、替换策略和可用性评分进入统一 manifest。 |
| v6.0 | 建立生产工作台闭环 | Web/Bridge/Codex/审计/反馈可以持续迭代成一个交付系统。 |

## 4. 用户与真实场景

### 核心用户

| 用户 | 真实诉求 | 他们在意什么 |
|---|---|---|
| 办公团队成员 | 快速把材料做成领导能看的 PPT | 稳重、清楚、可改、别丢内容。 |
| 金融/政务/国企用户 | 正式汇报或对外材料 | 字体、措辞、品牌、合规、来源。 |
| 咨询/战略人员 | 结构化方案和分析报告 | 逻辑严密、图表合理、页面不土。 |
| 活动/品牌人员 | 展示型、发布型、文旅型材料 | 首页和主视觉要有记忆点，但内容还要可编辑。 |
| Agent 使用者 | 想把本地资料交给 Codex 深加工 | prompt、文件、审计和下一步命令要清楚。 |

### 关键 Job To Be Done

| 场景 | 用户心里真正要的 |
|---|---|
| “帮我做个 PPT” | 不想解释太多，但希望 Agent 像懂业务的人一样追问关键点。 |
| “把这个 PDF 做成 PPT” | 不只是摘抄 PDF，而是提炼结构、重排信息、提升版式。 |
| “帮我做得高级点” | 不想要重复卡片，想要大厂/咨询/正式办公里常见的视觉层级。 |
| “这个要给领导/客户看” | 不能乱编，不能丢重点，不能像 AI 随便生成。 |
| “再改一版” | 希望修改基于具体问题，而不是又重来一遍。 |

## 5. 产品原则

1. 先判断预期，再承诺交付。  
   不清楚就问，能假设就写清楚，不能假设就挡住。

2. 默认 PPTX，但不牺牲视觉。  
   业务内容保持可编辑，AI 视觉做无文字背景、场景和微资产。

3. 真实资料优先，生成补充其次。  
   事实、品牌、数据和 IP 不能靠生成猜。

4. 每页只有一个主任务。  
   页面不是信息仓库，而是一个判断、一个证据或一个行动。

5. 审计要面向交付，不只是面向代码。  
   质量报告要能告诉用户“哪里稳、哪里有风险、哪里需要授权”。

6. 每次失败都要变成规则或样板。  
   如果一个问题出现两次，就应该进入预设、审计或 prompt 规则。

## 6. v5.2 需求范围

### P0: 交付预期闭环

目标：把 v5.1 的 `expectationFit` 从“生成前判断”升级成“交付后可复盘”。

#### P0.1 新增 `deliveryScorecard`

在 `project-brief.json`、`quality-report.json` 中增加：

```json
{
  "deliveryScorecard": {
    "expectationFitBeforeProduction": {
      "riskLevel": "green | yellow | red",
      "score": 0,
      "missingSignals": [],
      "assumptions": []
    },
    "expectedDeckType": "formal-report | consulting-proposal | training | pitch | public-showcase | research | custom",
    "qualityDimensions": {
      "contentCompleteness": 0,
      "narrativeClarity": 0,
      "visualPolish": 0,
      "editability": 0,
      "assetSafety": 0,
      "audienceFit": 0
    },
    "userVisibleSummary": "",
    "knownRisks": [],
    "recommendedNextRevision": []
  }
}
```

验收标准：

- Web handoff、Bridge handoff、Desktop Worker 都写入该字段。
- `quality-report.json` 里必须有中文摘要。
- tests 覆盖字段存在性和基本类型。

#### P0.2 新增“需求确认稿”模板

Codex Guided Intake 完成后，必须输出一份简洁确认稿：

```text
目标：这份 PPT 要达成什么
受众：给谁看
使用场景：在哪里讲/发/评审
核心结论：希望对方记住什么
内容范围：基于哪些资料，不补哪些内容
页数与结构：预计几页，分几章
视觉方向：正式/咨询/金融/科技/宣传/年轻等
素材边界：官方素材、用户素材、AI 生图、不可出现内容
输出格式：默认 PPTX，是否需要 PDF/Web 预览
默认假设：哪些是系统暂时判断
```

验收标准：

- `codex-task.md` 明确要求生成确认稿。
- `AGENTS.md` 说明确认稿写回 `guidedBrief` 和 `quality-report.json`。
- 用户接受默认假设时，`briefMode` 应转为 `draft-with-assumptions` 或 `source-first`。

#### P0.3 引入“预期样板选择”

在 Web 端给每类标签组合补充 2-3 个可选择的样板方向：

| 类别 | 示例 |
|---|---|
| 高层汇报 | 咨询报告感、金融稳重、经营驾驶舱 |
| 客户提案 | 麦肯锡结构、方案路线图、对比决策 |
| 产品发布 | 科技极简、发布会主视觉、Demo flow |
| 内部培训 | 课程讲义、工作坊、知识卡片 |
| 文旅/宣传 | 城市/文旅主视觉、杂志封面、活动推介 |

验收标准：

- 用户选择样板方向后进入 `visualBrief.referenceStyle`.
- 生成 prompt 里明确“贴近什么，不要像什么”。
- 若用户只选“正式大气”，系统仍提示选择一个更具体方向。

### P1: 资料理解和叙事稳定性

目标：让 Agent 不再把“有资料”简单等同于“资料足够”。

#### P1.1 新增 `sourceConfidence`

在 handoff 中新增资料充分度：

```json
{
  "sourceConfidence": {
    "level": "strong | partial | weak | topic-only",
    "coveredAreas": ["background", "data", "audience", "decision", "constraints"],
    "missingAreas": [],
    "claimsNeedingEvidence": [],
    "doNotInvent": []
  }
}
```

规则：

- 只有主题、没有资料：`topic-only`。
- 有 PDF/Word，但没有目标和受众：`partial`。
- 有数据但没有解释边界：`partial`。
- 有目标、受众、资料、核心结论和约束：`strong`。

验收标准：

- `source-map.json` 与 `sourceConfidence.claimsNeedingEvidence` 对齐。
- quality checklist 中加入“不得超出 sourceConfidence 边界”。

#### P1.2 内容结构从“页纲”升级为“页面任务”

当前已有 `storyboard.json` 和 DeckIR 页面地图，下一步要让每一页明确：

```json
{
  "slideTask": {
    "job": "orient | persuade | prove | compare | explain | decide | recap | ask",
    "primaryQuestion": "",
    "oneSentenceTakeaway": "",
    "evidenceRefs": [],
    "bestLayoutFamily": "",
    "mustStayEditable": true
  }
}
```

验收标准：

- 生成前每页必须有 `oneSentenceTakeaway`。
- 连续三页不能都是 `prove` 或都是 `explain`，除非 spec 说明原因。
- 正式汇报页不能只有标题，没有判断。

#### P1.3 预设包升级

优先把已有 seed 升级成 stable pack：

| 优先级 | 预设 | 原因 |
|---|---|---|
| P1-A | Government / SOE Report | 与正式办公、政务、国企、银行场景高度重合。 |
| P1-A | Training Courseware | 使用频次高，结构稳定，适合沉淀课程页型。 |
| P1-B | Finance / Branch Solution | 用户已有金融/银行场景，能复用交行/银行经验。 |
| P1-B | Research / Academic Defense | 学术结构明确，适合做可编辑 PPTX 样板。 |

每个 stable pack 必须具备：

- `source.sanitized.md`
- PPTX 或 Web Deck 生成结果
- 3-5 张截图
- `quality-report.json`
- `project-brief.json`
- 预设质量检查清单
- README 说明适用/不适用场景

### P1: 视觉质量和素材闭环

目标：让“高级感”不再只靠 prompt，而靠可选择、可验收、可替换的视觉系统。

#### P1.4 新增视觉方向矩阵

把标签里的风格扩展成可执行矩阵：

| 视觉方向 | 适合 | 禁止 |
|---|---|---|
| 金融稳重 | 银行、政务、国企、领导汇报 | 炫彩渐变、幼稚图标、虚假 logo。 |
| 咨询报告感 | 战略、方案、决策材料 | 大段口号、装饰性图片堆叠。 |
| 科技简洁 | 产品、平台、数字化 | 一页塞满技术词、低对比灰字。 |
| 文旅宣传 | 城市、景区、活动推介 | 无主题图片、旅游海报式满屏字。 |
| 内训课程 | 培训、工作坊、操作说明 | 页页大段文字、没有练习任务。 |

每个方向应包含：

- 颜色策略
- 字体层级
- 图片策略
- 图表风格
- 页面密度
- 常见错误
- 适配 page recipes

#### P1.5 AI 生图验收规则

每张 AI 图必须有：

```json
{
  "imageAcceptance": {
    "targetSlide": "",
    "role": "cover-background | section-visual | evidence-illustration | micro-asset | texture",
    "mustHave": [],
    "mustAvoid": ["text", "fake logo", "distorted UI", "wrong brand mark"],
    "editableOverlayPlan": "",
    "replacementStrategy": "regenerate | official-asset | text-lockup | omit"
  }
}
```

验收标准：

- 不允许没有用途说明的生成图片进入正式 deck。
- 生成图不能包含文字和伪 logo。
- 生成失败时必须有替换策略，不能卡住整个 deck。

### P2: 反馈和学习系统

目标：把用户“整体不错，但...”转成结构化改进。

#### P2.1 新增交付后反馈表

在 handoff 或 README 中给用户一个可复制反馈模板：

```text
满意的地方：
不满意的地方：
最不像预期的一页：
内容问题：
视觉问题：
素材/品牌问题：
是否愿意保留当前风格继续修：
下一版更接近哪个参考：
```

验收标准：

- `revision-brief.md` 可以吸收该反馈模板。
- `repair-plan.json` 区分“版式修复”和“预期偏差修复”。

#### P2.2 建立失败样本 taxonomy

每次用户不满意，要归入一种主因：

| 类型 | 描述 | 应该沉淀到哪里 |
|---|---|---|
| brief-mismatch | 需求没问清或理解偏 | Visual Brief / Guided Intake |
| source-misread | 资料理解错或漏 | Source parser / sourceConfidence |
| narrative-weak | 结构松散、没结论 | Preset / slideTask |
| visual-generic | 视觉普通、重复卡片 | Visual direction / page recipes |
| asset-risk | logo/IP/图片不安全 | Asset plan / official-source policy |
| editability-loss | 内容不可编辑 | PPTX audit / raster policy |
| review-gap | 审计过了但用户不满意 | deliveryScorecard / feedback loop |

验收标准：

- `quality-report.json` 中新增 `failureTaxonomy`。
- 每个 taxonomy 至少关联一个可执行改进位置。

## 7. 数据契约总览

建议 v5.2 将 `project-brief.json` 扩展为：

```json
{
  "briefMode": "visual-tags | codex-guided-intake | source-first | draft-with-assumptions",
  "visualBrief": {},
  "guidedBrief": {},
  "expectationFit": {},
  "sourceConfidence": {},
  "deliveryScorecard": {},
  "referenceStyle": {
    "selectedDirection": "",
    "positiveReferences": [],
    "negativeReferences": [],
    "styleConstraints": []
  },
  "feedbackLoop": {
    "feedbackStatus": "none | requested | received | converted-to-revision-brief",
    "failureTaxonomy": [],
    "nextRevisionIntent": ""
  }
}
```

兼容原则：

- 新字段必须有默认值。
- 旧 v5.1 handoff 不应报错。
- Bridge、Web、Desktop Worker 先写字段，再逐步让审计使用字段。

## 8. Web Experience 优化指南

### 信息架构

当前 Web 已经有四步控制台和 Visual Brief Builder。下一步不要再加一个大表单，而是把复杂度藏在“推荐组合”和“风险提示”里。

建议结构：

```text
1. 选场景
2. 选参考方向
3. 粘贴背景或上传资料
4. 查看预期风险
5. 生成本地 handoff
```

### 交互要求

| 功能 | 要求 |
|---|---|
| 推荐组合 | 选择后自动填入标签，但允许用户手动增删。 |
| 冲突提示 | 标签和文本冲突时，黄色风险提示具体冲突点。 |
| 红色风险 | 不阻止下载 handoff，但明确提示 Codex 必须先访谈。 |
| 风格参考 | 用户能选“像咨询报告/金融汇报/课程课件/文旅推介”，而不是只选形容词。 |
| 背景粘贴 | 支持领导要求、会议纪要、参考链接和必须避开的表达。 |
| 本地隐私 | 明确显示“资料只发到 127.0.0.1 Bridge”。 |

### 不建议做

- 不做复杂账号系统。
- 不做浏览器端模型生成。
- 不把 API key 放浏览器。
- 不把所有高级设置平铺到首屏。
- 不把标签做成装饰性 chip，必须影响生成 prompt 和 brief。

## 9. Codex Skill 优化指南

### Codex 执行规则

当用户直接在 Codex 中说“帮我做个 PPT”，必须先进入分步访谈。建议第一轮只问：

```text
这份 PPT 是给谁看、用在什么场景、希望对方看完做什么？
```

第二轮再问：

```text
你有哪些资料来源？希望听众记住的核心观点是什么？有没有必须保留或不能出现的内容？
```

第三轮再问：

```text
大约几页？偏正式汇报、咨询报告感、科技简洁、宣传感还是培训课件？是否允许我用 AI 生成无文字视觉？
```

### 何时可以开始制作

| 条件 | 动作 |
|---|---|
| 目标、受众、资料、核心观点、页数、风格都清楚 | 生成需求确认稿并开始制作。 |
| 资料充分但目标不清 | 先问受众/场景/目的。 |
| 目标清楚但资料不足 | 先问资料边界和是否允许调研补充。 |
| 风格不清 | 给 3-5 个常见风格选项，不让用户只说“高级”。 |
| 用户说先做草稿 | 带假设推进，但必须记录默认假设。 |

### Codex 不应该做

- 不从一句话直接生成正式 PPT。
- 不用假 logo 或类似官方标识。
- 不把正文写进整页图片。
- 不把“正式大气”翻译成一堆蓝色卡片。
- 不跳过渲染审阅和质量报告。

## 10. Bridge / Desktop Worker 优化指南

### Bridge

建议下一步能力：

| 能力 | 说明 |
|---|---|
| brief schema version | 给 `project-brief.json` 增加 `schemaVersion`。 |
| source confidence defaults | 根据附件、文本、链接自动判断资料充分度。 |
| feedback ingestion | 接受用户修改意见并写入 `revision-brief.md` 草稿。 |
| command profile | 根据 Codex/Hermes/OpenClaw 生成不同强度命令。 |

### Desktop Worker

建议下一步能力：

| 能力 | 说明 |
|---|---|
| 输出预期评分 | 与 Web/Bridge 一致写入 `deliveryScorecard`。 |
| 资料解析失败提示 | 文件无法解析时写入明确 caveat。 |
| 双 worker 同步审计 | 继续保持 `apps/desktop/worker` 与 `src-tauri/resources` 完全一致。 |

## 11. 审计和测试计划

### 新增测试

| 测试 | 断言 |
|---|---|
| `tests/web-brief-scorecard.test.mjs` | Web 生成 `deliveryScorecard`、`sourceConfidence`、`referenceStyle`。 |
| `tests/bridge-scorecard.test.mjs` | Bridge handoff 写入新字段并保持旧字段兼容。 |
| `tests/test_desktop_worker_scorecard.py` | Desktop Worker 同步写入新字段。 |
| `tests/test_release_integrity.py` | README/docs/release notes 包含 v5.2 指南链接。 |

### 新增审计

| 命令 | 目的 |
|---|---|
| `npm run audit:brief` | 检查 brief schema、expectationFit、sourceConfidence、deliveryScorecard。 |
| `npm run audit:visual-intent` | 检查 referenceStyle、imageAcceptance、视觉方向矩阵。 |
| `npm run audit:feedback-loop` | 检查 revision brief 是否吸收用户反馈。 |

### 保持现有门禁

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:market
npm run audit:presets
npm run audit:quality
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

## 12. 版本路线建议

### v5.2: Expectation Loop

目标：让每个交付物都有可复盘的预期契合记录。

范围：

- `deliveryScorecard`
- `sourceConfidence`
- `referenceStyle`
- Codex 需求确认稿模板
- Web 风格样板选择
- Bridge/Desktop Worker 字段同步
- docs + tests + audits

不做：

- 不做账号系统。
- 不做云端上传。
- 不做桌面安装包发行。

### v5.3: Stable Preset Expansion

目标：把 seed preset 升级成可证明稳定包。

范围：

- Government / SOE Report
- Training Courseware
- Finance / Branch Solution
- Research / Academic Defense
- 每个 pack 都有 starter proof。

### v5.4: Visual Asset Reliability

目标：让 AI 生图、官方素材和替代策略可验收。

范围：

- `imageAcceptance`
- 视觉方向矩阵
- 生成失败替换策略
- 官方/IP 素材 audit 强化
- cover/section/body 的不同生成策略

### v6.0: Production Studio

目标：从 Skill + Web handoff 进化为真实生产工作台。

范围：

- 项目级历史记录
- 反馈转 revision brief
- 可视化 scorecard
- 样板库和失败样本库
- 多 Agent 命令 profile
- 更完整的本地交付仪表盘

## 13. 关键验收标准

v5.2 完成后，应该能证明这些事情：

1. 用户只说“帮我做个 PPT”时，Codex 不会直接开做正式稿。
2. 用户用 Web 选标签时，标签会进入 `project-brief.json` 并影响 prompt。
3. 用户没有资料时，系统明确标记 `sourceConfidence=topic-only`。
4. 用户资料有冲突时，系统黄色/红色风险提示具体冲突点。
5. 每个 handoff 都有 `deliveryScorecard`。
6. 每张正式生图都有用途、禁忌和替换策略。
7. 质量报告能被非工程用户读懂。
8. 用户反馈能转成 `revision-brief.md`，而不是只变成一句“再高级一点”。

## 14. 风险和缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 字段越来越多，用户感觉复杂 | Web 入口变重 | 继续用推荐组合和折叠面板，首屏只保留下一步。 |
| Codex 问太多 | 用户疲劳 | 每轮只问一组问题，允许“先做草稿”。 |
| 审计过度工程化 | 用户看不懂 | 增加中文 userVisibleSummary。 |
| 视觉方向矩阵太僵 | 创意受限 | 支持 custom direction，但必须记录禁忌和样板。 |
| 生图质量不稳定 | 产物观感波动 | 加入 imageAcceptance 和 replacementStrategy。 |
| 预设包维护成本高 | 文档和样板过期 | 每个 preset 进入 audit:presets，发布前检查。 |

## 15. 推荐实施顺序

```text
第 1 步：补数据契约
  project-brief.json / quality-report.json / manifest.json 新增字段和默认值

第 2 步：补 Web 选择体验
  referenceStyle 样板方向 + 风险提示更具体

第 3 步：补 Codex 访谈模板
  需求确认稿 + 分步问题 + 草稿兜底

第 4 步：补 Bridge/Desktop 同步
  新字段贯穿 handoff、codex-task、AGENTS、quality-report

第 5 步：补审计和测试
  audit:brief + test:bridge + test:worker + release integrity

第 6 步：挑 2 个 preset 升 stable
  Government/SOE Report + Training Courseware
```

## 16. 最终建议

Ultimate PPT Master 下一阶段最值得投入的不是“再增加一个生成模式”，而是把每次交付的预期、资料、视觉、审计和反馈都结构化。

如果只能做一个方向，优先做 v5.2 Expectation Loop。它会直接解决用户最敏感的问题：为什么我明明让你做 PPT，最后不像我想要的。  
如果能做两个方向，第二个做 stable preset expansion。它会把 Agent 的不确定性变成可复用样板。  
如果要做成长期产品，v6.0 应该围绕“生产工作台”展开，而不是围绕“更多生成按钮”展开。
