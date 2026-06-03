# 发布说明 - v3.0.0

v3.0.0 把 Ultimate PPT Master 从质量工作台升级成正式商务交付工作台。项目继续保持本地优先：Web 准备 brief，Bridge 写入本地 handoff 文件夹，Codex 或其他本地 Agent 结合 Skill 负责最终生产。

## 变化

- Web、Bridge、project brief、manifest、checklist 和待复查质量报告统一写入 `qualityGate.level = "formal-business"`。
- handoff 新增 Codex 优先文件：`asset-plan.md`、`visual-element-kit.md`、`codex-task.md`、`AGENTS.md` 和 `quality-report.json`。
- 新增 `scripts/generate_visual_element_kit.py`，作为 ChatGPT/OpenAI 小元素素材闭环的本地入口。
- 新增 `assets/generated/element-manifest.json`、`images/image_prompts.json` 和 `images/image_prompts.md` 作为生成状态产物。
- 未配置 image backend 或 OpenAI key 时，默认写出 `Needs-Manual` prompts，不阻塞交付。
- 新增 `scripts/audit_formal_delivery.py`，用于抓缺质量门禁、重复版式、缺图片/无图策略、PPTX 文本过少和碎片 logo。
- Web handoff 面板按顺序展示 Bridge 状态、本地项目路径、元素生成命令、Agent 命令和 fallback prompt 位置。

## 白话更新栏

- Codex 现在拿到的是一个能照着执行的文件夹，而不只是一段 prompt。
- ChatGPT 生图主要用于可复用小元素：章节分隔符、指标徽章、流程节点、连接线、图标点缀、低对比纹理和提示贴片。
- 生成图片负责增强视觉语言；正文、关键数字、图表和标签仍然保留为 PPTX/Web Deck 可编辑内容。
- 没有生图 key 也不是失败。系统会写出 `Needs-Manual` prompts，用户可以复制到 ChatGPT 生成并保存到指定路径。

## 证明矩阵

发布前运行：

```bash
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
npm run audit:presets
npm run audit:quality
npm run audit:market
git diff --check
```

Desktop 不是 v3.0.0 主发布面，但已同步打包用 worker 资源副本，避免后续 Tauri 打包和源码 worker 分叉。
