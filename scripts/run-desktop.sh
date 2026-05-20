#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_DIR="$ROOT_DIR/apps/desktop"

info() {
  printf "\033[1;34m[desktop]\033[0m %s\n" "$1"
}

warn() {
  printf "\033[1;33m[warn]\033[0m %s\n" "$1"
}

die() {
  printf "\033[1;31m[error]\033[0m %s\n" "$1" >&2
  exit 1
}

command -v npm >/dev/null 2>&1 || die "npm was not found. Install Node.js 18+, then run: npm run setup"

if [[ ! -d "$DESKTOP_DIR/node_modules" ]]; then
  info "Desktop dependencies are missing; installing now"
  npm --prefix "$DESKTOP_DIR" install
fi

if [[ ! -x "$ROOT_DIR/.venv/bin/python" ]]; then
  warn "Python .venv is missing. Native worker generation needs: npm run setup"
fi

cd "$DESKTOP_DIR"

if command -v cargo >/dev/null 2>&1 && command -v rustc >/dev/null 2>&1; then
  info "Launching native Tauri desktop app"
  exec npm run tauri:dev -- "$@"
fi

warn "Rust/Cargo was not found. Launching browser UI shell only."
warn "Browser UI shell cannot run the Python worker or write PPTX/HTML outputs."
warn "Install Rust/Cargo and run npm run desktop again for real local generation."
info "Launching browser UI shell at http://127.0.0.1:5173"
exec npm run dev -- "$@"
