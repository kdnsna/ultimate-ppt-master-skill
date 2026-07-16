# Agent Connect Bridge

Agent Connect Bridge 是 v6.3.7 工作台的本地伴侣。它让 GitHub Pages 页面只连接本机 `127.0.0.1`，把真实资料落盘，将用户确认的 `DeckSession` 原样并入生产故事板，再把项目交给 Codex。Bridge 只发现和下载通过本地路径边界的真实成品，不承担云端托管。v6.3.7 源码的机器状态为 `github-released`；是否真正发布，只以 [`v6.3.7` tag 与 GitHub Release 页面](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.7) 为准。marketplace 发布与 Pages 当前部署 SHA 都是独立状态。

## 快速开始

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

打开在线体验页：

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

拖入资料，确认故事板和视觉方向，然后点击**创建本地项目**。如果 Bridge 使用 `--allow-launch` 启动且本机已安装 Codex，主操作会变成**创建项目并启动 Codex**。

未允许自动启动时，Bridge 会返回一条可复制的 Codex 命令。Bridge 离线时，网页只提供本机启动命令，不会伪装成已经创建项目。

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
- `storyboard.json`：DeckIR 1.0 生产地图，保留用户确认的页序、`slideId`、标题、结论、角色和结构方案。
- `source-map.json`：真实资料提取出的 claim 及逐页证据绑定。
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
- `quality-report.json`：Design Doctor / 正式商务复查状态；其中的状态会成为工作台里的产物验证标记。

Codex 应先读 `AGENTS.md`、`codex-task.md`、`visual-element-kit.md`、`asset-plan.md`、`asset_plan.json`、`quality-checklist.md`、`manifest.json` 和 `project-brief.json`。如果 `expectationFit.readyForProduction` 为 false，Codex 应先进行分步需求访谈，每轮只问一组相关问题，直到受众、场景、目的、资料、核心观点、页数、风格、素材边界、输出格式和禁忌都明确。brief 可生产后，下一条本地命令是：

```bash
cd <repoRoot> && python3 scripts/generate_visual_element_kit.py <projectPath>
```

如果没有配置 image backend 或 OpenAI key，脚本会把 `Needs-Manual` prompts 写到 `images/image_prompts.md`；复制到 ChatGPT 生成后，按清单保存到对应路径。

## 从本地 Agent 到真实成品

`POST /handoff` 不会把结构稿冒充最终文件。它先创建本地生产合同，随后在明确允许时启动 Codex；否则返回可复制命令，由用户在终端启动。

工作台处于“设计与生成”或“精修”阶段时，每 3 秒同时查询产物清单与 `GET /agent/status`。页面隐藏时暂停，恢复可见后继续。刷新到“交付”阶段时，会根据持久化的 `session.projectPath` 恢复检查一次，之后不会持续轮询。

Agent 运行状态为 `idle`、`accepted`、`running`、`completed` 或 `failed`。Agent 仍在运行时，`warning` 产物不会提前被判成质量阻断；Agent 结束后，当前输出模式要求的产物必须通过验证。命令模式下 Bridge 无法观察用户在终端手动启动的进程，因此产物发现才是完成与否的最终依据。

Bridge 只扫描：

- `exports/` 中的 `.pptx`、`.html`、`.pdf` 和压缩包；
- `ppt/` 中生成的演示文件；
- 项目根目录明确列入白名单的质量报告。

`pending`、`warning` 状态的文件可以下载复核，但只有当前输出模式要求的全部产物类型均为 `passed`，并且所有故事板页面都已批准，工作台才显示“标记为已交付”。HTML 结构预览会一直标注为结构稿，不等同于最终 PPTX。

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

