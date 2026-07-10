# 发布说明 - v6.0.0

v6.0.0 把 Ultimate PPT Master 从“系统组件优先”的控制台升级为“用户任务优先”的本地演示文稿工作台。v5.4.1 的生产合同继续兼容，经典控制台保留一个版本周期，但默认入口已切换到 v6。

## 白话更新栏

- 首层只填写任务、真实资料或 URL、交付用途；Bridge、Provider、DeckIR、脚本和 JSON 进入诊断区。
- 先确认故事板，再开始生成。工作台能从“10 页”这类自然语言自动推断页数，最多补问三个关键问题，并为每页提供三种结构方案。
- 每次展示三个推荐方向，底层来自六套 v6 完整视觉包，覆盖封面、正文、数据、图表、图片、章节和结尾。
- 精修阶段按稳定 `slideId` 工作。单页换结构会写入 `revision-requests/Pxx.json`，不再要求整套重做。
- Bridge 用只读 SSE 推送进度；页面不可见时停止健康轮询。
- 相同本地资料通过 SHA-256 复用提取缓存；参考 PPT 导入保留稳定页 ID，并提取主题、字体、颜色、版式和占位符信息。
- 新增 PPTX 原生对象审计，可按交付预期验证文字、形状、图表、表格和备注仍是可编辑对象。
- Lucide 图标改为文件级导入；本轮机器上的 Web 生产构建从 1,573 个转换模块降至 69 个，v6 默认包与 Classic 独立拆分。

## 兼容策略

- `project-brief.json`、`storyboard.json`、`asset_plan.json`、`quality-report.json` 和现有 Bridge handoff 保持兼容。
- 统一 `DeckSession` 阶段为 `intake / outline / generating / review / delivered`。
- v5.4.1 经典控制台通过 `?classic=1` 保留一个版本周期。
- PowerPoint 仍是正式成品的主要编辑环境；Skill 负责工作流、来源、品牌和质量闭环。

## 验证命令

```bash
npm run build:web
npm run build:desktop
npm run audit:v6-workspace
npm run audit:web-console
npm run audit:image-contracts
npm run test:bridge
python3 scripts/audit_pptx_native_objects.py <final.pptx> --expect text,shape
```
