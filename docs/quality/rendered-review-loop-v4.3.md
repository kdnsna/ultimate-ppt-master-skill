# Rendered Review Loop v4.3

v4.3 turns rendered-review output into a safer revision workflow. It keeps the existing report-first behavior, then adds low-risk repair candidates and a second-generation brief that an Agent can apply only after user confirmation.

## What Changes

The review loop now writes two files:

- `review-findings.json`: rendered issues plus `riskLevel`, `autoFixable`, `targetArtifact`, `suggestedCommand`, and `repairCandidates`.
- `repair-plan.json`: a proposed safe-only repair plan with candidate actions, affected artifacts, and an approval status.

The same summary is merged into `quality-report.json` so Web, Bridge, Desktop Worker, and CI-style audits can show one consistent status.

## Safe Repair Scope

`scripts/apply_review_plan.py` is intentionally conservative. The default command is a dry run:

```bash
python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run
```

Applying the plan requires explicit confirmation:

```bash
python3 scripts/apply_review_plan.py <project_path> --safe-only --apply
```

The apply mode can update planning and instruction artifacts only:

- `storyboard.json`
- `project-brief.json`
- `quality-report.json`
- `codex-task.md`
- `AGENTS.md`
- `repair-plan.json`

It must not rewrite `source.md`, source facts, business conclusions, or final body copy. Allowed safe candidates are layout variety hints, density warnings, visual prompt reinforcement, evidence placeholders for human review, raster-policy hints, and a second-generation revision brief.

## Product Surface

The Web Experience shows a "Rendered Review Loop" quality section with issue types, safe repair candidates, and the dry-run command. Bridge and Desktop Worker include the same review/apply dry-run chain in `qualityGate.reviewCommands`, so handoff projects have a repeatable path:

```bash
python3 scripts/review_rendered_deck.py <project_path>
python3 scripts/apply_review_plan.py <project_path> --safe-only --dry-run
```

## Non-goals

v4.3 does not make DOM/HTML-to-PPTX the main route. `dom-to-pptx` remains an experimental adapter candidate until it can pass editable text, editable charts, gradient/shadow fidelity, image-crop fidelity, and PowerPoint compatibility checks.

