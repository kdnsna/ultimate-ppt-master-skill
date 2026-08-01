import type { PreserveFidelityResult } from "../types";

function slideChangeEntries(report: PreserveFidelityResult): Array<{ slide: string; lines: string[] }> {
  const raw = report.slideChanges || {};
  return Object.keys(raw)
    .sort((a, b) => Number(a) - Number(b))
    .map((slide) => ({ slide, lines: raw[slide] || [] }));
}

export function humanFidelitySummary(report: PreserveFidelityResult, language: "zh" | "en"): {
  title: string;
  detail: string;
  bullets: string[];
} {
  const en = language === "en";
  const entries = slideChangeEntries(report);
  const bullets = entries.length
    ? entries.map((entry) =>
        en
          ? `Slide ${entry.slide}: ${entry.lines.join("; ") || "updated"}`
          : `第 ${entry.slide} 页：${entry.lines.join("；") || "已更新"}`
      )
    : report.changed.length
      ? report.changed.map((part) => (en ? `Changed ${part}` : `已改 ${part}`))
      : [en ? "No content matched — output is byte-identical to source." : "未匹配到内容 — 输出与源文件字节级一致。"];

  if (!report.safe) {
    return {
      title: en ? "Fidelity check failed — not delivered" : "保真校验未通过 · 未交付",
      detail: en
        ? "Unexpected package changes were detected. Original file was not overwritten."
        : "检测到意外的包内变更。原文件未被覆盖。",
      bullets
    };
  }

  const slides = report.requestedSlides?.length
    ? en
      ? `slides ${report.requestedSlides.join(", ")}`
      : `第 ${report.requestedSlides.join("、")} 页`
    : en
      ? "named slides"
      : "点名页";

  return {
    title: en ? "Saved — only named slides changed" : "已保存 · 仅点名页发生变化",
    detail: en
      ? `${report.unchangedCount} package parts stayed byte-identical across ${report.slideCount} slides (${slides}).`
      : `共 ${report.slideCount} 页；${slides} 已改，${report.unchangedCount} 个包内部分保持字节级不变。`,
    bullets
  };
}

export function buildChangeMemoMarkdown(report: PreserveFidelityResult, language: "zh" | "en"): string {
  const en = language === "en";
  const summary = humanFidelitySummary(report, language);
  const lines = [
    en ? "# Preserve-edit change memo" : "# 保真改稿变更说明",
    "",
    en ? `Status: ${report.safe ? "ok" : "fidelity-violation"}` : `状态：${report.safe ? "通过" : "未通过"}`,
    en ? `Output: ${report.output}` : `输出：${report.output}`,
    en ? `Slides touched: ${(report.requestedSlides || []).join(", ") || "—"}` : `涉及页：${(report.requestedSlides || []).join("、") || "—"}`,
    en ? `Unchanged package parts: ${report.unchangedCount}` : `未改动包内部分：${report.unchangedCount}`,
    "",
    en ? "## What changed" : "## 改了什么",
    ...summary.bullets.map((item) => `- ${item}`),
    "",
    en ? "## Technical parts (optional)" : "## 技术细节（可选）",
    ...(report.changed.length ? report.changed.map((part) => `- \`${part}\``) : [en ? "- (none)" : "- （无）"]),
    ""
  ];
  if (!report.safe) {
    lines.push(en ? "## Violations" : "## 校验问题");
    if (report.unexpectedChanged?.length) {
      lines.push((en ? "- Unexpected: " : "- 意外改动：") + report.unexpectedChanged.join(", "));
    }
    if (report.added?.length) lines.push((en ? "- Added: " : "- 新增：") + report.added.join(", "));
    if (report.removed?.length) lines.push((en ? "- Removed: " : "- 移除：") + report.removed.join(", "));
    lines.push("");
  }
  return lines.join("\n");
}
