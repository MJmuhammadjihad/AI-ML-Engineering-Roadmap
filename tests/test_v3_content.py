"""Reproduce edition 03's executable examples and learning-data contracts.

Only the authored worked programs are executed. Independent-task tables remain
blank learner evidence; passing this suite does not complete a learner's work.
Requires only the Python standard library. Run: python3 tests/test_v3_content.py
"""
from __future__ import annotations

import ast
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
FOUNDATIONS = json.loads((ROOT / "src/foundations.json").read_text(encoding="utf-8"))
LESSONS = FOUNDATIONS["lessons"]
GUIDANCE = json.loads((ROOT / "src/module-guidance.json").read_text(encoding="utf-8"))
CORE = json.loads((ROOT / "src/data.json").read_text(encoding="utf-8"))


class ContentTests(unittest.TestCase):
    program_runs = 0

    def run_program(self, code, stdin=""):
        """Use a saved file, isolated interpreter, and bounded execution time."""
        with tempfile.TemporaryDirectory(prefix="atlas-example-") as directory:
            path = Path(directory) / "example.py"
            path.write_text(code, encoding="utf-8")
            result = subprocess.run(
                [sys.executable, "-I", "-S", str(path)],
                input=stdin,
                capture_output=True,
                text=True,
                encoding="utf-8",
                cwd=directory,
                timeout=5,
                check=False,
            )
        type(self).program_runs += 1
        return result

    def run_lesson(self, number, inputs=None):
        example = LESSONS[number - 1]["workedExample"]
        stdin = example.get("stdin", "") if inputs is None else "\n".join(map(str, inputs)) + "\n"
        return self.run_program(example["code"], stdin)

    def successful(self, result):
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "")
        return result.stdout

    def test_prerequisites_resolve_before_their_dependents(self):
        self.assertEqual(len(LESSONS), 6)
        seen_lessons, seen_skills = set(), set()
        for lesson in LESSONS:
            with self.subTest(lesson=lesson["id"]):
                self.assertNotIn(lesson["id"], seen_lessons)
                self.assertLessEqual(set(lesson["prerequisiteLessonIds"]), seen_lessons)
                self.assertLessEqual(set(lesson["prerequisiteSkillIds"]), seen_skills)
                self.assertTrue(lesson["skillIds"])
                self.assertEqual(len(set(lesson["skillIds"])), len(lesson["skillIds"]))
                seen_lessons.add(lesson["id"])
                seen_skills.update(lesson["skillIds"])

    def test_daily_minutes_and_authored_blocks_reconcile(self):
        block_keys = set()
        for lesson in LESSONS:
            with self.subTest(lesson=lesson["id"]):
                self.assertEqual(sum(b["minutes"] for b in lesson["blocks"]), 360)
                self.assertEqual(lesson["activeMinutes"], 360)
                breaks = lesson["breaks"]
                self.assertEqual(breaks["elapsedMinutes"], 360 + breaks["minutes"])
                self.assertEqual(sum(breaks["afterBlockMinutes"]), breaks["minutes"])
                for block in lesson["blocks"]:
                    key = (lesson["id"], block["id"])
                    self.assertNotIn(key, block_keys)
                    block_keys.add(key)
                    self.assertIs(type(block["minutes"]), int)
                    self.assertGreater(block["minutes"], 0)
                    self.assertTrue(block["actions"])
                    self.assertTrue(block["evidence"])

    def test_diagnostics_have_specific_repair_and_distinct_ids(self):
        identifiers = set()
        for lesson in LESSONS:
            self.assertGreaterEqual(len(lesson["diagnostics"]), 3)
            for item in lesson["diagnostics"]:
                self.assertNotIn(item["id"], identifiers)
                identifiers.add(item["id"])
                for field in ("prompt", "answer", "reason", "misconception", "repairExercise"):
                    self.assertTrue(item[field].strip(), (lesson["id"], field))
            for criterion in lesson["independentTask"]["rubric"]:
                self.assertNotIn(criterion["id"], identifiers)
                identifiers.add(criterion["id"])
                self.assertTrue(criterion["requirement"].strip())
                self.assertIs(type(criterion["critical"]), bool)

    def test_author_validation_never_prefills_learner_test_results(self):
        for lesson in LESSONS:
            for case in lesson["independentTask"]["tests"]:
                self.assertIsNone(case["actualResult"])
                self.assertEqual(case["learnerStatus"], "not_run")

    def test_guidance_covers_every_module_with_observable_evidence(self):
        self.assertEqual(set(GUIDANCE["modules"]), {module["id"] for module in CORE["modules"]})
        criterion_ids = set()
        for mid, guide in GUIDANCE["modules"].items():
            with self.subTest(module=mid):
                for field in ("capability", "readinessPrerequisites", "transferTask", "rubric", "repair", "interview", "boundary"):
                    self.assertTrue(guide[field])
                self.assertTrue(guide["transferTask"]["prompt"])
                self.assertTrue(guide["transferTask"]["acceptance"])
                for field in ("trigger", "exercise", "recheck"):
                    self.assertTrue(guide["repair"][field])
                self.assertGreaterEqual(len(guide["rubric"]), 3)
                for criterion in guide["rubric"]:
                    self.assertNotIn(criterion["id"], criterion_ids)
                    criterion_ids.add(criterion["id"])
                    self.assertTrue(criterion["text"])

    def test_first_saved_file_example(self):
        guide = LESSONS[0]["setupGuide"]
        self.assertEqual(self.successful(self.run_program(guide["firstFileCode"])), guide["expectedOutput"])

    def test_day02_conversions_around_complete_hours(self):
        for active, breaks, expected_active, expected_elapsed in [
            (0, 0, "0 h 0 min", "0 h 0 min"),
            (59, 0, "0 h 59 min", "0 h 59 min"),
            (60, 15, "1 h 0 min", "1 h 15 min"),
            (61, 59, "1 h 1 min", "2 h 0 min"),
        ]:
            with self.subTest(active=active, breaks=breaks):
                output = self.successful(self.run_lesson(2, [active, 0, 0, breaks]))
                self.assertIn("Active study: " + expected_active + "\n", output)
                self.assertIn("Elapsed time: " + expected_elapsed + "\n", output)

    def test_early_lessons_disclose_unhandled_text_conversion(self):
        for number in (2, 3, 4):
            with self.subTest(lesson=number):
                result = self.run_lesson(number, ["12.5"])
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("ValueError", result.stderr)

    def test_day03_invalid_ranges_never_print_success(self):
        cases = [
            ([-1, 0], "active minutes cannot be negative"),
            ([1441, 0], "active minutes exceed"),
            ([0, -1], "break minutes cannot be negative"),
            ([0, 1441], "break minutes exceed"),
            ([1000, 500], "combined time exceeds"),
        ]
        for inputs, expected in cases:
            with self.subTest(inputs=inputs):
                output = self.successful(self.run_lesson(3, inputs))
                self.assertIn(expected, output)
                self.assertNotIn("Elapsed time:", output)
                self.assertNotIn("target", output)

    def test_day03_inclusive_boundaries_and_exclusive_classification(self):
        cases = [
            ([0, 0], "0 h 0 min", "Below target by 360"),
            ([359, 1], "6 h 0 min", "Below target by 1"),
            ([360, 90], "7 h 30 min", "Exactly at the 360-minute"),
            ([361, 59], "7 h 0 min", "Above target by 1"),
            ([1440, 0], "24 h 0 min", "Above target by 1080"),
        ]
        for inputs, elapsed, classification in cases:
            with self.subTest(inputs=inputs):
                output = self.successful(self.run_lesson(3, inputs))
                self.assertIn("Elapsed time: " + elapsed + "\n", output)
                self.assertIn(classification, output)
                self.assertEqual(sum(output.count(label) for label in ("Below target", "Exactly at", "Above target")), 1)

    def test_day04_accumulator_keeps_every_iteration(self):
        cases = [
            ([0, 0, 0, 0], [0, 0, 0], 0, 360),
            ([10, 20, 30, 15], [10, 30, 60], 75, 300),
            ([90, 120, 150, 90], [90, 210, 360], 450, 0),
            ([150, 150, 100, 20], [150, 300, 400], 420, -40),
        ]
        for inputs, totals, elapsed, remaining in cases:
            with self.subTest(inputs=inputs):
                output = self.successful(self.run_lesson(4, inputs))
                observed = [int(line.rsplit(":", 1)[1]) for line in output.splitlines() if line.startswith("Running active minutes:")]
                self.assertEqual(observed, totals)
                self.assertIn(f"Elapsed minutes: {elapsed}\n", output)
                self.assertIn(f"Active minutes remaining: {remaining}\n", output)

    def test_day05_pure_helpers_return_values_for_fresh_calls(self):
        code = LESSONS[4]["workedExample"]["code"]
        # Extract authored definitions so their top-level print demonstration is
        # not mistaken for an output side effect of the functions themselves.
        definitions = "\n\n".join(
            ast.get_source_segment(code, node)
            for node in ast.parse(code).body
            if isinstance(node, ast.FunctionDef)
        )
        harness = '''
import contextlib
import io
buffer = io.StringIO()
with contextlib.redirect_stdout(buffer):
    assert add_study_blocks(0, 0, 0) == 0
    assert add_study_blocks(10, 20, 30) == 60
    assert add_study_blocks(90, 120, 150) == 360
    assert remaining_minutes(360, 0) == 360
    assert remaining_minutes(360, 360) == 0
    assert remaining_minutes(360, 380) == -20
    assert remaining_minutes(300, 80) == 220
    assert type(remaining_minutes(300, 80)) is int
assert buffer.getvalue() == "", "Pure calculations printed a value"
print("Fresh-call contracts passed")
'''
        self.assertEqual(self.successful(self.run_program(definitions + harness)), "Fresh-call contracts passed\n")

    def test_day06_valid_plans_conserve_capacity_without_filler(self):
        cases = [
            ([0, 0, 0, 0], 0, 360, "0 h 0 min"),
            ([60, 90, 120, 90], 270, 90, "6 h 0 min"),
            ([120, 120, 120, 90], 360, 0, "7 h 30 min"),
            ([120, 120, 120, 1080], 360, 0, "24 h 0 min"),
        ]
        for inputs, planned, unassigned, elapsed in cases:
            with self.subTest(inputs=inputs):
                output = self.successful(self.run_lesson(6, inputs))
                self.assertIn(f"Study planned: {planned} min\n", output)
                self.assertIn(f"Study unassigned: {unassigned} min\n", output)
                self.assertIn(f"Breaks reserved: {inputs[-1]} min\n", output)
                self.assertIn("Study plus break allowance: " + elapsed + "\n", output)
                self.assertNotIn("completed", output.lower())

    def test_day06_rejects_individual_and_combined_invalid_inputs(self):
        cases = [
            ([-10, 20, 30, 0], "study blocks cannot be negative"),
            ([10, -20, 30, 0], "study blocks cannot be negative"),
            ([10, 20, -30, 0], "study blocks cannot be negative"),
            ([0, 0, 0, -1], "break minutes cannot be negative"),
            ([0, 0, 0, 1441], "break allowance exceeds"),
            ([100, 100, 100, 1200], "combined time exceeds"),
            ([120, 120, 121, 0], "study blocks exceed available active time"),
        ]
        for inputs, expected in cases:
            with self.subTest(inputs=inputs):
                output = self.successful(self.run_lesson(6, inputs))
                self.assertIn(expected, output)
                self.assertEqual(output.count("Invalid:"), 1)
                self.assertNotIn("Study planned:", output)
                self.assertNotIn("Study unassigned:", output)

    def test_day06_malformed_text_stops_at_the_failed_conversion(self):
        for position in range(4):
            for invalid in ("twelve", "12.5"):
                with self.subTest(position=position, invalid=invalid):
                    output = self.successful(self.run_lesson(6, ["10"] * position + [invalid]))
                    self.assertIn("Invalid input: use whole-number minute values.\n", output)
                    self.assertEqual(output.count("minutes?"), position + 1)
                    self.assertNotIn("Study planned:", output)

    def test_exception_mini_lesson_separates_conversion_and_range_rules(self):
        mini = LESSONS[-1]["exceptionMiniLesson"]
        self.assertEqual(self.successful(self.run_program(mini["code"])), mini["expectedOutput"])
        for text, expected in [("12", "Minutes: 12\n"), ("-5", "Minutes: -5\n")]:
            with self.subTest(text=text):
                code = mini["code"].replace('text = "twelve"', 'text = ' + repr(text), 1)
                self.assertEqual(self.successful(self.run_program(code)), expected)

    @classmethod
    def tearDownClass(cls):
        print(f"Authored-example checks executed {cls.program_runs} isolated Python processes.")


def worked_example_test(index):
    def test(self):
        example = LESSONS[index]["workedExample"]
        self.assertEqual(self.successful(self.run_lesson(index + 1)), example["expectedOutput"])
    return test


for day in range(1, 7):
    setattr(ContentTests, f"test_day{day:02}_authored_worked_example", worked_example_test(day - 1))


if __name__ == "__main__":
    unittest.main(verbosity=2)
