#!/usr/bin/env node
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { lstat, mkdir, readlink, symlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRootForVersion = resolve(__dirname, "../..");
const DEFAULT_PORT = 43188;
const DEFAULT_HOST = "127.0.0.1";
const BRIDGE_VERSION = readPackageVersion(repoRootForVersion);
const DEFAULT_MAX_BODY_MB = 60;

const AGENT_COMMANDS = {
  codex: {
    label: "Codex",
    binary: "codex",
    prompt: "Read AGENTS.md, agent-prompt.md, codex-task.md, project-brief.json, asset_plan.json, asset-plan.md, and visual-element-kit.md first, including sourceConfidence, deliveryScorecard, referenceStyle, confirmationBrief, and feedbackLoop. If attachments/pptlint-repair-plan.json exists, use the fast Existing PPTX Repair Mode before the normal generation workflow: do not import/re-export the whole deck through Artifact Tool or SVG; use only a native package-preserving object editor, otherwise stop immediately with short PowerPoint/WPS steps and do not generate a repaired PPTX. Repair only selected slides, lock exact text, numbers, slide count, order, links, and all unselected slides. Any actual edit must be rendered in PowerPoint/WPS/LibreOffice and visually compared before PPTLint proof can support a success claim. If expectationFit.readyForProduction is false, run guided intake before final production. For net-new deck production, run or handle scripts/generate_visual_element_kit.py; if no image key is configured, use the Needs-Manual prompts. Execute the ChatGPT-generation-first formal-business workflow, update asset_plan.json, asset-plan.md, and quality-report.json, then list final files."
  },
  claude: {
    label: "Claude Code",
    binary: "claude",
    prompt: "Read agent-prompt.md and follow SKILL.md from the Ultimate PPT Master repository. Work in this folder and list final files."
  },
  hermes: {
    label: "Hermes",
    binary: "hermes",
    prompt: "Read agent-prompt.md and use the Ultimate PPT Master Skill workflow."
  },
  openclaw: {
    label: "OpenClaw",
    binary: "openclaw",
    prompt: "Read agent-prompt.md and use the Ultimate PPT Master Skill workflow."
  }
};

const PROVIDER_DEFS = [
  {
    id: "openai",
    label: "OpenAI / compatible",
    keyNames: ["OPENAI_API_KEY", "LLM_API_KEY"],
    baseUrlNames: ["OPENAI_BASE_URL", "LLM_BASE_URL"],
    modelNames: ["OPENAI_MODEL", "LLM_MODEL"],
    defaultBaseUrl: "https://api.openai.com/v1"
  },
  {
    id: "gemini",
    label: "Gemini",
    keyNames: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    baseUrlNames: ["GEMINI_BASE_URL"],
    modelNames: ["GEMINI_MODEL"],
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta"
  },
  {
    id: "qwen",
    label: "Qwen / DashScope",
    keyNames: ["QWEN_API_KEY", "DASHSCOPE_API_KEY"],
    baseUrlNames: ["QWEN_BASE_URL", "DASHSCOPE_BASE_URL"],
    modelNames: ["QWEN_MODEL", "DASHSCOPE_MODEL"],
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    keyNames: ["DEEPSEEK_API_KEY"],
    baseUrlNames: ["DEEPSEEK_BASE_URL"],
    modelNames: ["DEEPSEEK_MODEL"],
    defaultBaseUrl: "https://api.deepseek.com/v1"
  },
  {
    id: "custom",
    label: "Custom LLM bridge",
    keyNames: ["LLM_API_KEY"],
    baseUrlNames: ["LLM_BASE_URL"],
    modelNames: ["LLM_MODEL"],
    defaultBaseUrl: ""
  }
];

function readPackageVersion(repoRoot) {
  try {
    const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
    return packageJson.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function createBridgeServer(options = {}) {
  const repoRoot = options.repoRoot ? resolve(options.repoRoot) : resolve(__dirname, "../..");
  const homeDir = options.homeDir ? resolve(options.homeDir) : os.homedir();
  const outputDir = resolve(options.outputDir || process.env.UPM_BRIDGE_OUTPUT_DIR || join(os.homedir(), "UltimatePPTMaster", "handoffs"));
  const allowLaunch = Boolean(options.allowLaunch);
  const maxBodyBytes = Number(options.maxBodyBytes || process.env.UPM_BRIDGE_MAX_MB || DEFAULT_MAX_BODY_MB) * 1024 * 1024;
  const envSnapshot = loadEnvironment(repoRoot, options.env);

  const eventClients = new Set();
  let eventSequence = 0;
  const publishEvent = (event) => {
    const payload = {
      id: `bridge-${String(++eventSequence).padStart(5, "0")}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    const frame = `id: ${payload.id}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of eventClients) {
      if (!client.destroyed) client.write(frame);
    }
    return payload;
  };

  const server = createServer(async (request, response) => {
    const origin = request.headers.origin;
    const corsHeaders = corsForOrigin(origin);

    if (request.method === "OPTIONS") {
      writeJson(response, 204, {}, corsHeaders);
      return;
    }

    try {
      if (request.method === "GET" && request.url === "/events") {
        response.writeHead(200, {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no"
        });
        response.write(": Ultimate PPT Master Bridge progress stream\n\n");
        eventClients.add(response);
        const connected = {
          id: `bridge-${String(++eventSequence).padStart(5, "0")}`,
          type: "connected",
          phase: "intake",
          progress: 0,
          message: "Bridge event stream connected.",
          timestamp: new Date().toISOString()
        };
        response.write(`id: ${connected.id}\ndata: ${JSON.stringify(connected)}\n\n`);
        request.on("close", () => eventClients.delete(response));
        return;
      }

      if (request.method === "GET" && request.url === "/health") {
        const health = await buildHealth({ repoRoot, homeDir, outputDir, allowLaunch, envSnapshot });
        writeJson(response, 200, health, corsHeaders);
        return;
      }

      if (request.method === "GET" && request.url === "/providers") {
        writeJson(response, 200, { ok: true, providers: providerStatuses(envSnapshot) }, corsHeaders);
        return;
      }

      if (request.method === "POST" && request.url === "/providers/test") {
        const body = await readJsonBody(request, maxBodyBytes);
        const result = await testProvider(String(body.provider || ""), envSnapshot);
        writeJson(response, 200, result, corsHeaders);
        return;
      }

      if (request.method === "POST" && request.url === "/handoff") {
        publishEvent({ type: "phase", phase: "generating", progress: 10, message: "Receiving handoff and source material." });
        const body = await readJsonBody(request, maxBodyBytes);
        publishEvent({ type: "artifact", phase: "generating", progress: 35, message: "Planning storyboard and project artifacts." });
        const result = await writeHandoffProject(body, { repoRoot, outputDir });
        publishEvent({
          type: "completed",
          phase: "review",
          progress: 100,
          message: "Local project is ready for slide production and review.",
          projectPath: result.projectPath,
          artifacts: result.files
        });
        writeJson(response, 200, result, corsHeaders);
        return;
      }

      if (request.method === "POST" && request.url === "/slides/regenerate") {
        const body = await readJsonBody(request, maxBodyBytes);
        const result = await writeSlideRevisionRequest(body, { outputDir });
        publishEvent({
          type: "finding",
          phase: "review",
          progress: 0,
          slideId: result.slideId,
          message: `Revision request saved for ${result.slideId}.`,
          projectPath: result.projectPath,
          recoverable: true
        });
        writeJson(response, 200, result, corsHeaders);
        return;
      }

      if (request.method === "POST" && request.url === "/agent/launch") {
        const body = await readJsonBody(request, maxBodyBytes);
        const result = launchAgent(body, { allowLaunch });
        writeJson(response, 200, result, corsHeaders);
        return;
      }

      if (request.method === "POST" && request.url === "/skill/install") {
        const body = await readJsonBody(request, maxBodyBytes);
        const result = await installSkillTarget(body, { repoRoot, homeDir });
        writeJson(response, result.ok ? 200 : result.statusCode || 409, result, corsHeaders);
        return;
      }

      writeJson(response, 404, { ok: false, message: "Unknown bridge endpoint." }, corsHeaders);
    } catch (error) {
      const status = error?.statusCode || 500;
      publishEvent({
        type: "failed",
        phase: "generating",
        progress: 0,
        message: error?.message || "Bridge request failed.",
        recoverable: true
      });
      writeJson(response, status, { ok: false, message: error?.message || "Bridge request failed." }, corsHeaders);
    }
  });

  server.on("close", () => {
    for (const client of eventClients) client.end();
    eventClients.clear();
  });
  return server;
}

export function startBridge(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = Number(options.port || DEFAULT_PORT);
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    throw new Error("Agent Bridge only binds to localhost for safety.");
  }

  const server = createBridgeServer(options);
  server.listen(port, host, () => {
    const launch = options.allowLaunch ? "enabled" : "disabled";
    console.log(`Ultimate PPT Master Agent Bridge v${BRIDGE_VERSION}`);
    console.log(`Listening on http://${host}:${port}`);
    console.log(`Agent auto-launch: ${launch}`);
  });
  return server;
}

async function buildHealth({ repoRoot, homeDir, outputDir, allowLaunch, envSnapshot }) {
  return {
    ok: true,
    name: "ultimate-ppt-master-agent-bridge",
    version: BRIDGE_VERSION,
    repoRoot,
    outputDir,
    allowLaunch,
    agents: agentStatuses(),
    providers: providerStatuses(envSnapshot),
    skillTargets: await skillTargetStatuses({ repoRoot, homeDir }),
    limits: {
      maxBodyMb: Number(process.env.UPM_BRIDGE_MAX_MB || DEFAULT_MAX_BODY_MB)
    }
  };
}

function corsForOrigin(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  if (!origin) return headers;

  const allowed =
    origin === "https://kdnsna.github.io" ||
    /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origin);
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return headers;
}

function writeJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  if (status === 204) {
    response.end();
    return;
  }
  response.end(JSON.stringify(payload, null, 2));
}

