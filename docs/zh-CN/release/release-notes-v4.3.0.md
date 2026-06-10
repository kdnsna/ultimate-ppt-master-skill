# 发布说明 - v4.3.0

v4.3.0 把渲染审阅闭环从“只报告问题”升级成更安全的二次修订流程。它保留 v4.2 DeckIR AI 策划包、v4.1 精简 Web 控制台和 v4.0 混合可编辑契约，再增加人确认后的低风险修复计划和二次修订 brief。

## 重点变化

- 扩展 `review-findings.json`，新增 `riskLevel`、`autoFixable`、`targetArtifact`、`suggestedCommand` 和 `repairCandidates`。
- 扩展 `repair-plan.json`，新增顶层候选数量、dry-run/apply 命令和 `revision-brief.md` 路径。
- 通过 `scripts/apply_review_plan.py --safe-only --apply` 生成独立的 `revision-brief.md`。
- 保持 `scripts/apply_review_plan.py --safe-only --dry-run` 为默认安全路径；dry-run 只打印计划，不写项目文件。
- 加固 `scripts/review_rendered_deck.py` CLI：`--help` 不再被误当成项目路径，缺失项目路径会清晰失败。
- 重构仓库首页 README，把当前产品闭环放在首屏，而不是先堆历史版本说明。

## 白话更新栏

- 工具现在会在 deck 渲染后告诉你哪些地方值得修。
- 安全修复只是建议和规划提示，不会偷偷改事实内容。
- 用户确认修订方向后，`revision-brief.md` 会给 AI 助手一份干净的二次生成 brief。
- `source.md` 和解析出来的来源事实不会被自动修复流程改写。

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

v4.3 保持现有 DeckIR handoff 文件、Bridge endpoints、Desktop Worker 输出模式和 formal-business 审计兼容。新增的修订 brief 是增量能力，只有用户明确执行 safe apply 命令后才会生成。

