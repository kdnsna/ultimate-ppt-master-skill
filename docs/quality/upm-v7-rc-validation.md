# UPM v7 Release Candidate Validation（RC 验收记录）

> 候选分支：`feat/upm-v7-unification` → 目标：`main`（origin/main `656c2d8`）
> 最终候选代码 SHA：`58aa9f58c5c9635c4bc97f1c5f9596831f941b56`（最终 PR Head 与本文件随后提交，若仅相差验收文档则沿用本记录）
> 历史候选 SHA（测试期间修复导致变更，已重跑受影响轮次）：`2103e4c` → `e87d6ac` → `d15ba0b` → `cf9c9db` → `c7781b7` → `2413441` → `1b476e7` → `3457e1c` → `8b92dc1` → `9c7c2ac` → `02a4a66` → `2fd5a76` → `93ef4e9` → `615f842` → `5b204e1` → `78b43a0` → `7abfd13` → `7749f62` → `993c42d` → `55c0d12` → `58aa9f5`
> 本地证据目录（gitignore）：`.upm-test-results/upm-v7-rc1-*`

## 结论

**NOT READY — FIX AND RETEST（截至 2026-08-07；阻塞项：PowerPoint 真实机器验收、WPS 编辑/另存/重开人工签字、Windows CI 最终确认）**

K1 已重分类为 `EXTERNAL-BLOCKED / compatibility-risk`（Issue #17），不再阻塞 UPM 主线合并。UPM 核心路径（Round 2/3/5/6/7/8/9/10 + 最新 Head A01/A11 smoke）已通过；合并前仍需 PowerPoint 真实机器验收、WPS 编辑/另存/重开人工签字与 Windows CI 全绿。

> 最终回归环境说明：本机 Documents 目录受 iCloud “dataless 按需下载”影响（41k+ 文件被驱逐，读文件卡死），最终回归在非 iCloud 路径的干净浅克隆 `/Users/kdnsna/upm-v7-rc`（同 HEAD）执行；该环境无 iCloud 干扰，结果可信。

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

最新代码 Head `58aa9f5` 上重跑（受影响的 c7781b7→58aa9f5 修复均已在最新 Head 验证）：

- contracts sync：通过
- Python `test:worker`：230 项全过（含修复后的 MCP stdio、resolve_python Windows 路径、Windows UTF-8 stdio、doctor Windows venv 检测回归测试）
- Node `test:node` 75/75、`test:bridge` 54/54（新增 artifactStable 亚毫秒 mtime、renameWithRetry EBUSY/EPERM 重试回归测试）
- Web build（371ms）、Desktop build（280ms）：通过
- Rust：fmt / clippy（-D warnings）/ test 通过
- audits：docs / web-console / v6-workspace / featured-decks / presets / quality / market / repo-hygiene / web-bundle / readme-render / brief / visual-intent / feedback-loop / image-contracts / magazine-deck / swiss-deck 全部 exit 0
- ruff（0.16.1，已固定并加入 CI）：`upm` + `tests` 全 clean（K10 CLOSED）
- 真实 Chrome v6 浏览器回归 `test:web-browser`：11/11 PASS（含两标签隔离/刷新恢复；刷新恢复竞态已修复：pre-reload 标记等待新文档）
- `git diff --check` 通过

修复记录：MCP stdio（communicate after stdin.close）、bridge artifact flaky（轮询）、web-bundle 限额 80→81KB、Windows `bin/upm`/`resolve_python`/doctor venv 路径发现、Windows cp1252 控制台中文输出（UTF-8 强制）、ruff 清理（46 项，含 6 个死变量）、bridge artifact 亚毫秒 mtime 误判“未来时间戳”（floor 后比较，回归测试）。

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

LibreOfficeDev 26.8.0.0.alpha0 对 local A01/A05/A06/A09/A12 全 5 样本通过：打开→PDF 渲染、另存 ODP、重开 ODP→PPTX、python-pptx 重开（页数/可编辑文本完整）。

WPS Office 12.1.26035（macOS）：A01 打开无修复提示 + 全屏放映 + Esc 退出 PASS（截图 `/tmp/wps-a01-1-open.png`、`-2-play.png`、`-3-after-esc.png`）；编辑/另存/重开因 macOS AppleEvent -10000 自动化缺陷**待人工签字**。Microsoft PowerPoint：本机未安装，A01/A06/A11 真实机器验收 **NOT RUN**（最终人工验收清单）。

