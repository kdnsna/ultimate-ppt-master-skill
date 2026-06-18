#!/usr/bin/env python3
"""Audit v5.2 reference style and image acceptance rules."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def require(path: str, *needles: str) -> list[str]:
    text = (ROOT / path).read_text(encoding="utf-8")
    return [f"{path}: missing {needle}" for needle in needles if needle not in text]


def main() -> int:
    failures: list[str] = []
    failures.extend(require(
        "apps/web/src/App.tsx",
        "referenceStyleOptions",
        "consulting-structured",
        "financial-steady",
        "management-dashboard",
        "product-launch-hero",
        "culture-tourism-editorial",
        "imageAcceptance",
        "AI 生成图只能做无文字主视觉",
    ))
    failures.extend(require(
        "apps/bridge/server.mjs",
        "defaultReferenceStyle",
        "defaultImageAcceptance",
        "AI images are for no-text hero visuals",
    ))
    failures.extend(require(
        "apps/desktop/worker/desktop_worker.py",
        "desktop_reference_style",
        "desktop_image_acceptance",
        "AI images are for no-text hero visuals",
    ))
    if failures:
        print("v5.2 visual intent audit failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("v5.2 visual intent audit passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
