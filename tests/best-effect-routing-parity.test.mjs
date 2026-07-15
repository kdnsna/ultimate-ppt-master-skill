import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { test } from "node:test";

import { fallbackBestEffectRoute } from "../apps/bridge/server.mjs";
import { classifyDeckRequest } from "../packages/workspace-core/src/index.ts";

const root = resolve(import.meta.dirname, "..");
const fixtures = JSON.parse(readFileSync(join(root, "tests/fixtures/best_effect_routing.json"), "utf8"));

test("Web, Bridge, and Python keep the same 50+ Best-Effect routing fixtures", () => {
  assert.ok(fixtures.length >= 50, `expected at least 50 fixtures, received ${fixtures.length}`);

  const webMismatches = [];
  const bridgeMismatches = [];
  for (const fixture of fixtures) {
    const web = classifyDeckRequest(fixture.input);
    const bridge = fallbackBestEffectRoute(fixture.input);
    if (web.promptQuality !== fixture.prompt_quality || web.classifierRoute !== fixture.route) {
      webMismatches.push({ input: fixture.input, expected: fixture, actual: web });
    }
    if (bridge.prompt_quality !== fixture.prompt_quality || bridge.route !== fixture.route) {
      bridgeMismatches.push({ input: fixture.input, expected: fixture, actual: bridge });
    }
  }
  assert.deepEqual(webMismatches, []);
  assert.deepEqual(bridgeMismatches, []);

  const python = existsSync(join(root, ".venv/bin/python")) ? join(root, ".venv/bin/python") : "python3";
  const script = [
    "import json, pathlib, sys",
    "root = pathlib.Path.cwd()",
    "sys.path.insert(0, str(root / 'scripts'))",
    "from best_effect_router import classify_request",
    "cases = json.loads((root / 'tests/fixtures/best_effect_routing.json').read_text(encoding='utf-8'))",
    "print(json.dumps([classify_request(case['input']) for case in cases], ensure_ascii=False))"
  ].join("; ");
  const result = spawnSync(python, ["-c", script], { cwd: root, encoding: "utf8", timeout: 20000 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const pythonResults = JSON.parse(result.stdout);
  const pythonMismatches = fixtures.flatMap((fixture, index) => {
    const actual = pythonResults[index];
    return actual.prompt_quality === fixture.prompt_quality && actual.route === fixture.route
      ? []
      : [{ input: fixture.input, expected: fixture, actual }];
  });
  assert.deepEqual(pythonMismatches, []);
});
