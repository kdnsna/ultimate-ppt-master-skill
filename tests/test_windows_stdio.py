"""Regression tests for Windows UTF-8 console handling."""

import sys
import unittest
from unittest import mock

from upm.cli import _configure_windows_stdio


class FakeStream:
    def __init__(self):
        self.calls = []

    def reconfigure(self, **kwargs):
        self.calls.append(kwargs)


class WindowsStdioTest(unittest.TestCase):
    def test_noop_on_non_windows(self):
        with mock.patch.object(sys, "platform", "darwin"):
            # Must not touch streams or env on non-Windows platforms.
            _configure_windows_stdio()

    def test_reconfigures_streams_on_windows(self):
        out, err = FakeStream(), FakeStream()
        with mock.patch.object(sys, "platform", "win32"), mock.patch.object(
            sys, "stdout", out
        ), mock.patch.object(sys, "stderr", err), mock.patch.dict(
            "os.environ", {}, clear=True
        ):
            _configure_windows_stdio()
        self.assertEqual(out.calls, [{"encoding": "utf-8", "errors": "replace"}])
        self.assertEqual(err.calls, [{"encoding": "utf-8", "errors": "replace"}])


if __name__ == "__main__":
    unittest.main()
