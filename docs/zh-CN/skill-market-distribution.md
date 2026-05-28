# Skill 市场分发

当你准备把 Ultimate PPT Master 放到 Skill 市场、Agent 目录或精选技能列表时，用这份清单检查。

## 上架定位

- 名称：Ultimate PPT Master / 终极融合PPT大师
- 分类：PPT 生成、可编辑 PPTX、Web Deck、办公效率
- 承诺：把资料整理成本地 handoff 项目，再生成经过质量检查的 PPTX 或杂志风 Web Deck。
- 主要用户：中文办公用户、咨询顾问、经营/运营负责人、培训讲师，以及需要可编辑交付物的 Agent 用户。
- 不是黑盒云生成器：源文件默认留在本地，除非用户明确选择其他路径。

## 必备上架资产

| 资产 | 来源 |
|---|---|
| 市场元数据 | `agents/openai.yaml` |
| 结构化上架合同 | `agents/marketplace-listing.json` |
| 小图标 | `assets/skill-market/ultimate-ppt-master-icon.svg` |
| 列表卡片 | `assets/skill-market/ultimate-ppt-master-card.svg` |
| 首次上手路径 | `README.zh-CN.md#60-秒开箱即用` |
| 证明案例 | `README.zh-CN.md#v25-案例动态展示`、`apps/web/public/benchmark/index.html` 和 `docs/zh-CN/quality-workbench-v2.5.md` |
| 安装说明 | `docs/agent-setup.md` |

## 市场文案

短文案：

> 从本地资料生成经过质量检查的 PPTX 和杂志风 Web Deck。

长文案：

> Ultimate PPT Master 帮助 Agent 把 PDF、Word、PPTX、Excel、URL 和零散笔记整理成可审查的演示项目。它支持可编辑 PowerPoint 和杂志风 Web Deck 输出，默认保持资料本地优先，并附带 Design Doctor 检查命令和公开 proof packs。

默认 prompt：

```text
Use $ultimate-ppt-master to turn my source material into a quality-checked PPTX or Web Deck with a visual review report.
```

## 上架门禁

- `agents/openai.yaml` 包含展示名、短描述、品牌色、图标和 `$ultimate-ppt-master` 默认 prompt。
- `agents/marketplace-listing.json` 同步调用方式、公开链接、证明案例和验收门禁，方便市场目录读取。
- README 首屏展示开箱路径、案例动图和 Skill 市场分发入口。
- Web Experience 展示开箱跑通、Design Doctor 视觉评分和公开 benchmark 案例墙。
- 每个 public proof pack 都有 source、生成输出、截图/封面和 `quality-report.json`。
- 发布检查继续运行 `npm run audit:presets`、`npm run audit:quality`、`npm run audit:market`、`npm run test:node`、`npm run test:worker`、`npm run build:web`。
- 正式推广前用 `npm run audit:market` 机器检查市场元数据、公开案例墙和上架资产。

## 分发注意事项

- 面向普通访客时，先推 Web Experience。
- 面向 Agent 市场时，先推 `$ultimate-ppt-master` 调用方式。
- 文案保持诚实：它是本地生产和质量复查工作流，不是托管式一键 PPT SaaS。
- 新增 stable preset 后，先加入公开案例墙，再拿去市场推广。
