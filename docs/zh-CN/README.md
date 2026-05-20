# 中文文档索引

终极融合 PPT 大师现在采用“网页端优先 + Skill 重要可选入口”的方向：

1. **Web Experience**：主推广入口，用于低门槛体验、解释产品、组装 Deck Brief、实时预览 Web Deck、生成双引擎计划、导出 handoff kit、查看 Web Deck 示例。
2. **Agent Skill**：第二核心入口，用于 Codex、Claude Code、Hermes、OpenClaw、Cursor / Cline / Roo / Windsurf 等工具执行生产级 PPT 工作流。

桌面端继续保留，但归为高级本地预览和后续发布维护路线，不再作为近期获客主路径。

## 怎么选

| 你是谁 | 推荐入口 | 原因 |
|---|---|---|
| 新用户 / 普通访客 | Web Experience | 不用安装、不用账号、不用模型 key，先快速整理 brief、预览 Web Deck 并导出 handoff kit。 |
| GitHub / Agent 用户 | Skill | 效果最好，Agent 可以读资料、跑脚本、预览、修正、导出。 |
| 团队要稳定交付 | Web Experience + Skill | 网页端做 brief 和交付包，Skill 做本地生产。 |
| 想看桌面端 | Desktop Later | 可源码运行，但签名、公证、Homebrew 后续再做主推。 |
| 想接自己的大模型 API | Direct API 预留变量 | v2.1.0 还不是完整内置引擎，需要自定义 adapter。 |

## 常用文档

- Web Experience：[Web Experience](./web-experience.md)
- Agent 配置：[Agent Setup](../agent-setup.md)
- 工作流选择：[Choosing a Workflow](../choosing-a-workflow.md)
- 桌面端源码预览：[Quickstart Desktop](../quickstart-desktop.md)
- Homebrew 分发方案：[Homebrew Distribution Plan](../homebrew-distribution.md)
- 模型和 Provider 配置：[Model and Provider Setup](../model-provider-setup.md)
- 问题排查：[Troubleshooting](../troubleshooting.md)
- 发布维护：[Release and Maintenance](../release-maintenance.md)

## 最推荐的效果路线

目前最适合推广的路线是：

```text
打开 Web Experience -> 粘贴资料摘要 -> 生成页纲、Web Deck 预览和 handoff-kit.zip -> 把交付包和本地资料路径交给 Codex / Claude Code / Hermes / OpenClaw 深加工
```

原因很简单：网页端把“我要什么”“资料是什么”“走 PPTX 还是 Web Deck 路线”整理成可执行 brief，并给用户一个可打开的 `preview-web-deck.html`；Skill 让 Agent 在本地读文件、运行脚本、检查输出、修正失败页面。这比让普通用户一上来安装桌面端、配置系统依赖，更适合传播。
