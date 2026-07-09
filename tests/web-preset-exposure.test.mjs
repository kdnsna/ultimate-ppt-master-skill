import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";


test("web experience exposes content preset packs", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const catalogSource = await readFile("apps/web/src/presetCatalog.ts", "utf8");

  assert.match(appSource, /presetCatalog/);
  assert.match(appSource, /contentPreset/);
  assert.match(appSource, /applyPreset/);
  assert.match(catalogSource, /templates\/presets\/consulting_proposal/);
  assert.match(catalogSource, /templates\/presets\/tech_trend_web_deck/);
});

test("web experience exposes the v2.5 quality workbench and Design Doctor", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /QualityWorkbenchPanel/);
  assert.match(appSource, /DesignDoctorPanel/);
  assert.match(appSource, /qualityProfile/);
  assert.match(appSource, /expectedArtifacts/);
  assert.match(appSource, /reviewCommands/);
  assert.match(appSource, /quality-report\.json/);
  assert.match(appSource, /visual_review\.py/);
});

test("preset catalog exposes office-user quality metadata", async () => {
  const catalogSource = await readFile("apps/web/src/presetCatalog.ts", "utf8");

  assert.match(catalogSource, /userLevel/);
  assert.match(catalogSource, /qualityProfile/);
  assert.match(catalogSource, /proofArtifacts/);
  assert.match(catalogSource, /notFor/);
  assert.match(catalogSource, /中文办公用户/);
  assert.match(catalogSource, /visual_review\.py/);
});

test("docs include the GitHub technology scan used for v2.4 direction", async () => {
  const scan = await readFile("docs/quality/github-tech-scan-2026-05.md", "utf8");

  assert.match(scan, /microsoft\/markitdown/);
  assert.match(scan, /modelcontextprotocol\/servers/);
  assert.match(scan, /slidevjs\/slidev/);
  assert.match(scan, /gitbrent\/PptxGenJS/);
});

test("web experience gives first-time users a Hermes-aware first step", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /BeginnerGuide/);
  assert.match(appSource, /firstStepTitle/);
  assert.match(appSource, /hermesDetected/);
  assert.match(appSource, /bridgeOfflineHelp/);
  assert.match(appSource, /useHermes/);
});

test("web experience uses the v4.1 console and generic agent setup actions", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const flowSource = await readFile("apps/web/src/consoleFlow.ts", "utf8");

  assert.match(appSource, /type WorkspaceView/);
  assert.match(appSource, /ConsoleStepRail/);
  assert.match(appSource, /PrimaryActionBar/);
  assert.match(appSource, /QuickStartConsole/);
  assert.match(appSource, /SettingsDrawer/);
  assert.match(appSource, /GroupedPreviewTabs/);
  assert.match(flowSource, /type ConsoleStepId = "start" \| "sources" \| "configuration" \| "handoff"/);
  assert.match(flowSource, /getPrimaryActionId/);
  assert.doesNotMatch(appSource, /function WorkspaceNav/);
  assert.match(appSource, /ConfigurationPage/);
  assert.match(appSource, /autoSelectAgent/);
  assert.match(appSource, /testAllProviders/);
  assert.match(appSource, /openclaw/);
});

test("bridge startup copy command is safe outside the repo root", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /bridgeStartCommand/);
  assert.match(appSource, /find "\$HOME" -maxdepth 5/);
  assert.match(appSource, /cd "\$REPO" && npm run bridge/);
  assert.doesNotMatch(appSource, /copyText\("npm run bridge"\)/);
});

test("home page explains technical terms in plain language", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /PlainLanguageGlossary/);
  assert.match(appSource, /本机连接器（Bridge）/);
  assert.match(appSource, /AI 助手（Agent）/);
  assert.match(appSource, /模型账号（API key）/);
  assert.match(appSource, /本地项目包（handoff）/);
  assert.doesNotMatch(appSource, /网页还不能识别 Hermes/);
});

