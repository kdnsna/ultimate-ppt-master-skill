#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
DESKTOP_DIR="$ROOT_DIR/apps/desktop"
CRITICAL_FAILURES=0
WARNINGS=0
PROFILE="all"

usage() {
  cat <<'USAGE'
Usage: bash scripts/doctor.sh [--profile core|pptx|web|visual-review|desktop|all]

Profiles:
  core           Python + skill scripts only
  pptx           core + python-pptx / Office conversion deps
  web            Node tooling for Web Experience / Bridge
  visual-review  Playwright / Chromium / preview rendering
  desktop        Desktop app packaging dependencies
  all            Everything (default)
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

need_core=0
need_pptx=0
need_web=0
need_visual=0
need_desktop=0
case "$PROFILE" in
  core) need_core=1 ;;
  pptx) need_core=1; need_pptx=1 ;;
  web) need_core=1; need_web=1 ;;
  visual-review) need_core=1; need_visual=1 ;;
  desktop) need_core=1; need_web=1; need_desktop=1 ;;
  all) need_core=1; need_pptx=1; need_web=1; need_visual=1; need_desktop=1 ;;
esac

ok() {
  printf "\033[1;32m[ok]\033[0m %s\n" "$1"
}

warn() {
  WARNINGS=$((WARNINGS + 1))
  printf "\033[1;33m[warn]\033[0m %s\n" "$1"
}

