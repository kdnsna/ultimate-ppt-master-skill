"""UPM v7 core: unified presentation production system.

This package implements the Deck Generation Engine (DeckIR -> PPTD -> export ->
visual QA), the replaceable export adapters, and the `upm` CLI. The Preserve
Edit Engine lives in ``scripts/preserve_edit_pptx.py`` and is wrapped by
``upm.cli.edit``.
"""

from __future__ import annotations

__version__ = "7.0.0"