test("web experience exposes one-click skill install actions", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /SkillTargetStatus/);
  assert.match(appSource, /skillInstallTitle/);
  assert.match(appSource, /installSkill/);
  assert.match(appSource, /\/skill\/install/);
  assert.match(appSource, /installCodexSkill/);
  assert.match(appSource, /fallbackSkillInstallCommand/);
});

test("web experience surfaces v2.6 onboarding, design scoring, and benchmark wall", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /OneClickRunbookPanel/);
  assert.match(appSource, /BenchmarkWall/);
  assert.match(appSource, /designDoctorScores/);
  assert.match(appSource, /benchmarkCases/);
  assert.match(appSource, /开箱跑通/);
  assert.match(appSource, /视觉评分/);
  assert.match(appSource, /案例墙/);
  assert.match(appSource, /Skill 市场分发/);
});

test("web experience exposes the formal business wizard contract", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /type WorkflowStepId = "brief" \| "sources" \| "bridge" \| "agent" \| "handoff" \| "review"/);
  assert.match(appSource, /type StepStatus = "locked" \| "ready" \| "active" \| "complete" \| "blocked"/);
  assert.match(appSource, /type QualityGateLevel = "quick" \| "formal-business" \| "showcase"/);
  assert.match(appSource, /buildWorkflowSteps/);
  assert.match(appSource, /GuidedWorkflowPanel/);
  assert.match(appSource, /qualityGate/);
  assert.match(appSource, /formal-business/);
  assert.match(appSource, /workflowState/);
  assert.match(appSource, /正式商务交付/);
});

test("web experience avoids misleading default progress and command states", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const cssSource = await readFile("apps/web/src/styles.css", "utf8");

  assert.doesNotMatch(appSource, /meta: `\$\{sourceCount\} files · \$\{readiness\}%`/);
  assert.doesNotMatch(appSource, /id: "handoff", label: t\.navHandoff, meta: t\.commandReady/);
  assert.match(appSource, /sourceProgressLabel/);
  assert.match(appSource, /handoffProgressLabel/);
  assert.match(appSource, /statusLabel = hasRealSources/);
  assert.match(appSource, /readinessLabel = hasRealSources/);
  assert.match(appSource, /AuxiliaryResources/);
  assert.match(appSource, /className="auxiliary-resources"/);
  assert.match(appSource, /guided-current-step/);
  assert.match(appSource, /guided-step-rail/);
  assert.match(appSource, /previewLayouts = \["narrative", "comparison", "timeline", "metrics", "decision"\]/);
  assert.match(appSource, /data-layout="\$\{previewLayouts\[index % previewLayouts\.length\]\}"/);
  assert.match(cssSource, /\.app:not\(\[data-view="start"\]\) \.auxiliary-resources/);
  assert.match(appSource, /noRealSourcesYet/);
  assert.match(appSource, /handoffNotCreated/);
});

test("web experience writes a Codex-specific handoff with asset sourcing instructions", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /buildCodexTask/);
  assert.match(appSource, /buildCodexAgentGuide/);
  assert.match(appSource, /buildAssetPlan/);
  assert.match(appSource, /buildVisualElementKit/);
  assert.match(appSource, /codex-task\.md/);
  assert.match(appSource, /AGENTS\.md/);
  assert.match(appSource, /asset-plan\.md/);
  assert.match(appSource, /visual-element-kit\.md/);
  assert.match(appSource, /chatgpt-generation-first/);
  assert.match(appSource, /generate_visual_element_kit\.py/);
  assert.match(appSource, /Needs-Manual/);
  assert.match(appSource, /micro-assets|small reusable elements|小元素|元素素材/i);
  assert.match(appSource, /ChatGPT/);
  assert.match(appSource, /联网|web search|public asset search/i);
  assert.match(appSource, /generated-assets|assets\/generated|生成素材/i);
  assert.match(appSource, /quality-report\.json/);
});

