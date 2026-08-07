# UPM v7 RC 已知问题

> 候选 SHA：`2a47720d05b26503424e9de7db82343393753609`（最终 PR Head 仅可能再差验收文档提交）

| ID | 级别 | 状态 | 描述 |
|---|---|---|---|
| K1 | EXTERNAL-BLOCKED / compatibility-risk | OPEN（不再阻塞 UPM 主线合并；触发条件见独立 Issue） | Kimi 公共编辑器导出交付失效：生成流程真实运行（0→81%+），但 agent-browser 0.33.2 与 Playwright 均无法捕获成品；导航前 CDP 插桩未见 showSaveFilePicker/Blob/URL.createObjectURL/anchor/download 事件/pptx 网络响应；上游原版 open-kimi 同一环境同样失败；UPM 与上游 host methods 一致。满足隔离条件：local 为默认后端、Kimi 仅显式 opt-in、doctor 准确报告、失败不损坏工程、无泄漏、文档声明 compatibility risk、不承诺原生能力、保留代码/healthcheck/测试。 |
| K2 | P3 | OPEN | metric 页中文单位 label 截断（如“78.4 亿”后剩余“元”作为 label）；视觉可接受但措辞需打磨。 |
| K3 | P2 | FIXED | web-bundle 80KB 限额被 v7 内容超出 0.03KB；限额重基线至 81KB 并注释原因。 |
| K4 | P2 | FIXED | claim 数可整除槽位时产生空页占位；改为均衡分组。 |
| K5 | P2 | FIXED | 显式 per-slide 图片在表格/指标版式下被丢弃；图片槽位优先。 |
| K6 | P2 | OPEN（边界，如实声明） | 本地后端表格/图表为可编辑 DrawingML 形状，非原生 a:tbl/chart 对象；产品说明必须准确表达，不得宣传原生能力。 |
| K7 | P2 | FIXED | MCP stdio 测试在 Python ≥3.11 下 communicate 于 stdin.close 后抛错；改为 EOF 读取。 |
| K8 | P2 | FIXED | bridge artifact 测试约 1/3 概率时序抖动；改为轮询期望状态。 |
| K9 | P1 | 部分 CLOSED / 部分待人工 | LibreOffice 5 样本 PASS；WPS 打开+放映 PASS（12.1.26035，截图证据），编辑/另存/重开因 macOS 自动化缺陷（AppleEvent -10000）待人工签字；Microsoft PowerPoint 未安装，需真实机器完成 A01/A06/A11 验收。 |
| K10 | P3 | FIXED | `pyproject.toml` 已配置 ruff（line-length 120 / py310 / E4,E7,E9,F,I,UP）；`ruff check upm tests` 全 clean（修复 46 项，含 6 个死变量）；ruff 0.16.1 固定版本并加入 CI。 |
| K11 | P3 | CLOSED | A12（40 页、26MB PPTX、8 图）峰值 RSS ≈ 158 MB（165,642,240 字节，`/usr/bin/time -l` 实测）；基线已写入 `upm-v7-rc-validation.md` Round 9。 |
| K12 | P2 | FIXED | 失败的编辑操作（如未匹配图形几何）曾残留部分输出文件；现在失败时不产出输出并新增回归测试。 |
| K13 | P3 | 设计决策 | 未匹配的 set_shape_geometry 返回硬错误（exit 2、无输出）而非静默 NOOP，确保不伪装成功。 |
| K14 | P2 | FIXED | `upm open` 无请求体大小上限；现限制 8 MiB 并返回 413（含连接处理）。 |
| K15 | P2 | FIXED | `/api/page` 与 `/api/svg` 未防符号链接逃逸；现统一 resolve 后校验工程目录内包含。 |
| K16 | P2 | 已解释 | local 导出重复性：相同输入产出部件级哈希一致的 PPTX，仅 ZIP 条目时间戳随运行变化（可解释）。 |
| K17 | P3 | OPEN | Kimi 宿主/上游宿主方法面一致（diff 为空），进一步排除适配器差异；K1 定性为 Kimi 前端/SDK 兼容失效。 |
| K18 | P2 | FIXED | Windows CI：`bin/upm` 与 `upm.cli.common.resolve_python` 只认 Unix venv 路径，Windows 找不到 Python；现支持 `.venv/Scripts/python.exe` 与 `python` 回退（回归测试覆盖）。 |
| K19 | P2 | FIXED | Windows CI：cp1252 控制台无法输出中文导致 `upm doctor` 崩溃；CLI 入口强制 PYTHONUTF8/PYTHONIOENCODING 并 reconfigure stdout/stderr（回归测试覆盖）。 |
| K20 | P2 | FIXED | Windows CI：`upm doctor` 的“仓库本地 .venv”检查只认 `.venv/bin/python`；现兼容 `.venv/Scripts/python.exe` 与 `python`（回归测试覆盖）。 |
| K21 | P2 | FIXED | bridge artifact 发现偶发返回空列表：APFS 亚毫秒 mtime 在同一整数毫秒内被 `Date.now()` 减出负值，文件被误判为“仍在写入”；`artifactStable` 先 floor 再比较，新增确定性回归测试。 |
| K22 | P2 | FIXED | Windows Python 测试套件：job 未启用 UTF-8 导致子进程中文输出解码/编码崩溃；`cairo_available` 对缺失 pkg-config 未捕获 OSError；PIL 测试未关闭句柄导致临时目录删除失败（WinError 32）；均已修复并同步 desktop worker 打包副本。 |
| K23 | P2 | FIXED | Windows Python 测试套件（第二批）：`audit_visual_recipes.py` 用 `str(item).endswith("assets/...")` 匹配正斜杠路径，Windows 反斜杠永不命中；`test_desktop_worker`/`test_visual_review_contract` 同样问题；`int.from_bytes` 未传 byteorder（3.12.10 无默认值）；均改为 posix 匹配/显式 `"big"`。 |
| K24 | P2 | FIXED | Windows Node 测试：agent-job 状态写入用 temp+rename，Windows 上并发 status 读取正打开目标文件时 rename 抛 EPERM/EBUSY，completed 状态无法落盘；`renameWithRetry` 有界重试修复；测试对 Windows 不存在的 Unix 权限位（key 0o600）断言按平台区分。 |
| K25 | P2 | FIXED | Ubuntu CI `test:web-browser` 偶发 `Missing v6-generate-flow`：`Page.reload` 后旧文档仍满足断言条件，新文档挂载前 evaluate 落空；测试在 reload 前设置 `window.__upmPreReloadMark`，等待新文档出现后再断言恢复状态（本地 Chrome 连跑 3 次 PASS）。 |
| K26 | P3 | FIXED | npm audit：postcss ≤8.5.22 高危（GHSA-r28c-9q8g-f849 / GHSA-fxqj-rqcc-2cmp）；web/desktop 锁文件升级 postcss 8.5.26，audit 0 漏洞。 |

严重等级约定：P0=数据损坏/安全问题/无法生成；P1=无法打开/页面丢失/主要功能失败；P2=视觉明显不佳/偶发失败；P3=文档/提示/轻微问题。

合并门槛：P0=0、P1=0（K9 必须完成人工验收）、P2 全部修复或有明确接受理由、P3 进 Issue 不阻塞主旅程。K1 为 EXTERNAL-BLOCKED（独立 Issue #17，触发条件明确），满足隔离/声明条件后不阻塞主线。
