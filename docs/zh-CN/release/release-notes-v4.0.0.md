# 发布说明 - v4.0.0

v4.0.0 将此前的 4.0 能力层正式收口为 Ultimate PPT Master 的发布主线。核心变化是 **混合可编辑视觉生成**：正式 PPTX 页面继续保持可编辑，生成式图片只作为无文字视觉支撑层。

## 重点变化

- 页面生成前先由 page recipes 定义结构角色。
- 视觉层可以作为背景、纹理、设备样机或插画支撑，但不能把正式正文页整页图片化。
- `spec_lock.md` 可以锁定 `page_recipes`、`visual_layers` 和 `raster_policy`，防止页面退回重复卡片网格。
- `scripts/generate_visual_layers.py` 会写出页面级视觉 prompts 和 `assets/generated/page-visuals/manifest.json`。
- `scripts/audit_visual_recipes.py` 会拦截重复页面配方，以及正式正文页整页 raster 化。
- 仓库文档改为 `docs/guides`、`docs/quality`、`docs/release`、`docs/strategy` 四类信息架构。

## 白话更新栏

- 这次升级直接面向“AI 做出来的 PPT 太丑、太重复、不可编辑”这个问题。
- 新默认不是“每页生成一张好看的截图”，而是“先定页面结构，关键内容保持可编辑，图片只在提升观感的位置介入”。
- 封面、章节页、尾页、海报/KV、明确展示页仍可使用整页生成图。
- 正式正文页的文字、数字、表格、图表、logo 和二维码必须保持可编辑或可溯源。

## 发布检查

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

## 兼容性

旧公开文档 URL 至少保留一个 release 周期的 moved stub。新增链接应指向分类后的 canonical 文档。