missing() {
  CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
  printf "\033[1;31m[missing]\033[0m %s\n" "$1"
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

python_supported() {
  "$1" - <<'PY' >/dev/null 2>&1
import sys
raise SystemExit(0 if sys.version_info >= (3, 10) else 1)
PY
}

find_python() {
  local candidate
  for candidate in python3.13 python3.12 python3.11 python3.10 python3; do
    if has_cmd "$candidate" && python_supported "$candidate"; then
      command -v "$candidate"
      return 0
    fi
  done
  return 1
}

loadable_python_module() {
  local python_bin="$1"
  local module="$2"
  "$python_bin" - "$module" <<'PY' >/dev/null 2>&1
import importlib.util
import sys
raise SystemExit(0 if importlib.util.find_spec(sys.argv[1]) else 1)
PY
}

node_version_ok() {
  node - <<'PY' >/dev/null 2>&1
const major = Number(process.versions.node.split(".")[0]);
const minor = Number(process.versions.node.split(".")[1] || 0);
const ok = (major === 20 && minor >= 19) || major >= 22;
process.exit(ok ? 0 : 1);
PY
}

find_env_file() {
  local candidate
  for candidate in "$ROOT_DIR/.env" "$HOME/.ppt-master/.env"; do
    if [[ -f "$candidate" ]]; then
      printf "%s\n" "$candidate"
      return 0
    fi
  done
  return 1
}

env_has_key() {
  local key="$1"
  local env_file="${2:-}"
  if [[ -n "${!key:-}" ]]; then
    return 0
  fi
  if [[ -n "$env_file" ]]; then
    grep -Eq "^[[:space:]]*${key}[[:space:]]*=[[:space:]]*[^[:space:]#]+" "$env_file"
    return $?
  fi
  return 1
}

printf "Ultimate PPT Master doctor\n"
printf "Root: %s\n" "$ROOT_DIR"
printf "Profile: %s\n\n" "$PROFILE"

PYTHON_BIN="$(find_python || true)"
if [[ -n "$PYTHON_BIN" ]]; then
  ok "Python 3.10+: $("$PYTHON_BIN" --version 2>&1)"
else
  missing "Python 3.10+ is required for source conversion and agent workflows"
fi

if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
  ok "Local .venv exists"
  VENV_PY="$ROOT_DIR/.venv/bin/python"
else
  warn "Local .venv is missing. Run: npm run setup  or  bash scripts/bootstrap.sh --profile $PROFILE"
  VENV_PY="${PYTHON_BIN:-}"
fi

if [[ "$need_pptx" -eq 1 ]]; then
  if [[ -n "${VENV_PY:-}" ]] && loadable_python_module "$VENV_PY" pptx; then
    ok "python-pptx is importable"
  else
    if [[ "$PROFILE" == "all" ]]; then
      warn "python-pptx is not importable. Run: bash scripts/bootstrap.sh --profile pptx"
    else
      missing "python-pptx is required for profile=$PROFILE. Run: bash scripts/bootstrap.sh --profile pptx"
    fi
  fi
fi

if [[ "$need_visual" -eq 1 ]]; then
  if [[ -n "${VENV_PY:-}" ]] && loadable_python_module "$VENV_PY" playwright; then
    ok "playwright Python package is importable"
  else
    if [[ "$PROFILE" == "all" ]]; then
      warn "playwright is not importable. Run: bash scripts/bootstrap.sh --profile visual-review"
    else
      missing "playwright is required for profile=$PROFILE. Run: bash scripts/bootstrap.sh --profile visual-review"
    fi
  fi
  if [[ -n "${VENV_PY:-}" ]] && loadable_python_module "$VENV_PY" PIL; then
    ok "Pillow is importable"
  else
    warn "Pillow is not importable; blank-page histogram checks will be skipped"
  fi
  if [[ -n "${VENV_PY:-}" ]] && loadable_python_module "$VENV_PY" flask; then
    ok "flask is importable for temporary preview server"
  else
    warn "flask is not importable; visual_review auto-start preview may fail"
  fi
fi

if [[ "$need_web" -eq 1 || "$need_desktop" -eq 1 ]]; then
  if has_cmd node; then
    NODE_VER="$(node --version 2>&1)"
    if node_version_ok; then
      ok "Node: $NODE_VER (matches ^20.19.0 || >=22.12.0)"
    else
      missing "Node $NODE_VER does not satisfy engines (^20.19.0 || >=22.12.0)"
    fi
  else
    missing "Node.js ^20.19.0 || >=22.12.0 is required for profile=$PROFILE"
  fi

  if has_cmd npm; then
    ok "npm: $(npm --version)"
  else
    missing "npm is required for profile=$PROFILE"
  fi

  [[ -f "$WEB_DIR/package.json" ]] && ok "Web package found" || missing "Web package is missing at apps/web/package.json"
  [[ -d "$WEB_DIR/node_modules" ]] && ok "Web npm dependencies installed" || warn "Web npm dependencies are missing. Run: bash scripts/bootstrap.sh --profile web"
  [[ -f "$ROOT_DIR/apps/bridge/server.mjs" ]] && ok "Agent Bridge server found" || missing "Bridge server is missing at apps/bridge/server.mjs"
else
  if has_cmd node; then
    ok "Node present (optional for profile=$PROFILE): $(node --version)"
  else
    warn "Node/npm not installed. That is fine for profile=$PROFILE (Agent/Python-only)."
  fi
fi

if [[ "$need_desktop" -eq 1 ]]; then
  [[ -f "$DESKTOP_DIR/package.json" ]] && ok "Desktop package found" || missing "Desktop package is missing at apps/desktop/package.json"
  [[ -d "$DESKTOP_DIR/node_modules" ]] && ok "Desktop npm dependencies installed" || warn "Desktop npm dependencies are missing. Run: bash scripts/bootstrap.sh --profile desktop"
  if has_cmd rustc && has_cmd cargo; then
    ok "Rust/Cargo: $(rustc --version 2>/dev/null), $(cargo --version 2>/dev/null)"
  else
    missing "Rust/Cargo is required for native desktop packaging (profile=$PROFILE)"
  fi
else
  [[ -f "$DESKTOP_DIR/package.json" ]] && ok "Desktop package found (optional for this profile)" || warn "Desktop package is missing at apps/desktop/package.json"
  if has_cmd rustc && has_cmd cargo; then
    ok "Rust/Cargo available (optional for this profile)"
  else
    warn "Rust/Cargo not found. Web Experience and Bridge work; native Tauri packaging needs Rust"
  fi
fi

if [[ "$need_core" -eq 1 ]]; then
  [[ -f "$ROOT_DIR/SKILL.md" ]] && ok "SKILL.md found" || missing "SKILL.md missing"
  [[ -f "$ROOT_DIR/contracts/workflow-policy.yaml" ]] && ok "workflow-policy contract found" || missing "contracts/workflow-policy.yaml missing"
  if [[ -x "$ROOT_DIR/.venv/bin/python" ]] || [[ -n "${PYTHON_BIN:-}" ]]; then
    PY_CHECK="${VENV_PY:-$PYTHON_BIN}"
    if "$PY_CHECK" "$ROOT_DIR/scripts/generate_contracts.py" --check >/dev/null 2>&1; then
      ok "Generated contracts are in sync"
    else
      warn "Generated contracts are stale or unreadable. Run: python3 scripts/generate_contracts.py"
    fi
  fi
fi

ENV_FILE="$(find_env_file || true)"
if [[ -n "$ENV_FILE" ]]; then
  ok "Provider config file detected: $ENV_FILE"
else
  warn "No provider .env file found. Run: npm run setup, then edit ~/.ppt-master/.env"
fi

if env_has_key OPENAI_API_KEY "$ENV_FILE" || env_has_key LLM_API_KEY "$ENV_FILE"; then
  ok "OpenAI-compatible provider key configured"
else
  warn "OpenAI-compatible provider key not configured"
fi

if env_has_key GEMINI_API_KEY "$ENV_FILE" || env_has_key GOOGLE_API_KEY "$ENV_FILE"; then
  ok "Gemini provider key configured"
else
  warn "Gemini provider key not configured"
fi

if env_has_key QWEN_API_KEY "$ENV_FILE" || env_has_key DASHSCOPE_API_KEY "$ENV_FILE"; then
  ok "Qwen/DashScope provider key configured"
else
  warn "Qwen/DashScope provider key not configured"
fi

if env_has_key DEEPSEEK_API_KEY "$ENV_FILE"; then
  ok "DeepSeek provider key configured"
else
  warn "DeepSeek provider key not configured"
fi

printf "\nSummary: %s critical issue(s), %s warning(s) [profile=%s]\n" "$CRITICAL_FAILURES" "$WARNINGS" "$PROFILE"
if [[ "$CRITICAL_FAILURES" -gt 0 ]]; then
  printf "Fix critical issues, then rerun: bash scripts/doctor.sh --profile %s\n" "$PROFILE"
  exit 1
fi

printf "Environment is usable for profile=%s. Warnings identify optional or provider-specific setup.\n" "$PROFILE"
