"""PPTD v2 core: model, schema validation, project I/O, path safety."""

from .model import (
    MANIFEST_VERSION,
    UPM_SCHEMA_VERSION,
    chart_element,
    create_manifest,
    create_page,
    image_element,
    shape_element,
    table_element,
    text_element,
)
from .paths import (
    assert_media_path,
    assert_page_path,
    page_path_from_index,
    validate_element_src,
)
from .schema import ValidationIssue, validate_pptd_project, validate_pptd_text

__all__ = [
    "MANIFEST_VERSION",
    "UPM_SCHEMA_VERSION",
    "create_manifest",
    "create_page",
    "text_element",
    "shape_element",
    "image_element",
    "table_element",
    "chart_element",
    "assert_page_path",
    "assert_media_path",
    "page_path_from_index",
    "validate_element_src",
    "ValidationIssue",
    "validate_pptd_project",
    "validate_pptd_text",
]
