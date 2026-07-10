#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const caseRoot = path.join(root, 'apps/web/public/examples/ai-frontier-2026');
const cases = [
  { file: 'gpt-5-6.html', title: 'GPT-5.6', source: 'openai.com/index/previewing-gpt-5-6-sol' },
  { file: 'grok-4-5.html', title: 'Grok 4.5', source: 'x.ai/news/grok-4-5' },
  { file: 'claude-fable-5.html', title: 'Claude Fable 5', source: 'anthropic.com/claude/fable' }
];
const errors = [];

for (const item of cases) {
  const filePath = path.join(caseRoot, item.file);
  if (!fs.existsSync(filePath)) {
    errors.push(`${item.file}: missing`);
    continue;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const slides = html.match(/<section class="slide\b/g) || [];
  const sourceLinks = html.match(/href="https:\/\//g) || [];
  if (slides.length !== 9) errors.push(`${item.file}: expected 9 slides, found ${slides.length}`);
  if (!html.includes(item.title)) errors.push(`${item.file}: missing title marker ${item.title}`);
  if (!html.includes(item.source)) errors.push(`${item.file}: missing primary source ${item.source}`);
  if (sourceLinks.length < 1) errors.push(`${item.file}: missing external primary-source link`);
  if (!html.includes('aria-label="Slide navigation"')) errors.push(`${item.file}: missing accessible navigation label`);
  if (!html.includes('./deck.css') || !html.includes('./deck.js')) errors.push(`${item.file}: shared deck runtime missing`);
  if (/\[\u5fc5\u586b\]|TODO|lorem ipsum/i.test(html)) errors.push(`${item.file}: placeholder copy found`);
  if (/<title>Grok 4\.6/i.test(html)) errors.push(`${item.file}: unverified Grok 4.6 title found`);
}

for (const shared of ['deck.css', 'deck.js']) {
  if (!fs.existsSync(path.join(caseRoot, shared))) errors.push(`shared runtime missing: ${shared}`);
}

const benchmarkPath = path.join(root, 'apps/web/public/benchmark/index.html');
const benchmark = fs.readFileSync(benchmarkPath, 'utf8');
for (const item of cases) {
  if (!benchmark.includes(`examples/ai-frontier-2026/${item.file}`)) errors.push(`benchmark missing ${item.file}`);
}

if (errors.length) {
  console.error('Featured deck validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Featured deck validation passed: ${cases.length} decks, 27 slides.`);
