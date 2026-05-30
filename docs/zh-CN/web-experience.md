# Web Experience

Web Experience 是终极融合 PPT 大师当前的主推广入口。它是部署到 GitHub Pages 的静态 React/Vite **Agent Connect Studio**，同时承担资料导入、本地 Bridge handoff、PPTX 路线和 Web Deck 路线的融合前台。

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## 它做什么

- 让用户选择资料类型、使用场景、输出形式、视觉风格、语言、Agent 工具和模型偏好；
- 接收粘贴资料、资料 URL，以及拖入的 `.md`、`.txt`、`.pdf`、`.docx`、`.pptx`、`.xlsx` 等文件；
- 文本资料在浏览器预读，Office/PDF 资料标记为等待本地 Bridge 解析；
- 生成页纲和 brief 完整度检查；
- 同屏展示 Hugo He / ppt-master 的 PPTX 路线和 op7418 / 歸藏的 Web Deck 路线；
- 在 Bridge 运行时检测本地 Agent 命令和 provider 配置状态；
- 生成浏览器本地的 `preview-web-deck.html`，并在页面中实时预览；
- 生成可复制的 Agent 指令、`source.md`、`extracted-source.md`、`manifest.json` 和 `project-brief.json`；
- 下载完整 `handoff-kit.zip`，或发送到本地 Bridge 生成项目目录；
- handoff kit 内含 `source.md`、`extracted-source.md`、`attachments/`、`manifest.json`、`agent-prompt.md`、`project-brief.json`、`preview-web-deck.html`、`engine-plan.md`、`quality-checklist.md`、`asset-plan.md`、`visual-element-kit.md`、`codex-task.md`、`AGENTS.md`、`quality-report.json` 和 `README.md`；
- 写入 `formal-business` 质量门禁，让 Codex 拿到验收标准、产物检查和复查命令；
- 生成 ChatGPT 生图优先的小元素计划，覆盖章节分隔符、指标徽章、流程节点、连接线、图标点缀、低对比纹理和提示贴片；
- Bridge 生成本地 handoff 后，显示精确的 `generate_visual_element_kit.py` 命令；
- 没有 image backend 或 OpenAI key 时，解释 `Needs-Manual` 降级路径；
- 打开脱敏 Agentic Developer Stack 2026 Web Deck 示例；
- 保持 Skill 安装入口足够显眼。

## 它不做什么

- 不接后端；
- 不托管模型 API；
- 不做账号系统；
- 不上传到托管服务，也不做服务端保存；
- 不在浏览器保存 API key；
- MVP 不依赖统计分析。

Brief 组装完全在浏览器本地完成。用户运行 `npm run bridge` 时，资料只发送到本机 `127.0.0.1`，用于本地解析和项目落盘。

v3.0.0 起，Handoff 页变成可执行向导。Bridge 离线时只显示 Bridge 启动命令和 zip 下载；Bridge 在线但还没生成项目时，主动作是发送到 Bridge；handoff 生成后，页面显示本地项目路径、元素生成命令、Agent 命令和 `images/image_prompts.md` 的 `Needs-Manual` fallback 位置。

## 本地开发

```bash
npm --prefix apps/web install
npm run dev:web
```

构建：

```bash
npm run build:web
```

GitHub Pages 构建：

```bash
GITHUB_PAGES=true npm run build:web
```

`GITHUB_PAGES=true` 会把静态资源路径设置为 `/ultimate-ppt-master-skill/`。

## 冒烟检查

| 检查 | 期望结果 |
|---|---|
| 打开 Web Experience | 工作台、资料导入、页纲、完整度检查、Bridge 状态、provider 卡片、预览 tabs 和 CTA 按钮正常显示。 |
| Bridge 离线状态 | 页面显示可复制的 Bridge 启动命令：先寻找或拉取本地仓库，再运行 `npm run bridge`；同时仍可下载 zip。 |
| Bridge 在线状态 | `GET /health` 填充本地 Agent 和 provider 状态。 |
| 拖入文本资料 | 文件显示为浏览器已预读，并进入 `extracted-source.md`。 |
| 拖入二进制资料 | 文件显示为等待本地 Bridge 解析，并进入 `attachments/`。 |
| 实时 Web Deck 预览 | 预览框渲染 `preview-web-deck.html`，不依赖后端或脚本。 |
| 复制 Agent prompt | 剪贴板获得带页纲和交付包上下文的 prompt。 |
| 复制 `source.md` | 剪贴板获得生成后的 source markdown。 |
| 下载 `source.md` | 浏览器下载带当前表单值和页纲的 Markdown brief。 |
| 下载 `preview-web-deck.html` | 浏览器下载带当前 brief 和 storyboard 的单文件 HTML 预览。 |
| 下载 `handoff-kit.zip` | 浏览器下载包含源资料、manifest、attachments、prompt、preview、engine plan、checklist、asset plan、visual element kit、Codex task、AGENTS guide、quality report 和 README 的 zip。 |
| 发送到 Bridge | Bridge 写入本地 handoff 文件夹并返回建议 Agent 命令。 |
| Handoff 执行区 | Bridge 写入本地文件夹后，页面显示 `python3 scripts/generate_visual_element_kit.py <projectPath>`、Agent 命令和 `Needs-Manual` prompt fallback。 |
| 打开 Web Deck 示例 | 静态构建中的 `examples/agentic-developer-tools-2026/web-demo.html` 能打开。 |
| Skill 安装说明 | 能跳到 README Skill 区域或 `docs/agent-setup.md`。 |
| 移动端首屏 | CTA 自动换行，Skill 入口仍然明显。 |

## 场景覆盖

MVP 至少保持这些 brief 生成场景可用：

- 中文汇报 PPTX；
- 英文 pitch Web Deck；
- 咨询方案 Skill 工作流；
- 培训课件 Skill 工作流。

页面也必须保持两条引擎路线都足够明显：网页端负责获客、预览和 handoff；Skill 仍是最终质量、资料解析、渲染、修复和导出的生产路线。

## 实现位置

- 网页端代码：[apps/web](../../apps/web)
- Pages workflow：[.github/workflows/pages.yml](../../.github/workflows/pages.yml)
- 公开脱敏 Demo：[examples/agentic-developer-tools-2026](../../examples/agentic-developer-tools-2026)
