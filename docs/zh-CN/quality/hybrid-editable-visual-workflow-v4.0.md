# v4.0 混合可编辑视觉工作流

v4.0 为正式汇报 deck 增加了更严格的视觉生产契约：生成式图片可以提升页面观感，但不能替代 PPTX 正文页的可编辑内容模型。

## 核心规则

正式正文页按这个顺序生产：

```text
页面角色 -> 页面配方 -> 可编辑布局 -> 可选无文字视觉层 -> 审计
```

重要内容保持可编辑：标题、正文、数字、表格、图表、图解、logo 和二维码。

## 页面配方

Page recipes 会先定义一页幻灯片的结构任务，再进入页面绘制。它的作用是减少“每页都是卡片网格”的默认漂移。

常见配方包括：

- 首屏信号页
- 对比和取舍页
- 流程和交接页
- 指标和数据页
- 风险和提示页
- 行动和收束页

配方目录位于 `templates/page-recipes/index.json`。

## 视觉层

生成式视觉层只在支撑可编辑页面时使用：

- 无文字背景纹理
- 主题场景或氛围
- 不内嵌关键结论的设备或界面样机
- 小型插画、图标式支撑元素或材质细节
- 封面和章节页等明确以视觉为主的页面

生成式视觉层不得承载政策事实、业务数字、法律表述、客户指令、金额、二维码或需要可核验的品牌标识。

## Raster 策略

整页生成图只允许用于：

- 封面
- 章节页
- 尾页
- 海报/KV
- Web showcase
- 用户明确 override 且写入 `spec_lock.md` 的页面

正式正文页如果被整页 raster 图片替代，应在审计中失败。

## 必备文件

- `spec_lock.md`：锁定页面配方、视觉层和 raster 策略。
- `assets/generated/page-visuals/manifest.json`：记录生成或手动视觉层 prompts。
- `quality-report.json`：记录交付检查和剩余风险。

## 命令

```bash
python3 scripts/generate_visual_layers.py <project_path>
python3 scripts/audit_visual_recipes.py <project_path>
python3 scripts/audit_design_completion.py <project_path>
python3 scripts/audit_formal_delivery.py <project_path>
```

## 为什么重要

目标不是把幻灯片做成图片，而是让 deck 在真实办公场景中仍然可编辑，同时让每页都有明确视觉角色和足够的质感，避免模板化、卡片化、机械重复。
