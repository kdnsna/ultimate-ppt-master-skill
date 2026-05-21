# Agent Connect Bridge

Agent Connect Bridge 是 v2.2 给静态 Web Experience 配套的本地服务。它让 GitHub Pages 页面连接用户本机 `127.0.0.1`，把真实源文件落盘、本地调用转换脚本、检查 provider 状态，并把项目目录交给 Codex 或其他 Agent。

## 快速开始

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run bridge
```

打开在线体验页：

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

拖入源文件，填写 brief，然后点击 **发送到本地 Bridge**。

## 会生成什么

Bridge 会在本地写入项目：

```text
~/UltimatePPTMaster/handoffs/<project-title>-<timestamp>/
```

包含：

- `source.md`：网页端结构化 brief。
- `extracted-source.md`：浏览器可预读文本 + Bridge 本地转换结果。
- `attachments/`：原始上传文件。
- `manifest.json`：解析状态、项目元数据、建议 Agent 命令。
- `agent-prompt.md`：交给 Codex / Claude Code / Hermes / OpenClaw 的生产 prompt。
- `project-brief.json`：网页端结构化选择。
- `preview-web-deck.html`：浏览器本地粗预览。
- `engine-plan.md`：PPTX / Web Deck / Fusion 路线分工。
- `quality-checklist.md`：交付前检查清单。

## 资料解析

Bridge 复用已有本地转换脚本：

| 资料 | 转换器 |
|---|---|
| PDF | `scripts/source_to_md/pdf_to_md.py` |
| DOCX / Word | `scripts/source_to_md/doc_to_md.py` |
| PPTX / PPTM | `scripts/source_to_md/ppt_to_md.py` |
| XLSX / XLSM | `scripts/source_to_md/excel_to_md.py` |
| URL | `scripts/source_to_md/web_to_md.py` |

如果转换器缺失、依赖未安装或格式暂不支持，Bridge 会保留原文件到 `attachments/`，并在 `manifest.json` 标记为 `attachedOnly`。

## API / 模型状态

网页不会保存 API key。Bridge 只从本地读取：

1. 当前进程环境变量；
2. 仓库 `.env`；
3. `~/.ppt-master/.env`。

Bridge 只返回 provider 是否配置、模型名、base URL 和 key 来源标签，不返回真实密钥。

v2.2 支持检测：

- OpenAI / OpenAI-compatible：`OPENAI_API_KEY` 或 `LLM_API_KEY`
- Gemini：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- Qwen / DashScope：`QWEN_API_KEY` 或 `DASHSCOPE_API_KEY`
- DeepSeek：`DEEPSEEK_API_KEY`
- Custom bridge：`LLM_BASE_URL` + `LLM_API_KEY`

## 本地接口

Bridge 默认监听 `http://127.0.0.1:43188`。

| 接口 | 作用 |
|---|---|
| `GET /health` | Bridge 版本、输出目录、本地 Agent 检测、provider 状态。 |
| `GET /providers` | 不含密钥的 provider 状态。 |
| `POST /providers/test` | 通过 Bridge 测试已配置 provider。 |
| `POST /handoff` | 创建本地 handoff 项目。 |
| `POST /agent/launch` | 返回 Agent 命令；只有显式允许时才自动启动。 |

CORS 只允许 GitHub Pages 和本地开发源。

## 安全默认值

- 只绑定 localhost。
- 请求体默认限制 60 MB，可用 `UPM_BRIDGE_MAX_MB` 调整。
- 输出目录默认 `~/UltimatePPTMaster/handoffs`，可用 `UPM_BRIDGE_OUTPUT_DIR` 调整。
- 默认不自动启动 Agent。
- API key 值永远不返回给浏览器。

开启可选自动启动：

```bash
npm run bridge -- --allow-launch
```

未开启自动启动时，网页仍会给出可复制命令，例如：

```bash
cd ~/UltimatePPTMaster/handoffs/my-deck-... && codex "Read agent-prompt.md and follow the Ultimate PPT Master Skill..."
```

## 排查

网页显示 Bridge 离线：

```bash
npm run bridge
```

文件未解析：

```bash
npm run setup
python3 scripts/source_to_md/pdf_to_md.py path/to/file.pdf
```

provider 状态缺失：

```bash
mkdir -p ~/.ppt-master
cp .env.example ~/.ppt-master/.env
$EDITOR ~/.ppt-master/.env
```

修改后重启 Bridge。
