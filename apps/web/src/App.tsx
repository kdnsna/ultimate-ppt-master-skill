import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  FileArchive,
  FileInput,
  FileText,
  FolderOpen,
  Globe2,
  KeyRound,
  Link2,
  MonitorPlay,
  Play,
  PlugZap,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Workflow,
  XCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import JSZip from "jszip";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import {
  getConsoleSteps,
  getPrimaryActionId,
  previewGroupFor,
  previewGroupModes,
  type ConsoleStep,
  type ConsoleStepId,
  type PreviewGroup,
  type PreviewMode,
  type PrimaryActionId
} from "./consoleFlow";
import { findPreset, presetCatalog, type PresetId, type WebPreset } from "./presetCatalog";

type Language = "zh" | "en";
type SourceType = "markdown" | "docx" | "pdf" | "url" | "pptx" | "mixed";
type Scenario = "executive" | "consulting" | "training" | "launch" | "investor";
type OutputMode = "pptx" | "web" | "both";
type StylePreset = "business" | "consulting" | "editorial" | "swiss" | "academic";
type AgentTool = "codex" | "claude" | "hermes" | "openclaw" | "generic";
type SkillTarget = "codex" | "generic";
type ModelPreference = "auto" | "openai" | "gemini" | "qwen" | "deepseek" | "custom";
type WorkspaceView = ConsoleStepId;
type WorkflowStepId = "brief" | "sources" | "bridge" | "agent" | "handoff" | "review";
type StepStatus = "locked" | "ready" | "active" | "complete" | "blocked";
type QualityGateLevel = "quick" | "formal-business" | "showcase";
type UploadedSourceKind = "file" | "url";
type UploadedSourceStatus = "textExtracted" | "attachedOnly" | "urlOnly";
type BriefMode = "visual-tags" | "codex-guided-intake" | "source-first" | "draft-with-assumptions" | "best-effect-expanded" | "best-effect-fixed-style";
type VisualTagGroupId = "scenario" | "audience" | "purpose" | "contentState" | "visualStyle" | "layoutDensity" | "assetStrategy" | "outputPreference";
type ExpectationRiskLevel = "green" | "yellow" | "red";
type SourceAdequacy = "substantive" | "thin" | "topic-only" | "private-unparsed" | "conflicting" | "no-source";
type SourceConfidenceLevel = "strong" | "partial" | "weak" | "topic-only";
type ExpectedDeckType = "executive-report" | "client-proposal" | "training-courseware" | "launch-story" | "research-report" | "general-business";
type FeedbackStatus = "none" | "requested" | "needs-revision";
type FailureTaxonomyId = "brief-mismatch" | "source-gap" | "style-mismatch" | "visual-density" | "asset-boundary" | "format-mismatch";
type WebDeckStyle = "editorial" | "swiss";
type WebDeckLayoutPolicy = "free-layout-skeletons" | "swiss-locked-sxx";

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

interface QualityContract {
  label: string;
  userLevel: string;
  acceptanceCriteria: string[];
  expectedArtifacts: string[];
  reviewCommands: string[];
  notFor: string[];
  proofArtifacts?: {
    source: string;
    generatedOutput: string;
    screenshot: string;
    qualityReport: string;
    benchmarkNote: string;
  };
}

interface QualityGate {
  level: QualityGateLevel;
  requiredInputs: string[];
  acceptanceCriteria: string[];
  artifactChecks: string[];
  reviewCommands: string[];
  assetStrategy?: Record<string, string>;
}

interface WorkflowState {
  currentStep: WorkflowStepId;
  blockedReason: string;
}

interface WorkflowStep {
  id: WorkflowStepId;
  status: StepStatus;
  title: string;
  detail: string;
  action: string;
}

interface VisualBrief {
  selectedTags: Record<VisualTagGroupId, string[]>;
  tagPreset: string;
  backgroundText: string;
  extraRequirements: string;
  referenceLinks: string[];
  referenceStyle: ReferenceStyle;
  autoSuggestedTags: string[];
  userEditedTags: boolean;
}

interface GuidedBrief {
  scenario: string;
  audience: string;
  purpose: string;
  coreMessage: string;
  contentSources: string[];
  slideCount: string;
  outlinePreference: string;
  visualStyle: string[];
  assetRules: string[];
  outputFormat: string[];
  mustInclude: string[];
  mustAvoid: string[];
}

interface ExpectationFit {
  riskLevel: ExpectationRiskLevel;
  score: number;
  sourceAdequacy: SourceAdequacy;
  missingSignals: string[];
  assumptions: string[];
  conflicts: string[];
  successCriteria: string[];
  readyForProduction: boolean;
  nextQuestions: string[];
}

interface BestEffectBrief {
  version: "v5.3-best-effect-v1";
  strategy: "source-confirmed" | "best-effect-expanded" | "best-effect-fixed-style";
  promptQuality: "complete" | "thin" | "extreme-thin";
  userRequestSummary: string;
  recommendedRoute: "formal-editable-pptx" | "guizang-web-fixed-style" | "dual-delivery";
  defaultStyle: string;
  autoExpandedBrief: string[];
  fixedStyleFallback: {
    trigger: string;
    routeName: string;
    outputMode: string;
    styleName: string;
    pageRhythm: string[];
    qualityBar: string[];
  };
  assumptions: string[];
  agentInstructions: string[];
  userVisibleHint: string;
}

interface WebDeckPlan {
  style: WebDeckStyle;
  theme: string;
  layoutPolicy: WebDeckLayoutPolicy;
  pageRhythm: Array<{
    page: number;
    role: string;
    theme: string;
    layout: string;
    imageSlot?: string;
  }>;
  validationCommands: string[];
}

interface ReferenceStyle {
  selectedDirection: string;
  positiveReferences: string[];
  negativeReferences: string[];
  styleConstraints: string[];
}

interface ReferenceStyleOption {
  id: string;
  zh: string;
  en: string;
  descriptionZh: string;
  descriptionEn: string;
  positiveReferences: string[];
  negativeReferences: string[];
  styleConstraints: string[];
}

interface SourceConfidence {
  level: SourceConfidenceLevel;
  sourceAdequacy: SourceAdequacy;
  coveredAreas: string[];
  missingAreas: string[];
  claimsNeedingEvidence: string[];
  doNotInvent: string[];
}

interface DeliveryScorecard {
  expectedDeckType: ExpectedDeckType;
  expectationFitBeforeProduction: {
    riskLevel: ExpectationRiskLevel;
    score: number;
    readyForProduction: boolean;
    missingSignals: string[];
    assumptions: string[];
  };
  qualityDimensions: Array<{
    id: string;
    label: string;
    score: number;
    evidence: string;
  }>;
  userVisibleSummary: string;
  knownRisks: string[];
  recommendedNextRevision: string[];
}

interface FeedbackLoop {
  feedbackStatus: FeedbackStatus;
  failureTaxonomy: Array<{
    id: FailureTaxonomyId;
    label: string;
    applies: boolean;
    improvementTarget: string;
  }>;
  nextRevisionIntent: string;
  feedbackTemplate: string[];
}

interface VisualTag {
  id: string;
  zh: string;
  en: string;
}

interface VisualTagGroup {
  id: VisualTagGroupId;
  zh: string;
  en: string;
  tags: VisualTag[];
}

interface VisualBriefPreset {
  id: string;
  zh: string;
  en: string;
  descriptionZh: string;
  descriptionEn: string;
  tags: Partial<Record<VisualTagGroupId, string[]>>;
}

interface FormState {
  language: Language;
  presetId: PresetId;
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
  visualBrief: VisualBrief;
}

interface UploadedSource {
  id: string;
  kind: UploadedSourceKind;
  name: string;
  type: string;
  size: number;
  extension: string;
  status: UploadedSourceStatus;
  statusText: string;
  text?: string;
  dataBase64?: string;
  url?: string;
  addedAt: string;
}

interface ProviderStatus {
  id: ModelPreference | "openai";
  label: string;
  configured: boolean;
  envKeys: string[];
  model?: string;
  baseUrl?: string;
  keySource?: string;
  modelSource?: string;
  lastTest?: {
    ok: boolean;
    message: string;
    status?: number;
  };
}

interface AgentStatus {
  id: AgentTool;
  label: string;
  command: string;
  available: boolean;
  path?: string;
}

interface SkillTargetStatus {
  id: SkillTarget;
  label: string;
  targetPath: string;
  installCommand: string;
  installed: boolean;
  managed: boolean;
  mode: string;
  message: string;
}

interface BridgeHealth {
  ok: boolean;
  version: string;
  repoRoot: string;
  outputDir: string;
  allowLaunch: boolean;
  agents: AgentStatus[];
  providers: ProviderStatus[];
  skillTargets?: SkillTargetStatus[];
}

interface HandoffResult {
  projectPath: string;
  files: string[];
  suggestedCommands: Record<string, string>;
  manifest: {
    attachments: Array<{ name: string; parseStatus: string; message: string }>;
    qualityProfile?: QualityContract;
    qualityGate?: QualityGate;
    workflowState?: WorkflowState;
    expectedArtifacts?: string[];
    reviewCommands?: string[];
    deckIR?: {
      storyboard: string;
      sourceMap: string;
      planningReport: string;
      renderedReview: string;
      repairPlan?: string;
      revisionBrief?: string;
    };
  };
}

const baseUrl = import.meta.env.BASE_URL;
const repoUrl = "https://github.com/kdnsna/ultimate-ppt-master-skill";
const demoUrl = `${baseUrl}examples/agentic-developer-tools-2026/web-demo.html`;
const skillDocUrl = `${repoUrl}#use-as-agent-skill`;
const bridgeDocUrl = `${repoUrl}/blob/main/docs/guides/agent-connect-bridge.md`;
const bridgeUrl = "http://127.0.0.1:43188";
const storageKey = "ultimate-ppt-master-web-brief-v4";
const appVersion = "5.4.0";
const bestEffectMarketplacePrompt = "Use $ultimate-ppt-master with any natural-language presentation request. It will expand the request into a best-effect brief, choose PPTX or Web Deck, and run the matching quality checks.";

const designDoctorScores = [
  {
    key: "layout",
    score: 92,
    zh: "版式稳定",
    en: "Layout stability",
    zhHint: "检查文字溢出、遮挡、页边距和移动端可读性。",
    enHint: "Checks overflow, overlap, margins, and mobile readability."
  },
  {
    key: "evidence",
    score: 88,
    zh: "证据闭环",
    en: "Evidence loop",
    zhHint: "确认每页结论能回到 source.md、附件或公开样例证明。",
    enHint: "Confirms every claim maps back to source.md, attachments, or public proof."
  },
  {
    key: "editability",
    score: 86,
    zh: "可编辑交付",
    en: "Editable delivery",
    zhHint: "优先保留真实文字、图表、备注和检查命令，而不是整页截图。",
    enHint: "Prioritizes real text, charts, notes, and review commands over flat screenshots."
  }
];

const benchmarkCases = [
  {
    id: "executive",
    zhTitle: "经营复盘",
    enTitle: "Executive Business Review",
    zhUse: "经营会、部门复盘、KPI 故事线",
    enUse: "KPI review, executive update, operating rhythm",
    path: "examples/executive-business-review-starter/web-demo.html",
    report: "examples/executive-business-review-starter/quality-report.json"
  },
  {
    id: "consulting",
    zhTitle: "咨询方案",
    enTitle: "Consulting Proposal",
    zhUse: "客户诊断、转型建议、路线图",
    enUse: "Diagnosis, recommendation, implementation roadmap",
    path: "examples/consulting-proposal-starter/web-demo.html",
    report: "examples/consulting-proposal-starter/quality-report.json"
  },
  {
    id: "product",
    zhTitle: "产品路演",
    enTitle: "Product Pitch",
    zhUse: "新品介绍、demo day、资源争取",
    enUse: "Launch story, demo day, stakeholder buy-in",
    path: "examples/product-pitch-starter/web-demo.html",
    report: "examples/product-pitch-starter/quality-report.json"
  },
  {
    id: "trend",
    zhTitle: "科技趋势",
    enTitle: "Tech Trend Web Deck",
    zhUse: "趋势观察、公开演讲、技术洞察",
    enUse: "Trend briefing, public talk, technical narrative",
    path: "examples/tech-trend-web-deck-starter/web-demo.html",
    report: "examples/tech-trend-web-deck-starter/quality-report.json"
  }
];

