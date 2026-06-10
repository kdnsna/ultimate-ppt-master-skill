import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("web app primary surface is a Codex-first project launcher", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /CodexFirstFlow/);
  assert.match(appSource, /SourceDropzone/);
  assert.match(appSource, /CodexPrimaryAction/);
  assert.match(appSource, /CodexResult/);
  assert.match(appSource, /把资料交给 Codex 做 PPT/);
  assert.match(appSource, /项目路径/);
  assert.match(appSource, /Codex 命令/);
  assert.match(appSource, /已复制，打开 Codex 执行这条命令/);
});

test("web app hides platform-console panels from the primary render", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const primaryRender = appSource.slice(
    appSource.indexOf("function CodexFirstFlow"),
    appSource.indexOf("function DebugDrawer")
  );

  assert.doesNotMatch(primaryRender, /ConsoleStepRail/);
  assert.doesNotMatch(primaryRender, /QuickStartConsole/);
  assert.doesNotMatch(primaryRender, /GroupedPreviewTabs/);
  assert.doesNotMatch(primaryRender, /BenchmarkWall/);
  assert.doesNotMatch(primaryRender, /ProviderStatus|provider-grid|模型账号/);
  assert.doesNotMatch(primaryRender, /Design Doctor|quality-report\.json|DeckIR/);
});

test("debug drawer keeps advanced proof and review artifacts available", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");
  const debugSource = appSource.slice(appSource.indexOf("function DebugDrawer"));

  assert.match(debugSource, /DebugDrawer/);
  assert.match(debugSource, /storyboard\.json/);
  assert.match(debugSource, /source-map\.json/);
  assert.match(debugSource, /planning-report\.json/);
  assert.match(debugSource, /review-findings\.json/);
  assert.match(debugSource, /repair-plan\.json/);
  assert.match(debugSource, /revision-brief\.md/);
  assert.match(debugSource, /Benchmark Wall/);
  assert.match(debugSource, /quality-report\.json/);
});

test("codex flow state machine replaces v4 console navigation", async () => {
  const flowSource = await readFile("apps/web/src/consoleFlow.ts", "utf8");

  assert.match(flowSource, /export type CodexFlowState/);
  assert.match(flowSource, /needs_input/);
  assert.match(flowSource, /needs_bridge/);
  assert.match(flowSource, /ready_to_create/);
  assert.match(flowSource, /creating/);
  assert.match(flowSource, /ready_for_codex/);
  assert.match(flowSource, /error/);
  assert.match(flowSource, /getCodexFlowState/);
  assert.match(flowSource, /getCodexPrimaryAction/);
  assert.doesNotMatch(flowSource, /ConsoleStepRail|previewGroupModes|getConsoleSteps|getPrimaryActionId/);
});

test("codex-first payload still writes the v4.2 and v4.3 handoff contract", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /buildCodexFirstBridgePayload/);
  assert.match(appSource, /sourceMarkdown/);
  assert.match(appSource, /agentPrompt/);
  assert.match(appSource, /projectBrief/);
  assert.match(appSource, /qualityGate/);
  assert.match(appSource, /workflowState/);
  assert.match(appSource, /expectedArtifacts/);
  assert.match(appSource, /reviewCommands/);
  assert.match(appSource, /codex-task\.md/);
  assert.match(appSource, /AGENTS\.md/);
  assert.match(appSource, /asset-plan\.md/);
  assert.match(appSource, /visual-element-kit\.md/);
  assert.match(appSource, /apply_review_plan\.py --safe-only --dry-run/);
});
