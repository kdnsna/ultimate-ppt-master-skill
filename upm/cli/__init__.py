"""UPM CLI: make / edit / open / review / doctor."""

from __future__ import annotations

import argparse
import os
import sys

from upm.errors import UpmError


def _configure_windows_stdio() -> None:
    """Windows consoles default to a legacy charmap; force UTF-8 for output and child processes."""
    if sys.platform != "win32":
        return
    os.environ.setdefault("PYTHONUTF8", "1")
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError, OSError):
            pass


def main(argv: list[str] | None = None) -> int:
    _configure_windows_stdio()
    parser = argparse.ArgumentParser(
        prog="upm",
        description="Ultimate PPT Master 统一命令行：make / edit / open / review / doctor",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    make_parser = sub.add_parser("make", help="从主题/文档/URL 生成可编辑 PPTX")
    make_parser.add_argument("input", help="主题文字、本地文件或 URL")
    make_parser.add_argument("--title", default=None, help="演示文稿标题（默认取输入前 24 字）")
    make_parser.add_argument("--out", default="projects", help="输出根目录（默认 ./projects）")
    make_parser.add_argument("--pages", type=int, default=None, help="目标页数（默认自动）")
    make_parser.add_argument("--direction", default="formal-finance", choices=["formal-finance", "consulting-evidence", "brand-launch", "training-narrative", "editorial-narrative", "swiss-information", "premium-launch", "custom"], help="视觉方向")
    make_parser.add_argument("--mode", default="standard", choices=["quick", "standard", "audit"], help="质量模式")
    make_parser.add_argument("--format", dest="deck_format", default="editable-deck", choices=["editable-deck", "web-deck"], help="交付类型")
    make_parser.add_argument("--export-backend", default="local", choices=["local", "kimi"], help="PPTX 导出后端（默认 local）")
    make_parser.add_argument("--render-backend", default="auto", choices=["auto", "local", "kimi"], help="视觉渲染后端（默认自动）")
    make_parser.add_argument("--deckir", default=None, help="使用现有 DeckIR JSON（跳过自动规划）")
    make_parser.add_argument("--image", action="append", default=[], metavar="P01=path.png", help="指定 slideId 的图片")
    make_parser.add_argument("--no-qa", action="store_true", help="跳过视觉 QA（仅结构校验）")
    make_parser.add_argument(
        "--allow-quality-fail",
        action="store_true",
        help="质量门失败时仍以 0 退出（产物非正式交付，仅调试用）",
    )

    edit_parser = sub.add_parser("edit", help="对已有 PPTX 做保真局部修改")
    edit_parser.add_argument("pptx", help="源 .pptx")
    edit_parser.add_argument(
        "instruction",
        nargs="?",
        default=None,
        help='修改要求，例如 "把第 2 页的 Q2 改成 Q3"（提供 --edits 时可省略）',
    )
    edit_parser.add_argument("--output", default=None, help="输出路径（默认同目录 *_edited.pptx）")
    edit_parser.add_argument("--edits", default=None, help="使用 edits JSON 文件（跳过自然语言解析）")
    edit_parser.add_argument("--preview", action="store_true", help="生成修改前后渲染对比")

    open_parser = sub.add_parser("open", help="打开 PPTD 项目视觉精修界面")
    open_parser.add_argument("project", help="PPTD 项目目录")
    open_parser.add_argument("--port", type=int, default=0, help="本地端口（默认自动分配）")
    open_parser.add_argument("--no-browser", action="store_true", help="不自动打开浏览器")

    review_parser = sub.add_parser("review", help="重新执行视觉与交付审计")
    review_parser.add_argument("project", help="PPTD 项目目录")
    review_parser.add_argument("--mode", default="standard", choices=["quick", "standard", "audit"])
    review_parser.add_argument("--render-backend", default="auto", choices=["auto", "local", "kimi"])
    review_parser.add_argument(
        "--allow-quality-fail",
        action="store_true",
        help="质量门失败时仍以 0 退出",
    )

    doctor_parser = sub.add_parser("doctor", help="检查当前任务所需环境（只报告，不安装）")
    doctor_parser.add_argument("--profile", default="core", choices=["core", "pptx", "visual-review", "kimi", "all"])

    plan_parser = sub.add_parser("plan", help="输出规范 DeckIR JSON（Bridge/Desktop 共用核心规划器）")
    plan_parser.add_argument("input", help="主题文字或本地源文件路径")
    plan_parser.add_argument("--title", default=None, help="演示文稿标题")
    plan_parser.add_argument("--pages", type=int, default=None, help="目标页数")
    plan_parser.add_argument(
        "--direction",
        default="formal-finance",
        choices=[
            "formal-finance",
            "consulting-evidence",
            "brand-launch",
            "training-narrative",
            "editorial-narrative",
            "swiss-information",
            "premium-launch",
            "custom",
        ],
    )
    plan_parser.add_argument("--mode", default="standard", choices=["quick", "standard", "audit"])
    plan_parser.add_argument(
        "--format",
        dest="deck_format",
        default="editable-deck",
        choices=["editable-deck", "web-deck"],
        help="交付类型（写入 delivery.outputMode）",
    )
    plan_parser.add_argument(
        "--emit",
        dest="format",
        default="deckir",
        choices=["deckir", "bridge"],
        help="输出形态：deckir（默认）或 bridge（storyboard/sourceMap/planningReport）",
    )
    plan_parser.add_argument("--output", "-o", default=None, help="写入文件（默认 stdout）")
    plan_parser.add_argument(
        "--planner",
        default="deterministic-draft-planner",
        help="规划器名称（当前仅 deterministic-draft-planner）",
    )

    args = parser.parse_args(argv)
    try:
        if args.command == "make":
            from upm.cli.make import run_make

            return run_make(args)
        if args.command == "edit":
            from upm.cli.edit import run_edit

            return run_edit(args)
        if args.command == "open":
            from upm.cli.open_server import run_open

            return run_open(args)
        if args.command == "review":
            from upm.cli.review import run_review

            return run_review(args)
        if args.command == "doctor":
            from upm.cli.doctor import run_doctor

            return run_doctor(args)
        if args.command == "plan":
            from upm.cli.plan import run_plan

            return run_plan(args)
    except UpmError as exc:
        print(exc.render(), file=sys.stderr)
        return exc.exit_code
    except KeyboardInterrupt:
        print("\n已取消。", file=sys.stderr)
        return 130
    return 1
