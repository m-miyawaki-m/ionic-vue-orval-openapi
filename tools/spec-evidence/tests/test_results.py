import os
import unittest

from spec_evidence.results import join_status, load_vitest_results

FIX = os.path.join(os.path.dirname(__file__), "fixtures")


class TestResults(unittest.TestCase):
    def test_load_and_join(self):
        r = load_vitest_results([os.path.join(FIX, "vitest.sample.json")])
        self.assertEqual(r["bnd:openapi:item:name:minLength"]["status"], "passed")
        self.assertEqual(r["bnd:openapi:item:name:minLength-1"]["status"], "failed")
        self.assertIsNone(join_status("nonexistent", r))
        self.assertEqual(join_status("bnd:openapi:item:name:minLength", r)["status"], "passed")


if __name__ == "__main__":
    unittest.main()
