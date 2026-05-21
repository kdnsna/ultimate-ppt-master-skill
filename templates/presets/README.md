# Preset Directions

Preset directions are scenario-level defaults for future content packs. They sit above raw layout templates:

- layout templates answer "what should this page look like?";
- brand presets answer "what identity should it use?";
- chart templates answer "how should this data be shown?";
- preset directions answer "what kind of deck is this, what should the user provide, and what should the Agent verify?"

The seed catalog is [`preset-directions.json`](./preset-directions.json).

## Draft Packs

The first v2.4 draft packs are now usable as Agent handoff starters:

| Preset | Pack | Primary output |
|---|---|---|
| Executive Business Review | [`executive_business_review`](./executive_business_review/) | Editable PPTX + optional Swiss Web Deck |
| Product Pitch | [`product_pitch`](./product_pitch/) | Editorial Web Deck + optional editable PPTX |

Each pack includes:

- `preset.json` - machine-readable preset contract;
- `source.md` - sanitized sample source skeleton;
- `quality-checklist.md` - delivery checks the Agent should pass before final output.

For the roadmap, see [`docs/next-roadmap.md`](../../docs/next-roadmap.md).