const labels = {
  zh: {
    product: "Ultimate PPT Master",
    studio: "PPT 质量工作台",
    route: `v${appVersion} · 四步控制台 · 质量合同随本地项目包一起走`,
    subtitle: "把经营复盘、咨询方案、培训课件和学术答辩先整理成清晰任务；网页只保留下一步，本地 Skill 和 AI 助手负责最终质量。",
    whyTitle: "v4.1 让控制台更像工具",
    whySubtitle: "把案例、术语、检测和交付文件收进折叠区，主界面只回答一件事：现在下一步该做什么。",
    whyCards: [
      { title: "中文办公默认", text: "经营复盘、咨询方案、培训课件和学术答辩优先，产品路演和科技趋势作为展示型路线。" },
      { title: "质量可证明", text: "stable pack 必须有合成 source、输出、截图、quality-report 和适用边界。" },
      { title: "视觉可复查", text: "Design Doctor 把 SVG 检查、浏览器复查和中文摘要变成用户能理解的一步。" },
      { title: "交付有合同", text: "本地项目包把质量目标、预期产物和检查命令写入 manifest 与 project-brief。" }
    ],
    plainGlossaryTitle: "先把几个词讲清楚",
    plainGlossaryText: "你可以先按中文名字理解；括号里的英文是项目里原本的技术名，后面文档和按钮会继续沿用。",
    plainGlossaryItems: [
      { title: "本机连接器（Bridge）", text: "一小段只跑在你电脑上的服务。它让网页能读取本机文件、识别已安装的 AI 助手，并把资料写成本地项目包。" },
      { title: "AI 助手（Agent）", text: "真正继续做 PPT 的本地工具，比如 Codex、Hermes、OpenClaw 或 Claude Code。装了哪个，就可以选哪个。" },
      { title: "模型账号（API key）", text: "调用大模型服务用的钥匙。网页只显示是否配置，不展示也不保存你的密钥。" },
      { title: "本地项目包（handoff）", text: "网页整理出来的一整个文件夹，里面有资料、任务说明、预览文件和给 AI 助手执行的命令。" }
    ],
    firstStepTitle: "第一次用，先从这里开始",
    firstStepSubtitle: "网页先整理需求；启动本机连接器（Bridge）后，会自动识别 Codex / Hermes / OpenClaw / Claude 等本机 AI 助手。",
    firstStepSubtitleReady: "本机连接器（Bridge）已经连上；选择任意可用 AI 助手，把资料发给本地项目即可。",
    firstStepBrief: "填一句任务",
    firstStepBriefText: "先保留默认预设，改项目标题和核心结论；没有资料也可以先粘贴摘要。",
    firstStepFiles: "放资料",
    firstStepFilesText: "拖入 PDF / Word / PPTX / Excel，或先用粘贴摘要试跑。",
    firstStepBridge: "连接本机",
    bridgeOfflineHelp: "本机连接器（Bridge）还没启动，网页暂时不能查看你电脑上装了哪些 AI 助手。复制下面的启动命令即可，它会先寻找本机项目目录再启动。",
    bridgeOnlineHelp: "本机连接器（Bridge）已启动，网页可以识别本机 AI 助手并写入本地项目包（handoff）。",
    copyBridgeCommand: "复制本机连接命令",
    refreshBridge: "重新检测",
    firstStepHandoff: "生成本地项目包",
    firstStepHandoffText: "点“生成本地项目包”，再点“启动 / 复制 AI 助手命令”。",
    hermesDetected: "已识别 Hermes",
    hermesNotDetected: "暂未识别 Hermes",
    hermesWaiting: "启动本机连接器（Bridge）后这里会显示 Hermes 是否可用。",
    agentDetected: "已识别 {agent}",
    agentNotDetected: "暂未识别可用 AI 助手",
    agentWaiting: "启动本机连接器（Bridge）后，这里会显示本机 AI 助手是否可用。",
    selectedAgent: "当前 AI 助手",
    selectedAgentCommand: "命令",
    useHermes: "改用 Hermes",
    useDetectedAgent: "改用 {agent}",
    navStart: "准备任务",
    navSources: "添加资料",
    navConfig: "连接本机",
    navHandoff: "生成交付",
    navPreview: "预览与文件",
    startGuideTitle: "先跑通最短路径",
    startGuideText: "第一次不用理解全部面板：先确认本机连接器和 AI 助手状态，再改一句任务或拖入资料。",
    sourceGuideTitle: "准备资料和目标",
    sourceGuideText: "这一页只处理输入、预设、页数和叙事目标。先让任务说明达到 80% 以上，再交给 AI 助手。",
    configGuideTitle: "配置和检测",
    configGuideText: "这一页只看本机连接器（Bridge）、AI 助手命令、Skill 安装和模型账号（API key）。可以一键检测，也可以自动选择已安装的 AI 助手。",
    handoffGuideTitle: "生成本地项目",
    handoffGuideText: "这一页负责把网页里的任务说明、附件和执行要求写入本地项目包（handoff），再复制 AI 助手命令。",
    previewGuideTitle: "检查预览和交接文件",
    previewGuideText: "这里看浏览器预览、AI 助手任务说明、资料文件、文件清单和质量检查清单。",
    setupTitle: "本机连接 / 设置",
    setupSubtitle: "网页不能绕过你的电脑权限直接动系统；Bridge 在线时可以一键把本仓库登记到 Codex / 通用 Agent Skill 目录，离线时会复制可执行命令。",
    oneClickDetect: "一键检测",
    oneClickConfig: "一键选择可用 AI 助手",
    autoSelectAgentOk: "已选择可用 AI 助手：{agent}",
    autoSelectAgentMissing: "还没有检测到可用 AI 助手，请先启动本机连接器或安装 Codex / Hermes / OpenClaw / Claude。",
    noProviderConfigured: "没有检测到已配置的模型 key。",
    bridgeStartTitle: "本机连接器（Bridge）",
    bridgeStartText: "只跑在你电脑上的连接服务。启动后网页才能读取 AI 助手命令、解析本地文件并写入本地项目包（handoff）。",
    agentSetupTitle: "AI 助手（Agent）",
    agentSetupText: "支持 Codex、Hermes、OpenClaw、Claude Code。谁装在电脑上，本机连接器（Bridge）就会显示谁可用。",
    modelSetupTitle: "模型账号（API key）",
    modelSetupText: "本机连接器（Bridge）会从 .env / 环境变量读取 API key，只显示是否配置，不泄露密钥。",
    skillInstallTitle: "Skill 安装 / 更新",
    skillInstallText: "让 Codex 等本地 AI 助手能直接找到 Ultimate PPT Master。Bridge 在线时会安全登记固定目录；离线时复制安装命令。",
    installCodexSkill: "安装到 Codex",
    installGenericSkill: "安装到通用 Agent",
    copyCodexSkillCommand: "复制 Codex 命令",
    copyGenericSkillCommand: "复制通用命令",
    skillInstallOk: "已处理 Skill 目标：{target}",
    skillInstallFail: "Skill 安装失败",
    skillInstallNeedsBridge: "本机连接未建立，已复制安装命令。先在终端运行它，再回到网页重新检测。",
    skillInstalled: "已安装",
    skillMissing: "未安装",
    skillManaged: "Bridge 可管理",
    skillManual: "需手动处理",
    installingSkill: "正在安装",
    openDemo: "打开 Web Deck 示例",
    copyPrompt: "复制 AI 助手任务说明",
    copySource: "复制资料文件",
    copyPreview: "复制当前预览",
    copyCommand: "复制命令",
    downloadSource: "下载资料文件",
    downloadWebDeck: "下载 preview-web-deck.html",
    downloadKit: "下载本地项目包 zip",
    sendBridge: "生成本地项目包",
    launchAgent: "启动 / 复制 AI 助手命令",
    skillSetup: "AI 技能安装说明",
    bridgeSetup: "本机连接器说明",
    sourcePanel: "资料导入",
    structurePanel: "目标与路线",
    handoffPanel: "交接给 AI 助手",
    handoffExecutionTitle: "下一步执行",
    handoffExecutionBridgeOffline: "先启动本机连接。离线时网页只能下载 zip，不能写入本地项目或检测 AI 助手。",
    handoffExecutionBridgeOnline: "本机已连接。下一步先生成本地项目包，再交给 AI 助手执行。",
    handoffExecutionReady: "本地项目包已生成。先复制元素生成命令，再复制 AI 助手命令继续生产。",
    elementGenerationCommand: "元素生成命令",
    needsManualHint: "如果没有 IMAGE_BACKEND / OpenAI key，脚本会写出 Needs-Manual prompts；打开 images/image_prompts.md，在 ChatGPT 生成后保存到列出的路径。",
    generatedNowTitle: "当前项目包已包含",
    codexNextTitle: "Codex 后续生成 / 更新",
    providerPanel: "模型账号 / Key 状态",
    previewPrompt: "AI 助手任务说明",
    previewSource: "source.md",
    previewExtracted: "extracted-source.md",
    previewManifest: "manifest.json",
    previewDeckIR: "DeckIR 页面地图",
    previewBrief: "brief.json",
    previewWebDeck: "preview-web-deck.html",
    previewChecklist: "quality-checklist.md",
    previewQualityReport: "quality-report.json",
    previewCodexTask: "codex-task.md",
    previewAssetPlan: "asset-plan.md",
    previewElementKit: "visual-element-kit.md",
    previewGroupUser: "用户预览",
    previewGroupAgent: "AI 助手文件",
    previewGroupQuality: "质量报告",
    contentPreset: "内容预设",
    presetSummary: "预设说明",
    presetRoute: "推荐路线",
    presetRequirements: "资料要求",
    presetTemplates: "模板候选",
    presetChecks: "关键检查",
    bestFor: "适合谁",
    notFor: "不适合",
    qualityWorkbenchTitle: "当前任务预览",
    qualityWorkbenchSubtitle: "右侧不再留白：这里显示下一步、质量状态和交付门禁。",
    nextStep: "下一步",
    qualityStatus: "质量状态",
    qualityProfile: "质量目标",
    expectedArtifacts: "预期产物",
    reviewCommands: "检查命令",
    designDoctorTitle: "Design Doctor / 视觉复查",
    designDoctorText: "默认只生成 quality-report.json 和中文摘要；只有你明确要求时才自动修 SVG。",
    sourceType: "资料类型",
    scenario: "使用场景",
    outputMode: "输出形式",
    stylePreset: "视觉风格",
    agentTool: "AI 助手",
    modelPreference: "模型偏好",
    titleField: "项目标题",
    audience: "目标听众",
    slideCount: "页数",
    coreMessage: "核心结论",
    sourceNotes: "粘贴资料 / 摘要",
    constraints: "补充要求",
    visualBriefPanel: "可视化需求标签",
    visualBriefSubtitle: "用标签快速说明场景、受众、目的、风格、素材和输出偏好；也可以继续粘贴背景和特殊要求。",
    bestEffectTitle: "最佳效果提示增强器",
    bestEffectSubtitle: "Agent 会先把你的短指令自动扩写成可执行 brief；极短指令默认走 Style A Editorial Fixed Rhythm。",
    bestEffectDefault: "极短指令稳定默认",
    bestEffectDefaultText: "只有主题或一句话时：默认 8 页杂志化 Web Deck，Style A · 电子杂志 × 电子墨水，先出稳定高质量版本。",
    bestEffectFormal: "正式可编辑例外",
    bestEffectFormalText: "如果明确写了正式汇报、可编辑 PPTX、政府/金融/培训，就改走 PPTX，但仍先自动扩写 brief 和质量约束。",
    bestEffectCopy: "推荐复制提示",
    recommendedTagCombos: "推荐组合",
    referenceStyle: "参考样板方向",
    referenceStyleSubtitle: "把“正式大气”继续说清楚：更贴近咨询报告、金融汇报、发布会，还是培训课件。",
    referenceStyleLike: "贴近",
    referenceStyleAvoid: "避免",
    referenceStyleRules: "排版约束",
    backgroundContext: "背景 / 相关内容",
    extraVisualRequirements: "特殊要求 / 禁忌",
    referenceLinks: "参考链接 / 官网 / 资料地址",
    expectationFit: "预期契合度",
    expectationFitGreen: "可以进入正式制作",
    expectationFitYellow: "可制作，但需要记录假设",
    expectationFitRed: "建议先问清楚再制作",
    sourceAdequacy: "资料充分度",
    sourceConfidence: "来源可信度",
    deliveryScorecard: "交付评分卡",
    feedbackLoop: "反馈修订闭环",
    nextCodexQuestion: "Codex 下一步应问",
    readyForProduction: "可正式制作",
    needsGuidedIntake: "需要分步问清",
    sourceUrl: "资料 URL",
    addUrl: "添加 URL",
    copied: "已复制",
    kitReady: "交付包已生成",
    copyFailed: "复制失败，请手动选择内容",
    pagesOnly: "静态网页入口",
    bridgeLocal: "本机连接器只连 127.0.0.1",
    keySafe: "浏览器不保存模型账号密钥",
    readiness: "Brief 完整度",
    missing: "还可补充",
    kitIncludes: "本地项目包内容",
    enginePanel: "双引擎执行路线",
    webPreviewPanel: "Web Deck 实时预览",
    previewNote: "这是本地预览稿；最终成品仍由 Skill 读取真实资料、解析、渲染、检查和修复。",
    activeRoute: "启用",
    optionalRoute: "备用",
    demoTitle: "Web Deck 示例",
    demoText: "质量证明样板，展示输入材料、预设、输出、ChatGPT 小元素闭环和检查结果。",
    skillTitle: "AI 技能路线",
    skillText: "高质量生产路线，负责真实文件解析、生成、检查和导出。",
    desktopTitle: "Desktop Later",
    desktopText: "桌面端保留为高级本地模式，不是当前首推路径。",
    privacyNote: "静态网页不会上传资料；连接本机连接器（Bridge）时只发送到你本机 127.0.0.1。",
    dropTitle: "拖拽 PDF / Word / PPTX / Excel / Markdown 到这里",
    dropHint: "文本类会在浏览器预读；Office/PDF 会打包给本地 Bridge 调用转换脚本解析。",
    chooseFiles: "选择文件",
    remove: "移除",
    noSources: "还没有添加真实文件。可以先粘贴摘要，也可以拖入资料。",
    noRealSourcesYet: "还没有真实资料",
    handoffNotCreated: "尚未生成项目包",
    formalBusinessQualityGate: "正式商务交付",
    wizardTitle: "一步步完成",
    wizardSubtitle: "连接之后只看当前步骤：先把任务和资料准备好，再连接本机、选择 AI 助手、生成项目包，最后做质量复查。",
    wizardPrimary: "当前动作",
    wizardCurrent: "当前步骤",
    workflowBrief: "准备 brief",
    workflowSources: "添加资料",
    workflowBridge: "连接本机",
    workflowAgent: "选择 AI 助手",
    workflowHandoff: "生成项目包",
    workflowReview: "质量复查",
    statusLocked: "未解锁",
    statusReady: "可执行",
    statusActive: "当前",
    statusComplete: "完成",
    statusBlocked: "受阻",
    auxiliaryTitle: "辅助资料",
    auxiliaryText: "案例墙、术语和市场分发内容收在这里；主流程不需要先看这些。",
    advancedSettings: "更多设置",
    advancedSettingsText: "内容预设、输出形式、风格、AI 助手和模型偏好默认收起，需要时再调整。",
    moreActions: "更多操作",
    quickConsoleTitle: "今天只需要跟着一个按钮走",
    quickConsoleText: "四步完成：准备任务、添加资料、连接本机、生成交付。案例和高级设置都在折叠区里，不会挡住主流程。",
    primaryCompleteBrief: "完善任务说明",
    primaryAddSources: "添加资料",
    primaryConnectLocal: "复制本机连接命令",
    primaryCreateProject: "生成本地项目包",
    primaryLaunchAgent: "启动 / 复制 AI 助手命令",
    primaryReviewDelivery: "查看质量报告",
    bridgeOnline: "本机连接器已连接",
    bridgeOffline: "本机连接器未连接",
    bridgeChecking: "检测本机连接器",
    bridgeCommand: "本机启动命令",
    bridgeSendOk: "已生成本地项目包",
    bridgeSendFail: "发送失败",
    allowLaunchOff: "默认安全模式：不会自动拉起 Agent。",
    allowLaunchOn: "已启用自动拉起 Agent。",
    providerConfigured: "已配置",
    providerMissing: "未配置",
    testProvider: "测试",
    agentAvailable: "可用",
    agentMissing: "未检测到",
    openFolder: "本地项目",
    commandReady: "命令已生成"
  },
  en: {
    product: "Ultimate PPT Master",
    studio: "PPT Quality Workbench",
    route: `v${appVersion} · Four-step console · quality contract in every local project`,
    subtitle: "Turn business reviews, consulting proposals, training decks, and academic defenses into a clear task first. The page keeps one next step visible; the local Skill and AI helper keep final quality high.",
    whyTitle: "v4.1 makes the console feel like a tool",
    whySubtitle: "Proofs, glossary, checks, and generated files move into collapsible areas. The main screen answers one question: what should I do next?",
    whyCards: [
      { title: "Office defaults", text: "Business review, consulting, training, and academic defense come first; product pitch and tech trend stay as showcase routes." },
      { title: "Proof required", text: "Stable packs need synthetic source, output, screenshot, quality report, and suitability boundaries." },
      { title: "Visual review", text: "Design Doctor turns SVG checks, browser review, and Chinese summaries into a clear user step." },
      { title: "Contract delivery", text: "The local project writes quality goals, expected artifacts, and review commands into manifest and project brief." }
    ],
    plainGlossaryTitle: "A few words in plain English",
    plainGlossaryText: "Read the plain name first. The word in parentheses is the technical term used by the repo and docs.",
    plainGlossaryItems: [
      { title: "Local connector (Bridge)", text: "A small service that runs only on this computer. It lets the page read local files, detect installed AI helpers, and write a local project folder." },
      { title: "AI helper (Agent)", text: "The local tool that continues making the PPT, such as Codex, Hermes, OpenClaw, or Claude Code." },
      { title: "Model account (API key)", text: "The secret used to call model services. The page only shows whether it is configured; it never displays or stores the key." },
      { title: "Local project folder (handoff)", text: "A folder prepared by the page with sources, task instructions, preview files, and the command for the AI helper." }
    ],
    firstStepTitle: "First time here? Start here",
    firstStepSubtitle: "The web page shapes the brief. Start the local connector (Bridge) to detect AI helpers such as Codex, Hermes, OpenClaw, or Claude.",
    firstStepSubtitleReady: "The local connector (Bridge) is connected. Choose any available AI helper, then send the brief into a local project.",
    firstStepBrief: "Write one task",
    firstStepBriefText: "Keep the default preset, then change the title and core message. Paste notes if you do not have files yet.",
    firstStepFiles: "Add sources",
    firstStepFilesText: "Drop PDF / Word / PPTX / Excel files, or test with pasted notes first.",
    firstStepBridge: "Connect this Mac",
    bridgeOfflineHelp: "The local connector (Bridge) is not running yet, so the page cannot see installed AI helpers. Copy the startup command below; it finds the local repo before starting Bridge.",
    bridgeOnlineHelp: "The local connector (Bridge) is running. The page can detect local AI helpers and write a local project folder (handoff).",
    copyBridgeCommand: "Copy local connection command",
    refreshBridge: "Check again",
    firstStepHandoff: "Create local project",
    firstStepHandoffText: "Create the local project, then launch or copy the AI-helper command.",
    hermesDetected: "Hermes detected",
    hermesNotDetected: "Hermes not detected",
    hermesWaiting: "Start the local connector (Bridge) to show whether Hermes is available.",
    agentDetected: "{agent} detected",
    agentNotDetected: "No available AI helper detected",
    agentWaiting: "Start the local connector (Bridge) to show whether a local AI helper is available.",
    selectedAgent: "Selected AI helper",
    selectedAgentCommand: "Command",
    useHermes: "Use Hermes",
    useDetectedAgent: "Use {agent}",
    navStart: "Prepare",
    navSources: "Sources",
    navConfig: "Connect",
    navHandoff: "Deliver",
    navPreview: "Preview",
    startGuideTitle: "Run the shortest path first",
    startGuideText: "You do not need to understand every panel. Check the local connector and AI helper, then edit one task or add files.",
    sourceGuideTitle: "Prepare sources and goal",
    sourceGuideText: "This page is only for input, preset, slide count, and narrative target. Aim for 80% task readiness before sending it to the AI helper.",
    configGuideTitle: "Configure and detect",
    configGuideText: "This page is only for the local connector (Bridge), AI-helper commands, Skill installation, and model accounts (API keys). Run one-click detection or auto-select an installed helper.",
    handoffGuideTitle: "Create the local project",
    handoffGuideText: "This page writes the brief, attachments, and execution contract to a local project folder (handoff), then copies the AI-helper command.",
    previewGuideTitle: "Check preview and files",
    previewGuideText: "Review the browser preview, AI-helper task, source file, manifest, and quality checklist.",
    setupTitle: "Local connection / settings",
    setupSubtitle: "The page cannot bypass your computer permissions. When Bridge is online, it can register this repo in Codex / generic Agent Skill folders; offline, it copies an executable command.",
    oneClickDetect: "One-click check",
    oneClickConfig: "Choose available AI helper",
    autoSelectAgentOk: "Selected available AI helper: {agent}",
    autoSelectAgentMissing: "No available AI helper detected yet. Start the local connector or install Codex / Hermes / OpenClaw / Claude.",
    noProviderConfigured: "No configured model key was detected.",
    bridgeStartTitle: "Local connector (Bridge)",
    bridgeStartText: "A connector service that runs on this computer. Start it so the page can read AI-helper commands, parse local files, and write local project folders (handoff).",
    agentSetupTitle: "AI helper (Agent)",
    agentSetupText: "Supports Codex, Hermes, OpenClaw, and Claude Code. If it is installed on the computer, the local connector (Bridge) marks it available.",
    modelSetupTitle: "Model account (API key)",
    modelSetupText: "The local connector (Bridge) reads API keys from .env / environment variables and only shows configuration status, never the secret.",
    skillInstallTitle: "Skill install / update",
    skillInstallText: "Let Codex and other local AI helpers find Ultimate PPT Master directly. Bridge writes only fixed safe targets; offline, copy the install command.",
    installCodexSkill: "Install to Codex",
    installGenericSkill: "Install to generic Agent",
    copyCodexSkillCommand: "Copy Codex command",
    copyGenericSkillCommand: "Copy generic command",
    skillInstallOk: "Skill target handled: {target}",
    skillInstallFail: "Skill install failed",
    skillInstallNeedsBridge: "Local connection is offline, so the install command was copied. Run it in Terminal, then check again.",
    skillInstalled: "Installed",
    skillMissing: "Not installed",
    skillManaged: "Bridge-managed",
    skillManual: "Manual action",
    installingSkill: "Installing",
    openDemo: "Open Web Deck demo",
    copyPrompt: "Copy AI-helper task",
    copySource: "Copy source file",
    copyPreview: "Copy preview",
    copyCommand: "Copy command",
    downloadSource: "Download source file",
    downloadWebDeck: "Download preview-web-deck.html",
    downloadKit: "Download local project zip",
    sendBridge: "Create local project",
    launchAgent: "Launch / copy AI-helper command",
    skillSetup: "AI Skill setup",
    bridgeSetup: "Local connector guide",
    sourcePanel: "Source intake",
    structurePanel: "Target and route",
    handoffPanel: "Hand off to AI helper",
    handoffExecutionTitle: "Next execution step",
    handoffExecutionBridgeOffline: "Start the local connection first. While offline, the page can download a zip but cannot write a local project or detect AI helpers.",
    handoffExecutionBridgeOnline: "Local connection is ready. Create a local project before giving it to an AI helper.",
    handoffExecutionReady: "The local handoff folder is ready. Copy the element-generation command, then copy the AI-helper command for production.",
    elementGenerationCommand: "Element-generation command",
    needsManualHint: "If IMAGE_BACKEND / OpenAI key is not configured, the script writes Needs-Manual prompts; open images/image_prompts.md, generate in ChatGPT, and save outputs to the listed paths.",
    generatedNowTitle: "Included now",
    codexNextTitle: "Generated / updated by Codex",
    providerPanel: "Model account / key status",
    previewPrompt: "AI-helper task",
    previewSource: "source.md",
    previewExtracted: "extracted-source.md",
    previewManifest: "manifest.json",
    previewDeckIR: "DeckIR page map",
    previewBrief: "brief.json",
    previewWebDeck: "preview-web-deck.html",
    previewChecklist: "quality-checklist.md",
    previewQualityReport: "quality-report.json",
    previewCodexTask: "codex-task.md",
    previewAssetPlan: "asset-plan.md",
    previewElementKit: "visual-element-kit.md",
    previewGroupUser: "User preview",
    previewGroupAgent: "AI-helper files",
    previewGroupQuality: "Quality report",
    contentPreset: "Content preset",
    presetSummary: "Preset summary",
    presetRoute: "Recommended route",
    presetRequirements: "Source requirements",
    presetTemplates: "Template candidates",
    presetChecks: "Key checks",
    bestFor: "Best for",
    notFor: "Not for",
    qualityWorkbenchTitle: "Current task preview",
    qualityWorkbenchSubtitle: "The right side now carries next step, quality status, and delivery gates.",
    nextStep: "Next step",
    qualityStatus: "Quality status",
    qualityProfile: "Quality profile",
    expectedArtifacts: "Expected artifacts",
    reviewCommands: "Review commands",
    designDoctorTitle: "Design Doctor / visual review",
    designDoctorText: "By default it writes quality-report.json and a plain-language Chinese summary. Automatic SVG repair only happens when explicitly requested.",
    sourceType: "Source type",
    scenario: "Scenario",
    outputMode: "Output",
    stylePreset: "Visual style",
    agentTool: "AI helper",
    modelPreference: "Model preference",
    titleField: "Project title",
    audience: "Audience",
    slideCount: "Slide count",
    coreMessage: "Core message",
    sourceNotes: "Pasted material / notes",
    constraints: "Extra requirements",
    visualBriefPanel: "Visual brief tags",
    visualBriefSubtitle: "Use tags to clarify scenario, audience, purpose, style, assets, and output. Paste background and special constraints when needed.",
    bestEffectTitle: "Best-Effect Brief Enhancer",
    bestEffectSubtitle: "The Agent expands short requests into an executable brief first; extremely thin prompts default to Style A Editorial Fixed Rhythm.",
    bestEffectDefault: "Stable default for thin prompts",
    bestEffectDefaultText: "When there is only a topic or one line: default to an 8-page magazine Web Deck, Style A editorial/e-ink, and produce a stable high-quality version first.",
    bestEffectFormal: "Formal editable exception",
    bestEffectFormalText: "If the user explicitly asks for formal reporting, editable PPTX, government/finance, or training, switch to PPTX while preserving the expanded brief and quality checks.",
    bestEffectCopy: "Recommended prompt",
    recommendedTagCombos: "Suggested combinations",
    referenceStyle: "Reference style direction",
    referenceStyleSubtitle: "Make generic style words concrete: consulting report, financial review, launch keynote, or training deck.",
    referenceStyleLike: "Move toward",
    referenceStyleAvoid: "Avoid",
    referenceStyleRules: "Layout constraints",
    backgroundContext: "Background / related context",
    extraVisualRequirements: "Special requirements / must avoid",
    referenceLinks: "Reference links / official sites / source URLs",
    expectationFit: "Expectation fit",
    expectationFitGreen: "Ready for production",
    expectationFitYellow: "Can proceed with recorded assumptions",
    expectationFitRed: "Clarify before production",
    sourceAdequacy: "Source adequacy",
    sourceConfidence: "Source confidence",
    deliveryScorecard: "Delivery scorecard",
    feedbackLoop: "Feedback revision loop",
    nextCodexQuestion: "Codex should ask next",
    readyForProduction: "Production ready",
    needsGuidedIntake: "Guided intake needed",
    sourceUrl: "Source URL",
    addUrl: "Add URL",
    copied: "Copied",
    kitReady: "Handoff kit generated",
    copyFailed: "Copy failed; select manually",
    pagesOnly: "Static web front door",
    bridgeLocal: "Local connector binds to 127.0.0.1 only",
    keySafe: "Browser never stores model account keys",
    readiness: "Brief readiness",
    missing: "Improve next",
    kitIncludes: "Local project contents",
    enginePanel: "Dual-engine execution route",
    webPreviewPanel: "Live Web Deck preview",
    previewNote: "This is a local preview. Final production still belongs to the Skill: read real files, parse, render, inspect, and repair.",
    activeRoute: "Active",
    optionalRoute: "Optional",
    demoTitle: "Web Deck demo",
    demoText: "A quality proof showing input, preset, output, the ChatGPT micro-asset loop, and review result.",
    skillTitle: "AI Skill path",
    skillText: "Production-grade route for real file parsing, generation, QA, and export.",
    desktopTitle: "Desktop Later",
    desktopText: "Desktop remains an advanced local mode, not the current primary path.",
    privacyNote: "The static web app does not upload sources. Local connector (Bridge) traffic goes only to your local 127.0.0.1.",
    dropTitle: "Drop PDF / Word / PPTX / Excel / Markdown here",
    dropHint: "Text files are pre-read in the browser. Office/PDF files are packed for the local Bridge converters.",
    chooseFiles: "Choose files",
    remove: "Remove",
    noSources: "No real files yet. Paste notes or drop source files.",
    noRealSourcesYet: "No real sources yet",
    handoffNotCreated: "Handoff not created",
    formalBusinessQualityGate: "Formal business delivery",
    wizardTitle: "Step-by-step path",
    wizardSubtitle: "After connecting, focus on the current step: prepare the task and sources, connect locally, choose an AI helper, create the project, then run quality review.",
    wizardPrimary: "Current action",
    wizardCurrent: "Current step",
    workflowBrief: "Prepare brief",
    workflowSources: "Add sources",
    workflowBridge: "Connect local",
    workflowAgent: "Choose AI helper",
    workflowHandoff: "Create project",
    workflowReview: "Quality review",
    statusLocked: "Locked",
    statusReady: "Ready",
    statusActive: "Current",
    statusComplete: "Complete",
    statusBlocked: "Blocked",
    auxiliaryTitle: "Auxiliary resources",
    auxiliaryText: "Benchmark wall, glossary, and distribution notes live here so the main workflow can stay focused.",
    advancedSettings: "More settings",
    advancedSettingsText: "Content preset, output mode, visual style, AI helper, and model preference stay hidden until needed.",
    moreActions: "More actions",
    quickConsoleTitle: "Follow one button today",
    quickConsoleText: "Four steps: prepare the task, add sources, connect locally, and deliver. Examples and advanced settings stay folded away from the main path.",
    primaryCompleteBrief: "Complete task brief",
    primaryAddSources: "Add sources",
    primaryConnectLocal: "Copy local connection command",
    primaryCreateProject: "Create local project",
    primaryLaunchAgent: "Launch / copy AI-helper command",
    primaryReviewDelivery: "Review quality report",
    bridgeOnline: "Local connector connected",
    bridgeOffline: "Local connector offline",
    bridgeChecking: "Checking local connector",
    bridgeCommand: "Local start command",
    bridgeSendOk: "Local project folder created",
    bridgeSendFail: "Send failed",
    allowLaunchOff: "Safe default: the Agent will not auto-launch.",
    allowLaunchOn: "Agent auto-launch is enabled.",
    providerConfigured: "Configured",
    providerMissing: "Missing",
    testProvider: "Test",
    agentAvailable: "Available",
    agentMissing: "Not found",
    openFolder: "Local project",
    commandReady: "Command ready"
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
    editorial: { zh: "Style A · 电子杂志 × 电子墨水", en: "Style A · Editorial/E-ink" },
    swiss: { zh: "Style B · 瑞士国际主义", en: "Style B · Swiss International" },
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

const visualTagGroups: VisualTagGroup[] = [
  {
    id: "scenario",
    zh: "使用场景",
    en: "Scenario",
    tags: [
      { id: "work-report", zh: "工作汇报", en: "work report" },
      { id: "executive-review", zh: "高层汇报", en: "executive review" },
      { id: "consulting-proposal", zh: "咨询提案", en: "consulting proposal" },
      { id: "product-launch", zh: "产品发布", en: "product launch" },
      { id: "training", zh: "培训课件", en: "training deck" },
      { id: "investment", zh: "路演融资", en: "investor pitch" },
      { id: "research-report", zh: "调研报告", en: "research report" },
      { id: "campaign", zh: "活动方案", en: "campaign plan" },
      { id: "government-report", zh: "政企材料", en: "government / SOE" },
      { id: "culture-tourism", zh: "文旅推介", en: "culture tourism" }
    ]
  },
  {
    id: "audience",
    zh: "目标受众",
    en: "Audience",
    tags: [
      { id: "executives", zh: "高层领导", en: "executives" },
      { id: "department-heads", zh: "部门负责人", en: "department heads" },
      { id: "customers", zh: "客户", en: "customers" },
      { id: "partners", zh: "合作伙伴", en: "partners" },
      { id: "employees", zh: "员工", en: "employees" },
      { id: "public-media", zh: "公众媒体", en: "public / media" },
      { id: "reviewers", zh: "评审专家", en: "review panel" },
      { id: "investors", zh: "投资人", en: "investors" }
    ]
  },
  {
    id: "purpose",
    zh: "交付目的",
    en: "Purpose",
    tags: [
      { id: "decision", zh: "说服决策", en: "drive decision" },
      { id: "showcase", zh: "展示成果", en: "showcase results" },
      { id: "resource-request", zh: "申请资源", en: "request resources" },
      { id: "explain-solution", zh: "解释方案", en: "explain solution" },
      { id: "drive-execution", zh: "推动执行", en: "drive execution" },
      { id: "public-communication", zh: "制造传播", en: "public communication" },
      { id: "align-understanding", zh: "统一认知", en: "align understanding" },
      { id: "training-learning", zh: "培训学习", en: "training / learning" }
    ]
  },
  {
    id: "contentState",
    zh: "内容状态",
    en: "Content state",
    tags: [
      { id: "well-sourced", zh: "资料充分", en: "well sourced" },
      { id: "outline-only", zh: "只有大纲", en: "outline only" },
      { id: "topic-only", zh: "只有主题", en: "topic only" },
      { id: "data-heavy", zh: "数据较多", en: "data heavy" },
      { id: "text-heavy", zh: "文字较多", en: "text heavy" },
      { id: "image-heavy", zh: "图片较多", en: "image heavy" },
      { id: "unclear-viewpoint", zh: "观点不明", en: "unclear viewpoint" },
      { id: "needs-research", zh: "需要调研", en: "needs research" }
    ]
  },
  {
    id: "visualStyle",
    zh: "视觉风格",
    en: "Visual style",
    tags: [
      { id: "formal-business", zh: "正式大气", en: "formal business" },
      { id: "finance-steady", zh: "金融稳重", en: "financial steady" },
      { id: "tech-clean", zh: "科技简洁", en: "clean tech" },
      { id: "consulting-report", zh: "咨询报告感", en: "consulting report" },
      { id: "brand-promo", zh: "品牌宣传感", en: "brand promo" },
      { id: "magazine", zh: "杂志感", en: "magazine" },
      { id: "young-vivid", zh: "年轻活泼", en: "young vivid" },
      { id: "government-soe", zh: "政府/国企风", en: "government / SOE" },
      { id: "launch-show", zh: "发布会感", en: "launch show" }
    ]
  },
  {
    id: "layoutDensity",
    zh: "排版密度",
    en: "Layout density",
    tags: [
      { id: "spacious", zh: "极简留白", en: "spacious" },
      { id: "standard-business", zh: "标准商务", en: "standard business" },
      { id: "information-dense", zh: "信息密集", en: "information dense" },
      { id: "text-image-balanced", zh: "图文均衡", en: "text/image balance" },
      { id: "data-dashboard", zh: "数据看板", en: "data dashboard" },
      { id: "story-driven", zh: "故事化叙事", en: "story driven" }
    ]
  },
  {
    id: "assetStrategy",
    zh: "素材策略",
    en: "Asset strategy",
    tags: [
      { id: "official-first", zh: "官方素材优先", en: "official assets first" },
      { id: "ai-visuals", zh: "可用 AI 生图", en: "AI visuals allowed" },
      { id: "ip-compliance", zh: "IP/品牌合规", en: "IP / brand compliant" },
      { id: "avoid-portrait", zh: "避免人物肖像", en: "avoid portraits" },
      { id: "icon-system", zh: "需要图标体系", en: "icon system" },
      { id: "real-scene", zh: "需要实景图片", en: "real scene photos" }
    ]
  },
  {
    id: "outputPreference",
    zh: "输出偏好",
    en: "Output preference",
    tags: [
      { id: "editable-pptx", zh: "默认 PPTX", en: "editable PPTX" },
      { id: "pptx-pdf", zh: "PPTX + PDF", en: "PPTX + PDF" },
      { id: "web-preview", zh: "网页预览", en: "web preview" },
      { id: "editable-first", zh: "可编辑优先", en: "editability first" },
      { id: "visual-impact", zh: "视觉冲击优先", en: "visual impact first" },
      { id: "easy-revision", zh: "便于二次修改", en: "easy to revise" }
    ]
  }
];

const visualBriefPresets: VisualBriefPreset[] = [
  {
    id: "executive-review",
    zh: "高层汇报",
    en: "Executive review",
    descriptionZh: "适合经营复盘、管理层决策、资源投入和风险机会说明。",
    descriptionEn: "For business reviews, management decisions, resource allocation, and risk/opportunity updates.",
    tags: {
      scenario: ["executive-review", "work-report"],
      audience: ["executives", "department-heads"],
      purpose: ["decision", "drive-execution"],
      contentState: ["data-heavy", "well-sourced"],
      visualStyle: ["formal-business", "finance-steady"],
      layoutDensity: ["standard-business", "data-dashboard"],
      assetStrategy: ["official-first", "ip-compliance", "ai-visuals"],
      outputPreference: ["editable-pptx", "editable-first", "easy-revision"]
    }
  },
  {
    id: "client-proposal",
    zh: "客户提案",
    en: "Client proposal",
    descriptionZh: "适合客户方案、合作提案、招商推介和解决方案说明。",
    descriptionEn: "For client solutions, partnership proposals, sales decks, and solution explanation.",
    tags: {
      scenario: ["consulting-proposal"],
      audience: ["customers", "partners"],
      purpose: ["explain-solution", "decision"],
      contentState: ["outline-only", "text-heavy"],
      visualStyle: ["consulting-report", "brand-promo"],
      layoutDensity: ["text-image-balanced", "story-driven"],
      assetStrategy: ["official-first", "ai-visuals", "icon-system"],
      outputPreference: ["editable-pptx", "web-preview", "easy-revision"]
    }
  },
  {
    id: "product-launch",
    zh: "产品发布",
    en: "Product launch",
    descriptionZh: "适合新品介绍、发布会、路演展示和公开传播。",
    descriptionEn: "For launches, product showcases, demo day, and public communication.",
    tags: {
      scenario: ["product-launch"],
      audience: ["customers", "public-media", "investors"],
      purpose: ["public-communication", "showcase"],
      contentState: ["image-heavy", "outline-only"],
      visualStyle: ["launch-show", "tech-clean", "brand-promo"],
      layoutDensity: ["spacious", "story-driven"],
      assetStrategy: ["ai-visuals", "official-first", "real-scene"],
      outputPreference: ["visual-impact", "web-preview", "editable-pptx"]
    }
  },
  {
    id: "training",
    zh: "内部培训",
    en: "Training",
    descriptionZh: "适合员工培训、课程课件、操作说明和知识传达。",
    descriptionEn: "For internal training, courseware, operations guidance, and knowledge transfer.",
    tags: {
      scenario: ["training"],
      audience: ["employees"],
      purpose: ["training-learning", "align-understanding"],
      contentState: ["text-heavy", "well-sourced"],
      visualStyle: ["formal-business", "tech-clean"],
      layoutDensity: ["information-dense", "standard-business"],
      assetStrategy: ["icon-system", "ai-visuals"],
      outputPreference: ["editable-pptx", "easy-revision"]
    }
  },
  {
    id: "research-report",
    zh: "调研报告",
    en: "Research report",
    descriptionZh: "适合调研、专家评审、趋势分析和研究型汇报。",
    descriptionEn: "For research, expert review, trend analysis, and evidence-led reporting.",
    tags: {
      scenario: ["research-report"],
      audience: ["reviewers", "executives"],
      purpose: ["align-understanding", "decision"],
      contentState: ["needs-research", "data-heavy"],
      visualStyle: ["consulting-report", "formal-business"],
      layoutDensity: ["information-dense", "data-dashboard"],
      assetStrategy: ["official-first", "ip-compliance"],
      outputPreference: ["editable-pptx", "pptx-pdf"]
    }
  }
];

const referenceStyleOptions: ReferenceStyleOption[] = [
  {
    id: "consulting-structured",
    zh: "咨询报告感",
    en: "Consulting report",
    descriptionZh: "适合诊断、方案、路线图和客户提案，强调结构清晰、证据分层和结论先行。",
    descriptionEn: "For diagnosis, solutions, roadmaps, and client proposals with clear structure and evidence layers.",
    positiveReferences: ["McKinsey-style issue tree", "BCG-style recommendation memo", "consulting proposal page rhythm"],
    negativeReferences: ["decorative title-card deck", "large unexplained slogans", "flat screenshot-only pages"],
    styleConstraints: ["one takeaway per page", "clear section logic", "editable tables and diagrams", "strong evidence captions"]
  },
  {
    id: "financial-steady",
    zh: "金融稳重",
    en: "Financial steady",
    descriptionZh: "适合银行、保险、国企和管理层汇报，强调可靠、克制、数据清晰和品牌边界。",
    descriptionEn: "For banking, insurance, SOE, and executive reporting with restrained, reliable data presentation.",
    positiveReferences: ["bank executive report", "SOE formal briefing", "financial KPI dashboard"],
    negativeReferences: ["high-saturation launch visuals", "cartoon characters", "unlicensed brand marks"],
    styleConstraints: ["Microsoft YaHei default", "stable grid", "reserved color usage", "official assets first"]
  },
  {
    id: "management-dashboard",
    zh: "经营看板",
    en: "Management dashboard",
    descriptionZh: "适合复盘、KPI、项目进度和风险机会，强调指标层级、趋势对比和行动清单。",
    descriptionEn: "For reviews, KPI updates, project status, and risk/opportunity pages with clear metric hierarchy.",
    positiveReferences: ["executive KPI cockpit", "balanced scorecard", "monthly operating review"],
    negativeReferences: ["dense spreadsheet screenshots", "tiny labels", "mixed chart styles"],
    styleConstraints: ["large numbers with context", "consistent chart grammar", "visible source notes", "decision-ready summary"]
  },
  {
    id: "solution-roadmap",
    zh: "方案路线图",
    en: "Solution roadmap",
    descriptionZh: "适合产品方案、客户解决方案和实施计划，强调现状、路径、阶段和责任。",
    descriptionEn: "For product solutions, client solutions, and implementation plans with state, path, phase, and ownership.",
    positiveReferences: ["solution architecture deck", "implementation roadmap", "service journey map"],
    negativeReferences: ["ambiguous arrows", "decorative process art", "unexplained icons"],
    styleConstraints: ["editable process nodes", "clear owners and timing", "before/after comparison", "action-oriented closing"]
  },
  {
    id: "product-launch-hero",
    zh: "发布会主视觉",
    en: "Launch keynote",
    descriptionZh: "适合发布、路演和公开传播，强调第一视觉、节奏、场景图和传播记忆点。",
    descriptionEn: "For launches, pitches, and public communication with hero visuals, pacing, and memorable scenes.",
    positiveReferences: ["product keynote pacing", "hero image plus simple claim", "demo story flow"],
    negativeReferences: ["long paragraphs", "ordinary office report grid", "unrelated stock photos"],
    styleConstraints: ["AI visual prompt per hero page", "no text inside generated images", "editable titles and captions", "strong contrast hierarchy"]
  },
  {
    id: "courseware-clean",
    zh: "清爽课件",
    en: "Clean courseware",
    descriptionZh: "适合培训、课程和知识传达，强调模块化、可读性、练习页和复盘页。",
    descriptionEn: "For training, courseware, and knowledge transfer with modules, readability, exercises, and recap pages.",
    positiveReferences: ["corporate learning deck", "module-based courseware", "practice-and-recap slides"],
    negativeReferences: ["overdesigned hero pages", "tiny dense manuals", "one-slide-only diagrams"],
    styleConstraints: ["readable body size", "chapter markers", "example boxes", "speaker notes when useful"]
  },
  {
    id: "research-evidence",
    zh: "研究证据型",
    en: "Research evidence",
    descriptionZh: "适合调研、评审、趋势分析和学术答辩，强调来源、方法、限制和结论可信度。",
    descriptionEn: "For research, review panels, trends, and defenses with sources, method, limits, and confidence.",
    positiveReferences: ["research briefing", "expert review deck", "evidence ladder"],
    negativeReferences: ["unsupported claims", "unlabeled charts", "marketing-only language"],
    styleConstraints: ["source captions", "method notes", "limitations visible", "claim-to-evidence mapping"]
  },
  {
    id: "culture-tourism-editorial",
    zh: "文旅杂志感",
    en: "Culture tourism editorial",
    descriptionZh: "适合城市推介、文旅推荐和活动传播，强调真实场景、路线体验和品牌/IP 合规。",
    descriptionEn: "For city promotion, culture tourism, and campaigns with real scenes, journeys, and IP boundaries.",
    positiveReferences: ["city travel magazine", "route recommendation spread", "official destination campaign"],
    negativeReferences: ["generic landscape stock", "fake landmarks", "unlicensed mascot/IP usage"],
    styleConstraints: ["official or user-provided scenes first", "AI scenes must avoid logos/text", "route map readability", "editorial pacing"]
  }
];

const defaultForm: FormState = {
  language: "zh",
  presetId: "executive_business_review",
  sourceType: "mixed",
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
  constraints: "结论先行，减少空话；PPTX 保留可编辑结构；Web Deck 更适合传播；不要上传敏感资料，生成后检查预览和导出文件。",
  visualBrief: makeVisualBriefFromPreset("executive-review")
};

export function App() {
  const [form, setForm] = useState<FormState>(() => loadSavedForm());
  const [activeView, setActiveView] = useState<WorkspaceView>("start");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("webdeck");
  const [copyState, setCopyState] = useState("");
  const [sources, setSources] = useState<UploadedSource[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [bridgeChecking, setBridgeChecking] = useState(false);
  const [bridge, setBridge] = useState<BridgeHealth | null>(null);
  const [bridgeError, setBridgeError] = useState("");
  const [handoffResult, setHandoffResult] = useState<HandoffResult | null>(null);
  const [bridgeMessage, setBridgeMessage] = useState("");
  const [providerTests, setProviderTests] = useState<Record<string, ProviderStatus["lastTest"]>>({});
  const [testingProvider, setTestingProvider] = useState("");
  const [agentCommand, setAgentCommand] = useState("");
  const [installingSkill, setInstallingSkill] = useState("");

  const activePreset = useMemo(() => findPreset(form.presetId), [form.presetId]);
  const t = labels[form.language];
  const storyboard = useMemo(() => buildStoryboard(form), [form]);
  const enginePlan = useMemo(() => buildEnginePlan(form), [form]);
  const qualityContract = useMemo(() => buildQualityContract(form, activePreset, enginePlan), [form, activePreset, enginePlan]);
  const readiness = useMemo(() => scoreBrief(form, sources), [form, sources]);
  const expectationFit = useMemo(() => assessExpectationFit(form, sources), [form, sources]);
  const qualityGate = useMemo(() => buildQualityGate(form, qualityContract, enginePlan), [form, qualityContract, enginePlan]);
  const prompt = useMemo(() => buildPrompt(form, storyboard, enginePlan, sources, qualityContract, qualityGate, expectationFit), [form, storyboard, enginePlan, sources, qualityContract, qualityGate, expectationFit]);
  const sourceTemplate = useMemo(() => buildSourceTemplate(form, storyboard, enginePlan, sources, qualityContract, expectationFit), [form, storyboard, enginePlan, sources, qualityContract, expectationFit]);
  const extractedSource = useMemo(() => buildExtractedSource(form, sources), [form, sources]);
  const qualityChecklist = useMemo(() => buildQualityChecklist(form, enginePlan, sources, qualityContract, qualityGate, expectationFit), [form, enginePlan, sources, qualityContract, qualityGate, expectationFit]);
  const assetPlanObject = useMemo(() => buildAssetPlanObject(form, sources, qualityGate), [form, sources, qualityGate]);
  const assetPlanJson = useMemo(() => JSON.stringify(assetPlanObject, null, 2), [assetPlanObject]);
  const assetPlan = useMemo(() => buildAssetPlan(form, sources, qualityGate), [form, sources, qualityGate]);
  const visualElementKit = useMemo(() => buildVisualElementKit(form, qualityGate), [form, qualityGate]);
  const deckIRPreview = useMemo(() => buildDeckIRPreview(form, storyboard, sources, enginePlan, qualityGate), [form, storyboard, sources, enginePlan, qualityGate]);
  const webDeckHtml = useMemo(() => buildWebDeckHtml(form, storyboard, enginePlan, sources), [form, storyboard, enginePlan, sources]);
  const providers = useMemo(() => mergeProviderTests(bridge?.providers || fallbackProviders(form.language), providerTests), [bridge, form.language, providerTests]);
  const agents = bridge?.agents || fallbackAgents();
  const skillTargets = bridge?.skillTargets?.length ? bridge.skillTargets : fallbackSkillTargets(form.language);
  const bridgeCommand = bridgeStartCommand(bridge);
  const selectedAgent = agents.find((agent) => agent.id === form.agentTool);
  const availableAgents = agents.filter((agent) => agent.available);
  const recommendedAgent = selectedAgent?.available ? selectedAgent : availableAgents[0];
  const consoleInput = {
    readiness: readiness.score,
    sourceCount: sources.length,
    localConnected: Boolean(bridge),
    helperAvailable: Boolean(recommendedAgent?.available),
    projectReady: Boolean(handoffResult)
  };
  const consoleSteps = useMemo(() => getConsoleSteps(consoleInput), [readiness.score, sources.length, bridge, recommendedAgent, handoffResult]);
  const primaryActionId = useMemo(() => getPrimaryActionId(consoleInput), [readiness.score, sources.length, bridge, recommendedAgent, handoffResult]);
  const previewGroup = previewGroupFor(previewMode);
  const workflowSteps = useMemo(() => buildWorkflowSteps({ form, sources, readiness, bridge, selectedAgent, handoffResult, labels: t }), [form, sources, readiness, bridge, selectedAgent, handoffResult, t]);
  const workflowState = useMemo(() => buildWorkflowState(workflowSteps), [workflowSteps]);
  const codexTask = useMemo(() => buildCodexTask(form, enginePlan, sources, qualityGate, workflowState, qualityContract, expectationFit), [form, enginePlan, sources, qualityGate, workflowState, qualityContract, expectationFit]);
  const codexAgentGuide = useMemo(() => buildCodexAgentGuide(form, sources, qualityGate, expectationFit), [form, sources, qualityGate, expectationFit]);
  const qualityReport = useMemo(() => buildQualityReport(form, sources, qualityContract, qualityGate, workflowState, expectationFit), [form, sources, qualityContract, qualityGate, workflowState, expectationFit]);
  const manifest = useMemo(() => buildManifest(form, sources, readiness, enginePlan, bridge, qualityContract, qualityGate, workflowState, expectationFit), [form, sources, readiness, enginePlan, bridge, qualityContract, qualityGate, workflowState, expectationFit]);
  const briefObject = useMemo(() => buildBriefObject(form, storyboard, readiness, enginePlan, sources, qualityContract, qualityGate, workflowState, expectationFit), [form, storyboard, readiness, enginePlan, sources, qualityContract, qualityGate, workflowState, expectationFit]);
  const briefJson = useMemo(() => JSON.stringify(briefObject, null, 2), [briefObject]);
  const manifestJson = useMemo(() => JSON.stringify(manifest, null, 2), [manifest]);
  const visiblePreview =
    previewMode === "prompt"
      ? prompt
      : previewMode === "source"
        ? sourceTemplate
        : previewMode === "extracted"
          ? extractedSource
          : previewMode === "manifest"
            ? manifestJson
            : previewMode === "deckIR"
              ? deckIRPreview
            : previewMode === "brief"
              ? briefJson
              : previewMode === "webdeck"
                ? webDeckHtml
                : previewMode === "qualityReport"
                  ? qualityReport
                  : previewMode === "codexTask"
                    ? codexTask
                    : previewMode === "assetPlan"
                      ? assetPlan
                      : previewMode === "elementKit"
                        ? visualElementKit
                        : qualityChecklist;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    void checkBridge(true);
    const timer = window.setInterval(() => void checkBridge(true), 12000);
    return () => window.clearInterval(timer);
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setCopyState("");
  }

  function applyPreset(presetId: PresetId) {
    const preset = findPreset(presetId);
    const brief = preset.defaultBrief[form.language];
    setForm((current) => ({
      ...current,
      presetId,
      scenario: preset.scenario,
      outputMode: preset.outputMode,
      stylePreset: preset.stylePreset,
      slideCount: String(preset.slideCount),
      title: brief.title,
      audience: brief.audience,
      coreMessage: brief.coreMessage,
      sourceNotes: brief.sourceNotes,
      constraints: brief.constraints,
      visualBrief: current.visualBrief.userEditedTags
        ? current.visualBrief
        : makeVisualBriefFromPreset(visualBriefPresetForContentPreset(presetId), current.visualBrief)
    }));
    setCopyState("");
  }

  function updateVisualBrief(patch: Partial<VisualBrief>) {
    setForm((current) => ({
      ...current,
      visualBrief: normalizeVisualBrief({
        ...current.visualBrief,
        ...patch,
        userEditedTags: true
      })
    }));
    setCopyState("");
  }

  function toggleVisualTag(groupId: VisualTagGroupId, tagId: string) {
    setForm((current) => {
      const selectedTags = normalizeSelectedTags(current.visualBrief.selectedTags);
      const values = new Set(selectedTags[groupId]);
      if (values.has(tagId)) {
        values.delete(tagId);
      } else {
        values.add(tagId);
      }
      return {
        ...current,
        visualBrief: normalizeVisualBrief({
          ...current.visualBrief,
          selectedTags: {
            ...selectedTags,
            [groupId]: Array.from(values)
          },
          userEditedTags: true
        })
      };
    });
    setCopyState("");
  }

  function applyVisualBriefPreset(presetId: string) {
    setForm((current) => ({
      ...current,
      visualBrief: {
        ...makeVisualBriefFromPreset(presetId, current.visualBrief),
        userEditedTags: true
      }
    }));
    setCopyState("");
  }

  async function checkBridge(silent = false): Promise<BridgeHealth | null> {
    setBridgeChecking(true);
    try {
      const response = await fetch(`${bridgeUrl}/health`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as BridgeHealth;
      setBridge(payload);
      setBridgeError("");
      if (!silent) setBridgeMessage(t.bridgeOnline);
      return payload;
    } catch (error) {
      setBridge(null);
      setBridgeError(error instanceof Error ? error.message : "Bridge offline");
      if (!silent) setBridgeMessage(t.bridgeOffline);
      return null;
    } finally {
      setBridgeChecking(false);
    }
  }

  async function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    await addFiles(event.target.files);
    event.target.value = "";
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    await addFiles(event.dataTransfer.files);
  }

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploadError("");
    const next: UploadedSource[] = [];
    for (const file of Array.from(fileList)) {
      try {
        const extension = fileExtension(file.name);
        const isText = isBrowserTextFile(extension, file.type);
        const source: UploadedSource = {
          id: makeId(),
          kind: "file",
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          extension,
          status: isText ? "textExtracted" : "attachedOnly",
          statusText: isText
            ? form.language === "zh" ? "浏览器已预读文本" : "Text pre-read in browser"
            : form.language === "zh" ? "交给本地 Bridge 解析" : "Local Bridge will parse it",
          addedAt: new Date().toISOString()
        };
        if (isText) {
          source.text = await readFileAsText(file);
        } else {
          source.dataBase64 = await readFileAsBase64(file);
        }
        next.push(source);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "File import failed.");
      }
    }
    setSources((current) => [...current, ...next]);
  }

  function addUrl() {
    const value = urlInput.trim();
    if (!value) return;
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    setSources((current) => [
      ...current,
      {
        id: makeId(),
        kind: "url",
        name: normalized,
        type: "text/uri-list",
        size: normalized.length,
        extension: ".url",
        status: "urlOnly",
        statusText: form.language === "zh" ? "交给本地 Bridge 抓取" : "Local Bridge will fetch it",
        url: normalized,
        addedAt: new Date().toISOString()
      }
    ]);
    setUrlInput("");
  }

  function removeSource(id: string) {
    setSources((current) => current.filter((source) => source.id !== id));
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(t.copied);
    } catch {
      setCopyState(t.copyFailed);
    }
  }

  function runPrimaryAction(actionId: PrimaryActionId) {
    if (actionId === "completeBrief" || actionId === "addSources") {
      setActiveView("sources");
      return;
    }
    if (actionId === "connectLocal") {
      setActiveView("configuration");
      void copyText(bridgeCommand);
      void checkBridge(false);
      return;
    }
    if (actionId === "createProject") {
      setActiveView("handoff");
      void sendToBridge();
      return;
    }
    if (actionId === "launchAgent") {
      setActiveView("handoff");
      void launchOrCopyAgent();
      return;
    }
    setActiveView("handoff");
    setPreviewMode("qualityReport");
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
    const zip = await buildHandoffZip({
      sourceTemplate,
      extractedSource,
      prompt,
      briefJson,
      webDeckHtml,
      enginePlanMarkdown: buildEnginePlanMarkdown(form, enginePlan),
      qualityChecklist,
      qualityReport,
      deckIRPreview,
      assetPlan,
      assetPlanJson,
      visualElementKit,
      codexTask,
      codexAgentGuide,
      manifestJson,
      readme: buildKitReadme(form, enginePlan, sources),
      sources
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "handoff-kit.zip";
    link.click();
    URL.revokeObjectURL(url);
    setCopyState(t.kitReady);
  }

  async function sendToBridge() {
    setBridgeMessage("");
    setHandoffResult(null);
    setAgentCommand("");
    try {
      if (!bridge) await checkBridge(false);
      const payload = buildBridgePayload({
        form,
        sourceTemplate,
        extractedSource,
        prompt,
        briefObject,
        webDeckHtml,
        enginePlanMarkdown: buildEnginePlanMarkdown(form, enginePlan),
        qualityChecklist,
        qualityReport,
        deckIRPreview,
        assetPlan,
        assetPlanJson,
        visualElementKit,
        codexTask,
        codexAgentGuide,
        qualityContract,
        qualityGate,
        workflowState,
        readme: buildKitReadme(form, enginePlan, sources),
        sources
      });
      const response = await fetch(`${bridgeUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setHandoffResult(result);
      setBridgeMessage(t.bridgeSendOk);
      setAgentCommand(result.suggestedCommands?.[form.agentTool] || result.suggestedCommands?.codex || "");
      await checkBridge(true);
    } catch (error) {
      setBridgeMessage(`${t.bridgeSendFail}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function launchOrCopyAgent() {
    if (!handoffResult) {
      await sendToBridge();
      return;
    }
    try {
      const response = await fetch(`${bridgeUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: handoffResult.projectPath, agent: form.agentTool })
      });
      const result = await response.json();
      const command = result.command || handoffResult.suggestedCommands?.[form.agentTool] || "";
      setAgentCommand(command);
      if (!result.launched && command) await copyText(command);
      setBridgeMessage(result.launched ? result.message : t.commandReady);
    } catch (error) {
      setBridgeMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function testProvider(providerId: string) {
    setTestingProvider(providerId);
    try {
      const response = await fetch(`${bridgeUrl}/providers/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId })
      });
      const result = await response.json();
      setProviderTests((current) => ({
        ...current,
        [providerId]: { ok: Boolean(result.ok), message: result.message || "", status: result.status }
      }));
    } catch (error) {
      setProviderTests((current) => ({
        ...current,
        [providerId]: { ok: false, message: error instanceof Error ? error.message : String(error) }
      }));
    } finally {
      setTestingProvider("");
    }
  }

  async function testAllProviders() {
    setTestingProvider("all");
    try {
      const health = bridge || await checkBridge(false);
      if (!health) return;
      const configuredProviders = health.providers.filter((provider) => provider.configured);
      if (configuredProviders.length === 0) {
        setBridgeMessage(t.noProviderConfigured);
        return;
      }

      const results: Record<string, ProviderStatus["lastTest"]> = {};
      for (const provider of configuredProviders) {
        const response = await fetch(`${bridgeUrl}/providers/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: provider.id })
        });
        const result = await response.json();
        results[provider.id] = { ok: Boolean(result.ok), message: result.message || "", status: result.status };
      }
      setProviderTests((current) => ({ ...current, ...results }));
      setBridgeMessage(t.commandReady);
    } catch (error) {
      setBridgeMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setTestingProvider("");
    }
  }

  async function autoSelectAgent() {
    const health = bridge || await checkBridge(false);
    const localAgents = health?.agents || agents;
    const currentAgent = localAgents.find((agent) => agent.id === form.agentTool && agent.available);
    const nextAgent = currentAgent || localAgents.find((agent) => agent.available);
    if (!nextAgent) {
      setBridgeMessage(t.autoSelectAgentMissing);
      if (!health) await copyText(bridgeStartCommand(null));
      return;
    }

    update("agentTool", nextAgent.id);
    setBridgeMessage(formatLabel(t.autoSelectAgentOk, nextAgent.label));
  }

  async function copySkillInstallCommand(targetId: SkillTarget) {
    const target = skillTargets.find((item) => item.id === targetId) || fallbackSkillTargets(form.language).find((item) => item.id === targetId);
    await copyText(target?.installCommand || "");
  }

  async function installSkill(targetId: SkillTarget) {
    setInstallingSkill(targetId);
    try {
      const health = bridge || await checkBridge(false);
      if (!health) {
        await copySkillInstallCommand(targetId);
        setBridgeMessage(t.skillInstallNeedsBridge);
        return;
      }

      const response = await fetch(`${bridgeUrl}/skill/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetId })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setBridgeMessage(formatLabel(t.skillInstallOk, result.label || result.targetPath || targetId));
      await checkBridge(true);
    } catch (error) {
      setBridgeMessage(`${t.skillInstallFail}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setInstallingSkill("");
    }
  }

  return (
    <div className="app" data-view={activeView} lang={form.language === "zh" ? "zh-CN" : "en"}>
      <header className="topbar">
        <a className="brand" href={repoUrl} aria-label="Ultimate PPT Master GitHub">
          <img src={`${baseUrl}brand.svg`} alt="" />
          <span>{t.product}</span>
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href={demoUrl}>Demo</a>
          <a href={bridgeDocUrl}>Bridge</a>
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
          <div className="header-rail">
            <QualityWorkbenchPanel
              form={form}
              preset={activePreset}
              readiness={readiness.score}
              sourceCount={sources.length}
              bridge={bridge}
              handoffResult={handoffResult}
              qualityContract={qualityContract}
              labels={t}
            />
            <PrimaryActionBar
              actionId={primaryActionId}
              labels={t}
              onPrimary={() => runPrimaryAction(primaryActionId)}
              onDownload={downloadHandoffKit}
              onCopyPrompt={() => void copyText(prompt)}
              onCopySource={() => void copyText(sourceTemplate)}
              onOpenSettings={() => setActiveView("configuration")}
            />
          </div>
        </section>

        <section className="status-strip" aria-label="Workflow safeguards">
          <span><ShieldCheck size={15} />{t.pagesOnly}</span>
          <span><Server size={15} />{t.bridgeLocal}</span>
          <span><KeyRound size={15} />{t.keySafe}</span>
        </section>

        <ConsoleStepRail
          activeView={activeView}
          steps={consoleSteps}
          labels={t}
          sourceCount={sources.length}
          readiness={readiness.score}
          bridge={bridge}
          handoffResult={handoffResult}
          onChange={setActiveView}
        />

        <PageGuide activeView={activeView} labels={t} />

        <QuickStartConsole
          actionId={primaryActionId}
          steps={consoleSteps}
          labels={t}
          readiness={readiness.score}
          sourceCount={sources.length}
          bridge={bridge}
          selectedAgent={selectedAgent}
          handoffResult={handoffResult}
          onPrimary={() => runPrimaryAction(primaryActionId)}
          onOpenSettings={() => setActiveView("configuration")}
        />

        <AuxiliaryResources labels={t}>
          <BeginnerGuide
            bridge={bridge}
            checking={bridgeChecking}
            selectedAgent={selectedAgent}
            recommendedAgent={recommendedAgent}
            labels={t}
            onCheckBridge={() => void checkBridge(false)}
            onCopyBridgeCommand={() => void copyText(bridgeCommand)}
            onUseRecommendedAgent={() => void autoSelectAgent()}
            onSendBridge={() => void sendToBridge()}
            onLaunchAgent={() => void launchOrCopyAgent()}
          />

          <OneClickRunbookPanel language={form.language} bridgeReady={Boolean(bridge)} readiness={readiness.score} sourceCount={sources.length} />

          <BenchmarkWall language={form.language} />

          <PlainLanguageGlossary labels={t} />

          <section className="value-strip" aria-label={t.whyTitle}>
            <div className="value-intro">
              <p className="eyebrow">{form.language === "zh" ? "Product edge" : "Product edge"}</p>
              <h2>{t.whyTitle}</h2>
              <p>{t.whySubtitle}</p>
            </div>
            <div className="value-grid">
              {t.whyCards.map((item, index) => (
                <article key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        </AuxiliaryResources>

        <SettingsDrawer labels={t} open={activeView === "configuration"}>
          <ConfigurationPage
            bridge={bridge}
            agents={agents}
            providers={providers}
            skillTargets={skillTargets}
            bridgeCommand={bridgeCommand}
            selectedAgent={selectedAgent}
            labels={t}
            testingProvider={testingProvider}
            installingSkill={installingSkill}
            bridgeMessage={bridgeMessage}
            onCheckBridge={() => void checkBridge(false)}
            onCopyBridgeCommand={() => void copyText(bridgeCommand)}
            onAutoSelectAgent={() => void autoSelectAgent()}
            onTestAllProviders={() => void testAllProviders()}
            onSelectAgent={(agentId) => update("agentTool", agentId)}
            onInstallSkill={(targetId) => void installSkill(targetId)}
            onCopySkillCommand={(targetId) => void copySkillInstallCommand(targetId)}
          />
          <section className="panel provider-panel" aria-labelledby="provider-title">
            <div className="preview-shell-heading">
              <PanelTitle icon={Activity} id="provider-title" title={t.providerPanel} />
              <div className="preview-meta">
                <span>{bridge ? t.bridgeOnline : t.bridgeOffline}</span>
                <span>{bridge?.allowLaunch ? t.allowLaunchOn : t.allowLaunchOff}</span>
              </div>
            </div>
            <div className="provider-grid">
              {providers.map((provider) => (
                <article key={provider.id} className={`provider-card ${provider.configured ? "configured" : "missing"}`}>
                  <div>
                    <strong>{provider.label}</strong>
                    <StatusPill
                      ok={provider.configured}
                      okText={t.providerConfigured}
                      failText={t.providerMissing}
                    />
                  </div>
                  <p>{provider.model || provider.baseUrl || provider.envKeys.join(" / ")}</p>
                  <span>{provider.keySource || provider.envKeys.join(" / ")}</span>
                  {provider.lastTest && (
                    <em className={provider.lastTest.ok ? "ok" : "fail"}>{provider.lastTest.message}</em>
                  )}
                  <button className="secondary-action" disabled={!bridge || testingProvider === provider.id || testingProvider === "all"} onClick={() => void testProvider(provider.id)}>
                    <RefreshCw size={16} />
                    {testingProvider === provider.id ? t.bridgeChecking : t.testProvider}
                  </button>
                </article>
              ))}
            </div>
            <div className="agent-grid">
              {agents.map((agent) => (
                <article key={agent.id} className="agent-card">
                  <strong>{agent.label}</strong>
                  <StatusPill ok={agent.available} okText={t.agentAvailable} failText={t.agentMissing} />
                  <code>{agent.command}</code>
                </article>
              ))}
            </div>
          </section>
        </SettingsDrawer>

        <section className="studio-grid">
          <section className="panel source-panel" aria-labelledby="source-title">
            <PanelTitle icon={UploadCloud} id="source-title" title={t.sourcePanel} />
            <div
              className="drop-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <FileInput size={24} />
              <strong>{t.dropTitle}</strong>
              <span>{t.dropHint}</span>
              <label className="file-button">
                {t.chooseFiles}
                <input
                  type="file"
                  multiple
                  accept=".md,.markdown,.txt,.pdf,.doc,.docx,.ppt,.pptx,.pptm,.xls,.xlsx,.xlsm,.csv,.json,.html"
                  onChange={handleFileInput}
                />
              </label>
            </div>
            {uploadError && <p className="error-text">{uploadError}</p>}
            <div className="url-row">
              <label>
                {t.sourceUrl}
                <input value={urlInput} onChange={(event) => setUrlInput(event.target.value)} placeholder="https://..." />
              </label>
              <button className="secondary-action" onClick={addUrl}>
                <Link2 size={17} />
                {t.addUrl}
              </button>
            </div>
            <SourceList sources={sources} labels={t} onRemove={removeSource} />
            <label className="notes-label">
              {t.sourceNotes}
              <textarea className="large-input" value={form.sourceNotes} onChange={(event) => update("sourceNotes", event.target.value)} />
            </label>
            <VisualBriefBuilder
              form={form}
              expectationFit={expectationFit}
              labels={t}
              onApplyPreset={applyVisualBriefPreset}
              onToggleTag={toggleVisualTag}
              onUpdateBrief={updateVisualBrief}
            />
            <WebDeckAssetFactoryPanel
              form={form}
              webDeck={buildWebDeckPlan(form, sources)}
              onSelectStyle={(style) => update("stylePreset", style)}
              onSetMapPage={() => update("constraints", appendConstraint(form.constraints, form.language === "zh" ? "需要地图页或地点关系页，优先使用 Swiss Map / S08 关系图。" : "Include a map or location-relationship page, preferably Swiss Map / S08."))}
              onSetCoverDerivative={() => update("constraints", appendConstraint(form.constraints, form.language === "zh" ? "需要封面衍生图，可用于多平台封面但不得生成假 logo 或内嵌标题。" : "Create a cover derivative for multi-platform cover use, without fake logos or embedded titles."))}
              onSetGeneratedImages={() => update("constraints", appendConstraint(form.constraints, form.language === "zh" ? "需要生成配图；先写 asset_plan.json，再生成 image_prompts.json，Generated 状态必须写 current_generation_evidence。" : "Generate supporting visuals; write asset_plan.json first, then image_prompts.json, and require current_generation_evidence for Generated assets."))}
            />
            <details className="advanced-settings">
              <summary>
                <strong>{t.advancedSettings}</strong>
                <span>{t.advancedSettingsText}</span>
              </summary>
              <div className="control-grid">
                <SelectField label={t.contentPreset} value={form.presetId} onChange={(value) => applyPreset(value as PresetId)} options={presetOptions(form.language)} />
                <SelectField label={t.sourceType} value={form.sourceType} onChange={(value) => update("sourceType", value as SourceType)} options={toOptions(optionText.sourceType, form.language)} />
                <SelectField label={t.scenario} value={form.scenario} onChange={(value) => update("scenario", value as Scenario)} options={toOptions(optionText.scenario, form.language)} />
                <SelectField label={t.outputMode} value={form.outputMode} onChange={(value) => update("outputMode", value as OutputMode)} options={toOptions(optionText.outputMode, form.language)} />
                <SelectField label={t.stylePreset} value={form.stylePreset} onChange={(value) => update("stylePreset", value as StylePreset)} options={toOptions(optionText.stylePreset, form.language)} />
              </div>
            </details>
          </section>

          <section className="panel structure-panel" aria-labelledby="structure-title">
            <PanelTitle icon={Sparkles} id="structure-title" title={t.structurePanel} />
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
                {t.constraints}
                <textarea className="medium-input" value={form.constraints} onChange={(event) => update("constraints", event.target.value)} />
              </label>
            </div>
            <div className="readiness">
              <div>
                <span>{t.readiness}</span>
                <strong>{readiness.score}%</strong>
              </div>
              <div className="meter" aria-hidden="true">
                <span style={{ width: `${readiness.score}%` }} />
              </div>
            </div>
            <ExpectationFitCard expectationFit={expectationFit} labels={t} />
            <details className="advanced-settings">
              <summary>
                <strong>{t.advancedSettings}</strong>
                <span>{t.advancedSettingsText}</span>
              </summary>
              <div className="control-grid">
                <SelectField label={t.agentTool} value={form.agentTool} onChange={(value) => update("agentTool", value as AgentTool)} options={toOptions(optionText.agentTool, form.language)} />
                <SelectField label={t.modelPreference} value={form.modelPreference} onChange={(value) => update("modelPreference", value as ModelPreference)} options={toOptions(optionText.modelPreference, form.language)} />
              </div>
              <PresetSummary preset={activePreset} language={form.language} labels={t} />
              <DesignDoctorPanel qualityContract={qualityContract} labels={t} />
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
                    title={form.language === "zh" ? "Ultimate Fusion / Agent Connect" : "Ultimate Fusion / Agent Connect"}
                    text={enginePlan.fusionRoute}
                  />
                </div>
              </div>
            </details>
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

          <BestRoutePanel form={form} enginePlan={enginePlan} qualityGate={qualityGate} labels={t} />
          <AIPageMapPanel deckIRPreview={deckIRPreview} labels={t} />
          <RenderedReviewLoopPanel form={form} qualityGate={qualityGate} labels={t} />

          <section className="panel handoff-panel" aria-labelledby="handoff-title">
            <PanelTitle icon={PlugZap} id="handoff-title" title={t.handoffPanel} />
            <BridgeStatusCard
              bridge={bridge}
              checking={bridgeChecking}
              error={bridgeError}
              labels={t}
              bridgeCommand={bridgeCommand}
              onRefresh={() => void checkBridge(false)}
            />
            <button className="primary-action full" onClick={() => runPrimaryAction(primaryActionId)}>
              {primaryActionIcon(primaryActionId)}
              {primaryActionLabel(primaryActionId, t)}
            </button>
            <details className="advanced-settings command-details">
              <summary>
                <strong>{t.moreActions}</strong>
                <span>{t.handoffExecutionTitle}</span>
              </summary>
              <HandoffExecutionPanel
                bridge={bridge}
                handoffResult={handoffResult}
                agentCommand={agentCommand || handoffResult?.suggestedCommands?.[form.agentTool] || handoffResult?.suggestedCommands?.codex || ""}
                bridgeCommand={bridgeCommand}
                labels={t}
                onCopy={copyText}
              />
              <button className="secondary-action full" onClick={() => copyText(prompt)}>
                <Clipboard size={18} />
                {copyState || t.copyPrompt}
              </button>
              <button className="secondary-action full" onClick={downloadHandoffKit}>
                <FileArchive size={18} />
                {t.downloadKit}
              </button>
            </details>
            {bridgeMessage && <p className="bridge-message">{bridgeMessage}</p>}
            {handoffResult && (
              <div className="handoff-result">
                <strong>{t.openFolder}</strong>
                <code>{handoffResult.projectPath}</code>
                <span>{handoffResult.files.length} files</span>
              </div>
            )}
            <details className="advanced-settings kit-details">
              <summary>
                <strong>{t.kitIncludes}</strong>
                <span>{handoffResult ? `${handoffResult.files.length} files` : t.handoffNotCreated}</span>
              </summary>
              <div className="kit-box">
                <strong>{t.generatedNowTitle}</strong>
                <span>source.md</span>
                <span>extracted-source.md</span>
                <span>attachments/</span>
                <span>manifest.json</span>
                <span>storyboard.json</span>
                <span>source-map.json</span>
                <span>planning-report.json</span>
                <span>review-findings.json</span>
                <span>repair-plan.json</span>
                <span>agent-prompt.md</span>
                <span>project-brief.json</span>
                <span>preview-web-deck.html</span>
                <span>engine-plan.md</span>
                <span>quality-checklist.md</span>
                <span>asset-plan.md</span>
                <span>visual-element-kit.md</span>
                <span>codex-task.md</span>
                <span>AGENTS.md</span>
                <span>quality-report.json</span>
              </div>
              <div className="kit-box">
                <strong>{t.codexNextTitle}</strong>
                <span>assets/generated/element-manifest.json</span>
                <span>images/image_prompts.json</span>
                <span>images/image_prompts.md</span>
                <span>final PPTX / Web Deck outputs</span>
                <span>updated asset-plan.md</span>
                <span>updated quality-report.json</span>
              </div>
              <div className="route-list">
                <InfoRow icon={MonitorPlay} title={t.demoTitle} text={t.demoText} />
                <InfoRow icon={BookOpen} title={t.skillTitle} text={t.skillText} />
                <InfoRow icon={FileText} title={t.desktopTitle} text={t.desktopText} />
              </div>
              <a className="secondary-action full" href={demoUrl}>
                <ExternalLink size={18} />
                {t.openDemo}
              </a>
              <a className="secondary-action full" href={skillDocUrl}>
                <BookOpen size={18} />
                {t.skillSetup}
              </a>
            </details>
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
          <GroupedPreviewTabs
            activeGroup={previewGroup}
            activeMode={previewMode}
            labels={t}
            onSelectGroup={(group) => setPreviewMode(previewGroupModes[group][0])}
            onSelectMode={setPreviewMode}
          />
          <div className="preview-actions">
            <button className="secondary-action" onClick={() => copyText(visiblePreview)}>
              <Clipboard size={17} />
              {copyState || t.copyPreview}
            </button>
            <button className="secondary-action" onClick={() => downloadText("source.md", sourceTemplate)}>
              <Download size={17} />
              {t.downloadSource}
            </button>
            <button className="secondary-action" onClick={() => downloadText("preview-web-deck.html", webDeckHtml, "text/html;charset=utf-8")}>
              <MonitorPlay size={17} />
              {t.downloadWebDeck}
            </button>
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

function BestRoutePanel({ form, enginePlan, qualityGate, labels: t }: { form: FormState; enginePlan: EnginePlan; qualityGate: QualityGate; labels: typeof labels.zh }) {
  const zh = form.language === "zh";
  const route = enginePlan.pptxActive && enginePlan.webActive
    ? (zh ? "PPTX + Web Deck 双版本" : "PPTX + Web Deck")
    : enginePlan.pptxActive
      ? (zh ? "可编辑 PPTX" : "Editable PPTX")
      : "Web Deck";
  return (
    <section className="panel route-panel" aria-labelledby="best-route-title">
      <PanelTitle icon={Sparkles} id="best-route-title" title={zh ? "一键最佳路线" : "AI best route"} />
      <div className="route-list">
        <InfoRow icon={Workflow} title={route} text={enginePlan.fusionRoute} />
        <InfoRow icon={ShieldCheck} title={qualityGate.level} text={zh ? "DeckIR 先锁页面角色、证据、页面配方和可编辑边界，再交给本地 AI 助手生产。" : "DeckIR locks page roles, evidence, recipes, and editability before local AI-helper production."} />
        <InfoRow icon={FileText} title={t.reviewCommands} text={qualityGate.reviewCommands.join(" / ")} />
      </div>
    </section>
  );
}

function AIPageMapPanel({ deckIRPreview, labels: t }: { deckIRPreview: string; labels: typeof labels.zh }) {
  const parsed = safeJson(deckIRPreview) as {
    "storyboard.json"?: { slides?: Array<{ page: string; role: string; title: string; recipeId: string; evidenceRefs: string[]; rasterPolicy: string }> };
    "planning-report.json"?: { summary?: { roles?: string[]; layoutFamilies?: string[] } };
  };
  const slides = parsed["storyboard.json"]?.slides || [];
  const summary = parsed["planning-report.json"]?.summary;
  return (
    <section className="panel page-map-panel" aria-labelledby="ai-page-map-title">
      <PanelTitle icon={Workflow} id="ai-page-map-title" title={t.previewDeckIR} />
      <div className="preview-meta">
        <span>storyboard.json</span>
        <span>source-map.json</span>
        <span>planning-report.json</span>
        <span>review-findings.json</span>
        <span>repair-plan.json</span>
        <span>revision-brief.md</span>
      </div>
      <div className="story-list">
        {slides.slice(0, 8).map((slide) => (
          <article key={slide.page} className="story-row">
            <span>{slide.page}</span>
            <div>
              <strong>{slide.title}</strong>
              <p>{slide.role} / {slide.recipeId} / {slide.rasterPolicy} / evidence {slide.evidenceRefs.join(", ")}</p>
            </div>
          </article>
        ))}
      </div>
      {summary && (
        <p className="hint">
          {summary.roles?.join(", ")} · {summary.layoutFamilies?.join(", ")}
        </p>
      )}
    </section>
  );
}

function RenderedReviewLoopPanel({ form, qualityGate, labels: t }: { form: FormState; qualityGate: QualityGate; labels: typeof labels.zh }) {
  const zh = form.language === "zh";
  const dryRun = "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run";
  return (
    <section className="panel page-map-panel" aria-labelledby="rendered-review-loop-title">
      <PanelTitle icon={RefreshCw} id="rendered-review-loop-title" title={zh ? "渲染审阅闭环" : "Rendered review loop"} />
      <p className="panel-copy">
        {zh
          ? "预览或导出后，先用 review_rendered_deck.py 生成问题和低风险修复候选；默认只 dry-run，用户确认后才写入规划提示。"
          : "After preview or export, review_rendered_deck.py creates findings and low-risk repair candidates; repair stays dry-run until the user confirms."}
      </p>
      <div className="quality-chip-row">
        <InfoRow icon={AlertCircle} title="review-findings.json" text={zh ? "记录问题、建议、风险等级和修复候选。" : "Records findings, suggestions, risk levels, and repair candidates."} />
        <InfoRow icon={FileText} title="repair-plan.json" text={zh ? "只包含低风险规划修复，不自动改事实内容。" : "Contains low-risk planning repairs only; source facts stay unchanged."} />
        <InfoRow icon={FileText} title="revision-brief.md" text={zh ? "用户确认 safe apply 后生成二次修订 brief。" : "Generated after confirmed safe apply for the second pass."} />
        <InfoRow icon={ShieldCheck} title={qualityGate.level} text={dryRun} />
      </div>
    </section>
  );
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function PrimaryActionBar({
  actionId,
  labels: t,
  onPrimary,
  onDownload,
  onCopyPrompt,
  onCopySource,
  onOpenSettings
}: {
  actionId: PrimaryActionId;
  labels: typeof labels.zh;
  onPrimary: () => void;
  onDownload: () => void;
  onCopyPrompt: () => void;
  onCopySource: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="primary-action-bar">
      <button className="primary-action" onClick={onPrimary}>
        {primaryActionIcon(actionId)}
        {primaryActionLabel(actionId, t)}
      </button>
      <details className="more-actions-menu">
        <summary>{t.moreActions}</summary>
        <button onClick={onOpenSettings}>
          <Server size={16} />
          {t.navConfig}
        </button>
        <button onClick={onDownload}>
          <Download size={16} />
          {t.downloadKit}
        </button>
        <button onClick={onCopyPrompt}>
          <Clipboard size={16} />
          {t.copyPrompt}
        </button>
        <button onClick={onCopySource}>
          <FileText size={16} />
          {t.copySource}
        </button>
      </details>
    </div>
  );
}

function primaryActionLabel(actionId: PrimaryActionId, t: typeof labels.zh) {
  const copy: Record<PrimaryActionId, string> = {
    completeBrief: t.primaryCompleteBrief,
    addSources: t.primaryAddSources,
    connectLocal: t.primaryConnectLocal,
    createProject: t.primaryCreateProject,
    launchAgent: t.primaryLaunchAgent,
    reviewDelivery: t.primaryReviewDelivery
  };
  return copy[actionId];
}

function primaryActionIcon(actionId: PrimaryActionId) {
  const icons: Record<PrimaryActionId, ReactNode> = {
    completeBrief: <Sparkles size={18} />,
    addSources: <UploadCloud size={18} />,
    connectLocal: <Clipboard size={18} />,
    createProject: <FolderOpen size={18} />,
    launchAgent: <Play size={18} />,
    reviewDelivery: <ShieldCheck size={18} />
  };
  return icons[actionId];
}

function ConsoleStepRail({
  activeView,
  steps,
  labels: t,
  sourceCount,
  readiness,
  bridge,
  handoffResult,
  onChange
}: {
  activeView: WorkspaceView;
  steps: ConsoleStep[];
  labels: typeof labels.zh;
  sourceCount: number;
  readiness: number;
  bridge: BridgeHealth | null;
  handoffResult: HandoffResult | null;
  onChange: (view: WorkspaceView) => void;
}) {
  const items: Array<{ id: WorkspaceView; label: string; meta: string; icon: LucideIcon }> = [
    { id: "start", label: t.navStart, meta: bridge ? t.bridgeOnline : t.bridgeOffline, icon: Sparkles },
    { id: "sources", label: t.navSources, meta: sourceProgressLabel(sourceCount, readiness, t), icon: UploadCloud },
    { id: "configuration", label: t.navConfig, meta: bridge ? t.bridgeOnline : t.bridgeOffline, icon: Server },
    { id: "handoff", label: t.navHandoff, meta: handoffProgressLabel(handoffResult, t), icon: PlugZap }
  ];
  const statusById = new Map(steps.map((step) => [step.id, step.status]));

  return (
    <nav className="console-step-rail" aria-label="Workspace sections">
      {items.map((item, index) => {
        const Icon = item.icon;
        const status = statusById.get(item.id) || "ready";
        return (
          <button key={item.id} className={`${activeView === item.id ? "active" : ""} ${status}`} onClick={() => onChange(item.id)}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <Icon size={17} />
            <span>{item.label}</span>
            <small>{item.meta}</small>
          </button>
        );
      })}
    </nav>
  );
}

function QuickStartConsole({
  actionId,
  steps,
  labels: t,
  readiness,
  sourceCount,
  bridge,
  selectedAgent,
  handoffResult,
  onPrimary,
  onOpenSettings
}: {
  actionId: PrimaryActionId;
  steps: ConsoleStep[];
  labels: typeof labels.zh;
  readiness: number;
  sourceCount: number;
  bridge: BridgeHealth | null;
  selectedAgent?: AgentStatus;
  handoffResult: HandoffResult | null;
  onPrimary: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <section className="quick-console" aria-label={t.quickConsoleTitle}>
      <div className="quick-console-main">
        <p className="eyebrow">Quick start</p>
        <h2>{t.quickConsoleTitle}</h2>
        <p>{t.quickConsoleText}</p>
        <button className="primary-action" onClick={onPrimary}>
          {primaryActionIcon(actionId)}
          {primaryActionLabel(actionId, t)}
        </button>
      </div>
      <div className="quick-console-status">
        <InfoRow icon={Sparkles} title={t.readiness} text={`${readiness}%`} />
        <InfoRow icon={UploadCloud} title={t.navSources} text={sourceCount > 0 ? `${sourceCount} files` : t.noRealSourcesYet} />
        <InfoRow icon={Server} title={t.navConfig} text={bridge ? t.bridgeOnline : t.bridgeOffline} />
        <InfoRow icon={PlugZap} title={t.selectedAgent} text={selectedAgent?.available ? selectedAgent.label : t.agentNotDetected} />
        <InfoRow icon={FolderOpen} title={t.openFolder} text={handoffResult?.projectPath || t.handoffNotCreated} />
      </div>
      <ol className="quick-step-list">
        {steps.map((step, index) => (
          <li key={step.id} className={step.status}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stepLabel(step.id, t)}</strong>
            <em>{workflowStatusLabel(step.status, t)}</em>
          </li>
        ))}
      </ol>
      <button className="secondary-action quick-settings" onClick={onOpenSettings}>
        <Server size={17} />
        {t.navConfig}
      </button>
    </section>
  );
}

function stepLabel(stepId: ConsoleStepId, t: typeof labels.zh) {
  const copy: Record<ConsoleStepId, string> = {
    start: t.navStart,
    sources: t.navSources,
    configuration: t.navConfig,
    handoff: t.navHandoff
  };
  return copy[stepId];
}

function SettingsDrawer({ labels: t, open, children }: { labels: typeof labels.zh; open: boolean; children: ReactNode }) {
  return (
    <details className="settings-drawer" open={open}>
      <summary>
        <span>{t.setupTitle}</span>
        <p>{t.setupSubtitle}</p>
      </summary>
      <div className="settings-drawer-body">{children}</div>
    </details>
  );
}

function GroupedPreviewTabs({
  activeGroup,
  activeMode,
  labels: t,
  onSelectGroup,
  onSelectMode
}: {
  activeGroup: PreviewGroup;
  activeMode: PreviewMode;
  labels: typeof labels.zh;
  onSelectGroup: (group: PreviewGroup) => void;
  onSelectMode: (mode: PreviewMode) => void;
}) {
  const groups: PreviewGroup[] = ["user", "agent", "quality"];
  return (
    <div className="grouped-preview-tabs">
      <div className="preview-group-tabs" role="tablist">
        {groups.map((group) => (
          <button key={group} className={activeGroup === group ? "active" : ""} onClick={() => onSelectGroup(group)}>
            {previewGroupLabel(group, t)}
          </button>
        ))}
      </div>
      <div className="preview-tabs compact" role="tablist">
        {previewGroupModes[activeGroup].map((mode) => (
          <button key={mode} className={activeMode === mode ? "active" : ""} onClick={() => onSelectMode(mode)}>
            {previewModeLabel(mode, t)}
          </button>
        ))}
      </div>
    </div>
  );
}

function previewGroupLabel(group: PreviewGroup, t: typeof labels.zh) {
  const copy: Record<PreviewGroup, string> = {
    user: t.previewGroupUser,
    agent: t.previewGroupAgent,
    quality: t.previewGroupQuality
  };
  return copy[group];
}

function previewModeLabel(mode: PreviewMode, t: typeof labels.zh) {
  const copy: Record<PreviewMode, string> = {
    webdeck: t.previewWebDeck,
    source: t.previewSource,
    prompt: t.previewPrompt,
    brief: t.previewBrief,
    extracted: t.previewExtracted,
    manifest: t.previewManifest,
    deckIR: t.previewDeckIR,
    codexTask: t.previewCodexTask,
    assetPlan: t.previewAssetPlan,
    elementKit: t.previewElementKit,
    checklist: t.previewChecklist,
    qualityReport: t.previewQualityReport
  };
  return copy[mode];
}

function PageGuide({ activeView, labels: t }: { activeView: WorkspaceView; labels: typeof labels.zh }) {
  const copy = {
    start: { title: t.startGuideTitle, text: t.startGuideText },
    sources: { title: t.sourceGuideTitle, text: t.sourceGuideText },
    configuration: { title: t.configGuideTitle, text: t.configGuideText },
    handoff: { title: t.handoffGuideTitle, text: t.handoffGuideText }
  }[activeView];

  return (
    <section className="page-guide" aria-label={copy.title}>
      <strong>{copy.title}</strong>
      <p>{copy.text}</p>
    </section>
  );
}

function AuxiliaryResources({ labels: t, children }: { labels: typeof labels.zh; children: ReactNode }) {
  return (
    <details className="auxiliary-resources">
      <summary>
        <span>{t.auxiliaryTitle}</span>
        <p>{t.auxiliaryText}</p>
      </summary>
      <div className="auxiliary-content">{children}</div>
    </details>
  );
}

function GuidedWorkflowPanel({
  steps,
  labels: t,
  onOpenSources,
  onCopyBridgeCommand,
  onCheckBridge,
  onAutoSelectAgent,
  onSendBridge,
  onLaunchAgent,
  onOpenReview
}: {
  steps: WorkflowStep[];
  labels: typeof labels.zh;
  onOpenSources: () => void;
  onCopyBridgeCommand: () => void;
  onCheckBridge: () => void;
  onAutoSelectAgent: () => void;
  onSendBridge: () => void;
  onLaunchAgent: () => void;
  onOpenReview: () => void;
}) {
  const activeStep = steps.find((step) => step.status === "active" || step.status === "blocked" || step.status === "ready") || steps[steps.length - 1];
  if (!activeStep) return null;
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStep.id));
  const actionMap: Record<WorkflowStepId, () => void> = {
    brief: onOpenSources,
    sources: onOpenSources,
    bridge: activeStep.status === "blocked" ? onCopyBridgeCommand : onCheckBridge,
    agent: onAutoSelectAgent,
    handoff: onSendBridge,
    review: activeStep.status === "complete" ? onOpenReview : onLaunchAgent
  };

  return (
    <section className="guided-workflow" aria-label={t.wizardTitle}>
      <div className="guided-workflow-head">
        <div>
          <p className="eyebrow">{t.formalBusinessQualityGate}</p>
          <h2>{t.wizardTitle}</h2>
          <p>{t.wizardSubtitle}</p>
        </div>
        <button className="primary-action" onClick={actionMap[activeStep.id]}>
          <ChevronIcon />
          {activeStep.action}
        </button>
      </div>
      <article className={`guided-current-step ${activeStep.status}`}>
        <span>{t.wizardCurrent} · {String(activeIndex + 1).padStart(2, "0")} · {workflowStatusLabel(activeStep.status, t)}</span>
        <strong>{activeStep.title}</strong>
        <p>{activeStep.detail}</p>
      </article>
      <ol className="guided-step-rail">
        {steps.map((step, index) => (
          <li key={step.id} className={step.status}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            <em>{workflowStatusLabel(step.status, t)}</em>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ChevronIcon() {
  return <ExternalLink size={17} />;
}

function workflowStatusLabel(status: StepStatus, t: typeof labels.zh) {
  if (status === "complete") return t.statusComplete;
  if (status === "blocked") return t.statusBlocked;
  if (status === "active") return t.statusActive;
  if (status === "ready") return t.statusReady;
  return t.statusLocked;
}

function ConfigurationPage({
  bridge,
  agents,
  providers,
  skillTargets,
  bridgeCommand,
  selectedAgent,
  labels: t,
  testingProvider,
  installingSkill,
  bridgeMessage,
  onCheckBridge,
  onCopyBridgeCommand,
  onAutoSelectAgent,
  onTestAllProviders,
  onSelectAgent,
  onInstallSkill,
  onCopySkillCommand
}: {
  bridge: BridgeHealth | null;
  agents: AgentStatus[];
  providers: ProviderStatus[];
  skillTargets: SkillTargetStatus[];
  bridgeCommand: string;
  selectedAgent?: AgentStatus;
  labels: typeof labels.zh;
  testingProvider: string;
  installingSkill: string;
  bridgeMessage: string;
  onCheckBridge: () => void;
  onCopyBridgeCommand: () => void;
  onAutoSelectAgent: () => void;
  onTestAllProviders: () => void;
  onSelectAgent: (agent: AgentTool) => void;
  onInstallSkill: (target: SkillTarget) => void;
  onCopySkillCommand: (target: SkillTarget) => void;
}) {
  const configuredProviders = providers.filter((provider) => provider.configured).length;
  const availableAgents = agents.filter((agent) => agent.available).length;
  const installedSkills = skillTargets.filter((target) => target.installed).length;
  const bridgeReady = Boolean(bridge);

  return (
    <section className="configuration-page">
      <div className="configuration-hero">
        <div>
          <p className="eyebrow">{t.navConfig}</p>
          <h2>{t.setupTitle}</h2>
          <p>{t.setupSubtitle}</p>
        </div>
        {bridgeReady ? (
          <div className="configuration-actions">
            <button className="primary-action" onClick={onTestAllProviders}>
              <RefreshCw size={18} />
              {testingProvider === "all" ? t.bridgeChecking : t.oneClickDetect}
            </button>
            <button className="secondary-action" onClick={onAutoSelectAgent}>
              <PlugZap size={18} />
              {t.oneClickConfig}
            </button>
          </div>
        ) : (
          <div className="configuration-actions">
            <button className="primary-action" onClick={onCopyBridgeCommand}>
              <Clipboard size={18} />
              {t.copyBridgeCommand}
            </button>
          </div>
        )}
      </div>
      <div className="setup-grid">
        <article className={bridgeReady ? "ready" : "waiting"}>
          <Server size={19} />
          <strong>{t.bridgeStartTitle}</strong>
          <p>{t.bridgeStartText}</p>
          <StatusPill ok={bridgeReady} okText={t.bridgeOnline} failText={t.bridgeOffline} />
          <code>{bridgeCommand}</code>
          <div className="setup-actions">
            <button className="secondary-action" onClick={onCheckBridge}>{t.refreshBridge}</button>
            <button className="secondary-action" onClick={onCopyBridgeCommand}>{t.copyBridgeCommand}</button>
          </div>
        </article>
        {bridgeReady && (
          <>
            <article className={availableAgents > 0 ? "ready" : "waiting"}>
              <PlugZap size={19} />
              <strong>{t.agentSetupTitle}</strong>
              <p>{t.agentSetupText}</p>
              <StatusPill ok={availableAgents > 0} okText={`${availableAgents} ${t.agentAvailable}`} failText={t.agentMissing} />
              <select value={selectedAgent?.id || "generic"} onChange={(event) => onSelectAgent(event.target.value as AgentTool)}>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.label} · {agent.available ? t.agentAvailable : t.agentMissing}
                  </option>
                ))}
              </select>
              <code>{selectedAgent?.path || selectedAgent?.command || "agent"}</code>
            </article>
            <article className={configuredProviders > 0 ? "ready" : "waiting"}>
              <KeyRound size={19} />
              <strong>{t.modelSetupTitle}</strong>
              <p>{t.modelSetupText}</p>
              <StatusPill ok={configuredProviders > 0} okText={`${configuredProviders} ${t.providerConfigured}`} failText={t.providerMissing} />
              <div className="provider-mini-list">
                {providers.map((provider) => (
                  <span key={provider.id}>{provider.label}: {provider.configured ? t.providerConfigured : t.providerMissing}</span>
                ))}
              </div>
            </article>
            <article className={installedSkills > 0 ? "ready" : "waiting"}>
              <BookOpen size={19} />
              <strong>{t.skillInstallTitle}</strong>
              <p>{t.skillInstallText}</p>
              <StatusPill ok={installedSkills > 0} okText={`${installedSkills} ${t.skillInstalled}`} failText={t.skillMissing} />
              <div className="provider-mini-list">
                {skillTargets.map((target) => (
                  <span key={target.id}>
                    {target.label}: {target.installed ? t.skillInstalled : t.skillMissing} · {target.managed ? t.skillManaged : t.skillManual}
                  </span>
                ))}
              </div>
              <div className="setup-actions">
                <button className="secondary-action" disabled={Boolean(installingSkill)} onClick={() => onInstallSkill("codex")}>
                  {installingSkill === "codex" ? t.installingSkill : t.installCodexSkill}
                </button>
                <button className="secondary-action" disabled={Boolean(installingSkill)} onClick={() => onInstallSkill("generic")}>
                  {installingSkill === "generic" ? t.installingSkill : t.installGenericSkill}
                </button>
                <button className="secondary-action" onClick={() => onCopySkillCommand("codex")}>{t.copyCodexSkillCommand}</button>
                <button className="secondary-action" onClick={() => onCopySkillCommand("generic")}>{t.copyGenericSkillCommand}</button>
              </div>
            </article>
          </>
        )}
      </div>
      {bridgeMessage && <p className="bridge-message">{bridgeMessage}</p>}
    </section>
  );
}

function BeginnerGuide({
  bridge,
  checking,
  selectedAgent,
  recommendedAgent,
  labels: t,
  onCheckBridge,
  onCopyBridgeCommand,
  onUseRecommendedAgent,
  onSendBridge,
  onLaunchAgent
}: {
  bridge: BridgeHealth | null;
  checking: boolean;
  selectedAgent?: AgentStatus;
  recommendedAgent?: AgentStatus;
  labels: typeof labels.zh;
  onCheckBridge: () => void;
  onCopyBridgeCommand: () => void;
  onUseRecommendedAgent: () => void;
  onSendBridge: () => void;
  onLaunchAgent: () => void;
}) {
  const bridgeReady = Boolean(bridge);
  const agentReady = Boolean(recommendedAgent?.available);
  const agentName = recommendedAgent?.label || selectedAgent?.label || "Agent";
  const agentDetail = agentReady
    ? recommendedAgent?.path || recommendedAgent?.command || agentName
    : bridgeReady
      ? t.agentNotDetected
      : t.agentWaiting;

  return (
    <section className={`beginner-guide ${bridgeReady ? "online" : "offline"}`} aria-label={t.firstStepTitle}>
      <div className="beginner-hero">
        <span className="guide-badge">{bridgeReady ? t.bridgeOnline : t.bridgeOffline}</span>
        <h2>{t.firstStepTitle}</h2>
        <p>{bridgeReady ? t.firstStepSubtitleReady : t.firstStepSubtitle}</p>
        <div className="beginner-actions">
          <button className="primary-action" onClick={bridgeReady ? onSendBridge : onCopyBridgeCommand}>
            {bridgeReady ? <FolderOpen size={18} /> : <Clipboard size={18} />}
            {bridgeReady ? t.sendBridge : t.copyBridgeCommand}
          </button>
          <button className="secondary-action" onClick={onCheckBridge}>
            <RefreshCw size={18} />
            {checking ? t.bridgeChecking : t.refreshBridge}
          </button>
          {bridgeReady && (
            <button className="secondary-action" onClick={onLaunchAgent}>
              <Play size={18} />
              {t.launchAgent}
            </button>
          )}
        </div>
      </div>
      <div className="beginner-steps">
        <article>
          <span>01</span>
          <strong>{t.firstStepBrief}</strong>
          <p>{t.firstStepBriefText}</p>
        </article>
        <article>
          <span>02</span>
          <strong>{t.firstStepFiles}</strong>
          <p>{t.firstStepFilesText}</p>
        </article>
        <article className={bridgeReady ? "ready" : "waiting"}>
          <span>03</span>
          <strong>{t.firstStepBridge}</strong>
          <p>{bridgeReady ? t.bridgeOnlineHelp : t.bridgeOfflineHelp}</p>
          {!bridgeReady && <code>{bridgeStartCommand(bridge)}</code>}
        </article>
        <article className={agentReady ? "ready" : "waiting"}>
          <span>04</span>
          <strong>{agentReady ? formatLabel(t.agentDetected, agentName) : t.agentNotDetected}</strong>
          <p>{agentDetail}</p>
          <div className="agent-mini-status">
            <span>{t.selectedAgent}: {selectedAgent?.label || "Agent"}</span>
            <code>{t.selectedAgentCommand}: {selectedAgent?.command || "agent"}</code>
          </div>
          {recommendedAgent && selectedAgent?.id !== recommendedAgent.id && (
            <button className="secondary-action" onClick={onUseRecommendedAgent}>
              <PlugZap size={17} />
              {formatLabel(t.useDetectedAgent, recommendedAgent.label)}
            </button>
          )}
        </article>
        <article>
          <span>05</span>
          <strong>{t.firstStepHandoff}</strong>
          <p>{t.firstStepHandoffText}</p>
        </article>
      </div>
    </section>
  );
}

function OneClickRunbookPanel({
  language,
  bridgeReady,
  readiness,
  sourceCount
}: {
  language: Language;
  bridgeReady: boolean;
  readiness: number;
  sourceCount: number;
}) {
  const zh = language === "zh";
  const hasRealSources = sourceCount > 0;
  const readinessLabel = hasRealSources ? `${readiness}%` : (zh ? "待补资料" : "Sources pending");
  const readinessWidth = hasRealSources ? readiness : 0;
  const steps = zh
    ? [
        ["开箱跑通", "先用内置经营复盘样例跑一遍，不需要准备真实资料。"],
        ["补真实资料", "把 PDF / Word / PPTX / Excel 交给 Bridge，本地生成 source.md。"],
        ["视觉评分", "Design Doctor 输出 layout、evidence、editability 三类评分。"],
        ["Skill 市场分发", "用 agents/openai.yaml、案例墙和 README 首屏证明它能被发现、能被调用、能被验收。"]
      ]
    : [
        ["First run", "Start with the built-in business review sample before collecting real files."],
        ["Add real sources", "Let Bridge turn PDF / Word / PPTX / Excel into local source.md."],
        ["Design score", "Design Doctor reports layout, evidence, and editability scores."],
        ["Skill market distribution", "Use agents/openai.yaml, the benchmark wall, and the README first screen as proof."]
      ];

  return (
    <section className="one-click-runbook" aria-label={zh ? "开箱跑通" : "One-click runbook"}>
      <div className="runbook-intro">
        <p className="eyebrow">{zh ? "v4.1 console path" : "v4.1 console path"}</p>
        <h2>{zh ? "从第一眼到可交付，只保留一条默认路" : "One default path from first click to delivery"}</h2>
        <p>
          {zh
            ? "下一阶段不先炫技，而是把样例试跑、真实资料、本地 handoff、Design Doctor 和 Skill 市场入口串成一条普通用户能跟住的路线。"
            : "The next step is not another advanced knob. It connects sample run, real sources, local handoff, Design Doctor, and skill-market readiness into one path."}
        </p>
        <div className="runbook-meter">
          <span>{zh ? "当前 brief 准备度" : "Current brief readiness"}</span>
          <strong>{readinessLabel}</strong>
          <div className="meter" aria-hidden="true"><span style={{ width: `${readinessWidth}%` }} /></div>
          <em>{bridgeReady ? (zh ? "Bridge 已连接" : "Bridge connected") : (zh ? "可先下载 zip 或启动 Bridge" : "Download zip or start Bridge first")}</em>
        </div>
      </div>
      <div className="runbook-grid">
        {steps.map(([title, text], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BenchmarkWall({ language }: { language: Language }) {
  const zh = language === "zh";
  return (
    <section className="benchmark-wall" aria-label={zh ? "案例墙" : "Benchmark wall"}>
      <div className="benchmark-copy">
        <p className="eyebrow">{zh ? "public benchmark" : "public benchmark"}</p>
        <h2>{zh ? "案例墙：先看输入、输出和质量报告" : "Benchmark wall: inspect input, output, and quality report first"}</h2>
        <p>
          {zh
            ? "README 动图负责第一眼，这里负责证明链：每个案例都能打开 demo，并回到对应 quality-report.json。"
            : "The README animation handles the first impression; this wall keeps the proof chain visible for every case."}
        </p>
        <div className="benchmark-actions">
          <a href={`${baseUrl}benchmark/`}>{zh ? "打开公开案例墙" : "Open public benchmark"}</a>
          <a href={`${repoUrl}/blob/main/docs/strategy/skill-market-distribution.md`}>{zh ? "Skill 市场清单" : "Skill market checklist"}</a>
        </div>
      </div>
      <div className="benchmark-grid">
        {benchmarkCases.map((item) => (
          <article key={item.id}>
            <strong>{zh ? item.zhTitle : item.enTitle}</strong>
            <p>{zh ? item.zhUse : item.enUse}</p>
            <div>
              <a href={`${baseUrl}${item.path}`}>{zh ? "打开 demo" : "Open demo"}</a>
              <a href={`${repoUrl}/blob/main/${item.report}`}>{zh ? "质量报告" : "Quality report"}</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlainLanguageGlossary({ labels: t }: { labels: typeof labels.zh }) {
  return (
    <section className="plain-glossary" aria-label={t.plainGlossaryTitle}>
      <div className="plain-glossary-intro">
        <BookOpen size={19} />
        <div>
          <h2>{t.plainGlossaryTitle}</h2>
          <p>{t.plainGlossaryText}</p>
        </div>
      </div>
      <div className="plain-glossary-grid">
        {t.plainGlossaryItems.map((item) => (
          <article key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
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

function SourceList({
  sources,
  labels: t,
  onRemove
}: {
  sources: UploadedSource[];
  labels: typeof labels.zh;
  onRemove: (id: string) => void;
}) {
  if (sources.length === 0) {
    return <div className="empty-source">{t.noSources}</div>;
  }
  return (
    <div className="source-list-ui">
      {sources.map((source) => (
        <article key={source.id} className="source-chip">
          <FileText size={17} />
          <div>
            <strong>{source.name}</strong>
            <span>{source.statusText} · {formatBytes(source.size)}</span>
          </div>
          <button aria-label={t.remove} onClick={() => onRemove(source.id)}>
            <XCircle size={17} />
          </button>
        </article>
      ))}
    </div>
  );
}

function BestEffectGuide({ labels: t }: { labels: typeof labels.zh }) {
  return (
    <div className="best-effect-guide">
      <div className="best-effect-guide-head">
        <Sparkles size={18} />
        <div>
          <strong>{t.bestEffectTitle}</strong>
          <p>{t.bestEffectSubtitle}</p>
        </div>
      </div>
      <div className="best-effect-guide-grid">
        <div>
          <span>{t.bestEffectDefault}</span>
          <p>{t.bestEffectDefaultText}</p>
        </div>
        <div>
          <span>{t.bestEffectFormal}</span>
          <p>{t.bestEffectFormalText}</p>
        </div>
      </div>
      <div className="best-effect-prompt">
        <Clipboard size={16} />
        <span>{t.bestEffectCopy}</span>
        <code>{bestEffectMarketplacePrompt}</code>
      </div>
    </div>
  );
}

function WebDeckAssetFactoryPanel({
  form,
  webDeck,
  onSelectStyle,
  onSetMapPage,
  onSetCoverDerivative,
  onSetGeneratedImages
}: {
  form: FormState;
  webDeck: WebDeckPlan;
  onSelectStyle: (style: StylePreset) => void;
  onSetMapPage: () => void;
  onSetCoverDerivative: () => void;
  onSetGeneratedImages: () => void;
}) {
  const zh = form.language === "zh";
  const styleAActive = webDeck.style === "editorial";
  const rhythmPreview = webDeck.pageRhythm.slice(0, 4).map((page) => page.layout).join(" / ");
  return (
    <section className="web-deck-factory" aria-label="Swiss Deck / Asset Factory">
      <div className="web-deck-factory-head">
        <div>
          <strong>Swiss Deck / Asset Factory</strong>
          <p>{zh ? "选择 Style A 叙事 Web Deck 或 Style B 信息设计路线，并把图片生成升级成可追溯资产计划。" : "Choose Style A narrative Web Deck or Style B information-design route, then stage traceable image assets."}</p>
        </div>
        <span>{webDeck.layoutPolicy}</span>
      </div>
      <div className="style-choice-grid">
        <button type="button" className={styleAActive ? "active" : ""} onClick={() => onSelectStyle("editorial")}>
          <span>{zh ? "Style A · 电子杂志 × 电子墨水" : "Style A · Editorial/E-ink"}</span>
          <small>{zh ? "适合极短指令、叙事传播、观点页和电子杂志节奏。" : "Best for thin prompts, narrative publishing, point-of-view pages, and magazine pacing."}</small>
        </button>
        <button type="button" className={!styleAActive ? "active" : ""} onClick={() => onSelectStyle("swiss")}>
          <span>{zh ? "Style B · 瑞士国际主义" : "Style B · Swiss International"}</span>
          <small>{zh ? "适合数据、产品、KPI、方法论、Helvetica、网格与信息设计。" : "Best for data, product, KPI, methodology, Helvetica, grid, and information design."}</small>
        </button>
      </div>
      <dl className="web-deck-contract">
        <div>
          <dt>{zh ? "主题" : "Theme"}</dt>
          <dd>{webDeck.theme}</dd>
        </div>
        <div>
          <dt>{zh ? "页奏" : "Rhythm"}</dt>
          <dd>{rhythmPreview}</dd>
        </div>
        <div>
          <dt>{zh ? "校验" : "Audit"}</dt>
          <dd>npm run audit:swiss-deck</dd>
        </div>
      </dl>
      <div className="asset-factory-actions">
        <button type="button" onClick={onSetMapPage}>{zh ? "需要地图页" : "Map page"}</button>
        <button type="button" onClick={onSetCoverDerivative}>{zh ? "封面衍生图" : "Cover derivative"}</button>
        <button type="button" onClick={onSetGeneratedImages}>{zh ? "生成配图" : "Generated visuals"}</button>
      </div>
    </section>
  );
}

function VisualBriefBuilder({
  form,
  expectationFit,
  labels: t,
  onApplyPreset,
  onToggleTag,
  onUpdateBrief
}: {
  form: FormState;
  expectationFit: ExpectationFit;
  labels: typeof labels.zh;
  onApplyPreset: (presetId: string) => void;
  onToggleTag: (groupId: VisualTagGroupId, tagId: string) => void;
  onUpdateBrief: (patch: Partial<VisualBrief>) => void;
}) {
  const zh = form.language === "zh";
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  const referenceStyle = normalizeReferenceStyle(form.visualBrief.referenceStyle, referenceStyleForPreset(form.visualBrief.tagPreset).selectedDirection);

  return (
    <section className="visual-brief-builder" aria-label={t.visualBriefPanel}>
      <BestEffectGuide labels={t} />
      <div className="visual-brief-head">
        <div>
          <strong>{t.visualBriefPanel}</strong>
          <p>{t.visualBriefSubtitle}</p>
        </div>
        <span className={`fit-badge ${expectationFit.riskLevel}`}>{expectationFit.score}%</span>
      </div>
      <div className="tag-preset-row" aria-label={t.recommendedTagCombos}>
        <span>{t.recommendedTagCombos}</span>
        <div>
          {visualBriefPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={form.visualBrief.tagPreset === preset.id ? "active" : ""}
              title={zh ? preset.descriptionZh : preset.descriptionEn}
              onClick={() => onApplyPreset(preset.id)}
            >
              {zh ? preset.zh : preset.en}
            </button>
          ))}
        </div>
      </div>
      <div className="reference-style-row" aria-label={t.referenceStyle}>
        <div>
          <span>{t.referenceStyle}</span>
          <p>{t.referenceStyleSubtitle}</p>
        </div>
        <div className="reference-style-options">
          {referenceStyleOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={referenceStyle.selectedDirection === option.id ? "active" : ""}
              title={zh ? option.descriptionZh : option.descriptionEn}
              onClick={() => onUpdateBrief({ referenceStyle: referenceStyleFromOption(option.id) })}
            >
              {zh ? option.zh : option.en}
            </button>
          ))}
        </div>
        <dl className="reference-style-summary">
          <div>
            <dt>{t.referenceStyleLike}</dt>
            <dd>{referenceStyle.positiveReferences.slice(0, 3).join(" · ")}</dd>
          </div>
          <div>
            <dt>{t.referenceStyleAvoid}</dt>
            <dd>{referenceStyle.negativeReferences.slice(0, 2).join(" · ")}</dd>
          </div>
          <div>
            <dt>{t.referenceStyleRules}</dt>
            <dd>{referenceStyle.styleConstraints.slice(0, 3).join(" · ")}</dd>
          </div>
        </dl>
      </div>
      <div className="tag-group-grid">
        {visualTagGroups.map((group) => (
          <div key={group.id} className="tag-group">
            <strong>{zh ? group.zh : group.en}</strong>
            <div>
              {group.tags.map((tag) => {
                const active = selectedTags[group.id].includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={active ? "active" : ""}
                    onClick={() => onToggleTag(group.id, tag.id)}
                  >
                    {zh ? tag.zh : tag.en}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="visual-brief-inputs">
        <label>
          {t.backgroundContext}
          <textarea
            className="medium-input"
            value={form.visualBrief.backgroundText}
            onChange={(event) => onUpdateBrief({ backgroundText: event.target.value })}
          />
        </label>
        <label>
          {t.extraVisualRequirements}
          <textarea
            className="medium-input"
            value={form.visualBrief.extraRequirements}
            onChange={(event) => onUpdateBrief({ extraRequirements: event.target.value })}
          />
        </label>
        <label>
          {t.referenceLinks}
          <textarea
            className="medium-input"
            value={form.visualBrief.referenceLinks.join("\n")}
            onChange={(event) => onUpdateBrief({ referenceLinks: splitReferenceLinks(event.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}

function ExpectationFitCard({ expectationFit, labels: t }: { expectationFit: ExpectationFit; labels: typeof labels.zh }) {
  const statusText =
    expectationFit.riskLevel === "green"
      ? t.expectationFitGreen
      : expectationFit.riskLevel === "yellow"
        ? t.expectationFitYellow
        : t.expectationFitRed;
  const details = [
    ...expectationFit.missingSignals.slice(0, 3),
    ...expectationFit.conflicts.slice(0, 2)
  ];

  return (
    <div className={`expectation-fit-card ${expectationFit.riskLevel}`}>
      <div>
        <span>{t.expectationFit}</span>
        <strong>{expectationFit.score}%</strong>
      </div>
      <p>{statusText}</p>
      <dl>
        <div>
          <dt>{t.sourceAdequacy}</dt>
          <dd>{sourceAdequacyLabel(expectationFit.sourceAdequacy, t.studio.includes("质量") ? "zh" : "en")}</dd>
        </div>
        <div>
          <dt>{t.readyForProduction}</dt>
          <dd>{expectationFit.readyForProduction ? t.expectationFitGreen : t.needsGuidedIntake}</dd>
        </div>
      </dl>
      {details.length > 0 && (
        <div className="expectation-signals">
          {details.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
      {expectationFit.nextQuestions.length > 0 && (
        <div className="next-question">
          <strong>{t.nextCodexQuestion}</strong>
          <span>{expectationFit.nextQuestions[0]}</span>
        </div>
      )}
    </div>
  );
}

function BridgeStatusCard({
  bridge,
  checking,
  error,
  labels: t,
  bridgeCommand,
  onRefresh
}: {
  bridge: BridgeHealth | null;
  checking: boolean;
  error: string;
  labels: typeof labels.zh;
  bridgeCommand: string;
  onRefresh: () => void;
}) {
  return (
    <div className={`bridge-card ${bridge ? "online" : "offline"}`}>
      <div>
        {bridge ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        <strong>{checking ? t.bridgeChecking : bridge ? t.bridgeOnline : t.bridgeOffline}</strong>
        <button onClick={onRefresh}>
          <RefreshCw size={16} />
        </button>
      </div>
      <code>{t.bridgeCommand}: {bridgeCommand}</code>
      <p>{bridge ? `${bridge.outputDir} · v${bridge.version}` : error || t.allowLaunchOff}</p>
      <span>{bridge?.allowLaunch ? t.allowLaunchOn : t.allowLaunchOff}</span>
    </div>
  );
}

function HandoffExecutionPanel({
  bridge,
  handoffResult,
  agentCommand,
  bridgeCommand,
  labels: t,
  onCopy
}: {
  bridge: BridgeHealth | null;
  handoffResult: HandoffResult | null;
  agentCommand: string;
  bridgeCommand: string;
  labels: typeof labels.zh;
  onCopy: (value: string) => Promise<void>;
}) {
  const elementCommand = elementGenerationCommand(bridge, handoffResult);
  const detail = !bridge
    ? t.handoffExecutionBridgeOffline
    : !handoffResult
      ? t.handoffExecutionBridgeOnline
      : t.handoffExecutionReady;

  return (
    <div className="handoff-execution">
      <div>
        <Workflow size={17} />
        <div>
          <strong>{t.handoffExecutionTitle}</strong>
          <p>{detail}</p>
        </div>
      </div>
      {!bridge ? (
        <div className="command-box compact">
          <strong>{t.copyBridgeCommand}</strong>
          <code>{bridgeCommand}</code>
          <button className="secondary-action full" onClick={() => onCopy(bridgeCommand)}>
            <Clipboard size={17} />
            {t.copyCommand}
          </button>
        </div>
      ) : handoffResult ? (
        <>
          <div className="command-box compact">
            <strong>{t.elementGenerationCommand}</strong>
            <code>{elementCommand}</code>
            <button className="secondary-action full" onClick={() => onCopy(elementCommand)}>
              <Clipboard size={17} />
              {t.copyCommand}
            </button>
            <p>{t.needsManualHint}</p>
          </div>
          {agentCommand && (
            <div className="command-box compact">
              <strong>{t.commandReady}</strong>
              <code>{agentCommand}</code>
              <button className="secondary-action full" onClick={() => onCopy(agentCommand)}>
                <Clipboard size={17} />
                {t.copyCommand}
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatusPill({ ok, okText, failText }: { ok: boolean; okText: string; failText: string }) {
  return <span className={`status-pill ${ok ? "ok" : "fail"}`}>{ok ? okText : failText}</span>;
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

function QualityWorkbenchPanel({
  form,
  preset,
  readiness,
  sourceCount,
  bridge,
  handoffResult,
  qualityContract,
  labels: t
}: {
  form: FormState;
  preset: WebPreset;
  readiness: number;
  sourceCount: number;
  bridge: BridgeHealth | null;
  handoffResult: HandoffResult | null;
  qualityContract: QualityContract;
  labels: typeof labels.zh;
}) {
  const hasRealSources = sourceCount > 0;
  const statusLabel = hasRealSources ? `${readiness}% · ${qualityContract.label}` : t.noRealSourcesYet;
  const nextStep = !hasRealSources
    ? t.navSources
    : readiness < 80
      ? form.language === "zh" ? "补齐标题、核心结论和资料摘要" : "Complete title, core message, and source notes"
      : !bridge
        ? t.copyBridgeCommand
        : !handoffResult
          ? t.sendBridge
          : t.designDoctorTitle;

  return (
    <aside className="quality-workbench" aria-label={t.qualityWorkbenchTitle}>
      <div className="quality-workbench-head">
        <ShieldCheck size={18} />
        <div>
          <strong>{t.qualityWorkbenchTitle}</strong>
          <p>{t.qualityWorkbenchSubtitle}</p>
        </div>
      </div>
      <div className="quality-workbench-grid">
        <div>
          <span>{t.contentPreset}</span>
          <strong>{preset.label[form.language]}</strong>
        </div>
        <div>
          <span>{t.qualityStatus}</span>
          <strong>{statusLabel}</strong>
        </div>
        <div>
          <span>{t.nextStep}</span>
          <strong>{nextStep}</strong>
        </div>
      </div>
    </aside>
  );
}

function DesignDoctorPanel({
  qualityContract,
  labels: t
}: {
  qualityContract: QualityContract;
  labels: typeof labels.zh;
}) {
  const zh = t.studio.includes("质量");

  return (
    <div className="design-doctor-panel">
      <div className="design-doctor-head">
        <Activity size={17} />
        <div>
          <strong>{t.designDoctorTitle}</strong>
          <p>{t.designDoctorText}</p>
        </div>
      </div>
      <dl>
        <div>
          <dt>{t.qualityProfile}</dt>
          <dd>{qualityContract.acceptanceCriteria.slice(0, 2).join(" · ")}</dd>
        </div>
        <div>
          <dt>{t.expectedArtifacts}</dt>
          <dd>{qualityContract.expectedArtifacts.slice(0, 4).join(" · ")}</dd>
        </div>
        <div>
          <dt>{t.reviewCommands}</dt>
          <dd>{qualityContract.reviewCommands.join(" · ")}</dd>
        </div>
      </dl>
      <div className="design-score-grid" aria-label={t.designDoctorTitle}>
        {designDoctorScores.map((item) => (
          <article key={item.key}>
            <span>{item.score}</span>
            <strong>{zh ? item.zh : item.en}</strong>
            <p>{zh ? item.zhHint : item.enHint}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function PresetSummary({
  preset,
  language,
  labels: t
}: {
  preset: WebPreset;
  language: Language;
  labels: typeof labels.zh;
}) {
  const route = [
    preset.outputMode.toUpperCase(),
    preset.stylePreset,
    preset.packPath || "seed"
  ].join(" / ");
  const requirements = preset.sourceRequirements.slice(0, 4).map((item) => item[language]).join(" · ");
  const templates = [
    ...preset.templateCandidates.layouts.slice(0, 3),
    ...preset.templateCandidates.charts.slice(0, 3)
  ].join(" · ");
  const checks = preset.qualityChecks.slice(0, 3).map((item) => item[language]).join(" · ");
  const bestFor = preset.userLevel?.[language] || (language === "zh" ? "通用用户" : "general users");
  const notFor = preset.notFor?.slice(0, 2).map((item) => item[language]).join(" · ") || (language === "zh" ? "暂无明确排除场景" : "No explicit exclusions yet");

  return (
    <div className="preset-summary">
      <div>
        <span>{t.presetSummary}</span>
        <strong>{preset.label[language]}</strong>
        <p>{preset.summary[language]}</p>
      </div>
      <dl>
        <div>
          <dt>{t.presetRoute}</dt>
          <dd>{route}</dd>
        </div>
        <div>
          <dt>{t.presetRequirements}</dt>
          <dd>{requirements}</dd>
        </div>
        <div>
          <dt>{t.presetTemplates}</dt>
          <dd>{templates}</dd>
        </div>
        <div>
          <dt>{t.presetChecks}</dt>
          <dd>{checks}</dd>
        </div>
        <div>
          <dt>{t.bestFor}</dt>
          <dd>{bestFor}</dd>
        </div>
        <div>
          <dt>{t.notFor}</dt>
          <dd>{notFor}</dd>
        </div>
      </dl>
    </div>
  );
}

function toOptions<T extends string>(items: Record<T, Record<Language, string>>, language: Language) {
  return (Object.keys(items) as T[]).map((value) => ({
    value,
    label: items[value][language]
  }));
}

function presetOptions(language: Language) {
  const priority: PresetId[] = [
    "executive_business_review",
    "consulting_proposal",
    "training_courseware",
    "research_academic_defense",
    "product_pitch",
    "tech_trend_web_deck",
    "government_soe_report",
    "finance_branch_solution"
  ];
  return [...presetCatalog].sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id)).map((preset) => ({
    value: preset.id,
    label: preset.label[language]
  }));
}

function readOption<T extends string>(items: Record<T, Record<Language, string>>, value: T, language: Language) {
  return items[value][language];
}

function formatLabel(template: string, value: string) {
  return template.replace("{agent}", value).replace("{target}", value);
}

function bridgeStartCommand(bridge: BridgeHealth | null) {
  if (bridge?.repoRoot) {
    return `cd ${shellQuote(bridge.repoRoot)} && npm run bridge`;
  }

  return [
    'PACKAGE_JSON="$(find "$HOME" -maxdepth 5 -path "*/ultimate-ppt-master-skill/package.json" -print -quit 2>/dev/null)"',
    'if [ -n "$PACKAGE_JSON" ]; then',
    '  REPO="$(dirname "$PACKAGE_JSON")"',
    "else",
    '  REPO="$HOME/UltimatePPTMaster/ultimate-ppt-master-skill"',
    '  mkdir -p "$(dirname "$REPO")"',
    `  git clone "${repoUrl}" "$REPO"`,
    "fi",
    'cd "$REPO" && npm run bridge'
  ].join("\n");
}

function elementGenerationCommand(bridge: BridgeHealth | null, handoffResult: HandoffResult | null) {
  const projectPath = handoffResult?.projectPath || "<project_path>";
  if (bridge?.repoRoot && handoffResult?.projectPath) {
    return `cd ${shellQuote(bridge.repoRoot)} && python3 scripts/generate_visual_element_kit.py ${shellQuote(projectPath)}`;
  }
  return `python3 scripts/generate_visual_element_kit.py ${shellQuote(projectPath)}`;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function emptySelectedTags(): Record<VisualTagGroupId, string[]> {
  return visualTagGroups.reduce((acc, group) => {
    acc[group.id] = [];
    return acc;
  }, {} as Record<VisualTagGroupId, string[]>);
}

function normalizeSelectedTags(input?: Partial<Record<VisualTagGroupId, string[]>>): Record<VisualTagGroupId, string[]> {
  const next = emptySelectedTags();
  for (const group of visualTagGroups) {
    const known = new Set(group.tags.map((tag) => tag.id));
    next[group.id] = Array.from(new Set((input?.[group.id] || []).filter((tagId) => known.has(tagId))));
  }
  return next;
}

function referenceStyleOptionById(id?: string) {
  return referenceStyleOptions.find((item) => item.id === id) || referenceStyleOptions[0];
}

function referenceStyleForPreset(presetId?: string) {
  const map: Record<string, string> = {
    "executive-review": "financial-steady",
    "client-proposal": "consulting-structured",
    "product-launch": "product-launch-hero",
    training: "courseware-clean",
    "research-report": "research-evidence"
  };
  return referenceStyleFromOption(map[presetId || ""] || "financial-steady");
}

function referenceStyleFromOption(id: string): ReferenceStyle {
  const option = referenceStyleOptionById(id);
  return {
    selectedDirection: option.id,
    positiveReferences: [...option.positiveReferences],
    negativeReferences: [...option.negativeReferences],
    styleConstraints: [...option.styleConstraints]
  };
}

function normalizeReferenceStyle(input?: Partial<ReferenceStyle>, fallbackId = "financial-steady"): ReferenceStyle {
  const option = referenceStyleOptionById(input?.selectedDirection || fallbackId);
  return {
    selectedDirection: option.id,
    positiveReferences: Array.isArray(input?.positiveReferences) && input.positiveReferences.length
      ? input.positiveReferences.map(String).filter(Boolean)
      : [...option.positiveReferences],
    negativeReferences: Array.isArray(input?.negativeReferences) && input.negativeReferences.length
      ? input.negativeReferences.map(String).filter(Boolean)
      : [...option.negativeReferences],
    styleConstraints: Array.isArray(input?.styleConstraints) && input.styleConstraints.length
      ? input.styleConstraints.map(String).filter(Boolean)
      : [...option.styleConstraints]
  };
}

function referenceStyleLabel(style: ReferenceStyle, language: Language) {
  const option = referenceStyleOptionById(style.selectedDirection);
  return option[language];
}

function makeVisualBriefFromPreset(presetId: string, existing?: Partial<VisualBrief>): VisualBrief {
  const preset = visualBriefPresets.find((item) => item.id === presetId) || visualBriefPresets[0];
  return normalizeVisualBrief({
    selectedTags: normalizeSelectedTags(preset.tags),
    tagPreset: preset.id,
    backgroundText: existing?.backgroundText || "",
    extraRequirements: existing?.extraRequirements || "",
    referenceLinks: existing?.referenceLinks || [],
    referenceStyle: existing?.referenceStyle || referenceStyleForPreset(preset.id),
    autoSuggestedTags: existing?.autoSuggestedTags || [],
    userEditedTags: false
  });
}

function normalizeVisualBrief(input?: Partial<VisualBrief>): VisualBrief {
  const fallback = visualBriefPresets[0];
  const tagPreset = input?.tagPreset && visualBriefPresets.some((preset) => preset.id === input.tagPreset) ? input.tagPreset : fallback.id;
  return {
    selectedTags: normalizeSelectedTags(input?.selectedTags || fallback.tags),
    tagPreset,
    backgroundText: String(input?.backgroundText || ""),
    extraRequirements: String(input?.extraRequirements || ""),
    referenceLinks: Array.isArray(input?.referenceLinks) ? input.referenceLinks.map(String).filter(Boolean) : [],
    referenceStyle: normalizeReferenceStyle(input?.referenceStyle, referenceStyleForPreset(tagPreset).selectedDirection),
    autoSuggestedTags: Array.isArray(input?.autoSuggestedTags) ? input.autoSuggestedTags.map(String).filter(Boolean) : [],
    userEditedTags: Boolean(input?.userEditedTags)
  };
}

function visualBriefPresetForContentPreset(presetId: PresetId): string {
  if (presetId === "consulting_proposal" || presetId === "finance_branch_solution") return "client-proposal";
  if (presetId === "product_pitch" || presetId === "tech_trend_web_deck") return "product-launch";
  if (presetId === "training_courseware") return "training";
  if (presetId === "research_academic_defense") return "research-report";
  return "executive-review";
}

function splitReferenceLinks(value: string) {
  return value.split(/[\n,，]/).map((item) => item.trim()).filter(Boolean);
}

function appendConstraint(current: string, addition: string) {
  const trimmed = current.trim();
  if (trimmed.includes(addition)) return current;
  return trimmed ? `${trimmed}\n${addition}` : addition;
}

function selectedTagCount(brief: VisualBrief) {
  return Object.values(normalizeSelectedTags(brief.selectedTags)).reduce((sum, items) => sum + items.length, 0);
}

function visualTagLabel(groupId: VisualTagGroupId, tagId: string, language: Language) {
  const tag = visualTagGroups.find((group) => group.id === groupId)?.tags.find((item) => item.id === tagId);
  return tag ? tag[language] : tagId;
}

function visualTagLabelsByGroup(brief: VisualBrief, language: Language) {
  const selectedTags = normalizeSelectedTags(brief.selectedTags);
  return visualTagGroups.reduce((acc, group) => {
    acc[group.id] = selectedTags[group.id].map((tagId) => visualTagLabel(group.id, tagId, language));
    return acc;
  }, {} as Record<VisualTagGroupId, string[]>);
}

function flattenVisualTagLabels(brief: VisualBrief, language: Language) {
  const grouped = visualTagLabelsByGroup(brief, language);
  return visualTagGroups.flatMap((group) => grouped[group.id].map((label) => `${group[language]}: ${label}`));
}

function sourceAdequacyLabel(value: SourceAdequacy, language: Language) {
  const zh: Record<SourceAdequacy, string> = {
    substantive: "资料充分",
    thin: "资料偏薄",
    "topic-only": "只有主题",
    "private-unparsed": "有附件待解析",
    conflicting: "资料冲突",
    "no-source": "缺少资料"
  };
  const en: Record<SourceAdequacy, string> = {
    substantive: "substantive",
    thin: "thin",
    "topic-only": "topic only",
    "private-unparsed": "private / unparsed attachments",
    conflicting: "conflicting",
    "no-source": "no source"
  };
  return language === "zh" ? zh[value] : en[value];
}

function inferSourceAdequacy(form: FormState, sources: UploadedSource[]): SourceAdequacy {
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  const text = [
    form.sourceNotes,
    form.visualBrief.backgroundText,
    form.visualBrief.extraRequirements,
    ...sources.map((source) => source.text || source.url || source.name)
  ].join("\n").trim();
  if (/冲突|矛盾|conflict|contradict/i.test(text)) return "conflicting";
  if (sources.length > 0 && sources.every((source) => source.status !== "textExtracted" && !source.text)) return "private-unparsed";
  if (text.length >= 260 || sources.some((source) => (source.text || "").length >= 180)) return "substantive";
  if (text.length >= 80 || sources.length > 0) return "thin";
  if (selectedTags.contentState.includes("topic-only") || form.title.trim().length > 4) return "topic-only";
  return "no-source";
}

function draftAccepted(form: FormState) {
  return /草稿|先做一版|先出一版|按默认|draft|rough|first pass/i.test([
    form.constraints,
    form.sourceNotes,
    form.visualBrief.backgroundText,
    form.visualBrief.extraRequirements
  ].join("\n"));
}

function explicitFormalEditableRequested(form: FormState) {
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  const text = [
    form.title,
    form.audience,
    form.coreMessage,
    form.sourceNotes,
    form.constraints,
    form.visualBrief.backgroundText,
    form.visualBrief.extraRequirements
  ].join("\n");
  return (
    form.outputMode === "pptx" ||
    selectedTags.outputPreference.includes("editable-pptx") ||
    selectedTags.visualStyle.includes("formal-business") ||
    /正式|汇报|报告|可编辑|pptx|powerpoint|政府|金融|培训|课件|formal|editable|business report|government|finance|training/i.test(text)
  );
}

function swissIntentDetected(form: FormState, sources: UploadedSource[] = []) {
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  const text = [
    form.title,
    form.audience,
    form.coreMessage,
    form.sourceNotes,
    form.constraints,
    form.visualBrief.backgroundText,
    form.visualBrief.extraRequirements,
    ...flattenVisualTagLabels(form.visualBrief, "en"),
    ...flattenVisualTagLabels(form.visualBrief, "zh"),
    ...sources.map((source) => `${source.name}\n${source.text || source.url || ""}`)
  ].join("\n");
  return (
    form.stylePreset === "swiss" ||
    selectedTags.visualStyle.includes("data-heavy") ||
    /swiss|瑞士风|瑞士国际主义|information design|信息设计|Helvetica|grid|网格|KPI|指标|数据|产品|方法论/i.test(text)
  );
}

function assessExpectationFit(form: FormState, sources: UploadedSource[]): ExpectationFit {
  const zh = form.language === "zh";
  const brief = normalizeVisualBrief(form.visualBrief);
  const selectedTags = normalizeSelectedTags(brief.selectedTags);
  const sourceAdequacy = inferSourceAdequacy({ ...form, visualBrief: brief }, sources);
  const missingSignals: string[] = [];
  const assumptions: string[] = [];
  const conflicts: string[] = [];
  const nextQuestions: string[] = [];
  const sourceText = [form.sourceNotes, brief.backgroundText].join("\n").trim();

  if (!selectedTags.scenario.length && !form.scenario) {
    missingSignals.push(zh ? "缺少使用场景" : "missing scenario");
  }
  if (form.audience.trim().length < 4 && !selectedTags.audience.length) {
    missingSignals.push(zh ? "缺少目标受众" : "missing audience");
  }
  if (form.coreMessage.trim().length < 12 && !selectedTags.purpose.length) {
    missingSignals.push(zh ? "缺少核心目的或结论" : "missing core purpose or conclusion");
  }
  if (["no-source", "topic-only"].includes(sourceAdequacy) && sourceText.length < 80 && !selectedTags.contentState.includes("needs-research")) {
    missingSignals.push(zh ? "缺少资料或调研许可" : "missing source material or research permission");
  }
  if (!selectedTags.visualStyle.length) {
    missingSignals.push(zh ? "缺少视觉风格选择" : "missing visual style");
  }
  if (selectedTags.visualStyle.includes("formal-business") && !brief.referenceStyle?.selectedDirection) {
    missingSignals.push(zh ? "缺少具体参考样板方向" : "missing concrete reference style direction");
  }
  if (!selectedTags.assetStrategy.length) {
    missingSignals.push(zh ? "缺少素材/IP 边界" : "missing asset / IP boundary");
  }
  if (!selectedTags.outputPreference.length) {
    missingSignals.push(zh ? "缺少输出偏好" : "missing output preference");
  }
  if (!(Number.parseInt(form.slideCount, 10) > 0)) {
    missingSignals.push(zh ? "缺少页数范围" : "missing slide count");
  }

  if (selectedTags.visualStyle.includes("formal-business") && (selectedTags.visualStyle.includes("young-vivid") || selectedTags.visualStyle.includes("launch-show"))) {
    conflicts.push(zh ? "正式汇报风格与年轻/发布会风格同时出现" : "formal business conflicts with vivid / launch-show style");
  }
  if (selectedTags.contentState.includes("well-sourced") && selectedTags.contentState.includes("topic-only")) {
    conflicts.push(zh ? "内容状态同时选择了资料充分和只有主题" : "content state says both well sourced and topic only");
  }
  if (form.outputMode === "web" && selectedTags.outputPreference.includes("editable-pptx") && !selectedTags.outputPreference.includes("web-preview")) {
    conflicts.push(zh ? "输出形式选择 Web，但标签偏向可编辑 PPTX" : "output mode is Web, but tags prefer editable PPTX");
  }

  const hasDraftApproval = draftAccepted({ ...form, visualBrief: brief });
  const sourcePenalty: Record<SourceAdequacy, number> = {
    substantive: 0,
    thin: 10,
    "private-unparsed": 12,
    "topic-only": 22,
    conflicting: 26,
    "no-source": 34
  };
  const score = Math.max(0, Math.min(100, 100 - sourcePenalty[sourceAdequacy] - missingSignals.length * 9 - conflicts.length * 14));
  const riskLevel: ExpectationRiskLevel =
    (score < 55 || sourceAdequacy === "no-source" || (missingSignals.length >= 4 && !hasDraftApproval))
      ? "red"
      : (score < 82 || missingSignals.length > 0 || conflicts.length > 0 || sourceAdequacy !== "substantive")
        ? "yellow"
        : "green";

  if (form.audience.trim()) {
    assumptions.push(zh ? `按目标听众“${form.audience.trim()}”组织内容。` : `Organize the deck for "${form.audience.trim()}".`);
  } else if (selectedTags.audience.length) {
    assumptions.push(zh ? `按标签中的目标受众组织内容。` : "Use the selected audience tags as the audience contract.");
  }
  if (["no-source", "topic-only"].includes(sourceAdequacy) && !explicitFormalEditableRequested({ ...form, visualBrief: brief })) {
    assumptions.push(zh ? "v5.3 极短指令默认先走 Style A Editorial Fixed Rhythm；若用户明确要正式可编辑汇报，再改走 PPTX。" : "v5.3 extremely thin prompts default to Style A Editorial Fixed Rhythm first; switch to PPTX when the user explicitly needs a formal editable report.");
  } else {
    assumptions.push(zh ? "默认输出可编辑 PPTX，必要时附 Web 预览。" : "Default to editable PPTX, with Web preview when requested.");
  }
  assumptions.push(zh ? "默认字体为微软雅黑，正文和关键数据保持可编辑。" : "Use Microsoft YaHei by default and keep body copy and key numbers editable.");
  if (selectedTags.assetStrategy.includes("official-first") || selectedTags.assetStrategy.includes("ip-compliance")) {
    assumptions.push(zh ? "品牌/IP 素材优先使用官方或用户提供来源。" : "Use official or user-provided sources for brand/IP assets first.");
  }

  const successCriteria = [
    form.coreMessage.trim()
      ? (zh ? `核心结论被封面和收束页重复强化：${form.coreMessage.trim()}` : `Core message appears in cover and closing: ${form.coreMessage.trim()}`)
      : (zh ? "封面和收束页必须明确一句话结论。" : "Cover and closing must state a clear one-line conclusion."),
    zh ? "版式、字体、素材和输出格式与所选标签一致。" : "Layout, typography, assets, and output route match the selected tags.",
    zh ? "交付审计说明哪些信息来自用户、哪些来自默认假设。" : "Delivery audit states which choices came from the user and which are assumptions."
  ];

  if (missingSignals.some((item) => /受众|场景|目的|audience|scenario|purpose/.test(item))) {
    nextQuestions.push(zh ? "这份 PPT 是给谁看、用在什么场景、希望对方看完做什么？" : "Who will see this deck, in what setting, and what should they do or believe afterward?");
  }
  if (missingSignals.some((item) => /资料|source|research/.test(item))) {
    nextQuestions.push(zh ? "请提供资料来源，或确认是否允许我先调研补充内容。" : "Please provide source material, or confirm whether research-first completion is allowed.");
  }
  if (missingSignals.some((item) => /风格|素材|输出|style|asset|output/.test(item)) || conflicts.length > 0) {
    nextQuestions.push(zh ? "视觉上更偏正式汇报、客户提案、产品发布，还是培训/调研报告？是否必须使用官方素材？" : "Should the deck feel like a formal report, client proposal, launch deck, training deck, or research report, and are official assets required?");
  }

  return {
    riskLevel,
    score,
    sourceAdequacy,
    missingSignals,
    assumptions,
    conflicts,
    successCriteria,
    readyForProduction: riskLevel !== "red" || hasDraftApproval,
    nextQuestions
  };
}

function bestEffectSignalText(form: FormState, sources: UploadedSource[]) {
  return [
    form.title,
    form.audience,
    form.coreMessage,
    form.sourceNotes,
    form.constraints,
    form.visualBrief.backgroundText,
    form.visualBrief.extraRequirements,
    ...form.visualBrief.referenceLinks,
    ...sources.map((source) => source.text || source.url || source.name)
  ].join("\n").replace(/\s+/g, " ").trim();
}

function bestEffectPromptQuality(form: FormState, sources: UploadedSource[], expectationFit: ExpectationFit): BestEffectBrief["promptQuality"] {
  const signalText = bestEffectSignalText(form, sources);
  const hasSourceText = sources.some((source) => (source.text || "").trim().length >= 120);
  const hasUserEditedBrief = form.visualBrief.userEditedTags || form.visualBrief.referenceLinks.length > 0 || form.visualBrief.backgroundText.trim().length >= 50 || form.visualBrief.extraRequirements.trim().length >= 30;
  if (!hasSourceText && !hasUserEditedBrief && signalText.length < 120 && ["no-source", "topic-only"].includes(expectationFit.sourceAdequacy)) {
    return "extreme-thin";
  }
  if (!expectationFit.readyForProduction || expectationFit.sourceAdequacy !== "substantive" || signalText.length < 260) {
    return "thin";
  }
  return "complete";
}

function buildWebDeckPlan(form: FormState, sources: UploadedSource[] = []): WebDeckPlan {
  const swiss = swissIntentDetected(form, sources);
  const style: WebDeckStyle = swiss ? "swiss" : "editorial";
  const theme = swiss ? "swiss-red / black / warm-gray / signal-blue" : "ink-mono / mist / bronze / editorial-blue / night";
  const layoutPolicy: WebDeckLayoutPolicy = swiss ? "swiss-locked-sxx" : "free-layout-skeletons";
  const pageRhythm = swiss
    ? [
      { page: 1, role: "cover", theme, layout: "SWISS-COVER-ASCII" },
      { page: 2, role: "KPI", theme, layout: "S04" },
      { page: 3, role: "comparison", theme, layout: "S11" },
      { page: 4, role: "process", theme, layout: "S14" },
      { page: 5, role: "map / location relationship", theme, layout: "S08" },
      { page: 6, role: "image hero", theme, layout: "S22", imageSlot: "s22-hero-21x9" },
      { page: 7, role: "evidence close", theme, layout: "S16" },
      { page: 8, role: "closing", theme, layout: "SWISS-CLOSING-ASCII" }
    ]
    : [
      { page: 1, role: "cover", theme, layout: "editorial-cover" },
      { page: 2, role: "context", theme, layout: "editorial-context" },
      { page: 3, role: "image tension", theme, layout: "editorial-spread" },
      { page: 4, role: "framework", theme, layout: "editorial-framework" },
      { page: 5, role: "divider", theme, layout: "editorial-divider" },
      { page: 6, role: "evidence", theme, layout: "editorial-evidence" },
      { page: 7, role: "point of view", theme, layout: "editorial-pov" },
      { page: 8, role: "closing", theme, layout: "editorial-close" }
    ];
  return {
    style,
    theme,
    layoutPolicy,
    pageRhythm,
    validationCommands: swiss ? ["npm run audit:swiss-deck"] : ["npm run audit:web-console"]
  };
}

function buildBestEffectBrief(form: FormState, sources: UploadedSource[], expectationFit: ExpectationFit): BestEffectBrief {
  const zh = form.language === "zh";
  const promptQuality = bestEffectPromptQuality(form, sources, expectationFit);
  const formalEditable = explicitFormalEditableRequested(form);
  const swissIntent = swissIntentDetected(form, sources);
  const webDeck = buildWebDeckPlan(form, sources);
  const strategy: BestEffectBrief["strategy"] =
    promptQuality === "extreme-thin" && !formalEditable
      ? "best-effect-fixed-style"
      : promptQuality === "complete"
        ? "source-confirmed"
        : "best-effect-expanded";
  const recommendedRoute: BestEffectBrief["recommendedRoute"] =
    strategy === "best-effect-fixed-style"
      ? "guizang-web-fixed-style"
      : form.outputMode === "both"
        ? "dual-delivery"
        : formalEditable
          ? "formal-editable-pptx"
          : "guizang-web-fixed-style";
  const routeName = swissIntent && !formalEditable ? "Swiss Style Web Deck locked Sxx route" : "Style A Editorial Fixed Rhythm";
  const styleName = swissIntent && !formalEditable ? "Style B · Swiss International" : "Style A · 电子杂志 × 电子墨水";
  const fixedStyleFallback = {
    trigger: zh
      ? "Extreme Thin Prompt Fallback: 用户只给主题、一句话或没有资料，且没有明确要求正式可编辑 PPTX。"
      : "Extreme Thin Prompt Fallback: the user gives only a topic, one line, or no source material, and did not explicitly ask for formal editable PPTX.",
    routeName,
    outputMode: "Mode 2: Magazine Web Deck",
    styleName,
    pageRhythm: swissIntent && !formalEditable
      ? webDeck.pageRhythm.map((page) => `${String(page.page).padStart(2, "0")} ${page.layout}: ${page.role}${page.imageSlot ? ` (${page.imageSlot})` : ""}`)
      : zh
      ? [
        "01 深色封面：一句强标题 + 极简副标题",
        "02 浅色背景：问题背景 / 趋势 / 现场语境",
        "03 深色图文页：关键冲突或机会",
        "04 浅色结构页：三段式框架 / 路径 / 方法",
        "05 章节分隔：大字短句，制造翻页节奏",
        "06 证据或场景页：图片 / 数据 / 案例块",
        "07 深色观点页：最终判断或反问",
        "08 浅色收束页：行动建议 / 结束语"
      ]
      : [
        "01 dark cover: one strong title plus minimal subtitle",
        "02 light context: problem, trend, or setting",
        "03 dark image/text spread: key tension or opportunity",
        "04 light structure: three-part framework, path, or method",
        "05 section divider: large short statement with page-turn rhythm",
        "06 evidence or scene page: image, data, or case block",
        "07 dark point-of-view page: final judgment or question",
        "08 light closing: action, takeaway, or ending line"
      ],
    qualityBar: zh
      ? [
        "不再继续追问风格，直接锁定杂志化 Web Deck 默认样式。",
        "每页只承担一个叙事任务，避免标题 + 卡片重复。",
        "图片和生成视觉必须无内嵌文字、无假 logo、无 IP 冒用。",
        "桌面和移动端都要预览，不能有文字重叠或媒体缺失。"
      ]
      : [
        "Do not keep asking for style; lock the magazine Web Deck default style.",
        "Each page has one narrative job; avoid repeated title-plus-card layouts.",
        "Generated visuals contain no embedded text, fake logos, or IP imitation.",
        "Preview desktop and mobile; no overlap or missing media."
      ]
  };
  const selectedTags = flattenVisualTagLabels(form.visualBrief, form.language);
  const autoExpandedBrief = zh
    ? [
      `主题：${form.title || "按用户一句话主题命名"}`,
      `目标受众：${form.audience || "默认面向普通业务听众 / 公开分享听众"}`,
      `核心叙事：${form.coreMessage || "先建立问题，再给出结构化判断和行动建议"}`,
      `推荐路线：${recommendedRoute === "formal-editable-pptx" ? "正式可编辑 PPTX" : recommendedRoute === "dual-delivery" ? "PPTX + Web Deck 双交付" : routeName}`,
      `视觉基调：${recommendedRoute === "guizang-web-fixed-style" ? styleName : "正式商务、微软雅黑、可编辑正文和图表"}`,
      `用户信号：${selectedTags.join(" / ") || "无显式标签，按最佳效果默认补全"}`,
      "输出前必须把这些假设写入 project-brief.json / quality-report.json。"
    ]
    : [
      `Topic: ${form.title || "name the deck from the user's one-line topic"}`,
      `Audience: ${form.audience || "default to general business or public-sharing audience"}`,
      `Narrative: ${form.coreMessage || "establish the problem, then give structured judgment and action"}`,
      `Recommended route: ${recommendedRoute === "formal-editable-pptx" ? "formal editable PPTX" : recommendedRoute === "dual-delivery" ? "PPTX plus Web Deck" : routeName}`,
      `Visual direction: ${recommendedRoute === "guizang-web-fixed-style" ? styleName : "formal business, Microsoft YaHei, editable body and charts"}`,
      `User signals: ${selectedTags.join(" / ") || "no explicit tags; complete with best-effect defaults"}`,
      "Record these assumptions in project-brief.json / quality-report.json before output."
    ];
  const assumptions = [
    ...expectationFit.assumptions,
    ...(strategy === "best-effect-fixed-style"
      ? [zh ? "用户未明确给出正式可编辑需求，因此优先交付固定高质量杂志 Web Deck。" : "No formal editable requirement was explicit, so the fixed high-quality magazine Web Deck route is preferred."]
      : [zh ? "先自动扩写 brief，再根据来源充分度决定是否需要一轮关键澄清。" : "Expand the brief first, then use source confidence to decide whether one focused clarification is needed."])
  ];
  const agentInstructions = zh
    ? [
      "Best-Effect Brief Enhancer: 生产前先把用户短指令改写成 bestEffectBrief，不要直接用原句开做。",
      "Extreme Thin Prompt Fallback: 如果只有主题或一句话，且没有明确要求正式可编辑 PPTX，默认使用 Style A Editorial Fixed Rhythm。",
      "若用户明确说正式汇报、政府/金融/培训、可编辑 PPTX，则走 formal-editable-pptx，但保留同样的 bestEffectBrief 和质量检查。",
      "只有事实、品牌/IP、合规或来源边界会实质改变交付时才暂停追问；一般风格和结构由 bestEffectBrief 自动补齐。",
      "最终交付要说明哪些内容来自用户、哪些是自动扩写假设。"
    ]
    : [
      "Best-Effect Brief Enhancer: rewrite the user's short instruction into bestEffectBrief before production.",
      "Extreme Thin Prompt Fallback: if there is only a topic or one line, and no explicit formal editable PPTX request, default to Style A Editorial Fixed Rhythm.",
      "If the user explicitly asks for formal reporting, government/finance/training, or editable PPTX, use formal-editable-pptx while keeping the same bestEffectBrief and quality checks.",
      "Pause only when missing facts, brand/IP, compliance, or source boundaries would materially change delivery; fill normal style and structure gaps automatically.",
      "Final delivery must state what came from the user and what was auto-expanded."
    ];

  return {
    version: "v5.3-best-effect-v1",
    strategy,
    promptQuality,
    userRequestSummary: bestEffectSignalText(form, sources).slice(0, 320) || (zh ? "用户尚未提供明确文本。" : "No explicit user text yet."),
    recommendedRoute,
    defaultStyle: recommendedRoute === "guizang-web-fixed-style" ? styleName : (zh ? "正式商务 PPTX / 微软雅黑 / 可编辑正文" : "formal business PPTX / Microsoft YaHei / editable body"),
    autoExpandedBrief,
    fixedStyleFallback,
    assumptions,
    agentInstructions,
    userVisibleHint: zh
      ? "短提示会先自动补全为最佳效果 brief；极短指令默认用 Style A，出现瑞士风/数据/KPI/Helvetica/网格/信息设计信号时推荐 Style B；正式可编辑场景仍优先 PPTX。"
      : "Short prompts are expanded into a best-effect brief first; extremely thin prompts default to Style A, while Swiss/data/KPI/Helvetica/grid/information design signals recommend Style B; formal editable scenarios still prefer PPTX."
  };
}

function buildBestEffectBriefMarkdown(form: FormState, sources: UploadedSource[], expectationFit: ExpectationFit) {
  const bestEffectBrief = buildBestEffectBrief(form, sources, expectationFit);
  const expanded = bestEffectBrief.autoExpandedBrief.map((item) => `- ${item}`).join("\n");
  const rhythm = bestEffectBrief.fixedStyleFallback.pageRhythm.map((item) => `- ${item}`).join("\n");
  const quality = bestEffectBrief.fixedStyleFallback.qualityBar.map((item) => `- ${item}`).join("\n");
  const instructions = bestEffectBrief.agentInstructions.map((item) => `- ${item}`).join("\n");
  const assumptions = bestEffectBrief.assumptions.map((item) => `- ${item}`).join("\n");
  if (form.language === "zh") {
    return `## v5.3 Best-Effect Brief Enhancer\n- 策略：${bestEffectBrief.strategy}\n- 提示质量：${bestEffectBrief.promptQuality}\n- 推荐路线：${bestEffectBrief.recommendedRoute}\n- 默认样式：${bestEffectBrief.defaultStyle}\n\n### Auto-expanded brief\n${expanded}\n\n### Extreme Thin Prompt Fallback\n- 路线：${bestEffectBrief.fixedStyleFallback.routeName}\n- 输出：${bestEffectBrief.fixedStyleFallback.outputMode}\n- 样式：${bestEffectBrief.fixedStyleFallback.styleName}\n- 触发：${bestEffectBrief.fixedStyleFallback.trigger}\n\n### 固定页奏\n${rhythm}\n\n### 质量约束\n${quality}\n\n### Agent 执行规则\n${instructions}\n\n### 自动假设\n${assumptions}`;
  }
  return `## v5.3 Best-Effect Brief Enhancer\n- Strategy: ${bestEffectBrief.strategy}\n- Prompt quality: ${bestEffectBrief.promptQuality}\n- Recommended route: ${bestEffectBrief.recommendedRoute}\n- Default style: ${bestEffectBrief.defaultStyle}\n\n### Auto-expanded brief\n${expanded}\n\n### Extreme Thin Prompt Fallback\n- Route: ${bestEffectBrief.fixedStyleFallback.routeName}\n- Output: ${bestEffectBrief.fixedStyleFallback.outputMode}\n- Style: ${bestEffectBrief.fixedStyleFallback.styleName}\n- Trigger: ${bestEffectBrief.fixedStyleFallback.trigger}\n\n### Fixed page rhythm\n${rhythm}\n\n### Quality constraints\n${quality}\n\n### Agent instructions\n${instructions}\n\n### Auto assumptions\n${assumptions}`;
}

function buildGuidedBrief(form: FormState): GuidedBrief {
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  const labelsByGroup = visualTagLabelsByGroup(form.visualBrief, form.language);
  return {
    scenario: labelsByGroup.scenario.join(", ") || readOption(optionText.scenario, form.scenario, form.language),
    audience: form.audience || labelsByGroup.audience.join(", "),
    purpose: labelsByGroup.purpose.join(", "),
    coreMessage: form.coreMessage,
    contentSources: [
      form.sourceNotes ? "sourceNotes" : "",
      form.visualBrief.backgroundText ? "visualBrief.backgroundText" : "",
      ...form.visualBrief.referenceLinks
    ].filter(Boolean),
    slideCount: form.slideCount,
    outlinePreference: labelsByGroup.layoutDensity.join(", "),
    visualStyle: labelsByGroup.visualStyle,
    assetRules: labelsByGroup.assetStrategy,
    outputFormat: labelsByGroup.outputPreference,
    mustInclude: selectedTags.assetStrategy.includes("official-first") ? [form.language === "zh" ? "官方/用户提供素材优先" : "official/user-provided assets first"] : [],
    mustAvoid: selectedTags.assetStrategy.includes("avoid-portrait") ? [form.language === "zh" ? "避免人物肖像" : "avoid portraits"] : []
  };
}

function assessSourceConfidence(form: FormState, sources: UploadedSource[], expectationFit: ExpectationFit): SourceConfidence {
  const zh = form.language === "zh";
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  const levelByAdequacy: Record<SourceAdequacy, SourceConfidenceLevel> = {
    substantive: "strong",
    thin: "partial",
    "topic-only": "topic-only",
    "private-unparsed": "partial",
    conflicting: "partial",
    "no-source": "weak"
  };
  const hasSourceMaterial = sources.length > 0 || Boolean(form.sourceNotes.trim() || form.visualBrief.backgroundText.trim());
  const coveredAreas = [
    form.title.trim() ? (zh ? "项目标题" : "project title") : "",
    form.audience.trim() || selectedTags.audience.length ? (zh ? "目标受众" : "target audience") : "",
    form.coreMessage.trim() || selectedTags.purpose.length ? (zh ? "核心目的/结论" : "core purpose / message") : "",
    hasSourceMaterial ? (zh ? "资料来源" : "source material") : "",
    selectedTags.visualStyle.length ? (zh ? "视觉风格" : "visual style") : "",
    selectedTags.assetStrategy.length ? (zh ? "素材边界" : "asset boundary") : "",
    selectedTags.outputPreference.length ? (zh ? "输出偏好" : "output preference") : "",
    form.visualBrief.referenceStyle?.selectedDirection ? (zh ? "参考样板" : "reference style") : ""
  ].filter(Boolean);
  const missingAreas = [
    ...expectationFit.missingSignals,
    !hasSourceMaterial ? (zh ? "缺少可引用资料，不能编造数据/事实" : "no citable source; do not invent facts or numbers") : "",
    expectationFit.conflicts.length ? (zh ? "存在输入冲突，需要用户确认优先级" : "input conflict needs priority confirmation") : ""
  ].filter(Boolean);
  const claimsNeedingEvidence = [
    form.coreMessage.trim() ? (zh ? `核心结论需证据支撑：${form.coreMessage.trim()}` : `Core message needs evidence: ${form.coreMessage.trim()}`) : "",
    selectedTags.contentState.includes("data-heavy") ? (zh ? "所有数字、趋势、排名和同比环比必须回到资料或明确标注为假设" : "All numbers, trends, rankings, and deltas must map to sources or be marked as assumptions") : "",
    selectedTags.purpose.includes("decision") || selectedTags.purpose.includes("resource-request")
      ? (zh ? "决策建议、资源申请和风险判断需要来源或用户确认" : "Decision, resource, and risk claims need source support or user confirmation")
      : ""
  ].filter(Boolean);
  return {
    level: levelByAdequacy[expectationFit.sourceAdequacy],
    sourceAdequacy: expectationFit.sourceAdequacy,
    coveredAreas,
    missingAreas,
    claimsNeedingEvidence,
    doNotInvent: zh
      ? ["不编造数据", "不编造客户/机构名称", "不编造政策出处", "不使用未授权 logo/IP", "不把 AI 图当真实现场"]
      : ["Do not invent numbers", "Do not invent customer or institution names", "Do not invent policy sources", "Do not use unlicensed logos/IP", "Do not present AI images as real scenes"]
  };
}

function sourceConfidenceLabel(value: SourceConfidenceLevel, language: Language) {
  const zh: Record<SourceConfidenceLevel, string> = {
    strong: "可信度高",
    partial: "部分可信",
    weak: "可信度低",
    "topic-only": "仅有主题"
  };
  const en: Record<SourceConfidenceLevel, string> = {
    strong: "strong",
    partial: "partial",
    weak: "weak",
    "topic-only": "topic only"
  };
  return language === "zh" ? zh[value] : en[value];
}

function inferExpectedDeckType(form: FormState): ExpectedDeckType {
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  if (selectedTags.scenario.includes("consulting-proposal") || form.scenario === "consulting") return "client-proposal";
  if (selectedTags.scenario.includes("training") || form.scenario === "training") return "training-courseware";
  if (selectedTags.scenario.includes("product-launch") || form.scenario === "launch") return "launch-story";
  if (selectedTags.scenario.includes("research-report") || form.presetId === "research_academic_defense") return "research-report";
  if (selectedTags.scenario.includes("executive-review") || form.scenario === "executive") return "executive-report";
  return "general-business";
}

function buildDeliveryScorecard(form: FormState, expectationFit: ExpectationFit, sourceConfidence: SourceConfidence, referenceStyle: ReferenceStyle): DeliveryScorecard {
  const zh = form.language === "zh";
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  const sourceScore: Record<SourceConfidenceLevel, number> = {
    strong: 92,
    partial: 72,
    weak: 42,
    "topic-only": 36
  };
  const styleConcrete = Boolean(referenceStyle.selectedDirection && referenceStyle.styleConstraints.length);
  const assetBoundaryKnown = selectedTags.assetStrategy.length > 0;
  const outputKnown = selectedTags.outputPreference.length > 0 || form.outputMode === "pptx" || form.outputMode === "both";
  const qualityDimensions = [
    {
      id: "brief-fit",
      label: zh ? "需求清晰度" : "Brief clarity",
      score: expectationFit.score,
      evidence: zh ? "来自标签、自由输入、页数、核心结论和冲突检测。" : "From tags, free text, slide count, core message, and conflict checks."
    },
    {
      id: "source-confidence",
      label: zh ? "资料可信度" : "Source confidence",
      score: sourceScore[sourceConfidence.level],
      evidence: zh ? `资料状态：${sourceAdequacyLabel(sourceConfidence.sourceAdequacy, "zh")}。` : `Source state: ${sourceAdequacyLabel(sourceConfidence.sourceAdequacy, "en")}.`
    },
    {
      id: "style-specificity",
      label: zh ? "风格具体度" : "Style specificity",
      score: styleConcrete ? 88 : 58,
      evidence: zh ? `参考样板：${referenceStyleLabel(referenceStyle, "zh")}。` : `Reference style: ${referenceStyleLabel(referenceStyle, "en")}.`
    },
    {
      id: "asset-boundary",
      label: zh ? "素材边界" : "Asset boundary",
      score: assetBoundaryKnown ? 84 : 55,
      evidence: zh ? "检查官方素材、AI 生图、IP 合规和禁忌选择。" : "Checks official assets, AI visuals, IP compliance, and avoid rules."
    },
    {
      id: "output-editability",
      label: zh ? "交付可编辑性" : "Delivery editability",
      score: outputKnown ? 90 : 64,
      evidence: zh ? "默认 PPTX 可编辑，Web/PDF 作为补充输出。" : "Editable PPTX by default; Web/PDF are supplemental outputs."
    }
  ];
  const knownRisks = [
    ...expectationFit.missingSignals,
    ...expectationFit.conflicts,
    ...sourceConfidence.missingAreas
  ];
  const recommendedNextRevision = [
    expectationFit.readyForProduction ? "" : (zh ? "先完成 Codex 分步需求访谈，再开始正式制作。" : "Run Codex guided intake before final production."),
    sourceConfidence.level === "strong" ? "" : (zh ? "补充可引用资料或明确允许按假设做草稿。" : "Add citable sources or explicitly allow a draft with assumptions."),
    styleConcrete ? "" : (zh ? "选择一个具体参考样板方向，避免只写“正式大气”。" : "Choose a concrete reference style; avoid generic style words only."),
    assetBoundaryKnown ? "" : (zh ? "确认品牌/IP/官方素材边界和是否允许 AI 生图。" : "Confirm brand/IP/official asset boundary and whether AI image generation is allowed.")
  ].filter(Boolean);
  return {
    expectedDeckType: inferExpectedDeckType(form),
    expectationFitBeforeProduction: {
      riskLevel: expectationFit.riskLevel,
      score: expectationFit.score,
      readyForProduction: expectationFit.readyForProduction,
      missingSignals: [...expectationFit.missingSignals],
      assumptions: [...expectationFit.assumptions]
    },
    qualityDimensions,
    userVisibleSummary: zh
      ? `当前预期契合度 ${expectationFit.score}%，来源可信度为${sourceConfidenceLabel(sourceConfidence.level, "zh")}，参考样板为${referenceStyleLabel(referenceStyle, "zh")}。`
      : `Expectation fit is ${expectationFit.score}%, source confidence is ${sourceConfidenceLabel(sourceConfidence.level, "en")}, and the reference style is ${referenceStyleLabel(referenceStyle, "en")}.`,
    knownRisks: knownRisks.length ? Array.from(new Set(knownRisks)) : [zh ? "暂无关键风险，但仍需在 quality-report.json 记录默认假设。" : "No major risk, but quality-report.json must still record assumptions."],
    recommendedNextRevision
  };
}

function buildFeedbackLoop(form: FormState, expectationFit: ExpectationFit, sourceConfidence: SourceConfidence, deliveryScorecard: DeliveryScorecard): FeedbackLoop {
  const zh = form.language === "zh";
  const taxonomy: FeedbackLoop["failureTaxonomy"] = [
    {
      id: "brief-mismatch",
      label: zh ? "需求理解偏差" : "Brief mismatch",
      applies: !expectationFit.readyForProduction || expectationFit.missingSignals.length > 0,
      improvementTarget: zh ? "回到需求确认稿，补齐受众、场景、目的和核心结论。" : "Return to the confirmation brief and clarify audience, setting, purpose, and message."
    },
    {
      id: "source-gap",
      label: zh ? "资料不足或证据断裂" : "Source gap",
      applies: sourceConfidence.level !== "strong",
      improvementTarget: zh ? "补来源、标注假设，不能把默认判断写成事实。" : "Add sources, mark assumptions, and never turn defaults into facts."
    },
    {
      id: "style-mismatch",
      label: zh ? "风格不符合预期" : "Style mismatch",
      applies: (deliveryScorecard.qualityDimensions.find((item) => item.id === "style-specificity")?.score ?? 0) < 80,
      improvementTarget: zh ? "选择或替换参考样板方向，并列出贴近/避免对象。" : "Choose or replace reference direction and list move-toward / avoid references."
    },
    {
      id: "visual-density",
      label: zh ? "排版密度不合适" : "Visual density mismatch",
      applies: normalizeSelectedTags(form.visualBrief.selectedTags).layoutDensity.length === 0,
      improvementTarget: zh ? "确认是留白型、标准商务、信息密集、看板还是图文均衡。" : "Confirm spacious, standard, dense, dashboard, or text/image balanced layout."
    },
    {
      id: "asset-boundary",
      label: zh ? "素材/IP 边界不清" : "Asset/IP boundary unclear",
      applies: normalizeSelectedTags(form.visualBrief.selectedTags).assetStrategy.length === 0,
      improvementTarget: zh ? "明确官方素材、AI 生图、肖像/IP 禁忌和替代策略。" : "Clarify official assets, AI visuals, portrait/IP restrictions, and replacement strategy."
    },
    {
      id: "format-mismatch",
      label: zh ? "输出格式不匹配" : "Format mismatch",
      applies: normalizeSelectedTags(form.visualBrief.selectedTags).outputPreference.length === 0,
      improvementTarget: zh ? "默认可编辑 PPTX；如需 PDF/Web 预览需显式写入。" : "Editable PPTX is default; PDF/Web preview must be explicit if needed."
    }
  ];
  const activeTaxonomy = taxonomy.filter((item) => item.applies);
  return {
    feedbackStatus: activeTaxonomy.length ? "requested" : "none",
    failureTaxonomy: taxonomy,
    nextRevisionIntent: activeTaxonomy.length
      ? activeTaxonomy.map((item) => item.improvementTarget).join(" ")
      : (zh ? "按当前 brief 进入制作，并在交付审计中记录默认假设。" : "Proceed with production and record assumptions in the delivery audit."),
    feedbackTemplate: zh
      ? [
        "这版最不符合预期的地方是：",
        "希望更贴近的参考样板/页面是：",
        "必须保留的内容或表达是：",
        "可以删减或弱化的内容是：",
        "下一版优先改：结构 / 风格 / 素材 / 数据 / 页数 / 输出格式"
      ]
      : [
        "The part that misses expectations most is:",
        "The reference style/page it should move toward is:",
        "Content or wording that must stay:",
        "Content that may be reduced:",
        "Next revision priority: structure / style / assets / data / slide count / output format"
      ]
  };
}

function buildConfirmationBrief(
  form: FormState,
  expectationFit: ExpectationFit,
  sourceConfidence: SourceConfidence,
  deliveryScorecard: DeliveryScorecard,
  referenceStyle: ReferenceStyle
) {
  const zh = form.language === "zh";
  const guided = buildGuidedBrief(form);
  const line = (value: string | string[]) => Array.isArray(value) ? (value.join(", ") || (zh ? "待确认" : "to confirm")) : (value || (zh ? "待确认" : "to confirm"));
  if (zh) {
    return `# 需求确认稿\n\n- 目标/场景：${line(guided.scenario)}\n- 目标受众：${line(guided.audience)}\n- 交付目的：${line(guided.purpose)}\n- 核心观点：${line(guided.coreMessage)}\n- 内容来源：${line(guided.contentSources)}\n- 页数/结构：${line(guided.slideCount)}；${line(guided.outlinePreference)}\n- 参考样板：${referenceStyleLabel(referenceStyle, "zh")}\n- 视觉/素材：${line(guided.visualStyle)}；${line(guided.assetRules)}\n- 输出格式：${line(guided.outputFormat)}\n- 预期风险：${expectationFit.riskLevel} / ${expectationFit.score}%\n- 来源可信度：${sourceConfidenceLabel(sourceConfidence.level, "zh")}\n- 下一步：${deliveryScorecard.recommendedNextRevision.join("；") || "可以进入制作，但需要记录默认假设。"}`;
  }
  return `# Confirmation Brief\n\n- Scenario: ${line(guided.scenario)}\n- Audience: ${line(guided.audience)}\n- Purpose: ${line(guided.purpose)}\n- Core message: ${line(guided.coreMessage)}\n- Content sources: ${line(guided.contentSources)}\n- Slide count / structure: ${line(guided.slideCount)}; ${line(guided.outlinePreference)}\n- Reference style: ${referenceStyleLabel(referenceStyle, "en")}\n- Visual / assets: ${line(guided.visualStyle)}; ${line(guided.assetRules)}\n- Output format: ${line(guided.outputFormat)}\n- Expectation risk: ${expectationFit.riskLevel} / ${expectationFit.score}%\n- Source confidence: ${sourceConfidenceLabel(sourceConfidence.level, "en")}\n- Next step: ${deliveryScorecard.recommendedNextRevision.join("; ") || "Production may start after recording assumptions."}`;
}

function buildV52Contract(form: FormState, sources: UploadedSource[], expectationFit: ExpectationFit) {
  const referenceStyle = normalizeReferenceStyle(form.visualBrief.referenceStyle, referenceStyleForPreset(form.visualBrief.tagPreset).selectedDirection);
  const sourceConfidence = assessSourceConfidence(form, sources, expectationFit);
  const deliveryScorecard = buildDeliveryScorecard(form, expectationFit, sourceConfidence, referenceStyle);
  const feedbackLoop = buildFeedbackLoop(form, expectationFit, sourceConfidence, deliveryScorecard);
  const selectedTags = normalizeSelectedTags(form.visualBrief.selectedTags);
  return {
    schemaVersion: "v5.2-brief-v1",
    referenceStyle,
    sourceConfidence,
    deliveryScorecard,
    feedbackLoop,
    failureTaxonomy: feedbackLoop.failureTaxonomy,
    confirmationBrief: buildConfirmationBrief(form, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle),
    imageAcceptance: {
      required: selectedTags.assetStrategy.includes("ai-visuals") || selectedTags.outputPreference.includes("visual-impact"),
      defaultPolicy: form.language === "zh"
        ? "AI 生成图只能做无文字主视觉、场景气氛、小元素和纹理；事实图片优先使用官方/用户提供来源。"
        : "AI images are for no-text hero visuals, atmosphere, micro-assets, and textures; factual imagery uses official/user-provided sources first.",
      targetSlides: ["cover", "section divider", "process / roadmap", "metric accent", "closing"],
      replacementRule: form.language === "zh"
        ? "若图片不够真实、含文字、含错误 logo/IP 或与内容无关，改用可编辑图形、官方图片或留白版式。"
        : "If an image is unrealistic, contains text, has broken logo/IP, or is unrelated, replace it with editable shapes, official imagery, or a clean no-image layout."
    }
  };
}

function determineBriefMode(form: FormState, expectationFit: ExpectationFit, sources: UploadedSource[]): BriefMode {
  if (draftAccepted(form)) return "draft-with-assumptions";
  const bestEffectBrief = buildBestEffectBrief(form, sources, expectationFit);
  if (bestEffectBrief.strategy === "best-effect-fixed-style") return "best-effect-fixed-style";
  if (bestEffectBrief.strategy === "best-effect-expanded") return "best-effect-expanded";
  if (form.agentTool === "codex" && !expectationFit.readyForProduction) return "codex-guided-intake";
  if (selectedTagCount(form.visualBrief) > 0 || form.visualBrief.backgroundText || form.visualBrief.referenceLinks.length > 0) return "visual-tags";
  if (sources.length > 0) return "source-first";
  return "codex-guided-intake";
}

function buildVisualBriefMarkdown(form: FormState, expectationFit: ExpectationFit, sources: UploadedSource[] = []) {
  const zh = form.language === "zh";
  const grouped = visualTagLabelsByGroup(form.visualBrief, form.language);
  const v52 = buildV52Contract(form, sources, expectationFit);
  const referenceStyle = v52.referenceStyle;
  const scorecard = v52.deliveryScorecard;
  const sourceConfidence = v52.sourceConfidence;
  const bestEffectText = buildBestEffectBriefMarkdown(form, sources, expectationFit);
  const sections = visualTagGroups
    .map((group) => `- ${group[form.language]}: ${grouped[group.id].join(", ") || (zh ? "未选择" : "not selected")}`)
    .join("\n");
  const assumptions = expectationFit.assumptions.map((item) => `- ${item}`).join("\n");
  const missing = expectationFit.missingSignals.length
    ? expectationFit.missingSignals.map((item) => `- ${item}`).join("\n")
    : (zh ? "- 暂无关键缺口" : "- No critical gaps");
  const conflicts = expectationFit.conflicts.length
    ? expectationFit.conflicts.map((item) => `- ${item}`).join("\n")
    : (zh ? "- 暂无明显冲突" : "- No visible conflicts");
  const questions = expectationFit.nextQuestions.length
    ? expectationFit.nextQuestions.map((item) => `- ${item}`).join("\n")
    : (zh ? "- 不需要额外问题即可进入制作" : "- No extra question needed before production");
  const qualityDimensions = scorecard.qualityDimensions
    .map((item) => `- ${item.label}: ${item.score}% (${item.evidence})`)
    .join("\n");
  const sourceMissing = sourceConfidence.missingAreas.length
    ? sourceConfidence.missingAreas.map((item) => `- ${item}`).join("\n")
    : (zh ? "- 暂无关键来源缺口" : "- No major source gaps");
  const sourceClaims = sourceConfidence.claimsNeedingEvidence.length
    ? sourceConfidence.claimsNeedingEvidence.map((item) => `- ${item}`).join("\n")
    : (zh ? "- 暂无额外待举证主张" : "- No extra claims needing evidence");
  const feedbackQuestions = v52.feedbackLoop.feedbackTemplate.map((item) => `- ${item}`).join("\n");

  if (zh) {
    return `${bestEffectText}\n\n## 可视化需求标签\n${sections}\n\n## 参考样板方向\n- 当前方向: ${referenceStyleLabel(referenceStyle, "zh")}\n- 贴近: ${referenceStyle.positiveReferences.join(" / ")}\n- 避免: ${referenceStyle.negativeReferences.join(" / ")}\n- 排版约束: ${referenceStyle.styleConstraints.join(" / ")}\n\n## 背景 / 相关内容\n${form.visualBrief.backgroundText || "未填写"}\n\n## 特殊要求 / 禁忌\n${form.visualBrief.extraRequirements || "未填写"}\n\n## 参考链接\n${form.visualBrief.referenceLinks.map((item) => `- ${item}`).join("\n") || "- 未提供"}\n\n## 预期契合度\n- 风险等级: ${expectationFit.riskLevel}\n- 分数: ${expectationFit.score}%\n- 资料充分度: ${sourceAdequacyLabel(expectationFit.sourceAdequacy, form.language)}\n- 可正式制作: ${expectationFit.readyForProduction ? "是" : "否，Codex 需要分步问清"}\n\n## v5.2 来源可信度\n- 等级: ${sourceConfidenceLabel(sourceConfidence.level, "zh")}\n- 已覆盖: ${sourceConfidence.coveredAreas.join(" / ") || "暂无"}\n- 不可编造: ${sourceConfidence.doNotInvent.join(" / ")}\n\n### 来源缺口\n${sourceMissing}\n\n### 需要证据支撑的主张\n${sourceClaims}\n\n## v5.2 交付评分卡\n- 预期成品类型: ${scorecard.expectedDeckType}\n- 用户可见摘要: ${scorecard.userVisibleSummary}\n${qualityDimensions}\n\n## v5.2 需求确认稿\n${v52.confirmationBrief}\n\n## 已知缺口\n${missing}\n\n## 冲突点\n${conflicts}\n\n## 默认假设\n${assumptions}\n\n## Codex 下一步问题\n${questions}\n\n## 反馈修订模板\n${feedbackQuestions}`;
  }

  return `${bestEffectText}\n\n## Visual brief tags\n${sections}\n\n## Reference style direction\n- Current direction: ${referenceStyleLabel(referenceStyle, "en")}\n- Move toward: ${referenceStyle.positiveReferences.join(" / ")}\n- Avoid: ${referenceStyle.negativeReferences.join(" / ")}\n- Layout constraints: ${referenceStyle.styleConstraints.join(" / ")}\n\n## Background / related context\n${form.visualBrief.backgroundText || "Not provided"}\n\n## Special requirements / must avoid\n${form.visualBrief.extraRequirements || "Not provided"}\n\n## Reference links\n${form.visualBrief.referenceLinks.map((item) => `- ${item}`).join("\n") || "- None"}\n\n## Expectation fit\n- Risk level: ${expectationFit.riskLevel}\n- Score: ${expectationFit.score}%\n- Source adequacy: ${sourceAdequacyLabel(expectationFit.sourceAdequacy, form.language)}\n- Ready for production: ${expectationFit.readyForProduction ? "yes" : "no; Codex must run guided intake"}\n\n## v5.2 Source confidence\n- Level: ${sourceConfidenceLabel(sourceConfidence.level, "en")}\n- Covered: ${sourceConfidence.coveredAreas.join(" / ") || "none"}\n- Do not invent: ${sourceConfidence.doNotInvent.join(" / ")}\n\n### Source gaps\n${sourceMissing}\n\n### Claims needing evidence\n${sourceClaims}\n\n## v5.2 Delivery scorecard\n- Expected deck type: ${scorecard.expectedDeckType}\n- User-visible summary: ${scorecard.userVisibleSummary}\n${qualityDimensions}\n\n## v5.2 Confirmation brief\n${v52.confirmationBrief}\n\n## Missing signals\n${missing}\n\n## Conflicts\n${conflicts}\n\n## Assumptions\n${assumptions}\n\n## Codex next questions\n${questions}\n\n## Feedback revision template\n${feedbackQuestions}`;
}

function loadSavedForm() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultForm;
    const parsed = { ...defaultForm, ...JSON.parse(saved) } as FormState;
    if (!presetCatalog.some((preset) => preset.id === parsed.presetId)) {
      parsed.presetId = defaultForm.presetId;
    }
    parsed.visualBrief = normalizeVisualBrief(parsed.visualBrief);
    return parsed;
  } catch {
    return defaultForm;
  }
}

function sourceProgressLabel(sourceCount: number, readiness: number, t: typeof labels.zh) {
  if (sourceCount === 0) return t.noRealSourcesYet;
  return `${sourceCount} files · ${readiness}%`;
}

function handoffProgressLabel(handoffResult: HandoffResult | null, t: typeof labels.zh) {
  return handoffResult ? t.commandReady : t.handoffNotCreated;
}

function buildWorkflowSteps({
  form,
  sources,
  readiness,
  bridge,
  selectedAgent,
  handoffResult,
  labels: t
}: {
  form: FormState;
  sources: UploadedSource[];
  readiness: { score: number; missing: string[] };
  bridge: BridgeHealth | null;
  selectedAgent?: AgentStatus;
  handoffResult: HandoffResult | null;
  labels: typeof labels.zh;
}): WorkflowStep[] {
  const briefComplete = readiness.score >= 80;
  const hasRealSources = sources.length > 0;
  const bridgeReady = Boolean(bridge);
  const agentReady = Boolean(selectedAgent?.available);
  const handoffReady = Boolean(handoffResult);
  const bridgeBlocked = hasRealSources && !bridgeReady;
  const agentBlocked = bridgeReady && !agentReady;

  return [
    {
      id: "brief",
      status: briefComplete ? "complete" : "active",
      title: t.workflowBrief,
      detail: briefComplete ? t.startGuideText : t.sourceGuideText,
      action: t.navSources
    },
    {
      id: "sources",
      status: hasRealSources ? "complete" : briefComplete ? "active" : "locked",
      title: t.workflowSources,
      detail: hasRealSources ? sourceProgressLabel(sources.length, readiness.score, t) : t.noRealSourcesYet,
      action: t.navSources
    },
    {
      id: "bridge",
      status: bridgeReady ? "complete" : bridgeBlocked ? "blocked" : "locked",
      title: t.workflowBridge,
      detail: bridgeReady ? t.bridgeOnlineHelp : t.bridgeOfflineHelp,
      action: bridgeReady ? t.refreshBridge : t.copyBridgeCommand
    },
    {
      id: "agent",
      status: agentReady ? "complete" : agentBlocked ? "blocked" : "locked",
      title: t.workflowAgent,
      detail: agentReady ? formatLabel(t.agentDetected, selectedAgent?.label || "Agent") : t.agentWaiting,
      action: t.oneClickConfig
    },
    {
      id: "handoff",
      status: handoffReady ? "complete" : bridgeReady && (agentReady || form.agentTool === "generic") ? "active" : "locked",
      title: t.workflowHandoff,
      detail: handoffReady ? t.bridgeSendOk : t.handoffNotCreated,
      action: t.sendBridge
    },
    {
      id: "review",
      status: handoffReady ? "active" : "locked",
      title: t.workflowReview,
      detail: handoffReady ? t.designDoctorText : t.previewGuideText,
      action: handoffReady ? t.launchAgent : t.navPreview
    }
  ];
}

function buildWorkflowState(steps: WorkflowStep[]): WorkflowState {
  const current = steps.find((step) => ["active", "blocked", "ready"].includes(step.status)) || steps[steps.length - 1];
  return {
    currentStep: current.id,
    blockedReason: current.status === "blocked" ? current.detail : ""
  };
}

function scoreBrief(form: FormState, sources: UploadedSource[]) {
  const checks = [
    { ok: form.title.trim().length > 4, zh: "补项目标题", en: "Add project title" },
    { ok: form.audience.trim().length > 4, zh: "补目标听众", en: "Add audience" },
    { ok: form.coreMessage.trim().length > 12, zh: "补核心结论", en: "Add core message" },
    { ok: form.sourceNotes.trim().length > 40 || sources.length > 0, zh: "补资料摘要或上传文件", en: "Add notes or files" },
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
      ? "网页端负责资料导入、Bridge 本地解析、路线选择、预览 HTML、执行 prompt、质量清单和 handoff 项目。"
      : "The web shell handles source intake, local Bridge parsing, route selection, preview HTML, execution prompt, QA checklist, and the handoff project."
  };
}

function buildQualityContract(form: FormState, preset: WebPreset, enginePlan: EnginePlan): QualityContract {
  const zh = form.language === "zh";
  const fallbackArtifacts = enginePlan.webActive && !enginePlan.pptxActive
    ? ["source.md", "project-brief.json", "preview-web-deck.html", "quality-checklist.md", "quality-report.json", "final-web-deck.html"]
    : ["source.md", "project-brief.json", "preview-web-deck.html", "quality-checklist.md", "quality-report.json", "final.pptx"];
  const fallbackCriteria = zh
    ? [
      "核心结论出现在封面和收束页",
      "每页只承担一个主要任务",
      "交付前运行视觉复查并输出 quality-report.json",
      "敏感资料默认留在本地"
    ]
    : [
      "core message appears in cover and conclusion",
      "each slide has one primary job",
      "run visual review and output quality-report.json before delivery",
      "sensitive source material stays local by default"
    ];

  return {
    label: preset.qualityProfile?.label[form.language] || (zh ? "中文办公交付质量" : "Office delivery quality"),
    userLevel: preset.userLevel?.[form.language] || (zh ? "中文办公用户" : "office users"),
    acceptanceCriteria: preset.qualityProfile?.acceptanceCriteria.map((item) => item[form.language]) || fallbackCriteria,
    expectedArtifacts: preset.qualityProfile?.expectedArtifacts || fallbackArtifacts,
    reviewCommands: preset.qualityProfile?.reviewCommands || [
      "python3 scripts/svg_quality_checker.py <project_path>",
      "python3 scripts/visual_review.py <project_path>"
    ],
    notFor: preset.notFor?.map((item) => item[form.language]) || [],
    proofArtifacts: preset.proofArtifacts
  };
}

function buildQualityGate(form: FormState, qualityContract: QualityContract, enginePlan: EnginePlan): QualityGate {
  const zh = form.language === "zh";
  const requiredInputs = zh
    ? [
      "品牌资产或明确替代策略",
      "bestEffectBrief：Agent 自动扩写后的最佳效果 brief、极短指令 fallback 和固定样式选择",
      "visualBrief / guidedBrief / expectationFit：用户标签、背景资料、默认假设和是否需要分步问清",
      "可追溯资料来源和证据口径",
      "DeckIR 页面地图：页面角色、证据引用、页面配方、可编辑目标和 raster 策略",
      "ChatGPT 生图优先的视觉素材计划：prompt、文件名和插入页面",
      "小元素素材包计划：分隔符、指标徽章、流程节点、连接线、图标和纹理",
      "公开素材检索计划用于证据/官方参考，或明确不联网检索的理由",
      "图片/图表计划或明确无图策略",
      "页面节奏和信息图策略"
    ]
    : [
      "brand assets or explicit fallback strategy",
      "bestEffectBrief with the Agent's auto-expanded best-effect brief, extreme-thin fallback, and fixed-style choice",
      "visualBrief / guidedBrief / expectationFit with user tags, background, assumptions, and guided-intake readiness",
      "traceable source evidence",
      "DeckIR page map with page roles, evidence refs, recipes, editability targets, and raster policy",
      "ChatGPT-generation-first visual asset plan with prompts, filenames, and insertion targets",
      "small reusable element kit plan for dividers, metric badges, process nodes, connectors, icons, and textures",
      "public asset search plan for evidence/official references or explicit no-search rationale",
      "image/chart plan or explicit no-image strategy",
      "page rhythm and infographic strategy"
    ];
  const formalCriteria = zh
    ? [
      "不得只用标题和卡片堆出整套 deck",
      "把 ChatGPT/OpenAI 作为主要视觉素材引擎，为页面生成专用配图和可复用小元素",
      "生成的小元素素材必须规划到 visual-element-kit.md，并在全 deck 复用形成统一视觉语言",
      "公开检索主要用于证据、官方参考和品牌边界，并记录来源/授权/插入位置",
      "PPTX 保留真实可编辑文字、形状、图表和备注",
      "Web Deck 必须有完整视觉系统、版式变化和桌面/移动可读性",
      "logo must not degrade into text fragments",
      "交付前运行正式商务审计和 Design Doctor"
    ]
    : [
      "do not build the whole deck from headings and repeated cards only",
      "treat ChatGPT/OpenAI as the primary visual asset engine for custom supporting visuals and reusable micro-assets",
      "small generated micro-assets are planned in visual-element-kit.md and reused across the deck",
      "use public search mainly for evidence, official references, and brand boundaries, then record source, license, and insertion target",
      "PPTX keeps real editable text, shapes, charts, and notes",
      "Web Deck has a complete visual system, layout variety, and desktop/mobile readability",
      "logo must not degrade into text fragments",
      "run formal delivery audit and Design Doctor before delivery"
    ];
  const artifactChecks = zh
    ? [
      "manifest.json 包含 formal-business qualityGate",
      "project-brief.json 包含 bestEffectBrief、极短指令 fallback 和固定样式选择",
      "project-brief.json 包含 briefMode、visualBrief、guidedBrief 和 expectationFit",
      "storyboard.json / source-map.json 包含 DeckIR 页面角色、证据、配方和可编辑边界",
      "HTML/PPTX 有足够布局类型",
      "使用真实图片/品牌素材或写明无图策略",
      "asset-plan.md 记录公开检索、ChatGPT 生成素材、来源/授权和插入目标",
      "visual-element-kit.md 记录可复用的 ChatGPT 小元素素材",
      "PPTX 中存在可编辑文本对象",
      "无 b/c 等碎片化 logo 文本"
    ]
    : [
      "manifest.json contains formal-business qualityGate",
      "project-brief.json contains bestEffectBrief, extreme-thin fallback, and fixed-style choice",
      "project-brief.json contains briefMode, visualBrief, guidedBrief, and expectationFit",
      "storyboard.json and source-map.json contain DeckIR roles, evidence, recipes, and editability boundaries",
      "HTML/PPTX expose enough layout types",
      "real image/brand assets are used or no-image strategy is explicit",
      "asset-plan.md records public searches, ChatGPT generated assets, source/license notes, and insert targets",
      "visual-element-kit.md records reusable ChatGPT-generated micro-assets",
      "PPTX contains editable text objects",
      "no b/c-style logo text fragments"
    ];

  return {
    level: "formal-business",
    requiredInputs,
    acceptanceCriteria: [...formalCriteria, ...qualityContract.acceptanceCriteria],
    artifactChecks,
    reviewCommands: [
      "python3 scripts/audit_storyboard.py <project_path>",
      "python3 scripts/audit_formal_delivery.py <project_path>",
      ...qualityContract.reviewCommands,
      "python3 scripts/review_rendered_deck.py <project_path>",
      "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run",
      ...(enginePlan.webActive ? ["node scripts/validate-swiss-deck.mjs <project_path>/ppt/index.html # only for Swiss Style Web Decks"] : [])
    ],
    assetStrategy: zh
      ? {
        mode: "chatgpt-generation-first",
        brand: "优先使用用户提供或官方公开品牌资产；没有时使用干净文字/色彩替代，并在 asset-plan.md 写明。",
        primaryEngine: "默认把 ChatGPT/OpenAI 生图作为视觉素材引擎，用来生成专用场景、小图标、指标徽章、分隔符、连接线、纹理和提示贴片。",
        microAssets: "正式生产前先生成 visual-element-kit.md 中的小元素素材包，并在页面中复用形成统一视觉语言。",
        publicSearch: "联网检索主要用于公开证据、官方参考和品牌边界；记录 URL、发布方、授权/使用说明和插入页。",
        generatedAssets: "ChatGPT/OpenAI 生成素材存到 assets/generated/，并记录 prompt 和目标页。",
        privacy: "私有资料、客户数据、内部截图默认不上传。"
      }
      : {
        mode: "chatgpt-generation-first",
        brand: "Use supplied or official public brand assets first; otherwise use a clean text/color fallback and document it in asset-plan.md.",
        primaryEngine: "Use ChatGPT/OpenAI image generation as the default visual asset engine for custom scenes, icons, metric badges, dividers, connectors, textures, and callout stickers.",
        microAssets: "Generate the visual-element-kit.md micro-assets before final production and reuse them across pages for a coherent visual language.",
        publicSearch: "Search mainly for public evidence, official references, and brand boundaries; record URL, publisher, license/usage note, and insert target.",
        generatedAssets: "Store ChatGPT/OpenAI generated assets under assets/generated/ and record prompts plus target slides.",
        privacy: "Private source material, customer data, and internal screenshots stay local by default."
      }
  };
}

function buildQualityReport(form: FormState, sources: UploadedSource[], qualityContract: QualityContract, qualityGate: QualityGate, workflowState: WorkflowState, expectationFit: ExpectationFit) {
  const zh = form.language === "zh";
  const v52 = buildV52Contract(form, sources, expectationFit);
  const bestEffectBrief = buildBestEffectBrief(form, sources, expectationFit);
  return JSON.stringify({
    version: appVersion,
    schemaVersion: v52.schemaVersion,
    presetId: form.presetId,
    status: "pending",
    createdAt: new Date().toISOString(),
    qualityProfile: qualityContract,
    qualityGate,
    workflowState,
    expectationFit,
    bestEffectBrief,
    referenceStyle: v52.referenceStyle,
    sourceConfidence: v52.sourceConfidence,
    deliveryScorecard: v52.deliveryScorecard,
    feedbackLoop: v52.feedbackLoop,
    failureTaxonomy: v52.failureTaxonomy,
    confirmationBrief: v52.confirmationBrief,
    imageAcceptance: v52.imageAcceptance,
    expectedArtifacts: qualityContract.expectedArtifacts,
    reviewCommands: qualityGate.reviewCommands,
    deckIR: {
      storyboard: "storyboard.json",
      sourceMap: "source-map.json",
      planningReport: "planning-report.json",
      renderedReview: "review-findings.json",
      repairPlan: "repair-plan.json",
      revisionBrief: "revision-brief.md"
    },
    reviewFindings: {
      status: "pending",
      path: "review-findings.json",
      findingCount: 0,
      repairCandidateCount: 0,
      repairPlan: "repair-plan.json"
    },
    reviewRepairPlan: {
      status: "pending",
      path: "repair-plan.json",
      candidateCount: 0,
      dryRunCommand: "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run",
      revisionBrief: "revision-brief.md"
    },
    summary: {
      zh: "Design Doctor / 视觉复查尚未运行。请先生成预览和最终文件，再按 reviewCommands 运行检查；默认只报告问题和建议。",
      en: "Design Doctor has not run yet. Generate preview and final files, then run reviewCommands. It reports issues and suggestions by default."
    },
    checks: [
      {
        id: "quality-contract",
        status: "pending",
        summary: zh ? "等待 Agent 按质量目标验收。" : "Waiting for the Agent to validate against the quality contract."
      },
      {
        id: "best-effect-brief",
        status: bestEffectBrief.strategy === "best-effect-fixed-style" ? "fixed-style-ready" : "expanded-brief-ready",
        summary: bestEffectBrief.userVisibleHint
      },
      {
        id: "expectation-fit",
        status: expectationFit.readyForProduction ? "ready" : "needs-guided-intake",
        summary: zh
          ? `预期契合度 ${expectationFit.score}%，风险 ${expectationFit.riskLevel}；Codex 需说明用户标签、背景资料和默认假设。`
          : `Expectation fit ${expectationFit.score}%, risk ${expectationFit.riskLevel}; Codex must state user tags, background, and assumptions.`
      },
      {
        id: "source-confidence",
        status: v52.sourceConfidence.level === "strong" ? "ready" : "needs-evidence",
        summary: zh
          ? `来源可信度：${sourceConfidenceLabel(v52.sourceConfidence.level, "zh")}；不可编造项：${v52.sourceConfidence.doNotInvent.join("、")}。`
          : `Source confidence: ${sourceConfidenceLabel(v52.sourceConfidence.level, "en")}; do-not-invent rules: ${v52.sourceConfidence.doNotInvent.join(", ")}.`
      },
      {
        id: "delivery-scorecard",
        status: v52.deliveryScorecard.recommendedNextRevision.length ? "needs-review" : "ready",
        summary: v52.deliveryScorecard.userVisibleSummary
      },
      {
        id: "feedback-loop",
        status: v52.feedbackLoop.feedbackStatus,
        summary: v52.feedbackLoop.nextRevisionIntent
      }
    ]
  }, null, 2);
}

function buildDeckIRPreview(form: FormState, storyboard: StoryItem[], sources: UploadedSource[], enginePlan: EnginePlan, qualityGate: QualityGate) {
  const claims = buildSourceClaimsForDeckIR(form, sources);
  const expectationFit = assessExpectationFit(form, sources);
  const v52 = buildV52Contract(form, sources, expectationFit);
  const slides = storyboard.map((item, index) => {
    const role = inferDeckIRRole(index, storyboard.length, `${item.title} ${item.intent}`);
    const recipe = recipeForDeckIRRole(role);
    const evidence = claims.length > 0 ? [claims[index % claims.length].id] : ["S001"];
    const bodyRole = ["context", "evidence", "comparison", "process", "benefit", "risk", "action"].includes(role);
    return {
      page: `P${String(index + 1).padStart(2, "0")}`,
      role,
      title: item.title,
      intent: item.intent,
      recipeId: recipe.recipeId,
      layoutFamily: recipe.layoutFamily,
      evidenceRefs: evidence,
      visualLayer: recipe.visualLayer,
      rasterPolicy: bodyRole ? "prohibited-formal-body" : role === "anchor" ? "allowed-cover" : "allowed-section-tail",
      editabilityTarget: role === "process" ? "editable process nodes, connectors, labels, and notes" : "editable text, shapes, evidence captions, and speaker notes",
      slideTask: {
        job: inferSlideTaskJob(role),
        primaryQuestion: slideTaskQuestion(role, form.language),
        oneSentenceTakeaway: item.intent,
        bestLayoutFamily: recipe.layoutFamily,
        mustStayEditable: bodyRole,
        evidenceRefs: evidence
      },
      speakerIntent: item.intent
    };
  });
  const storyboardJson = {
    deckIRVersion: "1.0",
    planningMode: "fallback-rule-planner",
    delivery: {
      outputMode: form.outputMode,
      stylePreset: form.stylePreset,
      preset: form.presetId,
      audience: form.audience,
      qualityGate: qualityGate.level
    },
    schemaVersion: v52.schemaVersion,
    referenceStyle: v52.referenceStyle,
    sourceConfidence: v52.sourceConfidence,
    deliveryScorecard: v52.deliveryScorecard,
    imageAcceptance: v52.imageAcceptance,
    pipeline: [
      "source.md",
      "DeckIR/storyboard",
      "page recipes/reference style",
      "editable PPTX or Web Deck",
      "rendered review",
      "human/agent revision"
    ],
    slides
  };
  const sourceMap = {
    version: "source-map-v1",
    source: "source.md",
    claims,
    slideEvidence: slides.map((slide) => ({ page: slide.page, evidenceRefs: slide.evidenceRefs }))
  };
  const planningReport = {
    version: "planning-report-v1",
    status: "planned",
    provider: {
      configured: form.modelPreference !== "auto" && form.modelPreference !== "custom",
      mode: "fallback-rule-planner",
      fallbackReason: "Web Experience writes a deterministic DeckIR preview; Bridge/Desktop can rewrite it from local source material."
    },
    summary: {
      slides: slides.length,
      roles: Array.from(new Set(slides.map((slide) => slide.role))).sort(),
      layoutFamilies: Array.from(new Set(slides.map((slide) => slide.layoutFamily))).sort(),
      output: enginePlan.pptxActive && enginePlan.webActive ? "both" : enginePlan.pptxActive ? "pptx" : "web"
    }
  };
  const reviewFindings = {
    version: "rendered-review-v1",
    status: "pending",
    findings: [],
    repairCandidates: [],
    summary: {
      findingCount: 0,
      autoFixableCount: 0,
      repairCandidateCount: 0,
      note: "review_rendered_deck.py fills this after preview/export."
    }
  };
  const repairPlan = {
    version: "review-repair-plan-v1",
    status: "pending",
    mode: "safe-only",
    dryRunDefault: true,
    candidateCount: 0,
    safeCandidateCount: 0,
    revisionBrief: "revision-brief.md",
    dryRunCommand: "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run",
    applyCommand: "python3 scripts/apply_review_plan.py <project_path> --safe-only --apply",
    candidates: [],
    summary: {
      candidateCount: 0,
      safeCandidateCount: 0,
      targetArtifacts: []
    },
    guardrails: [
      "Do not change source.md, extracted-source.md, or factual slide claims automatically.",
      "Only write DeckIR, project brief, quality report, and Agent instruction hints.",
      "Require an explicit --apply invocation for any mutation."
    ]
  };
  return JSON.stringify(
    {
      "storyboard.json": storyboardJson,
      "source-map.json": sourceMap,
      "planning-report.json": planningReport,
      "review-findings.json": reviewFindings,
      "repair-plan.json": repairPlan,
      "revision-brief.md": pendingRevisionBrief(form.title)
    },
    null,
    2
  );
}

function buildSourceClaimsForDeckIR(form: FormState, sources: UploadedSource[]) {
  const lines = [
    form.title,
    form.coreMessage,
    form.sourceNotes,
    ...sources.map((source) => source.text || source.url || source.name)
  ].join("\n").split(/\r?\n/);
  const claims = lines
    .map((line) => line.trim().replace(/^[-*+]\s*/, "").replace(/^\d+[、.)．]\s*/, ""))
    .filter(Boolean)
    .slice(0, 40)
    .map((line, index) => ({
      id: `S${String(index + 1).padStart(3, "0")}`,
      sourceLine: index + 1,
      text: line.slice(0, 180)
    }));
  return claims.length ? claims : [{ id: "S001", sourceLine: 1, text: form.title || "Ultimate PPT Master handoff" }];
}

