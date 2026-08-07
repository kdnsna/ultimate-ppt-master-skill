---
name: ultimate-ppt-master
description: >
  保真改 PPT / Ultimate PPT Master: two engines, three user paths. (1) Preserve
  Edit Engine edits only the slides/objects you name on an existing branded
  PowerPoint, keeps every other package part byte-for-byte, and writes back a
  .pptx that opens in WPS / PowerPoint. (2) Deck Generation Engine builds a new
  editable PPTX from topic/document/URL/table via DeckIR → PPTD → export →
  visual QA. A web deck is generated only when explicitly requested. Use for
  "改PPT", "修改这份PPT", "保真修改", "别动其他页", "edit this pptx", "revise
  this deck", "生成PPT", "做PPT", "make a deck", "把这个做成PPT", "杂志风PPT",
  "网页PPT", "ultimate-ppt-master", "deckweaver", or "ppt-master".
---

# Ultimate PPT Master（presentation 生成与修改）

> 两个内核、三条用户路径：已有 PPTX 的保真修改、从零生成的可编辑 PPTX、仅在明确要求时启用的 Web Deck。

## 0. 环境检查（每次运行前快速验证一次）

```bash
bin/upm doctor --profile core
```

- 需要 Python 3.10+；存在 `${SKILL_DIR}/.venv` 时优先使用 `.venv/bin/python`。
- 依赖只通过显式 bootstrap 安装，任务执行期间禁止自动改全局环境：

```bash
bash scripts/bootstrap.sh --profile core       # 保真编辑 + PPTD 核心
bash scripts/bootstrap.sh --profile pptx      # 本地 PPTX 导出
bash scripts/bootstrap.sh --profile visual-review  # 高质量本地渲染（Playwright）
bash scripts/bootstrap.sh --profile kimi      # Kimi 浏览器导出适配器（可选）
```

## 1. 架构总览

```text
内核 A：Preserve Edit Engine     已有 PPTX 局部保真修改（package-preserving OOXML）
内核 B：Deck Generation Engine   DeckIR → PPTD → 导出 → 视觉 QA 闭环
```

三条用户路径：

| 路径 | 命令 | 链路 |
|---|---|---|
| `preserve-edit` | `upm edit file.pptx "..."` | 检查 → 原生局部编辑 → fidelity report 硬门槛 → 渲染前后对比 |
| `editable-deck` | `upm make <source-or-topic>` | 输入归一化 → DeckIR → 设计 tokens/recipe → PPTD 编译 → 结构门 → 整稿渲染 → 联系表复检 → 失败页修复（≤2 轮）→ PPTX 导出 → 质量报告 |
| `web-deck` | `upm make ... --format web-deck` | 同一 DeckIR/PPTD 基础，按明确要求输出浏览器 Deck |

旧概念降级：`source-first` = 输入策略；`staged-questions` = 交互状态；`guizang-web-fixed-style` = 视觉 preset；`dual-delivery` = 交付配置。它们不再是独立产品路由。

路由决策：`explicit-edit-signal` → `preserve-edit`；`explicit-formal-signal` → `editable-deck`；`explicit-web-signal` → `web-deck`。

## 2. 统一 CLI

普通用户只需记住五条命令：

```bash
bin/upm make <source-or-topic>                 # 生成可编辑 PPTX（默认）
bin/upm edit <file.pptx> "<修改要求>"           # 保真局部修改
bin/upm open <project>                          # 打开 PPTD 视觉精修界面（127.0.0.1）
bin/upm review <project>                        # 重新执行视觉与交付审计
bin/upm doctor [--profile core|pptx|visual-review|kimi|all]   # 只报告，不安装
```

常用选项：

```bash
bin/upm make 材料.pdf --title "汇报标题" --pages 10 --direction consulting-evidence --mode standard
bin/upm make "一个主题" --export-backend kimi     # 可选浏览器导出后端
bin/upm edit deck.pptx --edits edits.json         # 显式 edits JSON
```

