export type PresetId =
  | "executive_business_review"
  | "consulting_proposal"
  | "product_pitch"
  | "training_courseware"
  | "research_academic_defense"
  | "government_soe_report"
  | "finance_branch_solution"
  | "tech_trend_web_deck";

type LanguageText = Record<"zh" | "en", string>;

interface WebQualityProfile {
  label: LanguageText;
  acceptanceCriteria: LanguageText[];
  reviewCommands: string[];
  expectedArtifacts: string[];
}

interface WebProofArtifacts {
  source: string;
  generatedOutput: string;
  screenshot: string;
  qualityReport: string;
  benchmarkNote: string;
}

export interface WebPreset {
  id: PresetId;
  packPath?: string;
  userLevel?: LanguageText;
  qualityProfile?: WebQualityProfile;
  proofArtifacts?: WebProofArtifacts;
  notFor?: LanguageText[];
  label: LanguageText;
  summary: LanguageText;
  scenario: "executive" | "consulting" | "training" | "launch" | "investor";
  outputMode: "pptx" | "web" | "both";
  stylePreset: "business" | "consulting" | "editorial" | "swiss" | "academic";
  slideCount: number;
  defaultBrief: Record<"zh" | "en", {
    title: string;
    audience: string;
    coreMessage: string;
    sourceNotes: string;
    constraints: string;
  }>;
  sourceRequirements: LanguageText[];
  narrativeSkeleton: LanguageText[];
  slideRoster: LanguageText[];
  templateCandidates: {
    layouts: string[];
    brands?: string[];
    charts: string[];
    webDeckStyle: "editorial" | "swiss";
  };
  qualityChecks: LanguageText[];
  storyboard: Record<"zh" | "en", Array<{ title: string; intent: string }>>;
}

const chineseOfficeUserLevel = { zh: "中文办公用户", en: "Chinese office users" };

const designDoctorReviewCommands = [
  "python3 scripts/svg_quality_checker.py <project_path>",
  "python3 scripts/visual_review.py <project_path>"
];

const pptxQualityArtifacts = [
  "source.md",
  "project-brief.json",
  "preview-web-deck.html",
  "quality-checklist.md",
  "quality-report.json",
  "final.pptx"
];

const webQualityArtifacts = [
  "source.md",
  "project-brief.json",
  "preview-web-deck.html",
  "quality-checklist.md",
  "quality-report.json",
  "final-web-deck.html"
];

