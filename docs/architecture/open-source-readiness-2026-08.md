# UPM 开源就绪度审计与解决计划（2026-08）

> 目标：以“一个全新的、完美的开源项目”为验收标准，对仓库做全面宏观审视，列出问题并按优先级解决。本文件是审计结论 + 执行计划；每项完成后在状态列打勾。

## 1. 审计方法

对以下维度逐一取证（当前分支 `feat/upm-v7-unification`，基于 v7 重构后的状态）：

- 版本与发布一致性
- 文档与实际代码的一致性
- 打包与安装入口
- CI 覆盖与工程质量门槛
- 测试健康度
- 开源治理（LICENSE / 贡献指南 / 安全策略 / 问题与 PR 模板 / 第三方声明）
- 证据真实性（发布证明、示例质量报告、benchmark 页面）
- 代码卫生（旧路由残留、废弃标记、命名）

## 2. 审计结论（按严重度排序）

### A. 版本与发布一致性（高）

产品已是 v7 架构，但全仓版本标记仍为 6.3.9：

| 文件 | 现状 |
|---|---|
| `package.json` / `apps/web/package.json` / `apps/desktop/package.json` + lockfiles | 6.3.9 |
| `apps/desktop/src-tauri/tauri.conf.json`、`Cargo.toml`、`Cargo.lock` | 6.3.9 |
| `agents/marketplace-listing.json`、`Casks/ultimate-ppt-master.rb` | 6.3.9 |
| `contracts/*.yaml` + 生成物（policy.py/ts/json/fragments） | 6.3.9 |
| README / README.en / README.zh-CN 徽章与发布链接 | v6.3.9 |
| `docs/README.md` | “Ultimate PPT Master v6” 且缺少 upm 文档入口 |
| 审计脚本常量（`audit_docs_links.py`、`audit_skill_market.py`、`audit_web_console.py`、`validate-featured-decks.mjs`） | 6.3.9 |
| `tests/test_release_integrity.py` VERSION / RELEASE_EVIDENCE 及文件名校验 | 6.3.9 |

缺失：无 `CHANGELOG.md`；无 v7.0.0 发布说明。

**决策**：源版本升到 7.0.0；因 v7.0.0 尚未打 tag 发布，所有“发布证据”类标记统一改为 `unreleased`（`releaseStatus: unreleased`，`releaseEvidence` 指向 PR/CI），保持项目“诚实证据”原则，不伪造已发布。

### B. 文档一致性（高）

- `AGENTS.md` 静态尾部仍写 “v6 task-first workspace / v5.4.1 console” 与 “extreme-thin … use the light Style A editorial fallback”，与 v7 生成契约（editable-deck 兜底）矛盾。
- `README.zh-CN.md` 仍是 v6.3.9 兼容 stub。
- `docs/README.md` 标题与指南表未覆盖 `upm` CLI / v7 架构；`docs/guides/choosing-a-workflow.md` 仍描述“final decks still come from the Skill route in MVP”与 dual delivery 路线语言。
- `README.en.md` 缺 v7 小节与 CLI 入口。
- `docs/guides/agent-setup.md`、`web-experience.md`、`docs/zh-CN/guides/*` 的“当前版本”陈述为 6.3.9。

### C. 打包与安装（中）

- `upm/` 是纯 Python 包但没有 `pyproject.toml`，无法 `pip install .` 暴露 `upm` 命令。
- `INSTALL.md` 未覆盖 `bin/upm` 与 `pip install .` 两种新入口。

### D. CI 与工程门槛（中）

- CI 没有 `upm doctor` 环境检查，也没有新管线的端到端生成冒烟（只有单元测试间接覆盖）。
- 无 Python lint/format 门槛（ruff）、无 `.editorconfig`、无 coverage 配置。

### E. 测试健康度（中）

- `tests/test_ppt_preserve_mcp.py::McpStdioTransportTest` 存在真实缺陷：`stdin.close()` 后调用 `communicate()`，在 Python 3.11 下必然抛 `ValueError`（与 v7 无关但“完美项目”必须修）。

### F. 开源治理（低-中）

- LICENSE / CODE_OF_CONDUCT / SECURITY / SUPPORT / 问题与 PR 模板齐全 ✓。
- `CONTRIBUTING.md` 未包含新测试命令（`bin/upm doctor`、`python -m unittest tests.test_upm_cli`）。
- `THIRD_PARTY_NOTICES.md` 已含 open-kimi 声明 ✓。

### G. 代码卫生（低）

- 旧命名残留：`audit:v6-workspace`、`browser-v6-regression.mjs`、`V6Workspace.tsx` 等（历史命名，保留但记录）。
- 旧视觉 QA 已标记 deprecated，仅服务存量项目 ✓。

## 3. 解决计划

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 | v7.0.0 全仓版本同步（源码元数据/契约/文档/审计脚本），证据统一 `unreleased`；新增 CHANGELOG 与 v7.0.0 发布说明 | ✅ 完成 |
| P1 | AGENTS / README.zh-CN / docs README / choosing-a-workflow / README.en v7 化 | ✅ 完成 |
| P2 | pyproject.toml（`upm` console script）、.editorconfig、CI 增加 doctor + 生成冒烟、修复 MCP stdio 测试 | ✅ 完成 |
| P3 | CONTRIBUTING / INSTALL 更新；README 徽章与示例证据同步 | ✅ 完成 |
| P4 | 全量验证（Python/Node/契约/TS/doctor/真实生成）+ 提交 + PR | ✅ 完成（PR #16） |

## 5. 执行结果（验证证据）

- 版本一致性：42 个文件同步到 7.0.0；契约重新生成且 `--check` 通过；`upm/__init__.py` 为 7.0.0。
- 证据真实性：`marketplace-listing.json`、8 个示例 quality-report、benchmark 页面、发布说明全部标记 `unreleased`，证据指向 PR #15（评审通过前不冒充已发布）。
- 打包：`pip install .` 在全新 venv 中安装成功，`upm` console script 可用（`upm --help` 输出五条子命令）。
- 工程门槛：`ruff check` 通过（E4/E7/E9/F/I/UP，0 错误）；CI 新增 `upm doctor` 与生成冒烟步骤；`.editorconfig` 与 CHANGELOG 已添加。
- 测试：Python 224 项全绿（含修复后的 MCP stdio 测试与 CLI 端到端测试）；Node 73 项全绿；Web `tsc --noEmit` 通过；`audit:docs`、`audit:market`、`audit:web-console`、`audit:featured-decks`、`audit:repo-hygiene`、`audit:quality` 全部通过；`bin/upm doctor --profile core` 零缺失；真实 `upm make --mode quick` 生成 4 页 PPTX 并导出。

## 4. 验收标准（本目标）

- 全仓无“当前版本 = 6.3.9”的表述（历史发布说明除外）。
- `pip install .` 能安装并暴露 `upm`；`bin/upm doctor` 零错误。
- `AGENTS.md`/README 族/文档族与 v7 契约一致，无矛盾语句。
- CI 执行 `upm doctor` 与一次真实生成冒烟。
- 224+ Python、73 Node 全绿（含修复后的 MCP 测试）。
- 所有“发布证据”表述真实（unreleased 或已发布，不冒充）。
- CHANGELOG、v7.0.0 发布说明、贡献指南更新齐全。
