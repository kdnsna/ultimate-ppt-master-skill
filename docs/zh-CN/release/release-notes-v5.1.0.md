# 发布说明 - v5.1.0

v5.1.0 聚焦 PPT 生成前的最后一公里：用户需求不明确。v5.0 已经把系统变成更直接的交付默认流程；v5.1 进一步降低“做出来和用户想的不一样”的风险，新增 Web 可视化 Brief Builder、Codex 分步访谈，以及生成前记录缺失信号的 `expectationFit` 闸门。

## 更新内容

- Web Experience 新增 Visual Brief Builder，支持按场景、受众、目的、内容状态、视觉风格、排版密度、素材策略和输出偏好选择标签。
- 新增推荐标签组合：高层汇报、客户提案、产品发布、内部培训和调研报告。
- 新增自由输入区域，用于粘贴背景资料、会议纪要、领导要求、参考链接和特殊约束。
- Codex 聊天入口新增 Guided Intake 规则。用户信息不足时，Codex 分阶段追问，而不是直接猜测生成。
- 新增统一 `project-brief.json` 契约，包含 `briefMode`、`visualBrief`、`guidedBrief` 和 `expectationFit`。
- 新增绿色/黄色/红色预期契合风险，用于区分可正式制作、带假设可推进、需要先澄清的 brief。
- Bridge 与 Desktop Worker 输出同步升级，Codex 任务、`AGENTS.md`、manifest、design spec、spec lock 和质量报告都会携带同一份预期契约。
- 测试和审计覆盖 Web 标签、分步访谈字段、Bridge handoff、Desktop Worker 同步和 release integrity。

## Codex 分步访谈

当用户提供的信息太少时，Codex 应分阶段收集制作 PPT 所需的关键信号：

1. 使用场景、目标受众和希望达成的结果。
2. 资料来源、资料完整度和核心观点。
3. 页数、章节结构和是否需要演讲备注。
4. 视觉风格、排版密度、参考对象和微软雅黑排版预期。
5. 官方/IP 素材规则、是否允许 AI 生图、输出格式和合规边界。

如果用户明确说“先按默认做一版”或“先做草稿”，Codex 可以带假设推进，但必须把假设写进 brief 和审计记录。

## 数据契约

`project-brief.json` 现在包含：

```json
{
  "briefMode": "visual-tags | codex-guided-intake | source-first | draft-with-assumptions",
  "visualBrief": {
    "selectedTags": {},
    "backgroundText": "",
    "extraRequirements": "",
    "referenceLinks": []
  },
  "guidedBrief": {
    "scenario": "",
    "audience": "",
    "purpose": "",
    "coreMessage": "",
    "contentSources": [],
    "slideCount": "",
    "outlinePreference": "",
    "visualStyle": [],
    "assetRules": [],
    "outputFormat": [],
    "mustInclude": [],
    "mustAvoid": []
  },
  "expectationFit": {
    "riskLevel": "green | yellow | red",
    "missingSignals": [],
    "assumptions": [],
    "readyForProduction": true
  }
}
```

## 白话更新栏

- Web 用户可以通过更丰富的标签快速表达需求，不需要填长问卷。
- Codex 用户在需求模糊时会得到真正的 PPT 制作访谈。
- 系统会告诉 Agent：当前 brief 是可以制作、带风险但可推进，还是信息太少需要先问清。
- 生成的 PPT 更容易贴近用户真实预期，因为受众、目的、资料、页数结构、风格、素材和输出格式会在制作前被记录。
- v5.0 的默认交付规则继续保留：默认可编辑 PPTX、Codex/GPT 无文字生图、官方/IP 素材边界、微软雅黑排版、渲染审阅和正式商务审计。

## 兼容性

v5.1.0 对既有项目是增量兼容。v5.0 handoff 文件仍可使用；新的 handoff 会包含更多 brief 字段，下游 Agent 应在提示词、spec、lock、manifest 和质量报告中保留它们。

本次 release 不上传桌面二进制安装包。桌面构建仍属于发布门禁，但公开分发继续以源码包和 Web/Agent 工作流为主，除非后续单独产出签名桌面包。

## 验证

发布验证应包含：

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:market
python3 -m unittest tests/test_release_integrity.py
npm run audit:presets
npm run audit:quality
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```
