# Web Experience

The Web Experience is the primary public entry point for Ultimate PPT Master. It is a static React/Vite app deployed to GitHub Pages.

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## What It Does

- lets users choose source type, scenario, output mode, visual style, language, agent tool, and model preference;
- generates a copy-ready Agent handoff prompt in real time;
- downloads a local `source.md` starter template;
- opens a sanitized Web Deck demo;
- keeps Skill installation visible as a second core path.

## What It Does Not Do

- no backend;
- no hosted model API;
- no account system;
- no source-material upload or storage;
- no analytics requirement for MVP.

Prompt generation is handled in the browser. Users keep private material local and provide it directly to their chosen agent.

## Local Development

```bash
npm --prefix apps/web install
npm run dev:web
```

Build:

```bash
npm run build:web
```

GitHub Pages build:

```bash
GITHUB_PAGES=true npm run build:web
```

The `GITHUB_PAGES=true` flag sets the asset base path to `/ultimate-ppt-master-skill/`.

## Smoke Checks

Use these checks before promoting a release:

| Check | Expected result |
|---|---|
| Open Web Experience | The form, prompt preview, demo image, and CTA buttons render. |
| Copy Agent prompt | Clipboard receives the generated prompt for the selected scenario. |
| Download `source.md` | Browser downloads a Markdown template with current form values. |
| Open Web Deck demo | `examples/desktop-cultural-tourism-demo/web-demo.html` opens from the static build. |
| Skill setup link | Opens the README Skill section or `docs/agent-setup.md`. |
| Mobile viewport | CTA buttons wrap cleanly and the Skill route remains visible. |

## Scenario Coverage

The current MVP should keep these prompt-generation cases working:

- Chinese executive report PPTX;
- English pitch Web Deck;
- consulting proposal Skill workflow;
- training courseware Skill workflow.

## Implementation Notes

- App source: [apps/web](../apps/web)
- Pages workflow: [.github/workflows/pages.yml](../.github/workflows/pages.yml)
- Shared public demo source: [examples/desktop-cultural-tourism-demo](../examples/desktop-cultural-tourism-demo)
