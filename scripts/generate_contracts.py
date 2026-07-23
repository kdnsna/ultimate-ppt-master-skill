#!/usr/bin/env python3
"""Generate agent-entry fragments and runtime policy artifacts from contracts/.

Source of truth:
  contracts/workflow-policy.yaml
  contracts/route-policy.yaml
  contracts/visual-defaults.yaml
  contracts/quality-modes/*.yaml

Generated outputs are checked into the repo and must stay in sync via:
  python3 scripts/generate_contracts.py --check
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "contracts"
GENERATED_DIR = CONTRACTS / "generated"
TS_OUT = ROOT / "packages" / "workspace-core" / "src" / "generated" / "policy.ts"
PY_OUT = ROOT / "scripts" / "generated" / "policy.py"
ROUTE_JSON = GENERATED_DIR / "route-policy.json"
WORKFLOW_JSON = GENERATED_DIR / "workflow-policy.json"
QUALITY_JSON = GENERATED_DIR / "quality-modes.json"
FRAGMENT_DIR = GENERATED_DIR / "fragments"

BEGIN = "<!-- BEGIN GENERATED:workflow-policy -->"
END = "<!-- END GENERATED:workflow-policy -->"
BEGIN_PROMPT = "/* BEGIN GENERATED:workflow-policy */"
END_PROMPT = "/* END GENERATED:workflow-policy */"


def _strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def parse_simple_yaml(text: str) -> Any:
    """Minimal YAML subset parser for this repo's contract files."""

    lines = []
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        content = raw.strip()
        lines.append((indent, content))

    def coerce(value: str) -> Any:
        value = _strip_quotes(value)
        lower = value.lower()
        if lower == "true":
            return True
        if lower == "false":
            return False
        if lower in {"null", "~"}:
            return None
        if re.fullmatch(r"-?\d+", value):
            return int(value)
        if re.fullmatch(r"-?\d+\.\d+", value):
            return float(value)
        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            if not inner:
                return []
            return [coerce(part.strip()) for part in inner.split(",")]
        return value

    def parse_block(index: int, indent: int) -> tuple[Any, int]:
        if index >= len(lines):
            return {}, index
        _, content = lines[index]
        if content.startswith("- "):
            items: list[Any] = []
            while index < len(lines):
                item_indent, item = lines[index]
                if item_indent < indent or not item.startswith("- "):
                    break
                if item_indent > indent:
                    raise ValueError(f"invalid list indent near: {item}")
                value = item[2:].strip()
                if value == "":
                    child, index = parse_block(index + 1, item_indent + 2)
                    items.append(child)
                    continue
                if ":" in value and not value.startswith("http") and not re.match(r"^\d+:\d+", value):
                    key, rest = value.split(":", 1)
                    key = key.strip()
                    rest = rest.strip()
                    if rest == "":
                        child, index = parse_block(index + 1, item_indent + 2)
                        items.append({key: child})
                    else:
                        mapping: dict[str, Any] = {key: coerce(rest)}
                        index += 1
                        while index < len(lines):
                            next_indent, next_item = lines[index]
                            if next_indent <= item_indent:
                                break
                            if next_item.startswith("- "):
                                break
                            if ":" not in next_item:
                                raise ValueError(f"invalid mapping entry: {next_item}")
                            nk, nv = next_item.split(":", 1)
                            nk = nk.strip()
                            nv = nv.strip()
                            if nv == "":
                                child, index = parse_block(index + 1, next_indent + 2)
                                mapping[nk] = child
                            else:
                                mapping[nk] = coerce(nv)
                                index += 1
                        items.append(mapping)
                    continue
                items.append(coerce(value))
                index += 1
            return items, index

        mapping: dict[str, Any] = {}
        while index < len(lines):
            item_indent, item = lines[index]
            if item_indent < indent:
                break
            if item_indent > indent:
                raise ValueError(f"invalid mapping indent near: {item}")
            if item.startswith("- "):
                break
            if ":" not in item:
                raise ValueError(f"expected key: value, got: {item}")
            key, rest = item.split(":", 1)
            key = key.strip()
            rest = rest.strip()
            if rest == "":
                child, index = parse_block(index + 1, item_indent + 2)
                mapping[key] = child
            else:
                mapping[key] = coerce(rest)
                index += 1
        return mapping, index

    data, _ = parse_block(0, 0)
    return data


