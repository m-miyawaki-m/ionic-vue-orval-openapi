import os
import tempfile
import unittest

from openpyxl import load_workbook

from spec_evidence.template import CATEGORY_COLUMNS, write_template


class TestTemplate(unittest.TestCase):
    def test_template_structure(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "tmpl.xlsx")
            sheets = write_template(p, categories=["画面表示", "API連携"], rows=5, evidence_blocks=2)
            self.assertEqual(sheets[0], "01_表紙")
            self.assertEqual(sheets[1], "02_画面表示")
            self.assertEqual(sheets[2], "03_API連携")
            self.assertEqual(sheets[-1], "04_エビデンス")

            wb = load_workbook(p)

            # cover
            cover = wb["01_表紙"]
            self.assertEqual(cover["B2"].value, "IT テスト確認書")
            legend = [cover.cell(r, 2).value for r in range(23, 27)]
            self.assertEqual(legend, ["OK", "NG", "-", "保留"])
            # 利用データ section present
            labels = [cover.cell(r, 2).value for r in range(1, cover.max_row + 1)]
            self.assertIn("利用データ（テストデータ）", labels)
            self.assertIn("テストアカウント", labels)
            self.assertIn("固定フィクスチャ(Items)", labels)

            # category sheet: 9-column header at row 6
            cat = wb["02_画面表示"]
            headers = [cat.cell(6, c).value for c in range(1, len(CATEGORY_COLUMNS) + 1)]
            self.assertEqual(headers, CATEGORY_COLUMNS)
            # OK/NG dropdown present on result column
            self.assertTrue(len(cat.data_validations.dataValidation) >= 1)

            # evidence sheet has block markers
            ev = wb["04_エビデンス"]
            markers = [c.value for row in ev.iter_rows() for c in row if c.value == "■ エビデンス No."]
            self.assertEqual(len(markers), 2)


if __name__ == "__main__":
    unittest.main()
