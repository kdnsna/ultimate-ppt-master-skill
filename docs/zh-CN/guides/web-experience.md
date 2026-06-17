# Web Experience

Web Experience 是终极融合 PPT 大师当前的主推广入口。它是部署到 GitHub Pages 的静态 React/Vite 四步控制台，同时承担资料导入、本地项目创建、PPTX 路线和 Web Deck 路线的融合前台。

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## 它做什么

- 用一个状态驱动主按钮串起正常路径：准备任务、添加资料、连接本机、生成交付；
- 资料类型、使用场景、输出形式、视觉风格、语言、AI 助手和模型偏好默认收进高级设置；
- 接收粘贴资料、资料 URL，以及拖入的 `.md`、`.txt`、`.pdf`、`.docx`、`.pptx`、`.xlsx` 等文件；
- 增加 Visual Brief Builder，用多样化标签选择使用场景、受众、目的、内容状态、视觉风格、排版密度、素材策略和输出偏好；
- 保留自由输入区，用于粘贴背景、领导要求、特殊禁忌、官方/参考链接和相关内容；
- 文本资料在浏览器预读，Office/PDF 资料标记为等待本地 Bridge 解析；
- 生成页纲、brief 完整度检查和 `expectationFit` 预期契合度，用于发现需求模糊或互相冲突；
- 同屏展示 Hugo He / ppt-master 的 PPTX 路线和 op7418 / 歸藏的 Web Deck 路线；
- 在本机连接器运行时检测本地 AI 助手命令和 provider 配置状态；
- 生成浏览器本地的 `preview-web-deck.html`，并在页面中实时预览；
- 生成可复制的 Agent 指令、`source.md`、`extracted-source.md`、`manifest.json` 和 `project-brief.json`；
- 在 `project-brief.json` 写入 `briefMode`、`visualBrief`、`guidedBrief` 和 `expectationFit`，让 Codex 判断是直接制作、分步问清，还是带假设草稿；
- 下载完整 `handoff-kit.zip`，或通过本机连接器生成项目目录；
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

v4.1.0 保留 v4.0 混合可编辑视觉治理合同，但把控制台简化。离线时主按钮复制本机连接命令；在线后主按钮生成本地项目包；项目生成后主按钮启动或复制 AI 助手命令。命令详情和文件清单默认收进折叠区。

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
| 打开 Web Experience | 工作台、四步操作条、快速控制台、一个主按钮、折叠帮助和设置区正常显示。 |
| 本机连接离线状态 | 主按钮复制启动命令：先寻找或拉取本地仓库，再运行 `npm run bridge`；更多操作中仍可下载 zip。 |
| 本机连接在线状态 | `GET /health` 填充本地 AI 助手和 provider 状态。 |
| 拖入文本资料 | 文件显示为浏览器已预读，并进入 `extracted-source.md`。 |
| 拖入二进制资料 | 文件显示为等待本地 Bridge 解析，并进入 `attachments/`。 |
| 实时 Web Deck 预览 | 预览框渲染 `preview-web-deck.html`，不依赖后端或脚本。 |
| 复制 Agent prompt | 剪贴板获得带页纲和交付包上下文的 prompt。 |
| 选择可视化标签 | `project-brief.json` 记录 `visualBrief.selectedTags`、标签中文名、背景文本、特殊要求和参考链接。 |
| brief 很薄或模糊 | `expectationFit` 变为黄/红，Agent prompt 会要求 Codex 先进行分步需求访谈。 |
| 复制 `source.md` | 剪贴板获得生成后的 source markdown。 |
| 下载 `source.md` | 浏览器下载带当前表单值和页纲的 Markdown brief。 |
| 下载 `preview-web-deck.html` | 浏览器下载带当前 brief 和 storyboard 的单文件 HTML 预览。 |
| 下载 `handoff-kit.zip` | 浏览器下载包含源资料、manifest、attachments、prompt、preview、engine plan、checklist、asset plan、visual element kit、Codex task、AGENTS guide、quality report 和 README 的 zip。 |
| 生成本地项目 | 本机连接器写入本地项目文件夹并返回建议 AI 助手命令。 |
| 交付详情区 | 本地项目生成后，折叠详情中显示 `python3 scripts/generate_visual_element_kit.py <projectPath>`、AI 助手命令和 `Needs-Manual` prompt fallback。 |
| 打开 Web Deck 示例 | 静态构建中的 `examples/agentic-developer-tools-2026/web-demo.html` 能打开。 |
| Skill 安装说明 | 能跳到 README Skill 区域或 `docs/guides/agent-setup.md`。 |
| 移动端 | 四步条、主按钮、设置抽屉和分组预览不溢出。 |
| 移动端首屏 | CTA 自动换行，Skill 入口仍然明显。 |

## 场景覆盖

MVP 至少保持这些 brief 生成场景可用：

- 中文汇报 PPTX；
- 英文 pitch Web Deck；
- 咨询方案 Skill 工作流；
- 培训课件 Skill 工作流。

页面也必须保持两条引擎路线都足够明显：网页端负责获客、预览和 handoff；Skill 仍是最终质量、资料解析、渲染、修复和导出的生产路线。

## 实现位置

- 网页端代码：[apps/web](../../../apps/web)
- Pages workflow：[.github/workflows/pages.yml](../../../.github/workflows/pages.yml)
- 公开脱敏 Demo：[examples/agentic-developer-tools-2026](../../../examples/agentic-developer-tools-2026)
