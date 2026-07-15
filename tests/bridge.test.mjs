import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { access, lstat, mkdir, mkdtemp, readFile, readdir, readlink, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { createBridgeServer } from "../apps/bridge/server.mjs";

async function withServer(options, fn) {
  const server = createBridgeServer({ artifactStableAgeMs: 0, ...options });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function waitFor(predicate, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Timed out waiting for the expected test state.");
}

async function readSseUntil(reader, predicate, timeoutMs = 5000) {
  const decoder = new TextDecoder();
  const events = [];
  let buffered = "";
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let timer;
    const remaining = Math.max(1, deadline - Date.now());
    const chunk = await Promise.race([
      reader.read(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Timed out waiting for SSE event.")), remaining);
      })
    ]).finally(() => clearTimeout(timer));
    if (chunk.done) break;
    buffered += decoder.decode(chunk.value, { stream: true });
    const frames = buffered.split("\n\n");
    buffered = frames.pop() || "";
    for (const frame of frames) {
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6))
        .join("\n");
      if (!data) continue;
      events.push(JSON.parse(data));
      if (predicate(events)) return events;
    }
  }
  throw new Error("SSE stream ended before the expected event arrived.");
}

const fixtureLayouts = {
  anchor: ["cover.hero-left-visual", "cover.image-stage"],
  context: ["section.hero-light", "context.vertical-timeline"],
  evidence: ["evidence.source-ledger", "evidence.native-chart"],
  comparison: ["comparison.two-column-delta", "comparison.decision-matrix"],
  process: ["action.horizontal-timeline", "action.system-map"],
  benefit: ["evidence.native-chart", "evidence.source-ledger"],
  risk: ["evidence.source-ledger", "comparison.decision-matrix"],
  action: ["action.owner-roadmap", "action.system-map"],
  closing: ["closing.commitment-tail", "closing.editorial-colophon"]
};

const currentVisualDirectionContracts = {
  "formal-finance": "institutional editorial rhythm",
  "consulting-evidence": "Swiss information hierarchy",
  "brand-launch": "cinematic image-first layout",
  "training-narrative": "editorial learning design",
  "editorial-narrative": "literary AI editorial",
  "swiss-information": "Swiss baseline systems"
};

function deckSessionFixture(count) {
  const roles = ["anchor", "context", "evidence", "comparison", "process", "benefit", "risk", "action"];
  const slides = Array.from({ length: count }, (_, index) => {
    const slideId = `P${String(index + 1).padStart(2, "0")}`;
    const role = index === count - 1 ? "closing" : roles[index % roles.length];
    const variants = fixtureLayouts[role].map((layoutFamily, variantIndex) => ({
      id: `${slideId}-V${variantIndex + 1}`,
      label: `方案 ${variantIndex + 1}`,
      layoutFamily
    }));
    return {
      slideId,
      page: slideId,
      role,
      title: index === 1 ? "用户修改后的第二页标题" : `用户故事板 ${slideId}`,
      takeaway: index === 1 ? "这条结论必须原样进入生产合同。" : `保留 ${slideId} 的一句话结论。`,
      evidenceState: "grounded",
      evidenceRefs: ["STALE-REF"],
      status: index === 1 ? "needs-review" : "ready",
      variants,
      selectedVariantId: index === 1 ? variants[1].id : variants[0].id
    };
  });
  return {
    schemaVersion: "deck-session-v6",
    sessionId: `deck-${count}`,
    phase: "generating",
    request: `基于已附资料生成 ${count} 页可编辑经营复盘 PPTX`,
    audience: "管理层",
    coreMessage: "收入增长，但毛利率仍需改善。",
    outputPurpose: "editable-pptx",
    sources: [{ id: "source-1", name: "source.md", kind: "file", status: "ready" }],
    slides,
    questions: [],
    selectedDirectionId: "consulting-evidence",
    progress: { percent: 20, message: "故事板已确认" },
    createdAt: "2026-07-15T00:00:00.000Z",
    updatedAt: "2026-07-15T00:00:00.000Z"
  };
}

function coreScenarioDeckSession(request, middleRoles) {
  const session = deckSessionFixture(9);
  session.request = request;
  session.slides = session.slides.map((slide, index) => {
    const role = index === 0 ? "anchor" : index === session.slides.length - 1 ? "closing" : middleRoles[index - 1];
    const variants = fixtureLayouts[role].map((layoutFamily, variantIndex) => ({
      id: `${slide.slideId}-V${variantIndex + 1}`,
      label: `方案 ${variantIndex + 1}`,
      layoutFamily
    }));
    return { ...slide, role, variants, selectedVariantId: variants[0].id };
  });
  return session;
}

function assertNoThreeConsecutiveContracts(slides) {
  for (const field of ["layoutFamily", "recipeId"]) {
    for (let index = 2; index < slides.length; index += 1) {
      assert.notEqual(
        slides[index][field] === slides[index - 1][field] && slides[index][field] === slides[index - 2][field],
        true,
        `${slides[index - 2].slideId}-${slides[index].slideId} repeat ${field} ${slides[index][field]}`
      );
    }
  }
}

