# Changelog

本项目的核心版本变化记录。历史发布详情见 `docs/release/`。

## [7.0.0] - Unreleased

### Added

- 统一 CLI：`upm make / edit / open / review / doctor`。
- PPTD v2 核心：数据模型、JSON Schema、结构化 validator、路径安全、工程 I/O。
- DeckIR → PPTD 确定性编译器（role/recipe/design tokens/evidence 映射、溢出预判）。
- 统一视觉 QA：整稿渲染、联系表、rubric、两轮修复预算、质量报告（quick/standard/audit）。
- 可替换导出后端：`local`（默认，离线）与 `kimi`（浏览器适配器，版本化 manifest、healthcheck）。
- 本地 PPTD 视觉精修：`upm open`（127.0.0.1，工程内相对路径写入白名单）。

### Changed

- 路由收敛：`preserve-edit / editable-deck / web-deck` 三条用户路径；六条旧路由降级或删除。
- `SKILL.md` 从 889 行精简至约 264 行。
- 契约版本与全仓版本标记统一为 7.0.0（候选未发布，见 PR #15）。
- 旧视觉 QA 脚本对新项目标记为 deprecated。

### Fixed

- Kimi 适配器不再自动安装全局依赖；不可用时返回明确错误且不影响本地链路。
- 本地导出的图片相对路径在 web-deck 与渲染产物中正确解析。

## [6.3.9] - 2026-08-02

正式发布（双模式 Skill / Web / Desktop）。历史说明见 `docs/release/release-notes-v6.3.9.md` 与
`docs/zh-CN/release/release-notes-v6.3.9.md`。