`upm make` 自动完成：资料导入（默认 copy）→ DeckIR 规划（claims/roles/recipes/evidence）→ 设计方向与 page recipe → 确定性 PPTD 编译 → 结构校验（失败禁止导出）→ 页面渲染 + 联系表 → 视觉复检与失败页修复（最多两轮）→ PPTX 导出 → 质量报告。

资料导入 Default to `--copy`（`import-sources <project_path> <source_files...> --copy`），保留原文件；`--move`/归档删除原文件是显式高级选项。

## 3. Preserve Edit Engine（`upm edit`）

当用户要求修改已有 PPTX 时，只走这条路径，禁止先转 PPTD 再整体重导出（never import and re-export the whole source deck）：

- 使用 package-preserving 原生 OOXML 编辑（`scripts/preserve_edit_pptx.py`）：只修改用户指名的页面/对象/图表部件，其余包部件逐字节不变。
- `fidelity report` 是硬门槛：`safe` 必须为 `true`；任何非预期 changed/added/removed 部件都是硬失败，停止并报告。
- 支持原生操作：`replace_text`、`style_text`、`replace_table_cell`、`set_shape_geometry`、`replace_chart_text`、`set_chart_value`。
- 无匹配时输出与源文件字节一致（NOOP），不得假装完成。
- 实际修改后必须用 PowerPoint/WPS/LibreOffice 渲染前后对比，肉眼检查缺失对象、背景变化、Logo/链接/布局意外变化。
- 引擎不可用时不生成修复 PPTX（do not generate a repaired PPTX），直接给出 PowerPoint/WPS 操作步骤。
- 引擎不支持的操作（增删页、插入新图、重建表格结构、自由重设计）不整稿回退，直接给出对应的 PowerPoint/WPS 操作步骤。

## 4. Deck Generation Engine（`upm make`，默认 `editable-deck`）

生产链路：

```text
用户输入 → 输入归一化 → DeckIR → 设计方向与页面 recipe → PPTD 视觉编译
→ 结构校验 → 整稿渲染 + 联系表 → 视觉复检 → 仅修复失败页 → PPTX 导出 → 质量报告
```

职责边界：

- DeckIR 负责“讲什么、为什么讲、证据来自哪里”（claims、roles、recipes、evidence states）。
- PPTD 负责“页面怎么画”（坐标、安全边距、字号、图层、图片 cover/contain、页码/来源区、主题 token）。
- 模型只做内容理解、叙事结构、页面意图、视觉方向与素材建议；不要手写全部坐标。
- 证据状态只允许 `unmapped / candidate / grounded / conflicted / missing`；有来源但未绑定 claim 的草稿页必须从 `unmapped` 开始，不得直接 `grounded`。

质量门（`quick / standard（默认）/ audit`）：

- `structure`：PPTD Schema + 路径安全校验，失败禁止导出。
- `overflow`：确定性文本溢出预判，编译器自动收缩字号至安全下限。
- `visual`：整稿渲染 + 联系表 + 空白页/对比度/重复布局/缺失证据检查；`standard` 默认整稿复检，`audit` 强制最终 PPTX 代表页渲染与完整报告。
- 自动修复最多两轮；超限后停止循环并把未解决问题写入质量报告，绝不把 placeholder 当正式成品交付。

### Formal Business Delivery Gate

正式汇报/咨询/培训/政府金融材料在交付前锁定：

- Theme art direction：先命名一个贴合主题的艺术概念，再生成封面/章节/视觉母题。
- 可编辑承诺：正文、数字、图表、备注与来源脚注必须是可编辑对象；Logo 与品牌标记用真实素材，不得退化成 `b`/`c` 这类文本碎片（logo must not degrade into text fragments）。
- 视觉资产：可用时以 Codex native GPT image generation（`image2`）为主要视觉引擎；复用 `scripts/generate_visual_element_kit.py` 生成小型元素包；每张生成图都要有场景/叙事角色并记录 prompt 与来源。
- 证据纪律：事实、结论、来源与统计口径分开标注；缺失来源时标注待补充，不虚构。
- 交付前审计：结构门 + 整稿渲染联系表 + 质量报告；audit 模式强制最终 PPTX 代表页渲染。