function readJsonBody(request, maxBodyBytes) {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        const error = new Error(`Request body exceeds ${Math.round(maxBodyBytes / 1024 / 1024)} MB.`);
        error.statusCode = 413;
        rejectPromise(error);
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8") || "{}";
        resolvePromise(JSON.parse(text));
      } catch {
        const error = new Error("Expected JSON body.");
        error.statusCode = 400;
        rejectPromise(error);
      }
    });
    request.on("error", rejectPromise);
  });
}

function loadEnvironment(repoRoot, injectedEnv) {
  const merged = {};
  const sources = {};
  const candidateFiles = [
    resolve(process.cwd(), ".env"),
    resolve(repoRoot, ".env"),
    join(os.homedir(), ".ppt-master", ".env")
  ];

  for (const filePath of candidateFiles) {
    if (!existsSync(filePath)) continue;
    const parsed = parseEnvFile(filePath);
    for (const [key, value] of Object.entries(parsed)) {
      if (merged[key] === undefined) {
        merged[key] = value;
        sources[key] = filePath;
      }
    }
  }

  const overlay = injectedEnv || process.env;
  for (const [key, value] of Object.entries(overlay)) {
    if (value === undefined) continue;
    merged[key] = String(value);
    sources[key] = injectedEnv ? "injected" : "process.env";
  }

  return { values: merged, sources };
}

function parseEnvFile(filePath) {
  const content = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[match[1]] = value;
  }
  return result;
}

function providerStatuses(envSnapshot) {
  return PROVIDER_DEFS.map((provider) => {
    const apiKeyName = provider.keyNames.find((name) => hasValue(envSnapshot.values[name]));
    const modelName = provider.modelNames.find((name) => hasValue(envSnapshot.values[name]));
    const baseUrlName = provider.baseUrlNames.find((name) => hasValue(envSnapshot.values[name]));
    const configured = provider.id === "custom"
      ? Boolean(apiKeyName && baseUrlName)
      : Boolean(apiKeyName);

    return {
      id: provider.id,
      label: provider.label,
      configured,
      envKeys: provider.keyNames,
      model: modelName ? envSnapshot.values[modelName] : "",
      baseUrl: baseUrlName ? envSnapshot.values[baseUrlName] : provider.defaultBaseUrl,
      keySource: apiKeyName ? sourceLabel(envSnapshot.sources[apiKeyName]) : "",
      modelSource: modelName ? sourceLabel(envSnapshot.sources[modelName]) : ""
    };
  });
}

function skillTargetDefinitions(homeDir, repoRoot) {
  return [
    {
      id: "codex",
      label: "Codex Skill",
      targetPath: join(homeDir, ".codex", "skills", "ultimate-ppt-master"),
      installCommand: skillInstallCommand(join(homeDir, ".codex", "skills", "ultimate-ppt-master"), repoRoot)
    },
    {
      id: "generic",
      label: "Generic Agent Skill",
      targetPath: join(homeDir, "agent-skills", "ultimate-ppt-master"),
      installCommand: skillInstallCommand(join(homeDir, "agent-skills", "ultimate-ppt-master"), repoRoot)
    }
  ];
}

async function skillTargetStatuses({ repoRoot, homeDir }) {
  const targets = skillTargetDefinitions(homeDir, repoRoot);
  const results = [];
  for (const target of targets) {
    results.push(await skillTargetStatus(target, repoRoot));
  }
  return results;
}

async function skillTargetStatus(target, repoRoot) {
  const base = {
    id: target.id,
    label: target.label,
    targetPath: target.targetPath,
    installCommand: target.installCommand,
    installed: false,
    managed: false,
    mode: "missing",
    message: "Skill target is not installed yet."
  };

  try {
    const stats = await lstat(target.targetPath);
    if (stats.isSymbolicLink()) {
      const linkValue = await readlink(target.targetPath);
      const resolvedLink = resolve(dirname(target.targetPath), linkValue);
      const pointsToRepo = resolvedLink === resolve(repoRoot);
      return {
        ...base,
        installed: pointsToRepo,
        managed: pointsToRepo,
        mode: "symlink",
        message: pointsToRepo
          ? "Skill is linked to the current Ultimate PPT Master checkout."
          : `Existing symlink points to ${linkValue}; Bridge will not replace it automatically.`
      };
    }

    if (stats.isDirectory()) {
      const hasSkillFile = existsSync(join(target.targetPath, "SKILL.md"));
      const hasGit = existsSync(join(target.targetPath, ".git"));
      const origin = hasGit ? gitOrigin(target.targetPath) : "";
      const managed = hasGit && isUltimatePptMasterOrigin(origin);
      return {
        ...base,
        installed: hasSkillFile,
        managed,
        mode: hasGit ? "git" : "directory",
        message: managed
          ? "Existing Ultimate PPT Master git checkout found; Bridge can update it with git pull --ff-only."
          : hasSkillFile
            ? "Existing Skill folder found, but Bridge will not modify unmanaged directories."
            : "Path already exists and is not an Ultimate PPT Master Skill folder."
      };
    }

    return {
      ...base,
      mode: "file",
      message: "Path exists as a file; Bridge will not replace it automatically."
    };
  } catch (error) {
    if (error?.code === "ENOENT") return base;
    return {
      ...base,
      mode: "unknown",
      message: `Could not inspect Skill target: ${error?.message || error}`
    };
  }
}

async function installSkillTarget(payload, { repoRoot, homeDir }) {
  const targetId = String(payload?.target || "codex");
  const target = skillTargetDefinitions(homeDir, repoRoot).find((item) => item.id === targetId);
  if (!target) {
    return {
      ok: false,
      statusCode: 400,
      message: "Unsupported Skill target. Use `codex` or `generic`."
    };
  }

  const current = await skillTargetStatus(target, repoRoot);
  if (current.mode === "missing") {
    await mkdir(dirname(target.targetPath), { recursive: true });
    await symlink(repoRoot, target.targetPath, "dir");
    const next = await skillTargetStatus(target, repoRoot);
    return {
      ok: true,
      action: "installed",
      ...next,
      message: `Installed ${target.label} by linking it to the current checkout.`
    };
  }

  if (current.managed && current.mode === "symlink") {
    return {
      ok: true,
      action: "already-installed",
      ...current,
      message: `${target.label} is already linked to the current checkout.`
    };
  }

  if (current.managed && current.mode === "git") {
    const result = spawnSync("git", ["-C", target.targetPath, "pull", "--ff-only"], {
      encoding: "utf8",
      timeout: 120000
    });
    if (result.status === 0) {
      return {
        ok: true,
        action: "updated",
        ...(await skillTargetStatus(target, repoRoot)),
        message: String(result.stdout || "Skill checkout updated.").trim()
      };
    }
    return {
      ok: false,
      statusCode: 409,
      ...current,
      message: String(result.stderr || result.stdout || "git pull --ff-only failed.").trim()
    };
  }

  return {
    ok: false,
    statusCode: 409,
    ...current,
    message: `${current.message} Copy the command and resolve it manually if you want to replace this path.`
  };
}

function gitOrigin(targetPath) {
  const result = spawnSync("git", ["-C", targetPath, "config", "--get", "remote.origin.url"], {
    encoding: "utf8",
    timeout: 10000
  });
  if (result.status !== 0) return "";
  return String(result.stdout || "").trim();
}

function isUltimatePptMasterOrigin(origin) {
  return /(?:github\.com[:/])?kdnsna\/ultimate-ppt-master-skill(?:\.git)?$/i.test(String(origin).trim());
}

function skillInstallCommand(targetPath, repoRoot) {
  const quotedTarget = shellQuote(targetPath);
  const quotedRepo = shellQuote(repoRoot);
  return `TARGET=${quotedTarget}; REPO=${quotedRepo}; mkdir -p "$(dirname "$TARGET")"; if [ -L "$TARGET" ]; then echo "Already linked: $TARGET"; elif [ -d "$TARGET/.git" ]; then git -C "$TARGET" pull --ff-only; elif [ -e "$TARGET" ]; then echo "Existing unmanaged path: $TARGET"; exit 1; else ln -s "$REPO" "$TARGET"; fi`;
}

async function testProvider(providerId, envSnapshot) {
  const provider = PROVIDER_DEFS.find((item) => item.id === providerId);
  if (!provider) return { ok: false, configured: false, message: "Unknown provider." };

  const status = providerStatuses(envSnapshot).find((item) => item.id === providerId);
  if (!status?.configured) {
    return {
      ok: false,
      configured: false,
      provider: providerId,
      message: `Missing ${provider.keyNames.join(" or ")}.`
    };
  }

  const keyName = provider.keyNames.find((name) => hasValue(envSnapshot.values[name]));
  const apiKey = envSnapshot.values[keyName];
  const baseUrl = String(status.baseUrl || provider.defaultBaseUrl).replace(/\/+$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let url = `${baseUrl}/models`;
    const headers = {};

    if (provider.id === "gemini") {
      url = `${baseUrl}/models?key=${encodeURIComponent(apiKey)}`;
    } else {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, { method: "GET", headers, signal: controller.signal });
    clearTimeout(timeout);
    return {
      ok: response.ok,
      configured: true,
      provider: providerId,
      status: response.status,
      message: response.ok ? "Provider responded." : `Provider returned HTTP ${response.status}.`
    };
  } catch (error) {
    return {
      ok: false,
      configured: true,
      provider: providerId,
      message: error?.name === "AbortError" ? "Provider test timed out." : `Provider test failed: ${error?.message || error}`
    };
  }
}

function agentStatuses() {
  return Object.entries(AGENT_COMMANDS).map(([id, agent]) => {
    const commandPath = findCommand(agent.binary);
    return {
      id,
      label: agent.label,
      command: agent.binary,
      available: Boolean(commandPath),
      path: commandPath || ""
    };
  });
}

