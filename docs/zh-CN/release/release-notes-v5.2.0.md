# 发布说明 - v5.2.0

v5.2.0 把“预期契合”从一个生成前判断，升级成可执行的生产契约。v5.1 已经加入可视化标签和 Codex 分步访谈；v5.2 继续补上为什么会不满意、下一版该修哪里、哪些事实不能编造的结构化字段。

## 更新内容

- 新增 v5.2 `project-brief.json` 契约，包含 `schemaVersion`、`referenceStyle`、`sourceConfidence`、`deliveryScorecard`、`feedbackLoop`、`failureTaxonomy`、`confirmationBrief` 和 `imageAcceptance`。
- Web Visual Brief Builder 新增具体参考样板方向：咨询报告感、金融稳重、经营看板、方案路线图、发布会主视觉、清爽课件、研究证据型和文旅杂志感。
- 新增来源可信度检查，帮助 Codex 区分用户提供事实、系统默认假设、缺失资料和必须补证据的主张。
- 新增交付评分卡，覆盖需求清晰度、资料可信度、风格具体度、素材边界和输出可编辑性。
- 新增不满意归因分类：需求理解偏差、资料不足、风格不符合、排版密度不合适、素材/IP 边界不清和输出格式不匹配。
- DeckIR 预览新增每页 `slideTask`，让每页都有任务、核心问题、takeaway、布局族、可编辑要求和证据引用。
- Bridge 和 Desktop Worker 同步升级，所有本地项目包都会在 `project-brief.json`、`manifest.json`、`quality-report.json`、`codex-task.md` 和 `AGENTS.md` 保留同一份 v5.2 契约。
- 新增 v5.2 审计：`npm run audit:brief`、`npm run audit:visual-intent`、`npm run audit:feedback-loop`。

## 白话更新栏

- 用户不用只写“正式大气”这类模糊词，可以直接选择更具体的参考方向。
- Codex 现在能说明哪些内容来自资料，哪些只是默认假设，哪些主张不能编造。
- 如果用户说 PPT 不满意，下一版会先归因，再修对应层级，而不是盲目整套重做。
- AI 生图仍可用于无文字主视觉、氛围图、小元素和纹理；事实图片优先使用官方或用户提供来源。
- 默认规则继续保持：可编辑 PPTX、微软雅黑、官方/IP 素材边界、渲染审阅和正式商务审计。

## 兼容性

v5.2.0 对 v5.1 handoff 文件是增量兼容。已有 `briefMode`、`visualBrief`、`guidedBrief` 和 `expectationFit` 字段仍可使用。新的 Agent 应保留 v5.2 字段，并在分步访谈或修订后写回这些字段。

本次 release 不上传桌面二进制安装包。桌面构建仍属于发布门禁，但公开分发继续以源码包和 Web/Agent 工作流为主，除非后续单独产出签名桌面包。

## 验证

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:market
npm run audit:brief
npm run audit:visual-intent
npm run audit:feedback-loop
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
