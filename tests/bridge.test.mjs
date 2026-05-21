import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
