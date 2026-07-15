# v6.3.1 发布说明：中文入口与真实成品闭环

> **未发布草案。** 本文件描述拟发布的 v6.3.1 边界，不能作为该版本、Pages 站点或 Proof 产物已发布的证据。只有里程碑提交合并、CI 通过且公开链接验证完成后，才能创建 tag 和 GitHub Release。

里程碑边界：[v6.2.0 生成闭环](./release-notes-v6.2.0.md) · [v6.3.0 默认质量与公开 Proof](./release-notes-v6.3.0.md)

拟发布的 v6.3.1 将 Ultimate PPT Master 收口为一个中文优先、本地生成、可以拿到真实文件的轻量工作流。用户可以从一句任务开始，确认故事板与视觉方向，再由本地 Agent 生成成品；工作台只有在发现真实 PPTX、Web Deck、PDF 或压缩包后才提供下载。

[English release notes](../../release/release-notes-v6.3.1.md)

## 白话更新栏

- **故事板修改不再丢失。** 用户修改的页面顺序、`slideId`、标题、结论、角色和所选结构会进入 DeckIR 生产合同，Bridge 不再重新生成一套无关大纲。
- **4–24 页任务保持完整。** 结构稿、handoff 和生产合同使用同一组稳定 `slideId`，不再在 12 页截断。
- **本地 Agent 可以闭环到真实文件。** 工作台创建本地项目后，根据 Bridge 能力启动 Codex 或给出可复制命令，并在生成期间轮询产物；页面隐藏时暂停，刷新后从 `session.projectPath` 恢复。
- **结构稿与成品不再混淆。** 结构预览始终标注为“结构稿”；待复核文件可下载，但只有质量状态通过且所有页面已批准才能标记“已交付”。
- **Best-Effect 路由可审计。** `project-brief.json` 保留 `bestEffectBrief`、`promptQuality`、`recommendedRoute`、`decisionReason` 和来源；新建 handoff 的请求未提供该字段时，由确定性路由器补齐。
- **中文成为公开主入口。** GitHub 默认 `README.md`、Pages 工作台、成品库、按钮、质量状态和社交预览均以中文为主；`README.en.md` 继续作为完整英文镜像。
- **首屏用真实 Proof 说话。** 公开成品库首屏聚焦一份脱敏经营复盘可编辑 PPTX 和 GPT-5.6「三种轨道」Web Deck，两者都展示“输入 → 策划 → 输出 → 质量复核”。

## Bridge 接口与安全

新增两个仅面向已验证 handoff 项目的接口：

```text
GET /projects/artifacts?projectPath=<handoff>
GET /projects/artifacts/file?projectPath=<handoff>&artifact=<relative-path>
```

- `projectPath` 必须位于 Bridge `outputDir` 内且包含有效 `manifest.json`。
- 仅扫描 `exports/`、`ppt/` 和质量报告白名单，不开放 `attachments/`、源文件或任意目录浏览。
- 拒绝 `..`、外部符号链接、伪造 manifest 和 `outputDir` 之外的 Agent 启动。
- Bridge 使用本地 HMAC 签名完整 manifest 合同；未签名或被篡改的项目不能列出产物、下载或启动 Agent。
- 下载响应使用附件模式，Bridge 仍不是通用文件服务器。

## 兼容与迁移

- `deck-session-v6` 和 DeckIR 1.0 在新建 Bridge handoff 与桌面端中保持合同兼容；此前的未签名 Bridge 项目需通过 `/projects/create` 重建，不会被宽松放行。
- 旧 `README.zh-CN.md` 保留为短链接兼容入口，中文正文已迁入 `README.md`。
- Classic 控制台已从主导航移除，但仍可在 v6.4 之前通过 `?classic=1` 打开。
- 已有 PPTX 的修复继续走 preservation-first 独立路径，不会混入新建演示流程。

## 不包含什么

本次没有新增云端后台、账号、数据库、遥测、托管文件、额外模型 Provider 或大而全编辑器。正式生成仍由本地 Agent/编排器牵引，结构预览不等于最终 PPTX。

## 验证

```bash
npm run build:web
npm run build:desktop
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:featured-decks
npm run audit:quality
npm run audit:market
npm run test:bridge
npm run test:node
npm run test:worker
```
