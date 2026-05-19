# Upstream Sync Notes

This repository is a fusion package. Do not replace `SKILL.md`, `README.md`,
`INSTALL.md`, `AGENTS.md`, `CLAUDE.md`, or `PROMPT.md` wholesale from either
upstream project; those files are the adaptation layer that makes the package
work across Codex, Claude Code, OpenClaw, Hermes, and generic agent tools.

## Current Baseline

| Upstream | Synced commit | Commit date | Synced areas |
|---|---:|---|---|
| `hugohe3/ppt-master` | `bd970c05d8fc7df0ffcf09c680621d46dea778a3` | 2026-05-19T02:56:59Z | PPTX scripts, references, templates, workflows, requirements |
| `op7418/guizang-ppt-skill` | `3d87acc6cc53d3c1573e33d5073c1ec5a5a99196` | 2026-05-16T10:37:37+08:00 | Magazine web assets, Swiss Style template/references, screenshot backgrounds, validator |

## Adaptation Policy

- Keep the top-level output chooser: Mode 1 editable PPTX, Mode 2 magazine web deck.
- Keep Style A (`template.html`) as the default magazine/e-ink web deck aesthetic.
- Add Style B (`template-swiss.html`) as an opt-in Swiss Style variant; do not mix Style A and Style B classes in a deck.
- Preserve the local `web_to_md.cjs` fallback even though current `ppt-master` prefers the Python `web_to_md.py` path.
- Prefer syncing upstream implementation assets mechanically, then manually adapting the fusion entry files.
- Run `python3 -m unittest discover -s tests` after every sync to verify the expected upstream capability surface remains wired into the fusion package.

## Future Sync Checklist

1. Clone fresh upstream snapshots to temporary directories.
2. Compare `hugohe3/ppt-master/skills/ppt-master` against this repository.
3. Compare `op7418/guizang-ppt-skill` against `assets/magazine-web/`, `references/magazine-web/`, and `scripts/validate-swiss-deck.mjs`.
4. Sync implementation files without deleting local adaptation-only files.
5. Manually merge `SKILL.md` and docs according to the adaptation policy above.
6. Run unit tests and at least one CLI smoke test.
