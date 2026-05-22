# GitHub Technology Scan - May 2026

Snapshot date: 2026-05-22. The star counts below came from the GitHub repository API during release preparation, so treat them as directional evidence rather than permanent facts.

## What Is Moving

| Area | Repository signal | Why it matters to Ultimate PPT Master | Product response |
|---|---:|---|---|
| Source-to-Markdown | [microsoft/markitdown](https://github.com/microsoft/markitdown) - about 124k stars | Agent workflows are standardizing around Markdown as the interchange format for PDF, Office, web, and media sources. | Keep `source.md`, `extracted-source.md`, and local converters as the handoff spine. Add converter adapters only when they preserve local-first behavior. |
| Agent tool interoperability | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) - about 86k stars | MCP-style tool/resource discovery is becoming a common way for agents to reuse local capabilities. | Keep `AGENTS.md`, `agents/openai.yaml`, Bridge `/health`, and fixed skill install targets clean. Consider an MCP server wrapper after the current Bridge contract is stable. |
| Slides-as-code | [slidevjs/slidev](https://github.com/slidevjs/slidev) - about 46k stars; [marp-team/marp](https://github.com/marp-team/marp) - about 12k stars | Developers like Markdown-first decks because they are reviewable, versionable, and easy to reuse. | Preserve `source.md`, `engine-plan.md`, and preset packs as text artifacts. Future export/import work should treat Markdown as a first-class deck intermediate. |
| Editable PPTX generation | [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS) - about 5.4k stars | JavaScript PPTX generation remains important for browser and Node ecosystems. | Keep editable PPTX as a core output promise, but do not replace the current SVG-to-PPTX quality route without regression tests for editability. |
| DOM-to-PPTX | [atharva9167j/dom-to-pptx](https://github.com/atharva9167j/dom-to-pptx) - about 188 stars | The newer HTML/DOM-to-editable-PPTX direction could eventually bridge Web Deck previews and PowerPoint exports. | Track as an experiment for Web Deck-to-PPTX fallback. Require tests for gradients, text editability, images, and layout fidelity before promotion. |
| Open AI presentation products | [presenton/presenton](https://github.com/presenton/presenton) - about 5.7k stars | Users expect AI presentation generators to have a visible UI and API-style automation, not only a prompt. | Position Ultimate PPT Master as local-first: Web Experience for first mile, Bridge for local staging, Skill for production QA. Do not claim hosted generation until a worker adapter and tests exist. |

## Design Bets For v2.4

1. **Preset packs become the reusable unit.** A user should be able to pick a scenario, get a source skeleton, handoff prompt, template candidates, and quality checklist without learning the whole pipeline.
2. **Markdown remains the interchange layer.** Even when the source is PDF, DOCX, XLSX, PPTX, or URL, the agent-facing contract should stay inspectable as Markdown plus original attachments.
3. **Bridge stays local and small.** GitHub trends point toward tool interoperability, but the current product should keep Bridge understandable: localhost health, source staging, provider readiness, and safe skill install.
4. **Web preview is not the final engine.** Web Deck preview helps users understand the outcome, while final PPTX/HTML quality still comes from the Skill workflow and local checks.
5. **Every new public claim needs a release gate.** If a feature appears in README, Web Experience, or preset catalog, it needs either a test, an audit script, or a visible sample artifact.

## Backlog Decisions

| Candidate | Decision | Gate before promotion |
|---|---|---|
| MarkItDown adapter | Track | Local dependency strategy, converter fallback tests, privacy review. |
| MCP server wrapper | Track | Stable Bridge API surface, tool schema, local install story, smoke tests with at least one MCP-capable agent. |
| Markdown deck import/export | Track | Round-trip contract for source skeletons, page roster, speaker notes, and route metadata. |
| DOM-to-PPTX export from Web Deck | Experiment only | Editability tests for text/shapes/images, mobile/desktop layout parity, and PowerPoint compatibility. |
| Hosted API deck generation | Defer | Worker adapter, provider-key isolation, queue/log model, and public security story. |

