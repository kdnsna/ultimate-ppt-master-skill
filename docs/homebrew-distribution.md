# Homebrew Distribution Plan

The public user path should be Homebrew Cask first, source install second.

## Target User Commands

One-line install once the tap is live:

```bash
brew install --cask kdnsna/ultimate-ppt-master/ultimate-ppt-master
```

Traditional two-step install:

```bash
brew tap kdnsna/ultimate-ppt-master
brew install --cask ultimate-ppt-master
```

Update:

```bash
brew upgrade --cask ultimate-ppt-master
```

Uninstall:

```bash
brew uninstall --cask ultimate-ppt-master
```

## Why This Replaces Source Setup For Users

The repository source path still matters for developers:

```bash
git clone https://github.com/kdnsna/ultimate-ppt-master-skill.git
cd ultimate-ppt-master-skill
npm run setup
npm run desktop
```

But that flow exposes Python, Node, Rust, Tauri, Cairo, local venvs, and build
fallbacks. It is too much for broad adoption. Homebrew Cask should distribute a
prebuilt app bundle, so normal users only see an installed macOS app.

## Required Release Checklist

1. Build arm64 and x64 release zips with stable names.
2. Sign and notarize the app bundle before zipping.
3. Upload release assets to `v<version>` on GitHub.
4. Update `Casks/ultimate-ppt-master.rb` checksums.
5. Copy the cask into `kdnsna/homebrew-ultimate-ppt-master`.
6. Test install on a clean Mac:

```bash
brew install --cask kdnsna/ultimate-ppt-master/ultimate-ppt-master
open -a "终极融合 PPT 大师"
```

## GitHub Homepage Rules

The README should behave like a polished app homepage:

- lead with the one-line Homebrew install;
- explain the product in one sentence before feature depth;
- show update/uninstall next to install;
- keep source install under "Developer mode";
- avoid making users read Tauri, Rust, Python, or npm details before they know
  why they want the app;
- be explicit if a build is unsigned or not notarized.
