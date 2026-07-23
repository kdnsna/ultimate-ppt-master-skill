#!/usr/bin/env python3
"""
PPT Master - Visual Review Renderer

Renders project SVGs to 1280x720 PNGs that match the live-preview browser view
(inlined <use data-icon>, resolved <image href>, full font fallback including CJK).
The pure renderer for the visual-review workflow — does not edit SVGs, does not
interpret the rubric.

Backend: Playwright (Chromium). The cairosvg backend was evaluated and rejected
because cairo's text API has no font-fallback chain — CJK characters render as
tofu boxes for any deck whose font-family list relies on system fallback.

Usage:
    python3 scripts/visual_review.py <project_path>
    python3 scripts/visual_review.py <project_path> --pages 02 03
    python3 scripts/visual_review.py <project_path> --server-url http://localhost:5050
    python3 scripts/visual_review.py <project_path> --no-auto-server

Exit codes (per references/visual-review.md §7):
    0 — all requested pages rendered
    2 — live-preview server not reachable for this project
    3 — rendering backend (playwright + chromium) missing or unable to launch
    4 — one or more page-level render failures (details in stderr)

Output: JSON summary printed to stdout, PNGs written to <project>/.preview/.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from contextlib import contextmanager
from pathlib import Path


# Histogram threshold: PNG counts as "all background" if a single quantized
# color bucket holds >= ALL_BG_THRESHOLD of pixels. Guards against blank
# renders without false-firing on legitimate sparse dark layouts.
ALL_BG_THRESHOLD = 0.99


def _safe_print(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


@contextmanager
def file_lock(lock_path: Path, timeout: float = 30.0):
    """POSIX advisory lock via fcntl. Falls back to lockless on Windows."""
    try:
        import fcntl
    except ImportError:
        yield
        return

    lock_path.parent.mkdir(parents=True, exist_ok=True)
    fp = open(lock_path, 'w')
    deadline = time.monotonic() + timeout
    while True:
        try:
            fcntl.flock(fp.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            break
        except BlockingIOError:
            if time.monotonic() >= deadline:
                fp.close()
                raise TimeoutError(f"render lock contended for {timeout}s at {lock_path}")
            time.sleep(0.1)
    try:
        fp.write(str(os.getpid()))
        fp.flush()
        yield
    finally:
        fcntl.flock(fp.fileno(), fcntl.LOCK_UN)
        fp.close()
        try:
            lock_path.unlink()
        except FileNotFoundError:
            pass


def is_all_background(png_bytes: bytes) -> bool:
    """Histogram check: quantize each channel to 4 bits, count dominant bucket.
    Returns True only when the PNG is essentially monochrome (blank render)."""
    try:
        from PIL import Image
    except ImportError:
        # PIL not installed — skip this check, the rubric subagent will
        # re-validate visually.
        return False

    img = Image.open(io.BytesIO(png_bytes)).convert('RGB')
    pixels = list(img.getdata())
    total = len(pixels)
    if total == 0:
        return True
    counts: dict[tuple[int, int, int], int] = {}
    for r, g, b in pixels:
        key = (r >> 4, g >> 4, b >> 4)
        counts[key] = counts.get(key, 0) + 1
    dominant = max(counts.values())
    return dominant / total >= ALL_BG_THRESHOLD


def fetch_slide_text(server_url: str, page_name: str, timeout: float = 5.0) -> int:
    """Probe that the server can return the slide. Returns content length.
    Used only for failure detection — the actual fetch happens inside the
    browser via fetch() so the response is parsed by JS, not Python."""
    url = f"{server_url.rstrip('/')}/api/slide/{page_name}"
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        payload = json.loads(resp.read().decode('utf-8'))
    if 'content' not in payload:
        raise RuntimeError(f'unexpected response shape from {url}: {payload!r}')
    return len(payload['content'])


def render_pages(server_url: str, pages: list[str], preview_dir: Path) -> list[dict]:
    """Render all requested pages in a single browser session.

    Each render: page.goto(server_url) anchors the base URL so the SVG's
    relative <image href="../images/..."> resolves against the server.
    Then fetch the slide via the server's /api/slide endpoint (which inlines
    <use data-icon> references) and inject it as the document body.
    """
    from playwright.sync_api import sync_playwright

    preview_dir.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []

    inject_js = """
