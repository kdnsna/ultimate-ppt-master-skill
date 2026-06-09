# v4.2 DeckIR AI 策划工作流

v4.2 在现有 v4.1 本地 handoff 和 v4.0 混合可编辑契约之上，增加 AI 策划层。目标不是让模型直接吐一个 PPTX 文件，而是让 deck 在正式生成前就能被规划、追溯、审阅和局部修订。

## 当前最佳路线

```text
源资料
  -> Markdown/资料解析
  -> DeckIR 页面地图
  -> 页面配方和参考稿风格映射
  -> 可编辑 PPTX 或 Web Deck
  -> 渲染后审阅发现
  -> 人确认后的局部修订
```

这条路线吸收了当前 AI PPT 前沿项目的共同方向：PPTAgent 的参考稿学习和编辑动作、DeepPresenter 的渲染反馈、PreGenie 的策划/审阅/再生成循环，以及类似 MarkItDown 的 Markdown-first 资料归一化。

## DeckIR 文件

Web、Bridge、Desktop Worker 现在都会围绕同一套策划包工作：

- `storyboard.json`：DeckIR v1 页面地图，包含受众、场景、页面角色、recipe id、证据引用、视觉层策略、raster 策略和可编辑性目标。
- `source-map.json`：从源资料抽取的 claim 和可追溯 evidence id。
- `planning-report.json`：planner 模式、fallback 状态、路线建议、质量门禁摘要和给 Agent 的下一步。
- `review-findings.json`：渲染审阅结果；在 PPTX/Web 预览未生成前先保持 pending。
- `repair-plan.json`：v4.3 安全修复候选和二次修订 brief 路径；在渲染审阅运行前先保持 pending。

没有 provider key 时，planner 仍会写出规则式 DeckIR。这样产品保持离线可用，也让 Agent 拿到结构化 brief，而不是空泛提示词。

## 质量门禁

正式交付前建议运行：

```bash
python3 scripts/ai_storyboard.py --source <source.md> --project <project_path> --no-llm
python3 scripts/audit_storyboard.py <project_path>
python3 scripts/review_rendered_deck.py <project_path>
python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run
python3 scripts/audit_formal_delivery.py <project_path>
python3 scripts/audit_visual_recipes.py <project_path>
```

Storyboard 审计会拦截：正式正文页允许整页 raster、页面缺少 evidence refs、缺少页面角色、缺少 recipe id、可编辑性目标过弱。渲染审阅默认只报告：拥挤、重复版式、重复 recipe、证据缺失和 raster 策略风险。自动修复只应该覆盖低风险布局或 prompt 调整，并由用户确认。

## 参考稿风格导入

`scripts/pptx_template_import.py` 现在会在生成参考 manifest 时写入 `reference-style.json`。Planner 可使用两种模式：

- `style-only`：只借鉴视觉节奏、版式家族、字体和颜色，不照搬结构。
- `follow-reference`：按参考稿的功能页顺序映射生成页面，但事实和内容仍来自用户资料。

核心规则是：学习意图和节奏，不复制参考稿私有内容。

## 产品入口

Web Experience 会把它包装成“一键最佳路线”，而不是把工程术语直接丢给用户。用户只需要提供资料和目标；系统推荐 PPTX/Web/both、preset、页数和质量门禁，并展示 AI 已规划的页面地图。

交给 Agent 时，`codex-task.md` 和 `AGENTS.md` 会要求先读 `storyboard.json` 和 `source-map.json`，再运行 storyboard 审计和渲染审阅，最后才收口正式 deck。
