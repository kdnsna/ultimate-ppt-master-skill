import {
  Activity,
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileText,
  FolderOpen,
  Gauge,
  Image,
  KeyRound,
  Layers3,
  MonitorPlay,
  PanelRight,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  inspectEnvironment,
  listRecentProjects,
  openPath,
  openProjectLog,
  recommendJobSettings,
  runDesktopJob,
  subscribeNativeFileDrop
} from "./lib/desktopApi";
import type {
  DesktopJob,
  EnvironmentStatus,
  NextAction,
  OutputMode,
  ProjectCheck,
  RecentProject,
  Recommendation,
  SourceKind,
  StylePreset,
  ViewKey,
  WorkerResult,
  WorkerStep
} from "./types";

const styleOptions: Array<{ key: StylePreset; title: string; detail: string; scene: string }> = [
  { key: "business", title: "商务汇报", detail: "稳重、清晰、适合周报和高管同步", scene: "正式材料" },
  { key: "consulting", title: "咨询风", detail: "结论先行、图表优先、适合方案交付", scene: "客户方案" },
  { key: "academic", title: "学术/培训", detail: "章节明确、证据优先、适合课程和答辩", scene: "课程答辩" },
  { key: "editorial", title: "电子杂志", detail: "叙事强、视觉松弛、适合分享和演讲", scene: "发布演讲" },
  { key: "swiss", title: "Swiss Style", detail: "网格、秩序、适合产品和工程表达", scene: "产品工程" }
];

const navItems: Array<{ key: ViewKey; label: string; icon: typeof Sparkles }> = [
  { key: "projects", label: "Projects", icon: Sparkles },
  { key: "create", label: "Create", icon: Wand2 },
  { key: "preview", label: "Workbench", icon: MonitorPlay },
  { key: "settings", label: "Settings", icon: Settings }
];

