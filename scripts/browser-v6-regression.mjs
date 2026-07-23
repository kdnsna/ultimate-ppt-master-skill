#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { createBridgeServer } from "../apps/bridge/server.mjs";

const repoRoot = resolve(import.meta.dirname, "..");
const storageKey = "ultimate-ppt-master-deck-session-v6";
const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function waitForCondition(predicate, label, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await wait(25);
  }
  throw new Error(`${label} timed out`);
}

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolvePort(address.port));
    });
  });
}

async function firstExisting(paths) {
  for (const path of paths) {
    try {
      await access(path, fsConstants.X_OK);
      return path;
    } catch {
      // Try the next known Chrome location.
    }
  }
  throw new Error(`Chrome executable not found. Set CHROME_PATH. Tried: ${paths.join(", ")}`);
}

async function waitForHttp(url, child, label, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.spawnError) throw new Error(`${label} could not start: ${child.spawnError.message}`);
    if (child.exitCode !== null) throw new Error(`${label} exited with code ${child.exitCode}: ${child.capturedOutput || "no child output"}`);
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // Startup race; retry until the deadline.
    }
    await wait(80);
  }
  throw new Error(`${label} did not become ready within ${timeoutMs} ms: ${child.capturedOutput || "no child output"}`);
}

function captureChildOutput(child) {
  child.capturedOutput = "";
  child.spawnError = null;
  const append = (chunk) => {
    child.capturedOutput = `${child.capturedOutput}${String(chunk)}`.slice(-8_000);
  };
  child.once("error", (error) => {
    child.spawnError = error;
    append(error.stack || error.message);
  });
  child.stdout?.on("data", append);
  child.stderr?.on("data", append);
  return child;
}

async function stopChild(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise((resolveExit) => child.once("exit", resolveExit));
  child.kill("SIGTERM");
  await Promise.race([exited, wait(2_000)]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function listenBridge(server) {
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(43188, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolveListen();
    });
  });
  return "http://127.0.0.1:43188";
}

async function closeBridge(server) {
  if (!server?.listening) return;
  await new Promise((resolveClose) => server.close(resolveClose));
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result || {});
    });
    socket.addEventListener("close", () => {
      for (const pending of this.pending.values()) pending.reject(new Error("Chrome DevTools connection closed"));
      this.pending.clear();
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolveOpen, reject) => {
      socket.addEventListener("open", resolveOpen, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    return new CdpClient(socket);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolveCommand, reject) => {
      this.pending.set(id, { method, resolve: resolveCommand, reject });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(client, page, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  }, page.sessionId);
  if (response.exceptionDetails) {
    const detail = response.exceptionDetails.exception?.description || response.exceptionDetails.text || "Runtime evaluation failed";
    throw new Error(detail);
  }
  return response.result?.value;
}

async function waitForExpression(client, page, expression, label, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await evaluate(client, page, expression);
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await wait(50);
  }
  throw new Error(`${label} timed out${lastError ? `: ${lastError.message}` : ""}`);
}

async function click(client, page, selector) {
  await evaluate(client, page, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!(element instanceof HTMLElement)) throw new Error(${JSON.stringify(`Missing clickable element: ${selector}`)});
    element.click();
    return true;
  })()`);
}

async function focus(client, page, selector) {
  await evaluate(client, page, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!(element instanceof HTMLElement)) throw new Error(${JSON.stringify(`Missing focus target: ${selector}`)});
    element.focus();
    return document.activeElement === element;
  })()`);
}

async function insertText(client, page, selector, text) {
  await focus(client, page, selector);
  await client.send("Input.insertText", { text }, page.sessionId);
}

async function importBrowserFiles(client, page, files) {
  return evaluate(client, page, `(() => {
    const specs = ${JSON.stringify(files)};
    const transfer = new DataTransfer();
    for (const spec of specs) {
      const content = spec.text === undefined ? new Uint8Array(spec.size || 0) : spec.text;
      transfer.items.add(new File([content], spec.name, { type: spec.type || 'application/octet-stream' }));
    }
    const input = document.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { configurable: true, value: transfer.files });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return transfer.files.length;
  })()`);
}

const keyCodes = {
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
  ArrowUp: 38,
  End: 35,
  Escape: 27,
  Home: 36,
  Tab: 9
};

async function pressKey(client, page, key, { shift = false } = {}) {
  const modifiers = shift ? 8 : 0;
  const code = key.startsWith("Arrow") ? key : key;
  const windowsVirtualKeyCode = keyCodes[key] || key.toUpperCase().charCodeAt(0);
  await client.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, modifiers, windowsVirtualKeyCode }, page.sessionId);
  await client.send("Input.dispatchKeyEvent", { type: "keyUp", key, code, modifiers, windowsVirtualKeyCode }, page.sessionId);
}

function makeSlides(status = "draft") {
  return Array.from({ length: 4 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const slideId = `P${number}`;
    const variants = ["A", "B", "C"].map((suffix, variantIndex) => ({
      id: `${slideId}-V${variantIndex + 1}`,
      label: `方案 ${suffix}`,
      layoutFamily: ["statement", "split", "evidence-grid"][variantIndex]
    }));
    return {
      slideId,
      page: slideId,
      role: index === 0 ? "anchor" : index === 3 ? "closing" : "evidence",
      title: `测试页面 ${number}`,
      takeaway: "这是一条足够长的测试结论，用于浏览器交互验收。",
      evidenceState: "grounded",
      evidenceRefs: ["source-1"],
      status,
      variants,
      selectedVariantId: variants[0].id
    };
  });
}

function makeSession({ phase = "intake", projectPath, status = "draft", sessionId } = {}) {
  const now = new Date().toISOString();
  return {
    schemaVersion: "deck-session-v6",
    sessionId: sessionId || `deck-test-${crypto.randomUUID()}`,
    phase,
    request: "测试管理层经营复盘 4 页",
    audience: "管理层",
    coreMessage: "必须基于真实证据做出经营决策。",
    outputPurpose: "editable-pptx",
    sources: [{ id: "source-1", name: "evidence.md", kind: "text", status: "ready" }],
    slides: makeSlides(status),
    questions: [],
    selectedDirectionId: "consulting-evidence",
    progress: { percent: phase === "review" ? 100 : 0, message: phase === "review" ? "本地项目已创建" : "等待生成" },
    routeDecision: {
      promptQuality: "complete",
      recommendedRoute: "formal-editable-pptx",
      decisionReason: "browser fixture",
      source: "user",
      classifierRoute: "formal-editable-pptx"
    },
    ...(projectPath ? { projectPath } : {}),
    createdAt: now,
    updatedAt: now
  };
}