function pendingRevisionBrief(title: string) {
  return `# v5 Delivery Review Revision Brief

Project: ${title}
Status: pending

Run \`python3 scripts/review_rendered_deck.py <project_path>\` after preview/export, then inspect \`repair-plan.json\`.

Use \`python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run\` first. This file is replaced with actionable low-risk planning hints only after explicit \`--apply\`.

Do not rewrite source facts, business conclusions, or final body copy automatically.
`;
}

function inferDeckIRRole(index: number, total: number, text: string) {
  const value = text.toLowerCase();
  if (index === 0) return "anchor";
  if (index === total - 1) return "closing";
  if (/流程|路径|步骤|办理|申请|开通|推进|process|workflow|step/.test(value)) return "process";
  if (/权益|数字|指标|数据|结果|kpi|metric|benefit|效率|触达/.test(value)) return "benefit";
  if (/风险|提醒|边界|问题|疑问|注意|risk|issue|caveat/.test(value)) return "risk";
  if (/对比|比较|差异|原流程|新流程|compare|comparison|before|after/.test(value)) return "comparison";
  if (/计划|行动|下一步|落地|安排|owner|action|roadmap|复盘/.test(value)) return "action";
  if (index === 1) return "context";
  return "evidence";
}

function inferSlideTaskJob(role: string) {
  const map: Record<string, string> = {
    anchor: "establish-topic-and-core-message",
    context: "explain-why-this-matters",
    evidence: "prove-the-claim",
    comparison: "show-the-difference",
    process: "make-the-path-actionable",
    benefit: "highlight-the-value",
    risk: "surface-caveats-and-boundaries",
    action: "turn-insight-into-next-steps",
    closing: "reinforce-decision-or-call-to-action"
  };
  return map[role] || "support-the-story";
}