function findCommand(binary) {
  const isWindows = process.platform === "win32";
  const command = isWindows ? "where" : "sh";
  const args = isWindows ? [binary] : ["-lc", `command -v ${shellEscape(binary)}`];
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) return "";
  return String(result.stdout || "").split(/\r?\n/)[0].trim();
}

async function writeHandoffProject(payload, { repoRoot, outputDir }) {
  const title = payload?.form?.title || payload?.title || "ultimate-ppt-master-handoff";
  const projectBrief = typeof payload.projectBrief === "string" ? parseJsonMaybe(payload.projectBrief) : payload.projectBrief || {};
  const qualityProfile = payload.qualityProfile || projectBrief.qualityProfile || {};
  const qualityGate = payload.qualityGate || projectBrief.qualityGate || defaultQualityGate();
  const workflowState = payload.workflowState || projectBrief.workflowState || {
    currentStep: "handoff",
    blockedReason: ""
  };
  const expectedArtifacts = Array.isArray(payload.expectedArtifacts)
    ? payload.expectedArtifacts
    : Array.isArray(projectBrief.expectedArtifacts)
      ? projectBrief.expectedArtifacts
      : [];
  const reviewCommands = Array.isArray(payload.reviewCommands)
    ? payload.reviewCommands
    : Array.isArray(projectBrief.reviewCommands)
      ? projectBrief.reviewCommands
      : Array.isArray(qualityGate.reviewCommands)
        ? qualityGate.reviewCommands
        : [];
  const deckIR = {
    storyboard: "storyboard.json",
    sourceMap: "source-map.json",
    planningReport: "planning-report.json",
    renderedReview: "review-findings.json",
    repairPlan: "repair-plan.json",
    revisionBrief: "revision-brief.md"
  };
  const visualBrief = projectBrief.visualBrief || payload.visualBrief || defaultVisualBrief(payload);
  const guidedBrief = projectBrief.guidedBrief || payload.guidedBrief || defaultGuidedBrief({ payload, visualBrief });
  const expectationFit = projectBrief.expectationFit || payload.expectationFit || defaultExpectationFit({ payload, projectBrief, visualBrief });
  const referenceStyle = projectBrief.referenceStyle || payload.referenceStyle || visualBrief.referenceStyle || defaultReferenceStyle({ projectBrief, visualBrief });
  visualBrief.referenceStyle = visualBrief.referenceStyle || referenceStyle;
  const sourceConfidence = projectBrief.sourceConfidence || payload.sourceConfidence || defaultSourceConfidence({ payload, projectBrief, expectationFit });
  const deliveryScorecard = projectBrief.deliveryScorecard || payload.deliveryScorecard || defaultDeliveryScorecard({ title, expectationFit, sourceConfidence, referenceStyle });
  const feedbackLoop = projectBrief.feedbackLoop || payload.feedbackLoop || defaultFeedbackLoop({ expectationFit, sourceConfidence, deliveryScorecard });
  const failureTaxonomy = projectBrief.failureTaxonomy || payload.failureTaxonomy || feedbackLoop.failureTaxonomy;
  const confirmationBrief = projectBrief.confirmationBrief || payload.confirmationBrief || defaultConfirmationBrief({ title, guidedBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle });
  const imageAcceptance = projectBrief.imageAcceptance || payload.imageAcceptance || defaultImageAcceptance();
  const briefMode = projectBrief.briefMode || payload.briefMode || (expectationFit.readyForProduction ? "source-first" : "codex-guided-intake");
  const enrichedProjectBrief = {
    ...projectBrief,
    schemaVersion: projectBrief.schemaVersion || "v5.2-brief-v1",
    briefMode,
    visualBrief,
    guidedBrief,
    expectationFit,
    referenceStyle,
    sourceConfidence,
    deliveryScorecard,
    feedbackLoop,
    failureTaxonomy,
    confirmationBrief,
    imageAcceptance,
    qualityProfile,
    qualityGate,
    workflowState,
    expectedArtifacts,
    reviewCommands,
    deckIR
  };
  const slug = slugify(title);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const projectPath = join(outputDir, `${slug}-${timestamp}`);
  const attachmentsDir = join(projectPath, "attachments");
  const extractedDir = join(projectPath, "extracted");
  const attachmentCacheDir = join(outputDir, ".cache", "attachments");
  await mkdir(attachmentsDir, { recursive: true });
  await mkdir(extractedDir, { recursive: true });
  await mkdir(attachmentCacheDir, { recursive: true });

  const files = [];
  async function writeProjectFile(relativePath, content) {
    const target = join(projectPath, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content || "", "utf8");
    files.push(relativePath);
  }

  await writeProjectFile("source.md", payload.sourceMarkdown || payload.source || "");
  await writeProjectFile("agent-prompt.md", payload.agentPrompt || "");
  await writeProjectFile("project-brief.json", JSON.stringify(enrichedProjectBrief, null, 2));
  await writeProjectFile("preview-web-deck.html", payload.previewWebDeckHtml || "");
  await writeProjectFile("engine-plan.md", payload.enginePlanMarkdown || payload.enginePlan || "");
  await writeProjectFile("quality-checklist.md", payload.qualityChecklist || "");
  await writeProjectFile("asset-plan.md", payload.assetPlan || defaultAssetPlan({ title, qualityGate }));
  await writeProjectFile("asset_plan.json", payload.assetPlanJson || JSON.stringify({ version: "asset-plan-v5.4", project: title, items: [] }, null, 2));
  for (const promptFile of assetPromptFiles(payload.assetPlanJson || "")) {
    await writeProjectFile(promptFile.path, promptFile.text);
  }
  await writeProjectFile("visual-element-kit.md", payload.visualElementKit || defaultVisualElementKit({ title, qualityGate }));
  await writeProjectFile("codex-task.md", payload.codexTask || defaultCodexTask({ title, qualityGate, workflowState, expectedArtifacts, reviewCommands, briefMode, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, feedbackLoop }));
  await writeProjectFile("AGENTS.md", payload.codexAgentGuide || defaultCodexAgentGuide({ qualityGate, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, feedbackLoop }));
  await writeProjectFile("README.md", payload.readme || defaultHandoffReadme());

  const extractedSections = [
    "# Extracted Source",
    "",
    "This file was generated by the local Agent Bridge. It combines browser notes with local extraction results when converters are available.",
    "",
    "## Browser source.md",
    "",
    payload.sourceMarkdown || payload.source || ""
  ];
  const attachmentResults = [];

  for (const item of Array.isArray(payload.attachments) ? payload.attachments : []) {
    const result = await stageAttachment(item, { attachmentsDir, extractedDir, attachmentCacheDir, repoRoot });
    attachmentResults.push(result);
    if (result.markdown) {
      extractedSections.push("", `## ${result.name}`, "", result.markdown.trim());
    } else {
      extractedSections.push("", `## ${result.name}`, "", `Status: ${result.parseStatus}. ${result.message || "Kept as an attachment for the Agent."}`);
    }
  }

  const extractedSource = `${extractedSections.join("\n")}\n`;
  const deckIRPayload = buildDeckIR({
    title,
    sourceText: extractedSource,
    outputMode: payload?.form?.outputMode || projectBrief.outputMode || "both",
    qualityGate
  });
  decorateDeckIRV52(deckIRPayload, { referenceStyle, sourceConfidence, deliveryScorecard, imageAcceptance });
  await writeProjectFile("storyboard.json", JSON.stringify(deckIRPayload.storyboard, null, 2));
  await writeProjectFile("source-map.json", JSON.stringify(deckIRPayload.sourceMap, null, 2));
  await writeProjectFile("planning-report.json", JSON.stringify(deckIRPayload.planningReport, null, 2));
  await writeProjectFile("review-findings.json", JSON.stringify(createPendingReviewFindings({ title, storyboard: deckIRPayload.storyboard }), null, 2));
  await writeProjectFile("repair-plan.json", JSON.stringify(createPendingRepairPlan({ title }), null, 2));
  await writeProjectFile("revision-brief.md", pendingRevisionBrief({ title }));

  const manifest = {
    version: BRIDGE_VERSION,
    createdAt: new Date().toISOString(),
    title,
    deckSession: projectBrief.deckSession || payload.deckSession || null,
    projectPath,
    repoRoot,
    qualityProfile,
    qualityGate,
    workflowState,
    briefMode,
    visualBrief,
    guidedBrief,
    expectationFit,
    schemaVersion: "v5.2-brief-v1",
    referenceStyle,
    sourceConfidence,
    deliveryScorecard,
    feedbackLoop,
    failureTaxonomy,
    confirmationBrief,
    imageAcceptance,
    expectedArtifacts,
    reviewCommands,
    deckIR,
    attachments: attachmentResults.map(({ markdown, ...item }) => item),
    suggestedCommands: suggestedCommands(projectPath)
  };

  await writeProjectFile("extracted-source.md", extractedSource);
  await writeProjectFile("quality-report.json", JSON.stringify(createPendingQualityReport({ title, qualityProfile, qualityGate, workflowState, expectedArtifacts, reviewCommands, deckIR, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, feedbackLoop, failureTaxonomy, confirmationBrief, imageAcceptance }), null, 2));
  await writeProjectFile("manifest.json", JSON.stringify(manifest, null, 2));

  return {
    ok: true,
    projectPath,
    files,
    manifest,
    suggestedCommands: manifest.suggestedCommands
  };
}

