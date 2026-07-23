#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const caseRoot = path.join(root, 'apps/web/public/examples/ai-frontier-2026');
const officeCaseRoot = path.join(root, 'apps/web/public/examples/executive-business-review-starter');
const officeSourceRoot = path.join(root, 'examples/executive-business-review-starter');
const secondaryCases = [
  { dir: 'consulting-proposal-starter', title: '咨询方案 · 次级公开样例' },
  { dir: 'product-pitch-starter', title: '产品路演 · 次级公开样例' },
  { dir: 'tech-trend-web-deck-starter', title: '科技趋势 Web Deck · 次级公开样例' }
];
const cases = [
  { file: 'gpt-5-6.html', title: 'GPT-5.6', source: 'openai.com/index/gpt-5-6' },
  { file: 'grok-4-5.html', title: 'Grok 4.5', source: 'x.ai/news/grok-4-5' },
  { file: 'claude-fable-5.html', title: 'Claude Fable 5', source: 'anthropic.com/claude/fable' }
];
const errors = [];
const designSystemPath = path.join(root, 'DESIGN.md');
if (!fs.existsSync(designSystemPath)) errors.push('DESIGN.md: missing agent-readable design system');

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

for (const item of secondaryCases) {
  const publicDir = path.join(root, 'apps/web/public/examples', item.dir);
  const sourceDir = path.join(root, 'examples', item.dir);
  const html = fs.readFileSync(path.join(publicDir, 'web-demo.html'), 'utf8');
  if (!html.includes('<html lang="zh-CN">') || !html.includes(`<title>${item.title}</title>`)) {
    errors.push(`${item.dir}: secondary Web Deck must be Chinese-first`);
  }
  if ((html.match(/<section class="slide\b/g) || []).length !== 3) errors.push(`${item.dir}: expected 3 slides`);
  if (!html.includes('@media(max-width:720px)') || !html.includes('border-radius:24px')) {
    errors.push(`${item.dir}: missing rounded 390px layout contract`);
  }
  if (/\b(?:Inter|Roboto|Arial)\b|Avenir Next/i.test(html)) errors.push(`${item.dir}: legacy generic font remains`);
  const sourceHtml = fs.readFileSync(path.join(sourceDir, 'web-demo.html'), 'utf8')
    .replace('../../apps/web/public/brand.svg', '../../brand.svg');
  if (sourceHtml !== html) errors.push(`${item.dir}: public Web Deck differs from source mirror`);
  for (const mirrored of ['cover.svg', 'quality-report.json', 'source.sanitized.md']) {
    if (!fs.readFileSync(path.join(sourceDir, mirrored)).equals(fs.readFileSync(path.join(publicDir, mirrored)))) {
      errors.push(`${item.dir}: public ${mirrored} differs from source mirror`);
    }
  }
  const report = JSON.parse(fs.readFileSync(path.join(publicDir, 'quality-report.json'), 'utf8'));
  if (report.releaseVersion !== '6.3.8' || report.releaseStatus !== 'github-released') {
    errors.push(`${item.dir}: quality report must distinguish its stable schema from the current GitHub release`);
  }
  if (report.releaseEvidence !== 'https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.8'
    || report.marketplaceStatus !== 'independent-not-attested') {
    errors.push(`${item.dir}: quality report must bind GitHub release evidence without implying marketplace publication`);
  }
}

const showcase = fs.readFileSync(path.join(root, 'apps/web/public/benchmark/showcase.html'), 'utf8');
for (const marker of ['三套独立设计系统', '来源可追溯', '@media(max-width:720px)', 'border-radius:var(--radius)']) {
  if (!showcase.includes(marker)) errors.push(`benchmark/showcase.html missing Chinese responsive marker: ${marker}`);
}
const archivedAgentic = fs.readFileSync(path.join(root, 'apps/web/public/examples/agentic-developer-tools-2026/web-demo.html'), 'utf8');
if (!archivedAgentic.includes('已归档历史案例') || !archivedAgentic.includes('v2.5 历史样例')) {
  errors.push('agentic-developer-tools-2026 must disclose archived historical status');
}

const deckCss = fs.readFileSync(path.join(caseRoot, 'deck.css'), 'utf8');
for (const marker of ['IBM Plex Sans', 'Noto Serif SC', '.theme-sol', '.theme-grok', '.theme-fable']) {
  if (!deckCss.includes(marker)) errors.push(`deck.css: missing design-system marker ${marker}`);
}
for (const generic of ['Avenir Next', 'DIN Condensed', 'font-size: clamp(56px, 8.6vw, 146px)']) {
  if (deckCss.includes(generic)) errors.push(`deck.css: legacy generic styling remains: ${generic}`);
}

const benchmarkPath = path.join(root, 'apps/web/public/benchmark/index.html');
const benchmark = fs.readFileSync(benchmarkPath, 'utf8');
for (const item of cases) {
  if (!benchmark.includes(`examples/ai-frontier-2026/${item.file}`)) errors.push(`benchmark missing ${item.file}`);
}

const benchmarkMarkers = [
  '<html lang="zh-CN">',
  'v6.3.8 正式版本',
  'https://github.com/kdnsna/ultimate-ppt-master-skill/releases/tag/v6.3.8',
  '先看成品，',
  '再看交付证据。',
  '脱敏经营复盘',
  '可编辑 PPTX',
  'GPT-5.6 · 三轨道',
  'Proof Pack 分数为<strong>内部质量合同</strong>',
  '更多方向，退到第二层。'
];
for (const marker of benchmarkMarkers) {
  if (!benchmark.includes(marker)) errors.push(`benchmark missing Chinese-first marker: ${marker}`);
}

const benchmarkLinks = [
  '../examples/executive-business-review-starter/executive-business-review-editable.pptx',
  '../examples/executive-business-review-starter/source.sanitized.md',
  '../examples/executive-business-review-starter/native-object-report.json',
  '../examples/executive-business-review-starter/pptlint-report.md',
  '../examples/executive-business-review-starter/quality-report.json',
  '../examples/ai-frontier-2026/gpt-5-6.html',
  '../examples/ai-frontier-2026/gpt-5-6-mobile.png',
  'https://openai.com/index/gpt-5-6/',
  '../examples/consulting-proposal-starter/web-demo.html',
  '../examples/product-pitch-starter/web-demo.html',
  '../examples/tech-trend-web-deck-starter/web-demo.html'
];
for (const link of benchmarkLinks) {
  if (!benchmark.includes(link)) errors.push(`benchmark missing key link: ${link}`);
}

for (const legacy of ['Three finished decks', 'Open finished decks', 'Inspectable Proof Packs']) {
  if (benchmark.includes(legacy)) errors.push(`benchmark still exposes English-first headline: ${legacy}`);
}

for (const artifact of [
  'executive-business-review-editable.pptx',
  'source.sanitized.md',
  'native-object-report.json',
  'pptlint-report.md',
  'quality-report.json'
]) {
  if (!fs.existsSync(path.join(officeCaseRoot, artifact))) errors.push(`office proof missing: ${artifact}`);
}

for (const artifact of [
  'README.md',
  'cover.svg',
  'executive-business-review-editable.pptx',
  'native-object-report.json',
  'pptlint-report.md',
  'quality-report.json',
  'source.sanitized.md',
  'web-demo.html'
]) {
  const sourcePath = path.join(officeSourceRoot, artifact);
  const publicPath = path.join(officeCaseRoot, artifact);
  if (!fs.existsSync(sourcePath) || !fs.existsSync(publicPath)) continue;
  if (!fs.readFileSync(sourcePath).equals(fs.readFileSync(publicPath))) {
    errors.push(`office proof public copy differs from source: ${artifact}`);
  }
}

if (!fs.existsSync(path.join(caseRoot, 'gpt-5-6-mobile.png'))) errors.push('GPT-5.6 mobile proof missing');

const benchmarkCss = fs.readFileSync(path.join(root, 'apps/web/public/benchmark/benchmark.css'), 'utf8');
for (const marker of ['#f6f3ed', '#171714', '#1d4ed8', '#d9573b', 'Noto Serif SC', 'grid-template-columns: 7fr 5fr']) {
  if (!benchmarkCss.includes(marker)) errors.push(`benchmark.css missing editorial design marker: ${marker}`);
}
if (/linear-gradient|radial-gradient/i.test(benchmarkCss)) errors.push('benchmark.css: ornamental gradient found');

const appIndex = fs.readFileSync(path.join(root, 'apps/web/index.html'), 'utf8');
for (const marker of ['lang="zh-CN"', '把真实资料变成可编辑 PowerPoint', '可编辑 PPTX, AI presentation']) {
  if (!appIndex.includes(marker)) errors.push(`apps/web/index.html missing Chinese SEO marker: ${marker}`);
}

const sitemap = fs.readFileSync(path.join(root, 'apps/web/public/sitemap.xml'), 'utf8');
for (const marker of ['/benchmark/', '/examples/executive-business-review-starter/web-demo.html', '/examples/ai-frontier-2026/gpt-5-6.html']) {
  if (!sitemap.includes(marker)) errors.push(`sitemap missing public route: ${marker}`);
}

const socialPreview = fs.readFileSync(path.join(root, 'apps/web/public/social-preview.svg'), 'utf8');
for (const marker of ['把真实资料', '变成可编辑的', '可编辑 PPTX', 'AI Web Deck', '先看成品，再看交付证据']) {
  if (!socialPreview.includes(marker)) errors.push(`social-preview.svg missing Chinese marker: ${marker}`);
}
if (/linearGradient|radialGradient/i.test(socialPreview)) errors.push('social-preview.svg: ornamental gradient found');
const socialSourcePath = path.join(root, 'assets/social/social-preview.svg');
if (!fs.existsSync(socialSourcePath) || fs.readFileSync(socialSourcePath, 'utf8') !== socialPreview) {
  errors.push('assets/social/social-preview.svg must mirror the Chinese public social preview source');
}
for (const pngPath of [
  path.join(root, 'apps/web/public/social-preview.png'),
  path.join(root, 'assets/social/social-preview.png')
]) {
  if (!fs.existsSync(pngPath)) {
    errors.push(`social preview PNG missing: ${path.relative(root, pngPath)}`);
    continue;
  }
  const png = fs.readFileSync(pngPath);
  const isPng = png.length > 24 && png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const width = isPng ? png.readUInt32BE(16) : 0;
  const height = isPng ? png.readUInt32BE(20) : 0;
  if (!isPng || width !== 1280 || height !== 640 || png.length < 20000) {
    errors.push(`social preview PNG must be a nontrivial 1280x640 image: ${path.relative(root, pngPath)}`);
  }
}
const publicSocialPng = path.join(root, 'apps/web/public/social-preview.png');
const sourceSocialPng = path.join(root, 'assets/social/social-preview.png');
if (fs.existsSync(publicSocialPng) && fs.existsSync(sourceSocialPng)
  && !fs.readFileSync(publicSocialPng).equals(fs.readFileSync(sourceSocialPng))) {
  errors.push('assets/social/social-preview.png must mirror the public social preview PNG');
}

if (errors.length) {
  console.error('Featured deck validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Featured deck validation passed: ${cases.length} Web Decks, 27 slides, 1 editable PPTX proof, Chinese-first benchmark and SEO.`);
