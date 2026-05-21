import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";


test("web experience exposes content preset packs", async () => {
  const appSource = await readFile("apps/web/src/App.tsx", "utf8");

  assert.match(appSource, /presetCatalog/);
  assert.match(appSource, /contentPreset/);
  assert.match(appSource, /applyPreset/);
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
