# Desktop Demo: Sanitized Cultural Tourism Brief

This demo shows the kind of real-office material Ultimate PPT Master Desktop can handle without publishing private source files.

The original validation used a local DOCX file supplied by the repository owner. That raw file and its raw generated PPTX/Web outputs are intentionally not committed. This folder contains a sanitized example with generalized organization names, locations, budget wording, and approval details.

## What This Demonstrates

- DOCX-style meeting material can be converted into `source.md`.
- The desktop worker can generate both an editable PPTX preview and a Web Deck preview from the same source.
- The public repository can show a real workflow pattern without exposing sensitive content.

## Local Reproduction

```bash
npm run setup
npm run desktop
```

In the desktop app:

1. Choose `Markdown`.
2. Paste `source.sanitized.md`.
3. Generate `Editable PPTX` with `Business Report`.
4. Generate `Magazine Web Deck` with `Editorial`.

For agent users, use this prompt:

```text
Read examples/desktop-cultural-tourism-demo/source.sanitized.md and follow the ultimate-ppt-master workflow.
Create both an editable PPTX meeting brief and a Web Deck showcase.
```

## Included Files

- `source.sanitized.md`: sanitized meeting material.
- `web-demo.html`: static sanitized Web Deck example.
- `cover.svg`: sanitized cover preview.