function fastProjectBrief(extra = {}) {
  return {
    bestEffectBrief: {
      promptQuality: "complete",
      recommendedRoute: "formal-editable-pptx",
      decisionReason: "test-fixture",
      source: "user"
    },
    ...extra
  };
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
            size: 15,
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

test("handoff merges 4, 10, and 24 page DeckSessions without rewriting user storyboard choices", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-deck-session-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      for (const count of [4, 10, 24]) {
        const deckSession = deckSessionFixture(count);
        const response = await fetch(`${baseUrl}/handoff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form: {
              title: `DeckSession ${count}`,
              sourceNotes: deckSession.request,
              outputMode: "pptx",
              slideCount: String(count)
            },
            sourceMarkdown: [
              "# 经营资料",
              "本季度收入同比增长 18%。",
              "毛利率较上季度下降 2 个百分点。",
              "## Storyboard",
              "- P02 | 这是网页生成的故事板摘要，不应当作来源证据。",
              "## 行动边界",
              "下一季度优先改善高成本渠道的转化效率。"
            ].join("\n"),
            projectBrief: { title: `DeckSession ${count}`, deckSession }
          })
        });
        assert.equal(response.status, 200);
        const payload = await response.json();
        const storyboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
        const sourceMap = JSON.parse(await readFile(join(payload.projectPath, "source-map.json"), "utf8"));
        const brief = JSON.parse(await readFile(join(payload.projectPath, "project-brief.json"), "utf8"));
        assert.deepEqual(payload.storyboard, storyboard, "handoff response must expose the authoritative evidence reconciliation contract");
        assert.deepEqual(payload.sourceMap, sourceMap);
        assert.equal(storyboard.planningMode, "deck-session-merge");
        assert.equal(storyboard.slides.length, count);
        assert.deepEqual(storyboard.slides.map((slide) => slide.slideId), deckSession.slides.map((slide) => slide.slideId));
        assert.equal(storyboard.slides[1].title, deckSession.slides[1].title);
        assert.equal(storyboard.slides[1].takeaway, deckSession.slides[1].takeaway);
        assert.equal(storyboard.slides[1].role, deckSession.slides[1].role);
        assert.equal(storyboard.slides[1].selectedVariantId, deckSession.slides[1].selectedVariantId);
        assert.equal(storyboard.slides[1].variantLayoutFamily, "context.vertical-timeline");
        assert.equal(storyboard.slides[1].layoutFamily, "timeline");
        assert.equal(storyboard.slides[1].recipeId, "timeline.vertical_kpi");
        assert.ok(storyboard.slides.every((slide) => slide.evidenceRefs.length > 0));
        const claimIds = new Set(sourceMap.claims.map((claim) => claim.id));
        assert.ok(storyboard.slides.every((slide) => slide.evidenceRefs.every((id) => claimIds.has(id))));
        assert.ok(!sourceMap.claims.some((claim) => claim.text.includes("不应当作来源证据")));
        assert.equal(brief.bestEffectBrief.promptQuality, "complete");
        assert.equal(brief.bestEffectBrief.recommendedRoute, "formal-editable-pptx");
        assert.match(brief.bestEffectBrief.decisionReason, /output-mode=pptx/);
        assert.equal(brief.bestEffectBrief.source, "auto");
      }
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("handoff preserves an explicitly reordered P02 contract field by field in DeckIR", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-reordered-p02-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const deckSession = deckSessionFixture(4);
      const p02 = deckSession.slides.find((slide) => slide.slideId === "P02");
      p02.title = "用户重排后的 P02 标题";
      p02.takeaway = "重排不得改写这条结论。";
      p02.role = "context";
      p02.selectedVariantId = "P02-V2";
      deckSession.slides = [deckSession.slides[0], deckSession.slides[2], p02, deckSession.slides[3]];

      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Reordered P02", outputMode: "pptx" },
          sourceMarkdown: "# 核验资料\n\n这份资料只用于验证重排后的生产合同。",
          projectBrief: fastProjectBrief({ deckSession })
        })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      const storyboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
      const brief = JSON.parse(await readFile(join(payload.projectPath, "project-brief.json"), "utf8"));
      const manifest = JSON.parse(await readFile(join(payload.projectPath, "manifest.json"), "utf8"));

      const expectedOrder = ["P01", "P03", "P02", "P04"];
      assert.equal(storyboard.deckIRVersion, "1.0");
      assert.equal(brief.deckIR.storyboard, "storyboard.json");
      assert.deepEqual(storyboard.slides.map((slide) => slide.slideId), expectedOrder);
      assert.deepEqual(manifest.deckSession.slides.map((slide) => slide.slideId), expectedOrder);

      const producedP02 = storyboard.slides[2];
      assert.equal(producedP02.slideId, p02.slideId);
      assert.equal(producedP02.title, p02.title);
      assert.equal(producedP02.takeaway, p02.takeaway);
      assert.equal(producedP02.role, p02.role);
      assert.equal(producedP02.selectedVariantId, p02.selectedVariantId);
      assert.deepEqual(producedP02.selectedVariant, {
        id: p02.variants[1].id,
        label: p02.variants[1].label,
        layoutFamily: p02.variants[1].layoutFamily
      });
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("every current DeckSession visual direction becomes the Bridge referenceStyle and DeckIR direction", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-directions-"));
  try {
    const directionManifest = JSON.parse(await readFile(join(process.cwd(), "templates", "visual-directions", "v6-direction-manifest.json"), "utf8"));
    assert.deepEqual(
      Object.keys(currentVisualDirectionContracts).sort(),
      directionManifest.directions.map((direction) => direction.id).sort(),
      "Bridge visual-direction contracts must cover every current v6 direction"
    );
    await withServer({ outputDir }, async (baseUrl) => {
      for (const [selectedDirectionId, expectedReference] of Object.entries(currentVisualDirectionContracts)) {
        const deckSession = deckSessionFixture(4);
        deckSession.selectedDirectionId = selectedDirectionId;
        const response = await fetch(`${baseUrl}/handoff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form: { title: `Direction ${selectedDirectionId}`, outputMode: "pptx" },
            sourceMarkdown: "# 资料\n\n这是一份已经核验的方向合同测试资料。",
            deckSession,
            projectBrief: fastProjectBrief({
              deckSession,
              referenceStyle: {
                selectedDirection: "financial-steady",
                positiveReferences: ["stale default"],
                negativeReferences: [],
                styleConstraints: []
              }
            })
          })
        });
        assert.equal(response.status, 200);
        const payload = await response.json();
        const brief = JSON.parse(await readFile(join(payload.projectPath, "project-brief.json"), "utf8"));
        const manifest = JSON.parse(await readFile(join(payload.projectPath, "manifest.json"), "utf8"));
        const storyboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
        const planningReport = JSON.parse(await readFile(join(payload.projectPath, "planning-report.json"), "utf8"));
        for (const contract of [brief, manifest, storyboard]) {
          assert.equal(contract.selectedDirectionId, selectedDirectionId);
          assert.equal(contract.referenceStyle.selectedDirection, selectedDirectionId);
          assert.equal(contract.referenceStyle.positiveReferences[0], expectedReference);
          assert.ok(contract.referenceStyle.negativeReferences.length > 0);
          assert.ok(contract.referenceStyle.styleConstraints.length > 0);
        }
        assert.equal(brief.deckIR.selectedDirectionId, selectedDirectionId);
        assert.equal(brief.deckIR.referenceStyle.selectedDirection, selectedDirectionId);
        assert.equal(manifest.deckIR.selectedDirectionId, selectedDirectionId);
        assert.equal(manifest.deckIR.referenceStyle.selectedDirection, selectedDirectionId);
        assert.equal(brief.taskContext.selectedDirectionId, selectedDirectionId);
        assert.equal(planningReport.summary.selectedDirectionId, selectedDirectionId);
      }
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("conflicting visual direction inputs are rejected before a project is created", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-direction-conflict-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const deckSession = deckSessionFixture(4);
      deckSession.selectedDirectionId = "formal-finance";
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Conflicting directions", outputMode: "pptx" },
          sourceMarkdown: "# Verified source\n\nDirection conflict fixture.",
          taskContext: { selectedDirectionId: "brand-launch" },
          deckSession,
          projectBrief: fastProjectBrief({ deckSession })
        })
      });
      assert.equal(response.status, 400);
      assert.match((await response.json()).message, /Conflicting selectedDirectionId/);
      assert.deepEqual(await readdir(outputDir), []);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("a new handoff without an explicit direction uses the registered formal-finance default", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-direction-default-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Default direction", outputMode: "pptx" },
          sourceMarkdown: "# Verified source\n\nDefault direction fixture."
        })
      });
      assert.equal(response.status, 200);
      const project = await response.json();
      const brief = JSON.parse(await readFile(join(project.projectPath, "project-brief.json"), "utf8"));
      assert.equal(project.manifest.selectedDirectionId, "formal-finance");
      assert.equal(project.manifest.referenceStyle.selectedDirection, "formal-finance");
      assert.equal(brief.taskContext.selectedDirectionId, "formal-finance");
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("legacy referenceStyle directions migrate and unknown referenceStyle directions are rejected", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-legacy-direction-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const accepted = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Legacy direction migration", outputMode: "pptx" },
          sourceMarkdown: "# Verified source\n\nLegacy direction migration fixture.",
          projectBrief: {
            referenceStyle: {
              selectedDirection: "financial-steady",
              positiveReferences: ["unregistered legacy content"],
              negativeReferences: [],
              styleConstraints: []
            }
          }
        })
      });
      assert.equal(accepted.status, 200);
      const project = await accepted.json();
      const brief = JSON.parse(await readFile(join(project.projectPath, "project-brief.json"), "utf8"));
      assert.equal(project.manifest.selectedDirectionId, "formal-finance");
      assert.equal(project.manifest.referenceStyle.selectedDirection, "formal-finance");
      assert.equal(project.manifest.referenceStyle.positiveReferences[0], "institutional editorial rhythm");
      assert.equal(brief.taskContext.selectedDirectionId, "formal-finance");
      assert.equal(brief.referenceStyle.selectedDirection, "formal-finance");

      const projectsBeforeRejection = await readdir(outputDir);
      const rejected = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Unknown direction", outputMode: "pptx" },
          sourceMarkdown: "# Verified source\n\nUnknown direction fixture.",
          projectBrief: { referenceStyle: { selectedDirection: "arbitrary-custom-direction" } }
        })
      });
      assert.equal(rejected.status, 400);
      assert.match((await rejected.json()).message, /Unknown selectedDirectionId/);
      assert.deepEqual(await readdir(outputDir), projectsBeforeRejection);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("the three core scenario DeckSessions pass the executable layout diversity gate", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-core-scenarios-"));
  const scenarios = [
    ["基于资料制作 9 页经营复盘 PPTX", ["context", "evidence", "comparison", "evidence", "comparison", "action", "evidence"]],
    ["基于资料制作 9 页咨询方案 PPTX", ["context", "comparison", "evidence", "comparison", "action", "evidence", "action"]],
    ["基于资料制作 9 页产品发布 PPTX", ["context", "evidence", "comparison", "evidence", "action", "context", "comparison"]]
  ];
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      for (const [request, roles] of scenarios) {
        const deckSession = coreScenarioDeckSession(request, roles);
        const response = await fetch(`${baseUrl}/handoff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form: { title: request, outputMode: "pptx" },
            sourceMarkdown: "# 核验资料\n\n经营事实、方案依据和产品边界均来自这份本地资料。",
            projectBrief: fastProjectBrief({ deckSession })
          })
        });
        assert.equal(response.status, 200);
        const payload = await response.json();
        const storyboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
        assert.equal(storyboard.slides.length, 9);
        assertNoThreeConsecutiveContracts(storyboard.slides);
      }
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("fallback DeckIR deterministically breaks three repeated evidence recipes", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-fallback-diversity-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Fallback diversity", outputMode: "pptx" },
          sourceMarkdown: [
            "# 核验资料",
            "第一条常规事实。",
            "第二条常规事实。",
            "第三条常规事实。",
            "第四条常规事实。",
            "第五条常规事实。",
            "第六条常规事实。",
            "第七条常规事实。",
            "第八条常规事实。"
          ].join("\n"),
          projectBrief: fastProjectBrief()
        })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      const storyboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
      assert.equal(storyboard.planningMode, "fallback-rule-planner");
      assertNoThreeConsecutiveContracts(storyboard.slides);
      assert.ok(new Set(storyboard.slides.filter((slide) => slide.role === "evidence").map((slide) => slide.layoutFamily)).size > 1);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("external DeckSession with three repeated layout and recipe contracts is rejected", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-external-diversity-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const deckSession = deckSessionFixture(6);
      for (const slide of deckSession.slides.slice(1, 4)) {
        slide.role = "evidence";
        slide.variants = fixtureLayouts.evidence.map((layoutFamily, index) => ({
          id: `${slide.slideId}-V${index + 1}`,
          label: `方案 ${index + 1}`,
          layoutFamily
        }));
        slide.selectedVariantId = slide.variants[0].id;
      }
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Invalid external DeckSession", outputMode: "pptx" },
          sourceMarkdown: "# 核验资料\n\n外部故事板必须通过结构多样性门禁。",
          deckSession,
          projectBrief: fastProjectBrief({ deckSession })
        })
      });
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.match(body.message, /layout-diversity gate/i);
      assert.match(body.message, /layoutFamily/);
      assert.match(body.message, /recipeId/);
      assert.equal((await readdir(outputDir)).filter((name) => !name.startsWith(".")).length, 0);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("DeckSession without source material keeps evidence missing instead of inventing claims", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-no-source-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const deckSession = deckSessionFixture(4);
      deckSession.sources = [];
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: { title: "No Source Deck", outputMode: "pptx" }, projectBrief: { deckSession } })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      const storyboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
      const sourceMap = JSON.parse(await readFile(join(payload.projectPath, "source-map.json"), "utf8"));
      assert.equal(sourceMap.claims.length, 0);
      assert.ok(storyboard.slides.every((slide) => slide.evidenceState === "missing" && slide.evidenceRefs.length === 0));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
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

test("concurrent handoffs install only a complete regular attachment cache entry", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-cache-concurrency-"));
  const attachmentText = "# Concurrent source\n\nEvery handoff must receive this complete verified source.";
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const responses = await Promise.all(Array.from({ length: 24 }, (_, index) => fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: `cache-concurrency-${index}`,
          form: {
            title: "Concurrent Cache",
            audience: "Management",
            coreMessage: "Use the complete source."
          },
          projectBrief: fastProjectBrief(),
          attachments: [{
            id: `source-${index}`,
            name: "source.md",
            type: "text/markdown",
            size: Buffer.byteLength(attachmentText),
            text: attachmentText
          }]
        })
      })));
      assert.ok(responses.every((response) => response.status === 200));
      const projects = await Promise.all(responses.map((response) => response.json()));
      await Promise.all(projects.map(async (project) => {
        const brief = JSON.parse(await readFile(join(project.projectPath, "project-brief.json"), "utf8"));
        assert.equal(brief.expectationFit.readyForProduction, true);
        assert.equal(brief.evidenceSources[0].verified, true);
        assert.ok(["textExtracted", "cacheHit"].includes(project.manifest.attachments[0].parseStatus));
        assert.match(await readFile(join(project.projectPath, "extracted-source.md"), "utf8"), /Every handoff must receive this complete verified source/);
      }));

      const contentHash = sha256(attachmentText);
      const cachePath = join(outputDir, ".cache", "attachments", `${contentHash}.json`);
      const stats = await lstat(cachePath);
      assert.equal(stats.isFile(), true);
      assert.equal(stats.isSymbolicLink(), false);
      assert.equal(stats.nlink, 1);
      const cacheEntry = JSON.parse(await readFile(cachePath, "utf8"));
      assert.equal(cacheEntry.schemaVersion, "bridge-attachment-cache-v1");
      assert.equal(cacheEntry.contentHash, contentHash);
      assert.equal(cacheEntry.markdown, attachmentText);
      assert.match(cacheEntry.signature, /^[0-9a-f]{64}$/i);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("a poisoned attachment cache symlink is ignored and never becomes verified evidence", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-cache-poison-"));
  const outsideDir = await mkdtemp(join(tmpdir(), "upm-bridge-cache-secret-"));
  const attachmentBytes = Buffer.from("UNSUPPORTED-BINARY-SOURCE");
  try {
    const cacheDir = join(outputDir, ".cache", "attachments");
    await mkdir(cacheDir, { recursive: true });
    const outsideSecret = join(outsideDir, "secret.md");
    await writeFile(outsideSecret, "# Secret\n\nThis must never become Bridge evidence.");
    await symlink(outsideSecret, join(cacheDir, `${sha256(attachmentBytes)}.json`));

    await withServer({ outputDir }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: {
            title: "Poisoned Cache",
            audience: "Management",
            coreMessage: "Do not trust an unsafe cache."
          },
          projectBrief: fastProjectBrief(),
          attachments: [{
            id: "binary-source",
            name: "source.bin",
            type: "application/octet-stream",
            size: attachmentBytes.length,
            dataBase64: attachmentBytes.toString("base64")
          }]
        })
      });
      assert.equal(response.status, 200);
      const project = await response.json();
      const brief = JSON.parse(await readFile(join(project.projectPath, "project-brief.json"), "utf8"));
      const extracted = await readFile(join(project.projectPath, "extracted-source.md"), "utf8");
      assert.equal(project.manifest.attachments[0].parseStatus, "attachedOnly");
      assert.equal(project.manifest.attachments[0].ingestion, "pending");
      assert.equal(brief.expectationFit.readyForProduction, false);
      assert.equal(brief.evidenceSources[0].verified, false);
      assert.equal(extracted.includes("This must never become Bridge evidence"), false);
      assert.equal((await lstat(join(cacheDir, `${sha256(attachmentBytes)}.json`))).isSymbolicLink(), true);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(outsideDir, { recursive: true, force: true });
  }
});

test("an unauthenticated regular attachment cache entry is ignored", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-cache-forgery-"));
  const attachmentBytes = Buffer.from("UNSUPPORTED-CACHED-BINARY");
  try {
    const contentHash = sha256(attachmentBytes);
    const cacheDir = join(outputDir, ".cache", "attachments");
    await mkdir(cacheDir, { recursive: true });
    await writeFile(join(cacheDir, `${contentHash}.json`), JSON.stringify({
      schemaVersion: "bridge-attachment-cache-v1",
      contentHash,
      markdown: "# Forged evidence\n\nThis cache entry was not signed by the Bridge.",
      signature: "0".repeat(64)
    }));

    await withServer({ outputDir }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: {
            title: "Forged Cache",
            audience: "Management",
            coreMessage: "Do not trust unsigned cache evidence."
          },
          projectBrief: fastProjectBrief(),
          attachments: [{
            id: "binary-source",
            name: "source.bin",
            type: "application/octet-stream",
            size: attachmentBytes.length,
            dataBase64: attachmentBytes.toString("base64")
          }]
        })
      });
      assert.equal(response.status, 200);
      const project = await response.json();
      const brief = JSON.parse(await readFile(join(project.projectPath, "project-brief.json"), "utf8"));
      const extracted = await readFile(join(project.projectPath, "extracted-source.md"), "utf8");
      assert.equal(project.manifest.attachments[0].parseStatus, "attachedOnly");
      assert.equal(brief.expectationFit.readyForProduction, false);
      assert.equal(brief.evidenceSources[0].verified, false);
      assert.equal(extracted.includes("This cache entry was not signed by the Bridge"), false);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("an attachment cache directory symlink cannot redirect Bridge writes outside outputDir", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-cache-dir-symlink-"));
  const outsideDir = await mkdtemp(join(tmpdir(), "upm-bridge-cache-dir-outside-"));
  try {
    await mkdir(join(outputDir, ".cache"), { recursive: true });
    await symlink(outsideDir, join(outputDir, ".cache", "attachments"));
    await withServer({ outputDir }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Cache Directory Escape" },
          projectBrief: fastProjectBrief(),
          attachments: [{ name: "source.md", text: "# Source\n\nDo not write outside outputDir." }]
        })
      });
      assert.equal(response.status, 500);
      assert.match((await response.json()).message, /cache must be a real directory/i);
      assert.deepEqual(await readdir(outsideDir), []);
      assert.deepEqual((await readdir(outputDir)).filter((name) => !name.startsWith(".")), []);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(outsideDir, { recursive: true, force: true });
  }
});

test("slide regeneration appends immutable, traceable revision requests", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-slide-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const deckSession = deckSessionFixture(4);
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Slide Revision Deck" },
          projectBrief: fastProjectBrief({ title: "Slide Revision Deck", deckSession })
        })
      });
      const handoffPayload = await handoff.json();
      const variantId = deckSession.slides[1].variants[1].id;
      const revision = await fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: handoffPayload.projectPath, slideId: "P02", variantId, instruction: "Use the comparison variant." })
      });
      assert.equal(revision.status, 200);
      const revisionPayload = await revision.json();
      assert.equal(revisionPayload.slideId, "P02");
      const saved = JSON.parse(await readFile(revisionPayload.requestPath, "utf8"));
      assert.equal(saved.revisionId, revisionPayload.revisionId);
      assert.equal(saved.variantId, variantId);
      assert.equal(saved.status, "pending");
      assert.equal(saved.storyboardSnapshot.title, deckSession.slides[1].title);

      const secondRevision = await fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: handoffPayload.projectPath, slideId: "P02", variantId, instruction: "Keep the history and try a denser comparison." })
      });
      assert.equal(secondRevision.status, 200);
      const secondPayload = await secondRevision.json();
      assert.notEqual(secondPayload.revisionId, revisionPayload.revisionId);
      assert.notEqual(secondPayload.requestPath, revisionPayload.requestPath);
      assert.equal(JSON.parse(await readFile(revisionPayload.requestPath, "utf8")).instruction, "Use the comparison variant.");
      assert.equal(JSON.parse(await readFile(secondPayload.requestPath, "utf8")).instruction, "Keep the history and try a denser comparison.");

      const concurrentInstructions = Array.from({ length: 24 }, (_, index) => `Concurrent immutable revision ${index}.`);
      const concurrentResponses = await Promise.all(concurrentInstructions.map((instruction) => fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: handoffPayload.projectPath, slideId: "P02", variantId, instruction })
      })));
      assert.ok(concurrentResponses.every((response) => response.status === 200));
      const concurrentPayloads = await Promise.all(concurrentResponses.map((response) => response.json()));
      assert.equal(new Set(concurrentPayloads.map((payload) => payload.requestPath)).size, concurrentInstructions.length);
      await Promise.all(concurrentPayloads.map(async (payload, index) => {
        assert.equal(JSON.parse(await readFile(payload.requestPath, "utf8")).instruction, concurrentInstructions[index]);
      }));
      assert.equal(JSON.parse(await readFile(revisionPayload.requestPath, "utf8")).instruction, "Use the comparison variant.");

      const history = await readdir(join(handoffPayload.projectPath, "revision-requests"));
      assert.equal(history.length, 2 + concurrentInstructions.length);
      assert.ok(history.every((name) => /^P02-\d{17}-[0-9a-f]{8}\.json$/.test(name)), history.join(", "));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("slide regeneration rejects a slideId outside the project storyboard", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-slide-id-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const deckSession = deckSessionFixture(4);
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectBrief: fastProjectBrief({ title: "Known Slides", deckSession }) })
      });
      const { projectPath } = await handoff.json();
      const revision = await fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, slideId: "P99", variantId: "P99-V1" })
      });
      assert.equal(revision.status, 400);
      assert.match((await revision.json()).message, /does not exist/i);
      await assert.rejects(access(join(projectPath, "revision-requests", "P99.json")));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("slide regeneration requires a variant that belongs to a modern storyboard slide", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-slide-variant-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const deckSession = deckSessionFixture(4);
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectBrief: fastProjectBrief({ title: "Known Variants", deckSession }) })
      });
      const { projectPath } = await handoff.json();
      const unknownVariant = await fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, slideId: "P02", variantId: "P02-NOT-REAL" })
      });
      assert.equal(unknownVariant.status, 400);
      assert.match((await unknownVariant.json()).message, /does not belong/i);

      const missingVariant = await fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, slideId: "P02", variantId: "" })
      });
      assert.equal(missingVariant.status, 400);
      assert.match((await missingVariant.json()).message, /variantId is required/i);
      await assert.rejects(access(join(projectPath, "revision-requests", "P02.json")));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("slide regeneration keeps legacy storyboards compatible only with an empty variantId", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-slide-legacy-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: { title: "Legacy Storyboard" } })
      });
      const { projectPath } = await handoff.json();
      await writeFile(join(projectPath, "storyboard.json"), JSON.stringify({
        schemaVersion: "legacy-storyboard-v1",
        slides: [{ slideId: "P01", title: "Legacy slide" }]
      }));

      const compatible = await fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, slideId: "P01" })
      });
      assert.equal(compatible.status, 200);
      const compatiblePayload = await compatible.json();
      const savedBeforeInvalidRequest = JSON.parse(await readFile(compatiblePayload.requestPath, "utf8"));
      assert.equal(savedBeforeInvalidRequest.variantId, "");

      const incompatible = await fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, slideId: "P01", variantId: "legacy-v1" })
      });
      assert.equal(incompatible.status, 400);
      assert.match((await incompatible.json()).message, /legacy storyboard/i);
      const savedAfterInvalidRequest = JSON.parse(await readFile(compatiblePayload.requestPath, "utf8"));
      assert.equal(savedAfterInvalidRequest.variantId, "");
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
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
    assert.deepEqual(report.artifacts, []);
    assert.deepEqual(report.artifactBinding.requiredFields, ["relativePath", "sha256", "size"]);
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

test("artifact endpoints list and download only allowlisted handoff outputs", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-artifacts-"));
  const outsideDir = await mkdtemp(join(tmpdir(), "upm-bridge-outside-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: {
            title: "Artifact Deck",
            audience: "Executive reviewers",
            coreMessage: "The verified source supports this editable delivery."
          },
          sourceMarkdown: "# Source\n\nVerified source."
        })
      });
      const handoffPayload = await handoff.json();
      const projectPath = handoffPayload.projectPath;
      assert.equal(handoffPayload.manifest.expectationFit.readyForProduction, true);
      assert.notEqual(handoffPayload.manifest.expectationFit.sourceAdequacy, "no-source");
      await mkdir(join(projectPath, "exports"), { recursive: true });
      await mkdir(join(projectPath, "ppt"), { recursive: true });
      await writeFile(join(projectPath, "exports", "final.pptx"), "PPTX-BYTES");
      await writeFile(join(projectPath, "exports", "review.pdf"), "PDF-BYTES");
      await writeFile(join(projectPath, "ppt", "index.html"), "<!doctype html><title>Deck</title>");
      await writeFile(join(projectPath, "pptlint-report.md"), "# PPTLint report\n\nPassed.");
      await writeFile(join(projectPath, "native-object-report.json"), JSON.stringify({ status: "passed" }));
      await writeFile(join(projectPath, "attachments", "secret.txt"), "SECRET");
      const report = JSON.parse(await readFile(join(projectPath, "quality-report.json"), "utf8"));
      report.status = "passed";
      report.artifacts = [
        { relativePath: "exports/final.pptx", sha256: sha256("PPTX-BYTES"), size: Buffer.byteLength("PPTX-BYTES") },
        { relativePath: "exports/review.pdf", sha256: sha256("PDF-BYTES"), size: Buffer.byteLength("PDF-BYTES") },
        { relativePath: "ppt/index.html", sha256: sha256("<!doctype html><title>Deck</title>"), size: Buffer.byteLength("<!doctype html><title>Deck</title>") }
      ];
      await writeFile(join(projectPath, "quality-report.json"), JSON.stringify(report));
      const outsideFile = join(outsideDir, "outside.pptx");
      await writeFile(outsideFile, "OUTSIDE");
      await symlink(outsideFile, join(projectPath, "exports", "leak.pptx"));

      const listResponse = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(projectPath)}`);
      assert.equal(listResponse.status, 200);
      const listed = await listResponse.json();
      assert.deepEqual(
        listed.artifacts.map((artifact) => artifact.relativePath),
        [
          "exports/final.pptx",
          "exports/review.pdf",
          "native-object-report.json",
          "ppt/index.html",
          "pptlint-report.md",
          "quality-report.json"
        ]
      );
      assert.ok(listed.artifacts.every((artifact) => artifact.verification === "passed"));
      assert.equal(listed.artifacts.find((artifact) => artifact.relativePath === "exports/final.pptx")?.sha256, sha256("PPTX-BYTES"));
      assert.ok(!JSON.stringify(listed).includes("attachments"));
      assert.ok(!JSON.stringify(listed).includes("source.md"));
      assert.ok(!JSON.stringify(listed).includes("leak.pptx"));

      const download = await fetch(`${baseUrl}/projects/artifacts/file?projectPath=${encodeURIComponent(projectPath)}&artifact=${encodeURIComponent("exports/final.pptx")}`);
      assert.equal(download.status, 200);
      assert.equal(await download.text(), "PPTX-BYTES");
      assert.match(download.headers.get("content-disposition") || "", /attachment/);
      assert.match(download.headers.get("content-type") || "", /presentationml/);

      const webDeckDownload = await fetch(`${baseUrl}/projects/artifacts/file?projectPath=${encodeURIComponent(projectPath)}&artifact=${encodeURIComponent("ppt/index.html")}`);
      assert.equal(webDeckDownload.status, 200);
      assert.equal(await webDeckDownload.text(), "<!doctype html><title>Deck</title>");
      assert.match(webDeckDownload.headers.get("content-disposition") || "", /attachment/);
      assert.match(webDeckDownload.headers.get("content-type") || "", /text\/html/);

      const sourceAttempt = await fetch(`${baseUrl}/projects/artifacts/file?projectPath=${encodeURIComponent(projectPath)}&artifact=${encodeURIComponent("source.md")}`);
      assert.equal(sourceAttempt.status, 404);
      const traversalAttempt = await fetch(`${baseUrl}/projects/artifacts/file?projectPath=${encodeURIComponent(projectPath)}&artifact=${encodeURIComponent("../source.md")}`);
      assert.equal(traversalAttempt.status, 400);
      const symlinkAttempt = await fetch(`${baseUrl}/projects/artifacts/file?projectPath=${encodeURIComponent(projectPath)}&artifact=${encodeURIComponent("exports/leak.pptx")}`);
      assert.equal(symlinkAttempt.status, 404);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(outsideDir, { recursive: true, force: true });
  }
});