function slideTaskQuestion(role: string, language: Language) {
  const zh: Record<string, string> = {
    anchor: "听众第一眼必须记住什么？",
    context: "为什么现在要看这份材料？",
    evidence: "这页用什么证据证明结论？",
    comparison: "这页要让差异变得多明显？",
    process: "听众看完能不能按步骤执行？",
    benefit: "价值、收益或关键指标是否一眼可见？",
    risk: "边界、风险或不确定性有没有讲清？",
    action: "谁在什么时候做什么？",
    closing: "最后希望听众采取什么行动？"
  };
  const en: Record<string, string> = {
    anchor: "What must the audience remember first?",
    context: "Why does this matter now?",
    evidence: "What evidence proves this claim?",
    comparison: "How visible should the difference be?",
    process: "Can the audience follow the steps afterward?",
    benefit: "Is the value, benefit, or key metric immediately visible?",
    risk: "Are boundaries, risks, and uncertainty clear?",
    action: "Who does what by when?",
    closing: "What action should the audience take next?"
  };
  return language === "zh" ? (zh[role] || "这页承担什么任务？") : (en[role] || "What job does this slide do?");
}

function recipeForDeckIRRole(role: string) {
  const map: Record<string, { layoutFamily: string; recipeId: string; visualLayer: string }> = {
    anchor: { layoutFamily: "cover_brand", recipeId: "cover_brand.hero_left_visual", visualLayer: "generated-background | no-text | 16:9" },
    context: { layoutFamily: "statement_plus_evidence", recipeId: "statement_plus_evidence.left_rule_panel", visualLayer: "subtle-pattern | no-text | 16:9" },
    evidence: { layoutFamily: "evidence_board", recipeId: "evidence_board.source_table", visualLayer: "none" },
    comparison: { layoutFamily: "comparison_matrix", recipeId: "comparison_matrix.two_column_delta", visualLayer: "none" },
    process: { layoutFamily: "process_flow", recipeId: "process_flow.horizontal_steps", visualLayer: "generated-process-accent | no-text | 16:9" },
    benefit: { layoutFamily: "metric_panel", recipeId: "metric_panel.large_number_strip", visualLayer: "generated-metric-accent | no-text | 16:9" },
    risk: { layoutFamily: "risk_callout", recipeId: "risk_callout.qa_stack", visualLayer: "none" },
    action: { layoutFamily: "action_roadmap", recipeId: "action_roadmap.owner_timeline", visualLayer: "schematic | no-text | 16:9" },
    closing: { layoutFamily: "closing_commitment", recipeId: "closing_commitment.brand_tail", visualLayer: "generated-background | no-text | 16:9" }
  };
  return map[role] || map.evidence;
}

