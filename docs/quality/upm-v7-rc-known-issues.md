# UPM v7 RC 已知问题

> 候选 SHA：`cf9c9dbb00f89105fbbd67f8d466df09cd52fb46`

| ID | 级别 | 状态 | 描述 |
|---|---|---|---|
| K1 | P1 | OPEN（阻塞合并） | Kimi 成功导出链路无法捕获成品文件：生成流程真实运行（0→81%+），但 agent-browser 0.33.2 的 download 命令对 OOPIF 异步下载报 daemon os error 35；CDP 下载目录、sdkSaveMode=external onSave、showSaveFilePicker/Blob 桩、Playwright expect_download 均未取得文件。需要换用可用的下载捕获驱动或人工 GUI 步骤。 |
| K2 | P3 | OPEN | metric 页中文单位 label 截断（如“78.4 亿”后剩余“元”作为 label）；视觉可接受但措辞需打磨。 |
| K3 | P2 | FIXED | web-bundle 80KB 限额被 v7 内容超出 0.03KB；限额重基线至 81KB 并注释原因。 |
| K4 | P2 | FIXED | claim 数可整除槽位时产生空页占位；改为均衡分组。 |
| K5 | P2 | FIXED | 显式 per-slide 图片在表格/指标版式下被丢弃；图片槽位优先。 |
| K6 | P2 | OPEN（边界，如实声明） | 本地后端表格/图表为可编辑 DrawingML 形状，非原生 a:tbl/chart 对象；产品说明必须准确表达，不得宣传原生能力。 |
| K7 | P2 | FIXED | MCP stdio 测试在 Python ≥3.11 下 communicate 于 stdin.close 后抛错；改为 EOF 读取。 |
| K8 | P2 | FIXED | bridge artifact 测试约 1/3 概率时序抖动；改为轮询期望状态。 |
| K9 | P1 | OPEN（待人工） | Microsoft PowerPoint（本机未安装）与 Windows 平台实机验证未完成；WPS 实机打开/保存未执行。 |
| K10 | P3 | OPEN | 候选分支无 ruff 配置，`ruff check upm` 报告 67 项（多为 import 排序/未用变量）；oss-readiness 分支已配置 lint，合并前应同步。 |
| K11 | P3 | OPEN | A12 峰值内存未记录（未用 /usr/bin/time）；后续补测。 |
| K12 | P2 | FIXED | 失败的编辑操作（如未匹配图形几何）曾残留部分输出文件；现在失败时不产出输出并新增回归测试。 |
| K13 | P3 | 设计决策 | 未匹配的 set_shape_geometry 返回硬错误（exit 2、无输出）而非静默 NOOP，确保不伪装成功。 |
| K14 | P2 | FIXED | `upm open` 无请求体大小上限；现限制 8 MiB 并返回 413（含连接处理）。 |
| K15 | P2 | FIXED | `/api/page` 与 `/api/svg` 未防符号链接逃逸；现统一 resolve 后校验工程目录内包含。 |
| K16 | P2 | 已解释 | local 导出重复性：相同输入产出部件级哈希一致的 PPTX，仅 ZIP 条目时间戳随运行变化（可解释）。 |
| K17 | P3 | OPEN | Kimi 宿主/上游宿主方法面一致（diff 为空），进一步排除适配器差异；K1 定性为 Kimi 前端/SDK 兼容失效。 |

严重等级约定：P0=数据损坏/安全问题/无法生成；P1=无法打开/页面丢失/主要功能失败；P2=视觉明显不佳/偶发失败；P3=文档/提示/轻微问题。

合并门槛：P0=0、P1=0（K1/K9 必须解决）、P2 全部修复或有明确接受理由、P3 进 Issue 不阻塞主旅程。
