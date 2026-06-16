# 发布说明 - v5.0.0

v5.0.0 把 Ultimate PPT Master 重新定位成真实办公 PPT 的交付默认系统。它保留 v4.3 渲染审阅闭环、v4.2 DeckIR 策划包、v4.1 精简网页控制台和 v4.0 混合可编辑契约，再把正常路径变得更直接：默认可编辑 PPTX、一份交付简报、官方/IP 素材边界、Codex-first 视觉、微软雅黑排版和 formal-business 审计。

## 重点变化

- 泛泛地说“做 PPT”时，默认进入可编辑 PPTX，除非用户明确要 Web Deck 或杂志风浏览器交付。
- Skill 不再把用户拖进多轮路线/风格确认，而是用一份交付简报记录画布、页数、受众、风格、颜色、图标、字体和图片策略。
- 正式商务 handoff 更强调 `design_spec.md`、`spec_lock.md` 和 `design-quality-report.md` 作为生成前的设计契约。
- Codex 原生 GPT 生图成为推荐视觉资产路径，用于完整构图的无文字支撑视觉和可复用微资产。
- 官方/IP 标识必须记录处理状态：`official-source`、`user-provided`、`text-lockup-fallback` 或 `needs-authorized-replacement`。
- 交付默认规范明确了微软雅黑、16:9 边距、正文/标题尺度、卡片数量、版式变化和真实 PPT 交付中的反模式。
- formal delivery 审计更明确地检查品牌素材状态、字体尺度、审美检查、页面角色、版式变化和生成式视觉记录。
- 仓库 README 已重构成 v5 交付系统首页，而不是历史发布清单。

## 白话更新栏

- 用户说“做个 PPT”时，Skill 现在先给办公场景最稳妥的答案：真正可编辑的 PowerPoint。
- Agent 应该少问问题。它会记录一份紧凑的生产契约并继续推进，只有缺失答案会实质改变交付物时才停下来。
- AI 图片应该是设计过的场景或有用的支撑层，不是随机装饰元素堆叠。
- Logo、文旅 IP、卡面、活动标识和合作方标识不能猜。找不到安全来源时，交付物必须记录可见的替换边界。
- 默认字体更适合中文办公流：微软雅黑、更大的正文、清楚的标题层级、更少拥挤卡片网格。

## 发布检查

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

## 兼容性

v5.0.0 对生成行为更严格，但对既有项目文件是增量兼容。Bridge endpoints、Desktop Worker 输出模式、DeckIR 文件、渲染审阅文件和 formal-business 审计命令保持兼容。最明显的变化是 Skill 和 README 使用的默认路线与交付语言。