function buildStoryboard(form: FormState): StoryItem[] {
  const zh = form.language === "zh";
  const preset = findPreset(form.presetId);
  const presetItems = preset.storyboard[form.language] || [];
  if (presetItems.length > 0) {
    const close = {
      title: zh ? "交付与检查清单" : "Delivery and QA checklist",
      intent: zh ? "要求 Agent 预览、修复并列出最终文件。" : "Ask the Agent to preview, repair, and list final files."
    };
    const targetCount = Math.max(4, Number.parseInt(form.slideCount, 10) || preset.slideCount);
    return [...presetItems, close].slice(0, Math.min(presetItems.length + 1, targetCount));
  }
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

function buildPrompt(
  form: FormState,
  storyboard: StoryItem[],
  enginePlan: EnginePlan,
  sources: UploadedSource[],
  qualityContract: QualityContract,
  qualityGate: QualityGate,
  expectationFit: ExpectationFit
) {
  const preset = findPreset(form.presetId);
  const sourceType = readOption(optionText.sourceType, form.sourceType, form.language);
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  const style = readOption(optionText.stylePreset, form.stylePreset, form.language);
  const agent = readOption(optionText.agentTool, form.agentTool, form.language);
  const model = readOption(optionText.modelPreference, form.modelPreference, form.language);
  const outline = storyboard.map((item, index) => `${index + 1}. ${item.title}: ${item.intent}`).join("\n");
  const sourceManifest = sourceSummaryMarkdown(sources, form.language);
  const presetRequirements = preset.sourceRequirements.map((item) => `- ${item[form.language]}`).join("\n");
  const presetChecks = preset.qualityChecks.map((item) => `- ${item[form.language]}`).join("\n");
  const qualityCriteria = qualityContract.acceptanceCriteria.map((item) => `- ${item}`).join("\n");
  const reviewCommands = qualityContract.reviewCommands.map((item) => `- ${item}`).join("\n");
  const expectedArtifacts = qualityContract.expectedArtifacts.map((item) => `- ${item}`).join("\n");
  const gateInputs = qualityGate.requiredInputs.map((item) => `- ${item}`).join("\n");
  const gateCriteria = qualityGate.acceptanceCriteria.map((item) => `- ${item}`).join("\n");
  const gateChecks = qualityGate.artifactChecks.map((item) => `- ${item}`).join("\n");
  const gateCommands = qualityGate.reviewCommands.map((item) => `- ${item}`).join("\n");
  const visualBriefText = buildVisualBriefMarkdown(form, expectationFit, sources);
  const briefMode = determineBriefMode(form, expectationFit, sources);
  const presetRoute = `${preset.label[form.language]} (${preset.packPath || "seed direction"})`;
  const activeEngines = [
    enginePlan.pptxActive ? `PPTX: ${enginePlan.pptxRoute}` : "",
    enginePlan.webActive ? `Web Deck: ${enginePlan.webRoute}` : ""
  ].filter(Boolean).join("\n- ");

  if (form.language === "en") {
    return `Use the ultimate-ppt-master Agent Skill for this presentation task.\n\nProject title: ${form.title}\nAudience: ${form.audience}\nCore message: ${form.coreMessage}\nSource type: ${sourceType}\nScenario: ${scenario}\nContent preset: ${presetRoute}\nOutput target: ${output}\nVisual style: ${style}\nTarget length: ${form.slideCount} slides\nPreferred agent: ${agent}\nModel preference: ${model}\nBrief mode: ${briefMode}\n\nExecution route:\n- ${activeEngines}\n- Fusion shell: ${enginePlan.fusionRoute}\n- Visual route: ${enginePlan.styleRoute}\n\nPreset source requirements:\n${presetRequirements}\n\nPreset quality checks:\n${presetChecks}\n\nDesign Doctor quality contract:\n${qualityCriteria}\n\nFormal Business Delivery Gate (${qualityGate.level}):\nRequired inputs:\n${gateInputs}\n\nAcceptance criteria:\n${gateCriteria}\n\nArtifact checks:\n${gateChecks}\n\nGate review commands:\n${gateCommands}\n\nExpected artifacts:\n${expectedArtifacts}\n\nRecommended review commands:\n${reviewCommands}\n\nSource material:\n${sourceManifest}\n\n${visualBriefText}\n\nLocal Bridge expectations:\n- If this folder was created by Agent Bridge, read extracted-source.md first, then inspect attachments/ for original files.\n- If a PDF/DOCX/PPTX/XLSX converter failed, keep the original attachment and parse it with the best local tool available.\n- Never upload private source material unless the user explicitly approves it.\n\nSuggested outline:\n${outline}\n\nRequirements:\n- Read AGENTS.md, SKILL.md, quality-checklist.md, manifest.json, and project-brief.json from the ultimate-ppt-master project folder before production.\n- If project-brief.json says expectationFit.readyForProduction is false, enter Codex Guided Intake before final production: ask one coherent group of related questions per turn, covering audience, usage setting, desired action, content source, core message, page count, visual style, brand assets, output format, and must-avoid boundaries.\n- Do not start a final-quality PPT until the guided brief is clear enough or the user explicitly says to make a draft with assumptions.\n- Respect visualBrief tags as user intent; free-text background and extra requirements override tag defaults when they conflict.\n- Build the narrative before generating slides.\n- Use the selected content preset as the default structure, but adapt it to the actual source evidence.\n- For formal business delivery, do not build the whole deck from repeated title + card pages.\n- Lock the brand assets or fallback strategy, evidence sources, image/chart plan, page rhythm, and infographic strategy before generating final files.\n- Use the PPTX route for editable PowerPoint and the Web Deck route for magazine / Swiss HTML output.\n- PPTX must use editable text, shapes, charts, and images; do not replace slides with full-page screenshots.\n- Logos and brand marks must not degrade into text fragments such as b/c.\n- Render or preview the result, inspect issues, repair obvious layout problems, and list final files.\n- Run the formal delivery audit commands before final delivery.\n- Write or update quality-report.json with the visual review result, expectation-fit status, user tags/background sources, and a plain-language Chinese summary.\n- Keep logs and intermediate artifacts in the local project folder.\n\nExtra requirements:\n${form.constraints || "No extra requirements."}`;
  }

  return `请使用 ultimate-ppt-master Agent Skill 完成这次演示文稿任务。\n\n项目标题：${form.title}\n目标听众：${form.audience}\n核心结论：${form.coreMessage}\n资料类型：${sourceType}\n使用场景：${scenario}\n内容预设：${presetRoute}\n输出目标：${output}\n视觉风格：${style}\n目标页数：${form.slideCount} 页\n优先 Agent：${agent}\n模型偏好：${model}\nBrief 模式：${briefMode}\n\n执行路线：\n- ${activeEngines}\n- Fusion shell：${enginePlan.fusionRoute}\n- 视觉路线：${enginePlan.styleRoute}\n\n预设资料要求：\n${presetRequirements}\n\n预设质量检查：\n${presetChecks}\n\nDesign Doctor 质量合同：\n${qualityCriteria}\n\n正式商务交付门禁（${qualityGate.level}）：\n必须输入：\n${gateInputs}\n\n验收标准：\n${gateCriteria}\n\n产物检查：\n${gateChecks}\n\n门禁检查命令：\n${gateCommands}\n\n预期产物：\n${expectedArtifacts}\n\n推荐检查命令：\n${reviewCommands}\n\n源资料：\n${sourceManifest}\n\n${visualBriefText}\n\n本地 Bridge 预期：\n- 如果这个目录由 Agent Bridge 创建，请先读 extracted-source.md，再检查 attachments/ 里的原始文件。\n- 如果 PDF/DOCX/PPTX/XLSX 转换失败，请保留原始附件，并用本地最合适的工具继续解析。\n- 私有资料默认留在本地，除非我明确要求，不要上传。\n\n建议页纲：\n${outline}\n\n执行要求：\n- 生产前读取项目目录里的 AGENTS.md、SKILL.md、quality-checklist.md、manifest.json 和 project-brief.json。\n- 如果 project-brief.json 里 expectationFit.readyForProduction 为 false，必须先进入 Codex 分步需求访谈：每轮只问一组相关问题，覆盖受众、场景、希望对方行动、资料来源、核心观点、页数、视觉风格、品牌素材、输出格式和禁忌边界。\n- 在 guided brief 足够明确之前，不要开始正式质量 PPT；只有用户明确说“先按默认做一版/先做草稿”时，才可以带假设生成。\n- visualBrief 标签是用户意图来源；自由粘贴的背景和特殊要求优先级高于标签默认值。\n- 先完成叙事结构，再生成页面。\n- 使用当前内容预设作为默认结构，但必须根据真实资料证据调整。\n- 正式商务交付不能只用重复的标题 + 卡片堆完整套 deck。\n- 生成最终文件前先锁定品牌资产或替代策略、证据来源、图片/图表计划、页面节奏和信息图策略。\n- PPTX 使用可编辑 PowerPoint 路线；Web Deck 使用杂志化 / Swiss HTML 路线。\n- PPTX 必须保留可编辑文本、形状、图表和图片，不能用整页截图替代可编辑对象。\n- logo 和品牌标识不得退化成 b/c 这类文字碎片。\n- 渲染或预览结果，检查问题，修复明显版式错误，并列出最终文件。\n- 最终交付前运行正式商务审计命令。\n- 写入或更新 quality-report.json，包含视觉复查结果、预期契合度、用户标签/背景资料来源和中文摘要。\n- 日志和中间产物保存在本地项目目录。\n\n补充要求：\n${form.constraints || "无额外要求。"}`;
}

function buildSourceTemplate(form: FormState, storyboard: StoryItem[], enginePlan: EnginePlan, sources: UploadedSource[], qualityContract: QualityContract, expectationFit: ExpectationFit) {
  const preset = findPreset(form.presetId);
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  const style = readOption(optionText.stylePreset, form.stylePreset, form.language);
  const outline = storyboard.map((item, index) => `- ${index + 1}. ${item.title}: ${item.intent}`).join("\n");
  const sourceManifest = sourceSummaryMarkdown(sources, form.language);
  const requirements = preset.sourceRequirements.map((item) => `- ${item[form.language]}`).join("\n");
  const roster = preset.slideRoster.map((item, index) => `- ${index + 1}. ${item[form.language]}`).join("\n");
  const qualityCriteria = qualityContract.acceptanceCriteria.map((item) => `- ${item}`).join("\n");
  const reviewCommands = qualityContract.reviewCommands.map((item) => `- ${item}`).join("\n");
  const visualBriefText = buildVisualBriefMarkdown(form, expectationFit, sources);
  const templates = [
    `- layouts: ${preset.templateCandidates.layouts.join(", ")}`,
    preset.templateCandidates.brands?.length ? `- brands: ${preset.templateCandidates.brands.join(", ")}` : "",
    `- charts: ${preset.templateCandidates.charts.join(", ")}`,
    `- webDeckStyle: ${preset.templateCandidates.webDeckStyle}`
  ].filter(Boolean).join("\n");
  if (form.language === "en") {
    return `# ${form.title}\n\n## Audience\n${form.audience}\n\n## Core message\n${form.coreMessage}\n\n## Scenario\n${scenario}\n\n## Content preset\n${preset.label.en} (${preset.packPath || "seed direction"})\n\n## Desired output\n${output}, about ${form.slideCount} slides.\n\n## Visual style\n${style}\n\n## Engine route\n- PPTX: ${enginePlan.pptxActive ? "active" : "optional"} - ${enginePlan.pptxRoute}\n- Web Deck: ${enginePlan.webActive ? "active" : "optional"} - ${enginePlan.webRoute}\n- Fusion shell: ${enginePlan.fusionRoute}\n- Style route: ${enginePlan.styleRoute}\n\n## Preset source requirements\n${requirements}\n\n## Preset slide roster\n${roster}\n\n## Preset template candidates\n${templates}\n\n## Quality profile\n${qualityCriteria}\n\n## Review commands\n${reviewCommands}\n\n## Source intake\n${sourceManifest}\n\n## Source notes\n${form.sourceNotes}\n\n${visualBriefText}\n\n## Suggested outline\n${outline}\n\n## Extra requirements\n${form.constraints}\n`;
  }
  return `# ${form.title}\n\n## 目标听众\n${form.audience}\n\n## 核心结论\n${form.coreMessage}\n\n## 使用场景\n${scenario}\n\n## 内容预设\n${preset.label.zh}（${preset.packPath || "种子方向"}）\n\n## 目标输出\n${output}，约 ${form.slideCount} 页。\n\n## 视觉风格\n${style}\n\n## 双引擎路线\n- PPTX：${enginePlan.pptxActive ? "启用" : "备用"} - ${enginePlan.pptxRoute}\n- Web Deck：${enginePlan.webActive ? "启用" : "备用"} - ${enginePlan.webRoute}\n- Fusion shell：${enginePlan.fusionRoute}\n- 视觉路线：${enginePlan.styleRoute}\n\n## 预设资料要求\n${requirements}\n\n## 预设页面结构\n${roster}\n\n## 预设模板候选\n${templates}\n\n## 质量目标\n${qualityCriteria}\n\n## 检查命令\n${reviewCommands}\n\n## 资料导入\n${sourceManifest}\n\n## 源资料要点\n${form.sourceNotes}\n\n${visualBriefText}\n\n## 建议页纲\n${outline}\n\n## 补充要求\n${form.constraints}\n`;
}

function buildExtractedSource(form: FormState, sources: UploadedSource[]) {
  const zh = form.language === "zh";
  const sections = [
    "# Extracted Source",
    "",
    zh
      ? "这是网页端可直接看到的资料预读结果。本地 Bridge 会在 handoff 后补充 PDF / Word / PPTX / Excel 的转换结果。"
      : "This is what the web app can pre-read. The local Bridge will add PDF / Word / PPTX / Excel conversion results after handoff.",
    "",
    "## Pasted notes",
    "",
    form.sourceNotes || (zh ? "暂无粘贴资料。" : "No pasted notes yet."),
    "",
    "## Visual brief background",
    "",
    form.visualBrief.backgroundText || (zh ? "暂无额外背景。" : "No additional background."),
    "",
    "## Visual brief special requirements",
    "",
    form.visualBrief.extraRequirements || (zh ? "暂无特殊要求。" : "No special requirements."),
    "",
    "## Reference links",
    "",
    form.visualBrief.referenceLinks.map((item) => `- ${item}`).join("\n") || (zh ? "- 暂无参考链接。" : "- No reference links.")
  ];

  for (const source of sources) {
    sections.push("", `## ${source.name}`, "", `Status: ${source.status}`);
    if (source.text) {
      sections.push("", source.text);
    } else if (source.url) {
      sections.push("", `${zh ? "URL 待 Bridge 抓取：" : "URL pending Bridge fetch:"} ${source.url}`);
    } else {
      sections.push("", zh ? "二进制文件已打包，等待本地 Bridge 调用转换脚本。" : "Binary file is packed for local Bridge conversion.");
    }
  }
  return `${sections.join("\n")}\n`;
}

function buildEnginePlanMarkdown(form: FormState, enginePlan: EnginePlan) {
  if (form.language === "en") {
    return `# Engine plan\n\n## Active routes\n- PPTX route: ${enginePlan.pptxActive ? "active" : "optional"}\n- Web Deck route: ${enginePlan.webActive ? "active" : "optional"}\n- Visual route: ${enginePlan.styleRoute}\n\n## Roles\n- Hugo He / ppt-master lineage: ${enginePlan.pptxRoute}\n- op7418 / Guizang lineage: ${enginePlan.webRoute}\n- Ultimate Fusion shell: ${enginePlan.fusionRoute}\n\n## Agent Connect rule\nUse the Web Experience as intake and route planning. Use local Bridge for source extraction and project staging. Use the Skill workflow for final production.\n\n## Attribution rule\nKeep the repository LICENSE and THIRD_PARTY_NOTICES intact. Do not remove upstream copyright attribution.\n`;
  }
  return `# 双引擎执行计划\n\n## 启用路线\n- PPTX 路线：${enginePlan.pptxActive ? "启用" : "备用"}\n- Web Deck 路线：${enginePlan.webActive ? "启用" : "备用"}\n- 视觉路线：${enginePlan.styleRoute}\n\n## 分工\n- Hugo He / ppt-master 路线：${enginePlan.pptxRoute}\n- op7418 / 歸藏路线：${enginePlan.webRoute}\n- Ultimate Fusion 前台：${enginePlan.fusionRoute}\n\n## Agent Connect 规则\nWeb Experience 负责导入和路线规划；本地 Bridge 负责资料解析和项目落盘；Skill 工作流负责最终生产。\n\n## 归属规则\n保留仓库 LICENSE 和 THIRD_PARTY_NOTICES，不移除上游版权归属。\n`;
}

function buildQualityChecklist(
  form: FormState,
  enginePlan: EnginePlan,
  sources: UploadedSource[],
  qualityContract: QualityContract,
  qualityGate: QualityGate,
  expectationFit: ExpectationFit
) {
  const preset = findPreset(form.presetId);
  const sourceLine = sources.length > 0
    ? sources.map((source) => `- [ ] ${source.name}: ${source.status}`).join("\n")
    : "- [ ] No uploaded files; source.md should be checked against pasted notes.";
  const presetChecks = preset.qualityChecks.map((item) => `- [ ] ${item[form.language]}`).join("\n");
  const qualityCriteria = qualityContract.acceptanceCriteria.map((item) => `- [ ] ${item}`).join("\n");
  const expectedArtifacts = qualityContract.expectedArtifacts.map((item) => `- [ ] ${item}`).join("\n");
  const reviewCommands = qualityContract.reviewCommands.map((item) => `- ${item}`).join("\n");
  const gateInputs = qualityGate.requiredInputs.map((item) => `- [ ] ${item}`).join("\n");
  const gateCriteria = qualityGate.acceptanceCriteria.map((item) => `- [ ] ${item}`).join("\n");
  const gateChecks = qualityGate.artifactChecks.map((item) => `- [ ] ${item}`).join("\n");
  const gateCommands = qualityGate.reviewCommands.map((item) => `- ${item}`).join("\n");
  const tagLine = flattenVisualTagLabels(form.visualBrief, form.language).join(" · ") || (form.language === "zh" ? "未选择标签" : "No tags selected");
  const v52 = buildV52Contract(form, sources, expectationFit);
  const bestEffectBrief = buildBestEffectBrief(form, sources, expectationFit);
  const bestEffectChecks = [
    `- [ ] ${form.language === "zh" ? "bestEffectBrief 已写入 project-brief.json / quality-report.json" : "bestEffectBrief is written to project-brief.json / quality-report.json"}.`,
    `- [ ] ${form.language === "zh" ? "策略" : "Strategy"}: ${bestEffectBrief.strategy}; ${form.language === "zh" ? "提示质量" : "prompt quality"}: ${bestEffectBrief.promptQuality}.`,
    `- [ ] ${form.language === "zh" ? "极短指令默认样式" : "Extreme thin default"}: ${bestEffectBrief.fixedStyleFallback.routeName}.`,
    `- [ ] ${form.language === "zh" ? "Agent 先自动扩写 brief，再制作" : "Agent expands the brief before production"}.`
  ].join("\n");
  const scorecardChecks = v52.deliveryScorecard.qualityDimensions.map((item) => `- [ ] ${item.label}: ${item.score}% - ${item.evidence}`).join("\n");
  const sourceConfidenceChecks = [
    `- [ ] ${form.language === "zh" ? "来源可信度" : "Source confidence"}: ${sourceConfidenceLabel(v52.sourceConfidence.level, form.language)}.`,
    ...v52.sourceConfidence.missingAreas.map((item) => `- [ ] ${item}`),
    ...v52.sourceConfidence.claimsNeedingEvidence.map((item) => `- [ ] ${item}`)
  ].join("\n");
  const referenceStyleChecks = [
    `- [ ] ${form.language === "zh" ? "参考样板方向" : "Reference style"}: ${referenceStyleLabel(v52.referenceStyle, form.language)}.`,
    `- [ ] ${form.language === "zh" ? "贴近" : "Move toward"}: ${v52.referenceStyle.positiveReferences.join(" / ")}.`,
    `- [ ] ${form.language === "zh" ? "避免" : "Avoid"}: ${v52.referenceStyle.negativeReferences.join(" / ")}.`
  ].join("\n");
  const missingSignalItems = expectationFit.missingSignals.length
    ? expectationFit.missingSignals.map((item) => `- [ ] ${item}`).join("\n")
    : (form.language === "zh" ? "- [x] 暂无关键缺口" : "- [x] No critical gaps");
  const v52ChecklistBlock = form.language === "zh"
    ? `## v5.2 交付契合\n${scorecardChecks}\n\n### 来源可信度\n${sourceConfidenceChecks}\n\n### 参考样板\n${referenceStyleChecks}\n\n### 反馈闭环\n- [ ] quality-report.json 包含 feedbackLoop 和 failureTaxonomy。\n- [ ] 如果用户说不满意，先归类原因再修订：${v52.feedbackLoop.failureTaxonomy.map((item) => item.label).join(" / ")}。`
    : `## v5.2 Delivery fit\n${scorecardChecks}\n\n### Source confidence\n${sourceConfidenceChecks}\n\n### Reference style\n${referenceStyleChecks}\n\n### Feedback loop\n- [ ] quality-report.json includes feedbackLoop and failureTaxonomy.\n- [ ] If the user says the deck is unsatisfactory, classify the reason before revising: ${v52.feedbackLoop.failureTaxonomy.map((item) => item.label).join(" / ")}.`;
  const missingSignals = `${v52ChecklistBlock}\n\n${missingSignalItems}`;
  const assumptions = expectationFit.assumptions.map((item) => `- [ ] ${item}`).join("\n");
  if (form.language === "en") {
    return `# Quality checklist\n\n## Selected preset\n${presetChecks}\n\n## Design Doctor contract\n${qualityCriteria}\n\n## Formal Business Delivery Gate\nLevel: ${qualityGate.level}\n\n### Required inputs\n${gateInputs}\n\n### Acceptance criteria\n${gateCriteria}\n\n### Artifact checks\n${gateChecks}\n\n### Gate review commands\n${gateCommands}\n\n## Expected artifacts\n${expectedArtifacts}\n\n## Review commands\n${reviewCommands}\n\n## v5.3 Best-Effect Brief Enhancer\n${bestEffectChecks}\n\n## Expectation fit\n- [ ] Risk level: ${expectationFit.riskLevel}; score: ${expectationFit.score}%; readyForProduction: ${expectationFit.readyForProduction ? "yes" : "no"}.\n- [ ] User-selected tags are reflected in structure, visual style, assets, and output: ${tagLine}.\n- [ ] If readyForProduction is false, Codex runs Guided Intake before final production.\n- [ ] quality-report.json explains user tags, pasted background, assumptions, and remaining expectation risk.\n\n### Missing signals\n${missingSignals}\n\n### Assumptions to verify or record\n${assumptions || "- [ ] No assumptions recorded yet."}\n\n## Source and story\n- [ ] extracted-source.md reflects real source files, not only pasted notes.\n- [ ] Core message appears in the cover and conclusion.\n- [ ] Every slide has one job and one primary takeaway.\n- [ ] Sensitive material stays local unless the user explicitly approves upload.\n- [ ] Brand assets or a documented replacement strategy are locked before generating final files.\n- [ ] Evidence, image choices, chart/data plans, page rhythm, and infographic strategy are explicit.\n\n## Source files\n${sourceLine}\n\n## PPTX route\n- [ ] Route status: ${enginePlan.pptxActive ? "active" : "optional"}.\n- [ ] Text, shapes, charts, and notes remain editable.\n- [ ] No full-slide screenshot replacement for editable PPTX content.\n- [ ] Logos and brand marks are real assets or clean vector/text treatments, not stray fragments.\n- [ ] Run SVG/PPTX rendering checks from the Skill workflow.\n- [ ] Inspect exported pages and repair clipping, overlaps, tiny text, and broken charts.\n\n## Web Deck route\n- [ ] Route status: ${enginePlan.webActive ? "active" : "optional"}.\n- [ ] Use ${enginePlan.styleRoute} consistently.\n- [ ] Desktop and mobile viewports do not overlap text, controls, or media.\n- [ ] Visual completeness includes real images, charts, or an explicit no-image strategy.\n\n## Delivery\n- [ ] Final files are named clearly.\n- [ ] quality-report.json includes the visual review result and Chinese summary.\n- [ ] Include what was generated, what was checked, and which source files were parsed.\n- [ ] Keep upstream license and third-party notices intact.\n`;
  }
  return `# 质量检查清单\n\n## 当前预设\n${presetChecks}\n\n## Design Doctor 合同\n${qualityCriteria}\n\n## 正式商务交付门禁\n等级：${qualityGate.level}\n\n### 必须输入\n${gateInputs}\n\n### 验收标准\n${gateCriteria}\n\n### 产物检查\n${gateChecks}\n\n### 门禁检查命令\n${gateCommands}\n\n## 预期产物\n${expectedArtifacts}\n\n## 检查命令\n${reviewCommands}\n\n## v5.3 Best-Effect Brief Enhancer\n${bestEffectChecks}\n\n## 预期契合度\n- [ ] 风险等级：${expectationFit.riskLevel}；分数：${expectationFit.score}%；可正式制作：${expectationFit.readyForProduction ? "是" : "否"}。\n- [ ] 用户选择的标签已体现在结构、视觉、素材和输出中：${tagLine}。\n- [ ] 如果 readyForProduction 为 false，Codex 已先完成分步需求访谈。\n- [ ] quality-report.json 说明用户标签、粘贴背景、默认假设和剩余预期风险。\n\n### 已知缺口\n${missingSignals}\n\n### 需确认或记录的默认假设\n${assumptions || "- [ ] 暂无默认假设。"}\n\n## 资料与叙事\n- [ ] extracted-source.md 已根据真实源文件修正，而不只是网页粘贴摘要。\n- [ ] 核心结论出现在封面和收束页。\n- [ ] 每一页只承担一个主要任务，并有清晰 takeaway。\n- [ ] 敏感资料默认留在本地，除非用户明确同意上传。\n- [ ] 生成最终文件前，品牌资产或替代策略已锁定。\n- [ ] 证据来源、图片选择、图表/数据计划、页面节奏和信息图策略已明确。\n\n## 源文件\n${sourceLine}\n\n## PPTX 路线\n- [ ] 路线状态：${enginePlan.pptxActive ? "启用" : "备用"}。\n- [ ] 文本、形状、图表、备注保持可编辑。\n- [ ] 不用整页截图替代 PPTX 可编辑内容。\n- [ ] logo 和品牌标识是真实素材、干净矢量或规范文字处理，不是零散文字碎片。\n- [ ] 按 Skill 工作流运行 SVG / PPTX 渲染检查。\n- [ ] 检查导出页面并修复裁切、重叠、小字和图表损坏。\n\n## Web Deck 路线\n- [ ] 路线状态：${enginePlan.webActive ? "启用" : "备用"}。\n- [ ] 统一使用 ${enginePlan.styleRoute}。\n- [ ] 桌面端和移动端不出现文字、控件或媒体互相遮挡。\n- [ ] 视觉完整度包含真实图片、图表，或明确的无图策略。\n\n## 交付\n- [ ] 最终文件命名清晰。\n- [ ] quality-report.json 包含视觉复查结果和中文摘要。\n- [ ] 简短说明生成了什么、检查了什么、解析了哪些源文件。\n- [ ] 保留上游版权和第三方声明。\n`;
}

function buildAssetPlanObject(form: FormState, sources: UploadedSource[], qualityGate: QualityGate) {
  const webDeck = buildWebDeckPlan(form, sources);
  const backend = "codex";
  const baseItems = webDeck.style === "swiss"
    ? [
      {
        id: "s22-hero",
        slide: 6,
        slot: "s22-hero-21x9",
        asset_type: "hero",
        aspect_ratio: "21:9",
        text_policy: "none",
        source_policy: "generated",
        backend,
        prompt_path: "prompts/s22-hero.md",
        status: "Pending",
        current_generation_evidence: []
      },
      {
        id: "screenshot-frame",
        slide: 3,
        slot: "s15-grid-16x10",
        asset_type: "screenshot-frame",
        aspect_ratio: "16:10",
        text_policy: "limited-labels",
        source_policy: "needs-manual",
        backend: "manual",
        prompt_path: "prompts/screenshot-frame.md",
        status: "Needs-Manual",
        current_generation_evidence: []
      },
      {
        id: "limited-labels-infographic",
        slide: 4,
        slot: "s16-grid-21x9",
        asset_type: "infographic",
        aspect_ratio: "21:9",
        text_policy: "limited-labels",
        source_policy: "generated",
        backend,
        prompt_path: "prompts/limited-labels-infographic.md",
        status: "Pending",
        current_generation_evidence: []
      }
    ]
    : [
      {
        id: "editorial-hero",
        slide: 1,
        slot: "hero-16x9",
        asset_type: "hero",
        aspect_ratio: "16:9",
        text_policy: "none",
        source_policy: "generated",
        backend,
        prompt_path: "prompts/editorial-hero.md",
        status: "Pending",
        current_generation_evidence: []
      }
    ];
  return {
    version: "asset-plan-v5.4",
    project: {
      title: form.title,
      language: form.language,
      assetPlanRequired: true,
      webDeckStyle: webDeck.style,
      qualityGate: qualityGate.level
    },
    rules: [
      "Plan assets before generation.",
      "image_prompts.json is generated from asset_plan.json generated items only.",
      "Do not reuse historical generated_images as current output.",
      "Generated assets require current_generation_evidence.",
      "If the backend is unavailable, mark Needs-Manual instead of blocking the deck."
    ],
    items: baseItems
  };
}

function assetPromptText(item: Record<string, unknown>) {
  return [
    `Asset id: ${String(item.id || "asset")}`,
    `Slide: ${String(item.slide || "pending")}`,
    `Slot: ${String(item.slot || "pending")}`,
    `Asset type: ${String(item.asset_type || "hero")}`,
    `Aspect ratio: ${String(item.aspect_ratio || "16:9")}`,
    `Text policy: ${String(item.text_policy || "none")}`,
    "Create only the image asset for this slot, not a full slide.",
    "No fake logos, no page title, no page number, and no unapproved IP.",
    "If text is needed, keep it to short labels only and prefer editable deck text."
  ].join("\n");
}

function assetPromptFiles(assetPlanJson: string) {
  const plan = safeJson(assetPlanJson) as { items?: unknown[] };
  if (!Array.isArray(plan.items)) return [] as Array<{ path: string; text: string }>;
  return plan.items
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({ path: String(item.prompt_path || ""), text: assetPromptText(item) }))
    .filter((item) => item.path.startsWith("prompts/") && item.path.endsWith(".md"));
}

