/**
 * Rule-based natural-language → preserve-edit plan (no network).
 * Mirrors scripts/preserve_edit_pptx.py::parse_nl_edit_plan patterns.
 */

export interface NlEditPlanItem {
  slide: number;
  replacements: Record<string, string>;
}

const SLIDE_RE = /(?:第\s*(\d+)\s*页|slide\s*(\d+)|p\.?\s*(\d+))/i;

const REPLACE_PATTERNS: RegExp[] = [
  /[「『"“']([^」』"”']+)[」』"”']\s*(?:改成|改为|换成|→|->|=)\s*[「『"“']?([^」』"”'\n,，;；]+)[」』"”']?/,
  /把\s*[「『"“']?([^」』"”'\n]+?)[」』"”']?\s*(?:改成|改为|换成)\s*[「『"“']?([^」』"”'\n,，;；]+)[」』"”']?/,
  /([^\s,，;；→\-=]{1,40}?)\s*(?:改成|改为|换成|→|->)\s*([^\s,，;；]{1,40})/
];

function chunkInstruction(text: string): string[] {
  const parts = text
    .split(/[;；\n]+|(?=\s*第\s*\d+\s*页)|(?=\s*slide\s*\d+)/i)
    .map((part) => part.replace(/^[\s,，]+|[\s,，]+$/g, ""))
    .filter(Boolean);
  return parts.length ? parts : [text.trim()];
}

export function parseNlEditPlan(instruction: string, defaultSlide?: number | null): NlEditPlanItem[] {
  const text = instruction.trim();
  if (!text) return [];

  const edits: NlEditPlanItem[] = [];
  for (const chunk of chunkInstruction(text)) {
    let slide = defaultSlide ?? null;
    const slideMatch = chunk.match(SLIDE_RE);
    if (slideMatch) {
      const raw = slideMatch[1] || slideMatch[2] || slideMatch[3];
      slide = Number(raw);
    }
    let remainder = chunk.replace(SLIDE_RE, " ").replace(/的\s*/g, " ").replace(/^[\s:：,，]+|[\s:：,，]+$/g, "");
    let oldText: string | null = null;
    let newText: string | null = null;
    for (const pattern of REPLACE_PATTERNS) {
      const match = remainder.match(pattern);
      if (match) {
        oldText = match[1].trim();
        newText = match[2].trim();
        break;
      }
    }
    if (!oldText || newText == null || slide == null || !Number.isFinite(slide) || slide < 1) {
      continue;
    }
    const existing = edits.find((item) => item.slide === slide);
    if (existing) {
      existing.replacements[oldText] = newText;
    } else {
      edits.push({ slide, replacements: { [oldText]: newText } });
    }
  }
  return edits;
}

export function summarizeNlPlan(edits: NlEditPlanItem[], language: "zh" | "en"): string {
  if (!edits.length) {
    return language === "en"
      ? "Could not parse any slide edits. Try: slide 1: Q2 -> Q3"
      : "未能解析出改稿计划。试试：第1页的「Q2」改成「Q3」";
  }
  return edits
    .map((edit) => {
      const pairs = Object.entries(edit.replacements)
        .map(([oldText, next]) => `「${oldText}」→「${next}」`)
        .join("、");
      return language === "en" ? `Slide ${edit.slide}: ${pairs}` : `第 ${edit.slide} 页：${pairs}`;
    })
    .join(language === "en" ? "; " : "；");
}
