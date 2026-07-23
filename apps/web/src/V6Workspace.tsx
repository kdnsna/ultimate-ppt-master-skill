import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
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
import LayoutPanelLeft from "lucide-react/dist/esm/icons/layout-panel-left.js";
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
  routeDecisionFor,
  sessionReadiness,
  visualDirectionCatalog
} from "../../../packages/workspace-core/src";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

const bridgeUrl = "http://127.0.0.1:43188";
const sessionStorageKey = "ultimate-ppt-master-deck-session-v6";
const legacyLocalStorageKey = sessionStorageKey;
const appVersion = "6.3.8";
const brandAssetUrl = `${import.meta.env.BASE_URL}brand.svg`;
const pptlintProofAssetUrl = `${import.meta.env.BASE_URL}pptlint-before-after-hero.png`;
const maxSourceCount = 24;
const maxSourceFileBytes = 32 * 1024 * 1024;
const maxSourceTotalBytes = 40 * 1024 * 1024;

type Language = "zh" | "en";

interface ImportedSource extends DeckSourceSummary {
  type?: string;
  size?: number;
  text?: string;
  dataBase64?: string;
  url?: string;
  recoverability?: "resident" | "url" | "bridge-project" | "needs-reselect";
}

interface BridgeHealth {
  ok: boolean;
  version: string;
  outputDir: string;
  repoRoot?: string;
  allowLaunch?: boolean;
  agents: Array<{ id: string; label: string; available: boolean; command: string; path: string }>;
  providers: Array<{ id: string; label: string; configured: boolean }>;
}

type ArtifactKind = "pptx" | "web-deck" | "pdf" | "archive" | "report";
type ArtifactVerification = "pending" | "passed" | "warning" | "blocked";
type RuntimeState = "bridge-offline" | "bridge-no-agent" | "agent-launchable" | "generating" | "artifact-complete" | "quality-blocked";

interface ProjectArtifact {
  name: string;
  kind: ArtifactKind;
  relativePath: string;
  size: number;
  modifiedAt: string;
  verification: ArtifactVerification;
  sha256?: string;
}

type AgentJobStatus = "accepted" | "running" | "completed" | "failed";

interface AgentJobSnapshot {
  jobId: string;
  status: AgentJobStatus;
  command: string;
  message: string;
  acceptedAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  exitCode?: number | null;
}

interface AgentLaunchResult {
  ok: boolean;
  launched: boolean;
  idempotent?: boolean;
  status?: AgentJobStatus | "command-only";
  projectPath?: string;
  command: string;
  message: string;
  job?: AgentJobSnapshot | null;
}

interface AgentStatusResult {
  ok: boolean;
  projectPath: string;
  status: AgentJobStatus | "idle";
  job: AgentJobSnapshot | null;
}

interface HandoffResult {
  ok: boolean;
  projectPath: string;
  sessionId?: string;
  files: string[];
  suggestedCommands: Record<string, string>;
  manifest?: {
    attachments?: Array<{ id?: string; parseStatus?: string; ingestion?: string }>;
    evidenceSources?: Array<{ id?: string; verified?: boolean }>;
    expectationFit?: { readyForProduction?: boolean; sourceAdequacy?: string };
  };
  storyboard?: {
    slides?: Array<{
      slideId?: string;
      evidenceState?: DeckSlide["evidenceState"];
      evidenceRefs?: string[];
    }>;
  };
}

const copy = {
    product: "终极融合 PPT 大师",
    promise: "本地演示文稿质量工作台",
    title: "从真实资料，到能放心交付的演示文稿。",
    subtitle: "先确认任务与证据，再决定视觉；生成后按页精修，最后回到 PowerPoint 完成正式交付。",
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
    evidenceGrounded: "已绑定证据",
    evidenceCandidate: "候选证据",
    evidenceUnmapped: "待映射",
    evidenceConflicted: "证据冲突",
    evidencePartial: "证据待补",
    evidenceMissing: "没有证据",
    designTitle: "选一个明确的视觉方向",
    designLead: "这里展示封面、正文和数据页的完整方向，而不是只给抽象风格标签。",
    generate: "创建本地项目",
    generateAndLaunch: "创建项目并启动 Codex",
    generating: "正在准备项目",
    reviewTitle: "按页精修，再决定如何交付",
    reviewLead: "缩略图、预览和质量问题在同一个工作区；技术文件放在诊断抽屉。",
    visualQuality: "质量检查",
    noFinalPreview: "当前只有结构预览。添加真实资料并创建本地项目后，才进入正式制作。",
    approveSlide: "确认本页",
    regenerateSlide: "换一个结构",
    openPowerPoint: "启动本地 Agent",
    downloadPptx: "下载 PPTX",
    shareWeb: "下载 Web Deck",
    waitingArtifact: "等待正式产物",
    artifactTitle: "真实产物",
    artifactEmpty: "Agent 运行后，这里会自动出现 PPTX、Web Deck 和质量报告。",
    structuralPreview: "结构稿 · 不是最终成品",
    agentLaunched: "Codex 已启动，正在本地生产。",
    agentCommandReady: "项目已创建，请复制 Codex 命令继续。",
    passedArtifactRequired: "只有质量状态为通过且全部页面已批准时，才能标记已交付。",
    downloadPreview: "下载 Web 结构预览",
    projectReady: "本地项目已创建",
    copyAgent: "复制 AI 助手命令",
    back: "返回",
    next: "下一步",
    reset: "新建任务",
    readiness: "任务准备度",
    realSourceRequired: "正式制作前需要至少一份可验证资料；没有资料时只生成结构稿。",
    repairBridge: "复制本机连接命令",
    refresh: "重新检测",
    advanced: "专业诊断",
    bridgeCommand: "本机连接命令",
    providerStatus: "模型状态",
    sourceBoundary: "资料与隐私",
    sourceBoundaryText: "浏览器只向 127.0.0.1 发送本地 handoff；不会把资料自动上传到第三方。"
} as const;

