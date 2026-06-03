# Product Positioning

Ultimate PPT Master should not compete with "Codex, install this skill" on raw shortcut length. For expert users, a direct skill install is already excellent. This product wins when it turns that expert workflow into a friendlier, safer, more repeatable first-mile experience.

## Why Not Just Install A Skill Directly?

Direct Skill install is best when the user already knows:

- which route they need: editable PPTX or HTML Web Deck;
- where to put source files;
- how to describe audience, scenario, style, model, and output constraints;
- which provider keys are configured locally;
- which checks should run before delivery.

Most potential users do not know all of that in the first minute. If they ask Codex one vague sentence, the Agent may still succeed, but it has to infer too much.

Ultimate PPT Master adds value before the Agent begins:

- **Decision reduction**: the web page turns ambiguous intent into structured choices.
- **Local source staging**: Bridge packages real files into a handoff folder instead of leaving attachments scattered in chat.
- **Route clarity**: PPTX, Web Deck, and combined workflows become explicit.
- **Provider visibility**: users can see whether local model/API configuration is ready without exposing keys.
- **Quality contract**: the handoff includes an engine plan and checklist, so the Agent knows how to verify output.
- **Upstream ceiling preservation**: final production still uses the strong PPT Master and Guizang-style workflows rather than a weaker web-only generator.

## Product Rule

The web layer should never pretend to be the full production engine. Its job is to make the first mile obvious and safe. The Skill remains the quality ceiling.

## What To Optimize

| User friction | Product response |
|---|---|
| "I don't know which format I need." | Show PPTX vs Web Deck tradeoffs before generating. |
| "I have files, not a clean prompt." | Accept files, URLs, and pasted text; package all of them. |
| "I don't know if my local setup works." | Detect Bridge, Agent binaries, provider readiness, and launch mode. |
| "I don't trust a black-box generator." | Keep everything local, expose manifest/checklist, and preserve original attachments. |
| "I can already install skills." | Let expert users skip the web path and use the Skill directly. |

## Upstream Quality Baseline

The fusion package should match upstream quality by preserving their strongest constraints:

- PPTX route: native editable PPTX, strict SVG authoring, project manager, visual review, template/brand presets, SVG validation, export checks.
- Web Deck route: single-file HTML, Style A editorial/e-ink, Style B Swiss locked layouts, minimum font rules, image slot rules, and Swiss validator.
- Fusion route: only adds intake, route planning, local Bridge, handoff packaging, and cross-Agent instructions. It should not weaken either upstream route.

## Benchmark Notes

The local benchmark in May 2026 used the same source material for:

- Hugo He `ppt-master` at commit `668131f`: shallow clone size about 1.2GB; dependency install about 187 seconds on this machine; generated 6 validated SVG slides and exported editable PPTX successfully.
- op7418 `guizang-ppt-skill` at commit `6bfa520`: shallow clone size about 4.8MB; generated 7-slide Swiss HTML; Swiss validator passed.
- Ultimate PPT Master Bridge: created a local handoff project with `source.md`, `extracted-source.md`, `attachments/`, `manifest.json`, `agent-prompt.md`, `engine-plan.md`, and `quality-checklist.md`.

Conclusion: the fused product should not claim to beat the original engines at their own narrow jobs. It should make them easier to choose, prepare, and run together.
