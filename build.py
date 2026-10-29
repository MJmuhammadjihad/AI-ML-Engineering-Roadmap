#!/usr/bin/env python3
"""Build and validate the zero-dependency, single-file learning atlas."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'


def validate(data):
    modules = data['modules']
    ids = {m['id'] for m in modules}
    sources = {r['id'] for r in data['resources']}
    assert len(modules) == len(ids) == 41, 'Expected 41 distinct modules'
    expected = {f'c{i:02}' for i in range(1, 25)} | {f'a{i:02}' for i in range(1, 13)} | {f'b{i:02}' for i in range(1, 6)}
    assert ids == expected
    by_id = {m['id']: m for m in modules}
    visited, visiting = set(), set()

    def visit(mid):
        assert mid not in visiting, f'Prerequisite cycle at {mid}'
        if mid in visited:
            return
        visiting.add(mid)
        for prerequisite in by_id[mid]['prerequisites']:
            assert prerequisite in ids, f'Unknown prerequisite {prerequisite}'
            visit(prerequisite)
        visiting.remove(mid)
        visited.add(mid)

    for module in modules:
        visit(module['id'])
        assert len(module['lessons']) == 5
        assert module['resourceIds'] and set(module['resourceIds']) <= sources
        for field in ['summary', 'why', 'title', 'outcomes', 'pitfalls']:
            assert module[field], (module['id'], field)
        for field in ['title', 'brief', 'deliverables', 'rubric']:
            assert module['project'][field]
        example = module['workedExample']
        assert all(example.get(k) for k in ['title', 'language', 'code', 'expected', 'explanation'])
        assessment = module['assessment']
        assert len(assessment['options']) == 4 and 0 <= assessment['answerIndex'] < 4
        assert len(set(assessment['options'])) == 4 and assessment['explanation']
        for lesson in module['lessons']:
            for field in ['title', 'concepts', 'explain', 'practice', 'deliverable', 'check', 'answer']:
                assert lesson[field], (module['id'], field)
            for field in ['videoMinutes', 'readingMinutes', 'practiceMinutes', 'reviewMinutes']:
                assert isinstance(lesson[field], int) and 0 <= lesson[field] <= 600
            assert lesson['practiceMinutes'] > 0
            assert 70 <= len(lesson['explain'].split()) <= 170
    for resource in data['resources']:
        assert resource['url'].startswith('https://')
        if resource['verified']:
            assert resource['verificationUrl'].startswith('https://')
            assert resource['verificationNote']
    assert len({e['id'] for e in data['evidence']}) == len(data['evidence'])


def build():
    data = json.loads((SRC / 'data.json').read_text(encoding='utf-8'))
    validate(data)
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', chr(92) + 'u003c')
    replacements = {
        '/*__STYLES__*/': (SRC / 'styles.css').read_text(encoding='utf-8'),
        '/*__DATA__*/': 'window.ATLAS_DATA=' + payload + ';',
        '/*__APP__*/': (SRC / 'app.js').read_text(encoding='utf-8'),
    }
    html = (SRC / 'shell.html').read_text(encoding='utf-8')
    for marker, content in replacements.items():
        assert html.count(marker) == 1, marker
        html = html.replace(marker, content)
    assert '/*__' not in html
    out = ROOT / 'dist' / 'first-principles-atlas.html'
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'Built {out} ({out.stat().st_size:,} bytes): 41 modules, 205 sessions.')


if __name__ == '__main__':
    build()
