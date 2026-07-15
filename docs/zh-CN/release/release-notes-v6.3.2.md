# v6.3.2 候选说明：视觉纠偏与安全地基

> **未发布候选。** 本文仅定义源码层的里程碑边界。它出现在 `main` 或 Pages 上，不能证明已有独立 v6.3.2 tag、GitHub Release 或 marketplace 发布；不得将本文当作公开发布证据。

[English candidate notes](../../release/release-notes-v6.3.2.md)

## 白话更新栏

- 工作台与成品库默认从大面积黑色改为暖纸底，主操作改用证据蓝。
- 必要容器统一使用 12/18/24px 圆角尺度；图表、表格与证据规则线仍保持精确直线。
- 正式办公封面默认使用浅色，只有用户明选或真实品牌方向需要时才使用深色舞台。
- Bridge 明确拒绝非法 Origin、错误 JSON Content-Type、超限请求、路径越界、外部符号链接和被篡改 manifest。
- 旧视觉方向标识迁移到六套 v6 注册合同，任意方向不再进入生产元数据。

## 候选边界

本切片只负责 Warm Paper UI token 与公开视觉面、v6 方向注册/迁移，以及 Bridge 请求、路径和 HMAC 地基。它不包含后续资料真实性、会话交付、单页精修或发布候选收口。

## 发布前证据

- 1440px 与 390px 视觉验收；
- Origin、Content-Type、413、路径越界、符号链接与 manifest 篡改回归测试；
- Web/Desktop 构建与公开版本标记一致；
- PowerPoint/WPS/LibreOffice 尚未完成的人工检查必须继续保持 warning/pending。

## 独立回滚边界

将 Warm Paper token/表面、注册方向迁移、Bridge 请求/路径/HMAC 守卫作为一个整体回滚；保留 `deck-session-v6`、DeckIR 1.0 和 v6.3.1 产物合同。回滚不得删除后续用户项目，也不得把未签名 handoff 改写为可信项目。

将它视为逻辑回滚边界。版本化发布应通过独立可审阅提交或明确的 revert map 保留该边界，以便不回退 v6.3.3–v6.3.6 就能独立撤回；本说明不证明独立发布产物已存在。