function browserFixtureSource(config) {
  const safeConfig = JSON.stringify(config).replaceAll("<", "\\u003c");
  return `(() => {
    const config = ${safeConfig};
    const storageKey = ${JSON.stringify(storageKey)};
    const fixtureSeedKey = storageKey + ':fixture-seeded';
    if (!sessionStorage.getItem(fixtureSeedKey)) {
      if (config.legacySession) {
        sessionStorage.removeItem(storageKey);
        localStorage.setItem(storageKey, JSON.stringify(config.legacySession));
      } else {
        localStorage.removeItem(storageKey);
        if (config.session) sessionStorage.setItem(storageKey, JSON.stringify(config.session));
      }
      sessionStorage.setItem(fixtureSeedKey, '1');
    }
    const testState = window.__v6TestBridge = {
      requests: [],
      artifactRequests: 0,
      agentStatusRequests: 0,
      clipboardWrites: [],
      fileTextReads: [],
      fileReaderReads: [],
      eventSourceUrls: [],
      scrollCalls: []
    };
    if (config.clipboardReject || config.clipboardResolve) {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText(value) {
            testState.clipboardWrites.push(String(value));
            return config.clipboardReject ? Promise.reject(new DOMException('Clipboard denied', 'NotAllowedError')) : Promise.resolve();
          }
        }
      });
    }
    if (config.trackFileReads) {
      const nativeText = File.prototype.text;
      File.prototype.text = function(...args) {
        testState.fileTextReads.push(this.name);
        return nativeText.apply(this, args);
      };
      const nativeReadAsDataURL = FileReader.prototype.readAsDataURL;
      FileReader.prototype.readAsDataURL = function(file) {
        testState.fileReaderReads.push(file?.name || 'unknown');
        return nativeReadAsDataURL.call(this, file);
      };
    }
    const nativeScrollTo = window.scrollTo.bind(window);
    window.scrollTo = (...args) => {
      testState.scrollCalls.push(args[0]);
      try { return nativeScrollTo(...args); } catch { return undefined; }
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" }
    });
    window.fetch = async (input, init = {}) => {
      const url = String(typeof input === "string" ? input : input.url);
      const method = String(init.method || "GET").toUpperCase();
      testState.requests.push({ url, method, body: init.body || "" });
      if (!url.startsWith("http://127.0.0.1:43188")) return globalThis.__nativeFetch(input, init);
      if (url.endsWith("/health")) {
        if (!config.health) throw new TypeError("Bridge offline fixture");
        return json(config.health);
      }
      if (url.includes("/events?")) return json({ ok: true });
      if (url.endsWith("/handoff")) {
        if (config.handoffDelay) await new Promise((resolve) => setTimeout(resolve, config.handoffDelay));
        return json(config.handoff || { ok: true, projectPath: "/tmp/mock/default", files: [], suggestedCommands: {} });
      }
      if (url.endsWith("/agent/launch")) return json(config.agentLaunch || { ok: true, launched: false, command: "codex /tmp/mock/default", message: "Copy command" });
      if (url.includes("/agent/status?")) {
        testState.agentStatusRequests += 1;
        return json(config.agentStatus || { ok: true, projectPath: config.session?.projectPath || config.handoff?.projectPath || "/tmp/mock/default", status: "idle", job: null });
      }
      if (url.includes("/projects/artifacts?")) {
        testState.artifactRequests += 1;
        return json({ ok: true, artifacts: config.artifacts || [] });
      }
      if (url.endsWith("/slides/regenerate")) return json({ ok: true });
      return json({ ok: false, message: "Unhandled browser fixture route" }, 404);
    };
    class FixtureEventSource {
      constructor(url) {
        this.url = String(url);
        this.readyState = 1;
        testState.eventSourceUrls.push(this.url);
      }
      close() { this.readyState = 2; }
      addEventListener() {}
      removeEventListener() {}
    }
    window.EventSource = FixtureEventSource;
  })();`;
}

async function createPage(client, baseUrl, contextId, config = {}, { reducedMotion = false, background = false, viewport, useRealBridge = false } = {}) {
  const { targetId } = await client.send("Target.createTarget", { url: "about:blank", browserContextId: contextId, background });
  const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
  const page = { targetId, sessionId };
  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  if (viewport) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width <= 480
    }, sessionId);
  }
  await client.send("Page.addScriptToEvaluateOnNewDocument", {
    source: useRealBridge
      ? `(() => {
          const storageKey = ${JSON.stringify(storageKey)};
          const fixtureSeedKey = storageKey + ':fixture-seeded';
          if (!sessionStorage.getItem(fixtureSeedKey)) {
            localStorage.removeItem(storageKey);
            ${config.session ? `sessionStorage.setItem(storageKey, ${JSON.stringify(JSON.stringify(config.session))});` : "sessionStorage.removeItem(storageKey);"}
            sessionStorage.setItem(fixtureSeedKey, '1');
          }
        })();`
      : `globalThis.__nativeFetch = globalThis.fetch.bind(globalThis);\n${browserFixtureSource(config)}`
  }, sessionId);
  if (reducedMotion) {
    await client.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }]
    }, sessionId);
  }
  await client.send("Page.navigate", { url: baseUrl }, sessionId);
  await waitForExpression(client, page, "Boolean(document.querySelector('.v6-app'))", "v6 workspace mount");
  return page;
}

async function createStaticPage(client, url, contextId, selector, viewport) {
  const { targetId } = await client.send("Target.createTarget", { url: "about:blank", browserContextId: contextId });
  const { sessionId } = await client.send("Target.attachToTarget", { targetId, flatten: true });
  const page = { targetId, sessionId };
  await client.send("Page.enable", {}, sessionId);
  await client.send("Runtime.enable", {}, sessionId);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width <= 480
  }, sessionId);
  await client.send("Page.navigate", { url }, sessionId);
  await waitForExpression(client, page, `(
    document.readyState === "complete"
    && Boolean(document.querySelector(${JSON.stringify(selector)}))
    && [...document.styleSheets].some((sheet) => Boolean(sheet.href))
  )`, `static page and stylesheet mount: ${selector}`);
  return page;
}

async function disposeContext(client, contextId) {
  await client.send("Target.disposeBrowserContext", { browserContextId: contextId });
}

async function newContext(client) {
  const { browserContextId } = await client.send("Target.createBrowserContext");
  return browserContextId;
}

function health({ allowLaunch = false, available = false } = {}) {
  return {
    ok: true,
    version: "6.3.8-test",
    outputDir: "/tmp/mock-output",
    repoRoot,
    allowLaunch,
    agents: [{ id: "codex", label: "Codex", available, command: "codex", path: "/usr/local/bin/codex" }],
    providers: []
  };
}

async function primaryAction(client, page) {
  return evaluate(client, page, `(() => {
    const actions = [...document.querySelectorAll('[data-primary-action="true"]')].filter((item) => {
      const style = getComputedStyle(item);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    return actions.map((item) => ({
      state: item.getAttribute("data-runtime-state"),
      text: item.textContent.trim(),
      tag: item.tagName,
      disabled: item instanceof HTMLButtonElement ? item.disabled : false
    }));
  })()`);
}

async function assertPrimaryAction(client, page, expectedState, expectedText) {
  const actions = await waitForExpression(client, page, `(() => {
    const actions = [...document.querySelectorAll('[data-primary-action="true"]')].filter((item) => getComputedStyle(item).display !== "none");
    return actions.length === 1 && actions[0].getAttribute("data-runtime-state") === ${JSON.stringify(expectedState)};
  })()`, `primary action ${expectedState}`);
  assert.equal(actions, true);
  const detail = await primaryAction(client, page);
  assert.equal(detail.length, 1, `${expectedState} must expose exactly one primary action`);
  assert.equal(detail[0].state, expectedState);
  assert.match(detail[0].text, new RegExp(expectedText));
  return detail[0];
}

