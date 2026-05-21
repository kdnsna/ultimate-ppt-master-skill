# Upstream Benchmark - May 2026

This benchmark checks whether Ultimate PPT Master is keeping up with the two upstream routes it fuses:

- Hugo He / PPT Master: <https://github.com/hugohe3/ppt-master>
- op7418 / Guizang PPT Skill: <https://github.com/op7418/guizang-ppt-skill>

## Test Material

Shared source topic:

`Local-First Agent Workflows: From Chat Prompts To Production Handoffs`

Local source file:

`/Users/kdnsna/Documents/kdnsna1/upstream-ppt-benchmark/materials/source.md`

## Installed Baselines

| Route | Commit | Local install observation |
|---|---:|---|
| PPT Master | `668131f` | Shallow clone produced a roughly 1.2GB working tree. Python dependency install completed in about 187 seconds on this machine. |
| Guizang PPT Skill | `6bfa520` | Shallow clone produced a roughly 4.8MB working tree. No heavy dependency install was needed for the Swiss HTML validator. |
| Ultimate PPT Master | local v2.3.0 | Bridge generated a local handoff project from the same source material. |

## Outputs Generated

| Route | Output | Check |
|---|---|---|
| PPT Master | `outputs/ppt-master-local-first-agent-workflows/exports/*.pptx` | `svg_quality_checker.py` passed 6/6 SVG pages; `svg_to_pptx.py` exported native editable PPTX successfully. |
| Guizang PPT Skill | `outputs/guizang-swiss-local-first-agent-workflows/index.html` | `validate-swiss-deck.mjs` passed 7 slides. |
| Ultimate PPT Master Bridge | `~/UltimatePPTMaster/handoffs/Local-First-Agent-Workflows-Benchmark-*` | Created `source.md`, `extracted-source.md`, `attachments/`, `manifest.json`, `agent-prompt.md`, `engine-plan.md`, `quality-checklist.md`, and `preview-web-deck.html`. |

## What The Test Showed

1. **Direct Skill install is already strong for experts.** Guizang is extremely light; PPT Master is heavy but powerful.
2. **The fused product should not compete on shortest command.** `npx skills add ...` or a direct Codex install prompt will always be shorter for users who already know what they want.
3. **Ultimate PPT Master wins on first-mile clarity.** It helps users choose route, package files, detect local readiness, and hand the job to an Agent with a manifest and checklist.
4. **Quality ceiling depends on preserving upstream rules.** If the fusion layer weakens PPT Master's strict SVG/PPTX pipeline or Guizang's locked Swiss rules, output will get worse.

## Changes Made After This Benchmark

- Synced latest PPT Master production assets into the fusion package, including brand presets, visual review workflow, updated SVG/PPTX scripts, and revised references.
- Synced latest Guizang Swiss assets, validator rules, and screenshot background assets.
- Added product positioning documentation explaining why the hub exists beside direct Skill install.
- Added a Web Experience value section that directly answers "why not just install a Skill?"
- Updated `SKILL.md` and `AGENTS.md` so agents see Web Experience / Bridge as first-mile handoff and Skill as the production route.

## Product Conclusion

Ultimate PPT Master should say:

> Direct Skill install is the fastest expert path. Ultimate PPT Master is the guided handoff hub that makes that expert path understandable, local, and repeatable for more users.

That is the durable advantage.