test("artifact discovery rejects zero-byte, temporary, too-deep, and freshly changing candidates", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-artifact-stability-"));
  let projectPath;
  try {
    await withServer({
      outputDir,
      artifactStableAgeMs: 0,
      maxArtifactScanDepth: 2,
      maxArtifactScanEntries: 64
    }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMarkdown: "# Verified source\n\nArtifact filtering evidence.",
          projectBrief: fastProjectBrief({ title: "Artifact Filtering" })
        })
      });
      ({ projectPath } = await handoff.json());
      await mkdir(join(projectPath, "exports", "level-one", "level-two"), { recursive: true });
      await writeFile(join(projectPath, "exports", "stable.pptx"), "STABLE");
      await writeFile(join(projectPath, "exports", "zero.pptx"), "");
      await writeFile(join(projectPath, "exports", "deck.partial.pptx"), "PARTIAL");
      await writeFile(join(projectPath, "exports", "deck.tmp.pptx"), "TEMPORARY");
      await writeFile(join(projectPath, "exports", ".hidden.pptx"), "HIDDEN");
      await writeFile(join(projectPath, "exports", "level-one", "level-two", "too-deep.pptx"), "DEEP");

      const response = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(projectPath)}`);
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.deepEqual(
        payload.artifacts.filter((artifact) => artifact.kind !== "report").map((artifact) => artifact.relativePath),
        ["exports/stable.pptx"]
      );
    });

    await withServer({ outputDir, artifactStableAgeMs: 60_000 }, async (baseUrl) => {
      await writeFile(join(projectPath, "exports", "still-writing.pptx"), "NEW-BYTES");
      const response = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(projectPath)}`);
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.artifacts.some((artifact) => artifact.relativePath === "exports/still-writing.pptx"), false);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("artifact scan entry limits cap discovery work", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-artifact-cap-"));
  try {
    await withServer({ outputDir, maxArtifactScanEntries: 3 }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMarkdown: "# Verified source\n\nBounded artifact scan.",
          projectBrief: fastProjectBrief({ title: "Artifact Cap" })
        })
      });
      const { projectPath } = await handoff.json();
      await mkdir(join(projectPath, "exports"), { recursive: true });
      await Promise.all(Array.from({ length: 12 }, (_, index) => (
        writeFile(join(projectPath, "exports", `artifact-${String(index).padStart(2, "0")}.pptx`), `artifact-${index}`)
      )));
      const response = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(projectPath)}`);
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.ok(payload.artifacts.filter((artifact) => artifact.kind !== "report").length <= 3);
      assert.equal(payload.scan.maxEntries, 3);
      assert.equal(payload.scan.truncated, true);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("a passed quality report verifies only the exact artifact path and sha256", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-artifact-binding-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: {
            title: "Artifact Binding",
            audience: "Executive reviewers",
            coreMessage: "The quality credential must follow the exact final file digest."
          },
          sourceMarkdown: "# Verified source\n\nThe approved evidence supports a real editable deliverable and requires each final artifact to retain its own path and SHA-256 quality credential.",
          projectBrief: fastProjectBrief({ title: "Artifact Binding" })
        })
      });
      const { projectPath } = await handoff.json();
      const artifactPath = join(projectPath, "exports", "final.pptx");
      await mkdir(dirname(artifactPath), { recursive: true });
      await writeFile(artifactPath, "VERSION-ONE");
      const reportPath = join(projectPath, "quality-report.json");
      const report = JSON.parse(await readFile(reportPath, "utf8"));
      report.status = "passed";
      report.artifact = {
        relativePath: "exports/final.pptx",
        sha256: sha256("VERSION-ONE"),
        size: Buffer.byteLength("VERSION-ONE")
      };
      await writeFile(reportPath, JSON.stringify(report));

      let listed = await (await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(projectPath)}`)).json();
      assert.equal(listed.artifacts.find((artifact) => artifact.relativePath === "exports/final.pptx")?.verification, "passed");

      await writeFile(artifactPath, "VERSION-TWO");
      await writeFile(join(projectPath, "exports", "new-file.pptx"), "NEW-FILE");
      listed = await (await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(projectPath)}`)).json();
      assert.equal(listed.artifacts.find((artifact) => artifact.relativePath === "exports/final.pptx")?.verification, "pending");
      assert.equal(listed.artifacts.find((artifact) => artifact.relativePath === "exports/new-file.pptx")?.verification, "pending");

      report.artifact = {
        relativePath: "exports/final.pptx",
        sha256: sha256("VERSION-TWO"),
        size: Buffer.byteLength("VERSION-TWO")
      };
      await writeFile(reportPath, JSON.stringify(report));
      listed = await (await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(projectPath)}`)).json();
      assert.equal(listed.artifacts.find((artifact) => artifact.relativePath === "exports/final.pptx")?.verification, "passed");
      assert.equal(listed.artifacts.find((artifact) => artifact.relativePath === "exports/new-file.pptx")?.verification, "pending");
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("artifact verification stays blocked when a passed report has no production-ready evidence", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-artifacts-blocked-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: {
            title: "Unsupported Artifact Deck",
            audience: "Executive reviewers",
            coreMessage: "A task statement is not factual evidence."
          }
        })
      });
      const handoffPayload = await handoff.json();
      const projectPath = handoffPayload.projectPath;
      assert.equal(handoffPayload.manifest.expectationFit.readyForProduction, false);
      assert.equal(handoffPayload.manifest.expectationFit.sourceAdequacy, "no-source");

      await mkdir(join(projectPath, "exports"), { recursive: true });
      await writeFile(join(projectPath, "exports", "unsupported.pptx"), "PPTX-BYTES");
      const report = JSON.parse(await readFile(join(projectPath, "quality-report.json"), "utf8"));
      report.status = "passed";
      await writeFile(join(projectPath, "quality-report.json"), JSON.stringify(report));

      const response = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(projectPath)}`);
      assert.equal(response.status, 200);
      const payload = await response.json();
      const pptx = payload.artifacts.find((artifact) => artifact.relativePath === "exports/unsupported.pptx");
      assert.equal(pptx?.verification, "blocked");
      assert.ok(payload.artifacts.every((artifact) => artifact.verification === "blocked"));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("artifact and launch endpoints reject empty, mismatched, and unsigned forged manifests", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-forged-manifest-"));
  const forgedPath = join(outputDir, "forged-handoff");
  try {
    await mkdir(join(forgedPath, "exports"), { recursive: true });
    await writeFile(join(forgedPath, "manifest.json"), "{}", "utf8");
    await writeFile(join(forgedPath, "exports", "fake.pptx"), "NOT-A-BRIDGE-ARTIFACT");

    await withServer({ allowLaunch: false, outputDir }, async (baseUrl) => {
      const listResponse = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(forgedPath)}`);
      assert.equal(listResponse.status, 400);
      assert.match((await listResponse.json()).message, /stable Bridge handoff fields/);

      const downloadResponse = await fetch(
        `${baseUrl}/projects/artifacts/file?projectPath=${encodeURIComponent(forgedPath)}&artifact=${encodeURIComponent("exports/fake.pptx")}`
      );
      assert.equal(downloadResponse.status, 400);
      assert.match((await downloadResponse.json()).message, /stable Bridge handoff fields/);

      const launchResponse = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: forgedPath, agent: "codex" })
      });
      assert.equal(launchResponse.status, 400);
      assert.match((await launchResponse.json()).message, /stable Bridge handoff fields/);

      await writeFile(
        join(forgedPath, "manifest.json"),
        JSON.stringify({
          version: "2.2.0",
          createdAt: "2026-07-15T00:00:00.000Z",
          title: "Plausible but mismatched handoff",
          projectPath: outputDir,
          repoRoot: resolve("."),
          attachments: [],
          suggestedCommands: { codex: "codex" }
        }),
        "utf8"
      );
      const mismatchedClaim = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(forgedPath)}`);
      assert.equal(mismatchedClaim.status, 400);
      assert.match((await mismatchedClaim.json()).message, /does not match this handoff directory/);

      await writeFile(
        join(forgedPath, "manifest.json"),
        JSON.stringify({
          version: "6.3.1",
          createdAt: "2026-07-15T00:00:00.000Z",
          sessionId: "forged-session",
          title: "Plausible unsigned handoff",
          projectPath: forgedPath,
          repoRoot: resolve("."),
          attachments: [],
          suggestedCommands: { codex: "codex" }
        }),
        "utf8"
      );

      const unsignedList = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(forgedPath)}`);
      assert.equal(unsignedList.status, 400);
      assert.match((await unsignedList.json()).message, /authenticity signature/);

      const unsignedDownload = await fetch(
        `${baseUrl}/projects/artifacts/file?projectPath=${encodeURIComponent(forgedPath)}&artifact=${encodeURIComponent("exports/fake.pptx")}`
      );
      assert.equal(unsignedDownload.status, 400);
      assert.match((await unsignedDownload.json()).message, /authenticity signature/);

      const unsignedLaunch = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: forgedPath, agent: "codex" })
      });
      assert.equal(unsignedLaunch.status, 400);
      assert.match((await unsignedLaunch.json()).message, /authenticity signature/);

      const unsignedStatus = await fetch(`${baseUrl}/agent/status?projectPath=${encodeURIComponent(forgedPath)}`);
      assert.equal(unsignedStatus.status, 400);
      assert.match((await unsignedStatus.json()).message, /authenticity signature/);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("tampering with a signed manifest blocks artifact list, download, and Agent launch", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-tampered-manifest-"));
  try {
    await withServer({ allowLaunch: false, outputDir }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "tamper-test",
          form: { title: "Authentic Deck" },
          sourceMarkdown: "A verified source for the signed handoff.",
          projectBrief: fastProjectBrief()
        })
      });
      assert.equal(handoff.status, 200);
      const project = await handoff.json();
      await mkdir(join(project.projectPath, "exports"), { recursive: true });
      await writeFile(join(project.projectPath, "exports", "authentic.pptx"), "PPTX-BYTES");

      const manifestPath = join(project.projectPath, "manifest.json");
      const originalManifest = JSON.parse(await readFile(manifestPath, "utf8"));
      assert.equal(originalManifest.integrity.scheme, "upm-bridge-manifest-hmac-sha256-v1");
      assert.equal(originalManifest.integrity.scope, "complete-manifest-excluding-integrity");
      const tamperCases = [
        ["title", (manifest) => { manifest.title = "Tampered title"; }],
        ["expectationFit", (manifest) => {
          manifest.expectationFit = { ...manifest.expectationFit, sourceAdequacy: "substantive", readyForProduction: true };
        }],
        ["deckSession", (manifest) => {
          manifest.deckSession = { ...(manifest.deckSession || {}), selectedDirectionId: "brand-launch" };
        }],
        ["selectedDirectionId", (manifest) => { manifest.selectedDirectionId = "brand-launch"; }]
      ];
      for (const [label, mutate] of tamperCases) {
        const manifest = structuredClone(originalManifest);
        mutate(manifest);
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
        const listResponse = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(project.projectPath)}`);
        assert.equal(listResponse.status, 400, label);
        assert.match((await listResponse.json()).message, /authenticity signature does not match/, label);
      }

      const downloadResponse = await fetch(
        `${baseUrl}/projects/artifacts/file?projectPath=${encodeURIComponent(project.projectPath)}&artifact=${encodeURIComponent("exports/authentic.pptx")}`
      );
      assert.equal(downloadResponse.status, 400);
      assert.match((await downloadResponse.json()).message, /authenticity signature does not match/);

      const launchResponse = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: project.projectPath, agent: "codex" })
      });
      assert.equal(launchResponse.status, 400);
      assert.match((await launchResponse.json()).message, /authenticity signature does not match/);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("agent launch is command-only for a valid handoff and rejects external paths", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-launch-"));
  const outsideDir = await mkdtemp(join(tmpdir(), "upm-bridge-launch-outside-"));
  try {
    await writeFile(join(outsideDir, "manifest.json"), JSON.stringify({ projectPath: outsideDir }));
    await withServer({ allowLaunch: false, outputDir }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: { title: "Launch Deck" } })
      });
      const handoffPayload = await handoff.json();
      const response = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: handoffPayload.projectPath, agent: "codex" })
      });
      const payload = await response.json();
      assert.equal(payload.ok, true);
      assert.equal(payload.launched, false);
      assert.equal(payload.status, "command-only");
      assert.equal(payload.job, null);
      assert.ok(payload.command.includes("codex"));
      assert.ok(payload.message.includes("--allow-launch"));
      await assert.rejects(access(join(handoffPayload.projectPath, "agent-job.json")));

      const external = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: outsideDir, agent: "codex" })
      });
      assert.equal(external.status, 400);
      const externalPayload = await external.json();
      assert.equal(externalPayload.ok, false);
      assert.match(externalPayload.message, /configured Bridge output directory/);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(outsideDir, { recursive: true, force: true });
  }
});

test("Agent launch is project-idempotent and exposes accepted, running, and completed states", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-launch-idempotent-"));
  let child;
  let spawnCount = 0;
  try {
    await withServer({
      outputDir,
      allowLaunch: true,
      agentCommandResolver: () => "/fake/codex",
      agentSpawner: () => {
        spawnCount += 1;
        child = new EventEmitter();
        child.pid = process.pid;
        child.unref = () => {};
        return child;
      }
    }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "launch-idempotency",
          sourceMarkdown: "# Source\n\nA grounded launch contract.",
          projectBrief: fastProjectBrief({ title: "Launch Idempotency" })
        })
      });
      const project = await handoff.json();
      const launchBody = JSON.stringify({ projectPath: project.projectPath, agent: "codex" });
      const firstLaunchPromise = fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: launchBody
      });
      await waitFor(() => spawnCount === 1 && child);

      const concurrent = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: launchBody
      });
      assert.equal(concurrent.status, 200);
      const accepted = await concurrent.json();
      assert.equal(accepted.status, "accepted");
      assert.equal(accepted.launched, false);
      assert.equal(accepted.idempotent, true);
      assert.equal(spawnCount, 1);

      child.emit("spawn");
      const firstResponse = await firstLaunchPromise;
      assert.equal(firstResponse.status, 200);
      const running = await firstResponse.json();
      assert.equal(running.status, "running");
      assert.equal(running.launched, true);
      assert.equal(running.idempotent, false);
      assert.equal(running.job.pid, process.pid);

      const repeated = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: launchBody
      });
      const repeatedPayload = await repeated.json();
      assert.equal(repeatedPayload.status, "running");
      assert.equal(repeatedPayload.launched, false);
      assert.equal(repeatedPayload.idempotent, true);
      assert.equal(spawnCount, 1);

      const statusUrl = `${baseUrl}/agent/status?projectPath=${encodeURIComponent(project.projectPath)}`;
      const observedRunning = await (await fetch(statusUrl)).json();
      assert.equal(observedRunning.status, "running");
      assert.equal(observedRunning.job.jobId, running.job.jobId);

      child.emit("exit", 0, null);
      const completed = await waitFor(async () => {
        const payload = await (await fetch(statusUrl)).json();
        return payload.status === "completed" ? payload : null;
      });
      assert.equal(completed.job.exitCode, 0);
      assert.ok(completed.job.completedAt);

      const afterCompletion = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: launchBody
      });
      assert.equal(afterCompletion.status, 200);
      assert.equal((await afterCompletion.json()).status, "completed");
      assert.equal(spawnCount, 1);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("concurrent Bridge instances share the project-level Agent launch claim", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-launch-cross-instance-"));
  let child;
  let spawnCount = 0;
  const launchOptions = {
    outputDir,
    allowLaunch: true,
    agentCommandResolver: () => "/fake/codex",
    agentSpawner: () => {
      spawnCount += 1;
      child = new EventEmitter();
      child.pid = 2_000_000_000;
      child.unref = () => {};
      return child;
    }
  };
  try {
    await withServer(launchOptions, async (firstBaseUrl) => {
      const handoff = await fetch(`${firstBaseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "cross-instance-launch",
          sourceMarkdown: "# Source\n\nA grounded cross-instance launch claim.",
          projectBrief: fastProjectBrief({ title: "Cross Instance Launch" })
        })
      });
      const project = await handoff.json();
      await withServer(launchOptions, async (secondBaseUrl) => {
        const request = (baseUrl) => fetch(`${baseUrl}/agent/launch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectPath: project.projectPath, agent: "codex" })
        });
        const launches = [request(firstBaseUrl), request(secondBaseUrl)];
        await waitFor(() => spawnCount === 1 && child);
        child.emit("spawn");
        const responses = await Promise.all(launches);
        assert.ok(responses.every((response) => response.status === 200));
        const payloads = await Promise.all(responses.map((response) => response.json()));
        assert.equal(payloads.filter((payload) => payload.launched).length, 1);
        assert.equal(payloads.filter((payload) => payload.idempotent).length, 1);
        assert.ok(payloads.every((payload) => ["accepted", "running"].includes(payload.status)));
        assert.equal(spawnCount, 1);

        // The child PID may disappear just before the owning Bridge receives
        // the exit event. A second live Bridge must not race that authoritative
        // callback and persist a false failure.
        const raceProbe = await request(secondBaseUrl);
        assert.equal(raceProbe.status, 200);
        const racePayload = await raceProbe.json();
        assert.equal(racePayload.status, "running");
        assert.equal(racePayload.idempotent, true);
        assert.equal(racePayload.job.ownerBridgePid, process.pid);

        child.emit("exit", 0, null);
        await waitFor(async () => {
          const status = await (await fetch(`${firstBaseUrl}/agent/status?projectPath=${encodeURIComponent(project.projectPath)}`)).json();
          return status.status === "completed";
        });
      });
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("Agent status recovers a dead process after the owning Bridge is gone", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-launch-recovery-"));
  let child;
  let projectPath;
  try {
    await withServer({
      outputDir,
      allowLaunch: true,
      agentCommandResolver: () => "/fake/codex",
      agentSpawner: () => {
        child = new EventEmitter();
        child.pid = 2_000_000_000;
        child.unref = () => {};
        return child;
      }
    }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "launch-recovery",
          sourceMarkdown: "# Source\n\nA grounded recovery contract.",
          projectBrief: fastProjectBrief({ title: "Launch Recovery" })
        })
      });
      ({ projectPath } = await handoff.json());
      const launchPromise = fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, agent: "codex" })
      });
      await waitFor(() => child);
      child.emit("spawn");
      const launch = await launchPromise;
      assert.equal(launch.status, 200);
      assert.equal((await launch.json()).status, "running");
    });

    const jobPath = join(projectPath, "agent-job.json");
    const orphanedJob = JSON.parse(await readFile(jobPath, "utf8"));
    orphanedJob.ownerBridgePid = 2_000_000_000;
    orphanedJob.pid = 2_000_000_000;
    await writeFile(jobPath, JSON.stringify(orphanedJob, null, 2));

    await withServer({
      outputDir,
      allowLaunch: true,
      agentCommandResolver: () => "/fake/codex",
      agentSpawner: () => {
        throw new Error("recovery must not spawn a duplicate Agent");
      }
    }, async (baseUrl) => {
      const statusUrl = `${baseUrl}/agent/status?projectPath=${encodeURIComponent(projectPath)}`;
      const observed = await fetch(statusUrl);
      assert.equal(observed.status, 200);
      assert.equal((await observed.json()).status, "failed");

      const repeated = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, agent: "codex" })
      });
      assert.equal(repeated.status, 409);
      const recovered = await repeated.json();
      assert.equal(recovered.status, "failed");
      assert.match(recovered.message, /no longer running/i);
      assert.equal(JSON.parse(await readFile(jobPath, "utf8")).status, "failed");
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
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

test("effectful POST routes reject disallowed origins and non-JSON bodies before side effects", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-post-guard-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const disallowed = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: {
          Origin: "https://evil.example",
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({ form: { title: "Must Not Exist" } })
      });
      assert.equal(disallowed.status, 403);
      assert.equal((await disallowed.json()).ok, false);

      const wrongContentType = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:5173",
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({ form: { title: "Also Must Not Exist" } })
      });
      assert.equal(wrongContentType.status, 415);

      const malformedJson = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{"
      });
      assert.equal(malformedJson.status, 400);
      assert.match((await malformedJson.json()).message, /Expected JSON/);
      assert.deepEqual(await readdir(outputDir), []);

      const cliRequest = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          form: { title: "CLI Request" },
          projectBrief: fastProjectBrief()
        })
      });
      assert.equal(cliRequest.status, 200);
      assert.equal((await cliRequest.json()).ok, true);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("asset prompt paths reject traversal, backslashes, and absolute paths without writing outside the project", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-prompt-path-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      for (const promptPath of [
        "prompts/../../escaped.md",
        "prompts\\escaped.md",
        "/tmp/absolute.md",
        "C:/absolute.md"
      ]) {
        const response = await fetch(`${baseUrl}/handoff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form: { title: "Unsafe Prompt" },
            projectBrief: fastProjectBrief(),
            assetPlanJson: JSON.stringify({
              version: "asset-plan-v5.4",
              items: [{ id: "asset-1", prompt_path: promptPath }]
            })
          })
        });
        assert.equal(response.status, 400, promptPath);
      }
      assert.deepEqual(await readdir(outputDir), []);
      await assert.rejects(access(join(outputDir, "escaped.md")));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("project writes reject existing parent symlinks", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-write-symlink-"));
  const outsideDir = await mkdtemp(join(tmpdir(), "upm-bridge-write-outside-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: { title: "Symlink Write" }, projectBrief: fastProjectBrief() })
      });
      assert.equal(handoff.status, 200);
      const projectPath = (await handoff.json()).projectPath;
      await symlink(outsideDir, join(projectPath, "revision-requests"));

      const revision = await fetch(`${baseUrl}/slides/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, slideId: "P02" })
      });
      assert.equal(revision.status, 400);
      assert.match((await revision.json()).message, /symbolic links/i);
      await assert.rejects(access(join(outsideDir, "P02.json")));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(outsideDir, { recursive: true, force: true });
  }
});

test("oversize JSON returns a clean 413 and byte and MiB body options keep distinct semantics", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-body-limit-"));
  try {
    await withServer({ outputDir, maxBodyBytes: 64 }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: { title: "Oversize" }, sourceMarkdown: "x".repeat(512) })
      });
      assert.equal(response.status, 413);
      const payload = await response.json();
      assert.equal(payload.ok, false);
      assert.match(payload.message, /64 bytes/);

      const health = await fetch(`${baseUrl}/health`);
      assert.equal(health.status, 200);
      assert.equal((await health.json()).limits.maxBodyBytes, 64);
    });

    await withServer({ outputDir, maxBodyMb: 0.001 }, async (baseUrl) => {
      const health = await fetch(`${baseUrl}/health`);
      const payload = await health.json();
      assert.equal(payload.limits.maxBodyBytes, 1048);
      assert.equal(payload.limits.maxBodyMb, 1048 / (1024 * 1024));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("120 concurrent same-title handoffs allocate unique directories without data overwrite", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-concurrency-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const responses = await Promise.all(Array.from({ length: 120 }, (_, index) => fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Concurrent Deck" },
          sourceMarkdown: `marker-${index}`,
          projectBrief: fastProjectBrief()
        })
      })));
      assert.ok(responses.every((response) => response.status === 200));
      const payloads = await Promise.all(responses.map((response) => response.json()));
      assert.equal(new Set(payloads.map((payload) => payload.projectPath)).size, 120);
      await Promise.all(payloads.map(async (payload, index) => {
        assert.equal(await readFile(join(payload.projectPath, "source.md"), "utf8"), `marker-${index}`);
      }));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("concurrent Bridge instances share one private signing key and validate projects after restart", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-signing-key-concurrency-"));
  const servers = [createBridgeServer({ outputDir }), createBridgeServer({ outputDir })];
  const closeServers = async () => Promise.all(servers.map((server) => new Promise((resolveClose) => {
    if (!server.listening) {
      resolveClose();
      return;
    }
    server.close(resolveClose);
  })));
  try {
    await Promise.all(servers.map((server) => new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen))));
    const baseUrls = servers.map((server) => `http://127.0.0.1:${server.address().port}`);
    const responses = await Promise.all(Array.from({ length: 24 }, (_, index) => fetch(`${baseUrls[index % 2]}/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `signed-concurrent-${index}`,
        form: { title: "Signed Concurrent Deck" },
        sourceMarkdown: `verified-marker-${index}`,
        projectBrief: fastProjectBrief()
      })
    })));
    assert.ok(responses.every((response) => response.status === 200));
    const projects = await Promise.all(responses.map((response) => response.json()));
    assert.equal(new Set(projects.map((project) => project.projectPath)).size, projects.length);
    assert.ok(projects.every((project) => /^[0-9a-f]{64}$/i.test(project.manifest.integrity.signature)));

    const keyPath = join(outputDir, ".bridge-manifest.key");
    const keyBeforeRestart = (await readFile(keyPath, "utf8")).trim();
    const keyStats = await lstat(keyPath);
    assert.equal(keyStats.isFile(), true);
    assert.equal(keyStats.isSymbolicLink(), false);
    assert.equal(keyStats.mode & 0o777, 0o600);
    assert.match(keyBeforeRestart, /^[0-9a-f]{64}$/i);
    assert.deepEqual(
      (await readdir(outputDir)).filter((name) => name.startsWith(".bridge-manifest.key")),
      [".bridge-manifest.key"]
    );
    assert.ok(projects.every((project) => !JSON.stringify(project).includes(keyBeforeRestart)));

    for (const project of projects.slice(0, 2)) {
      await mkdir(join(project.projectPath, "exports"), { recursive: true });
      await writeFile(join(project.projectPath, "exports", `${project.sessionId}.pptx`), "PPTX-BYTES");
    }
    await closeServers();

    await withServer({ outputDir }, async (baseUrl) => {
      assert.equal((await readFile(keyPath, "utf8")).trim(), keyBeforeRestart);
      const healthText = await (await fetch(`${baseUrl}/health`)).text();
      assert.equal(healthText.includes(keyBeforeRestart), false);
      for (const project of projects.slice(0, 2)) {
        const response = await fetch(`${baseUrl}/projects/artifacts?projectPath=${encodeURIComponent(project.projectPath)}`);
        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.equal(payload.artifacts.some((artifact) => artifact.name === ".bridge-manifest.key"), false);
        assert.equal(payload.artifacts.some((artifact) => artifact.kind === "pptx"), true);
      }
    });
  } finally {
    await closeServers();
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("same-name attachments receive distinct stable paths and never overwrite each other", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-duplicate-attachments-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const firstText = "first attachment";
      const secondText = "second attachment";
      const response = await fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Duplicate Attachments" },
          projectBrief: fastProjectBrief(),
          attachments: [
            { id: "first", name: "same.md", type: "text/markdown", size: Buffer.byteLength(firstText), text: firstText },
            { id: "second", name: "same.md", type: "text/markdown", size: Buffer.byteLength(secondText), text: secondText }
          ]
        })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      const [first, second] = payload.manifest.attachments;
      assert.notEqual(first.attachmentPath, second.attachmentPath);
      assert.equal(await readFile(join(payload.projectPath, first.attachmentPath), "utf8"), firstText);
      assert.equal(await readFile(join(payload.projectPath, second.attachmentPath), "utf8"), secondText);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("attachment limits use decoded bytes and reject count, per-file, total, mismatch, and malformed base64", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-attachment-limits-"));
  try {
    await withServer({
      outputDir,
      maxAttachments: 2,
      maxAttachmentBytes: 4,
      maxTotalAttachmentBytes: 6
    }, async (baseUrl) => {
      const postAttachments = (attachments) => fetch(`${baseUrl}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: { title: "Attachment Limits" },
          projectBrief: fastProjectBrief(),
          attachments
        })
      });

      const tooMany = await postAttachments([
        { id: "1", kind: "url", url: "https://example.com/1" },
        { id: "2", kind: "url", url: "https://example.com/2" },
        { id: "3", kind: "url", url: "https://example.com/3" }
      ]);
      assert.equal(tooMany.status, 413);

      const oversizedFile = await postAttachments([
        { id: "large", name: "large.bin", size: 5, dataBase64: Buffer.from("12345").toString("base64") }
      ]);
      assert.equal(oversizedFile.status, 413);

      const oversizedTotal = await postAttachments([
        { id: "a", name: "a.bin", size: 4, dataBase64: Buffer.from("1234").toString("base64") },
        { id: "b", name: "b.bin", size: 4, dataBase64: Buffer.from("5678").toString("base64") }
      ]);
      assert.equal(oversizedTotal.status, 413);

      const mismatchedSize = await postAttachments([
        { id: "mismatch", name: "mismatch.bin", size: 3, dataBase64: Buffer.from("1234").toString("base64") }
      ]);
      assert.equal(mismatchedSize.status, 400);
      assert.match((await mismatchedSize.json()).message, /declared size/i);

      const malformed = await postAttachments([
        { id: "bad", name: "bad.bin", size: 3, dataBase64: "@@@=" }
      ]);
      assert.equal(malformed.status, 400);
      assert.match((await malformed.json()).message, /invalid base64/i);

      assert.deepEqual(await readdir(outputDir), []);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("SSE events are isolated by sessionId while legacy unscoped subscribers remain compatible", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-sse-sessions-"));
  const controllers = [new AbortController(), new AbortController(), new AbortController()];
  const readers = [];
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      try {
        const [streamA, streamB, legacyStream] = await Promise.all([
          fetch(`${baseUrl}/events?sessionId=session-a`, { signal: controllers[0].signal }),
          fetch(`${baseUrl}/events?sessionId=session-b`, { signal: controllers[1].signal }),
          fetch(`${baseUrl}/events`, { signal: controllers[2].signal })
        ]);
        readers.push(streamA.body.getReader(), streamB.body.getReader(), legacyStream.body.getReader());
        const sessionAEventsPromise = readSseUntil(readers[0], (events) => events.some((event) => event.type === "completed"));
        const sessionBEventsPromise = readSseUntil(readers[1], (events) => events.some((event) => event.type === "completed"));
        const legacyEventsPromise = readSseUntil(
          readers[2],
          (events) => events.filter((event) => event.type === "completed").length === 2
        );

        const createProject = (sessionId, task) => fetch(`${baseUrl}/projects/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            taskContext: { task, audience: "管理层", coreMessage: "只验证会话隔离" },
            projectBrief: fastProjectBrief()
          })
        });
        const [createA, createB] = await Promise.all([
          createProject("session-a", "会话 A 的项目"),
          createProject("session-b", "会话 B 的项目")
        ]);
        assert.equal(createA.status, 200);
        assert.equal(createB.status, 200);
        const [projectA, projectB, sessionAEvents, sessionBEvents, legacyEvents] = await Promise.all([
          createA.json(),
          createB.json(),
          sessionAEventsPromise,
          sessionBEventsPromise,
          legacyEventsPromise
        ]);

        assert.ok(sessionAEvents.every((event) => event.sessionId === "session-a"));
        assert.ok(sessionBEvents.every((event) => event.sessionId === "session-b"));
        assert.equal(sessionAEvents.find((event) => event.type === "completed").projectPath, projectA.projectPath);
        assert.equal(sessionBEvents.find((event) => event.type === "completed").projectPath, projectB.projectPath);
        assert.deepEqual(
          new Set(legacyEvents.filter((event) => event.type === "completed").map((event) => event.sessionId)),
          new Set(["session-a", "session-b"])
        );
      } finally {
        controllers.forEach((controller) => controller.abort());
        await Promise.all(readers.map((reader) => reader.cancel().catch(() => {})));
      }
    });
  } finally {
    controllers.forEach((controller) => controller.abort());
    await Promise.all(readers.map((reader) => reader.cancel().catch(() => {})));
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("projects/create stores task context without promoting it to factual evidence", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-task-context-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const storyboard = deckSessionFixture(4).slides;
      const response = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "task-context-only",
          taskContext: {
            task: "为管理层制作一份经营复盘，强调收入增长与毛利率压力。",
            audience: "管理层",
            coreMessage: "收入增长，但毛利率仍需改善。",
            storyboard
          },
          projectBrief: fastProjectBrief({
            expectationFit: {
              riskLevel: "green",
              score: 99,
              sourceAdequacy: "substantive",
              readyForProduction: true,
              missingSignals: []
            }
          })
        })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.sessionId, "task-context-only");
      assert.equal(payload.manifest.sessionId, "task-context-only");
      assert.equal(await readFile(join(payload.projectPath, "source.md"), "utf8"), "");

      const storedTask = JSON.parse(await readFile(join(payload.projectPath, "task-context.json"), "utf8"));
      const brief = JSON.parse(await readFile(join(payload.projectPath, "project-brief.json"), "utf8"));
      const sourceMap = JSON.parse(await readFile(join(payload.projectPath, "source-map.json"), "utf8"));
      const storedStoryboard = JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8"));
      assert.equal(storedTask.task, "为管理层制作一份经营复盘，强调收入增长与毛利率压力。");
      assert.equal(brief.expectationFit.sourceAdequacy, "no-source");
      assert.equal(brief.expectationFit.readyForProduction, false);
      assert.equal(brief.expectationFit.riskLevel, "red");
      assert.equal(brief.sourceConfidence.level, "weak");
      assert.match(brief.workflowState.blockedReason, /verified source/i);
      assert.equal(sourceMap.claims.length, 0);
      assert.ok(storedStoryboard.slides.every((slide) => slide.evidenceState === "missing" && slide.evidenceRefs.length === 0));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("verified evidence clears only the stale source-only workflow blocker", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-workflow-blocker-"));
  try {
    await withServer({ outputDir }, async (baseUrl) => {
      const createProject = (sourceMarkdown, blockedReason) => fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskContext: {
            task: "根据已核验资料生成经营复盘",
            audience: "管理层",
            coreMessage: "已核验资料支持进入生产。"
          },
          sourceMarkdown,
          workflowState: { currentStep: "handoff", blockedReason },
          projectBrief: fastProjectBrief()
        })
      });

      const verifiedResponse = await createProject(
        "# Verified source\n\nThis factual source was supplied by the user and is ready for production.",
        "real source required before final production"
      );
      assert.equal(verifiedResponse.status, 200);
      const verified = await verifiedResponse.json();
      const verifiedBrief = JSON.parse(await readFile(join(verified.projectPath, "project-brief.json"), "utf8"));
      assert.equal(verified.manifest.expectationFit.readyForProduction, true);
      assert.equal(verified.manifest.workflowState.blockedReason, "");
      assert.equal(verifiedBrief.workflowState.blockedReason, "");

      const customResponse = await createProject(
        "# Verified source\n\nThis factual source is verified, but a separate approval is still required.",
        "legal approval required"
      );
      assert.equal(customResponse.status, 200);
      const custom = await customResponse.json();
      assert.equal(custom.manifest.workflowState.blockedReason, "legal approval required");

      const missingResponse = await createProject("", "real source required before final production");
      assert.equal(missingResponse.status, 200);
      const missing = await missingResponse.json();
      assert.equal(missing.manifest.expectationFit.readyForProduction, false);
      assert.equal(missing.manifest.workflowState.blockedReason, "real source required before final production");
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("an unresolved URL attachment stays pending and cannot improve source adequacy", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-url-pending-"));
  const emptyRepoRoot = await mkdtemp(join(tmpdir(), "upm-bridge-empty-repo-"));
  try {
    await withServer({ outputDir, repoRoot: emptyRepoRoot }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "url-pending",
          taskContext: {
            task: "根据网页资料制作经营分析",
            audience: "管理层",
            coreMessage: "等待网页资料完成解析"
          },
          projectBrief: fastProjectBrief(),
          attachments: [{ id: "url-1", name: "待解析网页", url: "https://example.invalid/report" }]
        })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      const attachment = payload.manifest.attachments[0];
      const brief = JSON.parse(await readFile(join(payload.projectPath, "project-brief.json"), "utf8"));
      const sourceMap = JSON.parse(await readFile(join(payload.projectPath, "source-map.json"), "utf8"));
      assert.equal(attachment.kind, "url");
      assert.equal(attachment.ingestion, "pending");
      assert.equal(attachment.provenance.status, "unresolved");
      assert.notEqual(attachment.parseStatus, "extracted");
      assert.equal(brief.expectationFit.sourceAdequacy, "no-source");
      assert.equal(brief.expectationFit.readyForProduction, false);
      assert.ok(brief.expectationFit.missingSignals.includes("source ingestion pending"));
      assert.equal(sourceMap.claims.length, 0);
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(emptyRepoRoot, { recursive: true, force: true });
  }
});

test("a converted URL is returned as verified evidence for Web handoff reconciliation", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-url-converted-"));
  const converterRepoRoot = await mkdtemp(join(tmpdir(), "upm-bridge-url-converter-"));
  try {
    const converterDir = join(converterRepoRoot, "scripts", "source_to_md");
    await mkdir(converterDir, { recursive: true });
    await writeFile(join(converterDir, "web_to_md.py"), [
      "from pathlib import Path",
      "import sys",
      "output = sys.argv[sys.argv.index('-o') + 1]",
      "Path(output).write_text('# URL evidence\\n\\nVerified revenue evidence from the captured page.\\n\\nVerified margin evidence from the captured page.', encoding='utf-8')"
    ].join("\n"));
    await withServer({ outputDir, repoRoot: converterRepoRoot }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "url-converted",
          taskContext: {
            task: "根据网页资料制作经营分析",
            audience: "管理层",
            coreMessage: "网页资料已完成本地解析"
          },
          projectBrief: fastProjectBrief(),
          attachments: [{ id: "url-verified", name: "已解析网页", url: "https://example.test/report" }]
        })
      });
      assert.equal(response.status, 200);
      const payload = await response.json();
      const attachment = payload.manifest.attachments[0];
      const evidence = payload.manifest.evidenceSources.find((source) => source.id === "url-verified");
      assert.equal(attachment.parseStatus, "extracted");
      assert.equal(attachment.ingestion, "converted");
      assert.equal(attachment.provenance.url, "https://example.test/report");
      assert.equal(evidence.verified, true);
      assert.equal(payload.manifest.expectationFit.readyForProduction, true);
      assert.ok(payload.storyboard.slides.every((slide) => slide.evidenceState !== "missing" && slide.evidenceRefs.length > 0));
      assert.deepEqual(payload.storyboard, JSON.parse(await readFile(join(payload.projectPath, "storyboard.json"), "utf8")));
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
    await rm(converterRepoRoot, { recursive: true, force: true });
  }
});

test("agent launch failures return an error status instead of false success", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-bridge-launch-failure-"));
  try {
    await withServer({
      outputDir,
      allowLaunch: true,
      agentCommandResolver: () => "/fake/codex",
      agentSpawner: () => {
        throw new Error("spawn denied by test");
      }
    }, async (baseUrl) => {
      const handoff = await fetch(`${baseUrl}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "launch-failure",
          taskContext: { task: "启动失败测试", audience: "测试者", coreMessage: "不得返回成功" },
          projectBrief: fastProjectBrief()
        })
      });
      assert.equal(handoff.status, 200);
      const project = await handoff.json();
      const launch = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: project.projectPath, agent: "codex" })
      });
      assert.equal(launch.status, 502);
      const payload = await launch.json();
      assert.equal(payload.ok, false);
      assert.equal(payload.launched, false);
      assert.equal(payload.status, "failed");
      assert.equal(payload.job.status, "failed");
      assert.match(payload.message, /failed to launch.*spawn denied/i);

      const observed = await fetch(`${baseUrl}/agent/status?projectPath=${encodeURIComponent(project.projectPath)}`);
      assert.equal(observed.status, 200);
      const observedPayload = await observed.json();
      assert.equal(observedPayload.status, "failed");
      assert.match(observedPayload.job.message, /spawn denied/i);

      const repeated = await fetch(`${baseUrl}/agent/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath: project.projectPath, agent: "codex" })
      });
      assert.equal(repeated.status, 409);
      const repeatedPayload = await repeated.json();
      assert.equal(repeatedPayload.idempotent, true);
      assert.equal(repeatedPayload.status, "failed");
    });
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
