"""Unified test-item model shared by the spec and evidence generators."""

from dataclasses import dataclass

# gen-cases `kind` → human-facing 観点 label
KIND_LABEL = {
    "boundary": "境界値",
    "operation": "操作",
    "state": "状態遷移",
}


@dataclass
class TestItem:
    id: str
    screen: str  # = cases.json `group`
    perspective: str  # 観点 (see KIND_LABEL)
    precondition: str  # 前提
    action: str  # 操作・入力
    expected: str  # 期待結果


def kind_label(kind: str) -> str:
    """Map a gen-cases kind to its Japanese 観点 label (passthrough if unknown)."""
    return KIND_LABEL.get(kind, kind)
