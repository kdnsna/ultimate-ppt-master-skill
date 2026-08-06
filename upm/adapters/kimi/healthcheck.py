"""Kimi adapter healthcheck (report-only, never installs)."""

from __future__ import annotations

import importlib.util
import shutil
from typing import Any

from upm.export.base import healthcheck_shape


def kimi_healthcheck() -> dict[str, Any]:
    executable = shutil.which("agent-browser")
    if not executable:
        return healthcheck_shape(
            "kimi",
            False,
            "未找到 agent-browser CLI；Kimi 适配器不可用（本地后端不受影响）。",
            required=["agent-browser>=0.33.2 (npm)", "websocket-client (pip)"],
        )
    try:
        from upm.adapters.kimi.protocol import ensure_agent_browser

        ensure_agent_browser()
        browser_ok = True
        browser_reason = f"agent-browser 可用：{executable}"
    except Exception as exc:  # noqa: BLE001
        browser_ok = False
        browser_reason = str(exc)
    websocket_ok = importlib.util.find_spec("websocket") is not None
    reason = browser_reason
    if not websocket_ok:
        reason += "；websocket-client 缺失（图片导出对话框需要，可 pip install websocket-client）"
    return healthcheck_shape(
        "kimi",
        browser_ok,
        reason,
        required=["agent-browser>=0.33.2 (npm)", "websocket-client (pip)"],
    )
