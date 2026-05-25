"""CLI: read cases.json + Vitest results, write test-spec.{md,xlsx} and evidence.xlsx."""

import argparse
import os
from datetime import datetime

from .cases import load_cases
from .results import load_vitest_results
from .spec_doc import write_spec_md, write_spec_xlsx
from .evidence import write_evidence_xlsx

# tools/spec-evidence  (this file is tools/spec-evidence/spec_evidence/cli.py)
_TOOL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REPO = os.path.dirname(os.path.dirname(_TOOL_DIR))  # tools/ -> repo root
_FE = os.path.join(_REPO, "frontend")


def main(argv=None):
    p = argparse.ArgumentParser(
        prog="spec-evidence",
        description="Generate test spec + evidence Excel from gen-cases cases.json and Vitest results.",
    )
    p.add_argument("--boundary", default=os.path.join(_FE, "tests", "cases", "boundary.cases.json"))
    p.add_argument("--doc", default=os.path.join(_FE, "tests", "cases", "doc.cases.json"))
    p.add_argument(
        "--results",
        nargs="*",
        default=[os.path.join(_FE, "vitest-results", "unit-results.json")],
        help="Vitest JSON result files (missing files are skipped).",
    )
    p.add_argument("--out-dir", default=os.path.join(_TOOL_DIR, "out"))
    args = p.parse_args(argv)

    items = load_cases(args.boundary, args.doc)
    results = {}
    for rp in args.results:
        if os.path.exists(rp):
            results.update(load_vitest_results([rp]))
    run_time = datetime.now().isoformat(timespec="seconds")

    os.makedirs(args.out_dir, exist_ok=True)
    write_spec_md(items, os.path.join(args.out_dir, "test-spec.md"))
    write_spec_xlsx(items, os.path.join(args.out_dir, "test-spec.xlsx"))
    write_evidence_xlsx(items, results, run_time, os.path.join(args.out_dir, "evidence.xlsx"))

    measured = sum(1 for it in items if it.id in results)
    print(
        f"Generated {len(items)} items ({measured} measured) -> {args.out_dir}: "
        "test-spec.md, test-spec.xlsx, evidence.xlsx"
    )
    return 0
