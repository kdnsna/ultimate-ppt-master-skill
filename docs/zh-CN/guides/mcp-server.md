# MCP 接入指南 · 保真改 PPT

`scripts/ppt_preserve_mcp.py` 是一个**零依赖**的 MCP（Model Context Protocol）server，把保真编辑引擎暴露给任意支持 MCP 的 Agent（Claude Desktop、Cursor、Codex、Kimi、Cline 等）。它让 Agent 能**安全地修改一份真实 `.pptx`**——只动用户点名的页，其余每个包内部分（未选页、logo、母版、版式、主题、媒体、链接）字节级保留。

它只用 Python 标准库，**无需 `pip install` 任何东西**，只要本机有 `python3`。

## 它提供两个工具

| 工具 | 作用 |
|---|---|
| `inspect_pptx` | 列出一份 `.pptx` 的每页可见文本。先调它，才知道每页有什么、该改哪页。 |
| `edit_pptx_preserving` | 按「原文 → 新文本」只改点名页，写出新 `.pptx`，并返回**保真报告**。 |

`edit_pptx_preserving` 的参数：

- `source_path`：源 `.pptx` 的绝对路径。
- `edits`：数组，每项 `{ "slide": 页码(从1), "replacements": { "原文": "新文本" } }`。
- `output_path`：可选，默认 `<源文件名>-repaired.pptx`。

## 硬性规则（已写进 server 的 instructions）

保真报告是**门禁**：如果报告不是 `safe`（出现了未点名页的改动，或有 part 被新增/删除），Agent **不得**宣称成功，必须把违规如实告诉用户。server 在报告不安全时会把工具结果标记为错误。

## 运行

无需安装依赖，直接以 stdio 方式启动：

```bash
python3 /绝对路径/ultimate-ppt-master-skill/scripts/ppt_preserve_mcp.py
```

> 用**绝对路径**指向脚本。MCP 客户端的工作目录不可控，绝对路径最稳。

## 客户端配置

把下面片段加入你的 MCP 客户端配置，将 `/绝对路径/...` 换成你本机的真实路径。

Claude Desktop（`claude_desktop_config.json`）/ 通用 stdio 客户端：

```json
{
  "mcpServers": {
    "ppt-preserve": {
      "command": "python3",
      "args": ["/绝对路径/ultimate-ppt-master-skill/scripts/ppt_preserve_mcp.py"]
    }
  }
}
```

Cursor（`.cursor/mcp.json` 或设置中的 MCP）：

```json
{
  "mcpServers": {
    "ppt-preserve": {
      "command": "python3",
      "args": ["/绝对路径/ultimate-ppt-master-skill/scripts/ppt_preserve_mcp.py"]
    }
  }
}
```

如果你的 `python3` 不在 `PATH`，把 `command` 换成解释器的绝对路径（例如虚拟环境里的 python）。该 server 本身不依赖任何第三方包，所以用哪个解释器都能跑。

## 本地优先

server 全程在本机进程内读写文件，**不联网、不上传**。这与本仓库「本地优先」的立场一致：源文件和产物都留在你的机器上。

## 典型用法（给 Agent 的提示词参考）

> 用 `inspect_pptx` 看一下这份 PPT 每页写了什么；然后把第 5 页图表标题里的「Q2」改成「Q3」，用 `edit_pptx_preserving`，其余页不要动。如果保真报告不安全，停下来告诉我哪里越界了。
