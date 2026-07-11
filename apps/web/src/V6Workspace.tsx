import type { CSSProperties, RefObject } from "react";
import Activity from "lucide-react/dist/esm/icons/activity.js";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle.js";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.js";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right.js";
import Check from "lucide-react/dist/esm/icons/check.js";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2.js";
import CircleDot from "lucide-react/dist/esm/icons/circle-dot.js";
import Clipboard from "lucide-react/dist/esm/icons/clipboard.js";
import Download from "lucide-react/dist/esm/icons/download.js";
import ExternalLink from "lucide-react/dist/esm/icons/external-link.js";
import FileInput from "lucide-react/dist/esm/icons/file-input.js";
import FileText from "lucide-react/dist/esm/icons/file-text.js";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open.js";
import Gauge from "lucide-react/dist/esm/icons/gauge.js";
import Image from "lucide-react/dist/esm/icons/image.js";
import LayoutPanelLeft from "lucide-react/dist/esm/icons/layout-panel-left.js";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle.js";
import MonitorPlay from "lucide-react/dist/esm/icons/monitor-play.js";
import Palette from "lucide-react/dist/esm/icons/palette.js";
import Play from "lucide-react/dist/esm/icons/play.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw.js";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw.js";
import Server from "lucide-react/dist/esm/icons/server.js";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud.js";
import WandSparkles from "lucide-react/dist/esm/icons/wand-sparkles.js";
import X from "lucide-react/dist/esm/icons/x.js";
import {
  type BridgeProgressEvent,
  type DeckPhase,
  type DeckSession,
  type DeckSlide,
  type DeckSourceSummary,
  type OutputPurpose,
  createDeckSession,
  createDraftSlides,
  deckPhases,
  inferSlideCount,
  phaseLabels,
  recommendedDirections,
  sessionReadiness,
  visualDirectionCatalog
} from "../../../packages/workspace-core/src";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

const bridgeUrl = "http://127.0.0.1:43188";
const storageKey = "ultimate-ppt-master-deck-session-v6";
const appVersion = "6.1.0";
const brandAssetUrl = `${import.meta.env.BASE_URL}brand.svg`;
const pptlintProofAssetUrl = `${import.meta.env.BASE_URL}pptlint-before-after-hero.png`;

type Language = "zh" | "en";

interface ImportedSource extends DeckSourceSummary {
  type?: string;
  size?: number;
  text?: string;
  dataBase64?: string;
  url?: string;
}

interface BridgeHealth {
  ok: boolean;
  version: string;
  outputDir: string;
  repoRoot?: string;
  agents: Array<{ id: string; label: string; available: boolean; command: string; path: string }>;
  providers: Array<{ id: string; label: string; configured: boolean }>;
}

interface HandoffResult {
  ok: boolean;
  projectPath: string;
  files: string[];
  suggestedCommands: Record<string, string>;
}

interface V6WorkspaceProps {
  classicHref?: string;
}

const copy = {
  zh: {
    product: "终极融合 PPT 大师",
    promise: "本地演示文稿质量工作台",
    title: "从真实资料，到能放心交付的演示文稿。",
    subtitle: "先确认任务与证据，再决定视觉；生成后按页精修，最后回到 PowerPoint 完成正式交付。",
    classic: "经典控制台",
    diagnostics: "环境与诊断",
    connected: "本机已连接",
    disconnected: "需要连接本机",
    checkExistingPpt: "检查已有 PPT",
    pptlintKicker: "真实交付闭环 · ULTIMATE × PPTLINT",
    pptlintTitle: "一份可编辑 PPT，从 49 分修到 100 分。",
    pptlintText: "Ultimate PPT Master 负责生成与定向修复，PPTLint 在本机独立检查。真实九页案例解决 103 项问题，未新增高置信风险。",
    pptlintOpen: "用 PPTLint 检查 PPT",
    pptlintProof: "查看完整前后证据",
    pptlintBefore: "修改前 · 49",
    pptlintAfter: "修改后 · 100",
    intakeTitle: "先把任务和真实资料放进来",
    intakeLead: "一句话也可以开始。首层只保留任务、资料和交付用途，其余由 Agent 推断后再确认。",
    requestLabel: "这份演示要完成什么？",
    requestPlaceholder: "例如：把季度经营数据整理成一份给管理层看的 10 页可编辑 PPTX，结论先行，不能编造数据。",
    sourceTitle: "资料",
    sourceHint: "PDF、Word、PPTX、Excel、Markdown 或 URL；文件默认只交给本机 Bridge。",
    upload: "选择文件",
    addUrl: "添加 URL",
    noSource: "还没有真实资料。故事板会明确标记证据缺口，不会伪装成成品。",
    outputTitle: "交付用途",
    outputPptx: "可编辑 PPTX",
    outputWeb: "网页演示",
    outputBoth: "PPTX + Web",
    continueOutline: "整理故事板",
    outlineTitle: "先确认故事，再开始设计",
    outlineLead: "每页只有一个任务。可以直接改标题、结论和结构方案，不需要整套重做。",
    focusedQuestions: "还需要确认",
    evidenceGrounded: "已有证据",
    evidencePartial: "证据待补",
    evidenceMissing: "没有证据",
    designTitle: "选一个明确的视觉方向",
    designLead: "这里展示封面、正文和数据页的完整方向，而不是只给抽象风格标签。",
    generate: "创建本地项目",
    generating: "正在准备项目",
    reviewTitle: "按页精修，再决定如何交付",
    reviewLead: "缩略图、预览和质量问题在同一个工作区；技术文件放在诊断抽屉。",
    visualQuality: "质量检查",
    noFinalPreview: "当前只有结构预览。添加真实资料并创建本地项目后，才进入正式制作。",
    approveSlide: "确认本页",
    regenerateSlide: "换一个结构",
    openPowerPoint: "在 PowerPoint 打开",
    downloadPptx: "下载 PPTX",
    shareWeb: "分享 Web",
    waitingArtifact: "等待正式产物",
    downloadPreview: "下载 Web 结构预览",
    projectReady: "本地项目已创建",
    copyAgent: "复制 AI 助手命令",
    back: "返回",
    next: "下一步",
    reset: "新建任务",
    readiness: "任务准备度",
    realSourceRequired: "正式制作前需要至少一份真实资料或明确事实边界。",
    repairBridge: "复制本机连接命令",
    refresh: "重新检测",
    advanced: "专业诊断",
    bridgeCommand: "本机连接命令",
    providerStatus: "模型状态",
    sourceBoundary: "资料与隐私",
    sourceBoundaryText: "浏览器只向 127.0.0.1 发送本地 handoff；不会把资料自动上传到第三方。"
  },
  en: {
    product: "Ultimate PPT Master",
    promise: "Local presentation quality workspace",
    title: "Turn real source material into a deck you can confidently deliver.",
    subtitle: "Confirm the task and evidence first, choose a direction, refine by slide, then finish formal delivery in PowerPoint.",
    classic: "Classic console",
    diagnostics: "Environment & diagnostics",
    connected: "Local bridge connected",
    disconnected: "Local connection needed",
    checkExistingPpt: "Check an existing PPT",
    pptlintKicker: "REAL DELIVERY LOOP · ULTIMATE × PPTLINT",
    pptlintTitle: "One editable PowerPoint, improved from 49 to 100.",
    pptlintText: "Ultimate PPT Master creates and repairs the deck; PPTLint independently checks it on your computer. The real nine-slide case resolved 103 reported issues with no new high-confidence problems.",
    pptlintOpen: "Check a PPT with PPTLint",
    pptlintProof: "Open the complete evidence",
    pptlintBefore: "Before · 49",
    pptlintAfter: "After · 100",
    intakeTitle: "Start with the task and real sources",
    intakeLead: "A single sentence is enough. The first layer keeps only the task, sources, and delivery purpose.",
    requestLabel: "What should this presentation accomplish?",
    requestPlaceholder: "Example: Turn the quarterly operating data into a 10-slide editable executive PPTX. Lead with conclusions and do not invent numbers.",
    sourceTitle: "Sources",
    sourceHint: "PDF, Word, PPTX, Excel, Markdown, or URL. Files stay with the local Bridge by default.",
    upload: "Choose files",
    addUrl: "Add URL",
    noSource: "No real source yet. The storyboard will show evidence gaps instead of pretending to be final.",
    outputTitle: "Delivery purpose",
    outputPptx: "Editable PPTX",
    outputWeb: "Web presentation",
    outputBoth: "PPTX + Web",
    continueOutline: "Shape storyboard",
    outlineTitle: "Confirm the story before design",
    outlineLead: "Every slide has one job. Edit its title, takeaway, or variant without rebuilding the full deck.",
    focusedQuestions: "Still to confirm",
    evidenceGrounded: "Grounded",
    evidencePartial: "Partial evidence",
    evidenceMissing: "No evidence",
    designTitle: "Choose a deliberate visual direction",
    designLead: "Each option includes cover, body, and data behavior—not just an abstract style label.",
    generate: "Create local project",
    generating: "Preparing project",
    reviewTitle: "Refine by slide, then deliver",
    reviewLead: "Thumbnails, preview, and findings share one workspace; technical files stay in diagnostics.",
    visualQuality: "Quality review",
    noFinalPreview: "This is a structural preview. Add a real source and create the local project before formal production.",
    approveSlide: "Approve slide",
    regenerateSlide: "Try another layout",
    openPowerPoint: "Open in PowerPoint",
    downloadPptx: "Download PPTX",
    shareWeb: "Share Web",
    waitingArtifact: "Waiting for final artifact",
    downloadPreview: "Download Web structure preview",
    projectReady: "Local project created",
    copyAgent: "Copy AI helper command",
    back: "Back",
    next: "Next",
    reset: "New task",
    readiness: "Task readiness",
    realSourceRequired: "Formal production needs at least one real source or an explicit fact boundary.",
    repairBridge: "Copy local connection command",
    refresh: "Check again",
    advanced: "Professional diagnostics",
    bridgeCommand: "Local connection command",
    providerStatus: "Model status",
    sourceBoundary: "Sources & privacy",
    sourceBoundaryText: "The browser only sends handoff data to 127.0.0.1 and never uploads sources to a third party automatically."
  }
} as const;

