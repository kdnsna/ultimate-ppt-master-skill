# Visual Directions

Visual directions are production guardrails, not decorative templates. They tell the Strategist what the deck should feel like before any page is drawn. Read the repository-level [`DESIGN.md`](../../DESIGN.md) first; it defines the shared design language and the anti-patterns every direction must resist.

Use them when a deck has a recognizable delivery context. Each direction locks:

- expected audience and communication mode
- atmosphere and semantic color roles
- typography personality and role-specific font behavior
- composition model, surface rhythm, depth, and shape grammar
- approved components, image behavior, and responsive behavior
- preferred page roles and rhythm
- asset expectations
- anti-patterns that make the deck look generic or unfinished

The executable v6.1 contracts live in [`v6-direction-manifest.json`](v6-direction-manifest.json). The active direction must be recorded in `design_spec.md` and `spec_lock.md`. If no direction fits, the Strategist must record `custom`, state the benchmark in one sentence, and still fill atmosphere, typography personality, composition model, surface rhythm, image behavior, component grammar, and anti-patterns.

Do not derive a new direction by changing only accent colors. Two directions are materially different only when their typography, composition, surface rhythm, image role, and component grammar also differ.