test("web experience exposes AI best route and DeckIR page map", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const flowSource = await readFile("apps/web/src/consoleFlow.ts", "utf8");

  assert.match(appSource, /AIPageMapPanel/);
  assert.match(appSource, /BestRoutePanel/);
  assert.match(appSource, /storyboard\.json/);
  assert.match(appSource, /source-map\.json/);
  assert.match(appSource, /planning-report\.json/);
  assert.match(appSource, /review-findings\.json/);
  assert.match(appSource, /repair-plan\.json/);
  assert.match(appSource, /revision-brief\.md/);
  assert.match(appSource, /一键最佳路线|best route/i);
  assert.match(appSource, /页面地图|page map/i);
  assert.match(appSource, /RenderedReviewLoopPanel/);
  assert.match(appSource, /apply_review_plan\.py/);
  assert.match(flowSource, /deckIR/);
});

test("web experience exposes visual brief tags and expectation fit contract", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const cssSource = await readFile("apps/web/src/styles.css", "utf8");

  assert.match(appSource, /type BriefMode = "visual-tags" \| "codex-guided-intake" \| "source-first" \| "draft-with-assumptions" \| "best-effect-expanded" \| "best-effect-fixed-style"/);
  assert.match(appSource, /VisualBriefBuilder/);
  assert.match(appSource, /ExpectationFitCard/);
  assert.match(appSource, /visualTagGroups/);
  assert.match(appSource, /visualBriefPresets/);
  assert.match(appSource, /assessExpectationFit/);
  assert.match(appSource, /briefMode/);
  assert.match(appSource, /visualBrief/);
  assert.match(appSource, /guidedBrief/);
  assert.match(appSource, /expectationFit/);
  assert.match(appSource, /readyForProduction/);
  assert.match(appSource, /Codex Guided Intake|分步需求访谈/);
  assert.match(cssSource, /visual-brief-builder/);
  assert.match(cssSource, /expectation-fit-card/);
});

test("web experience exposes the v5.2 expectation-fit contract", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const cssSource = await readFile("apps/web/src/styles.css", "utf8");

  assert.match(appSource, /type SourceConfidenceLevel = "strong" \| "partial" \| "weak" \| "topic-only"/);
  assert.match(appSource, /interface DeliveryScorecard/);
  assert.match(appSource, /interface FeedbackLoop/);
  assert.match(appSource, /referenceStyleOptions/);
  assert.match(appSource, /consulting-structured/);
  assert.match(appSource, /financial-steady/);
  assert.match(appSource, /culture-tourism-editorial/);
  assert.match(appSource, /buildV52Contract/);
  assert.match(appSource, /schemaVersion: "v5\.2-brief-v1"/);
  assert.match(appSource, /sourceConfidence/);
  assert.match(appSource, /deliveryScorecard/);
  assert.match(appSource, /feedbackLoop/);
  assert.match(appSource, /confirmationBrief/);
  assert.match(appSource, /imageAcceptance/);
  assert.match(appSource, /slideTask/);
  assert.match(appSource, /Do not invent numbers|不编造数据/);
  assert.match(cssSource, /reference-style-row/);
  assert.match(cssSource, /reference-style-summary/);
});

test("web experience exposes the v5.3 best-effect brief enhancer contract", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const cssSource = await readFile("apps/web/src/styles.css", "utf8");

  assert.match(appSource, /interface BestEffectBrief/);
  assert.match(appSource, /buildBestEffectBrief/);
  assert.match(appSource, /bestEffectBrief/);
  assert.match(appSource, /best-effect-expanded/);
  assert.match(appSource, /best-effect-fixed-style/);
  assert.match(appSource, /Style A Editorial Fixed Rhythm/);
  assert.match(appSource, /Extreme Thin Prompt Fallback/);
  assert.match(appSource, /BestEffectGuide/);
  assert.match(appSource, /best-effect-guide/);
  assert.match(cssSource, /best-effect-guide/);
});
