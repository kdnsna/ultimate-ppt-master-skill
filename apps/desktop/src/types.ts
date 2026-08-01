export type ViewKey = "projects" | "create" | "preserve" | "preview" | "settings";
export type OutputMode = "pptx" | "web";
export type StylePreset = "business" | "consulting" | "academic" | "editorial" | "swiss";
export type SourceKind = "file" | "text" | "url" | "markdown";
export type ModelProvider = "auto" | "openai" | "gemini" | "qwen" | "deepseek" | "custom";
export type ImageProvider = "auto" | "openai" | "gemini" | "qwen" | "pexels" | "pixabay" | "none";
export type VoiceProvider = "edge" | "elevenlabs" | "minimax" | "qwen" | "cosyvoice" | "none";

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
  providerConfig?: ProviderConfig;
  deckSession?: DeckSession;
}

export interface ProviderConfig {
  modelProvider: ModelProvider;
  textModelId?: string;
  imageProvider: ImageProvider;
  imageModelId?: string;
  narrationEnabled: boolean;
  voiceProvider: VoiceProvider;
  voiceId?: string;
  voiceRate?: string;
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
  providerConfig?: ProviderConfig;
  deckSession?: DeckSession;
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
    edgeTts?: boolean;
  };
  providers: {
    openai: boolean;
    gemini: boolean;
    qwen: boolean;
    deepseek: boolean;
    pexels: boolean;
    pixabay: boolean;
    elevenlabs: boolean;
    minimax: boolean;
    cosyvoice: boolean;
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

export interface PptxTablePreview {
  rowCount: number;
  colCount: number;
  rows: string[][];
}

export interface PptxChartPreview {
  chart: number;
  part: string;
  sampleValues: string[];
  valueCount: number;
}

export interface PptxSlideInfo {
  slide: number;
  texts: string[];
  tables?: PptxTablePreview[];
  charts?: PptxChartPreview[];
}

export interface PptxInspectResult {
  sourcePath: string;
  slideCount: number;
  slides: PptxSlideInfo[];
}

/** One typed package-preserving operation (mirrors preserve_edit_pptx ops). */
export type PreserveOperation =
  | { op: "replace_text"; old: string; new: string }
  | { op: "style_text"; match?: "all" | { text_contains?: string; text_equals?: string }; font?: string; size?: number; bold?: boolean; color?: string }
  | { op: "replace_table_cell"; row?: number; col?: number; find?: string; old?: string; text?: string; new?: string }
  | { op: "set_shape_geometry"; match: { index?: number; name?: string; text_contains?: string; text_equals?: string }; x?: number; y?: number; w?: number; h?: number }
  | { op: "replace_chart_text"; chart?: number | "all"; old: string; new: string }
  | { op: "set_chart_value"; chart?: number | "all"; series: number; point: number; value: number | string };

export interface PreserveEditStep {
  slide: number;
  replacements?: Record<string, string>;
  operations?: PreserveOperation[];
}

export interface PreserveEditRequest {
  sourcePath: string;
  outputPath?: string;
  edits: PreserveEditStep[];
}

export interface PreservePreview {
  kind: "svg" | "png" | "none";
  slide?: number;
  svg?: string;
  svgPath?: string;
  pngPath?: string | null;
  backend?: string | null;
  label?: string;
  error?: string;
}

export interface PreserveFidelityResult {
  status: "ok" | "fidelity-violation";
  safe: boolean;
  output: string;
  slideCount: number;
  requestedSlides: number[];
  changed: string[];
  unexpectedChanged: string[];
  added: string[];
  removed: string[];
  unchangedCount: number;
  /** Human-readable per-slide deltas from the engine (keys may be stringified). */
  slideChanges?: Record<string | number, string[]>;
  preview?: PreservePreview | null;
  memoPath?: string | null;
}

import type { DeckSession } from "../../../packages/workspace-core/src";
