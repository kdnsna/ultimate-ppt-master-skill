# HTTP API 与服务器部署说明

> 回答：是否支持 HTTP API 调用？部署到服务器是否必须装 Codex/Claude Code？

**结论（v7.0.0-beta.1）：**

| 方式 | 是否 HTTP | 是否直接生成最终 PPTX | 是否需要 Agent |
|------|-----------|----------------------|----------------|
| `bin/upm make` / `edit` / `plan` | 否（本地 CLI） | **是**（local 后端） | 否 |
| Agent Connect Bridge | **是**（仅本机 `127.0.0.1`） | **否** | 最终成稿通常需要 |
| 公网多租户「一键生成 API」 | 否 | 不提供 | — |

## 1. 推荐：本地 CLI（无需 HTTP、无需 Agent）

```bash
bash scripts/bootstrap.sh --profile pptx
bin/upm make ./材料.md --mode quick --out ./projects
bin/upm edit deck.pptx --edits edits.json
bin/upm doctor --profile pptx
```

- 默认 `--export-backend local`：离线可导出 shape-editable PPTX。
- `standard` / `audit` 下 **禁止** 把 Kimi 当作正式导出后端。
- 适合脚本、CI、服务器批处理：直接调用 CLI，不必起 HTTP。

## 2. Bridge HTTP API（准备/编排，不是多租户生成服务）

启动：

```bash
npm run bridge
# 默认仅监听 127.0.0.1（本地 Web 工作台配套）
```

常见端点（概念）：

| 方法 | 路径 | 作用 |
|------|------|------|
| `POST` | `/handoff` | 创建本地 handoff 工程（sources、storyboard、brief、agent 提示等） |
| `GET` | `/events` | 会话进度事件流 |
| `GET` | `/projects/artifacts` | 发现已生成的交付物 |
| `GET` | `/projects/artifacts/file` | 下载已落盘的产物（路径受限） |
| `GET` | `/agent/status` | Agent 运行状态（若启用 launch） |

**重要边界：**

1. **`POST /handoff` 不会在服务端直接“造出”最终 PPTX。** 它写本地生产合同（handoff 目录），再交给 Agent 或你本机继续 `upm make` / SKILL 流程。
2. Bridge **不是** 公网多租户生成 API；默认绑定本机 loopback。若自行改监听地址，需自担鉴权与隐私风险。
3. 若启用 `--allow-launch` 且本机有 Codex 等 Agent，Bridge 可帮你启动命令；否则返回可复制命令，由你手动执行。
4. 也可 **不装 Agent**：在 handoff 目录就绪后，用 `bin/upm make` 基于资料走 CLI 生成路径（与完整 SKILL 杂志风流程不是同一条产品线）。

详细字段与产物清单见 [agent-connect-bridge.md](./agent-connect-bridge.md)。

## 3. 服务器部署怎么选

```text
只要批处理出 PPTX
  → 装 Python + bootstrap --profile pptx
  → 调 bin/upm make（systemd/cron/CI 均可）
  → 不需要 Codex/Claude Code，不需要 Bridge HTTP

要接 GitHub Pages 工作台 + 本地 handoff
  → 本机 npm run bridge + 浏览器工作台
  → 最终精修仍常依赖 Agent 或 upm CLI

要公网 SaaS 一键生成
  → 本仓库不提供现成多租户 HTTP 生成服务
  → 需自建网关、鉴权、队列，并明确调用 upm CLI 或 Agent
```

## 4. 与「杂志风网页 PPT」的关系

- CLI：`upm make --format web-deck` = **Experimental SVG HTML Preview**，不是杂志风 GA。
- Agent SKILL Mode 2 仍可走杂志风工作流，那是 Agent 路径，不是 Bridge 单独 `POST` 就能完成的成品 API。

## 5. 相关命令速查

```bash
# 纯 CLI 生成（服务器友好）
bin/upm make sources.md --mode quick --export-backend local

# Bridge（本机 HTTP 编排）
npm run bridge

# 环境
bin/upm doctor --profile pptx
```
