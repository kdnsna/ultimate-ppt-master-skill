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
- handoff kit 内含 `source.md`、`extracted-source.md`、`attachments/`、`manifest.json`、`agent-prompt.md`、`project-brief.json`、`preview-web-deck.html`、`engine-plan.md`、`quality-checklist.md` 和 `README.md`；
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

v2.5.0 起，首页继续用通俗语言解释 Bridge、Agent、API key 和 handoff，并把工作台拆成开始、资料与目标、配置检测、交给 AI 助手、预览与文件等菜单页。首屏右侧会显示当前任务预览、下一步和质量状态；内容预设区会显示 stable pack 路径、模板候选、Design Doctor、预期产物和更具体的质量检查。

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
| 下载 `handoff-kit.zip` | 浏览器下载包含源资料、manifest、attachments、prompt、preview、engine plan、checklist 和 README 的 zip。 |
| 发送到 Bridge | Bridge 写入本地 handoff 文件夹并返回建议 Agent 命令。 |
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
