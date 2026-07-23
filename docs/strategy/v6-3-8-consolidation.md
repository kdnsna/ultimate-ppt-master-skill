# v6.3.8 Consolidation Direction

> Working note for the consolidation release. This is not yet a GitHub release contract.

## Goal

Keep the guided local delivery product, but stop stacking more natural-language rules. Converge on:

1. one machine-readable policy for agent entries;
2. safer install/import defaults;
3. honest evidence states;
4. quality modes that reserve full audit cost for high-risk decks;
5. lower-friction visual review.

## Landed in this pass

- `contracts/` + `scripts/generate_contracts.py` with CI/check script hooks
- `AGENTS.md` / `CLAUDE.md` / `PROMPT.md` / `SKILL.md` generated policy region aligned to light-first defaults and auto-routing
- source import default guidance and behavior: `--copy` for user files; `--move` advanced
- draft evidence states: `unmapped` / `candidate` / `grounded` / `conflicted` / `missing`
- `doctor` / `bootstrap` profiles: `core`, `pptx`, `web`, `visual-review`, `desktop`, `all`
- Node engine messaging aligned to `^20.19.0 || >=22.12.0`
- `visual_review.py` auto-starts a temporary preview server and uses repo-local paths
- `audit_design_completion.py --mode audit` fails when preview PNGs or design report are missing
- desktop worker sync helper: `scripts/sync_desktop_worker.py`
- quality-mode contracts for `quick` / `standard` / `audit`

## Explicitly deferred to later versions

- `deck-ir-v1` single fact source and `upm make`
- native PowerPoint recipe composer as the default geometry path
- full cost ledger and contact-sheet-first visual review orchestration
- product A/B on extreme-thin default format beyond current fixture-backed web fallback

## Verify

```bash
npm run check:contracts
python3 -m unittest tests.test_contracts_generation tests.test_source_import_default tests.test_evidence_draft_states tests.test_design_completion_audit tests.test_visual_review_contract
node --test tests/best-effect-routing-parity.test.mjs
bash scripts/doctor.sh --profile core
```
