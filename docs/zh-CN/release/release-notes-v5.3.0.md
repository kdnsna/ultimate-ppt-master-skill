# 发布说明 - v5.3.0

v5.3.0 新增“最佳效果提示增强器”。Skill 不再把用户的一句话直接当成生产 brief。Agent 必须先把需求扩写成 `bestEffectBrief`，再选择稳定路线。

## 更新内容

- 新增 v5.3 `bestEffectBrief` 契约，用于 Web handoff 和直接 Agent 调用：提示质量、自动扩写 brief、推荐路线、固定 fallback、默认假设和用户可见 caveat。
- 新增 Extreme Thin Prompt Fallback：只有主题或一句话时，默认使用 Guizang-like Magazine Web Deck fixed style；除非用户明确要求正式可编辑 PPTX。
- 新增正式可编辑例外：政务、金融、培训、报告、`.pptx` 和明确可编辑需求继续走 PPTX，并保留 formal-business 检查。
- 更新 `SKILL.md`、`PROMPT.md`、`AGENTS.md`、`agents/openai.yaml` 和 marketplace metadata，确保每个 Agent 入口都先执行同一条最佳效果提示。
- 更新 Web Experience，在 Visual Brief Builder 显示最佳效果提示，并把 `bestEffectBrief` 写入 `project-brief.json`、`manifest.json`、`quality-report.json`、`codex-task.md` 和生成的 `AGENTS.md`。
- 更新 README 首屏，让用户直接复制可靠提示，而不是猜怎么问。

## 白话更新栏

- 用户只说“帮我做一个 AI PPT”时，Agent 会先补齐最佳效果 brief，再开始制作。
- 极短指令默认先出一版强视觉杂志风 Web Deck，不再生成平庸通用 PPT。
- 如果用户要正式可编辑文件，系统仍然走 PPTX，并保留同样的质量检查。
- Agent 少问普通风格问题，只在事实、来源、品牌/IP、合规或路线边界真正影响交付时停下来。

## 兼容性

v5.3.0 对 v5.2 handoff 文件是增量兼容。已有 `briefMode`、`visualBrief`、`guidedBrief`、`expectationFit`、`sourceConfidence`、`deliveryScorecard`、`referenceStyle` 和 `feedbackLoop` 字段仍可使用。新的 Agent 应读取并保留 `bestEffectBrief`；如果缺失，生产前先创建它。

本次 release 不上传桌面二进制安装包。公开分发继续以源码包和 Web/Agent 工作流为主，除非后续单独产出签名桌面包。

## 验证

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:market
npm run audit:brief
npm run audit:visual-intent
npm run audit:feedback-loop
python3 -m unittest tests/test_release_integrity.py
npm run audit:presets
npm run audit:quality
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
git diff --check
```
