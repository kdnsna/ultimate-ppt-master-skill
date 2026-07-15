#!/usr/bin/env node

import { gzipSync } from "node:zlib";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const distDir = join(process.cwd(), "apps", "web", "dist", "assets");
const limitBytes = 80 * 1024;
const files = (await readdir(distDir))
  .filter((name) => /^index-[^.]+\.(?:js|css)$/.test(name))
  .sort();

if (!files.length) {
  throw new Error("No built v6 index assets found. Run npm run build:web first.");
}

const sizes = [];
for (const name of files) {
  const bytes = await readFile(join(distDir, name));
  sizes.push({ name, gzipBytes: gzipSync(bytes).byteLength });
}

const totalBytes = sizes.reduce((sum, item) => sum + item.gzipBytes, 0);
for (const item of sizes) console.log(`${item.name}: ${(item.gzipBytes / 1024).toFixed(2)} KB gzip`);
console.log(`v6 main JS + CSS: ${(totalBytes / 1024).toFixed(2)} KB gzip (limit: 80.00 KB)`);

if (totalBytes > limitBytes) {
  throw new Error(`v6 main bundle exceeds the 80 KB gzip contract by ${((totalBytes - limitBytes) / 1024).toFixed(2)} KB.`);
}
