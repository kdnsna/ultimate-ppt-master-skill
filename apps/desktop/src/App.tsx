import {
  Activity,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderOpen,
  Image,
  MonitorPlay,
  PanelRight,
  Play,
  Settings,
  Sparkles,
  Upload,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { inspectEnvironment, openPath, runDesktopJob, subscribeNativeFileDrop } from "./lib/desktopApi";
import type {
  DesktopJob,
  EnvironmentStatus,
  OutputMode,
  RecentProject,
  SourceKind,
  StylePreset,
  ViewKey,
  WorkerResult,
  WorkerStep
} from "./types";

const styleOptions: Array<{ key: StylePreset; title: string; detail: string }> = [
  { key: "business", title: "商务汇报", detail: "稳重、清晰、适合周报和高管同步" },
  { key: "consulting", title: "咨询风", detail: "结论先行、图表优先、适合方案交付" },
  { key: "academic", title: "学术/培训", detail: "章节明确、证据优先、适合课程和答辩" },
  { key: "editorial", title: "电子杂志", detail: "叙事强、视觉松弛、适合分享和演讲" },
  { key: "swiss", title: "Swiss Style", detail: "网格、秩序、适合产品和工程表达" }
];

const navItems: Array<{ key: ViewKey; label: string; icon: typeof Sparkles }> = [
  { key: "projects", label: "Projects", icon: Sparkles },
  { key: "create", label: "Create", icon: Wand2 },
  { key: "preview", label: "Preview", icon: MonitorPlay },
  { key: "settings", label: "Settings", icon: Settings }
];

const initialRecent: RecentProject[] = [
  {
    name: "v2.0.0 产品介绍",
    mode: "web",
    path: "projects/desktop/demo-web",
    updatedAt: "刚刚"
  },
  {
    name: "季度汇报样例",
    mode: "pptx",
    path: "projects/desktop/demo-pptx",
    updatedAt: "今天"
  }
];

const progressSeed: WorkerStep[] = [
  { key: "source", label: "资料处理", message: "等你导入资料。", progress: 0 },
  { key: "strategy", label: "策略整理", message: "生成时会整理故事线。", progress: 0 },
  { key: "design", label: "设计锁定", message: "生成时会应用风格预设。", progress: 0 },
  { key: "generate", label: "生成预览", message: "生成时会创建可打开的输出文件。", progress: 0 },
  { key: "verify", label: "校验", message: "生成时会检查输出结果。", progress: 0 },
  { key: "export", label: "导出", message: "生成后会保存项目清单。", progress: 0 }
];

export function App() {
  const [view, setView] = useState<ViewKey>("projects");
  const [sourceKind, setSourceKind] = useState<SourceKind>("markdown");
  const [sourceValue, setSourceValue] = useState(sampleMarkdown);
  const [sourceName, setSourceName] = useState("product-brief.md");
  const [outputMode, setOutputMode] = useState<OutputMode>("pptx");
  const [stylePreset, setStylePreset] = useState<StylePreset>("business");
  const [projectDir, setProjectDir] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<WorkerStep[]>(progressSeed);
  const [result, setResult] = useState<WorkerResult | null>(null);
  const [environment, setEnvironment] = useState<EnvironmentStatus | null>(null);
  const [recent, setRecent] = useState<RecentProject[]>(initialRecent);
  const [error, setError] = useState("");

  useEffect(() => {
    inspectEnvironment()
      .then(setEnvironment)
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    let cleanup: () => void = () => undefined;
    let active = true;

    subscribeNativeFileDrop((paths) => {
      const path = paths[0];
      if (!path) return;
      setError("");
      setSourceKind("file");
      setSourceValue(path);
      setSourceName(fileNameFromPath(path));
    })
      .then((unlisten) => {
        if (active) {
          cleanup = unlisten;
        } else {
          unlisten();
        }
      })
      .catch((err) => console.info("Native file drop is not available in browser preview:", err));

    return () => {
      active = false;
      cleanup();
    };
  }, []);

  const progress = useMemo(() => Math.max(...steps.map((step) => step.progress), 0), [steps]);

  async function handleGenerate() {
    setError("");
    setIsGenerating(true);
    setView("preview");
    setResult(null);
    setSteps(progressSeed.map((step) => ({ ...step, progress: 0 })));

    const job: DesktopJob = {
      source: {
        kind: sourceKind,
        value: sourceValue,
        name: sourceName
      },
      outputMode,
      stylePreset,
      projectDir: projectDir || undefined,
      providerConfig: {}
    };

    const stagedSteps = progressSeed.map((step, index) => ({
      ...step,
      message: ["读取源资料。", "整理信息结构。", "应用风格预设。", "生成本地文件。", "检查结果。", "写入项目清单。"][index],
      progress: [12, 30, 48, 68, 86, 96][index]
    }));

    for (const staged of stagedSteps.slice(0, 4)) {
      setSteps((current) => current.map((step) => (step.key === staged.key ? staged : step)));
      await wait(180);
    }

    try {
      const nextResult = await runDesktopJob(job);
      setResult(nextResult);
      setSteps(nextResult.steps);
      setRecent((items) => [
        {
          name: sourceName || "Untitled project",
          mode: outputMode,
          path: nextResult.projectPath,
          updatedAt: "刚刚"
        },
        ...items
      ].slice(0, 6));
    } catch (err) {
      setError(humanizeError(err));
      setSteps((current) =>
        current.map((step) =>
          step.key === "verify"
            ? { ...step, message: "生成失败，项目状态已保留。", progress: Math.max(step.progress, 70) }
            : step
        )
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files.item(0);
    if (!file) return;
    const nativePath = getDroppedFilePath(file);
    setSourceName(fileNameFromPath(nativePath || file.name));
    const suffix = file.name.split(".").pop()?.toLowerCase();
    if (suffix === "md" || suffix === "markdown") {
      setSourceKind("markdown");
      file.text().then(setSourceValue).catch(() => setSourceValue(file.name));
      return;
    }
    if (suffix === "txt") {
      setSourceKind("text");
      file.text().then(setSourceValue).catch(() => setSourceValue(file.name));
      return;
    }
    setSourceKind("file");
    setSourceValue(nativePath || file.name);
    if (!nativePath) {
      setError("浏览器预览无法读取二进制文件的绝对路径；原生 Tauri 壳可直接拖入，或在这里粘贴文件绝对路径。");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <div className="brand-sigil">UP</div>
          <div>
            <strong>终极融合 PPT 大师</strong>
            <span>Desktop MVP</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={view === item.key ? "nav-item active" : "nav-item"}
                onClick={() => setView(item.key)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="status-tile">
          <Activity size={18} />
          <div>
            <strong>{environment?.python.bundledVenv ? "本地环境已识别" : "等待环境初始化"}</strong>
            <span>{environment?.repoRoot || "Inspecting workspace..."}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        {view === "projects" && (
          <ProjectsView recent={recent} onCreate={() => setView("create")} onOpenPreview={() => setView("preview")} />
        )}
        {view === "create" && (
          <CreateView
            sourceKind={sourceKind}
            sourceValue={sourceValue}
            sourceName={sourceName}
            outputMode={outputMode}
            stylePreset={stylePreset}
            projectDir={projectDir}
            isGenerating={isGenerating}
            onSourceKindChange={setSourceKind}
            onSourceValueChange={setSourceValue}
            onSourceNameChange={setSourceName}
            onOutputModeChange={setOutputMode}
            onStylePresetChange={setStylePreset}
            onProjectDirChange={setProjectDir}
            onDrop={handleDrop}
            onGenerate={handleGenerate}
          />
        )}
        {view === "preview" && (
          <PreviewView
            steps={steps}
            progress={progress}
            result={result}
            error={error}
            isGenerating={isGenerating}
            outputMode={outputMode}
            onGenerate={handleGenerate}
          />
        )}
        {view === "settings" && <SettingsView environment={environment} projectDir={projectDir} onProjectDirChange={setProjectDir} />}
      </main>
    </div>
  );
}

function getDroppedFilePath(file: File): string {
  const maybePath = file as File & { path?: string };
  return maybePath.path || file.webkitRelativePath || "";
}

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || path || "source";
}

function ProjectsView({
  recent,
  onCreate,
  onOpenPreview
}: {
  recent: RecentProject[];
  onCreate: () => void;
  onOpenPreview: () => void;
}) {
  return (
    <section className="screen projects-screen">
      <div className="hero-panel">
        <p className="eyebrow">Ultimate PPT Master Desktop</p>
        <h1>把真实资料拖进去，生成能交付的演示文稿。</h1>
        <p className="hero-copy">第一版只保留三个动作：导入资料、选择输出、生成与导出。复杂能力留在项目详情里慢慢展开。</p>
        <div className="hero-actions">
          <button className="primary-action" onClick={onCreate}>
            <Upload size={19} />
            新建演示
          </button>
          <button className="secondary-action" onClick={onOpenPreview}>
            <MonitorPlay size={18} />
            查看预览
          </button>
        </div>
      </div>

      <section className="recent-section" aria-labelledby="recent-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent</p>
            <h2 id="recent-title">最近项目</h2>
          </div>
          <button className="text-button" onClick={onCreate}>
            新建 <ChevronRight size={16} />
          </button>
        </div>
        <div className="project-list">
          {recent.map((project) => (
            <article className="project-row" key={`${project.path}-${project.updatedAt}`}>
              <div className="project-icon">{project.mode === "pptx" ? <FileText size={20} /> : <MonitorPlay size={20} />}</div>
              <div>
                <strong>{project.name}</strong>
                <span>{project.path}</span>
              </div>
              <small>{project.mode === "pptx" ? "PPTX" : "Web Deck"} · {project.updatedAt}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function CreateView(props: {
  sourceKind: SourceKind;
  sourceValue: string;
  sourceName: string;
  outputMode: OutputMode;
  stylePreset: StylePreset;
  projectDir: string;
  isGenerating: boolean;
  onSourceKindChange: (value: SourceKind) => void;
  onSourceValueChange: (value: string) => void;
  onSourceNameChange: (value: string) => void;
  onOutputModeChange: (value: OutputMode) => void;
  onStylePresetChange: (value: StylePreset) => void;
  onProjectDirChange: (value: string) => void;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="screen create-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Create</p>
          <h1>三步生成</h1>
        </div>
        <button className="primary-action compact" onClick={props.onGenerate} disabled={props.isGenerating || !props.sourceValue.trim()}>
          <Play size={17} />
          {props.isGenerating ? "生成中" : "生成"}
        </button>
      </div>

      <div className="create-grid">
        <section className="input-panel">
          <div className="panel-title">
            <Upload size={18} />
            <span>1. 导入资料</span>
          </div>
          <label
            className="drop-zone"
            onDrop={props.onDrop}
            onDragOver={(event) => event.preventDefault()}
          >
            <Upload size={26} />
            <strong>拖入 Markdown / TXT，或手动填写路径、URL、文本</strong>
            <span>PDF / DOCX / XLSX / PPTX 会进入项目目录，完整解析由后续 Agent 工作流接管。</span>
          </label>
          <div className="segmented">
            {(["markdown", "text", "url", "file"] as SourceKind[]).map((kind) => (
              <button
                key={kind}
                className={props.sourceKind === kind ? "selected" : ""}
                onClick={() => props.onSourceKindChange(kind)}
              >
                {kind}
              </button>
            ))}
          </div>
          <input
            className="field"
            value={props.sourceName}
            onChange={(event) => props.onSourceNameChange(event.target.value)}
            placeholder="项目或源文件名称"
          />
          <textarea
            className="source-editor"
            value={props.sourceValue}
            onChange={(event) => props.onSourceValueChange(event.target.value)}
            placeholder="粘贴 Markdown、文本、URL，或填写本地文件路径"
          />
        </section>

        <section className="choice-panel">
          <div className="panel-title">
            <PanelRight size={18} />
            <span>2. 选择输出</span>
          </div>
          <div className="mode-switch">
            <button className={props.outputMode === "pptx" ? "selected" : ""} onClick={() => props.onOutputModeChange("pptx")}>
              <FileText size={19} />
              <strong>可编辑 PPTX</strong>
              <span>正式汇报、客户交付、可继续修改</span>
            </button>
            <button className={props.outputMode === "web" ? "selected" : ""} onClick={() => props.onOutputModeChange("web")}>
              <MonitorPlay size={19} />
              <strong>杂志风网页 PPT</strong>
              <span>演讲、发布会、视觉传播</span>
            </button>
          </div>

          <div className="panel-title spaced">
            <Image size={18} />
            <span>3. 选择风格</span>
          </div>
          <div className="style-grid">
            {styleOptions.map((option) => (
              <button
                key={option.key}
                className={props.stylePreset === option.key ? "style-option selected" : "style-option"}
                onClick={() => props.onStylePresetChange(option.key)}
              >
                <strong>{option.title}</strong>
                <span>{option.detail}</span>
              </button>
            ))}
          </div>

          <details className="advanced-box">
            <summary>高级设置</summary>
            <label>
              项目输出目录
              <input
                className="field"
                value={props.projectDir}
                onChange={(event) => props.onProjectDirChange(event.target.value)}
                placeholder="默认：projects/desktop"
              />
            </label>
          </details>
        </section>
      </div>
    </section>
  );
}

function PreviewView(props: {
  steps: WorkerStep[];
  progress: number;
  result: WorkerResult | null;
  error: string;
  isGenerating: boolean;
  outputMode: OutputMode;
  onGenerate: () => void;
}) {
  return (
    <section className="screen preview-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Preview</p>
          <h1>生成与导出</h1>
        </div>
        <button className="secondary-action" onClick={props.onGenerate} disabled={props.isGenerating}>
          <Play size={17} />
          重新生成
        </button>
      </div>

      <div className="preview-grid">
        <section className="progress-panel">
          <div className="progress-head">
            <strong>{props.isGenerating ? "正在生成" : props.result ? "生成完成" : "等待生成"}</strong>
            <span>{props.progress}%</span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${props.progress}%` }} />
          </div>
          <div className="step-list">
            {props.steps.map((step) => (
              <div className="step-row" key={step.key}>
                <CheckCircle2 size={18} className={step.progress > 0 ? "done" : ""} />
                <div>
                  <strong>{step.label}</strong>
                  <span>{step.message}</span>
                </div>
              </div>
            ))}
          </div>
          {props.error && <div className="error-box">{props.error}</div>}
        </section>

        <section className="visual-preview">
          {props.result?.previewHtml ? (
            <iframe title="Web deck preview" srcDoc={props.result.previewHtml} />
          ) : props.result?.previewSvg ? (
            <div className="svg-preview" dangerouslySetInnerHTML={{ __html: props.result.previewSvg }} />
          ) : (
            <div className="empty-preview">
              <MonitorPlay size={40} />
              <strong>{props.outputMode === "pptx" ? "PPTX 预览会显示封面 SVG" : "Web Deck 会在这里内嵌预览"}</strong>
              <span>生成后你会看到结果文件、日志和项目目录。</span>
            </div>
          )}
        </section>

        <section className="export-panel">
          <div className="panel-title">
            <FolderOpen size={18} />
            <span>导出</span>
          </div>
          {props.result ? (
            <>
              <button className="primary-action full" onClick={() => openPath(props.result?.projectPath || "")}>
                <FolderOpen size={18} />
                打开项目文件夹
              </button>
              <div className="file-list">
                {props.result.generatedFiles.map((file) => (
                  <button key={file} className="file-row" onClick={() => openPath(file)} title={file}>
                    <FileText size={16} />
                    <span>{shortenPath(file)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">完成生成后，这里会出现 PPTX、HTML、预览和日志文件。</p>
          )}
        </section>
      </div>
    </section>
  );
}

function SettingsView({
  environment,
  projectDir,
  onProjectDirChange
}: {
  environment: EnvironmentStatus | null;
  projectDir: string;
  onProjectDirChange: (value: string) => void;
}) {
  const providerCount = environment ? Object.values(environment.providers).filter(Boolean).length : 0;
  return (
    <section className="screen settings-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>本地环境</h1>
        </div>
      </div>
      <div className="settings-grid">
        <HealthItem title="Python venv" ok={Boolean(environment?.python.bundledVenv)} detail={environment?.python.executable || "检查中"} />
        <HealthItem title="python-pptx" ok={Boolean(environment?.python.pythonPptx)} detail="PPTX 预览导出依赖" />
        <HealthItem title="Node / npm" ok={Boolean(environment?.node.available && environment.node.npm)} detail="前端和 Swiss 校验依赖" />
        <HealthItem title="Rust / Cargo" ok={Boolean(environment?.optional.rust)} detail="Tauri 原生打包依赖" />
        <HealthItem title="Cairo" ok={Boolean(environment?.optional.cairo)} detail="高兼容 PPTX/SVG 可选依赖" />
        <HealthItem title="Provider Keys" ok={providerCount > 0} detail={`${providerCount} 个 provider 已配置`} />
      </div>
      <details className="advanced-box settings-advanced">
        <summary>高级设置</summary>
        <label>
          默认输出目录
          <input
            className="field"
            value={projectDir}
            onChange={(event) => onProjectDirChange(event.target.value)}
            placeholder="默认：projects/desktop"
          />
        </label>
        <p className="muted">桌面 app 不上传文件，生成项目默认保存在本地仓库的 `projects/desktop` 下。</p>
      </details>
    </section>
  );
}

function HealthItem({ title, ok, detail }: { title: string; ok: boolean; detail: string }) {
  return (
    <article className={ok ? "health-item ok" : "health-item"}>
      <CheckCircle2 size={20} />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function shortenPath(value: string) {
  if (value.length <= 46) return value;
  return `...${value.slice(-43)}`;
}

function humanizeError(error: unknown) {
  const text = String(error);
  if (text.includes("python-pptx")) {
    return "缺少 python-pptx。请在仓库根目录执行 `.venv/bin/python -m pip install -r requirements.txt`。";
  }
  if (text.includes("Source file not found")) {
    return "找不到源文件。请填写完整路径，或直接粘贴 Markdown / 文本。";
  }
  return text;
}

const sampleMarkdown = `# 终极融合 PPT 大师 v2.0.0

- 把真实资料变成可编辑 PPTX 或杂志风网页 PPT
- 支持 PDF、DOCX、XLSX、PPTX、URL、Markdown 和粘贴文本
- 保留本地优先、多 Agent 兼容和可验证导出
- 桌面版目标是让普通创作者三步完成`;
