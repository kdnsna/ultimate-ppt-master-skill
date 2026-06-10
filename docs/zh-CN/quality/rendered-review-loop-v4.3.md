# v4.3 渲染审阅闭环

v4.3 把渲染审阅从“只报告问题”推进到更易用的修订流程：先保留报告，再生成低风险修复候选和二次生成 brief。真正写入修订提示前，必须由用户确认。

## 新增文件

审阅闭环会在 review 和用户确认 apply 后写出三类文件：

- `review-findings.json`：渲染问题，并新增 `riskLevel`、`autoFixable`、`targetArtifact`、`suggestedCommand` 和 `repairCandidates`。
- `repair-plan.json`：只包含低风险修复计划、影响的 planning/brief artifact、候选数量、命令、`revision-brief.md` 路径和审批状态。
- `revision-brief.md`：只有明确执行 `--apply` 后才写出的二次修订 brief；它只总结安全规划提示，不复制或改写来源事实。

同一份摘要会合并进 `quality-report.json`，方便 Web、Bridge、Desktop Worker 和审计脚本展示一致状态。

## 安全修复边界

`scripts/apply_review_plan.py` 默认只 dry-run：

```bash
python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run
```

只有用户明确确认后才 apply：

```bash
python3 scripts/apply_review_plan.py <project_path> --safe-only --apply
```

apply 模式只允许修改 planning 和指令类文件：

- `storyboard.json`
- `project-brief.json`
- `quality-report.json`
- `codex-task.md`
- `AGENTS.md`
- `repair-plan.json`
- `revision-brief.md`

它不得改写 `source.md`、来源事实、业务结论或最终正文。允许的低风险项包括：recipe 降重建议、页面密度提示、visual prompt 补强、缺证据页的人审占位、raster 策略提示和二次修订 brief。

## 产品入口

Web Experience 的质量区新增“渲染审阅闭环”：显示问题、建议、可自动修复项和 dry-run 命令。Bridge 与 Desktop Worker 也会把 review/apply dry-run 链路写入 `qualityGate.reviewCommands`：

```bash
python3 scripts/review_rendered_deck.py <project_path>
python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run
```

## 非目标

v4.3 不把 DOM/HTML-to-PPTX 放进主线。`dom-to-pptx` 继续作为实验适配候选，后续必须通过文本可编辑、图表可编辑、渐变阴影、图片裁切和 PowerPoint 兼容性测试后再推广。
