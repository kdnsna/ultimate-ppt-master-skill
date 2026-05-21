# Release Notes - v2.3.0

v2.3.0 unifies Ultimate PPT Master around one product promise:

> visible input, proven output, local Agent handoff.

## Biggest Improvement

The project no longer only explains that it can generate an Agent prompt. The README and Web Experience now show the full path:

1. what source material the user should provide;
2. what Agent prompt is generated;
3. what a polished Web Deck output looks like;
4. how Bridge packages the handoff;
5. how the Skill remains the production-quality route.

## What Changed

- Added one-line update commands for local clones, Codex Skill installs, and generic Agent Skill installs.
- Added an input-to-output README sample with source material, Agent prompt, screenshot, and generated Web Deck.
- Updated the Web Experience copy to Agent Connect Studio and focused it on v2.3's product value.
- Kept Bridge local-only and handoff-oriented: `manifest`, `engine-plan`, `quality-checklist`, preview, and Agent commands.
- Refined public demo notes so the sample is easier to understand as "what to provide / what you get".

## Quality Bar

v2.3.0 still treats the web page as the front door, not the final production engine. Final quality should come from the Skill route: local files, scripts, preview, repair, and export checks.

The public demo has been checked as a browser-openable Web Deck and documented alongside its source brief.

## Upgrade

```bash
cd ultimate-ppt-master-skill
npm run update
```

Codex Skill users can run the one-line update command in the README.
