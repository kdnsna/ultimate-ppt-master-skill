import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2.js";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.js";
import CircleAlert from "lucide-react/dist/esm/icons/circle-alert.js";
import Clipboard from "lucide-react/dist/esm/icons/clipboard.js";
import FileText from "lucide-react/dist/esm/icons/file-text.js";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open.js";
import Layers3 from "lucide-react/dist/esm/icons/layers-3.js";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";
import Upload from "lucide-react/dist/esm/icons/upload.js";
import { useEffect, useMemo, useState } from "react";
import { inspectPptx, openPath, preserveEditPptx } from "../lib/desktopApi";
import type {
  PreserveEditRequest,
  PreserveEditStep,
  PreserveFidelityResult,
  PreserveOperation,
  PptxSlideInfo
} from "../types";
import { parseNlEditPlan, summarizeNlPlan } from "./nlEditPlan";
import { buildChangeMemoMarkdown, humanFidelitySummary } from "./reportCopy";

type AppLanguage = "zh" | "en";

export interface PreserveEditViewProps {
  language: AppLanguage;
  repoRoot?: string;
  /** When set (e.g. global drop), load this path once. */
  pendingSourcePath?: string | null;
  onPendingSourceConsumed?: () => void;
}

interface TextPair {
  old: string;
  next: string;
}

interface SlideDraft {
  pairs: TextPair[];
  styleSize: string;
  styleBold: boolean;
  tableFind: string;
  tableText: string;
}

const emptyDraft = (): SlideDraft => ({
  pairs: [{ old: "", next: "" }],
  styleSize: "",
  styleBold: false,
  tableFind: "",
  tableText: ""
});

const SAMPLE_REL = "examples/executive-business-review-starter/executive-business-review-editable.pptx";

function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || path || "source";
}

function getDroppedFilePath(file: File): string {
  const maybePath = file as File & { path?: string };
  return maybePath.path || file.webkitRelativePath || "";
}

function joinRepoPath(repoRoot: string | undefined, relative: string): string {
  if (!repoRoot) return relative;
  const sep = repoRoot.includes("\\") ? "\\" : "/";
  return `${repoRoot.replace(/[\\/]+$/, "")}${sep}${relative.replace(/^[\\/]+/, "")}`;
}

function draftHasWork(draft: SlideDraft): boolean {
  if (draft.pairs.some((pair) => pair.old.trim())) return true;
  if (draft.styleSize.trim() || draft.styleBold) return true;
  if (draft.tableFind.trim() && draft.tableText.trim()) return true;
  return false;
}

function draftToStep(slide: number, draft: SlideDraft): PreserveEditStep | null {
  const replacements: Record<string, string> = {};
  for (const pair of draft.pairs) {
    const old = pair.old.trim();
    if (old) replacements[old] = pair.next;
  }
  const operations: PreserveOperation[] = [];
  const size = Number(draft.styleSize);
  if ((draft.styleSize.trim() && Number.isFinite(size)) || draft.styleBold) {
    const matchText = Object.keys(replacements)[0];
    const op: PreserveOperation = {
      op: "style_text",
      ...(matchText ? { match: { text_contains: matchText } } : { match: "all" as const }),
      ...(draft.styleSize.trim() && Number.isFinite(size) ? { size } : {}),
      ...(draft.styleBold ? { bold: true } : {})
    };
    operations.push(op);
  }
  if (draft.tableFind.trim() && draft.tableText.trim()) {
    operations.push({
      op: "replace_table_cell",
      find: draft.tableFind.trim(),
      text: draft.tableText.trim()
    });
  }
  if (!Object.keys(replacements).length && !operations.length) return null;
  return {
    slide,
    ...(Object.keys(replacements).length ? { replacements } : {}),
    ...(operations.length ? { operations } : {})
  };
}

