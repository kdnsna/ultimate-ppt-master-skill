#!/usr/bin/env node
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { constants as fsConstants, createReadStream, existsSync, readFileSync } from "node:fs";
import { chmod, link, lstat, mkdir, open, opendir, readFile, readlink, realpath, rename, symlink, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRootForVersion = resolve(__dirname, "../..");
const DEFAULT_PORT = 43188;
const DEFAULT_HOST = "127.0.0.1";
const BRIDGE_VERSION = readPackageVersion(repoRootForVersion);
const MEBIBYTE = 1024 * 1024;
const DEFAULT_MAX_BODY_MB = 60;
const DEFAULT_MAX_ATTACHMENTS = 24;
const DEFAULT_MAX_ATTACHMENT_MB = 32;
const DEFAULT_MAX_TOTAL_ATTACHMENT_MB = 40;
const DEFAULT_MAX_ARTIFACT_SCAN_DEPTH = 4;
const DEFAULT_MAX_ARTIFACT_SCAN_ENTRIES = 256;
const DEFAULT_ARTIFACT_STABLE_AGE_MS = 1000;
const MAX_ATTACHMENT_CACHE_BYTES = 64 * MEBIBYTE;
const MANIFEST_AUTH_KEY_FILE = ".bridge-manifest.key";
const MANIFEST_AUTH_SCHEME = "upm-bridge-manifest-hmac-sha256-v1";
const MANIFEST_AUTH_SCOPE = "complete-manifest-excluding-integrity";
const ATTACHMENT_CACHE_SCHEMA = "bridge-attachment-cache-v1";
const AGENT_JOB_FILE = "agent-job.json";
const AGENT_JOB_SCHEMA_VERSION = "bridge-agent-job-v1";
const AGENT_JOB_STALE_ACCEPTED_MS = 30_000;
const AGENT_SPAWN_TIMEOUT_MS = 10_000;
const QUALITY_ARTIFACT_ALLOWLIST = new Set([
  "quality-report.json",
  "design-quality-report.md",
  "pptlint-report.json",
  "pptlint-report.html",
  "pptlint-report.md",
  "pptlint-proof.json",
  "pptx-native-object-audit.json",
  "native-object-audit.json",
  "native-object-report.json"
]);
const DELIVERABLE_EXTENSIONS = new Set([".pptx", ".html", ".htm", ".pdf", ".zip", ".tar", ".gz", ".tgz"]);

const AGENT_COMMANDS = {
  codex: {
    label: "Codex",
    binary: "codex",
    prompt: "Read AGENTS.md, agent-prompt.md, codex-task.md, project-brief.json, asset_plan.json, asset-plan.md, and visual-element-kit.md first, including sourceConfidence, deliveryScorecard, referenceStyle, confirmationBrief, and feedbackLoop. If attachments/pptlint-repair-plan.json exists, use the fast Existing PPTX Repair Mode before the normal generation workflow: do not import/re-export the whole deck through Artifact Tool or SVG; use only a native package-preserving object editor, otherwise stop immediately with short PowerPoint/WPS steps and do not generate a repaired PPTX. Repair only selected slides, lock exact text, numbers, slide count, order, links, and all unselected slides. Any actual edit must be rendered in PowerPoint/WPS/LibreOffice and visually compared before PPTLint proof can support a success claim. If expectationFit.readyForProduction is false, run guided intake before final production. For net-new deck production, run or handle scripts/generate_visual_element_kit.py; if no image key is configured, use the Needs-Manual prompts. Execute the ChatGPT-generation-first formal-business workflow. Write each final artifact to a .partial name and atomically rename it only after completion; set quality-report.json to passed only after binding every passed final artifact by project-relative path, SHA-256, and size. Update asset_plan.json and asset-plan.md, then list final files."
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

function optionalSessionId(value) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") throw requestError("sessionId must be a string.");
  const sessionId = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(sessionId)) {
    throw requestError("sessionId must be 1-128 safe identifier characters.");
  }
  return sessionId;
}

function projectSessionId(payload) {
  const projectBrief = typeof payload?.projectBrief === "string"
    ? parseJsonMaybe(payload.projectBrief)
    : payload?.projectBrief || {};
  const taskContext = payload?.taskContext && typeof payload.taskContext === "object"
    ? payload.taskContext
    : projectBrief?.taskContext && typeof projectBrief.taskContext === "object"
      ? projectBrief.taskContext
      : {};
  const values = [
    payload?.sessionId,
    projectBrief?.sessionId,
    payload?.deckSession?.sessionId,
    projectBrief?.deckSession?.sessionId,
    taskContext?.sessionId,
    taskContext?.deckSession?.sessionId,
    taskContext?.storyboard?.sessionId
  ].map(optionalSessionId).filter(Boolean);
  const unique = [...new Set(values)];
  if (unique.length > 1) throw requestError("Conflicting sessionId values were supplied for the same project.");
  return unique[0] || `session-${randomUUID()}`;
}

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new TypeError(`${label} must be a positive finite number.`);
  }
  return number;
}

function byteLimit(options, { bytesKey, mbKey, envKey, defaultMb }) {
  if (options[bytesKey] !== undefined) {
    const bytes = positiveNumber(options[bytesKey], bytesKey);
    if (!Number.isSafeInteger(bytes)) throw new TypeError(`${bytesKey} must be a positive safe integer.`);
    return bytes;
  }
  let bytes;
  if (options[mbKey] !== undefined) {
    bytes = Math.floor(positiveNumber(options[mbKey], mbKey) * MEBIBYTE);
  } else {
    bytes = Math.floor(positiveNumber(process.env[envKey] ?? defaultMb, envKey) * MEBIBYTE);
  }
  if (!Number.isSafeInteger(bytes) || bytes < 1) {
    throw new TypeError(`${mbKey} must resolve to at least one safe byte.`);
  }
  return bytes;
}

function countLimit(options, { optionKey, envKey, defaultValue }) {
  const value = positiveNumber(options[optionKey] ?? process.env[envKey] ?? defaultValue, optionKey);
  if (!Number.isSafeInteger(value)) throw new TypeError(`${optionKey} must be a positive safe integer.`);
  return value;
}

