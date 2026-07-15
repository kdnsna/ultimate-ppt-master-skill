# 下一步路线 - 内容与模板预设

> **历史路线（已归档）**：本文记录 v2.5-v5.5 阶段的规划，不代表 v6.3.6 当前路线。现行入口见 [v6.3.6 发布说明](../release/release-notes-v6.3.6.md) 与 [中文文档导航](../README.md)。

v2.5 已经把第一公里变得更清楚、更可验：输入看得懂，预设有证明，本地 Agent 接得住，Design Doctor 能复查。

下一步的产品重点应该是产出稳定性。Ultimate PPT Master 不能只依赖 Agent 临场发挥，而要把内容结构、模板预设、图表选择和检查标准沉淀下来，让用户不用每次从空白 prompt 开始。

## 当前 v5 路线

v5.4 把原计划里的 Swiss Deck 和 Asset Factory 合并成一个版本：Style A 继续作为极短指令下的电子杂志默认路线，Style B 成为面向数据和信息设计的瑞士国际主义路线，`asset_plan.json` 成为图片生成的父级合同。

v5.5+ 不应该先追求更多图片后端。下一条研究线是 HTML Deck 到可编辑 PPTX：尽量保留 Web Deck 的 HTML/CSS 版式意图，再研究哪些内容能映射回可编辑 PowerPoint 文本、形状、表格、图表和图片槽位，而不是把 deck 变成整页截图。

v5.5+ 研究仍然要遵守同一条产品原则：正式办公输出优先可编辑 PPTX，Web Deck 优先 HTML/CSS，生成图片服务于 deck，而不是替代可编辑内容。

## 方向

建立一套预设系统，每个预设都包含：

- 对应场景的 `source.md` 骨架；
- 默认叙事结构；
- 推荐页型和页序；
- 来自 `templates/` 的 layout / brand / chart 候选；
- PPTX、Web Deck 或双路线的输出建议；
- 质量检查清单；
- 至少一个可见的输入样板和产出样板。

这样既能接近 Hugo 式的可复用生产模式，也能保留歸藏式 Web Deck 路线的视觉上限。

## 预设契约

每个稳定预设都应该包含：

| 字段 | 作用 |
|---|---|
| 使用场景 | 这个预设解决哪类真实用户任务。 |
| 目标受众 | 谁会看这份 deck。 |
| 资料要求 | 用户生成前应该提供什么材料。 |
| 叙事骨架 | Agent 默认应该怎样讲故事。 |
| 页面结构 | 推荐页型和顺序。 |
| 模板候选 | Layout、brand、chart、Web Deck 风格候选。 |
| 质量检查 | 交付前必须检查什么。 |
| 样板证明 | `source.md`、生成结果、截图和说明。 |

预设种子目录：[`templates/presets/preset-directions.json`](../../../../templates/presets/preset-directions.json)

## v2.5 Stable Pack

| 预设 | 主要输出 | 为什么重要 |
|---|---|---|
| 经营复盘 / 高管汇报 | 可编辑 PPTX + 可选 Web Deck | 月报、季报、经营复盘非常常见，需要稳定的 KPI、诊断和行动页。 |
| 咨询方案 | 可编辑 PPTX | 强化问题定义、方案比较、路线图和建议页，减少空泛商务感。 |
| 产品路演 | Web Deck + 可选 PPTX | 让公开 demo、产品发布和创业叙事更有记忆点。 |
| 科技趋势 Web Deck | Web Deck | 保持公开样板路线的视觉冲击力、来源可信度和可分享性。 |

这四个预设已经在 [`templates/presets`](../../../templates/presets) 下具备 stable-pack 文件夹，在 `examples/*-starter/` 下有可见 starter proof，并补充了 `quality-report.json`。证明矩阵见 [v2.5 质量工作台](../quality/quality-workbench-v2.5.md)。

## 后续候选预设包

| 预设 | 主要输出 | 为什么重要 |
|---|---|---|
| 培训课件 | 可编辑 PPTX | 把内训、工作坊和新人培训变成可复用课程结构。 |
| 学术答辩 / 研究汇报 | 可编辑 PPTX | 复用现有学术模板，并补上稳定研究叙事。 |
| 政务 / 国企汇报 | 可编辑 PPTX | 复用政务和国企模板，保证正式场景的语气和版式。 |
| 金融 / 分支机构方案 | 可编辑 PPTX | 沉淀银行、金融产品和分支机构经营方案的固定结构。 |

## 发布标准

不要把一个预设称为“稳定”，除非它具备：

- 一份公开或脱敏 `source.md`；
- 一个能本地打开的生成结果；
- 一张放在 `assets/readme/` 或 `examples/` 的截图；
- 明确的 layout / brand / chart 推荐；
- 能覆盖叙事、数据、可读性、导出和移动端预览的检查清单；
- 标注适合公开 demo，还是只适合本地 / 私有使用。

## 后续版本

| 版本 | 重点 |
|---|---|
| v2.4 | 把第一批预设种子变成 starter pack，在 Web Experience 中露出，并把 pack 契约审计接入 CI。 |
| v2.5 | 把当前 pack 推到 stable proof 合同，加入 Design Doctor，并把质量目标写入 handoff manifest。 |
| v2.6 | 增加更深入的 PPTX 与 Web Deck 双路线预设质量基准测试。 |

## 产品原则

预设系统是为了减少不确定性，而不是隐藏工作流。用户仍然应该看见自己给了什么资料、选择了哪个预设、会走哪条路线，以及 Agent 必须通过哪些检查。