export function PreserveEditView(props: PreserveEditViewProps) {
  const en = props.language === "en";
  const [sourcePath, setSourcePath] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [slides, setSlides] = useState<PptxSlideInfo[]>([]);
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, SlideDraft>>({});
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<PreserveFidelityResult | null>(null);
  const [error, setError] = useState("");
  const [nlText, setNlText] = useState("");
  const [nlHint, setNlHint] = useState("");
  const [showTech, setShowTech] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"svg" | "png" | "none">("none");

  const currentSlide = slides.find((slide) => slide.slide === selectedSlide) || null;
  const draft = selectedSlide != null ? drafts[selectedSlide] || emptyDraft() : emptyDraft();

  const queueSteps = useMemo(() => {
    const steps: PreserveEditStep[] = [];
    for (const slide of slides) {
      const step = draftToStep(slide.slide, drafts[slide.slide] || emptyDraft());
      if (step) steps.push(step);
    }
    return steps;
  }, [drafts, slides]);

  const readyToSave = Boolean(sourcePath) && queueSteps.length > 0;

  async function loadDeck(path: string, seed?: Partial<Record<number, SlideDraft>>) {
    setIsInspecting(true);
    setError("");
    setReport(null);
    setSlides([]);
    setSelectedSlide(null);
    setDrafts({});
    setNlHint("");
    setSourcePath(path);
    setSourceName(fileNameFromPath(path));
    try {
      const result = await inspectPptx(path);
      setSlides(result.slides);
      const first = result.slides[0]?.slide ?? null;
      setSelectedSlide(first);
      if (seed) {
        const next: Record<number, SlideDraft> = {};
        for (const [key, value] of Object.entries(seed)) {
          if (value) next[Number(key)] = value;
        }
        setDrafts(next);
      }
    } catch (err) {
      setError(String(err));
      setSourcePath("");
      setSourceName("");
    } finally {
      setIsInspecting(false);
    }
  }

  useEffect(() => {
    if (!props.pendingSourcePath) return;
    void loadDeck(props.pendingSourcePath);
    props.onPendingSourceConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pendingSourcePath]);

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files.item(0);
    if (!file) return;
    const path = getDroppedFilePath(file);
    if (!path) {
      setError(en ? "Cannot read the dropped file path. Use the native desktop app." : "无法读取拖入文件路径，请使用原生桌面端。");
      return;
    }
    if (!path.toLowerCase().endsWith(".pptx")) {
      setError(en ? "Drop a .pptx file to preserve-edit it." : "请拖入 .pptx 文件进行保真编辑。");
      return;
    }
    void loadDeck(path);
  }

  function resetDeck() {
    setSourcePath("");
    setSourceName("");
    setSlides([]);
    setSelectedSlide(null);
    setDrafts({});
    setReport(null);
    setError("");
    setNlText("");
    setNlHint("");
    setPreviewUrl(null);
    setPreviewKind("none");
  }

  function updateDraft(slide: number, updater: (prev: SlideDraft) => SlideDraft) {
    setDrafts((prev) => {
      const current = prev[slide] || emptyDraft();
      return { ...prev, [slide]: updater(current) };
    });
    setReport(null);
  }

  function addPairFromText(text: string) {
    if (selectedSlide == null) return;
    updateDraft(selectedSlide, (prev) => {
      const pairs = [...prev.pairs];
      const firstEmpty = pairs.findIndex((pair) => !pair.old.trim());
      if (firstEmpty >= 0) {
        pairs[firstEmpty] = { old: text, next: "" };
        return { ...prev, pairs };
      }
      return { ...prev, pairs: [...pairs, { old: text, next: "" }] };
    });
  }

  function applyNlPlan() {
    const plan = parseNlEditPlan(nlText, selectedSlide);
    setNlHint(summarizeNlPlan(plan, props.language));
    if (!plan.length) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const item of plan) {
        const existing = next[item.slide] || emptyDraft();
        const pairs = [...existing.pairs.filter((pair) => pair.old.trim())];
        for (const [old, nextText] of Object.entries(item.replacements)) {
          const idx = pairs.findIndex((pair) => pair.old === old);
          if (idx >= 0) pairs[idx] = { old, next: nextText };
          else pairs.push({ old, next: nextText });
        }
        if (!pairs.length) pairs.push({ old: "", next: "" });
        next[item.slide] = { ...existing, pairs };
      }
      return next;
    });
    if (plan[0]) setSelectedSlide(plan[0].slide);
    setReport(null);
  }

  async function loadSample() {
    const path = joinRepoPath(props.repoRoot, SAMPLE_REL);
    const seed: Record<number, SlideDraft> = {
      1: {
        ...emptyDraft(),
        pairs: [{ old: "季度经营复盘", next: "季度经营复盘 · 已修订" }]
      }
    };
    await loadDeck(path, seed);
  }

  async function resolvePreview(next: PreserveFidelityResult) {
    const preview = next.preview;
    if (!preview) {
      setPreviewUrl(null);
      setPreviewKind("none");
      return;
    }
    if (preview.kind === "png" && preview.pngPath) {
      try {
        if ((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
          const { convertFileSrc } = await import("@tauri-apps/api/core");
          setPreviewUrl(convertFileSrc(preview.pngPath));
          setPreviewKind("png");
          return;
        }
      } catch {
        // fall through to svg
      }
    }
    if (preview.svg) {
      setPreviewUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview.svg)}`);
      setPreviewKind("svg");
      return;
    }
    setPreviewUrl(null);
    setPreviewKind("none");
  }

  async function handleSave() {
    if (!readyToSave) {
      setError(en ? "Add at least one edit on any slide." : "请至少在任意页添加一处修改。");
      return;
    }
    setIsSaving(true);
    setError("");
    setReport(null);
    setPreviewUrl(null);
    setPreviewKind("none");
    try {
      const request: PreserveEditRequest = { sourcePath, edits: queueSteps };
      const next = await preserveEditPptx(request);
      setReport(next);
      await resolvePreview(next);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  }

  function copyMemo() {
    if (!report) return;
    const memo = buildChangeMemoMarkdown(report, props.language);
    navigator.clipboard?.writeText(memo).catch(() => undefined);
  }

  const summary = report ? humanFidelitySummary(report, props.language) : null;
  const queuedSlides = queueSteps.map((step) => step.slide);

  return (
    <section className="screen preserve-screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{en ? "Primary · preserve-edit" : "主路径 · 保真改稿"}</p>
          <h1>{en ? "Change only what you name" : "指哪改哪，其余字节级不动"}</h1>
        </div>
        {sourcePath && (
          <button className="primary-action compact" onClick={() => void handleSave()} disabled={!readyToSave || isSaving}>
            <ShieldCheck size={17} />
            {isSaving
              ? en
                ? "Saving"
                : "保存中"
              : en
                ? `Save ${queueSteps.length || ""} edit(s)`
                : `保存 ${queueSteps.length || ""} 处修改`}
          </button>
        )}
      </div>

      {!sourcePath && (
        <section className="input-panel preserve-drop-panel">
          <div className="panel-title">
            <Upload size={18} />
            <span>{en ? "Drop an existing PowerPoint" : "拖入一份已有 PPT"}</span>
          </div>
          <label className="drop-zone preserve-drop" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
            <FileText size={30} />
            <strong>{en ? "Drop a .pptx here" : "把 .pptx 拖到这里"}</strong>
            <span>
              {en
                ? "We edit only the named slides. Logo, masters, links and untouched slides stay byte-for-byte identical."
                : "只原生修改你点名的页；logo、母版、链接和未选页保持字节级原样。"}
            </span>
          </label>
          <div className="preserve-empty-actions">
            <button className="secondary-action" onClick={() => void loadSample()}>
              <Sparkles size={16} />
              {en ? "Try sample deck" : "试用样例（经营复盘）"}
            </button>
            <p className="preserve-local-note">
              {en ? "Runs fully on your machine. Nothing is uploaded." : "全程在本机运行，不上传任何文件。"}
            </p>
          </div>
          {error && <p className="preserve-error">{error}</p>}
        </section>
      )}

      {sourcePath && (
        <div className="preserve-grid preserve-grid-v2">
          <section className="input-panel preserve-slides-panel">
            <div className="panel-title spaced">
              <span className="preserve-file">
                <Layers3 size={18} />
                <strong>{sourceName}</strong>
                <em>
                  {slides.length} {en ? "slides" : "页"}
                </em>
              </span>
              <button className="text-button" onClick={resetDeck}>
                {en ? "Switch file" : "换一份"}
              </button>
            </div>
            {isInspecting && <p className="preserve-hint">{en ? "Reading slides…" : "正在读取页面…"}</p>}
            {queuedSlides.length > 0 && (
              <p className="preserve-queue-badge">
                {en
                  ? `Queued: slide ${queuedSlides.join(", ")}`
                  : `待保存：第 ${queuedSlides.join("、")} 页`}
              </p>
            )}
            <div className="preserve-slides">
              {slides.map((slide) => {
                const hasDraft = draftHasWork(drafts[slide.slide] || emptyDraft());
                return (
                  <button
                    key={slide.slide}
                    className={slide.slide === selectedSlide ? "preserve-slide active" : "preserve-slide"}
                    onClick={() => {
                      setSelectedSlide(slide.slide);
                      setReport(null);
                    }}
                  >
                    <span className="preserve-slide-num">
                      {slide.slide}
                      {hasDraft ? <i className="preserve-dot" /> : null}
                    </span>
                    <span className="preserve-slide-texts">
                      {(slide.texts || []).slice(0, 3).map((text, i) => (
                        <span key={i}>{text}</span>
                      ))}
                      {(!slide.texts || slide.texts.length === 0) && (
                        <span className="preserve-muted">{en ? "(no text)" : "（无文本）"}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="choice-panel preserve-editor-panel">
            <div className="panel-title">
              <FileText size={18} />
              <span>{en ? `Edit slide ${selectedSlide ?? "—"}` : `修改第 ${selectedSlide ?? "—"} 页`}</span>
            </div>

            <div className="preserve-nl">
              <label className="preserve-nl-label">
                {en ? "Natural language (optional)" : "人话指令（可选）"}
              </label>
              <textarea
                className="field preserve-nl-input"
                rows={2}
                value={nlText}
                onChange={(event) => setNlText(event.target.value)}
                placeholder={
                  en
                    ? 'e.g. slide 1: Q2 -> Q3; slide 4: 线上 -> 线上渠道'
                    : "例如：第1页的「Q2」改成「Q3」；第4页 线上 改成 线上渠道"
                }
              />
              <button className="secondary-action compact" onClick={applyNlPlan} disabled={!nlText.trim()}>
                {en ? "Parse into queue" : "解析并加入队列"}
              </button>
              {nlHint && <p className="preserve-hint">{nlHint}</p>}
            </div>

            {currentSlide && (currentSlide.texts || []).length > 0 && (
              <div className="preserve-chips">
                <p className="preserve-chips-label">{en ? "Click text to replace it:" : "点选要替换的文本："}</p>
                <div className="preserve-chip-wrap">
                  {currentSlide.texts.map((text, i) => (
                    <button key={i} className="preserve-chip" onClick={() => addPairFromText(text)} title={text}>
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSlide != null && (
              <>
                <div className="preserve-pairs">
                  {draft.pairs.map((pair, index) => (
                    <div key={index} className="preserve-pair">
                      <input
                        className="field"
                        value={pair.old}
                        onChange={(event) =>
                          updateDraft(selectedSlide, (prev) => {
                            const pairs = [...prev.pairs];
                            pairs[index] = { ...pairs[index], old: event.target.value };
                            return { ...prev, pairs };
                          })
                        }
                        placeholder={en ? "Original text" : "原文"}
                      />
                      <ChevronRight size={16} />
                      <input
                        className="field"
                        value={pair.next}
                        onChange={(event) =>
                          updateDraft(selectedSlide, (prev) => {
                            const pairs = [...prev.pairs];
                            pairs[index] = { ...pairs[index], next: event.target.value };
                            return { ...prev, pairs };
                          })
                        }
                        placeholder={en ? "New text" : "新文本"}
                      />
                      <button
                        className="preserve-pair-remove"
                        onClick={() =>
                          updateDraft(selectedSlide, (prev) => ({
                            ...prev,
                            pairs:
                              prev.pairs.length > 1
                                ? prev.pairs.filter((_, i) => i !== index)
                                : [{ old: "", next: "" }]
                          }))
                        }
                        title={en ? "Remove" : "删除"}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    className="text-button"
                    onClick={() =>
                      updateDraft(selectedSlide, (prev) => ({
                        ...prev,
                        pairs: [...prev.pairs, { old: "", next: "" }]
                      }))
                    }
                  >
                    + {en ? "Add replacement" : "再加一组"}
                  </button>
                </div>

                <div className="preserve-ops">
                  <p className="preserve-chips-label">{en ? "Style & table (this slide)" : "样式与表格（本页）"}</p>
                  <div className="preserve-ops-row">
                    <label>
                      {en ? "Font size" : "字号"}
                      <input
                        className="field"
                        type="number"
                        min={8}
                        max={96}
                        value={draft.styleSize}
                        onChange={(event) =>
                          updateDraft(selectedSlide, (prev) => ({ ...prev, styleSize: event.target.value }))
                        }
                        placeholder="24"
                      />
                    </label>
                    <label className="preserve-check">
                      <input
                        type="checkbox"
                        checked={draft.styleBold}
                        onChange={(event) =>
                          updateDraft(selectedSlide, (prev) => ({ ...prev, styleBold: event.target.checked }))
                        }
                      />
                      {en ? "Bold" : "加粗"}
                    </label>
                  </div>
                  <div className="preserve-ops-row">
                    <input
                      className="field"
                      value={draft.tableFind}
                      onChange={(event) =>
                        updateDraft(selectedSlide, (prev) => ({ ...prev, tableFind: event.target.value }))
                      }
                      placeholder={en ? "Table cell find…" : "表格查找…"}
                    />
                    <ChevronRight size={16} />
                    <input
                      className="field"
                      value={draft.tableText}
                      onChange={(event) =>
                        updateDraft(selectedSlide, (prev) => ({ ...prev, tableText: event.target.value }))
                      }
                      placeholder={en ? "New cell text" : "新单元格"}
                    />
                  </div>
                  {currentSlide?.tables && currentSlide.tables.length > 0 && (
                    <p className="preserve-hint">
                      {en
                        ? `${currentSlide.tables.length} table(s) on this slide`
                        : `本页检测到 ${currentSlide.tables.length} 个表格`}
                      {currentSlide.tables[0]?.rows?.[0]
                        ? ` · ${currentSlide.tables[0].rows[0].filter(Boolean).slice(0, 3).join(" / ")}`
                        : ""}
                    </p>
                  )}
                  {currentSlide?.charts && currentSlide.charts.length > 0 && (
                    <p className="preserve-hint">
                      {en
                        ? `${currentSlide.charts.length} chart(s); use Agent/CLI for chart values if needed`
                        : `本页 ${currentSlide.charts.length} 个图表；复杂改数可用 Agent/CLI`}
                    </p>
                  )}
                </div>
              </>
            )}

            {error && <p className="preserve-error">{error}</p>}

            {report && summary && (
              <div className={report.safe ? "preserve-report safe" : "preserve-report violation"}>
                <div className="preserve-report-head">
                  {report.safe ? <ShieldCheck size={22} /> : <CircleAlert size={22} />}
                  <div>
                    <strong>{summary.title}</strong>
                    <span>{summary.detail}</span>
                  </div>
                  <button className="secondary-action compact" onClick={() => openPath(report.output)}>
                    <FolderOpen size={16} />
                    {en ? "Open output" : "打开输出"}
                  </button>
                </div>
                <ul className="preserve-report-human">
                  {summary.bullets.map((line) => (
                    <li key={line}>
                      <CheckCircle2 size={14} />
                      {line}
                    </li>
                  ))}
                </ul>
                {previewUrl && (
                  <div className="preserve-preview">
                    <div className="preserve-preview-head">
                      <strong>
                        {previewKind === "png"
                          ? en
                            ? "Before / after (real render)"
                            : "改前改后（真实渲染）"
                          : en
                            ? "Before / after (trust card)"
                            : "改前改后（信任卡）"}
                      </strong>
                      <span>
                        {report.preview?.backend
                          ? report.preview.backend
                          : en
                            ? "vector · no LibreOffice required"
                            : "矢量示意 · 无需 LibreOffice"}
                      </span>
                    </div>
                    <img className="preserve-preview-img" src={previewUrl} alt={en ? "Before and after" : "改前改后"} />
                  </div>
                )}
                <div className="preserve-report-actions">
                  <button className="text-button" onClick={copyMemo}>
                    <Clipboard size={14} />
                    {en ? "Copy change memo" : "复制变更说明"}
                  </button>
                  {report.memoPath && (
                    <button className="text-button" onClick={() => openPath(report.memoPath!)}>
                      <FileText size={14} />
                      {en ? "Open memo file" : "打开变更说明文件"}
                    </button>
                  )}
                  {report.preview?.svgPath && (
                    <button className="text-button" onClick={() => openPath(report.preview!.svgPath!)}>
                      {en ? "Open preview file" : "打开预览文件"}
                    </button>
                  )}
                  <button className="text-button" onClick={() => setShowTech((value) => !value)}>
                    {showTech
                      ? en
                        ? "Hide technical parts"
                        : "隐藏技术细节"
                      : en
                        ? "Show technical parts"
                        : "显示技术细节"}
                  </button>
                </div>
                {showTech && report.changed.length > 0 && (
                  <ul className="preserve-report-parts">
                    {report.changed.map((part) => (
                      <li key={part}>
                        <CheckCircle2 size={14} />
                        {part}
                      </li>
                    ))}
                  </ul>
                )}
                {!report.safe &&
                  (report.unexpectedChanged.length > 0 || report.added.length > 0 || report.removed.length > 0) && (
                    <div className="preserve-report-detail">
                      {report.unexpectedChanged.length > 0 && (
                        <p>
                          {en ? "Unexpected changes" : "意外改动"}：{report.unexpectedChanged.join(", ")}
                        </p>
                      )}
                      {report.added.length > 0 && (
                        <p>
                          {en ? "Added parts" : "新增部分"}：{report.added.join(", ")}
                        </p>
                      )}
                      {report.removed.length > 0 && (
                        <p>
                          {en ? "Removed parts" : "移除部分"}：{report.removed.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
