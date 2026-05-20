# Web Experience

Web Experience 是终极融合 PPT 大师当前的主推广入口。它是部署到 GitHub Pages 的静态 React/Vite **Deck Brief Studio**，同时承担 PPTX 路线和 Web Deck 路线的融合前台。

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## 它做什么

- 让用户选择资料类型、使用场景、输出形式、视觉风格、语言、Agent 工具和模型偏好；
- 接收粘贴资料、摘要或粗稿；
- 生成页纲和 brief 完整度检查；
- 同屏展示 Hugo He / ppt-master 的 PPTX 路线和 op7418 / 歸藏的 Web Deck 路线；
- 生成浏览器本地的 `preview-web-deck.html`，并在页面中实时预览；
- 生成可复制的 Agent 指令和 `source.md`；
- 下载 `source.md` 或完整 `handoff-kit.zip`；
- handoff kit 内含 `source.md`、`agent-prompt.md`、`project-brief.json`、`preview-web-deck.html`、`engine-plan.md`、`quality-checklist.md` 和 `README.md`；
- 打开脱敏 Agentic Developer Stack 2026 Web Deck 示例；
- 保持 Skill 安装入口足够显眼。

## 它不做什么

- 不接后端；
- 不托管模型 API；
- 不做账号系统；
- 不上传用户资料，也不做服务端保存；
- MVP 不依赖统计分析。

Brief 组装完全在浏览器本地完成。私有资料默认留在用户本地，用户把下载的 handoff kit 交给自己的 Agent。

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
| 打开 Web Experience | 工作台、资料输入、页纲、完整度检查、预览 tabs 和 CTA 按钮正常显示。 |
| 实时 Web Deck 预览 | 预览框渲染 `preview-web-deck.html`，不依赖后端或脚本。 |
| 复制 Agent prompt | 剪贴板获得带页纲和交付包上下文的 prompt。 |
| 复制 `source.md` | 剪贴板获得生成后的 source markdown。 |
| 下载 `source.md` | 浏览器下载带当前表单值和页纲的 Markdown brief。 |
| 下载 `preview-web-deck.html` | 浏览器下载带当前 brief 和 storyboard 的单文件 HTML 预览。 |
| 下载 `handoff-kit.zip` | 浏览器下载包含 `source.md`、`agent-prompt.md`、`project-brief.json`、`preview-web-deck.html`、`engine-plan.md`、`quality-checklist.md` 和 `README.md` 的 zip。 |
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
