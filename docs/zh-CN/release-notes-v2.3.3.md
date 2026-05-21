# 发布说明 - v2.3.3

v2.3.3 是一次 Web Experience 新手上手优化发布，同时继续守住真实能力边界：

> 网页负责整理项目，Bridge 负责写入本机，Agent Skill 仍然负责高质量生产。

## 最大提升

第一次打开网页的用户，不需要先理解所有专业词汇才能开始。首页现在会先讲清楚：

- **本机连接器（Bridge）**：只跑在本机的 localhost 服务，让静态网页能读取本地文件、识别已安装 Agent，并写入 handoff 项目。
- **AI 助手（Agent）**：继续制作 PPT 的本地工具，例如 Codex、Hermes、OpenClaw、Claude Code。
- **模型账号（API key）**：调用模型 provider 的本地密钥；浏览器只展示是否配置，不展示密钥。
- **本地项目包（handoff）**：包含资料、任务说明、预览、manifest 和 Agent 命令的项目文件夹。

## 主要变化

- 把密集的 Web Experience 拆成开始、资料与目标、配置检测、交给 AI 助手、预览与文件等菜单页。
- 新增一键 Bridge / Agent / provider 检测，并能自动选择可用本地 Agent。
- Codex、Hermes、OpenClaw、Claude Code 检测改为通用逻辑，不再假设用户只安装某一个工具。
- 内容预设包已经在网页端露出，可以看到资料要求、模板候选、推荐路线和质量检查。
- handoff 产物继续可检查：`source.md`、`extracted-source.md`、`manifest.json`、`agent-prompt.md`、`project-brief.json`、`preview-web-deck.html`、`engine-plan.md`、`quality-checklist.md` 和 `README.md`。

## 质量标准

v2.3.3 的验收口径是 Web + Bridge 的真实产出：静态网页可以整理 brief，Bridge 可以创建真实本地项目文件夹，生成的文件可以交给本地 AI 助手继续制作。

它**不声称**浏览器已经能直接生成最终生产级 PPTX，也不声称有托管模型生成能力。最终质量仍由本地 Agent Skill 工作流保证。

## 升级

```bash
cd ultimate-ppt-master-skill
npm run update
```

然后运行：

```bash
npm run doctor
npm run bridge
```

打开 Web Experience，检查配置页，再发送一份示例 brief 到 Bridge。
