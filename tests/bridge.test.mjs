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
