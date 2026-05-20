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
    repoRoot: "Browser diagnostic mode (no local worker)",
    platform: navigator.platform,
    python: {
      executable: "Not available in browser preview",
      version: "browser diagnostic",
      bundledVenv: false,
      pythonPptx: false
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
  await delay(300);
  throw new Error("Browser diagnostic mode cannot run the Python worker or write PPTX/HTML files. Start the native desktop app with `npm run desktop` or `npm run app:desktop`.");
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
