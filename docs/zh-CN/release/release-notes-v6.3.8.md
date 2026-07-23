# Ultimate PPT Master v6.3.8 发布说明

> **GitHub 发布合同。** 本版本的机器状态为 `releaseStatus: github-released`。源码文件本身不能证明已经发布；权威证据是不变的 [`v6.3.8` tag 与 GitHub Release 页面](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.8)。GitHub Release 不会自动上架 marketplace，市场状态继续保持 `marketplaceStatus: independent-not-attested`。

[English release notes](../../release/release-notes-v6.3.8.md)

上一正式版本：[v6.3.7](./release-notes-v6.3.7.md)

## 白话更新栏

- 把多入口自然语言规则收敛成 `contracts/` 机器可读合同，并自动生成 `AGENTS.md`、`CLAUDE.md`、`PROMPT.md` 与 `SKILL.md` 中的共享策略区。
- 修正旧的深色封面默认节奏，以及“有时先问、有时直接做”的入口漂移：可分类请求自动路由，默认浅色/暖纸封面，正式信号走可编辑 PPTX。
- 资料导入默认改为 `--copy`，避免桌面、下载目录和共享盘原文件被误移动。
- 草稿证据状态更诚实：有资料只进入 `unmapped`，不再直接标成 `grounded`；claim 绑定后才可 grounded。
- 增加 `quick` / `standard` / `audit` 三档质量合同；`audit` 模式下缺少 preview PNG 或设计复核报告会直接 fail。
- 安装与诊断支持 `core`、`pptx`、`web`、`visual-review`、`desktop`、`all` 分档，并把 Node 版本提示对齐到 `^20.19.0 || >=22.12.0`。
- `visual_review.py` 可自动启动临时预览服务并在结束后关闭，同时去掉旧的 `skills/ppt-master/...` 路径。
- 增加 `scripts/sync_desktop_worker.py`，保证桌面 Worker 源码与 Tauri 资源副本同步。
- 本次是收敛与可靠性发布，不新增云端、账号、数据库、模型 Provider 或大型编辑器能力。

## 发布合同

| 字段 | 合同 |
|---|---|
| 版本 | `6.3.8` |
| Git tag | `v6.3.8` |
| GitHub 发布机器状态 | `github-released` |
| 权威证据 | [`releases/tag/v6.3.8`](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.8) |
| Marketplace 状态 | `independent-not-attested`；任何市场记录都需另行核验 |

## 验证合同

`v6.3.8` 指向的精确提交必须通过：

```bash
npm run check:contracts
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:web-bundle
npm run audit:featured-decks
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run test:web-browser
npm run build:web
npm run build:desktop
```

收敛专项检查：

```bash
python3 -m unittest tests.test_contracts_generation tests.test_source_import_default tests.test_evidence_draft_states tests.test_design_completion_audit tests.test_visual_review_contract
node --test tests/best-effect-routing-parity.test.mjs
bash scripts/doctor.sh --profile core
python3 scripts/sync_desktop_worker.py --check
```

浏览器回归继续覆盖 1440×900 与 390×844 工作台、案例库、键盘/焦点、会话恢复、本地 Agent 状态以及真实产物下载合同。

## 独立回滚边界

回退 v6.3.8 提交即可撤销本轮合同统一、安装/导入安全、证据状态与视觉复核可靠性改动，不需要移动或改写已经发布的 `v6.3.7` tag。若 v6.3.8 发布后需要修正，应发布新的补丁版本，不得重写 tag。

## 已知限制

- Web 主包仍接近 80KB gzip 预算上限，后续新增代码必须继续审计；
- 正式办公 PPTX 的 PowerPoint、LibreOffice 和字体可移植性限制延续 v6.3 既有公开说明；
- 原生 PowerPoint Recipe Composer、`deck-ir-v1` 与 `upm make` 单命令流水线仍是后续版本工作；
- GitHub 仓库社交预览图上传仍属于仓库外部设置；
- Pages 是否已经部署必须以 Actions 记录和线上 SHA 为准；
- GitHub Release 不会自动发布或更新 marketplace 列表。
