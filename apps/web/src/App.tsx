import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  FileText,
  FolderOpen,
  Globe2,
  Loader2,
  Play,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, RefObject } from "react";
import { getCodexFlowState, getCodexPrimaryAction, type CodexFlowState } from "./consoleFlow";

type Language = "zh" | "en";
type OutputChoice = "auto" | "pptx" | "web" | "both";
type OutputMode = "pptx" | "web" | "both";
type UploadedSourceStatus = "textExtracted" | "attachedOnly";

interface CodexFormState {
  language: Language;
  goal: string;
  sourceNotes: string;
  title: string;
  audience: string;
  slideCount: string;
  outputChoice: OutputChoice;
}

interface UploadedSource {
  id: string;
  kind: "file";
  name: string;
  type: string;
  size: number;
  extension: string;
  status: UploadedSourceStatus;
  statusText: string;
  text?: string;
  dataBase64?: string;
  addedAt: string;
}

interface BridgeHealth {
  ok: boolean;
  version: string;
  repoRoot: string;
  outputDir: string;
  allowLaunch: boolean;
}

interface HandoffResult {
  projectPath: string;
  files: string[];
  suggestedCommands: Record<string, string>;
  manifest?: {
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

interface QualityGate {
  level: "formal-business";
  requiredInputs: string[];
  acceptanceCriteria: string[];
  artifactChecks: string[];
  reviewCommands: string[];
  assetStrategy: Record<string, string>;
}

interface WorkflowState {
  currentStep: "handoff";
  blockedReason: string;
}

const bridgeUrl = "http://127.0.0.1:43188";
const repoUrl = "https://github.com/kdnsna/ultimate-ppt-master-skill";
const bridgeDocUrl = `${repoUrl}/blob/main/docs/guides/agent-connect-bridge.md`;
const storageKey = "ultimate-ppt-master-codex-first-v44";
const appVersion = "4.4.0";

const defaultForm: CodexFormState = {
  language: "zh",
  goal: "",
  sourceNotes: "",
  title: "",
  audience: "管理层 / 项目负责人",
  slideCount: "10-12",
  outputChoice: "auto"
};

const labels = {
  zh: {
    appTitle: "把资料交给 Codex 做 PPT",
    subtitle: "拖资料，写一句目标，生成本地 Codex 项目包。网页只负责把活儿交清楚。",
    goalLabel: "你想让 Codex 做什么",
    goalPlaceholder: "例如：把这份季度经营材料做成给管理层看的正式可编辑 PPT，结论先行，控制在 12 页。",
    notesLabel: "粘贴资料或补充说明",
    notesPlaceholder: "可以直接粘贴会议纪要、材料摘要、表格口径、领导要求。",
    dropTitle: "拖文件到这里",
    dropHint: "PDF / Word / PPTX / Excel / Markdown 都可以；文本会先在浏览器预读，其他交给本机 Bridge。",
    chooseFiles: "选择文件",
    remove: "移除",
    noSources: "还没有文件。只粘贴资料也能先生成项目包。",
    advanced: "高级设置",
    output: "输出",
    slideCount: "页数",
    audience: "听众",
    language: "语言",
    autoOutput: "自动判断",
    pptxOutput: "可编辑 PPTX",
    webOutput: "Web Deck",
    bothOutput: "PPTX + Web Deck",
    bridgeReady: "本机 Bridge 已连接",
    bridgeMissing: "本机 Bridge 未启动",
    bridgeChecking: "正在检测 Bridge",
    bridgeHelp: "先在终端运行这条命令，再回到这里点一次按钮。",
    copyBridge: "复制 Bridge 启动命令",
    create: "创建 Codex 项目",
    creating: "正在创建项目",
    completeInput: "先补充资料或目标",
    copyCommand: "复制 Codex 命令",
    retry: "重试",
    resultTitle: "项目已经准备好",
    projectPath: "项目路径",
    codexCommand: "Codex 命令",
    commandCopied: "已复制，打开 Codex 执行这条命令",
    launchCodex: "启动 Codex",
    copied: "已复制",
    copyFailed: "复制失败，请手动选择",
    openDocs: "Bridge 文档",
    safetyLocal: "资料只发到本机 127.0.0.1",
    safetyCodex: "主流程默认只交给 Codex",
    safetyEditable: "默认优先可编辑 PPTX",
    debugTitle: "调试和证明材料",
    debugIntro: "这些东西保留给排查和回归，不挡主流程。",
    routeTitle: "自动路线",
    filesTitle: "已加入资料",
    statusTitle: "当前状态"
  },
  en: {
    appTitle: "Give your material to Codex for a PPT",
    subtitle: "Drop sources, write one goal, and create a local Codex project. The page only makes the handoff clear.",
    goalLabel: "What should Codex make?",
    goalPlaceholder: "Example: Turn this quarterly business review into an editable executive PPT, conclusion first, around 12 slides.",
    notesLabel: "Paste sources or extra notes",
    notesPlaceholder: "Paste meeting notes, source summaries, metric definitions, or stakeholder requests.",
    dropTitle: "Drop files here",
    dropHint: "PDF / Word / PPTX / Excel / Markdown are supported. Text is pre-read in the browser; the local Bridge handles the rest.",
    chooseFiles: "Choose files",
    remove: "Remove",
    noSources: "No files yet. Pasted notes alone can still create a project.",
    advanced: "Advanced",
    output: "Output",
    slideCount: "Slides",
    audience: "Audience",
    language: "Language",
    autoOutput: "Auto",
    pptxOutput: "Editable PPTX",
    webOutput: "Web Deck",
    bothOutput: "PPTX + Web Deck",
    bridgeReady: "Local Bridge connected",
    bridgeMissing: "Local Bridge offline",
    bridgeChecking: "Checking Bridge",
    bridgeHelp: "Run this command in Terminal, then come back and click once.",
    copyBridge: "Copy Bridge command",
    create: "Create Codex project",
    creating: "Creating project",
    completeInput: "Add a goal or source first",
    copyCommand: "Copy Codex command",
    retry: "Retry",
    resultTitle: "Project is ready",
    projectPath: "Project path",
    codexCommand: "Codex command",
    commandCopied: "Copied. Open Codex and run this command.",
    launchCodex: "Launch Codex",
    copied: "Copied",
    copyFailed: "Copy failed; select manually",
    openDocs: "Bridge docs",
    safetyLocal: "Sources only go to local 127.0.0.1",
    safetyCodex: "Primary path hands off to Codex",
    safetyEditable: "Editable PPTX is the default",
    debugTitle: "Debug and proof materials",
    debugIntro: "Kept for troubleshooting and regression checks, away from the main flow.",
    routeTitle: "Auto route",
    filesTitle: "Sources added",
    statusTitle: "Status"
  }
};

export function App() {
  const [form, setForm] = useState<CodexFormState>(() => loadSavedForm());
  const [sources, setSources] = useState<UploadedSource[]>([]);
  const [bridge, setBridge] = useState<BridgeHealth | null>(null);
  const [bridgeChecking, setBridgeChecking] = useState(false);
  const [handoffResult, setHandoffResult] = useState<HandoffResult | null>(null);
  const [agentCommand, setAgentCommand] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const goalRef = useRef<HTMLTextAreaElement | null>(null);
  const t = labels[form.language];

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form]);

