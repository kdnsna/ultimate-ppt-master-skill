#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

const file = process.argv[2];

if (!file) {
  console.error('Usage: node scripts/validate-magazine-deck.mjs <index.html>');
  process.exit(2);
}

const rootDir = dirname(file);
const html = readFileSync(file, 'utf8');
const htmlNoComments = html.replace(/<!--[\s\S]*?-->/g, '');
const styleBlock = [...htmlNoComments.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
const errors = [];

const slideStartRe = /<section\b[^>]*class=["'][^"']*\bslide\b[^"']*["'][^>]*>/gi;
const slideRe = /<section\b[^>]*class=["'][^"']*\bslide\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi;
const slideStartCount = [...htmlNoComments.matchAll(slideStartRe)].length;
const slides = [...htmlNoComments.matchAll(slideRe)].map((m, idx) => ({ idx: idx + 1, html: m[0], tag: m[0].match(/<section\b[^>]*>/i)?.[0] ?? '' }));

if (/\[必填\]/.test(htmlNoComments)) {
  errors.push('Deck still contains [必填] placeholder text.');
}

if (slideStartCount !== slides.length) {
  errors.push(`slide section count mismatch: found ${slideStartCount} slide opening tag(s) but ${slides.length} complete slide section(s).`);
}

if (!slides.length) {
  errors.push('No <section class="slide"> pages found.');
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '';
}

function classList(tag) {
  return attr(tag, 'class').split(/\s+/).map((value) => value.trim()).filter(Boolean);
}

function definedClasses(css) {
  return new Set([...css.matchAll(/\.([_a-zA-Z][\w-]*)/g)].map((match) => match[1]));
}

const knownClasses = definedClasses(styleBlock);

function auditUndefinedClasses(slide) {
  const missing = new Set();
  for (const match of slide.html.matchAll(/\bclass=["']([^"']+)["']/gi)) {
    match[1].split(/\s+/).filter(Boolean).forEach((name) => {
      if (!knownClasses.has(name)) missing.add(name);
    });
  }
  if (missing.size) {
    errors.push(`Slide ${slide.idx}: undefined CSS class(es): ${[...missing].sort().join(', ')}.`);
  }
}

function auditThemeMarker(slide) {
  const classes = classList(slide.tag);
  const hasLight = classes.includes('light');
  const hasDark = classes.includes('dark');
  if (hasLight === hasDark) {
    errors.push(`Slide ${slide.idx}: each section must carry exactly one light/dark theme marker.`);
  }
}

function auditEightPageRhythm() {
  if (slides.length !== 8) return;
  const expectations = [
    { index: 1, className: 'dark' },
    { index: 2, className: 'light' },
    { index: 3, className: 'dark' },
    { index: 4, className: 'light' },
    { index: 5, className: 'hero' },
    { index: 7, className: 'dark' },
    { index: 8, className: 'light' },
  ];
  for (const expectation of expectations) {
    const classes = classList(slides[expectation.index - 1].tag);
    if (!classes.includes(expectation.className)) {
      errors.push(`Slide ${expectation.index}: fixed 8-page rhythm requires .${expectation.className}.`);
    }
  }
}

function safeRelativeImagePath(src) {
  if (!src.startsWith('images/')) return null;
  const normalized = normalize(src);
  if (normalized.startsWith('..')) return null;
  return normalized;
}

function auditImages(slide) {
  for (const match of slide.html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1];
    const rel = safeRelativeImagePath(src);
    if (!rel) continue;
    const path = join(rootDir, rel);
    if (!existsSync(path)) {
      errors.push(`Slide ${slide.idx}: missing image file ${src}.`);
    }
  }
}

slides.forEach((slide) => {
  auditUndefinedClasses(slide);
  auditThemeMarker(slide);
  auditImages(slide);
});
auditEightPageRhythm();

if (errors.length) {
  console.error('Magazine deck validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Magazine deck validation passed: ${slides.length} slide(s).`);
