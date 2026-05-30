#!/usr/bin/env node
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { lstat, mkdir, readlink, symlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
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
    prompt: "Read AGENTS.md, codex-task.md, and visual-element-kit.md first. Run or handle scripts/generate_visual_element_kit.py before deck production; if no image key is configured, use the Needs-Manual prompts. Execute the ChatGPT-generation-first formal-business workflow, update asset-plan.md and quality-report.json, then list final files."
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

  return createServer(async (request, response) => {
    const origin = request.headers.origin;
    const corsHeaders = corsForOrigin(origin);

    if (request.method === "OPTIONS") {
      writeJson(response, 204, {}, corsHeaders);
      return;
    }

    try {
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
        const body = await readJsonBody(request, maxBodyBytes);
        const result = await writeHandoffProject(body, { repoRoot, outputDir });
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
      writeJson(response, status, { ok: false, message: error?.message || "Bridge request failed." }, corsHeaders);
    }
  });
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
  const enrichedProjectBrief = {
    ...projectBrief,
    qualityProfile,
    qualityGate,
    workflowState,
    expectedArtifacts,
    reviewCommands
  };
  const slug = slugify(title);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const projectPath = join(outputDir, `${slug}-${timestamp}`);
  const attachmentsDir = join(projectPath, "attachments");
  const extractedDir = join(projectPath, "extracted");
  await mkdir(attachmentsDir, { recursive: true });
  await mkdir(extractedDir, { recursive: true });

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
  await writeProjectFile("visual-element-kit.md", payload.visualElementKit || defaultVisualElementKit({ title, qualityGate }));
  await writeProjectFile("codex-task.md", payload.codexTask || defaultCodexTask({ title, qualityGate, workflowState, expectedArtifacts, reviewCommands }));
  await writeProjectFile("AGENTS.md", payload.codexAgentGuide || defaultCodexAgentGuide({ qualityGate }));
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
    const result = await stageAttachment(item, { attachmentsDir, extractedDir, repoRoot });
    attachmentResults.push(result);
    if (result.markdown) {
      extractedSections.push("", `## ${result.name}`, "", result.markdown.trim());
    } else {
      extractedSections.push("", `## ${result.name}`, "", `Status: ${result.parseStatus}. ${result.message || "Kept as an attachment for the Agent."}`);
    }
  }

  const manifest = {
    version: BRIDGE_VERSION,
    createdAt: new Date().toISOString(),
    title,
    projectPath,
    repoRoot,
    qualityProfile,
    qualityGate,
    workflowState,
    expectedArtifacts,
    reviewCommands,
    attachments: attachmentResults.map(({ markdown, ...item }) => item),
    suggestedCommands: suggestedCommands(projectPath)
  };

  await writeProjectFile("extracted-source.md", `${extractedSections.join("\n")}\n`);
  await writeProjectFile("quality-report.json", JSON.stringify(createPendingQualityReport({ title, qualityProfile, qualityGate, workflowState, expectedArtifacts, reviewCommands }), null, 2));
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