  const resolvedOutput = useMemo(() => resolveOutputMode(form), [form]);
  const sourceCount = sources.length;
  const hasUsableInput = form.goal.trim().length >= 8 || form.sourceNotes.trim().length >= 20 || sourceCount > 0;
  const flowState = getCodexFlowState({
    hasUsableInput,
    bridgeConnected: Boolean(bridge),
    creating,
    projectReady: Boolean(handoffResult),
    hasError: Boolean(error)
  });
  const action = getCodexPrimaryAction(flowState);
  const codexCommand = agentCommand || handoffResult?.suggestedCommands?.codex || "";
  const bridgeCommand = bridgeStartCommand();

  function update<K extends keyof CodexFormState>(key: K, value: CodexFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setHandoffResult(null);
    setAgentCommand("");
    setError("");
    setMessage("");
  }

  async function checkBridge(silent = false): Promise<BridgeHealth | null> {
    setBridgeChecking(true);
    try {
      const response = await fetch(`${bridgeUrl}/health`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as BridgeHealth;
      setBridge(payload);
      if (!silent) setMessage(t.bridgeReady);
      return payload;
    } catch (caught) {
      setBridge(null);
      if (!silent) setMessage(t.bridgeMissing);
      return null;
    } finally {
      setBridgeChecking(false);
    }
  }

  async function handlePrimaryAction() {
    if (action === "complete_input") {
      goalRef.current?.focus();
      setMessage(t.completeInput);
      return;
    }

    if (action === "start_bridge") {
      await copyText(bridgeCommand);
      setMessage(t.bridgeHelp);
      void checkBridge(false);
      return;
    }

    if (action === "copy_codex_command") {
      await copyText(codexCommand);
      setMessage(t.commandCopied);
      return;
    }

    if (action === "retry") {
      setError("");
      setMessage("");
      return;
    }

    if (action === "create_project") {
      await sendToBridge();
    }
  }

  async function sendToBridge() {
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const currentBridge = bridge || await checkBridge(false);
      if (!currentBridge) {
        await copyText(bridgeCommand);
        setMessage(t.bridgeHelp);
        return;
      }

      const payload = buildCodexFirstBridgePayload({ form, sources, outputMode: resolvedOutput });
      const response = await fetch(`${bridgeUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || `HTTP ${response.status}`);
      setHandoffResult(result);
      const command = result.suggestedCommands?.codex || fallbackCodexCommand(result.projectPath);
      setAgentCommand(command);
      await copyText(command);
      setMessage(t.commandCopied);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setCreating(false);
    }
  }

  async function launchCodex() {
    if (!handoffResult) return;
    try {
      const response = await fetch(`${bridgeUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: handoffResult.projectPath, agent: "codex" })
      });
      const result = await response.json();
      const command = result.command || codexCommand;
      setAgentCommand(command);
      if (!result.launched) await copyText(command);
      setMessage(result.launched ? result.message : t.commandCopied);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
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
        const textFile = isBrowserTextFile(extension, file.type);
        const source: UploadedSource = {
          id: makeId(),
          kind: "file",
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          extension,
          status: textFile ? "textExtracted" : "attachedOnly",
          statusText: textFile ? "text pre-read" : "Bridge will parse",
          addedAt: new Date().toISOString()
        };
        if (textFile) {
          source.text = await readFileAsText(file);
        } else {
          source.dataBase64 = await readFileAsBase64(file);
        }
        next.push(source);
      } catch (caught) {
        setUploadError(caught instanceof Error ? caught.message : String(caught));
      }
    }
    setSources((current) => [...current, ...next]);
    setHandoffResult(null);
    setAgentCommand("");
  }

  function removeSource(id: string) {
    setSources((current) => current.filter((source) => source.id !== id));
    setHandoffResult(null);
    setAgentCommand("");
  }

  async function copyText(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage(t.copied);
    } catch {
      setMessage(t.copyFailed);
    }
  }

  return (
    <CodexFirstFlow
      actionLabel={primaryActionLabel(action, flowState, t)}
      bridge={bridge}
      bridgeChecking={bridgeChecking}
      bridgeCommand={bridgeCommand}
      codexCommand={codexCommand}
      error={error}
      flowState={flowState}
      form={form}
      handoffResult={handoffResult}
      message={message}
      outputMode={resolvedOutput}
      sources={sources}
      t={t}
      uploadError={uploadError}
      goalRef={goalRef}
      onCopy={(text) => void copyText(text)}
      onDrop={handleDrop}
      onFileInput={(event) => void handleFileInput(event)}
      onLaunchCodex={() => void launchCodex()}
      onPrimary={() => void handlePrimaryAction()}
      onRefreshBridge={() => void checkBridge(false)}
      onRemoveSource={removeSource}
      onUpdate={update}
    />
  );
}

