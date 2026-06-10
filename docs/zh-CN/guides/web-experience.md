# Web Experience

Web Experience 是 Ultimate PPT Master v4.4 的 Codex 优先启动器。它仍是部署到 GitHub Pages 的静态 React/Vite 页面，但职责被刻意缩小：收集资料和一句目标，通过 Bridge 写入本地 handoff 项目，并复制 Codex 命令。

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## 它做什么

- 接收拖入的 `.md`、`.txt`、`.pdf`、`.docx`、`.pptx`、`.xlsx` 等文件；
- 接收粘贴资料和一句 Codex 目标；
- 文本资料在浏览器预读，二进制资料交给本机 Bridge 解析；
- 正式商务材料默认可编辑 PPTX，除非 brief 明确要求 Web Deck 或双版本；
- 页数、听众、语言和输出 override 只放在一个高级设置里；
- 本机 Bridge 运行时自动检测连接状态；
- Bridge 离线时复制安全启动命令；
- Bridge 在线时通过 `POST /handoff` 创建本地项目；
- 本地项目创建后立即复制建议的 Codex 命令；
- Bridge 允许启动时，可以调用 `/agent/launch` 启动 Codex；
- `storyboard.json`、`source-map.json`、`planning-report.json`、`review-findings.json`、`repair-plan.json`、`revision-brief.md`、`quality-report.json`、Benchmark Wall 等证明材料保留在调试抽屉。

## Handoff 内容

本地项目仍然拿到完整生产合同：

- `source.md`
- `extracted-source.md`
- `attachments/`
- `manifest.json`
- `agent-prompt.md`
- `project-brief.json`
- `preview-web-deck.html`
- `engine-plan.md`
- `quality-checklist.md`
- `asset-plan.md`
- `visual-element-kit.md`
- `codex-task.md`
- `AGENTS.md`
- `storyboard.json`
- `source-map.json`
- `planning-report.json`
- `review-findings.json`
- `repair-plan.json`
- `revision-brief.md`
- `quality-report.json`

## 它不做什么

- 不托管模型 API；
- 不做账号系统；
- 不上传到托管服务，也不做服务端保存；
- 不在浏览器保存 API key；
- 不在网页里完成完整 PPT 生产；
- 不在主界面暴露复杂 provider 设置。

Brief 组装在浏览器完成。用户运行 `npm run bridge` 时，资料只发送到本机 `127.0.0.1`，用于本地解析和项目落盘。

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
| 打开 Web Experience | 单屏 Codex-first 页面正常显示：资料拖拽、粘贴资料、一句目标、一个主按钮、状态面板。 |
| 本机连接离线状态 | 主按钮复制启动命令，先寻找本地仓库再运行 `npm run bridge`。 |
| 本机连接在线状态 | `GET /health` 显示 Bridge 已连接，主按钮创建本地项目。 |
| 拖入文本资料 | 文件显示为浏览器已预读，并进入 handoff payload。 |
| 拖入二进制资料 | 文件显示为 Bridge 解析附件，并进入 `attachments/`。 |
| 生成本地项目 | 本机连接器写入项目文件夹并返回建议 Codex 命令。 |
| 完成状态 | 页面显示项目路径、Codex 命令和已复制提示。 |
| 调试抽屉 | 高级证明材料仍可查看，但不挡主流程。 |
| 移动端 | 输入、主按钮、结果和调试抽屉不重叠。 |

## 场景覆盖

当前启动器至少保持这些 source-to-handoff 场景可用：

- 中文经营汇报到可编辑 PPTX；
- 咨询方案到可编辑 PPTX；
- 培训课件到可编辑 PPTX；
- 发布会或 demo brief 到 Web Deck；
- 明确要求双版本的 brief 到 PPTX + Web Deck。

网页现在只负责启动。Skill 和 Codex 路线仍是最终质量、资料解析、渲染、修复和导出的生产路径。

## 实现位置

- 网页端代码：[apps/web](../../../apps/web)
- Bridge 代码：[apps/bridge/server.mjs](../../../apps/bridge/server.mjs)
- Pages workflow：[.github/workflows/pages.yml](../../../.github/workflows/pages.yml)