function parseJsonMaybe(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function assetPromptText(item) {
  return [
    `Asset id: ${String(item.id || "asset")}`,
    `Slide: ${String(item.slide || "pending")}`,
    `Slot: ${String(item.slot || "pending")}`,
    `Asset type: ${String(item.asset_type || "hero")}`,
    `Aspect ratio: ${String(item.aspect_ratio || "16:9")}`,
    `Text policy: ${String(item.text_policy || "none")}`,
    "Create only the image asset for this slot, not a full slide.",
    "No fake logos, no page title, no page number, and no unapproved IP.",
    "If text is needed, keep it to short labels only and prefer editable deck text."
  ].join("\n");
}

function assetPromptFiles(assetPlanJson) {
  const plan = parseJsonMaybe(assetPlanJson);
  if (!Array.isArray(plan.items)) return [];
  return plan.items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({ path: String(item.prompt_path || ""), text: assetPromptText(item) }))
    .filter((item) => item.path.startsWith("prompts/") && item.path.endsWith(".md"));
}

function defaultVisualBrief(payload = {}) {
  return {
    selectedTags: {
      scenario: [],
      audience: [],
      purpose: [],
      contentState: [],
      visualStyle: [],
      layoutDensity: [],
      assetStrategy: ["official-first", "ai-visuals"],
      outputPreference: ["editable-pptx", "editable-first"]
    },
    tagPreset: "bridge-fallback",
    backgroundText: payload?.form?.sourceNotes || "",
    extraRequirements: payload?.form?.constraints || "",
    referenceLinks: [],
    referenceStyle: defaultReferenceStyle({ projectBrief: {}, visualBrief: {} }),
    autoSuggestedTags: [],
    userEditedTags: false
  };
}

function defaultGuidedBrief({ payload, visualBrief }) {
  return {
    scenario: payload?.form?.scenario || "",
    audience: payload?.form?.audience || "",
    purpose: "",
    coreMessage: payload?.form?.coreMessage || "",
    contentSources: [payload?.sourceMarkdown ? "source.md" : "", visualBrief.backgroundText ? "visualBrief.backgroundText" : ""].filter(Boolean),
    slideCount: payload?.form?.slideCount || "",
    outlinePreference: "",
    visualStyle: [],
    assetRules: visualBrief.selectedTags?.assetStrategy || [],
    outputFormat: visualBrief.selectedTags?.outputPreference || [],
    mustInclude: [],
    mustAvoid: []
  };
}

function defaultExpectationFit({ payload, projectBrief }) {
  const sourceText = String(payload?.sourceMarkdown || payload?.source || projectBrief?.sourceNotes || "").trim();
  const hasAttachments = Array.isArray(payload?.attachments) && payload.attachments.length > 0;
  const hasAudience = Boolean(payload?.form?.audience || projectBrief?.audience);
  const hasCore = Boolean(payload?.form?.coreMessage || projectBrief?.coreMessage);
  const missingSignals = [];
  if (!hasAudience) missingSignals.push("missing audience");
  if (!hasCore) missingSignals.push("missing core message");
  if (!sourceText && !hasAttachments) missingSignals.push("missing source material");
  const sourceAdequacy = sourceText.length > 220 ? "substantive" : hasAttachments ? "private-unparsed" : sourceText.length > 60 ? "thin" : "topic-only";
  const score = Math.max(35, 100 - missingSignals.length * 14 - (sourceAdequacy === "substantive" ? 0 : sourceAdequacy === "thin" ? 12 : 24));
  const riskLevel = score >= 82 ? "green" : score >= 55 ? "yellow" : "red";
  return {
    riskLevel,
    score,
    sourceAdequacy,
    missingSignals,
    assumptions: [
      "Default to editable PPTX unless project-brief.json says otherwise.",
      "Use official/user-provided assets first; use ChatGPT/OpenAI for no-text support visuals and micro-assets.",
      "Record assumptions in quality-report.json before final delivery."
    ],
    conflicts: [],
    successCriteria: [
      "The deck states a clear audience, purpose, and core message before production.",
      "The final response explains which choices came from user input and which were assumptions."
    ],
    readyForProduction: riskLevel !== "red",
    nextQuestions: riskLevel === "red"
      ? ["Who is the deck for, what setting will it be used in, what should the audience do afterward, and what source material should be used?"]
      : []
  };
}

function defaultReferenceStyle() {
  return {
    selectedDirection: "financial-steady",
    positiveReferences: ["bank executive report", "SOE formal briefing", "financial KPI dashboard"],
    negativeReferences: ["high-saturation launch visuals", "cartoon characters", "unlicensed brand marks"],
    styleConstraints: ["Microsoft YaHei default", "stable grid", "reserved color usage", "official assets first"]
  };
}

function sourceConfidenceLevel(sourceAdequacy) {
  return {
    substantive: "strong",
    thin: "partial",
    "private-unparsed": "partial",
    conflicting: "partial",
    "topic-only": "topic-only",
    "no-source": "weak"
  }[sourceAdequacy] || "weak";
}

function defaultSourceConfidence({ payload, expectationFit }) {
  const sourceText = String(payload?.sourceMarkdown || payload?.source || "").trim();
  const attachmentCount = Array.isArray(payload?.attachments) ? payload.attachments.length : 0;
  const level = sourceConfidenceLevel(expectationFit?.sourceAdequacy);
  return {
    level,
    sourceAdequacy: expectationFit?.sourceAdequacy || "no-source",
    coveredAreas: [
      payload?.form?.title ? "project title" : "",
      payload?.form?.audience ? "target audience" : "",
      payload?.form?.coreMessage ? "core message" : "",
      sourceText || attachmentCount ? "source material" : "",
      "editable PPTX delivery default"
    ].filter(Boolean),
    missingAreas: [
      ...(expectationFit?.missingSignals || []),
      !sourceText && !attachmentCount ? "no citable source; do not invent facts or numbers" : ""
    ].filter(Boolean),
    claimsNeedingEvidence: payload?.form?.coreMessage ? [`Core message needs evidence: ${payload.form.coreMessage}`] : [],
    doNotInvent: [
      "Do not invent numbers",
      "Do not invent customer or institution names",
      "Do not invent policy sources",
      "Do not use unlicensed logos/IP",
      "Do not present AI images as real scenes"
    ]
  };
}

function defaultDeliveryScorecard({ title, expectationFit, sourceConfidence, referenceStyle }) {
  const sourceScore = {
    strong: 92,
    partial: 72,
    weak: 42,
    "topic-only": 36
  }[sourceConfidence?.level] || 42;
  return {
    expectedDeckType: "general-business",
    expectationFitBeforeProduction: {
      riskLevel: expectationFit?.riskLevel || "red",
      score: expectationFit?.score ?? 0,
      readyForProduction: Boolean(expectationFit?.readyForProduction),
      missingSignals: expectationFit?.missingSignals || [],
      assumptions: expectationFit?.assumptions || []
    },
    qualityDimensions: [
      { id: "brief-fit", label: "Brief clarity", score: expectationFit?.score ?? 0, evidence: "Bridge fallback expectationFit." },
      { id: "source-confidence", label: "Source confidence", score: sourceScore, evidence: `Source adequacy: ${sourceConfidence?.sourceAdequacy || "unknown"}.` },
      { id: "style-specificity", label: "Style specificity", score: referenceStyle?.selectedDirection ? 86 : 58, evidence: `Reference style: ${referenceStyle?.selectedDirection || "pending"}.` },
      { id: "asset-boundary", label: "Asset boundary", score: 72, evidence: "Official/user-provided assets first, ChatGPT no-text support visuals." },
      { id: "output-editability", label: "Delivery editability", score: 90, evidence: "Editable PPTX default." }
    ],
    userVisibleSummary: `Bridge prepared v5.2 delivery scorecard for ${title}: expectation ${expectationFit?.score ?? 0}%, source confidence ${sourceConfidence?.level || "unknown"}.`,
    knownRisks: [
      ...(expectationFit?.missingSignals || []),
      ...(expectationFit?.conflicts || []),
      ...(sourceConfidence?.missingAreas || [])
    ],
    recommendedNextRevision: expectationFit?.readyForProduction
      ? []
      : ["Run Codex guided intake before final production and update confirmationBrief."]
  };
}

function defaultFeedbackLoop({ expectationFit, sourceConfidence, deliveryScorecard }) {
  const sourceGap = sourceConfidence?.level !== "strong";
  const briefGap = !expectationFit?.readyForProduction || Boolean((expectationFit?.missingSignals || []).length);
  const taxonomy = [
    { id: "brief-mismatch", label: "Brief mismatch", applies: briefGap, improvementTarget: "Clarify audience, setting, purpose, sources, core message, and output." },
    { id: "source-gap", label: "Source gap", applies: sourceGap, improvementTarget: "Add citable sources or mark assumptions explicitly." },
    { id: "style-mismatch", label: "Style mismatch", applies: false, improvementTarget: "Choose a concrete reference style and move-toward / avoid examples." },
    { id: "visual-density", label: "Visual density mismatch", applies: false, improvementTarget: "Confirm spacious, standard, dense, dashboard, or text/image balanced layout." },
    { id: "asset-boundary", label: "Asset/IP boundary unclear", applies: false, improvementTarget: "Clarify official assets, AI visuals, portrait/IP restrictions, and replacement strategy." },
    { id: "format-mismatch", label: "Format mismatch", applies: false, improvementTarget: "Editable PPTX is default; PDF/Web preview must be explicit if needed." }
  ];
  return {
    feedbackStatus: taxonomy.some((item) => item.applies) ? "requested" : "none",
    failureTaxonomy: taxonomy,
    nextRevisionIntent: deliveryScorecard?.recommendedNextRevision?.join(" ") || "Proceed with production and record assumptions.",
    feedbackTemplate: [
      "The part that misses expectations most is:",
      "The reference style/page it should move toward is:",
      "Content or wording that must stay:",
      "Content that may be reduced:",
      "Next revision priority: structure / style / assets / data / slide count / output format"
    ]
  };
}