导出后端（可替换）：

- `local`（默认）：PPTD → 确定性 SVG → 现有 SVG→DrawingML 原生可编辑对象引擎，离线可用。
- `kimi`（实验性外部兼容能力，仅显式 opt-in）：PPTD → Kimi 公共编辑器浏览器导出，封装在 `upm/adapters/kimi/`（版本化选择器、healthcheck、错误边界）；当前上游环境存在导出交付失效（compatibility risk），不作为正式交付保证；不可用时返回明确适配器错误，不影响主项目。
- 每次导出记录实际后端到 `.upm/export-record.json`；禁止把“浏览器成功下载”表述为 PowerPoint/WPS 完全兼容。
- 表格/图表边界：local 后端产出可编辑 DrawingML 形状（非原生 a:tbl/chart 数据对象）；需要原生表格/图表对象时请在 PowerPoint/WPS 中重建。

## 5. Web Deck（仅在明确要求时启用）

用户明确要求 HTML / 网页 PPT / 杂志风 / Swiss / 横滑 / 浏览器演示时：

```bash
bin/upm make <source-or-topic> --format web-deck
```

同一 DeckIR 与设计 token 体系驱动；风格 preset（电子杂志 × 电子墨水 / Swiss）与校验脚本沿用：

```bash
node "${SKILL_DIR}/scripts/validate-magazine-deck.mjs" <deck>/web/index.html
node "${SKILL_DIR}/scripts/validate-swiss-deck.mjs" <deck>/web/index.html
```

## 6. 视觉精修与审计（`upm open` / `upm review`）

`upm open <project>` 启动本地 `127.0.0.1` 编辑器：

- 浏览全部 `.page` 与 `deck.pptd`，实时 SVG 预览；
- 只允许写工程目录内相对路径的 `.pptd`/`.page`（拒绝绝对路径与 `..`）；
- 保存前重新校验 YAML；可重新导出 PPTX；可查看 `.upm/quality-report.json` 质检结果并跳转失败页。

`upm review <project>` 重新执行渲染、联系表、rubric 与质量报告，不修改源事实。

## 7. 项目布局与中间产物

```text
<project>/
  deck.pptd                  # PPTD 清单（version: v2 + upm 元数据）
  pages/*.page               # 每页独立文件
  media/                     # 本地图片资源（相对路径，禁止越界）
  sources/                   # 导入资料（默认 copy）
  exports/<name>.pptx        # 最终交付物
  preview/overview.jpg       # 联系表
  .upm/                      # 内部中间产物（cache/renders/qa/intermediate）
```

内部脚本与中间目录不向普通用户暴露；直接调用旧脚本（`svg_to_pptx.py` 等）视为专业/诊断模式。

## 8. 参考资源

| 资源 | 路径 |
|---|---|
| 统一架构说明 | `docs/architecture/upm-v7-unification.md` |
| CLI 指南 | `docs/guides/upm-cli.md` |
| 设计系统 | `DESIGN.md` |
| 路由/质量契约 | `contracts/*` |
| Page recipes | `templates/page-recipes/index.json` |
| 视觉方向包 | `templates/visual-directions/v6-direction-manifest.json` |
| PPTD Schema | `contracts/schemas/pptd.schema.json` |
| Swiss 布局注册表 | `references/magazine-web/swiss-layout-registry.json` |

### 上游能力映射（沿用并适配）

- 资料转换：`source_to_md/excel_to_md.py` 等脚本处理 XLSX/PDF/DOCX/URL → Markdown。
- Web Deck 模板：`assets/magazine-web/template-swiss.html` 与 `validate-swiss-deck.mjs`。
- 可选中产物：`scripts/notes_to_audio.py`（旁白）与 `workflows/live-preview.md`（浏览器实时预览/批注）。

## 9. 本地运行时规则

