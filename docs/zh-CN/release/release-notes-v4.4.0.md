# 发布说明 - v4.4.0

v4.4.0 把 Web Experience 重做成 Codex 优先项目启动器。生成引擎、Bridge handoff 合同、DeckIR AI 策划包、渲染审阅闭环和正式交付审计都保持兼容；真正改变的是第一屏不再像一个复杂平台控制台。

## 变化

- 用一个主流程替代多面板控制台：拖文件或粘贴资料、写一句目标、创建本地项目、复制 Codex 命令。
- 新增 `CodexFirstFlow`、`SourceDropzone`、`CodexPrimaryAction`、`CodexResult` 和 `DebugDrawer`，让主界面保持简单，高级证明材料仍可查看。
- 用更小的 Codex flow 状态机替代 v4.1 控制台导航：`needs_input`、`needs_bridge`、`ready_to_create`、`creating`、`ready_for_codex` 和 `error`。
- 每个 Bridge 项目继续保留 v4.2 和 v4.3 handoff 文件：`storyboard.json`、`source-map.json`、`planning-report.json`、`review-findings.json`、`repair-plan.json` 和 `revision-brief.md`。
- Benchmark Wall、质量报告、页面地图和渲染审阅细节移入调试抽屉，不再压在主流程上。

## 白话更新栏

网页不再试图承包所有管理工作。它现在只做一件事：给 Codex 准备一个干净的本地项目包。用户看到的是资料入口、目标输入框、一个按钮、项目路径和已经复制好的 Codex 命令。

## 检查

```bash
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run audit:docs
npm run audit:web-console
npm run audit:quality
npm run audit:market
git diff --check
```

## 兼容性

本版本没有移除 DeckIR、渲染审阅、repair plan 或 formal-business 审计主线。它只改变产品入口，让普通用户从 Codex 真实使用路径开始，而不是被复杂网页平台拦住。
