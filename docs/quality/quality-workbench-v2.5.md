# Quality Workbench v2.5

v2.5 positions Ultimate PPT Master as a quality workbench for Chinese office users, not a black-box cloud deck generator. The Web Experience collects the brief, the Bridge writes a local handoff contract, and the Skill/Agent route performs the final production, review, and repair.

## Stable Proof Matrix

| Preset | Best For | Proof Output | Quality Report | Not For |
| --- | --- | --- | --- | --- |
| Executive Business Review | Quarterly reviews, monthly business updates, management action plans | `examples/executive-business-review-starter/web-demo.html` | `examples/executive-business-review-starter/quality-report.json` | Pure marketing launches; private board-only material |
| Consulting Proposal | Diagnosis, option comparison, recommendation, roadmap | `examples/consulting-proposal-starter/web-demo.html` | `examples/consulting-proposal-starter/quality-report.json` | Creative campaigns; regulated advice without expert review |
| Product Pitch | Launch story, demo-day narrative, partner pitch | `examples/product-pitch-starter/web-demo.html` | `examples/product-pitch-starter/quality-report.json` | Dense KPI status reports; regulated fundraising claims |
| Tech Trend Web Deck | Public trend essay, thought leadership, shareable Web Deck | `examples/tech-trend-web-deck-starter/web-demo.html` | `examples/tech-trend-web-deck-starter/quality-report.json` | Confidential strategy; academic defense structure |

## Design Doctor

Design Doctor is the user-facing quality step that combines the existing visual review workflow:

- `scripts/svg_quality_checker.py` checks generated SVG/PPTX visual assets for common structural problems.
- `scripts/visual_review.py` performs browser-based visual review when a local preview is available.
- `workflows/visual-review.md` remains the detailed production workflow for an Agent.

The default behavior is report-first: produce `quality-report.json` and a plain-language Chinese summary. Automatic SVG repair should happen only when the user explicitly requests it.

## Handoff Contract

Every v2.5 handoff should carry:

- `qualityProfile`: acceptance criteria and quality label for the selected preset.
- `expectedArtifacts`: source, preview, report, and final delivery targets.
- `reviewCommands`: recommended local checks before delivery.
- `quality-report.json`: pending or completed review status in the local project folder.

This keeps the Agent from receiving only a prompt; it receives an inspectable contract with success criteria.

## Audit Command

Run the proof audit before publishing:

```bash
python3 scripts/audit_quality_proofs.py
```

It verifies stable pack metadata, proof artifacts, quality reports, and stale public demo version markers.
