# v6.1.0 发布说明

v6.1.0 是设计系统版本：把浅层换色预设升级为可执行视觉合同，扩展登记版式库，并用三套真正不同的完整 Deck 重建公开案例库。

## 白话更新栏

- 根目录新增 `DESIGN.md`，统一规定氛围、语义色、字体角色、组件语法、版式、层次、图片行为、反模式、响应式规则和 Agent 绘制前必须锁定的字段。
- 六套 v6 视觉方向全部补齐字体性格、构图模型、表面节奏、形状语法、图片策略、批准组件、响应式规则和方向专属 Agent Prompt。
- 页面配方库新增图像故事、统一证据网格、全幅产品舞台、单 KPI 页、直接标注原生图表、编辑引语、时间线、系统图和来源校勘页。
- 工作流先写完整标题序列，每页只确定一个视觉主角，提前规划表面节奏，使用标准图片比例，保留底部安全留白，并阻止连续重复布局。
- 方向选择卡和结构 Web Deck 预览会随所选方向改变字体、表面、构图与视觉母题，不再只换一个强调色。
- Web/Desktop 共用字体改为思源黑体、思源宋体、IBM Plex Sans 与 IBM Plex Mono 的角色栈；等宽体只承担技术元数据。
- 三套各 9 页的 AI 前沿案例分别重做为“证据精密、影像产品、编辑叙事”，同时重写文案、字号、案例库、预览图和 README 首图，并在真实浏览器中完成逐页检查。
- 生产纪律参考了 `awesome-design-md`、最新版 Guizang PPT Skill 和 Baoyu Design 主线；Ultimate PPT Master 保持原创方向，不复制第三方品牌身份或模板。

## 兼容性

- `project-brief.json`、`storyboard.json`、`asset_plan.json`、`quality-report.json`、Bridge handoff 和 `DeckSession` 阶段继续兼容 v6.0.0。
- v5.4.1 经典控制台在 v6 兼容周期内仍可通过 `?classic=1` 打开。
- PowerPoint 继续作为正式编辑环境；Web Deck 继续承担浏览器优先的叙事展示。

## 验证

```bash
npm run build:web
npm run build:desktop
npm run audit:v6-workspace
npm run audit:featured-decks
npm run audit:docs
npm run test:node
npm run test:worker
```
