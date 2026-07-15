# 故障排查

所有排查先从以下命令开始：

```bash
npm run doctor
```

保留相关本地证据，但不要把私有文档或真实 API 密钥贴进 GitHub Issue。

## 快速排查表

| 现象 | 检查 | 处理 |
|---|---|---|
| Web 工作台空白 | 浏览器控制台、`npm run build:web` | 重新安装 `apps/web` 依赖，并检查 Pages 基础路径。 |
| 公共案例链接 404 | `apps/web/public/examples/` | Pages 构建使用 `GITHUB_PAGES=true npm run build:web`。 |
| 复制命令失败 | 浏览器剪贴板权限 | 手动选中命令文本复制；工作台不会静默假装成功。 |
| 工作台显示 Bridge 离线 | `npm run bridge`、`curl http://127.0.0.1:43188/health` | 从仓库根目录启动 Bridge，并检查 `43188` 端口占用。 |
| `npm run bridge` 提示用户目录缺少 `package.json` | `pwd` | 当前目录不在仓库；先 `cd` 到项目根目录。 |
| 发送到 Bridge 失败 | Bridge 终端、请求大小 | 文件保持在 `UPM_BRIDGE_MAX_MB` 限制内，或仅在本机调整限制。 |
| 文件只标记为 `attachedOnly` | `manifest.json`、`extracted-source.md` | 先运行 `npm run setup`，再单独检查对应 `scripts/source_to_md/` 转换器。 |
| 本地文件刷新后要求重选 | 工作台资料状态 | 浏览器不会持久化文件内容；重新选择文件后再创建项目。 |
| URL 一直处于 pending | Bridge 终端、`source-map.json` | 等待本地转换成功；未解析 URL 不能提升证据状态。 |
| `npm run desktop` 失败 | Node/npm 版本、`npm run doctor` | 运行 `npm run setup`，确认 Node 与 npm 已安装。 |
| Python worker 失败 | `.venv/bin/python --version` | 运行 `npm run setup` 或 `bash scripts/bootstrap.sh`。 |
| PDF/XLSX/PPTX 未完整解析 | `manifest.json` 中的资料状态 | 使用 Agent handoff 完成完整转换，不要把附件存在等同于事实已核验。 |
| Provider 缺失 | 环境与诊断、`npm run doctor` | 把密钥放入 `~/.ppt-master/.env`，不要提交 `.env`。 |
| 原生应用无法构建 | `cargo --version`、`rustc --version` | 安装 Rust/Cargo，再运行 `npm run app:desktop`。 |
| Agent 没有使用本 Skill | Agent 对话记录 | 明确让它读取仓库绝对路径下的 `AGENTS.md` 和 `SKILL.md`。 |
| 直连 API 变量没有自行生成整套 PPT | `.env`、Bridge Provider 状态 | 这是预期行为；Bridge 负责本地检查，整套生产由 Agent/Skill 完成。 |
| 产物出现但仍不可交付 | `quality-report.json`、Artifact SHA-256 | 质量报告必须绑定同一路径和摘要；新文件或改写文件需要重新复核。 |
| 下载被拒绝为“仍在写入” | 文件时间、`.partial` 文件 | 生产者应先写 `.partial`，完成后原子改名，再等待下一次轮询。 |

## 提交问题时附带什么

安装或配置问题：

```text
操作系统：
Node 版本：
npm 版本：
Python 版本：
Rust/Cargo 版本：
执行的命令：
已删除密钥的 doctor 输出：
```

生成问题：

```text
输入类型：DOCX / PDF / XLSX / PPTX / URL / Markdown / 文字
输出模式：PPTX / Web Deck
项目路径：
sourceExtraction.status：
生成文件：
已删除私密内容的相关日志：
```

常用本地证据：

```text
projects/.../manifest.json
projects/.../source-map.json
projects/.../quality-report.json
projects/.../logs/
projects/.../exports/
```

## 隐私规则

- 不提交原始私有 DOCX、PDF、PPTX 或 XLSX。
- 不提交暴露真实业务背景的成品。
- 不在 Issue 中粘贴 API 密钥。
- 公开示例应脱敏组织名、人名、精确预算、审批路径和内部责任人。
