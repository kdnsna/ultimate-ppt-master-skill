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
import type { ChangeEvent, DragEvent } from "react";
import { findPreset, presetCatalog, type PresetId, type WebPreset } from "./presetCatalog";

type Language = "zh" | "en";
type SourceType = "markdown" | "docx" | "pdf" | "url" | "pptx" | "mixed";
type Scenario = "executive" | "consulting" | "training" | "launch" | "investor";
type OutputMode = "pptx" | "web" | "both";
type StylePreset = "business" | "consulting" | "editorial" | "swiss" | "academic";
type AgentTool = "codex" | "claude" | "hermes" | "openclaw" | "generic";
type SkillTarget = "codex" | "generic";
type ModelPreference = "auto" | "openai" | "gemini" | "qwen" | "deepseek" | "custom";
type PreviewMode = "prompt" | "source" | "extracted" | "manifest" | "brief" | "webdeck" | "checklist";
type WorkspaceView = "start" | "sources" | "configuration" | "handoff" | "preview";
type UploadedSourceKind = "file" | "url";
type UploadedSourceStatus = "textExtracted" | "attachedOnly" | "urlOnly";

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
  };
}

const baseUrl = import.meta.env.BASE_URL;
const repoUrl = "https://github.com/kdnsna/ultimate-ppt-master-skill";
const demoUrl = `${baseUrl}examples/agentic-developer-tools-2026/web-demo.html`;
const skillDocUrl = `${repoUrl}#use-as-agent-skill`;
const bridgeDocUrl = `${repoUrl}/blob/main/docs/agent-connect-bridge.md`;
const bridgeUrl = "http://127.0.0.1:43188";
const storageKey = "ultimate-ppt-master-web-brief-v2.3";
const appVersion = "2.3.3";

