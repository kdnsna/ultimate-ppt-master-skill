# v6.3.6 候选说明：验证与发布候选对齐

> **未发布候选。** v6.3.6 是源码元数据声明的版本。该状态可以出现在 `main` 或 Pages 上，但不代表已有 tag、GitHub Release 或 marketplace 发布，也不声明 Pages 当前部署的是哪个修订。

[English candidate notes](../../release/release-notes-v6.3.6.md)

里程碑边界：[v6.3.2](./release-notes-v6.3.2.md) · [v6.3.3](./release-notes-v6.3.3.md) · [v6.3.4](./release-notes-v6.3.4.md) · [v6.3.5](./release-notes-v6.3.5.md)

## 白话更新栏

- 根包、Web、Desktop、npm lock、Cargo、Tauri、marketplace 元数据、v6 工作台标记、README 证据面与候选报告统一声明同一个未发布候选版本。
- README 和文档统一使用“未发布候选”，并明确分开源码/Pages 可见与 tag、GitHub Release、marketplace 发布状态。
- v6.3.2–v6.3.6 每个切片都有中文主说明、英文镜像、所需证据和明确独立回滚边界。
- 版本一致性测试覆盖 package 元数据、lock、Cargo/Tauri、marketplace 状态、应用/公开标记、Proof 报告、文档索引和发布说明合同。
- 正式办公 PPTX 继续保持 `warning`：WPS 已有 9/9 页视觉通过证据，PowerPoint 复核、LibreOffice 中文渲染差异与字体可移植性仍需单独处理。内部质量分始终明确不是第三方 benchmark。

## 候选边界

本切片只负责版本对齐、文档真实性、发布说明/索引完整性、候选元数据、浏览器/构建/审计证据与最终发布前清单。这些元数据本身不创建，也不证明已有 tag、GitHub Release、marketplace 发布或 Pages 部署。

## 验证合同

任何公开发布前，必须在与待打 tag 完全相同的提交上取得以下证据：

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:web-bundle
npm run audit:market
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
```

同时执行 Rust format/lint/test、桌面/移动端浏览器验收、Bridge 攻击/并发矩阵、GitHub Markdown 渲染检查和部署后 Pages smoke。PowerPoint 人工复核仍是独立人工门禁；已有 WPS 9/9 页通过证据不能代替接收环境的字体可移植性检查。

## 独立回滚边界

只将版本元数据、候选措辞、发布说明/索引和版本一致性门禁回滚到上一个已审阅候选。不得仅为修改版本标签就回滚 v6.3.2–v6.3.5 运行时/安全行为，也不得改写历史已发布 tag。

版本化发布前，应将各切片保留为可审阅提交，或明确记录单一 squash 提交与逐切片 revert map，再在精确目标 SHA 上运行 CI。只有另行授权的发布步骤才能创建 tag、GitHub Release 或 marketplace 记录；源码出现在 `main` 或 Pages 上不会自动升级候选状态。

## 已知待完成检查

- 当前浅色圆角 PPTX 的 PowerPoint 逐页视觉复核；WPS 已完成 9/9 页视觉通过，但仍保留通用缺失字体/可移植性 warning；
- 本机 LibreOffice 中文渲染差异；
- GitHub 仓库社交预览图上传；这是仓库外部设置，本源码候选不为其背书；
- 每次可信 `main` 部署成功后的精确 SHA 公开 Pages 链接与下载检查；不能从本说明推断当前部署状态。
