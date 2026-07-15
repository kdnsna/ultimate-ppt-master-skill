# v6.2–v6.3.6 最终规格证据矩阵

> 审计日期：2026-07-15
> 审计范围：用户原 v6.2–v6.3.1 升级计划、[`v6-2-3-chinese-artifact-loop`](../v6-2-3-chinese-artifact-loop/requirements.md) 与本目录的 v6.3.2–v6.3.6 规格。
> 状态说明：本矩阵记录 2026-07-15 的源码与本机证据；v6.3.6 的发布合同机器状态为 `github-released`。该源码字段本身不是发布证据，真实发布只以 `v6.3.6` tag 与 GitHub Release 页面为准；marketplace 仍是独立状态。

## 状态口径

- **通过**：审计对应 checkout 有可执行测试或可复核产物证明。
- **部分通过**：源码与本机证据已完成，但人工环境或需按精确 SHA 查验的外部运行态尚未闭环。
- **未完成**：审计证据明确不满足，不得以文档、本机文件或旧版公开页代替。

## 总结论

| 结论 | 状态 | 依据 |
|---|---|---|
| 核心生产合同 | **通过** | P02 标题/结论/角色/variant 和用户重排顺序进入 DeckIR；4/10/24 页、52 条 Best-Effect、三场景多样性与无资料阻断均有可执行测试。 |
| 本地 Agent 到真实下载 | **通过** | 真实 Chrome 连接真实 Bridge，验证 command-only、Agent running/completed/failed、产物发现、path+SHA-256 质量绑定、PPTX 下载与交付撤销；Bridge 合同额外实际下载 `ppt/index.html` Web Deck。 |
| Bridge 安全和并发 | **通过** | Origin/Content-Type/413、路径越界、外部符号链接、伪造/篡改 manifest、源文件下载、120 并发、同名附件、SSE 隔离和 Agent 幂等均有运行测试。 |
| 中文 README 与公开 Proof 源码 | **源码通过** | 中文 `README.md` 189 行，英文镜像 182 行，GitHub Markdown API 渲染通过；两个主案例及证据链在构建产物中完整。 |
| 公开发布 | **发布合同通过 / 外部记录核验** | 源码统一 `github-released`，但只有 [`v6.3.6` tag 与 GitHub Release 页面](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.6) 能证明真实发布；Pages 按 Actions 精确 SHA 核验，marketplace 独立核验。 |
| Office 人工兼容性 | **部分通过** | 质量报告记录 WPS 9/9 页通过；PowerPoint 未安装/未复核，LibreOffice 本机中文渲染有缺字，总状态正确保持 `warning`。 |
| 独立回滚与发版图 | **逻辑边界通过 / 发布图外部核验** | v6.3.2–v6.3.6 说明定义独立回滚边界；实际 commit/tag/Release 状态必须从 Git 与 GitHub 实时记录核验，不由本静态矩阵断言。 |

## 规格与用户原计划逐项证据

