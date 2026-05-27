# Release and Maintenance

Use this checklist when preparing a public release or accepting a contribution.

## Local Verification

```bash
npm run doctor
npm --prefix apps/web ci
npm run build:web
npm run audit:presets
npm run audit:quality
npm run build:desktop
npm --prefix apps/desktop audit
npm run test:node
npm run test:worker
git diff --check
```

For native packaging on macOS:

```bash
npm run package:desktop
```

For a Homebrew Cask release zip:

```bash
npm run package:desktop:homebrew
```

DMG packaging is optional:

```bash
npm run package:desktop:dmg
```

## CI

The repository CI lives at:

```text
.github/workflows/ci.yml
```

It should cover:

- web experience dependency install;
- web experience static build;
- desktop dependency install;
- desktop frontend build;
- dependency audit;
- preset starter-pack audit;
- stable pack quality proof audit;
- Bridge and Web Experience Node tests;
- Python worker tests;
- whitespace checks.

CI should run on the current GitHub Actions JavaScript runtime generation. For
v2.5.0 that means Node 24 in the workflows and current official action majors
for checkout, Node, and Python setup.

The Pages workflow lives at:

```text
.github/workflows/pages.yml
```

It builds `apps/web` with `GITHUB_PAGES=true` and deploys the static artifact to GitHub Pages.
Keep the Pages helper actions on their current Node 24-compatible majors before
publishing a release tag.

The release workflow lives at:

```text
.github/workflows/release-desktop.yml
```

It builds a macOS app zip for the Homebrew Cask asset contract and uploads it to
the selected GitHub release.

## Homebrew Cask Channel

Homebrew is currently a future desktop distribution channel, not the main acquisition path. The public first touch is the Web Experience, and the production route is Agent Skill.

The user-facing install should be:

```bash
brew install --cask kdnsna/ultimate-ppt-master/ultimate-ppt-master
```

Release requirements:

- publish `Ultimate-PPT-Master-<version>-macOS-<arch>.zip` assets;
- update `Casks/ultimate-ppt-master.rb`;
- copy the cask into `kdnsna/homebrew-ultimate-ppt-master`;
- replace `sha256 :no_check` with real checksums before public promotion;
- sign and notarize the app before calling the channel production-ready.

See [Homebrew Distribution Plan](./homebrew-distribution.md).

## Public Demo Policy

Private materials stay local. Public examples must be sanitized.

Allowed in git:

- sanitized Markdown;
- sanitized HTML demo;
- redacted screenshots/cover art;
- README explanation.

Not allowed in git:

- raw business DOCX/PDF/XLSX/PPTX;
- raw generated PPTX/HTML containing private context;
- `.env` files or API keys;
- project logs with private content.

## Upstream Sync

Track upstream references in:

```text
UPSTREAM_SYNC.md
```

When syncing upstream:

1. record upstream repository and commit/date;
2. describe what changed;
3. describe local adaptation decisions;
4. run the release verification commands;
5. update README/CHANGELOG-style notes if user-visible behavior changed.

## Version Notes

v2.5.0 positions this repository as:

- a quality workbench for Chinese office users, with Business Review, Consulting Proposal, Training Courseware, and Academic Defense as the practical default path;
- a web-first static experience for public discovery, source intake, current task preview, next-step guidance, Design Doctor, handoff-kit export, and demo viewing;
- a localhost-only Agent Bridge for local source parsing, provider readiness checks, quality-profile handoff, and project creation;
- a portable agent skill for production-grade deck generation;
- a reusable preset-pack catalog with release-audited starter packs, public proof artifacts, and quality reports;
- a retained desktop preview for future signed native distribution;
- a documented provider convention that keeps API keys local.

Do not claim the hosted/direct API deck generator is complete until a worker adapter and tests exist. Bridge can test provider readiness, but production remains Agent/Skill-led.
