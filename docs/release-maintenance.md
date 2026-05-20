# Release and Maintenance

Use this checklist when preparing a public release or accepting a contribution.

## Local Verification

```bash
npm run doctor
npm run build:desktop
npm --prefix apps/desktop audit
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

- desktop dependency install;
- desktop frontend build;
- dependency audit;
- Python worker tests;
- whitespace checks.

The release workflow lives at:

```text
.github/workflows/release-desktop.yml
```

It builds a macOS app zip for the Homebrew Cask asset contract and uploads it to
the selected GitHub release.

## Homebrew Cask Channel

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

v2.0.0 positions this repository as:

- a local-first desktop product for normal users;
- a portable agent skill for production-grade deck generation;
- a documented foundation for future direct API adapters.

Do not claim the direct API driver is complete until a worker adapter and tests exist.