| 规格项 | 当前证据 | 状态 | 剩余边界 |
|---|---|---|---|
| P02 字段与用户重排顺序 100% 进入生产合同 | `tests/bridge.test.mjs` 的 `handoff preserves an explicitly reordered P02 contract field by field in DeckIR` 显式将顺序改为 `P01,P03,P02,P04`，逐字段检查 `slideId/title/takeaway/role/selectedVariant/selectedVariantId`，同时检查 `storyboard.json` 为 DeckIR 1.0 与 manifest 中的 DeckSession 顺序。 | **通过** | 这是本次审计新增的明确回归。 |
| 4、10、24 页完整且稳定 `PNN` | 同文件的 `handoff merges 4, 10, and 24 page DeckSessions...` 检查页数和全部 `slideId` 顺序；Desktop worker 也限定 4–24 页并保留合同。 | **通过** | 无 12 页截断。 |
| Best-Effect Web/Bridge/Python 50+ fixtures 一致 | `tests/fixtures/best_effect_routing.json` 共 52 条；`tests/best-effect-routing-parity.test.mjs` 对 Web、Bridge、Python 路由同时比对预期。 | **通过** | 分布：14 `complete`、14 `thin`、24 `extreme-thin`；5 种 route。 |
| 经营复盘/咨询方案/产品发布不连续三页同布局或配方 | `the three core scenario DeckSessions pass the executable layout diversity gate`，另有反例拒绝和 fallback 自动破重测试；`audit_storyboard.py` 也分别拒绝三连 layout/recipe。 | **通过** | 是合同多样性，不等于主观审美评分。 |
| 无真实资料时保持 evidence missing 且生产阻断 | `DeckSession without source material...`、`projects/create stores task context without promoting it to factual evidence`、`artifact verification stays blocked...`与 URL pending 测试共同证明 `claims=[]`、`readyForProduction=false`、`sourceAdequacy=no-source`和 artifact `blocked`。 | **通过** | 任务描述不会被当作事实。 |
| Best-Effect 元数据写入 handoff | 4/10/24 合同测试检查 `promptQuality/recommendedRoute/decisionReason/source`；`project-brief.json` 缺失时由 Bridge 确定性路由补齐。 | **通过** | 保持 `deck-session-v6` 与 DeckIR 1.0。 |
| 单页精修以 `slideId` 为单位 | 修订测试验证真实 slide/variant，拒绝未知页与未知 variant，两次修订生成不可变历史文件。 | **通过** | 旧 storyboard 只保留空 variant 兼容。 |
| Bridge 离线/不可启动/可启动的唯一主操作 | 真实 Chrome 六状态测试；command-only 真 Bridge 测试确认未写 `agent-job.json`，allowLaunch 测试确认只启动一次并区分 accepted/running/completed/failed。 | **通过** | 默认 Bridge 只绑定回环地址。 |
| 每 3 秒检查产物，隐藏暂停，刷新恢复，交付后停止 | 真实 Chrome 测试检查 hidden 3.3s 无新请求、可见后恢复、delivered 不再轮询，并验证标签页与刷新后 `projectPath/sessionId` 不串扰。 | **通过** | 轮询是本地运行时，非云端任务队列。 |
| 检测到 PPTX/Web Deck/PDF/archive 后真实下载 | Bridge 列出白名单产物，直接下载 PPTX 与 `ppt/index.html` 并检查 `Content-Disposition: attachment`；真实 Chrome 取回 PPTX 字节并比对 SHA-256/大小。 | **通过** | 测试 PPTX 为合同字节，公开案例的 OOXML 完整性由 Proof 门禁另行证明。 |
| 待复核可下载，但只有 passed 真成品+全页批准可交付 | 真 Chrome 中 warning PPTX 保持下载但无交付按钮；passed path/hash 绑定+全页批准后才启用；篡改文件后立即回到 pending 并撤销交付。report-only 不能交付。 | **通过** | 交付语义与下载语义已分开。 |
| 中文 README 默认首页 | `README.md` 第一屏顺序是价值、双案例、安装、工作台、本地边界；189 行；`README.en.md` 182 行；`README.zh-CN.md` 18 行兼容入口；GitHub Markdown API 两份渲染通过。 | **源码通过 / 线上按 SHA 核验** | GitHub 默认页以当前分支内容为准；推送后应用实际 commit SHA 复核，不从候选标记推断。 |
| `/benchmark/` 双主案例与中文 Proof | benchmark 源码首屏只有「下载可编辑 PPTX」与「打开 GPT-5.6 Web Deck」两个主操作；两卡都有输入→策划→输出→质量复核；其他案例退到第二层；内部质量分有非第三方声明。 | **源码通过 / 线上按 SHA 核验** | Pages 内容必须通过 Actions 部署记录与真实 URL 复核，不由本静态矩阵声明。 |
| 正式办公 PPTX Proof | 源码与 public 镜像 SHA-256 同为 `0afdc71d4414e3be527e4d90e3a6bc355bb01160ae28adf97c25925c0b136dc3`，81,460 bytes，OOXML ZIP 检查通过；9 页、226 个原生矢量对象、2 原生图表、2 原生表格、9 页备注；附 source、native-object、PPTLint 和 quality report。 | **源码通过 / 线上按 SHA 核验** | 公开 URL 必须在相应 Pages 部署后复核；质量总状态继续为 `warning`。 |
| GPT-5.6 公开 Web Deck | 9 页完整 HTML，移动端证据 PNG 125,779 bytes，来源页明确分开官方事实与路由建议。2026-07-15 实时复核 OpenAI 官方 [GA 发布页](https://openai.com/index/gpt-5-6/) 与 [Sol 预览页](https://openai.com/index/previewing-gpt-5-6-sol/)，可用性、三层级与价格与 deck 一致。 | **源码通过 / 线上按 SHA 核验** | 源页属于当日快照，每次部署仍应按对应 SHA 重跑。 |
| Web 主包 < 80KB gzip，Classic 异步分包 | `build:web` 通过；当前 v6 主 JS+CSS 为 **78.71KB gzip**；`ClassicApp` 保持 lazy chunk，主导航无 Classic，`?classic=1` 与 `BASE_URL` 返回链接保留。 | **通过** | 只剩 1.29KB 名义空间，发布前必须重跑 bundle gate。 |
| Desktop 只保持合同兼容 | Desktop TypeScript/Vite build 通过；Python worker 原样保留 DeckSession 到 `deck-session.json` 及 4 个合同文件；Rust serde camelCase round-trip 通过；`cargo fmt/clippy/test` 通过。 | **通过** | 未增加 Desktop 产品功能，符合范围。 |
| Pages 只从 CI 通过的 `main` 部署 | `.github/workflows/pages.yml` 只响应 CI `workflow_run` 的 `push`+`success`+`main`+同仓库，checkout 精确 `head_sha`，部署后执行 `smoke-pages.mjs`。发布完整性测试也检查这些条件。 | **流程通过 / 运行态外部核验** | 工作流源码不证明某个 SHA 已部署；必须查看 Actions 并对实际 URL 运行 smoke。 |
| v6.3.2–v6.3.6 版本与中英文说明 | root/Web/Desktop/Cargo/Tauri/lock/marketplace 都对齐 6.3.6；v6.3.2–v6.3.5 保留中英文未发布候选切片与回滚边界；v6.3.6 为中文主发布说明和英文镜像。 | **源码通过** | v6.3.6 的权威证据是 tag/Release 页面，不是源码文案；marketplace 记录不从 GitHub Release 推断。 |
| 三里程碑独立发布/回滚与原始基线提交 | v6.3.2–v6.3.5 候选说明与 tasks 定义逻辑回滚边界；v6.3.6 发布语义可单独回退，实际 commit/tag/Release 从 Git 与 GitHub 记录核验。 | **逻辑边界通过 / 发布记录外部核验** | 用户已授权推送并发布 v6.3.6 GitHub Release；该授权不包含 marketplace 上架。 |
| PowerPoint/WPS/LibreOffice 人工复核 | `quality-report.json` 和 PPTLint 报告记录 2026-07-15 WPS 9/9 逐页通过；PowerPoint 未安装；LibreOffice 可打开/导出但中文缺字；字体便携性和阅读顺序仍是 warning。 | **部分通过** | 不得将 WPS 结论复制为 PowerPoint/LibreOffice `passed`；项目总质量状态应保持 `warning`。 |

## Bridge 攻击与并发矩阵

| 攻击/故障 | 可执行证据 | 结果 |
|---|---|---|
| 非法 `Origin` | `effectful POST routes reject disallowed origins...`，返回 403，磁盘无新项目 | **拒绝** |
| 非 JSON / 错误 JSON | 同测试返回 415/400，无副作用 | **拒绝** |
| `../`、反斜杠、Unix/Windows 绝对路径 | asset prompt 路径矩阵全部 400，`outputDir` 外无文件 | **拒绝** |
| 外部符号链接 | 修订写入和 artifact 下载都拒绝，外部文件未读写 | **拒绝** |
| `outputDir` 外 Agent 启动 | command-only/launch 测试返回 400 | **拒绝** |
| 空、目录不匹配、未签名或篡改 manifest | artifact list/download/status/launch 均拒绝；HMAC 覆盖整个 manifest（不含 integrity 自身） | **拒绝** |
| `attachments/`、`source.md`、越界或链接 artifact | 不出现在列表，下载返回 404/400 | **拒绝** |
| 0 字节、`.partial`、`.tmp`、隐藏、过深、仍写入的文件 | artifact stability/depth/entry-cap 测试 | **忽略** |
| 旧质量报告验证新文件 | path+SHA-256+size 绑定测试；文件变化后从 passed 回到 pending | **阻止冒用** |
| 超限 request body | 64-byte 测试稳定返回 413 JSON，服务仍可健康响应 | **拒绝且可观测** |
| 附件数量/单件/总量/声明大小不匹配/恶意 base64 | 解码字节限制测试返回 413/400，无任何项目写入 | **拒绝** |
| 120 个同标题并发 handoff | 120 个唯一目录，每个 `source.md` marker 与请求一致 | **无碰撞/无覆盖** |
| 同名附件 | 两个 `same.md` 获得不同稳定路径，内容各自保留 | **无覆盖** |
| 多 Bridge 共享签名密钥 | 24 个跨实例项目，单一 `0600` 密钥，重启后可验证且不泄露 | **通过** |
| 同项目多次/跨 Bridge 启动 Agent | 只 spawn 一次，重复请求显式返回 idempotent 状态 | **幂等** |
| SSE 串任务 | A/B 两个 session 只收到自己的 completed/projectPath；Web 标签页再做一层 session 过滤 | **隔离** |

## 推送前公开状态现场快照（历史证据）

2026-07-15 直接请求当前 Pages：

| URL | HTTP | 当前结果 |
|---|---:|---|
| `https://kdnsna.github.io/ultimate-ppt-master-skill/` | 200 | `<title>Ultimate PPT Master - Local-first AI Presentation Hub`，仍为英文旧首页。 |
| `https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/` | 200 | `<title>Ultimate PPT Master Proof Packs`，仍为旧案例页。 |
| `.../executive-business-review-editable.pptx` | 404 | 返回 HTML 404 页，不是 PPTX。 |

这组观察是推送前快照，不用于断言后续 Pages 状态。当时中文 README、新工作台、双主案例和公开 PPTX 仍处于未发布候选阶段；该历史状态现已被 v6.3.6 发布合同取代。是否完成 GitHub 发布只查验 `v6.3.6` tag 与 Release 页面；marketplace 不因 GitHub Release 而自动上架。

## 本次审计的可执行结果

| 命令 | 结果 |
|---|---|
| `npm run test:node` | 70/70 通过（含 52 fixtures、P02 重排、安全/并发/产物合同） |
| `npm run test:worker` | 127/127 通过 |
| `npm run build:web` | 通过 |
| `npm run audit:web-bundle` | 78.71KB gzip / 80KB，通过 |
| `npm run build:desktop` | 通过 |
| `cargo fmt --check` / `cargo clippy -D warnings` / `cargo test` | 通过，Rust 1/1 |
| `npm run audit:v6-workspace` | 6 套完整设计方向，通过 |
| `npm run audit:featured-decks` | 3 份 Web Deck / 27 页 / 1 份可编辑 PPTX / 中文 benchmark 源码，通过 |
| `npm run audit:quality` | 4 份 stable Proof Pack，通过 |
| `npm run audit:docs` | 通过 |
| `npm run audit:readme-render` | README 中文 14,185-byte HTML，英文 18,747-byte HTML，GitHub GFM 通过 |
| `unzip -tq ...editable.pptx` | OOXML ZIP 无错误 |
| `npm run test:web-browser` | Chrome/150.0.7871.115 全部通过：键盘/焦点/减弱动画、剪贴板失败、资料边界、1440/390 工作台与 benchmark、legacy 迁移、双标签隔离、URL 证据对账、六运行态、隐藏轮询暂停/恢复以及真实 Web↔Bridge↔Agent↔artifact digest/download/canDeliver 闭环。 |

## 推送与发布不可跳过的核验项

1. **保留提交与回滚边界**：保留用户原改动，将 v6.2.0、v6.3.0、v6.3.1 及后续 hardening 切片整理成可审阅/可回滚提交，或明确记录 squash + revert map。
2. **在精确推送 SHA 上跑全部 CI**：本机 checkout 的通过不能替代 GitHub CI。
3. **分开 GitHub 发布与 marketplace 授权**：用户已单独授权创建 `v6.3.6` tag 与 GitHub Release；这不自动授权发布 marketplace。
4. **每次部署后跑 smoke**：中文根页、benchmark、GPT-5.6 Web Deck、移动图、PPTX OOXML、quality report、OG 图与 sitemap 都必须从真实 Pages URL 验证。
5. **PowerPoint 原生复核**：在安装 PowerPoint 的目标环境完成 9/9 页逐页检查；LibreOffice CJK 缺字在未解决前继续 warning，不得通过改报告文案消除。
