# 保真改 PPT

**已有带品牌的 PPT，指哪改哪——其余页、logo、母版一个字节都不动。**

Kimi / Gamma / ChatGPT 已经很会从零生成演示。这个项目不抢那条赛道。它解决的是生成之后、交付之前最痛的那一步：领导发来的、客户给的、模板套好的真实 `.pptx`，你只要改几处，却不能把整套模板、印章和链接一起弄坏。

<p align="center">
  <a href="./README.en.md"><strong>English</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>在线工作台</strong></a> ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>成品与 Proof</strong></a> ·
  <a href="./docs/zh-CN/README.md"><strong>中文文档</strong></a>
</p>

<p align="center">
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/kdnsna/ultimate-ppt-master-skill?style=flat-square"></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-172033?style=flat-square"></a>
  <a href="https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.9"><img alt="GitHub Release v6.3.9" src="https://img.shields.io/badge/GitHub_Release-v6.3.9-1D4ED8?style=flat-square"></a>
  <img alt="本地优先" src="https://img.shields.io/badge/local--first-yes-10B981?style=flat-square">
  <img alt="editable PPTX" src="https://img.shields.io/badge/output-editable_PPTX-2563EB?style=flat-square">
</p>

![保真改稿：只改第 1 页标题，其余部分原样不动](assets/preserve-demo/before-after-real.png)

> 上图：对仓库内真实样例只改第 1 页标题。`fidelity-report.json` 写明「改了哪些、多少部分原样没动」。可复现：`python3 scripts/make_preserve_demo_proof.py`

---

## 为什么需要它

| 场景 | 从零生成（Kimi 等） | 保真改 PPT |
|---|---|---|
| 还没有 PPT，要起草稿 | ✅ 强项 | 次要能力 |
| 已有品牌模板，只改数字 / 结论 | 容易整套重画，logo 与母版跑偏 | ✅ 只动点名的页 |
| 交 WPS / PowerPoint 继续改 | 常是网页 Deck 或需二次排版 | ✅ 原生可编辑 `.pptx` |
| 银行 / 政务 / 法务材料不出本机 | 多数要上传 | ✅ 本地优先，文件默认不离机 |

**原则：没让你动的，就一个字节都不动。**  
不是「整份导入再整份导出」，而是把 `.pptx` 当 zip：未点名的 part 原样拷贝，只重写你指定的页（以及该页图表 ops 涉及的 chart part）。技术细节见 [定位说明](./docs/zh-CN/strategy/positioning-preserve-edit.md)。

---

## 一分钟安装

### Agent 技能（推荐）

```bash
npx skills add kdnsna/ultimate-ppt-master-skill --skill ultimate-ppt-master
```

> 对 Agent 说：把这份 PPT 第 3 页的「Q2」改成「Q3」，第 6 页结论换成附件新数字，别的都别动。

### 命令行（零第三方依赖）

```bash
# 先看每页写了什么
python3 scripts/preserve_edit_pptx.py --list deck.pptx

# 只改一页文字
python3 scripts/preserve_edit_pptx.py deck.pptx out.pptx \
  --slide 1 --replace "Q2=Q3" --report fidelity.json

# 样式 / 表格 / 图表等 typed ops
python3 scripts/preserve_edit_pptx.py deck.pptx out.pptx \
  --slide 2 --op '{"op":"style_text","size":24,"bold":true}'

# 多页一次改完
python3 scripts/preserve_edit_pptx.py deck.pptx out.pptx --edits edits.json
```

`edits.json` 示例：

```json
[
  { "slide": 1, "replacements": { "Q2": "Q3" } },
  { "slide": 4, "operations": [
      { "op": "replace_table_cell", "row": 2, "col": 1, "text": "128" }
  ]},
  { "slide": 6, "operations": [
      { "op": "set_chart_value", "series": 1, "point": 2, "value": 42 }
  ]}
]
```

