# v6.3.2–v6.3.6 实施任务

## 0. 基线与审计

- [x] 读取 v6 项目技能、spec-workflow、UI Design、Web Development 与浏览器测试规范。
- [x] 运行 Web/Desktop build、Node/Python 测试、现有审计、npm audit 与 Rust check。
- [x] 审计 Web UX/可访问性、Bridge/安全、README/Proof/发布一致性。
- [x] 对照 `gzh-design-skill` 与 PPT Master，记录只借鉴方法、不复制 AGPL 代码的边界。

## 1. v6.3.2 · 视觉纠偏与安全地基

- [x] 将工作台和案例库统一为 Warm Paper UI，默认 CTA 改为证据蓝。
- [x] 将面板、输入、按钮和案例主卡迁移到 12/18/24px 圆角体系。
- [x] 移除自动满版墨黑封面；深色方向改为显式选择或真实场景触发。
- [x] Bridge 拒绝非法 Origin 与非 JSON 变更请求。
- [x] 建立单一项目内安全路径解析器并修复 prompt 越界写入。
- [x] 让超限请求稳定返回 413 JSON。
- [x] 修复 Desktop clippy 和根包 module/engine 警告。
- [x] 补非法 Origin、Content-Type、path traversal、413 回归测试。
- [x] 对完整 `manifest.json` 启用 HMAC 签名，Artifact、Agent 与单页修订共用同一验证边界。
- [x] 将旧视觉方向迁移到六套注册合同，拒绝未注册方向进入生产合同。

## 2. v6.3.3 · 资料与证据真实性

- [x] 分离 taskContext 与 evidenceSources，修复无资料却 grounded。
- [x] 将 URL 交给 Bridge 转换，并在成功前保持 pending/partial。
- [x] 为 source 生成唯一 id；加入文件数量、单文件与累计体积限制。
- [x] 同名附件使用唯一磁盘名并验证解码大小。
- [x] 刷新后 URL 可恢复、本地文件明确要求重新选择。
- [x] 补真实 Web payload → Bridge 集成测试。

## 3. v6.3.4 · 会话与交付真实性

- [x] 为 handoff/SSE 增加 sessionId 隔离与 Web 二次过滤。
- [x] 使用随机唯一项目目录并验证 120 并发无碰撞。
- [x] Agent 启动增加项目级幂等与可观察状态。
- [x] `canDeliver` 限定最终成品类型，report 不再充当成品。
- [x] 产物采用 `.partial` + 原子 rename；质量报告绑定 path/hash。
- [x] 限制 artifact 扫描深度、数量与零字节文件。

## 4. v6.3.5 · 精修与运行可靠性

- [x] 单页修订验证 slideId/variant 并保留历史。
- [x] 轮询改为单飞、可取消、可见页运行、交付后停止。
- [x] 增加 radio 方向键/roving tabindex。
- [x] 增加 dialog 焦点陷阱、Escape 与返回焦点。
- [x] reduced-motion 下禁用平滑滚动。
- [x] 所有 Bridge/URL/修订错误提供中文行内状态。
- [x] Classic 返回链接使用 `BASE_URL`；Desktop 保持合同兼容。
- [x] 手动 Agent 命令始终可见、可选中，剪贴板失败时不再静默。

## 5. v6.3.6 · 验证与 GitHub 发布

- [x] 补 1440/390 真实浏览器回归与视觉截图。
  - 工作台与 `/benchmark/` 均覆盖 1440×900 / 390×844 的横向溢出和主操作可达性；案例库移动端两个代表成品操作收为单列。
- [x] 补双标签页、刷新恢复、六种运行状态与键盘回归。
  - `npm run test:web-browser` 真实驱动 Chrome，覆盖 1440×900 / 390×844、legacy 会话迁移、双标签页隔离、刷新恢复、六状态唯一主操作、radio Home/End/方向键、dialog 焦点环、hidden polling 与 reduced-motion。
- [x] 补完整攻击矩阵、并发矩阵和 allowLaunch 测试。
- [x] 对齐 6.3.2–6.3.5 中英文未发布候选切片、v6.3.6 发布说明、回滚边界和全部公开版本号。
- [x] 校准 README、案例库、Proof、OG、sitemap 与文档链接。
- [x] 运行 Web/Desktop build、Node/Python/Rust、质量、文档、console 与安全审计。
- [x] 验证 Web 主入口小于 80KB gzip。
- [x] WPS 已完成 9/9 页人工复核；PowerPoint 与 LibreOffice 中文渲染未完成项继续保持 warning，不用 WPS 结论代替。
- [x] 通过 GitHub Markdown Rendering API 验证中英文 README，并补 Pages 发布后 smoke 检查。

## 6. 发布

- [ ] 每个版本可独立提交、打标签与回滚。
- [x] 只有 CI 通过的 `main` 才允许 Pages 部署。
- [x] 用户已授权本轮完成后推送 `main`，并创建 `v6.3.6` tag 与 GitHub Release；marketplace 发布仍不在本次授权范围内。
- [x] v6.3.6 源码发布合同使用 `github-released`，且明确只以 tag/GitHub Release 页面为权威证据。
