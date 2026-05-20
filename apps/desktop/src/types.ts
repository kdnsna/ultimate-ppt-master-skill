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

export interface WorkerResult {
  status: "complete" | "error";
  projectPath: string;
  logsPath: string;
  generatedFiles: string[];
  steps: WorkerStep[];
  previewSvg?: string;
  previewHtml?: string;
  sourceName?: string;
  error?: string;
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
}

export interface RecentProject {
  name: string;
  mode: OutputMode;
  path: string;
  updatedAt: string;
}