function defaultConfirmationBrief({ title, guidedBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle }) {
  return `# Confirmation Brief

- Project: ${title}
- Scenario: ${guidedBrief?.scenario || "to confirm"}
- Audience: ${guidedBrief?.audience || "to confirm"}
- Purpose: ${guidedBrief?.purpose || "to confirm"}
- Core message: ${guidedBrief?.coreMessage || "to confirm"}
- Content sources: ${(guidedBrief?.contentSources || []).join(", ") || "to confirm"}
- Slide count / structure: ${guidedBrief?.slideCount || "to confirm"}; ${guidedBrief?.outlinePreference || "to confirm"}
- Reference style: ${referenceStyle?.selectedDirection || "financial-steady"}
- Output format: ${(guidedBrief?.outputFormat || []).join(", ") || "editable PPTX default"}
- Expectation risk: ${expectationFit?.riskLevel || "unknown"} / ${expectationFit?.score ?? 0}%
- Source confidence: ${sourceConfidence?.level || "unknown"}
- Next step: ${(deliveryScorecard?.recommendedNextRevision || []).join("; ") || "Production may start after recording assumptions."}
`;
}

function defaultImageAcceptance() {
  return {
    required: true,
    defaultPolicy: "AI images are for no-text hero visuals, atmosphere, micro-assets, and textures; factual imagery uses official/user-provided sources first.",
    targetSlides: ["cover", "section divider", "process / roadmap", "metric accent", "closing"],
    replacementRule: "If an image is unrealistic, contains text, has broken logo/IP, or is unrelated, replace it with editable shapes, official imagery, or a clean no-image layout."
  };
}

const roleRecipeMap = {
  anchor: ["cover_brand", "cover_brand.hero_left_visual", "generated-background | no-text | 16:9"],
  context: ["statement_plus_evidence", "statement_plus_evidence.left_rule_panel", "subtle-pattern | no-text | 16:9"],
  evidence: ["evidence_board", "evidence_board.source_table", "none"],
  comparison: ["comparison_matrix", "comparison_matrix.two_column_delta", "none"],
  process: ["process_flow", "process_flow.horizontal_steps", "generated-process-accent | no-text | 16:9"],
  benefit: ["metric_panel", "metric_panel.large_number_strip", "generated-metric-accent | no-text | 16:9"],
  risk: ["risk_callout", "risk_callout.qa_stack", "none"],
  action: ["action_roadmap", "action_roadmap.owner_timeline", "schematic | no-text | 16:9"],
  closing: ["closing_commitment", "closing_commitment.brand_tail", "generated-background | no-text | 16:9"]
};

function cleanSourceLine(value) {
  return String(value || "")
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*+]\s*/, "")
    .replace(/^\d+[、.)．]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSourceClaims(sourceText) {
  const claims = [];
  String(sourceText || "").split(/\r?\n/).forEach((raw, index) => {
    const line = cleanSourceLine(raw);
    if (!line) return;
    claims.push({
      id: `S${String(claims.length + 1).padStart(3, "0")}`,
      sourceLine: index + 1,
      text: line.slice(0, 180)
    });
  });
  if (!claims.length) claims.push({ id: "S001", sourceLine: 1, text: "Ultimate PPT Master handoff" });
  return claims.slice(0, 80);
}

function inferDeckRole(index, total, text) {
  const value = String(text || "").toLowerCase();
  if (index === 0) return "anchor";
  if (index === total - 1) return "closing";
  if (/流程|路径|步骤|办理|申请|开通|推进|process|workflow|step/.test(value)) return "process";
  if (/权益|数字|指标|数据|结果|kpi|metric|benefit|效率|触达/.test(value)) return "benefit";
  if (/风险|提醒|边界|问题|疑问|注意|risk|issue|caveat/.test(value)) return "risk";
  if (/对比|比较|差异|原流程|新流程|compare|comparison|before|after/.test(value)) return "comparison";
  if (/计划|行动|下一步|落地|安排|owner|action|roadmap|复盘/.test(value)) return "action";
  if (index === 1) return "context";
  return "evidence";
}

function chunkClaims(claims, target) {
  const body = claims.slice(1);
  const usableBody = body.length ? body : claims;
  const bodySlots = Math.max(1, target - 2);
  const chunkSize = Math.max(1, Math.ceil(usableBody.length / bodySlots));
  const chunks = [claims.slice(0, 1)];
  for (let index = 0; index < usableBody.length && chunks.length < target - 1; index += chunkSize) {
    chunks.push(usableBody.slice(index, index + chunkSize));
  }
  while (chunks.length < target - 1) chunks.push(usableBody.slice(-1));
  chunks.push(claims.slice(-1));
  return chunks.slice(0, target);
}

function roleIntent(role) {
  return {
    anchor: "Set the first-page signal and delivery context.",
    context: "State the main judgment and frame the problem.",
    evidence: "Tie claims to source-backed evidence.",
    comparison: "Make the before/after or option tradeoff explicit.",
    process: "Show the service or execution flow as editable steps.",
    benefit: "Surface editable numbers, units, and conditions.",
    risk: "Keep caveats and operating boundaries visible.",
    action: "Convert analysis into owners, timing, and next moves.",
    closing: "Close with the delivery check and next step."
  }[role] || "Clarify the page job.";
}

function buildDeckIR({ title, sourceText, outputMode, qualityGate }) {
  const claims = buildSourceClaims(sourceText);
  const target = Math.max(4, Math.min(8, claims.length + 2));
  const chunks = chunkClaims(claims, target);
  const slides = chunks.map((chunk, index) => {
    const role = inferDeckRole(index, chunks.length, chunk.map((item) => item.text).join(" "));
    const [layoutFamily, recipeId, visualLayer] = roleRecipeMap[role] || roleRecipeMap.evidence;
    const bodyRole = ["context", "evidence", "comparison", "process", "benefit", "risk", "action"].includes(role);
    return {
      page: `P${String(index + 1).padStart(2, "0")}`,
      slideId: `P${String(index + 1).padStart(2, "0")}`,
      role,
      title: role === "anchor" ? title : role === "closing" ? "Delivery review and next step" : String(chunk[0]?.text || title).slice(0, 44),
      intent: roleIntent(role),
      recipeId,
      layoutFamily,
      evidenceRefs: chunk.map((item) => item.id),
      visualLayer,
      rasterPolicy: bodyRole ? "prohibited-formal-body" : role === "anchor" ? "allowed-cover" : "allowed-section-tail",
      editabilityTarget: role === "process" ? "editable process nodes, connectors, labels, and notes" : "editable text, shapes, evidence captions, and speaker notes",
      speakerIntent: roleIntent(role)
    };
  });
  const createdAt = new Date().toISOString();
  const storyboard = {
    deckIRVersion: "1.0",
    createdAt,
    planningMode: "fallback-rule-planner",
    delivery: {
      outputMode,
      qualityGate: qualityGate?.level || "formal-business"
    },
    referenceStyle: {
      mode: "none",
      functionalTypes: [],
      layoutFamilies: []
    },
    pipeline: [
      "source.md/extracted-source.md",
      "DeckIR/storyboard",
      "page recipes/reference style",
      "editable PPTX or Web Deck",
      "rendered review",
      "human/agent revision"
    ],
    slides
  };
  const sourceMap = {
    version: "source-map-v1",
    createdAt,
    source: "extracted-source.md",
    claims,
    slideEvidence: slides.map((slide) => ({ slideId: slide.slideId, page: slide.page, evidenceRefs: slide.evidenceRefs }))
  };
  const planningReport = {
    version: "planning-report-v1",
    status: "planned",
    createdAt,
    provider: {
      configured: false,
      mode: "fallback-rule-planner",
      fallbackReason: "Bridge handoff wrote deterministic DeckIR without requiring model credentials."
    },
    summary: {
      slides: slides.length,
      roles: [...new Set(slides.map((slide) => slide.role))].sort(),
      layoutFamilies: [...new Set(slides.map((slide) => slide.layoutFamily))].sort(),
      evidenceClaims: claims.length
    }
  };
  return { storyboard, sourceMap, planningReport };
}

function slideTaskQuestion(role) {
  return {
    anchor: "What must the audience remember first?",
    context: "Why does this matter now?",
    evidence: "What evidence proves this claim?",
    comparison: "How visible should the difference be?",
    process: "Can the audience follow the steps afterward?",
    benefit: "Is the value, benefit, or key metric immediately visible?",
    risk: "Are boundaries, risks, and uncertainty clear?",
    action: "Who does what by when?",
    closing: "What action should the audience take next?"
  }[role] || "What job does this slide do?";
}

function slideTaskJob(role) {
  return {
    anchor: "establish-topic-and-core-message",
    context: "explain-why-this-matters",
    evidence: "prove-the-claim",
    comparison: "show-the-difference",
    process: "make-the-path-actionable",
    benefit: "highlight-the-value",
    risk: "surface-caveats-and-boundaries",
    action: "turn-insight-into-next-steps",
    closing: "reinforce-decision-or-call-to-action"
  }[role] || "support-the-story";
}

function decorateDeckIRV52(deckIRPayload, { referenceStyle, sourceConfidence, deliveryScorecard, imageAcceptance }) {
  if (!deckIRPayload?.storyboard) return deckIRPayload;
  deckIRPayload.storyboard.schemaVersion = "v5.2-brief-v1";
  deckIRPayload.storyboard.referenceStyle = referenceStyle;
  deckIRPayload.storyboard.sourceConfidence = sourceConfidence;
  deckIRPayload.storyboard.deliveryScorecard = deliveryScorecard;
  deckIRPayload.storyboard.imageAcceptance = imageAcceptance;
  deckIRPayload.storyboard.slides = (deckIRPayload.storyboard.slides || []).map((slide) => ({
    ...slide,
    slideTask: {
      job: slideTaskJob(slide.role),
      primaryQuestion: slideTaskQuestion(slide.role),
      oneSentenceTakeaway: slide.intent || slide.speakerIntent || "",
      bestLayoutFamily: slide.layoutFamily,
      mustStayEditable: slide.rasterPolicy === "prohibited-formal-body",
      evidenceRefs: slide.evidenceRefs || []
    }
  }));
  return deckIRPayload;
}

