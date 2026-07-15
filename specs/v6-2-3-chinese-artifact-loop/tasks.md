# 实施任务

- [x] 1. 固化当前首屏、故事板和 README 基线
  - 保留实施基线中四个文件的用户改动。
  - 已保留原始改动；因实施开始时工作树已有混合修改，未伪造“基线单独提交”，转而在回滚说明中保留逻辑边界。
  - _Requirement: 1, 2_

- [x] 2. 贯通 DeckSession 与 DeckIR
  - 保留用户页面合同并补充真实证据、recipe 和编辑策略。
  - 支持 4-24 页与 Best-Effect 路由元数据。
  - _Requirement: 2_

- [x] 3. 完成本地产物与安全 API
  - 增加产物清单、下载、验证状态和 Agent 启动路径保护。
  - _Requirement: 3, 4_

- [x] 4. 完成 V6 生成闭环
  - 启动/复制 Agent、轮询产物、真实下载和交付门禁。
  - _Requirement: 3, 4_

- [x] 5. 切换中文公开入口
  - 中文 `README.md`、英文 `README.en.md`、兼容 `README.zh-CN.md`。
  - 中文 benchmark、SEO 与社交预览文案。
  - _Requirement: 1_

- [x] 6. 发布双案例 Proof
  - 脱敏正式办公 PPTX 与现有 AI Web Deck。
  - _Requirement: 1, 4_

- [ ] 7. 全量验证
  - 合同、安全、浏览器、构建、文档、PPTX 原生对象和渲染检查。
  - 自动化、桌面/移动浏览器、原生对象、PPTLint 与 LibreOffice 边界检查已完成；当前浅色圆角 PPTX 已在 WPS 完成 9/9 页逐页复核。PowerPoint 原生复核与本机 LibreOffice 中文渲染差异仍保持 warning，因此本项不标记为全部完成。
  - _Requirement: 1, 2, 3, 4_