function CodexFirstFlow({
  actionLabel,
  bridge,
  bridgeChecking,
  bridgeCommand,
  codexCommand,
  error,
  flowState,
  form,
  handoffResult,
  message,
  outputMode,
  sources,
  t,
  uploadError,
  goalRef,
  onCopy,
  onDrop,
  onFileInput,
  onLaunchCodex,
  onPrimary,
  onRefreshBridge,
  onRemoveSource,
  onUpdate
}: {
  actionLabel: string;
  bridge: BridgeHealth | null;
  bridgeChecking: boolean;
  bridgeCommand: string;
  codexCommand: string;
  error: string;
  flowState: CodexFlowState;
  form: CodexFormState;
  handoffResult: HandoffResult | null;
  message: string;
  outputMode: OutputMode;
  sources: UploadedSource[];
  t: typeof labels.zh;
  uploadError: string;
  goalRef: RefObject<HTMLTextAreaElement>;
  onCopy: (text: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onLaunchCodex: () => void;
  onPrimary: () => void;
  onRefreshBridge: () => void;
  onRemoveSource: (id: string) => void;
  onUpdate: <K extends keyof CodexFormState>(key: K, value: CodexFormState[K]) => void;
}) {
  return (
    <div className="app-shell" lang={form.language === "zh" ? "zh-CN" : "en"}>
      <header className="topbar">
        <a className="brand" href={repoUrl}>
          <Sparkles size={18} />
          <span>Ultimate PPT Master</span>
          <b>v{appVersion}</b>
        </a>
        <nav className="top-actions" aria-label="Top actions">
          <a href={bridgeDocUrl}>{t.openDocs}</a>
          <button onClick={() => onUpdate("language", form.language === "zh" ? "en" : "zh")}>
            <Globe2 size={16} />
            {form.language === "zh" ? "EN" : "中文"}
          </button>
        </nav>
      </header>

      <main className="codex-layout">
        <section className="codex-workbench">
          <div className="codex-heading">
            <div>
              <p className="eyebrow">Codex-first</p>
              <h1>{t.appTitle}</h1>
              <p>{t.subtitle}</p>
            </div>
            <div className={`bridge-pill ${bridge ? "online" : "offline"}`}>
              {bridge ? <CheckCircle2 size={17} /> : <Server size={17} />}
              <span>{bridge ? t.bridgeReady : bridgeChecking ? t.bridgeChecking : t.bridgeMissing}</span>
              <button onClick={onRefreshBridge} aria-label={t.bridgeChecking}>
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          <div className="single-flow">
            <section className="input-surface" aria-label="Codex project input">
              <label className="goal-field">
                <span>{t.goalLabel}</span>
                <textarea
                  ref={goalRef}
                  value={form.goal}
                  onChange={(event) => onUpdate("goal", event.target.value)}
                  placeholder={t.goalPlaceholder}
                />
              </label>

              <SourceDropzone
                sources={sources}
                t={t}
                uploadError={uploadError}
                onDrop={onDrop}
                onFileInput={onFileInput}
                onRemoveSource={onRemoveSource}
              />

              <label className="notes-field">
                <span>{t.notesLabel}</span>
                <textarea
                  value={form.sourceNotes}
                  onChange={(event) => onUpdate("sourceNotes", event.target.value)}
                  placeholder={t.notesPlaceholder}
                />
              </label>

              <details className="advanced-panel">
                <summary>
                  <Settings2 size={16} />
                  {t.advanced}
                </summary>
                <div className="advanced-grid">
                  <label>
                    {t.output}
                    <select value={form.outputChoice} onChange={(event) => onUpdate("outputChoice", event.target.value as OutputChoice)}>
                      <option value="auto">{t.autoOutput}</option>
                      <option value="pptx">{t.pptxOutput}</option>
                      <option value="web">{t.webOutput}</option>
                      <option value="both">{t.bothOutput}</option>
                    </select>
                  </label>
                  <label>
                    {t.slideCount}
                    <input value={form.slideCount} onChange={(event) => onUpdate("slideCount", event.target.value)} />
                  </label>
                  <label>
                    {t.audience}
                    <input value={form.audience} onChange={(event) => onUpdate("audience", event.target.value)} />
                  </label>
                </div>
              </details>
            </section>

            <aside className="handoff-surface" aria-label="Codex handoff">
              <StatusBlock t={t} bridge={bridge} flowState={flowState} outputMode={outputMode} sourceCount={sources.length} />
              <CodexPrimaryAction
                actionLabel={actionLabel}
                flowState={flowState}
                onPrimary={onPrimary}
              />
              {!bridge && (
                <div className="command-box">
                  <span>{t.copyBridge}</span>
                  <code>{bridgeCommand}</code>
                  <button onClick={() => onCopy(bridgeCommand)}>
                    <Clipboard size={16} />
                    {t.copyBridge}
                  </button>
                </div>
              )}
              {error && (
                <p className="error-message">
                  <AlertCircle size={16} />
                  {error}
                </p>
              )}
              {message && <p className="status-message">{message}</p>}
              {handoffResult && (
                <CodexResult
                  codexCommand={codexCommand}
                  handoffResult={handoffResult}
                  t={t}
                  onCopy={onCopy}
                  onLaunchCodex={onLaunchCodex}
                />
              )}
            </aside>
          </div>

          <div className="safety-strip">
            <span><ShieldCheck size={15} />{t.safetyLocal}</span>
            <span><Sparkles size={15} />{t.safetyCodex}</span>
            <span><FileText size={15} />{t.safetyEditable}</span>
          </div>
        </section>

        <DebugDrawer form={form} outputMode={outputMode} sources={sources} t={t} />
      </main>
    </div>
  );
}

function DebugDrawer({ form, outputMode, sources, t }: { form: CodexFormState; outputMode: OutputMode; sources: UploadedSource[]; t: typeof labels.zh }) {
  const reviewCommand = "python3 scripts/apply_review_plan.py --safe-only --dry-run";
  return (
    <details className="debug-drawer">
      <summary>
        <span>{t.debugTitle}</span>
        <small>{t.debugIntro}</small>
      </summary>
      <div className="debug-grid">
        <article>
          <strong>DeckIR AI Planning Pack</strong>
          <p>storyboard.json / source-map.json / planning-report.json</p>
          <p>页面地图和证据引用仍写进本地项目包，由 Codex 读取。</p>
        </article>
        <article>
          <strong>Rendered Review Loop</strong>
          <p>review-findings.json / repair-plan.json / revision-brief.md</p>
          <p>{reviewCommand}</p>
        </article>
        <article>
          <strong>Benchmark Wall</strong>
          <p>quality-report.json 和公开 proof 保留在调试区，主界面不再打扰用户。</p>
        </article>
        <article>
          <strong>Current Payload Preview</strong>
          <p>{form.title || inferredTitle(form)} / {outputMode} / {sources.length} source(s)</p>
          <p>codex-task.md / AGENTS.md / asset-plan.md / visual-element-kit.md</p>
        </article>
      </div>
    </details>
  );
}

function SourceDropzone({
  sources,
  t,
  uploadError,
  onDrop,
  onFileInput,
  onRemoveSource
}: {
  sources: UploadedSource[];
  t: typeof labels.zh;
  uploadError: string;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveSource: (id: string) => void;
}) {
  return (
    <section className="source-zone" aria-labelledby="source-zone-title">
      <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <UploadCloud size={26} />
        <div>
          <strong id="source-zone-title">{t.dropTitle}</strong>
          <span>{t.dropHint}</span>
        </div>
        <label className="file-button">
          {t.chooseFiles}
          <input
            type="file"
            multiple
            accept=".md,.markdown,.txt,.pdf,.doc,.docx,.ppt,.pptx,.pptm,.xls,.xlsx,.xlsm,.csv,.json,.html"
            onChange={onFileInput}
          />
        </label>
      </div>
      {uploadError && <p className="error-message"><AlertCircle size={16} />{uploadError}</p>}
      <div className="source-list" aria-label={t.filesTitle}>
        {sources.length === 0 && <p>{t.noSources}</p>}
        {sources.map((source) => (
          <article key={source.id}>
            <FileText size={17} />
            <div>
              <strong>{source.name}</strong>
              <span>{formatBytes(source.size)} · {source.statusText}</span>
            </div>
            <button onClick={() => onRemoveSource(source.id)} aria-label={`${t.remove} ${source.name}`}>
              <X size={16} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatusBlock({ t, bridge, flowState, outputMode, sourceCount }: { t: typeof labels.zh; bridge: BridgeHealth | null; flowState: CodexFlowState; outputMode: OutputMode; sourceCount: number }) {
  return (
    <div className="status-block">
      <p className="eyebrow">{t.statusTitle}</p>
      <h2>{stateTitle(flowState, t)}</h2>
      <dl>
        <div>
          <dt>{t.routeTitle}</dt>
          <dd>{outputLabel(outputMode, t)}</dd>
        </div>
        <div>
          <dt>{t.filesTitle}</dt>
          <dd>{sourceCount}</dd>
        </div>
        <div>
          <dt>Bridge</dt>
          <dd>{bridge ? t.bridgeReady : t.bridgeMissing}</dd>
        </div>
      </dl>
    </div>
  );
}

function CodexPrimaryAction({ actionLabel, flowState, onPrimary }: { actionLabel: string; flowState: CodexFlowState; onPrimary: () => void }) {
  const disabled = flowState === "creating";
  return (
    <button className="primary-action" disabled={disabled} onClick={onPrimary}>
      {flowState === "creating" ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
      {actionLabel}
    </button>
  );
}

function CodexResult({
  codexCommand,
  handoffResult,
  t,
  onCopy,
  onLaunchCodex
}: {
  codexCommand: string;
  handoffResult: HandoffResult;
  t: typeof labels.zh;
  onCopy: (text: string) => void;
  onLaunchCodex: () => void;
}) {
  return (
    <section className="codex-result" aria-label={t.resultTitle}>
      <div>
        <CheckCircle2 size={20} />
        <h2>{t.resultTitle}</h2>
      </div>
      <label>
        {t.projectPath}
        <code>{handoffResult.projectPath}</code>
      </label>
      <label>
        {t.codexCommand}
        <code>{codexCommand}</code>
      </label>
      <p>{t.commandCopied}</p>
      <div className="result-actions">
        <button onClick={() => onCopy(codexCommand)}>
          <Clipboard size={16} />
          {t.copyCommand}
        </button>
        <button onClick={onLaunchCodex}>
          <Play size={16} />
          {t.launchCodex}
        </button>
      </div>
    </section>
  );
}

function primaryActionLabel(action: ReturnType<typeof getCodexPrimaryAction>, flowState: CodexFlowState, t: typeof labels.zh) {
  if (flowState === "creating") return t.creating;
  const copy: Record<ReturnType<typeof getCodexPrimaryAction>, string> = {
    complete_input: t.completeInput,
    start_bridge: t.copyBridge,
    create_project: t.create,
    creating: t.creating,
    copy_codex_command: t.copyCommand,
    retry: t.retry
  };
  return copy[action];
}

function stateTitle(state: CodexFlowState, t: typeof labels.zh) {
  const copy: Record<CodexFlowState, string> = {
    needs_input: t.completeInput,
    needs_bridge: t.bridgeMissing,
    ready_to_create: t.create,
    creating: t.creating,
    ready_for_codex: t.resultTitle,
    error: t.retry
  };
  return copy[state];
}

function outputLabel(mode: OutputMode, t: typeof labels.zh) {
  const copy: Record<OutputMode, string> = {
    pptx: t.pptxOutput,
    web: t.webOutput,
    both: t.bothOutput
  };
  return copy[mode];
}

function buildCodexFirstBridgePayload({ form, sources, outputMode }: { form: CodexFormState; sources: UploadedSource[]; outputMode: OutputMode }) {
  const title = form.title.trim() || inferredTitle(form);
  const qualityGate = buildQualityGate(outputMode);
  const workflowState: WorkflowState = { currentStep: "handoff", blockedReason: "" };
  const expectedArtifacts = expectedArtifactsFor(outputMode);
  const reviewCommands = qualityGate.reviewCommands;
  const sourceMarkdown = buildSourceMarkdown({ form, sources, title, outputMode });
  const agentPrompt = buildAgentPrompt({ title, form, outputMode });
  const projectBrief = {
    title,
    appVersion,
    goal: form.goal.trim(),
    audience: form.audience.trim(),
    slideCount: form.slideCount.trim(),
    outputMode,
    outputChoice: form.outputChoice,
    qualityProfile: buildQualityProfile(outputMode),
    qualityGate,
    workflowState,
    expectedArtifacts,
    reviewCommands,
    deckIR: {
      storyboard: "storyboard.json",
      sourceMap: "source-map.json",
      planningReport: "planning-report.json",
      renderedReview: "review-findings.json",
      repairPlan: "repair-plan.json",
      revisionBrief: "revision-brief.md"
    }
  };

  return {
    version: appVersion,
    form: {
      title,
      audience: form.audience,
      slideCount: form.slideCount,
      outputMode,
      agentTool: "codex",
      language: form.language
    },
    sourceMarkdown,
    agentPrompt,
    projectBrief,
    previewWebDeckHtml: buildPreviewWebDeck({ title, form, outputMode }),
    enginePlanMarkdown: buildEnginePlanMarkdown({ title, outputMode }),
    qualityChecklist: buildQualityChecklist({ title, outputMode, qualityGate }),
    qualityReport: JSON.stringify({ status: "pending", title, outputMode, appVersion }, null, 2),
    deckIRPreview: JSON.stringify({ storyboard: "storyboard.json", sourceMap: "source-map.json", planningReport: "planning-report.json" }, null, 2),
    assetPlan: buildAssetPlan({ title, sources }),
    visualElementKit: buildVisualElementKit({ title, outputMode }),
    codexTask: buildCodexTask({ title, outputMode }),
    codexAgentGuide: buildCodexAgentGuide(),
    qualityProfile: buildQualityProfile(outputMode),
    qualityGate,
    workflowState,
    expectedArtifacts,
    reviewCommands,
    readme: buildKitReadme({ title, outputMode }),
    attachments: sources.map((source) => ({
      id: source.id,
      kind: source.kind,
      name: source.name,
      type: source.type,
      size: source.size,
      text: source.text,
      dataBase64: source.dataBase64
    }))
  };
}

function buildQualityGate(outputMode: OutputMode): QualityGate {
  return {
    level: "formal-business",
    requiredInputs: [
      "source.md or attachments are reviewed before production",
      "storyboard.json, source-map.json, and planning-report.json guide generation",
      "no formal content slide may be delivered as full-page raster"
    ],
    acceptanceCriteria: [
      "editable text remains editable in PPTX outputs",
      "each content slide has evidence references or an explicit source gap",
      "recipe repetition and page density are checked after rendering",
      `final route matches ${outputMode}`
    ],
    artifactChecks: [
      "storyboard.json",
      "source-map.json",
      "planning-report.json",
      "review-findings.json",
      "repair-plan.json",
      "revision-brief.md",
      "quality-report.json"
    ],
    reviewCommands: [
      "python3 scripts/audit_storyboard.py <project_path>",
      "python3 scripts/audit_formal_delivery.py <project_path>",
      "python3 scripts/review_rendered_deck.py <project_path>",
      "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run"
    ],
    assetStrategy: {
      mode: "chatgpt-generation-first",
      rasterPolicy: "visual layers may be raster; body text must stay editable"
    }
  };
}

function buildQualityProfile(outputMode: OutputMode) {
  return {
    label: "Codex-first formal PPT delivery",
    userLevel: "one-click local handoff",
    acceptanceCriteria: [
      "Codex reads AGENTS.md and codex-task.md first",
      "DeckIR files guide the slide map",
      "rendered review runs before final delivery",
      `${outputMode} output is created without changing source facts`
    ],
    expectedArtifacts: expectedArtifactsFor(outputMode),
    reviewCommands: buildQualityGate(outputMode).reviewCommands,
    notFor: ["fully automatic factual rewriting", "cloud upload of private sources"]
  };
}

function expectedArtifactsFor(outputMode: OutputMode) {
  const common = [
    "storyboard.json",
    "source-map.json",
    "planning-report.json",
    "review-findings.json",
    "repair-plan.json",
    "revision-brief.md",
    "quality-report.json"
  ];
  if (outputMode === "pptx") return [...common, "final.pptx"];
  if (outputMode === "web") return [...common, "ppt/index.html"];
  return [...common, "final.pptx", "ppt/index.html"];
}

function buildSourceMarkdown({ form, sources, title, outputMode }: { form: CodexFormState; sources: UploadedSource[]; title: string; outputMode: OutputMode }) {
  const extractedText = sources
    .filter((source) => source.text)
    .map((source) => `## ${source.name}\n\n${source.text}`)
    .join("\n\n");
  return `# ${title}

## Goal
${form.goal.trim() || "Create a formal business presentation from the supplied material."}

## Output
${outputMode}

## Audience
${form.audience.trim() || "Business audience"}

## Slide Count
${form.slideCount.trim() || "10-12"}

## Pasted Notes
${form.sourceNotes.trim() || "No pasted notes."}

## Uploaded Sources
${sourceSummaryMarkdown(sources)}

${extractedText ? `## Browser Extracted Text\n\n${extractedText}` : ""}
`;
}

function buildAgentPrompt({ title, form, outputMode }: { title: string; form: CodexFormState; outputMode: OutputMode }) {
  return `Use the Ultimate PPT Master Skill in this local project.

Task: ${title}
Goal: ${form.goal.trim() || "Create a presentation from the supplied sources."}
Output mode: ${outputMode}

Read AGENTS.md, codex-task.md, storyboard.json, source-map.json, planning-report.json, asset-plan.md, visual-element-kit.md, review-findings.json, repair-plan.json, revision-brief.md, quality-checklist.md, and source.md before making slides.

Keep source facts intact. Use DeckIR for slide roles, evidence, recipes, and editability. Run review_rendered_deck.py and then apply_review_plan.py --safe-only --dry-run before final delivery.`;
}

function buildCodexTask({ title, outputMode }: { title: string; outputMode: OutputMode }) {
  return `# Codex task

Create the final ${outputMode} presentation for: ${title}

1. Read AGENTS.md, source.md, extracted-source.md, and all attachments.
2. Read storyboard.json, source-map.json, and planning-report.json before generating slides.
3. Keep formal body text editable; do not turn content pages into full-page screenshots.
4. Use asset-plan.md and visual-element-kit.md for visual layers and reusable elements.
5. Produce the requested ${outputMode} output.
6. Run audit_storyboard.py and audit_formal_delivery.py when relevant.
7. Run review_rendered_deck.py after preview/export.
8. Run apply_review_plan.py --safe-only --dry-run and write the second-pass brief if low-risk repairs are useful.
9. Update quality-report.json and list final files.`;
}

function buildCodexAgentGuide() {
  return `# AGENTS.md

This folder was created by the Codex-first web launcher.

Rules:
- Work locally. Do not upload private sources unless the user explicitly asks.
- Read codex-task.md before production.
- Use storyboard.json, source-map.json, and planning-report.json as planning constraints.
- Treat review-findings.json, repair-plan.json, and revision-brief.md as the rendered review loop.
- Keep factual claims grounded in source.md, extracted-source.md, attachments, or explicit public references.`;
}

function buildEnginePlanMarkdown({ title, outputMode }: { title: string; outputMode: OutputMode }) {
  return `# Engine plan

Project: ${title}
Selected route: ${outputMode}

Default logic:
- Editable PPTX for formal Chinese office and business material.
- Web Deck only when the brief asks for web, keynote, demo, interactive, or HTML presentation.
- Both only when explicitly requested.`;
}

function buildQualityChecklist({ title, outputMode, qualityGate }: { title: string; outputMode: OutputMode; qualityGate: QualityGate }) {
  return `# Quality checklist

Project: ${title}
Output: ${outputMode}

${qualityGate.acceptanceCriteria.map((item) => `- [ ] ${item}`).join("\n")}

## Commands
${qualityGate.reviewCommands.map((item) => `- ${item}`).join("\n")}
`;
}

function buildAssetPlan({ title, sources }: { title: string; sources: UploadedSource[] }) {
  return `# Asset plan

Project: ${title}
Source files: ${sources.length}

- Prefer generated or public-reference visual layers without embedded body text.
- Record prompt, source, usage, license notes, and insertion target for every external or generated asset.
- Keep logos, charts, and text editable where the final format allows it.`;
}

function buildVisualElementKit({ title, outputMode }: { title: string; outputMode: OutputMode }) {
  return `# Visual element kit

Project: ${title}
Route: ${outputMode}
Mode: chatgpt-generation-first

Small reusable elements to consider:
- section divider
- metric badge
- process node
- connector
- source callout

If no image backend key exists, write Needs-Manual prompts for ChatGPT and store generated outputs under assets/generated/.
Run or handle scripts/generate_visual_element_kit.py before final deck production.`;
}

function buildPreviewWebDeck({ title, form, outputMode }: { title: string; form: CodexFormState; outputMode: OutputMode }) {
  return `<!doctype html><html lang="${form.language === "zh" ? "zh-CN" : "en"}"><meta charset="utf-8"><title>${escapeHtml(title)}</title><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(form.goal || outputMode)}</p></main></body></html>`;
}

function buildKitReadme({ title, outputMode }: { title: string; outputMode: OutputMode }) {
  return `# ${title}

This local project was created by the v4.4 Codex-first web launcher.

Open it in Codex, then ask Codex to read AGENTS.md and codex-task.md first.

Output route: ${outputMode}
`;
}

function resolveOutputMode(form: CodexFormState): OutputMode {
  if (form.outputChoice !== "auto") return form.outputChoice;
  const text = `${form.goal}\n${form.sourceNotes}`.toLowerCase();
  if (/两种|都要|双版本|pptx\s*\+\s*web|web\s*\+\s*pptx|both|pptx.*web|web.*pptx/i.test(text)) return "both";
  if (/网页演示|网页ppt|web deck|html|互动展示|发布会|demo day|keynote|showcase|演讲|路演|分享会/i.test(text)) return "web";
  return "pptx";
}

function inferredTitle(form: CodexFormState) {
  const firstLine = form.goal.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  if (firstLine) return firstLine.slice(0, 42);
  const noteLine = form.sourceNotes.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  if (noteLine) return noteLine.slice(0, 42);
  return form.language === "zh" ? "Codex PPT 项目" : "Codex PPT Project";
}

function bridgeStartCommand() {
  return 'REPO=$(find "$HOME" -maxdepth 6 -type d -name ultimate-ppt-master-skill -print -quit); if [ -z "$REPO" ]; then echo "ultimate-ppt-master-skill not found"; else cd "$REPO" && npm run bridge; fi';
}

function fallbackCodexCommand(projectPath: string) {
  return `cd "${projectPath}" && codex "Read AGENTS.md and codex-task.md first, then create the requested presentation."`;
}

function sourceSummaryMarkdown(sources: UploadedSource[]) {
  if (sources.length === 0) return "- No uploaded files.";
  return sources.map((source) => `- ${source.name} (${source.status}, ${formatBytes(source.size)})`).join("\n");
}

function loadSavedForm(): CodexFormState {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    return { ...defaultForm, ...saved };
  } catch {
    return defaultForm;
  }
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
  return mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