function createPendingReviewFindings({ title, storyboard }) {
  return {
    version: "rendered-review-v1",
    title,
    status: "pending",
    createdAt: new Date().toISOString(),
    summary: {
      findingCount: 0,
      autoFixableCount: 0,
      repairCandidateCount: 0,
      slidesPlanned: Array.isArray(storyboard?.slides) ? storyboard.slides.length : 0
    },
    findings: [],
    repairCandidates: []
  };
}

function createPendingRepairPlan({ title }) {
  return {
    version: "review-repair-plan-v1",
    title,
    status: "pending",
    createdAt: new Date().toISOString(),
    mode: "safe-only",
    dryRunDefault: true,
    candidateCount: 0,
    safeCandidateCount: 0,
    revisionBrief: "revision-brief.md",
    dryRunCommand: "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run",
    applyCommand: "python3 scripts/apply_review_plan.py <project_path> --safe-only --apply",
    candidates: [],
    summary: {
      candidateCount: 0,
      safeCandidateCount: 0,
      targetArtifacts: []
    },
    guardrails: [
      "Do not change source.md, extracted-source.md, or factual slide claims automatically.",
      "Only write DeckIR, project brief, quality report, and Agent instruction hints.",
      "Require an explicit --apply invocation for any mutation."
    ]
  };
}

function pendingRevisionBrief({ title }) {
  return `# v4.3 Rendered Review Revision Brief

Project: ${title}
Status: pending

Run \`python3 scripts/review_rendered_deck.py <project_path>\` after preview/export, then inspect \`repair-plan.json\`.

Use \`python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run\` first. This file is replaced with actionable low-risk planning hints only after explicit \`--apply\`.

Do not rewrite source facts, business conclusions, or final body copy automatically.
`;
}

function defaultQualityGate() {
  return {
    level: "formal-business",
    requiredInputs: [
      "visualBrief / guidedBrief / expectationFit with user tags, background, assumptions, and guided-intake readiness",
      "brand assets or explicit fallback strategy",
      "traceable source evidence",
      "ChatGPT-generation-first visual asset plan with prompts, filenames, and insertion targets",
      "small reusable element kit plan for section dividers, metric badges, process nodes, connectors, and icons",
      "public asset search plan for evidence/official references or explicit no-search rationale",
      "image/chart plan or explicit no-image strategy",
      "page rhythm and infographic strategy"
    ],
    acceptanceCriteria: [
      "do not build the whole deck from headings and repeated cards only",
      "ChatGPT/OpenAI is treated as the primary visual asset engine for custom supporting visuals",
      "small generated micro-assets are planned in visual-element-kit.md and reused across the deck",
      "generated assets are stored under assets/generated and listed in asset-plan.md",
      "public web asset searches are limited to evidence, official references, or brand boundaries and record source URLs, licensing notes, and insertion targets",
      "PPTX keeps real editable text, shapes, charts, and notes",
      "Web Deck has a complete visual system, layout variety, and desktop/mobile readability",
      "logo must not degrade into text fragments",
      "run formal delivery audit and Design Doctor before delivery"
    ],
    artifactChecks: [
      "manifest.json contains formal-business qualityGate",
      "project-brief.json contains briefMode, visualBrief, guidedBrief, and expectationFit",
      "storyboard.json and source-map.json contain DeckIR page roles, recipes, evidence refs, raster policy, and editability targets",
      "HTML/PPTX expose enough layout types",
      "real image/brand assets are used or no-image strategy is explicit",
      "asset-plan.md records public searches, generated assets, citations, and insert targets",
      "visual-element-kit.md records the reusable ChatGPT-generated micro-assets",
      "PPTX contains editable text objects",
      "no b/c-style logo text fragments"
    ],
    reviewCommands: [
      "python3 scripts/audit_storyboard.py <project_path>",
      "python3 scripts/audit_formal_delivery.py <project_path>",
      "python3 scripts/review_rendered_deck.py <project_path>",
      "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run"
    ],
    assetStrategy: {
      mode: "chatgpt-generation-first",
      brand: "Use approved brand assets when supplied; otherwise use a clean text fallback and document it in asset-plan.md.",
      primaryEngine: "Use ChatGPT/OpenAI image generation as the default visual asset engine for custom scenes, backgrounds, icons, badges, separators, process nodes, and decorative data elements.",
      microAssets: "Generate a small reusable visual element kit before final slide production and insert those assets consistently across PPTX/Web Deck pages.",
      publicSearch: "Use public web search mainly for evidence, official references, and brand boundaries; record source URL, license or usage note, and insertion target.",
      generatedAssets: "Store ChatGPT/OpenAI generated assets under assets/generated, cite the prompt plus target slide, and avoid full-slide screenshots for editable PPTX.",
      images: "Use generated or supplied visual assets for formal delivery when helpful; if no imagery is appropriate, write an explicit no-image strategy."
    }
  };
}

function createPendingQualityReport({
  title,
  qualityProfile,
  qualityGate,
  workflowState,
  expectedArtifacts,
  reviewCommands,
  deckIR,
  expectationFit,
  sourceConfidence,
  deliveryScorecard,
  referenceStyle,
  feedbackLoop,
  failureTaxonomy,
  confirmationBrief,
  imageAcceptance
}) {
  return {
    version: BRIDGE_VERSION,
    schemaVersion: "v5.2-brief-v1",
    title,
    status: "pending",
    createdAt: new Date().toISOString(),
    qualityProfile,
    qualityGate,
    workflowState,
    expectationFit,
    sourceConfidence,
    deliveryScorecard,
    referenceStyle,
    feedbackLoop,
    failureTaxonomy,
    confirmationBrief,
    imageAcceptance,
    expectedArtifacts,
    reviewCommands,
    deckIR,
    reviewFindings: {
      status: "pending",
      path: "review-findings.json",
      findingCount: 0,
      repairCandidateCount: 0,
      repairPlan: "repair-plan.json"
    },
    reviewRepairPlan: {
      status: "pending",
      path: "repair-plan.json",
      candidateCount: 0,
      dryRunCommand: "python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run",
      revisionBrief: "revision-brief.md"
    },
    summary: {
      zh: "Design Doctor / 视觉复查尚未运行。请先生成预览和最终文件，再按 reviewCommands 运行检查；默认只报告问题和建议，只有明确要求时才自动修 SVG。",
      en: "Design Doctor has not run yet. Generate the preview and final files, then run reviewCommands. By default it reports issues and suggestions before automatic repair."
    },
    checks: [
      {
        id: "expectation-fit",
        status: expectationFit?.readyForProduction ? "ready" : "needs-guided-intake",
        summary: `Expectation fit ${expectationFit?.score ?? 0}%, risk ${expectationFit?.riskLevel || "unknown"}.`
      },
      {
        id: "source-confidence",
        status: sourceConfidence?.level === "strong" ? "ready" : "needs-evidence",
        summary: `Source confidence ${sourceConfidence?.level || "unknown"}; do-not-invent rules: ${(sourceConfidence?.doNotInvent || []).join(", ") || "pending"}.`
      },
      {
        id: "delivery-scorecard",
        status: deliveryScorecard?.recommendedNextRevision?.length ? "needs-review" : "ready",
        summary: deliveryScorecard?.userVisibleSummary || "Delivery scorecard pending."
      },
      {
        id: "feedback-loop",
        status: feedbackLoop?.feedbackStatus || "none",
        summary: feedbackLoop?.nextRevisionIntent || "Feedback loop pending."
      }
    ]
  };
}

function defaultAssetPlan({ title, qualityGate }) {
  const gateSummary = (qualityGate?.requiredInputs || []).map((item) => `- ${item}`).join("\n");
  return `# Asset Plan

Project: ${title}

## Required Inputs
${gateSummary || "- formal-business asset strategy pending"}

## ChatGPT Generated Assets / ChatGPT 生成素材
- [ ] Treat ChatGPT/OpenAI as the primary visual asset engine: generate custom visuals first, then use public search for evidence, official references, and brand boundaries.
- [ ] Create a reusable micro-assets pack: section dividers, metric badges, process nodes, connectors, icon accents, subtle patterns, and small callout stickers.
- [ ] Store generated bitmap assets under \`assets/generated/\` and generated SVG/icons under \`assets/generated/svg/\`.
- [ ] Record the prompt, filename, target slide, and any manual edits before inserting the asset.

## Public Asset Search / 公开素材检索
- [ ] Search the public web mainly for official references, factual evidence, brand boundaries, or source citations.
- [ ] Record each candidate with source URL, publisher, license/usage note, and intended slide or Web Deck section.
- [ ] Do not upload private source files, customer data, or internal screenshots to external services unless the user explicitly approves it.

## Insertion Targets
| Slide / Section | Need | Source or prompt | File path | Status |
| --- | --- | --- | --- | --- |
| Cover | brand-safe hero visual or approved logo treatment | pending | pending | pending |
| Evidence page | chart/photo/screenshot that supports a claim | pending | pending | pending |
| Process page | editable diagram or generated scene | pending | pending | pending |

## Delivery Rule
Every inserted image, icon, logo, screenshot, or generated visual must be listed here before final delivery. If no imagery is used, write the explicit no-image strategy here and ensure manifest.json / project-brief.json also contain it.
`;
}

