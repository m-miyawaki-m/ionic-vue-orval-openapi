import os
import unittest

from spec_evidence.cases import load_cases
from spec_evidence.model import kind_label

FIX = os.path.join(os.path.dirname(__file__), "fixtures")


class TestCases(unittest.TestCase):
    def test_kind_label(self):
        self.assertEqual(kind_label("boundary"), "境界値")
        self.assertEqual(kind_label("operation"), "操作")
        self.assertEqual(kind_label("state"), "状態遷移")
        self.assertEqual(kind_label("unknown"), "unknown")

    def test_load_cases(self):
        items = load_cases(
            os.path.join(FIX, "boundary.sample.json"),
            os.path.join(FIX, "doc.sample.json"),
        )
        self.assertEqual(len(items), 4)
        by_id = {it.id: it for it in items}

        b_ok = by_id["bnd:openapi:item:name:minLength"]
        self.assertEqual(b_ok.screen, "item")
        self.assertEqual(b_ok.perspective, "境界値")
        self.assertEqual(b_ok.action, "name = 'a'")
        self.assertEqual(b_ok.expected, "有効(受理)")

        b_ng = by_id["bnd:openapi:item:name:minLength-1"]
        self.assertEqual(b_ng.action, "name = ''")
        self.assertEqual(b_ng.expected, "無効(拒否)")

        op = by_id["event-spec:item:0"]
        self.assertEqual(op.perspective, "操作")
        self.assertEqual(op.precondition, "一覧表示")
        self.assertEqual(op.action, "リスト行タップ → router.push")
        self.assertEqual(op.expected, "Item詳細へ遷移")

        st = by_id["store-spec:auth:0"]
        self.assertEqual(st.perspective, "状態遷移")


if __name__ == "__main__":
    unittest.main()
