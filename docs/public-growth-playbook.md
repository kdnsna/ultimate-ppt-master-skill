# Public Growth Playbook

Use this checklist when improving GitHub exposure for Ultimate PPT Master.

## GitHub Discovery Surface

- Keep the repository description English-first and keyword-rich.
- Keep the homepage pointed at the GitHub Pages Web Experience.
- Use the full 20-topic budget for high-intent discovery pools:
  `ai-presentation`, `presentation-generator`, `powerpoint-generation`,
  `pptx`, `pptx-generator`, `slides`, `ai-agent`, `claude-code-skill`,
  `html-to-pptx`, `document-conversion`, `markdown`, and related terms.
- Keep Discussions enabled and post product updates there when a release has
  visible demos.
- Maintain a 1280x640 social preview image in `apps/web/public/social-preview.png`
  and `assets/social/social-preview.png`.

## Repository Trust Surface

- Keep `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `SUPPORT.md`
  current.
- Open `good first issue` and `help wanted` items when there is a concrete
  starter task.
- Keep public examples sanitized. Do not commit client documents, source decks,
  API keys, or local logs.

## Pages And Search

- Keep `apps/web/index.html` aligned with the current repo description.
- Keep Open Graph and Twitter card metadata pointed at the deployed social image.
- Keep `robots.txt` and `sitemap.xml` in `apps/web/public/`.
- After Pages deploys, verify:

```bash
curl -I https://kdnsna.github.io/ultimate-ppt-master-skill/social-preview.png
curl -s https://kdnsna.github.io/ultimate-ppt-master-skill/ | rg 'og:title|og:image|twitter:card|application/ld\\+json'
```

## Outreach Targets

Prioritize focused pull requests over drive-by promotion:

- `ishandutta2007/Awesome-Powerpoint-AI-Agents`
- `aspose-slides/Awesome-Presentations`
- `runablehq/Awesome-presentation-tools`

Suggested one-line listing:

> Ultimate PPT Master - Local-first AI presentation hub for Codex/Claude Code; turns PDFs, docs, PPTX, URLs, and notes into agent-ready projects, editable PowerPoint decks, and magazine-style Web Decks.

Include the GitHub Pages demo and v2.4.0 release link when the target list format
allows it.
