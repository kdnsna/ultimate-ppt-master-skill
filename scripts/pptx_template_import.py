#!/usr/bin/env python3
"""Unified PPTX preparation entry point for the /create-template workflow.

Reads OOXML directly via `pptx_to_svg` and writes a reusable reference workspace:

- `manifest.json` — single source of truth for slide size, theme colors, fonts,
  asset inventory, and per-slide / per-layout / per-master metadata
- `summary.md` — short human-readable digest derived from manifest.json
- `assets/` — extracted reusable image assets
- `svg/` — primary view: by default the layered template view (every master
  and layout in the deck rendered once each as `master_*.svg` /
  `layout_*.svg`, slides contain only their own shapes, and an
  `inheritance.json` describes the reuse graph)
- `svg-flat/` — companion view (default mode "both"): each `slide_NN.svg`
  is self-contained — master/layout decoration is inlined — so opening any
  one slide shows the full page like PowerPoint would
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from template_import.manifest import build_manifest


def infer_functional_type(slide: dict) -> str:
    """Infer a presentation functional type from imported PPTX metadata."""
    text = " ".join(
        str(slide.get(key, ""))
        for key in ("name", "layoutName", "title", "notes")
    ).lower()
    if "cover" in text or "title slide" in text or "封面" in text:
        return "cover"
    if "process" in text or "timeline" in text or "流程" in text or slide.get("connectorCount", 0):
        return "process"
    if "evidence" in text or "table" in text or "数据" in text or slide.get("tableCount", 0):
        return "evidence"
    if "compare" in text or "comparison" in text or "对比" in text:
        return "comparison"
    if "metric" in text or "kpi" in text or "指标" in text:
        return "benefit"
    return "context"


def layout_family_for_functional_type(functional_type: str) -> str:
    return {
        "cover": "cover_brand",
        "process": "process_flow",
        "evidence": "evidence_board",
        "comparison": "comparison_matrix",
        "benefit": "metric_panel",
        "context": "statement_plus_evidence",
    }.get(functional_type, "statement_plus_evidence")


def build_reference_style_from_manifest(manifest: dict, mode: str = "style-only") -> dict:
    """Build a compact reference-style contract from a PPTX import manifest."""
    slides = manifest.get("slides", [])
    functional_types: list[str] = []
    layout_families: list[str] = []
    slide_schemas: list[dict] = []
    for index, slide in enumerate(slides if isinstance(slides, list) else [], start=1):
        if not isinstance(slide, dict):
            continue
        functional_type = infer_functional_type(slide)
        layout_family = layout_family_for_functional_type(functional_type)
        if functional_type not in functional_types:
            functional_types.append(functional_type)
        if layout_family not in layout_families:
            layout_families.append(layout_family)
        slide_schemas.append(
            {
                "page": f"P{index:02d}",
                "functionalType": functional_type,
                "layoutFamily": layout_family,
                "sourceLayout": slide.get("layoutName") or slide.get("layout") or "",
                "shapeCount": slide.get("shapeCount", 0),
                "textCount": slide.get("textCount", 0),
                "imageCount": slide.get("imageCount", 0),
                "tableCount": slide.get("tableCount", 0),
            }
        )

    theme = manifest.get("theme", {}) if isinstance(manifest.get("theme", {}), dict) else {}
    return {
        "version": "reference-style-v1",
        "mode": mode,
        "functionalTypes": functional_types,
        "layoutFamilies": layout_families,
        "brandConstraints": {
            "colors": theme.get("colors", {}),
            "fonts": theme.get("fonts", {}),
        },
        "slideSchemas": slide_schemas,
        "reusePolicy": "Reuse structure, functional type, layout rhythm, and brand constraints; do not copy private content.",
    }


def parse_args() -> argparse.Namespace:
    """Build the CLI argument parser for the import entry point."""
    parser = argparse.ArgumentParser(
        description="Prepare a PPTX reference workspace for /create-template."
    )
    parser.add_argument("pptx_file", help="Path to the source .pptx file")
    parser.add_argument(
        "-o",
        "--output",
        help="Output directory (default: <pptx_stem>_template_import beside the source file)",
    )
    parser.add_argument(
        "--skip-manifest",
        action="store_true",
        help="Skip PPTX metadata extraction and asset inventory generation",
    )
    parser.add_argument(
        "--manifest-only",
        action="store_true",
        help=(
            "Only extract manifest.json + summary.md + reusable assets, "
            "without exporting slides to SVG"
        ),
    )
    parser.add_argument(
        "--embed-images",
        action="store_true",
        help="Inline images as data: URIs instead of writing files to assets/",
    )
    parser.add_argument(
        "--inheritance-mode",
        choices=("both", "layered", "flat"),
        default="both",
        help=(
            "How to render master/layout shapes for slide SVGs. "
            "'both' (default): emit both views — svg/ holds the layered "
            "renderings (template designers see master/layout/slide as "
            "separate files plus svg/inheritance.json) and svg-flat/ holds "
            "self-contained per-slide SVGs (each one renders correctly when "
            "opened on its own). 'layered': only the svg/ tree, useful when "
            "you don't need the flat view. 'flat': only self-contained slide "
            "SVGs in svg/, the round-trip view used by svg_to_pptx."
        ),
    )
    parser.add_argument(
        "--reference-style-mode",
        choices=("follow-reference", "style-only"),
        default="style-only",
        help="Write reference-style.json describing functional types, layout families, and brand constraints.",
    )
    return parser.parse_args()


def main() -> int:
    """CLI entry point: write the PPTX reference workspace to disk."""
    args = parse_args()
    pptx_path = Path(args.pptx_file).expanduser().resolve()
    if not pptx_path.exists():
        print(f"Error: file does not exist: {pptx_path}")
        return 1
    if pptx_path.suffix.lower() != ".pptx":
        print(f"Error: expected a .pptx file, got: {pptx_path.name}")
        return 1

    output_dir = (
        Path(args.output).expanduser().resolve()
        if args.output
        else pptx_path.with_name(f"{pptx_path.stem}_template_import")
    )
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.skip_manifest and args.manifest_only:
        print("Error: --skip-manifest and --manifest-only cannot be used together")
        return 1

    manifest = None
    manifest_path = output_dir / "manifest.json"
    if not args.skip_manifest:
        try:
            manifest = build_manifest(pptx_path, output_dir)
        except (RuntimeError, OSError, ValueError) as exc:
            print(f"Error: failed to extract PPTX metadata: {exc}")
            return 1

        manifest_path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        reference_style = build_reference_style_from_manifest(manifest, mode=args.reference_style_mode)
        (output_dir / "reference-style.json").write_text(
            json.dumps(reference_style, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    if args.manifest_only:
        print(f"Imported PPTX template source: {pptx_path.name}")
        print(f"Output directory: {output_dir}")
        if manifest is not None:
            print(f"Manifest: {manifest_path.name}")
            print("Summary: summary.md")
            print(f"Assets exported: {len(manifest['assets']['allAssets'])}")
            print(f"Common assets: {len(manifest['assets']['commonAssets'])}")
            print(f"Slides analyzed: {len(manifest['slides'])}")
            print(f"Layouts (unique): {len(manifest.get('layouts', []))}")
            print(f"Masters (unique): {len(manifest.get('masters', []))}")
        return 0

    from pptx_to_svg import convert_pptx_to_svg
    from pptx_to_svg.converter import ConvertOptions

    options = ConvertOptions(
        media_subdir="assets",
        embed_images=args.embed_images,
        keep_hidden=False,
        inheritance_mode=args.inheritance_mode,
        asset_name_map=manifest.get("assets", {}).get("assetMap", {}) if manifest else {},
    )
    result = convert_pptx_to_svg(pptx_path, output_dir, options)
    total_bytes = sum(len(art.svg.encode("utf-8")) for art in result.slides)

    print(f"Inheritance mode: {args.inheritance_mode}")
    print(f"Exported SVG slides: {len(result.slides)}")
    if args.inheritance_mode in {"layered", "both"}:
        print(f"Exported masters: {len(result.masters)}")
        print(f"Exported layouts: {len(result.layouts)}")
        print("Inheritance graph: svg/inheritance.json")
    if result.flat_slides:
        print(f"Flat companion slides: {len(result.flat_slides)} (svg-flat/)")
    print(f"SVG bytes (primary): {total_bytes}")
    print(f"Output directory: {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