const labels = {
  zh: {
    product: "Ultimate PPT Master",
    studio: "PPT 项目准备工作台",
    route: `v${appVersion} · 先填任务、再检测本机、最后交给 AI 助手`,
    subtitle: "把资料、目标、页数和风格先整理清楚；检测你电脑上可用的本机工具；最后生成一个能交给 AI 助手继续制作的本地项目包。",
    whyTitle: "v2.3 最大提升是什么？",
    whySubtitle: "不再只解释“能做什么”，而是把资料、路线、命令、示例产物和质量检查放到同一个工作台里，让用户知道该给什么、会得到什么、怎么交给 AI 助手验收。",
    whyCards: [
      { title: "输入更清楚", text: "示例直接展示资料文件、给 AI 助手的任务说明和真实生成结果。" },
      { title: "更新更容易", text: "已经安装的用户可以用一条命令更新本地仓库或 Skill。" },
      { title: "交付更可验", text: "本地项目包会保留执行路线、文件清单、检查清单和预览文件。" },
      { title: "质量不降级", text: "最终仍走 PPT Master 与歸藏路线，网页负责整理和交接。" }
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
    bridgeOfflineHelp: "本机连接器（Bridge）还没启动，网页暂时不能查看你电脑上装了哪些 AI 助手。先在这个仓库终端运行：",
    bridgeOnlineHelp: "本机连接器（Bridge）已启动，网页可以识别本机 AI 助手并写入本地项目包（handoff）。",
    copyBridgeCommand: "复制 npm run bridge",
    refreshBridge: "重新检测",
    firstStepHandoff: "生成本地项目包",
    firstStepHandoffText: "点“发送到本机连接器（Bridge）”，再点“启动 / 复制 AI 助手命令”。",
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
    navStart: "开始",
    navSources: "资料与目标",
    navConfig: "配置检测",
    navHandoff: "交给 AI 助手",
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
    setupTitle: "一键配置 / 检测",
    setupSubtitle: "网页不能绕过你的电脑权限直接动系统；Bridge 在线时可以一键把本仓库登记到 Codex / 通用 Agent Skill 目录，离线时会复制可执行命令。",
    oneClickDetect: "一键检测",
    oneClickConfig: "一键选择可用 AI 助手",
    autoSelectAgentOk: "已选择可用 AI 助手：{agent}",
    autoSelectAgentMissing: "还没有检测到可用 AI 助手，请先启动本机连接器（Bridge）或安装 Codex / Hermes / OpenClaw / Claude。",
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
    skillInstallNeedsBridge: "Bridge 未连接，已复制安装命令。先在终端运行它，再回到网页重新检测。",
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
    sendBridge: "发送到本机连接器",
    launchAgent: "启动 / 复制 AI 助手命令",
    skillSetup: "AI 技能安装说明",
    bridgeSetup: "本机连接器说明",
    sourcePanel: "资料导入",
    structurePanel: "目标与路线",
    handoffPanel: "交接给 AI 助手",
    providerPanel: "模型账号 / Key 状态",
    previewPrompt: "AI 助手任务说明",
    previewSource: "source.md",
    previewExtracted: "extracted-source.md",
    previewManifest: "manifest.json",
    previewBrief: "brief.json",
    previewWebDeck: "preview-web-deck.html",
    previewChecklist: "quality-checklist.md",
    contentPreset: "内容预设",
    presetSummary: "预设说明",
    presetRoute: "推荐路线",
    presetRequirements: "资料要求",
    presetTemplates: "模板候选",
    presetChecks: "关键检查",
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
    demoText: "v2.3 脱敏样板，展示输入材料到 Web Deck 成品的路径。",
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
    studio: "PPT Project Prep Studio",
    route: `v${appVersion} · write the task, check this Mac, hand off to an AI helper`,
    subtitle: "Organize sources, goals, slide count, and style first; check which local tools are available on this computer; then create a local project folder an AI helper can continue from.",
    whyTitle: "What is new in v2.3?",
    whySubtitle: "The product no longer only explains what it can do. It puts source material, route choices, update commands, demo outputs, and quality checks into one workspace so users know what to provide, what they get, and how an AI helper should verify it.",
    whyCards: [
      { title: "Input is clearer", text: "Examples show the source file, AI-helper task, and real generated output." },
      { title: "Updates are easier", text: "Existing users can update a local clone or Skill install with one command." },
      { title: "Delivery is checkable", text: "Local project folders preserve the route, file manifest, checklist, and preview files." },
      { title: "Quality stays upstream", text: "Final production still uses PPT Master and Guizang routes; web handles staging." }
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
    bridgeOfflineHelp: "The local connector (Bridge) is not running yet, so the page cannot see which AI helpers are installed. Run this in the repo terminal:",
    bridgeOnlineHelp: "The local connector (Bridge) is running. The page can detect local AI helpers and write a local project folder (handoff).",
    copyBridgeCommand: "Copy npm run bridge",
    refreshBridge: "Check again",
    firstStepHandoff: "Create local project",
    firstStepHandoffText: "Click Send to local connector, then Launch / copy AI-helper command.",
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
    navStart: "Start",
    navSources: "Sources",
    navConfig: "Config",
    navHandoff: "AI helper",
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
    setupTitle: "One-click setup / checks",
    setupSubtitle: "The page cannot bypass your computer permissions. When Bridge is online, it can register this repo in Codex / generic Agent Skill folders; offline, it copies an executable command.",
    oneClickDetect: "One-click check",
    oneClickConfig: "Choose available AI helper",
    autoSelectAgentOk: "Selected available AI helper: {agent}",
    autoSelectAgentMissing: "No available AI helper detected yet. Start the local connector (Bridge) or install Codex / Hermes / OpenClaw / Claude.",
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
    skillInstallNeedsBridge: "Bridge is offline, so the install command was copied. Run it in Terminal, then check again.",
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
    sendBridge: "Send to local connector",
    launchAgent: "Launch / copy AI-helper command",
    skillSetup: "AI Skill setup",
    bridgeSetup: "Local connector guide",
    sourcePanel: "Source intake",
    structurePanel: "Target and route",
    handoffPanel: "Hand off to AI helper",
    providerPanel: "Model account / key status",
    previewPrompt: "AI-helper task",
    previewSource: "source.md",
    previewExtracted: "extracted-source.md",
    previewManifest: "manifest.json",
    previewBrief: "brief.json",
    previewWebDeck: "preview-web-deck.html",
    previewChecklist: "quality-checklist.md",
    contentPreset: "Content preset",
    presetSummary: "Preset summary",
    presetRoute: "Recommended route",
    presetRequirements: "Source requirements",
    presetTemplates: "Template candidates",
    presetChecks: "Key checks",
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
    demoText: "A v2.3 sanitized sample showing source material turning into a Web Deck.",
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
  constraints: "结论先行，减少空话；PPTX 保留可编辑结构；Web Deck 更适合传播；不要上传敏感资料，生成后检查预览和导出文件。"
};

export function App() {
  const [form, setForm] = useState<FormState>(() => loadSavedForm());
  const [activeView, setActiveView] = useState<WorkspaceView>("start");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("prompt");
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
  const readiness = useMemo(() => scoreBrief(form, sources), [form, sources]);
  const manifest = useMemo(() => buildManifest(form, sources, readiness, enginePlan, bridge), [form, sources, readiness, enginePlan, bridge]);
  const prompt = useMemo(() => buildPrompt(form, storyboard, enginePlan, sources), [form, storyboard, enginePlan, sources]);
  const sourceTemplate = useMemo(() => buildSourceTemplate(form, storyboard, enginePlan, sources), [form, storyboard, enginePlan, sources]);
  const extractedSource = useMemo(() => buildExtractedSource(form, sources), [form, sources]);
  const qualityChecklist = useMemo(() => buildQualityChecklist(form, enginePlan, sources), [form, enginePlan, sources]);
  const webDeckHtml = useMemo(() => buildWebDeckHtml(form, storyboard, enginePlan, sources), [form, storyboard, enginePlan, sources]);
  const briefObject = useMemo(() => buildBriefObject(form, storyboard, readiness, enginePlan, sources), [form, storyboard, readiness, enginePlan, sources]);
  const briefJson = useMemo(() => JSON.stringify(briefObject, null, 2), [briefObject]);
  const manifestJson = useMemo(() => JSON.stringify(manifest, null, 2), [manifest]);
  const providers = useMemo(() => mergeProviderTests(bridge?.providers || fallbackProviders(form.language), providerTests), [bridge, form.language, providerTests]);
  const agents = bridge?.agents || fallbackAgents();
  const skillTargets = bridge?.skillTargets?.length ? bridge.skillTargets : fallbackSkillTargets(form.language);
  const selectedAgent = agents.find((agent) => agent.id === form.agentTool);
  const availableAgents = agents.filter((agent) => agent.available);
  const recommendedAgent = selectedAgent?.available ? selectedAgent : availableAgents[0];
  const visiblePreview =
    previewMode === "prompt"
      ? prompt
      : previewMode === "source"
        ? sourceTemplate
        : previewMode === "extracted"
          ? extractedSource
          : previewMode === "manifest"
            ? manifestJson
            : previewMode === "brief"
              ? briefJson
              : previewMode === "webdeck"
                ? webDeckHtml
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
      constraints: brief.constraints
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
      if (!health) await copyText("npm run bridge");
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
          <div className="header-actions">
            <button className="primary-action" onClick={sendToBridge}>
              <PlugZap size={18} />
              {t.sendBridge}
            </button>
            <button className="secondary-action" onClick={downloadHandoffKit}>
              <Download size={18} />
              {t.downloadKit}
            </button>
          </div>
        </section>

        <section className="status-strip" aria-label="Workflow safeguards">
          <span><ShieldCheck size={15} />{t.pagesOnly}</span>
          <span><Server size={15} />{t.bridgeLocal}</span>
          <span><KeyRound size={15} />{t.keySafe}</span>
        </section>

        <WorkspaceNav
          activeView={activeView}
          labels={t}
          sourceCount={sources.length}
          readiness={readiness.score}
          bridge={bridge}
          onChange={setActiveView}
        />

        <PageGuide activeView={activeView} labels={t} />

        <BeginnerGuide
          bridge={bridge}
          checking={bridgeChecking}
          selectedAgent={selectedAgent}
          recommendedAgent={recommendedAgent}
          labels={t}
          onCheckBridge={() => void checkBridge(false)}
          onCopyBridgeCommand={() => void copyText("npm run bridge")}
          onUseRecommendedAgent={() => void autoSelectAgent()}
          onSendBridge={() => void sendToBridge()}
          onLaunchAgent={() => void launchOrCopyAgent()}
        />

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

        <ConfigurationPage
          bridge={bridge}
          agents={agents}
          providers={providers}
          skillTargets={skillTargets}
          selectedAgent={selectedAgent}
          labels={t}
          testingProvider={testingProvider}
          installingSkill={installingSkill}
          bridgeMessage={bridgeMessage}
          onCheckBridge={() => void checkBridge(false)}
          onCopyBridgeCommand={() => void copyText("npm run bridge")}
          onAutoSelectAgent={() => void autoSelectAgent()}
          onTestAllProviders={() => void testAllProviders()}
          onSelectAgent={(agentId) => update("agentTool", agentId)}
          onInstallSkill={(targetId) => void installSkill(targetId)}
          onCopySkillCommand={(targetId) => void copySkillInstallCommand(targetId)}
        />

        <section className="studio-grid">
          <section className="panel source-panel" aria-labelledby="source-title">
            <PanelTitle icon={UploadCloud} id="source-title" title={t.sourcePanel} />
            <div className="control-grid">
              <SelectField label={t.contentPreset} value={form.presetId} onChange={(value) => applyPreset(value as PresetId)} options={presetOptions(form.language)} />
              <SelectField label={t.sourceType} value={form.sourceType} onChange={(value) => update("sourceType", value as SourceType)} options={toOptions(optionText.sourceType, form.language)} />
              <SelectField label={t.scenario} value={form.scenario} onChange={(value) => update("scenario", value as Scenario)} options={toOptions(optionText.scenario, form.language)} />
              <SelectField label={t.outputMode} value={form.outputMode} onChange={(value) => update("outputMode", value as OutputMode)} options={toOptions(optionText.outputMode, form.language)} />
              <SelectField label={t.stylePreset} value={form.stylePreset} onChange={(value) => update("stylePreset", value as StylePreset)} options={toOptions(optionText.stylePreset, form.language)} />
            </div>
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
          </section>

          <section className="panel structure-panel" aria-labelledby="structure-title">
            <PanelTitle icon={Sparkles} id="structure-title" title={t.structurePanel} />
            <div className="control-grid">
              <SelectField label={t.agentTool} value={form.agentTool} onChange={(value) => update("agentTool", value as AgentTool)} options={toOptions(optionText.agentTool, form.language)} />
              <SelectField label={t.modelPreference} value={form.modelPreference} onChange={(value) => update("modelPreference", value as ModelPreference)} options={toOptions(optionText.modelPreference, form.language)} />
            </div>
            <PresetSummary preset={activePreset} language={form.language} labels={t} />
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
            <PanelTitle icon={PlugZap} id="handoff-title" title={t.handoffPanel} />
            <BridgeStatusCard
              bridge={bridge}
              checking={bridgeChecking}
              error={bridgeError}
              labels={t}
              onRefresh={() => void checkBridge(false)}
            />
            <div className="action-stack">
              <button className="primary-action full" onClick={sendToBridge}>
                <FolderOpen size={18} />
                {t.sendBridge}
              </button>
              <button className="secondary-action full" onClick={launchOrCopyAgent}>
                <Play size={18} />
                {t.launchAgent}
              </button>
              <button className="secondary-action full" onClick={() => copyText(prompt)}>
                <Clipboard size={18} />
                {copyState || t.copyPrompt}
              </button>
              <button className="secondary-action full" onClick={downloadHandoffKit}>
                <FileArchive size={18} />
                {t.downloadKit}
              </button>
            </div>
            {bridgeMessage && <p className="bridge-message">{bridgeMessage}</p>}
            {handoffResult && (
              <div className="handoff-result">
                <strong>{t.openFolder}</strong>
                <code>{handoffResult.projectPath}</code>
                <span>{handoffResult.files.length} files</span>
              </div>
            )}
            {agentCommand && (
              <div className="command-box">
                <strong>{t.commandReady}</strong>
                <code>{agentCommand}</code>
                <button className="secondary-action full" onClick={() => copyText(agentCommand)}>
                  <Clipboard size={17} />
                  {t.copyCommand}
                </button>
              </div>
            )}
            <div className="kit-box">
              <strong>{t.kitIncludes}</strong>
              <span>source.md</span>
              <span>extracted-source.md</span>
              <span>attachments/</span>
              <span>manifest.json</span>
              <span>agent-prompt.md</span>
              <span>project-brief.json</span>
              <span>preview-web-deck.html</span>
              <span>engine-plan.md</span>
              <span>quality-checklist.md</span>
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
            <button className={previewMode === "extracted" ? "active" : ""} onClick={() => setPreviewMode("extracted")}>{t.previewExtracted}</button>
            <button className={previewMode === "manifest" ? "active" : ""} onClick={() => setPreviewMode("manifest")}>{t.previewManifest}</button>
            <button className={previewMode === "brief" ? "active" : ""} onClick={() => setPreviewMode("brief")}>{t.previewBrief}</button>
            <button className={previewMode === "webdeck" ? "active" : ""} onClick={() => setPreviewMode("webdeck")}>{t.previewWebDeck}</button>
            <button className={previewMode === "checklist" ? "active" : ""} onClick={() => setPreviewMode("checklist")}>{t.previewChecklist}</button>
          </div>
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

function WorkspaceNav({
  activeView,
  labels: t,
  sourceCount,
  readiness,
  bridge,
  onChange
}: {
  activeView: WorkspaceView;
  labels: typeof labels.zh;
  sourceCount: number;
  readiness: number;
  bridge: BridgeHealth | null;
  onChange: (view: WorkspaceView) => void;
}) {
  const items: Array<{ id: WorkspaceView; label: string; meta: string; icon: LucideIcon }> = [
    { id: "start", label: t.navStart, meta: bridge ? t.bridgeOnline : t.bridgeOffline, icon: Sparkles },
    { id: "sources", label: t.navSources, meta: `${sourceCount} files · ${readiness}%`, icon: UploadCloud },
    { id: "configuration", label: t.navConfig, meta: t.oneClickDetect, icon: Server },
    { id: "handoff", label: t.navHandoff, meta: t.commandReady, icon: PlugZap },
    { id: "preview", label: t.navPreview, meta: "HTML / JSON", icon: MonitorPlay }
  ];

  return (
    <nav className="workspace-nav" aria-label="Workspace sections">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => onChange(item.id)}>
            <Icon size={17} />
            <span>{item.label}</span>
            <small>{item.meta}</small>
          </button>
        );
      })}
    </nav>
  );
}