function defaultQualityGate() {
  return {
    level: "formal-business",
    requiredInputs: [
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
      "HTML/PPTX expose enough layout types",
      "real image/brand assets are used or no-image strategy is explicit",
      "asset-plan.md records public searches, generated assets, citations, and insert targets",
      "visual-element-kit.md records the reusable ChatGPT-generated micro-assets",
      "PPTX contains editable text objects",
      "no b/c-style logo text fragments"
    ],
    reviewCommands: [
      "python3 scripts/audit_formal_delivery.py <project_path>"
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

function createPendingQualityReport({ title, qualityProfile, qualityGate, workflowState, expectedArtifacts, reviewCommands }) {
  return {
    version: BRIDGE_VERSION,
    title,
    status: "pending",
    createdAt: new Date().toISOString(),
    qualityProfile,
    qualityGate,
    workflowState,
    expectedArtifacts,
    reviewCommands,
    summary: {
      zh: "Design Doctor / 视觉复查尚未运行。请先生成预览和最终文件，再按 reviewCommands 运行检查；默认只报告问题和建议，只有明确要求时才自动修 SVG。",
      en: "Design Doctor has not run yet. Generate the preview and final files, then run reviewCommands. By default it reports issues and suggestions before automatic repair."
    },
    checks: []
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

function defaultCodexTask({ title, qualityGate, workflowState, expectedArtifacts, reviewCommands }) {
  const gateInputs = (qualityGate?.requiredInputs || []).map((item) => `- ${item}`).join("\n");
  const gateCriteria = (qualityGate?.acceptanceCriteria || []).map((item) => `- ${item}`).join("\n");
  const gateChecks = (qualityGate?.artifactChecks || []).map((item) => `- ${item}`).join("\n");
  const artifacts = (expectedArtifacts || []).map((item) => `- ${item}`).join("\n") || "- final PPTX and/or Web Deck artifacts requested in project-brief.json";
  const commands = (reviewCommands?.length ? reviewCommands : ["python3 scripts/audit_formal_delivery.py <project_path>"]).map((item) => `- ${item}`).join("\n");
  return `# Codex Task

Project: ${title}
Current workflow step: ${workflowState?.currentStep || "handoff"}
Blocked reason: ${workflowState?.blockedReason || "none"}

## Read First
1. AGENTS.md
2. manifest.json
3. project-brief.json
4. quality-checklist.md
5. asset-plan.md
6. visual-element-kit.md
7. agent-prompt.md
8. extracted-source.md and attachments/

## Formal Business Gate
Required inputs:
${gateInputs}

Acceptance criteria:
${gateCriteria}

Artifact checks:
${gateChecks}

## Asset Workflow
1. Inspect supplied attachments and extracted-source.md before searching.
2. Treat ChatGPT/OpenAI as the primary visual asset engine: generate custom visual language before final slide production.
3. From the repository root recorded in manifest.json, run: \`python3 scripts/generate_visual_element_kit.py <project_path>\`.
4. If no IMAGE_BACKEND/OpenAI key is configured, do not block: use the Needs-Manual prompts in images/image_prompts.md with ChatGPT and save outputs to the listed paths.
5. Create the visual-element-kit.md micro-assets: section divider, metric badge, process node, connector, icon accent, subtle pattern, and callout sticker.
6. Save generated assets under assets/generated/ and insert them into the PPTX/Web Deck as real image objects, not flattened full-slide screenshots.
7. Use public web search mainly for factual evidence, official references, brand boundaries, or source citations.
8. Record every generated asset prompt and every public source/license note in asset-plan.md.
9. Keep charts, tables, labels, and PPTX text editable wherever possible.

## Production Steps
1. Lock brand/fallback strategy, evidence boundaries, page rhythm, infographic strategy, asset-plan.md, and visual-element-kit.md.
2. Produce the requested PPTX/Web Deck using the Ultimate PPT Master Skill workflow.
3. Avoid repeated title-card pages; vary layouts across narrative, comparison, timeline/process, metric, decision, and closing pages.
4. Do not let logos degrade into b/c-style text fragments.
5. Run review commands and repair obvious layout, text overflow, image, and editability issues.
6. Update quality-report.json with checks run, issues found, repairs made, and remaining risk.

## Expected Artifacts
${artifacts}

## Review Commands
${commands}

Final response: list generated files, generated micro-assets inserted, public references used, review commands run, and any remaining risks.
`;
}

function defaultCodexAgentGuide({ qualityGate }) {
  const level = qualityGate?.level || "formal-business";
  return `# AGENTS.md

## Codex Local Rules
- Work in this handoff folder and the Ultimate PPT Master repository scripts only.
- Read codex-task.md before editing or generating deliverables.
- Keep private source material local. Do not upload private files, customer data, internal screenshots, or API keys unless the user explicitly approves.
- ChatGPT/OpenAI image generation is the primary visual asset engine. Read visual-element-kit.md and run or handle scripts/generate_visual_element_kit.py before final slide assembly when the deck needs visual richness.
- If no image backend/key is configured, use images/image_prompts.md Needs-Manual prompts with ChatGPT and save outputs under assets/generated/.
- Public web search is allowed mainly for evidence, official references, and brand boundaries; record sources and usage notes in asset-plan.md.
- Store generated outputs under assets/generated/ and record prompts in asset-plan.md.
- For level ${level}, do not finish with repeated title/card slides, flat PPTX screenshots, broken logo fragments, or missing quality-report.json.
- Run the formal delivery audit before final response whenever an HTML or PPTX artifact exists.
`;
}

async function stageAttachment(item, { attachmentsDir, extractedDir, repoRoot }) {
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
    markdown: ""
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
  if (item.dataBase64) {
    await writeFile(attachmentPath, Buffer.from(String(item.dataBase64), "base64"));
  } else {
    await writeFile(attachmentPath, String(item.text || ""), "utf8");
  }

  if (item.text && isTextExtension(extension)) {
    result.parseStatus = "textExtracted";
    result.extractedPath = result.attachmentPath;
    result.markdown = String(item.text);
    result.message = "Text was extracted in the browser.";
    return result;
  }

  const outputPath = join(extractedDir, `${name.replace(/\.[^.]+$/, "")}.md`);
  const conversion = runConverter({ repoRoot, input: attachmentPath, outputPath, extension });
  return { ...result, ...conversion };
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
  const instruction = "Read AGENTS.md, codex-task.md, visual-element-kit.md, asset-plan.md, quality-checklist.md, manifest.json, and project-brief.json first. Run or handle scripts/generate_visual_element_kit.py before deck production; if no image backend/key exists, use the Needs-Manual prompts in images/image_prompts.md with ChatGPT. Follow the Ultimate PPT Master Skill with ChatGPT-generation-first assets, insert reusable micro-assets when useful, run the formal delivery audit, update quality-report.json, then list final files.";
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
  return "# Ultimate PPT Master handoff\n\nFor Codex, open `AGENTS.md`, `codex-task.md`, and `visual-element-kit.md` first. Then review `asset-plan.md`, `agent-prompt.md`, and `extracted-source.md`, run or handle `scripts/generate_visual_element_kit.py` for ChatGPT-first visual micro-assets, use `Needs-Manual` prompts when no image key is configured, and run the suggested local Agent command from `manifest.json`.\n";
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