function nonNegativeIntegerLimit(options, { optionKey, envKey, defaultValue }) {
  const value = Number(options[optionKey] ?? process.env[envKey] ?? defaultValue);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${optionKey} must be a non-negative safe integer.`);
  }
  return value;
}

export function createBridgeServer(options = {}) {
  const repoRoot = options.repoRoot ? resolve(options.repoRoot) : resolve(__dirname, "../..");
  const homeDir = options.homeDir ? resolve(options.homeDir) : os.homedir();
  const outputDir = resolve(options.outputDir || process.env.UPM_BRIDGE_OUTPUT_DIR || join(os.homedir(), "UltimatePPTMaster", "handoffs"));
  const allowLaunch = Boolean(options.allowLaunch);
  const limits = Object.freeze({
    maxBodyBytes: byteLimit(options, {
      bytesKey: "maxBodyBytes",
      mbKey: "maxBodyMb",
      envKey: "UPM_BRIDGE_MAX_MB",
      defaultMb: DEFAULT_MAX_BODY_MB
    }),
    maxAttachments: countLimit(options, {
      optionKey: "maxAttachments",
      envKey: "UPM_BRIDGE_MAX_ATTACHMENTS",
      defaultValue: DEFAULT_MAX_ATTACHMENTS
    }),
    maxAttachmentBytes: byteLimit(options, {
      bytesKey: "maxAttachmentBytes",
      mbKey: "maxAttachmentMb",
      envKey: "UPM_BRIDGE_MAX_ATTACHMENT_MB",
      defaultMb: DEFAULT_MAX_ATTACHMENT_MB
    }),
    maxTotalAttachmentBytes: byteLimit(options, {
      bytesKey: "maxTotalAttachmentBytes",
      mbKey: "maxTotalAttachmentMb",
      envKey: "UPM_BRIDGE_MAX_TOTAL_ATTACHMENT_MB",
      defaultMb: DEFAULT_MAX_TOTAL_ATTACHMENT_MB
    }),
    maxArtifactScanDepth: countLimit(options, {
      optionKey: "maxArtifactScanDepth",
      envKey: "UPM_BRIDGE_MAX_ARTIFACT_SCAN_DEPTH",
      defaultValue: DEFAULT_MAX_ARTIFACT_SCAN_DEPTH
    }),
    maxArtifactScanEntries: countLimit(options, {
      optionKey: "maxArtifactScanEntries",
      envKey: "UPM_BRIDGE_MAX_ARTIFACT_SCAN_ENTRIES",
      defaultValue: DEFAULT_MAX_ARTIFACT_SCAN_ENTRIES
    }),
    artifactStableAgeMs: nonNegativeIntegerLimit(options, {
      optionKey: "artifactStableAgeMs",
      envKey: "UPM_BRIDGE_ARTIFACT_STABLE_AGE_MS",
      defaultValue: DEFAULT_ARTIFACT_STABLE_AGE_MS
    })
  });
  const { maxBodyBytes } = limits;
  const envSnapshot = loadEnvironment(repoRoot, options.env);
  const agentSpawner = options.agentSpawner || spawn;
  const agentCommandResolver = options.agentCommandResolver || findCommand;
  const agentRuntimeJobs = new Map();
  const artifactHashCache = new Map();
  let manifestSigningKeyPromise;
  const manifestSigningKey = () => {
    manifestSigningKeyPromise ||= loadOrCreateManifestSigningKey(outputDir);
    return manifestSigningKeyPromise;
  };

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
      if (client.sessionId && client.sessionId !== payload.sessionId) continue;
      if (!client.response.destroyed) client.response.write(frame);
    }
    return payload;
  };

  const server = createServer(async (request, response) => {
    const origin = request.headers.origin;
    const corsHeaders = corsForOrigin(origin);
    let requestSessionId = "";

    if (request.method === "OPTIONS") {
      writeJson(response, 204, {}, corsHeaders);
      return;
    }

    try {
      if (request.method === "POST") {
        assertAllowedOrigin(origin);
        assertJsonContentType(request);
      }
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      if (request.method === "GET" && requestUrl.pathname === "/events") {
        const sessionId = optionalSessionId(requestUrl.searchParams.get("sessionId"));
        response.writeHead(200, {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no"
        });
        response.write(": Ultimate PPT Master Bridge progress stream\n\n");
        const client = { response, sessionId };
        eventClients.add(client);
        const connected = {
          id: `bridge-${String(++eventSequence).padStart(5, "0")}`,
          type: "connected",
          phase: "intake",
          progress: 0,
          message: "Bridge event stream connected.",
          timestamp: new Date().toISOString(),
          ...(sessionId ? { sessionId } : {})
        };
        response.write(`id: ${connected.id}\ndata: ${JSON.stringify(connected)}\n\n`);
        request.on("close", () => eventClients.delete(client));
        return;
      }

      if (request.method === "GET" && request.url === "/health") {
        const health = await buildHealth({ repoRoot, homeDir, outputDir, allowLaunch, envSnapshot, limits });
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

      if (request.method === "GET" && requestUrl.pathname === "/projects/artifacts/file") {
        const result = await resolveProjectArtifact({
          outputDir,
          projectPath: requestUrl.searchParams.get("projectPath"),
          artifact: requestUrl.searchParams.get("artifact"),
          manifestSigningKey: await manifestSigningKey(),
          artifactLimits: limits,
          artifactHashCache
        });
        streamProjectArtifact(response, result, corsHeaders);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/projects/artifacts") {
        const project = await resolveHandoffProject({
          outputDir,
          projectPath: requestUrl.searchParams.get("projectPath"),
          manifestSigningKey: await manifestSigningKey()
        });
        const result = await listProjectArtifacts(project, limits, artifactHashCache);
        writeJson(response, 200, {
          ok: true,
          projectPath: project.projectPath,
          artifacts: result.artifacts,
          scan: result.scan
        }, corsHeaders);
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/agent/status") {
        const project = await resolveHandoffProject({
          outputDir,
          projectPath: requestUrl.searchParams.get("projectPath"),
          manifestSigningKey: await manifestSigningKey()
        });
        const result = await readObservableAgentStatus(project, { agentRuntimeJobs });
        writeJson(response, 200, result, corsHeaders);
        return;
      }

      if (request.method === "POST" && ["/handoff", "/projects/create"].includes(requestUrl.pathname)) {
        const body = await readJsonBody(request, maxBodyBytes);
        requestSessionId = projectSessionId(body);
        const projectPayload = { ...body, sessionId: requestSessionId };
        publishEvent({ sessionId: requestSessionId, type: "phase", phase: "generating", progress: 10, message: "Receiving handoff and source material." });
        publishEvent({ sessionId: requestSessionId, type: "artifact", phase: "generating", progress: 35, message: "Planning storyboard and project artifacts." });
        const result = await writeHandoffProject(projectPayload, {
          repoRoot,
          outputDir,
          attachmentLimits: limits,
          getManifestSigningKey: manifestSigningKey
        });
        publishEvent({
          sessionId: requestSessionId,
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
        const result = await writeSlideRevisionRequest(body, {
          outputDir,
          manifestSigningKey: await manifestSigningKey()
        });
        requestSessionId = result.sessionId || "";
        publishEvent({
          ...(requestSessionId ? { sessionId: requestSessionId } : {}),
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
        const result = await launchAgent(body, {
          allowLaunch,
          outputDir,
          manifestSigningKey: await manifestSigningKey(),
          agentSpawner,
          agentCommandResolver,
          agentRuntimeJobs
        });
        writeJson(response, result.ok ? 200 : result.statusCode || 502, result, corsHeaders);
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
        ...(requestSessionId ? { sessionId: requestSessionId } : {}),
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
    for (const client of eventClients) client.response.end();
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

async function buildHealth({ repoRoot, homeDir, outputDir, allowLaunch, envSnapshot, limits }) {
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
      ...limits,
      maxBodyMb: limits.maxBodyBytes / MEBIBYTE,
      maxAttachmentMb: limits.maxAttachmentBytes / MEBIBYTE,
      maxTotalAttachmentMb: limits.maxTotalAttachmentBytes / MEBIBYTE
    }
  };
}

function isAllowedOrigin(origin) {
  return !origin
    || origin === "https://kdnsna.github.io"
    || /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origin);
}

function assertAllowedOrigin(origin) {
  if (!isAllowedOrigin(origin)) {
    throw requestError("Origin is not allowed to perform Bridge actions.", 403);
  }
}

function assertJsonContentType(request) {
  const mediaType = String(request.headers["content-type"] || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json") {
    throw requestError("POST requests must use Content-Type: application/json.", 415);
  }
}

function corsForOrigin(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  if (!origin) return headers;

  if (isAllowedOrigin(origin)) {
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
    let settled = false;
    let tooLarge = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      rejectPromise(error);
    };
    request.on("data", (chunk) => {
      size += chunk.length;
      if (!tooLarge && size > maxBodyBytes) {
        tooLarge = true;
        chunks.length = 0;
        rejectOnce(requestError(
          `Request body exceeds ${maxBodyBytes} bytes (${(maxBodyBytes / MEBIBYTE).toFixed(6)} MiB).`,
          413
        ));
        request.resume();
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge || settled) return;
      try {
        const text = Buffer.concat(chunks).toString("utf8") || "{}";
        const parsed = JSON.parse(text);
        settled = true;
        resolvePromise(parsed);
      } catch {
        rejectOnce(requestError("Expected JSON body."));
      }
    });
    request.on("error", rejectOnce);
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

async function createUniqueProjectDirectory(outputDir, slug, timestamp) {
  await mkdir(outputDir, { recursive: true });
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = join(outputDir, `${slug}-${timestamp}-${randomUUID()}`);
    try {
      await mkdir(candidate, { mode: 0o700 });
      return candidate;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  }
  throw new Error("Could not allocate a unique Bridge handoff directory.");
}

function validateProjectRelativePath(relativePath, policy = {}) {
  const value = String(relativePath ?? "");
  if (
    !value.trim()
    || value.includes("\0")
    || value.includes("\\")
    || isAbsolute(value)
    || /^[A-Za-z]:\//.test(value)
  ) {
    throw requestError("Project file path must be a safe project-relative path.");
  }
  const segments = value.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw requestError("Project file path traversal is not allowed.");
  }
  if (policy.prefix && segments[0] !== policy.prefix) {
    throw requestError(`Project file path must stay under ${policy.prefix}/.`);
  }
  if (policy.directChild && segments.length !== (policy.prefix ? 2 : 1)) {
    throw requestError("Project file path must point to a direct child file.");
  }
  if (Array.isArray(policy.extensions)) {
    const allowedExtensions = policy.extensions.map((extension) => String(extension).toLowerCase());
    if (!allowedExtensions.includes(extname(segments.at(-1)).toLowerCase())) {
      throw requestError(`Project file path must use one of: ${allowedExtensions.join(", ")}.`);
    }
  }
  return { value, segments };
}

async function assertNoSymlinkSegments(projectPath, targetPath) {
  const root = resolve(projectPath);
  let rootStats;
  try {
    rootStats = await lstat(root);
  } catch {
    throw requestError("Bridge handoff root must exist before writing project files.");
  }
  if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
    throw requestError("Bridge handoff root must be a real directory, not a symlink.");
  }

  const pathSegments = relative(root, targetPath).split(sep).filter(Boolean);
  let currentPath = root;
  for (let index = 0; index < pathSegments.length; index += 1) {
    currentPath = join(currentPath, pathSegments[index]);
    let stats;
    try {
      stats = await lstat(currentPath);
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
    if (stats.isSymbolicLink()) {
      throw requestError("Project file writes cannot traverse symbolic links.");
    }
    if (index < pathSegments.length - 1 && !stats.isDirectory()) {
      throw requestError("Project file parent path must be a directory.");
    }
  }
}

async function resolveSafeProjectRelativePath(projectPath, relativePath, policy = {}) {
  const { segments } = validateProjectRelativePath(relativePath, policy);
  const root = resolve(projectPath);
  const target = resolve(root, ...segments);
  if (!isNestedPath(root, target)) {
    throw requestError("Project file path must stay inside the Bridge handoff.");
  }
  await assertNoSymlinkSegments(root, target);
  return target;
}

function decodeStrictBase64(value, attachmentName) {
  if (typeof value !== "string") {
    throw requestError(`Attachment ${attachmentName} dataBase64 must be a string.`);
  }
  if (!value) return Buffer.alloc(0);
  const validBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (value.length % 4 !== 0 || !validBase64.test(value)) {
    throw requestError(`Attachment ${attachmentName} contains invalid base64 data.`);
  }
  const decoded = Buffer.from(value, "base64");
  const canonical = value.replace(/=+$/, "");
  if (decoded.toString("base64").replace(/=+$/, "") !== canonical) {
    throw requestError(`Attachment ${attachmentName} contains non-canonical base64 data.`);
  }
  return decoded;
}

function prepareAttachments(rawAttachments, limits) {
  if (rawAttachments === undefined || rawAttachments === null) return [];
  if (!Array.isArray(rawAttachments)) {
    throw requestError("attachments must be an array.");
  }
  if (rawAttachments.length > limits.maxAttachments) {
    throw requestError(`Attachment count exceeds the limit of ${limits.maxAttachments}.`, 413);
  }

  let totalBytes = 0;
  return rawAttachments.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw requestError(`Attachment ${index + 1} must be an object.`);
    }
    const kind = String(item.kind || (item.url ? "url" : "file"));
    const attachmentName = String(item.name || item.url || `attachment-${index + 1}`);
    if (kind === "url") {
      let sourceUrl;
      try {
        sourceUrl = new URL(String(item.url || ""));
      } catch {
        throw requestError(`Attachment ${attachmentName} must contain a valid URL.`);
      }
      if (!["http:", "https:"].includes(sourceUrl.protocol)) {
        throw requestError(`Attachment ${attachmentName} URL must use http or https.`);
      }
      return {
        item: { ...item, url: sourceUrl.toString() },
        kind,
        buffer: null,
        actualSize: 0,
        contentHash: hashText(sourceUrl.toString())
      };
    }

    const hasBase64 = Object.prototype.hasOwnProperty.call(item, "dataBase64") && item.dataBase64 !== undefined;
    const buffer = hasBase64
      ? decodeStrictBase64(item.dataBase64, attachmentName)
      : Buffer.from(String(item.text ?? ""), "utf8");
    const actualSize = buffer.length;
    const hasDeclaredSize = item.size !== undefined && item.size !== null && item.size !== "";
    if (hasDeclaredSize) {
      const declaredSize = Number(item.size);
      if (!Number.isSafeInteger(declaredSize) || declaredSize < 0) {
        throw requestError(`Attachment ${attachmentName} size must be a non-negative integer.`);
      }
      if (declaredSize !== actualSize) {
        throw requestError(`Attachment ${attachmentName} declared size does not match its decoded content.`);
      }
    }
    if (actualSize > limits.maxAttachmentBytes) {
      throw requestError(
        `Attachment ${attachmentName} exceeds the per-file limit of ${limits.maxAttachmentBytes} bytes.`,
        413
      );
    }
    totalBytes += actualSize;
    if (totalBytes > limits.maxTotalAttachmentBytes) {
      throw requestError(
        `Attachments exceed the cumulative limit of ${limits.maxTotalAttachmentBytes} bytes.`,
        413
      );
    }
    return {
      item,
      kind,
      buffer,
      actualSize,
      contentHash: createHash("sha256").update(buffer).digest("hex")
    };
  });
}

function reserveUniqueFilename(requestedName, identity, usedNames) {
  const initialName = safeName(requestedName);
  const reserve = (candidate) => {
    const key = candidate.normalize("NFKC").toLowerCase();
    if (usedNames.has(key)) return false;
    usedNames.add(key);
    return true;
  };
  if (reserve(initialName)) return initialName;

  const extension = extname(initialName);
  const stem = initialName.slice(0, initialName.length - extension.length) || "source";
  for (let attempt = 1; attempt <= 1000; attempt += 1) {
    const suffix = hashText(`${identity}:${attempt}`).slice(0, 10);
    const candidate = `${stem}-${suffix}${extension}`;
    if (reserve(candidate)) return candidate;
  }
  throw new Error("Could not allocate a unique attachment filename.");
}

function normalizeTaskContext(payload, projectBrief, existingDeckSession) {
  const supplied = payload?.taskContext && typeof payload.taskContext === "object" && !Array.isArray(payload.taskContext)
    ? payload.taskContext
    : projectBrief?.taskContext && typeof projectBrief.taskContext === "object" && !Array.isArray(projectBrief.taskContext)
      ? projectBrief.taskContext
      : {};
  const task = String(
    supplied.task
      || supplied.request
      || existingDeckSession?.request
      || payload?.form?.sourceNotes
      || projectBrief?.request
      || ""
  ).trim();
  const audience = String(
    supplied.audience
      || existingDeckSession?.audience
      || payload?.form?.audience
      || projectBrief?.audience
      || ""
  ).trim();
  const coreMessage = String(
    supplied.coreMessage
      || supplied.core_message
      || existingDeckSession?.coreMessage
      || payload?.form?.coreMessage
      || projectBrief?.coreMessage
      || ""
  ).trim();
  const selectedDirectionId = String(
    supplied.selectedDirectionId
      || existingDeckSession?.selectedDirectionId
      || projectBrief?.selectedDirectionId
      || payload?.selectedDirectionId
      || ""
  ).trim();
  return {
    version: String(supplied.version || "task-context-v1"),
    title: String(supplied.title || payload?.form?.title || projectBrief?.title || "").trim(),
    task,
    audience,
    coreMessage,
    selectedDirectionId,
    storyboard: supplied.storyboard || supplied.deckSession || existingDeckSession || null
  };
}

function validDeckSessionCandidate(value) {
  return Boolean(
    value
      && typeof value === "object"
      && Array.isArray(value.slides)
      && value.slides.length >= 4
      && value.slides.length <= 24
      && value.slides.every((slide) => {
        const variants = Array.isArray(slide?.variants) ? slide.variants : [];
        return /^P\d{2,3}$/.test(String(slide?.slideId || ""))
          && variants.length > 0
          && variants.some((variant) => String(variant?.id || "") === String(slide?.selectedVariantId || ""));
      })
  );
}

function deckSessionFromTaskContext(taskContext, sessionId) {
  const storyboard = taskContext?.storyboard;
  if (validDeckSessionCandidate(storyboard)) return storyboard;
  if (!Array.isArray(storyboard)) return null;
  const candidate = {
    schemaVersion: "deck-session-v6",
    sessionId,
    request: taskContext.task,
    audience: taskContext.audience,
    coreMessage: taskContext.coreMessage,
    selectedDirectionId: taskContext.selectedDirectionId,
    slides: storyboard
  };
  return validDeckSessionCandidate(candidate) ? candidate : null;
}

function stripTaskContextFromSource(value, { title, taskContext, deckSession }) {
  const withoutStoryboard = stripGeneratedStoryboardSection(value);
  const exactTaskLines = new Set([
    taskContext?.task,
    deckSession?.request,
    taskContext?.audience ? `Audience: ${taskContext.audience}` : "",
    taskContext?.audience ? `受众：${taskContext.audience}` : "",
    taskContext?.coreMessage ? `Core message: ${taskContext.coreMessage}` : "",
    taskContext?.coreMessage ? `核心信息：${taskContext.coreMessage}` : ""
  ].map((line) => String(line || "").trim()).filter(Boolean));
  return withoutStoryboard
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (exactTaskLines.has(trimmed)) return false;
      const heading = trimmed.match(/^#\s+(.+)$/);
      return !heading || heading[1].trim() !== String(title || "").trim();
    })
    .join("\n")
    .trim();
}

function directEvidenceFromPayload(payload, context) {
  const explicitEvidence = payload?.evidenceMarkdown || payload?.evidenceSourceMarkdown || payload?.evidenceSource;
  if (typeof explicitEvidence === "string") return explicitEvidence.trim();
  return stripTaskContextFromSource(payload?.sourceMarkdown || payload?.source || "", context);
}

function verifiedEvidenceBundle(directEvidence, attachmentResults) {
  const sources = [];
  if (String(directEvidence || "").trim()) {
    sources.push({
      id: "inline-source",
      name: "source.md",
      kind: "inline",
      parseStatus: "verified",
      verified: true,
      provenance: { kind: "browser-payload" },
      markdown: String(directEvidence).trim()
    });
  }
  for (const result of attachmentResults) {
    const verifiedUrl = result.kind === "url"
      && result.ingestion === "converted"
      && result.parseStatus === "extracted"
      && Boolean(result.markdown)
      && Boolean(result.provenance?.url);
    const verifiedFile = result.kind !== "url"
      && Boolean(result.markdown)
      && ["textExtracted", "cacheHit", "extracted"].includes(result.parseStatus);
    sources.push({
      id: result.id,
      name: result.name,
      kind: result.kind,
      parseStatus: result.parseStatus,
      verified: verifiedUrl || verifiedFile,
      provenance: result.provenance || null,
      markdown: verifiedUrl || verifiedFile ? result.markdown.trim() : ""
    });
  }
  const verified = sources.filter((source) => source.verified && source.markdown);
  return {
    text: verified.map((source) => `## ${source.name}\n\n${source.markdown}`).join("\n\n").trim(),
    verifiedCount: verified.length,
    pendingCount: sources.length - verified.length,
    sources: sources.map(({ markdown, ...source }) => source)
  };
}

