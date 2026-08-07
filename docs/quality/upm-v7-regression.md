# UPM v7 真实回归测试报告

> 日期：2026-08-06；执行环境：macOS（Python 3.11.15 于仓库 `.venv`，Node 26，agent-browser 0.26.0，LibreOffice 用于保真修改渲染）。所有样本均在真实命令行端到端运行，不是模拟或单元测试。

## 1. 样本总表

| # | 样本 | 命令要点 | 结果 | 交付物 |
|---|---|---|---|---|
| 1 | 金融经营分析汇报 | `upm make … --pages 7 --direction formal-finance` | 7 页，gates 全 pass，0 未解决 | PPTX 49,780 B（examples/upm-v7-finance-demo） |
| 2 | 培训课件（含表格） | `upm make training-source.md --pages 8 --direction training-narrative` | 8 页，Markdown 表格绑定证据页 | PPTX 55,503 B |
| 3 | 渠道分析（表格+图表） | `upm make channel-analysis.md --pages 6 --direction consulting-evidence` | 6 页，数值表格绑定 benefit 页并生成 bar chart | PPTX 47,509 B，slide5 含 36 个可编辑对象 |
| 4 | 产品发布（图片 + web-deck） | `upm make … --format web-deck --image P01=hero.png --direction brand-launch` | 7 页，图片正确引用 | web/index.html（12,004 B） |
| 5 | 产品发布（图片 + editable-deck） | `upm make … --image P01=hero.png --direction brand-launch` | 6 页，封面含真实 picture 对象 | PPTX 49,137 B |
| 6 | 现有 PPTX 保真修改 | `upm edit deck.pptx "把第 1 页标题…改成…" --preview` | fidelity `safe: true`，仅 slide1 变化，66/67 部件不变，LibreOffice+pdftoppm 前后对比 PNG | `*_edited.pptx` |
| 7 | `upm review` | `upm review <finance project> --mode standard` | 7/7 渲染，gates 全 pass | 更新后的 `.upm/quality-report.json` |
| 8 | `upm open` 编辑器 | 本地服务 API 实测 | 页面列表/YAML 读取/SVG 预览/保存回读正常；`../evil.page` 写入被拒绝 | 127.0.0.1 服务 |
| 9 | Kimi 后端不可用 | `upm make … --export-backend kimi --mode quick` | 退出码 1，明确 `[adapter-unavailable] agent-browser 0.26.0 < 0.33.2` 及修复命令；工程保留，本地链路不受影响 | 适配器错误 + 工程 |
| 10 | 参考模板/风格迁移（DeckIR 覆盖） | 生成 deckir.json 后改写角色（hero/section/source_colophon）与方向（swiss-information），`upm make --deckir …` | 8 页，覆盖生效，gates 全 pass | PPTX（local） |
| 11 | 长文档/PDF 转正式 PPT | `upm make tech-architecture.pdf --pages 6 --direction consulting-evidence` | PDF→Markdown 转换成功，12 条 claims 绑定页面，6 页 gates 全 pass | PPTX（local） |

## 2. 每页验证项（样本 1 完整核对）

- 实际生成文件：`deck.pptd` + `pages/*.page`(7) + `media/` + `preview/` + `.upm/` ✓
- 页面数量：7/7 ✓
- PPTX ZIP 完整性：`zipfile.testzip()` 无损坏、`[Content_Types].xml` 含 presentation 主类型 ✓
- PowerPoint/WPS 可打开：python-pptx 成功打开全部 7 页；保真修改样本另以 LibreOffice 实际渲染验证 ✓
- 文本/图形可编辑性：全部为原生 DrawingML text/shape（python-pptx 读回）✓
- 表格/图表可编辑性：样本 3 的表格与条形图编译为可编辑对象；**注意**：本地后端产出为可编辑形状而非原生 `a:tbl`/chart 对象（见边界）
- 图片比例/越界/遮挡/空白页：rubric 检查 + 联系表人工复核位；空白页判定阈值 0.9995 + 采样色数双条件 ✓
- 字体 fallback：SVG 渲染统一 `Microsoft YaHei/PingFang SC/Arial` 栈，CJK 渲染无豆腐块 ✓
- 文本溢出：确定性预判 + 自动收缩；样本 1 剩 1 个 overflow 提示（记录为 warning，未解决数 0）✓
- source/evidence 对应：`deckir.json` 的 claims/evidenceRefs → 页面 `upm.evidenceRefs` 与 notes ✓
- 质检报告：`.upm/quality-report.json`（gates/summary/evidence/unresolved）✓
- 导出后端：`.upm/export-record.json` 记录 `backend=local` ✓
- 视觉复检次数：样本 1 为 0 轮修复（首轮即过）；修复轮次上限 2 由 `upm/qa/repair.py` 强制 ✓

## 3. 保真修改样本额外验证

- 仅指定页面/部件变化：changed=`['ppt/slides/slide1.xml']` ✓
- 非目标部件字节不变：`unchanged_parts=66/67` ✓
- 无新增/删除异常 OOXML 部件：fidelity report `added=[]`、`removed=[]` ✓
- fidelity `safe: true` ✓
- 修改前后实际渲染对比：LibreOffice 渲染 PNG 对比（`*_edited-before-after.png`）✓

## 4. 测试基线

- Python：224 项（含新增 `tests/test_upm_cli.py` 的 CLI 端到端测试：doctor/make quick/结构门拒绝/保真修改回读；1 项既有 `McpStdioTransportTest` stdio 测试错误，与 v7 无关，见 `docs/guides/upm-migration.md`）
- Node：73 项全部通过（含 Python/TS/Bridge 四端路由 parity 与 52 个 fixture）
- Web App：`tsc --noEmit` 通过
- 契约：`generate_contracts.py --check` 通过

## 5. 已知边界（诚实声明）

- 本地导出把表格/图表编译为可编辑 DrawingML 形状（非原生 a:tbl/chart 对象）。Kimi 适配器为实验性外部兼容能力，当前上游环境存在导出交付失效（K1），不作为原生表格/图表能力的交付保证；需要原生数据对象时应在 PowerPoint/WPS 中重建或使用其原生工具。
- Kimi 公共编辑器为逆向兼容协议，已版本化于 `upm/adapters/kimi/manifest.json`，失效不影响本地后端。
- 主题型输入（无来源）会生成明确标注“待补充/占位”的页面并在质量报告中记录，不虚构数据；`audit` 模式可在交付前人工确认。
