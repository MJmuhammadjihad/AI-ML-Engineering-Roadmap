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
    data['foundations'] = json.loads((SRC / 'foundations.json').read_text(encoding='utf-8'))
    data['guidance'] = json.loads((SRC / 'module-guidance.json').read_text(encoding='utf-8'))
    data['market'] = json.loads((ROOT / 'research/v3-market-evidence.json').read_text(encoding='utf-8'))
    validate_v3(data)
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', chr(92) + 'u003c')
    app = (SRC / 'app.js').read_text(encoding='utf-8')
    assert app.count('/*__V3_APP__*/') == 1, 'Missing edition 03 integration marker'
    app = app.replace('/*__V3_APP__*/', (SRC / 'v3.js').read_text(encoding='utf-8'))
    replacements = {
        '/*__STYLES__*/': (SRC / 'styles.css').read_text(encoding='utf-8'),
        '/*__DATA__*/': 'window.ATLAS_DATA=' + payload + ';',
        '/*__ENGINES__*/': '\n'.join((SRC / name).read_text(encoding='utf-8') for name in ['planner.js', 'assessment.js']),
        '/*__APP__*/': app,
    }
    html = (SRC / 'shell.html').read_text(encoding='utf-8')
    for marker, content in replacements.items():
        assert html.count(marker) == 1, marker
        html = html.replace(marker, content)
    assert '/*__' not in html
    out = ROOT / 'dist' / 'first-principles-atlas.html'
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print(f'Built {out} ({out.stat().st_size:,} bytes): 41 modules, 205 sessions, 6 guided foundation days.')


def validate_v3(data):
    lessons = data['foundations']['lessons']
    ids = {lesson['id'] for lesson in lessons}
    assert ids == {f'foundations.day{i:02}' for i in range(1, 7)}
    known_skills = {skill for lesson in lessons for skill in lesson['skillIds']}
    seen = set()
    seen_skills = set()
    for lesson in lessons:
        assert set(lesson['prerequisiteLessonIds']) <= seen, 'Foundation lessons must be topologically ordered'
        assert set(lesson['prerequisiteSkillIds']) <= seen_skills, 'Foundation skill taught before introduction'
        seen.add(lesson['id'])
        seen_skills.update(lesson['skillIds'])
        assert lesson['activeMinutes'] == sum(block['minutes'] for block in lesson['blocks']) == 360
        assert len({block['id'] for block in lesson['blocks']}) == len(lesson['blocks'])
        assert all(isinstance(block['minutes'], int) and block['minutes'] > 0 and block['actions'] and block['evidence'] for block in lesson['blocks'])
        assert lesson['breaks']['elapsedMinutes'] == 360 + lesson['breaks']['minutes']
        for field in ['title', 'outcome', 'conceptExplanation', 'independentTask', 'transferCheck', 'endArtifacts']:
            assert lesson[field], (lesson['id'], field)
        example = lesson['workedExample']
        assert all(example.get(key) for key in ['code', 'expectedOutput', 'assumptions', 'executionStatus'])
        assert len(lesson['diagnostics']) >= 3
        for diagnostic in lesson['diagnostics']:
            assert all(diagnostic.get(key) for key in ['prompt', 'answer', 'reason', 'misconception', 'repairExercise'])
        for criterion in lesson['independentTask']['rubric']:
            assert criterion['id'] and criterion['requirement'] and isinstance(criterion['critical'], bool)
    assert known_skills == seen_skills
    assert set(data['guidance']['modules']) == {m['id'] for m in data['modules']}
    for mid, guide in data['guidance']['modules'].items():
        assert all(guide.get(key) for key in ['capability', 'readinessPrerequisites', 'transferTask', 'rubric', 'repair', 'interview', 'boundary']), mid
        assert len(guide['rubric']) >= 3 and all(row['id'] and row['text'] for row in guide['rubric'])
        assert all(guide['repair'].get(key) for key in ['trigger', 'exercise', 'recheck'])
    market = data['market']
    assert market['asOf'] and market['sources'] and market['methodology']['limitations']
    assert len({source['id'] for source in market['sources']}) == len(market['sources'])
    assert all(source['url'].startswith('https://') and source['scope'] and source['limitations'] for source in market['sources'])


if __name__ == '__main__':
    build()
