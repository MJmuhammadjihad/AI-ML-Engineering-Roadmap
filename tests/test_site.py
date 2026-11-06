"""Exercise the generated public showcase under its GitHub Pages project path.

Run: python3 tests/test_site.py
Requires Playwright and Chromium, like the app browser suites. Every browser
request outside the loopback server is blocked and reported as a failure.
"""
from __future__ import annotations

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import struct
import sys
import tempfile
import threading
import unittest
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from build_site import SITE_URL, build_site  # noqa: E402

PROJECT = "AI-ML-Engineering-Roadmap"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class ShowcaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        build_site()
        cls.directory = tempfile.TemporaryDirectory(prefix="atlas-site-test-")
        cls.addClassCleanup(cls.directory.cleanup)
        # The project prefix is intentional: a root-relative URL would fail.
        (Path(cls.directory.name) / PROJECT).symlink_to(ROOT / "_site", target_is_directory=True)
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), partial(QuietHandler, directory=cls.directory.name)
        )
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.addClassCleanup(cls.stop_server)
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"
        cls.url = f"{cls.origin}/{PROJECT}/"
        cls.playwright = sync_playwright().start()
        cls.addClassCleanup(cls.playwright.stop)
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH")
            or shutil.which("chromium")
            or shutil.which("google-chrome"),
            headless=True,
            args=["--disable-dev-shm-usage"],
        )
        cls.addClassCleanup(cls.browser.close)

    @classmethod
    def stop_server(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def setUp(self):
        self.errors = []
        self.external_requests = []
        self.context = self.make_context()
        self.page = self.context.new_page()
        self.page.goto(self.url)

    def make_context(self, **options):
        context = self.browser.new_context(
            viewport={"width": 1440, "height": 1000}, reduced_motion="reduce", **options
        )
        context.set_default_timeout(6000)
        context.on("page", lambda page: page.on("pageerror", lambda error: self.errors.append(str(error))))

        def guard(route):
            if route.request.url.startswith(self.origin + "/"):
                route.continue_()
            else:
                self.external_requests.append(route.request.url)
                route.abort()

        context.route("**/*", guard)
        self.addCleanup(context.close)
        return context

    def tearDown(self):
        self.assertEqual(self.errors, [], "Browser JavaScript errors")
        self.assertEqual(self.external_requests, [], "Unexpected external browser requests")

    def test_local_links_assets_and_fragment_targets_resolve(self):
        references = self.page.locator("[href], [src]").evaluate_all(
            "els => els.flatMap(el => ['href','src'].filter(a => el.hasAttribute(a)).map(a => el.getAttribute(a)))"
        )
        ids = self.page.locator("[id]").evaluate_all("els => els.map(el => el.id)")
        self.assertEqual(len(ids), len(set(ids)), "Duplicate fragment IDs")
        checked = set()
        for reference in references:
            target = urlsplit(urljoin(self.url, reference))
            if target.netloc != urlsplit(self.origin).netloc:
                continue
            with self.subTest(reference=reference):
                self.assertTrue(target.path.startswith(f"/{PROJECT}/"))
                path = target.path + ("?" + target.query if target.query else "")
                if path not in checked:
                    response = self.context.request.get(self.origin + path)
                    self.assertEqual(response.status, 200)
                    checked.add(path)
                if target.fragment and target.path == urlsplit(self.url).path:
                    self.assertIn(unquote(target.fragment), ids)
        self.assertGreaterEqual(len(checked), 7)
        for img in self.page.locator("img").all():
            self.assertTrue(img.get_attribute("alt"))
            img.scroll_into_view_if_needed()
            self.page.wait_for_function("img => img.complete && img.naturalWidth > 0", arg=img.element_handle())

    def test_primary_cta_and_deep_links_open_the_real_learning_app(self):
        self.page.get_by_role("link", name="Open the roadmap", exact=True).click()
        self.page.wait_for_function("Boolean(window.ATLAS && window.ATLAS_DATA)")
        self.assertIn(f"/{PROJECT}/app/", self.page.url)
        self.assertTrue(self.page.locator(".v3-foundation-hero").is_visible())
        self.page.locator('.v3-foundation-hero [data-action="foundation-open"]').click()
        self.page.locator(".v3-reading-header").wait_for()
        self.assertIn("#lesson/foundations.day01", self.page.url)
        self.assertEqual(self.page.locator(".v3-block").count(), 7)
        self.page.goto(self.url)
        self.page.get_by_role("link", name="Look inside the first lesson").click()
        self.page.locator("#foundation-note").wait_for()
        self.assertIn("#lesson/foundations.day01", self.page.url)
        self.page.goto(self.url)
        self.page.get_by_role("link", name="five learning routes").click()
        self.page.wait_for_function(
            "document.querySelector('#navigation [aria-current=page]')?.getAttribute('href') === '#journey'"
        )
        self.assertTrue(self.page.locator("#main h1").is_visible())

    def test_download_button_saves_the_portable_artifact(self):
        with self.page.expect_download() as event:
            self.page.get_by_role("link", name="Download HTML").click()
        download = event.value
        self.assertEqual(download.suggested_filename, "first-principles-atlas-v3.html")
        with tempfile.TemporaryDirectory() as directory:
            saved = Path(directory) / download.suggested_filename
            download.save_as(saved)
            self.assertEqual(saved.read_bytes(), (ROOT / "dist" / saved.name).read_bytes())
        self.assertEqual(self.page.url, self.url, "Downloading must keep the visitor on the showcase")

    def test_every_hosted_edition_and_manifest_preserves_published_bytes(self):
        for edition in (1, 2, 3):
            for filename in (
                f"first-principles-atlas-v{edition}.html",
                f"first-principles-atlas-v{edition}-source.zip",
                f"manifest-v{edition}.json",
            ):
                with self.subTest(filename=filename):
                    response = self.context.request.get(self.url + "downloads/" + filename)
                    self.assertEqual(response.status, 200)
                    self.assertEqual(response.body(), (ROOT / "dist" / filename).read_bytes())
        response = self.context.request.get(self.url + "app/")
        self.assertEqual(response.body(), (ROOT / "dist/first-principles-atlas-v3.html").read_bytes())
        manifest = self.context.request.get(self.url + "downloads/manifest-v3.json").json()
        self.assertEqual(manifest["content"]["modules"], 41)

    def test_mobile_and_desktop_layouts_do_not_overflow(self):
        for width in (320, 390, 768, 1440):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 900})
                self.page.locator(".site-footer").scroll_into_view_if_needed()
                size = self.page.evaluate(
                    "({width:innerWidth,scroll:document.documentElement.scrollWidth})"
                )
                self.assertLessEqual(size["scroll"], size["width"] + 1)
                self.assertTrue(self.page.get_by_role("link", name="Open the roadmap", exact=True).is_visible())
    def test_keyboard_skip_link_and_native_faq(self):
        self.page.keyboard.press("Tab")
        self.assertEqual(self.page.evaluate("document.activeElement.textContent.trim()"), "Skip to content")
        self.page.keyboard.press("Enter")
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "main")
        summary = self.page.locator(".faq-list details summary").first
        summary.focus()
        self.page.keyboard.press("Enter")
        self.assertTrue(summary.evaluate("el => el.parentElement.open"))
        self.assertTrue(self.page.locator(".faq-list details").first.locator("p").is_visible())
        self.page.keyboard.press("Space")
        self.assertFalse(summary.evaluate("el => el.parentElement.open"))

    def test_showcase_and_faq_remain_useful_without_javascript(self):
        context = self.make_context(java_script_enabled=False)
        page = context.new_page()
        page.goto(self.url)
        self.assertTrue(page.locator("h1").is_visible())
        self.assertTrue(page.get_by_role("link", name="Open the roadmap", exact=True).is_visible())
        self.assertTrue(page.get_by_role("link", name="Download HTML").is_visible())
        self.assertEqual(page.locator("script").count(), 0)
        page.get_by_text("Can I use it offline?", exact=True).click()
        self.assertTrue(page.locator("details[open] p").is_visible())
        self.assertIn("export your progress", page.locator("details[open] p").inner_text())

    def test_social_preview_canonical_and_discovery_documents(self):
        self.assertEqual(self.page.locator('link[rel="canonical"]').get_attribute("href"), SITE_URL)
        self.assertEqual(self.page.locator('meta[property="og:url"]').get_attribute("content"), SITE_URL)
        self.assertEqual(self.page.locator('meta[name="twitter:card"]').get_attribute("content"), "summary_large_image")
        image_url = self.page.locator('meta[property="og:image"]').get_attribute("content")
        self.assertEqual(image_url, SITE_URL + "assets/social-preview.png")
        self.assertEqual(self.page.locator('meta[name="twitter:image"]').get_attribute("content"), image_url)
        response = self.context.request.get(self.url + "assets/social-preview.png")
        self.assertEqual(response.status, 200)
        png = response.body()
        self.assertEqual(png[:8], b"\x89PNG\r\n\x1a\n")
        self.assertEqual(struct.unpack(">II", png[16:24]), (1200, 630))
        robots = self.context.request.get(self.url + "robots.txt")
        self.assertEqual(robots.status, 200)
        self.assertIn("Sitemap: " + SITE_URL + "sitemap.xml", robots.text())
        sitemap = self.context.request.get(self.url + "sitemap.xml")
        self.assertEqual(sitemap.status, 200)
        urls = [node.text for node in ET.fromstring(sitemap.body()).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
        self.assertEqual(set(urls), {SITE_URL, SITE_URL + "app/", SITE_URL + "curriculum.html"})

    def test_catalog_covers_the_actual_curriculum_and_prerequisites(self):
        self.page.get_by_role('link', name='Curriculum', exact=True).click()
        data = json.loads((ROOT / 'src/data.json').read_text())
        self.assertEqual(self.page.locator('.foundation-preview').count(), 6)
        self.assertEqual(self.page.locator('.module-preview').count(), len(data['modules']))
        self.assertEqual(self.page.locator('.module-detail-grid ol li').count(), 205)
        ids = self.page.locator('[id]').evaluate_all('els => els.map(el => el.id)')
        self.assertEqual(len(ids), len(set(ids)))
        for module in data['modules']:
            with self.subTest(module=module['id']):
                card = self.page.locator('#' + module['id'])
                self.assertEqual(card.locator('h3').inner_text(), module['title'])
                self.assertEqual(card.locator('ol li').all_text_contents(), [lesson['title'] for lesson in module['lessons']])
                self.assertEqual(card.locator('ul li').all_text_contents(), module['outcomes'])
                links = card.locator('.module-prereqs a').evaluate_all('els => els.map(el => el.getAttribute("href"))')
                self.assertEqual(links, ['#' + mid for mid in module['prerequisites']])
        for link in self.page.locator('a[href^="#"]').all():
            self.assertIn(link.get_attribute('href')[1:], ids)
        self.assertEqual(self.page.locator('link[rel="canonical"]').get_attribute('href'), SITE_URL + 'curriculum.html')

    def test_catalog_is_responsive_and_works_without_javascript(self):
        context = self.make_context(java_script_enabled=False)
        page = context.new_page()
        page.goto(self.url + 'curriculum.html')
        page.keyboard.press('Tab')
        page.keyboard.press('Enter')
        self.assertEqual(page.evaluate('document.activeElement.id'), 'main')
        page.locator('#c01 summary').focus()
        page.keyboard.press('Enter')
        self.assertTrue(page.locator('#c01 details').get_attribute('open') is not None)
        self.assertTrue(page.locator('#c01 ol').is_visible())
        for width in (320, 390, 768, 1440):
            with self.subTest(width=width):
                page.set_viewport_size({'width': width, 'height': 900})
                size = page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
                self.assertLessEqual(size['scroll'], size['width'] + 1)
        self.assertEqual(page.locator('script').count(), 0)

    def test_tour_is_user_controlled_and_license_is_portable(self):
        video = self.page.locator('video')
        self.assertTrue(video.get_attribute('controls') is not None)
        self.assertIsNone(video.get_attribute('autoplay'))
        self.assertEqual(video.get_attribute('preload'), 'none')
        self.assertEqual(self.page.locator('#tour-transcript li').count(), 6)
        summary = self.page.locator('.tour-preview summary')
        summary.focus()
        self.page.keyboard.press('Enter')
        self.assertTrue(video.is_visible())
        self.assertTrue(self.page.locator('#tour-transcript').is_visible())
        self.assertTrue(video.evaluate('v => v.paused'))
        media = self.context.request.get(self.url + 'assets/atlas-tour.mp4')
        self.assertEqual(media.status, 200)
        self.assertEqual(media.body()[4:8], b'ftyp')
        self.assertEqual(media.body(), (ROOT / 'docs/assets/atlas-tour.mp4').read_bytes())
        license_text = (ROOT / 'LICENSE').read_text().strip()
        response = self.context.request.get(self.url + 'license.txt')
        self.assertEqual(response.status, 200)
        self.assertEqual(response.text().strip(), license_text)
        self.assertIn(license_text, (ROOT / 'dist/first-principles-atlas-v3.html').read_text())


if __name__ == "__main__":
    unittest.main(verbosity=2)
