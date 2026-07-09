# 中文文档索引

Ultimate PPT Master v5 采用分类文档结构。先按你当前要做的事情选择入口。

## 使用指南

| 需求 | 阅读 |
|---|---|
| 理解网页入口 | [Web Experience](./guides/web-experience.md) |
| 连接网页、本地资料和 Agent | [Agent Connect Bridge](./guides/agent-connect-bridge.md) |
| 安装和调用 Skill | [Agent Setup](../guides/agent-setup.md) |
| 选择 PPTX、Web Deck、双版本或桌面预览 | [Choosing a Workflow](../guides/choosing-a-workflow.md) |
| 本地配置 provider key | [Model and Provider Setup](../guides/model-provider-setup.md) |
| 使用桌面预览路径 | [Quickstart Desktop](../guides/quickstart-desktop.md) |
| 排查安装、解析、输出、provider 或 Agent 问题 | [Troubleshooting](../guides/troubleshooting.md) |

## 质量与审计

| 需求 | 阅读 |
|---|---|
| 把渲染问题转成安全修订 brief | [v4.3 渲染审阅闭环](./quality/rendered-review-loop-v4.3.md) |
| 用 DeckIR、页面地图和渲染审阅策划 AI 生成 deck | [v4.2 DeckIR AI 策划工作流](./quality/deckir-ai-planning-workflow-v4.2.md) |
| 理解 v4.0 视觉契约 | [v4.0 混合可编辑视觉工作流](./quality/hybrid-editable-visual-workflow-v4.0.md) |
| 查看稳定证明矩阵 | [v2.5 质量工作台](./quality/quality-workbench-v2.5.md) |
| 查看 v2.5 完成审计 | [Completion Audit v2.5](../quality/completion-audit-v2.5.md) |
| 查看本机上游基准测试 | [上游基准测试 - 2026 年 5 月](./quality/upstream-benchmark-2026-05.md) |
| 查看 GitHub 技术趋势 | [GitHub 技术扫描 - 2026 年 5 月](./quality/github-tech-scan-2026-05.md) |

## 发布

| 需求 | 阅读 |
|---|---|
| 查看最新发布 | [发布说明 - v5.4.1](./release/release-notes-v5.4.1.md) |
| 查看 v5.4 瑞士风 Deck 与资产工厂 | [发布说明 - v5.4.1](./release/release-notes-v5.4.1.md) |
| 查看 v5.3 最佳效果提示增强器 | [发布说明 - v5.3.0](./release/release-notes-v5.3.0.md) |
| 查看 v5.2 预期契合合同 | [发布说明 - v5.2.0](./release/release-notes-v5.2.0.md) |
| 查看 v5.1 分步访谈发布 | [发布说明 - v5.1.0](./release/release-notes-v5.1.0.md) |
| 查看 v5 交付默认规范发布 | [发布说明 - v5.0.0](./release/release-notes-v5.0.0.md) |
| 查看渲染审阅闭环发布 | [发布说明 - v4.3.0](./release/release-notes-v4.3.0.md) |
| 查看 AI 策划发布 | [发布说明 - v4.2.0](./release/release-notes-v4.2.0.md) |
| 查看混合可编辑发布 | [发布说明 - v4.0.0](./release/release-notes-v4.0.0.md) |
| 查看正式 handoff 发布 | [发布说明 - v3.0.0](./release/release-notes-v3.0.0.md) |
| 发布、Pages、Homebrew、签名、公证、隐私和维护 | [Release and Maintenance](../release/release-maintenance.md) |
| 准备 Homebrew 分发 | [Homebrew Distribution Plan](../release/homebrew-distribution.md) |

## 策略

| 需求 | 阅读 |
|---|---|
| 理解产品定位 | [产品定位反思](./strategy/product-positioning.md) |
| 深度优化 PRD | [v5.2 深度优化指南 / PRD](./strategy/prd-v5.2-deep-optimization-guide.md) |
| 改善 GitHub 公开曝光 | [Public Growth Playbook](../strategy/public-growth-playbook.md) |
| 准备 Skill 市场分发 | [Skill 市场分发](./strategy/skill-market-distribution.md) |
| 查看内容和模板方向 | [下一步路线 - 内容与模板预设](./strategy/next-roadmap.md) |
| 查看优化 backlog | [Next Optimization Directions](../strategy/next-optimization-directions.md) |

## 推荐路线

```text
打开 Web Experience -> 拖入资料或粘贴摘要 -> 启动 npm run bridge -> 发送到本地 Bridge -> 把 handoff 项目交给 Codex / Claude Code / Hermes / OpenClaw 深加工
```

v5.1 的新增重点是：Web 可视化标签、Codex 分步访谈、统一 `project-brief.json`、预期契合风险和制作前关键问题澄清；v5.0 的默认可编辑 PPTX、官方/IP 素材边界、Codex-first 生成视觉、微软雅黑版式规范和 formal-business 审计继续作为主线。
