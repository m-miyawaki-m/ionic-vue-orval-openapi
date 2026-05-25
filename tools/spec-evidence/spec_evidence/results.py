"""Parse Vitest JSON results and join them to cases by test title.

The data-driven boundary test (`tests/cases/boundary.spec.ts`) uses each case id
as its `test.each` title, so Vitest assertion titles equal case ids.
"""

import json


def load_vitest_results(paths):
    """Return {test_title: {"status": str, "duration": int|None}} merged over paths."""
    out = {}
    for p in paths:
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        for file_result in data.get("testResults", []):
            for a in file_result.get("assertionResults", []):
                out[a["title"]] = {
                    "status": a["status"],
                    "duration": a.get("duration"),
                }
    return out


def join_status(item_id, results):
    """Return the result dict for an item id, or None if not executed."""
    return results.get(item_id)