function constrainedExpectationFit({ supplied, evidence, taskContext }) {
  const hasAudience = Boolean(taskContext?.audience);
  const hasCore = Boolean(taskContext?.coreMessage);
  const hasVerifiedEvidence = evidence.verifiedCount > 0 && Boolean(evidence.text.trim());
  const missingSignals = [];
  if (!hasAudience) missingSignals.push("missing audience");
  if (!hasCore) missingSignals.push("missing core message");
  if (!hasVerifiedEvidence) missingSignals.push("missing verified source material");
  if (!hasVerifiedEvidence && evidence.pendingCount) missingSignals.push("source ingestion pending");
  const sourceAdequacy = !hasVerifiedEvidence
    ? "no-source"
    : evidence.text.length > 220
      ? "substantive"
      : "thin";
  let score = 100 - missingSignals.length * 14 - (sourceAdequacy === "substantive" ? 0 : sourceAdequacy === "thin" ? 12 : 30);
  if (!hasVerifiedEvidence) score = Math.min(score, 49);
  score = Math.max(0, score);
  const riskLevel = !hasVerifiedEvidence ? "red" : score >= 82 ? "green" : score >= 55 ? "yellow" : "red";
  const readyForProduction = hasVerifiedEvidence && hasAudience && hasCore && riskLevel !== "red";
  return {
    ...(supplied && typeof supplied === "object" ? supplied : {}),
    riskLevel,
    score,
    sourceAdequacy,
    missingSignals,
    assumptions: Array.isArray(supplied?.assumptions) ? supplied.assumptions : [
      "Default to editable PPTX unless project-brief.json says otherwise.",
      "Only converted attachments or sources with provenance count as factual evidence.",
      "Record assumptions in quality-report.json before final delivery."
    ],
    conflicts: Array.isArray(supplied?.conflicts) ? supplied.conflicts : [],
    successCriteria: Array.isArray(supplied?.successCriteria) ? supplied.successCriteria : [
      "The deck states a clear audience, purpose, and core message before production.",
      "The final response explains which choices came from user input and which were assumptions."
    ],
    readyForProduction,
    nextQuestions: readyForProduction
      ? []
      : ["Confirm the audience and core message, then attach or convert a factual source before final production."]
  };
}

function resolvedWorkflowBlockedReason(requestedBlockedReason, hasVerifiedEvidence) {
  const blockedReason = String(requestedBlockedReason || "");
  if (!hasVerifiedEvidence) {
    return blockedReason || "real verified source required before final production";
  }
  const normalized = blockedReason.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.。]+$/, "");
  if ([
    "real source required before final production",
    "real verified source required before final production"
  ].includes(normalized)) {
    return "";
  }
  return blockedReason;
}

