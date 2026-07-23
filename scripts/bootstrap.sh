#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
DESKTOP_DIR="$ROOT_DIR/apps/desktop"
USER_CONFIG_DIR="$HOME/.ppt-master"
USER_ENV_FILE="$USER_CONFIG_DIR/.env"
PROFILE="all"
INSTALL_PLAYWRIGHT_BROWSER=0

usage() {
  cat <<'USAGE'
Usage: bash scripts/bootstrap.sh [--profile core|pptx|web|visual-review|desktop|all]

Profiles:
  core           Python venv + requirements core subset notes
  pptx           Python deps for editable PPTX conversion
  web            Web Experience + Bridge npm deps
  visual-review  Python deps + Playwright Chromium
  desktop        Web + desktop npm deps (Rust still separate)
  all            Current full setup (default)
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --profile=*)
      PROFILE="${1#*=}"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

case "$PROFILE" in
  core|pptx|web|visual-review|desktop|all) ;;
  *)
    echo "Unsupported profile: $PROFILE" >&2
    usage >&2
    exit 2
    ;;
esac

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

node_version_ok() {
  node - <<'PY' >/dev/null 2>&1
const major = Number(process.versions.node.split(".")[0]);
const minor = Number(process.versions.node.split(".")[1] || 0);
const ok = (major === 20 && minor >= 19) || major >= 22;
process.exit(ok ? 0 : 1);
PY
}

need_python=0
need_web=0
need_desktop=0
need_visual=0
case "$PROFILE" in
  core|pptx) need_python=1 ;;
  web) need_python=1; need_web=1 ;;
  visual-review) need_python=1; need_visual=1 ;;
  desktop) need_python=1; need_web=1; need_desktop=1 ;;
  all) need_python=1; need_web=1; need_desktop=1; need_visual=1 ;;
esac

info "Root: $ROOT_DIR"
info "Profile: $PROFILE"

if [[ "$need_python" -eq 1 ]]; then
  PYTHON_BIN="$(find_python || true)"
  if [[ -z "$PYTHON_BIN" ]]; then
    die "Python 3.10+ is required. Install Python, then rerun: bash scripts/bootstrap.sh --profile $PROFILE"
  fi

  info "Using Python: $("$PYTHON_BIN" --version 2>&1)"
  if [[ ! -d "$ROOT_DIR/.venv" ]]; then
    info "Creating local Python virtual environment at .venv"
    "$PYTHON_BIN" -m venv "$ROOT_DIR/.venv"
  else
    info "Python virtual environment already exists"
  fi

  info "Installing Python dependencies from requirements.txt"
  "$ROOT_DIR/.venv/bin/python" -m pip install --upgrade pip
  "$ROOT_DIR/.venv/bin/python" -m pip install -r "$ROOT_DIR/requirements.txt"

  if [[ "$need_visual" -eq 1 ]]; then
    info "Ensuring Playwright Python package and Chromium browser"
    "$ROOT_DIR/.venv/bin/python" -m pip install 'playwright>=1.40.0'
    "$ROOT_DIR/.venv/bin/python" -m playwright install chromium
    INSTALL_PLAYWRIGHT_BROWSER=1
  fi
fi

mkdir -p "$USER_CONFIG_DIR"
if [[ -f "$USER_ENV_FILE" ]]; then
  info "Provider config already exists: $USER_ENV_FILE"
else
  info "Creating provider config template: $USER_ENV_FILE"
  cp "$ROOT_DIR/.env.example" "$USER_ENV_FILE"
fi

if [[ "$need_web" -eq 1 || "$need_desktop" -eq 1 ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    die "npm was not found. Install Node.js ^20.19.0 || >=22.12.0, then rerun: bash scripts/bootstrap.sh --profile $PROFILE"
  fi
  if ! command -v node >/dev/null 2>&1; then
    die "Node.js was not found. Install Node.js ^20.19.0 || >=22.12.0, then rerun."
  fi
  if ! node_version_ok; then
    warn "Node $(node --version) may not satisfy engines (^20.19.0 || >=22.12.0). Continue carefully."
  else
    info "Node $(node --version) satisfies engines"
  fi
fi

if [[ "$need_web" -eq 1 ]]; then
  if [[ -f "$WEB_DIR/package.json" ]]; then
    info "Installing Web Experience npm dependencies"
    npm --prefix "$WEB_DIR" install
  fi
fi

if [[ "$need_desktop" -eq 1 ]]; then
  if [[ -f "$DESKTOP_DIR/package.json" ]]; then
    info "Installing desktop npm dependencies"
    npm --prefix "$DESKTOP_DIR" install
  fi
fi

if [[ "$need_desktop" -eq 1 ]]; then
  if ! command -v cargo >/dev/null 2>&1 || ! command -v rustc >/dev/null 2>&1; then
    warn "Rust/Cargo not found. Desktop npm shell can run, but native packaging needs Rust. macOS: brew install rust"
  fi
fi

if command -v pkg-config >/dev/null 2>&1 && ! pkg-config --exists cairo >/dev/null 2>&1; then
  warn "Cairo was not detected. PPTX/SVG compatibility checks may need it. macOS: brew install cairo pkg-config"
fi

info "Setup complete for profile=$PROFILE"
printf "\nNext commands:\n"
printf "  bash scripts/doctor.sh --profile %s\n" "$PROFILE"
if [[ "$need_web" -eq 1 ]]; then
  printf "  npm run bridge   # connect the Web Experience to local Agents\n"
  printf "  npm run dev:web  # run the Web Experience locally\n"
fi
if [[ "$need_desktop" -eq 1 ]]; then
  printf "  npm run desktop  # launch native desktop when Rust is ready; otherwise browser shell\n"
fi
if [[ "$INSTALL_PLAYWRIGHT_BROWSER" -eq 1 ]]; then
  printf "  python3 scripts/visual_review.py <project_path>  # auto-starts temporary preview when needed\n"
fi
