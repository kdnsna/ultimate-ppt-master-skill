# Ultimate PPT Master v6.3.7 发布说明

> **GitHub 发布合同。** 本版本的机器状态为 `releaseStatus: github-released`。源码文件本身不能证明已经发布；权威证据是不变的 [`v6.3.7` tag 与 GitHub Release 页面](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.7)。GitHub Release 不会自动上架 marketplace，市场状态继续保持 `marketplaceStatus: independent-not-attested`。

[English release notes](../../release/release-notes-v6.3.7.md)

上一正式版本：[v6.3.6](./release-notes-v6.3.6.md)

## 白话更新栏

- 重新设计工作台、案例库、Showcase 和次级案例，使公开页面统一采用暖纸色、圆角容器、克制阴影与中文优先排版。
- 经营复盘案例从三页扩展为六页，补齐经营判断、风险、证据和下一步动作；咨询方案、产品路演和科技趋势案例统一为可横向翻页的轻量 Web Deck。
- AI 案例共享更完整的圆角、纸张纹理和导航体验，同时保持各自视觉方向。
- 修复案例库 1440px 桌面端横向溢出，避免装饰光晕撑宽页面。
- 修复中文大标题单字落行，扩大页码触控区，并为手机端固定页码预留底部安全区。
- 本次是公开展示与使用体验补丁，不新增云端、账号、数据库、模型 Provider 或编辑器能力。

## 发布合同

| 字段 | 合同 |
|---|---|
| 版本 | `6.3.7` |
| Git tag | `v6.3.7` |
| GitHub 发布机器状态 | `github-released` |
| 权威证据 | [`releases/tag/v6.3.7`](https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.7) |
| Marketplace 状态 | `independent-not-attested`；任何市场记录都需另行核验 |

## 验证合同

`v6.3.7` 指向的精确提交必须通过：

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:v6-workspace
npm run audit:web-bundle
npm run audit:featured-decks
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:worker
npm run test:web-browser
npm run build:web
npm run build:desktop
```

浏览器回归覆盖 1440×900 与 390×844 工作台、案例库、键盘/焦点、会话恢复、本地 Agent 状态以及真实产物下载合同。

## 独立回滚边界

回退 v6.3.7 提交即可撤销本轮公开页面、案例排版和版本语义，不需要移动或改写已经发布的 `v6.3.6` tag。若 v6.3.7 发布后需要修正，应发布新的补丁版本，不得重写 tag。

## 已知限制

- Web 主包仍接近 80KB gzip 预算上限，后续新增代码必须继续审计；
- 正式办公 PPTX 的 PowerPoint、LibreOffice 和字体可移植性限制延续 v6.3.6 的公开说明；
- GitHub 仓库社交预览图上传仍属于仓库外部设置；
- Pages 是否已经部署必须以 Actions 记录和线上 SHA 为准；
- GitHub Release 不会自动发布或更新 marketplace 列表。
