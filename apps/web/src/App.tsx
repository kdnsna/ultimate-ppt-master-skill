import {
  BookOpen,
  Clipboard,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Wand2,
  Workflow
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import JSZip from "jszip";
import { useEffect, useMemo, useState } from "react";

type Language = "zh" | "en";
type SourceType = "markdown" | "docx" | "pdf" | "url" | "pptx" | "mixed";
type Scenario = "executive" | "consulting" | "training" | "launch" | "investor";
type OutputMode = "pptx" | "web" | "both";
type StylePreset = "business" | "consulting" | "editorial" | "swiss" | "academic";
type AgentTool = "codex" | "claude" | "hermes" | "openclaw" | "generic";
type ModelPreference = "auto" | "openai" | "gemini" | "qwen" | "deepseek" | "custom";
type PreviewMode = "prompt" | "source" | "brief" | "webdeck" | "checklist";

interface StoryItem {
  title: string;
  intent: string;
}

interface EnginePlan {
  pptxActive: boolean;
  webActive: boolean;
  pptxRoute: string;
  webRoute: string;
  styleRoute: string;
  fusionRoute: string;
}

interface FormState {
  language: Language;
  sourceType: SourceType;
  scenario: Scenario;
  outputMode: OutputMode;
  stylePreset: StylePreset;
  agentTool: AgentTool;
  modelPreference: ModelPreference;
  title: string;
  audience: string;
  slideCount: string;
  coreMessage: string;
  sourceNotes: string;
  constraints: string;
}

const baseUrl = import.meta.env.BASE_URL;
const repoUrl = "https://github.com/kdnsna/ultimate-ppt-master-skill";
const demoUrl = `${baseUrl}examples/desktop-cultural-tourism-demo/web-demo.html`;
const skillDocUrl = `${repoUrl}#use-as-agent-skill`;
const storageKey = "ultimate-ppt-master-web-brief-v2";

const labels = {
  zh: {
    product: "Ultimate PPT Master",
    studio: "Deck Brief Studio",
    route: "Web 组装 brief，Skill 负责生产",
    subtitle: "把零散材料先整理成 Agent 可执行的交付包，再进入 Codex / Claude Code / Hermes / OpenClaw 的生产流程。",
    openDemo: "打开 Web Deck 示例",
    copyPrompt: "复制 Agent prompt",
    copySource: "复制 source.md",
    downloadSource: "下载 source.md",
    downloadWebDeck: "下载 preview-web-deck.html",
    downloadKit: "下载 handoff-kit.zip",
    skillSetup: "Skill 安装说明",
    sourcePanel: "资料与目标",
    structurePanel: "页纲与检查",
    handoffPanel: "交付给 Agent",
    previewPrompt: "Agent prompt",
    previewSource: "source.md",
    previewBrief: "brief.json",
    previewWebDeck: "preview-web-deck.html",
    previewChecklist: "quality-checklist.md",
    sourceType: "资料类型",
    scenario: "使用场景",
    outputMode: "输出形式",
    stylePreset: "视觉风格",
    agentTool: "Agent 工具",
    modelPreference: "模型偏好",
    titleField: "项目标题",
    audience: "目标听众",
    slideCount: "页数",
    coreMessage: "核心结论",
    sourceNotes: "粘贴资料 / 摘要",
    constraints: "补充要求",
    copied: "已复制",
    kitReady: "交付包已生成",
    copyFailed: "复制失败，请手动选择内容",
    localOnly: "本地生成，不上传资料",
    noBackend: "无后端，无模型托管",
    skillRole: "Skill 继续读文件、跑脚本、预览、修复、导出",
    readiness: "Brief 完整度",
    missing: "还可补充",
    kitIncludes: "交付包内容",
    enginePanel: "双引擎执行路线",
    webPreviewPanel: "Web Deck 实时预览",
    previewNote: "这是可下载的本地预览稿；正式生产仍交给 Skill 读取真实资料、渲染、检查和修复。",
    activeRoute: "启用",
    optionalRoute: "备用",
    demoTitle: "Web Deck 示例",
    demoText: "脱敏文旅活动材料，展示网页 PPT 的节奏。",
    skillTitle: "Agent Skill 路线",
    skillText: "把 handoff-kit.zip 或其中的文件交给 Agent 执行。",
    desktopTitle: "Desktop Later",
    desktopText: "桌面端保留为高级本地模式。",
    privacyNote: "所有生成都发生在浏览器里；下载包只保存在你的本机。"
  },
  en: {
    product: "Ultimate PPT Master",
    studio: "Deck Brief Studio",
    route: "Web assembles the brief, Skill produces the deck",
    subtitle: "Turn scattered material into a local Agent handoff kit before Codex, Claude Code, Hermes, or OpenClaw starts production.",
    openDemo: "Open Web Deck demo",
    copyPrompt: "Copy Agent prompt",
    copySource: "Copy source.md",
    downloadSource: "Download source.md",
    downloadWebDeck: "Download preview-web-deck.html",
    downloadKit: "Download handoff-kit.zip",
    skillSetup: "Skill setup",
    sourcePanel: "Source and target",
    structurePanel: "Outline and checks",
    handoffPanel: "Agent handoff",
    previewPrompt: "Agent prompt",
    previewSource: "source.md",
    previewBrief: "brief.json",
    previewWebDeck: "preview-web-deck.html",
    previewChecklist: "quality-checklist.md",
    sourceType: "Source type",
    scenario: "Scenario",
    outputMode: "Output",
    stylePreset: "Visual style",
    agentTool: "Agent tool",
    modelPreference: "Model preference",
    titleField: "Project title",
    audience: "Audience",
    slideCount: "Slide count",
    coreMessage: "Core message",
    sourceNotes: "Pasted material / notes",
    constraints: "Extra requirements",
    copied: "Copied",
    kitReady: "Handoff kit generated",
    copyFailed: "Copy failed; select manually",
    localOnly: "Generated locally",
    noBackend: "No backend, no hosted model",
    skillRole: "Skill reads files, runs scripts, previews, repairs, exports",
    readiness: "Brief readiness",
    missing: "Improve next",
    kitIncludes: "Handoff kit contents",
    enginePanel: "Dual-engine execution route",
    webPreviewPanel: "Live Web Deck preview",
    previewNote: "This is a downloadable local preview. Production still belongs to the Skill: read real files, render, inspect, and repair.",
    activeRoute: "Active",
    optionalRoute: "Optional",
    demoTitle: "Web Deck demo",
    demoText: "A sanitized culture-tourism brief showing Web Deck rhythm.",
    skillTitle: "Agent Skill path",
    skillText: "Hand the zip or included files to your Agent.",
    desktopTitle: "Desktop Later",
    desktopText: "Desktop remains an advanced local mode.",
    privacyNote: "Everything is generated in your browser. Downloads stay on your machine."
  }
};

const optionText = {
  sourceType: {
    markdown: { zh: "Markdown / 粘贴文本", en: "Markdown / pasted text" },
    docx: { zh: "DOCX 汇报材料", en: "DOCX brief" },
    pdf: { zh: "PDF / 研报", en: "PDF / report" },
    url: { zh: "网页 / URL", en: "Web page / URL" },
    pptx: { zh: "已有 PPTX", en: "Existing PPTX" },
    mixed: { zh: "多文件资料包", en: "Mixed source pack" }
  },
  scenario: {
    executive: { zh: "高管汇报", en: "Executive review" },
    consulting: { zh: "咨询方案", en: "Consulting delivery" },
    training: { zh: "培训课件", en: "Training courseware" },
    launch: { zh: "发布会演讲", en: "Launch keynote" },
    investor: { zh: "融资 / 路演", en: "Investor pitch" }
  },
  outputMode: {
    pptx: { zh: "可编辑 PPTX", en: "Editable PPTX" },
    web: { zh: "Web Deck", en: "Web Deck" },
    both: { zh: "PPTX + Web Deck", en: "PPTX + Web Deck" }
  },
  stylePreset: {
    business: { zh: "商务汇报", en: "Business report" },
    consulting: { zh: "咨询风", en: "Consulting" },
    editorial: { zh: "电子杂志", en: "Editorial" },
    swiss: { zh: "Swiss Style", en: "Swiss Style" },
    academic: { zh: "学术 / 培训", en: "Academic / training" }
  },
  agentTool: {
    codex: { zh: "Codex", en: "Codex" },
    claude: { zh: "Claude Code", en: "Claude Code" },
    hermes: { zh: "Hermes", en: "Hermes" },
    openclaw: { zh: "OpenClaw", en: "OpenClaw" },
    generic: { zh: "通用 Agent", en: "Generic Agent" }
  },
  modelPreference: {
    auto: { zh: "自动选择", en: "Auto" },
    openai: { zh: "OpenAI / 兼容", en: "OpenAI / compatible" },
    gemini: { zh: "Gemini", en: "Gemini" },
    qwen: { zh: "Qwen / DashScope", en: "Qwen / DashScope" },
    deepseek: { zh: "DeepSeek", en: "DeepSeek" },
    custom: { zh: "自定义模型", en: "Custom model" }
  }
} as const;

const defaultForm: FormState = {
  language: "zh",
  sourceType: "docx",
  scenario: "executive",
  outputMode: "both",
  stylePreset: "business",
  agentTool: "codex",
  modelPreference: "auto",
  title: "季度业务复盘与下一步增长动作",
  audience: "公司管理层 / 项目负责人",
  slideCount: "12",
  coreMessage: "本季度增长质量需要从规模复盘转向下一阶段动作拆解，重点呈现风险、机会和可执行抓手。",
  sourceNotes: "1. 业务整体保持增长，但不同区域和渠道分化明显。\n2. 管理层关心下一阶段资源投入、关键风险和可量化目标。\n3. 需要同时输出正式可编辑 PPTX，以及适合分享的 Web Deck。",
  constraints: "结论先行，减少空话；PPTX 保留可编辑结构；Web Deck 更适合传播；不要上传敏感资料，生成后检查预览和导出文件。"
};

export function App() {
  const [form, setForm] = useState<FormState>(() => loadSavedForm());
  const [previewMode, setPreviewMode] = useState<PreviewMode>("prompt");
  const [copyState, setCopyState] = useState("");
  const t = labels[form.language];
  const storyboard = useMemo(() => buildStoryboard(form), [form]);
  const enginePlan = useMemo(() => buildEnginePlan(form), [form]);
  const readiness = useMemo(() => scoreBrief(form), [form]);
  const prompt = useMemo(() => buildPrompt(form, storyboard, enginePlan), [form, storyboard, enginePlan]);
  const sourceTemplate = useMemo(() => buildSourceTemplate(form, storyboard, enginePlan), [form, storyboard, enginePlan]);
  const qualityChecklist = useMemo(() => buildQualityChecklist(form, enginePlan), [form, enginePlan]);
  const webDeckHtml = useMemo(() => buildWebDeckHtml(form, storyboard, enginePlan), [form, storyboard, enginePlan]);
  const briefJson = useMemo(() => buildBriefJson(form, storyboard, readiness, enginePlan), [form, storyboard, readiness, enginePlan]);
  const visiblePreview =
    previewMode === "prompt"
      ? prompt
      : previewMode === "source"
        ? sourceTemplate
        : previewMode === "brief"
          ? briefJson
          : previewMode === "webdeck"
            ? webDeckHtml
            : qualityChecklist;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setCopyState("");
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(t.copied);
    } catch {
      setCopyState(t.copyFailed);
    }
  }

  function downloadText(filename: string, text: string, type = "text/markdown;charset=utf-8") {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadHandoffKit() {
    const zip = new JSZip();
    zip.file("source.md", sourceTemplate);
    zip.file("agent-prompt.md", prompt);
    zip.file("project-brief.json", briefJson);
    zip.file("preview-web-deck.html", webDeckHtml);
    zip.file("engine-plan.md", buildEnginePlanMarkdown(form, enginePlan));
    zip.file("quality-checklist.md", qualityChecklist);
    zip.file("README.md", buildKitReadme(form, enginePlan));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "handoff-kit.zip";
    link.click();
    URL.revokeObjectURL(url);
    setCopyState(t.kitReady);
  }

  return (
    <div className="app" lang={form.language === "zh" ? "zh-CN" : "en"}>
      <header className="topbar">
        <a className="brand" href={repoUrl} aria-label="Ultimate PPT Master GitHub">
          <img src={`${baseUrl}brand.svg`} alt="" />
          <span>{t.product}</span>
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href={demoUrl}>Demo</a>
          <a href={skillDocUrl}>Skill</a>
          <a href={repoUrl}>GitHub</a>
          <button className="language-button" onClick={() => update("language", form.language === "zh" ? "en" : "zh")}>
            <Globe2 size={16} />
            {form.language === "zh" ? "EN" : "中文"}
          </button>
        </nav>
      </header>

      <main>
        <section className="studio-header">
          <div>
            <p className="eyebrow">{t.route}</p>
            <h1>{t.studio}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="header-actions">
            <button className="primary-action" onClick={downloadHandoffKit}>
              <Download size={18} />
              {t.downloadKit}
            </button>
            <button className="secondary-action" onClick={() => copyText(prompt)}>
              <Clipboard size={18} />
              {copyState || t.copyPrompt}
            </button>
          </div>
        </section>

        <section className="status-strip" aria-label="Workflow safeguards">
          <span><ShieldCheck size={15} />{t.localOnly}</span>
          <span><MonitorPlay size={15} />{t.noBackend}</span>
          <span><Workflow size={15} />{t.skillRole}</span>
        </section>

        <section className="studio-grid">
          <section className="panel source-panel" aria-labelledby="source-title">
            <PanelTitle icon={Wand2} id="source-title" title={t.sourcePanel} />
            <div className="control-grid">
              <SelectField label={t.sourceType} value={form.sourceType} onChange={(value) => update("sourceType", value as SourceType)} options={toOptions(optionText.sourceType, form.language)} />
              <SelectField label={t.scenario} value={form.scenario} onChange={(value) => update("scenario", value as Scenario)} options={toOptions(optionText.scenario, form.language)} />
              <SelectField label={t.outputMode} value={form.outputMode} onChange={(value) => update("outputMode", value as OutputMode)} options={toOptions(optionText.outputMode, form.language)} />
              <SelectField label={t.stylePreset} value={form.stylePreset} onChange={(value) => update("stylePreset", value as StylePreset)} options={toOptions(optionText.stylePreset, form.language)} />
              <SelectField label={t.agentTool} value={form.agentTool} onChange={(value) => update("agentTool", value as AgentTool)} options={toOptions(optionText.agentTool, form.language)} />
              <SelectField label={t.modelPreference} value={form.modelPreference} onChange={(value) => update("modelPreference", value as ModelPreference)} options={toOptions(optionText.modelPreference, form.language)} />
            </div>
            <div className="field-stack">
              <label>
                {t.titleField}
                <input value={form.title} onChange={(event) => update("title", event.target.value)} />
              </label>
              <div className="split-fields">
                <label>
                  {t.audience}
                  <input value={form.audience} onChange={(event) => update("audience", event.target.value)} />
                </label>
                <label>
                  {t.slideCount}
                  <input value={form.slideCount} onChange={(event) => update("slideCount", event.target.value)} />
                </label>
              </div>
              <label>
                {t.coreMessage}
                <textarea className="medium-input" value={form.coreMessage} onChange={(event) => update("coreMessage", event.target.value)} />
              </label>
              <label>
                {t.sourceNotes}
                <textarea className="large-input" value={form.sourceNotes} onChange={(event) => update("sourceNotes", event.target.value)} />
              </label>
              <label>
                {t.constraints}
                <textarea className="medium-input" value={form.constraints} onChange={(event) => update("constraints", event.target.value)} />
              </label>
            </div>
          </section>

          <section className="panel structure-panel" aria-labelledby="structure-title">
            <PanelTitle icon={Sparkles} id="structure-title" title={t.structurePanel} />
            <div className="readiness">
              <div>
                <span>{t.readiness}</span>
                <strong>{readiness.score}%</strong>
              </div>
              <div className="meter" aria-hidden="true">
                <span style={{ width: `${readiness.score}%` }} />
              </div>
            </div>
            <div className="engine-section">
              <strong>{t.enginePanel}</strong>
              <div className="engine-grid">
                <EngineCard
                  icon={FileText}
                  active={enginePlan.pptxActive}
                  status={enginePlan.pptxActive ? t.activeRoute : t.optionalRoute}
                  title={form.language === "zh" ? "Hugo He / PPTX 可编辑路线" : "Hugo He / editable PPTX route"}
                  text={enginePlan.pptxRoute}
                />
                <EngineCard
                  icon={MonitorPlay}
                  active={enginePlan.webActive}
                  status={enginePlan.webActive ? t.activeRoute : t.optionalRoute}
                  title={form.language === "zh" ? "op7418 歸藏 / Web Deck 路线" : "op7418 Guizang / Web Deck route"}
                  text={enginePlan.webRoute}
                />
                <EngineCard
                  icon={Workflow}
                  active
                  status={t.activeRoute}
                  title={form.language === "zh" ? "Ultimate Fusion / 前台整合" : "Ultimate Fusion / front-door shell"}
                  text={enginePlan.fusionRoute}
                />
              </div>
            </div>
            {readiness.missing.length > 0 && (
              <div className="missing-box">
                <strong>{t.missing}</strong>
                {readiness.missing.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
            <div className="story-list">
              {storyboard.map((item, index) => (
                <article key={item.title} className="story-row">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.intent}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel handoff-panel" aria-labelledby="handoff-title">
            <PanelTitle icon={Code2} id="handoff-title" title={t.handoffPanel} />
            <div className="action-stack">
              <button className="primary-action full" onClick={downloadHandoffKit}>
                <Download size={18} />
                {t.downloadKit}
              </button>
              <button className="secondary-action full" onClick={() => copyText(prompt)}>
                <Clipboard size={18} />
                {copyState || t.copyPrompt}
              </button>
              <button className="secondary-action full" onClick={() => copyText(sourceTemplate)}>
                <FileText size={18} />
                {t.copySource}
              </button>
              <button className="secondary-action full" onClick={() => downloadText("source.md", sourceTemplate)}>
                <Download size={18} />
                {t.downloadSource}
              </button>
              <button className="secondary-action full" onClick={() => downloadText("preview-web-deck.html", webDeckHtml, "text/html;charset=utf-8")}>
                <MonitorPlay size={18} />
                {t.downloadWebDeck}
              </button>
            </div>
            <div className="kit-box">
              <strong>{t.kitIncludes}</strong>
              <span>source.md</span>
              <span>agent-prompt.md</span>
              <span>project-brief.json</span>
              <span>preview-web-deck.html</span>
              <span>engine-plan.md</span>
              <span>quality-checklist.md</span>
              <span>README.md</span>
            </div>
            <div className="route-list">
              <InfoRow icon={MonitorPlay} title={t.demoTitle} text={t.demoText} />
              <InfoRow icon={BookOpen} title={t.skillTitle} text={t.skillText} />
              <InfoRow icon={FileText} title={t.desktopTitle} text={t.desktopText} />
            </div>
            <a className="primary-action full" href={demoUrl}>
              <ExternalLink size={18} />
              {t.openDemo}
            </a>
            <a className="secondary-action full" href={skillDocUrl}>
              <BookOpen size={18} />
              {t.skillSetup}
            </a>
            <p className="hint">{t.privacyNote}</p>
          </section>
        </section>

        <section className="panel web-preview-panel" aria-labelledby="web-preview-title">
          <div className="preview-shell-heading">
            <PanelTitle icon={MonitorPlay} id="web-preview-title" title={t.webPreviewPanel} />
            <div className="preview-meta">
              <span>{enginePlan.styleRoute}</span>
              <span>{enginePlan.webActive ? t.activeRoute : t.optionalRoute}</span>
            </div>
          </div>
          <div className="web-preview-frame">
            <iframe title={t.webPreviewPanel} srcDoc={webDeckHtml} sandbox="" />
          </div>
          <p className="hint">{t.previewNote}</p>
        </section>

        <section className="panel preview-panel" aria-label="Generated outputs">
          <div className="preview-tabs" role="tablist">
            <button className={previewMode === "prompt" ? "active" : ""} onClick={() => setPreviewMode("prompt")}>{t.previewPrompt}</button>
            <button className={previewMode === "source" ? "active" : ""} onClick={() => setPreviewMode("source")}>{t.previewSource}</button>
            <button className={previewMode === "brief" ? "active" : ""} onClick={() => setPreviewMode("brief")}>{t.previewBrief}</button>
            <button className={previewMode === "webdeck" ? "active" : ""} onClick={() => setPreviewMode("webdeck")}>{t.previewWebDeck}</button>
            <button className={previewMode === "checklist" ? "active" : ""} onClick={() => setPreviewMode("checklist")}>{t.previewChecklist}</button>
          </div>
          <pre>{visiblePreview}</pre>
        </section>
      </main>
    </div>
  );
}

function PanelTitle({ icon: Icon, title, id }: { icon: LucideIcon; title: string; id: string }) {
  return (
    <div className="panel-heading">
      <Icon size={18} />
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-field">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoRow({
  icon: Icon,
  title,
  text
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <article className="info-row">
      <Icon size={18} />
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </article>
  );
}

function EngineCard({
  icon: Icon,
  active,
  status,
  title,
  text
}: {
  icon: LucideIcon;
  active: boolean;
  status: string;
  title: string;
  text: string;
}) {
  return (
    <article className={`engine-card ${active ? "active" : "optional"}`}>
      <div>
        <Icon size={17} />
        <span>{status}</span>
      </div>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}

function toOptions<T extends string>(items: Record<T, Record<Language, string>>, language: Language) {
  return (Object.keys(items) as T[]).map((value) => ({
    value,
    label: items[value][language]
  }));
}

function readOption<T extends string>(items: Record<T, Record<Language, string>>, value: T, language: Language) {
  return items[value][language];
}

function loadSavedForm() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultForm;
    return { ...defaultForm, ...JSON.parse(saved) } as FormState;
  } catch {
    return defaultForm;
  }
}

function scoreBrief(form: FormState) {
  const checks = [
    { ok: form.title.trim().length > 4, zh: "补项目标题", en: "Add project title" },
    { ok: form.audience.trim().length > 4, zh: "补目标听众", en: "Add audience" },
    { ok: form.coreMessage.trim().length > 12, zh: "补核心结论", en: "Add core message" },
    { ok: form.sourceNotes.trim().length > 40, zh: "补资料摘要", en: "Add source notes" },
    { ok: form.constraints.trim().length > 12, zh: "补交付要求", en: "Add delivery requirements" },
    { ok: Number.parseInt(form.slideCount, 10) > 0, zh: "补页数", en: "Add slide count" }
  ];
  const complete = checks.filter((item) => item.ok).length;
  return {
    score: Math.round((complete / checks.length) * 100),
    missing: checks.filter((item) => !item.ok).map((item) => item[form.language])
  };
}

function buildEnginePlan(form: FormState): EnginePlan {
  const zh = form.language === "zh";
  const pptxActive = form.outputMode === "pptx" || form.outputMode === "both";
  const webActive = form.outputMode === "web" || form.outputMode === "both";
  const styleRoute =
    form.stylePreset === "swiss"
      ? zh
        ? "Style B: Swiss Style / 严格网格"
        : "Style B: Swiss Style / strict grid"
      : form.stylePreset === "editorial"
        ? zh
          ? "Style A: 电子杂志 / 叙事长图"
          : "Style A: editorial magazine / narrative longform"
        : zh
          ? "Business-Fusion: 汇报可读性优先"
          : "Business-Fusion: report readability first";

  return {
    pptxActive,
    webActive,
    styleRoute,
    pptxRoute: zh
      ? "继承 Hugo He ppt-master 的可编辑 PPTX、SVG 转 PPTX、模板、图表、渲染和修复链路。"
      : "Use the Hugo He ppt-master lineage for editable PPTX, SVG-to-PPTX, templates, charts, rendering, and repair.",
    webRoute: zh
      ? "继承 op7418 / 歸藏的杂志化 Web Deck、Swiss Style、组件和视觉检查路线。"
      : "Use the op7418 / Guizang lineage for magazine Web Decks, Swiss Style, components, and visual QA.",
    fusionRoute: zh
      ? "网页端负责资料结构化、路线选择、预览 HTML、执行 prompt、质量清单和 handoff-kit。"
      : "The web shell handles source structuring, route selection, preview HTML, execution prompt, QA checklist, and the handoff kit."
  };
}

function buildStoryboard(form: FormState): StoryItem[] {
  const zh = form.language === "zh";
  const scenarioSeeds: Record<Scenario, StoryItem[]> = {
    executive: [
      { title: zh ? "封面与一句话结论" : "Cover and one-line conclusion", intent: zh ? "先把管理层需要记住的判断放出来。" : "Put the executive takeaway first." },
      { title: zh ? "现状与关键数据" : "Current state and key numbers", intent: zh ? "用少量指标说明当前状态。" : "Summarize the current state with a few metrics." },
      { title: zh ? "差异与原因" : "Gaps and causes", intent: zh ? "解释区域、渠道或产品分化。" : "Explain regional, channel, or product variance." },
      { title: zh ? "风险与机会" : "Risks and opportunities", intent: zh ? "把下一步决策需要的信息摆清楚。" : "Clarify information needed for decisions." },
      { title: zh ? "行动计划" : "Action plan", intent: zh ? "形成责任、节奏和结果指标。" : "Define owners, cadence, and result metrics." }
    ],
    consulting: [
      { title: zh ? "问题定义" : "Problem definition", intent: zh ? "界定客户真正要解决的问题。" : "Define the client's real problem." },
      { title: zh ? "诊断框架" : "Diagnostic frame", intent: zh ? "建立分析维度和证据链。" : "Set dimensions and evidence." },
      { title: zh ? "核心洞察" : "Core insights", intent: zh ? "把资料转成可解释的判断。" : "Turn material into defensible findings." },
      { title: zh ? "方案设计" : "Solution design", intent: zh ? "给出路径、抓手和优先级。" : "Give path, levers, and priorities." },
      { title: zh ? "实施路线" : "Implementation roadmap", intent: zh ? "明确阶段、资源和里程碑。" : "Clarify phases, resources, milestones." }
    ],
    training: [
      { title: zh ? "课程目标" : "Learning objectives", intent: zh ? "说明学员完成后能做什么。" : "State what learners can do after the session." },
      { title: zh ? "知识地图" : "Knowledge map", intent: zh ? "把内容拆成可学习模块。" : "Break content into learnable modules." },
      { title: zh ? "关键概念" : "Key concepts", intent: zh ? "用例子解释核心概念。" : "Explain key concepts with examples." },
      { title: zh ? "练习与案例" : "Exercises and cases", intent: zh ? "让学员做一次迁移应用。" : "Make learners apply the material." },
      { title: zh ? "复盘与作业" : "Review and assignment", intent: zh ? "留下检查点和后续任务。" : "Leave checkpoints and follow-up tasks." }
    ],
    launch: [
      { title: zh ? "开场钩子" : "Opening hook", intent: zh ? "用一句冲突或机会吸引注意。" : "Open with tension or opportunity." },
      { title: zh ? "用户痛点" : "User pain", intent: zh ? "讲清楚为什么现在需要它。" : "Show why this matters now." },
      { title: zh ? "产品主张" : "Product promise", intent: zh ? "把产品价值压缩成清晰主张。" : "Compress product value into a clear promise." },
      { title: zh ? "体验演示" : "Experience demo", intent: zh ? "安排可视化演示或场景流。" : "Plan the visual demo or scene flow." },
      { title: zh ? "行动召唤" : "Call to action", intent: zh ? "收束到试用、注册、合作或传播。" : "Close with trial, signup, partnership, or sharing." }
    ],
    investor: [
      { title: zh ? "投资亮点" : "Investment highlights", intent: zh ? "先给出为什么值得继续听。" : "Start with why this deserves attention." },
      { title: zh ? "市场机会" : "Market opportunity", intent: zh ? "说明市场、时机和切入点。" : "Explain market, timing, and wedge." },
      { title: zh ? "产品与壁垒" : "Product and moat", intent: zh ? "证明产品解决问题并能防守。" : "Show product fit and defensibility." },
      { title: zh ? "增长证据" : "Traction evidence", intent: zh ? "用数据证明增长或验证。" : "Use data to prove traction or validation." },
      { title: zh ? "融资用途" : "Use of funds", intent: zh ? "把融资额和里程碑绑定。" : "Tie funding to milestones." }
    ]
  };
  const close = {
    title: zh ? "交付与检查清单" : "Delivery and QA checklist",
    intent: zh ? "要求 Agent 预览、修复并列出最终文件。" : "Ask the Agent to preview, repair, and list final files."
  };
  const targetCount = Math.max(4, Number.parseInt(form.slideCount, 10) || 8);
  const seeds = scenarioSeeds[form.scenario];
  const repeated = [...seeds, close];
  return repeated.slice(0, Math.min(repeated.length, targetCount));
}

function buildPrompt(form: FormState, storyboard: StoryItem[], enginePlan: EnginePlan) {
  const sourceType = readOption(optionText.sourceType, form.sourceType, form.language);
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  const style = readOption(optionText.stylePreset, form.stylePreset, form.language);
  const agent = readOption(optionText.agentTool, form.agentTool, form.language);
  const model = readOption(optionText.modelPreference, form.modelPreference, form.language);
  const outline = storyboard.map((item, index) => `${index + 1}. ${item.title}: ${item.intent}`).join("\n");
  const activeEngines = [
    enginePlan.pptxActive ? `PPTX: ${enginePlan.pptxRoute}` : "",
    enginePlan.webActive ? `Web Deck: ${enginePlan.webRoute}` : ""
  ].filter(Boolean).join("\n- ");

  if (form.language === "en") {
    return `Use the ultimate-ppt-master Agent Skill for this presentation task.\n\nProject title: ${form.title}\nAudience: ${form.audience}\nCore message: ${form.coreMessage}\nSource type: ${sourceType}\nScenario: ${scenario}\nOutput target: ${output}\nVisual style: ${style}\nTarget length: ${form.slideCount} slides\nPreferred agent: ${agent}\nModel preference: ${model}\n\nExecution route:\n- ${activeEngines}\n- Fusion shell: ${enginePlan.fusionRoute}\n- Visual route: ${enginePlan.styleRoute}\n\nSource material supplied in the handoff kit:\n- source.md contains the user's pasted material, source notes, engine route, and generated outline.\n- project-brief.json contains structured choices from Deck Brief Studio.\n- preview-web-deck.html is a local browser preview, not the final production deck.\n- engine-plan.md explains when to use the PPTX route, Web Deck route, or both.\n- quality-checklist.md defines the checks to run before delivery.\n- Keep private source material local. Do not upload it unless explicitly asked.\n\nSuggested outline:\n${outline}\n\nRequirements:\n- Read AGENTS.md and SKILL.md from the ultimate-ppt-master repository.\n- Respect the third-party notices and existing upstream license attributions.\n- Treat source.md as the starting source, then improve it if the actual source files are also provided.\n- Build the narrative before generating slides.\n- Use the PPTX route for editable PowerPoint and the Web Deck route for magazine / Swiss HTML output.\n- Render or preview the result, inspect issues, repair obvious layout problems, and list final files.\n- Keep logs and intermediate artifacts in a local project folder.\n\nExtra requirements:\n${form.constraints || "No extra requirements."}`;
  }

  return `请使用 ultimate-ppt-master Agent Skill 完成这次演示文稿任务。\n\n项目标题：${form.title}\n目标听众：${form.audience}\n核心结论：${form.coreMessage}\n资料类型：${sourceType}\n使用场景：${scenario}\n输出目标：${output}\n视觉风格：${style}\n目标页数：${form.slideCount} 页\n优先 Agent：${agent}\n模型偏好：${model}\n\n执行路线：\n- ${activeEngines}\n- Fusion shell：${enginePlan.fusionRoute}\n- 视觉路线：${enginePlan.styleRoute}\n\n交付包中的源资料：\n- source.md 包含用户粘贴资料、源资料摘要、双引擎路线和网页端生成的页纲。\n- project-brief.json 包含 Deck Brief Studio 结构化选择。\n- preview-web-deck.html 是可在浏览器打开的本地预览稿，不等于最终生产稿。\n- engine-plan.md 说明什么时候使用 PPTX 路线、Web Deck 路线或双输出。\n- quality-checklist.md 是交付前必须执行的检查清单。\n- 私有资料默认留在本地，除非我明确要求，不要上传。\n\n建议页纲：\n${outline}\n\n执行要求：\n- 读取 ultimate-ppt-master 仓库里的 AGENTS.md 和 SKILL.md。\n- 尊重第三方声明和当前仓库保留的上游版权归属。\n- 以 source.md 作为起点；如果我继续提供真实源文件，请进一步解析并修正 source.md。\n- 先完成叙事结构，再生成页面。\n- PPTX 使用可编辑 PowerPoint 路线；Web Deck 使用杂志化 / Swiss HTML 路线。\n- 渲染或预览结果，检查问题，修复明显版式错误，并列出最终文件。\n- 日志和中间产物保存在本地项目目录。\n\n补充要求：\n${form.constraints || "无额外要求。"}`;
}

function buildSourceTemplate(form: FormState, storyboard: StoryItem[], enginePlan: EnginePlan) {
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  const style = readOption(optionText.stylePreset, form.stylePreset, form.language);
  const outline = storyboard.map((item, index) => `- ${index + 1}. ${item.title}: ${item.intent}`).join("\n");
  if (form.language === "en") {
    return `# ${form.title}\n\n## Audience\n${form.audience}\n\n## Core message\n${form.coreMessage}\n\n## Scenario\n${scenario}\n\n## Desired output\n${output}, about ${form.slideCount} slides.\n\n## Visual style\n${style}\n\n## Engine route\n- PPTX: ${enginePlan.pptxActive ? "active" : "optional"} - ${enginePlan.pptxRoute}\n- Web Deck: ${enginePlan.webActive ? "active" : "optional"} - ${enginePlan.webRoute}\n- Fusion shell: ${enginePlan.fusionRoute}\n- Style route: ${enginePlan.styleRoute}\n\n## Source notes\n${form.sourceNotes}\n\n## Suggested outline\n${outline}\n\n## Extra requirements\n${form.constraints}\n`;
  }
  return `# ${form.title}\n\n## 目标听众\n${form.audience}\n\n## 核心结论\n${form.coreMessage}\n\n## 使用场景\n${scenario}\n\n## 目标输出\n${output}，约 ${form.slideCount} 页。\n\n## 视觉风格\n${style}\n\n## 双引擎路线\n- PPTX：${enginePlan.pptxActive ? "启用" : "备用"} - ${enginePlan.pptxRoute}\n- Web Deck：${enginePlan.webActive ? "启用" : "备用"} - ${enginePlan.webRoute}\n- Fusion shell：${enginePlan.fusionRoute}\n- 视觉路线：${enginePlan.styleRoute}\n\n## 源资料要点\n${form.sourceNotes}\n\n## 建议页纲\n${outline}\n\n## 补充要求\n${form.constraints}\n`;
}

function buildEnginePlanMarkdown(form: FormState, enginePlan: EnginePlan) {
  if (form.language === "en") {
    return `# Engine plan\n\n## Active routes\n- PPTX route: ${enginePlan.pptxActive ? "active" : "optional"}\n- Web Deck route: ${enginePlan.webActive ? "active" : "optional"}\n- Visual route: ${enginePlan.styleRoute}\n\n## Roles\n- Hugo He / ppt-master lineage: ${enginePlan.pptxRoute}\n- op7418 / Guizang lineage: ${enginePlan.webRoute}\n- Ultimate Fusion shell: ${enginePlan.fusionRoute}\n\n## Production rule\nUse the web preview as a brief and visual direction only. The final deck should be produced through the Skill workflow, with source parsing, narrative review, rendering, inspection, repair, and final file listing.\n\n## Attribution rule\nKeep the repository LICENSE and THIRD_PARTY_NOTICES intact. Do not remove upstream copyright attribution.\n`;
  }
  return `# 双引擎执行计划\n\n## 启用路线\n- PPTX 路线：${enginePlan.pptxActive ? "启用" : "备用"}\n- Web Deck 路线：${enginePlan.webActive ? "启用" : "备用"}\n- 视觉路线：${enginePlan.styleRoute}\n\n## 分工\n- Hugo He / ppt-master 路线：${enginePlan.pptxRoute}\n- op7418 / 歸藏路线：${enginePlan.webRoute}\n- Ultimate Fusion 前台：${enginePlan.fusionRoute}\n\n## 生产规则\n网页预览只作为 brief 和视觉方向，最终成品仍应通过 Skill 工作流完成：解析源资料、重构叙事、渲染、检查、修复，并列出最终文件。\n\n## 归属规则\n保留仓库 LICENSE 和 THIRD_PARTY_NOTICES，不移除上游版权归属。\n`;
}

function buildQualityChecklist(form: FormState, enginePlan: EnginePlan) {
  if (form.language === "en") {
    return `# Quality checklist\n\n## Source and story\n- [ ] source.md reflects the real source files, not only the pasted notes.\n- [ ] Core message appears in the cover and conclusion.\n- [ ] Every slide has one job and one primary takeaway.\n- [ ] Sensitive material stays local unless the user explicitly approves upload.\n\n## PPTX route\n- [ ] Route status: ${enginePlan.pptxActive ? "active" : "optional"}.\n- [ ] Text, shapes, charts, and notes remain editable.\n- [ ] Run SVG/PPTX rendering checks from the Skill workflow.\n- [ ] Inspect exported pages and repair clipping, overlaps, tiny text, and broken charts.\n\n## Web Deck route\n- [ ] Route status: ${enginePlan.webActive ? "active" : "optional"}.\n- [ ] Use ${enginePlan.styleRoute} consistently.\n- [ ] Open preview-web-deck.html as a rough browser reference before production.\n- [ ] Final HTML is single-file or has a clear asset folder, depending on user need.\n- [ ] Desktop and mobile viewports do not overlap text, controls, or media.\n\n## Delivery\n- [ ] Final files are named clearly.\n- [ ] Include a short note about what was generated and what was checked.\n- [ ] Keep upstream license and third-party notices intact.\n`;
  }
  return `# 质量检查清单\n\n## 资料与叙事\n- [ ] source.md 已根据真实源文件修正，而不只是网页粘贴摘要。\n- [ ] 核心结论出现在封面和收束页。\n- [ ] 每一页只承担一个主要任务，并有清晰 takeaway。\n- [ ] 敏感资料默认留在本地，除非用户明确同意上传。\n\n## PPTX 路线\n- [ ] 路线状态：${enginePlan.pptxActive ? "启用" : "备用"}。\n- [ ] 文本、形状、图表、备注保持可编辑。\n- [ ] 按 Skill 工作流运行 SVG / PPTX 渲染检查。\n- [ ] 检查导出页面并修复裁切、重叠、小字和图表损坏。\n\n## Web Deck 路线\n- [ ] 路线状态：${enginePlan.webActive ? "启用" : "备用"}。\n- [ ] 统一使用 ${enginePlan.styleRoute}。\n- [ ] 先打开 preview-web-deck.html 作为粗预览参考，再做正式生产。\n- [ ] 最终 HTML 按用户需要做成单文件或清晰资源目录。\n- [ ] 桌面端和移动端不出现文字、控件或媒体互相遮挡。\n\n## 交付\n- [ ] 最终文件命名清晰。\n- [ ] 简短说明生成了什么、检查了什么。\n- [ ] 保留上游版权和第三方声明。\n`;
}

function buildWebDeckHtml(form: FormState, storyboard: StoryItem[], enginePlan: EnginePlan) {
  const zh = form.language === "zh";
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  const style = readOption(optionText.stylePreset, form.stylePreset, form.language);
  const notes = extractBullets(form.sourceNotes);
  const swiss = form.stylePreset === "swiss";
  const className = swiss ? "swiss" : "editorial";
  const safeTitle = escapeHtml(form.title || (zh ? "未命名演示" : "Untitled deck"));
  const safeAudience = escapeHtml(form.audience || (zh ? "目标听众待补充" : "Audience pending"));
  const safeCore = escapeHtml(form.coreMessage || (zh ? "核心结论待补充" : "Core message pending"));
  const safeConstraints = escapeHtml(form.constraints || (zh ? "无额外要求" : "No extra requirements"));
  const noteCards = notes.length > 0
    ? notes.slice(0, 4).map((note, index) => `<li><b>${String(index + 1).padStart(2, "0")}</b><span>${escapeHtml(note)}</span></li>`).join("")
    : `<li><b>01</b><span>${zh ? "把真实资料交给 Skill 后，Agent 会补齐数据、证据和页面内容。" : "When real files are handed to the Skill, the Agent will fill data, evidence, and slide content."}</span></li>`;
  const storySlides = storyboard.map((item, index) => `
    <section class="slide story">
      <div class="slide-index">${String(index + 1).padStart(2, "0")}</div>
      <div class="slide-grid">
        <p class="kicker">${escapeHtml(scenario)} / ${escapeHtml(style)}</p>
        <h2>${escapeHtml(item.title)}</h2>
        <p class="intent">${escapeHtml(item.intent)}</p>
        <div class="slide-rule"></div>
        <p class="note">${zh ? "生产时请把这一页扩展成有证据、有结构、有设计约束的完整页面。" : "In production, expand this into a complete slide with evidence, structure, and design constraints."}</p>
      </div>
    </section>`).join("");

  return `<!doctype html>
<html lang="${zh ? "zh-CN" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} - preview web deck</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
    body { font-family: "Avenir Next", "SF Pro Display", "PingFang SC", Arial, sans-serif; color: #172033; background: #f5f1e8; }
    .deck { height: 100vh; display: flex; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; }
    .slide { position: relative; min-width: 100vw; height: 100vh; scroll-snap-align: start; padding: 54px; display: grid; align-content: space-between; border-right: 1px solid rgba(23, 32, 51, 0.16); }
    .editorial .slide { background: #f8f3e8; }
    .swiss .slide { background: #f7f7f4; }
    .editorial .cover, .swiss .cover { background: #172033; color: #fff; }
    .cover::after { content: ""; position: absolute; right: 54px; bottom: 54px; width: 210px; height: 26px; background: #ef5b3f; }
    .swiss .cover::after { width: 180px; height: 180px; right: 54px; bottom: 54px; background: #ef233c; }
    .kicker { margin: 0 0 18px; color: #ef5b3f; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
    .swiss .kicker { color: #2563eb; }
    h1, h2, p { margin: 0; letter-spacing: 0; }
    h1 { max-width: 850px; font-size: 68px; line-height: 1.02; font-weight: 950; }
    h2 { max-width: 780px; font-size: 54px; line-height: 1.06; font-weight: 950; }
    .lead { max-width: 800px; margin-top: 28px; color: rgba(255,255,255,0.78); font-size: 22px; line-height: 1.45; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 34px; }
    .meta span { padding: 9px 12px; border: 1px solid rgba(255,255,255,0.24); border-radius: 4px; color: rgba(255,255,255,0.82); font-size: 13px; font-weight: 850; }
    .source-list { display: grid; gap: 12px; max-width: 860px; margin: 0; padding: 0; list-style: none; }
    .source-list li { display: grid; grid-template-columns: 54px 1fr; gap: 18px; padding: 18px; background: #fff; border: 1px solid rgba(23, 32, 51, 0.14); border-radius: 8px; }
    .source-list b { color: #ef5b3f; font-size: 18px; }
    .source-list span { color: #3a4658; font-size: 18px; line-height: 1.45; }
    .slide-grid { align-self: center; display: grid; gap: 18px; }
    .intent { max-width: 760px; color: #46556b; font-size: 24px; line-height: 1.4; }
    .slide-rule { width: 180px; height: 8px; background: #10b981; }
    .note { max-width: 660px; color: #617085; font-size: 16px; line-height: 1.55; }
    .slide-index { position: absolute; top: 54px; right: 54px; color: rgba(23, 32, 51, 0.3); font-size: 42px; font-weight: 950; }
    .qa-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .qa-grid div { min-height: 150px; padding: 18px; border-radius: 8px; background: #fff; border: 1px solid rgba(23, 32, 51, 0.14); }
    .qa-grid strong { display: block; margin-bottom: 10px; font-size: 18px; }
    .qa-grid p { color: #617085; font-size: 15px; line-height: 1.5; }
    .footer { color: rgba(23, 32, 51, 0.54); font-size: 13px; line-height: 1.45; }
    .swiss h1, .swiss h2 { font-weight: 900; text-transform: uppercase; }
    .swiss .slide-rule { background: #2563eb; }
    .swiss .source-list b { color: #2563eb; }
    @media (max-width: 720px) {
      .slide { padding: 28px; }
      .cover::after { right: 28px; bottom: 28px; width: 120px; height: 18px; }
      .swiss .cover::after { width: 110px; height: 110px; }
      h1 { font-size: 40px; }
      h2 { font-size: 34px; }
      .lead, .intent { font-size: 18px; }
      .slide-index { top: 28px; right: 28px; font-size: 28px; }
      .qa-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body class="${className}">
  <!-- Fusion preview. Final production should follow SKILL.md, LICENSE, and THIRD_PARTY_NOTICES. -->
  <main class="deck" aria-label="${safeTitle}">
    <section class="slide cover">
      <div>
        <p class="kicker">Ultimate PPT Master / ${escapeHtml(enginePlan.styleRoute)}</p>
        <h1>${safeTitle}</h1>
        <p class="lead">${safeCore}</p>
        <div class="meta">
          <span>${safeAudience}</span>
          <span>${escapeHtml(output)}</span>
          <span>${escapeHtml(form.slideCount || "12")} ${zh ? "页" : "slides"}</span>
        </div>
      </div>
      <p class="footer">${zh ? "浏览器本地生成的预览稿 - 用于交给 Agent 继续生产" : "Browser-local preview - hand this to the Agent for production"}</p>
    </section>
    <section class="slide">
      <div>
        <p class="kicker">${zh ? "资料信号" : "Source signal"}</p>
        <h2>${zh ? "从零散材料到可执行 brief" : "From scattered material to executable brief"}</h2>
      </div>
      <ul class="source-list">${noteCards}</ul>
      <p class="footer">${safeConstraints}</p>
    </section>
    ${storySlides}
    <section class="slide">
      <div>
        <p class="kicker">${zh ? "生产路线" : "Production route"}</p>
        <h2>${zh ? "网页负责引导，Skill 负责高质量成品" : "Web guides. Skill produces."}</h2>
      </div>
      <div class="qa-grid">
        <div><strong>PPTX</strong><p>${escapeHtml(enginePlan.pptxRoute)}</p></div>
        <div><strong>Web Deck</strong><p>${escapeHtml(enginePlan.webRoute)}</p></div>
        <div><strong>Fusion</strong><p>${escapeHtml(enginePlan.fusionRoute)}</p></div>
      </div>
      <p class="footer">${zh ? "正式交付前请执行 quality-checklist.md。" : "Run quality-checklist.md before final delivery."}</p>
    </section>
  </main>
</body>
</html>`;
}

function buildBriefJson(form: FormState, storyboard: StoryItem[], readiness: { score: number; missing: string[] }, enginePlan: EnginePlan) {
  return JSON.stringify(
    {
      title: form.title,
      audience: form.audience,
      coreMessage: form.coreMessage,
      language: form.language,
      sourceType: form.sourceType,
      scenario: form.scenario,
      outputMode: form.outputMode,
      stylePreset: form.stylePreset,
      agentTool: form.agentTool,
      modelPreference: form.modelPreference,
      slideCount: form.slideCount,
      constraints: form.constraints,
      enginePlan,
      readiness,
      storyboard
    },
    null,
    2
  );
}

function extractBullets(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•\d.、)）]+\s*/, "").trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildKitReadme(form: FormState, enginePlan: EnginePlan) {
  if (form.language === "en") {
    return `# Ultimate PPT Master handoff kit\n\nFiles:\n- source.md: structured source brief\n- agent-prompt.md: prompt to send to the Agent\n- project-brief.json: machine-readable settings\n- preview-web-deck.html: browser-local Web Deck preview\n- engine-plan.md: PPTX / Web Deck / Fusion route split\n- quality-checklist.md: production checks before delivery\n\nActive route:\n- PPTX: ${enginePlan.pptxActive ? "active" : "optional"}\n- Web Deck: ${enginePlan.webActive ? "active" : "optional"}\n- Style: ${enginePlan.styleRoute}\n\nNext step:\nSend agent-prompt.md and this folder to Codex, Claude Code, Hermes, OpenClaw, or another local Agent that can read the ultimate-ppt-master Skill.\n`;
  }
  return `# Ultimate PPT Master handoff kit\n\n文件：\n- source.md：结构化资料 brief\n- agent-prompt.md：发给 Agent 的执行 prompt\n- project-brief.json：机器可读配置\n- preview-web-deck.html：浏览器本地 Web Deck 预览\n- engine-plan.md：PPTX / Web Deck / Fusion 路线分工\n- quality-checklist.md：交付前生产检查清单\n\n启用路线：\n- PPTX：${enginePlan.pptxActive ? "启用" : "备用"}\n- Web Deck：${enginePlan.webActive ? "启用" : "备用"}\n- 视觉：${enginePlan.styleRoute}\n\n下一步：\n把 agent-prompt.md 和这个文件夹交给 Codex、Claude Code、Hermes、OpenClaw 或其他能读取 ultimate-ppt-master Skill 的本地 Agent。\n`;
}
