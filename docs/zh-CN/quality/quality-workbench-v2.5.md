# v2.5 质量工作台

> **历史记录（v2.5，2026-05-27）。** 本文保留 v2.5 当时的产品与 Proof 合同；其中的路线、案例矩阵和发布表述不代表当前 v6 已发布或已完成验收。

v2.5 把 Ultimate PPT Master 定位成面向中文办公用户的 PPT 质量工作台，而不是黑盒云端生成器。网页负责把需求讲清楚，Bridge 负责写入本地 handoff 合同，Skill / Agent 路线负责最终生产、复查和修复。

## 稳定样例矩阵

| 预设 | 适合 | 证明输出 | 质量报告 | 不适合 |
| --- | --- | --- | --- | --- |
| 经营复盘 / 高管汇报 | 季度复盘、月报、经营动作拆解 | `examples/executive-business-review-starter/web-demo.html` | `examples/executive-business-review-starter/quality-report.json` | 纯营销路演；只能内部董事会使用的私密材料 |
| 咨询方案 | 诊断、方案比较、推荐路线和实施计划 | `examples/consulting-proposal-starter/web-demo.html` | `examples/consulting-proposal-starter/quality-report.json` | 创意 campaign；未经专业复核的法律或金融建议 |
| 产品路演 | 发布叙事、Demo Day、伙伴路演 | `examples/product-pitch-starter/web-demo.html` | `examples/product-pitch-starter/quality-report.json` | 密集 KPI 状态报告；受监管融资材料 |
| 科技趋势 Web Deck | 公开趋势文章、观点分享、可传播网页 Deck | `examples/tech-trend-web-deck-starter/web-demo.html` | `examples/tech-trend-web-deck-starter/quality-report.json` | 不能引用公开资料的机密战略；学术答辩结构 |

## Design Doctor / 视觉复查

Design Doctor 是给普通用户看的质量步骤，组合已有的可执行检查：

- `scripts/svg_quality_checker.py` 检查 SVG / PPTX 视觉资产的常见结构问题；
- `scripts/visual_review.py` 在本地预览可用时做浏览器视觉复查；
- `workflows/visual-review.md` 仍然是给 Agent 使用的详细生产流程。

默认策略是先报告和建议：输出 `quality-report.json` 和中文摘要。只有用户明确要求时，才自动修 SVG。

## Handoff 合同

每个 v2.5 handoff 都应该包含：

- `qualityProfile`：当前预设的验收标准和质量目标；
- `expectedArtifacts`：资料、预览、报告和最终交付目标；
- `reviewCommands`：交付前建议运行的本地检查命令；
- `quality-report.json`：本地项目里的待检查或已完成质量报告。

这样 Agent 收到的不是一段 prompt，而是一份可验收合同。

## 审计命令

发布前运行：

```bash
python3 scripts/audit_quality_proofs.py
```

它会检查 stable pack 元数据、证明产物、质量报告和公开 demo 的陈旧版本标记。
