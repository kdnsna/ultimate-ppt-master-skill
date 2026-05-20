#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_DIR="$ROOT_DIR/apps/desktop"
CRITICAL_FAILURES=0
WARNINGS=0

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

printf "Ultimate PPT Master Desktop doctor\n"
printf "Root: %s\n\n" "$ROOT_DIR"

PYTHON_BIN="$(find_python || true)"
if [[ -n "$PYTHON_BIN" ]]; then
  ok "Python 3.10+: $("$PYTHON_BIN" --version 2>&1)"
else
  missing "Python 3.10+ is required for the worker and agent workflow"
fi

if [[ -x "$ROOT_DIR/.venv/bin/python" ]]; then
  ok "Local .venv exists"
  if loadable_python_module "$ROOT_DIR/.venv/bin/python" pptx; then
    ok "python-pptx is importable in .venv"
  else
    warn "python-pptx is not importable in .venv. Run: npm run setup"
  fi
else
  warn "Local .venv is missing. Run: npm run setup"
fi

if has_cmd node; then
  ok "Node: $(node --version)"
else
  missing "Node.js 18+ is required for the desktop UI"
fi

if has_cmd npm; then
  ok "npm: $(npm --version)"
else
  missing "npm is required for desktop scripts"
fi

if [[ -f "$DESKTOP_DIR/package.json" ]]; then
  ok "Desktop package found"
else
  missing "Desktop package is missing at apps/desktop/package.json"
fi

if [[ -d "$DESKTOP_DIR/node_modules" ]]; then
  ok "Desktop npm dependencies installed"
else
  warn "Desktop npm dependencies are missing. Run: npm run setup"
fi

if has_cmd rustc && has_cmd cargo; then
  ok "Rust/Cargo: $(rustc --version 2>/dev/null), $(cargo --version 2>/dev/null)"
else
  warn "Rust/Cargo not found. Browser preview works; native Tauri packaging needs Rust"
fi

if has_cmd pkg-config && pkg-config --exists cairo >/dev/null 2>&1; then
  ok "Cairo detected through pkg-config"
else
  warn "Cairo not detected. Install cairo pkg-config for stronger SVG/PPTX compatibility"
fi

ENV_FILE="$(find_env_file || true)"
if [[ -n "$ENV_FILE" ]]; then
  ok "Provider config file detected: $ENV_FILE"
else
  warn "No provider .env file found. Run: npm run setup, then edit ~/.ppt-master/.env"
fi

if env_has_key OPENAI_API_KEY "$ENV_FILE"; then
  ok "OpenAI provider key configured"
else
  warn "OpenAI provider key not configured"
fi

if env_has_key GEMINI_API_KEY "$ENV_FILE"; then
  ok "Gemini provider key configured"
else
  warn "Gemini provider key not configured"
fi

if env_has_key QWEN_API_KEY "$ENV_FILE" || env_has_key DASHSCOPE_API_KEY "$ENV_FILE"; then
  ok "Qwen/DashScope provider key configured"
else
  warn "Qwen/DashScope provider key not configured"
fi

if env_has_key PEXELS_API_KEY "$ENV_FILE" || env_has_key PIXABAY_API_KEY "$ENV_FILE"; then
  ok "Image search provider configured"
else
  warn "Image search provider not configured"
fi

if env_has_key LLM_PROVIDER "$ENV_FILE" && env_has_key LLM_MODEL "$ENV_FILE" && {
  env_has_key LLM_API_KEY "$ENV_FILE" || env_has_key OPENAI_API_KEY "$ENV_FILE" || env_has_key GEMINI_API_KEY "$ENV_FILE" || env_has_key QWEN_API_KEY "$ENV_FILE" || env_has_key DASHSCOPE_API_KEY "$ENV_FILE"
}; then
  ok "Reserved direct LLM adapter config is present"
else
  warn "Reserved direct LLM adapter config is incomplete. Agent-driven generation is still the recommended path"
fi

printf "\nSummary: %s critical issue(s), %s warning(s)\n" "$CRITICAL_FAILURES" "$WARNINGS"
if [[ "$CRITICAL_FAILURES" -gt 0 ]]; then
  printf "Fix critical issues, then rerun: npm run doctor\n"
  exit 1
fi

printf "Environment is usable. Warnings identify optional or provider-specific setup.\n"
