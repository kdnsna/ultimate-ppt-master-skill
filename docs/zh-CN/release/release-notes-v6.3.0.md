# v6.3.0 发布边界：默认质量与公开 Proof

> **未发布草案。** 本文件定义拟发布、可独立回滚的 v6.3.0 边界；只有里程碑提交合并且 CI 通过后，才能创建 tag 和 GitHub Release。

拟发布的 v6.3.0 在 v6.2 闭环上增加默认质量合同与两个公开代表案例：

- `bestEffectBrief`、`promptQuality`、`recommendedRoute`、`decisionReason` 与 route source 写入 handoff；
- Web、Bridge 和 Python 使用同一组 52 条 Best-Effect fixture 做一致性检查；
- 三个正式办公场景使用确定页面角色、recipe、视觉方向和不连续三页重复布局的门禁；
- 公开一份 9 页脱敏经营复盘可编辑 PPTX，附原生对象、PPTLint 与质量报告；
- GPT-5.6「三种轨道」保留 9 页 Web Deck、390px 移动端证据和官方来源页。

回滚边界：公开 proof、路由元数据与方向合同可以整体回滚，不改变 v6.2 的本地产物 API。
