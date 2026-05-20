# Model and Provider Setup

Ultimate PPT Master separates three things that many tools mix together:

1. **Agent model**: the model used by Codex, Claude Code, Hermes, OpenClaw, Cursor-style tools, or another local agent.
2. **Provider keys**: optional keys for image generation, image search, narration, and media helpers.
3. **Direct API variables**: reserved convention for a future worker adapter or custom bridge.

## Which One Should I Configure?

| Goal | Configure | Current recommendation |
|---|---|---|
| Best deck quality | Your agent's model/login | Recommended. Let the agent read files, run scripts, preview, and repair. |
| Better visual assets | Provider keys in `~/.ppt-master/.env` | Recommended when using AI images or stock image search. |
| One-shot API integration | `LLM_*` direct variables | Experimental/reserved. Build your own adapter if needed. |
| Ordinary first trial | No model key required for the Web Experience | Start with the static web app; hand off to an agent for production. |
| Desktop preview | No model key required for basic local preview | Use desktop only when you need the advanced local mode. |

## Loading Order

The project checks configuration in this practical order:

1. current process environment variables;
2. repository `.env`;
3. user-level `~/.ppt-master/.env`.

Recommended:

```bash
mkdir -p ~/.ppt-master
cp .env.example ~/.ppt-master/.env
```

Then edit:

```bash
$EDITOR ~/.ppt-master/.env
```

Never commit real keys.

## Agent Model Setup

For Codex, Claude Code, Hermes, OpenClaw, or another agent, configure the model in that agent's own tool first. This repository does not replace the agent's login or provider configuration.

Examples:

- Codex: install/sign in through Codex, then install this repo as a skill.
- Claude Code: configure Claude Code account/model/settings, then point it at `CLAUDE.md` or `SKILL.md`.
- Hermes/OpenClaw/generic agents: configure the agent runtime's model provider, then point it at `AGENTS.md` and `SKILL.md`.

## Image Generation

Example OpenAI image setup:

```dotenv
IMAGE_BACKEND=openai
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-image-2
```

Other supported image backends are documented in `.env.example`. Keep only the providers you actually use.

## Image Search

Optional:

```dotenv
PEXELS_API_KEY=your-pexels-key
PIXABAY_API_KEY=your-pixabay-key
```

Without these keys, the agent can still work with user-provided assets, public references, or placeholder-free designed slides.

## Narration and Audio

The default narration path can use local/free tooling where available. Configure cloud voices only when you need higher quality or cloned voices:

```dotenv
ELEVENLABS_API_KEY=your-elevenlabs-api-key
MINIMAX_API_KEY=your-minimax-key
QWEN_API_KEY=your-dashscope-key
```

## Direct API Convention

Reserved variables:

```dotenv
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4.1
```

Important: v2.1.0 does not ship a complete direct API PPT generation engine. These variables are for future worker adapters and custom integrations.

## Check Configuration

```bash
npm run doctor
```

The doctor command should show whether keys exist without printing secret values.