const galleryItems: Array<{
  title: string;
  mode: OutputMode;
  style: StylePreset;
  scenario: string;
  source: string;
}> = [
  { title: "季度业务复盘", mode: "pptx", style: "business", scenario: "高管汇报 / 团队同步", source: "# 季度业务复盘\n\n- 增长来源\n- 风险判断\n- 下一步动作" },
  { title: "咨询方案交付", mode: "pptx", style: "consulting", scenario: "客户方案 / 商业报告", source: "# 市场进入方案\n\n- 结论先行\n- 竞争格局\n- 执行路线" },
  { title: "课程培训课件", mode: "pptx", style: "academic", scenario: "培训 / 答辩 / 课程", source: "# AI 生产力培训\n\n- 基础概念\n- 练习任务\n- 评估方式" },
  { title: "发布会演讲", mode: "web", style: "editorial", scenario: "Keynote / 分享传播", source: "# 产品发布演讲\n\n- 开场问题\n- 关键转折\n- 记忆点" },
  { title: "产品工程说明", mode: "web", style: "swiss", scenario: "产品 / 架构 / 数据", source: "# Swiss Style Product Deck\n\n- System map\n- Metrics\n- Roadmap" }
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
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [manualChoice, setManualChoice] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    inspectEnvironment()
      .then(setEnvironment)
      .catch((err) => setError(humanizeError(err)));
    listRecentProjects()
      .then(setRecent)
      .catch(() => setRecent([]));
  }, []);

  useEffect(() => {
    let cleanup: () => void = () => undefined;
    let active = true;

    subscribeNativeFileDrop((paths) => {
      const path = paths[0];
      if (!path) return;
      setError("");
      setManualChoice(false);
      setSourceKind("file");
      setSourceValue(path);
      setSourceName(fileNameFromPath(path));
      setView("create");
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

  useEffect(() => {
    const source = { kind: sourceKind, value: sourceValue, name: sourceName };
    recommendJobSettings(source)
      .then((next) => {
        setRecommendation(next);
        if (!manualChoice) {
          setOutputMode(next.outputMode);
          setStylePreset(next.stylePreset);
        }
      })
      .catch(() => undefined);
  }, [sourceKind, sourceValue, sourceName, manualChoice]);

  const progress = useMemo(() => Math.max(...steps.map((step) => step.progress), 0), [steps]);
  const providerCount = environment ? Object.values(environment.providers).filter(Boolean).length : 0;

  function refreshRecent(next?: WorkerResult) {
    if (next) {
      const recentItem: RecentProject = {
        name: next.sourceName || sourceName || "Untitled project",
        mode: next.outputMode || outputMode,
        path: next.projectPath,
        status: next.status === "complete" ? "complete" : "error",
        createdAt: next.createdAt || new Date().toISOString(),
        updatedAt: next.updatedAt || new Date().toISOString(),
        generatedFiles: next.generatedFiles,
        thumbnail: next.thumbnailSvg || next.previewSvg,
        logsPath: next.logsPath
      };
      setRecent((items) => [recentItem, ...items.filter((item) => item.path !== recentItem.path)].slice(0, 12));
      return;
    }
    listRecentProjects(projectDir || undefined)
      .then(setRecent)
      .catch(() => undefined);
  }

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
      message: ["读取源资料并创建项目。", "整理信息结构和故事线。", "套用输出模式和风格。", "生成本地预览文件。", "检查路径、日志和产物。", "写入项目清单。"][index],
      progress: [12, 30, 48, 68, 86, 96][index]
    }));

    for (const staged of stagedSteps.slice(0, 4)) {
      setSteps((current) => current.map((step) => (step.key === staged.key ? staged : step)));
      await wait(160);
    }

    try {
      const nextResult = await runDesktopJob(job);
      setResult(nextResult);
      setSteps(nextResult.steps);
      refreshRecent(nextResult);
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
    setManualChoice(false);
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
      setError("浏览器预览无法读取 PDF/DOCX/PPTX 的绝对路径；原生 Tauri 壳可直接拖入，或在这里粘贴文件绝对路径。");
    }
  }

  function applyRecommendation(next = recommendation) {
    if (!next) return;
    setOutputMode(next.outputMode);
    setStylePreset(next.stylePreset);
    setManualChoice(false);
  }

  function useGalleryItem(item: (typeof galleryItems)[number]) {
    setSourceKind("markdown");
    setSourceName(`${item.title}.md`);
    setSourceValue(item.source);
    setOutputMode(item.mode);
    setStylePreset(item.style);
    setManualChoice(true);
    setError("");
    setView("create");
  }

  function openRecentProject(project: RecentProject) {
    setResult({
      status: project.status === "complete" ? "complete" : "error",
      projectPath: project.path,
      logsPath: project.logsPath || "",
      generatedFiles: project.generatedFiles,
      steps: progressSeed.map((step) => ({ ...step, progress: 100, message: "已从项目清单恢复。" })),
      outputMode: project.mode,
      updatedAt: project.updatedAt,
      thumbnailSvg: project.thumbnail,
      previewSvg: project.thumbnail,
      sourceName: project.name
    });
    setSteps(progressSeed.map((step) => ({ ...step, progress: 100, message: "已从项目清单恢复。" })));
    setView("preview");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <div className="brand-sigil">UP</div>
          <div>
            <strong>终极融合 PPT 大师</strong>
            <span>Creator Desktop</span>
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
            <strong>{environment?.python.bundledVenv ? "本地环境已识别" : "环境待补齐"}</strong>
            <span>{providerCount > 0 ? `${providerCount} 个 provider 已配置` : "本地预览可用，生产生成需配置 provider"}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        {view === "projects" && (
          <ProjectsView
            recent={recent}
            providerCount={providerCount}
            onCreate={() => setView("create")}
            onSettings={() => setView("settings")}
            onOpenRecent={openRecentProject}
            onUseGalleryItem={useGalleryItem}
          />
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
            recommendation={recommendation}
            error={error}
            onSourceKindChange={(value) => {
              setManualChoice(false);
              setSourceKind(value);
            }}
            onSourceValueChange={(value) => {
              setManualChoice(false);
              setSourceValue(value);
            }}
            onSourceNameChange={setSourceName}
            onOutputModeChange={(value) => {
              setManualChoice(true);
              setOutputMode(value);
            }}
            onStylePresetChange={(value) => {
              setManualChoice(true);
              setStylePreset(value);
            }}
            onProjectDirChange={setProjectDir}
            onDrop={handleDrop}
            onApplyRecommendation={applyRecommendation}
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
            providerCount={providerCount}
            onGenerate={handleGenerate}
            onSettings={() => setView("settings")}
          />
        )}
        {view === "settings" && (
          <SettingsView
            environment={environment}
            projectDir={projectDir}
            onProjectDirChange={setProjectDir}
            onRefreshRecent={() => refreshRecent()}
          />
        )}
      </main>
    </div>
  );
}