handoff 成功后，Bridge 响应会带回权威 `storyboard` 和 `sourceMap`。工作台只回填已验证资料状态，以及每页的 `evidenceState` 与 `evidenceRefs`；不会覆盖用户修改后的页序、`slideId`、标题、结论、角色或所选结构方案。

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
| `GET /events` | 通过 SSE 只读推送阶段、产物、审阅发现、失败、恢复和完成进度。 |
| `GET /providers` | 不含密钥的 provider 状态。 |
| `POST /providers/test` | 通过 Bridge 测试已配置 provider。 |
| `POST /handoff` | 创建本地 handoff 项目。 |
| `POST /slides/regenerate` | 在已有 Bridge handoff 中为一个稳定 `slideId` 保存修订请求。 |
| `GET /projects/artifacts?projectPath=<handoff>` | 列出白名单内的成品和质量报告，返回类型、大小、修改时间与验证状态。 |
| `GET /projects/artifacts/file?projectPath=<handoff>&artifact=<relative-path>` | 以附件模式下载清单中的一项真实产物。 |
| `POST /agent/launch` | 返回 Agent 命令；只有显式允许时才自动启动。 |
| `GET /agent/status?projectPath=<handoff>` | 读取持久化 Agent 任务的 `idle`、`accepted`、`running`、`completed` 或 `failed` 状态。 |
| `POST /skill/install` | 把 Skill 安装或更新到固定白名单本地 Agent 目标（`codex` 或 `generic`）。 |

CORS 只允许 GitHub Pages 和本地开发源。

## HTTP API 边界与服务器部署

v6.3.7 Bridge 是任务准备和编排 API，不是可直接对公网开放的多租户生成服务。`POST /handoff` 创建项目合同，`GET /events` 返回进度，`POST /slides/regenerate` 记录单页修改；两个 artifact 接口只发现和下载本地 Agent 已经生成的文件。最终 PPTX/Web 生成仍需要以下执行层之一：

1. **Agent Runner**：在 Worker 上安装 Codex、Claude Code、Hermes 或 OpenClaw，由它针对 handoff 目录执行 Skill。
2. **自建编排器**：直接调用仓库脚本，持久化 `DeckSession`，负责重试/恢复点、质量门禁和最终产物发布。

当前没有带认证的独立 `POST /generate` 接口。服务会拒绝非 loopback 监听，也没有租户隔离和任务队列，因此不能直接暴露到互联网。远程部署应在隔离 Worker 前增加认证 API Gateway 与任务队列，并让 Bridge/Skill 进程保持私有。

## 安全默认值

- 只绑定 localhost。
- 请求体默认限制 60 MB，可用 `UPM_BRIDGE_MAX_MB` 调整。
- 输出目录默认 `~/UltimatePPTMaster/handoffs`，可用 `UPM_BRIDGE_OUTPUT_DIR` 调整。
- 默认不自动启动 Agent。
- API key 值永远不返回给浏览器。
- Skill 安装只写入固定白名单目录，不接受浏览器传入的任意文件路径。
- 每次产物或启动请求都会先用 `realpath` 解析 `outputDir`、项目目录和 `manifest.json`。
- `projectPath` 必须是 `outputDir` 内的真实目录，不能是符号链接；常规文件 `manifest.json` 必须包含与目录完全一致的绝对 `projectPath`，并带有针对完整 manifest（不含签名块本身）的 Bridge HMAC 签名。空、未签名、被篡改或伪造的 manifest 都会被拒绝。
- Bridge 将私有签名密钥保存在 `outputDir/.bridge-manifest.key`，权限为 `0600`；health、manifest、产物列表和下载响应都不会返回它。重启 Bridge 时请保留该文件；旧版未签名 handoff 需要通过 `/projects/create` 重建后才能启动 Agent 或下载。
- `artifact` 必须是项目相对路径，禁止 `..`、绝对路径、反斜杠和任何符号链接跳转。
- 只开放 `exports/`、`ppt/` 与质量报告白名单；`attachments/`、源文件和任意目录浏览始终不可见。
- 下载统一使用附件响应；Bridge 不是通用本地文件服务器。

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

如果 Agent 已生成文件但工作台没有发现，请先确认文件位于 `<projectPath>/exports/` 或 `<projectPath>/ppt/`，再刷新产物面板。不要移动或编辑 `manifest.json`：完整 handoff 合同已签名，任何改动都会使其失效；可变的复核结果应写入 `quality-report.json`。如果旧项目提示缺少真实性签名，请通过 `/projects/create` 重建。