async function testKeyboardDialogAndReducedMotion(client, baseUrl) {
  const contextId = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, contextId, { health: null }, { reducedMotion: true });
    await client.send("Target.activateTarget", { targetId: page.targetId });

    await click(client, page, ".bridge-indicator");
    await waitForExpression(client, page, "document.activeElement?.classList.contains('diagnostics-dialog')", "dialog initial focus");
    await pressKey(client, page, "Tab");
    assert.equal(await evaluate(client, page, "document.activeElement?.getAttribute('aria-label')"), "\u5173\u95ed");
    await pressKey(client, page, "Tab", { shift: true });
    assert.equal(await evaluate(client, page, `(() => {
      const focusable = [...document.querySelector('.diagnostics-dialog').querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      return document.activeElement === focusable.at(-1);
    })()`), true, "Shift+Tab must wrap to the last dialog control");
    await pressKey(client, page, "Escape");
    await waitForExpression(client, page, "!document.querySelector('.diagnostics-dialog')", "dialog close");
    assert.equal(await evaluate(client, page, "document.activeElement?.classList.contains('bridge-indicator')"), true, "dialog must restore trigger focus");

    await focus(client, page, '.output-purpose [role="radio"][aria-checked="true"]');
    await pressKey(client, page, "End");
    await waitForExpression(client, page, `(() => {
      const radios = [...document.querySelectorAll('.output-purpose [role="radio"]')];
      return radios[2]?.getAttribute('aria-checked') === 'true' && document.activeElement === radios[2] && radios.map((item) => item.tabIndex).join(',') === '-1,-1,0';
    })()`, "output radio End");
    await pressKey(client, page, "Home");
    await waitForExpression(client, page, `(() => {
      const radios = [...document.querySelectorAll('.output-purpose [role="radio"]')];
      return radios[0]?.getAttribute('aria-checked') === 'true' && document.activeElement === radios[0] && radios.map((item) => item.tabIndex).join(',') === '0,-1,-1';
    })()`, "output radio Home");
    await pressKey(client, page, "ArrowRight");
    await waitForExpression(client, page, `(() => {
      const radios = [...document.querySelectorAll('.output-purpose [role="radio"]')];
      return radios[1]?.getAttribute('aria-checked') === 'true' && document.activeElement === radios[1];
    })()`, "output radio ArrowRight");

    await insertText(client, page, "#deck-request", "\u6d4b\u8bd5\u7ba1\u7406\u5c42\u7ecf\u8425\u590d\u76d8 4 \u9875");
    await click(client, page, ".intake-continue");
    await waitForExpression(client, page, "document.querySelector('.v6-app')?.getAttribute('data-phase') === 'outline'", "outline transition");
    await waitForExpression(
      client,
      page,
      "window.__v6TestBridge.scrollCalls.at(-1)?.behavior === 'auto'",
      "reduced-motion phase scroll"
    );
    const reduced = await evaluate(client, page, `({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      scrollBehavior: window.__v6TestBridge.scrollCalls.at(-1)?.behavior,
      transitionDuration: getComputedStyle(document.querySelector('.storyboard-continue')).transitionDuration,
      animationDuration: getComputedStyle(document.querySelector('.storyboard-continue')).animationDuration
    })`);
    assert.equal(reduced.matches, true);
    assert.equal(reduced.scrollBehavior, "auto", "phase transition must not smooth-scroll under reduced motion");
    assert.ok(Number.parseFloat(reduced.transitionDuration) <= 0.00001, `unexpected reduced transition duration: ${reduced.transitionDuration}`);
    assert.ok(Number.parseFloat(reduced.animationDuration) <= 0.00001, `unexpected reduced animation duration: ${reduced.animationDuration}`);

    await focus(client, page, '.variant-strip [role="radio"][aria-checked="true"]');
    await pressKey(client, page, "End");
    await waitForExpression(client, page, `(() => {
      const radios = [...document.querySelectorAll('.variant-strip [role="radio"]')];
      return radios.at(-1)?.getAttribute('aria-checked') === 'true' && document.activeElement === radios.at(-1);
    })()`, "variant radio End");
    await pressKey(client, page, "Home");
    await waitForExpression(client, page, `(() => {
      const radios = [...document.querySelectorAll('.variant-strip [role="radio"]')];
      return radios[0]?.getAttribute('aria-checked') === 'true' && document.activeElement === radios[0];
    })()`, "variant radio Home");

    await click(client, page, ".storyboard-continue");
    await waitForExpression(client, page, "document.querySelector('.v6-app')?.getAttribute('data-phase') === 'generating'", "generating transition");
    await waitForExpression(client, page, "document.activeElement === document.querySelector('.phase-heading h2')", "generating phase focus reset");
    await focus(client, page, '.direction-grid [role="radio"][aria-checked="true"]');
    await pressKey(client, page, "End");
    await waitForExpression(client, page, `(() => {
      const radios = [...document.querySelectorAll('.direction-grid [role="radio"]')];
      return radios.at(-1)?.getAttribute('aria-checked') === 'true' && document.activeElement === radios.at(-1);
    })()`, "direction radio End");
    await pressKey(client, page, "Home");
    await waitForExpression(client, page, `(() => {
      const radios = [...document.querySelectorAll('.direction-grid [role="radio"]')];
      return radios[0]?.getAttribute('aria-checked') === 'true' && document.activeElement === radios[0];
    })()`, "direction radio Home");
    console.log("PASS keyboard radio, dialog focus, Escape/return, reduced-motion");
  } finally {
    await disposeContext(client, contextId);
  }
}

async function testResponsiveViewports(client, baseUrl) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const contextId = await newContext(client);
    try {
      const page = await createPage(client, baseUrl, contextId, { health: null }, { viewport });
      await client.send("Target.activateTarget", { targetId: page.targetId });
      const layout = await evaluate(client, page, `(() => {
        const request = document.querySelector('#deck-request').getBoundingClientRect();
        const upload = document.querySelector('.drop-target').getBoundingClientRect();
        const primary = document.querySelector('[data-primary-action="true"]').getBoundingClientRect();
        return {
          innerWidth,
          innerHeight,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          request: { top: request.top, bottom: request.bottom, width: request.width },
          upload: { top: upload.top, bottom: upload.bottom, width: upload.width },
          primary: { top: primary.top, bottom: primary.bottom, width: primary.width },
          primaryCount: document.querySelectorAll('[data-primary-action="true"]').length
        };
      })()`);
      assert.equal(layout.innerWidth, viewport.width);
      assert.equal(layout.innerHeight, viewport.height);
      assert.ok(layout.scrollWidth <= layout.clientWidth, `${viewport.width}px workspace has horizontal overflow: ${layout.scrollWidth} > ${layout.clientWidth}`);
      assert.ok(layout.request.top < layout.innerHeight && layout.request.bottom > 0 && layout.request.width > 0, `${viewport.width}px task input must be visible in the first viewport`);
      assert.equal(layout.primaryCount, 1, `${viewport.width}px intake must expose exactly one primary action`);
      for (const [name, rect] of [["upload", layout.upload], ["primary action", layout.primary]]) {
        assert.ok(rect.width > 0 && rect.top >= 0 && rect.bottom <= layout.scrollHeight + 1, `${viewport.width}px ${name} must be reachable by natural page scrolling`);
      }
      await evaluate(client, page, `document.querySelector('[data-primary-action="true"]').scrollIntoView({ block: 'center' }); true`);
      await waitForExpression(client, page, `(() => {
        const rect = document.querySelector('[data-primary-action="true"]').getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight;
      })()`, `${viewport.width}px primary action scroll reachability`);
    } finally {
      await disposeContext(client, contextId);
    }
  }
  console.log("PASS 1440x900 and 390x844 input/overflow/natural-scroll primary-action regression");
}

