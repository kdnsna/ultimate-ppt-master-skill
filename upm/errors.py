"""Actionable error hierarchy for UPM.

Every error carries a user-facing message plus a suggested fix so CLI output
can point directly at the next step instead of exposing a stack trace.
"""

from __future__ import annotations


class UpmError(Exception):
    """Base class for all expected UPM failures."""

    exit_code = 1
    kind = "upm-error"

    def __init__(self, message: str, *, hint: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.hint = hint

    def render(self) -> str:
        text = f"[{self.kind}] {self.message}"
        if self.hint:
            text += f"\n  → {self.hint}"
        return text


class ConfigError(UpmError):
    kind = "config-error"


class InputError(UpmError):
    kind = "input-error"


class ProjectError(UpmError):
    kind = "project-error"


class ValidationError(UpmError):
    kind = "validation-error"
    exit_code = 2


class PathSafetyError(ValidationError):
    kind = "path-safety-error"


class StructureGateError(ValidationError):
    kind = "structure-gate-error"


class CompilerError(UpmError):
    kind = "compiler-error"


class RenderError(UpmError):
    kind = "render-error"


class ExportError(UpmError):
    kind = "export-error"


class AdapterError(ExportError):
    kind = "adapter-error"


class AdapterUnavailableError(AdapterError):
    """Raised when a backend is not usable in the current environment."""

    kind = "adapter-unavailable"


class AdapterProtocolError(AdapterError):
    """Raised when a remote backend changed or rejected the protocol."""

    kind = "adapter-protocol"


class QaError(UpmError):
    kind = "qa-error"


class RepairBudgetExceeded(QaError):
    kind = "repair-budget-exceeded"


class CliError(UpmError):
    kind = "cli-error"

