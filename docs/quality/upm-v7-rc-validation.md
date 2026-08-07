# UPM v7 Release Candidate Validation（RC 验收记录）

> 候选分支：`feat/upm-v7-unification` → 目标：`main`（origin/main `656c2d8`）
> 最终候选 SHA：`cf9c9dbb00f89105fbbd67f8d466df09cd52fb46`
> 历史候选 SHA（测试期间修复导致变更，已重跑受影响轮次）：`2103e4c` → `e87d6ac` → `d15ba0b` → `cf9c9db`
> 本地证据目录（gitignore）：`.upm-test-results/upm-v7-rc1-*`

## 结论

**NOT READY — FIX AND RETEST**

Round 0–3 通过；Round 4（Kimi 成功导出链路）在真实环境中未达成；Round 5（PowerPoint/WPS 实机）与 Round 8（第二 Agent）依赖人工/缺失机器，尚未完成。

## 环境矩阵（Round 0）

| 项 | 值 |
|---|---|
| 平台 | macOS 27.0（arm64）Darwin 27.0.0 |
| Python | 3.11.15（仓库 .venv）；全新安装矩阵另覆盖 3.10.20 / 3.12.13 |
| Node / npm | v26.5.1 / 11.17.0；另验证 v22.23.1、v24.19.0 |
| Rust | 1.95.0 |
| LibreOffice | LibreOfficeDev 26.8.0.0.alpha0（codex runtime 路径） |
| WPS Office | 已安装（/Applications/wpsoffice.app） |
| Microsoft PowerPoint | 未安装 → Round 5 PowerPoint 部分 NOT RUN |
| Windows / Ubuntu | 本机无 → 依赖 GitHub Actions CI（Ubuntu）与人工（Windows） |
| agent-browser | 0.26.0 → 升级 0.33.2（满足 Kimi 最低要求） |
| 网络 | www.kimi.com 与 statics.moonshot.cn 均 HTTP 200 |

doctor 全 profile（Round 0）：core/pptx/kimi 0 关键缺失；visual-review 缺 playwright（错误信息可执行，doctor 不安装任何依赖）。

## Round 1：全新环境安装（PASS，macOS）

- 中文+空格路径 `/tmp/upm RC 安装测试/` 下 3 个全新克隆（候选 2103e4c→d15ba0b），分别以 Python 3.10.20 / 3.11.15 / 3.12.13 执行 `bootstrap --profile core/pptx/kimi`：全部 exit 0，venv 版本正确，无 node 时 core/pptx 可用，重复执行幂等。
- Node 22.23.1 / 24.19.0：`npm run check:contracts` 通过；node@22 + python3.11 下 `npm run setup`（profile all，含 Chromium）通过。
- 安装失败不留假健康环境：find_python 失败时未创建 .venv。
- Windows 11 / Ubuntu CI：NOT RUN（本机无；Ubuntu 由 PR CI 覆盖，Windows 需人工）。

## Round 2：自动化测试清零（PASS）

最终 SHA `cf9c9db` 上（受影响的 2103e4c/e87d6ac/d15ba0b 已重跑对应子集）：

- contracts sync：通过
- Python `test:worker`：224 项全过（含修复后的 MCP stdio 测试）
- Node `test:node` 73/73、`test:bridge` 52/52（bridge artifact 轮询修复后 8 连跑稳定）
- Web build、Desktop build：通过；`tsc --noEmit` 通过
- Rust：fmt/clippy（-D warnings）/test 通过
- audits：docs / web-console / v6-workspace / featured-decks / presets / quality / market / repo-hygiene / web-bundle 全部 exit 0
- `git diff --check` 通过

修复记录：MCP stdio（communicate after stdin.close）、bridge artifact flaky（轮询）、web-bundle 限额 80→81KB（v7 内容增量 0.03KB，已说明）。

## Round 3：本地后端真实生成（PASS，11/11 样本）

样本 A01–A10 + A12，`--export-backend local --render-backend local --mode standard`，全部：exit 0、structure/overflow/visual/export 门 pass、整稿渲染成功、0 未解决、0 空白页、0 未声明占位、联系表生成。

| 样本 | 页数 | 耗时(s) | 告警 | 图片 | 备注 |
|---|---|---|---|---|---|
| A01 金融经营分析 | 10 | 7.7 | 5 | 0 | |
| A02 银行/社保卡 | 8 | 6.1 | 6 | 0 | |
| A03 工作总结 | 8 | 6.2 | 8 | 0 | |
| A04 培训课件 | 8 | 6.0 | 5 | 0 | |
| A05 数据分析 | 8 | 6.2 | 0 | 0 | 表格+空值 |
| A06 产品发布 | 7 | 5.3 | 16 | 2 | 封面+图文页 |
| A07 技术架构 | 8 | 6.4 | 4 | 0 | |
| A08 长文档 PDF→PPT | 12 | 9.3 | 10 | 0 | 63 claims |
| A09 中英混排 | 6 | 4.7 | 2 | 0 | |
| A10 DeckIR 覆盖 | 6 | 4.6 | 1 | 1 | hero/section/chart/table |
| A12 压力稿 40 页 | 40 | 31.5 | 108 | 8 | 输出 26.1MB（>20MB） |

