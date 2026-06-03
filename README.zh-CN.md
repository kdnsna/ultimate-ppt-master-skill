# Ultimate PPT Master - 混合可编辑 AI PPT 工作台

> 面向中文办公场景的本地优先演示生产工具：把资料整理成可编辑 PPTX 或杂志风 Web Deck，并用 v4.0 页面配方、无文字生成式视觉层和交付审计守住可编辑性。

<p align="center">
  <strong>v4.0.0</strong> · <a href="./README.md">English README</a> · 中文 · <a href="./docs/zh-CN">中文文档</a> · <a href="./docs/guides/agent-connect-bridge.md">Agent Bridge</a> · <a href="./docs/guides/agent-setup.md">Agent Skill</a>
</p>

![Ultimate PPT Master Web Experience](assets/readme/hero.svg)

<p align="center">
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/"><strong>打开 Web Experience</strong></a>
  ·
  <a href="https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/"><strong>公开案例墙</strong></a>
  ·
  <a href="./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md"><strong>v4.0 工作流</strong></a>
  ·
  <a href="./docs/zh-CN/release/release-notes-v4.0.0.md"><strong>v4.0.0 说明</strong></a>
  ·
  <a href="./docs/zh-CN/strategy/skill-market-distribution.md"><strong>Skill 市场</strong></a>
</p>

<p align="center">
  <img alt="Version 4.0.0" src="https://img.shields.io/badge/Version-4.0.0-172033?style=for-the-badge">
  <img alt="Hybrid editable" src="https://img.shields.io/badge/4.0-Hybrid%20Editable-2563EB?style=for-the-badge">
  <img alt="Visual recipes" src="https://img.shields.io/badge/Page-Recipes-7C3AED?style=for-the-badge">
  <img alt="Editable PPTX" src="https://img.shields.io/badge/Output-Editable%20PPTX-B7472A?style=for-the-badge&logo=microsoft-powerpoint&logoColor=white">
  <img alt="Web Deck" src="https://img.shields.io/badge/Output-Web%20Deck-F97316?style=for-the-badge">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-172033?style=for-the-badge">
</p>

## 60 秒开箱即用

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run doctor
npm run bridge
```

然后打开 [Web Experience](https://kdnsna.github.io/ultimate-ppt-master-skill/)。没有 Bridge 时先看公开 demo 和案例墙；Bridge 在线时，可以本地解析资料并生成交给 Codex 或其他 Agent 的 handoff 文件夹。

| 需求 | 推荐路线 | 产出 |
|---|---|---|
| 正式汇报、咨询方案、培训课件、需要别人继续改的材料 | 可编辑 PPTX | 文字、形状、图表、表格、备注和质量检查都保留的 PowerPoint。 |
| 演讲、展示、发布会、demo day、杂志化表达 | Web Deck | 单文件浏览器演示，视觉节奏更强，适合快速分享预览。 |
| 同时要正式转发和现场演示 | 双版本交付 | PPTX 与 Web 项目分开生成，但共享资料和结构口径。 |

## v4.0 解决什么

v4.0 直面一个很现实的问题：很多 AI 生成 PPT 第一眼像样，但真正进入办公流转时，会暴露出重复、文字堆叠、不可编辑、整页截图化的问题。

Ultimate PPT Master 现在采用混合可编辑契约：

| 问题 | v4.0 答法 |
|---|---|
| 每页都变成卡片网格 | `templates/page-recipes/index.json` 先规定页面角色和结构。 |
| 生图把正文藏进图片里 | 正式正文页只允许无文字视觉支撑层。 |
| PPTX 交出去不好改 | 文案、数字、表格、图表、logo、二维码保持可编辑或可追溯。 |
| 文件完整性过了但观感仍重复 | `scripts/audit_visual_recipes.py` 拦截重复页面配方和正文页整页 raster 化。 |

工作流说明：[v4.0 混合可编辑视觉工作流](./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md)。

## 工作方式

```text
源资料
  -> Web Experience 或 Agent brief
  -> 本地 handoff 文件夹
  -> 页面角色和页面配方合同
  -> 可编辑 PPTX 或杂志风 Web Deck
  -> 必要时生成视觉层 prompts
  -> 正式交付审计和页面配方审计
```

v4.0 关键产物：

- `spec_lock.md`：锁定页面配方、视觉层和 raster 策略。
- `assets/generated/page-visuals/manifest.json`：记录生成或手动页面视觉 prompts。
- `quality-report.json`：记录交付检查和剩余风险。
- `scripts/generate_visual_layers.py`：准备页面级视觉层 prompts。
- `scripts/audit_visual_recipes.py`：检查页面配方重复和正文页 raster 策略。

## 证明材料

[公开案例墙](https://kdnsna.github.io/ultimate-ppt-master-skill/benchmark/) 保留合成 proof packs，用户不安装也能先判断产出。

| 证明 | 链接 |
|---|---|
| 稳定证明矩阵 | [v2.5 质量工作台](./docs/zh-CN/quality/quality-workbench-v2.5.md) |
| 正式 handoff 发布 | [发布说明 - v3.0.0](./docs/zh-CN/release/release-notes-v3.0.0.md) |
| 混合可编辑发布 | [发布说明 - v4.0.0](./docs/zh-CN/release/release-notes-v4.0.0.md) |
| Skill 市场准备 | [Skill 市场分发](./docs/zh-CN/strategy/skill-market-distribution.md) |

## 作为 Agent Skill 使用

可复制的 marketplace prompt：

```text
Use $ultimate-ppt-master to turn my source material into a quality-checked PPTX or Web Deck with a visual review report.
```

熟练用户可以直接安装 Skill：

```bash
bash -lc 'set -e; dir="$HOME/.codex/skills/ultimate-ppt-master"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git "$dir"; fi; cd "$dir"; npm run setup'
```

使用说明：[Agent Setup](./docs/guides/agent-setup.md)。本地连接器：[Agent Connect Bridge](./docs/guides/agent-connect-bridge.md)。

## 文档地图

| 需求 | 阅读 |
|---|---|
| 尝试网页入口 | [Web Experience](./docs/zh-CN/guides/web-experience.md) |
| 连接浏览器、本地资料和 Agent | [Agent Connect Bridge](./docs/zh-CN/guides/agent-connect-bridge.md) |
| 安装和调用 Skill | [Agent Setup](./docs/guides/agent-setup.md) |
| 选择 PPTX / Web Deck / Desktop | [Choosing a Workflow](./docs/guides/choosing-a-workflow.md) |
| 本地配置 provider key | [Model and Provider Setup](./docs/guides/model-provider-setup.md) |
| 理解 v4.0 视觉契约 | [v4.0 混合可编辑视觉工作流](./docs/zh-CN/quality/hybrid-editable-visual-workflow-v4.0.md) |
| 查看发布维护 | [Release and Maintenance](./docs/release/release-maintenance.md) |
| 排查安装或生成问题 | [Troubleshooting](./docs/guides/troubleshooting.md) |

完整地图：[docs/README.md](./docs/README.md)。中文地图：[docs/zh-CN/README.md](./docs/zh-CN/README.md)。

## 维护者检查

```bash
npm run audit:docs
npm run audit:presets
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

README 首页承诺必须和可执行检查绑定。凡是在首页宣传的能力，都应该有文档、脚本、测试、审计或公开证明材料支撑。
