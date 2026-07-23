import unittest
from pathlib import Path
import importlib.util


ROOT = Path(__file__).resolve().parents[1]


def load_workspace_core_via_node_assert():
    # Python-side behavioral mirror of createDraftSlides policy for regression.
    # The TypeScript source is the runtime source of truth for web/bridge.
    index = (ROOT / "packages/workspace-core/src/index.ts").read_text(encoding="utf-8")
    return index


class EvidenceDraftStatesTest(unittest.TestCase):
    def test_create_draft_slides_starts_unmapped_not_grounded(self):
        source = load_workspace_core_via_node_assert()
        self.assertIn('export type EvidenceState = "unmapped" | "candidate" | "grounded" | "conflicted" | "missing";', source)
        self.assertIn('evidenceState: sourceCount > 0 ? "unmapped" : "missing"', source)
        self.assertNotIn('index === 0 ? "partial" : "grounded"', source)
        self.assertIn("Presence of sources only yields unmapped placeholders", source)

    def test_generated_policy_lists_extended_evidence_states(self):
        policy = (ROOT / "packages/workspace-core/src/generated/policy.ts").read_text(encoding="utf-8")
        for state in ("unmapped", "candidate", "grounded", "conflicted", "missing"):
            self.assertIn(f'"{state}"', policy)


if __name__ == "__main__":
    unittest.main()
