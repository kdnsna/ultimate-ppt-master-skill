# GitHub 技术扫描 - 2026 年 5 月

快照日期：2026-05-22。下面的 star 数来自本次发布准备时 GitHub 仓库 API 的实时结果，只作为趋势证据，不作为永久事实。

## 相关趋势

| 方向 | GitHub 信号 | 和 Ultimate PPT Master 的关系 | 产品动作 |
|---|---:|---|---|
| 资料转 Markdown | [microsoft/markitdown](https://github.com/microsoft/markitdown) - 约 124k stars | Agent 工作流正在把 Markdown 当作 PDF、Office、网页和媒体资料的交换格式。 | 继续把 `source.md`、`extracted-source.md` 和本地转换脚本作为交接主干；新增转换器必须保持本地优先。 |
| Agent 工具互操作 | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - 约 86k stars | MCP 这类工具 / 资源发现方式正在成为 Agent 复用本地能力的重要入口。 | 保持 `AGENTS.md`、`agents/openai.yaml`、Bridge `/health` 和固定 Skill 安装目标清晰；Bridge 契约稳定后再考虑 MCP wrapper。 |
| Slides-as-code | [slidevjs/slidev](https://github.com/slidevjs/slidev) - 约 46k stars；[marp-team/marp](https://github.com/marp-team/marp) - 约 12k stars | 开发者喜欢 Markdown deck，因为可 review、可版本管理、可复用。 | 把 `source.md`、`engine-plan.md` 和预设包保持为文本资产；后续导入 / 导出应把 Markdown 当作一等中间层。 |
| 可编辑 PPTX 生成 | [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS) - 约 5.4k stars | JavaScript 生成 PPTX 对浏览器和 Node 生态仍有价值。 | 保留可编辑 PPTX 作为核心承诺；除非有可编辑性回归测试，不替换现有 SVG-to-PPTX 质量路线。 |
| DOM-to-PPTX | [atharva9167j/dom-to-pptx](https://github.com/atharva9167j/dom-to-pptx) - 约 188 stars | HTML/DOM 转可编辑 PPTX 可能连接 Web Deck 预览和 PowerPoint 导出。 | 作为 Web Deck-to-PPTX 备选实验跟踪；晋级前必须验证渐变、文字可编辑、图片和版式保真。 |
| 开源 AI 演示产品 | [presenton/presenton](https://github.com/presenton/presenton) - 约 5.7k stars | 用户期待 AI 演示工具有可见 UI 和 API 式自动化，而不只是一个 prompt。 | 坚持本地优先定位：Web Experience 负责第一公里，Bridge 负责本地落盘，Skill 负责生产 QA；没有 worker adapter 和测试前不宣称托管生成。 |

## v2.4 产品判断

1. **预设包是复用单元。** 用户选一个场景，就应该得到 source 骨架、handoff prompt、模板候选和质量检查清单，而不是从空 prompt 开始。
2. **Markdown 继续做交换层。** 即使源资料是 PDF、DOCX、XLSX、PPTX 或 URL，Agent 面向的契约也应该是可检查的 Markdown + 原始附件。
3. **Bridge 继续保持小而本地。** 趋势指向工具互操作，但当前产品更需要让 Bridge 保持可理解：localhost health、资料落盘、provider readiness、安全 Skill 安装。
4. **Web 预览不是最终引擎。** Web Deck 预览帮助用户理解结果，最终 PPTX/HTML 质量仍由 Skill 工作流和本地检查保证。
5. **公开承诺必须有发布门禁。** README、Web Experience 或 preset catalog 里出现的能力，必须有测试、审计脚本或可见样板支撑。

## 后续决策

| 候选方向 | 决策 | 晋级条件 |
|---|---|---|
| MarkItDown adapter | 跟踪 | 本地依赖策略、转换 fallback 测试、隐私审查。 |
| MCP server wrapper | 跟踪 | Bridge API 稳定、tool schema、本地安装故事、至少一个 MCP Agent smoke test。 |
| Markdown deck import/export | 跟踪 | source 骨架、页面 roster、speaker notes、route metadata 的 round-trip 契约。 |
| Web Deck DOM-to-PPTX | 仅实验 | 文字 / 形状 / 图片可编辑性测试、桌面和移动端版式一致性、PowerPoint 兼容性。 |
| 托管 API 生成 deck | 暂缓 | worker adapter、provider key 隔离、队列 / 日志模型、公开安全说明。 |