- 将 `SKILL_DIR` 解析为本仓库目录；优先 `${SKILL_DIR}/.venv/bin/python`。
- 生成任务完成后交付：最终 PPTX、预览、可继续编辑的工程、质量报告；用户可从 `upm open <project>` 继续视觉精修。
- 私有资料、内部截图、客户数据与 API keys 只留在本地，除非用户明确批准上传。
- 远程资源说明：`kimi` 后端会访问 `www.kimi.com` 与 `statics.moonshot.cn`；本地后端离线运行。不读取/注入用户的 Kimi 登录令牌。

<!-- BEGIN GENERATED:workflow-policy -->
## Generated Workflow Policy

This section is generated from `contracts/`. Do not hand-edit; run `python3 scripts/generate_contracts.py`.

### Source of truth

- Primary workflow: `SKILL.md`
- Design contract: `DESIGN.md`
- Machine policy: `contracts/workflow-policy.yaml`, `contracts/route-policy.yaml`, `contracts/visual-defaults.yaml`, `contracts/quality-modes/`

### Best-Effect Brief Enhancer

Before choosing a route or generating files, rewrite the user's short instruction into `bestEffectBrief`. Record prompt quality, auto-expanded audience/scenario/message/page-count/style/source/asset assumptions, recommended route, and which decisions came from the user vs the Agent.

### Routing

- Auto-route by policy. Do **not** force the user to choose PPTX vs Web before generation when the request is classifiable.
- Ask at most 3 focused questions, and only when facts, sources, brand/IP, compliance, or route choice would materially change the deliverable.
- Editing an existing PPTX (`改PPT` / `保真修改` / `edit this pptx`) → `preserve-edit` (Preserve Edit Engine).
- Formal / editable / government / finance / training / report / `.pptx` signals → `editable-deck` with quality mode `standard`.
- HTML / web PPT / magazine / editorial / e-ink / Swiss / horizontal swipe / keynote / showcase / demo-day / browser-first signals → `web-deck` (enabled only on explicit request).
- Extreme-thin topic-only prompts without formal/web signals use the **editable-deck fallback** → `Editable Deck`, style `正式商务 PPTX / 微软雅黑 / 可编辑正文`, 6 pages, cover surface `light-or-warm-paper`.

### Extreme Thin Prompt Fallback page rhythm

  1. light or warm-paper cover with one strong title, minimal subtitle, and one soft-edged visual/evidence panel
  2. context page for problem, trend, or setting
  3. evidence / data page with source-bound claims
  4. comparison or process page
  5. risk or action page
  6. light closing page with takeaway and next step

### Visual defaults

- Default cover surface: `light-or-warm-paper` (light / warm paper / near-white).
- Dark covers are allowed only for: user-request, brand-system, explicit-art-direction, image-led-launch.
- Do not use a full-page black cover unless the user, brand, or explicit art direction requires it.
- Ink is primarily a text color, not the default full-page background.

### Source import

- Default import mode: `copy` (`--copy`).
- `--move` / archive-and-remove-original is an explicit advanced option, not the default.
- Repo-internal generated research artifacts may still move to avoid accidental commits.

### Evidence states

Allowed values: unmapped, candidate, grounded, conflicted, missing.
Draft slides created only because sources exist must start as `unmapped`, never `grounded`.
`grounded` requires claim-level source binding.

### Quality modes

Default mode: `standard`.
Available modes: quick, standard, audit.

| Mode | Use | Key gates |
|---|---|---|
| quick | draft, internal discussion, content validation | structure/file validity fail; visual evidence warning |
| standard | most formal reports, default production path | formal delivery fail; visual evidence recommended |
| audit | board materials, government, finance compliance, external release | missing preview PNG / design report / blank-page risk fail |

Semantic assertions:
- defaultCoverSurface=light
- extremeThinAutoRoutes=True
- extremeThinDefaultFormat=editable-deck
- formalSignalDefaultFormat=editable-pptx
- mustAskBeforeGenerate=False
<!-- END GENERATED:workflow-policy -->