export function V6Workspace({ classicHref = "?classic=1" }: V6WorkspaceProps) {
  const [language, setLanguage] = useState<Language>("zh");
  const [session, setSession] = useState<DeckSession>(() => loadSession());
  const [sources, setSources] = useState<ImportedSource[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [bridge, setBridge] = useState<BridgeHealth | null>(null);
  const [bridgeChecking, setBridgeChecking] = useState(false);
  const [handoff, setHandoff] = useState<HandoffResult | null>(null);
  const [activeSlideId, setActiveSlideId] = useState(session.slides[0]?.slideId || "P01");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [eventMessage, setEventMessage] = useState("");
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [isSending, setIsSending] = useState(false);
  const workspaceHeadingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = copy[language];
  const readiness = sessionReadiness(session);
  const directions = useMemo(() => recommendedDirections(session), [session.request, session.outputPurpose]);
  const deferredSession = useDeferredValue(session);
  const previewHtml = useMemo(() => buildPreviewHtml(deferredSession, language), [deferredSession, language]);
  const activeSlide = session.slides.find((slide) => slide.slideId === activeSlideId) || session.slides[0];

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    void checkBridge(true);
    const timer = window.setInterval(() => {
      if (!document.hidden) void checkBridge(true);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!bridge) return;
    const events = new EventSource(`${bridgeUrl}/events`);
    events.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as BridgeProgressEvent;
        setEventMessage(event.message);
        setSession((current) => ({
          ...current,
          progress: {
            percent: event.progress,
            message: event.message,
            currentSlideId: event.slideId,
            recoverable: event.recoverable
          },
          projectPath: event.projectPath || current.projectPath,
          updatedAt: event.timestamp
        }));
      } catch {
        setEventMessage(message.data);
      }
    };
    return () => events.close();
  }, [Boolean(bridge)]);

  function transitionTo(phase: DeckPhase) {
    setSession((current) => ({ ...current, phase, updatedAt: new Date().toISOString() }));
    setLiveAnnouncement(`${phaseLabels[language][phase]}。${phaseHelp(phase, language)}`);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      workspaceHeadingRef.current?.focus({ preventScroll: true });
    });
  }

  function updateSession(patch: Partial<DeckSession>) {
    setSession((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }));
  }

  function rebuildOutline() {
    const slides = createDraftSlides(session.request, sources.length, inferSlideCount(session.request));
    updateSession({
      sources: sources.map(stripImportedSource),
      slides,
      questions: focusedQuestions(session, sources),
      phase: "outline"
    });
    setActiveSlideId(slides[0]?.slideId || "P01");
    transitionTo("outline");
  }

  function updateSlide(slideId: string, patch: Partial<DeckSlide>) {
    setSession((current) => ({
      ...current,
      slides: current.slides.map((slide) => slide.slideId === slideId ? { ...slide, ...patch } : slide),
      updatedAt: new Date().toISOString()
    }));
  }

  function rotateSlideVariant(slide: DeckSlide) {
    const currentIndex = slide.variants.findIndex((variant) => variant.id === slide.selectedVariantId);
    const next = slide.variants[(currentIndex + 1) % slide.variants.length];
    updateSlide(slide.slideId, { selectedVariantId: next.id, status: "needs-review" });
  }

  async function regenerateSlide(slide: DeckSlide) {
    const currentIndex = slide.variants.findIndex((variant) => variant.id === slide.selectedVariantId);
    const next = slide.variants[(currentIndex + 1) % slide.variants.length];
    rotateSlideVariant(slide);
    if (!handoff?.projectPath) return;
    try {
      await fetch(`${bridgeUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath: handoff.projectPath,
          slideId: slide.slideId,
          variantId: next.id,
          instruction: "Regenerate only this slide with the selected structural variant. Preserve evidence, source bindings, and editable PowerPoint objects."
        })
      });
    } catch {
      setLiveAnnouncement(language === "zh" ? "结构已在本地切换；Bridge 修订请求稍后可重试。" : "The local variant changed; the Bridge revision request can be retried later.");
    }
  }

  async function checkBridge(silent = false) {
    setBridgeChecking(true);
    try {
      const response = await fetch(`${bridgeUrl}/health`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json() as BridgeHealth;
      setBridge(payload);
      if (!silent) setLiveAnnouncement(t.connected);
    } catch {
      setBridge(null);
      if (!silent) setLiveAnnouncement(t.disconnected);
    } finally {
      setBridgeChecking(false);
    }
  }

  async function importFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const imported: ImportedSource[] = [];
    for (const file of Array.from(fileList)) {
      const textLike = /\.(md|markdown|txt|csv|json|html)$/i.test(file.name) || file.type.startsWith("text/");
      imported.push({
        id: sourceId(file.name),
        name: file.name,
        kind: /\.pptx?$/i.test(file.name) ? "pptx" : "file",
        status: textLike ? "ready" : "local-parse",
        type: file.type || "application/octet-stream",
        size: file.size,
        text: textLike ? await file.text() : undefined,
        dataBase64: textLike ? undefined : await readAsBase64(file)
      });
    }
    const next = [...sources, ...imported];
    setSources(next);
    updateSession({ sources: next.map(stripImportedSource) });
  }

  function addUrl() {
    const value = urlInput.trim();
    if (!value) return;
    const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const source: ImportedSource = { id: sourceId(url), name: url, kind: "url", status: "local-parse", url };
    const next = [...sources, source];
    setSources(next);
    setUrlInput("");
    updateSession({ sources: next.map(stripImportedSource) });
  }

  function removeSource(sourceIdValue: string) {
    const next = sources.filter((source) => source.id !== sourceIdValue);
    setSources(next);
    updateSession({ sources: next.map(stripImportedSource) });
  }

  async function createHandoff() {
    if (!bridge) {
      setDiagnosticsOpen(true);
      setLiveAnnouncement(t.disconnected);
      return;
    }
    setIsSending(true);
    transitionTo("generating");
    setSession((current) => ({ ...current, progress: { percent: 12, message: t.generating } }));
    try {
      const payload = buildHandoffPayload({ ...session, phase: "generating" }, sources, previewHtml, language);
      const response = await fetch(`${bridgeUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json() as HandoffResult & { message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setHandoff(result);
      setSession((current) => ({
        ...current,
        phase: "review",
        projectPath: result.projectPath,
        progress: { percent: 100, message: t.projectReady },
        updatedAt: new Date().toISOString()
      }));
      transitionTo("review");
    } catch (error) {
      setSession((current) => ({
        ...current,
        phase: "generating",
        progress: { percent: 0, message: error instanceof Error ? error.message : String(error), recoverable: true }
      }));
      setLiveAnnouncement(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSending(false);
    }
  }

  function resetWorkspace() {
    const next = createDeckSession();
    setSession(next);
    setSources([]);
    setHandoff(null);
    setActiveSlideId(next.slides[0]?.slideId || "P01");
    transitionTo("intake");
  }

  function downloadPreview() {
    downloadBlob("preview-web-deck.html", previewHtml, "text/html;charset=utf-8");
  }

  function copyBridgeCommand() {
    void navigator.clipboard.writeText(bridgeCommandFor(bridge));
    setLiveAnnouncement(t.bridgeCommand);
  }

  function copyAgentCommand() {
    const command = handoff?.suggestedCommands?.codex || "";
    if (!command) return;
    void navigator.clipboard.writeText(command);
    setLiveAnnouncement(t.copyAgent);
  }

  const phaseIndex = deckPhases.indexOf(session.phase);
  const primaryCanContinue = session.request.trim().length >= 8;

  return (
    <div className="v6-app" data-phase={session.phase}>
      <a className="skip-link" href="#v6-workspace">Skip to workspace</a>
      <header className="v6-topbar">
        <a className="v6-brand" href="./" aria-label={t.product}>
          <img src={brandAssetUrl} alt="" />
          <span><strong>{t.product}</strong><small>{t.promise}</small></span>
        </a>
        <div className="v6-top-actions">
          <a className="pptlint-top-link" href="https://kdnsna.github.io/pptlint/" target="_blank" rel="noreferrer"><ShieldCheck size={16} />{t.checkExistingPpt}</a>
          <button className={`bridge-indicator ${bridge ? "online" : "offline"}`} onClick={() => setDiagnosticsOpen(true)} aria-haspopup="dialog" aria-label={bridge ? t.connected : t.disconnected}>
            {bridge ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{bridge ? t.connected : t.disconnected}</span>
          </button>
          <a className="quiet-link" href={classicHref}>{t.classic}</a>
          <button className="language-switch" onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>
            {language === "zh" ? "EN" : "中文"}
          </button>
        </div>
      </header>

      <div className="v6-live-region" aria-live="polite" aria-atomic="true">{liveAnnouncement || eventMessage}</div>

      <main id="v6-workspace" className="v6-workspace">
        <section className="v6-hero">
          <div className="v6-hero-copy">
            <p className="v6-kicker">v{appVersion} · LOCAL-FIRST PRESENTATION AGENT</p>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="v6-hero-status" aria-label={t.readiness}>
            <span>{t.readiness}</span>
            <strong>{readiness}%</strong>
            <div className="v6-readiness-track" aria-hidden="true"><span style={{ width: `${readiness}%` }} /></div>
            <small>{sources.length ? `${sources.length} ${t.sourceTitle}` : t.realSourceRequired}</small>
          </div>
        </section>

        <section className="pptlint-proof-banner" aria-labelledby="pptlint-proof-title">
          <div className="pptlint-proof-copy">
            <p>{t.pptlintKicker}</p>
            <h2 id="pptlint-proof-title">{t.pptlintTitle}</h2>
            <span>{t.pptlintText}</span>
            <div className="pptlint-proof-actions">
              <a className="pptlint-primary" href="https://kdnsna.github.io/pptlint/" target="_blank" rel="noreferrer"><ShieldCheck size={17} />{t.pptlintOpen}</a>
              <a href="https://kdnsna.github.io/pptlint/proof-loop/comparison.html" target="_blank" rel="noreferrer">{t.pptlintProof}<ExternalLink size={15} /></a>
            </div>
          </div>
          <a className="pptlint-proof-visual" href="https://kdnsna.github.io/pptlint/proof-loop/comparison.html" target="_blank" rel="noreferrer" aria-label={t.pptlintProof}>
            <img src={pptlintProofAssetUrl} alt="" />
            <strong className="pptlint-before">{t.pptlintBefore}</strong>
            <strong className="pptlint-after">{t.pptlintAfter}</strong>
          </a>
        </section>

        <nav className="phase-rail" aria-label={language === "zh" ? "任务阶段" : "Task phases"}>
          {deckPhases.map((phase, index) => {
            const complete = index < phaseIndex || (phase === "delivered" && session.phase === "delivered");
            const current = phase === session.phase;
            const accessible = index <= phaseIndex || (phase === "outline" && primaryCanContinue);
            return (
              <button
                key={phase}
                type="button"
                className={`${current ? "current" : ""} ${complete ? "complete" : ""}`}
                aria-current={current ? "step" : undefined}
                disabled={!accessible}
                onClick={() => accessible && transitionTo(phase)}
              >
                <span>{complete ? <Check size={15} /> : String(index + 1).padStart(2, "0")}</span>
                <strong>{phaseLabels[language][phase]}</strong>
              </button>
            );
          })}
        </nav>

        <section className="active-phase-shell">
          <header className="phase-heading">
            <div>
              <p>{phaseLabels[language][session.phase]}</p>
              <h2 ref={workspaceHeadingRef} tabIndex={-1}>{phaseTitle(session.phase, t)}</h2>
              <span>{phaseLead(session.phase, t)}</span>
            </div>
            <div className="phase-heading-actions">
              {session.phase !== "intake" && <button className="secondary-button" onClick={() => transitionTo(deckPhases[Math.max(0, phaseIndex - 1)])}><ArrowLeft size={17} />{t.back}</button>}
              {session.phase === "intake" && <button className="secondary-button" onClick={resetWorkspace}><RotateCcw size={17} />{t.reset}</button>}
            </div>
          </header>

          {session.phase === "intake" && (
            <IntakePhase
              language={language}
              session={session}
              sources={sources}
              urlInput={urlInput}
              fileInputRef={fileInputRef}
              onRequestChange={(request) => updateSession({ request })}
              onAudienceChange={(audience) => updateSession({ audience })}
              onOutputChange={(outputPurpose) => updateSession({ outputPurpose })}
              onUrlInput={setUrlInput}
              onAddUrl={addUrl}
              onImportFiles={importFiles}
              onRemoveSource={removeSource}
              onContinue={rebuildOutline}
              copy={t}
            />
          )}

          {session.phase === "outline" && (
            <OutlinePhase
              language={language}
              session={session}
              activeSlideId={activeSlideId}
              onActiveSlide={setActiveSlideId}
              onUpdateSlide={updateSlide}
              onAudienceChange={(audience) => updateSession({ audience, questions: focusedQuestions({ ...session, audience }, sources) })}
              onCoreMessageChange={(coreMessage) => updateSession({ coreMessage, questions: focusedQuestions({ ...session, coreMessage }, sources) })}
              onContinue={() => transitionTo("generating")}
              copy={t}
            />
          )}

          {session.phase === "generating" && (
            <GeneratingPhase
              language={language}
              session={session}
              directions={directions}
              bridge={bridge}
              isSending={isSending}
              onSelectDirection={(selectedDirectionId) => updateSession({ selectedDirectionId })}
              onGenerate={() => void createHandoff()}
              onDiagnostics={() => setDiagnosticsOpen(true)}
              copy={t}
            />
          )}

          {(session.phase === "review" || session.phase === "delivered") && activeSlide && (
            <ReviewPhase
              language={language}
              session={session}
              activeSlide={activeSlide}
              previewHtml={previewHtml}
              handoff={handoff}
              onActiveSlide={setActiveSlideId}
              onApprove={(slideId) => updateSlide(slideId, { status: "approved" })}
              onRotate={(slide) => { void regenerateSlide(slide); }}
              onDownloadPreview={downloadPreview}
              onCopyAgent={copyAgentCommand}
              onDelivered={() => transitionTo("delivered")}
              copy={t}
            />
          )}
        </section>
      </main>

      {diagnosticsOpen && (
        <DiagnosticsDialog
          language={language}
          bridge={bridge}
          checking={bridgeChecking}
          onClose={() => setDiagnosticsOpen(false)}
          onRefresh={() => void checkBridge(false)}
          onCopyCommand={copyBridgeCommand}
          copy={t}
        />
      )}
    </div>
  );
}

function IntakePhase({
  language,
  session,
  sources,
  urlInput,
  fileInputRef,
  onRequestChange,
  onAudienceChange,
  onOutputChange,
  onUrlInput,
  onAddUrl,
  onImportFiles,
  onRemoveSource,
  onContinue,
  copy: t
}: {
  language: Language;
  session: DeckSession;
  sources: ImportedSource[];
  urlInput: string;
  fileInputRef: RefObject<HTMLInputElement>;
  onRequestChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
  onOutputChange: (value: OutputPurpose) => void;
  onUrlInput: (value: string) => void;
  onAddUrl: () => void;
  onImportFiles: (files: FileList | null) => Promise<void>;
  onRemoveSource: (id: string) => void;
  onContinue: () => void;
  copy: typeof copy.zh | typeof copy.en;
}) {
  const outputs: Array<{ id: OutputPurpose; title: string; text: string; icon: typeof FileText }> = [
    { id: "editable-pptx", title: t.outputPptx, text: language === "zh" ? "正式汇报、可继续修改" : "Formal delivery, fully editable", icon: FileText },
    { id: "web-deck", title: t.outputWeb, text: language === "zh" ? "演讲、发布与分享" : "Present, publish, and share", icon: MonitorPlay },
    { id: "dual-delivery", title: t.outputBoth, text: language === "zh" ? "一份资料，两条交付路线" : "One source, two delivery routes", icon: LayoutPanelLeft }
  ];
  return (
    <div className="intake-layout">
      <section className="intake-primary">
        <label className="field-label" htmlFor="deck-request">{t.requestLabel}</label>
        <textarea id="deck-request" className="task-textarea" value={session.request} onChange={(event) => onRequestChange(event.target.value)} placeholder={t.requestPlaceholder} />
        <label className="field-label compact" htmlFor="deck-audience">{language === "zh" ? "主要听众（可选）" : "Primary audience (optional)"}</label>
        <input id="deck-audience" value={session.audience} onChange={(event) => onAudienceChange(event.target.value)} placeholder={language === "zh" ? "例如：公司管理层 / 客户决策人" : "Example: executive team / client decision makers"} />
        <div className="output-purpose" role="radiogroup" aria-label={t.outputTitle}>
          <span>{t.outputTitle}</span>
          <div>
            {outputs.map((output) => {
              const Icon = output.icon;
              return (
                <button key={output.id} type="button" role="radio" aria-checked={session.outputPurpose === output.id} className={session.outputPurpose === output.id ? "selected" : ""} onClick={() => onOutputChange(output.id)}>
                  <Icon size={19} />
                  <span><strong>{output.title}</strong><small>{output.text}</small></span>
                </button>
              );
            })}
          </div>
        </div>
        <button className="primary-button intake-continue" disabled={session.request.trim().length < 8} onClick={onContinue}>
          <WandSparkles size={19} />{t.continueOutline}<ArrowRight size={18} />
        </button>
      </section>

      <aside className="source-dock">
        <div className="source-dock-heading"><span><UploadCloud size={20} /></span><div><strong>{t.sourceTitle}</strong><p>{t.sourceHint}</p></div></div>
        <button className="drop-target" type="button" onClick={() => fileInputRef.current?.click()}>
          <FileInput size={24} /><strong>{t.upload}</strong><small>PDF · DOCX · PPTX · XLSX · MD</small>
        </button>
        <input ref={fileInputRef} className="visually-hidden" type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.pptm,.xls,.xlsx,.xlsm,.csv,.md,.markdown,.txt,.json,.html" onChange={(event) => { void onImportFiles(event.target.files); event.target.value = ""; }} />
        <div className="url-input-row">
          <label className="visually-hidden" htmlFor="source-url">URL</label>
          <input id="source-url" value={urlInput} onChange={(event) => onUrlInput(event.target.value)} placeholder="https://..." />
          <button type="button" onClick={onAddUrl}><Plus size={17} />{t.addUrl}</button>
        </div>
        <div className="source-list" aria-live="polite">
          {sources.length === 0 ? <p className="empty-source"><ShieldCheck size={18} />{t.noSource}</p> : sources.map((source) => (
            <article key={source.id}>
              <FileText size={18} />
              <span><strong>{source.name}</strong><small>{source.status === "ready" ? (language === "zh" ? "可直接读取" : "Ready") : (language === "zh" ? "由本机解析" : "Local parsing")}</small></span>
              <button type="button" aria-label={`${language === "zh" ? "移除" : "Remove"} ${source.name}`} onClick={() => onRemoveSource(source.id)}><X size={16} /></button>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

function OutlinePhase({ language, session, activeSlideId, onActiveSlide, onUpdateSlide, onAudienceChange, onCoreMessageChange, onContinue, copy: t }: {
  language: Language;
  session: DeckSession;
  activeSlideId: string;
  onActiveSlide: (id: string) => void;
  onUpdateSlide: (id: string, patch: Partial<DeckSlide>) => void;
  onAudienceChange: (value: string) => void;
  onCoreMessageChange: (value: string) => void;
  onContinue: () => void;
  copy: typeof copy.zh | typeof copy.en;
}) {
  return (
    <div className="outline-layout">
      <aside className="question-rail">
        <p><CircleDot size={17} />{t.focusedQuestions}</p>
        {session.questions.length ? session.questions.map((question, index) => <article key={question}><span>{index + 1}</span><p>{question}</p></article>) : <article className="questions-ready"><CheckCircle2 size={18} /><p>{language === "zh" ? "关键信息足够，可以开始设计。" : "The key context is ready for design."}</p></article>}
        {!session.audience.trim() && <label className="question-answer"><span>{language === "zh" ? "主要听众" : "Primary audience"}</span><input value={session.audience} onChange={(event) => onAudienceChange(event.target.value)} placeholder={language === "zh" ? "例如：管理层" : "Example: executive team"} /></label>}
        {!session.coreMessage.trim() && <label className="question-answer"><span>{language === "zh" ? "必须记住的判断" : "Must-remember judgment"}</span><textarea value={session.coreMessage} onChange={(event) => onCoreMessageChange(event.target.value)} placeholder={language === "zh" ? "用一句话写出希望听众记住的结论" : "Write the one conclusion the audience should remember"} /></label>}
        <div className="source-confidence"><ShieldCheck size={18} /><span><strong>{language === "zh" ? "资料充分度" : "Source confidence"}</strong><small>{session.sources.length ? (language === "zh" ? "已添加真实资料，逐页检查证据。" : "Real sources added; evidence is checked by slide.") : t.realSourceRequired}</small></span></div>
      </aside>
      <section className="storyboard-list" aria-label={language === "zh" ? "故事板页面" : "Storyboard slides"}>
        {session.slides.map((slide, index) => {
          const selected = slide.slideId === activeSlideId;
          return (
            <article key={slide.slideId} className={selected ? "selected" : ""}>
              <button type="button" className="slide-selector" aria-pressed={selected} onClick={() => onActiveSlide(slide.slideId)}>
                <span>{slide.slideId}</span><strong>{roleLabel(slide.role, language)}</strong><EvidenceBadge state={slide.evidenceState} copy={t} />
              </button>
              <div className="story-fields">
                <label><span>{language === "zh" ? "页面标题" : "Slide title"}</span><input value={slide.title} onChange={(event) => onUpdateSlide(slide.slideId, { title: event.target.value, status: "needs-review" })} /></label>
                <label><span>{language === "zh" ? "一句话结论" : "One-line takeaway"}</span><textarea value={slide.takeaway} onChange={(event) => onUpdateSlide(slide.slideId, { takeaway: event.target.value, status: "needs-review" })} /></label>
                <div className="variant-strip" role="radiogroup" aria-label={`${slide.slideId} ${language === "zh" ? "结构方案" : "layout variants"}`}>
                  {slide.variants.map((variant) => <button key={variant.id} type="button" role="radio" aria-checked={slide.selectedVariantId === variant.id} className={slide.selectedVariantId === variant.id ? "selected" : ""} onClick={() => onUpdateSlide(slide.slideId, { selectedVariantId: variant.id, status: "needs-review" })}><span>{variant.label}</span><small>{variant.layoutFamily}</small></button>)}
                </div>
              </div>
              <span className="story-index">{String(index + 1).padStart(2, "0")}</span>
            </article>
          );
        })}
        <button className="primary-button storyboard-continue" onClick={onContinue}><Palette size={19} />{t.next}<ArrowRight size={18} /></button>
      </section>
    </div>
  );
}

function GeneratingPhase({ language, session, directions, bridge, isSending, onSelectDirection, onGenerate, onDiagnostics, copy: t }: {
  language: Language;
  session: DeckSession;
  directions: ReturnType<typeof recommendedDirections>;
  bridge: BridgeHealth | null;
  isSending: boolean;
  onSelectDirection: (id: string) => void;
  onGenerate: () => void;
  onDiagnostics: () => void;
  copy: typeof copy.zh | typeof copy.en;
}) {
  return (
    <div className="direction-stage">
      <div className="direction-grid" role="radiogroup" aria-label={language === "zh" ? "视觉方向" : "Visual direction"}>
        {directions.map((direction, index) => (
          <button key={direction.id} type="button" role="radio" aria-checked={session.selectedDirectionId === direction.id} className={`direction-card ${direction.tone} ${session.selectedDirectionId === direction.id ? "selected" : ""}`} onClick={() => onSelectDirection(direction.id)}>
            <DirectionPreview direction={direction} index={index} />
            <span className="direction-copy"><strong>{language === "zh" ? direction.labelZh : direction.labelEn}</strong><p>{language === "zh" ? direction.fitZh : direction.fitEn}</p><small>{direction.coverLayout} · {direction.bodyLayout} · {direction.dataLayout}</small></span>
            <span className="direction-check"><Check size={16} /></span>
          </button>
        ))}
      </div>
      <aside className="generation-dock">
        <div><Sparkles size={20} /><span><strong>{language === "zh" ? "先结构、后精修" : "Structure first, polish second"}</strong><p>{language === "zh" ? "先创建可点击结构稿；正式制作只对选中或审计失败的页面执行高成本精修。" : "Create a clickable structural draft first; reserve high-cost refinement for selected or flagged slides."}</p></span></div>
        <div className="generation-summary">
          <span><FileText size={17} />{session.slides.length} {language === "zh" ? "页故事板" : "slides"}</span>
          <span><Image size={17} />{visualDirectionCatalog.find((item) => item.id === session.selectedDirectionId)?.[language === "zh" ? "labelZh" : "labelEn"]}</span>
          <span><Server size={17} />{bridge ? t.connected : t.disconnected}</span>
        </div>
        {!bridge && <button className="bridge-repair" onClick={onDiagnostics}><AlertCircle size={18} />{t.repairBridge}</button>}
        <button className="primary-button generation-action" disabled={isSending} onClick={onGenerate}>{isSending ? <LoaderCircle className="spin" size={19} /> : <Play size={19} />}{isSending ? t.generating : t.generate}</button>
        {session.progress.message && session.progress.percent > 0 && <div className="generation-progress"><div><span style={{ width: `${session.progress.percent}%` }} /></div><p>{session.progress.message}</p></div>}
      </aside>
    </div>
  );
}

function ReviewPhase({ language, session, activeSlide, previewHtml, handoff, onActiveSlide, onApprove, onRotate, onDownloadPreview, onCopyAgent, onDelivered, copy: t }: {
  language: Language;
  session: DeckSession;
  activeSlide: DeckSlide;
  previewHtml: string;
  handoff: HandoffResult | null;
  onActiveSlide: (id: string) => void;
  onApprove: (id: string) => void;
  onRotate: (slide: DeckSlide) => void;
  onDownloadPreview: () => void;
  onCopyAgent: () => void;
  onDelivered: () => void;
  copy: typeof copy.zh | typeof copy.en;
}) {
  const hasRealSources = session.sources.length > 0;
  return (
    <div className="review-workspace">
      <aside className="slide-filmstrip" aria-label={language === "zh" ? "页面缩略图" : "Slide thumbnails"}>
        {session.slides.map((slide) => (
          <button key={slide.slideId} className={slide.slideId === activeSlide.slideId ? "selected" : ""} aria-current={slide.slideId === activeSlide.slideId ? "page" : undefined} onClick={() => onActiveSlide(slide.slideId)}>
            <span>{slide.slideId}</span>
            <div className={`mini-slide role-${slide.role}`}><strong>{slide.title}</strong><i style={{ width: `${Math.max(24, Math.min(88, slide.takeaway.length * 2))}%` }} /></div>
            <small>{slide.status === "approved" ? <CheckCircle2 size={14} /> : <CircleDot size={14} />}{roleLabel(slide.role, language)}</small>
          </button>
        ))}
      </aside>
      <section className="preview-canvas">
        {!hasRealSources && <div className="draft-warning"><AlertCircle size={18} />{t.noFinalPreview}</div>}
        <iframe title={language === "zh" ? "结构预览" : "Structural preview"} srcDoc={previewHtml} sandbox="" />
        <div className="canvas-meta"><span>{activeSlide.slideId}</span><strong>{activeSlide.title}</strong><small>{activeSlide.variants.find((variant) => variant.id === activeSlide.selectedVariantId)?.layoutFamily}</small></div>
      </section>
      <aside className="review-inspector">
        <div className="inspector-heading"><Gauge size={19} /><span><strong>{t.visualQuality}</strong><small>{session.projectPath ? t.projectReady : t.waitingArtifact}</small></span></div>
        <QualityRow label={language === "zh" ? "结论层级" : "Takeaway hierarchy"} status={activeSlide.takeaway.length >= 12 ? "ok" : "warning"} />
        <QualityRow label={language === "zh" ? "证据绑定" : "Evidence binding"} status={activeSlide.evidenceState === "grounded" ? "ok" : "warning"} />
        <QualityRow label={language === "zh" ? "可编辑边界" : "Editability"} status="ok" />
        <QualityRow label={language === "zh" ? "视觉方向" : "Visual direction"} status={session.selectedDirectionId ? "ok" : "warning"} />
        <div className="inspector-actions">
          <button onClick={() => onApprove(activeSlide.slideId)}><CheckCircle2 size={17} />{t.approveSlide}</button>
          <button onClick={() => onRotate(activeSlide)}><RefreshCw size={17} />{t.regenerateSlide}</button>
        </div>
        <div className="delivery-actions">
          <button disabled={!handoff} title={!handoff ? t.waitingArtifact : undefined} onClick={onCopyAgent}><ExternalLink size={18} />{t.openPowerPoint}</button>
          <button disabled title={t.waitingArtifact}><Download size={18} />{t.downloadPptx}</button>
          <button onClick={onDownloadPreview}><MonitorPlay size={18} />{handoff ? t.shareWeb : t.downloadPreview}</button>
        </div>
        {handoff && <div className="handoff-ready"><FolderOpen size={18} /><span><strong>{t.projectReady}</strong><code>{handoff.projectPath}</code></span></div>}
        {handoff && session.slides.every((slide) => slide.status === "approved") && <button className="primary-button delivered-button" onClick={onDelivered}><ShieldCheck size={18} />{language === "zh" ? "标记为已交付" : "Mark delivered"}</button>}
      </aside>
    </div>
  );
}

function DiagnosticsDialog({ language, bridge, checking, onClose, onRefresh, onCopyCommand, copy: t }: {
  language: Language;
  bridge: BridgeHealth | null;
  checking: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onCopyCommand: () => void;
  copy: typeof copy.zh | typeof copy.en;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="diagnostics-dialog" role="dialog" aria-modal="true" aria-labelledby="diagnostics-title" tabIndex={-1} ref={dialogRef}>
        <header><div><p>LOCAL ENVIRONMENT</p><h2 id="diagnostics-title">{t.diagnostics}</h2></div><button aria-label={language === "zh" ? "关闭" : "Close"} onClick={onClose}><X size={19} /></button></header>
        <section className={`diagnostic-status ${bridge ? "online" : "offline"}`}><span>{bridge ? <CheckCircle2 size={21} /> : <AlertCircle size={21} />}</span><div><strong>{bridge ? t.connected : t.disconnected}</strong><p>{bridge ? `${bridge.outputDir} · v${bridge.version}` : (language === "zh" ? "启动 Bridge 后，网页才能解析本地文件并写入项目包。" : "Start Bridge to parse local files and write project handoffs.")}</p></div></section>
        <section><h3><Server size={18} />{t.bridgeCommand}</h3><code>{bridgeCommandFor(bridge)}</code><div className="diagnostic-actions"><button onClick={onCopyCommand}><Clipboard size={16} />{t.repairBridge}</button><button onClick={onRefresh} disabled={checking}><RefreshCw className={checking ? "spin" : ""} size={16} />{t.refresh}</button></div></section>
        <section><h3><Activity size={18} />{t.providerStatus}</h3><div className="provider-list">{bridge?.providers?.map((provider) => <span key={provider.id} className={provider.configured ? "configured" : "missing"}><i />{provider.label}<small>{provider.configured ? (language === "zh" ? "已配置" : "Configured") : (language === "zh" ? "未配置" : "Missing")}</small></span>) || <p>{language === "zh" ? "连接后显示 Provider 状态。" : "Provider status appears after connection."}</p>}</div></section>
        <section><h3><ShieldCheck size={18} />{t.sourceBoundary}</h3><p>{t.sourceBoundaryText}</p></section>
      </div>
    </div>
  );
}

function DirectionPreview({ direction, index }: { direction: ReturnType<typeof recommendedDirections>[number]; index: number }) {
  return (
    <span className="direction-preview" data-direction={direction.id} style={{ "--direction-accent": direction.accent } as CSSProperties}>
      <i className="direction-rule" />
      <small>0{index + 1} · Visual direction</small>
      <strong>{direction.labelEn}</strong>
      <em aria-hidden="true"><i /><i /><i /></em>
      <span className="direction-lines" aria-hidden="true"><i /><i /><i /></span>
      <b>{direction.coverLayout}</b>
    </span>
  );
}

function EvidenceBadge({ state, copy: t }: { state: DeckSlide["evidenceState"]; copy: typeof copy.zh | typeof copy.en }) {
  return <small className={`evidence-badge ${state}`}>{state === "grounded" ? t.evidenceGrounded : state === "partial" ? t.evidencePartial : t.evidenceMissing}</small>;
}

function QualityRow({ label, status }: { label: string; status: "ok" | "warning" }) {
  return <div className={`quality-row ${status}`}>{status === "ok" ? <Check size={15} /> : <AlertCircle size={15} />}<span>{label}</span><small>{status === "ok" ? "PASS" : "REVIEW"}</small></div>;
}

function phaseTitle(phase: DeckPhase, t: typeof copy.zh | typeof copy.en) {
  return phase === "intake" ? t.intakeTitle : phase === "outline" ? t.outlineTitle : phase === "generating" ? t.designTitle : t.reviewTitle;
}

function phaseLead(phase: DeckPhase, t: typeof copy.zh | typeof copy.en) {
  return phase === "intake" ? t.intakeLead : phase === "outline" ? t.outlineLead : phase === "generating" ? t.designLead : t.reviewLead;
}

function phaseHelp(phase: DeckPhase, language: Language) {
  const zh = { intake: "描述任务并添加资料。", outline: "确认每页任务和证据。", generating: "选择视觉方向并创建项目。", review: "按页精修和检查。", delivered: "检查最终交付。" };
  const en = { intake: "Describe the task and add sources.", outline: "Confirm slide jobs and evidence.", generating: "Choose a direction and create the project.", review: "Refine and review by slide.", delivered: "Review final delivery." };
  return (language === "zh" ? zh : en)[phase];
}

function roleLabel(role: string, language: Language) {
  const labels: Record<string, [string, string]> = {
    anchor: ["开场结论", "Opening"],
    context: ["背景判断", "Context"],
    evidence: ["事实证据", "Evidence"],
    comparison: ["比较决策", "Comparison"],
    action: ["行动路线", "Action"],
    closing: ["收束交付", "Closing"]
  };
  const pair = labels[role] || [role, role];
  return pair[language === "zh" ? 0 : 1];
}

function focusedQuestions(session: DeckSession, sources: ImportedSource[]) {
  const questions: string[] = [];
  if (!session.audience.trim()) questions.push("这份演示最需要说服或帮助谁？");
  if (!session.coreMessage.trim()) questions.push("听众离开时必须记住的一个判断是什么？");
  if (!sources.length) questions.push("哪些资料是事实边界，哪些内容明确不能补写？");
  return questions.slice(0, 3);
}

function sourceId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return `source-${Math.abs(hash).toString(36)}`;
}

function stripImportedSource(source: ImportedSource): DeckSourceSummary {
  return { id: source.id, name: source.name, kind: source.kind, status: source.status };
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function loadSession(): DeckSession {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return createDeckSession();
    const parsed = JSON.parse(raw) as DeckSession;
    if (parsed.schemaVersion !== "deck-session-v6") return createDeckSession();
    return createDeckSession(parsed);
  } catch {
    return createDeckSession();
  }
}

function buildHandoffPayload(session: DeckSession, sources: ImportedSource[], previewWebDeckHtml: string, language: Language) {
  const outputMode = session.outputPurpose === "editable-pptx" ? "pptx" : session.outputPurpose === "web-deck" ? "web" : "both";
  const title = session.request.trim().split(/[。.!?？\n]/)[0].slice(0, 60) || "Ultimate PPT Master v6 project";
  const sourceMarkdown = [
    `# ${title}`,
    "",
    session.request,
    "",
    session.audience ? `Audience: ${session.audience}` : "",
    session.coreMessage ? `Core message: ${session.coreMessage}` : "",
    "",
    "## Storyboard",
    ...session.slides.map((slide) => `- ${slide.slideId} | ${slide.role} | ${slide.title} | ${slide.takeaway}`),
    "",
    ...sources.filter((source) => source.text).map((source) => `## ${source.name}\n\n${source.text}`)
  ].filter(Boolean).join("\n");
  const qualityGate = {
    level: "formal-business",
    requiredInputs: ["source-boundary", "audience", "editable-output-policy"],
    acceptanceCriteria: ["one primary judgment per slide", "traceable evidence", "editable formal body pages", "rendered visual review"],
    artifactChecks: ["editable PPTX objects", "complete Web Deck rendering", "stable slideId"],
    reviewCommands: ["python3 scripts/audit_formal_delivery.py <project_path>", "python3 scripts/audit_design_completion.py <project_path>", "python3 scripts/audit_pptx_native_objects.py <final.pptx> --expect text,shape"]
  };
  return {
    form: {
      title,
      audience: session.audience,
      coreMessage: session.coreMessage,
      sourceNotes: session.request,
      constraints: "Preserve stable slideId values. Produce a fast structural draft before high-quality refinement.",
      slideCount: String(session.slides.length),
      outputMode,
      stylePreset: session.selectedDirectionId,
      language
    },
    sourceMarkdown,
    agentPrompt: `Use the Ultimate PPT Master Skill. Read project-brief.json and its deckSession first. Preserve every slideId. Generate a structural draft, then refine selected or audit-failed slides.`,
    projectBrief: {
      schemaVersion: "v5.2-brief-v1",
      title,
      audience: session.audience,
      coreMessage: session.coreMessage,
      outputMode,
      deckSession: session,
      selectedDirectionId: session.selectedDirectionId,
      briefMode: sources.length ? "source-first" : "codex-guided-intake",
      expectationFit: {
        riskLevel: sources.length ? "yellow" : "red",
        score: sessionReadiness(session),
        readyForProduction: sources.length > 0 && session.request.trim().length >= 8,
        missingSignals: sources.length ? [] : ["missing real source material"],
        assumptions: ["PPTX body content remains editable", "Technical diagnostics stay outside the primary user flow"]
      },
      qualityGate,
      workflowState: { currentStep: "handoff", blockedReason: sources.length ? "" : "real source required before final production" }
    },
    qualityGate,
    workflowState: { currentStep: "handoff", blockedReason: sources.length ? "" : "real source required before final production" },
    previewWebDeckHtml,
    qualityChecklist: "# v6 Quality Checklist\n\n- [ ] Stable slideId on every page\n- [ ] Evidence gaps are visible\n- [ ] Formal body remains editable\n- [ ] Rendered review completed\n",
    enginePlanMarkdown: `# v6 Engine Plan\n\n1. Deterministic structural draft\n2. User-selected direction: ${session.selectedDirectionId}\n3. High-quality refinement for selected or failed slides\n4. PPTX/Web verification\n`,
    attachments: sources.filter((source) => source.kind === "file" || source.kind === "pptx").map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      size: source.size,
      text: source.text,
      dataBase64: source.dataBase64
    }))
  };
}

function buildPreviewHtml(session: DeckSession, language: Language) {
  const direction = visualDirectionCatalog.find((item) => item.id === session.selectedDirectionId) || visualDirectionCatalog[1];
  const slides = session.slides.map((slide, index) => {
    const layoutFamily = slide.variants.find((variant) => variant.id === slide.selectedVariantId)?.layoutFamily || "layout";
    const rhythm = index === 0 || slide.role === "closing" ? "anchor" : index % 3 === 1 ? "breathing" : "dense";
    return `
    <section class="slide role-${escapeHtml(slide.role)} rhythm-${rhythm}" data-slide-id="${escapeHtml(slide.slideId)}" data-layout-family="${escapeHtml(layoutFamily)}">
      <div class="visual-anchor" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="index">${escapeHtml(slide.slideId)}</div>
      <div class="copy"><p class="role">${escapeHtml(roleLabel(slide.role, language))}</p><h2>${escapeHtml(slide.title)}</h2><p class="takeaway">${escapeHtml(slide.takeaway)}</p></div>
      <div class="evidence"><span>${slide.evidenceRefs.length ? slide.evidenceRefs.map(escapeHtml).join(" · ") : (language === "zh" ? "证据待补" : "Evidence needed")}</span><i></i></div>
      <footer><span>${escapeHtml(direction.labelEn)}</span><span>${escapeHtml(layoutFamily)}</span></footer>
    </section>`;
  }).join("");
  return `<!doctype html><html lang="${language === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    @import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&family=Noto+Sans+SC:wght@400;500;600&family=Noto+Serif+SC:wght@400;500&display=swap");
    :root{--paper:#f8f8f5;--ink:#111311;--accent:${direction.accent};--muted:#626a70;--display:"IBM Plex Sans","Noto Sans SC","Microsoft YaHei",sans-serif;--body:"Noto Sans SC","Microsoft YaHei",sans-serif;--mono:"IBM Plex Mono",Consolas,monospace;--title:clamp(42px,5vw,72px);--body-size:clamp(20px,1.8vw,29px);--small:clamp(11px,.8vw,14px);--pad-x:5.5vw;--pad-top:5vh;--pad-bottom:4.5vh}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:var(--body);background:var(--ink);color:var(--ink);-webkit-font-smoothing:antialiased}.deck{width:100vw;height:100vh;display:flex;overflow:auto;scroll-snap-type:x mandatory}.slide{position:relative;isolation:isolate;min-width:100vw;height:100vh;padding:var(--pad-top) var(--pad-x) var(--pad-bottom);background:var(--paper);scroll-snap-align:start;display:grid;grid-template-rows:1fr auto auto;gap:3vh;overflow:hidden}.copy{align-self:start;margin-top:10vh;display:grid;gap:2.2vh}.role{margin:0;color:var(--accent);font-size:var(--small);font-weight:600;letter-spacing:.025em}.slide h2{max-width:13ch;margin:0;font-family:var(--display);font-size:var(--title);font-weight:300;line-height:1.08;letter-spacing:-.04em;text-wrap:balance}.takeaway{max-width:34em;margin:0;color:var(--muted);font-size:var(--body-size);line-height:1.58}.index{position:absolute;right:var(--pad-x);top:var(--pad-top);z-index:3;font-family:var(--mono);font-size:var(--small);font-weight:500}.evidence{align-self:end;display:flex;align-items:center;gap:16px;font-size:var(--small);font-weight:500}.evidence i{display:block;width:120px;height:3px;background:var(--accent)}footer{display:flex;justify-content:space-between;align-self:end;padding-top:1.4vh;border-top:1px solid currentColor;color:var(--muted);font-size:var(--small)}.visual-anchor{position:absolute;z-index:-1;pointer-events:none}.visual-anchor i{position:absolute;display:block}.role-evidence .copy,.role-comparison .copy{grid-template-columns:5fr 7fr;column-gap:6vw;align-items:start}.role-evidence .copy .role,.role-comparison .copy .role{grid-column:1/-1}.role-evidence .takeaway,.role-comparison .takeaway{padding-top:.7vh}.rhythm-anchor .copy{margin-top:14vh}.rhythm-breathing .copy{margin-top:17vh}.rhythm-dense .copy{margin-top:7vh}

    .direction-formal-finance{--paper:#f7f5f0;--ink:#171714;--muted:#687078;--display:"IBM Plex Sans","Noto Sans SC","Microsoft YaHei",sans-serif}.direction-formal-finance .slide{padding-left:10vw}.direction-formal-finance .slide::before{content:"";position:absolute;left:0;top:0;width:5.5vw;height:100%;background:#173a63}.direction-formal-finance .rhythm-anchor{background:#173a63;color:#f7f5f0}.direction-formal-finance .rhythm-anchor::before{background:#b44535}.direction-formal-finance .rhythm-anchor .takeaway,.direction-formal-finance .rhythm-anchor footer{color:rgba(247,245,240,.7)}.direction-formal-finance .visual-anchor{right:8vw;top:22vh;width:30vw;height:38vh;border-top:1px solid currentColor;border-bottom:1px solid currentColor;opacity:.2}.direction-formal-finance .visual-anchor i{left:0;right:0;height:1px;background:currentColor}.direction-formal-finance .visual-anchor i:nth-child(1){top:25%}.direction-formal-finance .visual-anchor i:nth-child(2){top:50%}.direction-formal-finance .visual-anchor i:nth-child(3){top:75%}

    .direction-consulting-evidence{--paper:#f8f8f5;--ink:#111311;--muted:#626a70}.direction-consulting-evidence .slide::after{content:"";position:absolute;inset:0;z-index:-2;background-image:linear-gradient(rgba(17,19,17,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(17,19,17,.035) 1px,transparent 1px);background-size:8.333vw 8.333vw}.direction-consulting-evidence .rhythm-anchor{background:#111311;color:#f8f8f5}.direction-consulting-evidence .rhythm-anchor .takeaway,.direction-consulting-evidence .rhythm-anchor footer{color:rgba(248,248,245,.7)}.direction-consulting-evidence .visual-anchor{right:7vw;top:25vh;width:28vw;height:30vh;border-left:4px solid var(--accent)}.direction-consulting-evidence .visual-anchor i{left:2vw;right:0;height:1px;background:currentColor;opacity:.28}.direction-consulting-evidence .visual-anchor i:nth-child(1){top:12%}.direction-consulting-evidence .visual-anchor i:nth-child(2){top:48%}.direction-consulting-evidence .visual-anchor i:nth-child(3){top:84%}

    .direction-brand-launch{--paper:#efeee8;--ink:#090a09;--muted:#9a9a92;--display:"Noto Sans SC","Microsoft YaHei",sans-serif}.direction-brand-launch .slide{background:#090a09;color:#f2efe6}.direction-brand-launch .slide:nth-child(3n+2){background:#efeee8;color:#090a09}.direction-brand-launch .slide:nth-child(3n+2) .takeaway,.direction-brand-launch .slide:nth-child(3n+2) footer{color:#6f716b}.direction-brand-launch .takeaway,.direction-brand-launch footer{color:rgba(242,239,230,.68)}.direction-brand-launch .slide h2{font-weight:500;max-width:10ch}.direction-brand-launch .visual-anchor{right:10vw;top:-15vh;width:34vw;height:130vh;border-left:1px solid currentColor;border-right:1px solid currentColor;transform:rotate(16deg);opacity:.18}.direction-brand-launch .visual-anchor i:nth-child(1){left:12%;top:54%;width:70%;height:6px;background:var(--accent)}

    .direction-training-narrative{--paper:#f8f5ee;--ink:#18201c;--accent:#356859;--muted:#6a726d;--display:"Noto Serif SC",SimSun,serif}.direction-training-narrative .slide{padding-left:12vw}.direction-training-narrative .slide::before{content:"";position:absolute;left:0;top:0;width:7vw;height:100%;background:#356859}.direction-training-narrative .slide::after{content:attr(data-slide-id);position:absolute;left:1.8vw;top:8vh;color:#f8f5ee;font:500 16px var(--mono);writing-mode:vertical-rl}.direction-training-narrative .rhythm-anchor{background:#356859;color:#f8f5ee}.direction-training-narrative .rhythm-anchor::before{background:#d67b55}.direction-training-narrative .rhythm-anchor .takeaway,.direction-training-narrative .rhythm-anchor footer{color:rgba(248,245,238,.72)}.direction-training-narrative .visual-anchor{right:7vw;top:23vh;width:29vw;height:40vh;border:1px solid currentColor;opacity:.2}.direction-training-narrative .visual-anchor i{left:0;right:0;height:1px;background:currentColor}.direction-training-narrative .visual-anchor i:nth-child(1){top:25%}.direction-training-narrative .visual-anchor i:nth-child(2){top:50%}.direction-training-narrative .visual-anchor i:nth-child(3){top:75%}

    .direction-editorial-narrative{--paper:#faf9f5;--ink:#141413;--accent:#cc785c;--muted:#6c6a64;--display:"Noto Serif SC",SimSun,serif}.direction-editorial-narrative .slide::before{content:"";position:absolute;right:0;top:0;width:22vw;height:100%;z-index:-2;background:rgba(204,120,92,.08)}.direction-editorial-narrative .rhythm-anchor{background:#141413;color:#faf9f5}.direction-editorial-narrative .rhythm-anchor .takeaway,.direction-editorial-narrative .rhythm-anchor footer{color:rgba(250,249,245,.7)}.direction-editorial-narrative .slide h2{font-weight:400;max-width:11ch}.direction-editorial-narrative .visual-anchor{right:8vw;top:19vh;width:25vw;height:48vh;border:1px solid currentColor;border-radius:44% 44% 10% 44%;opacity:.22}.direction-editorial-narrative .visual-anchor i:nth-child(1){left:50%;top:-8%;width:1px;height:116%;background:currentColor}

    .direction-swiss-information{--paper:#f7f7f4;--ink:#101210;--accent:#1d4ed8;--muted:#676d68}.direction-swiss-information .slide{border-radius:0}.direction-swiss-information .slide h2{font-weight:300}.direction-swiss-information .rhythm-anchor::before{content:"";position:absolute;right:0;top:0;width:30vw;height:100%;z-index:-2;background:var(--accent)}.direction-swiss-information .visual-anchor{right:7vw;bottom:18vh;width:23vw;height:28vh;border-top:1px solid currentColor}.direction-swiss-information .visual-anchor i{height:1px;background:currentColor;left:0;right:0}.direction-swiss-information .visual-anchor i:nth-child(1){top:30%}.direction-swiss-information .visual-anchor i:nth-child(2){top:60%}.direction-swiss-information .visual-anchor i:nth-child(3){top:90%}

    @media(max-width:680px){:root{--title:clamp(34px,10vw,48px);--body-size:16px;--pad-x:7vw}.slide{padding-top:4vh}.copy,.rhythm-anchor .copy,.rhythm-breathing .copy,.rhythm-dense .copy{margin-top:12vh}.role-evidence .copy,.role-comparison .copy{grid-template-columns:1fr}.takeaway{max-width:92%}.evidence i{width:64px}.visual-anchor{opacity:.1!important}.direction-formal-finance .slide,.direction-training-narrative .slide{padding-left:14vw}.direction-editorial-narrative .slide::before{width:14vw}}
  </style></head><body class="direction-${escapeHtml(direction.id)}"><main class="deck" aria-label="${escapeHtml(session.request || "Deck preview")}">${slides}</main></body></html>`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character));
}

function bridgeCommandFor(bridge: BridgeHealth | null) {
  const repoRoot = bridge?.repoRoot;
  if (!repoRoot) return "npm run bridge";
  return `cd '${repoRoot.replace(/'/g, `'\\''`)}' && npm run bridge`;
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