function defaultVisualElementKit({ title, qualityGate }) {
  const mode = qualityGate?.assetStrategy?.mode || "chatgpt-generation-first";
  return `# Visual Element Kit

Project: ${title}
Mode: ${mode}

## Purpose
Use ChatGPT/OpenAI as the primary visual asset engine. Generate small reusable elements before final slide production so the deck has a coherent visual language without relying on random stock imagery.

## Micro-assets / 小元素素材
| Asset type | Quantity target | Use | Output path | Status |
| --- | ---: | --- | --- | --- |
| section divider | 3 | chapter breaks and transition slides | assets/generated/dividers/ | pending |
| metric badge | 6 | KPI callouts, rights/benefits numbers, scorecards | assets/generated/badges/ | pending |
| process node | 5 | flow pages, timelines, service journey diagrams | assets/generated/process/ | pending |
| connector | 6 | arrows, dotted links, handoff paths, causal chains | assets/generated/connectors/ | pending |
| icon accent | 8 | small semantic markers for evidence, risk, action, user, channel | assets/generated/icons/ | pending |
| subtle pattern or texture | 2 | cover, section backgrounds, low-contrast visual depth | assets/generated/patterns/ | pending |
| callout sticker | 4 | reminders, caveats, delivery notes, decision highlights | assets/generated/callouts/ | pending |

## Prompt Pattern
Use short, specific prompts with transparent/isolated backgrounds when possible:
- "Create a clean business presentation metric badge for [theme], flat vector-like style, transparent background, no text, colors aligned to [palette]."
- "Create a small process node icon for [step], formal government/finance presentation style, isolated object, no text, editable-friendly shape language."
- "Create a subtle abstract background texture for [theme], low contrast, no letters, no logos, widescreen presentation use."

## Insertion Rules
- Generate elements as reusable assets, then compose them with editable PPTX text/shapes.
- Do not put important text inside generated images.
- Use public search for factual evidence and official brand boundaries; use ChatGPT-generated micro-assets for visual language.
- Register every generated file in asset-plan.md with prompt, target slide, and final insertion status.
`;
}

function defaultCodexTask({
  title,
  qualityGate,
  workflowState,
  expectedArtifacts,
  reviewCommands,
  briefMode,
  expectationFit,
  sourceConfidence,
  deliveryScorecard,
  referenceStyle,
  feedbackLoop
}) {
  const gateInputs = (qualityGate?.requiredInputs || []).map((item) => `- ${item}`).join("\n");
  const gateCriteria = (qualityGate?.acceptanceCriteria || []).map((item) => `- ${item}`).join("\n");
  const gateChecks = (qualityGate?.artifactChecks || []).map((item) => `- ${item}`).join("\n");
  const artifacts = (expectedArtifacts || []).map((item) => `- ${item}`).join("\n") || "- final PPTX and/or Web Deck artifacts requested in project-brief.json";
  const commands = (reviewCommands?.length ? reviewCommands : ["python3 scripts/audit_formal_delivery.py <project_path>"]).map((item) => `- ${item}`).join("\n");
  return `# Codex Task

Project: ${title}
Current workflow step: ${workflowState?.currentStep || "handoff"}
Blocked reason: ${workflowState?.blockedReason || "none"}
Brief mode: ${briefMode || "source-first"}

## Read First
1. AGENTS.md
2. manifest.json
3. project-brief.json
4. storyboard.json
5. source-map.json
6. planning-report.json
7. review-findings.json when present
8. repair-plan.json when present
9. revision-brief.md when present
10. quality-checklist.md
11. asset-plan.md
12. visual-element-kit.md
13. agent-prompt.md
14. extracted-source.md and attachments/

## Formal Business Gate
Required inputs:
${gateInputs}

Acceptance criteria:
${gateCriteria}

Artifact checks:
${gateChecks}

## Expectation Fit and Guided Intake
- Risk level: ${expectationFit?.riskLevel || "unknown"}
- Score: ${expectationFit?.score ?? 0}%
- Source adequacy: ${expectationFit?.sourceAdequacy || "unknown"}
- Ready for production: ${expectationFit?.readyForProduction ? "yes" : "no"}
- Missing signals: ${(expectationFit?.missingSignals || []).join(", ") || "none"}

## v5.2 Expectation Contract
- Source confidence: ${sourceConfidence?.level || "unknown"}
- Do not invent: ${(sourceConfidence?.doNotInvent || []).join(", ") || "pending"}
- Reference style: ${referenceStyle?.selectedDirection || "pending"}
- Delivery summary: ${deliveryScorecard?.userVisibleSummary || "pending"}
- Feedback status: ${feedbackLoop?.feedbackStatus || "none"}

Rules:
1. Read project-brief.json briefMode, visualBrief, guidedBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, confirmationBrief, and feedbackLoop before production.
2. If readyForProduction is false, ask one coherent group of questions per turn and clarify audience, usage setting, desired action, content source, core message, slide count, visual style, brand/IP assets, output format, and must-avoid boundaries.
3. Start final-quality deck production only after the brief is clear enough or the user explicitly asks for a draft with assumptions.
4. Record user answers, assumptions, source confidence, reference style changes, feedback taxonomy, and remaining expectation risk in project-brief.json and quality-report.json.
5. If the user is unsatisfied, classify the reason with feedbackLoop.failureTaxonomy before revising; do not blindly remake the whole deck.

## Asset Workflow
1. Inspect supplied attachments and extracted-source.md before searching.
2. Treat ChatGPT/OpenAI as the primary visual asset engine: generate custom visual language before final slide production.
3. From the repository root recorded in manifest.json, run: \`python3 scripts/generate_visual_element_kit.py <project_path>\`.
4. If no IMAGE_BACKEND/OpenAI key is configured, do not block: use the Needs-Manual prompts in images/image_prompts.md with ChatGPT and save outputs to the listed paths.
5. Create the visual-element-kit.md micro-assets: section divider, metric badge, process node, connector, icon accent, subtle pattern, and callout sticker.
6. Save generated assets under assets/generated/ and insert them into the PPTX/Web Deck as real image objects, not flattened full-slide screenshots.
7. Use public web search mainly for factual evidence, official references, brand boundaries, or source citations.
8. Record every generated asset prompt, current_generation_evidence, and every public source/license note in asset_plan.json and asset-plan.md.
9. Keep charts, tables, labels, and PPTX text editable wherever possible.

## Production Steps
1. Lock brand/fallback strategy, evidence boundaries, page rhythm, infographic strategy, asset-plan.md, and visual-element-kit.md.
2. Use storyboard.json as the DeckIR page map and source-map.json as the evidence boundary before generating or revising slides.
3. Produce the requested PPTX/Web Deck using the Ultimate PPT Master Skill workflow.
4. Avoid repeated title-card pages; vary layouts across narrative, comparison, timeline/process, metric, decision, and closing pages.
5. Do not let logos degrade into b/c-style text fragments.
6. Run audit_storyboard.py before final generation and review_rendered_deck.py after preview/export.
7. Run apply_review_plan.py in --dry-run mode first; only apply safe planning hints after explicit user confirmation.
8. Update quality-report.json with checks run, issues found, repairs made, and remaining risk.

## Expected Artifacts
${artifacts}

## Review Commands
${commands}

Final response: list generated files, generated micro-assets inserted, public references used, review commands run, and any remaining risks.
`;
}

function defaultCodexAgentGuide({ qualityGate, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, feedbackLoop }) {
  const level = qualityGate?.level || "formal-business";
  return `# AGENTS.md

## Codex Local Rules
- Work in this handoff folder and the Ultimate PPT Master repository scripts only.
- Read codex-task.md before editing or generating deliverables.
- Read project-brief.json briefMode, visualBrief, guidedBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, confirmationBrief, and feedbackLoop first. Current expectationFit: ${expectationFit?.riskLevel || "unknown"} / ${expectationFit?.score ?? 0}%.
- Current sourceConfidence: ${sourceConfidence?.level || "unknown"}; do not invent: ${(sourceConfidence?.doNotInvent || []).join(", ") || "pending"}.
- Current referenceStyle: ${referenceStyle?.selectedDirection || "pending"}; delivery scorecard: ${deliveryScorecard?.userVisibleSummary || "pending"}.
- If expectationFit.readyForProduction is false, run guided intake before final production. Ask one related question group per turn until audience, setting, purpose, sources, core message, slide count, style, asset boundary, output, and must-avoid rules are clear.
- If the user is unsatisfied, classify the reason with feedbackLoop.failureTaxonomy before revising. Current feedback status: ${feedbackLoop?.feedbackStatus || "none"}.
- Read storyboard.json and source-map.json before final slide generation; they define the DeckIR page map and source evidence boundary.
- Keep private source material local. Do not upload private files, customer data, internal screenshots, or API keys unless the user explicitly approves.
- ChatGPT/OpenAI image generation is the primary visual asset engine. Read visual-element-kit.md and run or handle scripts/generate_visual_element_kit.py before final slide assembly when the deck needs visual richness.
- If no image backend/key is configured, use images/image_prompts.md Needs-Manual prompts with ChatGPT and save outputs under assets/generated/.
- Public web search is allowed mainly for evidence, official references, and brand boundaries; record sources and usage notes in asset-plan.md.
- Store generated outputs under assets/generated/ and record prompts in asset-plan.md.
- For level ${level}, do not finish with repeated title/card slides, flat PPTX screenshots, broken logo fragments, or missing quality-report.json.
- Run the formal delivery audit before final response whenever an HTML or PPTX artifact exists.
- Run audit_storyboard.py before final generation and review_rendered_deck.py after preview/export.
- Run apply_review_plan.py with --dry-run first; --apply may only write planning hints and must not rewrite source facts.
`;
}