## Round 6：Preserve Edit 深度测试（PASS 27/27）

在 12 页结构型 A11（Logo 图片、母版、表格、合并单元格、原生图表、超链接、分组、连接符、透明对象）上执行 27 个案例：文本 8、样式 5、表格 5、图形 6、图表 3。全部：`safe=true`、仅预期部件变化、0 unexpected/added/removed、NOOP 字节一致；未匹配图形操作返回硬错误且不产出输出文件（K13 设计决策）。修复 K12（失败操作不再残留部分输出），并新增回归测试。

## Round 7：编辑器与安全（PASS 22/22）

功能：页面列表/清单/页面 YAML/SVG 预览/保存刷新/本地导出/质量报告/并发保存/中文路径/大项目。安全：路径穿越（..、绝对路径、Windows 盘符、media/../）全拒、符号链接逃逸修复（K15）、非法 YAML 不覆盖、非 JSON 拒绝、超大请求体 413（K14）、原子保存、仅绑定 127.0.0.1、关闭后端口释放。

## Round 8：Agent 用户旅程（Codex 4/4；第二 Agent Hermes 3/3 PASS）

Codex 风格 4 任务（PDF→8 页正式稿、改第 3 页标题且 fidelity safe、review 溢出/空白、open 工程改第 5 页）全部完成。

第二 Agent（Hermes，DeepSeek/deepseek-v4-flash，独立 `hermes -z` 会话，仅提供仓库作为 Skill，不透露内部实现）：
- make：由 A05 材料生成 6 页 deck，PPTX ZIP 正常、gates 全 pass、overview/质量报告齐全；
- edit：`upm edit` 保真修改，仅 `ppt/slides/slide1.xml` 变化，0 added/0 removed，标记文本落盘；
- review：`upm review` 成功并正确说明 PPTX/预览/报告位置。

Round 8 第二 Agent 子项 PASS。

## Round 9：稳定性/重复性/压力（PASS）

- A01 完全相同输入 ×5：DeckIR/PPTD/页面/质量报告一致；PPTX 部件级哈希完全一致（仅 ZIP 条目时间戳差异，符合“差异必须可解释”）。
- 连续任务：10× make、10× review、10× edit 全部成功，无随机失败。
- A12 40 页：峰值 RSS ≈ 158 MB（165,642,240 字节），31s 级完成。

## Round 10：离线/异常/恢复（PASS）

离线等价场景（local quick/standard/review）全部成功。异常输入全部被拒绝且不产出成品：损坏 PPTX（exit 1）、空 PDF（1）、空 DeckIR（1，结构门阻断）、>40 页（1，上限阻断）、只读目录（1）、坏 YAML（2，结构错误阻断导出）。

## Windows CI（新增）

`.github/workflows/windows-ci.yml`：Windows latest × Python 3.10/3.12，覆盖 unit/integration、`upm doctor`、local quick make、preserve edit、PPTX ZIP 校验。PowerPoint GUI 仍保留为 Windows 人工验收门槛。

Windows CI 修复链：`bin/upm` 找不到 `.venv/Scripts/python.exe`（已修）→ cp1252 无法输出中文（已修）→ doctor `.venv` 检查只认 Unix 路径（已修）→ Python 测试套件 Windows 兼容（UTF-8 环境变量、cairo 探测 OSError 防护、PIL 句柄关闭、worker 打包副本同步、audit/tests 的 posix 路径匹配、int.from_bytes 显式 byteorder）→ Node 测试 Windows 兼容（agent-job rename EBUSY/EPERM 有界重试、key 权限位断言按平台区分）。Windows 3.10/3.12 在 `55c0d12` 已全绿；浏览器回归竞态（`Missing v6-generate-flow`）已根因修复（pre-reload 标记），最新 Head `58aa9f5` 的 Desktop CI 以 PR 状态为准。

## 合并建议

暂不合并。UPM 核心自动化与本地路径已全部通过（含最新 Head 的 Round 2、A01/A11 smoke）；剩余硬门槛：PowerPoint 真实机器 A01/A06/A11 验收、WPS 编辑/另存/重开人工签字、Windows CI 在最新 Head 全绿。三者完成后将本文件结论改为 READY TO MERGE。
