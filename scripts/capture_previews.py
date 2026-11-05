#!/usr/bin/env python3
"""Regenerate real UI screenshots and the authored social card with Playwright."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import shutil
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def capture():
    assets = ROOT / 'docs/assets'
    assets.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_port}'
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path)
            context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
            context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(origin + '/') else route.abort())
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            url = origin + '/dist/first-principles-atlas-v3.html'
            for name, fragment, viewport in [
                ('atlas-today', '#today', {'width': 1440, 'height': 1000}),
                ('atlas-lesson', '#lesson/foundations.day01', {'width': 1440, 'height': 1000}),
                ('atlas-mobile', '#today', {'width': 390, 'height': 844}),
            ]:
                page.set_viewport_size(viewport)
                page.goto(url + fragment)
                page.wait_for_function('Boolean(window.ATLAS && window.ATLAS_DATA)')
                page.screenshot(path=str(assets / f'{name}.png'), animations='disabled')
            page.set_viewport_size({'width': 1200, 'height': 630})
            page.goto(origin + '/scripts/social-card.html')
            page.screenshot(path=str(assets / 'social-preview.png'), animations='disabled')
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('Captured three real application views and the 1200 × 630 social card.')


if __name__ == '__main__':
    capture()
