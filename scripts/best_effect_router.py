#!/usr/bin/env python3
"""Deterministic Best-Effect Brief route classifier."""

from __future__ import annotations

import argparse
import json
import re
from typing import Any


FORMAL_RE = re.compile(
    r"(\.pptx\b|pptx\b|powerpoint|可编辑|汇报|报告|政府|金融|培训|审计|咨询|consulting|business report|"
    r"quarterly business review|qbr|board deck|editable|revise|stakeholder|training|government|finance|audit)",
    re.IGNORECASE,
)
WEB_RE = re.compile(
    r"(网页\s*ppt|web\s*(deck|ppt|slides?)|html|横滑|浏览器|browser|magazine|杂志|editorial|"
    r"e-?ink|电子墨水|swiss|瑞士|keynote|showcase|demo[- ]?day)",
    re.IGNORECASE,
)
TOPIC_WRAPPER_RE = re.compile(
    r"^(帮我|请|please)?\s*(做|制作|生成|make|create|build)?\s*(一个|一份|a|an)?\s*(关于|about)?\s*"
    r"(?P<topic>[\w\u4e00-\u9fff .-]+?)\s*(的)?\s*(ppt|deck|slides?|presentation|幻灯片)?\s*$",
    re.IGNORECASE,
)
AUDIENCE_RE = re.compile(r"(面向|给|受众|audience|for\s+(the\s+)?(?:[\w-]+\s+){0,3}(team|customer|client|investor|board|students|executives?)|老板|投资人)", re.IGNORECASE)
SCENARIO_RE = re.compile(r"(场景|会议|路演|发布会|复盘|workshop|meeting|offsite|launch|review|demo)", re.IGNORECASE)
SOURCE_RE = re.compile(r"(根据|基于|附件|文件|pdf|excel|数据|source|attached|attachment|dataset|transcript)", re.IGNORECASE)
PAGE_RE = re.compile(r"(\d+\s*(页|p|slides?|pages?)|page count|页数)", re.IGNORECASE)
STYLE_RE = re.compile(r"(风格|视觉|品牌|配色|style|tone|theme|density|monocle|科技感)", re.IGNORECASE)
CORE_RE = re.compile(r"(核心|结论|主张|takeaway|message|objective|goal|目标|必须包含)", re.IGNORECASE)


def compact_len(text: str) -> int:
    return len(re.sub(r"\s+", "", text))


def signal_count(text: str) -> int:
    return sum(
        1
        for pattern in (AUDIENCE_RE, SCENARIO_RE, SOURCE_RE, PAGE_RE, STYLE_RE, CORE_RE)
        if pattern.search(text)
    )


def prompt_quality(text: str) -> str:
    stripped = text.strip()
    signals = signal_count(stripped)
    topic_only = TOPIC_WRAPPER_RE.match(stripped) is not None and signals == 0
    if topic_only or (compact_len(stripped) <= 25 and signals == 0):
        return "extreme-thin"
    if SOURCE_RE.search(stripped) and signals >= 3:
        return "complete"
    if signals >= 1:
        return "thin"
    return "extreme-thin"


def classify_request(text: str) -> dict[str, Any]:
    quality = prompt_quality(text)

    if FORMAL_RE.search(text):
        return {
            "prompt_quality": quality,
            "route": "formal-editable-pptx",
            "decision": "explicit-formal-signal",
        }
    if WEB_RE.search(text):
        return {
            "prompt_quality": quality,
            "route": "magazine-web-deck",
            "decision": "explicit-web-signal",
        }
    if quality == "extreme-thin":
        return {
            "prompt_quality": quality,
            "route": "guizang-web-fixed-style",
            "decision": "extreme-thin-fallback",
        }
    if quality == "thin":
        return {
            "prompt_quality": quality,
            "route": "staged-questions",
            "decision": "thin-guided-intake",
        }
    return {
        "prompt_quality": quality,
        "route": "source-first",
        "decision": "complete-source-first",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("request", nargs="+")
    args = parser.parse_args()
    print(json.dumps(classify_request(" ".join(args.request)), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