def load_yaml(path: Path) -> Any:
    return parse_simple_yaml(path.read_text(encoding="utf-8"))


def load_contracts() -> dict[str, Any]:
    workflow = load_yaml(CONTRACTS / "workflow-policy.yaml")
    route = load_yaml(CONTRACTS / "route-policy.yaml")
    visual = load_yaml(CONTRACTS / "visual-defaults.yaml")
    quality_modes = {}
    for path in sorted((CONTRACTS / "quality-modes").glob("*.yaml")):
        quality_modes[path.stem] = load_yaml(path)
    return {
        "workflow": workflow,
        "route": route,
        "visual": visual,
        "qualityModes": quality_modes,
    }


def render_agent_fragment(data: dict[str, Any]) -> str:
    workflow = data["workflow"]
    route = data["route"]
    visual = data["visual"]
    thin = next(r for r in workflow["routing"]["rules"] if r["id"] == "extreme-thin-fallback")
    defaults = thin["defaults"]
    rhythm = "\n".join(f"  {i}. {line}" for i, line in enumerate(defaults["pageRhythm"], 1))
    modes = data["qualityModes"]
    return f"""## Generated Workflow Policy

This section is generated from `contracts/`. Do not hand-edit; run `python3 scripts/generate_contracts.py`.

### Source of truth

- Primary workflow: `SKILL.md`
- Design contract: `DESIGN.md`
- Machine policy: `contracts/workflow-policy.yaml`, `contracts/route-policy.yaml`, `contracts/visual-defaults.yaml`, `contracts/quality-modes/`

### Best-Effect Brief Enhancer

Before choosing a route or generating files, rewrite the user's short instruction into `bestEffectBrief`. Record prompt quality, auto-expanded audience/scenario/message/page-count/style/source/asset assumptions, recommended route, and which decisions came from the user vs the Agent.

### Routing

- Auto-route by policy. Do **not** force the user to choose PPTX vs Web before generation when the request is classifiable.
- Ask at most {workflow['routing']['maxUserFacingQuestions']} focused questions, and only when facts, sources, brand/IP, compliance, or route choice would materially change the deliverable.
- Formal / editable / government / finance / training / report / `.pptx` signals → `formal-editable-pptx` with quality mode `{route['decisions']['explicit-formal-signal']['qualityMode']}`.
- HTML / web PPT / magazine / editorial / e-ink / Swiss / horizontal swipe / keynote / showcase / demo-day / browser-first signals → `magazine-web-deck`.
- Extreme-thin topic-only prompts without formal/web signals use **Style A Editorial Fixed Rhythm** → `{defaults['mode']}`, style `{defaults['style']}`, {defaults['pages']} pages, cover surface `{defaults['coverSurface']}`.

### Extreme Thin Prompt Fallback page rhythm

{rhythm}

### Visual defaults

- Default cover surface: `{visual['cover']['default']}` (light / warm paper / near-white).
- Dark covers are allowed only for: {", ".join(visual['cover']['darkOnlyWhen'])}.
- Do not use a full-page black cover unless the user, brand, or explicit art direction requires it.
- Ink is primarily a text color, not the default full-page background.

### Source import

- Default import mode: `{workflow['sourceImport']['defaultMode']}` (`{workflow['sourceImport']['copyFlag']}`).
- `{workflow['sourceImport']['moveFlag']}` / archive-and-remove-original is an explicit advanced option, not the default.
- Repo-internal generated research artifacts may still move to avoid accidental commits.

### Evidence states

Allowed values: {", ".join(workflow['evidenceStates']['allowed'])}.
Draft slides created only because sources exist must start as `{workflow['evidenceStates']['draftWithReadySources']}`, never `grounded`.
`grounded` requires claim-level source binding.

### Quality modes

Default mode: `{workflow['qualityModes']['default']}`.
Available modes: {", ".join(workflow['qualityModes']['available'])}.

| Mode | Use | Key gates |
|---|---|---|
| quick | {", ".join(modes['quick']['useCases'])} | structure/file validity fail; visual evidence warning |
| standard | {", ".join(modes['standard']['useCases'])} | formal delivery fail; visual evidence recommended |
| audit | {", ".join(modes['audit']['useCases'])} | missing preview PNG / design report / blank-page risk fail |

Semantic assertions:
- defaultCoverSurface={route['semanticAssertions']['defaultCoverSurface']}
- extremeThinAutoRoutes={route['semanticAssertions']['extremeThinAutoRoutes']}
- extremeThinDefaultFormat={route['semanticAssertions']['extremeThinDefaultFormat']}
- formalSignalDefaultFormat={route['semanticAssertions']['formalSignalDefaultFormat']}
- mustAskBeforeGenerate={route['semanticAssertions']['mustAskBeforeGenerate']}
"""


