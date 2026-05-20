#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_DIR="$ROOT_DIR/apps/desktop"
USER_CONFIG_DIR="$HOME/.ppt-master"
USER_ENV_FILE="$USER_CONFIG_DIR/.env"

info() {
  printf "\033[1;34m[setup]\033[0m %s\n" "$1"
}

warn() {
  printf "\033[1;33m[warn]\033[0m %s\n" "$1"
}

die() {
  printf "\033[1;31m[error]\033[0m %s\n" "$1" >&2
  exit 1
}

python_is_supported() {
  local candidate="$1"
  "$candidate" - <<'PY' >/dev/null 2>&1
import sys
raise SystemExit(0 if sys.version_info >= (3, 10) else 1)
PY
}

find_python() {
  local candidate
  for candidate in python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$candidate" >/dev/null 2>&1 && python_is_supported "$candidate"; then
      command -v "$candidate"
      return 0
    fi
  done
  return 1
}

info "Root: $ROOT_DIR"

PYTHON_BIN="$(find_python || true)"
if [[ -z "$PYTHON_BIN" ]]; then
  die "Python 3.10+ is required. Install Python, then rerun: npm run setup"
fi

info "Using Python: $("$PYTHON_BIN" --version 2>&1)"
if [[ ! -d "$ROOT_DIR/.venv" ]]; then
  info "Creating local Python virtual environment at .venv"
  "$PYTHON_BIN" -m venv "$ROOT_DIR/.venv"
else
  info "Python virtual environment already exists"
fi

info "Installing Python dependencies"
"$ROOT_DIR/.venv/bin/python" -m pip install --upgrade pip
"$ROOT_DIR/.venv/bin/python" -m pip install -r "$ROOT_DIR/requirements.txt"

mkdir -p "$USER_CONFIG_DIR"
if [[ -f "$USER_ENV_FILE" ]]; then
  info "Provider config already exists: $USER_ENV_FILE"
else
  info "Creating provider config template: $USER_ENV_FILE"
  cp "$ROOT_DIR/.env.example" "$USER_ENV_FILE"
fi

if command -v npm >/dev/null 2>&1; then
  info "Installing desktop npm dependencies"
  npm --prefix "$DESKTOP_DIR" install
else
  warn "npm was not found. Install Node.js 18+ to use the desktop UI, then rerun: npm run setup"
fi

if ! command -v cargo >/dev/null 2>&1 || ! command -v rustc >/dev/null 2>&1; then
  warn "Rust/Cargo not found. Browser preview still works; native Tauri packaging needs Rust. macOS: brew install rust"
fi

if ! pkg-config --exists cairo >/dev/null 2>&1; then
  warn "Cairo was not detected. PPTX/SVG compatibility checks may need it. macOS: brew install cairo pkg-config"
fi

info "Setup complete"
printf "\nNext commands:\n"
printf "  npm run doctor   # check local environment\n"
printf "  npm run desktop  # launch the desktop web shell\n"
printf "  npm run app:desktop  # launch native Tauri mode when Rust is ready\n"
