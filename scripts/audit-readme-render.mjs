import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const repository = process.env.GITHUB_REPOSITORY || "kdnsna/ultimate-ppt-master-skill";
const token = process.env.GITHUB_TOKEN?.trim();
const documents = [
  { path: "README.md", marker: "把真实资料变成可继续修改的原生 PowerPoint" },
  { path: "README.en.md", marker: "Turn real source material into a native PowerPoint" },
];

const headers = {
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "ultimate-ppt-master-readme-audit",
  "X-GitHub-Api-Version": "2022-11-28",
};
if (token) headers.Authorization = `Bearer ${token}`;

for (const document of documents) {
  const markdown = await readFile(resolve(root, document.path), "utf8");
  const response = await fetch("https://api.github.com/markdown", {
    method: "POST",
    headers,
    body: JSON.stringify({ text: markdown, mode: "gfm", context: repository }),
  });
  if (!response.ok) {
    throw new Error(`${document.path}: GitHub Markdown API returned ${response.status} ${await response.text()}`);
  }
  const html = await response.text();
  if (html.length < 1000 || !html.includes(document.marker)) {
    throw new Error(`${document.path}: rendered HTML is incomplete or missing the canonical value statement.`);
  }
  if (/<script\b/i.test(html)) {
    throw new Error(`${document.path}: rendered HTML unexpectedly contains a script element.`);
  }
  console.log(`${document.path}: GitHub GFM render passed (${html.length} bytes).`);
}