async (pageName) => {
    const res = await fetch('/api/slide/' + pageName + '?_=' + Date.now());
    if (!res.ok) throw new Error('fetch /api/slide/' + pageName + ' returned ' + res.status);
    const data = await res.json();
    document.documentElement.innerHTML =
        '<head><style>html,body{margin:0;padding:0;background:#0E1116;overflow:hidden}'
        + ' svg{display:block;width:1280px;height:720px}</style></head>'
        + '<body>' + data.content + '</body>';
    return { len: data.content.length };
}
"""

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(viewport={'width': 1280, 'height': 720})
            for page_name in pages:
                rec: dict = {'page': page_name, 'ok': False}
                try:
                    fetch_slide_text(server_url, page_name)
                except urllib.error.URLError as e:
                    rec['error'] = f'server_unreachable: {e!r}'
                    records.append(rec)
                    continue
                except Exception as e:  # noqa: BLE001
                    rec['error'] = f'{type(e).__name__}: {e}'
                    records.append(rec)
                    continue

                stem = page_name[:-4] if page_name.endswith('.svg') else page_name
                out_path = preview_dir / f'{stem}.png'

                try:
                    pg = context.new_page()
                    pg.goto(server_url, wait_until='domcontentloaded')
                    pg.evaluate(inject_js, page_name)
                    # Wait one frame so font/text shaping settles before capture.
                    pg.wait_for_timeout(100)
                    png_bytes = pg.screenshot(type='png', full_page=False)
                    pg.close()

                    out_path.write_bytes(png_bytes)
                    rec['ok'] = True
                    rec['path'] = str(out_path)
                    rec['bytes'] = len(png_bytes)
                    rec['all_background'] = is_all_background(png_bytes)
                except Exception as e:  # noqa: BLE001 — best-effort per-page
                    rec['error'] = f'{type(e).__name__}: {e}'
                records.append(rec)
        finally:
            browser.close()

    return records


def discover_pages(project_path: Path, requested: list[str] | None) -> list[str]:
    svg_dir = project_path / 'svg_output'
    if not svg_dir.is_dir():
        raise FileNotFoundError(f'no svg_output/ in {project_path}')
    all_svgs = sorted(p.name for p in svg_dir.glob('*.svg'))
    if not requested:
        return all_svgs
    selected: list[str] = []
    for token in requested:
        match = next((n for n in all_svgs if n.startswith(token) or n == token), None)
        if match is None:
            raise ValueError(f'no SVG matches token {token!r} in {svg_dir}')
        selected.append(match)
    return selected


def build_design_doctor_summary(records: list[dict]) -> dict:
    """Build a report-first Design Doctor contract from render records.

    This is deliberately conservative: it only scores renderer health and
    obvious blank-page signals. Human/agent rubric review still happens in the
    visual-review workflow before any SVG repair.
    """
    total = max(len(records), 1)
    rendered = sum(1 for rec in records if rec.get('ok'))
    blank = sum(1 for rec in records if rec.get('all_background'))
    failed = sum(1 for rec in records if not rec.get('ok'))

    render_score = max(0, round(100 * (rendered - blank) / total))
    visibility_score = max(0, 100 - failed * 25 - blank * 20)
    handoff_score = 100 if failed == 0 else max(40, 100 - failed * 30)

    page_findings = []
    for rec in records:
        if not rec.get('ok'):
            severity = 'fail'
            zh = f"{rec.get('page')}: 渲染失败，需要先修复预览或依赖。"
            en = f"{rec.get('page')}: render failed; fix preview server or dependencies first."
        elif rec.get('all_background'):
            severity = 'warning'
            zh = f"{rec.get('page')}: PNG 接近纯背景，需人工确认是否为空页。"
            en = f"{rec.get('page')}: PNG is near all-background; manually confirm the slide is not blank."
        else:
            severity = 'passed'
            zh = f"{rec.get('page')}: 浏览器渲染成功，可进入版式人工复查。"
            en = f"{rec.get('page')}: browser render succeeded; continue to layout review."
        page_findings.append({'page': rec.get('page'), 'severity': severity, 'zh': zh, 'en': en})

    return {
        'repairPolicy': {
            'default': 'report-only',
            'autoRepair': False,
            'requiresExplicitUserRequest': True,
        },
        'scorecard': [
            {
                'id': 'render-health',
                'label': {'zh': '渲染健康度', 'en': 'Render health'},
                'score': render_score,
            },
            {
                'id': 'blank-page-risk',
                'label': {'zh': '空白页风险', 'en': 'Blank-page risk'},
                'score': visibility_score,
            },
            {
                'id': 'handoff-readiness',
                'label': {'zh': '交付复查准备度', 'en': 'Handoff review readiness'},
                'score': handoff_score,
            },
        ],
        'repairRecommendations': [
            {
                'zh': '先把失败或疑似空白页面列入 quality-report.json，不自动改 SVG。',
                'en': 'Record failed or blank-looking pages in quality-report.json before changing SVGs.',
            },
            {
                'zh': '只有用户明确要求自动修复时，才运行 SVG 修复流程。',
                'en': 'Only run SVG repair when the user explicitly asks for automatic fixes.',
            },
            {
                'zh': '修复后重新运行 visual_review.py，并保留修复前后截图。',
                'en': 'After fixes, rerun visual_review.py and keep before/after screenshots.',
            },
        ],
        'pageFindings': page_findings,
    }


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _preview_server_script() -> Path:
    return _repo_root() / 'scripts' / 'svg_editor' / 'server.py'


def server_is_up(server_url: str) -> bool:
    try:
        check_server(server_url)
        return True
    except RuntimeError:
        return False


def maybe_start_preview_server(project_path: Path, server_url: str, *, auto: bool) -> tuple[object | None, str]:
    """Start a temporary live-preview server when none is reachable.

    Returns (process_or_None, effective_server_url).
    """
    if server_is_up(server_url):
        return None, server_url

    if not auto:
        raise RuntimeError(
            f'live-preview server not reachable at {server_url}; '
            f'start it with: python3 {_preview_server_script()} {project_path}'
        )

    script = _preview_server_script()
    if not script.is_file():
        raise RuntimeError(f'preview server script missing: {script}')

    import socket
    import subprocess
    import time
    from urllib.parse import urlparse

    parsed = urlparse(server_url)
    host = parsed.hostname or '127.0.0.1'
    preferred_port = parsed.port or 5050

    def free_port(start: int) -> int:
        for port in range(start, start + 30):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                try:
                    sock.bind((host if host not in {'localhost'} else '127.0.0.1', port))
                except OSError:
                    continue
                return port
        raise RuntimeError('no free port available for temporary preview server')

    port = free_port(preferred_port)
    effective = f'http://127.0.0.1:{port}'
    cmd = [
        sys.executable,
        str(script),
        str(project_path),
        '--port',
        str(port),
        '--no-browser',
    ]
    # Some server.py versions may not support --no-browser; fall back.
    proc = subprocess.Popen(
        cmd,
        cwd=str(_repo_root()),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )
    deadline = time.monotonic() + 12.0
    last_err = ''
    while time.monotonic() < deadline:
        if proc.poll() is not None:
            err = (proc.stderr.read() if proc.stderr else '') or ''
            # Retry without --no-browser if flag unsupported
            if '--no-browser' in ' '.join(cmd) and ('unrecognized' in err.lower() or 'no-browser' in err.lower() or 'error' in err.lower()):
                cmd = [sys.executable, str(script), str(project_path), '--port', str(port)]
                proc = subprocess.Popen(
                    cmd,
                    cwd=str(_repo_root()),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.PIPE,
                    text=True,
                )
                continue
            raise RuntimeError(f'failed to start temporary preview server: {err.strip() or proc.returncode}')
        if server_is_up(effective):
            _safe_print(f'auto-started temporary preview server at {effective}')
            return proc, effective
        time.sleep(0.2)
        last_err = 'server not ready yet'
    if proc.poll() is None:
        proc.terminate()
    raise RuntimeError(f'timed out waiting for temporary preview server at {effective}: {last_err}')


def stop_preview_server(proc: object | None) -> None:
    if proc is None:
        return
    try:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
    except Exception:
        pass



def check_server(server_url: str) -> None:
    """Probe server liveness via /api/slides. Raises RuntimeError if down."""
    url = f"{server_url.rstrip('/')}/api/slides"
    try:
        with urllib.request.urlopen(url, timeout=3.0) as resp:
            if resp.status != 200:
                raise RuntimeError(f'{url} returned HTTP {resp.status}')
    except urllib.error.URLError as e:
        raise RuntimeError(f'live-preview server not reachable at {server_url}: {e}')


def main() -> int:
    parser = argparse.ArgumentParser(
        description='Render project SVGs to PNGs for visual review.',
    )
    parser.add_argument('project_path', help='Path to project directory (contains svg_output/)')
    parser.add_argument(
        '--pages', nargs='+', default=None,
        help='Page tokens to render (default: all SVGs in svg_output/). '
             "Accepts '02', '02_three_steps', or '02_three_steps.svg'.",
    )
    parser.add_argument(
        '--server-url', default='http://localhost:5050',
        help='Live-preview server URL (default: http://localhost:5050)',
    )
    parser.add_argument(
        '--lock-timeout', type=float, default=30.0,
        help='Seconds to wait for render lock (default: 30)',
    )
    parser.add_argument(
        '--no-auto-server', action='store_true',
        help='Do not auto-start a temporary preview server when none is reachable',
    )
    args = parser.parse_args()

    project_path = Path(args.project_path).resolve()
    if not project_path.is_dir():
        _safe_print(f'project path not found: {project_path}')
        return 2

    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
    except ImportError:
        _safe_print(
            'playwright not installed. Install with:\n'
            '    pip install playwright\n'
            '    python3 -m playwright install chromium\n'
            f'(or: bash {_repo_root() / "scripts" / "bootstrap.sh"} --profile visual-review)'
        )
        return 3

    preview_proc = None
    server_url = args.server_url
    try:
        try:
            preview_proc, server_url = maybe_start_preview_server(
                project_path,
                args.server_url,
                auto=not args.no_auto_server,
            )
        except RuntimeError as e:
            _safe_print(str(e))
            _safe_print(
                'start it with:\n'
                f'    python3 {_preview_server_script()} {project_path}'
            )
            return 2

        try:
            pages = discover_pages(project_path, args.pages)
        except (FileNotFoundError, ValueError) as e:
            _safe_print(str(e))
            return 2

        preview_dir = project_path / '.preview'
        lock_path = preview_dir / '.render.lock'

        with file_lock(lock_path, timeout=args.lock_timeout):
            try:
                records = render_pages(server_url, pages, preview_dir)
            except Exception as e:  # noqa: BLE001 — browser launch failure
                _safe_print(f'browser session failed: {type(e).__name__}: {e}')
                _safe_print(
                    'try:  python3 -m playwright install chromium'
                )
                return 3

        for rec in records:
            if not rec['ok']:
                _safe_print(f"[FAIL] {rec['page']}: {rec.get('error')}")
            elif rec.get('all_background'):
                _safe_print(f"[WARN] {rec['page']}: PNG rendered but is all-background")

        summary = {
            'project': str(project_path),
            'server_url': server_url,
            'autoStartedServer': preview_proc is not None,
            'rendered': sum(1 for r in records if r['ok']),
            'failed': sum(1 for r in records if not r['ok']),
            'all_background': sum(1 for r in records if r.get('all_background')),
            'pages': records,
            'designDoctor': build_design_doctor_summary(records),
        }
        print(json.dumps(summary, indent=2, ensure_ascii=False))

        if summary['failed']:
            return 4
        return 0
    finally:
        stop_preview_server(preview_proc)


if __name__ == '__main__':
    sys.exit(main())
