# 发布说明 - v5.4.0

v5.4.0 发布 Swiss Deck + Asset Factory。Web Deck 现在有两条清晰路线：Style A 电子杂志 × 电子墨水用于叙事表达，Style B 瑞士国际主义用于信息设计。图片工作先写 `asset_plan.json`，再进入生成。

## 更新内容

- Web Console 新增 Swiss Deck / Asset Factory 区块，支持 Style A / Style B 选择、Swiss 主题与版式策略预览、地图页、封面衍生图和生成配图意图。
- `project-brief.json` 和 `manifest.json` 新增 `webDeck` 与 `assetPlanRequired`。
- 下载的 handoff kit 和 Bridge 创建的本地项目都会写入 `asset_plan.json`，同时保留原有 `asset-plan.md`。
- 新增 `scripts/build_asset_plan.py` 和 `templates/asset_plan_reference.json`，可以从 handoff 文件夹派生 `asset_plan.json`、`images/image_prompts.json` 和 `images/image_prompts.md`。
- 新增 `npm run audit:swiss-deck`，并强化 `scripts/validate-swiss-deck.mjs`，检查缺失 layout、S22 21:9 槽位、SVG 可见文字、小字号风险、裁切风险和底部导航安全区。
- 新增 `examples/swiss-v54-demo/index.html`，8 页 Swiss Deck 示例覆盖封面、KPI、对比、流程、地图/地点关系、图片 hero、证据页和尾页。
- 扩展图片合同审计，`Generated` 状态必须包含 `current_generation_evidence`。

## 白话更新栏

- 用户现在能明确选择叙事型电子杂志 Web Deck，或网格优先的瑞士风 Web Deck。
- 瑞士风不再只是“一个样式”，而是带版式编号、图片槽位和审计命令的正式路线。
- 图片生成不再是松散清单：先有计划，再有 prompt 文件，生成结果还要有本次证据。
- 图片后端不可用时，流程可以写出 `Needs-Manual` prompt，而不是让整个 deck 失败。

## 上游边界

- 归藏 v1.1.0 启发了 Swiss Style、Swiss Map、Codex 配图和多平台封面方向。
- 宝玉 Skills v2.5.2 启发了图片生成证据链，以及禁止复用历史 generated images 冒充本次结果的规则。
- 宝玉 Design v1.1.1 作为后续研究输入：本版本仍以 HTML/CSS 作为 deck 结构默认路线，HTML Deck 到可编辑 PPTX 研究放入 v5.5+。
- 本 MIT 仓库不直接复制 AGPL 后归藏代码；相关行为在本仓库内重新实现。

## 兼容性

v5.4.0 对 v5.3 handoff 文件是增量兼容。已有 `bestEffectBrief`、`visualBrief`、`guidedBrief`、`expectationFit`、`sourceConfidence`、`deliveryScorecard`、`referenceStyle` 和 `feedbackLoop` 字段仍可使用。新的 Agent 应保留 `asset-plan.md`，并在存在时读取 `asset_plan.json`。

本次 release 不上传桌面二进制安装包。公开分发继续以源码包和 Web/Agent 工作流为主，除非后续单独产出签名桌面包。

## 验证

```bash
python3 -m unittest tests.test_release_integrity tests.test_upstream_sync_integrity tests.test_image_asset_contracts
npm run audit:image-contracts
npm run audit:swiss-deck
npm run audit:docs
npm run audit:web-console
npm run test:node
npm run build:web
git diff --check
```
