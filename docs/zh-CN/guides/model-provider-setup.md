# 模型与 Provider 配置

Ultimate PPT Master 把经常被混在一起的三件事分开处理：

1. **Agent 模型**：Codex、Claude Code、Hermes、OpenClaw 或其他本地 Agent 使用的模型。
2. **Provider 密钥**：图片生成、图片搜索、配音和媒体工具使用的可选密钥。
3. **Bridge 直连变量**：本地 Bridge 用于识别 Provider 和进行轻量连接检查的环境变量。

## 应该配置哪一项

| 目标 | 配置位置 | 当前建议 |
|---|---|---|
| 获得更好的整套演示效果 | Agent 自己的模型或登录 | 推荐。让 Agent 读取文件、执行脚本、预览和修订。 |
| 获得更好的视觉素材 | `~/.ppt-master/.env` 中的 Provider 密钥 | 需要 AI 图片或图库搜索时再配置。 |
| 检查直连 API | `LLM_*` 环境变量 | 仅用于本地 Bridge 状态与连接检查；整套生产仍由 Agent/Skill 完成。 |
| 第一次普通试用 | 无需模型密钥 | 先打开静态 Web 工作台，再把任务交给本地 Agent。 |
| Desktop 基础预览 | 无需模型密钥 | 只在需要高级本地模式时使用 Desktop。 |

## 配置加载顺序

项目按以下顺序读取配置：

1. 当前进程环境变量；
2. 仓库根目录 `.env`；
3. 用户级 `~/.ppt-master/.env`。

推荐做法：

```bash
mkdir -p ~/.ppt-master
cp .env.example ~/.ppt-master/.env
$EDITOR ~/.ppt-master/.env
```

不要把真实密钥提交到 Git。

## 配置 Agent 模型

先在 Agent 自己的工具中完成模型与账号配置，本仓库不会替代 Agent 的登录体系。

- Codex：安装并登录 Codex，再把本仓库安装为 Skill。
- Claude Code：配置 Claude Code 的账号、模型和设置，再让它读取 `CLAUDE.md` 或 `SKILL.md`。
- Hermes、OpenClaw 或通用 Agent：配置各自的模型 Provider，再让它读取 `AGENTS.md` 与 `SKILL.md`。

## 图片生成

OpenAI 图片生成示例：

```dotenv
IMAGE_BACKEND=openai
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-image-2
```

其他图片后端见 [`.env.example`](../../../.env.example)。只保留实际使用的 Provider。

## 图片搜索

可选配置：

```dotenv
PEXELS_API_KEY=your-pexels-key
PIXABAY_API_KEY=your-pixabay-key
```

没有这些密钥时，Agent 仍可使用用户提供的素材、公开参考或原生图形完成设计。

## 配音与音频

只有需要云端高质量或克隆音色时才配置：

```dotenv
ELEVENLABS_API_KEY=your-elevenlabs-api-key
MINIMAX_API_KEY=your-minimax-key
QWEN_API_KEY=your-dashscope-key
```

## Bridge 直连变量

Bridge 在本机读取这些变量，并只向工作台报告 Provider 是否就绪，不返回密钥值：

```dotenv
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4.1
```

也会识别常见 Provider 的专用变量：

```dotenv
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4.1
GEMINI_API_KEY=your-gemini-key
QWEN_API_KEY=your-dashscope-key
DEEPSEEK_API_KEY=your-deepseek-key
```

这些变量不会把静态网页变成云端模型产品。Bridge 可以在本地检查连接，但正式 PPTX/Web Deck 仍由 Agent Skill 工作流生产。

## 检查 Bridge

```bash
npm run bridge
```

再打开 Web 工作台。环境与诊断面板应显示已配置的 Provider，但不能打印密钥。

## 检查整体配置

```bash
npm run doctor
```

`doctor` 只应报告密钥是否存在，不应输出密钥内容。
