# DeckIR AI Planning Workflow v4.2

v4.2 adds an AI planning layer on top of the existing v4.1 local handoff and v4.0 hybrid-editable contract. The goal is not to let a model emit a raw PPTX directly; the goal is to make the deck easier to steer, audit, and revise before the final PPTX or Web Deck is produced.

## Best Current Route

```text
source material
  -> Markdown/source extraction
  -> DeckIR storyboard
  -> page recipe and reference-style mapping
  -> editable PPTX or Web Deck generation
  -> rendered review findings
  -> human-approved revision
```

This follows the practical direction shown by current AI presentation research and tooling: PPTAgent-style reference learning and edit actions, DeepPresenter-style rendered feedback, PreGenie-style plan/review/regenerate loops, and Markdown-first source normalization similar to MarkItDown.

## DeckIR Files

Every local handoff can now carry the same planning packet from Web, Bridge, or Desktop Worker:

- `storyboard.json`: DeckIR v1 page map with audience, scenario, slide roles, recipe IDs, evidence refs, visual-layer policy, raster policy, and editability target.
- `source-map.json`: source claims and traceable evidence IDs used by the storyboard.
- `planning-report.json`: planner mode, fallback status, route recommendation, quality gate summary, and next actions for the Agent.
- `review-findings.json`: rendered-review output, initially pending until a generated PPTX/Web preview is available.
- `repair-plan.json`: v4.3-safe repair candidates and a second-generation brief path, initially pending until rendered review runs.

When no provider key is configured, the planner still writes a deterministic rule-planned DeckIR. That keeps the product usable offline and gives the Agent a structured brief instead of a blank prompt.

## Quality Gates

Use these checks before final delivery:

```bash
python3 scripts/ai_storyboard.py --source <source.md> --project <project_path> --no-llm
python3 scripts/audit_storyboard.py <project_path>
python3 scripts/review_rendered_deck.py <project_path>
python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run
python3 scripts/audit_formal_delivery.py <project_path>
python3 scripts/audit_visual_recipes.py <project_path>
```

The storyboard audit fails formal body pages that allow full-page raster output, pages without evidence refs, missing page roles, missing recipe IDs, or weak editability targets. The rendered review is report-first: it flags congestion, repeated layouts, repeated recipes, missing evidence, and raster-policy risks. Automatic repair should remain user-approved and limited to low-risk layout or prompt changes.

## Reference Style Import

`scripts/pptx_template_import.py` now writes `reference-style.json` when it builds a reference manifest. The planner can use it in two modes:

- `style-only`: borrow visual rhythm, layout family, fonts, and colors without copying the reference structure.
- `follow-reference`: map generated pages to the reference deck's functional page sequence while keeping source facts and user content separate.

The important rule is: learn the intent and rhythm, not the reference deck's private content.

## Product Surface

The Web Experience exposes this as an easy "best route" flow instead of technical knobs. Users provide source material and a goal; the UI recommends PPTX/Web/both, preset, page count, quality gate, and shows the planned page map.

For Agent handoff, `codex-task.md` and `AGENTS.md` now tell the assistant to read `storyboard.json` and `source-map.json` first, then run storyboard and rendered-review checks before finalizing the deck.
