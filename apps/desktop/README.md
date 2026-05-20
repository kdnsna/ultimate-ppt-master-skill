# Ultimate PPT Master Desktop

轻量桌面壳 MVP：Tauri + React/TypeScript + 本地 Python worker。

核心入口保持三步：导入资料、选择 PPTX 或 Web Deck、生成本地项目。原生 Tauri 模式会接收真实文件拖拽路径；浏览器预览模式可直接读取 Markdown/TXT，PDF/DOCX/PPTX 等二进制文件需要粘贴绝对路径。

当前 UX 重点是“普通创作者一眼会用，专业用户一眼信任”：

- 首页只突出 3 步创作舱、信任 badge、最近项目和示例画廊。
- 创建页会按输入类型推荐输出模式、风格和页数区间。
- 项目页展示预览、输出文件、环境检查、日志和 Agent handoff。
- 最近项目来自真实 `desktop-manifest.json`，不是静态样例。

## Run the Web Shell

```bash
cd apps/desktop
npm install
npm run dev
```

## Build the Frontend

```bash
npm run build
```

## Run with Tauri

Rust is required for native Tauri commands and app packaging.

```bash
npm run tauri:dev
```

Build the native macOS app bundle:

```bash
npm run tauri:build
```

Create a DMG release package when Finder automation is available:

```bash
npm run tauri:build:dmg
```

The Python worker can also be tested directly:

```bash
python3 worker/desktop_worker.py inspect
```
