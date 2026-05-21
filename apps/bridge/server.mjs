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
    prompt: "Read agent-prompt.md and follow the Ultimate PPT Master Skill. Work in this folder and list final files."
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
  await writeProjectFile("project-brief.json", typeof payload.projectBrief === "string" ? payload.projectBrief : JSON.stringify(payload.projectBrief || {}, null, 2));
  await writeProjectFile("preview-web-deck.html", payload.previewWebDeckHtml || "");
  await writeProjectFile("engine-plan.md", payload.enginePlanMarkdown || payload.enginePlan || "");
  await writeProjectFile("quality-checklist.md", payload.qualityChecklist || "");
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
    attachments: attachmentResults.map(({ markdown, ...item }) => item),
    suggestedCommands: suggestedCommands(projectPath)
  };

  await writeProjectFile("extracted-source.md", `${extractedSections.join("\n")}\n`);
  await writeProjectFile("manifest.json", JSON.stringify(manifest, null, 2));

  return {
    ok: true,
    projectPath,
    files,
    manifest,
    suggestedCommands: manifest.suggestedCommands
  };
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
  return {
    codex: `cd ${quotedPath} && codex "Read agent-prompt.md and follow the Ultimate PPT Master Skill. Produce the requested deck and list final files."`,
    claude: `cd ${quotedPath} && claude "Read agent-prompt.md and follow SKILL.md from Ultimate PPT Master. Produce the requested deck and list final files."`,
    hermes: `cd ${quotedPath} && hermes "Read agent-prompt.md and use the Ultimate PPT Master Skill workflow."`,
    openclaw: `cd ${quotedPath} && openclaw "Read agent-prompt.md and use the Ultimate PPT Master Skill workflow."`,
    generic: `cd ${quotedPath} && read agent-prompt.md`
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
  return "# Ultimate PPT Master handoff\n\nOpen `agent-prompt.md`, review `extracted-source.md`, then run the suggested local Agent command from `manifest.json`.\n";
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
