# 发布说明 - v4.2.0

v4.2.0 正式发布 DeckIR AI 策划包。它保留 v4.1 精简 Web 控制台和 v4.0 混合可编辑契约，再增加“先策划再生成”的一层，让每个 handoff 都从页面角色、证据边界、可编辑目标和渲染审阅开始。

## 重点变化

- Web、Bridge、Desktop handoff 都新增 DeckIR v1 策划文件：`storyboard.json`、`source-map.json`、`planning-report.json` 和 `review-findings.json`。
- 新增 `scripts/ai_storyboard.py`，无 key 时也能 fallback；新增 `scripts/audit_storyboard.py` 检查页面角色、recipe、证据、可编辑性和 raster 策略。
- 新增 `scripts/review_rendered_deck.py`，支持预览/导出后的渲染审阅，并把结果合并进 `quality-report.json`。
- Web Experience 新增“一键最佳路线”和“AI 页面地图”，普通用户不用理解工程术语也能使用。
- 扩展 PPTX 参考稿导入，生成 `reference-style.json`，为后续参考稿风格学习做准备。

## 白话更新栏

- 产品现在会先规划 deck，再让 AI 助手进入制作。
- 用户仍然只需要选择 PPTX、Web Deck 或双版本，但本地项目包会多出页面地图和证据边界。
- 正式正文页仍然以可编辑为先：DeckIR 审计和视觉配方审计都会拦截整页图片化。
- 没有 provider key 也能规划；本地规则式 planner 仍会写出可用项目文件。

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

v4.2 handoff 会新增 DeckIR 文件，但保持 v4.1 Web 控制台行为、Bridge endpoints、Desktop Worker 输出模式和 v4.0 formal-business 质量门禁兼容。

