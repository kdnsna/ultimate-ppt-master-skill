# Release and Maintenance

Use this checklist when preparing a public release or accepting a contribution.

## Local Verification

```bash
npm run doctor
npm --prefix apps/web ci
npm run build:web
npm run audit:docs
npm run audit:web-console
npm run audit:presets
npm run audit:quality
npm run audit:market
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
- documentation link and version audit;
- Web Experience console simplicity audit;
- preset starter-pack audit;
- stable pack quality proof audit;
- skill marketplace metadata, public proof wall, and listing asset audit;
- Bridge and Web Experience Node tests;
- Python worker tests;
- whitespace checks.

CI should run on the current GitHub Actions JavaScript runtime generation. For
v5.1.0 that means Node 24 in the workflows and current official action majors
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

v5.1.0 positions this repository as:

- a delivery-defaults presentation workbench for Chinese office users who need formal PPTX and high-impact Web Deck outputs;
- an office-first Agent Skill where generic PPT requests default to editable PPTX after a clarity gate has enough production intent;
- a Web Visual Brief Builder where users can choose scenario, audience, purpose, content status, visual style, density, asset strategy, and output tags while still pasting background context;
- a Codex Guided Intake workflow where vague requests are clarified by stage before serious deck production;
- a unified `project-brief.json` contract carrying `briefMode`, `visualBrief`, `guidedBrief`, and `expectationFit`;
- a Codex-first generated-visual workflow that uses no-text support visuals and micro-assets without flattening body-slide content;
- an official/IP asset governance workflow that records brand marks as official-source, user-provided, text-lockup-fallback, or needs-authorized-replacement;
- a Microsoft YaHei formal typography and layout baseline for practical PowerPoint handoff;
- a DeckIR AI planning workbench that writes page maps, source maps, planning reports, and rendered-review findings before final generation;
- a rendered-review repair loop that writes low-risk repair plans and a user-approved `revision-brief.md` for the second pass;
- a four-step Web Experience console with one primary next action and advanced controls behind drawers;
- a page-recipe workflow that defines slide roles before page generation begins;
- a generated-visual-layer workflow that improves visual quality without hiding body-slide text, numbers, tables, charts, logos, or QR codes inside raster images;
- a web-first static experience for public discovery, source intake, current task preview, next-step guidance, Design Doctor, handoff-kit export, and demo viewing;
- a localhost-only Agent Bridge for local source parsing, provider readiness checks, quality-profile handoff, and project creation;
- a portable agent skill for production-grade deck generation;
- release-audited docs, preset packs, public proof artifacts, marketplace metadata, and quality reports;
- a retained desktop preview for future signed native distribution.

Do not claim the hosted/direct API deck generator is complete until a worker adapter and tests exist. Bridge can test provider readiness, but production remains Agent/Skill-led.
