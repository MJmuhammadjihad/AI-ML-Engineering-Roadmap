"""Browser regressions for the standalone atlas.

Run from the repository root: python3 -m unittest discover -s tests -v
Requires Python Playwright and a Chromium executable (CHROMIUM_PATH override).
The artifact is served by a local loopback test server; all external requests
are blocked. Set ATLAS_TEST_TRANSPORT=file to test direct file-origin behavior
in a browser that permits it (the managed cloud browser blocks file:// URLs).
"""
from __future__ import annotations

import json
import os
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import tempfile
import threading
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "dist" / "first-principles-atlas.html"
KEY = "first-principles-atlas-v1"
VIEWS = ("overview", "journey", "curriculum", "planner", "lab", "portfolio", "evidence", "library", "method")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class AtlasBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not HTML.is_file():
            raise RuntimeError(f"Build the atlas before running tests: {HTML}")
        cls.server = None
        if os.environ.get("ATLAS_TEST_TRANSPORT") == "file":
            cls.url = HTML.as_uri()
            cls.origin = "file://"
        else:
            cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(HTML.parent)))
            cls.server_thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
            cls.server_thread.start()
            cls.origin = f"http://127.0.0.1:{cls.server.server_port}"
            cls.url = cls.origin + "/" + HTML.name
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome"),
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
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 1000}, offline=self.origin == "file://")
        self.errors = []
        self.remote_requests = []
        self.context.route("http://**/*", lambda route: route.continue_() if route.request.url.startswith(self.origin + "/") else route.abort())
        self.context.route("https://**/*", lambda route: route.abort())
        self.page = self.context.new_page()
        self.page.set_default_timeout(6000)
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("request", lambda request: self.remote_requests.append(request.url) if request.url.startswith(("http://", "https://")) and not request.url.startswith(self.origin + "/") else None)
        self.page.goto(self.url)
        self.page.wait_for_function("Boolean(window.ATLAS && window.ATLAS_DATA)")

    def tearDown(self):
        try:
            self.assertEqual(self.errors, [], "JavaScript errors were raised")
            self.assertEqual(self.remote_requests, [], "The atlas attempted a remote request")
        finally:
            self.context.close()

    def navigate(self, view):
        self.page.locator(f'#navigation a[href="#{view}"]').click()
        self.page.wait_for_function("v => document.querySelector('#navigation [aria-current=page]')?.getAttribute('href') === '#' + v", arg=view)

    def state(self):
        return self.page.evaluate("window.ATLAS.getState()")

    def set_range(self, selector, value):
        self.page.locator(selector).evaluate("(el, value) => { el.value = String(value); el.dispatchEvent(new Event('input', {bubbles:true})); }", value)

    def assert_no_horizontal_overflow(self):
        size = self.page.evaluate("({scroll:document.documentElement.scrollWidth,width:window.innerWidth})")
        self.assertLessEqual(size["scroll"], size["width"] + 1, size)

    def import_progress(self, data, accept=True):
        self.page.once("dialog", lambda dialog: dialog.accept() if accept else dialog.dismiss())
        self.page.locator("#import-file").set_input_files({
            "name": "progress.json", "mimeType": "application/json",
            "buffer": json.dumps(data).encode(),
        })

    def test_all_views_offline_and_responsive(self):
        screenshot_dir = Path(os.environ.get("ATLAS_SCREENSHOT_DIR", str(Path(tempfile.gettempdir()) / "first-principles-atlas-tests")))
        screenshot_dir.mkdir(parents=True, exist_ok=True)
        for label, viewport in [("desktop", {"width": 1440, "height": 1000}), ("tablet", {"width": 768, "height": 1024}), ("mobile", {"width": 390, "height": 844}), ("narrow", {"width": 320, "height": 720})]:
            self.page.set_viewport_size(viewport)
            for view in VIEWS:
                with self.subTest(view=view, viewport=label):
                    self.navigate(view)
                    self.assertGreater(len(self.page.locator("#main").inner_text()), 200)
                    self.assert_no_horizontal_overflow()
                    if view == "overview":
                        self.page.screenshot(path=str(screenshot_dir / f"{label}.png"), full_page=True)

    def test_every_module_opens_five_substantive_sessions(self):
        self.navigate("curriculum")
        ids = self.page.evaluate("window.ATLAS_DATA.modules.map(m => m.id)")
        self.assertEqual(len(ids), 41)
        self.assertEqual(self.page.locator(".module-card").count(), len(ids))
        for module_id in ids:
            with self.subTest(module=module_id):
                self.page.locator(f'.module-card button[data-id="{module_id}"]').click()
                self.assertTrue(self.page.locator("#lesson-dialog").is_visible())
                self.assertEqual(self.page.locator("#lesson-dialog details.lesson").count(), 5)
                self.assertGreater(len(self.page.locator("#dialog-title").inner_text()), 5)
                self.assertEqual(self.page.locator("#lesson-dialog .answer").count(), 5)
                self.page.locator("#lesson-dialog .worked-example > summary").click()
                self.assertGreater(len(self.page.locator("#lesson-dialog .worked-example code").inner_text()), 25)
                self.assertEqual(self.page.locator(f'#lesson-dialog [data-action="answer"][data-id="{module_id}"]').count(), 4)
                self.page.keyboard.press("Escape")
                self.assertFalse(self.page.locator("#lesson-dialog").is_visible())

    def test_search_keeps_focus_and_filters_results(self):
        self.navigate("curriculum")
        self.page.locator("#curriculum-search").press_sequentially("probability")
        self.assertEqual(self.page.locator("#curriculum-search").input_value(), "probability")
        self.assertTrue(self.page.locator("#curriculum-search").evaluate("el => el === document.activeElement"))
        self.assertGreater(self.page.locator(".module-card").count(), 0)
        self.assertLess(self.page.locator(".module-card").count(), 41)
        self.page.locator("#curriculum-search").fill("zzzz_unfindable_zzzz")
        self.assertEqual(self.page.locator(".module-card").count(), 0)
        self.assertIn("No matching modules", self.page.locator("#main").inner_text())
        self.page.locator("#curriculum-search").fill("")
        self.assertEqual(self.page.locator(".module-card").count(), 41)
        self.navigate("library")
        self.page.locator("#library-search").fill("Python")
        self.assertGreater(self.page.locator(".source-card").count(), 0)
        self.assertLess(self.page.locator(".source-card").count(), 32)

    def test_routes_obey_dependencies_and_conserve_study_minutes(self):
        self.navigate("planner")
        for route in ("ai", "ml", "research", "fullstack", "all"):
            with self.subTest(route=route):
                self.page.locator('select[data-setting="track"]').select_option(route)
                result = self.page.evaluate("""() => ({
                    selected: ATLAS.selectedModules(), modules: ATLAS_DATA.modules,
                    queue: ATLAS.taskQueue(), plan: ATLAS.buildPlan(), state: ATLAS.getState(),
                    projects: ATLAS.projects
                })""")
                selected = result["selected"]
                self.assertEqual(len(selected), len(set(selected)))
                module_map = {m["id"]: m for m in result["modules"]}
                for module_id in selected:
                    for prerequisite in module_map[module_id]["prerequisites"]:
                        self.assertIn(prerequisite, selected)
                        self.assertLess(selected.index(prerequisite), selected.index(module_id))
                budget = result["state"]["hours"] * 60 - 30
                self.assertEqual(sum(t["minutes"] for t in result["queue"]), sum(day["used"] for day in result["plan"]))
                for day in result["plan"]:
                    self.assertGreater(day["used"], 0)
                    self.assertLessEqual(day["used"], day["capacity"])
                    self.assertLessEqual(day["used"] + day["logged"], budget)
                    self.assertEqual(day["used"], sum(t["allocated"] for t in day["tasks"]))
                    self.assertTrue(all(0 < t["allocated"] <= result["state"]["blockMinutes"] for t in day["tasks"]))
                queue = result["queue"]
                for project in result["projects"]:
                    positions = [i for i, t in enumerate(queue) if t["kind"] == "project" and t["id"] == project["id"]]
                    if positions:
                        for prerequisite in project["prerequisites"]:
                            prerequisite_end = max(i for i, t in enumerate(queue) if t["id"] == prerequisite)
                            self.assertLess(prerequisite_end, min(positions))
                self.assertEqual(result["state"]["track"], route)
        self.assertEqual(len(self.page.evaluate("ATLAS.selectedModules()")), 41)

    def test_day_budget_and_rest_days_change_without_losing_work(self):
        self.navigate("planner")
        original = self.page.evaluate("ATLAS.buildPlan().reduce((n,d)=>n+d.used,0)")
        self.page.locator('[data-setting="hours"]').fill("6")
        self.page.locator('[data-setting="hours"]').press("Tab")
        self.page.locator('[data-setting="days"]').select_option("5")
        self.page.locator('[data-setting="start"]').fill("2026-10-28")
        self.page.locator('[data-setting="start"]').press("Tab")
        plan = self.page.evaluate("ATLAS.buildPlan()")
        self.assertEqual(sum(day["used"] for day in plan), original)
        self.assertEqual(plan[0]["date"], "2026-10-28")
        self.assertEqual(plan[4]["date"], "2026-11-01")
        self.assertEqual(plan[5]["date"], "2026-11-04")
        self.assertEqual(plan[0]["used"] + 30, 360)
        self.page.locator('[data-setting="hours"]').fill("1")
        self.page.locator('[data-setting="hours"]').press("Tab")
        shorter_days = self.page.evaluate("ATLAS.buildPlan()")
        self.assertGreater(len(shorter_days), len(plan))
        self.assertTrue(all(day["used"] <= 30 for day in shorter_days))
        self.assertEqual(sum(day["used"] for day in shorter_days), original)

    def test_labs_use_correct_numeric_models(self):
        self.navigate("lab")
        self.assertIn("15.4%", self.page.locator("#bayes-output").inner_text())
        self.set_range("#bayes-prevalence", 20)
        self.assertIn("81.8%", self.page.locator("#bayes-output").inner_text())
        self.set_range("#gd-rate", 0.5)
        self.set_range("#gd-steps", 1)
        self.assertEqual(self.page.locator("#gd-output strong").all_text_contents(), ["3.000", "0.000"])
        self.set_range("#gd-rate", 1)
        self.set_range("#gd-steps", 6)
        self.assertEqual(self.page.locator("#gd-output strong").all_text_contents(), ["-1.000", "16.000"])
        self.set_range("#cm-threshold", 1)
        self.assertEqual(self.page.locator("#cm-output strong").all_text_contents(), ["80.0%", "undefined", "0.0%", "0.0%"])
        self.set_range("#cm-threshold", 0)
        self.assertEqual(self.page.locator("#cm-output strong").all_text_contents(), ["20.0%", "20.0%", "100.0%", "33.3%"])
        self.assertIn("4 shared people", self.page.locator("#split-output").inner_text())
        self.page.locator("#split-method").select_option("entity")
        self.assertIn("0 shared people", self.page.locator("#split-output").inner_text())
        self.assertEqual(self.page.locator("#cost-output-box strong").all_text_contents(), ["$0.00280", "$28.00"])
        self.page.locator("#cost-k").fill("0")
        self.assertEqual(self.page.locator("#cost-output-box strong").all_text_contents(), ["$0.00180", "$18.00"])
        self.page.locator("#cost-input").fill("-1")
        self.assertIn("Enter non-negative values", self.page.locator("#cost-output-box").inner_text())

    def test_practice_mastery_evidence_and_persistence(self):
        self.navigate("curriculum")
        self.page.locator('.module-card button[data-id="c01"]').click()
        self.assertTrue(self.page.locator("#mastery-button").is_disabled())
        for index in range(5):
            lesson = self.page.locator(f"#lesson-c01-{index+1}")
            if not lesson.get_attribute("open") == "":
                lesson.locator(":scope > summary").click()
            lesson.locator('[data-action="practice"]').click()
        self.assertEqual(sum(s.startswith("c01-") for s in self.state()["completed"]), 5)
        self.assertTrue(self.page.locator("#mastery-button").is_disabled())
        self.page.keyboard.press("Escape")
        self.navigate("overview")
        self.page.locator('[data-action="continue"]').first.click()
        self.assertIn("Think in problems", self.page.locator("#dialog-title").inner_text(), "Next step must return to c01's unresolved mastery gate")
        note = 'Artifact: local/report.md. <img src=x onerror="window.INJECTED=true"> & tested.'
        self.page.locator("#module-note").fill(note)
        self.page.locator('[data-check="c01"]').check()
        self.assertFalse(self.page.locator("#mastery-button").is_disabled())
        self.page.locator("#mastery-button").click()
        self.assertIn("c01", self.state()["mastered"])
        self.page.reload()
        self.page.wait_for_function("Boolean(window.ATLAS)")
        self.assertIn("c01", self.state()["mastered"])
        self.assertEqual(self.state()["notes"]["c01"], note)
        self.assertFalse(self.page.evaluate("Boolean(window.INJECTED)"))
        self.navigate("curriculum")
        self.page.locator('.module-card button[data-id="c01"]').click()
        self.assertEqual(self.page.locator("#module-note").input_value(), note)
        self.page.locator('#lesson-c01-1 [data-action="practice"]').click()
        self.assertNotIn("c01", self.state()["mastered"])

    def test_export_import_round_trip_and_rejects_inherited_route(self):
        self.navigate("planner")
        self.page.locator('[data-setting="hours"]').fill("4.5")
        self.page.locator('[data-setting="hours"]').press("Tab")
        self.page.locator('[data-setting="track"]').select_option("research")
        with self.page.expect_download() as download_info:
            self.page.locator('[data-action="export"]').first.click()
        download = download_info.value
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "backup.json"
            download.save_as(path)
            exported = json.loads(path.read_text())
        self.assertEqual(exported["track"], "research")
        self.assertEqual(exported["hours"], 4.5)
        self.page.locator('[data-setting="track"]').select_option("ai")
        self.import_progress(exported)
        self.page.wait_for_function("ATLAS.getState().track === 'research'")
        self.assertEqual(self.state()["hours"], 4.5)
        malicious = {**exported, "track": "toString"}
        self.page.locator("#import-file").set_input_files({"name":"bad.json","mimeType":"application/json","buffer":json.dumps(malicious).encode()})
        self.page.wait_for_function("document.querySelector('#toast').textContent.startsWith('Import rejected:')")
        self.assertEqual(self.state()["track"], "research")
        self.assertGreater(len(self.page.evaluate("ATLAS.buildPlan()")), 0)
        self.assertFalse(self.page.evaluate("() => { try { ATLAS.validateState({...ATLAS.defaults(),track:'constructor'}); return true; } catch { return false; } }"))

    def test_import_date_limits_and_mastery_consistency(self):
        for date in ("2026-02-30", "9999-12-31", "not-a-date"):
            with self.subTest(date=date):
                accepted = self.page.evaluate("date => { try { ATLAS.validateState({...ATLAS.defaults(), start:date}); return true; } catch { return false; } }", date)
                self.assertFalse(accepted)
        invalid_mastery = self.page.evaluate("() => ATLAS.validateState({...ATLAS.defaults(),mastered:['c02'],checks:{c02:true},completed:['c02-1','c02-2','c02-3','c02-4','c02-5']})")
        self.assertNotIn("c02", invalid_mastery["mastered"], "Import must not permit mastery without prerequisites")

    def test_partial_capstone_logging_survives_rebase_and_reload(self):
        imported = self.page.evaluate("""() => {
            const s = ATLAS.defaults(), ids = ATLAS.selectedModules();
            s.mastered = ids;
            for (const m of ATLAS_DATA.modules.filter(m => ids.includes(m.id))) {
                s.checks[m.id] = true;
                s.masteryDates[m.id] = s.start;
                m.lessons.forEach((_,i) => s.completed.push(m.id + '-' + (i+1)));
            }
            return s;
        }""")
        self.import_progress(imported)
        self.page.wait_for_function("ATLAS.getState().mastered.length > 20")
        self.navigate("planner")
        before = self.page.evaluate("ATLAS.buildPlan().reduce((n,d)=>n+d.used,0)")
        first = self.page.evaluate("ATLAS.buildPlan()[0].tasks[0]")
        self.assertEqual(first["kind"], "project")
        self.assertGreater(first["minutes"], first["allocated"])
        key = first["key"]
        self.page.locator(f'[data-action="log-work"][data-key="{key}"]').first.click()
        self.assertEqual(self.state()["activityProgress"][key], first["allocated"])
        remaining = self.page.evaluate("ATLAS.buildPlan().reduce((n,d)=>n+d.used,0)")
        self.assertEqual(remaining, before - first["allocated"])
        self.page.locator('[data-action="rebase"]').click()
        self.assertEqual(self.page.evaluate("ATLAS.buildPlan().reduce((n,d)=>n+d.used,0)"), remaining)
        self.page.reload()
        self.page.wait_for_function("Boolean(window.ATLAS)")
        self.assertEqual(self.page.evaluate("ATLAS.buildPlan().reduce((n,d)=>n+d.used,0)"), remaining)
        next_task = self.page.evaluate("ATLAS.buildPlan()[0].tasks[0]")
        self.assertEqual(next_task["key"], key)
        self.assertEqual(next_task["offset"], first["allocated"])
        self.page.locator(f'[data-action="log-work"][data-key="{key}"]').first.click()
        self.assertEqual(self.state()["activityProgress"][key], first["allocated"] + next_task["allocated"])
        self.assertNotIn(f'{first["id"]}-{first["index"]}', self.state()["projectDone"], "A multi-hour stage cannot be completed by two60-minute blocks")

    def test_overdue_recall_stays_until_recorded(self):
        imported = self.page.evaluate("""() => {
            const s=ATLAS.defaults(), d=new Date(s.start+'T12:00:00Z');
            d.setUTCDate(d.getUTCDate()-2);
            s.completed=['c01-1','c01-2','c01-3','c01-4','c01-5'];
            s.mastered=['c01']; s.checks={c01:true};
            s.masteryDates={c01:d.toISOString().slice(0,10)};
            return s;
        }""")
        self.import_progress(imported)
        self.page.wait_for_function("ATLAS.getState().mastered.includes('c01')")
        self.navigate("planner")
        self.assertEqual(self.page.locator('[data-action="reviewed"][data-id="c01"]').count(), 1)
        self.page.reload()
        self.page.wait_for_function("Boolean(window.ATLAS)")
        self.page.locator('[data-action="reviewed"][data-id="c01"]').click()
        self.assertEqual(self.page.locator('[data-action="reviewed"][data-id="c01"]').count(), 0)
        self.assertEqual(self.state()["reviewProgress"]["c01"], 1)

    def test_malformed_progress_cannot_create_unknown_activity_keys(self):
        for key in ("constructor", "__proto__", "c01:0:unknown"):
            with self.subTest(key=key):
                accepted = self.page.evaluate("key => {try { ATLAS.validateState({...ATLAS.defaults(),activityProgress:{[key]:1}}); return true;} catch {return false;} }", key)
                self.assertFalse(accepted)
        safe = self.page.evaluate("() => ATLAS.validateState({...ATLAS.defaults(),notes:JSON.parse('{\"__proto__\":\"bad\",\"constructor\":\"bad\",\"c01\":\"safe\"}')})")
        self.assertEqual(safe["notes"], {"c01": "safe"})

    def test_calendar_export_contains_every_planned_day(self):
        self.navigate("planner")
        expected = len(self.page.evaluate("ATLAS.buildPlan()"))
        with self.page.expect_download() as download_info:
            self.page.locator('[data-action="calendar"]').click()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "plan.ics"
            download_info.value.save_as(path)
            raw = path.read_bytes()
        text = raw.decode()
        self.assertTrue(text.startswith("BEGIN:VCALENDAR\r\n"))
        self.assertTrue(text.endswith("END:VCALENDAR\r\n"))
        self.assertEqual(text.count("BEGIN:VEVENT"), expected)
        self.assertEqual(text.count("DTSTART;VALUE=DATE:"), expected)
        self.assertTrue(all(len(line) <= 75 for line in raw.split(b"\r\n")), "iCalendar physical lines must be folded by byte length")

    def fully_practiced_progress(self):
        return self.page.evaluate("""() => {
            const s=ATLAS.defaults(), ids=ATLAS.selectedModules();
            s.mastered=ids;
            for(const m of ATLAS_DATA.modules.filter(m=>ids.includes(m.id))){
                s.checks[m.id]=true;s.masteryDates[m.id]=s.start;
                m.lessons.forEach((_,i)=>s.completed.push(m.id+'-'+(i+1)));
            }
            return s;
        }""")

    def test_old_progress_migrates_without_losing_work(self):
        old=self.page.evaluate("ATLAS.defaults()")
        old["version"]=1
        for key in ("dailyWork","blockMinutes","assessments"):
            old.pop(key,None)
        old["completed"]=["c01-1"]
        old["notes"]={"c01":"My original artifact and correction"}
        old["activityProgress"]={"c01:1:read":10}
        self.page.evaluate("data=>localStorage.setItem('first-principles-atlas-v1',JSON.stringify(data))",old)
        self.page.reload()
        self.page.wait_for_function("Boolean(window.ATLAS)")
        migrated=self.state()
        self.assertEqual(migrated["version"],2)
        self.assertEqual(migrated["completed"],["c01-1"])
        self.assertEqual(migrated["notes"],old["notes"])
        self.assertEqual(migrated["activityProgress"],old["activityProgress"])
        self.assertEqual(migrated["dailyWork"],{})
        self.assertEqual(migrated["blockMinutes"],60)

    def test_diagnostic_explains_misconception_and_persists(self):
        self.navigate("curriculum")
        self.page.locator('.module-card button[data-id="c01"]').click()
        assessment=self.page.evaluate("ATLAS_DATA.modules.find(m=>m.id==='c01').assessment")
        correct=assessment["answerIndex"]
        wrong=(correct+1)%4
        self.page.locator(f'[data-action="answer"][data-id="c01"][data-choice="{wrong}"]').click()
        self.assertEqual(self.state()["assessments"]["c01"]["choice"],wrong)
        self.assertGreater(len(self.page.locator(".assessment-feedback").inner_text()),40)
        self.assertNotIn("c01",self.state()["mastered"],"A diagnostic is formative, not automatic mastery")
        self.page.locator(f'[data-action="answer"][data-id="c01"][data-choice="{correct}"]').click()
        self.assertEqual(self.state()["assessments"]["c01"]["choice"],correct)
        self.assertEqual(self.state()["assessments"]["c01"]["attempts"],2)
        self.assertIn(assessment["explanation"][:35],self.page.locator(".assessment-feedback").inner_text())
        self.page.reload()
        self.page.wait_for_function("Boolean(window.ATLAS)")
        self.assertEqual(self.state()["assessments"]["c01"]["choice"],correct)

    def test_command_search_and_focus_reading(self):
        self.page.keyboard.press("Control+k")
        self.assertTrue(self.page.locator("#command-dialog").is_visible())
        self.assertTrue(self.page.locator("#command-search").evaluate("el=>el===document.activeElement"))
        self.page.locator("#command-search").fill("probability")
        self.page.locator('#command-dialog [data-action="module"][data-id="c09"]').click()
        self.assertFalse(self.page.locator("#command-dialog").is_visible())
        self.assertTrue(self.page.locator("#lesson-dialog").is_visible())
        self.assertIn("Probability",self.page.locator("#dialog-title").inner_text())
        self.page.locator('[data-action="focus-mode"]').click()
        self.assertTrue(self.page.locator("#lesson-dialog").evaluate("el=>el.classList.contains('focus-mode')"))
        self.assertEqual(self.page.locator("#lesson-dialog details.lesson:visible").count(),1)
        self.page.locator('[data-action="focus-mode"]').click()
        self.assertEqual(self.page.locator("#lesson-dialog details.lesson:visible").count(),5)
        self.page.keyboard.press("Escape")
        self.assertFalse(self.page.locator("#lesson-dialog").is_visible())

    def test_logged_time_reduces_today_capacity_and_undo_preserves_notes(self):
        data=self.fully_practiced_progress()
        data["hours"]=1
        data["notes"]={"p01":"Evidence remains after undo"}
        self.import_progress(data)
        self.page.wait_for_function("ATLAS.getState().hours===1")
        self.navigate("planner")
        initial=self.page.evaluate("ATLAS.buildPlan()")
        first=initial[0]["tasks"][0]
        date=initial[0]["date"]
        self.assertEqual(first["allocated"],30)
        self.assertEqual(initial[0]["capacity"],30)
        self.page.locator(f'[data-action="log-work"][data-key="{first["key"]}"]').first.click()
        state=self.state()
        self.assertEqual(state["dailyWork"][date],30)
        self.assertEqual(state["activityProgress"][first["key"]],30)
        after=self.page.evaluate("ATLAS.buildPlan()")
        self.assertEqual(after[0]["date"],date)
        self.assertEqual(after[0]["capacity"],0)
        self.assertEqual(after[0]["used"],0)
        self.assertEqual(after[0]["logged"],30)
        self.assertEqual(sum(d["used"] for d in after),sum(d["used"] for d in initial)-30)
        self.page.locator("details.plan-day").evaluate_all("els=>els.forEach(el=>el.open=true)")
        self.page.locator('[data-action="log-work"]').first.click()
        self.assertEqual(self.state()["dailyWork"][date],30,"Logging a later block must not exceed today's budget")
        self.assertEqual(self.state()["activityProgress"][first["key"]],30)
        self.page.locator('[data-action="undo-work"]').click()
        self.assertEqual(self.state()["dailyWork"].get(date,0),0)
        self.assertEqual(self.state()["activityProgress"].get(first["key"],0),0)
        self.assertEqual(self.state()["notes"]["p01"],"Evidence remains after undo")
        self.assertEqual(self.page.evaluate("ATLAS.buildPlan()[0].capacity"),30)

    def test_block_length_changes_granularity_not_total_work(self):
        self.navigate("planner")
        original=self.page.evaluate("ATLAS.buildPlan().reduce((n,d)=>n+d.used,0)")
        for length in (45,90,60):
            self.page.locator('[data-setting="blockMinutes"]').select_option(str(length))
            plan=self.page.evaluate("ATLAS.buildPlan()")
            self.assertEqual(sum(d["used"] for d in plan),original)
            self.assertTrue(all(0<t["allocated"]<=length for d in plan for t in d["tasks"]))
        for extra in ({"blockMinutes":0},{"blockMinutes":61},{"dailyWork":{"2026-02-30":30}}, {"dailyWork":{"__proto__":1}}, {"assessments":{"c01":{"choice":9,"attempts":1}}}):
            accepted=self.page.evaluate("raw=>{const extra=JSON.parse(raw);try{ATLAS.validateState({...ATLAS.defaults(),...extra});return true;}catch{return false;}}",json.dumps(extra))
            self.assertFalse(accepted,extra)


    def test_review_time_is_loggable_without_claiming_mastery(self):
        data=self.page.evaluate("ATLAS.defaults()")
        data["completed"]=[f"c01-{i}" for i in range(1,6)]
        self.import_progress(data)
        self.page.wait_for_function("ATLAS.getState().completed.length===5")
        self.navigate("planner")
        first=self.page.evaluate("ATLAS.buildPlan()[0].tasks[0]")
        self.assertEqual(first["kind"],"gate")
        key=first["key"]
        self.page.locator(f'[data-action="log-work"][data-key="{key}"]').first.click()
        self.assertEqual(self.state()["activityProgress"][key],60)
        self.assertNotIn("c01",self.state()["mastered"])
        self.page.locator(f'[data-action="log-work"][data-key="{key}"]').first.click()
        self.assertEqual(self.state()["activityProgress"][key],90)
        self.assertEqual(self.state()["dailyWork"][data["start"]],90)
        self.assertNotIn("c01",self.state()["mastered"])
        self.navigate("curriculum")
        self.page.locator('.module-card button[data-id="c01"]').click()
        self.page.locator('[data-action="repeat-review"]').click()
        self.assertEqual(self.state()["dailyWork"][data["start"]],90)
        self.assertNotIn(key,self.state()["activityProgress"])

    def test_manual_progress_is_preserved_after_prior_time_log(self):
        self.navigate("planner")
        self.page.locator('[data-action="log-work"]').first.click()
        self.navigate("curriculum")
        self.page.locator('.module-card button[data-id="c02"]').click()
        self.page.locator('[data-action="practice"][data-index="0"]').click()
        self.page.keyboard.press("Escape")
        self.navigate("planner")
        self.assertTrue(self.page.locator('[data-action="undo-work"]').is_disabled())
        self.assertIn("c02-1",self.state()["completed"])

    def test_html_example_download_preserves_source_characters(self):
        self.navigate("curriculum")
        self.page.locator('.module-card button[data-id="a01"]').click()
        self.page.locator('.worked-example > summary').click()
        with self.page.expect_download() as download_info:
            self.page.locator('[data-action="download-example"]').click()
        downloaded=download_info.value
        self.assertTrue(downloaded.suggested_filename.endswith('.html'))
        with tempfile.TemporaryDirectory() as directory:
            file=Path(directory)/'example.html'
            downloaded.save_as(file)
            code=file.read_text(encoding="utf-8")
        expected=self.page.evaluate("ATLAS_DATA.modules.find(m=>m.id==='a01').workedExample.code")
        self.assertEqual(code,expected)
        self.assertIn('<script>',code)
        self.assertNotIn('\\u003c',code)


if __name__ == "__main__":
    unittest.main(verbosity=2)