function buildAssetPlan(form: FormState, sources: UploadedSource[], qualityGate: QualityGate) {
  const zh = form.language === "zh";
  const sourceLine = sourceSummaryMarkdown(sources, form.language);
  const gateInputs = qualityGate.requiredInputs.map((item) => `- ${item}`).join("\n");
  const expectationFit = assessExpectationFit(form, sources);
  const v52 = buildV52Contract(form, sources, expectationFit);
  const assetPlanJson = JSON.stringify(buildAssetPlanObject(form, sources, qualityGate), null, 2);
  const referenceLine = zh
    ? `- 参考样板：${referenceStyleLabel(v52.referenceStyle, "zh")}；贴近 ${v52.referenceStyle.positiveReferences.join(" / ")}；避免 ${v52.referenceStyle.negativeReferences.join(" / ")}。`
    : `- Reference style: ${referenceStyleLabel(v52.referenceStyle, "en")}; move toward ${v52.referenceStyle.positiveReferences.join(" / ")}; avoid ${v52.referenceStyle.negativeReferences.join(" / ")}.`;
  const imageAcceptanceLine = zh
    ? `- 图片验收：${v52.imageAcceptance.defaultPolicy} ${v52.imageAcceptance.replacementRule}`
    : `- Image acceptance: ${v52.imageAcceptance.defaultPolicy} ${v52.imageAcceptance.replacementRule}`;
  if (zh) {
    return `# asset-plan.md

## 项目
${form.title}

## 正式商务门禁输入
${gateInputs}

## v5.2 视觉意图与图片验收
${referenceLine}
${imageAcceptanceLine}

## v5.4 Asset Factory JSON
\`\`\`json
${assetPlanJson}
\`\`\`

## ChatGPT 生成素材
- [ ] 把 ChatGPT/OpenAI 作为主要视觉素材引擎：先生成页面专用配图和小元素素材，再用公开检索补证据/官方参考。
- [ ] 生成 visual-element-kit.md 中的小元素素材包：分隔符、指标徽章、流程节点、连接线、图标点缀、低对比纹理和提示贴片。
- [ ] 生成位图保存到 assets/generated/，生成 SVG 或图标保存到 assets/generated/svg/。
- [ ] 记录 prompt、文件名、目标页、人工修改和插入方式。

## 公开素材检索
- [ ] 先检查 attachments/、extracted-source.md 和 source.md，确认哪些素材已经由用户提供。
- [ ] 联网检索主要用于真实证据、官方截图、公开政策/行业来源或品牌边界。
- [ ] 每个候选素材都记录 URL、发布方、授权/使用说明、目标页和是否已插入。
- [ ] 私有资料、客户数据、内部截图默认不上传；需要上传时必须先得到用户明确许可。

## 插入计划
| 页面 | 素材需求 | 来源或 prompt | 文件路径 | 状态 |
| --- | --- | --- | --- | --- |
| 封面 | 品牌安全主视觉或规范 logo 处理 | 待定 | 待定 | 待定 |
| 证据页 | 支撑结论的图片/截图/图表 | 待定 | 待定 | 待定 |
| 流程页 | 可编辑流程图或生成场景图 | 待定 | 待定 | 待定 |

## 当前资料
${sourceLine}

## 交付规则
所有插入的图片、图标、logo、截图或生成素材都必须在这里登记。若最终不用图片，请在这里写明无图策略，并确保 manifest.json / project-brief.json 同步说明。
`;
  }
  return `# asset-plan.md

## Project
${form.title}

## Formal Business Gate Inputs
${gateInputs}

## v5.2 visual intent and image acceptance
${referenceLine}
${imageAcceptanceLine}

## v5.4 Asset Factory JSON
\`\`\`json
${assetPlanJson}
\`\`\`

## ChatGPT generated assets
- [ ] Treat ChatGPT/OpenAI as the primary visual asset engine: generate custom slide visuals and small reusable elements first, then use public search for evidence or official references.
- [ ] Generate the visual-element-kit.md micro-assets: section dividers, metric badges, process nodes, connectors, icon accents, subtle textures, and callout stickers.
- [ ] Save generated bitmaps under assets/generated/ and generated SVG/icons under assets/generated/svg/.
- [ ] Record prompt, filename, target slide, manual edits, and insertion method.

## Public asset search
- [ ] Inspect attachments/, extracted-source.md, and source.md before searching.
- [ ] Use public web search mainly for factual evidence, official screenshots, public policy/industry sources, or brand boundaries.
- [ ] Record URL, publisher, license/usage note, target slide, and insertion status for every candidate.
- [ ] Private source files, customer data, and internal screenshots stay local unless the user explicitly approves upload.

## Insertion plan
| Slide / Section | Asset need | Source or prompt | File path | Status |
| --- | --- | --- | --- | --- |
| Cover | brand-safe hero visual or approved logo treatment | pending | pending | pending |
| Evidence page | image/screenshot/chart supporting a claim | pending | pending | pending |
| Process page | editable diagram or generated scene | pending | pending | pending |

## Current sources
${sourceLine}

## Delivery rule
Every inserted image, icon, logo, screenshot, or generated visual must be listed here. If no imagery is used, write the explicit no-image strategy here and sync it into manifest.json / project-brief.json.
`;
}

