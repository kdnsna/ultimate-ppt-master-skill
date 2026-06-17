# Release Notes - v5.1.0

v5.1.0 focuses on the last mile before deck generation: unclear PPT requests. v5.0 made the system faster and more delivery-oriented; v5.1 makes it harder to generate the wrong deck by adding a Web Visual Brief Builder, Codex Guided Intake, and an `expectationFit` gate that records missing signals before production.

## What Changed

- Added a Visual Brief Builder in the Web Experience with selectable tags for scenario, audience, purpose, content status, visual style, layout density, asset strategy, and output preference.
- Added recommended tag combinations for executive review, client proposal, product launch, internal training, and research report workflows.
- Added freeform areas for background material, meeting notes, leadership requirements, reference links, and special constraints.
- Added Codex Guided Intake rules for vague chat requests. Codex now asks staged questions instead of guessing when the user has not supplied enough detail.
- Added the unified `project-brief.json` contract with `briefMode`, `visualBrief`, `guidedBrief`, and `expectationFit`.
- Added green/yellow/red expectation-fit risk so the handoff can distinguish production-ready briefs from assumption-heavy drafts.
- Updated Bridge and Desktop Worker output so Codex task files, `AGENTS.md`, manifests, design specs, spec locks, and quality reports all carry the same expectation contract.
- Updated tests and audits for Web tags, guided intake fields, Bridge handoff, Desktop Worker sync, and release integrity.

## Codex Guided Intake

When a user provides too little information, Codex should collect the missing production signals by stage:

1. Scenario, audience, and desired outcome.
2. Content source, source completeness, and core message.
3. Page count, section structure, and speaker-note needs.
4. Visual style, layout density, reference objects, and Microsoft YaHei typography expectations.
5. Official/IP asset rules, AI image permission, output format, and compliance boundaries.

If the user explicitly says to draft with assumptions, Codex may proceed, but the assumptions must be written into the brief and audit trail.

## Data Contract

`project-brief.json` now includes:

```json
{
  "briefMode": "visual-tags | codex-guided-intake | source-first | draft-with-assumptions",
  "visualBrief": {
    "selectedTags": {},
    "backgroundText": "",
    "extraRequirements": "",
    "referenceLinks": []
  },
  "guidedBrief": {
    "scenario": "",
    "audience": "",
    "purpose": "",
    "coreMessage": "",
    "contentSources": [],
    "slideCount": "",
    "outlinePreference": "",
    "visualStyle": [],
    "assetRules": [],
    "outputFormat": [],
    "mustInclude": [],
    "mustAvoid": []
  },
  "expectationFit": {
    "riskLevel": "green | yellow | red",
    "missingSignals": [],
    "assumptions": [],
    "readyForProduction": true
  }
}
```

## Plain-Language Update Notes

- Web users get richer, faster brief input without a long questionnaire.
- Codex users get a real PPT intake conversation when the request is vague.
- The system now tells the agent whether a brief is safe to produce, risky but workable, or too incomplete.
- Generated PPTs should better match the user's real expectation because audience, purpose, content source, page structure, style, assets, and output format are captured before production.
- The default delivery rules from v5.0 remain: editable PPTX first, Codex/GPT no-text visuals, official/IP asset boundaries, Microsoft YaHei typography, rendered review, and formal-business audits.

## Compatibility

v5.1.0 is additive for existing projects. Previous v5.0 handoff files still work. New handoffs include more brief fields, and downstream agents should preserve them in prompts, specs, locks, manifests, and quality reports.

No desktop binary is attached to this release. Desktop build verification is part of the release gate, but public distribution continues to rely on source packages and the Web/Agent workflow unless a separate signed desktop package is produced.

## Verification

Release validation should include:

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:market
python3 -m unittest tests/test_release_integrity.py
npm run audit:presets
npm run audit:quality
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```
