# Release Notes - v5.0.0

v5.0.0 reframes Ultimate PPT Master around delivery defaults for real office PPT work. It keeps the v4.3 rendered-review loop, the v4.2 DeckIR planning pack, the v4.1 simplified Web console, and the v4.0 hybrid-editable contract, then makes the normal path simpler: editable PPTX by default, one delivery brief, official/IP asset boundaries, Codex-first visuals, theme art direction, Microsoft YaHei typography, and formal-business audits.

## What Changed

- Generic PPT requests now default to editable PPTX unless the user explicitly asks for a Web Deck or magazine-style browser deliverable.
- The Skill replaces repeated route/style confirmation with one delivery brief covering canvas, page count, audience, style, color, icons, typography, and image usage.
- Formal-business handoff now emphasizes `design_spec.md`, `spec_lock.md`, and `design-quality-report.md` as the design contract before final generation.
- Codex native GPT image generation is the preferred visual asset path for composed no-text support visuals and reusable micro-assets.
- Official/IP marks now require documented handling: `official-source`, `user-provided`, `text-lockup-fallback`, or `needs-authorized-replacement`.
- The Strategist now names a subject-fit theme art direction before generation. Cultural tourism, brand, training, keynote, and public-facing decks should carry that concept through the cover/tail pages and main title treatment; serious work-report/government/compliance contexts may use a documented restrained exception.
- Delivery design defaults now specify Microsoft YaHei, 16:9 margins, body/title scale, card limits, layout variety, and anti-patterns for real PPT handoff.
- Formal delivery audits now check brand asset states, theme art direction fields, typography scale, aesthetic checks, page roles, layout variety, and generated-visual records more explicitly.
- The repository README has been redesigned as a v5 delivery-system homepage instead of a historical release catalog.

## Plain-Language Update Notes

- If someone says "make a PPT", the Skill now starts with the office-safe answer: a real editable PowerPoint.
- The agent should ask fewer questions. It records a compact production contract and continues unless a missing answer would materially change the deck.
- AI images should look like designed scenes or useful support layers, not piles of unrelated decorative elements.
- The deck should have a theme-level art idea when the material allows it. For example, a cultural-tourism deck can use `山海交汇 烟火同行` as a cover/tail and title system instead of generic office styling.
- Logos, tourism IP, card art, campaign marks, and partner marks are not guessed. If the real asset cannot be safely sourced, the deck records a visible replacement boundary.
- The default typography is practical for Chinese office workflows: Microsoft YaHei, larger body text, clear title hierarchy, and less cramped card grids.

## Release Checks

```bash
npm run audit:docs
npm run audit:web-console
npm run audit:presets
npm run audit:quality
npm run audit:market
npm run test:node
npm run test:bridge
npm run test:worker
npm run build:web
npm run build:desktop
git diff --check
```

## Compatibility

v5.0.0 is behaviorally stricter but additive for existing project files. Bridge endpoints, Desktop Worker output modes, DeckIR files, rendered-review files, and formal-business audit commands remain compatible. The main visible change is the default route and delivery language used by the Skill and README.
