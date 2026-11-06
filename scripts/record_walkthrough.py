#!/usr/bin/env python3
"""Record a captioned, silent tour of the actual app; requires Playwright and FFmpeg.

Run from the repository root after installing Playwright's ffmpeg component:
    python3 -m playwright install ffmpeg
    python3 scripts/record_walkthrough.py
No curriculum, user progress, or application source is modified.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs/assets/atlas-tour.mp4'
STAGE = '''<!doctype html><html lang="en"><meta charset="utf-8">
<title>First Principles · Actual application tour</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f7f1;color:#173f30;font-family:Arial,sans-serif}
header{height:108px;display:flex;align-items:center;justify-content:space-between;padding:18px 32px;border-bottom:1px solid #bdcdbd;background:#edf2e6}
.brand{font:italic 32px Georgia,serif;margin-right:26px}.copy{flex:1}h1{font-size:24px;line-height:1.2;margin:0 0 8px}p{font-size:16px;line-height:1.4;margin:0;color:#3e5947}.meta{text-align:right;font-size:11px;letter-spacing:1.3px;line-height:1.8;margin-left:24px}
iframe{display:block;width:100%;height:892px;border:0}#step{display:block;font-size:19px;letter-spacing:2px;color:#1d523d}
</style><header><div class="brand">fp</div><div class="copy"><h1 id="caption">A clear next step, every time you return.</h1><p id="detail">Start from zero. Plan a study block that fits your day.</p></div><div class="meta">FIRST PRINCIPLES · EDITION 03<span id="step">01 / 06</span>ACTUAL APPLICATION · SILENT TOUR</div></header>
<iframe title="The actual First Principles learning app" src="/dist/first-principles-atlas-v3.html"></iframe></html>'''


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/__walkthrough':
            content = STAGE.encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            super().do_GET()

    def log_message(self, *_args):
        pass


def record():
    if not shutil.which('ffmpeg'):
        raise SystemExit('Install FFmpeg to create the shareable MP4.')
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_port}'
    errors, external = [], []
    try:
        with tempfile.TemporaryDirectory(prefix='atlas-tour-') as work, sync_playwright() as p:
            browser = p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or p.chromium.executable_path)
            context = browser.new_context(viewport={'width': 1440, 'height': 1000},
                                          record_video_dir=work,
                                          record_video_size={'width': 1440, 'height': 1000},
                                          reduced_motion='reduce')
            context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(origin + '/') else route.abort())
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('request', lambda request: external.append(request.url) if not request.url.startswith(origin + '/') else None)
            page.goto(origin + '/__walkthrough')
            frame = page.frames[1]
            frame.wait_for_function('Boolean(window.ATLAS && window.ATLAS_DATA)')

            def caption(index, title, detail):
                page.evaluate('([i,title,detail]) => {document.querySelector("#step").textContent = `0${i} / 06`;document.querySelector("#caption").textContent=title;document.querySelector("#detail").textContent=detail}', [index, title, detail])

            # A fresh isolated profile is used throughout. No learning evidence
            # is fabricated or entered to make the demonstration look completed.
            page.wait_for_timeout(6000)
            caption(2, 'Open a guided lesson. Make your first program.', 'Setup instructions, a worked example, and a task to try yourself.')
            frame.get_by_role('link', name='Start this lesson', exact=False).first.click()
            frame.locator('#foundation-example').scroll_into_view_if_needed()
            page.wait_for_timeout(5500)
            caption(3, 'Check what you can do independently.', 'Keep self-reported evidence separate from reading and assisted practice.')
            frame.locator('#foundation-check').scroll_into_view_if_needed()
            page.wait_for_timeout(5500)
            caption(4, 'See the path. Understand the prerequisites.', 'Explore five routes through a connected AI and ML curriculum.')
            frame.locator('#navigation a[href="#journey"]').click()
            page.wait_for_timeout(5500)
            caption(5, 'Make an idea visible. Then test your prediction.', 'Explore five interactive concept labs inside the same HTML file.')
            frame.locator('#navigation a[href="#lab"]').click()
            page.wait_for_timeout(5500)
            caption(6, 'Keep your progress. Carry your roadmap.', 'No account. Export a JSON backup before moving to another browser or device.')
            frame.locator('#navigation a[href="#today"]').click()
            with page.expect_download() as download:
                frame.get_by_role('button', name='Export progress', exact=True).first.click()
            assert download.value.suggested_filename.endswith('.json')
            page.wait_for_timeout(5500)
            video = page.video
            context.close()
            recorded = video.path()
            browser.close()
            assert not errors, errors
            assert not external, external
            OUTPUT.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(['ffmpeg', '-nostdin', '-y', '-loglevel', 'error', '-ss', '1',
                            '-i', str(recorded), '-t', '32', '-an', '-c:v', 'libx264',
                            '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p',
                            '-movflags', '+faststart', '-metadata',
                            'title=First Principles — actual application tour', str(OUTPUT)], check=True)
    finally:
        server.shutdown()
        server.server_close()
    print(f'Recorded {OUTPUT.name}: {OUTPUT.stat().st_size:,} bytes; no JavaScript errors or external requests.')


if __name__ == '__main__':
    record()
