# Ultimate PPT Master v6.3.9 发布说明

> **GitHub 发布合同。** 本版本的机器状态为 `releaseStatus: github-released`。源码文件本身不能证明已经发布；权威证据是不变的 [`v6.3.9` tag 与 GitHub Release 页面](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.9)。GitHub Release 不会自动上架 marketplace，市场状态继续保持 `marketplaceStatus: independent-not-attested`。

[English release notes](../../release/release-notes-v6.3.9.md)

上一正式版本：[v6.3.8](./release-notes-v6.3.8.md)

## 白话更新栏

- **主路径对齐「保真改稿」**：桌面默认进入改稿，侧栏「改稿」置顶；拖入 `.pptx` 走保真，其它资料才走从零生成。
- **桌面改稿体验跃迁**：内置试用样例、多页编辑队列一次保存、人话指令解析入队、样式/表格 ops、人话 fidelity 报告与变更说明文件。
- **保存后信任预览**：始终写出改前改后矢量信任卡；CLI `--preview` 在有 LibreOffice 时可出真实像素对比（桌面默认矢量以保证速度，`PRESERVE_REAL_PREVIEW=1` 可开真实渲染）。
- **CLI / MCP / Worker 同源**：`apply_edits`、`--list` / `--edits` / `--op`、inspect 表格与图表摘要；MCP 与桌面共用同一保真门禁。
- **Web 首屏双路径**：默认「改已有 PPT」，次要「从资料生成」；SEO/OG 与保真定位一致；主包仍控制在 80KB gzip 预算内。
- **可复制场景 Prompt** 与 **pptlint → edits 半自动草案**（`scripts/pptlint_to_preserve_plan.py`），强调人工审阅后再 apply。
- Skill 市场文案改为保真优先 + quality-checked 生成辅线。

## 发布合同

| 字段 | 合同 |
|---|---|
| 版本 | `6.3.9` |
| Git tag | `v6.3.9` |
| GitHub 发布机器状态 | `github-released` |
| 权威证据 | [`releases/tag/v6.3.9`](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.9) |
| Marketplace 状态 | `independent-not-attested`；任何市场记录都需另行核验 |

## 验证合同

`v6.3.9` 指向的精确提交必须通过：

```bash
npm run check:contracts
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:web-bundle
npm run audit:featured-decks
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
python3 scripts/sync_desktop_worker.py --check
python3 -m unittest tests.test_preserve_edit_fidelity tests.test_nl_edit_plan tests.test_pptlint_to_preserve_plan tests.test_desktop_worker.PreserveEditWorkerTest
```

## 独立回滚边界

回退 v6.3.9 提交即可撤销本轮保真改稿 UX、Web 双路径与预览/文档改动，不需要移动或改写已经发布的 `v6.3.8` tag。若 v6.3.9 发布后需要修正，应发布新的补丁版本，不得重写 tag。

## 已知限制

- Web 主包仍接近 80KB gzip 预算上限；
- 桌面真实像素 before/after 默认关闭（避免 LibreOffice 拖慢保存）；需显式环境变量开启；
- 保真「改」仍不覆盖增删页、插图、重建表格结构；
- 从零生成仍由本地 Agent 牵引，不是托管一键云服务；
- GitHub Release 不会自动更新 marketplace 列表；Pages 部署以 Actions 与线上 SHA 为准。