async function writeHandoffProject(payload, { repoRoot, outputDir, attachmentLimits, getManifestSigningKey }) {
  const projectBrief = typeof payload.projectBrief === "string" ? parseJsonMaybe(payload.projectBrief) : payload.projectBrief || {};
  const sessionId = projectSessionId(payload);
  const existingDeckSession = projectBrief.deckSession || payload.deckSession || null;
  const taskContext = normalizeTaskContext(payload, projectBrief, existingDeckSession);
  const deckSession = validateDeckSession(existingDeckSession || deckSessionFromTaskContext(taskContext, sessionId));
  const taskTitle = taskContext.task.split(/[。.!?？\n]/)[0].slice(0, 80);
  const title = payload?.form?.title || payload?.title || taskContext.title || taskTitle || "ultimate-ppt-master-handoff";
  const directEvidence = directEvidenceFromPayload(payload, { title, taskContext, deckSession });
  const bestEffectBrief = resolveBestEffectBrief({ payload, projectBrief, repoRoot, title });
  const qualityProfile = payload.qualityProfile || projectBrief.qualityProfile || {};
  const qualityGate = payload.qualityGate || projectBrief.qualityGate || defaultQualityGate();
  const requestedWorkflowState = payload.workflowState || projectBrief.workflowState || {
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
  const referenceStyle = resolveReferenceStyle({ payload, projectBrief, taskContext, deckSession, visualBrief });
  taskContext.selectedDirectionId = referenceStyle.selectedDirection;
  visualBrief.referenceStyle = referenceStyle;
  deckIR.selectedDirectionId = referenceStyle.selectedDirection;
  deckIR.referenceStyle = referenceStyle;
  const imageAcceptance = projectBrief.imageAcceptance || payload.imageAcceptance || defaultImageAcceptance();
  const assetPlanJson = payload.assetPlanJson || JSON.stringify({ version: "asset-plan-v5.4", project: title, items: [] }, null, 2);
  const promptFiles = assetPromptFiles(assetPlanJson);
  for (const promptFile of promptFiles) {
    validateProjectRelativePath(promptFile.path, {
      prefix: "prompts",
      directChild: true,
      extensions: [".md"]
    });
  }
  const preparedAttachments = prepareAttachments(payload.attachments, attachmentLimits);
  const manifestSigningKey = await getManifestSigningKey();
  const attachmentCacheDir = join(outputDir, ".cache", "attachments");
  await mkdir(attachmentCacheDir, { recursive: true });
  await assertSafeAttachmentCacheDirectory(outputDir, attachmentCacheDir);
  const slug = slugify(title);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const projectPath = await createUniqueProjectDirectory(outputDir, slug, timestamp);
  const attachmentsDir = join(projectPath, "attachments");
  const extractedDir = join(projectPath, "extracted");
  await mkdir(attachmentsDir);
  await mkdir(extractedDir);

  const files = [];
  async function writeProjectFile(relativePath, content, policy = {}) {
    const target = await resolveSafeProjectRelativePath(projectPath, relativePath, policy);
    await mkdir(dirname(target), { recursive: true });
    await assertNoSymlinkSegments(projectPath, target);
    await writeFile(target, content ?? "", "utf8");
    files.push(relativePath);
  }

  const extractedSections = [
    "# Extracted Source",
    "",
    "This file was generated by the local Agent Bridge. It combines browser notes with local extraction results when converters are available.",
    "",
    "## Browser source.md",
    "",
    directEvidence
  ];
  const attachmentResults = [];
  const usedAttachmentNames = new Set();
  const usedExtractedNames = new Set();

  for (const prepared of preparedAttachments) {
    const result = await stageAttachment(prepared, {
      projectPath,
      attachmentCacheDir,
      manifestSigningKey,
      repoRoot,
      usedAttachmentNames,
      usedExtractedNames
    });
    attachmentResults.push(result);
    if (result.markdown) {
      extractedSections.push("", `## ${result.name}`, "", result.markdown.trim());
    } else {
      extractedSections.push("", `## ${result.name}`, "", `Status: ${result.parseStatus}. ${result.message || "Kept as an attachment for the Agent."}`);
    }
  }

  const evidence = verifiedEvidenceBundle(directEvidence, attachmentResults);
  const expectationFit = constrainedExpectationFit({
    supplied: projectBrief.expectationFit || payload.expectationFit,
    evidence,
    taskContext
  });
  const computedSourceConfidence = defaultSourceConfidence({ taskContext, expectationFit, evidence });
  const suppliedSourceConfidence = projectBrief.sourceConfidence || payload.sourceConfidence;
  const sourceConfidence = {
    ...(suppliedSourceConfidence && typeof suppliedSourceConfidence === "object" ? suppliedSourceConfidence : {}),
    ...computedSourceConfidence
  };
  const deliveryScorecard = projectBrief.deliveryScorecard || payload.deliveryScorecard || defaultDeliveryScorecard({ title, expectationFit, sourceConfidence, referenceStyle });
  const feedbackLoop = projectBrief.feedbackLoop || payload.feedbackLoop || defaultFeedbackLoop({ expectationFit, sourceConfidence, deliveryScorecard });
  const failureTaxonomy = projectBrief.failureTaxonomy || payload.failureTaxonomy || feedbackLoop.failureTaxonomy;
  const confirmationBrief = projectBrief.confirmationBrief || payload.confirmationBrief || defaultConfirmationBrief({ title, guidedBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle });
  const workflowState = {
    ...requestedWorkflowState,
    blockedReason: resolvedWorkflowBlockedReason(
      requestedWorkflowState.blockedReason,
      evidence.verifiedCount > 0
    )
  };
  const briefMode = expectationFit.readyForProduction
    ? projectBrief.briefMode || payload.briefMode || "source-first"
    : "codex-guided-intake";
  const enrichedProjectBrief = {
    ...projectBrief,
    schemaVersion: projectBrief.schemaVersion || "v5.2-brief-v1",
    sessionId,
    taskContext,
    evidenceSources: evidence.sources,
    deckSession,
    bestEffectBrief,
    briefMode,
    visualBrief,
    guidedBrief,
    expectationFit,
    selectedDirectionId: referenceStyle.selectedDirection,
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

  await writeProjectFile("task-context.json", JSON.stringify(taskContext, null, 2));
  await writeProjectFile("source.md", directEvidence);
  await writeProjectFile("agent-prompt.md", payload.agentPrompt || "");
  await writeProjectFile("project-brief.json", JSON.stringify(enrichedProjectBrief, null, 2));
  await writeProjectFile("preview-web-deck.html", payload.previewWebDeckHtml || "");
  await writeProjectFile("engine-plan.md", payload.enginePlanMarkdown || payload.enginePlan || "");
  await writeProjectFile("quality-checklist.md", payload.qualityChecklist || "");
  await writeProjectFile("asset-plan.md", payload.assetPlan || defaultAssetPlan({ title, qualityGate }));
  await writeProjectFile("asset_plan.json", assetPlanJson);
  for (const promptFile of promptFiles) {
    await writeProjectFile(promptFile.path, promptFile.text, {
      prefix: "prompts",
      directChild: true,
      extensions: [".md"]
    });
  }
  await writeProjectFile("visual-element-kit.md", payload.visualElementKit || defaultVisualElementKit({ title, qualityGate }));
  await writeProjectFile("codex-task.md", payload.codexTask || defaultCodexTask({ title, qualityGate, workflowState, expectedArtifacts, reviewCommands, briefMode, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, feedbackLoop }));
  await writeProjectFile("AGENTS.md", payload.codexAgentGuide || defaultCodexAgentGuide({ qualityGate, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, feedbackLoop }));
  await writeProjectFile("README.md", payload.readme || defaultHandoffReadme());

  const extractedSource = `${extractedSections.join("\n")}\n`;
  const deckIRPayload = buildDeckIR({
    title,
    sourceText: evidence.text,
    outputMode: payload?.form?.outputMode || projectBrief.outputMode || "both",
    qualityGate,
    deckSession
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
    sessionId,
    title,
    taskContext,
    evidenceSources: evidence.sources,
    deckSession,
    bestEffectBrief,
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
    selectedDirectionId: referenceStyle.selectedDirection,
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
  manifest.integrity = createManifestIntegrity(manifest, manifestSigningKey);

  await writeProjectFile("extracted-source.md", extractedSource);
  await writeProjectFile("quality-report.json", JSON.stringify(createPendingQualityReport({ title, qualityProfile, qualityGate, workflowState, expectedArtifacts, reviewCommands, deckIR, bestEffectBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, feedbackLoop, failureTaxonomy, confirmationBrief, imageAcceptance }), null, 2));
  await writeProjectFile("manifest.json", JSON.stringify(manifest, null, 2));

  return {
    ok: true,
    sessionId,
    projectPath,
    files,
    manifest,
    storyboard: deckIRPayload.storyboard,
    sourceMap: deckIRPayload.sourceMap,
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
    .filter((item) => String(item.prompt_path || "").trim())
    .map((item) => ({ path: String(item.prompt_path), text: assetPromptText(item) }));
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

export function fallbackBestEffectRoute(text) {
  const value = String(text || "");
  const compact = value.replace(/\s+/g, "");
  const signals = [
    /(\u9762\u5411|\u7ed9|\u53d7\u4f17|audience|for\s+(the\s+)?(?:[\w-]+\s+){0,3}(team|customer|client|investor|board|students|executives?)|\u8001\u677f|\u6295\u8d44\u4eba)/i,
    /(\u573a\u666f|\u4f1a\u8bae|\u8def\u6f14|\u53d1\u5e03\u4f1a|\u590d\u76d8|workshop|meeting|offsite|launch|review|demo)/i,
    /(\u6839\u636e|\u57fa\u4e8e|\u9644\u4ef6|\u6587\u4ef6|pdf|excel|\u6570\u636e|source|attached|attachment|dataset|transcript)/i,
    /(\d+\s*(\u9875|p|slides?|pages?)|page count|\u9875\u6570)/i,
    /(\u98ce\u683c|\u89c6\u89c9|\u54c1\u724c|\u914d\u8272|style|tone|theme|density|monocle|\u79d1\u6280\u611f)/i,
    /(\u6838\u5fc3|\u7ed3\u8bba|\u4e3b\u5f20|takeaway|message|objective|goal|\u76ee\u6807|\u5fc5\u987b\u5305\u542b)/i
  ].filter((pattern) => pattern.test(value)).length;
  const promptQuality = compact.length <= 25 && signals === 0 ? "extreme-thin" : /\u6839\u636e|\u57fa\u4e8e|\u9644\u4ef6|\u6587\u4ef6|pdf|excel|\u6570\u636e|source|attached|attachment|dataset|transcript/i.test(value) && signals >= 3 ? "complete" : signals ? "thin" : "extreme-thin";
  if (/(\.pptx\b|pptx\b|powerpoint|\u53ef\u7f16\u8f91|\u6c47\u62a5|\u62a5\u544a|\u653f\u5e9c|\u91d1\u878d|\u57f9\u8bad|\u5ba1\u8ba1|\u54a8\u8be2|consulting|business report|quarterly business review|qbr|board deck|editable|revise|stakeholder|training|government|finance|audit)/i.test(value)) {
    return { prompt_quality: promptQuality, route: "formal-editable-pptx", decision: "explicit-formal-signal" };
  }
  if (/(\u7f51\u9875\s*ppt|web\s*(deck|ppt|slides?)|html|\u6a2a\u6ed1|\u6d4f\u89c8\u5668|browser|magazine|\u6742\u5fd7|editorial|e-?ink|\u7535\u5b50\u58a8\u6c34|swiss|\u745e\u58eb|keynote|showcase|demo[- ]?day)/i.test(value)) {
    return { prompt_quality: promptQuality, route: "magazine-web-deck", decision: "explicit-web-signal" };
  }
  if (promptQuality === "extreme-thin") return { prompt_quality: promptQuality, route: "guizang-web-fixed-style", decision: "extreme-thin-fallback" };
  if (promptQuality === "thin") return { prompt_quality: promptQuality, route: "staged-questions", decision: "thin-guided-intake" };
  return { prompt_quality: promptQuality, route: "source-first", decision: "complete-source-first" };
}

function runBestEffectRouter({ repoRoot, requestText }) {
  const script = join(repoRoot, "scripts", "best_effect_router.py");
  const python = existsSync(join(repoRoot, ".venv", "bin", "python")) ? join(repoRoot, ".venv", "bin", "python") : "python3";
  if (existsSync(script)) {
    const result = spawnSync(python, [script, requestText], { cwd: repoRoot, encoding: "utf8", timeout: 10000 });
    if (result.status === 0) {
      const parsed = parseJsonMaybe(result.stdout);
      if (parsed.prompt_quality && parsed.route && parsed.decision) return parsed;
    }
  }
  return fallbackBestEffectRoute(requestText);
}

function resolveBestEffectBrief({ payload, projectBrief, repoRoot, title }) {
  const supplied = projectBrief.bestEffectBrief || payload.bestEffectBrief;
  if (supplied && typeof supplied === "object") {
    return {
      ...supplied,
      decisionReason: supplied.decisionReason || "provided-by-user",
      source: supplied.source || "user"
    };
  }
  const requestText = String(
    projectBrief?.deckSession?.request
      || payload?.deckSession?.request
      || payload?.form?.sourceNotes
      || projectBrief?.sourceNotes
      || title
  ).trim();
  const routed = runBestEffectRouter({ repoRoot, requestText });
  const outputMode = String(payload?.form?.outputMode || projectBrief?.outputMode || "");
  const recommendedRoute = outputMode === "both"
    ? "dual-delivery"
    : outputMode === "web"
      ? "guizang-web-fixed-style"
      : outputMode === "pptx"
        ? "formal-editable-pptx"
        : routed.route === "formal-editable-pptx"
          ? "formal-editable-pptx"
          : "guizang-web-fixed-style";
  const strategy = routed.prompt_quality === "complete"
    ? "source-confirmed"
    : routed.prompt_quality === "extreme-thin" && recommendedRoute === "guizang-web-fixed-style"
      ? "best-effect-fixed-style"
      : "best-effect-expanded";
  return {
    version: "v5.3-best-effect-v1",
    strategy,
    promptQuality: routed.prompt_quality,
    userRequestSummary: requestText.slice(0, 320),
    recommendedRoute,
    decisionReason: `${routed.decision}${outputMode ? `; output-mode=${outputMode}` : ""}`,
    source: "auto",
    defaultStyle: recommendedRoute === "guizang-web-fixed-style" ? "Style A · 电子杂志 × 电子墨水" : "正式商务 PPTX / 微软雅黑 / 可编辑正文",
    autoExpandedBrief: [
      `主题：${title}`,
      `推荐路线：${recommendedRoute}`,
      "以用户已确认的故事板为生产合同，不重新改写页面结构。",
      "证据仅来自 source.md 和本地解析的附件，缺失时保持未就绪。"
    ],
    fixedStyleFallback: {
      trigger: "Extreme Thin Prompt Fallback when no formal editable signal is present.",
      routeName: "Style A Editorial Fixed Rhythm",
      outputMode: "Mode 2: Magazine Web Deck",
      styleName: "Style A · 电子杂志 × 电子墨水",
      pageRhythm: [],
      qualityBar: ["一页一个叙事任务", "不编造数据和来源", "可编辑交付优先"]
    },
    assumptions: ["由 Bridge 使用确定性路由器自动补齐。"],
    agentInstructions: ["先读取 bestEffectBrief 和 DeckSession，再生成或精修成品。"],
    userVisibleHint: "Bridge 已自动补齐最佳效果 brief；用户确认的故事板优先级更高。"
  };
}

const visualDirectionReferenceStyleMap = Object.freeze({
  "formal-finance": Object.freeze({
    selectedDirection: "formal-finance",
    positiveReferences: Object.freeze(["institutional editorial rhythm", "Carbon-like evidence rigor", "warm financial publishing"]),
    negativeReferences: Object.freeze(["blue SaaS card wall", "large numbers without definitions", "decorative red surfaces"]),
    styleConstraints: Object.freeze(["warm-paper or near-white cover", "asymmetric conclusion/evidence grid", "native charts and explicit sources", "rounded evidence hero panel"])
  }),
  "consulting-evidence": Object.freeze({
    selectedDirection: "consulting-evidence",
    positiveReferences: Object.freeze(["Swiss information hierarchy", "Carbon grid discipline", "decision-journal editorial"]),
    negativeReferences: Object.freeze(["three equal cards per page", "charts without conclusions", "oversized slogans instead of evidence"]),
    styleConstraints: Object.freeze(["conclusion-first hierarchy", "12-column asymmetric grid", "visible evidence rail", "vary layout families every page"])
  }),
  "brand-launch": Object.freeze({
    selectedDirection: "brand-launch",
    positiveReferences: Object.freeze(["cinematic image-first layout", "premium product whitespace", "single-typeface restraint"]),
    negativeReferences: Object.freeze(["abstract gradients instead of product evidence", "feature card wall", "full-page dark cover by default"]),
    styleConstraints: Object.freeze(["warm near-white default cover", "one dominant image per scene", "soft-edged image stages", "proof strips instead of feature cards"])
  }),
  "training-narrative": Object.freeze({
    selectedDirection: "training-narrative",
    positiveReferences: Object.freeze(["editorial learning design", "humanist product guidance", "workshop facilitation"]),
    negativeReferences: Object.freeze(["long copied theory", "decorative icon grids", "training without exercises or feedback"]),
    styleConstraints: Object.freeze(["persistent lesson spine", "concept-example-practice rhythm", "readable body size", "real worked examples"])
  }),
  "editorial-narrative": Object.freeze({
    selectedDirection: "editorial-narrative",
    positiveReferences: Object.freeze(["literary AI editorial", "magazine story grid", "warm product publishing"]),
    negativeReferences: Object.freeze(["identical image-text ratio on every page", "empty magazine whitespace", "monospace metadata as body copy"]),
    styleConstraints: Object.freeze(["warm paper and asymmetric folios", "serif display with humanist sans body", "source colophons", "images with a narrative role"])
  }),
  "swiss-information": Object.freeze({
    selectedDirection: "swiss-information",
    positiveReferences: Object.freeze(["Swiss baseline systems", "IBM Plex information design", "technical publishing"]),
    negativeReferences: Object.freeze(["decorative grid overlays", "oversized red type without meaning", "glass and shadow effects"]),
    styleConstraints: Object.freeze(["4px baseline and 12-column grid", "square information geometry", "direct labels", "one deliberate grid break per page"])
  })
});

const legacyVisualDirectionMap = Object.freeze({
  "consulting-structured": "consulting-evidence",
  "financial-steady": "formal-finance",
  "management-dashboard": "formal-finance",
  "solution-roadmap": "consulting-evidence",
  "product-launch-hero": "brand-launch",
  "courseware-clean": "training-narrative",
  "research-evidence": "editorial-narrative",
  "culture-tourism-editorial": "editorial-narrative"
});

function referenceStyleForVisualDirection(selectedDirectionId) {
  const contract = visualDirectionReferenceStyleMap[String(selectedDirectionId || "")];
  if (!contract) return null;
  return {
    selectedDirection: contract.selectedDirection,
    positiveReferences: [...contract.positiveReferences],
    negativeReferences: [...contract.negativeReferences],
    styleConstraints: [...contract.styleConstraints]
  };
}

function resolveReferenceStyle({ payload, projectBrief, taskContext, deckSession, visualBrief }) {
  const normalizeDirections = (entries) => entries
    .map(([source, value]) => [source, String(value || "").trim()])
    .filter(([, value]) => value)
    .map(([source, value]) => {
      const normalized = referenceStyleForVisualDirection(value) ? value : legacyVisualDirectionMap[value];
      if (!normalized) {
        throw requestError(`Unknown selectedDirectionId \`${value}\` from ${source}; update the client or choose a registered visual direction.`);
      }
      return [source, value, normalized];
    });
  const explicitDirections = normalizeDirections([
    ["deckSession", deckSession?.selectedDirectionId],
    ["projectBrief", projectBrief?.selectedDirectionId],
    ["payload", payload?.selectedDirectionId],
    ["taskContext", taskContext?.selectedDirectionId]
  ]);
  const uniqueDirectionIds = [...new Set(explicitDirections.map(([, , normalized]) => normalized))];
  if (uniqueDirectionIds.length > 1) {
    const detail = explicitDirections.map(([source, value]) => `${source}=${value}`).join(", ");
    throw requestError(`Conflicting selectedDirectionId values: ${detail}. Keep one visual direction across the handoff contract.`);
  }
  const explicitDirectionId = uniqueDirectionIds[0] || "";
  if (explicitDirectionId) {
    return referenceStyleForVisualDirection(explicitDirectionId);
  }
  const fallbackDirections = normalizeDirections([
    ["projectBrief.referenceStyle", projectBrief?.referenceStyle?.selectedDirection],
    ["payload.referenceStyle", payload?.referenceStyle?.selectedDirection],
    ["visualBrief.referenceStyle", visualBrief?.referenceStyle?.selectedDirection]
  ]);
  const uniqueFallbackIds = [...new Set(fallbackDirections.map(([, , normalized]) => normalized))];
  if (uniqueFallbackIds.length > 1) {
    const detail = fallbackDirections.map(([source, value]) => `${source}=${value}`).join(", ");
    throw requestError(`Conflicting referenceStyle directions: ${detail}. Keep one visual direction across the handoff contract.`);
  }
  if (uniqueFallbackIds[0]) {
    return referenceStyleForVisualDirection(uniqueFallbackIds[0]);
  }
  const formDirection = referenceStyleForVisualDirection(payload?.form?.stylePreset);
  if (formDirection) return formDirection;
  return defaultReferenceStyle();
}

function defaultReferenceStyle() {
  return referenceStyleForVisualDirection("formal-finance");
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

function defaultSourceConfidence({ taskContext, expectationFit, evidence }) {
  const hasVerifiedEvidence = evidence?.verifiedCount > 0;
  const level = sourceConfidenceLevel(expectationFit?.sourceAdequacy);
  return {
    level,
    sourceAdequacy: expectationFit?.sourceAdequacy || "no-source",
    coveredAreas: [
      taskContext?.title || taskContext?.task ? "project task" : "",
      taskContext?.audience ? "target audience" : "",
      taskContext?.coreMessage ? "core message" : "",
      hasVerifiedEvidence ? `${evidence.verifiedCount} verified source(s)` : "",
      "editable PPTX delivery default"
    ].filter(Boolean),
    missingAreas: [
      ...(expectationFit?.missingSignals || []),
      !hasVerifiedEvidence ? "no citable source; do not invent facts or numbers" : ""
    ].filter(Boolean),
    claimsNeedingEvidence: taskContext?.coreMessage ? [`Core message needs evidence: ${taskContext.coreMessage}`] : [],
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
- Reference style: ${referenceStyle?.selectedDirection || "formal-finance"}
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

const selectedVariantRecipeMap = {
  "cover.hero-left-visual": ["cover_brand", "cover_brand.hero_left_visual", "generated-background | no-text | 16:9"],
  "cover.editorial-folio": ["cover_brand", "cover_brand.hero_left_visual", "generated-background | no-text | 16:9"],
  "cover.image-stage": ["product_stage", "product_stage.full_bleed_safe", "full-bleed-real-or-generated-image | no-text | 16:9"],
  "section.hero-light": ["section_divider", "section_divider.hero_light", "quiet-light-atmosphere | no-text | 16:9"],
  "context.vertical-timeline": ["timeline", "timeline.vertical_kpi", "editable-schematic"],
  "story.text-image-7-5": ["image_story", "image_story.text_image_7_5", "real-or-generated-image"],
  "evidence.native-chart": ["native_chart", "native_chart.direct_label", "native-editable-chart"],
  "evidence.image-proof-grid": ["image_proof", "image_proof.uniform_grid", "real-images-or-screenshots"],
  "evidence.source-ledger": ["evidence_board", "evidence_board.source_table", "none"],
  "comparison.two-column-delta": ["comparison_matrix", "comparison_matrix.two_column_delta", "none"],
  "comparison.before-after-axis": ["comparison_matrix", "comparison_matrix.two_column_delta", "editable-schematic"],
  "comparison.decision-matrix": ["comparison_matrix", "comparison_matrix.two_column_delta", "none"],
  "action.owner-roadmap": ["action_roadmap", "action_roadmap.owner_timeline", "schematic | no-text | 16:9"],
  "action.horizontal-timeline": ["action_roadmap", "action_roadmap.owner_timeline", "schematic | no-text | 16:9"],
  "action.system-map": ["system_map", "system_map.layered", "editable-schematic"],
  "closing.commitment-tail": ["closing_commitment", "closing_commitment.brand_tail", "generated-background | no-text | 16:9"],
  "closing.decision-ask": ["closing_commitment", "closing_commitment.brand_tail", "generated-background | no-text | 16:9"],
  "closing.editorial-colophon": ["source_colophon", "source_colophon.editorial", "none"]
};

const fallbackRecipeOptionsByRole = {
  anchor: [
    roleRecipeMap.anchor,
    selectedVariantRecipeMap["cover.image-stage"],
    selectedVariantRecipeMap["section.hero-light"]
  ],
  context: [
    roleRecipeMap.context,
    selectedVariantRecipeMap["context.vertical-timeline"],
    selectedVariantRecipeMap["story.text-image-7-5"]
  ],
  evidence: [
    roleRecipeMap.evidence,
    selectedVariantRecipeMap["evidence.native-chart"],
    selectedVariantRecipeMap["evidence.image-proof-grid"]
  ],
  comparison: [
    roleRecipeMap.comparison,
    selectedVariantRecipeMap["evidence.native-chart"],
    selectedVariantRecipeMap["evidence.source-ledger"]
  ],
  process: [
    roleRecipeMap.process,
    selectedVariantRecipeMap["context.vertical-timeline"],
    selectedVariantRecipeMap["action.system-map"]
  ],
  benefit: [
    roleRecipeMap.benefit,
    ["data_hero", "data_hero.single_kpi", "none"],
    selectedVariantRecipeMap["evidence.native-chart"]
  ],
  risk: [
    roleRecipeMap.risk,
    selectedVariantRecipeMap["evidence.source-ledger"],
    selectedVariantRecipeMap["comparison.two-column-delta"]
  ],
  action: [
    roleRecipeMap.action,
    selectedVariantRecipeMap["context.vertical-timeline"],
    selectedVariantRecipeMap["action.system-map"]
  ],
  closing: [
    roleRecipeMap.closing,
    selectedVariantRecipeMap["closing.editorial-colophon"],
    selectedVariantRecipeMap["section.hero-light"]
  ]
};

function stripGeneratedStoryboardSection(value) {
  const kept = [];
  let skipping = false;
  for (const line of String(value || "").split(/\r?\n/)) {
    if (/^\s*##\s+storyboard\s*$/i.test(line)) {
      skipping = true;
      kept.push("");
      continue;
    }
    if (skipping && /^\s*##\s+/.test(line)) skipping = false;
    kept.push(skipping ? "" : line);
  }
  return kept.join("\n");
}

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
    if (/^\s*#{1,6}\s+/.test(raw)) return;
    if (/^\s*this file was generated by the local agent bridge\b/i.test(raw)) return;
    if (/^\s*status\s*:/i.test(raw)) return;
    const line = cleanSourceLine(raw);
    if (!line) return;
    claims.push({
      id: `S${String(claims.length + 1).padStart(3, "0")}`,
      sourceLine: index + 1,
      text: line.slice(0, 180)
    });
  });
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

function selectedRecipe(slide) {
  const variants = Array.isArray(slide?.variants) ? slide.variants : [];
  const selectedVariantId = String(slide?.selectedVariantId || "");
  const selectedVariant = variants.find((variant) => String(variant?.id || "") === selectedVariantId) || variants[0] || null;
  const rawLayoutFamily = String(selectedVariant?.layoutFamily || "");
  const fallback = roleRecipeMap[String(slide?.role || "")] || roleRecipeMap.evidence;
  const [layoutFamily, recipeId, visualLayer] = selectedVariantRecipeMap[rawLayoutFamily] || fallback;
  return {
    selectedVariantId,
    selectedVariant: selectedVariant ? {
      id: String(selectedVariant.id || selectedVariantId),
      label: String(selectedVariant.label || ""),
      layoutFamily: rawLayoutFamily
    } : null,
    variants: variants.map((variant) => ({
      id: String(variant?.id || ""),
      label: String(variant?.label || ""),
      layoutFamily: String(variant?.layoutFamily || "")
    })),
    variantLayoutFamily: rawLayoutFamily,
    layoutFamily,
    recipeId,
    visualLayer
  };
}

function consecutiveContractViolations(slides) {
  const violations = [];
  for (const field of ["layoutFamily", "recipeId"]) {
    let runStart = 0;
    while (runStart < slides.length) {
      const value = String(slides[runStart]?.[field] || "");
      let runEnd = runStart + 1;
      while (runEnd < slides.length && String(slides[runEnd]?.[field] || "") === value) runEnd += 1;
      if (value && runEnd - runStart >= 3) {
        const pages = slides.slice(runStart, runEnd).map((slide, index) => String(slide?.slideId || slide?.page || `slide-${runStart + index + 1}`));
        violations.push({ field, value, pages });
      }
      runStart = runEnd;
    }
  }
  return violations;
}

function assertNoTripleLayoutOrRecipe(slides, label) {
  const violations = consecutiveContractViolations(slides);
  if (!violations.length) return;
  const detail = violations
    .map((item) => `${item.pages.join("-")} repeats ${item.field} \`${item.value}\` ${item.pages.length} times`)
    .join("; ");
  throw requestError(`${label} violates the layout-diversity gate: ${detail}. Use a different structural variant before handoff.`);
}

function fallbackRecipeForSlide(role, plannedSlides) {
  const candidates = fallbackRecipeOptionsByRole[role] || fallbackRecipeOptionsByRole.evidence;
  for (const candidate of candidates) {
    const [layoutFamily, recipeId] = candidate;
    const previous = plannedSlides.slice(-2);
    const repeatsLayout = previous.length === 2 && previous.every((slide) => slide.layoutFamily === layoutFamily);
    const repeatsRecipe = previous.length === 2 && previous.every((slide) => slide.recipeId === recipeId);
    if (!repeatsLayout && !repeatsRecipe) return candidate;
  }
  return candidates[0];
}

function validateDeckSession(deckSession) {
  if (!deckSession || typeof deckSession !== "object") return null;
  if (!Array.isArray(deckSession.slides)) {
    const error = new Error("deckSession.slides must be an array.");
    error.statusCode = 400;
    throw error;
  }
  if (deckSession.slides.length < 4 || deckSession.slides.length > 24) {
    const error = new Error("DeckSession must contain between 4 and 24 slides.");
    error.statusCode = 400;
    throw error;
  }
  if (deckSession.selectedDirectionId && !referenceStyleForVisualDirection(deckSession.selectedDirectionId)) {
    throw requestError(`Unknown selectedDirectionId \`${deckSession.selectedDirectionId}\`; update the client or choose a registered visual direction.`);
  }
  const ids = new Set();
  for (const slide of deckSession.slides) {
    const slideId = String(slide?.slideId || "");
    if (!/^P\d{2,3}$/.test(slideId) || ids.has(slideId)) {
      const error = new Error("DeckSession slideId values must be unique and use the stable PNN format.");
      error.statusCode = 400;
      throw error;
    }
    ids.add(slideId);
    const variants = Array.isArray(slide?.variants) ? slide.variants : [];
    const selectedVariantId = String(slide?.selectedVariantId || "");
    if (!variants.length || !variants.some((variant) => String(variant?.id || "") === selectedVariantId)) {
      const error = new Error(`DeckSession ${slideId} must reference an existing selected variant.`);
      error.statusCode = 400;
      throw error;
    }
  }
  const selectedRecipes = deckSession.slides.map((slide) => ({
    slideId: String(slide.slideId),
    ...selectedRecipe(slide)
  }));
  assertNoTripleLayoutOrRecipe(selectedRecipes, "DeckSession");
  return deckSession;
}

function evidenceRefsForSlide(claims, slide, index) {
  if (!claims.length) return [];
  const terms = String(`${slide?.title || ""} ${slide?.takeaway || ""}`)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length >= 2);
  const ranked = claims
    .map((claim, claimIndex) => ({
      claim,
      score: terms.reduce((total, term) => total + (claim.text.toLowerCase().includes(term) ? 1 : 0), 0),
      claimIndex
    }))
    .sort((left, right) => right.score - left.score || left.claimIndex - right.claimIndex);
  const matches = ranked.filter((item) => item.score > 0).slice(0, 3).map((item) => item.claim.id);
  return matches.length ? matches : [claims[index % claims.length].id];
}

function buildDeckIR({ title, sourceText, outputMode, qualityGate, deckSession }) {
  const claims = buildSourceClaims(sourceText);
  const session = validateDeckSession(deckSession);
  let slides;
  let planningMode;
  if (session) {
    planningMode = "deck-session-merge";
    slides = session.slides.map((slide, index) => {
      const role = String(slide.role || "evidence");
      const recipe = selectedRecipe(slide);
      const bodyRole = ["context", "evidence", "comparison", "process", "benefit", "risk", "action"].includes(role);
      const takeaway = String(slide.takeaway || "");
      const evidenceRefs = evidenceRefsForSlide(claims, slide, index);
      return {
        page: String(slide.page || slide.slideId),
        slideId: String(slide.slideId),
        role,
        title: String(slide.title || ""),
        takeaway,
        intent: takeaway || roleIntent(role),
        selectedVariantId: recipe.selectedVariantId,
        selectedVariant: recipe.selectedVariant,
        variants: recipe.variants,
        variantLayoutFamily: recipe.variantLayoutFamily,
        recipeId: recipe.recipeId,
        layoutFamily: recipe.layoutFamily,
        evidenceState: claims.length ? (claims.length > 1 ? "candidate" : "unmapped") : "missing",
        evidenceRefs,
        visualLayer: recipe.visualLayer,
        rasterPolicy: bodyRole ? "prohibited-formal-body" : role === "anchor" ? "allowed-cover" : "allowed-section-tail",
        editabilityTarget: role === "process" ? "editable process nodes, connectors, labels, and notes" : "editable text, shapes, charts, evidence captions, and speaker notes",
        speakerIntent: takeaway || roleIntent(role),
        sessionStatus: String(slide.status || "draft")
      };
    });
  } else {
    planningMode = "fallback-rule-planner";
    const planningClaims = claims.length ? claims : [{ id: "", sourceLine: 1, text: title }];
    const target = Math.max(4, Math.min(8, planningClaims.length + 2));
    const chunks = chunkClaims(planningClaims, target);
    slides = [];
    chunks.forEach((chunk, index) => {
      const role = inferDeckRole(index, chunks.length, chunk.map((item) => item.text).join(" "));
      const [layoutFamily, recipeId, visualLayer] = fallbackRecipeForSlide(role, slides);
      const bodyRole = ["context", "evidence", "comparison", "process", "benefit", "risk", "action"].includes(role);
      slides.push({
        page: `P${String(index + 1).padStart(2, "0")}`,
        slideId: `P${String(index + 1).padStart(2, "0")}`,
        role,
        title: role === "anchor" ? title : role === "closing" ? "Delivery review and next step" : String(chunk[0]?.text || title).slice(0, 44),
        intent: roleIntent(role),
        recipeId,
        layoutFamily,
        evidenceState: claims.length ? "candidate" : "missing",
        evidenceRefs: chunk.map((item) => item.id).filter(Boolean),
        visualLayer,
        rasterPolicy: bodyRole ? "prohibited-formal-body" : role === "anchor" ? "allowed-cover" : "allowed-section-tail",
        editabilityTarget: role === "process" ? "editable process nodes, connectors, labels, and notes" : "editable text, shapes, evidence captions, and speaker notes",
        speakerIntent: roleIntent(role)
      });
    });
  }
  assertNoTripleLayoutOrRecipe(slides, session ? "DeckSession" : "Bridge fallback planner");
  const createdAt = new Date().toISOString();
  const storyboard = {
    deckIRVersion: "1.0",
    createdAt,
    planningMode,
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
      mode: planningMode,
      fallbackReason: session
        ? "Bridge merged the user-confirmed DeckSession with deterministic evidence and production contracts."
        : "Bridge handoff wrote deterministic DeckIR without requiring model credentials."
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
  deckIRPayload.storyboard.selectedDirectionId = referenceStyle?.selectedDirection || "";
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
  if (deckIRPayload.planningReport?.summary) {
    deckIRPayload.planningReport.summary.selectedDirectionId = referenceStyle?.selectedDirection || "";
  }
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
  bestEffectBrief,
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
    bestEffectBrief,
    expectationFit,
    sourceConfidence,
    deliveryScorecard,
    referenceStyle,
    feedbackLoop,
    failureTaxonomy,
    confirmationBrief,
    imageAcceptance,
    expectedArtifacts,
    artifacts: [],
    artifactBinding: {
      required: true,
      requiredFields: ["relativePath", "sha256", "size"],
      rule: "Only an exact final artifact path and SHA-256 match can inherit a passed quality status."
    },
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
9. Write each final artifact to a .partial filename and atomically rename it only after the write is complete. A .partial, temporary, zero-byte, or still-changing file is not a deliverable.
10. Set quality-report.json to passed only after recording every passed final artifact under artifact/artifacts with its project-relative path, SHA-256, and size. A new or changed file needs a new digest binding.

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
- Write final files via a .partial filename plus atomic rename; bind every passed final artifact in quality-report.json by project-relative path, SHA-256, and size.
`;
}

async function assertSafeAttachmentCacheDirectory(outputDir, cacheDir) {
  try {
    const stats = await lstat(cacheDir);
    if (stats.isSymbolicLink() || !stats.isDirectory()) throw new Error("unsafe cache directory");
    const [outputReal, cacheReal] = await Promise.all([realpath(outputDir), realpath(cacheDir)]);
    if (!isNestedPath(outputReal, cacheReal)) throw new Error("cache outside output directory");
  } catch {
    throw requestError("Bridge attachment cache must be a real directory inside the configured output directory.", 500);
  }
}

function attachmentCacheSignature(contentHash, markdown, manifestSigningKey) {
  return createHmac("sha256", manifestSigningKey)
    .update(`${ATTACHMENT_CACHE_SCHEMA}\0${contentHash}\0`, "utf8")
    .update(markdown, "utf8")
    .digest("hex");
}

async function readStableAttachmentCache(cachePath, contentHash, manifestSigningKey) {
  let fileHandle;
  try {
    fileHandle = await open(cachePath, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0));
    const before = await fileHandle.stat();
    if (
      !before.isFile()
      || before.isSymbolicLink()
      || before.size <= 0
      || before.size > MAX_ATTACHMENT_CACHE_BYTES
      || before.nlink !== 1
    ) return null;
    const raw = await fileHandle.readFile({ encoding: "utf8" });
    const after = await fileHandle.stat();
    if (
      !raw
      || !after.isFile()
      || after.isSymbolicLink()
      || after.nlink !== 1
      || before.dev !== after.dev
      || before.ino !== after.ino
      || before.size !== after.size
      || before.mtimeMs !== after.mtimeMs
      || before.ctimeMs !== after.ctimeMs
    ) {
      return null;
    }
    const entry = JSON.parse(raw);
    if (
      !entry
      || typeof entry !== "object"
      || Array.isArray(entry)
      || entry.schemaVersion !== ATTACHMENT_CACHE_SCHEMA
      || entry.contentHash !== contentHash
      || typeof entry.markdown !== "string"
      || !entry.markdown
      || typeof entry.signature !== "string"
      || !/^[0-9a-f]{64}$/i.test(entry.signature)
    ) return null;
    const expected = Buffer.from(attachmentCacheSignature(contentHash, entry.markdown, manifestSigningKey), "hex");
    const actual = Buffer.from(entry.signature, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    return entry.markdown;
  } catch {
    return null;
  } finally {
    await fileHandle?.close().catch(() => {});
  }
}

async function installAttachmentCache(cachePath, contentHash, markdown, manifestSigningKey) {
  if (!markdown) return false;
  const entry = {
    schemaVersion: ATTACHMENT_CACHE_SCHEMA,
    contentHash,
    markdown,
    signature: attachmentCacheSignature(contentHash, markdown, manifestSigningKey)
  };
  const encoded = JSON.stringify(entry);
  if (Buffer.byteLength(encoded) > MAX_ATTACHMENT_CACHE_BYTES) return false;
  const temporaryPath = `${cachePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, encoded, { encoding: "utf8", flag: "wx", mode: 0o600 });
    // The completed temporary file is installed without ever replacing or
    // following an existing cache entry. Concurrent writers safely keep the
    // first complete result.
    await link(temporaryPath, cachePath);
    return true;
  } catch (error) {
    if (error?.code === "EEXIST") return false;
    throw error;
  } finally {
    await unlink(temporaryPath).catch(() => {});
  }
}

async function stageAttachment(prepared, {
  projectPath,
  attachmentCacheDir,
  manifestSigningKey,
  repoRoot,
  usedAttachmentNames,
  usedExtractedNames
}) {
  const { item, kind, buffer: attachmentBuffer, actualSize, contentHash } = prepared;
  const originalName = String(item.name || item.url || "source");
  const id = item.id || hashText(`${originalName}-${contentHash}`).slice(0, 10);
  const name = reserveUniqueFilename(originalName, `${id}:${originalName}:${contentHash}`, usedAttachmentNames);
  const extension = extname(name).toLowerCase();
  const extractedBase = `${name.replace(/\.[^.]+$/, "") || "source"}.md`;
  const extractedName = reserveUniqueFilename(
    extractedBase,
    `${id}:${originalName}:${contentHash}:extracted`,
    usedExtractedNames
  );
  const result = {
    id,
    name,
    originalName,
    kind,
    type: item.type || "",
    size: actualSize,
    parseStatus: "attachedOnly",
    attachmentPath: "",
    extractedPath: "",
    message: "",
    markdown: "",
    contentHash,
    ingestion: "pending",
    provenance: null
  };

  if (kind === "url") {
    result.parseStatus = "urlOnly";
    result.message = item.url || originalName;
    const outputRelativePath = `extracted/${extractedName}`;
    const outputPath = await resolveSafeProjectRelativePath(projectPath, outputRelativePath);
    await mkdir(dirname(outputPath), { recursive: true });
    await assertNoSymlinkSegments(projectPath, outputPath);
    const conversion = runConverter({ repoRoot, input: item.url || originalName, outputPath, extension: ".url" });
    Object.assign(result, conversion);
    if (conversion.parseStatus === "extracted" && conversion.markdown) {
      result.ingestion = "converted";
      result.provenance = {
        kind: "url",
        url: item.url,
        converter: "scripts/source_to_md/web_to_md.py",
        capturedAt: new Date().toISOString()
      };
    } else {
      result.ingestion = "pending";
      result.provenance = { kind: "url", url: item.url, status: "unresolved" };
    }
    return result;
  }

  const attachmentRelativePath = `attachments/${name}`;
  const attachmentPath = await resolveSafeProjectRelativePath(projectPath, attachmentRelativePath);
  result.attachmentPath = attachmentRelativePath;
  await mkdir(dirname(attachmentPath), { recursive: true });
  await assertNoSymlinkSegments(projectPath, attachmentPath);
  await writeFile(attachmentPath, attachmentBuffer);
  const cachePath = join(attachmentCacheDir, `${contentHash}.json`);
  const cachedOutputRelativePath = `extracted/${extractedName}`;
  const cachedOutputPath = await resolveSafeProjectRelativePath(projectPath, cachedOutputRelativePath);
  const cachedMarkdown = await readStableAttachmentCache(cachePath, contentHash, manifestSigningKey);
  if (cachedMarkdown) {
    result.parseStatus = "cacheHit";
    result.markdown = cachedMarkdown;
    result.extractedPath = cachedOutputRelativePath;
    result.message = "Reused local extraction cache by source content hash.";
    result.ingestion = "converted";
    await mkdir(dirname(cachedOutputPath), { recursive: true });
    await assertNoSymlinkSegments(projectPath, cachedOutputPath);
    await writeFile(cachedOutputPath, result.markdown, "utf8");
    return result;
  }

  if (item.text && isTextExtension(extension)) {
    result.parseStatus = "textExtracted";
    result.extractedPath = result.attachmentPath;
    result.markdown = String(item.text);
    result.message = "Text was extracted in the browser.";
    result.ingestion = "converted";
    await installAttachmentCache(cachePath, contentHash, result.markdown, manifestSigningKey);
    return result;
  }

  await mkdir(dirname(cachedOutputPath), { recursive: true });
  await assertNoSymlinkSegments(projectPath, cachedOutputPath);
  const conversion = runConverter({ repoRoot, input: attachmentPath, outputPath: cachedOutputPath, extension });
  if (conversion.markdown) await installAttachmentCache(cachePath, contentHash, conversion.markdown, manifestSigningKey);
  return {
    ...result,
    ...conversion,
    ingestion: conversion.parseStatus === "extracted" && conversion.markdown ? "converted" : "pending"
  };
}

function requestError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function loadOrCreateManifestSigningKey(outputDir) {
  const outputRoot = resolve(outputDir);
  const keyPath = join(outputRoot, MANIFEST_AUTH_KEY_FILE);
  await mkdir(outputRoot, { recursive: true });

  const candidatePath = join(
    outputRoot,
    `${MANIFEST_AUTH_KEY_FILE}.${process.pid}.${randomUUID()}.tmp`
  );
  try {
    await writeFile(candidatePath, randomBytes(32).toString("hex"), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
    try {
      // A hard-link install is atomic and, unlike rename(), never replaces a key
      // another Bridge process created concurrently.
      await link(candidatePath, keyPath);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }
  } finally {
    await unlink(candidatePath).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }

  let keyStats;
  try {
    keyStats = await lstat(keyPath);
  } catch {
    throw requestError("Bridge manifest signing key could not be initialized.", 500);
  }
  if (keyStats.isSymbolicLink() || !keyStats.isFile()) {
    throw requestError("Bridge manifest signing key must be a private regular file.", 500);
  }
  await chmod(keyPath, 0o600);
  const encodedKey = (await readFile(keyPath, "utf8")).trim();
  if (!/^[0-9a-f]{64}$/i.test(encodedKey)) {
    throw requestError("Bridge manifest signing key is invalid; restore or remove the key before continuing.", 500);
  }
  return Buffer.from(encodedKey, "hex");
}

function manifestIdentityPayload(manifest) {
  const { integrity: _integrity, ...signedManifest } = manifest;
  return JSON.stringify({
    scheme: MANIFEST_AUTH_SCHEME,
    scope: MANIFEST_AUTH_SCOPE,
    manifest: signedManifest
  });
}

function manifestSignature(manifest, manifestSigningKey) {
  return createHmac("sha256", manifestSigningKey)
    .update(manifestIdentityPayload(manifest), "utf8")
    .digest("hex");
}

function createManifestIntegrity(manifest, manifestSigningKey) {
  return {
    scheme: MANIFEST_AUTH_SCHEME,
    algorithm: "HMAC-SHA256",
    scope: MANIFEST_AUTH_SCOPE,
    signature: manifestSignature(manifest, manifestSigningKey)
  };
}

function assertManifestAuthenticity(manifest, manifestSigningKey) {
  const integrity = manifest?.integrity;
  if (
    !integrity
    || typeof integrity !== "object"
    || Array.isArray(integrity)
    || integrity.scheme !== MANIFEST_AUTH_SCHEME
    || integrity.algorithm !== "HMAC-SHA256"
    || integrity.scope !== MANIFEST_AUTH_SCOPE
    || typeof integrity.signature !== "string"
    || !/^[0-9a-f]{64}$/i.test(integrity.signature)
  ) {
    throw requestError("manifest.json is missing a valid Bridge authenticity signature; recreate this handoff through /projects/create.");
  }

  const expected = Buffer.from(manifestSignature(manifest, manifestSigningKey), "hex");
  const actual = Buffer.from(integrity.signature, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw requestError("manifest.json Bridge authenticity signature does not match this project.");
  }
}

function isNestedPath(parent, candidate) {
  const value = relative(parent, candidate);
  return Boolean(value) && value !== ".." && !value.startsWith(`..${sep}`) && !isAbsolute(value);
}

function assertBridgeHandoffManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw requestError("manifest.json must contain a Bridge handoff object.");
  }

  const stableStringFields = ["version", "createdAt", "title", "projectPath", "repoRoot"];
  const missingFields = stableStringFields.filter((field) => typeof manifest[field] !== "string" || !manifest[field].trim());
  if (missingFields.length) {
    throw requestError(`manifest.json is missing stable Bridge handoff fields: ${missingFields.join(", ")}.`);
  }
  if (Number.isNaN(Date.parse(manifest.createdAt))) {
    throw requestError("manifest.json createdAt must be a valid Bridge handoff timestamp.");
  }
  if (manifest.sessionId !== undefined) optionalSessionId(manifest.sessionId);
  if (!isAbsolute(manifest.projectPath) || !isAbsolute(manifest.repoRoot)) {
    throw requestError("manifest.json projectPath and repoRoot must be absolute Bridge handoff paths.");
  }
  if (!Array.isArray(manifest.attachments)) {
    throw requestError("manifest.json attachments must be a Bridge handoff array.");
  }
  if (!manifest.suggestedCommands || typeof manifest.suggestedCommands !== "object" || Array.isArray(manifest.suggestedCommands)) {
    throw requestError("manifest.json suggestedCommands must be a Bridge handoff object.");
  }
  if (!Object.values(manifest.suggestedCommands).some((command) => typeof command === "string" && command.trim())) {
    throw requestError("manifest.json suggestedCommands must include at least one Bridge Agent command.");
  }
}

async function resolveHandoffProject({ outputDir, projectPath, manifestSigningKey }) {
  const suppliedPath = String(projectPath || "").trim();
  if (!suppliedPath) throw requestError("projectPath is required.");
  let outputRoot;
  let resolvedProject;
  try {
    outputRoot = await realpath(resolve(outputDir));
    const lexicalProject = resolve(suppliedPath);
    const lexicalStats = await lstat(lexicalProject);
    if (lexicalStats.isSymbolicLink() || !lexicalStats.isDirectory()) {
      throw requestError("projectPath must be a real Bridge handoff directory, not a symlink.");
    }
    resolvedProject = await realpath(lexicalProject);
  } catch (error) {
    if (error?.statusCode) throw error;
    throw requestError("projectPath must be an existing Bridge handoff under the configured output directory.");
  }
  if (!isNestedPath(outputRoot, resolvedProject)) {
    throw requestError("projectPath must stay inside the configured Bridge output directory.");
  }

  const manifestPath = join(resolvedProject, "manifest.json");
  let manifest;
  try {
    const manifestStats = await lstat(manifestPath);
    if (manifestStats.isSymbolicLink() || !manifestStats.isFile()) throw new Error("invalid manifest");
    const manifestReal = await realpath(manifestPath);
    if (!isNestedPath(resolvedProject, manifestReal)) throw new Error("manifest outside project");
    manifest = JSON.parse(await readFile(manifestReal, "utf8"));
  } catch {
    throw requestError("projectPath must contain a regular, readable manifest.json.");
  }
  assertBridgeHandoffManifest(manifest);
  try {
    const manifestProject = await realpath(resolve(manifest.projectPath));
    if (manifestProject !== resolvedProject) throw new Error("project mismatch");
  } catch {
    throw requestError("manifest.json projectPath does not match this handoff directory.");
  }
  assertManifestAuthenticity(manifest, manifestSigningKey);
  return { outputRoot, projectPath: resolvedProject, manifest };
}

function artifactKind(relativePath) {
  const extension = extname(relativePath).toLowerCase();
  if (extension === ".pptx") return "pptx";
  if (extension === ".html" || extension === ".htm") return "web-deck";
  if (extension === ".pdf") return "pdf";
  if ([".zip", ".tar", ".gz", ".tgz"].includes(extension)) return "archive";
  return "report";
}

function contentTypeForArtifact(kind, relativePath) {
  if (kind === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (kind === "web-deck") return "text/html; charset=utf-8";
  if (kind === "pdf") return "application/pdf";
  if (kind === "archive") return extname(relativePath).toLowerCase() === ".zip" ? "application/zip" : "application/octet-stream";
  return extname(relativePath).toLowerCase() === ".json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8";
}

function normalizedVerification(value) {
  const status = String(value || "pending").toLowerCase();
  if (["passed", "pass", "verified", "delivered"].includes(status)) return "passed";
  if (["warning", "warnings", "needs-review"].includes(status)) return "warning";
  if (["blocked", "failed", "fail", "error"].includes(status)) return "blocked";
  return "pending";
}

function qualityArtifactBindings(report) {
  const candidates = [
    ...(report?.artifact && typeof report.artifact === "object" ? [report.artifact] : []),
    ...(Array.isArray(report?.artifacts) ? report.artifacts : []),
    ...(Array.isArray(report?.finalArtifacts) ? report.finalArtifacts : []),
    ...(Array.isArray(report?.verifiedArtifacts) ? report.verifiedArtifacts : [])
  ];
  const bindings = new Map();
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const relativePath = String(candidate.relativePath || "").replace(/^\.\//, "");
    const sha256 = String(candidate.sha256 || "").toLowerCase();
    try {
      const { segments } = validateProjectRelativePath(relativePath);
      if (!["exports", "ppt"].includes(segments[0])) continue;
      if (!DELIVERABLE_EXTENSIONS.has(extname(segments.at(-1)).toLowerCase())) continue;
    } catch {
      continue;
    }
    if (!/^[0-9a-f]{64}$/.test(sha256)) continue;
    const size = candidate.size === undefined ? undefined : Number(candidate.size);
    if (size !== undefined && (!Number.isSafeInteger(size) || size <= 0)) continue;
    const itemVerification = candidate.status === undefined && candidate.verification === undefined
      ? "passed"
      : normalizedVerification(candidate.status || candidate.verification);
    if (itemVerification !== "passed") continue;
    bindings.set(relativePath, { relativePath, sha256, ...(size === undefined ? {} : { size }) });
  }
  return bindings;
}

async function projectQualityState(project) {
  const projectPath = project.projectPath;
  const expectationFit = project.manifest?.expectationFit;
  if (expectationFit?.readyForProduction !== true || expectationFit?.sourceAdequacy === "no-source") {
    return { verification: "blocked", bindings: new Map(), report: null };
  }
  const reportPath = join(projectPath, "quality-report.json");
  try {
    const reportStats = await lstat(reportPath);
    if (reportStats.isSymbolicLink() || !reportStats.isFile()) {
      return { verification: "pending", bindings: new Map(), report: null };
    }
    const reportReal = await realpath(reportPath);
    if (!isNestedPath(projectPath, reportReal)) return { verification: "pending", bindings: new Map(), report: null };
    const report = JSON.parse(await readFile(reportReal, "utf8"));
    return {
      verification: normalizedVerification(report?.status || report?.verification),
      bindings: qualityArtifactBindings(report),
      report
    };
  } catch {
    return { verification: "pending", bindings: new Map(), report: null };
  }
}

function isTemporaryArtifactName(name) {
  const value = String(name || "").toLowerCase();
  return value.startsWith(".")
    || value.endsWith("~")
    || /(?:^|[._-])(partial|part|tmp|temp|download|crdownload|swp)(?:[._-]|$)/.test(value);
}

async function sha256File(filePath) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) digest.update(chunk);
  return digest.digest("hex");
}

async function sha256FileHandle(fileHandle, size) {
  const digest = createHash("sha256");
  const buffer = Buffer.allocUnsafe(64 * 1024);
  let position = 0;
  while (position < size) {
    const length = Math.min(buffer.length, size - position);
    const { bytesRead } = await fileHandle.read(buffer, 0, length, position);
    if (bytesRead <= 0) break;
    digest.update(buffer.subarray(0, bytesRead));
    position += bytesRead;
  }
  return { sha256: digest.digest("hex"), bytesRead: position };
}

async function inspectStableArtifact(projectPath, absolutePath, relativePath, limits, artifactHashCache) {
  try {
    const first = await lstat(absolutePath);
    if (first.isSymbolicLink() || !first.isFile() || first.size <= 0) return null;
    if (Date.now() - Math.max(first.mtimeMs, first.ctimeMs) < limits.artifactStableAgeMs) return null;
    const fileReal = await realpath(absolutePath);
    if (!isNestedPath(projectPath, fileReal)) return null;
    const cacheKey = `${fileReal}\0${first.dev}:${first.ino}:${first.size}:${first.mtimeMs}:${first.ctimeMs}`;
    const sha256 = artifactHashCache?.get(cacheKey) || await sha256File(fileReal);
    const second = await lstat(fileReal);
    if (
      second.isSymbolicLink()
      || !second.isFile()
      || second.size <= 0
      || first.dev !== second.dev
      || first.ino !== second.ino
      || first.size !== second.size
      || first.mtimeMs !== second.mtimeMs
      || first.ctimeMs !== second.ctimeMs
    ) {
      return null;
    }
    if (artifactHashCache && !artifactHashCache.has(cacheKey)) {
      artifactHashCache.set(cacheKey, sha256);
      if (artifactHashCache.size > 512) artifactHashCache.delete(artifactHashCache.keys().next().value);
    }
    return {
      name: basename(fileReal),
      kind: artifactKind(relativePath),
      relativePath,
      size: second.size,
      modifiedAt: second.mtime.toISOString(),
      sha256
    };
  } catch {
    return null;
  }
}

function deliverableVerification(qualityState, artifact) {
  if (qualityState.verification !== "passed") return qualityState.verification;
  const binding = qualityState.bindings.get(artifact.relativePath);
  if (!binding || binding.sha256 !== artifact.sha256) return "pending";
  if (binding.size !== undefined && binding.size !== artifact.size) return "pending";
  return "passed";
}

async function collectDeliverables(projectPath, directoryName, qualityState, artifacts, limits, scanState, artifactHashCache) {
  const directoryPath = join(projectPath, directoryName);
  let directoryStats;
  try {
    directoryStats = await lstat(directoryPath);
  } catch {
    return;
  }
  if (directoryStats.isSymbolicLink() || !directoryStats.isDirectory()) return;

  async function walk(currentPath, depth) {
    let directory;
    try {
      const currentStats = await lstat(currentPath);
      if (currentStats.isSymbolicLink() || !currentStats.isDirectory()) return;
      const currentReal = await realpath(currentPath);
      if (!isNestedPath(projectPath, currentReal)) return;
      directory = await opendir(currentReal);
    } catch {
      return;
    }
    for await (const entry of directory) {
      if (scanState.entries >= limits.maxArtifactScanEntries) {
        scanState.truncated = true;
        break;
      }
      scanState.entries += 1;
      if (entry.isSymbolicLink() || isTemporaryArtifactName(entry.name)) continue;
      const absolutePath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (depth + 1 < limits.maxArtifactScanDepth) await walk(absolutePath, depth + 1);
        continue;
      }
      if (!entry.isFile() || !DELIVERABLE_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;
      const relativePath = relative(projectPath, absolutePath).split(sep).join("/");
      const artifact = await inspectStableArtifact(projectPath, absolutePath, relativePath, limits, artifactHashCache);
      if (artifact) artifacts.push({ ...artifact, verification: deliverableVerification(qualityState, artifact) });
    }
  }
  await walk(directoryPath, 0);
}

async function listProjectArtifacts(project, limits, artifactHashCache) {
  const qualityState = await projectQualityState(project);
  const artifacts = [];
  const scanState = { entries: 0, truncated: false };
  await collectDeliverables(project.projectPath, "exports", qualityState, artifacts, limits, scanState, artifactHashCache);
  await collectDeliverables(project.projectPath, "ppt", qualityState, artifacts, limits, scanState, artifactHashCache);
  for (const filename of QUALITY_ARTIFACT_ALLOWLIST) {
    const filePath = join(project.projectPath, filename);
    try {
      const artifact = await inspectStableArtifact(project.projectPath, filePath, filename, limits, artifactHashCache);
      if (artifact) artifacts.push({ ...artifact, kind: "report", verification: qualityState.verification });
    } catch {
      // Missing optional reports are not artifacts.
    }
  }
  return {
    artifacts: artifacts.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
    scan: {
      entriesVisited: scanState.entries,
      maxEntries: limits.maxArtifactScanEntries,
      maxDepth: limits.maxArtifactScanDepth,
      truncated: scanState.truncated
    }
  };
}

async function resolveProjectArtifact({
  outputDir,
  projectPath,
  artifact,
  manifestSigningKey,
  artifactLimits,
  artifactHashCache
}) {
  const project = await resolveHandoffProject({ outputDir, projectPath, manifestSigningKey });
  const suppliedArtifact = String(artifact || "").trim();
  if (!suppliedArtifact || isAbsolute(suppliedArtifact) || suppliedArtifact.includes("\\")) {
    throw requestError("artifact must be an allowed project-relative path.");
  }
  const pathSegments = suppliedArtifact.split("/");
  if (pathSegments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw requestError("artifact path traversal is not allowed.");
  }
  const result = await listProjectArtifacts(project, artifactLimits, artifactHashCache);
  const descriptor = result.artifacts.find((item) => item.relativePath === suppliedArtifact);
  if (!descriptor) throw requestError("artifact is not an allowed deliverable or quality report.", 404);

  let currentPath = project.projectPath;
  for (const segment of pathSegments) {
    currentPath = join(currentPath, segment);
    const stats = await lstat(currentPath);
    if (stats.isSymbolicLink()) throw requestError("artifact symlinks are not allowed.");
  }
  const filePath = await realpath(currentPath);
  if (!isNestedPath(project.projectPath, filePath)) throw requestError("artifact must stay inside the Bridge handoff.");
  const stats = await lstat(filePath);
  if (!stats.isFile()) throw requestError("artifact must be a regular file.");
  let fileHandle;
  try {
    fileHandle = await open(filePath, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW || 0));
    const before = await fileHandle.stat();
    if (
      !before.isFile()
      || before.size <= 0
      || Date.now() - Math.max(before.mtimeMs, before.ctimeMs) < artifactLimits.artifactStableAgeMs
    ) {
      throw requestError("artifact is empty, temporary, or still being written.", 409);
    }
    const digest = await sha256FileHandle(fileHandle, before.size);
    const after = await fileHandle.stat();
    if (
      digest.bytesRead !== before.size
      || before.dev !== after.dev
      || before.ino !== after.ino
      || before.size !== after.size
      || before.mtimeMs !== after.mtimeMs
      || before.ctimeMs !== after.ctimeMs
      || descriptor.size !== after.size
      || descriptor.sha256 !== digest.sha256
    ) {
      throw requestError("artifact changed while preparing the download; wait for the writer to finish and try again.", 409);
    }
    return {
      ...descriptor,
      filePath,
      fileHandle,
      contentType: contentTypeForArtifact(descriptor.kind, descriptor.relativePath)
    };
  } catch (error) {
    await fileHandle?.close().catch(() => {});
    throw error;
  }
}

function streamProjectArtifact(response, artifact, extraHeaders = {}) {
  const asciiName = basename(artifact.name).replace(/[^A-Za-z0-9._-]+/g, "_") || "artifact";
  response.writeHead(200, {
    ...extraHeaders,
    "Content-Type": artifact.contentType,
    "Content-Length": artifact.size,
    "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(artifact.name)}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  const stream = artifact.fileHandle.createReadStream({ start: 0, autoClose: true });
  stream.on("error", () => response.destroy());
  response.on("close", () => {
    if (!stream.destroyed) stream.destroy();
  });
  stream.pipe(response);
}

async function writeSlideRevisionRequest(payload, { outputDir, manifestSigningKey }) {
  const project = await resolveHandoffProject({ outputDir, projectPath: payload?.projectPath, manifestSigningKey });
  const projectPath = project.projectPath;
  const slideId = String(payload?.slideId || "").toUpperCase();
  if (!/^P\d{2,3}$/.test(slideId)) {
    const error = new Error("slideId must use the stable PNN format.");
    error.statusCode = 400;
    throw error;
  }
  const storyboardPath = await resolveSafeProjectRelativePath(projectPath, "storyboard.json", {
    directChild: true,
    extensions: [".json"]
  });
  let storyboard;
  try {
    const storyboardStats = await lstat(storyboardPath);
    if (storyboardStats.isSymbolicLink() || !storyboardStats.isFile()) {
      throw new Error("invalid storyboard");
    }
    const storyboardReal = await realpath(storyboardPath);
    if (!isNestedPath(projectPath, storyboardReal)) throw new Error("storyboard outside project");
    storyboard = JSON.parse(await readFile(storyboardReal, "utf8"));
  } catch {
    throw requestError("Project storyboard.json must be a regular, readable storyboard contract.");
  }
  if (!Array.isArray(storyboard?.slides)) {
    throw requestError("Project storyboard.json must contain a slides array.");
  }
  const slide = storyboard.slides.find((item) => String(item?.slideId || "").toUpperCase() === slideId);
  if (!slide) {
    throw requestError(`slideId ${slideId} does not exist in this project storyboard.`);
  }

  const variantId = String(payload?.variantId || "").trim();
  const hasVariantContract = Object.prototype.hasOwnProperty.call(slide, "variants")
    || Object.prototype.hasOwnProperty.call(slide, "selectedVariantId");
  if (hasVariantContract) {
    const allowedVariantIds = (Array.isArray(slide.variants) ? slide.variants : [])
      .map((variant) => String(variant?.id || ""))
      .filter(Boolean);
    if (!variantId) {
      throw requestError(`variantId is required for ${slideId}.`);
    }
    if (!allowedVariantIds.includes(variantId)) {
      throw requestError(`variantId ${variantId} does not belong to ${slideId}.`);
    }
  } else if (variantId) {
    throw requestError("Legacy storyboard slides without variants only accept an empty variantId.");
  }

  const revisionId = randomUUID();
  const createdAt = new Date().toISOString();
  const timestamp = createdAt.replace(/[-:.TZ]/g, "");
  const requestRelativePath = `revision-requests/${slideId}-${timestamp}-${revisionId.slice(0, 8)}.json`;
  const requestPath = await resolveSafeProjectRelativePath(projectPath, requestRelativePath, {
    prefix: "revision-requests",
    directChild: true,
    extensions: [".json"]
  });
  const requestPayload = {
    schemaVersion: "slide-revision-request-v1",
    revisionId,
    slideId,
    variantId,
    instruction: String(payload?.instruction || "Regenerate this slide while preserving its evidence and editable object contract."),
    status: "pending",
    createdAt,
    storyboardSnapshot: {
      title: String(slide.title || ""),
      takeaway: String(slide.takeaway || slide.conclusion || ""),
      role: String(slide.role || ""),
      selectedVariantId: String(slide.selectedVariantId || "")
    }
  };
  await mkdir(dirname(requestPath), { recursive: true });
  await assertNoSymlinkSegments(projectPath, requestPath);
  const temporaryRelativePath = `revision-requests/.${slideId}.${randomUUID()}.tmp`;
  const temporaryPath = await resolveSafeProjectRelativePath(projectPath, temporaryRelativePath, {
    prefix: "revision-requests",
    directChild: true,
    extensions: [".tmp"]
  });
  try {
    await writeFile(temporaryPath, JSON.stringify(requestPayload, null, 2), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
    await assertNoSymlinkSegments(projectPath, requestPath);
    // A hard-link install is atomic and never replaces an earlier revision.
    await link(temporaryPath, requestPath);
  } catch (error) {
    throw error;
  } finally {
    await unlink(temporaryPath).catch(() => {});
  }
  return {
    ok: true,
    sessionId: optionalSessionId(project.manifest.sessionId),
    projectPath,
    slideId,
    revisionId,
    requestRelativePath,
    requestPath,
    request: requestPayload
  };
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
  const instruction = "Read AGENTS.md, codex-task.md, storyboard.json, source-map.json, planning-report.json, review-findings.json, repair-plan.json, revision-brief.md, visual-element-kit.md, asset_plan.json, asset-plan.md, quality-checklist.md, manifest.json, and project-brief.json first. Inspect project-brief.json briefMode, visualBrief, guidedBrief, expectationFit, sourceConfidence, deliveryScorecard, referenceStyle, confirmationBrief, and feedbackLoop; if expectationFit.readyForProduction is false, run guided intake before final production and ask one related question group per turn. If the user is unsatisfied, classify the reason with feedbackLoop.failureTaxonomy before revising. Run or handle scripts/generate_visual_element_kit.py before deck production; if no image backend/key exists, use the Needs-Manual prompts in images/image_prompts.md with ChatGPT. Follow the Ultimate PPT Master Skill with ChatGPT-generation-first assets, keep DeckIR evidence/editability constraints, insert reusable micro-assets when useful, run audit_storyboard.py, formal delivery audit, review_rendered_deck.py, and apply_review_plan.py --safe-only --dry-run. Write final artifacts via .partial plus atomic rename and bind every passed artifact in quality-report.json by relativePath, sha256, and size; then list final files.";
  return {
    codex: `cd ${quotedPath} && codex "${instruction}"`,
    claude: `cd ${quotedPath} && claude "${instruction}"`,
    hermes: `cd ${quotedPath} && hermes "${instruction}"`,
    openclaw: `cd ${quotedPath} && openclaw "${instruction}"`,
    generic: `cd ${quotedPath} && printf '%s\\n' "${instruction}"`
  };
}

function assertAgentJob(job) {
  const statuses = new Set(["accepted", "running", "completed", "failed"]);
  if (
    !job
    || typeof job !== "object"
    || Array.isArray(job)
    || job.schemaVersion !== AGENT_JOB_SCHEMA_VERSION
    || typeof job.jobId !== "string"
    || !job.jobId.trim()
    || typeof job.agentId !== "string"
    || !job.agentId.trim()
    || !statuses.has(job.status)
    || (job.ownerBridgePid !== undefined && (!Number.isSafeInteger(job.ownerBridgePid) || job.ownerBridgePid <= 0))
    || Number.isNaN(Date.parse(job.acceptedAt))
    || Number.isNaN(Date.parse(job.updatedAt))
  ) {
    throw requestError("agent-job.json is not a valid Bridge Agent job contract; inspect it before launching again.", 409);
  }
}

async function readAgentJob(projectPath) {
  const jobPath = await resolveSafeProjectRelativePath(projectPath, AGENT_JOB_FILE, {
    directChild: true,
    extensions: [".json"]
  });
  let stats;
  try {
    stats = await lstat(jobPath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw requestError("agent-job.json must be a regular project file.", 409);
  }
  try {
    const job = JSON.parse(await readFile(jobPath, "utf8"));
    assertAgentJob(job);
    return job;
  } catch (error) {
    if (error?.statusCode) throw error;
    throw requestError("agent-job.json is not readable JSON; inspect it before launching again.", 409);
  }
}

async function writeAgentJob(projectPath, job, { createOnly = false } = {}) {
  assertAgentJob(job);
  const jobPath = await resolveSafeProjectRelativePath(projectPath, AGENT_JOB_FILE, {
    directChild: true,
    extensions: [".json"]
  });
  const temporaryName = `.agent-job.${job.jobId}.${randomUUID()}.tmp`;
  const temporaryPath = await resolveSafeProjectRelativePath(projectPath, temporaryName, {
    directChild: true,
    extensions: [".tmp"]
  });
  try {
    await writeFile(temporaryPath, JSON.stringify(job, null, 2), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
    await assertNoSymlinkSegments(projectPath, jobPath);
    if (createOnly) {
      // Cross-process claim: link() fails with EEXIST and never replaces the winner.
      await link(temporaryPath, jobPath);
    } else {
      const current = await lstat(jobPath);
      if (current.isSymbolicLink() || !current.isFile()) {
        throw requestError("agent-job.json must remain a regular project file.", 409);
      }
      await rename(temporaryPath, jobPath);
    }
  } finally {
    await unlink(temporaryPath).catch(() => {});
  }
  return job;
}

async function updateAgentJob(projectPath, jobId, patch) {
  const current = await readAgentJob(projectPath);
  if (!current || current.jobId !== jobId) {
    throw requestError("Agent job identity changed before its status could be updated.", 409);
  }
  if (["completed", "failed"].includes(current.status)) return current;
  const next = {
    ...current,
    ...patch,
    jobId: current.jobId,
    schemaVersion: AGENT_JOB_SCHEMA_VERSION,
    updatedAt: new Date().toISOString()
  };
  await writeAgentJob(projectPath, next);
  return next;
}

function processIsAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function agentJobResult(projectPath, job, { launched = false, idempotent = false, statusCode } = {}) {
  return {
    ok: job.status !== "failed",
    launched,
    idempotent,
    status: job.status,
    projectPath,
    command: job.command,
    message: job.message,
    job,
    ...(statusCode ? { statusCode } : {})
  };
}

async function readObservableAgentStatus(project, { agentRuntimeJobs, persistReconciliation = false } = {}) {
  const projectPath = project.projectPath;
  let job = await readAgentJob(projectPath);
  if (!job) {
    return { ok: true, projectPath, status: "idle", job: null };
  }

  const activeRuntime = agentRuntimeJobs?.get(projectPath);
  // A second Bridge may observe the child PID disappear in the short interval
  // before the owning Bridge persists its authoritative exit event. Do not let
  // recovery logic overwrite that event while the owning Bridge is still alive.
  const ownerBridgeIsAlive = processIsAlive(job.ownerBridgePid);
  if (job.status === "accepted" && !activeRuntime && !ownerBridgeIsAlive) {
    const acceptedAt = Date.parse(job.acceptedAt);
    if (Date.now() - acceptedAt >= AGENT_JOB_STALE_ACCEPTED_MS) {
      const patch = {
        status: "failed",
        completedAt: new Date().toISOString(),
        message: "Agent launch remained accepted without reaching a running process. Start a new handoff before retrying."
      };
      job = persistReconciliation
        ? await updateAgentJob(projectPath, job.jobId, patch)
        : { ...job, ...patch, updatedAt: new Date().toISOString() };
    }
  }
  if (
    job.status === "running"
    && activeRuntime?.jobId !== job.jobId
    && !ownerBridgeIsAlive
    && !processIsAlive(job.pid)
  ) {
    const patch = {
      status: "failed",
      completedAt: new Date().toISOString(),
      message: "The recorded Agent process is no longer running and completion could not be verified after Bridge recovery."
    };
    job = persistReconciliation
      ? await updateAgentJob(projectPath, job.jobId, patch)
      : { ...job, ...patch, updatedAt: new Date().toISOString() };
  }
  return { ok: true, projectPath, status: job.status, job };
}

function spawnDetachedAgent(agentSpawner, agent, projectPath) {
  return new Promise((resolvePromise, rejectPromise) => {
    let child;
    try {
      child = agentSpawner(agent.binary, [agent.prompt], {
        cwd: projectPath,
        detached: true,
        stdio: "ignore"
      });
    } catch (error) {
      rejectPromise(error);
      return;
    }
    if (!child || typeof child.once !== "function") {
      rejectPromise(new Error("Agent launcher did not return a child process."));
      return;
    }
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      if (typeof child.removeListener === "function") {
        child.removeListener("error", onPreSpawnError);
        child.removeListener("spawn", onSpawn);
      }
    };
    const onPreSpawnError = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectPromise(error);
    };
    const onSpawn = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolvePromise(child);
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      if (typeof child.kill === "function") child.kill();
      rejectPromise(new Error(`Agent process did not emit spawn within ${AGENT_SPAWN_TIMEOUT_MS} ms.`));
    }, AGENT_SPAWN_TIMEOUT_MS);
    timer.unref?.();
    child.once("error", onPreSpawnError);
    child.once("spawn", onSpawn);
  });
}

async function launchAgent(payload, {
  allowLaunch,
  outputDir,
  manifestSigningKey,
  agentSpawner,
  agentCommandResolver,
  agentRuntimeJobs
}) {
  const project = await resolveHandoffProject({ outputDir, projectPath: payload?.projectPath, manifestSigningKey });
  const projectPath = project.projectPath;
  const agentId = String(payload.agent || "codex");
  const command = suggestedCommands(projectPath)[agentId] || suggestedCommands(projectPath).codex;

  if (!allowLaunch) {
    return {
      ok: true,
      launched: false,
      idempotent: true,
      status: "command-only",
      projectPath,
      job: null,
      command,
      message: "Auto-launch is disabled. Start the bridge with `npm run bridge -- --allow-launch` to enable it."
    };
  }

  const existingStatus = await readObservableAgentStatus(project, {
    agentRuntimeJobs,
    persistReconciliation: true
  });
  if (existingStatus.job) {
    return agentJobResult(projectPath, existingStatus.job, {
      launched: false,
      idempotent: true,
      ...(existingStatus.job.status === "failed" ? { statusCode: 409 } : {})
    });
  }

  const agent = AGENT_COMMANDS[agentId] || AGENT_COMMANDS.codex;
  let commandPath = "";
  try {
    commandPath = agentCommandResolver(agent.binary);
  } catch {
    commandPath = "";
  }
  if (!commandPath) {
    return {
      ok: false,
      launched: false,
      idempotent: false,
      status: "failed",
      projectPath,
      job: null,
      statusCode: 503,
      command,
      message: `${agent.label} command is not available on PATH.`
    };
  }

  const acceptedAt = new Date().toISOString();
  const acceptedJob = {
    schemaVersion: AGENT_JOB_SCHEMA_VERSION,
    jobId: randomUUID(),
    ownerBridgePid: process.pid,
    agentId: AGENT_COMMANDS[agentId] ? agentId : "codex",
    agentLabel: agent.label,
    status: "accepted",
    command,
    acceptedAt,
    updatedAt: acceptedAt,
    startedAt: null,
    completedAt: null,
    pid: null,
    exitCode: null,
    signal: null,
    message: `${agent.label} launch was accepted and is waiting for the operating system.`
  };
  try {
    await writeAgentJob(projectPath, acceptedJob, { createOnly: true });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const winner = await readAgentJob(projectPath);
    return agentJobResult(projectPath, winner, {
      launched: false,
      idempotent: true,
      ...(winner.status === "failed" ? { statusCode: 409 } : {})
    });
  }
  agentRuntimeJobs?.set(projectPath, { jobId: acceptedJob.jobId, child: null });

  try {
    const child = await spawnDetachedAgent(agentSpawner, { ...agent, binary: commandPath }, projectPath);
    let runningPersisted = false;
    let terminalPersisted = false;
    let terminalEvent = null;

    const persistTerminal = async () => {
      if (!runningPersisted || terminalPersisted || !terminalEvent) return null;
      terminalPersisted = true;
      const completedAt = new Date().toISOString();
      const completed = terminalEvent.type === "exit" && terminalEvent.code === 0;
      const terminalJob = await updateAgentJob(projectPath, acceptedJob.jobId, {
        status: completed ? "completed" : "failed",
        completedAt,
        exitCode: terminalEvent.type === "exit" && Number.isInteger(terminalEvent.code) ? terminalEvent.code : null,
        signal: terminalEvent.signal || null,
        message: completed
          ? `${agent.label} completed successfully.`
          : terminalEvent.type === "error"
            ? `${agent.label} failed while running: ${String(terminalEvent.error?.message || terminalEvent.error).slice(0, 240)}`
            : `${agent.label} exited before successful completion${terminalEvent.signal ? ` (signal ${terminalEvent.signal})` : ` (code ${terminalEvent.code ?? "unknown"})`}.`
      });
      if (agentRuntimeJobs?.get(projectPath)?.jobId === acceptedJob.jobId) agentRuntimeJobs.delete(projectPath);
      return terminalJob;
    };

    child.once("exit", (code, signal) => {
      terminalEvent = { type: "exit", code, signal };
      void persistTerminal().catch(() => {
        if (agentRuntimeJobs?.get(projectPath)?.jobId === acceptedJob.jobId) agentRuntimeJobs.delete(projectPath);
      });
    });
    child.once("error", (error) => {
      terminalEvent = { type: "error", error, signal: null };
      void persistTerminal().catch(() => {
        if (agentRuntimeJobs?.get(projectPath)?.jobId === acceptedJob.jobId) agentRuntimeJobs.delete(projectPath);
      });
    });
    if (typeof child.unref === "function") child.unref();
    agentRuntimeJobs?.set(projectPath, { jobId: acceptedJob.jobId, child });

    let job = await updateAgentJob(projectPath, acceptedJob.jobId, {
      status: "running",
      startedAt: new Date().toISOString(),
      pid: Number.isSafeInteger(child.pid) && child.pid > 0 ? child.pid : null,
      message: `${agent.label} is running.`
    });
    runningPersisted = true;
    if (terminalEvent) job = await persistTerminal() || job;
    return agentJobResult(projectPath, job, { launched: true, idempotent: false });
  } catch (error) {
    const failed = await updateAgentJob(projectPath, acceptedJob.jobId, {
      status: "failed",
      completedAt: new Date().toISOString(),
      message: `${agent.label} failed to launch: ${String(error?.message || error).slice(0, 240)}`
    }).catch(() => ({
      ...acceptedJob,
      status: "failed",
      message: `${agent.label} failed to launch: ${String(error?.message || error).slice(0, 240)}`
    }));
    if (agentRuntimeJobs?.get(projectPath)?.jobId === acceptedJob.jobId) agentRuntimeJobs.delete(projectPath);
    return agentJobResult(projectPath, failed, { launched: false, idempotent: false, statusCode: 502 });
  }
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
