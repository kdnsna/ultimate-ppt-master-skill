# Web Experience

Web Experience 是终极融合 PPT 大师当前的主入口。v6 是部署到 GitHub Pages 的静态 React/Vite 任务型工作台；v5.4.1 控制台通过 `?classic=1` 保留一个版本周期。

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## 它做什么

- 接收一句任务、文件、URL 或已有 PPTX，自动推断页数，不把技术设置堆在首层；
- 最多补问三个关键问题，生成可编辑故事板；每页有稳定 `slideId`、证据状态和三种结构方案；
- 从六套 v6 完整视觉包中推荐三个真实方向，不再只展示抽象风格标签；
- 先生成确定性结构预览，只有进入精修阶段才创建 iframe；
- 在同一个三栏工作区展示缩略图、预览、质量问题、页面确认和单页修订；
- 检测本机 Bridge，通过只读 SSE 接收进度，页面不可见时停止轮询，并继续写出兼容旧版的 handoff 产物；
- 通过 SHA-256 复用资料提取缓存，单页修订写入 `revision-requests/Pxx.json`；
- Bridge 命令、Provider 状态、路径和生产文件收进“环境与诊断”；
- PowerPoint 继续负责正式编辑，Skill 负责资料、品牌、ChatGPT 辅助素材、`formal-business` 门禁、可编辑对象检查和质量闭环。

## 它不做什么

- 不接后端；
- 不托管模型 API；
- 不做账号系统；
- 不上传到托管服务，也不做服务端保存；
- 不在浏览器保存 API key；
- MVP 不依赖统计分析。

Brief 组装完全在浏览器本地完成。用户运行 `npm run bridge` 时，资料只发送到本机 `127.0.0.1`，用于本地解析和项目落盘。

v6 保留 v5.4.1 的产物合同。离线时进入聚焦的修复对话框；在线时创建本地项目并流式播报进度。组件优先的经典控制台在兼容期通过 `?classic=1` 访问。

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
| 打开 Web Experience | v6 任务型工作台、紧凑阶段条和一个主按钮正常显示；输入阶段不创建预览 iframe。 |
| 本机连接离线状态 | “环境与诊断”显示一条可执行的 `npm run bridge` 修复命令。 |
| 本机连接在线状态 | `GET /health` 填充本地 AI 助手和 provider 状态。 |
| 拖入文本资料 | 文件显示为浏览器已预读，并进入 `extracted-source.md`。 |
| 拖入二进制资料 | 文件显示为等待本地 Bridge 解析，并进入 `attachments/`。 |
| 故事板 | “10 页”这类指令生成 P01-P10，补问不超过三个，每页有三个结构方案。 |
| 实时 Web Deck 预览 | 只有进入精修阶段才挂载预览框，并渲染 `preview-web-deck.html`。 |
| 复制 Agent prompt | 剪贴板获得带页纲和交付包上下文的 prompt。 |
| 选择可视化标签 | `project-brief.json` 记录 `visualBrief.selectedTags`、标签中文名、背景文本、特殊要求和参考链接。 |
| 选择瑞士风路线 | `project-brief.json` 记录 `webDeck.style`、`webDeck.theme`、`webDeck.layoutPolicy`、页奏和 `assetPlanRequired`；handoff 包含 `asset_plan.json`。 |
| brief 很薄或模糊 | `expectationFit` 变为黄/红，Agent prompt 会要求 Codex 先进行分步需求访谈。 |
| 复制 `source.md` | 剪贴板获得生成后的 source markdown。 |
| 下载 `source.md` | 浏览器下载带当前表单值和页纲的 Markdown brief。 |
| 下载 `preview-web-deck.html` | 浏览器下载带当前 brief 和 storyboard 的单文件 HTML 预览。 |
| 下载 `handoff-kit.zip` | 浏览器下载包含源资料、manifest、attachments、prompt、preview、engine plan、checklist、asset plan markdown、`asset_plan.json`、prompt 文件、visual element kit、Codex task、AGENTS guide、quality report 和 README 的 zip。 |
| 生成本地项目 | 本机连接器写入本地项目文件夹并返回建议 AI 助手命令。 |
| 交付详情区 | 本地项目生成后，折叠详情中显示 `python3 scripts/generate_visual_element_kit.py <projectPath>`、AI 助手命令和 `Needs-Manual` prompt fallback。 |
| 打开 Web Deck 示例 | 静态构建中的 `examples/agentic-developer-tools-2026/web-demo.html` 能打开。 |
| Skill 安装说明 | 能跳到 README Skill 区域或 `docs/guides/agent-setup.md`。 |
| 移动端 | 390px 下阶段条不溢出，首个任务输入框在初始视口可见。 |

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
