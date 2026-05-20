# Web Experience

Web Experience 是终极融合 PPT 大师当前的主推广入口。它是部署到 GitHub Pages 的静态 React/Vite 应用。

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## 它做什么

- 让用户选择资料类型、使用场景、输出形式、视觉风格、语言、Agent 工具和模型偏好；
- 实时生成可复制的 Agent handoff prompt；
- 下载本地 `source.md` 起步模板；
- 打开脱敏 Web Deck 示例；
- 保持 Skill 安装入口足够显眼。

## 它不做什么

- 不接后端；
- 不托管模型 API；
- 不做账号系统；
- 不上传或保存用户资料；
- MVP 不依赖统计分析。

Prompt 生成完全在浏览器本地完成。私有资料默认留在用户本地，由用户交给自己的 Agent。

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
| 打开 Web Experience | 表单、prompt 预览、demo 图片和 CTA 按钮正常显示。 |
| 复制 Agent prompt | 剪贴板获得当前场景生成的 prompt。 |
| 下载 `source.md` | 浏览器下载带有当前表单值的 Markdown 模板。 |
| 打开 Web Deck 示例 | 静态构建中的 `examples/desktop-cultural-tourism-demo/web-demo.html` 能打开。 |
| Skill 安装说明 | 能跳到 README Skill 区域或 `docs/agent-setup.md`。 |
| 移动端首屏 | CTA 自动换行，Skill 入口仍然明显。 |

## 场景覆盖

MVP 至少保持这些 prompt 生成场景可用：

- 中文汇报 PPTX；
- 英文 pitch Web Deck；
- 咨询方案 Skill 工作流；
- 培训课件 Skill 工作流。

## 实现位置

- 网页端代码：[apps/web](../../apps/web)
- Pages workflow：[.github/workflows/pages.yml](../../.github/workflows/pages.yml)
- 公开脱敏 Demo：[examples/desktop-cultural-tourism-demo](../../examples/desktop-cultural-tourism-demo)