def render_prompt_fragment(data: dict[str, Any]) -> str:
    workflow = data["workflow"]
    visual = data["visual"]
    thin = next(r for r in workflow["routing"]["rules"] if r["id"] == "extreme-thin-fallback")
    defaults = thin["defaults"]
    rhythm = "; ".join(defaults["pageRhythm"])
    return f"""Best-Effect Brief Enhancer: before route selection or production, rewrite the user's short instruction into `bestEffectBrief`. Record prompt quality (`complete`, `thin`, or `extreme-thin`), auto-expanded audience/scenario/message/page-count/style/source/asset assumptions, recommended route, and what was inferred.

Extreme Thin Prompt Fallback: for a generic request such as "做一个 PPT", "做个 PPT", "帮我做 PPT", "make a deck", "turn this into slides", or only a topic with no source material, do not make the user write a perfect prompt. Unless the user explicitly asks for formal / editable / government / finance / training PPTX, use Style A Editorial Fixed Rhythm by default:

- Mode 2: Magazine Web Deck;
- Style A · 电子杂志 × 电子墨水;
- 8 pages by default;
- cover surface: {defaults['coverSurface']};
- page rhythm: {rhythm};
- ask only when facts, sources, brand/IP, compliance, or route choice would materially change the deliverable.

If the user explicitly asks for a formal editable deck, government/finance/training/report material, or `.pptx`, switch to formal editable PPTX while keeping `bestEffectBrief` and the same quality checks. Default formal cover is light/near-white; dark covers only when user/brand/art-direction require them.

Do not force a PPTX vs Web choice before generation when the request is classifiable. Auto-route from policy. Quality modes: quick / standard (default) / audit. Source import defaults to --copy; --move is advanced. Draft evidence states start as unmapped when sources exist but claims are not bound.
Default visual foundation: paper {visual['surfaces']['paper']}, ink {visual['surfaces']['ink']}.
"""


def wrap_markdown(fragment: str) -> str:
    return f"{BEGIN}\n{fragment.rstrip()}\n{END}\n"


def wrap_prompt(fragment: str) -> str:
    return f"{BEGIN_PROMPT}\n{fragment.rstrip()}\n{END_PROMPT}"


def upsert_markdown_region(path: Path, fragment: str, *, heading_after: str | None = None) -> str:
    text = path.read_text(encoding="utf-8")
    block = wrap_markdown(fragment)
    pattern = re.compile(re.escape(BEGIN) + r".*?" + re.escape(END) + r"\n?", re.S)
    if pattern.search(text):
        return pattern.sub(block, text, count=1)
    if heading_after and heading_after in text:
        return text.replace(heading_after, heading_after + "\n\n" + block, 1)
    return text.rstrip() + "\n\n" + block


def upsert_prompt_region(path: Path, fragment: str) -> str:
    text = path.read_text(encoding="utf-8")
    block = wrap_prompt(fragment)
    pattern = re.compile(re.escape(BEGIN_PROMPT) + r".*?" + re.escape(END_PROMPT), re.S)
    if pattern.search(text):
        return pattern.sub(block, text, count=1)
    marker = (
        "Use SKILL_DIR/SKILL.md as the source of truth whenever the user asks to create, "
        "convert, polish, or redesign a PPT, PowerPoint, slide deck, presentation, 演示文稿, or 幻灯片."
    )
    if marker in text:
        return text.replace(marker, marker + "\n\n" + block, 1)
    return text.rstrip() + "\n\n" + block + "\n"


