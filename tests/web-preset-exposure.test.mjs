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
  const scan = await readFile("docs/github-tech-scan-2026-05.md", "utf8");

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

test("web experience uses menu pages and generic agent setup actions", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /type WorkspaceView/);
  assert.match(appSource, /WorkspaceNav/);
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
