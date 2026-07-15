# Ultimate PPT Master v6 · 终极融合 PPT 大师

> **把真实资料变成可继续修改的原生 PowerPoint。** 文字、形状、图表、备注等支持对象保持可编辑；来源、假设和质量问题在交付前可检查。

<p align="center">
  <a href="./README.en.md"><strong>English</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>在线工作台</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>成品与 Proof</strong></a> ·
  <a href="./docs/zh-CN/README.md"><strong>中文文档</strong></a>
</p>

<p align="center">
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/kdnsna/ultimate-ppt-master-skill?style=flat-square"></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-172033?style=flat-square"></a>
  <img alt="unreleased candidate 6.3.6" src="https://img.shields.io/badge/unreleased_candidate-6.3.6-CC785C?style=flat-square">
  <img alt="本地优先" src="https://img.shields.io/badge/本地优先-是-10B981?style=flat-square">
  <img alt="editable PPTX" src="https://img.shields.io/badge/output-editable_PPTX-2563EB?style=flat-square">
</p>

![Ultimate PPT Master v6 的完整演示案例](assets/readme/v6-finished-decks.png)

## 两份可以直接检查的成品

| 代表案例 | 直接检查 |
|---|---|
| **正式办公 PPTX** · 脱敏经营复盘 | [下载仓库内可编辑 PPTX](./examples/executive-business-review-starter/executive-business-review-editable.pptx) · [看关键页](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/executive-business-review-starter/web-demo.html) · [看质量报告](./examples/executive-business-review-starter/quality-report.json) |
| **AI Web Deck** · GPT-5.6「三种轨道」 | [打开完整 9 页演示](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/ai-frontier-2026/gpt-5-6.html) · [进入成品库](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) |

以上 PPTX 是脱敏演示 proof，不包含真实客户资料；公开文件仍应在目标 PowerPoint/WPS 环境复核后再用于正式场合。

## 一分钟安装

```bash
npx skills add kdnsna/ultimate-ppt-master-skill --skill ultimate-ppt-master
```

安装后直接对 Agent 说：“用 `$ultimate-ppt-master`，把这份材料做成 10 页、给管理层看的可编辑 PPTX，结论先行，所有数字可追溯。”

