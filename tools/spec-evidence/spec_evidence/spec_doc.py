"""Generate the test specification (テスト仕様書) as Markdown and xlsx."""

from openpyxl import Workbook

HEADERS = ["ID", "画面", "観点", "前提", "操作・入力", "期待結果"]


def _row(it):
    return [it.id, it.screen, it.perspective, it.precondition, it.action, it.expected]


def write_spec_md(items, path):
    """Write a Markdown table; return the text written."""
    lines = [
        "# テスト仕様書",
        "",
        "1行 = 1テスト項目（`gen-cases` の cases.json 由来）。",
        "",
        "| " + " | ".join(HEADERS) + " |",
        "|" + "|".join(["---"] * len(HEADERS)) + "|",
    ]
    for it in items:
        cells = [str(x).replace("|", "\\|") for x in _row(it)]
        lines.append("| " + " | ".join(cells) + " |")
    text = "\n".join(lines) + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return text


def write_spec_xlsx(items, path):
    """Write a single-sheet xlsx with the spec table."""
    wb = Workbook()
    ws = wb.active
    ws.title = "テスト仕様書"
    ws.append(HEADERS)
    for it in items:
        ws.append(_row(it))
    wb.save(path)