Round 3 修复：claim 均衡分组（消除空页占位）、metric 无数字回退（消除“待补充”假指标）、图片槽位优先（图文页正确）。

人工联系表复核：**PENDING-HUMAN**（本会话无图像输入能力，已生成每样本联系表与逐页 PNG，需人工按清单确认版式/字号/对齐）。

## Round 4：local/Kimi 双后端 A/B（KIMI 成功链路未达成）

- local 侧：A01/A05/A06/A09/A10/A12-精简 已具备。
- Kimi 侧：协议层实测可用（PPTD 加载、导出对话框、生成进度 0→81%+、页面/表格渲染正确）；**文件交付通道全部失败**（agent-browser download → daemon os error 35；CDP 下载目录无文件；sdkSaveMode=external onSave 未回调；save-picker/Blob 桩未命中；Playwright expect_download 超时）。
- 结论：Kimi 成功导出 = NOT ACHIEVED（阻塞项 K1）。同源 A/B 无法完成；差异报告只能给出 local 结果与 Kimi 部分协议证据。详见 `upm-v7-backend-comparison.md`。

## Round 5：Office/WPS/LibreOffice（LibreOffice PASS；PowerPoint/WPS 待人工）

LibreOfficeDev 26.8.0.0.alpha0 对 local A01/A05/A06/A09/A12 全 5 样本通过：打开→PDF 渲染、另存 ODP、重开 ODP→PPTX、python-pptx 重开（页数/可编辑文本完整）。WPS 与 PowerPoint 的 GUI 实机打开/编辑/另存仍待人工签字（`upm-v7-office-wps-validation.md` 清单）。

## Round 6：Preserve Edit 深度测试（PASS 27/27）

在 12 页结构型 A11（Logo 图片、母版、表格、合并单元格、原生图表、超链接、分组、连接符、透明对象）上执行 27 个案例：文本 8、样式 5、表格 5、图形 6、图表 3。全部：`safe=true`、仅预期部件变化、0 unexpected/added/removed、NOOP 字节一致；未匹配图形操作返回硬错误且不产出输出文件（K13 设计决策）。修复 K12（失败操作不再残留部分输出），并新增回归测试。

## Round 7：编辑器与安全（PASS 22/22）

功能：页面列表/清单/页面 YAML/SVG 预览/保存刷新/本地导出/质量报告/并发保存/中文路径/大项目。安全：路径穿越（..、绝对路径、Windows 盘符、media/../）全拒、符号链接逃逸修复（K15）、非法 YAML 不覆盖、非 JSON 拒绝、超大请求体 413（K14）、原子保存、仅绑定 127.0.0.1、关闭后端口释放。

## Round 8：Agent 用户旅程（Codex 4/4；第二 Agent 待执行）

Codex 风格 4 任务（PDF→8 页正式稿、改第 3 页标题且 fidelity safe、review 溢出/空白、open 工程改第 5 页）全部完成。第二 Agent：本机已安装 hermes 与 openclaw，本轮未执行其独立会话（记为 NOT RUN，列入人工清单）。

## Round 9：稳定性/重复性/压力（PASS）

- A01 完全相同输入 ×5：DeckIR/PPTD/页面/质量报告一致；PPTX 部件级哈希完全一致（仅 ZIP 条目时间戳差异，符合“差异必须可解释”）。
- 连续任务：10× make、10× review、10× edit 全部成功，无随机失败。
- A12 40 页：峰值 RSS ≈ 158 MB（165,642,240 字节），31s 级完成。

## Round 10：离线/异常/恢复（PASS）

离线等价场景（local quick/standard/review）全部成功。异常输入全部被拒绝且不产出成品：损坏 PPTX（exit 1）、空 PDF（1）、空 DeckIR（1，结构门阻断）、>40 页（1，上限阻断）、只读目录（1）、坏 YAML（2，结构错误阻断导出）。

## Windows CI（新增）

`.github/workflows/windows-ci.yml`：Windows latest × Python 3.10/3.12，覆盖 unit/integration、`upm doctor`、local quick make、preserve edit、PPTX ZIP 校验。PowerPoint GUI 仍保留为 Windows 人工验收门槛。

## 合并建议

暂不合并。本地路径（Round 2/3/5/6/7/9/10）已通过；K1（Kimi 文件捕获，上游同环境同样失败）与 K9（PowerPoint/WPS 人工签字、第二 Agent 会话）仍是 P1 阻塞项。修复/人工完成后在最新 PR Head 重跑 Round 2 + A01/A11 smoke。
