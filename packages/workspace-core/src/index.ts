export type DeckPhase = "intake" | "outline" | "generating" | "review" | "delivered";
export type OutputPurpose = "editable-pptx" | "web-deck" | "dual-delivery";
export type EvidenceState = "unmapped" | "candidate" | "grounded" | "conflicted" | "missing";
export type SlideStatus = "draft" | "ready" | "needs-review" | "approved";
export type PromptQuality = "complete" | "thin" | "extreme-thin";
export type RecommendedRoute = "formal-editable-pptx" | "guizang-web-fixed-style" | "dual-delivery";
export type ClassifierRoute = RecommendedRoute | "magazine-web-deck" | "staged-questions" | "source-first";

export interface BestEffectRouteDecision {
  promptQuality: PromptQuality;
  recommendedRoute: RecommendedRoute;
  decisionReason: string;
  source: "auto" | "user";
  classifierRoute: ClassifierRoute;
}

export interface DeckSourceSummary {
  id: string;
  name: string;
  kind: "file" | "url" | "text" | "pptx";
  status: "ready" | "local-parse" | "missing";
}

export interface DeckSlideVariant {
  id: string;
  label: string;
  layoutFamily: string;
}

export interface DeckSlide {
  slideId: string;
  page: string;
  role: string;
  title: string;
  takeaway: string;
  evidenceState: EvidenceState;
  evidenceRefs: string[];
  status: SlideStatus;
  variants: DeckSlideVariant[];
  selectedVariantId: string;
}

export interface DeckProgress {
  percent: number;
  message: string;
  currentSlideId?: string;
  recoverable?: boolean;
}

