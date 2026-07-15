# v6.2-v6.3 技术与界面设计

## 模块边界

- `workspace-core`：保留 `deck-session-v6`，扩展确定性路由与 4-24 页故事板默认值。
- V6 Web：负责中文任务入口、故事板编辑、handoff、Agent 启动引导、产物轮询和下载。
- Bridge：负责本地资料处理、`DeckSession -> DeckIR` 合并、安全产物索引和附件下载。
- Public/Docs：以中文 README 和双案例 Proof 为公开主入口。

## 数据流

`DeckSession` 中的页面顺序、标题、takeaway、role 和 selected variant 是用户合同。Bridge 从实际提取资料创建 source claims，再将这些 claims 绑定到用户页面；只有用户未提供故事板时才使用现有规则规划器。

Bridge 只暴露 `exports/`、`ppt/` 和质量报告白名单。Web 在 generating/review 阶段且页面可见时每 3 秒查询一次产物；刷新后使用持久化的 `projectPath` 继续查询。

## 公共接口

- `GET /projects/artifacts?projectPath=<handoff>`：返回安全产物清单与验证状态。
- `GET /projects/artifacts/file?projectPath=<handoff>&artifact=<relative-path>`：下载一项白名单产物。
- `POST /agent/launch`：保持输入输出兼容，增加 handoff 路径验证。

产物类型为 `pptx | web-deck | pdf | archive | report`，验证状态为 `pending | passed | warning | blocked`。

## 视觉合同

- 方向：Editorial/Magazine。
- 色彩：`#F6F3ED`、`#171714`、`#1D4ED8`、`#D9573B`、`#73866C`。
- 字体：Noto Sans SC、Noto Serif SC、IBM Plex Sans、IBM Plex Mono。
- 构图：12 栏非对称网格，任务入口优先，Proof 第二，诊断信息按需展开。

## 兼容与安全

- 不升级 `deck-session-v6` 或 DeckIR `1.0` schema；新增字段均为可选或 Bridge 补齐。
- 所有项目与产物路径先 realpath，再验证位于配置根目录内；拒绝 traversal、外部 symlink 和源资料目录。
- Classic 在本轮冻结但保持懒加载兼容。
