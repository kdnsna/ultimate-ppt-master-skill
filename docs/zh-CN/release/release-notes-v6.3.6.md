# Ultimate PPT Master v6.3.6 发布说明

> **GitHub 发布合同。** 本版本线的机器状态为 `releaseStatus: github-released`。但这份源码文件本身不能证明已经发布；权威证据只是不可变的 [`v6.3.6` tag 与 GitHub Release 页面](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.6)。如果该记录不可访问，应将发布视为未闭环。GitHub Release 不会自动上架任何 marketplace，市场状态仍须独立核验。

[English release notes](../../release/release-notes-v6.3.6.md)

里程碑边界：[v6.3.2](./release-notes-v6.3.2.md) · [v6.3.3](./release-notes-v6.3.3.md) · [v6.3.4](./release-notes-v6.3.4.md) · [v6.3.5](./release-notes-v6.3.5.md)

## 白话更新栏

- v6.3.6 将中文任务型工作台、稳定故事板合同、本地 Agent 生命周期、真实产物下载、Bridge 安全收口、圆润公开 Proof 与发布门禁收口为一个 GitHub 正式版本。
- 根包、Web、Desktop、npm lock、Cargo、Tauri、marketplace 元数据、README 证据面与公开质量报告统一声明版本 `6.3.6` 和机器状态 `github-released`。
- README、案例库、Hero 和双案例图统一展示 v6.3.6 正式版本，并将用户引向带版本号的发布记录。
- v6.3.2–v6.3.5 仍保留为未发布候选切片；它们是合并进 v6.3.6 的审阅与回滚边界，不是独立公开版本。
- marketplace 发布是独立操作。`marketplaceStatus: independent-not-attested` 表示这次 GitHub Release 既不执行、也不证明 marketplace 已发布。
- 正式办公 PPTX 继续保持 `warning`：WPS 已有 9/9 页视觉通过证据，PowerPoint 复核、LibreOffice 中文渲染差异与字体可移植性仍公开保留。内部质量分不是第三方 benchmark。

## 发布合同

| 字段 | 合同 |
|---|---|
| 版本 | `6.3.6` |
| Git tag | `v6.3.6` |
| GitHub 发布机器状态 | `github-released` |
| 权威证据 | [`releases/tag/v6.3.6`](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.6) |
| Marketplace 状态 | `independent-not-attested`；任何市场记录都需另行核验 |

源码元数据只表达发布提交应满足的合同，不会自动创建 tag 或 GitHub Release。是否真正发布，以 tag 与 GitHub Release 页面为准，且它们的目标提交必须与通过 CI 的发布提交一致。

## 验证合同

`v6.3.6` 指向的精确提交必须通过：

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

同时执行 Rust format/lint/test、桌面/移动端浏览器验收、Bridge 攻击/并发矩阵、GitHub Markdown 渲染检查和部署后 Pages smoke。PowerPoint 人工复核仍是独立门禁；WPS 9/9 页通过不能代替接收环境的字体可移植性检查。

## 独立回滚边界

回退 v6.3.6 发布语义提交，可恢复候选文案和机器状态，无需回退 v6.3.2–v6.3.5 的运行时与安全行为。如果 `v6.3.6` 已发布，不得移动或重写该 tag；已发布产物需替换时应发布修正版本。

## 已知限制

- 当前浅色圆角 PPTX 仍待 PowerPoint 逐页复核；WPS 已 9/9 页通过，并保留通用缺字体/可移植性 warning；
- 本机 LibreOffice 中文渲染存在差异；
- GitHub 仓库社交预览图上传仍是仓库外部设置；
- Pages 运行态需按部署的 Actions SHA 和真实 URL 复核；
- GitHub Release 不会自动发布或更新 marketplace 列表。
