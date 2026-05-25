"""Load gen-cases JSON (boundary + doc) into a unified TestItem list.

Boundary logic stays in the TS gen-cases tool; here we only *consume* its output
(no duplication of derivation rules).
"""

import json

from .model import TestItem, kind_label


def _read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_cases(boundary_path, doc_path):
    """Return list[TestItem] from boundary.cases.json + doc.cases.json."""
    items = []

    for c in _read(boundary_path):
        items.append(
            TestItem(
                id=c["id"],
                screen=c["group"],
                perspective=kind_label(c.get("kind", "boundary")),
                precondition="",
                action=f"{c['field']} = {c['value']!r}",
                expected="有効(受理)" if c["expectValid"] else "無効(拒否)",
            )
        )

    for c in _read(doc_path):
        items.append(
            TestItem(
                id=c["id"],
                screen=c["group"],
                perspective=kind_label(c["kind"]),
                precondition=c.get("precondition", ""),
                action=c.get("action", c.get("description", "")),
                expected=c.get("expected", ""),
            )
        )

    return items