async function stageAttachment(item, { attachmentsDir, extractedDir, attachmentCacheDir, repoRoot }) {
  const kind = item.kind || "file";
  const originalName = String(item.name || item.url || "source");
  const name = safeName(originalName);
  const extension = extname(name).toLowerCase();
  const result = {
    id: item.id || hashText(`${originalName}-${Date.now()}`).slice(0, 10),
    name,
    originalName,
    kind,
    type: item.type || "",
    size: Number(item.size || 0),
    parseStatus: "attachedOnly",
    attachmentPath: "",
    extractedPath: "",
    message: "",
    markdown: "",
    contentHash: ""
  };

  if (kind === "url") {
    result.parseStatus = "urlOnly";
    result.message = item.url || originalName;
    const outputPath = join(extractedDir, `${safeName(name || "url")}.md`);
    const conversion = runConverter({ repoRoot, input: item.url || originalName, outputPath, extension: ".url" });
    Object.assign(result, conversion);
    return result;
  }

  const attachmentPath = join(attachmentsDir, name);
  result.attachmentPath = `attachments/${name}`;
  const attachmentBuffer = item.dataBase64
    ? Buffer.from(String(item.dataBase64), "base64")
    : Buffer.from(String(item.text || ""), "utf8");
  result.contentHash = createHash("sha256").update(attachmentBuffer).digest("hex");
  await writeFile(attachmentPath, attachmentBuffer);
  const cachePath = join(attachmentCacheDir, `${result.contentHash}.md`);
  const cachedOutputPath = join(extractedDir, `${name.replace(/\.[^.]+$/, "")}.md`);
  if (existsSync(cachePath)) {
    result.parseStatus = "cacheHit";
    result.markdown = readFileSync(cachePath, "utf8");
    result.extractedPath = relativeFromProject(cachedOutputPath);
    result.message = "Reused local extraction cache by source content hash.";
    await writeFile(cachedOutputPath, result.markdown, "utf8");
    return result;
  }

  if (item.text && isTextExtension(extension)) {
    result.parseStatus = "textExtracted";
    result.extractedPath = result.attachmentPath;
    result.markdown = String(item.text);
    result.message = "Text was extracted in the browser.";
    await writeFile(cachePath, result.markdown, "utf8");
    return result;
  }

  const outputPath = join(extractedDir, `${name.replace(/\.[^.]+$/, "")}.md`);
  const conversion = runConverter({ repoRoot, input: attachmentPath, outputPath, extension });
  if (conversion.markdown) await writeFile(cachePath, conversion.markdown, "utf8");
  return { ...result, ...conversion };
}

async function writeSlideRevisionRequest(payload, { outputDir }) {
  const projectPath = resolve(String(payload?.projectPath || ""));
  const slideId = String(payload?.slideId || "").toUpperCase();
  const outputRoot = `${resolve(outputDir)}${sep}`;
  if (!projectPath.startsWith(outputRoot) || !existsSync(join(projectPath, "manifest.json"))) {
    const error = new Error("Revision project must be an existing Bridge handoff under the configured output directory.");
    error.statusCode = 400;
    throw error;
  }
  if (!/^P\d{2,3}$/.test(slideId)) {
    const error = new Error("slideId must use the stable PNN format.");
    error.statusCode = 400;
    throw error;
  }
  const requestPath = join(projectPath, "revision-requests", `${slideId}.json`);
  const requestPayload = {
    schemaVersion: "slide-revision-request-v1",
    slideId,
    variantId: String(payload?.variantId || ""),
    instruction: String(payload?.instruction || "Regenerate this slide while preserving its evidence and editable object contract."),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  await mkdir(dirname(requestPath), { recursive: true });
  await writeFile(requestPath, JSON.stringify(requestPayload, null, 2), "utf8");
  return { ok: true, projectPath, slideId, requestPath, request: requestPayload };
}

function runConverter({ repoRoot, input, outputPath, extension }) {
  const scriptMap = {
    ".pdf": "scripts/source_to_md/pdf_to_md.py",
    ".docx": "scripts/source_to_md/doc_to_md.py",
    ".doc": "scripts/source_to_md/doc_to_md.py",
    ".rtf": "scripts/source_to_md/doc_to_md.py",
    ".odt": "scripts/source_to_md/doc_to_md.py",
    ".pptx": "scripts/source_to_md/ppt_to_md.py",
    ".pptm": "scripts/source_to_md/ppt_to_md.py",
    ".xlsx": "scripts/source_to_md/excel_to_md.py",
    ".xlsm": "scripts/source_to_md/excel_to_md.py",
    ".url": "scripts/source_to_md/web_to_md.py"
  };
  const script = scriptMap[extension];
  if (!script) {
    return {
      parseStatus: "attachedOnly",
      message: "No local converter is registered for this file type."
    };
  }

  const scriptPath = join(repoRoot, script);
  if (!existsSync(scriptPath)) {
    return {
      parseStatus: "attachedOnly",
      message: `Converter missing: ${script}`
    };
  }

  const python = existsSync(join(repoRoot, ".venv", "bin", "python"))
    ? join(repoRoot, ".venv", "bin", "python")
    : "python3";
  const result = spawnSync(python, [scriptPath, input, "-o", outputPath], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8,
    timeout: 120000
  });

  if (result.status === 0 && existsSync(outputPath)) {
    const markdown = readFileSync(outputPath, "utf8");
    return {
      parseStatus: "extracted",
      extractedPath: relativeFromProject(outputPath),
      message: "Converted locally through scripts/source_to_md.",
      markdown
    };
  }

  const stderr = String(result.stderr || result.stdout || "").trim().slice(0, 600);
  return {
    parseStatus: "attachedOnly",
    message: stderr || "Local conversion failed; the original file was kept for Agent handoff."
  };
}

function relativeFromProject(filePath) {
  const parts = filePath.split(/[/\\]/);
  const extractedIndex = parts.lastIndexOf("extracted");
  if (extractedIndex >= 0) return parts.slice(extractedIndex).join("/");
  return filePath;
}

function suggestedCommands(projectPath) {
  const quotedPath = shellQuote(projectPath);
  const instruction = "Read AGENTS.md, codex-task.md, storyboard.json, source-map.json, planning-report.json, review-findings.json, repair-plan.json, revision-brief.md, visual-element-kit.md, asset_plan.json, asset-plan.md, quality-checklist.md, manifest.json, and project-brief.json first. Inspect project-brief.json briefMode, visualBrief, guidedBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, confirmationBrief, and feedbackLoop; if expectationFit.readyForProduction is false, run guided intake before final production and ask one related question group per turn. If the user is unsatisfied, classify the reason with feedbackLoop.failureTaxonomy before revising. Run or handle scripts/generate_visual_element_kit.py before deck production; if no image backend/key exists, use the Needs-Manual prompts in images/image_prompts.md with ChatGPT. Follow the Ultimate PPT Master Skill with ChatGPT-generation-first assets, keep DeckIR evidence/editability constraints, insert reusable micro-assets when useful, run audit_storyboard.py, formal delivery audit, review_rendered_deck.py, and apply_review_plan.py --safe-only --dry-run, update asset_plan.json and quality-report.json, then list final files.";
  return {
    codex: `cd ${quotedPath} && codex "${instruction}"`,
    claude: `cd ${quotedPath} && claude "${instruction}"`,
    hermes: `cd ${quotedPath} && hermes "${instruction}"`,
    openclaw: `cd ${quotedPath} && openclaw "${instruction}"`,
    generic: `cd ${quotedPath} && printf '%s\\n' "${instruction}"`
  };
}

function launchAgent(payload, { allowLaunch }) {
  const projectPath = resolve(String(payload.projectPath || ""));
  const agentId = String(payload.agent || "codex");
  const command = suggestedCommands(projectPath)[agentId] || suggestedCommands(projectPath).codex;

  if (!allowLaunch) {
    return {
      ok: true,
      launched: false,
      command,
      message: "Auto-launch is disabled. Start the bridge with `npm run bridge -- --allow-launch` to enable it."
    };
  }

  const agent = AGENT_COMMANDS[agentId] || AGENT_COMMANDS.codex;
  if (!findCommand(agent.binary)) {
    return {
      ok: false,
      launched: false,
      command,
      message: `${agent.label} command is not available on PATH.`
    };
  }

  const child = spawn(agent.binary, [agent.prompt], {
    cwd: projectPath,
    detached: true,
    stdio: "ignore"
  });
  child.unref();
  return { ok: true, launched: true, command, pid: child.pid, message: `${agent.label} launched.` };
}

function defaultHandoffReadme() {
  return "# Ultimate PPT Master handoff\n\nFor Codex, open `AGENTS.md`, `codex-task.md`, `storyboard.json`, `repair-plan.json`, `revision-brief.md`, and `visual-element-kit.md` first. Then review `asset_plan.json`, `asset-plan.md`, `agent-prompt.md`, and `extracted-source.md`, run or handle `scripts/generate_visual_element_kit.py` for ChatGPT-first visual micro-assets, use `Needs-Manual` prompts when no image key is configured, and run the suggested local Agent command from `manifest.json`.\n";
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceLabel(value) {
  if (!value) return "";
  if (value === "process.env" || value === "injected") return value;
  return value.replace(os.homedir(), "~");
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s.-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64) || "ultimate-ppt-master-handoff";
}

function safeName(value) {
  const sanitized = String(value)
    .split(/[?#]/)[0]
    .split(/[/\\]/)
    .pop()
    ?.replace(/[^\w.\-()\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sanitized || "source";
}

function isTextExtension(extension) {
  return [".md", ".markdown", ".txt", ".csv", ".json", ".html", ".htm"].includes(extension);
}

function hashText(value) {
  return createHash("sha256").update(value).digest("hex");
}

function shellEscape(value) {
  return String(value).replace(/'/g, "'\\''");
}

function shellQuote(value) {
  return `'${shellEscape(value)}'`;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    if (arg === "--allow-launch") options.allowLaunch = true;
    if (arg === "--port") options.port = argv[index + 1];
    if (arg === "--output-dir") options.outputDir = argv[index + 1];
  }
  return options;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`Ultimate PPT Master Agent Bridge v${BRIDGE_VERSION}

Usage:
  npm run bridge
  npm run bridge -- --allow-launch
  npm run bridge -- --port 43188 --output-dir ~/UltimatePPTMaster/handoffs

Safety:
  - Binds to 127.0.0.1 by default.
  - Does not return API key values.
  - Does not launch an Agent unless --allow-launch is set.
`);
    process.exit(0);
  }
  startBridge(options);
}