需要可视化任务入口时，打开 [v6 在线工作台](https://kdnsna.github.io/ultimate-ppt-master-skill/)；它只负责界面，生成时连接你电脑上的本地 Bridge。

> **本地边界：**源文件、密钥和生成项目默认留在本机。项目不是托管式一键 PPT SaaS，也不会把当前 Bridge 直接暴露到公网。

已有 PPT 想先检查？使用 [PPTLint](https://github.com/kdnsna/pptlint) 做本地交付检查；需要修改时，再由 Ultimate 按明确页面和对象处理。

## 它解决的是交付，不只是预览

多数 AI PPT 工具优化“第一眼像不像成品”。Ultimate 更在意这份文件能否：

- 在 PowerPoint 中继续修改，而不是变成整页图片；
- 说明每个数字、结论和素材来自哪里；
- 修改单页时保留稳定 `slideId`，避免无故整套重做；
- 在缺少模型或素材时明确降级，不伪装为已经完成；
- 经过渲染审阅、原生对象检查和质量报告后再交付。

它适合中文正式汇报、经营复盘、咨询方案、培训课件、政务金融材料、品牌发布，也支持面向演讲和发布会的杂志风 Web Deck。

## 三种交付路线

| 你要交付什么 | 推荐路线 | 产物 |
|---|---|---|
| 正式汇报、咨询、培训、政务/金融材料，或需要别人继续修改 | **可编辑 PowerPoint** | `.pptx`、备注、来源与质量证据 |
| 发布会、公开演讲、Demo Day、浏览器优先展示 | **杂志风 Web Deck** | 响应式 HTML，支持编辑叙事或瑞士信息设计 |
| 既要线上展示，又要正式文件 | **双交付** | 共用资料与策划记录，分别生成 Web 和 PPTX |

PowerPoint 仍是正式成品的主要编辑环境。Ultimate 负责它周围最耗时的资料整理、叙事策划、视觉方向、素材边界、生成、审阅和失败恢复。

## 可以从什么开始

- PDF、Word、Excel、Markdown、网页链接或直接粘贴的文字；
- 只有主题的一句话任务，由最佳效果 brief 补齐非风险设置；
- 一份已有 PPTX，作为内容来源、视觉参考或明确的局部修复对象；
- 用户提供的品牌手册、Logo、图片和上一版演示。

参考 PPT 默认只学习母版、版式节奏、主题字体和颜色，不复制其中的私有内容。原始 Office 矢量素材会尽量作为一等素材保留。

## 从一句任务到正式交付

1. **输入**：加入文件、URL、文字或已有 PPTX，说明受众和用途。
2. **故事板**：最多补问三个真正影响结果的问题，展示页面任务、证据和缺口。
3. **设计与生成**：比较完整视觉方向，先出结构稿，再精修需要的页面。
4. **精修与交付**：按稳定 `slideId` 修改，检查产物并回到 PowerPoint 完成最终确认。

![v6 任务型工作台](assets/readme/v6-workspace.png)

工作台不会先把 Bridge、Provider、DeckIR 和脚本堆给普通用户。专业合同和诊断能力仍保留；Classic 控制台在兼容周期内可通过 `?classic=1` 打开。

## 极短指令也有稳定默认值

**最佳效果提示增强器**会把极短指令扩写成可检查的 brief，记录受众、场景、核心信息、页数、路线、来源边界和 Agent 假设。

- 明确要求可编辑、正式汇报、政府/金融/培训或 `.pptx`：走正式 PPTX。
- 明确要求网页、杂志风、横滑、Swiss Style 或浏览器展示：走 Web Deck。
- 只有主题且没有正式信号：使用 **Style A Editorial Fixed Rhythm**，先给出稳定的 8 页编辑叙事版本。

真正影响事实、品牌/IP 权限或交付方式时才追问；普通视觉空白由固定默认值补齐。

## 为什么适合中文正式办公

- 默认使用 Office 安全中文字体和投影可读字号，不依赖冷门网页字体。
- 先写结论与页面任务，再选择图表、图片、表格和版式。
- 为官方 Logo、二维码、印章、卡面和活动 IP 保留明确来源或替换阻断。
- 数字与结论进入 source map；证据不足时保持缺口，不把占位内容写成事实。
- 六套视觉方向覆盖封面、正文、数据、图表、图片、章节与结尾，不只是同一模板换色。
- 连续页面会检查布局与配方重复，避免整套收敛成“大标题＋三个卡片”。

设计系统见 [`DESIGN.md`](./DESIGN.md)。这里借鉴了 [`guizang-ppt-skill`](https://github.com/op7418/guizang-ppt-skill)、[`baoyu-design`](https://github.com/JimLiu/baoyu-design) 和 [`awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) 的生产方法；也以 clean-room 方式研究了 [`gzh-design-skill`](https://github.com/isjiamu/gzh-design-skill) 的浅色画布、阅读节奏和渲染质检思路。后者为 AGPL-3.0，本仓库没有复制它的代码、提示词、组件或模板。

## 公开 Proof 怎么看

[成品与 Proof 页面](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) 采用“输入 → 策划 → 输出 → 质量复核”的结构：

- 正式 PPTX 展示脱敏 source、可编辑文件、关键页、原生对象检查和质量报告；
- Web Deck 展示完整演示、资料来源和响应式结果；
- 其他经营复盘、咨询方案、产品发布和科技趋势案例进入次级案例库；
- Proof Pack 分数是 **Design Doctor 内部自评**，不是第三方 benchmark。

已有 PPT 的公开前后证据另见 [PPTLint Proof Loop](https://kdnsna.github.io/pptlint/proof-loop/comparison.html)。检查分数只作为辅助证据，不能替代 PowerPoint/WPS 中的逐页视觉确认。

## 可检查、可恢复的产物

| 文件 | 作用 |
|---|---|
| `project-brief.json` | 任务、自动扩写 brief、路线、假设与 `expectationFit` |
| `storyboard.json` | 稳定 `slideId`、页面角色、所选结构与证据引用 |
| `asset_plan.json` | 素材来源策略、状态与 `current_generation_evidence` |
| `source-map.json` | 实际使用的来源与主张 |
| `spec_lock.md` | 视觉与页面执行合同 |
| `quality-report.json` | 渲染发现、交付状态和已知阻断 |
| `pipeline-state.json` | 导出是否绑定最新通过检查的产物 digest |

没有可用生图后端时，素材项会进入 `Needs-Manual`，给出提示词、文件名和插入位置，不会静默制造“已完成”。

## 完整工作台安装

需要 Web 工作台、本地 Bridge 和仓库脚本时：

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

然后打开在线工作台。托管页面只连接 `127.0.0.1`；Bridge 默认不提供公网认证、多租户队列或通用文件服务器。

## 已有 PPTX 的修改边界

已有文件的局部修改采用 preservation-first：只处理用户选中的页面和对象，并锁定原文、数字、结论、页数、顺序、链接与未选页。

不能通过导入并重导出整份演示来冒充“局部修复”。如果当前环境没有原生、保包的对象级编辑路径，系统应立即返回 PowerPoint/WPS 操作步骤，而不是生成一份可能破坏母版、透明度、分组或链接的新文件。

实际修改后仍需在 PowerPoint、WPS 或 LibreOffice 中渲染前后检查，再运行 PPTLint 作为补充证据。

## 已知限制

- 生产级生成仍由本地 Agent/编排器牵引；Bridge 不是独立的 `POST /generate` 云服务。
- 超过约 16 页的项目建议在策划完成后使用断点续跑，避免上下文漂移。
- PowerPoint 渲染会受 Office 版本和字体影响，公开 proof 不能保证所有环境像素一致。
- Canva 式自由画布、多人实时协作、云账户和营销 Deal Room 不在当前范围。
- 结构预览不是最终 PPTX；只有真实文件、质量状态和人工复核共同完成后才算交付。

## 文档入口

| 想做什么 | 查看 |
|---|---|
| 浏览中文文档 | [中文文档索引](./docs/zh-CN/README.md) |
| 了解任务型工作台 | [Web Experience](./docs/zh-CN/guides/web-experience.md) |
| 连接本地 Bridge 与 Agent | [Agent Connect Bridge](./docs/zh-CN/guides/agent-connect-bridge.md) |
| 安装 Agent Skill | [安装与启动](./docs/zh-CN/guides/agent-setup.md) |
| 选择 PPTX、Web Deck 或 Desktop | [选择交付路线](./docs/zh-CN/guides/choosing-a-workflow.md) |
| 配置模型与 Provider | [模型与 Provider 配置](./docs/zh-CN/guides/model-provider-setup.md) |
| 排查问题 | [故障排查](./docs/zh-CN/guides/troubleshooting.md) |
| 查看当前未发布候选 | [v6.3.6 未发布候选说明](./docs/zh-CN/release/release-notes-v6.3.6.md) |

维护者的完整 API、产物表、发布门禁和兼容策略在 [`docs/`](./docs/zh-CN/README.md) 中，不占用第一次上手路径。

<details><summary><strong>English documentation compatibility</strong></summary>

## Documentation Map

[Agent Connect Bridge](./docs/guides/agent-connect-bridge.md) · [Agent Setup](./docs/guides/agent-setup.md) · [Hybrid-Editable Visual Workflow v4.0](./docs/quality/hybrid-editable-visual-workflow-v4.0.md) · [Simplified Web Console v4.1](./docs/release/release-notes-v4.1.0.md) · [DeckIR AI Planning Workflow v4.2](./docs/quality/deckir-ai-planning-workflow-v4.2.md) · [v4.3 Rendered Review Loop](./docs/quality/rendered-review-loop-v4.3.md) · [v5.0](./docs/release/release-notes-v5.0.0.md) · [v5.1](./docs/release/release-notes-v5.1.0.md) · [v5.2](./docs/release/release-notes-v5.2.0.md) · [v5.3](./docs/release/release-notes-v5.3.0.md) · [v5.4.1](./docs/release/release-notes-v5.4.1.md) · [v6.3.6 未发布候选](./docs/release/release-notes-v6.3.6.md)
</details>

## 许可与致谢

MIT。欢迎提交可复现资料、Proof、视觉方向和质量检查；公开承诺必须绑定真实文件、可执行审计或明确发布说明。

如果它帮你把“AI 生成的幻灯片”变成真正能交付的文件，欢迎点一个 Star，让下一个需要它的人更容易找到。
