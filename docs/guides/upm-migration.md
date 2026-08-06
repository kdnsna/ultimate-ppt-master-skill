# v7 迁移与删除清单

## 新架构（v7）

两个内核：

- Preserve Edit Engine：`upm edit`（package-preserving OOXML，fidelity 硬门槛）
- Deck Generation Engine：`upm make`（DeckIR → PPTD → 导出 → 视觉 QA）

三条用户路径：`preserve-edit`、`editable-deck`、`web-deck`（仅在明确要求时启用）。

## 已删除/降级的路由

| 旧路由 | 处理 |
|---|---|
| `formal-editable-pptx` | 并入 `editable-deck` |
| `magazine-web-deck` | 并入 `web-deck`（显式信号才启用） |
| `guizang-web-fixed-style` | 降级为视觉 preset 名称 |
| `staged-questions` | 降级为 `upm make` 的交互状态 |
| `source-first` | 降级为输入策略（briefMode 仍可用） |
| `dual-delivery` | 降级为交付配置（UI 中保留为可选双交付） |

四端实现已同步：`scripts/best_effect_router.py`、`packages/workspace-core/src/index.ts`、`apps/bridge/server.mjs`、`apps/web/src/App.tsx`，并由 `tests/fixtures/best_effect_routing.json`（52 例）+ parity 测试锁定。

## 新项目布局

```text
deck.pptd / pages/ / media/ / sources/ / exports/ / preview/ / .upm/
```

旧项目（`svg_output/` + `storyboard.json` + `design_spec.md`）不受影响，继续由既有脚本维护；不强制迁移，不做长期双写。

## 计划删除（Phase 8 尾项）

- `docs/choosing-a-workflow.md`（已被 `docs/guides/upm-cli.md` 替代）
- 旧路由在 `SKILL.md`、`AGENTS.md`、`CLAUDE.md`、`PROMPT.md` 的文档引用（已随 v7 重写清除）
- `SKILL.md` 中旧 Mode 1/2 长流程（889 → 约 250 行）
- 旧路由名称在契约生成物中的残留（已清理）

未删除但降级为专业/诊断入口的旧脚本（`svg_to_pptx.py`、`finalize_svg.py`、`visual_review.py` 等）保留供既有项目与审计使用。

## 风险与边界

- Kimi 公共编辑器为逆向兼容协议：`upm/adapters/kimi/manifest.json` 版本化其 URL/选择器/RPC；失效时返回明确适配器错误，本地后端不受影响。
- 本地导出把图表编译为可编辑 DrawingML 形状（非原生图表对象）；需要原生图表对象时使用 Kimi 后端或在 PowerPoint 中重建。
- `test_ppt_preserve_mcp.McpStdioTransportTest` 的 stdio 测试在 Python 3.11 下存在与本次改动无关的既有缺陷（`communicate()` 在关闭 stdin 后调用），已在报告中注明。
