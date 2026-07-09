#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2];
const allowExperimental = process.argv.includes('--allow-experimental');

if (!file) {
  console.error('Usage: node scripts/validate-swiss-deck.mjs <index.html> [--allow-experimental]');
  process.exit(2);
}

const html = readFileSync(file, 'utf8');
const htmlForSlides = html.replace(/<!--[\s\S]*?-->/g, '');
const styleBlock = [...htmlForSlides.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
const htmlWithoutStyles = htmlForSlides.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
const errors = [];
const warnings = [];

const scriptDir = dirname(fileURLToPath(import.meta.url));
const registryPath = join(scriptDir, '..', 'references', 'magazine-web', 'swiss-layout-registry.json');
const layoutRegistry = JSON.parse(readFileSync(registryPath, 'utf8'));
const layouts = layoutRegistry.layouts ?? {};
const allowedLayouts = new Set(Object.keys(layouts));

const slideRe = /<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>[\s\S]*?<\/section>/g;
const slideStartCount = [...htmlForSlides.matchAll(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"[^>]*>/g)].length;
const slides = [...htmlForSlides.matchAll(slideRe)].map((m, idx) => ({ idx: idx + 1, html: m[0], tag: m[0].match(/<section\b[^>]*>/)?.[0] ?? '' }));

if (slideStartCount !== slides.length) {
  errors.push(`slide section count mismatch: found ${slideStartCount} slide opening tag(s) but ${slides.length} complete slide section(s).`);
}

if (!slides.length) {
  errors.push('No <section class="slide"> pages found.');
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`))?.[1] ?? '';
}

function roleForTag(tag) {
  const className = attr(tag, 'class');
  if (/\b(?:t-meta|meta|kicker|mono|label|foot)\b/i.test(className)) return 'meta';
  if (/\b(?:caption|img-cap|figcaption|note)\b/i.test(className)) return 'caption';
  return 'body';
}

function minFontForRole(role) {
  if (role === 'meta') return 14;
  if (role === 'caption') return 16;
  return 18;
}

function collectDefinedClasses(css) {
  return new Set([...css.matchAll(/\.([_a-zA-Z][\w-]*)/g)].map((match) => match[1]));
}

function collectClassFontSizes(css) {
  const classSizes = new Map();
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1];
    const body = rule[2];
    const font = body.match(/font-size\s*:\s*([0-9.]+)\s*(px|rem|em|vh|vw)\b/i);
    if (!font) continue;
    for (const classMatch of selector.matchAll(/\.([_a-zA-Z][\w-]*)/g)) {
      classSizes.set(classMatch[1], {
        size: Number.parseFloat(font[1]),
        unit: font[2].toLowerCase(),
      });
    }
  }
  return classSizes;
}

const definedClasses = collectDefinedClasses(styleBlock);
const classFontSizes = collectClassFontSizes(styleBlock);

function classList(tag) {
  return attr(tag, 'class').split(/\s+/).map((value) => value.trim()).filter(Boolean);
}

function auditUndefinedClasses(slide) {
  const classAttrs = [...slide.html.matchAll(/\bclass=["']([^"']+)["']/gi)];
  const missing = new Set();
  classAttrs.forEach((match) => {
    match[1].split(/\s+/).filter(Boolean).forEach((name) => {
      if (!definedClasses.has(name)) missing.add(name);
    });
  });
  if (missing.size) {
    errors.push(`Slide ${slide.idx}: undefined CSS class(es): ${[...missing].sort().join(', ')}.`);
  }
}

function auditInlineFontSizes(slide) {
  const styledTags = [...slide.html.matchAll(/<([a-z][\w:-]*)\b[^>]*style="([^"]*font-size\s*:\s*([0-9.]+)\s*(px|rem|em|vh|vw)[^"]*)"[^>]*>/gi)];
  styledTags.forEach((match) => {
    const tag = match[0];
    const size = Number.parseFloat(match[3]);
    const unit = match[4].toLowerCase();
    if (!Number.isFinite(size)) return;
    if (unit !== 'px') {
      warnings.push(`Slide ${slide.idx}: inline non-px font-size ${size}${unit}; confirm Swiss minimum after conversion.`);
      return;
    }

    const role = roleForTag(tag);
    const min = minFontForRole(role);
    if (size < min) {
      const label = role === 'meta' ? 'meta text' : role === 'caption' ? 'caption text' : 'body text';
      errors.push(`Slide ${slide.idx}: ${label} below ${min}px Swiss minimum (${size}px).`);
    }
  });
}

function auditClassFontSizes(slide) {
  const tags = [...slide.html.matchAll(/<([a-z][\w:-]*)\b[^>]*\bclass=["'][^"']+["'][^>]*>/gi)];
  const warned = new Set();
  tags.forEach((match) => {
    const tag = match[0];
    for (const name of classList(tag)) {
      const font = classFontSizes.get(name);
      if (!font || !Number.isFinite(font.size)) continue;
      if (font.unit !== 'px') {
        const key = `${slide.idx}:${name}:${font.size}${font.unit}`;
        if (!warned.has(key)) {
          warnings.push(`Slide ${slide.idx}: class .${name} uses non-px font-size ${font.size}${font.unit}; confirm Swiss minimum after conversion.`);
          warned.add(key);
        }
        continue;
      }
      const role = roleForTag(tag);
      const min = minFontForRole(role);
      if (font.size < min) {
        const label = role === 'meta' ? 'meta text' : role === 'caption' ? 'caption text' : 'body text';
        errors.push(`Slide ${slide.idx}: ${label} below ${min}px Swiss minimum (${font.size}px via .${name}).`);
      }
    }
  });
}

function auditBottomSafeZone(slide) {
  const bottomRisk = /align-(?:self|items)\s*:\s*(?:flex-)?end|bottom\s*:\s*(?:0|[0-4](?:\.\d+)?(?:vh|%|px|rem))\b|margin-top\s*:\s*auto/i.test(slide.html);
  const hasSafeClass = /\bnav-safe-bottom(?:-tight)?\b/.test(slide.html);
  if (bottomRisk && !hasSafeClass) {
    errors.push(`Slide ${slide.idx}: bottom-aligned content needs a bottom nav safe zone class.`);
  }
}

function auditLayoutSignature(slide, layout) {
  const signature = layouts[layout] ?? {};
  const requiredClasses = Array.isArray(signature.requiredClasses) ? signature.requiredClasses : [];
  const requiredImageSlots = Array.isArray(signature.requiredImageSlots) ? signature.requiredImageSlots : [];
  const classNames = new Set([...slide.html.matchAll(/\bclass=["']([^"']+)["']/gi)].flatMap((match) => match[1].split(/\s+/).filter(Boolean)));
  const missingClasses = requiredClasses.filter((name) => !classNames.has(name));
  const missingSlots = requiredImageSlots.filter((slot) => !new RegExp(`\\bdata-image-slot=["']${slot}["']`).test(slide.html));
  if (missingClasses.length || missingSlots.length) {
    const parts = [];
    if (missingClasses.length) parts.push(`class ${missingClasses.join(', ')}`);
    if (missingSlots.length) parts.push(`image slot ${missingSlots.join(', ')}`);
    errors.push(`Slide ${slide.idx}: layout signature for ${layout} missing ${parts.join('; ')}.`);
  }
}

function objectPositionCropsTop(value) {
  const parts = value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return false;
  if (parts.includes('top')) return true;
  const vertical = parts.length === 1 ? parts[0] : parts[1];
  const numeric = vertical.match(/^([0-9]+(?:\.[0-9]+)?)(%|px|rem|vh)?$/);
  if (!numeric) return false;
  return Number.parseFloat(numeric[1]) <= 10;
}

slides.forEach((slide) => {
  const layout = slide.tag.match(/\bdata-layout="([^"]+)"/)?.[1];

  if (!layout) {
    errors.push(`Slide ${slide.idx}: missing data-layout. Swiss locked mode requires S01-S22 or SWISS-COVER-ASCII/SWISS-CLOSING-ASCII.`);
  } else if (!allowedLayouts.has(layout)) {
    errors.push(`Slide ${slide.idx}: data-layout="${layout}" is not registered in swiss-layout-registry.json.`);
  }
  if (layout && allowedLayouts.has(layout)) auditLayoutSignature(slide, layout);

  if (!allowExperimental && /\bdata-layout="P2[34]\b|Swiss Image Split|Swiss Evidence Grid|swiss-img-split|swiss-img-grid/.test(slide.html)) {
    errors.push(`Slide ${slide.idx}: uses experimental P23/P24 image structure. Use S22 or S15/S16 image-grid adaptations instead.`);
  }

  const isStatement = layout === 'S03' || layout === 'S09' || layout === 'S10' || layout === 'SWISS-COVER-ASCII' || layout === 'SWISS-CLOSING-ASCII';
  const topChunk = slide.html.slice(0, 1800);

  if (!isStatement && /text-align\s*:\s*center/i.test(topChunk)) {
    errors.push(`Slide ${slide.idx}: top title area contains text-align:center. Swiss body titles should stay left aligned.`);
  }

  if (!isStatement && /align-self\s*:\s*center/i.test(topChunk) && /<h[12]\b/i.test(topChunk)) {
    errors.push(`Slide ${slide.idx}: top heading appears vertically/centrally aligned. Use the original left-top title skeleton.`);
  }

  if (!isStatement && /grid-template-columns\s*:\s*[0-9.]+fr\s+[0-9.]+fr/i.test(topChunk) && /<h[12]\b/i.test(topChunk)) {
    warnings.push(`Slide ${slide.idx}: heading inside a custom fr/fr grid. Confirm this is copied from the original Sxx skeleton, not a centered title hack.`);
  }

  if (/<svg\b[\s\S]*?<text\b/i.test(slide.html)) {
    errors.push(`Slide ${slide.idx}: SVG contains visible <text>. Put labels in HTML grid/captions, keep SVG for geometry only.`);
  }

  const localImages = [...slide.html.matchAll(/<img\b[^>]*src="images\//g)];
  localImages.forEach((_, imageIndex) => {
    const imgTag = slide.html.slice(_.index, slide.html.indexOf('>', _.index) + 1);
    if (!/\bdata-image-slot="/.test(imgTag)) {
      errors.push(`Slide ${slide.idx}: local image ${imageIndex + 1} missing data-image-slot. Bind every image to a layout slot such as s22-hero-21x9 or s15-grid-21x9.`);
    }
  });

  const frameImageRe = /<div\b(?=[^>]*\bclass="([^"]*\bframe-img\b[^"]*)")[^>]*>\s*<img\b(?=[^>]*\bdata-image-slot="([^"]+)")[^>]*>/g;
  const frameImages = [...slide.html.matchAll(frameImageRe)];
  frameImages.forEach((match) => {
    const className = match[1];
    const slot = match[2];
    const frameTag = match[0].match(/^<div\b[^>]*>/)?.[0] ?? '';
    if (/^s1[56]-(?:grid|brief)-21x9$/.test(slot)) {
      if (/\bfit-contain\b/.test(className)) {
        errors.push(`Slide ${slide.idx}: ${slot} uses fit-contain. Regenerated S15/S16 21:9 images should fill the slot with .frame-img.r-21x9.`);
      }
      if (!/\br-21x9\b/.test(className)) {
        errors.push(`Slide ${slide.idx}: ${slot} must use .frame-img.r-21x9 so the image slot controls the visible size.`);
      }
      if (/height\s*:\s*\d+(?:\.\d+)?vh/i.test(frameTag)) {
        errors.push(`Slide ${slide.idx}: ${slot} frame has a fixed vh height. Use aspect-ratio .r-21x9 instead of shrinking long images into a short slot.`);
      }
    }
  });

  if (layout === 'S22') {
    if (!/data-image-slot="s22-hero-21x9"/.test(slide.html)) {
      errors.push(`Slide ${slide.idx}: S22 must use data-image-slot="s22-hero-21x9".`);
    }
    for (const match of slide.html.matchAll(/object-position\s*:\s*([^;"']+)/gi)) {
      const value = match[1].trim();
      if (objectPositionCropsTop(value)) {
        errors.push(`Slide ${slide.idx}: S22 photo uses object-position:${value}, which commonly crops faces. Use center 35% or center center.`);
      }
    }
  }

  auditUndefinedClasses(slide);
  auditInlineFontSizes(slide);
  auditClassFontSizes(slide);
  auditBottomSafeZone(slide);
});

if (warnings.length) {
  console.warn('Warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error('Swiss deck validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Swiss deck validation passed: ${slides.length} slide(s).`);
