# 发布说明 - v2.4.0

v2.4.0 是一次可复用性和发布门禁升级，继续守住真实能力边界：

> Web Experience 负责整理项目，Bridge 负责写入本机，Agent Skill 仍然负责高质量生产。

## 最大提升

可复用预设 starter pack 变成正式发布面。项目不再只是把场景方向露出在网页里，而是提供带机器可读契约、source 骨架和质量检查清单的 pack 文件夹。

## 白话更新栏

- 以后不用从空白 prompt 开始。选一个 starter pack，它会给 Agent 一个故事起点、资料清单、模板方向和 QA 清单。
- GitHub 技术扫描解释这次更新为什么这样做：Markdown 交接、本地 Agent 工具、可编辑 PPTX、Web Deck 都是当前生态里的真实方向。
- 每个 starter pack 现在都有可见 proof：source 骨架、网页预览、封面图和检查清单。
- `npm run audit:presets` 是维护者的安全检查。pack 少文件、少字段，或者 proof 还写着 `pending`，发布就应该失败。

## 主要变化

- 新增 [GitHub 技术扫描 - 2026 年 5 月](../quality/github-tech-scan-2026-05.md)，把当前开源信号映射到产品判断。
- `consulting_proposal` 和 `tech_trend_web_deck` 升级为 `templates/presets/` 下的 starter pack。
- 保留 `executive_business_review` 和 `product_pitch` starter pack，第一批可复用 handoff starter 扩展到四个。
- 为四个 v2.4 pack 在 `examples/*-starter/` 下补充可见 starter proof。
- 新增 `scripts/audit_preset_packs.py` 和 `npm run audit:presets`，用于发布前验证 pack 契约。
- 预设包审计已接入 CI，防止可复用 pack 静默丢字段或丢文件。
- CI、Pages 和桌面发布 workflow 已升级到兼容 Node 24 的新版 GitHub Actions。
- Web Experience 的 preset catalog 已加入 pack path 和更具体的质量检查。
- README、文档和版本标记更新到 v2.4.0。

## 质量标准

v2.4.0 要求 starter pack 至少具备：

- `preset.json`，包含场景、受众、资料要求、叙事骨架、页面结构、模板候选、质量检查和 sample proof metadata；
- `source.md`，作为脱敏起点；
- `quality-checklist.md`，作为 Agent 交付检查契约；
- 可见的 `generatedOutput` 和 `screenshot` proof 路径；
- `preset-directions.json` 中对应 `status: "pack"` 和 `packPath`；
- CI 中通过 preset-pack audit。

## 仍不宣称

这些 pack 仍是 `draft-pack`，不是 `stable-pack`。Stable pack 仍需要完整生产级成品、截图集、benchmark 或 QA 记录后再公开推广。

## 升级

```bash
cd ultimate-ppt-master-skill
npm run update
npm run audit:presets
```
