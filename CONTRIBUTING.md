# Contributing

Thanks for helping improve Ultimate PPT Master. This project is a local-first AI presentation workflow, so contributions are most useful when they make the handoff clearer, the output better, or the setup easier to trust.

## Good First Contributions

- Improve docs, screenshots, social preview copy, or setup wording.
- Add sanitized starter-pack examples under `examples/`.
- Improve preset quality checks under `templates/presets/`.
- Add tests around Bridge, Web Experience, or preset-pack contracts.

## Before You Open A Pull Request

Run the checks that match your change:

```bash
npm run audit:presets
npm run test:node
npm run test:worker
npm run build:web
git diff --check
```

For desktop or packaging changes, also run:

```bash
npm run build:desktop
```

## Privacy Rules

Do not commit private source decks, client documents, API keys, internal paths, or production logs. Use sanitized Markdown, redacted screenshots, and the public demo format instead.

## Pull Request Shape

Please include:

- what user problem the change improves;
- screenshots or demo links for visible changes;
- commands you ran;
- any known limits or follow-up work.

Small, focused pull requests are easiest to review.
