# PPT大师 v2.5.0 → 下一步优化方向

> **历史记录（已归档）**：本文保留 v2.5.0 阶段的判断，不代表 v6.3.8 当前路线。现行入口见 [v6.3.8 发布说明](../release/release-notes-v6.3.8.md) 与 [中文文档导航](../zh-CN/README.md)。

> 分析日期：2026-05-28
> 基于版本：v2.5.0 (commit e7efe48)

---

## v2.5.0 已落地的核心资产

v2.5 把项目从"能生成 PPT 的工具"升级到了**带质量门槛的生产级工作台**：

- **Design Doctor**：SVG 质检 + 浏览器视觉复核 + `quality-report.json`
- **4 个稳定预设包**：Executive Business Review / Consulting Proposal / Product Pitch / Tech Trend Web Deck，每个都有完整 proof artifacts
- **Bridge handoff 契约**：Agent 收到的不再是光秃秃的 prompt，而是带 `qualityProfile`、`expectedArtifacts`、`reviewCommands` 的可审计合约
- **审计命令**：`npm run audit:quality` 可在 CI 里跑 proof gate

---

## 四个优化方向（按投入产出比排序）

### 方向一：把 4 个种子预设升到稳定包 ⭐⭐⭐⭐⭐

最大的价值洼地。`preset-directions.json` 里已有 4 个种子预设（状态 `seed`），但没有 proof artifacts 和公开示例。

| 种子预设 | 场景 | 为什么值得做 |
|---|---|---|
| Training Courseware | 内部培训、入职课件 | 知识型内容需求大，竞争少 |
| Research / Academic Defense | 论文答辩、学术报告 | 已有 academic_defense 等模板，复用成本低 |
| Government / SOE Report | 政府/国企工作汇报 | 模板储备最丰富（4套），用户有真实素材场景 |
| Finance / Branch Solution | 银行/金融方案书 | 已有招商银行模板，金融是既有领域 |

**每个 preset 需要的产出**：

1. 一份 sanitized 的 `source.md`
2. 一次完整生成（走 Agent Skill 路线）
3. 关键页面截图
4. `quality-report.json`
5. 更新 `templates/presets/preset-directions.json` 状态为 `pack`
6. 在 `examples/` 下建 starter 目录

**建议优先**：Government/SOE Report（模板最丰富）和 Training Courseware（场景最大）。

---

### 方向二：v2.6 跨路线 benchmark 对比 ⭐⭐⭐⭐

Roadmap 里 v2.6 的方向：**同一份素材走 PPTX 路线和 Web Deck 路线，对比输出质量差异。**

此项完成后能直接帮用户做"选哪个输出模式"的决策。

**具体动作**：

- 挑 2-3 个 preset，同一份 source
- 分别跑 PPTX + Web Deck 两条路线
- 产出对比报告，覆盖：
  - 内容完整性
  - 视觉还原度
  - 可编辑性（PPTX）/ 可分享性（Web Deck）
  - 移动端体验
  - 生成耗时

**一鱼两吃**：benchmark 结果可以同时作为种子预设的 proof artifacts。

---

### 方向三：Skill 市场分发 ⭐⭐⭐⭐

零成本高曝光，改动极小但收益持续。

目标仓库：

- `pm-skills`（11.6k 星）— 提 PR 加目录引用
- `Awesome-Powerpoint-AI-Agents` — 提 PR 加到列表
- `Awesome-presentation-tools` — 提 PR 加到列表

**每条 PR 改动不到 20 行**，文案已有现成的（见 `docs/strategy/public-growth-playbook.md`）。

> One-liner: *Ultimate PPT Master - Local-first AI presentation hub for Codex/Claude Code; turns PDFs, docs, PPTX, URLs, and notes into agent-ready projects, editable PowerPoint decks, and magazine-style Web Decks.*

趁生态还没饱和，先占坑。

---

### 方向四：Design Doctor 自动化修复 ⭐⭐⭐

当前 Design Doctor 是 report-first（发现问题→报告），修复是 opt-in。

可以挑 2-3 类最高频的 SVG 结构问题做成自动修复——不改创作逻辑，只修已知的结构缺陷：

- viewBox 不对
- 缺 XML 命名空间
- 文本溢出边界
- 颜色空间不一致

默认仍 report-first，用户选择 `--auto-fix` 时自动修复。不改创作内容，只修格式。

---

## 优先级建议

```
短期 → 方向一（种子预设升包）
中期 → 方向二（benchmark 对比）
顺手 → 方向三（Skill 市场分发）
备选 → 方向四（Design Doctor 自动修复）
```

---

## 附：当前项目结构速览

```
ultimate-ppt-master-skill/
├── SKILL.md              # Agent Skill 入口
├── AGENTS.md             # 各 Agent 工具集成说明
├── apps/
│   ├── web/              # Web Experience（GitHub Pages）
│   ├── bridge/           # 本地桥接（Node.js）
│   └── desktop/          # 桌面端
├── scripts/              # Python 核心脚本
│   ├── svg_to_pptx.py
│   ├── svg_quality_checker.py
│   ├── visual_review.py
│   ├── audit_quality_proofs.py
│   └── ...
├── templates/
│   ├── presets/          # 预设包（4 stable + 4 seed）
│   ├── layouts/          # 版式模板
│   ├── brands/           # 品牌模板
│   ├── charts/           # 图表模板
│   └── icons/            # 图标库
├── examples/             # 公开 proof（4个starter）
├── references/           # Agent 参考文档
├── workflows/            # 工作流文档
├── docs/                 # 人类可读文档
└── tests/                # 测试
```
