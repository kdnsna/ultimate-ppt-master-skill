import assert from "node:assert/strict";
import { lstat, mkdtemp, readFile, readlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { createBridgeServer } from "../apps/bridge/server.mjs";

async function withServer(options, fn) {
  const server = createBridgeServer(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("health reports provider status without leaking keys", async () => {
  await withServer(
    {
      env: {
        OPENAI_API_KEY: "sk-test-secret-that-must-not-leak",
        OPENAI_MODEL: "gpt-test"
      }
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200);
      const text = await response.text();
      assert.ok(!text.includes("sk-test-secret-that-must-not-leak"));
      const payload = JSON.parse(text);
      const packageJson = JSON.parse(await readFile(join(process.cwd(), "package.json"), "utf8"));
      assert.equal(payload.version, packageJson.version);
      const openai = payload.providers.find((provider) => provider.id === "openai");
      assert.equal(openai.configured, true);
      assert.equal(openai.model, "gpt-test");
    }
  );
});

test("bridge exposes a read-only SSE progress stream", async () => {
  await withServer({}, async (baseUrl) => {
    const controller = new AbortController();
    let reader;
    try {
      const response = await fetch(`${baseUrl}/events`, { signal: controller.signal });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") || "", /text\/event-stream/);
      reader = response.body.getReader();
      let firstFrame = "";
      while (!firstFrame.includes('"type":"connected"')) {
        const { value, done } = await reader.read();
        if (done) break;
        firstFrame += new TextDecoder().decode(value);
      }
      assert.match(firstFrame, /Bridge progress stream/);
      assert.match(firstFrame, /"type":"connected"/);
    } finally {
      controller.abort();
      await reader?.cancel().catch(() => {});
    }
  });
});

test("handoff writes project files and extracts browser text attachments", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-"));
  await withServer({ outputDir }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: { title: "Bridge Test Deck" },
        sourceMarkdown: "# Source\n\nBrowser notes.",
        agentPrompt: "Use the skill.",
        projectBrief: { title: "Bridge Test Deck" },
        enginePlanMarkdown: "# Engine",
        qualityChecklist: "# Checklist",
        attachments: [
          {
            id: "a1",
            kind: "file",
            name: "notes.md",
            type: "text/markdown",
            size: 14,
            text: "# Notes\n\nHello."
          }
        ]
      })
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.ok(payload.files.includes("manifest.json"));
    assert.ok(payload.files.includes("extracted-source.md"));
    const extracted = await readFile(join(payload.projectPath, "extracted-source.md"), "utf8");
    assert.ok(extracted.includes("Hello."));
    assert.equal(payload.manifest.attachments[0].parseStatus, "textExtracted");
    const storyboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
    assert.equal(storyboard.slides[0].slideId, "P01");
    const sourceMap = JSON.parse(await readFile(join(payload.projectPath, "source-map.json"), "utf8"));
    assert.equal(sourceMap.slideEvidence[0].slideId, "P01");
  });
  await rm(outputDir, { recursive: true, force: true });
});

