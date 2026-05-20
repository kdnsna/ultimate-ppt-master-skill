import {
  Activity,
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Copy,
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
  SourceExtraction,
  SourceKind,
  StylePreset,
  ViewKey,
  WorkerResult,
  WorkerStep
} from "./types";

type ProviderKey = keyof EnvironmentStatus["providers"];
type AppLanguage = "zh" | "en";

const LANGUAGE_STORAGE_KEY = "ultimate-ppt-master-language";

const styleOptions: Array<{ key: StylePreset; title: string; detail: string; scene: string }> = [
  { key: "business", title: "商务汇报", detail: "稳重、清晰、适合周报和高管同步", scene: "正式材料" },
  { key: "consulting", title: "咨询风", detail: "结论先行、图表优先、适合方案交付", scene: "客户方案" },
  { key: "academic", title: "学术/培训", detail: "章节明确、证据优先、适合课程和答辩", scene: "课程答辩" },
  { key: "editorial", title: "电子杂志", detail: "叙事强、视觉松弛、适合分享和演讲", scene: "发布演讲" },
  { key: "swiss", title: "Swiss Style", detail: "网格、秩序、适合产品和工程表达", scene: "产品工程" }
];

const styleOptionsEn: Record<StylePreset, { title: string; detail: string; scene: string }> = {
  business: { title: "Business Report", detail: "Calm, clear, suited for reviews and executive updates", scene: "Formal deck" },
  consulting: { title: "Consulting", detail: "Answer-first, chart-forward, suited for client delivery", scene: "Client work" },
  academic: { title: "Academic / Training", detail: "Structured, evidence-first, suited for courses and defense", scene: "Teaching" },
  editorial: { title: "Editorial", detail: "Narrative and visual, suited for talks and launches", scene: "Keynote" },
  swiss: { title: "Swiss Style", detail: "Grid-driven and crisp, suited for product and engineering", scene: "Product" }
};

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
  titleEn: string;
  scenarioEn: string;
  sourceEn: string;
}> = [
  {
    title: "季度业务复盘",
    mode: "pptx",
    style: "business",
    scenario: "高管汇报 / 团队同步",
    source: "# 季度业务复盘\n\n- 增长来源\n- 风险判断\n- 下一步动作",
    titleEn: "Quarterly Business Review",
    scenarioEn: "Executive update / team sync",
    sourceEn: "# Quarterly Business Review\n\n- Growth drivers\n- Risk signals\n- Next actions"
  },
  {
    title: "咨询方案交付",
    mode: "pptx",
    style: "consulting",
    scenario: "客户方案 / 商业报告",
    source: "# 市场进入方案\n\n- 结论先行\n- 竞争格局\n- 执行路线",
    titleEn: "Consulting Delivery",
    scenarioEn: "Client proposal / business report",
    sourceEn: "# Market Entry Plan\n\n- Executive answer\n- Competitive landscape\n- Execution roadmap"
  },
  {
    title: "课程培训课件",
    mode: "pptx",
    style: "academic",
    scenario: "培训 / 答辩 / 课程",
    source: "# AI 生产力培训\n\n- 基础概念\n- 练习任务\n- 评估方式",
    titleEn: "Training Courseware",
    scenarioEn: "Training / lecture / defense",
    sourceEn: "# AI Productivity Training\n\n- Core concepts\n- Practice tasks\n- Assessment"
  },
  {
    title: "发布会演讲",
    mode: "web",
    style: "editorial",
    scenario: "Keynote / 分享传播",
    source: "# 产品发布演讲\n\n- 开场问题\n- 关键转折\n- 记忆点",
    titleEn: "Launch Keynote",
    scenarioEn: "Keynote / product story",
    sourceEn: "# Product Launch Keynote\n\n- Opening tension\n- Core shift\n- Memory point"
  },
  {
    title: "产品工程说明",
    mode: "web",
    style: "swiss",
    scenario: "产品 / 架构 / 数据",
    source: "# Swiss Style Product Deck\n\n- System map\n- Metrics\n- Roadmap",
    titleEn: "Product Engineering Brief",
    scenarioEn: "Product / architecture / data",
    sourceEn: "# Swiss Style Product Deck\n\n- System map\n- Metrics\n- Roadmap"
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

const providerGuides: Array<{
  key: ProviderKey;
  title: string;
  bestFor: string;
  bestForEn: string;
  setup: string;
}> = [
  {
    key: "openai",
    title: "OpenAI / compatible",
    bestFor: "通用结构生成、视觉生成、兼容代理网关",
    bestForEn: "General structure, image generation, compatible gateways",
    setup: "IMAGE_BACKEND=openai · OPENAI_API_KEY · OPENAI_MODEL"
  },
  {
    key: "gemini",
    title: "Gemini",
    bestFor: "多模态理解、图片生成、长材料辅助",
    bestForEn: "Multimodal understanding, image generation, long source support",
    setup: "IMAGE_BACKEND=gemini · GEMINI_API_KEY · GEMINI_MODEL"
  },
  {
    key: "qwen",
    title: "Qwen / DashScope",
    bestFor: "中文材料、通义生图、国内网络环境",
    bestForEn: "Chinese source material, Qwen image generation, China network paths",
    setup: "IMAGE_BACKEND=qwen · QWEN_API_KEY / DASHSCOPE_API_KEY"
  },
  {
    key: "pexels",
    title: "Pexels",
    bestFor: "商业图库风格配图搜索",
    bestForEn: "Commercial stock-style image search",
    setup: "PEXELS_API_KEY"
  },
  {
    key: "pixabay",
    title: "Pixabay",
    bestFor: "免费图库补充和通用素材搜索",
    bestForEn: "Free stock fallback and general image search",
    setup: "PIXABAY_API_KEY"
  }
];

const driverModes = [
  {
    title: "Agent 驱动",
    titleEn: "Agent-driven",
    badge: "推荐",
    badgeEn: "Recommended",
    detail: "Codex、Claude Code、OpenClaw、Hermes 或 IDE Agent 读取 SKILL.md，负责策略、写稿、逐页生成、修正和导出。",
    detailEn: "Codex, Claude Code, OpenClaw, Hermes, or an IDE agent reads SKILL.md and handles strategy, writing, generation, correction, and export.",
  },
  {
    title: "Agent + Provider 增强",
    titleEn: "Agent + providers",
    badge: "当前支持",
    badgeEn: "Supported",
    detail: "Agent 负责主流程，.env 里的 OpenAI/Gemini/Qwen/Pexels/Pixabay 等 provider 负责生图、搜图、旁白等能力。",
    detailEn: "The agent runs the main workflow while provider keys in .env unlock image generation, image search, narration, and media tasks.",
  },
  {
    title: "Direct API Driver",
    titleEn: "Direct API driver",
    badge: "接口预留",
    badgeEn: "Reserved",
    detail: "可用 LLM_PROVIDER / LLM_MODEL / LLM_API_KEY 记录直连配置；完整 API 直驱生成器会作为后续 worker adapter 接入。",
    detailEn: "LLM_PROVIDER / LLM_MODEL / LLM_API_KEY can record direct API settings; a full API driver is reserved for a later worker adapter.",
  },
];

export function App() {
  const [view, setView] = useState<ViewKey>("projects");
  const [language, setLanguage] = useState<AppLanguage>(() => readStoredLanguage());
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
      .catch((err) => setError(humanizeError(err, language)));
    listRecentProjects()
      .then(setRecent)
      .catch(() => setRecent([]));
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

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
      setError(humanizeError(err, language));
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
      setError(language === "en"
        ? "Browser preview cannot read absolute paths for PDF/DOCX/PPTX. Use the native Tauri shell, or paste the absolute file path here."
        : "浏览器预览无法读取 PDF/DOCX/PPTX 的绝对路径；原生 Tauri 壳可直接拖入，或在这里粘贴文件绝对路径。");
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
    setSourceName(`${language === "en" ? item.titleEn : item.title}.md`);
    setSourceValue(language === "en" ? item.sourceEn : item.source);
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
    <div className="app-shell" lang={language === "en" ? "en" : "zh-CN"}>
      <aside className="sidebar">
        <div className="brand-mark">
          <div className="brand-sigil">UP</div>
          <div>
            <strong>{language === "en" ? "Ultimate PPT Master" : "终极融合 PPT 大师"}</strong>
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
            <strong>{environment?.python.bundledVenv ? (language === "en" ? "Local environment ready" : "本地环境已识别") : (language === "en" ? "Environment needs setup" : "环境待补齐")}</strong>
            <span>
              {providerCount > 0
                ? language === "en" ? `${providerCount} providers configured` : `${providerCount} 个 provider 已配置`
                : language === "en" ? "Preview works; providers unlock production media" : "本地预览可用，生产生成需配置 provider"}
            </span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        {view === "projects" && (
          <ProjectsView
            language={language}
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
            language={language}
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
            language={language}
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
            language={language}
            onLanguageChange={setLanguage}
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
  language,
  recent,
  providerCount,
  onCreate,
  onSettings,
  onOpenRecent,
  onUseGalleryItem
}: {
  language: AppLanguage;
  recent: RecentProject[];
  providerCount: number;
  onCreate: () => void;
  onSettings: () => void;
  onOpenRecent: (project: RecentProject) => void;
  onUseGalleryItem: (item: (typeof galleryItems)[number]) => void;
}) {
  const en = language === "en";
  return (
    <section className="screen projects-screen">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Creator-first desktop</p>
          <h1>{en ? "Drop real source material. Generate decks people can ship." : "把真实资料拖进去，生成能交付的演示文稿。"}</h1>
          <p className="hero-copy">
            {en
              ? "A simple three-step flow for creators: import sources, choose the delivery scene, generate and export. Advanced agent power stays available without crowding the first screen."
              : "普通创作者只需要三步：导入资料、选择场景、生成导出。专业能力藏在项目页，随时可以展开。"}
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={onCreate}>
              <Upload size={19} />
              {en ? "Start creating" : "开始生成"}
            </button>
            <button className="secondary-action" onClick={onSettings}>
              <Settings size={18} />
              {en ? "Check setup" : "环境检查"}
            </button>
          </div>
        </div>
        <div className="hero-preview" aria-label="Product promise">
          <div className="preview-card-stack">
            <div className="mini-slide main">
              <span>Editable PPTX</span>
              <strong>{en ? "Real text, shapes, charts" : "真实文字、形状、图表"}</strong>
            </div>
            <div className="mini-slide web">
              <span>Web Deck</span>
              <strong>{en ? "Horizontal decks for talks" : "横向翻页、演讲分享"}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="trust-strip" aria-label="Trust signals">
        <TrustBadge icon={FileText} title={en ? "Editable PPTX" : "真实可编辑 PPTX"} detail={en ? "Not screenshots; keep editing later" : "不是截图，后续可继续改"} />
        <TrustBadge icon={ShieldCheck} title={en ? "Local-first" : "本地优先"} detail={en ? "Sources stay in local project folders" : "源文件默认留在本机项目目录"} />
        <TrustBadge icon={Layers3} title={en ? "Two output modes" : "双路线输出"} detail={en ? "Formal handoff and visual talks" : "正式交付和视觉演示都覆盖"} />
        <TrustBadge icon={KeyRound} title={en ? "Agent-compatible" : "Agent 兼容"} detail={en ? "Codex, Hermes, OpenClaw ready" : "Codex、Hermes、OpenClaw 可接入"} />
        <TrustBadge icon={Gauge} title={en ? "Provider status" : "Provider 状态"} detail={providerCount > 0 ? en ? `${providerCount} configured` : `${providerCount} 个已配置` : en ? "Preview now, configure later" : "可先预览，后续配置"} />
      </div>

      <div className="creator-steps">
        {[
          ["1", en ? "Import sources" : "导入资料", en ? "PDF / DOCX / URL / Markdown / pasted text" : "PDF / DOCX / URL / Markdown / 粘贴文本"],
          ["2", en ? "Choose delivery" : "选择场景", en ? "Editable PPTX or Web Deck" : "PPTX 交付或 Web Deck 演讲"],
          ["3", en ? "Generate and export" : "生成导出", en ? "Preview, check, open folder" : "预览、检查、打开文件夹"]
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
            <h2 id="recent-title">{en ? "Recent projects" : "最近项目"}</h2>
          </div>
          <button className="text-button" onClick={onCreate}>
            {en ? "New" : "新建"} <ChevronRight size={16} />
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
                <small>{project.mode === "pptx" ? "PPTX" : "Web Deck"} · {statusLabel(project.status, language)} · {formatDate(project.updatedAt, language)}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Archive size={34} />
            <strong>{en ? "No local project manifests yet" : "还没有本地项目清单"}</strong>
            <span>{en ? "After one generation, real desktop-manifest.json files will appear here with outputs and logs." : "生成一次后，这里会读取真实 `desktop-manifest.json`，展示最近项目、输出文件和日志。"}</span>
          </div>
        )}
      </section>

      <section className="gallery-section" aria-labelledby="gallery-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Use cases</p>
            <h2 id="gallery-title">{en ? "Example gallery" : "示例画廊"}</h2>
          </div>
        </div>
        <div className="gallery-grid">
          {galleryItems.map((item) => (
            <button key={item.title} className={`gallery-card ${item.style}`} onClick={() => onUseGalleryItem(item)}>
              <span>{item.mode === "pptx" ? "Editable PPTX" : "Web Deck"}</span>
              <strong>{en ? item.titleEn : item.title}</strong>
              <p>{en ? item.scenarioEn : item.scenario}</p>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function CreateView(props: {
  language: AppLanguage;
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
  const en = props.language === "en";
  const sourceReadiness = describeSourceReadiness(props.sourceKind, props.sourceValue, props.sourceName, props.language);
  const styles = localizedStyleOptions(props.language);
  return (
    <section className="screen create-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Guided creator flow</p>
          <h1>{en ? "Create in three steps" : "三步生成"}</h1>
        </div>
        <button className="primary-action compact" onClick={props.onGenerate} disabled={props.isGenerating || !props.sourceValue.trim()}>
          <Play size={17} />
          {props.isGenerating ? (en ? "Generating" : "生成中") : (en ? "Generate" : "生成")}
        </button>
      </div>

      {props.recommendation && (
        <aside className="recommendation-strip">
          <Sparkles size={20} />
          <div>
            <strong>{en ? "Recommended" : "推荐"}：{modeLabel(props.recommendation.outputMode, props.language)} · {styleTitle(props.recommendation.stylePreset, props.language)} · {props.recommendation.pageRange} {en ? "slides" : "页"}</strong>
            <span>{props.recommendation.reason}</span>
          </div>
          <button className="secondary-action compact" onClick={props.onApplyRecommendation}>{en ? "Apply" : "套用"}</button>
        </aside>
      )}

      <div className="create-grid">
        <section className="input-panel">
          <div className="panel-title">
            <Upload size={18} />
            <span>{en ? "1. Import sources" : "1. 导入资料"}</span>
          </div>
          <label className="drop-zone" onDrop={props.onDrop} onDragOver={(event) => event.preventDefault()}>
            <Upload size={26} />
            <strong>{en ? "Drop a file, or paste a URL / Markdown / text" : "拖入文件，或粘贴 URL / Markdown / 文本"}</strong>
            <span>{en ? "Native desktop mode reads real file paths; browser preview reads Markdown/TXT directly." : "原生桌面壳可读取真实路径；浏览器预览可直接读取 Markdown/TXT。"}</span>
          </label>
          <div className="segmented">
            {(["markdown", "text", "url", "file"] as SourceKind[]).map((kind) => (
              <button key={kind} className={props.sourceKind === kind ? "selected" : ""} onClick={() => props.onSourceKindChange(kind)}>
                {kind}
              </button>
            ))}
          </div>
          <input className="field" value={props.sourceName} onChange={(event) => props.onSourceNameChange(event.target.value)} placeholder={en ? "Project or source file name" : "项目或源文件名称"} />
          <textarea className="source-editor" value={props.sourceValue} onChange={(event) => props.onSourceValueChange(event.target.value)} placeholder={en ? "Paste Markdown, text, URL, or a local absolute file path" : "粘贴 Markdown、文本、URL，或填写本地文件绝对路径"} />
          {sourceReadiness && (
            <div className={`notice-box ${sourceReadiness.status}`}>
              {sourceReadiness.status === "extracted" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
              <div>
                <strong>{sourceReadiness.title}</strong>
                <span>{sourceReadiness.detail}</span>
              </div>
            </div>
          )}
          {props.error && <ActionError text={props.error} language={props.language} />}
        </section>

        <section className="choice-panel">
          <div className="panel-title">
            <PanelRight size={18} />
            <span>{en ? "2. Choose output" : "2. 选择输出"}</span>
          </div>
          <div className="mode-switch">
            <button className={props.outputMode === "pptx" ? "selected" : ""} onClick={() => props.onOutputModeChange("pptx")}>
              <FileText size={19} />
              <strong>{en ? "Editable PPTX" : "可编辑 PPTX"}</strong>
              <span>{en ? "Formal reports, client delivery, editable handoff" : "正式汇报、客户交付、可继续修改"}</span>
            </button>
            <button className={props.outputMode === "web" ? "selected" : ""} onClick={() => props.onOutputModeChange("web")}>
              <MonitorPlay size={19} />
              <strong>{en ? "Magazine Web Deck" : "杂志风网页 PPT"}</strong>
              <span>{en ? "Talks, launches, visual storytelling" : "演讲、发布会、视觉传播"}</span>
            </button>
          </div>

          <div className="panel-title spaced">
            <Image size={18} />
            <span>{en ? "3. Choose style" : "3. 选择风格"}</span>
          </div>
          <div className="style-grid">
            {styles.map((option) => (
              <button key={option.key} className={props.stylePreset === option.key ? "style-option selected" : "style-option"} onClick={() => props.onStylePresetChange(option.key)}>
                <small>{option.scene}</small>
                <strong>{option.title}</strong>
                <span>{option.detail}</span>
              </button>
            ))}
          </div>

          <details className="advanced-box">
            <summary>{en ? "Advanced settings" : "高级设置"}</summary>
            <label>
              {en ? "Project output directory" : "项目输出目录"}
              <input className="field" value={props.projectDir} onChange={(event) => props.onProjectDirChange(event.target.value)} placeholder={en ? "Default: projects/desktop" : "默认：projects/desktop"} />
            </label>
          </details>
        </section>
      </div>
    </section>
  );
}

function PreviewView(props: {
  language: AppLanguage;
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
  const en = props.language === "en";
  const checks = (props.result?.checks || fallbackChecks(props.providerCount, props.outputMode, props.language)).map((check) => localizedCheck(check, props.language, props.providerCount, props.outputMode));
  const steps = props.steps.map((step) => localizedStep(step, props.language));
  return (
    <section className="screen preview-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Project workbench</p>
          <h1>{en ? "Preview, check, export" : "预览、检查、导出"}</h1>
        </div>
        <button className="secondary-action" onClick={props.onGenerate} disabled={props.isGenerating}>
          <Play size={17} />
          {en ? "Regenerate" : "重新生成"}
        </button>
      </div>

      <div className="preview-grid">
        <section className="progress-panel">
          <div className="progress-head">
            <strong>{props.isGenerating ? (en ? "Generating" : "正在生成") : props.result ? (en ? "Complete" : "生成完成") : (en ? "Waiting" : "等待生成")}</strong>
            <span>{props.progress}%</span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${props.progress}%` }} />
          </div>
          <div className="step-list">
            {steps.map((step) => (
              <div className="step-row" key={step.key}>
                <CheckCircle2 size={18} className={step.progress > 0 ? "done" : ""} />
                <div>
                  <strong>{step.label}</strong>
                  <span>{step.message}</span>
                </div>
              </div>
            ))}
          </div>
          {props.error && <ActionError text={props.error} onSettings={props.onSettings} language={props.language} />}
        </section>

        <section className="visual-preview">
          {props.result?.previewHtml ? (
            <iframe title="Web deck preview" srcDoc={props.result.previewHtml} />
          ) : props.result?.previewSvg ? (
            <div className="svg-preview" dangerouslySetInnerHTML={{ __html: props.result.previewSvg }} />
          ) : (
            <div className="empty-preview">
              <MonitorPlay size={40} />
              <strong>{props.outputMode === "pptx" ? (en ? "PPTX preview will show a cover SVG" : "PPTX 预览会显示封面 SVG") : (en ? "Web Deck preview will load here" : "Web Deck 会在这里内嵌预览")}</strong>
              <span>{en ? "After generation, result files, logs, and the project folder will appear." : "生成后你会看到结果文件、日志和项目目录。"}</span>
            </div>
          )}
        </section>

        <section className="export-panel">
          <div className="panel-title">
            <FolderOpen size={18} />
            <span>{en ? "Export and trust checks" : "导出与信任检查"}</span>
          </div>
          {props.result?.sourceExtraction && (
            <SourceExtractionCard extraction={props.result.sourceExtraction} language={props.language} />
          )}
          {props.result ? (
            <>
              <button className="primary-action full" onClick={() => openPath(props.result?.projectPath || "")}>
                <FolderOpen size={18} />
                {en ? "Open project folder" : "打开项目文件夹"}
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
            <p className="muted">{en ? "After generation, PPTX, HTML, preview, and log files will appear here." : "完成生成后，这里会出现 PPTX、HTML、预览和日志文件。"}</p>
          )}

          <div className="check-list">
            {checks.map((check) => (
              <CheckItem key={check.key} check={check} />
            ))}
          </div>

          <details className="advanced-box">
            <summary>{en ? "Advanced entry points" : "高级入口"}</summary>
            <div className="next-actions">
              {(props.result?.nextActions || []).map((action) => (
                <ActionButton key={action.key} action={action} language={props.language} />
              ))}
              {props.result?.logsPath && (
                <button className="file-row" onClick={() => openProjectLog(props.result?.logsPath || "")}>
                  <Activity size={16} />
                  <span>{en ? "Open log" : "打开日志"}</span>
                </button>
              )}
              {props.result?.sourceExtraction?.generatedMarkdownPath && (
                <button className="file-row" onClick={() => openPath(props.result?.sourceExtraction?.generatedMarkdownPath || "")}>
                  <FileText size={16} />
                  <span>{en ? "Open source.md" : "打开 source.md"}</span>
                </button>
              )}
              {props.result && (
                <button className="file-row" onClick={() => { if (props.result) copyHandoffPrompt(props.result, props.language); }}>
                  <Copy size={16} />
                  <span>{en ? "Copy Agent handoff prompt" : "复制 Agent handoff prompt"}</span>
                </button>
              )}
            </div>
            <p className="muted">{en ? "Agent handoff: open the project README and continue production generation with `sources/source.md`." : "Agent handoff：打开项目 README，使用 `sources/source.md` 继续生产级生成。"}</p>
          </details>
        </section>
      </div>
    </section>
  );
}

function SettingsView({
  language,
  onLanguageChange,
  environment,
  projectDir,
  onProjectDirChange,
  onRefreshRecent
}: {
  language: AppLanguage;
  onLanguageChange: (value: AppLanguage) => void;
  environment: EnvironmentStatus | null;
  projectDir: string;
  onProjectDirChange: (value: string) => void;
  onRefreshRecent: () => void;
}) {
  const en = language === "en";
  const providerCount = environment ? Object.values(environment.providers).filter(Boolean).length : 0;
  return (
    <section className="screen settings-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>{en ? "Local environment" : "本地环境"}</h1>
        </div>
        <button className="secondary-action" onClick={onRefreshRecent}>
          <Archive size={17} />
          {en ? "Refresh projects" : "刷新项目"}
        </button>
      </div>
      <div className="settings-grid">
        <HealthItem title="Python venv" ok={Boolean(environment?.python.bundledVenv)} detail={environment?.python.executable || (en ? "Checking" : "检查中")} />
        <HealthItem title="python-pptx" ok={Boolean(environment?.python.pythonPptx)} detail={en ? "Dependency for PPTX preview export" : "PPTX 预览导出依赖"} />
        <HealthItem title="Node / npm" ok={Boolean(environment?.node.available && environment.node.npm)} detail={en ? "Frontend and Swiss validation dependency" : "前端和 Swiss 校验依赖"} />
        <HealthItem title="Rust / Cargo" ok={Boolean(environment?.optional.rust)} detail={en ? "Native Tauri packaging dependency" : "Tauri 原生打包依赖"} />
        <HealthItem title="Cairo" ok={Boolean(environment?.optional.cairo)} detail={en ? "Optional compatibility dependency for PPTX/SVG" : "高兼容 PPTX/SVG 可选依赖"} />
        <HealthItem title="Provider Keys" ok={providerCount > 0} detail={providerCount > 0 ? (en ? `${providerCount} providers configured` : `${providerCount} 个 provider 已配置`) : (en ? "No providers configured" : "未配置 provider")} />
      </div>
      <section className="language-panel">
        <div>
          <p className="eyebrow">Language</p>
          <h2>{en ? "Interface language" : "界面语言"}</h2>
          <p className="muted">{en ? "Switch the desktop UI for English-speaking users. The choice is saved locally." : "为英文用户切换桌面端界面语言，选择会保存在本机。"}</p>
        </div>
        <div className="language-switch" role="group" aria-label="Language">
          <button className={language === "zh" ? "selected" : ""} onClick={() => onLanguageChange("zh")}>中文</button>
          <button className={language === "en" ? "selected" : ""} onClick={() => onLanguageChange("en")}>English</button>
        </div>
      </section>
      <section className="model-guide">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Model Setup</p>
            <h2>{en ? "Model and provider setup" : "大模型与 Provider 配置"}</h2>
          </div>
          <span className={providerCount > 0 ? "status-pill ok" : "status-pill"}>
            {providerCount > 0 ? (en ? `${providerCount} detected` : `${providerCount} 个已识别`) : (en ? "No key detected" : "未检测到 key")}
          </span>
        </div>
        <div className="guide-copy">
          <KeyRound size={20} />
          <p>
            {en
              ? "Production generation is driven by the model in Codex, Claude Code, OpenClaw, Hermes, or another agent you already use. The desktop app does not host models, upload files, or show secret keys. Image generation, image search, narration, and other media capabilities read local environment variables or .env."
              : "生产级内容生成由你正在使用的 Codex、Claude Code、OpenClaw、Hermes 或其他 Agent 的大模型驱动；桌面 app 不托管模型、不上传文件，也不会显示密钥。图片生成、素材搜索、旁白等扩展能力读取本地环境变量或 `.env`。"}
          </p>
        </div>
        <div className="config-paths">
          <div>
            <strong>{en ? "Recommended config file" : "推荐配置文件"}</strong>
            <span>{environment?.config?.envFile || (en ? "~/.ppt-master/.env or repo .env" : "~/.ppt-master/.env 或仓库根目录 .env")}</span>
          </div>
          <div>
            <strong>{en ? "Current image backend" : "当前图片后端"}</strong>
            <span>{environment?.config?.imageBackend || (en ? "IMAGE_BACKEND is not set" : "未设置 IMAGE_BACKEND")}</span>
          </div>
          <div>
            <strong>{en ? "Direct API config" : "直连 API 配置"}</strong>
            <span>
              {environment?.config?.directLlmConfigured
                ? `${environment.config.llmProvider || "api"} · ${environment.config.llmModel || "model 已设置"}`
                : en ? "Agent-driven mode is recommended; direct API is reserved" : "当前推荐使用 Agent 驱动，API 直驱为预留路线"}
            </span>
          </div>
        </div>
        <div className="driver-list">
          {driverModes.map((mode) => (
            <div key={mode.title} className="driver-row">
              <strong>{en ? mode.titleEn : mode.title}</strong>
              <span>{en ? mode.badgeEn : mode.badge}</span>
              <p>{en ? mode.detailEn : mode.detail}</p>
            </div>
          ))}
        </div>
        <div className="setup-steps">
          <code>mkdir -p ~/.ppt-master</code>
          <code>cp .env.example ~/.ppt-master/.env</code>
          <code>{en ? "Fill IMAGE_BACKEND and provider keys, then refresh settings" : "填写 IMAGE_BACKEND 和对应 provider key 后刷新设置"}</code>
        </div>
        <div className="provider-list">
          {providerGuides.map((provider) => (
            <div key={provider.key} className="provider-row">
              <span className={environment?.providers[provider.key] ? "provider-dot ok" : "provider-dot"} />
              <div>
                <strong>{provider.title}</strong>
                <small>{en ? provider.bestForEn : provider.bestFor}</small>
              </div>
              <code>{provider.setup}</code>
            </div>
          ))}
        </div>
      </section>
      <details className="advanced-box settings-advanced">
        <summary>{en ? "Advanced settings" : "高级设置"}</summary>
        <label>
          {en ? "Default output directory" : "默认输出目录"}
          <input className="field" value={projectDir} onChange={(event) => onProjectDirChange(event.target.value)} placeholder={en ? "Default: projects/desktop" : "默认：projects/desktop"} />
        </label>
        <p className="muted">{en ? "The desktop app does not upload files. Generated projects are saved under the local repo's `projects/desktop` by default." : "桌面 app 不上传文件，生成项目默认保存在本地仓库的 `projects/desktop` 下。"}</p>
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

function SourceExtractionCard({ extraction, language }: { extraction: SourceExtraction; language: AppLanguage }) {
  const en = language === "en";
  const status = extraction.status === "extracted" ? "ok" : extraction.status === "copied" ? "warning" : "missing";
  const label = en
    ? extraction.status === "extracted" ? "Source text extracted" : extraction.status === "copied" ? "Source copied" : "Agent handoff required"
    : extraction.status === "extracted" ? "已读取正文" : extraction.status === "copied" ? "已复制文件" : "需 Agent 接管";
  const detail = localizedExtractionDetail(extraction, language);
  return (
    <article className={`check-item source-card ${status}`}>
      {status === "ok" ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function ActionButton({ action, language }: { action: NextAction; language: AppLanguage }) {
  const label = actionLabel(action, language);
  return (
    <button className="file-row" onClick={() => action.path && openPath(action.path)} title={action.detail}>
      <ChevronRight size={16} />
      <span>{label}</span>
    </button>
  );
}

function ActionError({ text, onSettings, language = "zh" }: { text: string; onSettings?: () => void; language?: AppLanguage }) {
  const en = language === "en";
  return (
    <div className="error-box">
      <CircleAlert size={18} />
      <div>
        <strong>{en ? "Needs attention" : "需要处理"}</strong>
        <span>{text}</span>
      </div>
      {onSettings && (
        <button className="secondary-action compact" onClick={onSettings}>
          {en ? "Settings" : "查看设置"}
        </button>
      )}
    </div>
  );
}

function fallbackChecks(providerCount: number, mode: OutputMode, language: AppLanguage): ProjectCheck[] {
  if (language === "en") {
    return [
      { key: "local-first", label: "Local-first", status: "ok", detail: "The desktop app stores sources and outputs in local project folders." },
      { key: "editable-output", label: "Editable output", status: mode === "pptx" ? "ok" : "warning", detail: "PPTX focuses on editability; Web Deck focuses on presentation experience." },
      { key: "provider", label: "Model provider", status: providerCount > 0 ? "ok" : "warning", detail: providerCount > 0 ? `${providerCount} providers configured.` : "Preview works; configure providers before production generation." }
    ];
  }
  return [
    { key: "local-first", label: "本地处理", status: "ok", detail: "桌面端默认把源文件和输出保存在本地项目目录。" },
    { key: "editable-output", label: "真实可编辑", status: mode === "pptx" ? "ok" : "warning", detail: "PPTX 路线强调可编辑；Web Deck 路线强调演示体验。" },
    { key: "provider", label: "模型 Provider", status: providerCount > 0 ? "ok" : "warning", detail: providerCount > 0 ? `${providerCount} 个 provider 已配置。` : "预览可用，生产级生成前建议配置 provider。" }
  ];
}

function readStoredLanguage(): AppLanguage {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" ? "en" : "zh";
}

function localizedStyleOptions(language: AppLanguage) {
  if (language === "zh") return styleOptions;
  return styleOptions.map((option) => ({ ...option, ...styleOptionsEn[option.key] }));
}

function localizedStep(step: WorkerStep, language: AppLanguage): WorkerStep {
  if (language === "zh") return step;
  const byKey: Record<string, { label: string; message: string }> = {
    source: { label: "Source processing", message: "Read the source and create a local project." },
    strategy: { label: "Strategy", message: "Extract the story structure and slide skeleton." },
    design: { label: "Design lock", message: "Apply the selected output mode and style preset." },
    generate: { label: "Preview generation", message: "Generate local PPTX or web preview files." },
    verify: { label: "Verification", message: "Check output paths, preview content, and logs." },
    export: { label: "Export", message: "Save results and write the project manifest." }
  };
  return byKey[step.key] ? { ...step, ...byKey[step.key] } : step;
}

function localizedCheck(check: ProjectCheck, language: AppLanguage, providerCount: number, mode: OutputMode): ProjectCheck {
  if (language === "zh") return check;
  const byKey: Record<string, Pick<ProjectCheck, "label" | "detail">> = {
    "local-first": { label: "Local-first", detail: "Sources and outputs stay in the local project folder. No cloud upload by default." },
    "editable-output": { label: "Editable output", detail: mode === "pptx" ? "The PPTX path outputs real text and shapes." : "The Web Deck path prioritizes presentation experience." },
    provider: { label: "Model provider", detail: providerCount > 0 ? `${providerCount} providers configured.` : "Preview works; production generation should configure providers." },
    "document-parser": { label: "Document parsing", detail: check.status === "ok" ? "DOCX and text inputs are converted into source.md for immediate preview." : "PDF/XLSX/PPTX files are staged locally; full parsing is handled by the Agent workflow." },
    venv: { label: "Python venv", detail: "Repository .venv was not found. Initialize dependencies from INSTALL.md." },
    rust: { label: "Tauri packaging", detail: "Rust/Cargo was not detected. Web shell works; native .app/.dmg packaging needs Rust." }
  };
  return byKey[check.key] ? { ...check, ...byKey[check.key] } : check;
}

function localizedExtractionDetail(extraction: SourceExtraction, language: AppLanguage) {
  if (language === "zh") return extraction.detail;
  if (extraction.status === "extracted") return "The source was converted into source.md and used for this PPTX/Web preview.";
  if (extraction.status === "copied") return "The source file was copied into the local project; use Agent handoff for deeper parsing.";
  return "The file was staged locally; continue with the Agent workflow for complete parsing and production output.";
}

function describeSourceReadiness(kind: SourceKind, value: string, name: string, language: AppLanguage) {
  const en = language === "en";
  const suffix = (name || value).split(".").pop()?.toLowerCase() || "";
  if (kind === "markdown" || kind === "text") {
    return {
      status: "extracted",
      title: en ? "Ready for immediate preview" : "可直接生成预览",
      detail: en ? "Pasted Markdown/text is written into source.md and used right away." : "粘贴的 Markdown/文本会写入 source.md，并立即参与 PPTX/Web 生成。"
    };
  }
  if (kind === "url") {
    return {
      status: "handoffRequired",
      title: en ? "URL staged for Agent handoff" : "URL 已准备交给 Agent",
      detail: en ? "The desktop app stores the URL; fetching and grounding happen in the Agent workflow." : "桌面端会保存 URL；网页抓取和事实校验由 Agent 工作流完成。"
    };
  }
  if (suffix === "docx") {
    return {
      status: "extracted",
      title: en ? "DOCX text will be extracted" : "DOCX 会读取正文",
      detail: en ? "Native desktop generation converts DOCX into source.md before creating PPTX/Web previews." : "原生桌面生成会先把 DOCX 转成 source.md，再生成 PPTX/Web 预览。"
    };
  }
  if (["pdf", "xlsx", "xlsm", "pptx"].includes(suffix)) {
    return {
      status: "handoffRequired",
      title: en ? "File will be staged locally" : "文件会先进入本地项目",
      detail: en ? "This format is copied into the project; complete parsing is handled by the Agent workflow." : "该格式会复制进项目目录；完整解析由 Agent 工作流接管。"
    };
  }
  if (kind === "file") {
    return {
      status: "copied",
      title: en ? "File path mode" : "文件路径模式",
      detail: en ? "Use an absolute path in native desktop mode. Browser preview cannot read binary local files." : "原生桌面壳请填写绝对路径；浏览器预览无法读取本地二进制文件。"
    };
  }
  return null;
}

function actionLabel(action: NextAction, language: AppLanguage) {
  if (language === "zh") return action.label;
  const labels: Record<string, string> = {
    "open-result": "Open result file",
    "open-folder": "Open project folder",
    "agent-handoff": "Hand off to Agent",
    "open-log": "Open log"
  };
  return labels[action.key] || action.label;
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

function copyHandoffPrompt(result: WorkerResult, language: AppLanguage) {
  const sourcePath = result.sourceExtraction?.generatedMarkdownPath || `${result.projectPath}/sources/source.md`;
  const prompt = language === "en"
    ? `Read ${result.projectPath}/README.md and follow the ultimate-ppt-master workflow. Use ${sourcePath} as the source material. Continue from the desktop preview and produce a production-quality ${modeLabel(result.outputMode || "pptx", language)}.`
    : `请读取 ${result.projectPath}/README.md，并按 ultimate-ppt-master 工作流继续。使用 ${sourcePath} 作为源材料，在桌面预览基础上生成生产级 ${modeLabel(result.outputMode || "pptx", language)}。`;
  navigator.clipboard?.writeText(prompt).catch(() => console.info("Clipboard write is not available in this environment."));
}

function shortenPath(value: string) {
  if (value.length <= 46) return value;
  return `...${value.slice(-43)}`;
}

function statusLabel(status: RecentProject["status"], language: AppLanguage) {
  if (language === "en") {
    if (status === "complete") return "Complete";
    if (status === "error") return "Error";
    return "Draft";
  }
  if (status === "complete") return "已完成";
  if (status === "error") return "有错误";
  return "草稿";
}

function formatDate(value: string, language: AppLanguage) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(language === "en" ? "en-US" : "zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function modeLabel(mode: OutputMode, language: AppLanguage = "zh") {
  if (language === "en") return mode === "pptx" ? "Editable PPTX" : "Magazine Web Deck";
  return mode === "pptx" ? "可编辑 PPTX" : "杂志风网页 PPT";
}

function styleTitle(style: StylePreset, language: AppLanguage = "zh") {
  if (language === "en") return styleOptionsEn[style]?.title || style;
  return styleOptions.find((option) => option.key === style)?.title || style;
}

function humanizeError(error: unknown, language: AppLanguage = "zh") {
  const text = String(error);
  if (text.includes("python-pptx")) {
    if (language === "en") return "python-pptx is missing. Run `.venv/bin/python -m pip install -r requirements.txt` from the repository root.";
    return "缺少 python-pptx。请在仓库根目录执行 `.venv/bin/python -m pip install -r requirements.txt`。";
  }
  if (text.includes("DOCX parsing failed") || text.includes("mammoth")) {
    if (language === "en") return "DOCX parsing failed. Run `npm run setup` from the repository root, then retry with the native desktop shell.";
    return "DOCX 解析失败。请在仓库根目录执行 `npm run setup`，然后用原生桌面壳重试。";
  }
  if (text.includes("Source file not found")) {
    if (language === "en") return "Source file not found. Provide a full path, or paste Markdown / text directly.";
    return "找不到源文件。请填写完整路径，或直接粘贴 Markdown / 文本。";
  }
  if (text.includes("No JSON job")) {
    if (language === "en") return "No generation job was received. Return to Create and submit again.";
    return "没有收到生成任务，请回到创建页重新提交。";
  }
  return text;
}

const sampleMarkdown = `# 终极融合 PPT 大师 v2.1.0

- 把真实资料变成可编辑 PPTX 或杂志风网页 PPT
- 支持 PDF、DOCX、XLSX、PPTX、URL、Markdown 和粘贴文本
- 保留本地优先、多 Agent 兼容和可验证导出
- 桌面版目标是让普通创作者三步完成`;
