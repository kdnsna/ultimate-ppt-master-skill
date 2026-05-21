# 发布说明 - v2.3.4

v2.3.4 是一次 Web + Bridge 配置路径加固发布，继续守住真实能力边界：

> 网页负责整理项目，Bridge 负责写入本机，Agent Skill 仍然负责高质量生产。

## 最大提升

Bridge 启动命令对新手更安全了。网页复制出来的命令不再假设终端已经位于仓库根目录，而是先寻找本机 `ultimate-ppt-master-skill/package.json`，再进入正确目录运行 `npm run bridge`；如果本机没有 checkout，则会克隆到标准本地目录。

这可以直接避免类似错误：

```text
Could not read package.json ... /Users/<name>/package.json
```

## 主要变化

- Web Experience 复制的 Bridge 启动命令现在可以从 `~` 或其他任意终端目录运行。
- 新增回归测试，防止页面重新退回裸 `npm run bridge`。
- 保留由 Bridge 执行的 Codex / 通用本地 Agent Skill 安装与更新动作。
- 保留通过 `GET /health` 检测 Codex、Hermes、OpenClaw、Claude Code 的能力。
- 在 troubleshooting 中记录 `package.json` 找不到的排查和修复方式。

## 质量标准

v2.3.4 验证 Web + Bridge 仍然能生成真实本地项目包，同时让配置路径更适合新手。Provider key 和 `.venv` 仍然只是可选环境 warning，不阻塞本次发布。

## 升级

```bash
cd ultimate-ppt-master-skill
npm run update
```

然后打开 Web Experience，从开始页或配置页复制新的 Bridge 启动命令。