test("handoff reuses attachment extraction by content hash", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-cache-"));
  await withServer({ outputDir }, async (baseUrl) => {
    const requestBody = {
      form: { title: "Cache Test Deck" },
      projectBrief: { title: "Cache Test Deck" },
      attachments: [{ id: "cache-source", kind: "file", name: "source.md", type: "text/markdown", text: "# Stable source\n\nSame content." }]
    };
    const first = await fetch(`${baseUrl}/handoff`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
    const firstPayload = await first.json();
    const second = await fetch(`${baseUrl}/handoff`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
    const secondPayload = await second.json();
    assert.equal(firstPayload.manifest.attachments[0].parseStatus, "textExtracted");
    assert.equal(secondPayload.manifest.attachments[0].parseStatus, "cacheHit");
    assert.equal(firstPayload.manifest.attachments[0].contentHash, secondPayload.manifest.attachments[0].contentHash);
  });
  await rm(outputDir, { recursive: true, force: true });
});

test("slide regeneration writes a stable slide revision request", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-slide-"));
  await withServer({ outputDir }, async (baseUrl) => {
    const handoff = await fetch(`${baseUrl}/handoff`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ form: { title: "Slide Revision Deck" }, projectBrief: { title: "Slide Revision Deck" } }) });
    const handoffPayload = await handoff.json();
    const revision = await fetch(`${baseUrl}/slides/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectPath: handoffPayload.projectPath, slideId: "P02", variantId: "P02-v2", instruction: "Use the comparison variant." })
    });
    assert.equal(revision.status, 200);
    const revisionPayload = await revision.json();
    assert.equal(revisionPayload.slideId, "P02");
    const saved = JSON.parse(await readFile(revisionPayload.requestPath, "utf8"));
    assert.equal(saved.variantId, "P02-v2");
    assert.equal(saved.status, "pending");
  });
  await rm(outputDir, { recursive: true, force: true });
});

test("handoff writes v2.5 quality contract into manifest and report", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-quality-"));
  await withServer({ outputDir }, async (baseUrl) => {
    const qualityProfile = {
      label: "中文办公交付质量",
      acceptanceCriteria: ["结论先行", "关键页无拥挤", "图表可读", "来源可追溯"]
    };
    const expectedArtifacts = ["preview-web-deck.html", "quality-report.json", "final.pptx"];
    const reviewCommands = [
      "python3 scripts/svg_quality_checker.py <project_path>",
      "python3 scripts/visual_review.py <project_path>"
    ];

    const response = await fetch(`${baseUrl}/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: { title: "Quality Contract Deck" },
        sourceMarkdown: "# Source\n\nQuality notes.",
        agentPrompt: "Use the skill.",
        projectBrief: { title: "Quality Contract Deck" },
        enginePlanMarkdown: "# Engine",
        qualityChecklist: "# Checklist",
        qualityProfile,
        expectedArtifacts,
        reviewCommands
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.ok(payload.files.includes("quality-report.json"));
    assert.deepEqual(payload.manifest.qualityProfile, qualityProfile);
    assert.deepEqual(payload.manifest.expectedArtifacts, expectedArtifacts);
    assert.deepEqual(payload.manifest.reviewCommands, reviewCommands);

    const manifest = JSON.parse(await readFile(join(payload.projectPath, "manifest.json"), "utf8"));
    assert.deepEqual(manifest.qualityProfile, qualityProfile);
    assert.deepEqual(manifest.expectedArtifacts, expectedArtifacts);
    assert.deepEqual(manifest.reviewCommands, reviewCommands);

    const report = JSON.parse(await readFile(join(payload.projectPath, "quality-report.json"), "utf8"));
    assert.equal(report.status, "pending");
    assert.deepEqual(report.qualityProfile, qualityProfile);
    assert.match(report.summary.zh, /视觉复查/);
  });
  await rm(outputDir, { recursive: true, force: true });
});