function buildVisualElementKit(form: FormState, qualityGate: QualityGate) {
  const zh = form.language === "zh";
  const mode = qualityGate.assetStrategy?.mode || "chatgpt-generation-first";
  if (zh) {
    return `# visual-element-kit.md

项目：${form.title}
模式：${mode}

## 目的
把 ChatGPT/OpenAI 作为主要视觉素材引擎。正式生成页面前，先做一批可复用小元素素材，让整套 deck 有统一视觉语言，而不是到处找随机图库。

## micro-assets / 小元素素材
| 素材类型 | 数量目标 | 用途 | 输出目录 | 状态 |
| --- | ---: | --- | --- | --- |
| section divider | 3 | 章节过渡、封面后分隔页 | assets/generated/dividers/ | pending |
| metric badge | 6 | KPI、权益数字、评分、关键指标 | assets/generated/badges/ | pending |
| process node | 5 | 流程页、时间线、办理路径 | assets/generated/process/ | pending |
| connector | 6 | 箭头、虚线、因果链、交接路径 | assets/generated/connectors/ | pending |
| icon accent | 8 | 证据、风险、动作、用户、渠道等小图标 | assets/generated/icons/ | pending |
| subtle pattern or texture | 2 | 封面、章节背景、低对比层次 | assets/generated/patterns/ | pending |
| callout sticker | 4 | 办理提醒、风险提示、决策提示 | assets/generated/callouts/ | pending |

## Prompt 模板
- "Create a clean business presentation metric badge for [theme], flat vector-like style, transparent background, no text, colors aligned to [palette]."
- "Create a small process node icon for [step], formal government/finance presentation style, isolated object, no text, editable-friendly shape language."
- "Create a subtle abstract background texture for [theme], low contrast, no letters, no logos, widescreen presentation use."

## 插入规则
- 小元素用于增强页面语言，正文、数字、图表标签仍用可编辑文本。
- 生成素材插入 PPTX/Web Deck 时保留为真实图片或图形对象，不做整页截图。
- 公开检索只负责证据、官方参考和品牌边界；视觉语言主要靠 ChatGPT 生成。
- 每个生成文件都同步登记到 asset-plan.md：prompt、文件名、目标页、插入状态。
`;
  }
  return `# visual-element-kit.md

Project: ${form.title}
Mode: ${mode}

## Purpose
Use ChatGPT/OpenAI as the primary visual asset engine. Generate small reusable elements before final slide production so the deck has a coherent visual language without relying on random stock imagery.

## Micro-assets / small reusable elements
| Asset type | Quantity target | Use | Output path | Status |
| --- | ---: | --- | --- | --- |
| section divider | 3 | chapter breaks and transition slides | assets/generated/dividers/ | pending |
| metric badge | 6 | KPI callouts, rights/benefits numbers, scorecards | assets/generated/badges/ | pending |
| process node | 5 | flow pages, timelines, service journey diagrams | assets/generated/process/ | pending |
| connector | 6 | arrows, dotted links, handoff paths, causal chains | assets/generated/connectors/ | pending |
| icon accent | 8 | small semantic markers for evidence, risk, action, user, channel | assets/generated/icons/ | pending |
| subtle pattern or texture | 2 | cover, section backgrounds, low-contrast visual depth | assets/generated/patterns/ | pending |
| callout sticker | 4 | reminders, caveats, delivery notes, decision highlights | assets/generated/callouts/ | pending |

## Prompt pattern
- "Create a clean business presentation metric badge for [theme], flat vector-like style, transparent background, no text, colors aligned to [palette]."
- "Create a small process node icon for [step], formal government/finance presentation style, isolated object, no text, editable-friendly shape language."
- "Create a subtle abstract background texture for [theme], low contrast, no letters, no logos, widescreen presentation use."

## Insertion rules
- Use micro-assets to enrich the visual system; keep body copy, numbers, and chart labels editable.
- Insert generated assets into PPTX/Web Deck as real images or graphic objects, not full-slide screenshots.
- Use public search for evidence, official references, and brand boundaries; use ChatGPT-generated micro-assets for the visual language.
- Register every generated file in asset-plan.md with prompt, filename, target slide, and insertion status.
`;
}

