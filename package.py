#!/usr/bin/env python3
"""Build portable release files without network access or third-party packages."""
import hashlib
import json
import shutil
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from build import build

ROOT = Path(__file__).resolve().parent


def package():
    build()
    html = ROOT / 'dist' / 'first-principles-atlas.html'
    versioned_html = html.with_name('first-principles-atlas-v2.html')
    shutil.copyfile(html, versioned_html)
    data = json.loads((ROOT / 'src/data.json').read_text(encoding='utf-8'))
    manifest = {
        'edition': data['meta']['edition'],
        'artifact': versioned_html.name,
        'bytes': html.stat().st_size,
        'sha256': hashlib.sha256(html.read_bytes()).hexdigest(),
        'content': {
            'modules': len(data['modules']),
            'sessions': sum(len(m['lessons']) for m in data['modules']),
            'workedExamples': sum(bool(m.get('workedExample')) for m in data['modules']),
            'diagnostics': sum(bool(m.get('assessment')) for m in data['modules']),
            'capstones': 4,
            'interactiveLabs': 5,
        },
        'validationReport': 'VALIDATION.md',
        'note': 'Packaging does not run browser tests. Check the artifact hash and scope in the validation report.',
    }
    (ROOT / 'dist/manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    files = [ROOT / name for name in ['README.md', 'VALIDATION.md', 'CHANGELOG.md', 'build.py', 'package.py', '.gitignore']]
    files += [html, versioned_html, ROOT / 'dist/manifest.json', ROOT / 'tests/test_atlas.py']
    files += sorted((ROOT / 'src').glob('*')) + sorted((ROOT / 'research').glob('*'))
    bundle = ROOT / 'dist/first-principles-atlas-v2-source.zip'
    with ZipFile(bundle, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            if path.is_file():
                archive.write(path, Path('first-principles-atlas') / path.relative_to(ROOT))
    with ZipFile(bundle) as archive:
        assert archive.testzip() is None
        assert archive.read('first-principles-atlas/dist/' + versioned_html.name) == html.read_bytes()
    shutil.copyfile(bundle, ROOT / 'dist/first-principles-atlas-source.zip')
    print(f'Packaged {versioned_html.name} and {bundle.name}; archive integrity verified.')


if __name__ == '__main__':
    package()
