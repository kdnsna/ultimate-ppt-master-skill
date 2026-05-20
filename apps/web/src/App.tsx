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
import { useMemo, useState } from "react";

type Language = "zh" | "en";
type SourceType = "markdown" | "docx" | "pdf" | "url" | "pptx" | "mixed";
type Scenario = "executive" | "consulting" | "training" | "launch" | "investor";
type OutputMode = "pptx" | "web" | "both";
type StylePreset = "business" | "consulting" | "editorial" | "swiss" | "academic";
type AgentTool = "codex" | "claude" | "hermes" | "openclaw" | "generic";
type ModelPreference = "auto" | "openai" | "gemini" | "qwen" | "deepseek" | "custom";

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
  constraints: string;
}

const baseUrl = import.meta.env.BASE_URL;
const repoUrl = "https://github.com/kdnsna/ultimate-ppt-master-skill";
const demoUrl = `${baseUrl}examples/desktop-cultural-tourism-demo/web-demo.html`;
const skillDocUrl = `${repoUrl}#use-as-agent-skill`;

const labels = {
  zh: {
    eyebrow: "Web Experience + Agent Skill",
    title: "先在线生成工作流，再交给 Agent 做高质量 PPT。",
    subtitle: "网页端不托管模型、不保存资料；它把你的场景整理成可执行 prompt，让 Codex、Claude Code、Hermes、OpenClaw 继续生成可编辑 PPTX 或 Web Deck。",
    openDemo: "打开 Web Deck 示例",
    copyPrompt: "复制 Agent prompt",
    downloadSource: "下载 source.md 模板",
    skillSetup: "Skill 安装说明",
    planner: "工作流配置",
    preview: "实时 Agent prompt",
    examples: "示例与路线",
    sourceType: "资料类型",
    scenario: "使用场景",
    outputMode: "输出形式",
    stylePreset: "视觉风格",
    agentTool: "Agent 工具",
    modelPreference: "模型偏好",
    titleField: "项目标题",
    audience: "目标听众",
    slideCount: "页数",
    constraints: "补充要求",
    copied: "已复制",
    copyFailed: "复制失败，请手动选择 prompt",
    localOnly: "浏览器本地生成，不上传资料",
    webRole: "网页端负责：解释、配置、生成 prompt",
    skillRole: "Skill 负责：读文件、跑脚本、预览、修复、导出",
    desktopRole: "桌面端保留为后续高级本地模式",
    promptHint: "复制后发给你的 Agent；如已安装 skill，可直接把资料路径一并给它。",
    sourceTemplateHint: "模板会保存在本机下载目录，可作为 Agent 输入资料。",
    workflowExampleTitle: "Skill 工作流示例",
    workflowExample: "Use $ultimate-ppt-master to turn reports/q3-review.pdf into a 12-slide editable PPTX for an executive meeting. Verify the deck before delivery.",
    demoTitle: "Web Deck 示例",
    demoText: "脱敏文旅活动材料，展示网页 PPT 的视觉节奏和分享形态。",
    skillTitle: "Agent Skill 路线",
    skillText: "适合需要生产级质量、脚本执行、预览检查和导出修复的用户。",
    desktopTitle: "Desktop Later",
    desktopText: "桌面端代码继续保留；签名、公证、Homebrew 成熟后再作为本地安装路径推广。"
  },
  en: {
    eyebrow: "Web Experience + Agent Skill",
    title: "Shape the workflow online, then let an Agent produce the deck.",
    subtitle: "The web app does not host models or store source material. It turns your intent into an executable prompt for Codex, Claude Code, Hermes, or OpenClaw.",
    openDemo: "Open Web Deck demo",
    copyPrompt: "Copy Agent prompt",
    downloadSource: "Download source.md",
    skillSetup: "Skill setup",
    planner: "Workflow planner",
    preview: "Live Agent prompt",
    examples: "Examples and paths",
    sourceType: "Source type",
    scenario: "Scenario",
    outputMode: "Output",
    stylePreset: "Visual style",
    agentTool: "Agent tool",
    modelPreference: "Model preference",
    titleField: "Project title",
    audience: "Audience",
    slideCount: "Slide count",
    constraints: "Extra requirements",
    copied: "Copied",
    copyFailed: "Copy failed; select the prompt manually",
    localOnly: "Generated locally in the browser",
    webRole: "Web: explain, configure, generate prompt",
    skillRole: "Skill: read files, run scripts, preview, repair, export",
    desktopRole: "Desktop remains a later advanced local mode",
    promptHint: "Send this to your Agent. If the skill is installed, include your source path.",
    sourceTemplateHint: "The template downloads locally and can become Agent source material.",
    workflowExampleTitle: "Skill workflow example",
    workflowExample: "Use $ultimate-ppt-master to turn reports/q3-review.pdf into a 12-slide editable PPTX for an executive meeting. Verify the deck before delivery.",
    demoTitle: "Web Deck demo",
    demoText: "A sanitized culture-tourism brief showing the rhythm of the Web Deck path.",
    skillTitle: "Agent Skill path",
    skillText: "Best for production quality, script execution, preview checks, and export repair.",
    desktopTitle: "Desktop Later",
    desktopText: "Desktop code stays available; signing, notarization, and Homebrew can return after the web path is validated."
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
  constraints: "结论先行，保留可编辑 PPTX；同时生成适合分享的 Web Deck。不要上传敏感资料，生成后检查预览和导出文件。"
};

export function App() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [copyState, setCopyState] = useState("");
  const t = labels[form.language];
  const prompt = useMemo(() => buildPrompt(form), [form]);
  const sourceTemplate = useMemo(() => buildSourceTemplate(form), [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setCopyState("");
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState(t.copied);
    } catch {
      setCopyState(t.copyFailed);
    }
  }

  function downloadSourceTemplate() {
    const blob = new Blob([sourceTemplate], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "source.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app" lang={form.language === "zh" ? "zh-CN" : "en"}>
      <header className="topbar">
        <a className="brand" href={repoUrl} aria-label="Ultimate PPT Master GitHub">
          <img src={`${baseUrl}brand.svg`} alt="" />
          <span>Ultimate PPT Master</span>
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
        <section className="hero-tool">
          <div className="intro-panel">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <p className="intro-copy">{t.subtitle}</p>
            <div className="hero-actions">
              <button className="primary-action" onClick={copyPrompt}>
                <Clipboard size={18} />
                {t.copyPrompt}
              </button>
              <a className="secondary-action" href={skillDocUrl}>
                <BookOpen size={18} />
                {t.skillSetup}
              </a>
            </div>
            <div className="signal-strip" aria-label="Workflow roles">
              <span><ShieldCheck size={15} />{t.localOnly}</span>
              <span><MonitorPlay size={15} />{t.webRole}</span>
              <span><Workflow size={15} />{t.skillRole}</span>
            </div>
          </div>

          <section className="planner-panel" aria-labelledby="planner-title">
            <div className="panel-heading">
              <Wand2 size={18} />
              <h2 id="planner-title">{t.planner}</h2>
            </div>
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
                {t.constraints}
                <textarea value={form.constraints} onChange={(event) => update("constraints", event.target.value)} />
              </label>
            </div>
          </section>
        </section>

        <section className="workbench">
          <section className="prompt-panel" aria-labelledby="prompt-title">
            <div className="panel-heading">
              <Code2 size={18} />
              <h2 id="prompt-title">{t.preview}</h2>
            </div>
            <pre>{prompt}</pre>
            <div className="prompt-actions">
              <button className="primary-action" onClick={copyPrompt}>
                <Clipboard size={18} />
                {copyState || t.copyPrompt}
              </button>
              <button className="secondary-action" onClick={downloadSourceTemplate}>
                <Download size={18} />
                {t.downloadSource}
              </button>
            </div>
            <p className="hint">{t.promptHint}</p>
            <p className="hint">{t.sourceTemplateHint}</p>
          </section>

          <section className="examples-panel" aria-labelledby="examples-title">
            <div className="panel-heading">
              <Sparkles size={18} />
              <h2 id="examples-title">{t.examples}</h2>
            </div>
            <div className="demo-preview">
              <img src={`${baseUrl}demo-cover.svg`} alt="Sanitized Web Deck demo cover" />
              <a className="primary-action full" href={demoUrl}>
                <ExternalLink size={18} />
                {t.openDemo}
              </a>
            </div>
            <div className="route-list">
              <InfoRow icon={MonitorPlay} title={t.demoTitle} text={t.demoText} />
              <InfoRow icon={BookOpen} title={t.skillTitle} text={t.skillText} />
              <InfoRow icon={FileText} title={t.desktopTitle} text={t.desktopRole} />
            </div>
            <div className="workflow-example">
              <strong>{t.workflowExampleTitle}</strong>
              <code>{t.workflowExample}</code>
            </div>
          </section>
        </section>
      </main>
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

function toOptions<T extends string>(items: Record<T, Record<Language, string>>, language: Language) {
  return (Object.keys(items) as T[]).map((value) => ({
    value,
    label: items[value][language]
  }));
}

function readOption<T extends string>(items: Record<T, Record<Language, string>>, value: T, language: Language) {
  return items[value][language];
}

function buildPrompt(form: FormState) {
  const sourceType = readOption(optionText.sourceType, form.sourceType, form.language);
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  const style = readOption(optionText.stylePreset, form.stylePreset, form.language);
  const agent = readOption(optionText.agentTool, form.agentTool, form.language);
  const model = readOption(optionText.modelPreference, form.modelPreference, form.language);

  if (form.language === "en") {
    return `Use the ultimate-ppt-master Agent Skill for this presentation task.\n\nProject title: ${form.title}\nAudience: ${form.audience}\nSource type: ${sourceType}\nScenario: ${scenario}\nOutput target: ${output}\nVisual style: ${style}\nTarget length: ${form.slideCount} slides\nPreferred agent: ${agent}\nModel preference: ${model}\n\nSource material:\n- I will provide the source file, source folder, URL, or source.md after this prompt.\n- Keep private source material local. Do not upload it unless I explicitly ask.\n\nRequirements:\n- Read AGENTS.md and SKILL.md from the ultimate-ppt-master repository.\n- Convert the source into a clean source.md when needed.\n- Build the narrative before generating slides.\n- Produce the requested output mode with editable structure where applicable.\n- Render or preview the result, inspect issues, repair obvious layout problems, and list final files.\n- Keep logs and intermediate artifacts in a local project folder.\n\nExtra requirements:\n${form.constraints || "No extra requirements."}`;
  }

  return `请使用 ultimate-ppt-master Agent Skill 完成这次演示文稿任务。\n\n项目标题：${form.title}\n目标听众：${form.audience}\n资料类型：${sourceType}\n使用场景：${scenario}\n输出目标：${output}\n视觉风格：${style}\n目标页数：${form.slideCount} 页\n优先 Agent：${agent}\n模型偏好：${model}\n\n源资料：\n- 我会在这条 prompt 后提供源文件、资料目录、URL 或 source.md。\n- 私有资料默认留在本地，除非我明确要求，不要上传。\n\n执行要求：\n- 读取 ultimate-ppt-master 仓库里的 AGENTS.md 和 SKILL.md。\n- 必要时先把源资料整理为干净的 source.md。\n- 先完成叙事结构，再生成页面。\n- 按输出目标生成文件；如是 PPTX，保留可编辑结构。\n- 渲染或预览结果，检查问题，修复明显版式错误，并列出最终文件。\n- 日志和中间产物保存在本地项目目录。\n\n补充要求：\n${form.constraints || "无额外要求。"}`;
}

function buildSourceTemplate(form: FormState) {
  const scenario = readOption(optionText.scenario, form.scenario, form.language);
  const output = readOption(optionText.outputMode, form.outputMode, form.language);
  if (form.language === "en") {
    return `# ${form.title}\n\n## Audience\n${form.audience}\n\n## Scenario\n${scenario}\n\n## Desired output\n${output}, about ${form.slideCount} slides.\n\n## Source notes\n- Replace this section with your source material.\n- Keep sensitive names, budgets, and client details redacted when sharing publicly.\n\n## Extra requirements\n${form.constraints}\n`;
  }
  return `# ${form.title}\n\n## 目标听众\n${form.audience}\n\n## 使用场景\n${scenario}\n\n## 目标输出\n${output}，约 ${form.slideCount} 页。\n\n## 源资料要点\n- 把你的资料正文替换到这里。\n- 对外分享前请脱敏机构名称、预算、客户信息和审批细节。\n\n## 补充要求\n${form.constraints}\n`;
}
