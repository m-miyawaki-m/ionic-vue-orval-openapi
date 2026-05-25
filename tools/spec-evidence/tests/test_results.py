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

    def test_missing_file_is_skipped(self):
        # A nonexistent path must be skipped, not raise.
        r = load_vitest_results([os.path.join(FIX, "does-not-exist.json")])
        self.assertEqual(r, {})

    def test_multiple_files_last_wins(self):
        real = os.path.join(FIX, "vitest.sample.json")
        r = load_vitest_results([os.path.join(FIX, "missing.json"), real])
        # missing skipped, real loaded
        self.assertIn("bnd:openapi:item:name:minLength", r)


if __name__ == "__main__":
    unittest.main()
