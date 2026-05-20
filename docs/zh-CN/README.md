# 中文文档索引

终极融合 PPT 大师有两个入口，都要保留：

1. **桌面端**：给普通用户，一个本地优先、三步完成的产品入口。
2. **Agent Skill**：给 Codex、Claude Code、OpenClaw、Hermes、Cursor / Cline / Roo / Windsurf 等工具，一个能执行生产级 PPT 工作流的技能包。

## 怎么选

| 你是谁 | 推荐入口 | 原因 |
|---|---|---|
| 小白用户 / 普通创作者 | 桌面端 | 不需要理解脚本，导入资料、选择输出、生成即可。 |
| GitHub / Agent 用户 | Skill | 效果最好，Agent 可以读资料、跑脚本、预览、修正、导出。 |
| 团队要稳定交付 | 桌面端 + Skill | 桌面端做资料入口和项目管理，Agent 做深度生成。 |
| 想接自己的大模型 API | Direct API 预留变量 | v2.0.0 还不是完整内置引擎，需要自定义 adapter。 |

## 常用文档

- 桌面端快速开始：[Quickstart Desktop](../quickstart-desktop.md)
- Homebrew 分发方案：[Homebrew Distribution Plan](../homebrew-distribution.md)
- 工作流选择：[Choosing a Workflow](../choosing-a-workflow.md)
- Agent 配置：[Agent Setup](../agent-setup.md)
- 模型和 Provider 配置：[Model and Provider Setup](../model-provider-setup.md)
- 问题排查：[Troubleshooting](../troubleshooting.md)
- 发布维护：[Release and Maintenance](../release-maintenance.md)

## 最推荐的效果路线

目前效果最稳的是：

```text
桌面端导入真实资料 -> 生成本地项目 -> 复制 Agent handoff prompt -> 交给 Codex / Claude Code / Hermes / OpenClaw 深加工
```

原因很简单：Agent 不只是“调用一次大模型”，它能读文件、运行脚本、看日志、检查输出、修正失败页面，这比单次 API 调用更接近真实 PPT 生产。
