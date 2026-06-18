#!/usr/bin/env python3
"""Audit the v5.2 project brief contract across Web, Bridge, and Desktop."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


CHECKS = {
    "apps/web/src/App.tsx": [
        "schemaVersion: \"v5.2-brief-v1\"",
        "interface SourceConfidence",
        "interface DeliveryScorecard",
        "interface FeedbackLoop",
        "buildV52Contract",
        "sourceConfidence",
        "deliveryScorecard",
        "confirmationBrief",
    ],
    "apps/bridge/server.mjs": [
        "schemaVersion: \"v5.2-brief-v1\"",
        "defaultSourceConfidence",
        "defaultDeliveryScorecard",
        "defaultConfirmationBrief",
        "sourceConfidence",
        "deliveryScorecard",
    ],
    "apps/desktop/worker/desktop_worker.py": [
        "\"schemaVersion\": \"v5.2-brief-v1\"",
        "desktop_source_confidence",
        "desktop_delivery_scorecard",
        "desktop_confirmation_brief",
        "\"sourceConfidence\"",
        "\"deliveryScorecard\"",
    ],
}


def main() -> int:
    failures: list[str] = []
    for relative, needles in CHECKS.items():
        text = (ROOT / relative).read_text(encoding="utf-8")
        for needle in needles:
            if needle not in text:
                failures.append(f"{relative}: missing {needle}")
    if failures:
        print("v5.2 brief contract audit failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("v5.2 brief contract audit passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
