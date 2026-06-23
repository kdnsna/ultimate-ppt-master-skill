# Release Notes - v5.3.0

v5.3.0 adds the Best-Effect Brief Enhancer. The Skill no longer treats a user's short sentence as the production brief. Agents must first expand the request into `bestEffectBrief`, then choose a stable route.

## What Changed

- Added the v5.3 `bestEffectBrief` contract for Web handoffs and direct Agent use: prompt quality, auto-expanded brief, recommended route, fixed fallback, assumptions, and user-visible caveats.
- Added the Extreme Thin Prompt Fallback: topic-only or one-line prompts default to the Guizang-like Magazine Web Deck fixed style unless the user explicitly asks for formal editable PPTX.
- Added the formal editable exception: government, finance, training, report, `.pptx`, and explicitly editable requests still route to PPTX with formal-business checks.
- Updated `SKILL.md`, `PROMPT.md`, `AGENTS.md`, `agents/openai.yaml`, and marketplace metadata so every Agent entry point starts with the same best-effect prompt.
- Updated the Web Experience to show the Best-Effect Brief Enhancer in the Visual Brief Builder and to write `bestEffectBrief` into `project-brief.json`, `manifest.json`, `quality-report.json`, `codex-task.md`, and generated `AGENTS.md`.
- Updated README first-screen guidance so users can copy a reliable prompt instead of guessing how to ask.

## Plain-Language Update Notes

- If the user only says "make a PPT about AI", the Agent now fills in a best-effect brief before making anything.
- If the prompt is extremely thin, the default first version is a strong magazine-style Web Deck, not a bland generic deck.
- If the user needs a formal editable file, the system still chooses PPTX and keeps the same quality checks.
- Agents should ask fewer ordinary style questions and only stop when missing facts, sources, brand/IP, compliance, or route boundaries matter.

## Compatibility

v5.3.0 is additive for v5.2 handoff files. Existing `briefMode`, `visualBrief`, `guidedBrief`, `expectationFit`, `sourceConfidence`, `deliveryScorecard`, `referenceStyle`, and `feedbackLoop` fields still work. New agents should read and preserve `bestEffectBrief` when present, and should create it before production when it is missing.

No desktop binary is attached to this release. Public distribution continues through source packages and the Web/Agent workflow unless a separate signed desktop package is produced.

## Verification

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:market
npm run audit:brief
npm run audit:visual-intent
npm run audit:feedback-loop
python3 -m unittest tests/test_release_integrity.py
npm run audit:presets
npm run audit:quality
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
git diff --check
```
