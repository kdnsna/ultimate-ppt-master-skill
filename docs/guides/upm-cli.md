# UPM 统一 CLI 指南

## 五条命令

```bash
bin/upm make <source-or-topic>        # 生成可编辑 PPTX（默认 editable-deck）
bin/upm edit <file.pptx> "<修改要求>"  # 保真局部修改（Preserve Edit Engine）
bin/upm open <project>                # PPTD 视觉精修（127.0.0.1 本地服务）
bin/upm review <project>              # 重新视觉/交付审计
bin/upm doctor [--profile ...]        # 环境检查（只报告，不安装）
```

## `upm make`

```bash
bin/upm make 材料.pdf --title "汇报标题" --pages 10 --direction consulting-evidence --mode standard
bin/upm make "只给一个主题"                        # 自动扩写 + 6 页可编辑 PPTX
bin/upm make https://example.com/report --out ./decks
bin/upm make brief.md --image P02=hero.png         # 指定 slideId 的图片
bin/upm make brief.md --export-backend kimi        # 可选浏览器导出后端
bin/upm make brief.md --format web-deck            # 明确要求网页时
```

流水线：

1. 输入归一化（文件/URL/主题；默认 copy 到 `sources/`）
2. DeckIR 规划（claims、roles、recipes、evidence refs；可用 `--deckir` 覆盖）
3. 设计方向 + page recipe → 确定性 PPTD 编译
4. 结构校验（Schema + 路径安全；失败禁止导出）
5. 整稿渲染 + 联系表
6. 视觉复检 + 失败页修复（≤2 轮）
7. PPTX 导出（local 默认 / kimi 可选）并记录后端
8. 质量报告 `.upm/quality-report.json`

## `upm edit`

```bash
bin/upm edit deck.pptx "把第 2 页的 Q2 改成 Q3"
bin/upm edit deck.pptx "把第 1 页标题加粗并放大到 28pt" --preview
bin/upm edit deck.pptx --edits edits.json
```

- 只修改指定页面/对象/图表部件；`fidelity-report.json` 的 `safe` 必须为 true。
- `--preview` 会用 LibreOffice/浏览器生成修改前后对比图。
- 自然语言无法解析时改用 `--edits` JSON。

## `upm open`

```bash
bin/upm open projects/汇报_ppt169_20260806
```

浏览器打开 `http://127.0.0.1:<port>/`：

- 左侧页面列表（含 `deck.pptd`）
- 中间实时 SVG 预览
- 右侧 YAML 编辑器（只允许工程内 `.pptd`/`.page`，拒绝绝对路径与 `..`）
- 保存前重新校验 YAML；可重新导出 PPTX；可查看质检结果

## `upm review`

```bash
bin/upm review projects/汇报_ppt169_20260806 --mode audit
```

重新渲染全部页面、生成联系表、运行 rubric（空白页/溢出/对比度/重复布局/缺失证据），更新 `.upm/quality-report.json` 与 `.upm/repair-plan.json`。

## `upm doctor`

```bash
bin/upm doctor --profile core          # PPTD 核心
bin/upm doctor --profile pptx          # + 本地导出
bin/upm doctor --profile visual-review # + 渲染
bin/upm doctor --profile kimi          # Kimi 适配器（可选）
```

只报告缺失项与修复命令（`bash scripts/bootstrap.sh --profile <profile>`），不自动安装。