export const presetCatalog: WebPreset[] = [
  {
    id: "executive_business_review",
    packPath: "templates/presets/executive_business_review",
    userLevel: chineseOfficeUserLevel,
    qualityProfile: {
      label: { zh: "中文经营汇报交付质量", en: "Chinese business review delivery quality" },
      acceptanceCriteria: [
        { zh: "封面和高管摘要先给管理结论", en: "cover and executive summary state the management answer first" },
        { zh: "KPI 页保留周期、单位、来源和负责人", en: "KPI pages keep period, unit, source, and owner visible" },
        { zh: "PPTX 路线保持图表、文本和备注可编辑", en: "PPTX route keeps charts, text, and notes editable" },
        { zh: "桌面和移动预览无裁切、重叠和小字", en: "desktop and mobile previews have no clipping, overlap, or tiny text" }
      ],
      reviewCommands: designDoctorReviewCommands,
      expectedArtifacts: pptxQualityArtifacts
    },
    proofArtifacts: {
      source: "templates/presets/executive_business_review/source.md",
      generatedOutput: "examples/executive-business-review-starter/web-demo.html",
      screenshot: "examples/executive-business-review-starter/cover.svg",
      qualityReport: "examples/executive-business-review-starter/quality-report.json",
      benchmarkNote: "docs/quality/quality-workbench-v2.5.md"
    },
    notFor: [
      { zh: "缺少经营数据的纯营销路演", en: "pure marketing launches with little operating data" },
      { zh: "不能脱敏展示的董事会私密材料", en: "private board-only material that cannot be sanitized" }
    ],
    label: { zh: "经营复盘 / 高管汇报", en: "Executive Business Review" },
    summary: {
      zh: "月报、季报和经营复盘，强调 KPI、原因、风险和可负责行动。",
      en: "Monthly or quarterly business review with KPIs, causes, risks, and accountable actions."
    },
    scenario: "executive",
    outputMode: "both",
    stylePreset: "business",
    slideCount: 12,
    defaultBrief: {
      zh: {
        title: "季度业务复盘与下一步增长动作",
        audience: "公司管理层 / 项目负责人",
        coreMessage: "本季度增长质量需要从规模复盘转向下一阶段动作拆解，重点呈现风险、机会和可执行抓手。",
        sourceNotes: "1. 业务整体保持增长，但不同区域和渠道分化明显。\n2. 管理层关心下一阶段资源投入、关键风险和可量化目标。\n3. 需要同时输出正式可编辑 PPTX，以及适合分享的 Web Deck。",
        constraints: "结论先行，减少空话；PPTX 保留可编辑结构；Web Deck 更适合传播；不要上传敏感资料，生成后检查预览和导出文件。"
      },
      en: {
        title: "Quarterly Business Review and Next Growth Actions",
        audience: "Executive team / business owners",
        coreMessage: "Growth remains positive, but quality now depends on focused retention, margin discipline, and owner-led next actions.",
        sourceNotes: "1. Overall revenue is growing, but regions and channels diverge.\n2. Executives care about resource allocation, risks, and measurable next actions.\n3. Deliver both an editable PPTX and an optional Swiss-style Web Deck.",
        constraints: "Lead with the answer; keep data editable; avoid unsupported claims; inspect the exported files before delivery."
      }
    },
    sourceRequirements: [
      { zh: "周期和业务背景", en: "review period and business context" },
      { zh: "KPI 表：当前值、目标、上期值", en: "KPI table with current, target, and previous values" },
      { zh: "增长 / 下滑原因", en: "growth and decline drivers" },
      { zh: "风险、机会和待决策事项", en: "risks, opportunities, and open decisions" },
      { zh: "下一阶段行动、负责人和时间", en: "next-period actions, owners, and timing" }
    ],
    narrativeSkeleton: [
      { zh: "先回答管理层问题", en: "open with the management question" },
      { zh: "先展示 KPI 事实，再解释", en: "show KPI reality before interpretation" },
      { zh: "拆开差异、原因、风险和机会", en: "separate variance, causes, risks, and opportunities" },
      { zh: "转成可负责行动", en: "turn findings into accountable actions" }
    ],
    slideRoster: [
      { zh: "封面与一句话结论", en: "cover and one-line answer" },
      { zh: "高管摘要", en: "executive summary" },
      { zh: "KPI 仪表盘", en: "KPI dashboard" },
      { zh: "业绩差异", en: "performance variance" },
      { zh: "原因拆解", en: "driver analysis" },
      { zh: "风险机会图", en: "risk and opportunity map" },
      { zh: "优先行动", en: "priority actions" },
      { zh: "时间表和负责人", en: "timeline and owner plan" }
    ],
    templateCandidates: {
      layouts: ["科技蓝商务", "mckinsey", "招商银行"],
      charts: ["kpi_cards", "stacked_bar_chart", "line_chart", "matrix_2x2", "timeline"],
      webDeckStyle: "swiss"
    },
    qualityChecks: [
      { zh: "每个 KPI 有周期、单位和来源", en: "every KPI has period, unit, and source context" },
      { zh: "摘要不超出来源证据", en: "summary does not overclaim beyond source" },
      { zh: "行动有负责人、截止时间和衡量指标", en: "actions have owner, deadline, and measurable target" },
      { zh: "PPTX 保持文本、图表和备注可编辑", en: "PPTX keeps text, charts, and notes editable" },
      { zh: "Web Deck 检查桌面和移动端", en: "Web Deck is checked on desktop and mobile" }
    ],
    storyboard: {
      zh: [
        { title: "封面与一句话结论", intent: "先把管理层需要记住的判断放出来。" },
        { title: "KPI 事实", intent: "用少量指标说明当前状态，而不是堆满数据。" },
        { title: "差异与原因", intent: "解释区域、渠道或产品分化。" },
        { title: "风险与机会", intent: "把下一步决策需要的信息摆清楚。" },
        { title: "行动计划", intent: "形成责任、节奏和结果指标。" }
      ],
      en: [
        { title: "Cover and answer", intent: "Put the executive takeaway first." },
        { title: "KPI reality", intent: "Summarize the current state with a few metrics." },
        { title: "Variance and causes", intent: "Explain region, channel, or product divergence." },
        { title: "Risks and opportunities", intent: "Clarify information needed for decisions." },
        { title: "Action plan", intent: "Define owners, cadence, and result metrics." }
      ]
    }
  },
  {
    id: "consulting_proposal",
    packPath: "templates/presets/consulting_proposal",
    userLevel: chineseOfficeUserLevel,
    qualityProfile: {
      label: { zh: "中文咨询方案交付质量", en: "Chinese consulting proposal delivery quality" },
      acceptanceCriteria: [
        { zh: "先呈现决策问题，再展开分析", en: "decision question appears before analysis detail" },
        { zh: "推荐方案来自证据和明确评价标准", en: "recommendation follows evidence and explicit evaluation criteria" },
        { zh: "路线图写清阶段、负责人、里程碑和依赖", en: "roadmap names phase, owner, milestone, and dependency" },
        { zh: "PPTX 可供客户继续评审修改", en: "PPTX remains editable and ready for client review" }
      ],
      reviewCommands: designDoctorReviewCommands,
      expectedArtifacts: pptxQualityArtifacts
    },
    proofArtifacts: {
      source: "templates/presets/consulting_proposal/source.md",
      generatedOutput: "examples/consulting-proposal-starter/web-demo.html",
      screenshot: "examples/consulting-proposal-starter/cover.svg",
      qualityReport: "examples/consulting-proposal-starter/quality-report.json",
      benchmarkNote: "docs/quality/quality-workbench-v2.5.md"
    },
    notFor: [
      { zh: "需要强品牌艺术指导的创意 campaign", en: "creative campaigns that need heavy brand art direction" },
      { zh: "未经专业复核的法律或金融建议", en: "legal or financial advice without professional review" }
    ],
    label: { zh: "咨询方案", en: "Consulting Proposal" },
    summary: {
      zh: "问题定义、方案比较、推荐路径和实施路线。",
      en: "Problem definition, option comparison, recommendation, and implementation roadmap."
    },
    scenario: "consulting",
    outputMode: "pptx",
    stylePreset: "consulting",
    slideCount: 10,
    defaultBrief: {
      zh: {
        title: "客户增长诊断与实施建议",
        audience: "客户高管 / 项目委员会",
        coreMessage: "当前瓶颈不是单点效率，而是增长路径、组织协同和执行节奏需要重新对齐。",
        sourceNotes: "请补充客户背景、痛点、约束、可用数据和决策时间表。",
        constraints: "问题定义要具体；方案比较要有证据；路线图要能执行。"
      },
      en: {
        title: "Growth Diagnosis and Implementation Recommendation",
        audience: "Client executives / steering committee",
        coreMessage: "The constraint is not a single efficiency issue; growth path, coordination, and execution cadence need realignment.",
        sourceNotes: "Add client context, pain points, constraints, available data, and decision timeline.",
        constraints: "Make the problem specific; compare options with evidence; keep roadmap feasible."
      }
    },
    sourceRequirements: [
      { zh: "客户现状", en: "client situation" },
      { zh: "核心痛点", en: "pain points" },
      { zh: "约束条件", en: "constraints" },
      { zh: "可用数据", en: "available data" }
    ],
    narrativeSkeleton: [
      { zh: "定义决策问题", en: "define the decision" },
      { zh: "证明问题存在", en: "prove the problem" },
      { zh: "比较选项", en: "compare options" },
      { zh: "推荐路线", en: "recommend a route" }
    ],
    slideRoster: [
      { zh: "封面", en: "cover" },
      { zh: "背景和目标", en: "context and objective" },
      { zh: "现状诊断", en: "current-state diagnosis" },
      { zh: "问题树", en: "issue tree" },
      { zh: "方案比较", en: "option comparison" },
      { zh: "推荐方案", en: "recommended solution" },
      { zh: "实施路线", en: "implementation roadmap" }
    ],
    templateCandidates: {
      layouts: ["mckinsey"],
      charts: ["matrix_2x2", "process_flow", "timeline", "gantt_chart", "waterfall_chart"],
      webDeckStyle: "swiss"
    },
    qualityChecks: [
      { zh: "问题陈述具体", en: "problem statement is specific" },
      { zh: "建议来自证据", en: "recommendation follows evidence" },
      { zh: "方案比较使用明确标准", en: "option comparison uses explicit criteria" },
      { zh: "路线图可执行", en: "roadmap is feasible" },
      { zh: "风险不被埋掉", en: "risks are visible" },
      { zh: "PPTX 适合客户继续评审修改", en: "PPTX remains editable for client review" }
    ],
    storyboard: {
      zh: [
        { title: "问题定义", intent: "界定客户真正要解决的问题。" },
        { title: "诊断框架", intent: "建立分析维度和证据链。" },
        { title: "核心洞察", intent: "把资料转成可解释的判断。" },
        { title: "方案设计", intent: "给出路径、抓手和优先级。" },
        { title: "实施路线", intent: "明确阶段、资源和里程碑。" }
      ],
      en: [
        { title: "Problem definition", intent: "Define the client's real problem." },
        { title: "Diagnostic frame", intent: "Set dimensions and evidence." },
        { title: "Core insights", intent: "Turn material into defensible findings." },
        { title: "Solution design", intent: "Give path, levers, and priorities." },
        { title: "Implementation roadmap", intent: "Clarify phases, resources, and milestones." }
      ]
    }
  },
  {
    id: "product_pitch",
    packPath: "templates/presets/product_pitch",
    userLevel: chineseOfficeUserLevel,
    qualityProfile: {
      label: { zh: "产品路演展示质量", en: "Product pitch showcase quality" },
      acceptanceCriteria: [
        { zh: "前三页无旁白也能读懂", en: "first three slides are understandable without narration" },
        { zh: "产品证明展示工作流、状态或用户结果", en: "product proof shows workflow, state, or user outcome" },
        { zh: "市场和 traction 判断有来源或标注假设", en: "market and traction claims are sourced or labeled as assumptions" },
        { zh: "移动端 Web Deck 可读且控件不重叠", en: "mobile Web Deck remains readable with no overlapping controls" }
      ],
      reviewCommands: designDoctorReviewCommands,
      expectedArtifacts: webQualityArtifacts
    },
    proofArtifacts: {
      source: "templates/presets/product_pitch/source.md",
      generatedOutput: "examples/product-pitch-starter/web-demo.html",
      screenshot: "examples/product-pitch-starter/cover.svg",
      qualityReport: "examples/product-pitch-starter/quality-report.json",
      benchmarkNote: "docs/quality/quality-workbench-v2.5.md"
    },
    notFor: [
      { zh: "需要密集 KPI 表的例行状态汇报", en: "routine status reports that need dense KPI tables" },
      { zh: "未经合规复核的受监管融资材料", en: "regulated fundraising material without compliance review" }
    ],
    label: { zh: "产品路演", en: "Product Pitch" },
    summary: {
      zh: "发布、demo day、融资或产品叙事，强调用户痛点、产品状态和明确 ask。",
      en: "Launch, demo-day, investor, or product story focused on pain, product state, and a clear ask."
    },
    scenario: "launch",
    outputMode: "web",
    stylePreset: "editorial",
    slideCount: 10,
    defaultBrief: {
      zh: {
        title: "Ultimate PPT Master 产品路演",
        audience: "投资人 / 伙伴 / 早期客户",
        coreMessage: "真正有用的 AI 演示工具不止生成漂亮页面，还要接住真实资料、保留可编辑结果，并让本地 Agent 完成可验收交付。",
        sourceNotes: "1. 用户痛点：AI 生成的 PPT 往往难编辑、难检查、与真实资料脱节。\n2. 解决方案：Web Experience + 本地 Bridge + Agent Skill。\n3. 输出：Web Deck 优先，必要时补一个可编辑 PPTX 附录。",
        constraints: "前三页无旁白也能读懂；尽量展示真实工作流状态；假设和路线图必须标清。"
      },
      en: {
        title: "Ultimate PPT Master Product Pitch",
        audience: "investors / partners / early customers",
        coreMessage: "A useful AI presentation tool must handle real sources, preserve editable output, and let a local Agent deliver something checkable.",
        sourceNotes: "1. Pain: AI-generated decks are often hard to edit, hard to verify, and detached from real material.\n2. Solution: Web Experience + local Bridge + Agent Skill.\n3. Output: Web Deck first, optional editable PPTX appendix.",
        constraints: "First three slides must work without narration; show real workflow states; label assumptions and roadmap signals."
      }
    },
    sourceRequirements: [
      { zh: "产品一句话", en: "product one-liner" },
      { zh: "目标用户和痛点工作流", en: "target user and painful workflow" },
      { zh: "为什么是现在", en: "why now" },
      { zh: "方案证明或 demo 流程", en: "solution proof or demo flow" },
      { zh: "行动召唤", en: "ask or call to action" }
    ],
    narrativeSkeleton: [
      { zh: "用用户痛点开场", en: "hook with user pain" },
      { zh: "展示产品切入口", en: "show the product wedge" },
      { zh: "证明不是概念", en: "prove the solution is real" },
      { zh: "连接趋势和机会", en: "connect traction or roadmap to a bigger shift" },
      { zh: "以明确 ask 收束", en: "close with a specific ask" }
    ],
    slideRoster: [
      { zh: "封面钩子", en: "cover hook" },
      { zh: "问题", en: "problem" },
      { zh: "用户和市场变化", en: "user and market shift" },
      { zh: "方案主张", en: "solution promise" },
      { zh: "产品工作流", en: "product workflow" },
      { zh: "证明 / traction", en: "proof or traction" },
      { zh: "路线图", en: "roadmap" },
      { zh: "行动召唤", en: "ask" }
    ],
    templateCandidates: {
      layouts: ["google_style", "anthropic"],
      brands: ["google", "anthropic"],
      charts: ["hub_spoke", "pipeline_with_stages", "timeline"],
      webDeckStyle: "editorial"
    },
    qualityChecks: [
      { zh: "前三页无旁白可读懂", en: "first three slides are understandable without narration" },
      { zh: "产品证明具体可见", en: "product proof is concrete and visible" },
      { zh: "视觉展示工作流或状态", en: "visuals show workflow or product state" },
      { zh: "traction 和市场判断有来源或标注假设", en: "traction and market claims are sourced or labeled assumptions" },
      { zh: "移动端 Web Deck 可读", en: "mobile Web Deck remains readable" }
    ],
    storyboard: {
      zh: [
        { title: "开场钩子", intent: "用一句冲突或机会吸引注意。" },
        { title: "用户痛点", intent: "讲清楚为什么现在需要它。" },
        { title: "产品主张", intent: "把产品价值压缩成清晰主张。" },
        { title: "体验演示", intent: "安排可视化演示或场景流。" },
        { title: "行动召唤", intent: "收束到试用、注册、合作或传播。" }
      ],
      en: [
        { title: "Opening hook", intent: "Open with tension or opportunity." },
        { title: "User pain", intent: "Show why this matters now." },
        { title: "Product promise", intent: "Compress product value into a clear promise." },
        { title: "Experience demo", intent: "Plan a visual demo or scene flow." },
        { title: "Call to action", intent: "Close with trial, signup, partnership, or sharing." }
      ]
    }
  },
  {
    id: "training_courseware",
    label: { zh: "培训课件", en: "Training Courseware" },
    summary: { zh: "内训、工作坊和新人培训，强调学习目标、练习和复盘。", en: "Internal training, workshops, and onboarding with objectives, practice, and review." },
    scenario: "training",
    outputMode: "pptx",
    stylePreset: "academic",
    slideCount: 12,
    defaultBrief: {
      zh: { title: "团队培训课件", audience: "学员 / 新人 / 工作坊参与者", coreMessage: "课程应该让学员完成一个可迁移的技能动作，而不是只听概念。", sourceNotes: "请补充学习目标、学员背景、模块、案例练习和考核方式。", constraints: "每个模块只有一个学习目标；例子要贴近工作场景；备注支持讲师授课。" },
      en: { title: "Team Training Courseware", audience: "learners / new hires / workshop participants", coreMessage: "The course should help learners perform a transferable skill, not only hear concepts.", sourceNotes: "Add objectives, learner background, modules, examples, exercises, and assessment.", constraints: "One outcome per module; practical examples; speaker notes for teaching." }
    },
    sourceRequirements: [
      { zh: "学习目标", en: "learning objective" },
      { zh: "学员背景", en: "learner background" },
      { zh: "模块", en: "modules" },
      { zh: "案例 / 练习", en: "examples / exercises" }
    ],
    narrativeSkeleton: [
      { zh: "说明技能结果", en: "state the skill outcome" },
      { zh: "拆成模块", en: "chunk content into modules" },
      { zh: "用例子讲解", en: "teach with examples" },
      { zh: "加练习和复盘", en: "add practice and reflection" }
    ],
    slideRoster: [
      { zh: "封面", en: "cover" },
      { zh: "学习目标", en: "learning objectives" },
      { zh: "议程", en: "agenda" },
      { zh: "模块开场", en: "module opener" },
      { zh: "概念解释", en: "concept explanation" },
      { zh: "练习", en: "practice task" },
      { zh: "知识检查", en: "knowledge check" }
    ],
    templateCandidates: { layouts: ["academic_defense", "smart_red"], charts: ["process_flow", "timeline", "matrix_2x2"], webDeckStyle: "editorial" },
    qualityChecks: [
      { zh: "每个模块有清晰学习结果", en: "each module has one clear outcome" },
      { zh: "案例实际", en: "examples are practical" },
      { zh: "密集页拆开", en: "dense pages are split" },
      { zh: "备注支持授课", en: "speaker notes support teaching" }
    ],
    storyboard: {
      zh: [
        { title: "课程目标", intent: "说明学员完成后能做什么。" },
        { title: "知识地图", intent: "把内容拆成可学习模块。" },
        { title: "关键概念", intent: "用例子解释核心概念。" },
        { title: "练习与案例", intent: "让学员做一次迁移应用。" },
        { title: "复盘与作业", intent: "留下检查点和后续任务。" }
      ],
      en: [
        { title: "Learning objectives", intent: "State what learners can do after the session." },
        { title: "Knowledge map", intent: "Break content into learnable modules." },
        { title: "Key concepts", intent: "Explain concepts with examples." },
        { title: "Exercises and cases", intent: "Make learners apply the material." },
        { title: "Review and assignment", intent: "Leave checkpoints and follow-up tasks." }
      ]
    }
  },
  {
    id: "research_academic_defense",
    label: { zh: "学术答辩 / 研究汇报", en: "Research / Academic Defense" },
    summary: { zh: "研究问题、方法、数据、结果、局限和贡献。", en: "Research question, method, data, results, limitations, and contribution." },
    scenario: "training",
    outputMode: "pptx",
    stylePreset: "academic",
    slideCount: 12,
    defaultBrief: {
      zh: { title: "研究汇报与答辩材料", audience: "答辩委员会 / 学术同行", coreMessage: "本研究围绕明确问题给出可验证方法和结果，并诚实说明局限与贡献。", sourceNotes: "请补充研究问题、方法、数据、结果、局限和未来工作。", constraints: "图表要有标签；结论必须匹配证据；方法页要足够可复现。" },
      en: { title: "Research Defense Presentation", audience: "committee / research peers", coreMessage: "The work answers a clear question with verifiable methods and results, while stating limits and contribution.", sourceNotes: "Add research question, method, data, results, limitations, and future work.", constraints: "Label figures; match claims to evidence; make method reproducible enough." }
    },
    sourceRequirements: [
      { zh: "研究问题", en: "research question" },
      { zh: "方法", en: "method" },
      { zh: "数据 / 证据", en: "dataset / evidence" },
      { zh: "发现和局限", en: "findings and limitations" }
    ],
    narrativeSkeleton: [
      { zh: "动机和研究缺口", en: "motivate the research gap" },
      { zh: "先讲方法再讲结果", en: "explain method before results" },
      { zh: "用证据展示发现", en: "show findings with evidence" },
      { zh: "说明贡献和局限", en: "state contribution and limitations" }
    ],
    slideRoster: [
      { zh: "封面", en: "cover" },
      { zh: "研究背景", en: "research background" },
      { zh: "问题和贡献", en: "question and contribution" },
      { zh: "方法", en: "method" },
      { zh: "数据", en: "data" },
      { zh: "结果", en: "results" },
      { zh: "讨论", en: "discussion" }
    ],
    templateCandidates: { layouts: ["academic_defense", "重庆大学", "medical_university"], charts: ["line_chart", "grouped_bar_chart", "radar_chart", "process_flow"], webDeckStyle: "swiss" },
    qualityChecks: [
      { zh: "结论匹配证据", en: "claims match evidence" },
      { zh: "方法可复现", en: "method is reproducible enough" },
      { zh: "图表有标签", en: "figures have labels" },
      { zh: "局限明确", en: "limitations are explicit" }
    ],
    storyboard: {
      zh: [
        { title: "研究背景", intent: "说明问题为什么值得研究。" },
        { title: "问题和贡献", intent: "明确研究空白和回答。" },
        { title: "方法", intent: "解释如何得到结果。" },
        { title: "结果", intent: "用证据呈现主要发现。" },
        { title: "局限与未来工作", intent: "诚实说明边界和下一步。" }
      ],
      en: [
        { title: "Research background", intent: "Explain why the question matters." },
        { title: "Question and contribution", intent: "Make the gap and answer clear." },
        { title: "Method", intent: "Explain how results were produced." },
        { title: "Results", intent: "Present findings with evidence." },
        { title: "Limitations and future work", intent: "State boundaries and next steps." }
      ]
    }
  },
  {
    id: "government_soe_report",
    label: { zh: "政务 / 国企汇报", en: "Government / SOE Report" },
    summary: { zh: "正式工作汇报、政策背景、进展、工作流和风险控制。", en: "Formal report with policy context, progress, workstreams, and risk controls." },
    scenario: "executive",
    outputMode: "pptx",
    stylePreset: "business",
    slideCount: 10,
    defaultBrief: {
      zh: { title: "重点项目工作汇报", audience: "政府领导 / 国企管理层 / 项目相关方", coreMessage: "项目已形成阶段性进展，下一步需要围绕重点任务、责任分工和风险控制推进。", sourceNotes: "请补充政策背景、目标、进度、指标、实施计划和风险控制。", constraints: "语气正式克制；口号不能代替证据；责任和时间表要清楚。" },
      en: { title: "Key Project Work Report", audience: "government leaders / SOE leadership / stakeholders", coreMessage: "The project has made staged progress; next steps should focus on workstreams, responsibilities, and risk controls.", sourceNotes: "Add policy background, objectives, progress, metrics, implementation plan, and risk controls.", constraints: "Formal tone; evidence over slogans; clear responsibilities and timeline." }
    },
    sourceRequirements: [
      { zh: "政策或项目背景", en: "policy or project background" },
      { zh: "目标", en: "objectives" },
      { zh: "当前进展", en: "current progress" },
      { zh: "实施计划", en: "implementation plan" }
    ],
    narrativeSkeleton: [
      { zh: "战略背景开场", en: "start with strategic context" },
      { zh: "展示进展和证据", en: "show progress and evidence" },
      { zh: "按工作流组织", en: "organize around workstreams" },
      { zh: "收束到保障措施", en: "close with safeguards" }
    ],
    slideRoster: [
      { zh: "封面", en: "cover" },
      { zh: "战略背景", en: "strategic background" },
      { zh: "总体进展", en: "overall progress" },
      { zh: "重点工作", en: "workstream detail" },
      { zh: "项目时间表", en: "project timeline" },
      { zh: "风险控制", en: "risk controls" },
      { zh: "下一步", en: "next steps" }
    ],
    templateCandidates: { layouts: ["government_blue", "government_red", "中国电建_现代", "china_telecom_template"], charts: ["timeline", "gantt_chart", "process_flow", "layered_architecture"], webDeckStyle: "swiss" },
    qualityChecks: [
      { zh: "语气正式克制", en: "tone is formal and restrained" },
      { zh: "口号不替代证据", en: "slogans do not replace evidence" },
      { zh: "时间表和责任清晰", en: "timeline and responsibilities are clear" },
      { zh: "视觉密度受控", en: "visual density is controlled" }
    ],
    storyboard: {
      zh: [
        { title: "战略背景", intent: "说明项目为什么重要。" },
        { title: "总体进展", intent: "用事实展示阶段成果。" },
        { title: "重点工作", intent: "按工作流拆解当前任务。" },
        { title: "风险控制", intent: "把保障措施讲清楚。" },
        { title: "下一步安排", intent: "明确时间、责任和支持需求。" }
      ],
      en: [
        { title: "Strategic background", intent: "Explain why the project matters." },
        { title: "Overall progress", intent: "Show staged results with facts." },
        { title: "Key workstreams", intent: "Break down current tasks." },
        { title: "Risk controls", intent: "Clarify safeguards." },
        { title: "Next steps", intent: "State timeline, owners, and support needed." }
      ]
    }
  },
  {
    id: "finance_branch_solution",
    label: { zh: "金融 / 分支机构方案", en: "Finance / Branch Solution" },
    summary: { zh: "银行、金融产品、分支经营和合规约束下的行动方案。", en: "Banking, financial product, branch operations, and compliance-aware rollout plan." },
    scenario: "executive",
    outputMode: "pptx",
    stylePreset: "business",
    slideCount: 10,
    defaultBrief: {
      zh: { title: "分支机构金融解决方案", audience: "分行管理层 / 产品团队 / 客户经理", coreMessage: "方案需要把客户分层、产品组合、运营流程和合规边界转成可落地动作。", sourceNotes: "请补充业务背景、客户分层、产品方案、运营数据、合规约束和推广计划。", constraints: "合规敏感表述要谨慎；客户场景要具体；金融数据要标注口径。" },
      en: { title: "Branch Financial Solution", audience: "branch leaders / product teams / relationship managers", coreMessage: "The solution must turn segments, product bundle, operating model, and compliance boundaries into executable actions.", sourceNotes: "Add business background, customer segments, product solution, operating data, compliance constraints, and rollout plan.", constraints: "Use cautious compliance language; make customer scenarios concrete; label financial data." }
    },
    sourceRequirements: [
      { zh: "业务背景", en: "business background" },
      { zh: "客户分层", en: "customer segment" },
      { zh: "产品或方案", en: "product or solution" },
      { zh: "风险 / 合规约束", en: "risk / compliance constraints" }
    ],
    narrativeSkeleton: [
      { zh: "定义业务机会", en: "define business opportunity" },
      { zh: "拆客户需求", en: "segment customer needs" },
      { zh: "解释方案结构", en: "explain solution architecture" },
      { zh: "转成推广动作", en: "turn into rollout actions" }
    ],
    slideRoster: [
      { zh: "机会摘要", en: "opportunity summary" },
      { zh: "客户分层", en: "customer segmentation" },
      { zh: "方案概览", en: "solution overview" },
      { zh: "运营流程", en: "operating model" },
      { zh: "风险合规", en: "risk and compliance" },
      { zh: "推广计划", en: "rollout plan" }
    ],
    templateCandidates: { layouts: ["招商银行", "科技蓝商务"], charts: ["funnel_chart", "process_flow", "kpi_cards", "timeline"], webDeckStyle: "swiss" },
    qualityChecks: [
      { zh: "合规表述谨慎", en: "compliance-sensitive claims are cautious" },
      { zh: "客户场景具体", en: "customer scenarios are concrete" },
      { zh: "金融数据有口径", en: "financial data is labeled" },
      { zh: "行动可由分支执行", en: "action plan is branch-executable" }
    ],
    storyboard: {
      zh: [
        { title: "机会摘要", intent: "说明业务机会和约束。" },
        { title: "客户分层", intent: "把需求拆成可服务客群。" },
        { title: "方案概览", intent: "展示产品组合和价值。" },
        { title: "运营流程", intent: "说明如何落地执行。" },
        { title: "风险与推广", intent: "处理合规边界和 rollout。" }
      ],
      en: [
        { title: "Opportunity summary", intent: "Explain business opportunity and constraints." },
        { title: "Customer segmentation", intent: "Translate needs into serviceable groups." },
        { title: "Solution overview", intent: "Show bundle and value." },
        { title: "Operating model", intent: "Explain execution path." },
        { title: "Risk and rollout", intent: "Handle compliance and rollout." }
      ]
    }
  },
  {
    id: "tech_trend_web_deck",
    packPath: "templates/presets/tech_trend_web_deck",
    userLevel: chineseOfficeUserLevel,
    qualityProfile: {
      label: { zh: "科技趋势 Web Deck 公开展示质量", en: "Tech trend Web Deck public showcase quality" },
      acceptanceCriteria: [
        { zh: "每个外部信号都有公开来源或引用说明", en: "every external signal has a public source or citation note" },
        { zh: "事实、解读和建议在视觉上分开", en: "facts, interpretation, and recommendations stay visually separated" },
        { zh: "页面节奏在证据页和观点页之间切换", en: "visual rhythm alternates evidence pages and thesis pages" },
        { zh: "桌面和移动端无重叠或裁切文字", en: "desktop and mobile Web Deck views have no overlap or clipped text" }
      ],
      reviewCommands: designDoctorReviewCommands,
      expectedArtifacts: webQualityArtifacts
    },
    proofArtifacts: {
      source: "templates/presets/tech_trend_web_deck/source.md",
      generatedOutput: "examples/tech-trend-web-deck-starter/web-demo.html",
      screenshot: "examples/tech-trend-web-deck-starter/cover.svg",
      qualityReport: "examples/tech-trend-web-deck-starter/quality-report.json",
      benchmarkNote: "docs/quality/quality-workbench-v2.5.md"
    },
    notFor: [
      { zh: "不能引用公开资料的机密战略汇报", en: "confidential strategy decks that cannot cite public material" },
      { zh: "需要方法论优先结构的正式学术答辩", en: "formal academic defense decks that require methodology-first structure" }
    ],
    label: { zh: "科技趋势 Web Deck", en: "Tech Trend Web Deck" },
    summary: { zh: "公开趋势分享和思想领导力，强调来源、变化、影响和实践建议。", en: "Public trend or thought-leadership deck with sources, shift, implications, and takeaway." },
    scenario: "launch",
    outputMode: "web",
    stylePreset: "editorial",
    slideCount: 11,
    defaultBrief: {
      zh: { title: "科技趋势观察 Web Deck", audience: "公众读者 / 开发者社区 / 产品团队", coreMessage: "一个有价值的趋势分享必须从公开信号出发，解释技术栈和用户行为的实际变化。", sourceNotes: "请补充主题、公开来源、切入角度、关键信号、影响和安全边界。", constraints: "引用公开来源；主题不能敏感；页面节奏要在密集和留白之间切换。" },
      en: { title: "Technology Trend Web Deck", audience: "public readers / developer community / product teams", coreMessage: "A useful trend deck starts from public signals and explains real changes in stack and behavior.", sourceNotes: "Add topic, public sources, angle, key signals, implications, and safety constraints.", constraints: "Cite public sources; keep topic non-sensitive; alternate dense and breathing slides." }
    },
    sourceRequirements: [
      { zh: "主题", en: "topic" },
      { zh: "公开来源", en: "public references" },
      { zh: "角度", en: "angle" },
      { zh: "关键信号", en: "key signals" }
    ],
    narrativeSkeleton: [
      { zh: "用变化开场", en: "open with the shift" },
      { zh: "展示外部信号", en: "show external signal" },
      { zh: "翻译成栈或行为变化", en: "translate into stack or behavior change" },
      { zh: "收束到实践 takeaway", en: "close with practical takeaway" }
    ],
    slideRoster: [
      { zh: "封面", en: "cover" },
      { zh: "趋势钩子", en: "trend hook" },
      { zh: "新闻信号", en: "news signal" },
      { zh: "栈变化", en: "stack shift" },
      { zh: "用户需求", en: "user need" },
      { zh: "产品影响", en: "product implication" },
      { zh: "takeaway", en: "takeaway" }
    ],
    templateCandidates: { layouts: ["google_style", "anthropic", "pixel_retro"], brands: ["google", "anthropic"], charts: ["layered_architecture", "pipeline_with_stages", "hub_spoke", "timeline"], webDeckStyle: "editorial" },
    qualityChecks: [
      { zh: "引用公开来源", en: "public sources are cited" },
      { zh: "主题非敏感", en: "topic is non-sensitive" },
      { zh: "事实和解读在视觉上分开", en: "facts and interpretation are visually separated" },
      { zh: "节奏有疏密变化", en: "visual rhythm alternates dense and breathing slides" },
      { zh: "桌面和移动端已检查", en: "desktop and mobile views are checked" },
      { zh: "可选 PPTX 附录保持可编辑", en: "optional PPTX appendix remains editable" }
    ],
    storyboard: {
      zh: [
        { title: "趋势钩子", intent: "用一个清晰变化吸引注意。" },
        { title: "公开信号", intent: "展示证据来源。" },
        { title: "技术栈变化", intent: "解释底层结构怎么变。" },
        { title: "用户影响", intent: "说明行为和需求的变化。" },
        { title: "实践 takeaway", intent: "给出可执行建议。" }
      ],
      en: [
        { title: "Trend hook", intent: "Open with a clear shift." },
        { title: "Public signals", intent: "Show evidence sources." },
        { title: "Stack shift", intent: "Explain structural change." },
        { title: "User impact", intent: "Show behavior and need changes." },
        { title: "Practical takeaway", intent: "Give actionable guidance." }
      ]
    }
  }
];

export function findPreset(id: string | undefined): WebPreset {
  return presetCatalog.find((preset) => preset.id === id) || presetCatalog[0];
}
