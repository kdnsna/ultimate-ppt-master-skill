# Homebrew Distribution

This folder documents the lightweight macOS distribution path. The goal is to
make the desktop app install like small polished tools such as CC Switch:

```bash
brew install --cask kdnsna/ultimate-ppt-master/ultimate-ppt-master
```

## Tap Repository

Recommended public tap:

```text
github.com/kdnsna/homebrew-ultimate-ppt-master
```

The tap should contain:

```text
Casks/ultimate-ppt-master.rb
README.md
```

Copy `Casks/ultimate-ppt-master.rb` from this repository into the tap. A tap
named `homebrew-ultimate-ppt-master` lets users choose either style:

```bash
brew install --cask kdnsna/ultimate-ppt-master/ultimate-ppt-master
```

or:

```bash
brew tap kdnsna/ultimate-ppt-master
brew install --cask ultimate-ppt-master
```

## Release Asset Contract

The cask expects GitHub Release assets named:

```text
Ultimate-PPT-Master-2.1.0-macOS-arm64.zip
Ultimate-PPT-Master-2.1.0-macOS-x64.zip
```

Create the current-machine asset with:

```bash
npm run package:desktop:homebrew
```

It writes:

```text
dist/release/Ultimate-PPT-Master-<version>-macOS-<arch>.zip
dist/release/SHA256SUMS.txt
```

Before publishing a public tap, replace `sha256 :no_check` in the cask with the
real architecture-specific checksums from the release artifacts. Keeping
`:no_check` is acceptable for early private taps, but not for a polished public
release.

## Signing And Notarization

For promotion-grade installation, the release zip should contain a signed and
Apple-notarized app. Without notarization, Homebrew can still install the app,
but first launch may show the macOS "unidentified developer" warning. That adds
manual clicks and defeats the point of a lightweight install.

Promotion target:

- one command install;
- Launchpad app icon appears immediately;
- no source checkout;
- no Rust, Node, or Python setup visible to the user;
- update through `brew upgrade --cask ultimate-ppt-master`.
