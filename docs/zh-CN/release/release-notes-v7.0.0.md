# 终极融合PPT大师 v7.0.0 — GitHub 发布合同

> **GitHub 发布合同。** 本版本使用机器状态 `releaseStatus: unreleased`。源码元数据本身不能作为发布证据；在 `v7.0.0` tag 与 GitHub Release 页面创建之前，可审查权威证据为 [PR #15](https://github.com/kdnsna/ultimate-ppt-master-skill/pull/15)。GitHub Release 不会自动发布 marketplace 列表，其状态保持 `marketplaceStatus: independent-not-attested`。

[阅读英文发布说明](../../release/release-notes-v7.0.0.md)

## 白话更新栏

- **两个内核、三条用户路径。** Preserve Edit Engine 对已有品牌 PPTX 做字节级保真局部修改；Deck Generation Engine 走 `DeckIR → PPTD → 导出 → 视觉 QA`。用户路径为 `preserve-edit`、`editable-deck`、`web-deck`（Web Deck 仅在明确要求时启用）。
- **PPTD 成为默认视觉编译层。** 吸收 Kimi PPTD v2 词汇并重写为：JSON Schema、带精确定位的结构化 validator、工程内相对路径安全、版本化 UPM 元数据。
- **可替换导出后端。** `local`（PPTD → SVG → 原生 DrawingML 对象，离线默认）与 `kimi`（公共编辑器浏览器导出，版本化选择器、healthcheck、不自动安装）。每次导出记录实际后端。
- **统一视觉质检。** 整稿渲染 → 联系表 → 确定性 rubric（空白/溢出/对比度/重复布局/缺失证据）→ 失败页修复（≤2 轮）→ 质量报告；`quick / standard（默认）/ audit` 模式。
- **统一 CLI。** `upm make / edit / open / review / doctor`；`upm open` 为 127.0.0.1 PPTD 视觉精修，只允许工程内 `.pptd`/`.page` 写入。
- **路由收敛。** 六条旧路由降级或删除；Python / TypeScript / Bridge / Web 与 52 个 routing fixture 保持 parity。
- **Skill 精简。** `SKILL.md` 从 889 行缩至约 264 行；旧视觉 QA 脚本对新项目标记为 deprecated。
- 本次为本地优先的可靠性与统一发布，不新增云后端、账户体系、数据库或模型供应商。

## 发布合同

| 字段 | 合同 |
|---|---|
| 版本 | `7.0.0` |
| Git tag | `v7.0.0`（评审通过后发布） |
| 机器发布状态 | `unreleased` |
| 权威证据 | 在 tag 存在前为 [PR #15](https://github.com/kdnsna/ultimate-ppt-master-skill/pull/15) |
| Marketplace 状态 | `independent-not-attested`；以目标 marketplace 记录为准 |

## 验证合同

v7.0.0 目标提交必须通过：

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
bin/upm doctor --profile core
```

## 独立回滚边界

回滚到上一个正式版本（`v6.3.9`）可恢复旧版双模式 Skill 与其路由。v7 管线保持旧项目可读，不强制迁移数据，也不为新项目引入长期双写。
