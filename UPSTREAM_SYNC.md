# Upstream Sync Notes

This repository is a fusion package. Do not replace `SKILL.md`, `README.md`,
`INSTALL.md`, `AGENTS.md`, `CLAUDE.md`, or `PROMPT.md` wholesale from either
upstream project; those files are the adaptation layer that makes the package
work across Codex, Claude Code, OpenClaw, Hermes, and generic agent tools.

## Current Baseline

| Upstream | Synced commit | Commit date | Synced areas |
|---|---:|---|---|
| `hugohe3/ppt-master` | `f40fcf5b782ad802cf938722640683be00d9ace4` | 2026-05-20T06:09:04Z | PPTX scripts/references plus latest optional native conversion trace support; fusion entry files kept local |
| `op7418/guizang-ppt-skill` | `6bfa520b86ed5a3dffdac0a3323155e2b6f516b6` | 2026-05-19T22:27:55Z | Swiss Style template/reference update for minimum readable type sizes and light-weight hierarchy |

## Adaptation Policy

- Keep the top-level output chooser: Mode 1 editable PPTX, Mode 2 magazine web deck.
- Keep Style A (`template.html`) as the default magazine/e-ink web deck aesthetic.
- Add Style B (`template-swiss.html`) as an opt-in Swiss Style variant; do not mix Style A and Style B classes in a deck.
- Preserve the local `web_to_md.cjs` fallback even though current `ppt-master` prefers the Python `web_to_md.py` path.
- Keep `--trace-conversion` as an optional diagnostics path; it should not become part of the default export unless a failure or QA investigation needs it.
- Keep Swiss Style minimum font floors aligned with upstream: meta/caption 13px, labels 14px, body 15px, large titles/KPI at light 200-300 weight.
- Prefer syncing upstream implementation assets mechanically, then manually adapting the fusion entry files.
- Run `python3 -m unittest discover -s tests` after every sync to verify the expected upstream capability surface remains wired into the fusion package.

## Future Sync Checklist

1. Clone fresh upstream snapshots to temporary directories.
2. Compare `hugohe3/ppt-master/skills/ppt-master` against this repository.
3. Compare `op7418/guizang-ppt-skill` against `assets/magazine-web/`, `references/magazine-web/`, and `scripts/validate-swiss-deck.mjs`.
4. Sync implementation files without deleting local adaptation-only files.
5. Manually merge `SKILL.md` and docs according to the adaptation policy above.
6. Run unit tests and at least one CLI smoke test.