function buildCodexTask(
  form: FormState,
  enginePlan: EnginePlan,
  sources: UploadedSource[],
  qualityGate: QualityGate,
  workflowState: WorkflowState,
  qualityContract: QualityContract,
  expectationFit: ExpectationFit
) {
  const zh = form.language === "zh";
  const gateInputs = qualityGate.requiredInputs.map((item) => `- ${item}`).join("\n");
  const gateCriteria = qualityGate.acceptanceCriteria.map((item) => `- ${item}`).join("\n");
  const gateChecks = qualityGate.artifactChecks.map((item) => `- ${item}`).join("\n");
  const expectedArtifacts = qualityContract.expectedArtifacts.map((item) => `- ${item}`).join("\n");
  const reviewCommands = qualityGate.reviewCommands.map((item) => `- ${item}`).join("\n");
  const sourceLine = sourceSummaryMarkdown(sources, form.language);
  const visualBriefText = buildVisualBriefMarkdown(form, expectationFit, sources);
  const briefMode = determineBriefMode(form, expectationFit, sources);
  const bestEffectBrief = buildBestEffectBrief(form, sources, expectationFit);
  if (zh) {
    return `# Codex Task

项目：${form.title}
当前步骤：${workflowState.currentStep}
阻塞原因：${workflowState.blockedReason || "无"}
Brief 模式：${briefMode}
bestEffectBrief：${bestEffectBrief.strategy} / ${bestEffectBrief.promptQuality} / ${bestEffectBrief.recommendedRoute}

## 先读这些文件
1. AGENTS.md
2. manifest.json
3. project-brief.json
4. storyboard.json
5. source-map.json
6. planning-report.json
7. review-findings.json
8. repair-plan.json
9. revision-brief.md
10. quality-checklist.md
11. asset-plan.md
12. visual-element-kit.md
13. agent-prompt.md
14. extracted-source.md 和 attachments/

## 正式商务门禁
必须输入：
${gateInputs}

验收标准：
${gateCriteria}

产物检查：
${gateChecks}

## 预期契合与分步问清
${visualBriefText}

### Codex 执行规则
- 先执行 Best-Effect Brief Enhancer：不要直接把用户短指令拿去生成，必须先按 project-brief.json.bestEffectBrief 自动扩写最佳效果 brief。
- 若 bestEffectBrief.strategy=best-effect-fixed-style，执行 Extreme Thin Prompt Fallback，默认走 Style A Editorial Fixed Rhythm，不再追问普通风格偏好。
- 如果 expectationFit.readyForProduction 为 false，先进入分步需求访谈，不要直接制作正式 PPT。
- 每轮只问一组相关问题，按顺序问清：给谁看、什么场景、希望对方做什么、内容来源、核心观点、页数/章节、视觉风格、品牌/IP/官方素材、输出格式、禁忌边界。
- 用户回答后整理一份需求确认稿，写入 project-brief.json / quality-report.json 的 guidedBrief 和 expectationFit。
- 只有 brief 足够明确，或用户明确说“先按默认做一版/草稿”，才允许带假设开始制作。
- Web 标签是用户意图来源；自由粘贴背景和特殊要求优先级高于标签默认值。

## Codex 素材工作流
1. 先检查用户给的附件和 extracted-source.md，不要跳过真实资料。
2. 把 ChatGPT/OpenAI 作为主要视觉素材引擎，先生成页面专用配图和小元素素材。
3. 在 manifest.json 记录的仓库根目录运行：\`python3 scripts/generate_visual_element_kit.py <project_path>\`。
4. 如果没有 IMAGE_BACKEND/OpenAI key，不要阻塞：使用 images/image_prompts.md 里的 Needs-Manual prompts，在 ChatGPT 生成后保存到列出的 outputPath。
5. 按 visual-element-kit.md 生成 micro-assets：section divider、metric badge、process node、connector、icon accent、texture、callout sticker。
6. 生成素材保存到 assets/generated/，再作为真实图片或图形插入 PPTX/Web Deck；不要用整页截图糊弄可编辑 PPTX。
7. 联网检索主要用于事实证据、官方参考、品牌边界和来源引用。
8. 把生成素材 prompt 和公开来源/授权说明都写入 asset-plan.md。
9. 图表、表格、标签和 PPTX 文字尽量保留可编辑结构。

## 生产步骤
1. 先读 storyboard.json 作为 DeckIR 页面地图，读 source-map.json 作为证据边界。
2. 锁定品牌/替代策略、证据边界、页面节奏、信息图策略、asset-plan.md 和 visual-element-kit.md。
3. 按 Ultimate PPT Master Skill 生产 ${enginePlan.pptxActive ? "PPTX" : "Web Deck"}${enginePlan.webActive && enginePlan.pptxActive ? " + Web Deck" : ""}。
4. 版式需要覆盖叙事、对比、流程/时间线、指标、决策和收束页，不能重复标题卡片。
5. logo 不得退化成 b/c 这类碎片文字。
6. 运行 audit_storyboard.py 和 review_rendered_deck.py。
7. 先运行 apply_review_plan.py --safe-only --dry-run；只有用户确认后才允许 --apply 写入安全规划提示，不得自动改事实内容。
8. 更新 quality-report.json，写清检查项、修复项和剩余风险。

## 预期产物
${expectedArtifacts}

## 检查命令
${reviewCommands}

## 当前资料
${sourceLine}

最终回复必须列出生成文件、插入的 ChatGPT 小元素素材、使用过的公开参考、运行过的检查命令和剩余风险。
`;
  }
  return `# Codex Task

Project: ${form.title}
Current step: ${workflowState.currentStep}
Blocked reason: ${workflowState.blockedReason || "none"}
Brief mode: ${briefMode}
bestEffectBrief: ${bestEffectBrief.strategy} / ${bestEffectBrief.promptQuality} / ${bestEffectBrief.recommendedRoute}

## Read first
1. AGENTS.md
2. manifest.json
3. project-brief.json
4. storyboard.json
5. source-map.json
6. planning-report.json
7. review-findings.json
8. repair-plan.json
9. revision-brief.md
10. quality-checklist.md
11. asset-plan.md
12. visual-element-kit.md
13. agent-prompt.md
14. extracted-source.md and attachments/

## Formal business gate
Required inputs:
${gateInputs}

Acceptance criteria:
${gateCriteria}

Artifact checks:
${gateChecks}

## Expectation fit and guided intake
${visualBriefText}

### Codex execution rules
- Run the Best-Effect Brief Enhancer first: do not generate directly from the user's short instruction; expand the best-effect brief from project-brief.json.bestEffectBrief.
- If bestEffectBrief.strategy=best-effect-fixed-style, follow the Extreme Thin Prompt Fallback and use Style A Editorial Fixed Rhythm without asking more ordinary style questions.
- If expectationFit.readyForProduction is false, run guided intake before final deck production.
- Ask one coherent group of related questions per turn, covering audience, usage setting, desired action, content source, core message, slide count / sections, visual style, brand/IP/official assets, output format, and must-avoid boundaries.
- After the user answers, write a concise confirmation brief and update guidedBrief plus expectationFit in project-brief.json / quality-report.json.
- Start production only when the brief is clear enough, or when the user explicitly asks for a draft with assumptions.
- Treat Web tags as user intent; pasted background and special requirements override tag defaults.

## Codex asset workflow
1. Inspect supplied attachments and extracted-source.md before searching.
2. Treat ChatGPT/OpenAI as the primary visual asset engine: generate custom slide visuals and small reusable elements before final assembly.
3. From the repository root recorded in manifest.json, run: \`python3 scripts/generate_visual_element_kit.py <project_path>\`.
4. If no IMAGE_BACKEND/OpenAI key is configured, do not block: use the Needs-Manual prompts in images/image_prompts.md with ChatGPT and save outputs to the listed outputPath.
5. Generate the visual-element-kit.md micro-assets: section divider, metric badge, process node, connector, icon accent, subtle texture, and callout sticker.
6. Save generated assets under assets/generated/ and insert them into the PPTX/Web Deck as real image objects, not flattened full-slide screenshots.
7. Use public web search mainly for factual evidence, official references, brand boundaries, or source citations.
8. Record every generated prompt and every public source/license note in asset-plan.md.
9. Keep charts, tables, labels, and PPTX text editable wherever possible.

## Production steps
1. Read storyboard.json as the DeckIR page map and source-map.json as the evidence boundary.
2. Lock brand/fallback strategy, evidence boundaries, page rhythm, infographic strategy, asset-plan.md, and visual-element-kit.md.
3. Produce the requested PPTX/Web Deck using the Ultimate PPT Master Skill workflow.
4. Vary layouts across narrative, comparison, timeline/process, metric, decision, and closing pages.
5. Do not let logos degrade into b/c-style text fragments.
6. Run audit_storyboard.py and review_rendered_deck.py.
7. Run apply_review_plan.py --safe-only --dry-run first; only use --apply after user confirmation, and never rewrite facts automatically.
8. Update quality-report.json with checks run, issues found, repairs made, and remaining risk.

## Expected artifacts
${expectedArtifacts}

## Review commands
${reviewCommands}

## Current sources
${sourceLine}

Final response must list generated files, ChatGPT micro-assets inserted, public references used, review commands run, and remaining risks.
`;
}

function buildCodexAgentGuide(form: FormState, sources: UploadedSource[], qualityGate: QualityGate, expectationFit: ExpectationFit) {
  const v52 = buildV52Contract(form, sources, expectationFit);
  const bestEffectBrief = buildBestEffectBrief(form, sources, expectationFit);
  if (form.language === "zh") {
    return `# AGENTS.md

## Codex 本地规则
- 工作范围限于这个 handoff 文件夹和 Ultimate PPT Master 仓库脚本。
- 编辑或生成前先读 codex-task.md。
- 先看 project-brief.json 的 bestEffectBrief、briefMode、visualBrief、guidedBrief、expectationFit、sourceConfidence、deliveryScorecard、referenceStyle 和 feedbackLoop；如果 readyForProduction=false，必须先分步问清需求。
- Best-Effect Brief Enhancer：生产前先根据 bestEffectBrief 自动扩写最佳效果 brief，不要直接按用户短指令开做。
- Extreme Thin Prompt Fallback：当前 bestEffectBrief 为 ${bestEffectBrief.strategy} / ${bestEffectBrief.promptQuality}；如果是 best-effect-fixed-style，默认用 Style A Editorial Fixed Rhythm。
- 分步问清每轮只问一组相关问题，直到受众、场景、目的、资料、核心观点、页数、风格、素材边界、输出和禁忌明确。
- 当前 expectationFit：${expectationFit.riskLevel} / ${expectationFit.score}%；${expectationFit.readyForProduction ? "可以进入生产，但仍需记录假设。" : "需要 guided intake 后再生产。"}
- 当前 sourceConfidence：${sourceConfidenceLabel(v52.sourceConfidence.level, "zh")}；不可编造：${v52.sourceConfidence.doNotInvent.join("、")}。
- 当前 referenceStyle：${referenceStyleLabel(v52.referenceStyle, "zh")}；贴近 ${v52.referenceStyle.positiveReferences.join(" / ")}；避免 ${v52.referenceStyle.negativeReferences.join(" / ")}。
- 若用户不满意，先按 feedbackLoop.failureTaxonomy 归因，再写 revision-brief.md；不要直接重做全套。
- 生成最终页面前先读 storyboard.json 和 source-map.json；它们定义 DeckIR 页面地图、证据边界和可编辑要求。
- 私有资料、客户数据、内部截图和 API key 默认不上传；除非用户明确同意。
- ChatGPT/OpenAI 生图是主要视觉素材引擎。先读 visual-element-kit.md，需要视觉丰富度时先运行或处理 scripts/generate_visual_element_kit.py。
- 如果没有配置 image backend/key，使用 images/image_prompts.md 里的 Needs-Manual prompts，在 ChatGPT 生成后保存到 assets/generated/。
- 允许为了公开证据、官方参考和品牌边界进行联网检索，但必须把来源、授权/使用说明和插入目标写入 asset-plan.md。
- 生成文件放到 assets/generated/，prompt 写入 asset-plan.md。
- ${qualityGate.level} 交付不得以重复标题卡、整页截图 PPTX、碎片 logo 或缺失 quality-report.json 收尾。
- 存在 HTML 或 PPTX 产物时，最终回复前运行正式商务审计。
- 生成前运行 audit_storyboard.py，预览/导出后运行 review_rendered_deck.py。
- 先用 apply_review_plan.py --dry-run 查看修复计划；--apply 只能写规划提示，不得改写来源事实。
`;
  }
  return `# AGENTS.md

## Codex local rules
- Work only in this handoff folder and the Ultimate PPT Master repository scripts.
- Read codex-task.md before editing or generating deliverables.
- Read bestEffectBrief, briefMode, visualBrief, guidedBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, and feedbackLoop in project-brief.json first; if readyForProduction=false, run guided intake before production.
- Best-Effect Brief Enhancer: auto-expand the best-effect brief from bestEffectBrief before production; do not work directly from the user's short instruction.
- Extreme Thin Prompt Fallback: current bestEffectBrief is ${bestEffectBrief.strategy} / ${bestEffectBrief.promptQuality}; if it is best-effect-fixed-style, default to Style A Editorial Fixed Rhythm.
- Guided intake asks one related question group at a time until audience, setting, purpose, sources, core message, slide count, style, asset boundary, output, and must-avoid rules are clear.
- Current expectationFit: ${expectationFit.riskLevel} / ${expectationFit.score}%; ${expectationFit.readyForProduction ? "production may start after recording assumptions." : "guided intake is required before production."}
- Current sourceConfidence: ${sourceConfidenceLabel(v52.sourceConfidence.level, "en")}; do not invent: ${v52.sourceConfidence.doNotInvent.join(", ")}.
- Current referenceStyle: ${referenceStyleLabel(v52.referenceStyle, "en")}; move toward ${v52.referenceStyle.positiveReferences.join(" / ")}; avoid ${v52.referenceStyle.negativeReferences.join(" / ")}.
- If the user is unsatisfied, classify the reason with feedbackLoop.failureTaxonomy before revising; do not blindly remake the whole deck.
- Read storyboard.json and source-map.json before final slide generation; they define the DeckIR page map, evidence boundary, and editability requirements.
- Keep private source material, customer data, internal screenshots, and API keys local unless the user explicitly approves upload.
- ChatGPT/OpenAI image generation is the primary visual asset engine. Read visual-element-kit.md and run or handle scripts/generate_visual_element_kit.py first when the deck needs visual richness.
- If no image backend/key is configured, use images/image_prompts.md Needs-Manual prompts with ChatGPT and save outputs under assets/generated/.
- Public web search is allowed mainly for evidence, official references, and brand boundaries; record sources, usage notes, and insertion targets in asset-plan.md.
- Save generated outputs under assets/generated/ and record prompts in asset-plan.md.
- ${qualityGate.level} delivery must not finish with repeated title-card slides, flat PPTX screenshots, broken logo fragments, or missing quality-report.json.
- Run the formal delivery audit before final response whenever HTML or PPTX artifacts exist.
- Run audit_storyboard.py before generation and review_rendered_deck.py after preview/export.
- Run apply_review_plan.py with --dry-run first; --apply may only write planning hints and must not rewrite source facts.
`;
}

function buildWebDeckHtml(form: FormState, storyboard: StoryItem[], enginePlan: EnginePlan, sources: UploadedSource[]) {
  const zh = form.language === "zh";
  const preset = findPreset(form.presetId);
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  const style = readOption(optionText.stylePreset, form.stylePreset, form.language);
  const notes = extractBullets(form.sourceNotes);
  const sourceBadges = sources.slice(0, 4).map((source) => source.name).join(" / ") || (zh ? "粘贴资料" : "Pasted notes");
  const swiss = form.stylePreset === "swiss";
  const className = swiss ? "swiss" : "editorial";
  const safeTitle = escapeHtml(form.title || (zh ? "未命名演示" : "Untitled deck"));
  const safeAudience = escapeHtml(form.audience || (zh ? "目标听众待补充" : "Audience pending"));
  const safeCore = escapeHtml(form.coreMessage || (zh ? "核心结论待补充" : "Core message pending"));
  const safeConstraints = escapeHtml(form.constraints || (zh ? "无额外要求" : "No extra requirements"));
  const noteCards = notes.length > 0
    ? notes.slice(0, 4).map((note, index) => `<li><b>${String(index + 1).padStart(2, "0")}</b><span>${escapeHtml(note)}</span></li>`).join("")
    : `<li><b>01</b><span>${zh ? "把真实资料交给 Bridge 后，Agent 会补齐数据、证据和页面内容。" : "After real files are sent to Bridge, the Agent will fill data, evidence, and slide content."}</span></li>`;
  const previewLayouts = ["narrative", "comparison", "timeline", "metrics", "decision"];
  const storySlides = storyboard.map((item, index) => `
    <section class="slide story" data-layout="${previewLayouts[index % previewLayouts.length]}">
      <div class="slide-index">${String(index + 1).padStart(2, "0")}</div>
      <div class="slide-grid">
        <p class="kicker">${escapeHtml(preset.label[form.language])} / ${escapeHtml(scenario)} / ${escapeHtml(style)}</p>
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
    body { font-family: "Avenir Next", "SF Pro Display", "PingFang SC", Arial, sans-serif; color: #172033; background: #f4f1e8; }
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
    .cover .footer { color: rgba(255,255,255,0.62); }
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
  <main class="deck" aria-label="${safeTitle}">
    <section class="slide cover" data-layout="cover">
      <div>
        <p class="kicker">Ultimate PPT Master / ${escapeHtml(preset.label[form.language])}</p>
        <h1>${safeTitle}</h1>
        <p class="lead">${safeCore}</p>
        <div class="meta">
          <span>${safeAudience}</span>
          <span>${escapeHtml(output)}</span>
          <span>${escapeHtml(sourceBadges)}</span>
        </div>
      </div>
      <p class="footer">${zh ? "浏览器本地生成的预览稿 - 用于交给 Agent 继续生产" : "Browser-local preview - hand this to the Agent for production"}</p>
    </section>
    <section class="slide" data-layout="source-signal">
      <div>
        <p class="kicker">${zh ? "资料信号" : "Source signal"}</p>
        <h2>${zh ? "从文件、URL 和摘要到可执行 brief" : "From files, URLs, and notes to executable brief"}</h2>
      </div>
      <ul class="source-list">${noteCards}</ul>
      <p class="footer">${safeConstraints}</p>
    </section>
    ${storySlides}
    <section class="slide" data-layout="production-route">
      <div>
        <p class="kicker">${zh ? "生产路线" : "Production route"}</p>
        <h2>${zh ? "网页负责连接，Skill 负责高质量成品" : "Web connects. Skill produces."}</h2>
      </div>
      <div class="qa-grid">
        <div><strong>PPTX</strong><p>${escapeHtml(enginePlan.pptxRoute)}</p></div>
        <div><strong>Web Deck</strong><p>${escapeHtml(enginePlan.webRoute)}</p></div>
        <div><strong>Bridge</strong><p>${zh ? "本地解析资料、生成项目目录，并给 Agent 一条可执行命令。" : "Parse locally, stage the project, and give the Agent an executable command."}</p></div>
      </div>
      <p class="footer">${zh ? "正式交付前请执行 quality-checklist.md。" : "Run quality-checklist.md before final delivery."}</p>
    </section>
  </main>
</body>
</html>`;
}

function buildBriefObject(
  form: FormState,
  storyboard: StoryItem[],
  readiness: { score: number; missing: string[] },
  enginePlan: EnginePlan,
  sources: UploadedSource[],
  qualityContract: QualityContract,
  qualityGate: QualityGate,
  workflowState: WorkflowState,
  expectationFit: ExpectationFit
) {
  const preset = findPreset(form.presetId);
  const visualBrief = normalizeVisualBrief(form.visualBrief);
  const v52 = buildV52Contract({ ...form, visualBrief }, sources, expectationFit);
  const bestEffectBrief = buildBestEffectBrief({ ...form, visualBrief }, sources, expectationFit);
  const webDeck = buildWebDeckPlan({ ...form, visualBrief }, sources);
  return {
    version: appVersion,
    schemaVersion: v52.schemaVersion,
    briefMode: determineBriefMode({ ...form, visualBrief }, expectationFit, sources),
    title: form.title,
    audience: form.audience,
    coreMessage: form.coreMessage,
    language: form.language,
    sourceType: form.sourceType,
    preset: {
      id: preset.id,
      label: preset.label[form.language],
      packPath: preset.packPath,
      userLevel: qualityContract.userLevel,
      sourceRequirements: preset.sourceRequirements.map((item) => item[form.language]),
      templateCandidates: preset.templateCandidates,
      qualityChecks: preset.qualityChecks.map((item) => item[form.language]),
      notFor: qualityContract.notFor,
      proofArtifacts: qualityContract.proofArtifacts
    },
    qualityProfile: qualityContract,
    qualityGate,
    workflowState,
    expectedArtifacts: qualityContract.expectedArtifacts,
    reviewCommands: qualityGate.reviewCommands,
    visualBrief: {
      ...visualBrief,
      selectedTagLabels: visualTagLabelsByGroup(visualBrief, form.language),
      flatTagLabels: flattenVisualTagLabels(visualBrief, form.language)
    },
    guidedBrief: buildGuidedBrief({ ...form, visualBrief }),
    expectationFit,
    bestEffectBrief,
    webDeck,
    assetPlanRequired: true,
    referenceStyle: v52.referenceStyle,
    sourceConfidence: v52.sourceConfidence,
    deliveryScorecard: v52.deliveryScorecard,
    feedbackLoop: v52.feedbackLoop,
    failureTaxonomy: v52.failureTaxonomy,
    confirmationBrief: v52.confirmationBrief,
    imageAcceptance: v52.imageAcceptance,
    deckIR: {
      storyboard: "storyboard.json",
      sourceMap: "source-map.json",
      planningReport: "planning-report.json",
      renderedReview: "review-findings.json",
      repairPlan: "repair-plan.json",
      revisionBrief: "revision-brief.md"
    },
    scenario: form.scenario,
    outputMode: form.outputMode,
    stylePreset: form.stylePreset,
    agentTool: form.agentTool,
    modelPreference: form.modelPreference,
    slideCount: form.slideCount,
    constraints: form.constraints,
    sourceCount: sources.length,
    sources: sources.map(sourceForManifest),
    enginePlan,
    readiness,
    storyboard
  };
}

function buildManifest(
  form: FormState,
  sources: UploadedSource[],
  readiness: { score: number; missing: string[] },
  enginePlan: EnginePlan,
  bridge: BridgeHealth | null,
  qualityContract: QualityContract,
  qualityGate: QualityGate,
  workflowState: WorkflowState,
  expectationFit: ExpectationFit
) {
  const preset = findPreset(form.presetId);
  const visualBrief = normalizeVisualBrief(form.visualBrief);
  const v52 = buildV52Contract({ ...form, visualBrief }, sources, expectationFit);
  const bestEffectBrief = buildBestEffectBrief({ ...form, visualBrief }, sources, expectationFit);
  const webDeck = buildWebDeckPlan({ ...form, visualBrief }, sources);
  return {
    version: appVersion,
    schemaVersion: v52.schemaVersion,
    createdAt: new Date().toISOString(),
    app: "Ultimate PPT Master Agent Connect Studio",
    privacy: {
      hostedBackend: false,
      browserStoresApiKeys: false,
      bridgeTarget: bridgeUrl
    },
    bridge: bridge
      ? {
        connected: true,
        version: bridge.version,
        outputDir: bridge.outputDir,
        allowLaunch: bridge.allowLaunch
      }
      : { connected: false },
    form: {
      title: form.title,
      language: form.language,
      presetId: form.presetId,
      scenario: form.scenario,
      outputMode: form.outputMode,
      stylePreset: form.stylePreset,
      agentTool: form.agentTool,
      modelPreference: form.modelPreference
    },
    preset: {
      id: preset.id,
      label: preset.label[form.language],
      packPath: preset.packPath || null,
      status: preset.packPath ? "stable-pack" : "seed",
      userLevel: qualityContract.userLevel,
      notFor: qualityContract.notFor,
      proofArtifacts: qualityContract.proofArtifacts || null
    },
    qualityProfile: qualityContract,
    qualityGate,
    workflowState,
    briefMode: determineBriefMode({ ...form, visualBrief }, expectationFit, sources),
    visualBrief: {
      ...visualBrief,
      selectedTagLabels: visualTagLabelsByGroup(visualBrief, form.language),
      flatTagLabels: flattenVisualTagLabels(visualBrief, form.language)
    },
    guidedBrief: buildGuidedBrief({ ...form, visualBrief }),
    expectationFit,
    bestEffectBrief,
    webDeck,
    assetPlanRequired: true,
    referenceStyle: v52.referenceStyle,
    sourceConfidence: v52.sourceConfidence,
    deliveryScorecard: v52.deliveryScorecard,
    feedbackLoop: v52.feedbackLoop,
    failureTaxonomy: v52.failureTaxonomy,
    confirmationBrief: v52.confirmationBrief,
    imageAcceptance: v52.imageAcceptance,
    expectedArtifacts: qualityContract.expectedArtifacts,
    reviewCommands: qualityGate.reviewCommands,
    deckIR: {
      storyboard: "storyboard.json",
      sourceMap: "source-map.json",
      planningReport: "planning-report.json",
      renderedReview: "review-findings.json",
      repairPlan: "repair-plan.json",
      revisionBrief: "revision-brief.md"
    },
    readiness,
    enginePlan,
    attachments: sources.map(sourceForManifest)
  };
}

function sourceForManifest(source: UploadedSource) {
  return {
    id: source.id,
    kind: source.kind,
    name: source.name,
    type: source.type,
    size: source.size,
    extension: source.extension,
    parseStatus: source.status,
    addedAt: source.addedAt,
    url: source.url || undefined
  };
}

async function buildHandoffZip({
  sourceTemplate,
  extractedSource,
  prompt,
  briefJson,
  webDeckHtml,
  enginePlanMarkdown,
  qualityChecklist,
  qualityReport,
  deckIRPreview,
  assetPlan,
  assetPlanJson,
  visualElementKit,
  codexTask,
  codexAgentGuide,
  manifestJson,
  readme,
  sources
}: {
  sourceTemplate: string;
  extractedSource: string;
  prompt: string;
  briefJson: string;
  webDeckHtml: string;
  enginePlanMarkdown: string;
  qualityChecklist: string;
  qualityReport: string;
  deckIRPreview: string;
  assetPlan: string;
  assetPlanJson: string;
  visualElementKit: string;
  codexTask: string;
  codexAgentGuide: string;
  manifestJson: string;
  readme: string;
  sources: UploadedSource[];
}) {
  const zip = new JSZip();
  zip.file("source.md", sourceTemplate);
  zip.file("extracted-source.md", extractedSource);
  zip.file("agent-prompt.md", prompt);
  zip.file("project-brief.json", briefJson);
  zip.file("preview-web-deck.html", webDeckHtml);
  zip.file("engine-plan.md", enginePlanMarkdown);
  zip.file("quality-checklist.md", qualityChecklist);
  const deckIR = safeJson(deckIRPreview) as Record<string, unknown>;
  zip.file("storyboard.json", JSON.stringify(deckIR["storyboard.json"] || {}, null, 2));
  zip.file("source-map.json", JSON.stringify(deckIR["source-map.json"] || {}, null, 2));
  zip.file("planning-report.json", JSON.stringify(deckIR["planning-report.json"] || {}, null, 2));
  zip.file("review-findings.json", JSON.stringify(deckIR["review-findings.json"] || {}, null, 2));
  zip.file("repair-plan.json", JSON.stringify(deckIR["repair-plan.json"] || {}, null, 2));
  zip.file("revision-brief.md", typeof deckIR["revision-brief.md"] === "string" ? String(deckIR["revision-brief.md"]) : pendingRevisionBrief("Ultimate PPT Master handoff"));
  zip.file("asset-plan.md", assetPlan);
  zip.file("asset_plan.json", assetPlanJson);
  for (const promptFile of assetPromptFiles(assetPlanJson)) {
    zip.file(promptFile.path, promptFile.text);
  }
  zip.file("visual-element-kit.md", visualElementKit);
  zip.file("codex-task.md", codexTask);
  zip.file("AGENTS.md", codexAgentGuide);
  zip.file("quality-report.json", qualityReport);
  zip.file("manifest.json", manifestJson);
  zip.file("README.md", readme);
  zip.file("attachments/manifest.json", JSON.stringify(sources.map(sourceForManifest), null, 2));
  for (const source of sources) {
    if (source.kind === "url") continue;
    const filename = `attachments/${safeArchiveName(source.name)}`;
    if (source.dataBase64) {
      zip.file(filename, source.dataBase64, { base64: true });
    } else {
      zip.file(filename, source.text || "");
    }
  }
  return zip;
}

function buildBridgePayload({
  form,
  sourceTemplate,
  prompt,
  briefObject,
  webDeckHtml,
  enginePlanMarkdown,
  qualityChecklist,
  qualityReport,
  deckIRPreview,
  assetPlan,
  assetPlanJson,
  visualElementKit,
  codexTask,
  codexAgentGuide,
  qualityContract,
  qualityGate,
  workflowState,
  readme,
  sources
}: {
  form: FormState;
  sourceTemplate: string;
  extractedSource: string;
  prompt: string;
  briefObject: ReturnType<typeof buildBriefObject>;
  webDeckHtml: string;
  enginePlanMarkdown: string;
  qualityChecklist: string;
  qualityReport: string;
  deckIRPreview: string;
  assetPlan: string;
  assetPlanJson: string;
  visualElementKit: string;
  codexTask: string;
  codexAgentGuide: string;
  qualityContract: QualityContract;
  qualityGate: QualityGate;
  workflowState: WorkflowState;
  readme: string;
  sources: UploadedSource[];
}) {
  return {
    version: appVersion,
    form,
    sourceMarkdown: sourceTemplate,
    agentPrompt: prompt,
    projectBrief: briefObject,
    previewWebDeckHtml: webDeckHtml,
    enginePlanMarkdown,
    qualityChecklist,
    qualityReport,
    deckIRPreview,
    assetPlan,
    assetPlanJson,
    visualElementKit,
    codexTask,
    codexAgentGuide,
    qualityProfile: qualityContract,
    qualityGate,
    workflowState,
    expectedArtifacts: qualityContract.expectedArtifacts,
    reviewCommands: qualityGate.reviewCommands,
    readme,
    attachments: sources.map((source) => ({
      id: source.id,
      kind: source.kind,
      name: source.name,
      type: source.type,
      size: source.size,
      text: source.text,
      dataBase64: source.dataBase64,
      url: source.url
    }))
  };
}

function buildKitReadme(form: FormState, enginePlan: EnginePlan, sources: UploadedSource[]) {
  const preset = findPreset(form.presetId);
  if (form.language === "en") {
    return `# Ultimate PPT Master handoff kit

Files:
- source.md: structured source brief
- extracted-source.md: browser pre-read source plus Bridge conversion target
- attachments/: original source files
- manifest.json: handoff metadata and quality contract
- agent-prompt.md: prompt to send to the Agent
- project-brief.json: machine-readable settings
- preview-web-deck.html: browser-local Web Deck preview
- engine-plan.md: PPTX / Web Deck / Fusion route split
- quality-checklist.md: production checks before delivery
- asset-plan.md: public references, ChatGPT generated assets, source/license notes, and insertion targets
- visual-element-kit.md: ChatGPT-generation-first micro-assets plan for small reusable elements
- codex-task.md: Codex-specific production sequence
- AGENTS.md: local Codex rules for privacy, assets, and quality gates
- quality-report.json: Design Doctor review status and summary

Preset: ${preset.label.en} (${preset.packPath || "seed direction"})
Source count: ${sources.length}

Active route:
- PPTX: ${enginePlan.pptxActive ? "active" : "optional"}
- Web Deck: ${enginePlan.webActive ? "active" : "optional"}
- Style: ${enginePlan.styleRoute}

Next step:
Open this folder in Codex first, or another local Agent that can read the ultimate-ppt-master Skill. Ask Codex to read AGENTS.md, codex-task.md, visual-element-kit.md, asset-plan.md, and agent-prompt.md; run or handle scripts/generate_visual_element_kit.py for ChatGPT-first micro-assets; use Needs-Manual prompts when no image key is configured; use public search for evidence or official references; run the review commands; and update quality-report.json before producing.
`;
  }
  return `# Ultimate PPT Master handoff kit

文件：
- source.md：结构化资料 brief
- extracted-source.md：网页预读资料和 Bridge 转换目标
- attachments/：原始源文件
- manifest.json：交付元数据和质量合同
- agent-prompt.md：发给 Agent 的执行 prompt
- project-brief.json：机器可读配置
- preview-web-deck.html：浏览器本地 Web Deck 预览
- engine-plan.md：PPTX / Web Deck / Fusion 路线分工
- quality-checklist.md：交付前生产检查清单
- asset-plan.md：公开参考、ChatGPT 生成素材、来源/授权和插入位置
- visual-element-kit.md：ChatGPT 生图优先的小元素素材计划
- codex-task.md：Codex 专用生产步骤
- AGENTS.md：Codex 本地隐私、素材和质量门禁规则
- quality-report.json：Design Doctor 复查状态和中文摘要

内容预设：${preset.label.zh}（${preset.packPath || "种子方向"}）
源文件数量：${sources.length}

启用路线：
- PPTX：${enginePlan.pptxActive ? "启用" : "备用"}
- Web Deck：${enginePlan.webActive ? "启用" : "备用"}
- 视觉：${enginePlan.styleRoute}

下一步：
优先用 Codex 打开这个文件夹，或交给其他能读取 ultimate-ppt-master Skill 的本地 Agent。请 Codex 先读 AGENTS.md、codex-task.md、visual-element-kit.md、asset-plan.md 和 agent-prompt.md；运行或处理 scripts/generate_visual_element_kit.py 生成 ChatGPT-first 小元素素材；无 key 时使用 Needs-Manual prompts；公开检索主要用于证据或官方参考；运行检查命令，并在生产前更新 quality-report.json。
`;
}

function sourceSummaryMarkdown(sources: UploadedSource[], language: Language) {
  if (sources.length === 0) {
    return language === "zh"
      ? "- 暂无上传文件；当前只使用粘贴摘要。"
      : "- No uploaded files yet; use pasted notes only.";
  }
  return sources.map((source) => {
    const size = source.kind === "url" ? "URL" : formatBytes(source.size);
    return `- ${source.name} (${source.status}, ${size})${source.url ? ` - ${source.url}` : ""}`;
  }).join("\n");
}

function fallbackProviders(language: Language): ProviderStatus[] {
  return [
    { id: "openai", label: "OpenAI / compatible", configured: false, envKeys: ["OPENAI_API_KEY", "LLM_API_KEY"], baseUrl: "https://api.openai.com/v1" },
    { id: "gemini", label: "Gemini", configured: false, envKeys: ["GEMINI_API_KEY", "GOOGLE_API_KEY"] },
    { id: "qwen", label: "Qwen / DashScope", configured: false, envKeys: ["QWEN_API_KEY", "DASHSCOPE_API_KEY"] },
    { id: "deepseek", label: "DeepSeek", configured: false, envKeys: ["DEEPSEEK_API_KEY"] },
    { id: "custom", label: language === "zh" ? "自定义 LLM Bridge" : "Custom LLM bridge", configured: false, envKeys: ["LLM_BASE_URL", "LLM_API_KEY"] }
  ];
}

function fallbackAgents(): AgentStatus[] {
  return [
    { id: "codex", label: "Codex", command: "codex", available: false },
    { id: "claude", label: "Claude Code", command: "claude", available: false },
    { id: "hermes", label: "Hermes", command: "hermes", available: false },
    { id: "openclaw", label: "OpenClaw", command: "openclaw", available: false }
  ];
}

function fallbackSkillTargets(language: Language): SkillTargetStatus[] {
  return [
    {
      id: "codex",
      label: language === "zh" ? "Codex Skill" : "Codex Skill",
      targetPath: "~/.codex/skills/ultimate-ppt-master",
      installCommand: fallbackSkillInstallCommand("$HOME/.codex/skills/ultimate-ppt-master"),
      installed: false,
      managed: false,
      mode: "offline",
      message: language === "zh" ? "启动 Bridge 后可检测真实安装状态。" : "Start Bridge to detect real install status."
    },
    {
      id: "generic",
      label: language === "zh" ? "通用 Agent Skill" : "Generic Agent Skill",
      targetPath: "~/agent-skills/ultimate-ppt-master",
      installCommand: fallbackSkillInstallCommand("$HOME/agent-skills/ultimate-ppt-master"),
      installed: false,
      managed: false,
      mode: "offline",
      message: language === "zh" ? "适合 OpenClaw、Hermes 或其他自定义 Agent 读取。" : "Use this for OpenClaw, Hermes, or custom Agent setups.",
    }
  ];
}

function fallbackSkillInstallCommand(targetPath: string) {
  return `TARGET="${targetPath}"; REPO="${repoUrl}"; mkdir -p "$(dirname "$TARGET")"; if [ -d "$TARGET/.git" ]; then git -C "$TARGET" pull --ff-only; elif [ -e "$TARGET" ]; then echo "Existing unmanaged path: $TARGET"; exit 1; else git clone "$REPO" "$TARGET"; fi`;
}

function mergeProviderTests(providers: ProviderStatus[], tests: Record<string, ProviderStatus["lastTest"]>) {
  return providers.map((provider) => ({ ...provider, lastTest: tests[provider.id] }));
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsText(file);
  });
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function isBrowserTextFile(extension: string, mimeType: string) {
  return ["text/", "application/json"].some((prefix) => mimeType.startsWith(prefix)) ||
    [".md", ".markdown", ".txt", ".csv", ".json", ".html", ".htm"].includes(extension);
}

function fileExtension(name: string) {
  const match = name.toLowerCase().match(/\.[^.]+$/);
  return match ? match[0] : "";
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeArchiveName(name: string) {
  return name.replace(/[^\w.\-()\u4e00-\u9fa5]+/g, "_") || "source";
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