### 桌面端

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup && npm run desktop
```

拖入 `.pptx` → 选页 → 改 → 存。原文件永不覆盖。安装细节见 [INSTALL.md](./INSTALL.md) 与 [桌面快速开始](./docs/zh-CN/guides/agent-setup.md)。

### MCP（给任意 Agent）

```bash
python3 scripts/ppt_preserve_mcp.py
```

零依赖 stdio MCP：`inspect_pptx` / `edit_pptx_preserving`。详见 [MCP 接入](./docs/zh-CN/guides/mcp-server.md)。

---

## 现在能改什么

| 能力 | 说明 |
|---|---|
| 文本 | 标题、正文、标注：查找替换 |
| 样式 | 字体 / 字号 / 粗体 / 颜色（可按文本匹配） |
| 表格 | 按行列或查找改单元格 |
| 形状 | 移动、缩放（单位 pt） |
| 图表 | 改图例/标签文字、改数据点数值 |
| 保真门禁 | 改动清单；意外变更即失败，不交付坏文件 |

**还不做（请回 PowerPoint / WPS）：** 增删整页、插入新图、重建表格结构、自由画布重排。

---

## 一个真实例子

领导发来季度经营复盘：封面「Q2」→「Q3」；第 4 页表格换新数；第 6 页柱状图图例改文案。

结果：只改这三处涉及的页（及图表 part）；其余页、母版、logo、备注、超链接原样。回报类似：

> 改了 3 处，涉及封面 / 第 4 页 / 第 6 页；其余 78 个部分原样没动。

---

## 次要能力：也能从零生成

还没有 PPT 时：PDF / Word / Excel / 网页 / 粘贴文字 → 故事板 → 可编辑 PPTX 或杂志风 Web Deck。

- [在线工作台](https://kdnsna.github.io/ultimate-ppt-master-skill/)（UI 在网页，干活连本机 [Bridge](./docs/zh-CN/guides/agent-connect-bridge.md)）
- Agent：`使用 $ultimate-ppt-master 把这份材料做成 10 页可编辑 PPTX`
- 路线选择：[选择交付路线](./docs/zh-CN/guides/choosing-a-workflow.md) · [Web Experience](./docs/zh-CN/guides/web-experience.md)

| 公开样例 | 打开 |
|---|---|
| 正式办公 PPTX · 脱敏经营复盘 | [下载 PPTX](./examples/executive-business-review-starter/executive-business-review-editable.pptx) · [关键页](https://kdnsna.github.io/ultimate-ppt-master-skill/examples/executive-business-review-starter/web-demo.html) |
| AI Web Deck · 杂志风 | [完整演示](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) |

主场仍是**改好你已有的那份**。

---

## 三种形态，同一引擎

```
scripts/preserve_edit_pptx.py   ← 保真引擎（标准库，CLI + apply_edits API）
        ├── 桌面端 apps/desktop
        ├── MCP    scripts/ppt_preserve_mcp.py
        └── Agent Skill  SKILL.md
```

| 你是谁 | 怎么用 |
|---|---|
| 业务同学 | 桌面端拖拽 |
| Cursor / Claude / Codex | 装 Skill，人话指挥 |
| 接自己的 Agent | MCP 或 CLI / `apply_edits` |
| 开发者 / CI | CLI + fidelity 报告门禁 |

---

## 本地优先

桌面端与 MCP 在本机跑；源文件与产物默认不上传。需要模型时走你本机配置的 [Provider](./docs/zh-CN/guides/model-provider-setup.md)；纯保真编辑可完全离线。银行、政务、法务场景按此设计。

---

## FAQ

- **会动模板和 logo 吗？** 不会。没点名的 package part 原样拷贝。
- **支持 WPS 吗？** 支持。标准 `.pptx`，WPS 与 PowerPoint 均可继续编辑。
- **改坏了怎么办？** 永不覆盖原文件；用 fidelity 报告核对变更范围。
- **和 pptlint？** 可用 [pptlint](https://github.com/kdnsna/pptlint) 做交付前检查，再只对点名问题做保真修复。
- **更复杂版式？** 仍建议在 PowerPoint / WPS 收尾；见 [故障排查](./docs/zh-CN/guides/troubleshooting.md)。

---

## 已知限制

- 保真「改」覆盖文本、样式、表格单元格、形状几何与图表数值；增删页/插图/重建结构不在范围内。
- 像素级改前改后对比需本机 LibreOffice；否则给矢量对比卡。
- 从零生成仍由本地 Agent 牵引，不是托管一键云服务。
- Canva 式自由画布、多人实时协作、云账号不在范围内。

---

## 文档入口

| 想做什么 | 查看 |
|---|---|
| 浏览中文文档 | [中文文档索引](./docs/zh-CN/README.md) |
| 安装与启动 | [INSTALL](./INSTALL.md) · [Agent 安装](./docs/zh-CN/guides/agent-setup.md) |
| 品牌定位 | [PPT 改稿 · 定位](./docs/zh-CN/strategy/positioning-preserve-edit.md) |
| MCP 接入 | [mcp-server](./docs/zh-CN/guides/mcp-server.md) |
| 复制改稿 Prompt | [场景 Prompt](./docs/zh-CN/guides/preserve-edit-prompts.md) |
| 本地 Bridge | [Agent Connect Bridge](./docs/zh-CN/guides/agent-connect-bridge.md) |
| 任务型工作台 | [Web Experience](./docs/zh-CN/guides/web-experience.md) |
| 选择交付路线 | [choosing-a-workflow](./docs/zh-CN/guides/choosing-a-workflow.md) |
| 模型与 Provider | [model-provider-setup](./docs/zh-CN/guides/model-provider-setup.md) |
| 故障排查 | [troubleshooting](./docs/zh-CN/guides/troubleshooting.md) |
| 当前正式版本 | [v6.3.9 发布说明](./docs/zh-CN/release/release-notes-v6.3.9.md) |

维护者的 API、产物表与发布门禁在 [`docs/`](./docs/zh-CN/README.md)，不占第一次上手路径。

---

## 许可

[MIT](./LICENSE)。如果它帮你把「差点能交」的 PPT 收成「能交出去的那份」，欢迎 Star。
