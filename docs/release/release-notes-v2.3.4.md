# Release Notes - v2.3.4

v2.3.4 is a Web + Bridge setup hardening release. It keeps the same honest production boundary:

> the web page prepares the project, Bridge writes it locally, and the Agent Skill remains the high-quality production route.

## Biggest Improvement

Bridge startup is now safer for first-time users. The copied startup command no longer assumes the terminal is already inside the repository. It finds the local `ultimate-ppt-master-skill/package.json` first, then runs `npm run bridge` from the correct directory; if no local checkout exists, it clones one into a standard local folder.

This directly prevents errors like:

```text
Could not read package.json ... /Users/<name>/package.json
```

## What Changed

- Updated the Web Experience to copy a Bridge startup command that works from `~` or another arbitrary terminal directory.
- Added a regression test so the page cannot drift back to copying a bare `npm run bridge`.
- Kept Bridge-backed Skill install / update actions for Codex and a generic local Agent folder.
- Kept local Agent detection for Codex, Hermes, OpenClaw, and Claude Code through `GET /health`.
- Documented the package-root startup failure in troubleshooting.

## Quality Bar

v2.3.4 verifies that Web + Bridge still creates a real local project package and that the setup path stays beginner-friendly. Provider keys and `.venv` remain optional environment warnings, not blockers for this release.

## Upgrade

```bash
cd ultimate-ppt-master-skill
npm run update
```

Then open the Web Experience and use the copied Bridge startup command from the Start or Configuration page.