function ProjectsView({
  recent,
  providerCount,
  onCreate,
  onSettings,
  onOpenRecent,
  onUseGalleryItem
}: {
  recent: RecentProject[];
  providerCount: number;
  onCreate: () => void;
  onSettings: () => void;
  onOpenRecent: (project: RecentProject) => void;
  onUseGalleryItem: (item: (typeof galleryItems)[number]) => void;
}) {
  return (
    <section className="screen projects-screen">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Creator-first desktop</p>
          <h1>把真实资料拖进去，生成能交付的演示文稿。</h1>
          <p className="hero-copy">普通创作者只需要三步：导入资料、选择场景、生成导出。专业能力藏在项目页，随时可以展开。</p>
          <div className="hero-actions">
            <button className="primary-action" onClick={onCreate}>
              <Upload size={19} />
              开始生成
            </button>
            <button className="secondary-action" onClick={onSettings}>
              <Settings size={18} />
              环境检查
            </button>
          </div>
        </div>
        <div className="hero-preview" aria-label="Product promise">
          <div className="preview-card-stack">
            <div className="mini-slide main">
              <span>Editable PPTX</span>
              <strong>真实文字、形状、图表</strong>
            </div>
            <div className="mini-slide web">
              <span>Web Deck</span>
              <strong>横向翻页、演讲分享</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="trust-strip" aria-label="Trust signals">
        <TrustBadge icon={FileText} title="真实可编辑 PPTX" detail="不是截图，后续可继续改" />
        <TrustBadge icon={ShieldCheck} title="本地优先" detail="源文件默认留在本机项目目录" />
        <TrustBadge icon={Layers3} title="双路线输出" detail="正式交付和视觉演示都覆盖" />
        <TrustBadge icon={KeyRound} title="Agent 兼容" detail="Codex、Hermes、OpenClaw 可接入" />
        <TrustBadge icon={Gauge} title="Provider 状态" detail={providerCount > 0 ? `${providerCount} 个已配置` : "可先预览，后续配置"} />
      </div>

      <div className="creator-steps">
        {[
          ["1", "导入资料", "PDF / DOCX / URL / Markdown / 粘贴文本"],
          ["2", "选择场景", "PPTX 交付或 Web Deck 演讲"],
          ["3", "生成导出", "预览、检查、打开文件夹"]
        ].map(([index, title, detail]) => (
          <article key={index} className="step-card">
            <span>{index}</span>
            <strong>{title}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>

      <section className="recent-section" aria-labelledby="recent-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recent manifests</p>
            <h2 id="recent-title">最近项目</h2>
          </div>
          <button className="text-button" onClick={onCreate}>
            新建 <ChevronRight size={16} />
          </button>
        </div>
        {recent.length > 0 ? (
          <div className="project-list">
            {recent.map((project) => (
              <button className="project-row" key={`${project.path}-${project.updatedAt}`} onClick={() => onOpenRecent(project)}>
                <div className="project-thumb">
                  {project.thumbnail ? <span dangerouslySetInnerHTML={{ __html: project.thumbnail }} /> : project.mode === "pptx" ? <FileText size={20} /> : <MonitorPlay size={20} />}
                </div>
                <div>
                  <strong>{project.name}</strong>
                  <span>{project.path}</span>
                </div>
                <small>{project.mode === "pptx" ? "PPTX" : "Web Deck"} · {statusLabel(project.status)} · {formatDate(project.updatedAt)}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Archive size={34} />
            <strong>还没有本地项目清单</strong>
            <span>生成一次后，这里会读取真实 `desktop-manifest.json`，展示最近项目、输出文件和日志。</span>
          </div>
        )}
      </section>

      <section className="gallery-section" aria-labelledby="gallery-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Use cases</p>
            <h2 id="gallery-title">示例画廊</h2>
          </div>
        </div>
        <div className="gallery-grid">
          {galleryItems.map((item) => (
            <button key={item.title} className={`gallery-card ${item.style}`} onClick={() => onUseGalleryItem(item)}>
              <span>{item.mode === "pptx" ? "Editable PPTX" : "Web Deck"}</span>
              <strong>{item.title}</strong>
              <p>{item.scenario}</p>
            </button>
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
  recommendation: Recommendation | null;
  error: string;
  onSourceKindChange: (value: SourceKind) => void;
  onSourceValueChange: (value: string) => void;
  onSourceNameChange: (value: string) => void;
  onOutputModeChange: (value: OutputMode) => void;
  onStylePresetChange: (value: StylePreset) => void;
  onProjectDirChange: (value: string) => void;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
  onApplyRecommendation: () => void;
  onGenerate: () => void;
}) {
  const isDocumentShell = props.sourceKind === "file" && /\.(pdf|docx|xlsx|xlsm|pptx)$/i.test(props.sourceValue || props.sourceName);
  return (
    <section className="screen create-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Guided creator flow</p>
          <h1>三步生成</h1>
        </div>
        <button className="primary-action compact" onClick={props.onGenerate} disabled={props.isGenerating || !props.sourceValue.trim()}>
          <Play size={17} />
          {props.isGenerating ? "生成中" : "生成"}
        </button>
      </div>

      {props.recommendation && (
        <aside className="recommendation-strip">
          <Sparkles size={20} />
          <div>
            <strong>推荐：{modeLabel(props.recommendation.outputMode)} · {styleTitle(props.recommendation.stylePreset)} · {props.recommendation.pageRange} 页</strong>
            <span>{props.recommendation.reason}</span>
          </div>
          <button className="secondary-action compact" onClick={props.onApplyRecommendation}>套用</button>
        </aside>
      )}

      <div className="create-grid">
        <section className="input-panel">
          <div className="panel-title">
            <Upload size={18} />
            <span>1. 导入资料</span>
          </div>
          <label className="drop-zone" onDrop={props.onDrop} onDragOver={(event) => event.preventDefault()}>
            <Upload size={26} />
            <strong>拖入文件，或粘贴 URL / Markdown / 文本</strong>
            <span>原生桌面壳可读取真实路径；浏览器预览可直接读取 Markdown/TXT。</span>
          </label>
          <div className="segmented">
            {(["markdown", "text", "url", "file"] as SourceKind[]).map((kind) => (
              <button key={kind} className={props.sourceKind === kind ? "selected" : ""} onClick={() => props.onSourceKindChange(kind)}>
                {kind}
              </button>
            ))}
          </div>
          <input className="field" value={props.sourceName} onChange={(event) => props.onSourceNameChange(event.target.value)} placeholder="项目或源文件名称" />
          <textarea className="source-editor" value={props.sourceValue} onChange={(event) => props.onSourceValueChange(event.target.value)} placeholder="粘贴 Markdown、文本、URL，或填写本地文件绝对路径" />
          {isDocumentShell && (
            <div className="notice-box">
              <CircleAlert size={18} />
              <span>PDF / DOCX / XLSX / PPTX 会先创建本地项目壳；生产级全文解析和高质量生成由 Agent 工作流接管。</span>
            </div>
          )}
          {props.error && <ActionError text={props.error} />}
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
              <button key={option.key} className={props.stylePreset === option.key ? "style-option selected" : "style-option"} onClick={() => props.onStylePresetChange(option.key)}>
                <small>{option.scene}</small>
                <strong>{option.title}</strong>
                <span>{option.detail}</span>
              </button>
            ))}
          </div>

          <details className="advanced-box">
            <summary>高级设置</summary>
            <label>
              项目输出目录
              <input className="field" value={props.projectDir} onChange={(event) => props.onProjectDirChange(event.target.value)} placeholder="默认：projects/desktop" />
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
  providerCount: number;
  onGenerate: () => void;
  onSettings: () => void;
}) {
  const checks = props.result?.checks || fallbackChecks(props.providerCount, props.outputMode);
  return (
    <section className="screen preview-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Project workbench</p>
          <h1>预览、检查、导出</h1>
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
          {props.error && <ActionError text={props.error} onSettings={props.onSettings} />}
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
            <span>导出与信任检查</span>
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

          <div className="check-list">
            {checks.map((check) => (
              <CheckItem key={check.key} check={check} />
            ))}
          </div>

          <details className="advanced-box">
            <summary>高级入口</summary>
            <div className="next-actions">
              {(props.result?.nextActions || []).map((action) => (
                <ActionButton key={action.key} action={action} />
              ))}
              {props.result?.logsPath && (
                <button className="file-row" onClick={() => openProjectLog(props.result?.logsPath || "")}>
                  <Activity size={16} />
                  <span>打开日志</span>
                </button>
              )}
            </div>
            <p className="muted">Agent handoff：打开项目 README，使用 `sources/source.md` 继续生产级生成。</p>
          </details>
        </section>
      </div>
    </section>
  );
}

function SettingsView({
  environment,
  projectDir,
  onProjectDirChange,
  onRefreshRecent
}: {
  environment: EnvironmentStatus | null;
  projectDir: string;
  onProjectDirChange: (value: string) => void;
  onRefreshRecent: () => void;
}) {
  const providerCount = environment ? Object.values(environment.providers).filter(Boolean).length : 0;
  return (
    <section className="screen settings-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>本地环境</h1>
        </div>
        <button className="secondary-action" onClick={onRefreshRecent}>
          <Archive size={17} />
          刷新项目
        </button>
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
          <input className="field" value={projectDir} onChange={(event) => onProjectDirChange(event.target.value)} placeholder="默认：projects/desktop" />
        </label>
        <p className="muted">桌面 app 不上传文件，生成项目默认保存在本地仓库的 `projects/desktop` 下。</p>
      </details>
    </section>
  );
}

function TrustBadge({ icon: Icon, title, detail }: { icon: typeof Sparkles; title: string; detail: string }) {
  return (
    <article className="trust-badge">
      <Icon size={19} />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </article>
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

function CheckItem({ check }: { check: ProjectCheck }) {
  return (
    <article className={`check-item ${check.status}`}>
      {check.status === "ok" ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
      <div>
        <strong>{check.label}</strong>
        <span>{check.detail}</span>
      </div>
    </article>
  );
}

function ActionButton({ action }: { action: NextAction }) {
  return (
    <button className="file-row" onClick={() => action.path && openPath(action.path)} title={action.detail}>
      <ChevronRight size={16} />
      <span>{action.label}</span>
    </button>
  );
}

function ActionError({ text, onSettings }: { text: string; onSettings?: () => void }) {
  return (
    <div className="error-box">
      <CircleAlert size={18} />
      <div>
        <strong>需要处理</strong>
        <span>{text}</span>
      </div>
      {onSettings && (
        <button className="secondary-action compact" onClick={onSettings}>
          查看设置
        </button>
      )}
    </div>
  );
}

function fallbackChecks(providerCount: number, mode: OutputMode): ProjectCheck[] {
  return [
    { key: "local-first", label: "本地处理", status: "ok", detail: "桌面端默认把源文件和输出保存在本地项目目录。" },
    { key: "editable-output", label: "真实可编辑", status: mode === "pptx" ? "ok" : "warning", detail: "PPTX 路线强调可编辑；Web Deck 路线强调演示体验。" },
    { key: "provider", label: "模型 Provider", status: providerCount > 0 ? "ok" : "warning", detail: providerCount > 0 ? `${providerCount} 个 provider 已配置。` : "预览可用，生产级生成前建议配置 provider。" }
  ];
}

function getDroppedFilePath(file: File): string {
  const maybePath = file as File & { path?: string };
  return maybePath.path || file.webkitRelativePath || "";
}

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || path || "source";
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function shortenPath(value: string) {
  if (value.length <= 46) return value;
  return `...${value.slice(-43)}`;
}

function statusLabel(status: RecentProject["status"]) {
  if (status === "complete") return "已完成";
  if (status === "error") return "有错误";
  return "草稿";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function modeLabel(mode: OutputMode) {
  return mode === "pptx" ? "可编辑 PPTX" : "杂志风网页 PPT";
}

function styleTitle(style: StylePreset) {
  return styleOptions.find((option) => option.key === style)?.title || style;
}

function humanizeError(error: unknown) {
  const text = String(error);
  if (text.includes("python-pptx")) {
    return "缺少 python-pptx。请在仓库根目录执行 `.venv/bin/python -m pip install -r requirements.txt`。";
  }
  if (text.includes("Source file not found")) {
    return "找不到源文件。请填写完整路径，或直接粘贴 Markdown / 文本。";
  }
  if (text.includes("No JSON job")) {
    return "没有收到生成任务，请回到创建页重新提交。";
  }
  return text;
}

const sampleMarkdown = `# 终极融合 PPT 大师 v2.0.0

- 把真实资料变成可编辑 PPTX 或杂志风网页 PPT
- 支持 PDF、DOCX、XLSX、PPTX、URL、Markdown 和粘贴文本
- 保留本地优先、多 Agent 兼容和可验证导出
- 桌面版目标是让普通创作者三步完成`;
