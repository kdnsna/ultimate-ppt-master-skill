# 上游基准测试 - 2026 年 5 月

这次测试用于确认 Ultimate PPT Master 是否跟上它融合的两条上游路线：

- Hugo He / PPT Master：<https://github.com/hugohe3/ppt-master>
- op7418 / Guizang PPT Skill：<https://github.com/op7418/guizang-ppt-skill>

## 测试素材

统一主题：

`Local-First Agent Workflows: From Chat Prompts To Production Handoffs`

本机素材文件：

`/Users/kdnsna/Documents/kdnsna1/upstream-ppt-benchmark/materials/source.md`

## 安装基线

| 路线 | Commit | 本机安装观察 |
|---|---:|---|
| PPT Master | `668131f` | 浅克隆后工作区约 1.2GB；Python 依赖安装约 187 秒。 |
| Guizang PPT Skill | `6bfa520` | 浅克隆后工作区约 4.8MB；Swiss HTML validator 不需要重型依赖安装。 |
| Ultimate PPT Master | 本地 v2.3.0 | Bridge 使用同一份素材生成本地 handoff 项目。 |

## 生成结果

| 路线 | 输出 | 检查 |
|---|---|---|
| PPT Master | `outputs/ppt-master-local-first-agent-workflows/exports/*.pptx` | `svg_quality_checker.py` 6/6 页通过；`svg_to_pptx.py` 成功导出原生可编辑 PPTX。 |
| Guizang PPT Skill | `outputs/guizang-swiss-local-first-agent-workflows/index.html` | `validate-swiss-deck.mjs` 7 页通过。 |
| Ultimate PPT Master Bridge | `~/UltimatePPTMaster/handoffs/Local-First-Agent-Workflows-Benchmark-*` | 生成 `source.md`、`extracted-source.md`、`attachments/`、`manifest.json`、`agent-prompt.md`、`engine-plan.md`、`quality-checklist.md` 和 `preview-web-deck.html`。 |

## 测试结论

1. **直接安装 Skill 对专家用户已经很强。** 歸藏 Skill 非常轻；PPT Master 很重但能力完整。
2. **融合产品不应该比谁命令更短。** 会用 Skill 的用户，一句 `npx skills add ...` 或让 Codex 直接安装永远更快。
3. **Ultimate PPT Master 的优势在第一公里。** 它帮助用户选择路线、整理文件、检测本地配置，并用 manifest/checklist 把任务交给 Agent。
4. **质量上限取决于是否保留上游规则。** 如果削弱 PPT Master 的 SVG/PPTX 严格流程，或削弱歸藏 Swiss 锁定版式，效果会变差。

## 基于测试已完成的改动

- 同步 PPT Master 最新生产资产，包括品牌预设、visual review 工作流、更新后的 SVG/PPTX 脚本和参考文档。
- 同步歸藏 Swiss 最新资产、validator 规则和截图背景资产。
- 新增产品定位文档，解释为什么这个 Hub 不是“多装一个 Skill”。
- Web Experience 新增价值说明区，直接回答“为什么不直接装 Skill”。
- 更新 `SKILL.md` 和 `AGENTS.md`，明确 Web / Bridge 是第一公里交接，Skill 是生产路线。

## 产品结论

Ultimate PPT Master 应该这样表达：

> 直接安装 Skill 是专家最快路径。Ultimate PPT Master 是一个 guided handoff hub，让这条专家路径对更多用户变得清楚、本地、安全、可重复。

这是更长期的优势。