test("handoff writes formal business quality gate and workflow state", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-formal-"));
  await withServer({ outputDir }, async (baseUrl) => {
    const qualityGate = {
      level: "formal-business",
      requiredInputs: ["brand-assets-or-fallback", "evidence-sources", "image-or-no-image-strategy"],
      acceptanceCriteria: ["brand expression is explicit", "layout rhythm is varied"],
      artifactChecks: ["editable PPTX text objects", "web deck visual completeness"],
      reviewCommands: ["python3 scripts/audit_formal_delivery.py <project_path>"]
    };
    const workflowState = {
      currentStep: "handoff",
      blockedReason: ""
    };

    const response = await fetch(`${baseUrl}/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: { title: "Formal Business Deck" },
        sourceMarkdown: "# Source\n\nFormal business notes.",
        agentPrompt: "Use the skill and read quality-checklist.md before producing.",
        projectBrief: { title: "Formal Business Deck", qualityGate, workflowState },
        enginePlanMarkdown: "# Engine",
        qualityChecklist: "# Checklist\n\nRun formal delivery audit.",
        qualityGate,
        workflowState
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.deepEqual(payload.manifest.qualityGate, qualityGate);
    assert.deepEqual(payload.manifest.workflowState, workflowState);

    const manifest = JSON.parse(await readFile(join(payload.projectPath, "manifest.json"), "utf8"));
    assert.deepEqual(manifest.qualityGate, qualityGate);
    assert.deepEqual(manifest.workflowState, workflowState);

    const brief = JSON.parse(await readFile(join(payload.projectPath, "project-brief.json"), "utf8"));
    assert.deepEqual(brief.qualityGate, qualityGate);
    assert.deepEqual(brief.workflowState, workflowState);
    assert.ok(brief.briefMode);
    assert.ok(brief.visualBrief);
    assert.ok(brief.guidedBrief);
    assert.ok(brief.expectationFit);
    assert.equal(brief.schemaVersion, "v5.2-brief-v1");
    assert.ok(brief.sourceConfidence);
    assert.ok(brief.deliveryScorecard);
    assert.ok(brief.referenceStyle);
    assert.ok(brief.feedbackLoop);
    assert.ok(brief.confirmationBrief);
    assert.ok(brief.imageAcceptance);
    assert.equal(typeof brief.expectationFit.readyForProduction, "boolean");

    const report = JSON.parse(await readFile(join(payload.projectPath, "quality-report.json"), "utf8"));
    assert.deepEqual(report.qualityGate, qualityGate);
    assert.deepEqual(report.workflowState, workflowState);
    assert.ok(report.expectationFit);
    assert.ok(report.sourceConfidence);
    assert.ok(report.deliveryScorecard);
    assert.ok(report.feedbackLoop);
    assert.ok(report.checks.some((check) => check.id === "expectation-fit"));
    assert.ok(report.checks.some((check) => check.id === "source-confidence"));
    assert.ok(report.checks.some((check) => check.id === "delivery-scorecard"));
    assert.ok(report.checks.some((check) => check.id === "feedback-loop"));

    assert.ok(payload.files.includes("codex-task.md"));
    assert.ok(payload.files.includes("AGENTS.md"));
    assert.ok(payload.files.includes("asset-plan.md"));
    assert.ok(payload.files.includes("visual-element-kit.md"));
    assert.ok(payload.files.includes("storyboard.json"));
    assert.ok(payload.files.includes("source-map.json"));
    assert.ok(payload.files.includes("planning-report.json"));
    assert.ok(payload.files.includes("review-findings.json"));
    assert.ok(payload.files.includes("repair-plan.json"));
    assert.ok(payload.files.includes("revision-brief.md"));

    const codexTask = await readFile(join(payload.projectPath, "codex-task.md"), "utf8");
    assert.match(codexTask, /storyboard\.json/);
    assert.match(codexTask, /source-map\.json/);
    assert.match(codexTask, /planning-report\.json/);
    assert.match(codexTask, /review-findings\.json/);
    assert.match(codexTask, /revision-brief\.md/);
    assert.match(codexTask, /audit_storyboard\.py/);
    assert.match(codexTask, /review_rendered_deck\.py/);
    assert.match(codexTask, /apply_review_plan\.py/);
    assert.match(codexTask, /quality-checklist\.md/);
    assert.match(codexTask, /asset-plan\.md/);
    assert.match(codexTask, /audit_formal_delivery\.py/);
    assert.match(codexTask, /quality-report\.json/);
    assert.match(codexTask, /ChatGPT|image generation|生成素材/i);
    assert.match(codexTask, /visual-element-kit\.md/);
    assert.match(codexTask, /generate_visual_element_kit\.py/);
    assert.match(codexTask, /Expectation Fit and Guided Intake/);
    assert.match(codexTask, /readyForProduction/);
    assert.match(codexTask, /sourceConfidence|Source confidence/);
    assert.match(codexTask, /deliveryScorecard|Delivery summary/);
    assert.match(codexTask, /referenceStyle|Reference style/);
    assert.match(codexTask, /feedbackLoop|Feedback status/);
    assert.match(codexTask, /Needs-Manual|no image backend|no IMAGE_BACKEND|无 key/i);
    assert.match(codexTask, /micro-assets|small element|小元素|元素素材/i);
    assert.match(codexTask, /web search|联网|公开素材/i);

    const codexGuide = await readFile(join(payload.projectPath, "AGENTS.md"), "utf8");
    assert.match(codexGuide, /Codex/);
    assert.match(codexGuide, /expectationFit/);
    assert.match(codexGuide, /sourceConfidence|Source confidence/);
    assert.match(codexGuide, /delivery scorecard|deliveryScorecard/i);
    assert.match(codexGuide, /feedbackLoop|feedback status/i);
    assert.match(codexGuide, /guided intake/i);
    assert.match(codexGuide, /private source|敏感资料/i);
    assert.match(codexGuide, /asset-plan\.md/);

    const assetPlan = await readFile(join(payload.projectPath, "asset-plan.md"), "utf8");
    assert.match(assetPlan, /Public asset search|公开素材检索|素材检索/);
    assert.match(assetPlan, /ChatGPT|generated asset|生成素材/i);
    assert.match(assetPlan, /source|来源|license|授权/i);

    const visualElementKit = await readFile(join(payload.projectPath, "visual-element-kit.md"), "utf8");
    assert.match(visualElementKit, /chatgpt-generation-first/i);
    assert.match(visualElementKit, /micro-assets|small reusable elements|小元素|元素素材/i);
    assert.match(visualElementKit, /section divider|metric badge|process node|connector/i);

    const command = payload.suggestedCommands.codex;
    assert.match(command, /AGENTS\.md/);
    assert.match(command, /codex-task\.md/);
    assert.match(command, /storyboard\.json/);
    assert.match(command, /source-map\.json/);
    assert.match(command, /asset-plan\.md/);
    assert.match(command, /visual-element-kit\.md/);
    assert.match(command, /expectationFit/);
    assert.match(command, /sourceConfidence/);
    assert.match(command, /deliveryScorecard/);
    assert.match(command, /referenceStyle/);
    assert.match(command, /feedbackLoop/);
    assert.match(command, /guided intake/i);
    assert.match(command, /generate_visual_element_kit\.py/);
    assert.match(command, /Needs-Manual/i);
    assert.match(command, /quality-checklist\.md/);
    assert.match(command, /formal delivery/i);
    assert.match(command, /apply_review_plan\.py/);

    const storyboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
    assert.equal(storyboard.deckIRVersion, "1.0");
    assert.equal(storyboard.schemaVersion, "v5.2-brief-v1");
    assert.ok(storyboard.sourceConfidence);
    assert.ok(storyboard.deliveryScorecard);
    assert.ok(storyboard.slides.length >= 4);
    assert.ok(storyboard.slides.every((slide) => slide.slideTask));
    const sourceMap = JSON.parse(await readFile(join(payload.projectPath, "source-map.json"), "utf8"));
    assert.ok(sourceMap.claims.length > 0);
    const reviewFindings = JSON.parse(await readFile(join(payload.projectPath, "review-findings.json"), "utf8"));
    assert.equal(reviewFindings.version, "rendered-review-v1");
    const repairPlan = JSON.parse(await readFile(join(payload.projectPath, "repair-plan.json"), "utf8"));
    assert.equal(repairPlan.version, "review-repair-plan-v1");
    assert.equal(repairPlan.status, "pending");
    assert.equal(repairPlan.revisionBrief, "revision-brief.md");
    const revisionBrief = await readFile(join(payload.projectPath, "revision-brief.md"), "utf8");
    assert.match(revisionBrief, /pending/i);
  });
  await rm(outputDir, { recursive: true, force: true });
});

test("agent launch is command-only unless allow launch is enabled", async () => {
  await withServer({ allowLaunch: false }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/agent/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectPath: "/tmp/upm-test", agent: "codex" })
    });
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.launched, false);
    assert.ok(payload.command.includes("codex"));
    assert.ok(payload.message.includes("--allow-launch"));
  });
});

test("health reports skill install targets without mutating the real home directory", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "upm-home-"));
  try {
    await withServer({ homeDir }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200);
      const payload = await response.json();
      const codexTarget = payload.skillTargets.find((target) => target.id === "codex");
      assert.equal(codexTarget.installed, false);
      assert.equal(codexTarget.targetPath, join(homeDir, ".codex", "skills", "ultimate-ppt-master"));
      assert.ok(codexTarget.installCommand.includes("ln -s"));
    });
  } finally {
    await rm(homeDir, { recursive: true, force: true });
  }
});

test("skill install links the current checkout into an allowlisted agent target", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "upm-home-"));
  try {
    await withServer({ homeDir }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/skill/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "codex" })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.ok, true);
      assert.equal(payload.installed, true);
      assert.equal(payload.managed, true);
      const targetPath = join(homeDir, ".codex", "skills", "ultimate-ppt-master");
      const stats = await lstat(targetPath);
      assert.equal(stats.isSymbolicLink(), true);
      const linkValue = await readlink(targetPath);
      assert.equal(resolve(dirname(targetPath), linkValue), process.cwd());
    });
  } finally {
    await rm(homeDir, { recursive: true, force: true });
  }
});

test("skill install rejects unsupported targets", async () => {
  const homeDir = await mkdtemp(join(tmpdir(), "upm-home-"));
  try {
    await withServer({ homeDir }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/skill/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "../elsewhere" })
      });
      assert.equal(response.status, 400);
      const payload = await response.json();
      assert.equal(payload.ok, false);
      assert.match(payload.message, /Unsupported Skill target/);
    });
  } finally {
    await rm(homeDir, { recursive: true, force: true });
  }
});
