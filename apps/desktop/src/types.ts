export type ViewKey = "projects" | "create" | "preview" | "settings";
export type OutputMode = "pptx" | "web";
export type StylePreset = "business" | "consulting" | "academic" | "editorial" | "swiss";
export type SourceKind = "file" | "text" | "url" | "markdown";

export interface SourceInput {
  kind: SourceKind;
  value: string;
  name?: string;
}

export interface DesktopJob {
  source: SourceInput;
  outputMode: OutputMode;
  stylePreset: StylePreset;
  projectDir?: string;
  providerConfig?: Record<string, unknown>;
}

export interface WorkerStep {
  key: string;
  label: string;
  message: string;
  progress: number;
}

export interface Recommendation {
  outputMode: OutputMode;
  stylePreset: StylePreset;
  pageRange: string;
  reason: string;
}

export interface ProjectCheck {
  key: string;
  label: string;
  status: "ok" | "warning" | "missing";
  detail: string;
}

export interface NextAction {
  key: string;
  label: string;
  detail: string;
  path?: string;
}

export interface SourceExtraction {
  status: "extracted" | "copied" | "handoffRequired";
  detail: string;
  generatedMarkdownPath?: string;
}

export interface WorkerResult {
  status: "complete" | "error";
  projectPath: string;
  logsPath: string;
  generatedFiles: string[];
  steps: WorkerStep[];
  outputMode?: OutputMode;
  stylePreset?: StylePreset;
  createdAt?: string;
  updatedAt?: string;
  recommendations?: Recommendation[];
  checks?: ProjectCheck[];
  nextActions?: NextAction[];
  thumbnailSvg?: string;
  previewSvg?: string;
  previewHtml?: string;
  sourceName?: string;
  sourceExtraction?: SourceExtraction;
  error?: string;
}

export interface DesktopProjectManifest extends WorkerResult {
  projectPath: string;
  sourceName: string;
  outputMode: OutputMode;
  stylePreset: StylePreset;
  updatedAt: string;
}

export interface EnvironmentStatus {
  repoRoot: string;
  platform: string;
  python: {
    executable: string;
    version: string;
    bundledVenv: boolean;
    pythonPptx: boolean;
  };
  node: {
    available: boolean;
    npm: boolean;
    pnpm: boolean;
  };
  optional: {
    cairo: boolean;
    rust: boolean;
  };
  providers: {
    openai: boolean;
    gemini: boolean;
    qwen: boolean;
    pexels: boolean;
    pixabay: boolean;
  };
  config?: {
    envFile?: string | null;
    imageBackend?: string | null;
    llmProvider?: string | null;
    llmModel?: string | null;
    directLlmConfigured?: boolean;
  };
}

export interface RecentProject {
  name: string;
  mode: OutputMode;
  path: string;
  status: "complete" | "error" | "draft";
  createdAt: string;
  updatedAt: string;
  generatedFiles: string[];
  thumbnail?: string;
  logsPath?: string;
}
