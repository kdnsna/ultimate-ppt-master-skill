# 中文文档索引

终极融合 PPT 大师现在采用“网页端优先 + 本地 Bridge + Skill 重要生产入口”的方向：

1. **Web Experience**：主推广入口，用于低门槛体验、解释产品、导入资料、组装 Deck Brief、实时预览 Web Deck、生成双引擎计划、导出 handoff kit、查看 Web Deck 示例。
2. **Agent Connect Bridge**：本地连接入口，让网页连接 `127.0.0.1`，本地解析 PDF/Word/PPTX/Excel/URL、检查 provider 状态、生成 handoff 项目。
3. **Agent Skill**：高质量生产入口，用于 Codex、Claude Code、Hermes、OpenClaw、Cursor / Cline / Roo / Windsurf 等工具执行生产级 PPT 工作流。

桌面端继续保留，但归为高级本地预览和后续发布维护路线，不再作为近期获客主路径。

## 怎么选

| 你是谁 | 推荐入口 | 原因 |
|---|---|---|
| 新用户 / 普通访客 | Web Experience | 不用安装、不用账号、不用模型 key，先快速整理 brief、预览 Web Deck 并导出 handoff kit。 |
| GitHub / Agent 用户 | Bridge + Skill | 效果最好，网页能落盘真实项目，Agent 可以读资料、跑脚本、预览、修正、导出。 |
| 团队要稳定交付 | Web Experience + Bridge + Skill | 网页端做导入和交付包，Bridge 做本地解析，Skill 做最终生产。 |
| 想看桌面端 | Desktop Later | 可源码运行，但签名、公证、Homebrew 后续再做主推。 |
| 想接自己的大模型 API | Bridge / Provider Dashboard | 浏览器不保存 key，Bridge 从本地环境读取并测试 provider。 |

## 常用文档

- Web Experience：[Web Experience](./web-experience.md)
- Agent Connect Bridge：[Agent Connect Bridge](./agent-connect-bridge.md)
- Agent 配置：[Agent Setup](../agent-setup.md)
- 工作流选择：[Choosing a Workflow](../choosing-a-workflow.md)
- 产品定位反思：[产品定位反思](./product-positioning.md)
- 下一步内容 / 模板方向：[下一步路线 - 内容与模板预设](./next-roadmap.md)
- v2.3.4 发布说明：[发布说明 - v2.3.4](./release-notes-v2.3.4.md)
- 上游基准测试：[上游基准测试 - 2026 年 5 月](./upstream-benchmark-2026-05.md)
- 桌面端源码预览：[Quickstart Desktop](../quickstart-desktop.md)
- Homebrew 分发方案：[Homebrew Distribution Plan](../homebrew-distribution.md)
- 模型和 Provider 配置：[Model and Provider Setup](../model-provider-setup.md)
- 问题排查：[Troubleshooting](../troubleshooting.md)
- 发布维护：[Release and Maintenance](../release-maintenance.md)

## 最推荐的效果路线

目前最适合推广的路线是：

```text
打开 Web Experience -> 拖入资料或粘贴摘要 -> 启动 npm run bridge -> 发送到本地 Bridge -> 把生成的 handoff 项目交给 Codex / Claude Code / Hermes / OpenClaw 深加工
```

原因很简单：网页端把“我要什么”“资料是什么”“走 PPTX 还是 Web Deck 路线”整理成可执行 brief；Bridge 把真实资料留在本机并尽量解析成 `extracted-source.md`；Skill 让 Agent 在本地读文件、运行脚本、检查输出、修正失败页面。这比让普通用户一上来安装桌面端、配置系统依赖，更适合传播。