async function testClipboardFailureTruthfulness(client, baseUrl) {
  const contextId = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, contextId, {
      session: makeSession({ phase: "generating" }),
      health: null,
      clipboardReject: true
    });
    await click(client, page, '[data-primary-action="true"]');
    await waitForExpression(client, page, "document.querySelector('.workspace-error')?.textContent.includes('浏览器未允许复制')", "clipboard rejection feedback");
    assert.equal(await evaluate(client, page, "document.querySelector('.v6-live-region')?.textContent.includes('已复制')"), false, "clipboard rejection must never announce success");
    assert.equal(await evaluate(client, page, "window.__v6TestBridge.clipboardWrites.length"), 1);
    await click(client, page, ".bridge-indicator");
    assert.match(await evaluate(client, page, "document.querySelector('.diagnostics-command code')?.textContent || document.querySelector('.diagnostics-dialog code')?.textContent || ''"), /npm run bridge/);
    console.log("PASS clipboard rejection reports failure and keeps a manually selectable Bridge command");
  } finally {
    await disposeContext(client, contextId);
  }
}

async function testSourceImportBoundaries(client, baseUrl) {
  const duplicateContext = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, duplicateContext, { health: null, trackFileReads: true });
    assert.equal(await importBrowserFiles(client, page, [
      { name: "同名资料.md", type: "text/markdown", text: "# 第一份\n\n独立证据 A" },
      { name: "同名资料.md", type: "text/markdown", text: "# 第二份\n\n独立证据 B" }
    ]), 2);
    await waitForExpression(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sources.length === 2`, "same-name source import");
    const beforeDelete = await evaluate(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sources`);
    assert.equal(beforeDelete[0].name, beforeDelete[1].name);
    assert.notEqual(beforeDelete[0].id, beforeDelete[1].id, "same-name files must receive independent source IDs");
    await click(client, page, ".source-list article:first-child button");
    await waitForExpression(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sources.length === 1`, "same-name source independent removal");
    const afterDelete = await evaluate(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sources`);
    assert.equal(afterDelete[0].id, beforeDelete[1].id, "removing one same-name source must retain the other source");
    assert.deepEqual(await evaluate(client, page, "window.__v6TestBridge.fileTextReads"), ["同名资料.md", "同名资料.md"]);
  } finally {
    await disposeContext(client, duplicateContext);
  }

  const countContext = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, countContext, { health: null, trackFileReads: true });
    const files = Array.from({ length: 26 }, (_, index) => ({
      name: `source-${String(index + 1).padStart(2, "0")}.md`,
      type: "text/markdown",
      text: `# 资料 ${index + 1}\n\n可验证内容 ${index + 1}`
    }));
    assert.equal(await importBrowserFiles(client, page, files), 26);
    await waitForExpression(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sources.length === 24`, "24-source cap");
    assert.equal(await evaluate(client, page, "window.__v6TestBridge.fileTextReads.length"), 24, "files beyond the 24-source cap must not be read");
    assert.match(await evaluate(client, page, "document.querySelector('.source-error')?.textContent || ''"), /最多保留 24 份资料，已忽略 2 份/);
  } finally {
    await disposeContext(client, countContext);
  }

  const byteContext = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, byteContext, { health: null, trackFileReads: true });
    assert.equal(await importBrowserFiles(client, page, [
      { name: "oversized.bin", size: 33 * 1024 * 1024 }
    ]), 1);
    await waitForExpression(client, page, "document.querySelector('.source-error')?.textContent.includes('超过单文件 32 MB')", "32MB source rejection");
    assert.equal(await evaluate(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sources.length`), 0);
    assert.deepEqual(await evaluate(client, page, "({ text: window.__v6TestBridge.fileTextReads, binary: window.__v6TestBridge.fileReaderReads })"), { text: [], binary: [] }, "oversized files must be rejected before any read");

    assert.equal(await importBrowserFiles(client, page, [
      { name: "accepted-24mb.bin", size: 24 * 1024 * 1024 },
      { name: "rejected-total-17mb.bin", size: 17 * 1024 * 1024 }
    ]), 2);
    await waitForExpression(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sources.length === 1`, "40MB aggregate source rejection", 20_000);
    assert.deepEqual(await evaluate(client, page, "window.__v6TestBridge.fileReaderReads"), ["accepted-24mb.bin"], "the file crossing the 40MB cap must not be read");
    assert.match(await evaluate(client, page, "document.querySelector('.source-error')?.textContent || ''"), /资料总量超过 40 MB，未读取/);
  } finally {
    await disposeContext(client, byteContext);
  }

  console.log("PASS source import IDs/removal and 24-file/32MB/40MB pre-read boundaries");
}

async function testBenchmarkResponsiveViewports(client, baseUrl) {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const contextId = await newContext(client);
    try {
      const page = await createStaticPage(client, `${baseUrl}benchmark/index.html`, contextId, "#main", viewport);
      const layout = await evaluate(client, page, `(() => {
        const buttons = [...document.querySelectorAll('.hero .actions .button')].map((button) => {
          const rect = button.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width };
        });
        return {
          innerWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          buttons
        };
      })()`);
      assert.equal(layout.innerWidth, viewport.width);
      assert.ok(layout.scrollWidth <= layout.clientWidth, `${viewport.width}px benchmark has horizontal overflow: ${layout.scrollWidth} > ${layout.clientWidth}`);
      assert.equal(layout.buttons.length, 2, "benchmark hero must expose the two representative artifact actions");
      for (const button of layout.buttons) {
        assert.ok(button.width > 0 && button.left >= 0 && button.right <= viewport.width + 0.5, `${viewport.width}px benchmark action must stay inside the viewport`);
      }
      if (viewport.width === 390) {
        assert.ok(layout.buttons[1].top >= layout.buttons[0].bottom, "390px benchmark actions must stack instead of clipping horizontally");
      }
    } finally {
      await disposeContext(client, contextId);
    }
  }
  console.log("PASS benchmark 1440x900 and 390x844 overflow/action layout regression");
}

async function testLegacySessionMigration(client, baseUrl) {
  const contextId = await newContext(client);
  try {
    const legacy = makeSession({ phase: "review", projectPath: "/tmp/mock/legacy-migrated" });
    const migratedTab = await createPage(client, baseUrl, contextId, { legacySession: legacy, health: null });
    await waitForExpression(client, migratedTab, "document.querySelector('.v6-app')?.dataset.phase === 'review'", "legacy session review restore");
    const migrated = await evaluate(client, migratedTab, `({
      session: JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})),
      legacy: localStorage.getItem(${JSON.stringify(storageKey)}),
      projectText: document.querySelector('.handoff-ready code')?.textContent
    })`);
    assert.equal(migrated.session.sessionId, legacy.sessionId);
    assert.equal(migrated.session.projectPath, legacy.projectPath);
    assert.equal(migrated.projectText, legacy.projectPath);
    assert.equal(migrated.legacy, null, "legacy localStorage key must be removed after migration");

    const freshTab = await createPage(client, baseUrl, contextId, { health: null });
    const fresh = await evaluate(client, freshTab, `({
      session: JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})),
      legacy: localStorage.getItem(${JSON.stringify(storageKey)})
    })`);
    assert.notEqual(fresh.session.sessionId, legacy.sessionId, "legacy migration must apply only to the current tab");
    assert.equal(fresh.session.projectPath, undefined);
    assert.equal(fresh.legacy, null);
    console.log("PASS one-time legacy localStorage to current-tab sessionStorage migration");
  } finally {
    await disposeContext(client, contextId);
  }
}

async function testTabIsolationAndRefresh(client, baseUrl) {
  const contextId = await newContext(client);
  try {
    const common = {
      health: health(),
      handoff: { ok: true, projectPath: "/tmp/mock/project-a", sessionId: "response-session-a", files: [], suggestedCommands: {} },
      agentLaunch: { ok: true, launched: false, command: "codex /tmp/mock/project-a", message: "Copy command" },
      artifacts: [],
      agentStatus: {
        ok: true,
        projectPath: "/tmp/mock/url-reconciled",
        status: "failed",
        job: { status: "failed", message: "fixture retry required" }
      }
    };
    const tabA = await createPage(client, baseUrl, contextId, common);
    const tabB = await createPage(client, baseUrl, contextId, common);
    const initial = await Promise.all([
      evaluate(client, tabA, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sessionId`),
      evaluate(client, tabB, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).sessionId`)
    ]);
    assert.notEqual(initial[0], initial[1], "two tabs must start with different session ids");

    await insertText(client, tabB, "#deck-request", "\u6807\u7b7e\u9875 B \u72ec\u7acb\u4efb\u52a1 4 \u9875");
    await waitForExpression(client, tabB, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).request.includes('\u6807\u7b7e\u9875 B')`, "tab B session write");

    await insertText(client, tabA, "#deck-request", "\u6807\u7b7e\u9875 A \u7ecf\u8425\u590d\u76d8 4 \u9875");
    await click(client, tabA, ".intake-continue");
    await waitForExpression(client, tabA, "document.querySelector('.v6-app')?.dataset.phase === 'outline'", "tab A outline");
    await click(client, tabA, ".storyboard-continue");
    await waitForExpression(client, tabA, "document.querySelector('.v6-app')?.dataset.phase === 'generating'", "tab A generating");
    await click(client, tabA, '[data-primary-action="true"]');
    await waitForExpression(client, tabA, "document.querySelector('.v6-app')?.dataset.phase === 'review' && document.querySelector('.handoff-ready code')?.textContent.includes('/tmp/mock/project-a')", "tab A handoff completion");

    const stateA = await evaluate(client, tabA, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)}))`);
    const stateB = await evaluate(client, tabB, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)}))`);
    assert.equal(stateA.projectPath, "/tmp/mock/project-a");
    assert.equal(stateB.projectPath, undefined, "tab A projectPath must not leak into tab B");
    assert.match(stateB.request, /\u6807\u7b7e\u9875 B/);
    assert.equal(await evaluate(client, tabB, "document.querySelector('.handoff-ready') === null"), true);

    const sseA = await evaluate(client, tabA, "window.__v6TestBridge.eventSourceUrls.at(-1)");
    const sseB = await evaluate(client, tabB, "window.__v6TestBridge.eventSourceUrls.at(-1)");
    assert.match(sseA, new RegExp(encodeURIComponent(stateA.sessionId)));
    assert.match(sseB, new RegExp(encodeURIComponent(stateB.sessionId)));

    await client.send("Page.reload", { ignoreCache: true }, tabA.sessionId);
    await waitForExpression(client, tabA, "document.querySelector('.v6-app')?.dataset.phase === 'review' && document.querySelector('.handoff-ready code')?.textContent.includes('/tmp/mock/project-a')", "tab A refresh restore");
    const restoredA = await evaluate(client, tabA, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)}))`);
    assert.equal(restoredA.sessionId, stateA.sessionId);
    assert.equal(restoredA.projectPath, stateA.projectPath);

    await client.send("Page.reload", { ignoreCache: true }, tabB.sessionId);
    await waitForExpression(client, tabB, "document.querySelector('.v6-app')?.dataset.phase === 'intake'", "tab B refresh restore");
    const restoredB = await evaluate(client, tabB, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)}))`);
    assert.equal(restoredB.sessionId, stateB.sessionId);
    assert.equal(restoredB.projectPath, undefined);
    assert.match(restoredB.request, /\u6807\u7b7e\u9875 B/);
    console.log("PASS two-tab session/projectPath isolation and per-tab refresh restore");
  } finally {
    await disposeContext(client, contextId);
  }
}