def render_ts(data: dict[str, Any]) -> str:
    payload = {
        "schemaVersion": data["workflow"]["schemaVersion"],
        "version": data["workflow"]["version"],
        "routing": data["workflow"]["routing"],
        "visualDefaults": data["workflow"]["visualDefaults"],
        "sourceImport": data["workflow"]["sourceImport"],
        "evidenceStates": data["workflow"]["evidenceStates"],
        "qualityModes": {
            "default": data["workflow"]["qualityModes"]["default"],
            "available": data["workflow"]["qualityModes"]["available"],
            "modes": data["qualityModes"],
        },
        "route": data["route"],
        "visual": data["visual"],
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    return (
        "/* Generated by scripts/generate_contracts.py. Do not edit by hand. */\n"
        "export const generatedPolicy = "
        + body
        + " as const;\n\n"
        "export type GeneratedPolicy = typeof generatedPolicy;\n"
        "export type QualityModeId = keyof typeof generatedPolicy.qualityModes.modes;\n"
        "export type EvidenceStateId = (typeof generatedPolicy.evidenceStates.allowed)[number];\n"
    )


def render_py(data: dict[str, Any]) -> str:
    payload = {
        "schemaVersion": data["workflow"]["schemaVersion"],
        "version": data["workflow"]["version"],
        "routing": data["workflow"]["routing"],
        "visualDefaults": data["workflow"]["visualDefaults"],
        "sourceImport": data["workflow"]["sourceImport"],
        "evidenceStates": data["workflow"]["evidenceStates"],
        "qualityModes": {
            "default": data["workflow"]["qualityModes"]["default"],
            "available": data["workflow"]["qualityModes"]["available"],
            "modes": data["qualityModes"],
        },
        "route": data["route"],
        "visual": data["visual"],
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    return (
        '"""Generated by scripts/generate_contracts.py. Do not edit by hand."""\n\n'
        "from __future__ import annotations\n\n"
        "import json\n\n"
        "GENERATED_POLICY = json.loads("
        + repr(body)
        + ")\n"
    )


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def planned_outputs(data: dict[str, Any]) -> dict[Path, str]:
    fragment = render_agent_fragment(data)
    prompt_fragment = render_prompt_fragment(data)
    return {
        FRAGMENT_DIR / "agent-entry.md": fragment + "\n",
        FRAGMENT_DIR / "prompt-entry.txt": prompt_fragment + "\n",
        ROUTE_JSON: json.dumps(data["route"], ensure_ascii=False, indent=2) + "\n",
        WORKFLOW_JSON: json.dumps(data["workflow"], ensure_ascii=False, indent=2) + "\n",
        QUALITY_JSON: json.dumps(data["qualityModes"], ensure_ascii=False, indent=2) + "\n",
        TS_OUT: render_ts(data),
        PY_OUT: render_py(data),
        ROOT / "AGENTS.md": upsert_markdown_region(
            ROOT / "AGENTS.md",
            fragment,
            heading_after="## Invocation",
        ),
        ROOT / "CLAUDE.md": upsert_markdown_region(
            ROOT / "CLAUDE.md",
            fragment,
            heading_after="## Required Behavior",
        ),
        ROOT / "PROMPT.md": upsert_prompt_region(ROOT / "PROMPT.md", prompt_fragment),
        ROOT / "SKILL.md": upsert_markdown_region(
            ROOT / "SKILL.md",
            fragment,
            heading_after="## Best-Effect Brief Enhancer",
        ),
    }


def generate(check: bool = False) -> int:
    data = load_contracts()
    outputs = planned_outputs(data)
    dirty: list[str] = []
    for path, content in outputs.items():
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                dirty.append(str(path.relative_to(ROOT)))
        else:
            write_text(path, content)
    if check and dirty:
        print("Contract drift detected in:")
        for item in dirty:
            print(f"  - {item}")
        print("Run: python3 scripts/generate_contracts.py")
        return 1
    if check:
        print("Contracts are in sync.")
        return 0
    print("Generated contract artifacts:")
    for path in outputs:
        print(f"  - {path.relative_to(ROOT)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if generated outputs are stale")
    args = parser.parse_args()
    try:
        return generate(check=args.check)
    except Exception as exc:  # pragma: no cover
        print(f"generate_contracts failed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
