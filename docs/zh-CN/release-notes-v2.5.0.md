# 发布说明 - v2.5.0

v2.5.0 把 Ultimate PPT Master 定位成面向中文办公用户的 PPT 质量工作台。项目继续保持本地优先：网页准备 brief，Bridge 写入本地 handoff 项目，Agent Skill 负责高质量生产路线。

## 变化

- Web 第一屏右侧改为当前任务预览、下一步、质量状态和交付门禁。
- 四个当前预设包升级为 `stable-pack`，新增 `userLevel`、`qualityProfile`、`proofArtifacts`、`notFor`。
- 新增 Design Doctor 视觉复查入口，组合 SVG 检查、浏览器视觉复查和 `quality-report.json`。
- Bridge handoff 合同新增 `qualityProfile`、`expectedArtifacts`、`reviewCommands`。
- 新增 `scripts/audit_quality_proofs.py` 和 `npm run audit:quality`，用于发布前检查稳定证明。

## 白话更新栏

- 用户不用先理解完整技术链路。首页会说清楚当前任务、下一步和要检查什么。
- 稳定预设必须有证明：合成资料、生成输出、截图、质量报告和适用边界。
- Agent 收到的是一份可验收合同，而不只是一段 prompt。
- Design Doctor 默认先报告问题，自动修 SVG 仍然需要用户明确要求。

## 证明矩阵

见 [v2.5 质量工作台](./quality-workbench-v2.5.md)。
