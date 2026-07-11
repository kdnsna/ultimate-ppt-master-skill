from __future__ import annotations

import sys
from pathlib import Path

from pptx import Presentation


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.svg_to_pptx.pptx_builder import (
    _clear_personal_core_properties,
    _ensure_notes_master_parts,
)


def test_notes_master_parts_complete_relationship_graph(tmp_path: Path) -> None:
    ppt_dir = tmp_path / "ppt"
    (ppt_dir / "_rels").mkdir(parents=True)
    (ppt_dir / "theme").mkdir(parents=True)
    (ppt_dir / "theme" / "theme1.xml").write_text("<theme/>", encoding="utf-8")
    (ppt_dir / "_rels" / "presentation.xml.rels").write_text(
        """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>""",
        encoding="utf-8",
    )

    _ensure_notes_master_parts(tmp_path)

    assert (ppt_dir / "notesMasters" / "notesMaster1.xml").is_file()
    rels = (ppt_dir / "notesMasters" / "_rels" / "notesMaster1.xml.rels").read_text()
    assert 'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"' in rels
    assert 'Target="../theme/theme2.xml"' in rels
    assert (ppt_dir / "theme" / "theme2.xml").read_text() == "<theme/>"

    presentation_rels = (ppt_dir / "_rels" / "presentation.xml.rels").read_text()
    assert presentation_rels.count("relationships/notesMaster") == 1
    assert 'Target="notesMasters/notesMaster1.xml"' in presentation_rels

    _ensure_notes_master_parts(tmp_path)
    presentation_rels = (ppt_dir / "_rels" / "presentation.xml.rels").read_text()
    assert presentation_rels.count("relationships/notesMaster") == 1


def test_personal_core_properties_are_cleared() -> None:
    presentation = Presentation()
    presentation.core_properties.author = "Template Author"
    presentation.core_properties.last_modified_by = "Template Editor"

    _clear_personal_core_properties(presentation)

    assert presentation.core_properties.author == ""
    assert presentation.core_properties.last_modified_by == ""
