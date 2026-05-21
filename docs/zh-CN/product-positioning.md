# 产品定位反思

Ultimate PPT Master 不应该和“让 Codex 一句话安装 Skill”比谁更短。对专家用户来说，直接安装 Skill 已经很好。这个产品真正要赢的是：把专家工作流变成更亲民、更安全、更可重复的第一公里体验。

## 为什么不直接安装 Skill？

直接安装 Skill 适合已经知道这些问题答案的用户：

- 要走可编辑 PPTX，还是 HTML Web Deck；
- 资料文件应该放在哪里；
- 如何描述受众、场景、风格、模型和输出约束；
- 本地 provider key 是否配置好了；
- 交付前应该跑哪些检查。

多数潜在用户第一分钟并不知道这些。如果只给 Codex 一句模糊指令，Agent 也可能成功，但需要猜太多。

Ultimate PPT Master 在 Agent 开始前提供价值：

- **减少决策负担**：网页把模糊需求变成结构化选项。
- **本地资料整理**：Bridge 把真实文件打包成 handoff 文件夹，而不是散落在聊天里。
- **路线清晰**：PPTX、Web Deck、双路线生产都变成显式选择。
- **配置可见**：用户能看到本地模型/API 是否可用，但不会泄露 key。
- **质量契约**：handoff 中包含 engine plan 和 checklist，让 Agent 知道如何验收。
- **保留上游质量上限**：最终生产仍走 PPT Master 和歸藏风格工作流，不退化成弱网页生成器。

## 产品原则

网页层不要假装自己是完整生产引擎。它负责让第一公里更清楚、更安全；Skill 才是质量上限。

## 应该优化什么

| 用户麻烦 | 产品回应 |
|---|---|
| “我不知道要什么格式。” | 先讲清 PPTX 与 Web Deck 的取舍。 |
| “我有文件，不是干净 prompt。” | 支持文件、URL、粘贴文本，并统一打包。 |
| “我不知道本地环境能不能跑。” | 检测 Bridge、Agent 命令、provider 状态和启动模式。 |
| “我不信黑盒生成。” | 本地优先，暴露 manifest/checklist，保留原始附件。 |
| “我本来就会装 Skill。” | 专家用户可以跳过网页，直接用 Skill。 |

## 上游质量基线

融合包要不输上游，关键是保留它们最强的约束：

- PPTX 路线：原生可编辑 PPTX、严格 SVG 手写、项目管理、visual review、模板/品牌预设、SVG 校验、导出检查。
- Web Deck 路线：单文件 HTML、Style A 电子杂志、Style B Swiss 锁定版式、最小字号规则、图片槽位规则和 Swiss validator。
- Fusion 路线：只增加导入、路线规划、本地 Bridge、handoff 打包和跨 Agent 说明，不削弱任何上游路线。

## 本机基准测试

2026 年 5 月本机同素材测试：

- Hugo He `ppt-master`，commit `668131f`：浅克隆约 1.2GB；依赖安装约 187 秒；生成 6 页 SVG 并成功导出可编辑 PPTX。
- op7418 `guizang-ppt-skill`，commit `6bfa520`：浅克隆约 4.8MB；生成 7 页 Swiss HTML；Swiss validator 通过。
- Ultimate PPT Master Bridge：成功生成本地 handoff 项目，包含 `source.md`、`extracted-source.md`、`attachments/`、`manifest.json`、`agent-prompt.md`、`engine-plan.md` 和 `quality-checklist.md`。

结论：融合产品不应该宣称在单一路线里碾压原作者项目。它应该让用户更容易选择、准备、组合并运行这些强工作流。
