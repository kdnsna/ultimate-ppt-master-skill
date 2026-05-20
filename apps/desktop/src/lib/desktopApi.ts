import type { DesktopJob, EnvironmentStatus, WorkerResult } from "../types";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

interface TauriEnvelope<T> {
  ok: boolean;
  data: T;
}

const isTauri = () => Boolean(window.__TAURI_INTERNALS__);

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  const response = await invoke<TauriEnvelope<T>>(command, args);
  return response.data;
}

export async function inspectEnvironment(): Promise<EnvironmentStatus> {
  if (isTauri()) {
    return invokeTauri<EnvironmentStatus>("inspect_environment");
  }
  return {
    repoRoot: "Browser preview mode",
    platform: navigator.platform,
    python: {
      executable: ".venv/bin/python",
      version: "preview",
      bundledVenv: true,
      pythonPptx: true
    },
    node: {
      available: true,
      npm: true,
      pnpm: true
    },
    optional: {
      cairo: false,
      rust: false
    },
    providers: {
      openai: false,
      gemini: false,
      qwen: false,
      pexels: false,
      pixabay: false
    }
  };
}

export async function runDesktopJob(job: DesktopJob): Promise<WorkerResult> {
  if (isTauri()) {
    return invokeTauri<WorkerResult>("run_desktop_job", { job });
  }
  await delay(900);
  const isWeb = job.outputMode === "web";
  return {
    status: "complete",
    projectPath: "~/UltimatePPTMasterProjects/browser-preview",
    logsPath: "~/UltimatePPTMasterProjects/browser-preview/logs/desktop-worker.log",
    generatedFiles: isWeb
      ? ["outputs/index.html", "README.md"]
      : ["outputs/ultimate-ppt-master-preview.pptx", "preview/cover.svg", "README.md"],
    steps: [
      { key: "source", label: "资料处理", message: "读取源资料并创建本地项目。", progress: 14 },
      { key: "strategy", label: "策略整理", message: "提取标题、关键句和页面骨架。", progress: 32 },
      { key: "design", label: "设计锁定", message: "应用输出模式和风格预设。", progress: 50 },
      { key: "generate", label: "生成预览", message: "生成可预览文件。", progress: 74 },
      { key: "verify", label: "校验", message: "检查输出路径、预览内容和日志。", progress: 90 },
      { key: "export", label: "导出", message: "保存结果并写入项目清单。", progress: 100 }
    ],
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#fff8ec"/><path d="M-40 190C260 40 480 180 720 120C980 56 1120 194 1640 104" fill="none" stroke="#f97316" stroke-width="44" opacity=".16"/><text x="100" y="230" fill="#172033" font-family="Avenir Next, PingFang SC, sans-serif" font-size="78" font-weight="850">终极融合 PPT 大师</text><text x="100" y="330" fill="#667085" font-family="Avenir Next, PingFang SC, sans-serif" font-size="38">Desktop MVP Preview</text><text x="100" y="470" fill="#172033" font-family="Avenir Next, PingFang SC, sans-serif" font-size="36">${job.outputMode === "pptx" ? "可编辑 PPTX" : "杂志风网页 PPT"}</text></svg>`,
    previewHtml: isWeb
      ? `<!doctype html><html><body style="margin:0;font-family:PingFang SC, sans-serif;background:#fff8ec;color:#172033"><main style="height:100vh;display:grid;place-items:center"><section><p style="color:#f97316;font-weight:800">Ultimate PPT Master</p><h1 style="font-size:64px;margin:0">杂志风网页 PPT</h1><p style="font-size:24px;color:#667085">Browser preview mode</p></section></main></body></html>`
      : ""
  };
}

export async function subscribeNativeFileDrop(onDrop: (paths: string[]) => void): Promise<() => void> {
  if (!isTauri()) {
    return () => undefined;
  }
  const { getCurrentWebview } = await import("@tauri-apps/api/webview");
  const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type === "drop") {
      onDrop(event.payload.paths);
    }
  });
  return unlisten;
}

export async function openPath(path: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_path", { path });
    return;
  }
  console.info("Open path requested:", path);
}
