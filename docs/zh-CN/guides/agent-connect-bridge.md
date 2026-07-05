# Agent Connect Bridge

Agent Connect Bridge 是 v3.0 给静态 Web Experience 配套的本地服务。它让 GitHub Pages 页面连接用户本机 `127.0.0.1`，把真实源文件落盘、本地调用转换脚本、检查 provider 状态，并把正式商务 handoff 项目目录交给 Codex 或其他 Agent。

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

配置页也可以帮本地助手安装或更新 Skill。Bridge 启动后，**安装到 Codex** 会把当前 checkout 链接到 `~/.codex/skills/ultimate-ppt-master`；**安装到通用 Agent** 会链接到 `~/agent-skills/ultimate-ppt-master`。如果 Bridge 没启动，网页会复制一条终端命令。

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
- `project-brief.json.briefMode` / `visualBrief` / `guidedBrief` / `expectationFit`：来自可视化标签、粘贴背景、分步访谈状态、默认假设和生产就绪度的用户意图契约。
- `preview-web-deck.html`：浏览器本地粗预览。
- `engine-plan.md`：PPTX / Web Deck / Fusion 路线分工。
- `quality-checklist.md`：交付前检查清单。
- `asset-plan.md`：公开参考、ChatGPT 生成素材、来源/授权和插入位置。
- `asset_plan.json`：v5.4 Asset Factory 合同，记录 slide、slot、类型、比例、来源策略、prompt 路径、状态和 `current_generation_evidence` 规则。
- `prompts/*.md`：`asset_plan.json` 引用的逐资产 prompt 文件。
- `visual-element-kit.md`：ChatGPT 生图优先的小元素素材清单。
- `codex-task.md`：Codex 专用生产步骤。
- `AGENTS.md`：Codex 本地隐私、素材和质量门禁规则。
- `quality-report.json`：Design Doctor / 正式商务复查状态。

Codex 应先读 `AGENTS.md`、`codex-task.md`、`visual-element-kit.md`、`asset-plan.md`、`asset_plan.json`、`quality-checklist.md`、`manifest.json` 和 `project-brief.json`。如果 `expectationFit.readyForProduction` 为 false，Codex 应先进行分步需求访谈，每轮只问一组相关问题，直到受众、场景、目的、资料、核心观点、页数、风格、素材边界、输出格式和禁忌都明确。brief 可生产后，下一条本地命令是：

```bash
cd <repoRoot> && python3 scripts/generate_visual_element_kit.py <projectPath>
```

如果没有配置 image backend 或 OpenAI key，脚本会把 `Needs-Manual` prompts 写到 `images/image_prompts.md`；复制到 ChatGPT 生成后，按清单保存到对应路径。

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

支持检测：

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
| `POST /skill/install` | 把 Skill 安装或更新到固定白名单本地 Agent 目标（`codex` 或 `generic`）。 |

CORS 只允许 GitHub Pages 和本地开发源。

## 安全默认值

- 只绑定 localhost。
- 请求体默认限制 60 MB，可用 `UPM_BRIDGE_MAX_MB` 调整。
- 输出目录默认 `~/UltimatePPTMaster/handoffs`，可用 `UPM_BRIDGE_OUTPUT_DIR` 调整。
- 默认不自动启动 Agent。
- API key 值永远不返回给浏览器。
- Skill 安装只写入固定白名单目录，不接受浏览器传入的任意文件路径。

开启可选自动启动：

```bash
npm run bridge -- --allow-launch
```

未开启自动启动时，网页仍会给出可复制命令，例如：

```bash
cd ~/UltimatePPTMaster/handoffs/my-deck-... && codex "Read AGENTS.md, codex-task.md, visual-element-kit.md, asset-plan.md, quality-checklist.md, manifest.json, and project-brief.json first..."
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