function PageGuide({ activeView, labels: t }: { activeView: WorkspaceView; labels: typeof labels.zh }) {
  const copy = {
    start: { title: t.startGuideTitle, text: t.startGuideText },
    sources: { title: t.sourceGuideTitle, text: t.sourceGuideText },
    configuration: { title: t.configGuideTitle, text: t.configGuideText },
    handoff: { title: t.handoffGuideTitle, text: t.handoffGuideText },
    preview: { title: t.previewGuideTitle, text: t.previewGuideText }
  }[activeView];

  return (
    <section className="page-guide" aria-label={copy.title}>
      <strong>{copy.title}</strong>
      <p>{copy.text}</p>
    </section>
  );
}

function ConfigurationPage({
  bridge,
  agents,
  providers,
  skillTargets,
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

  return (
    <section className="configuration-page">
      <div className="configuration-hero">
        <div>
          <p className="eyebrow">{t.navConfig}</p>
          <h2>{t.setupTitle}</h2>
          <p>{t.setupSubtitle}</p>
        </div>
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
      </div>
      <div className="setup-grid">
        <article className={bridge ? "ready" : "waiting"}>
          <Server size={19} />
          <strong>{t.bridgeStartTitle}</strong>
          <p>{t.bridgeStartText}</p>
          <StatusPill ok={Boolean(bridge)} okText={t.bridgeOnline} failText={t.bridgeOffline} />
          <code>npm run bridge</code>
          <div className="setup-actions">
            <button className="secondary-action" onClick={onCheckBridge}>{t.refreshBridge}</button>
            <button className="secondary-action" onClick={onCopyBridgeCommand}>{t.copyBridgeCommand}</button>
          </div>
        </article>
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
          <button className="secondary-action" onClick={onLaunchAgent} disabled={!bridgeReady}>
            <Play size={18} />
            {t.launchAgent}
          </button>
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
          {!bridgeReady && <code>npm run bridge</code>}
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

function BridgeStatusCard({
  bridge,
  checking,
  error,
  labels: t,
  onRefresh
}: {
  bridge: BridgeHealth | null;
  checking: boolean;
  error: string;
  labels: typeof labels.zh;
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
      <code>{t.bridgeCommand}: npm run bridge</code>
      <p>{bridge ? `${bridge.outputDir} · v${bridge.version}` : error || t.allowLaunchOff}</p>
      <span>{bridge?.allowLaunch ? t.allowLaunchOn : t.allowLaunchOff}</span>
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
  return presetCatalog.map((preset) => ({
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

function loadSavedForm() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultForm;
    const parsed = { ...defaultForm, ...JSON.parse(saved) } as FormState;
    if (!presetCatalog.some((preset) => preset.id === parsed.presetId)) {
      parsed.presetId = defaultForm.presetId;
    }
    return parsed;
  } catch {
    return defaultForm;
  }
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

function buildPrompt(form: FormState, storyboard: StoryItem[], enginePlan: EnginePlan, sources: UploadedSource[]) {
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
  const presetRoute = `${preset.label[form.language]} (${preset.packPath || "seed direction"})`;
  const activeEngines = [
    enginePlan.pptxActive ? `PPTX: ${enginePlan.pptxRoute}` : "",
    enginePlan.webActive ? `Web Deck: ${enginePlan.webRoute}` : ""
  ].filter(Boolean).join("\n- ");

  if (form.language === "en") {
    return `Use the ultimate-ppt-master Agent Skill for this presentation task.\n\nProject title: ${form.title}\nAudience: ${form.audience}\nCore message: ${form.coreMessage}\nSource type: ${sourceType}\nScenario: ${scenario}\nContent preset: ${presetRoute}\nOutput target: ${output}\nVisual style: ${style}\nTarget length: ${form.slideCount} slides\nPreferred agent: ${agent}\nModel preference: ${model}\n\nExecution route:\n- ${activeEngines}\n- Fusion shell: ${enginePlan.fusionRoute}\n- Visual route: ${enginePlan.styleRoute}\n\nPreset source requirements:\n${presetRequirements}\n\nPreset quality checks:\n${presetChecks}\n\nSource material:\n${sourceManifest}\n\nLocal Bridge expectations:\n- If this folder was created by Agent Bridge, read extracted-source.md first, then inspect attachments/ for original files.\n- If a PDF/DOCX/PPTX/XLSX converter failed, keep the original attachment and parse it with the best local tool available.\n- Never upload private source material unless the user explicitly approves it.\n\nSuggested outline:\n${outline}\n\nRequirements:\n- Read AGENTS.md and SKILL.md from the ultimate-ppt-master repository.\n- Respect the third-party notices and upstream license attributions.\n- Build the narrative before generating slides.\n- Use the selected content preset as the default structure, but adapt it to the actual source evidence.\n- Use the PPTX route for editable PowerPoint and the Web Deck route for magazine / Swiss HTML output.\n- Render or preview the result, inspect issues, repair obvious layout problems, and list final files.\n- Keep logs and intermediate artifacts in the local project folder.\n\nExtra requirements:\n${form.constraints || "No extra requirements."}`;
  }

  return `请使用 ultimate-ppt-master Agent Skill 完成这次演示文稿任务。\n\n项目标题：${form.title}\n目标听众：${form.audience}\n核心结论：${form.coreMessage}\n资料类型：${sourceType}\n使用场景：${scenario}\n内容预设：${presetRoute}\n输出目标：${output}\n视觉风格：${style}\n目标页数：${form.slideCount} 页\n优先 Agent：${agent}\n模型偏好：${model}\n\n执行路线：\n- ${activeEngines}\n- Fusion shell：${enginePlan.fusionRoute}\n- 视觉路线：${enginePlan.styleRoute}\n\n预设资料要求：\n${presetRequirements}\n\n预设质量检查：\n${presetChecks}\n\n源资料：\n${sourceManifest}\n\n本地 Bridge 预期：\n- 如果这个目录由 Agent Bridge 创建，请先读 extracted-source.md，再检查 attachments/ 里的原始文件。\n- 如果 PDF/DOCX/PPTX/XLSX 转换失败，请保留原始附件，并用本地最合适的工具继续解析。\n- 私有资料默认留在本地，除非我明确要求，不要上传。\n\n建议页纲：\n${outline}\n\n执行要求：\n- 读取 ultimate-ppt-master 仓库里的 AGENTS.md 和 SKILL.md。\n- 尊重第三方声明和当前仓库保留的上游版权归属。\n- 先完成叙事结构，再生成页面。\n- 使用当前内容预设作为默认结构，但必须根据真实资料证据调整。\n- PPTX 使用可编辑 PowerPoint 路线；Web Deck 使用杂志化 / Swiss HTML 路线。\n- 渲染或预览结果，检查问题，修复明显版式错误，并列出最终文件。\n- 日志和中间产物保存在本地项目目录。\n\n补充要求：\n${form.constraints || "无额外要求。"}`;
}

function buildSourceTemplate(form: FormState, storyboard: StoryItem[], enginePlan: EnginePlan, sources: UploadedSource[]) {
  const preset = findPreset(form.presetId);
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  const style = readOption(optionText.stylePreset, form.stylePreset, form.language);
  const outline = storyboard.map((item, index) => `- ${index + 1}. ${item.title}: ${item.intent}`).join("\n");
  const sourceManifest = sourceSummaryMarkdown(sources, form.language);
  const requirements = preset.sourceRequirements.map((item) => `- ${item[form.language]}`).join("\n");
  const roster = preset.slideRoster.map((item, index) => `- ${index + 1}. ${item[form.language]}`).join("\n");
  const templates = [
    `- layouts: ${preset.templateCandidates.layouts.join(", ")}`,
    preset.templateCandidates.brands?.length ? `- brands: ${preset.templateCandidates.brands.join(", ")}` : "",
    `- charts: ${preset.templateCandidates.charts.join(", ")}`,
    `- webDeckStyle: ${preset.templateCandidates.webDeckStyle}`
  ].filter(Boolean).join("\n");
  if (form.language === "en") {
    return `# ${form.title}\n\n## Audience\n${form.audience}\n\n## Core message\n${form.coreMessage}\n\n## Scenario\n${scenario}\n\n## Content preset\n${preset.label.en} (${preset.packPath || "seed direction"})\n\n## Desired output\n${output}, about ${form.slideCount} slides.\n\n## Visual style\n${style}\n\n## Engine route\n- PPTX: ${enginePlan.pptxActive ? "active" : "optional"} - ${enginePlan.pptxRoute}\n- Web Deck: ${enginePlan.webActive ? "active" : "optional"} - ${enginePlan.webRoute}\n- Fusion shell: ${enginePlan.fusionRoute}\n- Style route: ${enginePlan.styleRoute}\n\n## Preset source requirements\n${requirements}\n\n## Preset slide roster\n${roster}\n\n## Preset template candidates\n${templates}\n\n## Source intake\n${sourceManifest}\n\n## Source notes\n${form.sourceNotes}\n\n## Suggested outline\n${outline}\n\n## Extra requirements\n${form.constraints}\n`;
  }
  return `# ${form.title}\n\n## 目标听众\n${form.audience}\n\n## 核心结论\n${form.coreMessage}\n\n## 使用场景\n${scenario}\n\n## 内容预设\n${preset.label.zh}（${preset.packPath || "种子方向"}）\n\n## 目标输出\n${output}，约 ${form.slideCount} 页。\n\n## 视觉风格\n${style}\n\n## 双引擎路线\n- PPTX：${enginePlan.pptxActive ? "启用" : "备用"} - ${enginePlan.pptxRoute}\n- Web Deck：${enginePlan.webActive ? "启用" : "备用"} - ${enginePlan.webRoute}\n- Fusion shell：${enginePlan.fusionRoute}\n- 视觉路线：${enginePlan.styleRoute}\n\n## 预设资料要求\n${requirements}\n\n## 预设页面结构\n${roster}\n\n## 预设模板候选\n${templates}\n\n## 资料导入\n${sourceManifest}\n\n## 源资料要点\n${form.sourceNotes}\n\n## 建议页纲\n${outline}\n\n## 补充要求\n${form.constraints}\n`;
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
    form.sourceNotes || (zh ? "暂无粘贴资料。" : "No pasted notes yet.")
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

function buildQualityChecklist(form: FormState, enginePlan: EnginePlan, sources: UploadedSource[]) {
  const preset = findPreset(form.presetId);
  const sourceLine = sources.length > 0
    ? sources.map((source) => `- [ ] ${source.name}: ${source.status}`).join("\n")
    : "- [ ] No uploaded files; source.md should be checked against pasted notes.";
  const presetChecks = preset.qualityChecks.map((item) => `- [ ] ${item[form.language]}`).join("\n");
  if (form.language === "en") {
    return `# Quality checklist\n\n## Selected preset\n${presetChecks}\n\n## Source and story\n- [ ] extracted-source.md reflects real source files, not only pasted notes.\n- [ ] Core message appears in the cover and conclusion.\n- [ ] Every slide has one job and one primary takeaway.\n- [ ] Sensitive material stays local unless the user explicitly approves upload.\n\n## Source files\n${sourceLine}\n\n## PPTX route\n- [ ] Route status: ${enginePlan.pptxActive ? "active" : "optional"}.\n- [ ] Text, shapes, charts, and notes remain editable.\n- [ ] Run SVG/PPTX rendering checks from the Skill workflow.\n- [ ] Inspect exported pages and repair clipping, overlaps, tiny text, and broken charts.\n\n## Web Deck route\n- [ ] Route status: ${enginePlan.webActive ? "active" : "optional"}.\n- [ ] Use ${enginePlan.styleRoute} consistently.\n- [ ] Desktop and mobile viewports do not overlap text, controls, or media.\n\n## Delivery\n- [ ] Final files are named clearly.\n- [ ] Include what was generated, what was checked, and which source files were parsed.\n- [ ] Keep upstream license and third-party notices intact.\n`;
  }
  return `# 质量检查清单\n\n## 当前预设\n${presetChecks}\n\n## 资料与叙事\n- [ ] extracted-source.md 已根据真实源文件修正，而不只是网页粘贴摘要。\n- [ ] 核心结论出现在封面和收束页。\n- [ ] 每一页只承担一个主要任务，并有清晰 takeaway。\n- [ ] 敏感资料默认留在本地，除非用户明确同意上传。\n\n## 源文件\n${sourceLine}\n\n## PPTX 路线\n- [ ] 路线状态：${enginePlan.pptxActive ? "启用" : "备用"}。\n- [ ] 文本、形状、图表、备注保持可编辑。\n- [ ] 按 Skill 工作流运行 SVG / PPTX 渲染检查。\n- [ ] 检查导出页面并修复裁切、重叠、小字和图表损坏。\n\n## Web Deck 路线\n- [ ] 路线状态：${enginePlan.webActive ? "启用" : "备用"}。\n- [ ] 统一使用 ${enginePlan.styleRoute}。\n- [ ] 桌面端和移动端不出现文字、控件或媒体互相遮挡。\n\n## 交付\n- [ ] 最终文件命名清晰。\n- [ ] 简短说明生成了什么、检查了什么、解析了哪些源文件。\n- [ ] 保留上游版权和第三方声明。\n`;
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
  const storySlides = storyboard.map((item, index) => `
    <section class="slide story">
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
    <section class="slide cover">
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
    <section class="slide">
      <div>
        <p class="kicker">${zh ? "资料信号" : "Source signal"}</p>
        <h2>${zh ? "从文件、URL 和摘要到可执行 brief" : "From files, URLs, and notes to executable brief"}</h2>
      </div>
      <ul class="source-list">${noteCards}</ul>
      <p class="footer">${safeConstraints}</p>
    </section>
    ${storySlides}
    <section class="slide">
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
  sources: UploadedSource[]
) {
  const preset = findPreset(form.presetId);
  return {
    version: appVersion,
    title: form.title,
    audience: form.audience,
    coreMessage: form.coreMessage,
    language: form.language,
    sourceType: form.sourceType,
    preset: {
      id: preset.id,
      label: preset.label[form.language],
      packPath: preset.packPath,
      sourceRequirements: preset.sourceRequirements.map((item) => item[form.language]),
      templateCandidates: preset.templateCandidates,
      qualityChecks: preset.qualityChecks.map((item) => item[form.language])
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
  bridge: BridgeHealth | null
) {
  const preset = findPreset(form.presetId);
  return {
    version: appVersion,
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
      status: preset.packPath ? "pack" : "seed"
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
    return `# Ultimate PPT Master handoff kit\n\nFiles:\n- source.md: structured source brief\n- extracted-source.md: browser pre-read source plus Bridge conversion target\n- attachments/: original source files\n- manifest.json: handoff metadata\n- agent-prompt.md: prompt to send to the Agent\n- project-brief.json: machine-readable settings\n- preview-web-deck.html: browser-local Web Deck preview\n- engine-plan.md: PPTX / Web Deck / Fusion route split\n- quality-checklist.md: production checks before delivery\n\nPreset: ${preset.label.en} (${preset.packPath || "seed direction"})\nSource count: ${sources.length}\n\nActive route:\n- PPTX: ${enginePlan.pptxActive ? "active" : "optional"}\n- Web Deck: ${enginePlan.webActive ? "active" : "optional"}\n- Style: ${enginePlan.styleRoute}\n\nNext step:\nOpen this folder in Codex first, or another local Agent that can read the ultimate-ppt-master Skill. Ask it to read agent-prompt.md and inspect attachments/ before producing.\n`;
  }
  return `# Ultimate PPT Master handoff kit\n\n文件：\n- source.md：结构化资料 brief\n- extracted-source.md：网页预读资料和 Bridge 转换目标\n- attachments/：原始源文件\n- manifest.json：交付元数据\n- agent-prompt.md：发给 Agent 的执行 prompt\n- project-brief.json：机器可读配置\n- preview-web-deck.html：浏览器本地 Web Deck 预览\n- engine-plan.md：PPTX / Web Deck / Fusion 路线分工\n- quality-checklist.md：交付前生产检查清单\n\n内容预设：${preset.label.zh}（${preset.packPath || "种子方向"}）\n源文件数量：${sources.length}\n\n启用路线：\n- PPTX：${enginePlan.pptxActive ? "启用" : "备用"}\n- Web Deck：${enginePlan.webActive ? "启用" : "备用"}\n- 视觉：${enginePlan.styleRoute}\n\n下一步：\n优先用 Codex 打开这个文件夹，或交给其他能读取 ultimate-ppt-master Skill 的本地 Agent。请 Agent 先读 agent-prompt.md，并检查 attachments/ 后再生产。\n`;
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
