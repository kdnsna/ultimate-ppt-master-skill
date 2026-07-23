# Machine-readable contracts

These files are the source of truth for cross-entry workflow policy.

## Layout

```text
contracts/
├── workflow-policy.yaml      # routing, import, evidence, quality defaults
├── route-policy.yaml         # classifier routes + semantic assertions
├── visual-defaults.yaml      # cover/surface/typography defaults
├── quality-modes/
│   ├── quick.yaml
│   ├── standard.yaml
│   └── audit.yaml
├── schemas/
└── generated/                # derived JSON/Markdown fragments
```

## Generate

```bash
python3 scripts/generate_contracts.py
python3 scripts/generate_contracts.py --check
# or
npm run generate:contracts
npm run check:contracts
```

Generated consumers:

- `AGENTS.md`, `CLAUDE.md`, `PROMPT.md`, and the generated region in `SKILL.md`
- `packages/workspace-core/src/generated/policy.ts`
- `scripts/generated/policy.py`
- `contracts/generated/*.json`

Do not hand-edit generated regions. Change the YAML contracts, then regenerate.