export interface DeckSession {
  schemaVersion: "deck-session-v6";
  sessionId: string;
  phase: DeckPhase;
  request: string;
  audience: string;
  coreMessage: string;
  outputPurpose: OutputPurpose;
  sources: DeckSourceSummary[];
  slides: DeckSlide[];
  questions: string[];
  selectedDirectionId: string;
  progress: DeckProgress;
  routeDecision: BestEffectRouteDecision;
  projectPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisualDirectionPreview {
  id: string;
  labelZh: string;
  labelEn: string;
  fitZh: string;
  fitEn: string;
  tone: "dark" | "paper" | "signal" | "warm";
  accent: string;
  coverLayout: string;
  bodyLayout: string;
  dataLayout: string;
}

export interface BridgeProgressEvent {
  id: string;
  sessionId?: string;
  type: "connected" | "phase" | "artifact" | "finding" | "completed" | "failed";
  phase: DeckPhase;
  message: string;
  progress: number;
  projectPath?: string;
  slideId?: string;
  recoverable?: boolean;
  timestamp: string;
}

export const deckPhases: DeckPhase[] = ["intake", "outline", "generating", "review", "delivered"];

export const visualDirectionCatalog: VisualDirectionPreview[] = [
  {
    id: "formal-finance",
    labelZh: "正式金融",
    labelEn: "Formal finance",
    fitZh: "银行、政务、国企与管理层汇报；证据先行，克制但不呆板。",
    fitEn: "Banking, government, SOE, and executive reporting with restrained evidence-first hierarchy.",
    tone: "paper",
    accent: "#173A63",
    coverLayout: "暖纸圆角报告封面",
    bodyLayout: "管理结论 / 证据栏",
    dataLayout: "原生图表 / 口径"
  },
  {
    id: "consulting-evidence",
    labelZh: "咨询证据",
    labelEn: "Consulting evidence",
    fitZh: "战略、经营复盘与客户方案；结论、证据和行动形成一条阅读路径。",
    fitEn: "Strategy, business review, and client proposals with a conclusion-to-evidence-to-action path.",
    tone: "paper",
    accent: "#1D4ED8",
    coverLayout: "浅色非对称证据封面",
    bodyLayout: "治理句 / 证据轨",
    dataLayout: "矩阵 / 直接标注"
  },
  {
    id: "brand-launch",
    labelZh: "品牌发布",
    labelEn: "Brand launch",
    fitZh: "产品发布、文旅与活动推介；浅色产品舞台承接真实主视觉，深色只在明确选择时出现。",
    fitEn: "Product launch and destination promotion with a light product stage; dark scenes require an explicit choice.",
    tone: "warm",
    accent: "#DCE84B",
    coverLayout: "浅色产品舞台 / 真实主视觉",
    bodyLayout: "圆润场景 / 单观点",
    dataLayout: "窄证据带"
  },
  {
    id: "training-narrative",
    labelZh: "培训叙事",
    labelEn: "Training narrative",
    fitZh: "课程、内训和工作坊；概念、示例、练习与检查点节奏清晰。",
    fitEn: "Training and workshops with concept, example, exercise, and checkpoint pacing.",
    tone: "warm",
    accent: "#356859",
    coverLayout: "课程目录封面",
    bodyLayout: "课程脊柱 / 示例",
    dataLayout: "练习 / 检查点"
  },
  {
    id: "editorial-narrative",
    labelZh: "编辑叙事",
    labelEn: "Editorial narrative",
    fitZh: "观点传播、研究叙事与长篇演讲；用暖纸、故事网格和产品表面建立节奏。",
    fitEn: "Opinion, research, and long-form talks with warm paper, story grids, and product surfaces.",
    tone: "warm",
    accent: "#CC785C",
    coverLayout: "编辑故事封面",
    bodyLayout: "不等宽跨栏 / 旁注",
    dataLayout: "文章式证据"
  },
  {
    id: "swiss-information",
    labelZh: "瑞士信息设计",
    labelEn: "Swiss information",
    fitZh: "产品、工程、KPI 与方法论；严格网格、信息秩序和高对比标记。",
    fitEn: "Product, engineering, KPI, and methodology stories with a strict information grid.",
    tone: "signal",
    accent: "#1D4ED8",
    coverLayout: "编号信息封面",
    bodyLayout: "基线 / 越界证据",
    dataLayout: "KPI 塔 / 直接标签"
  }
];

export const phaseLabels = {
  zh: {
    intake: "输入",
    outline: "故事板",
    generating: "设计与生成",
    review: "精修",
    delivered: "交付"
  },
  en: {
    intake: "Intake",
    outline: "Storyboard",
    generating: "Design & generate",
    review: "Refine",
    delivered: "Deliver"
  }
} as const;

const FORMAL_RE = /(\.pptx\b|pptx\b|powerpoint|可编辑|汇报|报告|政府|金融|培训|审计|咨询|consulting|business report|quarterly business review|qbr|board deck|editable|revise|stakeholder|training|government|finance|audit)/i;
const WEB_RE = /(网页\s*ppt|web\s*(deck|ppt|slides?)|html|横滑|浏览器|browser|magazine|杂志|editorial|e-?ink|电子墨水|swiss|瑞士|keynote|showcase|demo[- ]?day)/i;
const TOPIC_WRAPPER_RE = /^(帮我|请|please)?\s*(做|制作|生成|make|create|build)?\s*(一个|一份|a|an)?\s*(关于|about)?\s*([\w\u4e00-\u9fff .-]+?)\s*(的)?\s*(ppt|deck|slides?|presentation|幻灯片)?\s*$/i;
const BEST_EFFECT_SIGNALS = [
  /(面向|给|受众|audience|for\s+(the\s+)?(?:[\w-]+\s+){0,3}(team|customer|client|investor|board|students|executives?)|老板|投资人)/i,
  /(场景|会议|路演|发布会|复盘|workshop|meeting|offsite|launch|review|demo)/i,
  /(根据|基于|附件|文件|pdf|excel|数据|source|attached|attachment|dataset|transcript)/i,
  /(\d+\s*(页|p|slides?|pages?)|page count|页数)/i,
  /(风格|视觉|品牌|配色|style|tone|theme|density|monocle|科技感)/i,
  /(核心|结论|主张|takeaway|message|objective|goal|目标|必须包含)/i
];

interface ScenarioProfile {
  id: "executive-review" | "consulting-proposal" | "product-launch" | "general";
  titles: string[];
  middleRoles: string[];
}

const scenarioProfiles: Record<ScenarioProfile["id"], ScenarioProfile> = {
  "executive-review": {
    id: "executive-review",
    titles: ["经营复盘与决策议题", "本期结论摘要", "核心指标与目标差距", "业绩变化来自哪里", "关键驱动因素", "风险与机会窗口", "优先级与取舍", "行动计划与责任人", "需要管理层决定的事"],
    middleRoles: ["context", "evidence", "comparison", "evidence", "comparison", "action", "evidence", "action"]
  },
  "consulting-proposal": {
    id: "consulting-proposal",
    titles: ["项目建议与核心主张", "客户现状与目标", "问题诊断", "关键洞察与证据", "方案选择与取舍", "推荐解决方案", "价值与影响", "实施路径与治理", "决策请求与下一步"],
    middleRoles: ["context", "comparison", "evidence", "comparison", "action", "evidence", "action", "context"]
  },
  "product-launch": {
    id: "product-launch",
    titles: ["产品发布：一句话价值", "用户正在经历的问题", "产品带来的核心改变", "关键能力与差异", "真实场景与证据", "使用路径", "发布范围与节奏", "采用计划与下一步", "让变化从今天开始"],
    middleRoles: ["context", "evidence", "comparison", "evidence", "action", "context", "comparison", "action"]
  },
  general: {
    id: "general",
    titles: ["主题与核心判断", "背景与目标", "关键事实", "方案比较", "影响与证据", "行动路径", "风险与边界", "下一步", "决策与交付"],
    middleRoles: ["context", "evidence", "comparison", "evidence", "action", "comparison", "context", "action"]
  }
};

export function stableSlideId(index: number): string {
  return `P${String(index + 1).padStart(2, "0")}`;
}

export function inferSlideCount(request: string, fallback = 6): number {
  const match = String(request).match(/(?:约|大约|around\s*)?(\d{1,2})\s*(?:页|pages?|slides?)/i);
  if (!match) return fallback;
  return Math.max(4, Math.min(24, Number(match[1]) || fallback));
}

function bestEffectPromptQuality(request: string): PromptQuality {
  const text = request.trim();
  const signalCount = BEST_EFFECT_SIGNALS.filter((pattern) => pattern.test(text)).length;
  const topicOnly = TOPIC_WRAPPER_RE.test(text) && signalCount === 0;
  const compactLength = text.replace(/\s+/g, "").length;
  if (topicOnly || (compactLength <= 25 && signalCount === 0)) return "extreme-thin";
  if (BEST_EFFECT_SIGNALS[2].test(text) && signalCount >= 3) return "complete";
  if (signalCount >= 1) return "thin";
  return "extreme-thin";
}

export function classifyDeckRequest(request: string): Pick<BestEffectRouteDecision, "promptQuality" | "classifierRoute" | "decisionReason"> {
  const promptQuality = bestEffectPromptQuality(request);
  if (FORMAL_RE.test(request)) {
    return { promptQuality, classifierRoute: "formal-editable-pptx", decisionReason: "explicit-formal-signal" };
  }
  if (WEB_RE.test(request)) {
    return { promptQuality, classifierRoute: "magazine-web-deck", decisionReason: "explicit-web-signal" };
  }
  if (promptQuality === "extreme-thin") {
    return { promptQuality, classifierRoute: "guizang-web-fixed-style", decisionReason: "extreme-thin-fallback" };
  }
  if (promptQuality === "thin") {
    return { promptQuality, classifierRoute: "staged-questions", decisionReason: "thin-guided-intake" };
  }
  return { promptQuality, classifierRoute: "source-first", decisionReason: "complete-source-first" };
}

export function routeDecisionFor(request: string, outputPurpose: OutputPurpose, source: "auto" | "user" = "auto"): BestEffectRouteDecision {
  const classified = classifyDeckRequest(request);
  let recommendedRoute: RecommendedRoute;
  if (source === "user") {
    recommendedRoute = outputPurpose === "dual-delivery"
      ? "dual-delivery"
      : outputPurpose === "web-deck"
        ? "guizang-web-fixed-style"
        : "formal-editable-pptx";
  } else if (classified.classifierRoute === "formal-editable-pptx") {
    recommendedRoute = "formal-editable-pptx";
  } else if (classified.classifierRoute === "magazine-web-deck" || classified.classifierRoute === "guizang-web-fixed-style") {
    recommendedRoute = "guizang-web-fixed-style";
  } else {
    recommendedRoute = outputPurpose === "dual-delivery"
      ? "dual-delivery"
      : outputPurpose === "web-deck"
        ? "guizang-web-fixed-style"
        : "formal-editable-pptx";
  }
  return { ...classified, recommendedRoute, source };
}

export function scenarioProfileFor(request: string): ScenarioProfile {
  const text = request.toLowerCase();
  if (/(产品发布|新品|产品介绍|product\s*launch|launch\s*deck)/i.test(text)) return scenarioProfiles["product-launch"];
  if (/(咨询|建议书|解决方案|客户方案|consulting|proposal)/i.test(text)) return scenarioProfiles["consulting-proposal"];
  if (/(经营复盘|季度复盘|年度复盘|经营汇报|qbr|business\s*review|operating\s*review|executive\s*review)/i.test(text)) return scenarioProfiles["executive-review"];
  return scenarioProfiles.general;
}

function slideVariants(role: string, slideId: string): DeckSlideVariant[] {
  const layouts: Record<string, string[]> = {
    anchor: ["cover.hero-left-visual", "cover.editorial-folio", "cover.image-stage"],
    context: ["section.hero-light", "context.vertical-timeline", "story.text-image-7-5"],
    evidence: ["evidence.native-chart", "evidence.image-proof-grid", "evidence.source-ledger"],
    comparison: ["comparison.two-column-delta", "comparison.before-after-axis", "comparison.decision-matrix"],
    action: ["action.owner-roadmap", "action.horizontal-timeline", "action.system-map"],
    closing: ["closing.commitment-tail", "closing.decision-ask", "closing.editorial-colophon"]
  };
  return (layouts[role] || layouts.evidence).map((layoutFamily, index) => ({
    id: `${slideId}-V${index + 1}`,
    label: `方案 ${index + 1}`,
    layoutFamily
  }));
}

export function createDraftSlides(request: string, sourceInput: number | string[], count = 6): DeckSlide[] {
  const requestTitle = request.trim() || "等待输入任务";
  const boundedCount = Math.max(4, Math.min(24, count));
  const profile = scenarioProfileFor(request);
  const evidenceSourceIds = Array.isArray(sourceInput)
    ? sourceInput.filter(Boolean)
    : Array.from({ length: Math.max(0, sourceInput) }, (_, index) => `S${String(index + 1).padStart(3, "0")}`);
  const sourceCount = evidenceSourceIds.length;
  return Array.from({ length: boundedCount }, (_, index) => {
    const slideId = stableSlideId(index);
    const isLast = index === boundedCount - 1;
    const role = index === 0 ? "anchor" : isLast ? "closing" : profile.middleRoles[(index - 1) % profile.middleRoles.length];
    const variants = slideVariants(role, slideId);
    const title = index === 0
      ? requestTitle.slice(0, 36)
      : isLast
        ? profile.titles[profile.titles.length - 1]
        : profile.titles[index] || `${profile.titles[(index - 1) % Math.max(1, profile.titles.length - 1)]} · ${String(index + 1).padStart(2, "0")}`;
    return {
      slideId,
      page: slideId,
      role,
      title,
      takeaway: index === 0 ? requestTitle : "生成前确认本页要让受众记住的一句话。",
      // Presence of sources only yields unmapped placeholders. grounded requires claim binding later.
      evidenceState: sourceCount > 0 ? "unmapped" : "missing",
      evidenceRefs: sourceCount > 0 ? [evidenceSourceIds[index % sourceCount]] : [],
      status: "draft",
      variants,
      selectedVariantId: variants[0].id
    };
  });
}

export function createDeckSession(seed: Partial<DeckSession> = {}): DeckSession {
  const now = new Date().toISOString();
  const request = seed.request || "";
  const sources = seed.sources || [];
  const randomSessionId = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return {
    schemaVersion: "deck-session-v6",
    sessionId: seed.sessionId || `deck-${randomSessionId}`,
    phase: seed.phase || "intake",
    request,
    audience: seed.audience || "",
    coreMessage: seed.coreMessage || "",
    outputPurpose: seed.outputPurpose || "editable-pptx",
    sources,
    slides: seed.slides || createDraftSlides(request, sources.filter((source) => source.status === "ready").map((source) => source.id), inferSlideCount(request)),
    questions: seed.questions || buildFocusedQuestions({ request, audience: seed.audience || "", coreMessage: seed.coreMessage || "", sources }),
    selectedDirectionId: seed.selectedDirectionId || "consulting-evidence",
    progress: seed.progress || { percent: 0, message: "等待任务输入" },
    routeDecision: seed.routeDecision || routeDecisionFor(request, seed.outputPurpose || "editable-pptx"),
    projectPath: seed.projectPath,
    createdAt: seed.createdAt || now,
    updatedAt: seed.updatedAt || now
  };
}

export function sessionReadiness(session: Pick<DeckSession, "request" | "audience" | "coreMessage" | "sources" | "outputPurpose">): number {
  let score = 0;
  if (session.request.trim().length >= 8) score += 30;
  if (session.audience.trim()) score += 15;
  if (session.coreMessage.trim()) score += 15;
  if (session.outputPurpose) score += 10;
  if (session.sources.some((source) => source.status === "ready")) score += 30;
  else if (session.sources.some((source) => source.status === "local-parse")) score += 10;
  return score;
}

export function buildFocusedQuestions(input: Pick<DeckSession, "request" | "audience" | "coreMessage" | "sources">): string[] {
  const questions: string[] = [];
  if (!input.audience.trim()) questions.push("这份演示最需要说服或帮助谁？");
  if (!input.coreMessage.trim()) questions.push("听众离开时必须记住的一个判断是什么？");
  if (!input.sources.some((source) => source.status === "ready")) questions.push("哪些资料是事实边界，哪些内容明确不能补写？");
  return questions.slice(0, 3);
}

export function recommendedDirections(session: Pick<DeckSession, "request" | "outputPurpose">): VisualDirectionPreview[] {
  const text = session.request.toLowerCase();
  const ids = /培训|课程|workshop|training/.test(text)
    ? ["training-narrative", "consulting-evidence", "editorial-narrative"]
    : /产品|发布|文旅|活动|launch|product/.test(text)
      ? ["brand-launch", "swiss-information", "editorial-narrative"]
      : /金融|银行|政务|国企|finance|bank/.test(text)
        ? ["formal-finance", "consulting-evidence", "swiss-information"]
        : session.outputPurpose === "web-deck"
          ? ["editorial-narrative", "swiss-information", "brand-launch"]
          : ["consulting-evidence", "formal-finance", "swiss-information"];
  return ids.map((id) => visualDirectionCatalog.find((item) => item.id === id)!).filter(Boolean);
}

export function nextPhase(phase: DeckPhase): DeckPhase {
  const index = deckPhases.indexOf(phase);
  return deckPhases[Math.min(deckPhases.length - 1, index + 1)];
}

export { generatedPolicy } from "./generated/policy.ts";
export type { EvidenceStateId, QualityModeId, GeneratedPolicy } from "./generated/policy.ts";
