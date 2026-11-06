#!/usr/bin/env python3
"""Assemble the public showcase and byte-identical portable apps without a bundler."""
from pathlib import Path
import hashlib
import json
import shutil

from build import build
from package import package
from scripts.build_curriculum import build_curriculum

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / '_site'
SITE_URL = 'https://mjmuhammadjihad.github.io/AI-ML-Engineering-Roadmap/'


def build_site():
    build_curriculum()
    # A source ZIP cannot contain itself. Recreate its download when building
    # from an extracted archive rather than from a complete Git checkout.
    if not (ROOT / 'dist/first-principles-atlas-v3-source.zip').is_file():
        package()
    build()
    manifest = json.loads((ROOT / 'dist/manifest-v3.json').read_text())
    app = ROOT / 'dist/first-principles-atlas-v3.html'
    assert app.read_bytes() == (ROOT / 'dist/first-principles-atlas.html').read_bytes(), 'Package current source first'
    assert hashlib.sha256(app.read_bytes()).hexdigest() == manifest['sha256'], 'Artifact does not match its manifest'
    # Only replace the generated output directory, never editable site source.
    if OUTPUT.is_symlink():
        raise RuntimeError('Refusing to replace a symlink at _site')
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    shutil.copytree(ROOT / 'site', OUTPUT)
    shutil.copytree(ROOT / 'docs/assets', OUTPUT / 'assets')
    shutil.copyfile(ROOT / 'LICENSE', OUTPUT / 'license.txt')
    (OUTPUT / 'app').mkdir()
    shutil.copyfile(app, OUTPUT / 'app/index.html')
    (OUTPUT / 'downloads').mkdir()
    for edition in (1, 2, 3):
        for suffix in ('.html', '-source.zip'):
            name = f'first-principles-atlas-v{edition}{suffix}'
            shutil.copyfile(ROOT / 'dist' / name, OUTPUT / 'downloads' / name)
        shutil.copyfile(ROOT / 'dist' / f'manifest-v{edition}.json', OUTPUT / 'downloads' / f'manifest-v{edition}.json')
    (OUTPUT / '.nojekyll').write_text('')
    (OUTPUT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {SITE_URL}sitemap.xml\n')
    (OUTPUT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'  <url><loc>{SITE_URL}</loc></url>\n'
        f'  <url><loc>{SITE_URL}app/</loc></url>\n'
        f'  <url><loc>{SITE_URL}curriculum.html</loc></url>\n'
        '</urlset>\n'
    )
    print(f'Built showcase at {OUTPUT}; hosted app SHA-256: {manifest["sha256"]}')


if __name__ == '__main__':
    build_site()