export function V6Workspace() {
  const language: Language = "zh";
  const [session, setSession] = useState<DeckSession>(() => loadSession());
  const [sources, setSources] = useState<ImportedSource[]>(() => restoreImportedSources(
    session.sources,
    Boolean(session.projectPath && (session.phase === "review" || session.phase === "delivered"))
  ));
  const [urlInput, setUrlInput] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [bridge, setBridge] = useState<BridgeHealth | null>(null);
  const [bridgeChecking, setBridgeChecking] = useState(false);
  const [handoff, setHandoff] = useState<HandoffResult | null>(null);
  const [artifacts, setArtifacts] = useState<ProjectArtifact[]>([]);
  const [artifactsChecking, setArtifactsChecking] = useState(false);
  const [agentLaunch, setAgentLaunch] = useState<AgentLaunchResult | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusResult | null>(null);
  const [activeSlideId, setActiveSlideId] = useState(session.slides[0]?.slideId || "P01");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [eventMessage, setEventMessage] = useState("");
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const workspaceHeadingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagnosticsTriggerRef = useRef<HTMLButtonElement>(null);
  const artifactAbortRef = useRef<AbortController | null>(null);
  const artifactRequestRef = useRef(0);
  const agentStatusAbortRef = useRef<AbortController | null>(null);
  const agentStatusRequestRef = useRef(0);
  const t = copy;
  const readiness = sessionReadiness(session);
  const directions = useMemo(() => recommendedDirections(session), [session.request, session.outputPurpose]);
  const deferredSession = useDeferredValue(session);
  const previewHtml = useMemo(() => buildPreviewHtml(deferredSession, language), [deferredSession, language]);
  const activePreviewHtml = useMemo(() => buildPreviewHtml(deferredSession, language, activeSlideId), [deferredSession, language, activeSlideId]);
  const activeSlide = session.slides.find((slide) => slide.slideId === activeSlideId) || session.slides[0];

  useEffect(() => {
    window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!liveAnnouncement) return;
    const timer = window.setTimeout(() => setLiveAnnouncement(""), 4500);
    return () => window.clearTimeout(timer);
  }, [liveAnnouncement]);

  useEffect(() => {
    void checkBridge(true);
    const timer = window.setInterval(() => {
      if (!document.hidden) void checkBridge(true);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!bridge) return;
    const query = new URLSearchParams({ sessionId: session.sessionId });
    const events = new EventSource(`${bridgeUrl}/events?${query}`);
    events.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as BridgeProgressEvent;
        if (event.sessionId && event.sessionId !== session.sessionId) return;
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
    events.onerror = () => setEventMessage("本机进度连接已断开，正在等待重连。");
    return () => events.close();
  }, [Boolean(bridge), session.sessionId]);

  useEffect(() => {
    const projectPath = session.projectPath;
    if (!bridge || !projectPath) return;
    const shouldRepeat = session.phase === "generating" || session.phase === "review";
    let cancelled = false;
    const poll = () => {
      if (!cancelled && !document.hidden) {
        void refreshArtifacts(projectPath, true);
        void refreshAgentStatus(projectPath, true);
      }
    };
    poll();
    if (!shouldRepeat) return () => { cancelled = true; };
    const timer = window.setInterval(poll, 3000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [Boolean(bridge), session.projectPath, session.phase]);

  function transitionTo(phase: DeckPhase) {
    setSession((current) => ({ ...current, phase, updatedAt: new Date().toISOString() }));
    setLiveAnnouncement(`${phaseLabels[language][phase]}。${phaseHelp(phase, language)}`);
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      workspaceHeadingRef.current?.focus({ preventScroll: true });
    });
  }

  function updateSession(patch: Partial<DeckSession>) {
    setSession((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }));
  }

  function updateRequest(request: string) {
    setSession((current) => ({
      ...current,
      request,
      selectedDirectionId: validDirectionId(request, current.outputPurpose, current.selectedDirectionId),
      routeDecision: current.routeDecision.source === "user"
        ? routeDecisionFor(request, current.outputPurpose, "user")
        : routeDecisionFor(request, current.outputPurpose, "auto"),
      updatedAt: new Date().toISOString()
    }));
  }

  function updateOutputPurpose(outputPurpose: OutputPurpose) {
    setSession((current) => ({
      ...current,
      outputPurpose,
      selectedDirectionId: validDirectionId(current.request, outputPurpose, current.selectedDirectionId),
      routeDecision: routeDecisionFor(current.request, outputPurpose, "user"),
      updatedAt: new Date().toISOString()
    }));
  }

  function rebuildOutline() {
    const evidenceIds = sources.filter(sourceHasVerifiedText).map((source) => source.id);
    const slides = createDraftSlides(session.request, evidenceIds, inferSlideCount(session.request)).map((slide) => (
      evidenceIds.length === 0 && sources.some((source) => source.status === "local-parse")
        ? { ...slide, evidenceState: "candidate" as const, evidenceRefs: [], status: "draft" as const }
        : slide
    ));
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
    const projectPath = handoff?.projectPath || session.projectPath;
    if (!projectPath) {
      rotateSlideVariant(slide);
      return;
    }
    setWorkspaceError("");
    try {
      const response = await fetch(`${bridgeUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectPath,
          slideId: slide.slideId,
          variantId: next.id,
          instruction: "Regenerate only this slide with the selected structural variant. Preserve evidence, source bindings, and editable PowerPoint objects."
        })
      });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
      updateSlide(slide.slideId, { selectedVariantId: next.id, status: "needs-review" });
      setLiveAnnouncement(`${slide.slideId} 已提交新的结构方案。`);
    } catch (error) {
      const message = `未能切换 ${slide.slideId}：${error instanceof Error ? error.message : String(error)}`;
      setWorkspaceError(message);
      setLiveAnnouncement(message);
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

  async function refreshArtifacts(projectPath = session.projectPath, silent = false) {
    if (!projectPath || !bridge) return;
    const requestId = artifactRequestRef.current + 1;
    artifactRequestRef.current = requestId;
    artifactAbortRef.current?.abort();
    const controller = new AbortController();
    artifactAbortRef.current = controller;
    setArtifactsChecking(true);
    if (!silent) setWorkspaceError("");
    try {
      const query = new URLSearchParams({ projectPath });
      const response = await fetch(`${bridgeUrl}/projects/artifacts?${query}`, { cache: "no-store", signal: controller.signal });
      const payload = await response.json() as { ok?: boolean; artifacts?: ProjectArtifact[]; message?: string } | ProjectArtifact[];
      if (!response.ok) throw new Error(Array.isArray(payload) ? `HTTP ${response.status}` : payload.message || `HTTP ${response.status}`);
      const nextArtifacts = Array.isArray(payload) ? payload : payload.artifacts || [];
      if (requestId !== artifactRequestRef.current) return;
      setArtifacts(nextArtifacts);
      if (!silent && nextArtifacts.length) setLiveAnnouncement(`已发现 ${nextArtifacts.length} 个真实产物。`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (!silent) {
        const message = error instanceof Error ? error.message : String(error);
        setWorkspaceError(message);
        setLiveAnnouncement(message);
      }
    } finally {
      if (requestId === artifactRequestRef.current) {
        artifactAbortRef.current = null;
        setArtifactsChecking(false);
      }
    }
  }

  async function refreshAgentStatus(projectPath = session.projectPath, silent = false) {
    if (!projectPath || !bridge) return;
    const requestId = agentStatusRequestRef.current + 1;
    agentStatusRequestRef.current = requestId;
    agentStatusAbortRef.current?.abort();
    const controller = new AbortController();
    agentStatusAbortRef.current = controller;
    try {
      const query = new URLSearchParams({ projectPath });
      const response = await fetch(`${bridgeUrl}/agent/status?${query}`, { cache: "no-store", signal: controller.signal });
      const payload = await response.json() as AgentStatusResult & { message?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.message || `HTTP ${response.status}`);
      if (requestId !== agentStatusRequestRef.current) return;
      setAgentStatus(payload);
      if (!silent && payload.status === "failed") {
        const message = payload.job?.message || "本地 Agent 未能完成任务。";
        setWorkspaceError(message);
        setLiveAnnouncement(message);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      // Older Bridge versions do not expose /agent/status. Artifact discovery
      // remains usable, but an explicit refresh should still explain the gap.
      if (!silent) {
        const message = error instanceof Error ? error.message : String(error);
        setWorkspaceError(message);
        setLiveAnnouncement(message);
      }
    } finally {
      if (requestId === agentStatusRequestRef.current) agentStatusAbortRef.current = null;
    }
  }

  async function requestAgentLaunch(projectPath: string): Promise<AgentLaunchResult | null> {
    setWorkspaceError("");
    agentStatusRequestRef.current += 1;
    agentStatusAbortRef.current?.abort();
    agentStatusAbortRef.current = null;
    try {
      const response = await fetch(`${bridgeUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, agent: "codex" })
      });
      const result = await response.json() as AgentLaunchResult;
      setAgentLaunch(result);
      if (result.job && ["accepted", "running", "completed", "failed"].includes(result.job.status)) {
        setAgentStatus({
          ok: result.ok,
          projectPath: result.projectPath || projectPath,
          status: result.job.status,
          job: result.job
        });
      }
      if (!response.ok || !result.ok) throw new Error(result.message || `HTTP ${response.status}`);
      const active = result.status === "accepted" || result.status === "running";
      setLiveAnnouncement(active || result.launched
        ? t.agentLaunched
        : result.status === "completed"
          ? "Agent 已结束，正在检查产物。"
          : t.agentCommandReady);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setWorkspaceError(message);
      setLiveAnnouncement(message);
      return null;
    }
  }

  async function launchCurrentAgent() {
    const projectPath = handoff?.projectPath || session.projectPath;
    if (!projectPath) return;
    await requestAgentLaunch(projectPath);
  }

  async function importFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const selectedFiles = Array.from(fileList);
    const availableSlots = Math.max(0, maxSourceCount - sources.length);
    const acceptedFiles = selectedFiles.slice(0, availableSlots);
    const errors: string[] = [];
    if (selectedFiles.length > availableSlots) errors.push(`最多保留 ${maxSourceCount} 份资料，已忽略 ${selectedFiles.length - availableSlots} 份。`);
    const imported: ImportedSource[] = [];
    let totalBytes = sources.reduce((sum, source) => sum + (source.size || 0), 0);
    for (const file of acceptedFiles) {
      if (file.size > maxSourceFileBytes) {
        errors.push(`${file.name} 超过单文件 32 MB 限制。`);
        continue;
      }
      if (totalBytes + file.size > maxSourceTotalBytes) {
        errors.push(`${file.name} 会使资料总量超过 40 MB，未读取。`);
        continue;
      }
      const textLike = /\.(md|markdown|txt|csv|json|html)$/i.test(file.name) || file.type.startsWith("text/");
      try {
        const text = textLike ? await file.text() : undefined;
        if (textLike && !text?.trim()) {
          errors.push(`${file.name} 没有可读取的文本内容。`);
          continue;
        }
        imported.push({
          id: sourceId(file.name),
          name: file.name,
          kind: /\.pptx?$/i.test(file.name) ? "pptx" : "file",
          status: textLike ? "ready" : "local-parse",
          type: file.type || "application/octet-stream",
          size: file.size,
          text,
          dataBase64: textLike ? undefined : await readAsBase64(file),
          recoverability: "resident"
        });
        totalBytes += file.size;
      } catch (error) {
        errors.push(`${file.name} 读取失败：${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const next = [...sources, ...imported];
    setSources(next);
    setSourceError(errors.join(" "));
    updateSession({ sources: next.map(stripImportedSource) });
  }

  function addUrl() {
    const value = urlInput.trim();
    if (!value) return;
    if (sources.length >= maxSourceCount) {
      setSourceError(`最多保留 ${maxSourceCount} 份资料。`);
      return;
    }
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    let url: string;
    try {
      const parsed = new URL(candidate);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error("只支持 HTTP 或 HTTPS 地址");
      url = parsed.toString();
    } catch (error) {
      setSourceError(`URL 无法识别：${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    const source: ImportedSource = { id: sourceId(url), name: url, kind: "url", status: "local-parse", url, recoverability: "url" };
    const next = [...sources, source];
    setSources(next);
    setUrlInput("");
    setSourceError("");
    updateSession({ sources: next.map(stripImportedSource) });
  }

  function removeSource(sourceIdValue: string) {
    const next = sources.filter((source) => source.id !== sourceIdValue);
    setSources(next);
    setSourceError("");
    updateSession({ sources: next.map(stripImportedSource) });
  }

  async function createHandoff() {
    if (!bridge) {
      setDiagnosticsOpen(true);
      setLiveAnnouncement(t.disconnected);
      return;
    }
    setIsSending(true);
    setWorkspaceError("");
    setArtifacts([]);
    setAgentLaunch(null);
    setAgentStatus(null);
    setWorkspaceError("");
    setSourceError("");
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
      const reconciledSources = reconcileSourcesAfterHandoff(sources, result);
      setHandoff(result);
      setSources(reconciledSources);
      setSession((current) => ({
        ...current,
        phase: "review",
        projectPath: result.projectPath,
        sources: reconciledSources.map(stripImportedSource),
        slides: reconcileSlideEvidenceAfterHandoff(current.slides, result),
        progress: { percent: 100, message: t.projectReady },
        updatedAt: new Date().toISOString()
      }));
      const codexCanLaunch = Boolean(bridge.allowLaunch && bridge.agents.some((agent) => agent.id === "codex" && agent.available));
      if (codexCanLaunch) {
        await requestAgentLaunch(result.projectPath);
      } else {
        setAgentLaunch({
          ok: true,
          launched: false,
          idempotent: true,
          status: "command-only",
          projectPath: result.projectPath,
          command: result.suggestedCommands.codex || result.suggestedCommands.generic || "",
          message: "本地项目已创建，请复制命令启动 Codex。"
        });
      }
      await Promise.all([
        refreshArtifacts(result.projectPath, true),
        refreshAgentStatus(result.projectPath, true)
      ]);
      transitionTo("review");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSession((current) => ({
        ...current,
        phase: "generating",
        progress: { percent: 0, message, recoverable: true }
      }));
      setWorkspaceError(message);
      setLiveAnnouncement(message);
    } finally {
      setIsSending(false);
    }
  }

  function resetWorkspace() {
    const next = createDeckSession();
    setSession(next);
    setSources([]);
    setHandoff(null);
    setArtifacts([]);
    setAgentLaunch(null);
    setAgentStatus(null);
    setActiveSlideId(next.slides[0]?.slideId || "P01");
    transitionTo("intake");
  }

  function downloadPreview() {
    downloadBlob("preview-web-deck.html", previewHtml, "text/html;charset=utf-8");
  }

  async function copyBridgeCommand() {
    try {
      await navigator.clipboard.writeText(bridgeCommandFor(bridge));
      setLiveAnnouncement("本机连接命令已复制。");
    } catch {
      const message = "浏览器未允许复制，请打开“专业诊断”手动选中本机连接命令。";
      setWorkspaceError(message);
      setLiveAnnouncement(message);
    }
  }

  const phaseIndex = deckPhases.indexOf(session.phase);
  const primaryCanContinue = session.request.trim().length >= 8;

  return (
    <div className="v6-app" data-phase={session.phase}>
      <a className="skip-link" href="#v6-workspace">跳到任务工作台</a>
      <header className="v6-topbar">
        <a className="v6-brand" href="./" aria-label={t.product}>
          <img src={brandAssetUrl} alt="" />
          <span><strong>{t.product}</strong><small>{t.promise}</small></span>
        </a>
        <div className="v6-top-actions">
          <a className="pptlint-top-link" href="https://kdnsna.github.io/pptlint/" target="_blank" rel="noreferrer"><ShieldCheck size={16} />{t.checkExistingPpt}</a>
          <button ref={diagnosticsTriggerRef} className={`bridge-indicator ${bridge ? "online" : "offline"}`} onClick={() => setDiagnosticsOpen(true)} aria-haspopup="dialog" aria-label={bridge ? t.connected : t.disconnected}>
            {bridge ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{bridge ? t.connected : t.disconnected}</span>
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
            <small>{sources.some(sourceHasVerifiedText) ? `${sources.filter(sourceHasVerifiedText).length} ${t.sourceTitle}` : t.realSourceRequired}</small>
          </div>
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

          {workspaceError && <div className="workspace-error" role="alert"><AlertCircle size={18} /><span>{workspaceError}</span><button type="button" onClick={() => setWorkspaceError("")} aria-label={language === "zh" ? "关闭错误提示" : "Dismiss error"}><X size={16} /></button></div>}

          {session.phase === "intake" && (
            <IntakePhase
              language={language}
              session={session}
              sources={sources}
              urlInput={urlInput}
              sourceError={sourceError}
              fileInputRef={fileInputRef}
              onRequestChange={updateRequest}
              onAudienceChange={(audience) => updateSession({ audience })}
              onOutputChange={updateOutputPurpose}
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
              onCopyBridgeCommand={copyBridgeCommand}
              copy={t}
            />
          )}

          {(session.phase === "review" || session.phase === "delivered") && activeSlide && (
            <ReviewPhase
              language={language}
              session={session}
              activeSlide={activeSlide}
              previewHtml={activePreviewHtml}
              handoff={handoff}
              artifacts={artifacts}
              artifactsChecking={artifactsChecking}
              agentLaunch={agentLaunch}
              agentStatus={agentStatus}
              bridge={bridge}
              onActiveSlide={setActiveSlideId}
              onApprove={(slideId) => updateSlide(slideId, { status: "approved" })}
              onRotate={(slide) => { void regenerateSlide(slide); }}
              onDownloadPreview={downloadPreview}
              onLaunchAgent={() => { void launchCurrentAgent(); }}
              onCopyBridgeCommand={copyBridgeCommand}
              onRefreshArtifacts={() => { void refreshArtifacts(undefined, false); }}
              onRefreshRuntime={() => {
                void refreshArtifacts(undefined, false);
                void refreshAgentStatus(undefined, false);
              }}
              onRestartProject={() => {
                setAgentLaunch(null);
                setAgentStatus(null);
                transitionTo("generating");
              }}
              onDelivered={() => transitionTo("delivered")}
              copy={t}
            />
          )}
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
      </main>

      {diagnosticsOpen && (
        <DiagnosticsDialog
          language={language}
          bridge={bridge}
          checking={bridgeChecking}
          onClose={() => setDiagnosticsOpen(false)}
          onRefresh={() => void checkBridge(false)}
          onCopyCommand={copyBridgeCommand}
          returnFocusRef={diagnosticsTriggerRef}
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
  sourceError,
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
  sourceError: string;
  fileInputRef: RefObject<HTMLInputElement>;
  onRequestChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
  onOutputChange: (value: OutputPurpose) => void;
  onUrlInput: (value: string) => void;
  onAddUrl: () => void;
  onImportFiles: (files: FileList | null) => Promise<void>;
  onRemoveSource: (id: string) => void;
  onContinue: () => void;
  copy: typeof copy;
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
            {outputs.map((output, index) => {
              const Icon = output.icon;
              const selected = session.outputPurpose === output.id;
              return (
                <button key={output.id} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} className={selected ? "selected" : ""} onClick={() => onOutputChange(output.id)} onKeyDown={(event) => handleRadioKeyDown(event, index, outputs.length, (nextIndex) => onOutputChange(outputs[nextIndex].id))}>
                  <Icon size={19} />
                  <span><strong>{output.title}</strong><small>{output.text}</small></span>
                </button>
              );
            })}
          </div>
        </div>
        <button className="primary-button intake-continue" data-primary-action="true" disabled={session.request.trim().length < 8} onClick={onContinue}>
          <Sparkles size={19} />{t.continueOutline}<ArrowRight size={18} />
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
        {sourceError && <p className="source-error" role="alert"><AlertCircle size={16} />{sourceError}</p>}
        <div className="source-list" aria-live="polite">
          {sources.length === 0 ? <p className="empty-source"><ShieldCheck size={18} />{t.noSource}</p> : sources.map((source) => (
            <article key={source.id}>
              <FileText size={18} />
              <span><strong>{source.name}</strong><small>{sourceStatusLabel(source, language)}</small></span>
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
  copy: typeof copy;
}) {
  return (
    <div className="outline-layout">
      <aside className="question-rail">
        <p><CircleDot size={17} />{t.focusedQuestions}</p>
        {session.questions.length ? session.questions.map((question, index) => <article key={question}><span>{index + 1}</span><p>{question}</p></article>) : <article className="questions-ready"><CheckCircle2 size={18} /><p>{language === "zh" ? "关键信息足够，可以开始设计。" : "The key context is ready for design."}</p></article>}
        {!session.audience.trim() && <label className="question-answer"><span>{language === "zh" ? "主要听众" : "Primary audience"}</span><input value={session.audience} onChange={(event) => onAudienceChange(event.target.value)} placeholder={language === "zh" ? "例如：管理层" : "Example: executive team"} /></label>}
        {!session.coreMessage.trim() && <label className="question-answer"><span>{language === "zh" ? "必须记住的判断" : "Must-remember judgment"}</span><textarea value={session.coreMessage} onChange={(event) => onCoreMessageChange(event.target.value)} placeholder={language === "zh" ? "用一句话写出希望听众记住的结论" : "Write the one conclusion the audience should remember"} /></label>}
        <div className="source-confidence"><ShieldCheck size={18} /><span><strong>{language === "zh" ? "资料充分度" : "Source confidence"}</strong><small>{session.sources.some((source) => source.status === "ready") ? (language === "zh" ? "已添加可验证资料，逐页检查证据。" : "Verified sources added; evidence is checked by slide.") : t.realSourceRequired}</small></span></div>
      </aside>
      <section className="storyboard-list" aria-label={language === "zh" ? "故事板页面" : "Storyboard slides"}>
        {session.slides.map((slide, index) => {
          const selected = slide.slideId === activeSlideId;
          return (
            <article key={slide.slideId} className={selected ? "selected" : ""}>
              <button type="button" className="slide-selector" aria-pressed={selected} onClick={() => onActiveSlide(slide.slideId)}>
                <span>{slide.slideId}</span><strong>{roleLabel(slide.role, language)}</strong>{!selected && <em>{slide.title}</em>}<EvidenceBadge state={slide.evidenceState} copy={t} />
              </button>
              {selected && <div className="story-fields">
                <label><span>{language === "zh" ? "页面标题" : "Slide title"}</span><input value={slide.title} onChange={(event) => onUpdateSlide(slide.slideId, { title: event.target.value, status: "needs-review" })} /></label>
                <label><span>{language === "zh" ? "一句话结论" : "One-line takeaway"}</span><textarea value={slide.takeaway} onChange={(event) => onUpdateSlide(slide.slideId, { takeaway: event.target.value, status: "needs-review" })} /></label>
                <div className="variant-strip" role="radiogroup" aria-label={`${slide.slideId} ${language === "zh" ? "结构方案" : "layout variants"}`}>
                  {slide.variants.map((variant, variantIndex) => {
                    const selectedVariant = slide.selectedVariantId === variant.id;
                    const selectVariant = (nextIndex: number) => onUpdateSlide(slide.slideId, { selectedVariantId: slide.variants[nextIndex].id, status: "needs-review" });
                    return <button key={variant.id} type="button" role="radio" aria-checked={selectedVariant} tabIndex={selectedVariant ? 0 : -1} className={selectedVariant ? "selected" : ""} onClick={() => selectVariant(variantIndex)} onKeyDown={(event) => handleRadioKeyDown(event, variantIndex, slide.variants.length, selectVariant)}><span>{variant.label}</span><small>{variant.layoutFamily}</small></button>;
                  })}
                </div>
              </div>}
              <span className="story-index">{String(index + 1).padStart(2, "0")}</span>
            </article>
          );
        })}
        <button className="primary-button storyboard-continue" data-primary-action="true" onClick={onContinue}><Palette size={19} />{t.next}<ArrowRight size={18} /></button>
      </section>
    </div>
  );
}

function GeneratingPhase({ language, session, directions, bridge, isSending, onSelectDirection, onGenerate, onCopyBridgeCommand, copy: t }: {
  language: Language;
  session: DeckSession;
  directions: ReturnType<typeof recommendedDirections>;
  bridge: BridgeHealth | null;
  isSending: boolean;
  onSelectDirection: (id: string) => void;
  onGenerate: () => void;
  onCopyBridgeCommand: () => void;
  copy: typeof copy;
}) {
  const codexCanLaunch = Boolean(bridge?.allowLaunch && bridge.agents.some((agent) => agent.id === "codex" && agent.available));
  const runtimeState: RuntimeState = !bridge ? "bridge-offline" : isSending ? "generating" : codexCanLaunch ? "agent-launchable" : "bridge-no-agent";
  return (
    <div className="direction-stage">
      <div className="direction-grid" role="radiogroup" aria-label={language === "zh" ? "视觉方向" : "Visual direction"}>
        {directions.map((direction, index) => {
          const selected = session.selectedDirectionId === direction.id;
          return (
          <button key={direction.id} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} className={`direction-card ${direction.tone} ${selected ? "selected" : ""}`} onClick={() => onSelectDirection(direction.id)} onKeyDown={(event) => handleRadioKeyDown(event, index, directions.length, (nextIndex) => onSelectDirection(directions[nextIndex].id))}>
            <DirectionPreview direction={direction} index={index} />
            <span className="direction-copy"><strong>{language === "zh" ? direction.labelZh : direction.labelEn}</strong><p>{language === "zh" ? direction.fitZh : direction.fitEn}</p><small>{direction.coverLayout} · {direction.bodyLayout} · {direction.dataLayout}</small></span>
            <span className="direction-check"><Check size={16} /></span>
          </button>
          );
        })}
      </div>
      <aside className="generation-dock">
        <div><Sparkles size={20} /><span><strong>{language === "zh" ? "先结构、后精修" : "Structure first, polish second"}</strong><p>{language === "zh" ? "先创建可点击结构稿；正式制作只对选中或审计失败的页面执行高成本精修。" : "Create a clickable structural draft first; reserve high-cost refinement for selected or flagged slides."}</p></span></div>
        <div className="generation-summary">
          <span><FileText size={17} />{session.slides.length} {language === "zh" ? "页故事板" : "slides"}</span>
          <span><Palette size={17} />{visualDirectionCatalog.find((item) => item.id === session.selectedDirectionId)?.[language === "zh" ? "labelZh" : "labelEn"]}</span>
          <span><Server size={17} />{bridge ? t.connected : t.disconnected}</span>
        </div>
        {!bridge
          ? <button className="primary-button generation-action" data-primary-action="true" data-runtime-state={runtimeState} onClick={onCopyBridgeCommand}><Clipboard size={19} />{t.repairBridge}</button>
          : <button className="primary-button generation-action" data-primary-action="true" data-runtime-state={runtimeState} disabled={isSending} onClick={onGenerate}>{isSending ? <RefreshCw className="spin" size={19} /> : <Play size={19} />}{isSending ? t.generating : (codexCanLaunch ? t.generateAndLaunch : t.generate)}</button>}
        {session.progress.message && session.progress.percent > 0 && <div className="generation-progress"><div><span style={{ width: `${session.progress.percent}%` }} /></div><p>{session.progress.message}</p></div>}
      </aside>
    </div>
  );
}

function ReviewPhase({ language, session, activeSlide, previewHtml, handoff, artifacts, artifactsChecking, agentLaunch, agentStatus, bridge, onActiveSlide, onApprove, onRotate, onDownloadPreview, onLaunchAgent, onCopyBridgeCommand, onRefreshArtifacts, onRefreshRuntime, onRestartProject, onDelivered, copy: t }: {
  language: Language;
  session: DeckSession;
  activeSlide: DeckSlide;
  previewHtml: string;
  handoff: HandoffResult | null;
  artifacts: ProjectArtifact[];
  artifactsChecking: boolean;
  agentLaunch: AgentLaunchResult | null;
  agentStatus: AgentStatusResult | null;
  bridge: BridgeHealth | null;
  onActiveSlide: (id: string) => void;
  onApprove: (id: string) => void;
  onRotate: (slide: DeckSlide) => void;
  onDownloadPreview: () => void;
  onLaunchAgent: () => void;
  onCopyBridgeCommand: () => void;
  onRefreshArtifacts: () => void;
  onRefreshRuntime: () => void;
  onRestartProject: () => void;
  onDelivered: () => void;
  copy: typeof copy;
}) {
  const hasRealSources = session.sources.some((source) => source.status === "ready");
  const projectPath = handoff?.projectPath || session.projectPath;
  const preferredArtifact = (kind: ArtifactKind) => artifacts
    .filter((artifact) => artifact.kind === kind)
    .sort((left, right) => Number(right.verification === "passed") - Number(left.verification === "passed") || Date.parse(right.modifiedAt) - Date.parse(left.modifiedAt))[0];
  const pptxArtifact = preferredArtifact("pptx");
  const webArtifact = preferredArtifact("web-deck");
  const requiredKinds: ArtifactKind[] = session.outputPurpose === "editable-pptx" ? ["pptx"] : session.outputPurpose === "web-deck" ? ["web-deck"] : ["pptx", "web-deck"];
  const requiredArtifactsPassed = requiredKinds.every((kind) => artifacts.some((artifact) => artifact.kind === kind && artifact.verification === "passed"));
  const allSlidesApproved = session.slides.every((slide) => slide.status === "approved");
  const canDeliver = Boolean(bridge && projectPath && requiredArtifactsPassed && allSlidesApproved);
  const hasBlockedArtifact = artifacts.some((artifact) => artifact.verification === "blocked");
  const hasWarningArtifact = artifacts.some((artifact) => artifact.verification === "warning");
  const codexCanLaunch = Boolean(bridge?.allowLaunch && bridge.agents.some((agent) => agent.id === "codex" && agent.available));
  const agentIsRunning = agentStatus
    ? agentStatus.status === "accepted" || agentStatus.status === "running"
    : Boolean(agentLaunch?.launched);
  const agentFailed = agentStatus?.status === "failed";
  const agentCompletedWithoutPassedArtifacts = agentStatus?.status === "completed" && !requiredArtifactsPassed;
  const needsQualityReview = hasBlockedArtifact || agentFailed || (!agentIsRunning && (hasWarningArtifact || agentCompletedWithoutPassedArtifacts));
  const runtimeState: RuntimeState = !bridge
    ? "bridge-offline"
    : requiredArtifactsPassed
      ? "artifact-complete"
      : needsQualityReview
        ? "quality-blocked"
        : agentIsRunning
          ? "generating"
          : codexCanLaunch
            ? "agent-launchable"
            : "bridge-no-agent";
  const primaryArtifact = session.outputPurpose === "web-deck" ? webArtifact : pptxArtifact || webArtifact;
  const [commandCopyState, setCommandCopyState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => setCommandCopyState("idle"), [agentLaunch?.command]);
  async function copyPreparedCommand() {
    if (!agentLaunch?.command) return;
    try {
      await navigator.clipboard.writeText(agentLaunch.command);
      setCommandCopyState("copied");
    } catch {
      setCommandCopyState("failed");
    }
  }
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
        <div className="structural-preview-label"><LayoutPanelLeft size={15} />{t.structuralPreview}</div>
        <iframe title={language === "zh" ? "结构预览" : "Structural preview"} srcDoc={previewHtml} sandbox="" />
        <div className="canvas-meta"><span>{activeSlide.slideId}</span><strong>{activeSlide.title}</strong><small>{activeSlide.variants.find((variant) => variant.id === activeSlide.selectedVariantId)?.layoutFamily}</small></div>
      </section>
      <aside className="review-inspector">
        <div className="inspector-heading"><Gauge size={19} /><span><strong>{t.visualQuality}</strong><small>{session.projectPath ? t.projectReady : t.waitingArtifact}</small></span></div>
        <QualityRow label={language === "zh" ? "结论层级" : "Takeaway hierarchy"} status={activeSlide.takeaway.length >= 12 ? "ok" : "warning"} />
        <QualityRow label={language === "zh" ? "证据绑定" : "Evidence binding"} status={activeSlide.evidenceState === "grounded" ? "ok" : "warning"} />
        <QualityRow label={language === "zh" ? "可编辑边界" : "Editability"} status={session.outputPurpose === "web-deck" || artifacts.some((artifact) => artifact.kind === "pptx" && artifact.verification === "passed") ? "ok" : "warning"} />
        <QualityRow label={language === "zh" ? "视觉方向" : "Visual direction"} status={session.selectedDirectionId ? "ok" : "warning"} />
        <div className="inspector-actions">
          <button onClick={() => onApprove(activeSlide.slideId)}><CheckCircle2 size={17} />{t.approveSlide}</button>
          <button disabled={Boolean(projectPath && !bridge)} onClick={() => onRotate(activeSlide)}><RefreshCw size={17} />{t.regenerateSlide}</button>
        </div>
        {agentStatus && agentStatus.status !== "idle" && <div className={`agent-runtime-status ${agentStatus.status}`} role={agentFailed ? "alert" : "status"}>
          {agentFailed ? <AlertCircle size={17} /> : agentStatus.status === "completed" ? <CheckCircle2 size={17} /> : <RefreshCw className={agentIsRunning ? "spin" : ""} size={17} />}
          <span>
            <strong>{agentStatusLabel(agentStatus.status)}</strong>
            <small>{agentStatus.job?.message || "正在同步本地 Agent 状态。"}</small>
          </span>
        </div>}
        <div className="delivery-actions">
          {bridge
            ? <button
              data-primary-action={runtimeState === "agent-launchable" || (runtimeState === "bridge-no-agent" && !agentLaunch?.command) || runtimeState === "generating" ? "true" : undefined}
              data-runtime-state={runtimeState}
              disabled={!projectPath || agentIsRunning || Boolean(agentLaunch?.command)}
              title={!projectPath ? t.waitingArtifact : undefined}
              onClick={onLaunchAgent}
            ><ExternalLink size={18} />{agentIsRunning ? t.agentLaunched : agentLaunch?.command ? t.agentCommandReady : codexCanLaunch ? t.openPowerPoint : t.copyAgent}</button>
            : <button data-primary-action={runtimeState === "bridge-offline" ? "true" : undefined} data-runtime-state={runtimeState} onClick={onCopyBridgeCommand}><Clipboard size={18} />{t.repairBridge}</button>}
          {pptxArtifact && projectPath && bridge
            ? <a data-primary-action={runtimeState === "artifact-complete" && primaryArtifact?.relativePath === pptxArtifact.relativePath ? "true" : undefined} data-runtime-state={runtimeState} href={artifactDownloadUrl(projectPath, pptxArtifact.relativePath)}><Download size={18} />{t.downloadPptx}</a>
            : <button disabled title={t.waitingArtifact}><Download size={18} />{t.downloadPptx}</button>}
          {webArtifact && projectPath && bridge
            ? <a data-primary-action={runtimeState === "artifact-complete" && primaryArtifact?.relativePath === webArtifact.relativePath ? "true" : undefined} data-runtime-state={runtimeState} href={artifactDownloadUrl(projectPath, webArtifact.relativePath)}><MonitorPlay size={18} />{t.shareWeb}</a>
            : <button onClick={onDownloadPreview}><MonitorPlay size={18} />{t.downloadPreview}</button>}
        </div>
        {agentLaunch?.command && !agentLaunch.launched && <section className="agent-command-panel" aria-labelledby="agent-command-title">
          <header><strong id="agent-command-title">手动启动 Codex</strong><span>命令始终可见，可手动选择</span></header>
          <textarea readOnly value={agentLaunch.command} aria-label="Codex 启动命令" onFocus={(event) => event.currentTarget.select()} />
          <button type="button" data-primary-action={runtimeState === "bridge-no-agent" ? "true" : undefined} data-runtime-state={runtimeState} onClick={() => void copyPreparedCommand()}><Clipboard size={16} />复制命令</button>
          <small className={commandCopyState} aria-live="polite">{commandCopyState === "copied"
            ? "已复制，可以粘贴到终端。"
            : commandCopyState === "failed"
              ? "浏览器未允许复制，请在上方手动选择命令。"
              : "如果浏览器拦截剪贴板，仍可直接选择上方完整命令。"}</small>
        </section>}
        {projectPath && <div className="handoff-ready"><FolderOpen size={18} /><span><strong>{t.projectReady}</strong><code>{projectPath}</code></span></div>}
        <section className="artifact-panel" aria-labelledby="artifact-panel-title">
          <header><strong id="artifact-panel-title">{t.artifactTitle}</strong><button onClick={onRefreshArtifacts} disabled={!projectPath || artifactsChecking} aria-label={t.refresh}><RefreshCw className={artifactsChecking ? "spin" : ""} size={15} /></button></header>
          {artifacts.length === 0
            ? <p>{t.artifactEmpty}</p>
            : <ul>{artifacts.map((artifact) => (
              <li key={artifact.relativePath}>
                <span><FileText size={16} /><strong>{artifact.name}</strong><small>{formatBytes(artifact.size)}</small></span>
                {projectPath && bridge
                  ? <a className={`artifact-status ${artifact.verification}`} href={artifactDownloadUrl(projectPath, artifact.relativePath)} aria-label={`${artifact.name} · ${artifactVerificationLabel(artifact.verification, language)}`}>
                    {artifactVerificationLabel(artifact.verification, language)}<Download size={14} />
                  </a>
                  : <span className={`artifact-status ${artifact.verification}`} aria-label={`${artifact.name} · ${artifactVerificationLabel(artifact.verification, language)} · ${t.disconnected}`}>
                    {artifactVerificationLabel(artifact.verification, language)}<Download size={14} />
                  </span>}
              </li>
            ))}</ul>}
        </section>
        {needsQualityReview && bridge && <button className="blocked-artifact-action" data-primary-action="true" data-runtime-state={runtimeState} onClick={agentFailed ? onRestartProject : onRefreshRuntime}><AlertCircle size={17} />{
          agentFailed
            ? "Agent 未完成，返回重新创建项目"
            : hasBlockedArtifact
              ? "查看阻断原因并重新检查"
              : hasWarningArtifact
                ? "查看质量提醒并重新检查"
                : "Agent 已结束，重新检查产物"
        }</button>}
        {!canDeliver && projectPath && <p className="delivery-gate-note"><ShieldCheck size={15} />{t.passedArtifactRequired}</p>}
        {session.phase === "delivered" && canDeliver
          ? <div className="delivered-summary"><CheckCircle2 size={18} /><span><strong>已完成交付</strong><small>必要成品已通过，且所有页面已确认。</small></span></div>
          : session.phase === "delivered"
            ? <div className="delivered-summary pending"><AlertCircle size={18} /><span><strong>交付状态待重新确认</strong><small>正在恢复成品状态；若质量结果已变更，请返回精修处理。</small></span></div>
            : canDeliver && <button className="delivered-button" onClick={onDelivered}><ShieldCheck size={18} />标记为已交付</button>}
      </aside>
    </div>
  );
}

function DiagnosticsDialog({ language, bridge, checking, onClose, onRefresh, onCopyCommand, returnFocusRef, copy: t }: {
  language: Language;
  bridge: BridgeHealth | null;
  checking: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onCopyCommand: () => void;
  returnFocusRef: RefObject<HTMLButtonElement>;
  copy: typeof copy;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
    // The dialog is mounted only while open, so this lifecycle intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="diagnostics-dialog" role="dialog" aria-modal="true" aria-labelledby="diagnostics-title" tabIndex={-1} ref={dialogRef}>
        <header><div><p>LOCAL ENVIRONMENT</p><h2 id="diagnostics-title">{t.diagnostics}</h2></div><button aria-label={language === "zh" ? "关闭" : "Close"} onClick={onClose}><X size={19} /></button></header>
        <section className={`diagnostic-status ${bridge ? "online" : "offline"}`}><span>{bridge ? <CheckCircle2 size={21} /> : <AlertCircle size={21} />}</span><div><strong>{bridge ? t.connected : t.disconnected}</strong><p>{bridge ? `${bridge.outputDir} · v${bridge.version}` : (language === "zh" ? "启动 Bridge 后，网页才能解析本地文件并写入项目包。" : "Start Bridge to parse local files and write project handoffs.")}</p></div></section>
        <section><h3><Server size={18} />{t.bridgeCommand}</h3><code>{bridgeCommandFor(bridge)}</code><div className="diagnostic-actions"><button onClick={onCopyCommand}><Clipboard size={16} />{t.repairBridge}</button><button onClick={onRefresh} disabled={checking}><RefreshCw className={checking ? "spin" : ""} size={16} />{t.refresh}</button></div></section>
        <section><h3><Gauge size={18} />{t.providerStatus}</h3><div className="provider-list">{bridge?.providers?.map((provider) => <span key={provider.id} className={provider.configured ? "configured" : "missing"}><i />{provider.label}<small>{provider.configured ? (language === "zh" ? "已配置" : "Configured") : (language === "zh" ? "未配置" : "Missing")}</small></span>) || <p>{language === "zh" ? "连接后显示 Provider 状态。" : "Provider status appears after connection."}</p>}</div></section>
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

function EvidenceBadge({ state, copy: t }: { state: DeckSlide["evidenceState"]; copy: typeof copy }) {
  const label =
    state === "grounded" ? t.evidenceGrounded
    : state === "candidate" ? t.evidenceCandidate
    : state === "unmapped" ? t.evidenceUnmapped
    : state === "conflicted" ? t.evidenceConflicted
    : state === "partial" ? t.evidencePartial
    : t.evidenceMissing;
  return <small className={`evidence-badge ${state}`}>{label}</small>;
}

function QualityRow({ label, status }: { label: string; status: "ok" | "warning" }) {
  return <div className={`quality-row ${status}`}>{status === "ok" ? <Check size={15} /> : <AlertCircle size={15} />}<span>{label}</span><small>{status === "ok" ? "PASS" : "REVIEW"}</small></div>;
}

function artifactDownloadUrl(projectPath: string, relativePath: string) {
  const query = new URLSearchParams({ projectPath, artifact: relativePath });
  return `${bridgeUrl}/projects/artifacts/file?${query}`;
}

function artifactVerificationLabel(status: ArtifactVerification, language: Language) {
  const labels = language === "zh"
    ? { pending: "待复核", passed: "已通过", warning: "有提醒", blocked: "已阻断" }
    : { pending: "Pending", passed: "Passed", warning: "Warning", blocked: "Blocked" };
  return labels[status];
}

function agentStatusLabel(status: AgentStatusResult["status"]) {
  return { idle: "Agent 尚未启动", accepted: "Agent 启动请求已接收", running: "Agent 正在制作", completed: "Agent 已结束", failed: "Agent 未能完成" }[status];
}

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size < 1024) return `${Math.max(0, size || 0)} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function phaseTitle(phase: DeckPhase, t: typeof copy) {
  return phase === "intake" ? t.intakeTitle : phase === "outline" ? t.outlineTitle : phase === "generating" ? t.designTitle : t.reviewTitle;
}

function phaseLead(phase: DeckPhase, t: typeof copy) {
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
  if (!sources.some(sourceHasVerifiedText)) questions.push("哪些资料是事实边界，哪些内容明确不能补写？");
  return questions.slice(0, 3);
}

function sourceId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  const unique = globalThis.crypto?.randomUUID?.().slice(0, 8) || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `source-${Math.abs(hash).toString(36)}-${unique}`;
}

function sourceHasVerifiedText(source: ImportedSource) {
  if (source.status !== "ready") return false;
  return typeof source.text === "string" ? source.text.trim().length > 0 : true;
}

function reconcileSourcesAfterHandoff(sources: ImportedSource[], result: HandoffResult) {
  const verifiedIds = new Set((result.manifest?.evidenceSources || [])
    .filter((source) => source.verified && source.id)
    .map((source) => source.id as string));
  const stagedIds = new Set((result.manifest?.attachments || [])
    .map((source) => source.id)
    .filter((id): id is string => Boolean(id)));
  return sources.map((source) => {
    if (verifiedIds.has(source.id)) {
      return {
        ...source,
        status: "ready" as const,
        recoverability: source.kind === "url"
          ? "url" as const
          : source.text || source.dataBase64
            ? "resident" as const
            : "bridge-project" as const
      };
    }
    if (stagedIds.has(source.id) && source.status !== "ready") {
      return { ...source, status: "local-parse" as const };
    }
    return source;
  });
}

function reconcileSlideEvidenceAfterHandoff(slides: DeckSlide[], result: HandoffResult) {
  const evidenceBySlide = new Map((result.storyboard?.slides || [])
    .filter((slide) => slide.slideId)
    .map((slide) => [String(slide.slideId), slide]));
  return slides.map((slide) => {
    const reconciled = evidenceBySlide.get(slide.slideId);
    if (!reconciled) return slide;
    return {
      ...slide,
      evidenceState: reconciled.evidenceState || slide.evidenceState,
      evidenceRefs: Array.isArray(reconciled.evidenceRefs) ? reconciled.evidenceRefs : slide.evidenceRefs
    };
  });
}

function validDirectionId(request: string, outputPurpose: OutputPurpose, selectedDirectionId: string) {
  const choices = recommendedDirections({ request, outputPurpose });
  return choices.some((direction) => direction.id === selectedDirectionId) ? selectedDirectionId : choices[0]?.id || selectedDirectionId;
}

function restoreImportedSources(summaries: DeckSourceSummary[], preserveBridgeProject = false): ImportedSource[] {
  return summaries.map((source) => {
    if (source.kind === "url") {
      return {
        ...source,
        status: preserveBridgeProject ? source.status : "local-parse",
        url: source.name,
        recoverability: "url"
      };
    }
    if (preserveBridgeProject && source.status === "ready") {
      return { ...source, status: "ready", recoverability: "bridge-project" };
    }
    return { ...source, status: "missing", recoverability: "needs-reselect" };
  });
}

function sourceStatusLabel(source: ImportedSource, language: Language) {
  if (source.status === "ready" && source.recoverability === "bridge-project") return language === "zh" ? "已由本机项目解析" : "Parsed in local project";
  if (source.status === "ready") return language === "zh" ? "可直接读取" : "Ready";
  if (source.status === "missing") return language === "zh" ? "需重新选择" : "Select again";
  if (source.kind === "url") return language === "zh" ? "等待本机解析" : "Waiting for local parsing";
  return language === "zh" ? "由本机解析" : "Parsed locally";
}

function handleRadioKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number, count: number, onSelectIndex: (index: number) => void) {
  if (!count) return;
  let nextIndex = index;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % count;
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + count) % count;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = count - 1;
  else return;
  event.preventDefault();
  onSelectIndex(nextIndex);
  const radios = event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]');
  window.requestAnimationFrame(() => radios?.[nextIndex]?.focus());
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
    let raw = window.sessionStorage.getItem(sessionStorageKey);
    if (!raw) {
      raw = window.localStorage.getItem(legacyLocalStorageKey);
      if (raw) {
        window.sessionStorage.setItem(sessionStorageKey, raw);
        window.localStorage.removeItem(legacyLocalStorageKey);
      }
    }
    if (!raw) return createDeckSession();
    const parsed = JSON.parse(raw) as DeckSession;
    if (parsed.schemaVersion !== "deck-session-v6") return createDeckSession();
    const preserveProjectReview = Boolean(parsed.projectPath) && (parsed.phase === "review" || parsed.phase === "delivered");
    const restoredSources = preserveProjectReview
      ? parsed.sources
      : parsed.sources.map((source) => ({ ...source, status: source.kind === "url" ? "local-parse" as const : "missing" as const }));
    const hasDeferredSource = restoredSources.some((source) => source.status === "local-parse");
    const restoredSlides = parsed.slides.map((slide) => ({
      ...slide,
      evidenceState: preserveProjectReview ? slide.evidenceState : hasDeferredSource ? "unmapped" as const : "missing" as const,
      evidenceRefs: preserveProjectReview ? slide.evidenceRefs : [],
      status: preserveProjectReview ? slide.status : slide.status === "approved" ? "needs-review" as const : slide.status
    }));
    return createDeckSession({ ...parsed, sources: restoredSources, slides: restoredSlides, questions: buildFocusedQuestionsFromRestored(parsed, restoredSources) });
  } catch {
    return createDeckSession();
  }
}

function buildFocusedQuestionsFromRestored(session: DeckSession, sources: DeckSourceSummary[]) {
  const questions = [...(session.questions || [])].filter((question) => !/fact boundary|facts boundary|事实边界/i.test(question));
  if (!sources.some((source) => source.status === "ready")) questions.push("刷新后请重新选择本地资料，或让 Bridge 重新解析 URL。");
  return [...new Set(questions)].slice(0, 3);
}

function buildHandoffPayload(session: DeckSession, sources: ImportedSource[], previewWebDeckHtml: string, language: Language) {
  const outputMode = session.outputPurpose === "editable-pptx" ? "pptx" : session.outputPurpose === "web-deck" ? "web" : "both";
  const title = session.request.trim().split(/[。.!?？\n]/)[0].slice(0, 60) || "Ultimate PPT Master v6 project";
  const verifiedSources = sources.filter(sourceHasVerifiedText);
  const hasVerifiedSources = verifiedSources.length > 0;
  const sourceMarkdown = verifiedSources
    .filter((source) => typeof source.text === "string" && source.text.trim().length > 0)
    .map((source) => `## ${source.name}\n\n${source.text}`)
    .join("\n\n");
  const taskContext = {
    request: session.request,
    audience: session.audience,
    coreMessage: session.coreMessage,
    outputPurpose: session.outputPurpose,
    selectedDirectionId: session.selectedDirectionId,
    storyboard: session.slides.map((slide) => ({
      slideId: slide.slideId,
      role: slide.role,
      title: slide.title,
      takeaway: slide.takeaway,
      selectedVariantId: slide.selectedVariantId,
      layoutFamily: slide.variants.find((variant) => variant.id === slide.selectedVariantId)?.layoutFamily || "layout pending"
    }))
  };
  const qualityGate = {
    level: "formal-business",
    requiredInputs: ["source-boundary", "audience", "editable-output-policy"],
    acceptanceCriteria: ["one primary judgment per slide", "traceable evidence", "editable formal body pages", "rendered visual review"],
    artifactChecks: ["editable PPTX objects", "complete Web Deck rendering", "stable slideId"],
    reviewCommands: ["python3 scripts/audit_formal_delivery.py <project_path>", "python3 scripts/audit_design_completion.py <project_path>", "python3 scripts/audit_pptx_native_objects.py <final.pptx> --expect text,shape"]
  };
  const bestEffectBrief = {
    version: "v6.3-best-effect-v1",
    promptQuality: session.routeDecision.promptQuality,
    recommendedRoute: session.routeDecision.recommendedRoute,
    decisionReason: session.routeDecision.decisionReason,
    source: session.routeDecision.source,
    classifierRoute: session.routeDecision.classifierRoute,
    userRequestSummary: session.request,
    autoExpandedBrief: [
      `受众：${session.audience || "待确认"}`,
      `核心信息：${session.coreMessage || "待确认"}`,
      `页数：${session.slides.length}`,
      `视觉方向：${session.selectedDirectionId}`,
      `交付路线：${session.routeDecision.recommendedRoute}`
    ],
    assumptions: hasVerifiedSources
      ? ["仅使用 handoff 中的来源与用户确认的事实边界。"]
      : ["当前没有真实资料；只允许生成结构稿，禁止标记为已验证成品。"]
  };
  const blockedReason = hasVerifiedSources ? "" : "real source required before final production";
  return {
    sessionId: session.sessionId,
    form: {
      title,
      audience: session.audience,
      coreMessage: session.coreMessage,
      sourceNotes: "",
      constraints: "Preserve stable slideId values. Produce a fast structural draft before high-quality refinement.",
      slideCount: String(session.slides.length),
      outputMode,
      stylePreset: session.selectedDirectionId,
      language
    },
    sourceMarkdown,
    taskContext,
    agentPrompt: `Use the Ultimate PPT Master Skill. Read project-brief.json, bestEffectBrief, and deckSession first. Preserve every slideId, title, takeaway, role, order, and selected variant. Generate a structural draft, then refine selected or audit-failed slides.`,
    deckSession: session,
    bestEffectBrief,
    projectBrief: {
      schemaVersion: "v5.2-brief-v1",
      title,
      audience: session.audience,
      coreMessage: session.coreMessage,
      outputMode,
      deckSession: session,
      bestEffectBrief,
      selectedDirectionId: session.selectedDirectionId,
      briefMode: hasVerifiedSources ? "source-first" : "codex-guided-intake",
      expectationFit: {
        riskLevel: hasVerifiedSources ? "yellow" : "red",
        score: sessionReadiness({ ...session, sources: verifiedSources.map(stripImportedSource) }),
        readyForProduction: hasVerifiedSources && session.request.trim().length >= 8,
        missingSignals: hasVerifiedSources ? [] : ["missing real source material"],
        assumptions: ["PPTX body content remains editable", "Technical diagnostics stay outside the primary user flow"]
      },
      qualityGate,
      workflowState: { currentStep: "handoff", blockedReason }
    },
    qualityGate,
    workflowState: { currentStep: "handoff", blockedReason },
    previewWebDeckHtml,
    qualityChecklist: "# v6 Quality Checklist\n\n- [ ] Stable slideId on every page\n- [ ] Evidence gaps are visible\n- [ ] Formal body remains editable\n- [ ] Rendered review completed\n",
    enginePlanMarkdown: `# v6 Engine Plan\n\n1. Deterministic structural draft\n2. User-selected direction: ${session.selectedDirectionId}\n3. High-quality refinement for selected or failed slides\n4. PPTX/Web verification\n`,
    attachments: sources.filter((source) => source.kind === "url" || Boolean(source.dataBase64)).map((source) => ({
      id: source.id,
      name: source.name,
      kind: source.kind,
      type: source.type,
      size: source.size,
      text: source.text,
      dataBase64: source.dataBase64,
      url: source.url
    }))
  };
}

function buildPreviewHtml(session: DeckSession, language: Language, activeSlideId?: string) {
  const direction = visualDirectionCatalog.find((item) => item.id === session.selectedDirectionId) || visualDirectionCatalog[1];
  const slides = session.slides.map((slide, index) => ({ slide, index })).filter(({ slide }) => !activeSlideId || slide.slideId === activeSlideId).map(({ slide, index }) => {
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
    :root{--paper:#f8f8f5;--ink:#111311;--accent:${direction.accent};--muted:#626a70;--display:"IBM Plex Sans","Noto Sans SC","Microsoft YaHei",sans-serif;--body:"Noto Sans SC","Microsoft YaHei",sans-serif;--mono:"IBM Plex Mono",Consolas,monospace;--title:clamp(42px,5vw,72px);--body-size:clamp(20px,1.8vw,29px);--small:clamp(11px,.8vw,14px);--pad-x:5.5vw;--pad-top:5vh;--pad-bottom:4.5vh}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:var(--body);background:var(--paper);color:var(--ink);-webkit-font-smoothing:antialiased}.deck{width:100vw;height:100vh;display:flex;overflow:auto;scroll-snap-type:x mandatory}.slide{position:relative;isolation:isolate;min-width:100vw;height:100vh;padding:var(--pad-top) var(--pad-x) var(--pad-bottom);background:var(--paper);scroll-snap-align:start;display:grid;grid-template-rows:1fr auto auto;gap:3vh;overflow:hidden}.copy{align-self:start;margin-top:10vh;display:grid;gap:2.2vh}.role{margin:0;color:var(--accent);font-size:var(--small);font-weight:600;letter-spacing:.025em}.slide h2{max-width:13ch;margin:0;font-family:var(--display);font-size:var(--title);font-weight:300;line-height:1.08;letter-spacing:-.04em;text-wrap:balance}.takeaway{max-width:34em;margin:0;color:var(--muted);font-size:var(--body-size);line-height:1.58}.index{position:absolute;right:var(--pad-x);top:var(--pad-top);z-index:3;font-family:var(--mono);font-size:var(--small);font-weight:500}.evidence{align-self:end;display:flex;align-items:center;gap:16px;font-size:var(--small);font-weight:500}.evidence i{display:block;width:120px;height:3px;background:var(--accent)}footer{display:flex;justify-content:space-between;align-self:end;padding-top:1.4vh;border-top:1px solid currentColor;color:var(--muted);font-size:var(--small)}.visual-anchor{position:absolute;z-index:-1;pointer-events:none;border-radius:28px}.visual-anchor i{position:absolute;display:block}.role-evidence .copy,.role-comparison .copy{grid-template-columns:5fr 7fr;column-gap:6vw;align-items:start}.role-evidence .copy .role,.role-comparison .copy .role{grid-column:1/-1}.role-evidence .takeaway,.role-comparison .takeaway{padding-top:.7vh}.rhythm-anchor .copy{margin-top:14vh}.rhythm-breathing .copy{margin-top:17vh}.rhythm-dense .copy{margin-top:7vh}

    .direction-formal-finance{--paper:#f7f5f0;--ink:#171714;--muted:#687078;--display:"IBM Plex Sans","Noto Sans SC","Microsoft YaHei",sans-serif}.direction-formal-finance .slide{padding-left:10vw}.direction-formal-finance .slide::before{content:"";position:absolute;left:0;top:0;width:5.5vw;height:100%;background:#dce7f2}.direction-formal-finance .rhythm-anchor{background:#f7f5f0;color:#171714}.direction-formal-finance .rhythm-anchor::before{background:#b44535}.direction-formal-finance .rhythm-anchor .takeaway,.direction-formal-finance .rhythm-anchor footer{color:#687078}.direction-formal-finance .visual-anchor{right:8vw;top:22vh;width:30vw;height:38vh;border:1px solid #d8d2c6;background:#fff;opacity:.72}.direction-formal-finance .visual-anchor i{left:8%;right:8%;height:1px;background:currentColor}.direction-formal-finance .visual-anchor i:nth-child(1){top:25%}.direction-formal-finance .visual-anchor i:nth-child(2){top:50%}.direction-formal-finance .visual-anchor i:nth-child(3){top:75%}

    .direction-consulting-evidence{--paper:#f8f8f5;--ink:#111311;--muted:#626a70}.direction-consulting-evidence .slide::after{content:"";position:absolute;inset:0;z-index:-2;background-image:linear-gradient(rgba(17,19,17,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(17,19,17,.028) 1px,transparent 1px);background-size:8.333vw 8.333vw}.direction-consulting-evidence .rhythm-anchor{background:#f8f8f5;color:#111311}.direction-consulting-evidence .rhythm-anchor .takeaway,.direction-consulting-evidence .rhythm-anchor footer{color:#626a70}.direction-consulting-evidence .visual-anchor{right:7vw;top:25vh;width:28vw;height:30vh;border:1px solid #d5ddd5;border-left:5px solid var(--accent);background:#eef2ed}.direction-consulting-evidence .visual-anchor i{left:2vw;right:2vw;height:1px;background:currentColor;opacity:.22}.direction-consulting-evidence .visual-anchor i:nth-child(1){top:18%}.direction-consulting-evidence .visual-anchor i:nth-child(2){top:50%}.direction-consulting-evidence .visual-anchor i:nth-child(3){top:82%}

    .direction-brand-launch{--paper:#f7f4ed;--ink:#171714;--muted:#6f716b;--display:"Noto Sans SC","Microsoft YaHei",sans-serif}.direction-brand-launch .slide{background:#f7f4ed;color:#171714}.direction-brand-launch .slide:nth-child(3n+2){background:#fffdf8}.direction-brand-launch .slide h2{font-weight:500;max-width:10ch}.direction-brand-launch .visual-anchor{right:7vw;top:15vh;width:34vw;height:58vh;border:1px solid #ded9cf;border-radius:32px;background:#fff;opacity:.88}.direction-brand-launch .visual-anchor i:nth-child(1){left:12%;right:12%;top:54%;height:7px;border-radius:999px;background:var(--accent)}

    .direction-training-narrative{--paper:#f8f5ee;--ink:#18201c;--accent:#356859;--muted:#6a726d;--display:"Noto Serif SC",SimSun,serif}.direction-training-narrative .slide{padding-left:12vw}.direction-training-narrative .slide::before{content:"";position:absolute;left:0;top:0;width:7vw;height:100%;background:#dce9e1}.direction-training-narrative .slide::after{content:attr(data-slide-id);position:absolute;left:1.8vw;top:8vh;color:#356859;font:500 16px var(--mono);writing-mode:vertical-rl}.direction-training-narrative .rhythm-anchor{background:#eef3ed;color:#18201c}.direction-training-narrative .rhythm-anchor::before{background:#d67b55}.direction-training-narrative .rhythm-anchor .takeaway,.direction-training-narrative .rhythm-anchor footer{color:#6a726d}.direction-training-narrative .visual-anchor{right:7vw;top:23vh;width:29vw;height:40vh;border:1px solid #c8d7cc;background:#f8f5ee;opacity:.72}.direction-training-narrative .visual-anchor i{left:8%;right:8%;height:1px;background:currentColor}.direction-training-narrative .visual-anchor i:nth-child(1){top:25%}.direction-training-narrative .visual-anchor i:nth-child(2){top:50%}.direction-training-narrative .visual-anchor i:nth-child(3){top:75%}

    .direction-editorial-narrative{--paper:#faf9f5;--ink:#141413;--accent:#cc785c;--muted:#6c6a64;--display:"Noto Serif SC",SimSun,serif}.direction-editorial-narrative .slide::before{content:"";position:absolute;right:0;top:0;width:22vw;height:100%;z-index:-2;background:rgba(204,120,92,.08)}.direction-editorial-narrative .rhythm-anchor{background:#f5eae4;color:#141413}.direction-editorial-narrative .rhythm-anchor .takeaway,.direction-editorial-narrative .rhythm-anchor footer{color:#6c6a64}.direction-editorial-narrative .slide h2{font-weight:400;max-width:11ch}.direction-editorial-narrative .visual-anchor{right:8vw;top:19vh;width:25vw;height:48vh;border:1px solid currentColor;border-radius:44% 44% 10% 44%;opacity:.22}.direction-editorial-narrative .visual-anchor i:nth-child(1){left:50%;top:-8%;width:1px;height:116%;background:currentColor}

    .direction-swiss-information{--paper:#f7f7f4;--ink:#101210;--accent:#1d4ed8;--muted:#676d68}.direction-swiss-information .slide{border-radius:0}.direction-swiss-information .slide h2{font-weight:300}.direction-swiss-information .rhythm-anchor::before{content:"";position:absolute;right:0;top:0;width:30vw;height:100%;z-index:-2;background:var(--accent)}.direction-swiss-information .visual-anchor{right:7vw;bottom:18vh;width:23vw;height:28vh;border-top:1px solid currentColor}.direction-swiss-information .visual-anchor i{height:1px;background:currentColor;left:0;right:0}.direction-swiss-information .visual-anchor i:nth-child(1){top:30%}.direction-swiss-information .visual-anchor i:nth-child(2){top:60%}.direction-swiss-information .visual-anchor i:nth-child(3){top:90%}

    @media(max-width:680px),(max-height:420px){:root{--title:clamp(22px,7vw,38px);--body-size:12px;--small:8px;--pad-x:6vw;--pad-top:4vh;--pad-bottom:4vh}.slide{gap:1.5vh}.copy,.rhythm-anchor .copy,.rhythm-breathing .copy,.rhythm-dense .copy{margin-top:7vh;gap:1.2vh}.role-evidence .copy,.role-comparison .copy{grid-template-columns:1fr}.slide h2{max-width:15ch}.takeaway{max-width:92%;line-height:1.35}.evidence{gap:8px}.evidence i{width:44px;height:2px}footer{padding-top:.8vh}.visual-anchor{opacity:.08!important}.direction-formal-finance .slide,.direction-training-narrative .slide{padding-left:13vw}.direction-editorial-narrative .slide::before{width:12vw}}
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
