# 中文文档索引

Ultimate PPT Master v6 采用分类文档结构。先按你当前要做的事情选择入口。

GitHub 默认产品首页是 [`README.md`](../../README.md)；英文完整镜像保留在 [`README.en.md`](../../README.en.md)。

## 使用指南

| 需求 | 阅读 |
|---|---|
| 理解网页入口 | [Web Experience](./guides/web-experience.md) |
| 连接网页、本地资料和 Agent | [Agent Connect Bridge](./guides/agent-connect-bridge.md) |
| 安装和调用 Skill | [安装与启动](./guides/agent-setup.md) |
| 选择 PPTX、Web Deck、双版本或已有 PPTX 修复 | [选择交付路线](./guides/choosing-a-workflow.md) |
| 本地配置 Provider key | [模型与 Provider 配置](./guides/model-provider-setup.md) |
| 使用桌面预览路径 | [选择交付路线](./guides/choosing-a-workflow.md) |
| 排查安装、解析、输出、Provider 或 Agent 问题 | [故障排查](./guides/troubleshooting.md) |

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
| 查看当前 GitHub 正式版本 | [发布说明 - v6.3.8](./release/release-notes-v6.3.8.md) |
| 查看上一正式版本 | [发布说明 - v6.3.7](./release/release-notes-v6.3.7.md) |
| 查看 v6.3.5 精修与运行切片 | [候选说明 - v6.3.5](./release/release-notes-v6.3.5.md) |
| 查看 v6.3.4 会话与交付切片 | [候选说明 - v6.3.4](./release/release-notes-v6.3.4.md) |
| 查看 v6.3.3 资料与证据切片 | [候选说明 - v6.3.3](./release/release-notes-v6.3.3.md) |
| 查看 v6.3.2 视觉与安全切片 | [候选说明 - v6.3.2](./release/release-notes-v6.3.2.md) |
| 查看 v6.3.1 中文主入口边界 | [草案说明 - v6.3.1](./release/release-notes-v6.3.1.md) |
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
| 回看 v2.5–v5.5 内容与模板历史路线 | [历史路线 - 内容与模板预设](./strategy/next-roadmap.md) |
| 回看 v2.5 历史优化 backlog | [历史优化方向](../strategy/next-optimization-directions.md) |

## 推荐路线

```text
打开 Web Experience -> 加入真实资料 -> 确认故事板和视觉方向 -> 创建本地项目 -> 启动或复制 Codex 命令 -> 发现并下载真实产物 -> 通过质量门禁后交付
```

v6.3.8 的源码机器状态为 `github-released`；是否真正发布，只以 [`v6.3.8` tag 与 GitHub Release 页面](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.8) 为权威证据。GitHub Release 不会自动发布 marketplace；市场记录需独立核验。主线继续保持中文任务入口、稳定故事板合同、本地 Agent 和真实产物下载。HTTP 字段、Provider 与兼容细节保留在专业指南中，不占据普通用户首屏。

## 当前收敛工作

- [v6.3.8 收敛工作说明](../strategy/v6-3-8-consolidation.md)

