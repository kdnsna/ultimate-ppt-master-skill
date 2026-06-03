# 发布说明 - v4.1.0

v4.1.0 聚焦 Web Experience 控制台体验。本次不重写 PPT 生成管线，而是把现有本地优先工作流改得更容易操作：减少可见选择，减少重复按钮，减少首屏技术负担。

## 重点变化

- 用四步控制台替代原来的五页工作区导航：准备任务、添加资料、连接本机、生成交付。
- 新增状态驱动主按钮，让页面始终只暴露一个推荐下一步。
- 设置检测、模型账号状态、Skill 安装、案例墙、术语表和生成文件详情都移入抽屉或折叠区。
- 预览文件改成用户预览、AI 助手文件、质量报告三组，不再把 11 个工程文件并排展示。
- 新增 `scripts/audit_web_console.py` 和 `npm run audit:web-console`，防止 v3 文案、旧五格导航、未分组预览或 v4.1 控制台组件缺失等问题回流。

## 白话更新栏

- 网页端现在应该更像“操作台”，而不是“功能展示页”。
- 用户打开页面后，正常情况下只需要跟着一个主按钮走。
- 高级设置仍然保留，但不再和第一次使用路径抢注意力。
- v4.0 仍然是生成质量契约：页面配方、正文可编辑、无文字生成式视觉层等规则保持不变。

## 发布检查

```bash
npm run audit:docs
npm run audit:web-console
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

Bridge API、handoff payload、本地项目包文件、桌面端构建行为和 Agent Skill 调用方式均与 v4.0.0 保持兼容。