async function testHandoffSourceAndEvidenceReconciliation(client, baseUrl) {
  const contextId = await newContext(client);
  try {
    const session = makeSession({ phase: "generating", sessionId: "url-reconciliation" });
    session.sources = [{ id: "url-source", name: "https://example.com/evidence", kind: "url", status: "local-parse" }];
    session.slides[1].title = "用户修改后的 P02 标题";
    session.slides[1].takeaway = "用户修改后的 P02 结论必须保持不变。";
    session.slides[1].selectedVariantId = session.slides[1].variants[2].id;
    const reconciledStoryboard = {
      slides: session.slides.map((slide, index) => ({
        slideId: slide.slideId,
        evidenceState: "grounded",
        evidenceRefs: [`URL-CLAIM-${index + 1}`],
        // These fields deliberately conflict and must never overwrite the user contract.
        title: "Bridge title must not replace user title",
        takeaway: "Bridge takeaway must not replace user takeaway",
        selectedVariantId: slide.variants[0].id
      }))
    };
    const page = await createPage(client, baseUrl, contextId, {
      session,
      health: health(),
      handoff: {
        ok: true,
        sessionId: session.sessionId,
        projectPath: "/tmp/mock/url-reconciled",
        files: ["manifest.json", "storyboard.json"],
        suggestedCommands: { codex: "codex /tmp/mock/url-reconciled" },
        manifest: {
          attachments: [{ id: "url-source", parseStatus: "extracted", ingestion: "converted" }],
          evidenceSources: [{ id: "url-source", verified: true }],
          expectationFit: { readyForProduction: true, sourceAdequacy: "thin" }
        },
        storyboard: reconciledStoryboard
      },
      artifacts: []
    });
    await assertPrimaryAction(client, page, "bridge-no-agent", "创建本地项目");
    await click(client, page, '[data-primary-action="true"]');
    await waitForExpression(client, page, "document.querySelector('.v6-app')?.dataset.phase === 'review'", "URL handoff reconciliation review");
    const restored = await evaluate(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)}))`);
    assert.equal(restored.sources[0].status, "ready", "verified Bridge URL ingestion must become ready in the session contract");
    assert.equal(restored.slides[1].title, session.slides[1].title);
    assert.equal(restored.slides[1].takeaway, session.slides[1].takeaway);
    assert.equal(restored.slides[1].selectedVariantId, session.slides[1].selectedVariantId);
    assert.equal(restored.slides[1].evidenceState, "grounded");
    assert.deepEqual(restored.slides[1].evidenceRefs, ["URL-CLAIM-2"]);
    assert.equal(await evaluate(client, page, "document.querySelector('.draft-warning') === null"), true, "verified URL ingestion must remove the false structure-only warning");
    await click(client, page, ".slide-filmstrip > button:nth-child(2)");
    await click(client, page, ".inspector-actions > button:first-child");
    await waitForExpression(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).slides[1].status === 'approved'`, "review approval before refresh");

    await client.send("Page.reload", { ignoreCache: true }, page.sessionId);
    await waitForExpression(client, page, "document.querySelector('.v6-app')?.dataset.phase === 'review'", "URL reconciliation refresh restore");
    const refreshed = await evaluate(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)}))`);
    assert.equal(refreshed.sources[0].status, "ready");
    assert.equal(refreshed.slides[1].status, "approved", "refresh must preserve review approvals/status instead of silently reopening them");
    assert.deepEqual(refreshed.slides[1].evidenceRefs, ["URL-CLAIM-2"]);
    assert.equal(await evaluate(client, page, "document.querySelector('.draft-warning') === null"), true);

    const retrySession = makeSession({ phase: "review", projectPath: "/tmp/mock/url-retry", sessionId: "url-retry" });
    retrySession.sources = [{ id: "url-source", name: "https://example.com/evidence", kind: "url", status: "ready" }];
    const retryPage = await createPage(client, baseUrl, contextId, {
      session: retrySession,
      health: health(),
      agentStatus: {
        ok: true,
        projectPath: retrySession.projectPath,
        status: "failed",
        job: { jobId: "url-retry-failed", status: "failed", command: "codex", message: "fixture retry required" }
      },
      handoff: {
        ok: true,
        sessionId: retrySession.sessionId,
        projectPath: "/tmp/mock/url-retry-2",
        files: ["manifest.json"],
        suggestedCommands: { codex: "codex /tmp/mock/url-retry-2" },
        manifest: { evidenceSources: [{ id: "url-source", verified: true }] }
      },
      artifacts: []
    });
    await assertPrimaryAction(client, retryPage, "quality-blocked", "Agent 未完成，返回重新创建项目");
    await click(client, retryPage, '[data-primary-action="true"][data-runtime-state="quality-blocked"]');
    await waitForExpression(client, retryPage, "document.querySelector('.v6-app')?.dataset.phase === 'generating'", "verified URL retry route");
    await click(client, retryPage, '[data-primary-action="true"][data-runtime-state="bridge-no-agent"]');
    await waitForExpression(client, retryPage, "window.__v6TestBridge.requests.some((request) => request.url.endsWith('/handoff'))", "verified URL retry request");
    const retryPayload = await evaluate(client, retryPage, `JSON.parse(window.__v6TestBridge.requests.find((request) => request.url.endsWith('/handoff')).body)`);
    assert.equal(retryPayload.projectBrief.briefMode, "source-first", "Bridge-verified URL must remain a real source on retry");
    assert.equal(retryPayload.workflowState.blockedReason, "");
    assert.equal(retryPayload.attachments[0].url, "https://example.com/evidence");
    assert.doesNotMatch(retryPayload.sourceMarkdown, /undefined/);

    console.log("PASS handoff URL/source + slide evidence reconciliation preserves user storyboard and refresh state");
  } finally {
    await disposeContext(client, contextId);
  }
}

async function testRuntimePrimaryStates(client, baseUrl) {
  const cases = [
    {
      state: "bridge-offline",
      text: "\u590d\u5236\u672c\u673a\u8fde\u63a5\u547d\u4ee4",
      config: { session: makeSession({ phase: "generating" }), health: null }
    },
    {
      state: "bridge-no-agent",
      text: "\u521b\u5efa\u672c\u5730\u9879\u76ee",
      config: { session: makeSession({ phase: "generating" }), health: health() }
    },
    {
      state: "agent-launchable",
      text: "\u521b\u5efa\u9879\u76ee\u5e76\u542f\u52a8 Codex",
      config: { session: makeSession({ phase: "generating" }), health: health({ allowLaunch: true, available: true }) }
    },
    {
      state: "generating",
      text: "Codex 已启动",
      config: {
        session: makeSession({ phase: "review", projectPath: "/tmp/mock/running" }),
        health: health({ allowLaunch: true, available: true }),
        agentStatus: {
          ok: true,
          projectPath: "/tmp/mock/running",
          status: "running",
          job: { jobId: "job-running", status: "running", command: "codex", message: "Codex is running.", acceptedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        }
      }
    },
    {
      state: "artifact-complete",
      text: "\u4e0b\u8f7d PPTX",
      config: {
        session: makeSession({ phase: "review", projectPath: "/tmp/mock/complete", status: "approved" }),
        health: health(),
        artifacts: [{ name: "final.pptx", kind: "pptx", relativePath: "exports/final.pptx", size: 2048, modifiedAt: new Date().toISOString(), verification: "passed" }]
      }
    },
    {
      state: "quality-blocked",
      text: "\u67e5\u770b\u963b\u65ad\u539f\u56e0\u5e76\u91cd\u65b0\u68c0\u67e5",
      config: {
        session: makeSession({ phase: "review", projectPath: "/tmp/mock/blocked" }),
        health: health(),
        artifacts: [{ name: "quality-report.json", kind: "report", relativePath: "quality-report.json", size: 1024, modifiedAt: new Date().toISOString(), verification: "blocked" }]
      }
    }
  ];

  for (const testCase of cases) {
    const contextId = await newContext(client);
    try {
      const page = await createPage(client, baseUrl, contextId, testCase.config);
      await assertPrimaryAction(client, page, testCase.state, testCase.text);
    } finally {
      await disposeContext(client, contextId);
    }
  }

  const warningContext = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, warningContext, {
      session: makeSession({ phase: "review", projectPath: "/tmp/mock/warning" }),
      health: health(),
      artifacts: [{ name: "final.pptx", kind: "pptx", relativePath: "exports/final.pptx", size: 2048, modifiedAt: new Date().toISOString(), verification: "warning" }],
      agentStatus: {
        ok: true,
        projectPath: "/tmp/mock/warning",
        status: "completed",
        job: { jobId: "job-warning", status: "completed", command: "codex", message: "Codex completed successfully.", acceptedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      }
    });
    await assertPrimaryAction(client, page, "quality-blocked", "查看质量提醒并重新检查");
    assert.equal(await evaluate(client, page, "Boolean(document.querySelector('.artifact-status.warning'))"), true, "warning artifact must remain downloadable while delivery stays blocked");
    assert.equal(await evaluate(client, page, "Boolean(document.querySelector('.delivered-button'))"), false, "warning artifact must not enable delivery");
  } finally {
    await disposeContext(client, warningContext);
  }

  const failureContext = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, failureContext, {
      session: makeSession({ phase: "review", projectPath: "/tmp/mock/failed" }),
      health: health({ allowLaunch: true, available: true }),
      agentStatus: {
        ok: true,
        projectPath: "/tmp/mock/failed",
        status: "failed",
        job: { jobId: "job-failed", status: "failed", command: "codex", message: "Codex exited with code 1.", acceptedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), exitCode: 1 }
      }
    });
    await assertPrimaryAction(client, page, "quality-blocked", "Agent 未完成，返回重新创建项目");
    assert.match(await evaluate(client, page, "document.querySelector('.agent-runtime-status.failed')?.textContent || ''"), /code 1/);
    await click(client, page, '[data-primary-action="true"]');
    await waitForExpression(client, page, "document.querySelector('.v6-app')?.dataset.phase === 'generating'", "failed Agent restart route");
  } finally {
    await disposeContext(client, failureContext);
  }

  const generatingContext = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, generatingContext, {
      session: makeSession({ phase: "generating" }),
      health: health(),
      handoffDelay: 1_200,
      handoff: { ok: true, projectPath: "/tmp/mock/generating", files: [], suggestedCommands: {} }
    });
    await assertPrimaryAction(client, page, "bridge-no-agent", "\u521b\u5efa\u672c\u5730\u9879\u76ee");
    await click(client, page, '[data-primary-action="true"]');
    const generatingAction = await assertPrimaryAction(client, page, "generating", "\u6b63\u5728\u51c6\u5907\u9879\u76ee");
    assert.equal(generatingAction.disabled, true, "generating state primary status must not submit twice");
  } finally {
    await disposeContext(client, generatingContext);
  }
  console.log("PASS six runtime states plus warning/failure variants expose one truthful Chinese primary action");
}

async function testPollingVisibilityAndDeliveredStop(client, baseUrl) {
  const contextId = await newContext(client);
  try {
    const page = await createPage(client, baseUrl, contextId, {
      session: makeSession({ phase: "review", projectPath: "/tmp/mock/polling" }),
      health: health(),
      artifacts: []
    });
    await client.send("Target.activateTarget", { targetId: page.targetId });
    await waitForExpression(client, page, "document.hidden === false && window.__v6TestBridge.artifactRequests >= 1 && window.__v6TestBridge.agentStatusRequests >= 1", "visible project runtime polling");
    const beforeHidden = await evaluate(client, page, "({ artifacts: window.__v6TestBridge.artifactRequests, agent: window.__v6TestBridge.agentStatusRequests })");
    const { targetId: coverTarget } = await client.send("Target.createTarget", { url: "about:blank", browserContextId: contextId, background: false });
    await client.send("Target.activateTarget", { targetId: coverTarget });
    await waitForExpression(client, page, "document.hidden === true", "hidden tab state");
    await wait(3_300);
    const whileHidden = await evaluate(client, page, "({ artifacts: window.__v6TestBridge.artifactRequests, agent: window.__v6TestBridge.agentStatusRequests })");
    assert.deepEqual(whileHidden, beforeHidden, "artifact and Agent-status polling must pause while the page is hidden");

    await client.send("Target.activateTarget", { targetId: page.targetId });
    await waitForExpression(client, page, `document.hidden === false && window.__v6TestBridge.artifactRequests > ${whileHidden.artifacts} && window.__v6TestBridge.agentStatusRequests > ${whileHidden.agent}`, "poll resume on visibility");
  } finally {
    await disposeContext(client, contextId);
  }

  const deliveredContext = await newContext(client);
  try {
    const deliveredPage = await createPage(client, baseUrl, deliveredContext, {
      session: makeSession({ phase: "delivered", projectPath: "/tmp/mock/delivered", status: "approved" }),
      health: health(),
      artifacts: []
    });
    await client.send("Target.activateTarget", { targetId: deliveredPage.targetId });
    await waitForExpression(client, deliveredPage, "window.__v6TestBridge.artifactRequests >= 1 && window.__v6TestBridge.agentStatusRequests >= 1", "delivered restore poll");
    const initial = await evaluate(client, deliveredPage, "({ artifacts: window.__v6TestBridge.artifactRequests, agent: window.__v6TestBridge.agentStatusRequests })");
    await wait(3_300);
    assert.deepEqual(await evaluate(client, deliveredPage, "({ artifacts: window.__v6TestBridge.artifactRequests, agent: window.__v6TestBridge.agentStatusRequests })"), initial, "delivered state must not keep project-runtime polling");
    console.log("PASS hidden-page polling pause/resume and delivered-state stop");
  } finally {
    await disposeContext(client, deliveredContext);
  }
}

async function createGroundedBridgeProject(bridgeBaseUrl, sessionId, title) {
  const response = await fetch(`${bridgeBaseUrl}/projects/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Connection: "close" },
    body: JSON.stringify({
      sessionId,
      form: {
        title,
        audience: "Executive reviewers",
        coreMessage: "The verified source must stay bound to the final artifact digest."
      },
      sourceMarkdown: "# Verified source\n\nThis grounded runtime fixture proves the Web, Bridge, Agent status, artifact verification, and download contract with a real local HTTP server.",
      projectBrief: {
        bestEffectBrief: {
          promptQuality: "complete",
          recommendedRoute: "formal-editable-pptx",
          decisionReason: "real-browser-runtime-fixture",
          source: "user"
        }
      }
    })
  });
  if (response.status !== 200) {
    assert.fail(`real Bridge project creation failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

async function approveAllSlides(client, page) {
  const count = await evaluate(client, page, "document.querySelectorAll('.slide-filmstrip > button').length");
  for (let index = 0; index < count; index += 1) {
    await click(client, page, `.slide-filmstrip > button:nth-child(${index + 1})`);
    await click(client, page, ".inspector-actions > button:first-child");
  }
  await waitForExpression(client, page, `JSON.parse(sessionStorage.getItem(${JSON.stringify(storageKey)})).slides.every((slide) => slide.status === 'approved')`, "all slide approvals persisted");
}

async function testRealBridgeRuntimeContract(client, baseUrl) {
  const outputDir = await mkdtemp(join(tmpdir(), "upm-real-browser-runtime-"));
  let server;
  try {
    server = createBridgeServer({ outputDir, allowLaunch: false, artifactStableAgeMs: 0 });
    const bridgeBaseUrl = await listenBridge(server);
    const commandProject = await createGroundedBridgeProject(bridgeBaseUrl, "real-command-only", "Real command-only runtime");
    const commandContext = await newContext(client);
    try {
      const page = await createPage(client, baseUrl, commandContext, {
        session: makeSession({ phase: "review", projectPath: commandProject.projectPath, sessionId: "real-command-only" })
      }, { useRealBridge: true });
      await assertPrimaryAction(client, page, "bridge-no-agent", "复制 AI 助手命令");
      await click(client, page, '[data-primary-action="true"]');
      await waitForExpression(client, page, "Boolean(document.querySelector('.agent-command-panel textarea')?.value.includes('codex'))", "real command-only launch response");
      const observed = await (await fetch(`${bridgeBaseUrl}/agent/status?projectPath=${encodeURIComponent(commandProject.projectPath)}`)).json();
      assert.equal(observed.status, "idle");
      assert.equal(observed.job, null);
    } finally {
      await disposeContext(client, commandContext);
    }
    await closeBridge(server);
    server = null;
    await wait(100);

    const children = [];
    server = createBridgeServer({
      outputDir,
      allowLaunch: true,
      artifactStableAgeMs: 0,
      agentCommandResolver: () => "/fake/codex",
      agentSpawner: () => {
        const child = new EventEmitter();
        child.pid = process.pid;
        child.unref = () => {};
        children.push(child);
        return child;
      }
    });
    await listenBridge(server);

    const project = await createGroundedBridgeProject(bridgeBaseUrl, "real-running-refresh", "Real running refresh runtime");
    const launchPromise = fetch(`${bridgeBaseUrl}/agent/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({ projectPath: project.projectPath, agent: "codex" })
    });
    const child = await waitForCondition(() => children[0], "real Agent child spawn");
    child.emit("spawn");
    const launch = await launchPromise;
    assert.equal(launch.status, 200);
    assert.equal((await launch.json()).status, "running");

    const runningContext = await newContext(client);
    try {
      const page = await createPage(client, baseUrl, runningContext, {
        session: makeSession({ phase: "review", projectPath: project.projectPath, sessionId: "real-running-refresh" })
      }, { useRealBridge: true });
      await assertPrimaryAction(client, page, "generating", "Codex 已启动");
      assert.match(await evaluate(client, page, "document.querySelector('.agent-runtime-status.running')?.textContent || ''"), /running/i);
      await approveAllSlides(client, page);

      const artifactBytes = "REAL-PPTX-RUNTIME-BYTES";
      const artifactPath = join(project.projectPath, "exports", "final.pptx");
      await mkdir(join(project.projectPath, "exports"), { recursive: true });
      await writeFile(artifactPath, artifactBytes);
      const reportPath = join(project.projectPath, "quality-report.json");
      const report = JSON.parse(await readFile(reportPath, "utf8"));
      report.status = "warning";
      report.artifacts = [];
      await writeFile(reportPath, JSON.stringify(report));
      await waitForExpression(client, page, "Boolean(document.querySelector('.artifact-status.warning'))", "real warning artifact discovery", 10_000);
      await assertPrimaryAction(client, page, "generating", "Codex 已启动");

      child.emit("exit", 0, null);
      await waitForExpression(client, page, "Boolean(document.querySelector('.agent-runtime-status.completed'))", "real Agent completion status", 10_000);
      await assertPrimaryAction(client, page, "quality-blocked", "查看质量提醒并重新检查");
      assert.equal(await evaluate(client, page, "Boolean(document.querySelector('.delivered-button'))"), false);

      report.status = "passed";
      report.artifacts = [{
        relativePath: "exports/final.pptx",
        sha256: sha256(artifactBytes),
        size: Buffer.byteLength(artifactBytes)
      }];
      await writeFile(reportPath, JSON.stringify(report));
      await assertPrimaryAction(client, page, "artifact-complete", "下载 PPTX");
      await waitForExpression(client, page, "Boolean(document.querySelector('.delivered-button'))", "real canDeliver gate");
      const downloaded = await evaluate(client, page, `(async () => {
        const link = document.querySelector('a[data-runtime-state="artifact-complete"]');
        const response = await fetch(link.href, { cache: 'no-store' });
        const bytes = new Uint8Array(await response.arrayBuffer());
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
        return {
          href: link.href,
          status: response.status,
          sha256: [...digest].map((value) => value.toString(16).padStart(2, '0')).join(''),
          size: bytes.length
        };
      })()`);
      assert.equal(downloaded.status, 200);
      assert.equal(downloaded.sha256, sha256(artifactBytes));
      assert.equal(downloaded.size, Buffer.byteLength(artifactBytes));
      const attachmentDownload = await fetch(downloaded.href, { headers: { Connection: "close" } });
      assert.equal(attachmentDownload.status, 200);
      assert.match(attachmentDownload.headers.get("content-disposition") || "", /attachment/);
      assert.equal(sha256(Buffer.from(await attachmentDownload.arrayBuffer())), sha256(artifactBytes));

      await writeFile(artifactPath, "MUTATED-AFTER-PASS");
      await waitForExpression(client, page, "Boolean(document.querySelector('.artifact-status.pending'))", "real digest invalidation", 10_000);
      await assertPrimaryAction(client, page, "quality-blocked", "Agent 已结束，重新检查产物");
      assert.equal(await evaluate(client, page, "Boolean(document.querySelector('.delivered-button'))"), false, "digest mismatch must revoke canDeliver");
    } finally {
      await disposeContext(client, runningContext);
    }

    const failedProject = await createGroundedBridgeProject(bridgeBaseUrl, "real-agent-failure", "Real Agent failure runtime");
    const failedLaunchPromise = fetch(`${bridgeBaseUrl}/agent/launch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({ projectPath: failedProject.projectPath, agent: "codex" })
    });
    const failedChild = await waitForCondition(() => children[1], "real failing Agent child spawn");
    failedChild.emit("spawn");
    assert.equal((await failedLaunchPromise).status, 200);
    const failureContext = await newContext(client);
    try {
      const page = await createPage(client, baseUrl, failureContext, {
        session: makeSession({ phase: "review", projectPath: failedProject.projectPath, sessionId: "real-agent-failure" })
      }, { useRealBridge: true });
      await assertPrimaryAction(client, page, "generating", "Codex 已启动");
      failedChild.emit("exit", 1, null);
      await assertPrimaryAction(client, page, "quality-blocked", "Agent 未完成，返回重新创建项目");
      assert.match(await evaluate(client, page, "document.querySelector('.agent-runtime-status.failed')?.textContent || ''"), /code 1/i);
    } finally {
      await disposeContext(client, failureContext);
    }
    console.log("PASS real Web↔Bridge↔Agent status↔artifact hash/download/canDeliver runtime contract");
  } finally {
    await closeBridge(server).catch(() => {});
    await rm(outputDir, { recursive: true, force: true });
  }
}

async function main() {
  const chromePath = await firstExisting(chromeCandidates);
  const [vitePort, chromePort] = await Promise.all([freePort(), freePort()]);
  const baseUrl = `http://127.0.0.1:${vitePort}/`;
  const userDataDir = await mkdtemp(join(tmpdir(), "upm-v6-browser-"));
  const vite = captureChildOutput(spawn(process.execPath, [
    resolve(repoRoot, "apps/web/node_modules/vite/bin/vite.js"),
    "--host", "127.0.0.1",
    "--port", String(vitePort),
    "--strictPort"
  ], { cwd: resolve(repoRoot, "apps/web"), stdio: ["ignore", "pipe", "pipe"] }));
  const chrome = captureChildOutput(spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${chromePort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: ["ignore", "pipe", "pipe"] }));

  let client;
  try {
    await waitForHttp(baseUrl, vite, "Vite");
    console.log(`Browser regression using Chrome: ${chromePath}`);
    const versionResponse = await waitForHttp(`http://127.0.0.1:${chromePort}/json/version`, chrome, "Chrome", 30_000);
    const version = await versionResponse.json();
    client = await CdpClient.connect(version.webSocketDebuggerUrl);
    await testKeyboardDialogAndReducedMotion(client, baseUrl);
    await testClipboardFailureTruthfulness(client, baseUrl);
    await testSourceImportBoundaries(client, baseUrl);
    await testResponsiveViewports(client, baseUrl);
    await testBenchmarkResponsiveViewports(client, baseUrl);
    await testLegacySessionMigration(client, baseUrl);
    await testTabIsolationAndRefresh(client, baseUrl);
    await testHandoffSourceAndEvidenceReconciliation(client, baseUrl);
    await testRuntimePrimaryStates(client, baseUrl);
    await testPollingVisibilityAndDeliveredStop(client, baseUrl);
    await testRealBridgeRuntimeContract(client, baseUrl);
    console.log(`PASS v6 browser regression completed in ${version.Browser}`);
  } finally {
    client?.close();
    await Promise.allSettled([stopChild(vite), stopChild(chrome)]);
    await rm(userDataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`FAIL v6 browser regression: ${error.stack || error.message}`);
  process.exitCode = 1;
});
