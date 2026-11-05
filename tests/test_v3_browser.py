"""Functional regressions for edition 03's standalone HTML.

Run from the repository root after packaging:
    python3 tests/test_v3_browser.py

Requires Python Playwright and Chromium. The exact distributed HTML is served
on loopback and every external request is blocked. Set ATLAS_TEST_TRANSPORT=file
only in a browser that permits file-origin navigation; the managed browser's
administrator policy currently blocks that transport.
"""
from __future__ import annotations

from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import tempfile
import threading
import unittest

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "dist" / "first-principles-atlas-v3.html"
PRESERVED_ARTIFACTS = {
    "first-principles-atlas-v1.html": "a372140c72a7cba3a559de0c47aada4658c84a5cd259798747ac31c30ae620e0",
    "first-principles-atlas-v2.html": "d006150ea194be468febb25434cb5016e275329ea799b848e2c540a58a1acd49",
    "first-principles-atlas-v1-source.zip": "36b554d792421c6e42f7e82c316f0c6e5b24547144e6d2988de85b095aa22a5d",
    "first-principles-atlas-v2-source.zip": "852d9783d3530ea0bfb50a6ebefd52bb2fca5973a00912172da7ecbdeca16501",
}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class V3BrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not HTML.is_file():
            raise RuntimeError(f"Build edition 03 before running these tests: {HTML}")
        cls.server = None
        if os.environ.get("ATLAS_TEST_TRANSPORT") == "file":
            cls.url = HTML.as_uri()
            cls.origin = "file://"
        else:
            cls.server = ThreadingHTTPServer(
                ("127.0.0.1", 0), partial(QuietHandler, directory=str(HTML.parent))
            )
            cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
            cls.server_thread.start()
            cls.origin = f"http://127.0.0.1:{cls.server.server_port}"
            cls.url = cls.origin + "/" + HTML.name
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH")
            or shutil.which("chromium")
            or shutil.which("google-chrome"),
            headless=True,
            args=["--disable-dev-shm-usage"],
        )

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "browser"):
            cls.browser.close()
        if hasattr(cls, "playwright"):
            cls.playwright.stop()
        if cls.server:
            cls.server.shutdown()
            cls.server.server_close()

    def setUp(self):
        self.errors = []
        self.remote_requests = []
        self.context = self.new_context()
        self.page = self.context.new_page()
        self.watch_page(self.page)
        self.open_atlas()

    def new_context(self, **kwargs):
        context = self.browser.new_context(
            viewport={"width": 1440, "height": 1000},
            offline=self.origin == "file://",
            **kwargs,
        )
        context.route(
            "http://**/*",
            lambda route: route.continue_()
            if route.request.url.startswith(self.origin + "/")
            else route.abort(),
        )
        context.route("https://**/*", lambda route: route.abort())
        return context

    def watch_page(self, page):
        page.set_default_timeout(6000)
        page.on("pageerror", lambda error: self.errors.append(str(error)))
        page.on(
            "request",
            lambda request: self.remote_requests.append(request.url)
            if request.url.startswith(("http://", "https://"))
            and not request.url.startswith(self.origin + "/")
            else None,
        )

    def open_atlas(self, fragment=""):
        self.page.goto(self.url + fragment)
        self.page.wait_for_function("Boolean(window.ATLAS && window.ATLAS_DATA)")

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "JavaScript errors occurred")
            self.assertEqual(self.remote_requests, [], "The standalone app attempted external requests")
        finally:
            self.context.close()

    def state(self):
        return self.page.evaluate("ATLAS.getState()")

    def assert_no_horizontal_overflow(self):
        size = self.page.evaluate(
            "({scroll:document.documentElement.scrollWidth,width:innerWidth})"
        )
        self.assertLessEqual(size["scroll"], size["width"] + 1, size)

    def downloaded_json(self, trigger):
        with self.page.expect_download() as event:
            trigger()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "progress.json"
            event.value.save_as(path)
            return json.loads(path.read_text(encoding="utf-8"))

    def go(self, fragment):
        self.page.evaluate("hash => { location.hash = hash; }", fragment)
        self.page.wait_for_function("hash => location.hash === '#' + hash", arg=fragment)
        self.page.wait_for_timeout(80)

    def open_foundation(self, number=1):
        lesson_id = f"foundations.day{number:02}"
        self.go("lesson/" + lesson_id)
        self.page.locator(".v3-reading-header").wait_for()
        return lesson_id

    def fill_criteria(self, level="2", assistance="none"):
        for select in self.page.locator("[data-foundation-level]").all():
            select.select_option(str(level))
        self.page.locator("[data-foundation-assistance]").select_option(assistance)

    def submit_assessment(self):
        self.page.locator('[data-action="foundation-assess"]').click()

    def import_progress(self, payload, accept=True):
        if accept:
            self.page.once("dialog", lambda dialog: dialog.accept())
        self.page.locator("#import-file").set_input_files({
            "name": "progress.json", "mimeType": "application/json",
            "buffer": json.dumps(payload).encode("utf-8"),
        })
        self.page.wait_for_timeout(120)

    def test_today_has_one_beginner_next_step_and_honest_time_totals(self):
        self.assertEqual(self.state()["version"], 3)
        hero = self.page.locator(".v3-foundation-hero")
        self.assertIn("Make a saved file", hero.inner_text())
        self.assertEqual(hero.locator('[data-action="foundation-open"]').count(), 1)
        plan = self.page.evaluate("ATLAS.foundationPlan()")
        self.assertEqual(plan["activeBudgetMinutes"], 360)
        self.assertEqual(plan["reservedBreakMinutes"], 90)
        self.assertEqual(plan["elapsedCapacityMinutes"], 450)
        self.assertEqual(sum(a["minutes"] for a in plan["allocations"]), 360)
        self.assertEqual({a["taskId"] for a in plan["allocations"]}, {"foundations.day01"})
        self.assertEqual(plan["plannedActiveMinutes"] + plan["unusedActiveMinutes"], 360)

    def test_primary_navigation_and_all_utility_views_work_offline(self):
        primary = self.page.locator("#navigation > a")
        self.assertEqual(primary.count(), 4)
        self.assertEqual(primary.evaluate_all("links => links.map(a => a.hash)"),
                         ["#today", "#journey", "#practice", "#library"])
        for fragment in ["today", "journey", "practice", "library", "overview",
                         "curriculum", "planner", "lab", "portfolio", "evidence", "method"]:
            with self.subTest(view=fragment):
                self.go(fragment)
                self.assertTrue(self.page.locator("#main h1").is_visible())
                self.assertGreater(len(self.page.locator("#main").inner_text()), 200)

    def test_all_six_lessons_have_complete_work_and_assessment_sections(self):
        for number in range(1, 7):
            with self.subTest(day=number):
                lesson_id = self.open_foundation(number)
                self.assertEqual(self.page.locator(".v3-block").count(), 7)
                self.assertEqual(self.page.locator("details.v3-diagnostic").count(), 3)
                self.assertGreaterEqual(self.page.locator("[data-foundation-level]").count(), 3)
                self.assertTrue(self.page.locator("#foundation-note").is_visible())
                self.assertGreater(len(self.page.locator("#foundation-idea").inner_text()), 900)
                self.assertIsNone(self.page.evaluate("id => ATLAS.foundationResult(id)", lesson_id))

    def test_elapsed_mode_reconciles_budget_and_whole_authored_blocks(self):
        self.page.locator(".v3-budget-card details > summary").click()
        self.page.locator("#foundation-time-mode").select_option("elapsed")
        plan = self.page.evaluate("ATLAS.foundationPlan()")
        self.assertEqual(plan["activeBudgetMinutes"], 270)
        self.assertEqual(plan["reservedBreakMinutes"], 90)
        self.assertEqual(plan["elapsedCapacityMinutes"], 360)
        self.assertEqual(plan["plannedActiveMinutes"] + plan["unusedActiveMinutes"], 270)
        self.assertLessEqual(plan["plannedActiveMinutes"], 270)
        authored = self.page.evaluate("Object.fromEntries(ATLAS_DATA.foundations.lessons.flatMap(l => l.blocks.map(b => [l.id+':'+b.id,b.minutes])))")
        for allocation in plan["allocations"]:
            self.assertEqual(allocation["minutes"], authored[allocation["key"]])

    def test_logging_reopening_and_undo_preserve_correct_time_meaning(self):
        lesson_id = self.open_foundation()
        block = self.page.locator(".v3-block").first
        block.locator("input[data-foundation-minutes]").fill("47")
        block.locator('[data-action="foundation-log"]').click()
        state = self.state()
        self.assertEqual(len(state["foundationLogs"]), 1)
        self.assertEqual(state["foundationLogs"][0]["minutes"], 47)
        self.assertEqual(len(state["foundationBlocks"]), 1)
        self.assertEqual(self.page.evaluate("ATLAS.foundationPlan().activeBudgetMinutes"), 313)
        self.assertIsNone(self.page.evaluate("id => ATLAS.foundationResult(id)", lesson_id))
        self.page.locator('[data-action="foundation-reopen"]').first.click()
        state = self.state()
        self.assertEqual(state["foundationBlocks"], [])
        self.assertEqual(state["foundationLogs"][0]["minutes"], 47)
        self.page.locator('[data-action="foundation-undo"]').click()
        self.assertEqual(self.state()["foundationLogs"], [])
        self.assertEqual(self.page.evaluate("ATLAS.foundationPlan().activeBudgetMinutes"), 360)

    def test_invalid_actual_minutes_do_not_mutate_progress(self):
        self.open_foundation()
        before = self.state()
        block = self.page.locator(".v3-block").first
        for invalid in ["-1", "1.5", "1441", ""]:
            with self.subTest(minutes=invalid):
                block.locator("input[data-foundation-minutes]").fill(invalid)
                block.locator('[data-action="foundation-log"]').click()
                self.assertEqual(self.state(), before)

    def test_foundation_and_core_work_share_remaining_daily_capacity(self):
        self.open_foundation()
        block = self.page.locator('.v3-block').first
        block.locator('[data-foundation-minutes]').fill('50')
        block.locator('[data-action="foundation-log"]').click()
        self.go('planner')
        plan = self.page.evaluate('ATLAS.buildPlan()')
        self.assertEqual(plan[0]['logged'], 50)
        self.assertEqual(plan[0]['capacity'], 280)  # 360 - 30 recall/reflection - 50 logged
        self.page.locator('[data-action="log-work"]').first.click()
        logged_core = sum(self.state()['dailyWork'].values())
        self.assertGreater(logged_core, 0)
        self.assertEqual(self.page.evaluate('ATLAS.foundationPlan().activeBudgetMinutes'), 310 - logged_core)

    def test_elapsed_mode_applies_to_core_and_zero_capacity_does_not_loop(self):
        state = self.state()
        state['foundationTimeMode'] = 'elapsed'
        self.import_progress(state)
        self.assertEqual(self.page.evaluate('ATLAS.buildPlan()[0].capacity'), 240)
        state = self.state()
        state['hours'] = 1
        state['foundationBreakMinutes'] = 60
        self.import_progress(state)
        self.assertEqual(self.page.evaluate('ATLAS.foundationPlan().activeBudgetMinutes'), 0)
        self.assertEqual(self.page.evaluate('ATLAS.buildPlan()'), [])
        self.go('planner')
        self.assertIn('No activity capacity', self.page.locator('#main').inner_text())

    def test_editing_a_submitted_assessment_removes_stale_success_feedback(self):
        lesson_id = self.open_foundation()
        self.fill_criteria()
        self.submit_assessment()
        self.assertTrue(self.page.evaluate('id => ATLAS.foundationResult(id).evidenceEligible', lesson_id))
        self.page.locator('[data-foundation-level]').first.select_option('0')
        self.assertIsNone(self.page.evaluate('id => ATLAS.foundationResult(id)', lesson_id))
        self.assertIn('Record this assessment', self.page.locator('.v3-assessment-result').inner_text())
        self.assertNotIn('All required criteria', self.page.locator('.v3-assessment-result').inner_text())

    def test_revealing_diagnostics_never_grants_mastery(self):
        lesson_id = self.open_foundation()
        for summary in self.page.locator("details.v3-diagnostic > summary").all():
            summary.click()
        self.assertIsNone(self.page.evaluate("id => ATLAS.foundationResult(id)", lesson_id))
        self.assertEqual(self.state()["foundationBlocks"], [])
        self.assertEqual(self.state()["mastered"], [])

    def test_assisted_success_stays_practice_and_independent_attempt_unlocks(self):
        lesson_id = self.open_foundation()
        self.fill_criteria(assistance="hint")
        self.submit_assessment()
        result = self.page.evaluate("id => ATLAS.foundationResult(id)", lesson_id)
        self.assertEqual(result["status"], "practice_recorded")
        self.assertFalse(result["evidenceEligible"])
        self.assertIn("practice", self.page.locator(".v3-assessment-result").inner_text().lower())
        self.page.locator("[data-foundation-assistance]").select_option("none")
        self.assertIsNone(self.page.evaluate("id => ATLAS.foundationResult(id)", lesson_id))
        self.submit_assessment()
        result = self.page.evaluate("id => ATLAS.foundationResult(id)", lesson_id)
        self.assertTrue(result["evidenceEligible"])
        self.assertTrue(all(item["verification"] == "self_report" for item in result["criterionResults"]))
        plan = self.page.evaluate("ATLAS.foundationPlan()")
        day_two = next(task for task in plan["taskStates"] if task["taskId"] == "foundations.day02")
        self.assertNotEqual(day_two["state"], "blocked")

    def test_missing_and_failed_evidence_remain_distinct(self):
        lesson_id = self.open_foundation()
        self.submit_assessment()
        incomplete = self.page.evaluate("id => ATLAS.foundationResult(id)", lesson_id)
        self.assertEqual(incomplete["status"], "incomplete")
        self.assertGreater(len(incomplete["missingCriterionIds"]), 0)
        self.fill_criteria()
        self.page.locator("[data-foundation-level]").first.select_option("0")
        self.submit_assessment()
        failed = self.page.evaluate("id => ATLAS.foundationResult(id)", lesson_id)
        self.assertEqual(failed["status"], "repair_recommended")
        self.assertFalse(failed["evidenceEligible"])
        self.assertGreater(len(failed["criticalUnmetIds"]), 0)

    def test_read_ahead_available_without_false_prerequisite_completion(self):
        self.open_foundation(6)
        self.assertIn("Read ahead is available", self.page.locator("#main").inner_text())
        self.assertEqual(self.state()["foundationBlocks"], [])
        plan = self.page.evaluate("ATLAS.foundationPlan()")
        self.assertEqual({a["taskId"] for a in plan["allocations"]}, {"foundations.day01"})

    def test_legacy_migration_retains_original_save_and_notes(self):
        legacy = self.page.evaluate("ATLAS.defaults()")
        for key in list(legacy):
            if key.startswith("foundation") or key == "legacySnapshot":
                legacy.pop(key)
        legacy.update(version=2, completed=["c01-1"], notes={"c01": "Original evidence note"})
        legacy["unknownFutureField"] = {"keep": "historical snapshot"}
        original = json.dumps(legacy, separators=(",", ":"))
        self.page.evaluate("raw => {localStorage.removeItem('first-principles-atlas-v3');localStorage.setItem('first-principles-atlas-v1',raw)}", original)
        self.page.reload()
        self.page.wait_for_function("Boolean(window.ATLAS)")
        migrated = self.state()
        self.assertEqual(migrated["version"], 3)
        self.assertEqual(migrated["notes"]["c01"], "Original evidence note")
        self.assertIn("c01-1", migrated["completed"])
        self.assertEqual(migrated["legacySnapshot"], legacy)
        self.assertEqual(migrated["foundationChecks"], {})
        self.assertEqual(self.page.evaluate("localStorage.getItem('first-principles-atlas-v1')"), original)

    def test_export_import_round_trip_preserves_foundation_evidence(self):
        lesson_id = self.open_foundation()
        self.page.locator("#foundation-note").fill("Reproduced calculation; edge case zero checked.")
        self.fill_criteria()
        self.submit_assessment()
        exported = self.downloaded_json(lambda: self.page.locator('.sidebar [data-action="export"]').click())
        self.assertEqual(exported["version"], 3)
        self.assertTrue(exported["foundationChecks"][lesson_id]["submitted"])
        self.page.locator("#foundation-note").fill("A later temporary note")
        self.import_progress(exported)
        self.assertEqual(self.state()["foundationNotes"], exported["foundationNotes"])
        self.assertEqual(self.state()["foundationChecks"], exported["foundationChecks"])

    def test_invalid_import_preserves_existing_progress(self):
        self.open_foundation()
        self.page.locator("#foundation-note").fill("Keep this evidence.")
        before = self.state()
        bad = json.loads(json.dumps(before))
        bad["foundationBlocks"] = ["unknown:block"]
        self.import_progress(bad, accept=False)
        self.assertEqual(self.state(), before)
        self.assertIn("Import rejected", self.page.locator("#toast").inner_text())

    def test_denied_storage_allows_work_and_json_export(self):
        self.context.add_init_script("""Object.defineProperty(window, 'localStorage', {get(){throw new DOMException('Blocked for test','SecurityError')}});""")
        self.page.reload()
        self.page.wait_for_function("Boolean(window.ATLAS)")
        self.assertTrue(self.page.locator(".storage-warning").is_visible())
        lesson_id = self.open_foundation()
        self.page.locator("#foundation-note").fill("This unsaved note must be exportable.")
        exported = self.downloaded_json(lambda: self.page.locator('.sidebar [data-action="export"]').click())
        self.assertEqual(exported["foundationNotes"][lesson_id], "This unsaved note must be exportable.")

    def test_imported_notes_are_text_and_not_executable_markup(self):
        lesson_id = self.open_foundation()
        payload = self.state()
        malicious = '</textarea><img src=x onerror="window.injected=true"><script>window.injected=true</script>'
        payload["foundationNotes"][lesson_id] = malicious
        self.import_progress(payload)
        self.open_foundation()
        self.assertEqual(self.page.locator("#foundation-note").input_value(), malicious)
        self.assertIsNone(self.page.evaluate("window.injected"))
        self.assertEqual(self.page.locator("#main img").count(), 0)

    def test_each_module_has_a_distinct_transfer_task_and_repair(self):
        self.go("curriculum")
        modules = self.page.evaluate("ATLAS_DATA.modules.map(m=>m.id)")
        self.assertEqual(len(modules), 41)
        for module_id in modules:
            with self.subTest(module=module_id):
                self.page.evaluate("id => {const b=document.createElement('button');b.dataset.action='module';b.dataset.id=id;document.body.append(b);b.click();b.remove();}", module_id)
                dialog = self.page.locator("#lesson-dialog")
                self.assertTrue(dialog.is_visible())
                section = dialog.locator(".v3-module-guidance")
                self.assertEqual(section.count(), 1)
                self.assertGreaterEqual(section.locator(".v3-module-rubric li").count(), 3)
                self.assertIn("Repair this specific misconception", section.inner_text())
                self.page.keyboard.press("Escape")

    def test_current_research_shows_sources_job_sample_and_scope(self):
        self.go("evidence")
        current = self.page.locator(".v3-market-review")
        self.assertEqual(current.locator('[id^="source-V3E"]').count(), 9)
        self.assertEqual(current.locator("table tbody tr").count(), 10)
        self.assertIn("not representative", current.inner_text())
        self.assertIn("2026-11-04", current.inner_text())
        self.assertNotIn("undefined", current.inner_text())

    def test_practice_transfer_action_restores_context_after_focused_reading(self):
        self.go('curriculum')
        self.page.locator('.module-card button[data-id="c01"]').click()
        self.page.locator('[data-action="focus-mode"]').click()
        self.page.keyboard.press('Escape')
        self.go('practice')
        self.page.locator('[data-action="module-transfer"]').first.click()
        self.assertFalse(self.page.locator('#lesson-dialog').evaluate("el => el.classList.contains('focus-mode')"))
        self.assertTrue(self.page.locator('#lesson-dialog .v3-module-guidance').is_visible())

    def test_concept_search_includes_new_foundation_lessons(self):
        self.page.locator('[data-action="search"]').click()
        self.page.locator('#command-search').fill('saved file')
        self.page.locator('#command-results [data-action="foundation-open"]').first.click()
        self.page.locator('.v3-reading-header').wait_for()
        self.assertFalse(self.page.locator('#command-dialog').is_visible())
        self.assertIn('foundations.day01', self.page.evaluate('location.hash'))
    def test_keyboard_skip_link_and_lesson_contents_keep_focus_visible(self):
        self.page.keyboard.press("Tab")
        self.assertEqual(self.page.evaluate("document.activeElement.textContent.trim()"), "Skip to content")
        self.assertTrue(self.page.locator(".skip").is_visible())
        self.page.keyboard.press("Enter")
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "main")
        self.open_foundation(3)
        reading_hash = self.page.evaluate("location.hash")
        self.page.locator(".skip").focus()
        self.page.keyboard.press("Enter")
        self.assertEqual(self.page.evaluate("location.hash"), reading_hash)
        self.assertTrue(self.page.locator(".v3-reading-header").is_visible())
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "main")
        button = self.page.locator('[data-action="foundation-jump"][data-target="foundation-check"]')
        button.focus()
        self.page.keyboard.press("Enter")
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "foundation-check")

    def test_small_viewports_and_text_zoom_do_not_overflow(self):
        for width in [320, 390, 768, 1440]:
            self.page.set_viewport_size({"width": width, "height": 1000})
            for fragment in ["today", "lesson/foundations.day01", "practice", "evidence"]:
                with self.subTest(width=width, view=fragment):
                    self.go(fragment)
                    self.assert_no_horizontal_overflow()
        self.page.set_viewport_size({"width": 768, "height": 1000})
        self.go("lesson/foundations.day01")
        self.page.add_style_tag(content="html {font-size:200% !important;}")
        self.assert_no_horizontal_overflow()

    def test_downloaded_worked_example_matches_visible_curriculum(self):
        lesson_id = self.open_foundation(6)
        with self.page.expect_download() as event:
            self.page.locator('[data-action="foundation-download"]').click()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "example.py"
            event.value.save_as(output)
            expected = self.page.evaluate("id => ATLAS_DATA.foundations.lessons.find(l=>l.id===id).workedExample.code", lesson_id)
            self.assertEqual(output.read_text(), expected)

    def test_print_layout_retains_lesson_content_and_hides_workspace_controls(self):
        self.open_foundation(6)
        self.page.emulate_media(media="print")
        self.assertFalse(self.page.locator(".sidebar").is_visible())
        self.assertFalse(self.page.locator(".topbar").is_visible())
        self.assertFalse(self.page.locator(".v3-lesson-toc").is_visible())
        for selector in ["#foundation-idea", "#foundation-example", "#foundation-independent", "#foundation-transfer"]:
            self.assertTrue(self.page.locator(selector).is_visible())
        self.assertEqual(self.page.locator("#foundation-example pre.code-block").evaluate("el => getComputedStyle(el).whiteSpace"), "pre-wrap")
        self.assertTrue(self.page.pdf().startswith(b"%PDF"))

    def test_earlier_editions_are_preserved_byte_for_byte(self):
        for name, expected in PRESERVED_ARTIFACTS.items():
            with self.subTest(artifact=name):
                actual = hashlib.sha256((ROOT / "dist" / name).read_bytes()).hexdigest()
                self.assertEqual(actual, expected)


if __name__ == "__main__":
    unittest.main(verbosity=2)
