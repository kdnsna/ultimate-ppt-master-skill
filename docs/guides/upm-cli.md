# UPM 统一 CLI 指南

> **版本：** v7.0.0-beta.1（与仓库根 `VERSION` / `pyproject.toml` 对齐）  
> **能力分层：** Preserve Edit = RC；Editable Deck = Beta（shape-editable DrawingML）；`web-deck` = Experimental SVG HTML Preview；Kimi = experimental / 非正式交付。

## 六条命令

```bash
bin/upm plan <source> [--emit bridge|deckir]  # 规范 DeckIR（CLI/Bridge/Desktop 共用）
bin/upm make <source-or-topic>                # 生成可编辑 PPTX（默认 editable-deck）
bin/upm edit <file.pptx> ["修改要求"]           # 保真局部修改；可仅用 --edits
bin/upm open <project>                        # PPTD 视觉精修（127.0.0.1 + session token）
bin/upm review <project>                      # 重新视觉/交付审计（失败非 0）
bin/upm doctor [--profile ...]                # 环境检查（只报告，不安装）
```

## `upm make`

```bash
bin/upm make 材料.pdf --title "汇报标题" --pages 10 --direction consulting-evidence --mode standard
bin/upm make "只给一个主题" --mode quick          # 草稿规划；formal 模式会挡占位交付
bin/upm make https://example.com/report --out ./decks
bin/upm make brief.md --image P02=hero.png
bin/upm make brief.md --export-backend local      # 正式路径请用 local（默认）
bin/upm make brief.md --format web-deck           # Experimental SVG HTML 预览，非杂志风 GA
```

质量模式：

| 模式 | 说明 |
|------|------|
| `quick` | 跳过视觉渲染；可草稿；visual=`not-run` 不阻断 |
| `standard` | 默认；无视觉证据 / 占位 / 无来源 → overall fail，产物进 `exports/draft/` |
| `audit` | 禁止 `--no-qa`；空白页 error；有 soffice 时做 PPTX→PDF 探针 |

流水线：

1. 输入归一化（文件/URL/主题；默认 copy 到 `sources/`）
2. DeckIR 规划（`upm.compiler.planner` deterministic-draft-planner；可用 `--deckir` 覆盖）
3. 设计方向 + page recipe → 确定性 PPTD 编译
4. 结构校验（Schema + 路径安全；失败禁止导出）
5. 视觉复检（standard/audit）：渲染 + rubric；溢出有限自动缩字 + 修复**计划**（非通用两轮执行器）
6. PPTX 导出（local 默认；kimi 仅实验且 standard/audit 硬拦截）
7. Office 渲染探针（有 LibreOffice 则 convert-to pdf；无则 `officeRender=not-run`）
8. 质量报告 `.upm/quality-report.json`；CLI 非 0 表示非正式交付（可用 `--allow-quality-fail`）

## `upm edit`

```bash
bin/upm edit deck.pptx "把第 2 页的 Q2 改成 Q3"
bin/upm edit deck.pptx --edits edits.json
bin/upm edit deck.pptx --edits edits.json --preview
```

- 只修改指定页面/对象/图表部件；`fidelity-report.json` 的 `safe` 必须为 true。
- 支持段落内跨多个 `<a:t>` run 的连续文本替换（非重叠）。
- 自然语言目前主要支持「第 N 页 + 旧文→新文」；样式/图表等请用 `--edits` JSON。
- 失败时不会留下半截 `output.pptx`。

## `upm open`

```bash
bin/upm open projects/汇报_ppt169_20260806
```

浏览器打开 `http://127.0.0.1:<port>/`：

- 打开时下发 `sessionToken`；`POST /api/save` 与 `/api/export` 必须带 token
- 保存前 PptdValidator + 原子写；非法 YAML/schema 拒绝并保留旧文件
- 仅允许工程内 `.pptd`/`.page`

## `upm review`

```bash
bin/upm review projects/汇报_ppt169_20260806 --mode audit
```

重新渲染、联系表、rubric；失败时非 0 退出（`--allow-quality-fail` 可强制 0）。

## `upm doctor`

```bash
bin/upm doctor --profile core
bin/upm doctor --profile pptx
bin/upm doctor --profile visual-review
bin/upm doctor --profile kimi   # environment-ready ≠ end-to-end PPTX 交付
```

只报告缺失项与修复命令，不自动安装。

## HTTP / 服务器

本 CLI **本身不是** HTTP 服务。服务器批处理直接调用 `bin/upm make` 即可。

若需要 Web 工作台配套的本机 HTTP 编排，见 [http-api.md](./http-api.md) 与 [agent-connect-bridge.md](./agent-connect-bridge.md)：Bridge 创建 handoff，**不**在 `POST /handoff` 内直接生成最终 PPTX。
