# Web Experience

The Web Experience is the primary public entry point for Ultimate PPT Master. It is a static React/Vite **Deck Brief Studio** deployed to GitHub Pages, and it now acts as the fusion front door for the PPTX and Web Deck routes.

```text
https://kdnsna.github.io/ultimate-ppt-master-skill/
```

## What It Does

- lets users choose source type, scenario, output mode, visual style, language, agent tool, and model preference;
- accepts pasted source notes or rough material;
- generates a slide outline and brief-readiness check;
- shows the Hugo He / ppt-master PPTX route and the op7418 / Guizang Web Deck route side by side;
- generates a browser-local `preview-web-deck.html` and live iframe preview;
- generates copy-ready Agent instructions and `source.md`;
- downloads `source.md` or a full `handoff-kit.zip`;
- includes `source.md`, `agent-prompt.md`, `project-brief.json`, `preview-web-deck.html`, `engine-plan.md`, `quality-checklist.md`, and `README.md` in the handoff kit;
- opens a sanitized Web Deck demo;
- keeps Skill installation visible as a second core path.

## What It Does Not Do

- no backend;
- no hosted model API;
- no account system;
- no source-material upload or server storage;
- no analytics requirement for MVP.

Brief assembly is handled in the browser. Users keep private material local and provide the downloaded handoff kit directly to their chosen agent.

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
| Open Web Experience | The studio, source inputs, outline, readiness check, preview tabs, and CTA buttons render. |
| Live Web Deck preview | The preview frame renders `preview-web-deck.html` without backend calls or script dependencies. |
| Copy Agent prompt | Clipboard receives the generated prompt with outline and kit context. |
| Copy `source.md` | Clipboard receives the generated source markdown. |
| Download `source.md` | Browser downloads a Markdown brief with current form values and outline. |
| Download `preview-web-deck.html` | Browser downloads a standalone HTML preview with the current brief and storyboard. |
| Download `handoff-kit.zip` | Browser downloads a zip containing `source.md`, `agent-prompt.md`, `project-brief.json`, `preview-web-deck.html`, `engine-plan.md`, `quality-checklist.md`, and `README.md`. |
| Open Web Deck demo | `examples/desktop-cultural-tourism-demo/web-demo.html` opens from the static build. |
| Skill setup link | Opens the README Skill section or `docs/agent-setup.md`. |
| Mobile viewport | CTA buttons wrap cleanly and the Skill route remains visible. |

## Scenario Coverage

The current MVP should keep these brief-generation cases working:

- Chinese executive report PPTX;
- English pitch Web Deck;
- consulting proposal Skill workflow;
- training courseware Skill workflow.

The page should also keep both engine paths visible. The web route is for onboarding, preview, and handoff; the Skill route remains the production path for final quality, source parsing, rendering, repair, and export.

## Implementation Notes

- App source: [apps/web](../apps/web)
- Pages workflow: [.github/workflows/pages.yml](../.github/workflows/pages.yml)
- Shared public demo source: [examples/desktop-cultural-tourism-demo](../examples/desktop-cultural-tourism-demo)
