# Ultimate PPT Master Desktop

轻量桌面壳 MVP：Tauri + React/TypeScript + 本地 Python worker。

核心入口保持三步：导入资料、选择 PPTX 或 Web Deck、生成本地项目。原生 Tauri 模式会接收真实文件拖拽路径；浏览器预览模式可直接读取 Markdown/TXT，PDF/DOCX/PPTX 等二进制文件需要粘贴绝对路径。

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

The Python worker can also be tested directly:

```bash
python3 worker/desktop_worker.py inspect
```
