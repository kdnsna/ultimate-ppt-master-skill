import type { DesktopJob, EnvironmentStatus, RecentProject, Recommendation, SourceInput, WorkerResult } from "../types";

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
const recentStorageKey = "ultimate-ppt-master.recent-projects";

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
  const recommendation = recommendFromSource(job.source);
  const now = new Date().toISOString();
  const result: WorkerResult = {
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
    outputMode: job.outputMode,
    stylePreset: job.stylePreset,
    createdAt: now,
    updatedAt: now,
    recommendations: [recommendation],
    checks: [
      { key: "local-first", label: "本地处理", status: "ok", detail: "浏览器预览不上传文件；原生桌面壳会写入本地项目目录。" },
      { key: "editable-output", label: "真实可编辑", status: job.outputMode === "pptx" ? "ok" : "warning", detail: "PPTX 路线保留可编辑交付，Web 路线优先演示体验。" },
      { key: "provider", label: "模型 Provider", status: "warning", detail: "浏览器预览不读取密钥；生产级生成请在本地环境配置 provider。" }
    ],
    nextActions: [
      { key: "open-result", label: "打开结果文件", detail: "检查预览和输出结构。", path: isWeb ? "outputs/index.html" : "outputs/ultimate-ppt-master-preview.pptx" },
      { key: "open-folder", label: "打开项目文件夹", detail: "查看 outputs、preview 和日志。", path: "~/UltimatePPTMasterProjects/browser-preview" },
      { key: "agent-handoff", label: "交给 Agent 深加工", detail: "使用 SKILL.md 进入生产级生成流程。", path: "~/UltimatePPTMasterProjects/browser-preview/README.md" }
    ],
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#fff8ec"/><path d="M-40 190C260 40 480 180 720 120C980 56 1120 194 1640 104" fill="none" stroke="#f97316" stroke-width="44" opacity=".16"/><text x="100" y="230" fill="#172033" font-family="Avenir Next, PingFang SC, sans-serif" font-size="78" font-weight="850">终极融合 PPT 大师</text><text x="100" y="330" fill="#667085" font-family="Avenir Next, PingFang SC, sans-serif" font-size="38">Desktop MVP Preview</text><text x="100" y="470" fill="#172033" font-family="Avenir Next, PingFang SC, sans-serif" font-size="36">${job.outputMode === "pptx" ? "可编辑 PPTX" : "杂志风网页 PPT"}</text></svg>`,
    previewHtml: isWeb
      ? `<!doctype html><html><body style="margin:0;font-family:PingFang SC, sans-serif;background:#fff8ec;color:#172033"><main style="height:100vh;display:grid;place-items:center"><section><p style="color:#f97316;font-weight:800">Ultimate PPT Master</p><h1 style="font-size:64px;margin:0">杂志风网页 PPT</h1><p style="font-size:24px;color:#667085">Browser preview mode</p></section></main></body></html>`
      : ""
  };
  result.thumbnailSvg = result.previewSvg;
  saveBrowserRecent(result, job.source.name || "Browser preview");
  return result;
}

export async function listRecentProjects(projectDir?: string): Promise<RecentProject[]> {
  if (isTauri()) {
    return invokeTauri<RecentProject[]>("list_recent_projects", { projectDir: projectDir || undefined });
  }
  const raw = window.localStorage.getItem(recentStorageKey);
  return raw ? JSON.parse(raw) : [];
}

export async function recommendJobSettings(source: SourceInput): Promise<Recommendation> {
  if (isTauri()) {
    return invokeTauri<Recommendation>("recommend_job_settings", { source });
  }
  return recommendFromSource(source);
}

export async function openProjectLog(path: string): Promise<void> {
  return openPath(path);
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

function saveBrowserRecent(result: WorkerResult, name: string) {
  const raw = window.localStorage.getItem(recentStorageKey);
  const items: RecentProject[] = raw ? JSON.parse(raw) : [];
  const next: RecentProject = {
    name,
    mode: result.outputMode || "pptx",
    path: result.projectPath,
    status: result.status === "complete" ? "complete" : "error",
    createdAt: result.createdAt || new Date().toISOString(),
    updatedAt: result.updatedAt || new Date().toISOString(),
    generatedFiles: result.generatedFiles,
    thumbnail: result.thumbnailSvg || result.previewSvg,
    logsPath: result.logsPath
  };
  window.localStorage.setItem(recentStorageKey, JSON.stringify([next, ...items].slice(0, 12)));
}

function recommendFromSource(source: SourceInput): Recommendation {
  const suffix = source.name?.split(".").pop()?.toLowerCase() || source.value.split(".").pop()?.toLowerCase() || "";
  const text = `${source.name || ""}\n${source.value}`.toLowerCase();
  if (source.kind === "url") {
    return { outputMode: "web", stylePreset: "editorial", pageRange: "6-10", reason: "URL 内容适合先做成可浏览的网页演示，便于快速预览和分享。" };
  }
  if (["pdf", "docx", "xlsx", "xlsm", "pptx"].includes(suffix)) {
    return { outputMode: "pptx", stylePreset: "business", pageRange: "8-14", reason: "正式资料优先生成真实可编辑 PPTX，便于交付后继续修改。" };
  }
  if (text.includes("swiss") || text.includes("工程") || text.includes("product") || text.includes("架构")) {
    return { outputMode: "web", stylePreset: "swiss", pageRange: "7-12", reason: "产品、工程和系统表达适合 Swiss Style 的网格与秩序。" };
  }
  if (text.includes("演讲") || text.includes("发布") || text.includes("分享") || text.includes("keynote")) {
    return { outputMode: "web", stylePreset: "editorial", pageRange: "8-12", reason: "演讲和发布场景更需要视觉记忆点，网页演示更有现场感。" };
  }
  if (text.includes("咨询") || text.includes("方案") || text.includes("strategy")) {
    return { outputMode: "pptx", stylePreset: "consulting", pageRange: "10-16", reason: "方案材料适合结论先行的咨询风，并保留 PPTX 可编辑交付。" };
  }
  if (text.includes("课程") || text.includes("培训") || text.includes("学术") || text.includes("论文")) {
    return { outputMode: "pptx", stylePreset: "academic", pageRange: "12-20", reason: "培训和学术内容需要章节清楚、证据稳定，PPTX 更适合二次讲授。" };
  }
  return { outputMode: "pptx", stylePreset: "business", pageRange: "8-12", reason: "默认走可编辑 PPTX，覆盖多数正式汇报和团队交付场景。" };
}
