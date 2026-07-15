# v6.3.3 候选说明：资料与证据真实性

> **未发布候选。** 本源码切片只定义审阅边界，不代表版本已发布。源码或 Pages 可见不证明已有独立 v6.3.3 tag、GitHub Release 或 marketplace 发布。

[English candidate notes](../../release/release-notes-v6.3.3.md)

## 白话更新栏

- 任务描述只用于策划，不再被当成事实证据。
- URL 必须等 Bridge 转换成功并记录 provenance 后才能算真实资料；未解析或失败的 URL 不能让任务进入生产就绪。
- 浏览器资料使用不碰撞 id，文件数量、单件体积与总体积超限时给出可恢复的行内错误。
- 同名附件获得不同磁盘名，Bridge 校验实际解码大小，不盲信浏览器声明。
- 刷新后 URL 元数据可恢复；不可持久化的本地文件明确标记“需重新选择”，并停止贡献 grounded 状态。

## 候选边界

本切片只负责 Web source-state 持久化、Bridge 输入/provenance 规则、附件命名/大小校验以及生产就绪证据分离。它依赖 v6.3.2 安全地基，不改变 DeckIR schema 版本。

## 发布前证据

- 真实 Web payload 到 Bridge 的集成测试；
- 无资料和 URL 未解析任务必须保持 `readyForProduction=false`；
- 两个同名文件可独立删除且不覆盖磁盘内容；
- 刷新恢复不得把已丢失本地字节的文件重新当成已验证证据。

## 独立回滚边界

将 source-state 模型、证据映射、URL 输入 handoff 以及附件防碰撞/限制作为一组回滚，同时保留 v6.3.2 请求、路径和 HMAC 守卫。已落盘附件不得被删除，回滚只能影响新输入行为。

版本化发布前应将本边界保留为独立提交或明确的 revert map。本文定义回滚点，但不断言对应 tag 存在或不存在。
