export type DeckPhase = "intake" | "outline" | "generating" | "review" | "delivered";
export type OutputPurpose = "editable-pptx" | "web-deck" | "dual-delivery";
export type EvidenceState = "grounded" | "partial" | "missing";
export type SlideStatus = "draft" | "ready" | "needs-review" | "approved";

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
    coverLayout: "克制报告封面",
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
    coverLayout: "非对称证据封面",
    bodyLayout: "治理句 / 证据轨",
    dataLayout: "矩阵 / 直接标注"
  },
  {
    id: "brand-launch",
    labelZh: "品牌发布",
    labelEn: "Brand launch",
    fitZh: "产品发布、文旅与活动推介；主视觉承担记忆点，正文保持可编辑。",
    fitEn: "Product launch and destination promotion with memorable visuals and editable content.",
    tone: "signal",
    accent: "#DCE84B",
    coverLayout: "全幅主视觉",
    bodyLayout: "场景硬切 / 单观点",
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

const defaultRoles = ["anchor", "context", "evidence", "comparison", "action", "closing"];

export function stableSlideId(index: number): string {
  return `P${String(index + 1).padStart(2, "0")}`;
}

export function inferSlideCount(request: string, fallback = 6): number {
  const match = String(request).match(/(?:约|大约|around\s*)?(\d{1,2})\s*(?:页|pages?|slides?)/i);
  if (!match) return fallback;
  return Math.max(4, Math.min(24, Number(match[1]) || fallback));
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

export function createDraftSlides(request: string, sourceCount: number, count = 6): DeckSlide[] {
  const requestTitle = request.trim() || "等待输入任务";
  const titles = [
    requestTitle.slice(0, 36),
    "背景与目标",
    "关键事实",
    "方案比较",
    "行动计划",
    "决策与交付"
  ];
  return Array.from({ length: Math.max(4, Math.min(12, count)) }, (_, index) => {
    const slideId = stableSlideId(index);
    const role = defaultRoles[index] || (index === count - 1 ? "closing" : "evidence");
    const variants = slideVariants(role, slideId);
    return {
      slideId,
      page: slideId,
      role,
      title: titles[index] || `证据与判断 ${index}`,
      takeaway: index === 0 ? requestTitle : "生成前确认本页要让受众记住的一句话。",
      evidenceState: sourceCount > 0 ? (index === 0 ? "partial" : "grounded") : "missing",
      evidenceRefs: sourceCount > 0 ? [`S${String(index + 1).padStart(3, "0")}`] : [],
      status: sourceCount > 0 ? "ready" : "draft",
      variants,
      selectedVariantId: variants[0].id
    };
  });
}

export function createDeckSession(seed: Partial<DeckSession> = {}): DeckSession {
  const now = new Date().toISOString();
  const request = seed.request || "";
  const sources = seed.sources || [];
  return {
    schemaVersion: "deck-session-v6",
    sessionId: seed.sessionId || `deck-${Date.now().toString(36)}`,
    phase: seed.phase || "intake",
    request,
    audience: seed.audience || "",
    coreMessage: seed.coreMessage || "",
    outputPurpose: seed.outputPurpose || "editable-pptx",
    sources,
    slides: seed.slides || createDraftSlides(request, sources.length, inferSlideCount(request)),
    questions: seed.questions || buildFocusedQuestions({ request, audience: seed.audience || "", coreMessage: seed.coreMessage || "", sources }),
    selectedDirectionId: seed.selectedDirectionId || "consulting-evidence",
    progress: seed.progress || { percent: 0, message: "等待任务输入" },
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
  if (session.sources.length > 0) score += 30;
  return score;
}

export function buildFocusedQuestions(input: Pick<DeckSession, "request" | "audience" | "coreMessage" | "sources">): string[] {
  const questions: string[] = [];
  if (!input.audience.trim()) questions.push("这份演示最需要说服或帮助谁？");
  if (!input.coreMessage.trim()) questions.push("听众离开时必须记住的一个判断是什么？");
  if (input.sources.length === 0) questions.push("哪些资料是事实边界，哪些内容明确不能补写？");
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
