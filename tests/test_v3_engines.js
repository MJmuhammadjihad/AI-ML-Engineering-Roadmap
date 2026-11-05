#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {planDay} = require('../src/planner.js');
const {evaluateAssessment} = require('../src/assessment.js');
const results = [];
function test(name, fn) {
  try { fn(); results.push({name, passed: true}); }
  catch (error) { results.push({name, passed: false, error: error.stack}); }
}
function equal(a, b, message) { assert.deepEqual(a, b, message); }
function rejects(fn, match) { assert.throws(fn, match ? new RegExp(match) : TypeError); }
function fixture() {
  return {
    today: '2026-11-04', budget: {mode: 'active', minutes: 360, breakMinutes: 90},
    routes: ['ml', 'web'], routeId: 'ml',
    skills: [{id: 'files', requires: []}, {id: 'python', requires: ['files']}, {id: 'data', requires: ['python']}],
    tasks: [], evidence: [], completedBlockKeys: []
  };
}
function task(id, minutes = 45, extra = {}) {
  return {id, title: id, skillId: 'files', kind: 'learn', routeIds: ['ml'], blocks: [{id: 'work', minutes}], ...extra};
}
function pass(skillId, extra = {}) {
  return {skillId, result: 'passed', independent: true, verification: 'self_report', ...extra};
}
function freezeDeep(value) {
  if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) freezeDeep(child); }
  return value;
}

test('Planner: empty curriculum preserves capacity', () => {
  const x = fixture(); x.skills = []; const p = planDay(x);
  equal(p.plannedActiveMinutes, 0); equal(p.unusedActiveMinutes, 360); equal(p.emptyReason, 'no_tasks');
});
test('Planner: six active hours excludes breaks', () => {
  const p = planDay(fixture()); equal([p.activeBudgetMinutes, p.reservedBreakMinutes, p.elapsedCapacityMinutes], [360, 90, 450]);
});
test('Planner: elapsed mode subtracts breaks', () => {
  const x = fixture(); x.budget = {mode: 'elapsed', minutes: 360, breakMinutes: 75};
  const p = planDay(x); equal([p.activeBudgetMinutes, p.elapsedCapacityMinutes], [285, 360]);
});
test('Planner: elapsed breaks cannot exceed capacity', () => {
  const x = fixture(); x.budget = {mode: 'elapsed', minutes: 30, breakMinutes: 31}; rejects(() => planDay(x), 'Breaks exceed');
});
test('Planner: 24-hour model bounds explicit budgets', () => {
  const x = fixture(); x.budget.minutes = 1400; rejects(() => planDay(x), 'planning window');
});
test('Planner: invalid minute inputs rejected without coercion', () => {
  for (const bad of [-1, NaN, Infinity, '60', 1.5, undefined]) { const x = fixture(); x.budget.minutes = bad; rejects(() => planDay(x)); }
});
test('Planner: zero active minutes schedules nothing and retains work', () => {
  const x = fixture(); x.budget = {mode: 'elapsed', minutes: 60, breakMinutes: 60}; x.tasks = [task('first')];
  const p = planDay(x); equal(p.allocations.length, 0); equal(p.emptyReason, 'no_active_capacity'); equal(p.backlog.length, 1);
});
test('Planner: unknown prerequisite rejected', () => {
  const x = fixture(); x.skills[0].requires = ['missing']; rejects(() => planDay(x), 'unknown skill');
});
test('Planner: self-dependency rejected', () => {
  const x = fixture(); x.skills[0].requires = ['files']; rejects(() => planDay(x), 'cycle');
});
test('Planner: disconnected cycle rejected', () => {
  const x = fixture(); x.skills.push({id: 'a', requires: ['b']}, {id: 'b', requires: ['a']}); rejects(() => planDay(x), 'cycle');
});
test('Planner: diamond graph accepted with deduplicated ancestry', () => {
  const x = fixture(); x.skills = [{id: 'a'}, {id: 'b', requires: ['a']}, {id: 'c', requires: ['a']}, {id: 'd', requires: ['b', 'c']}];
  x.tasks = [task('last', 15, {skillId: 'd'})]; x.evidence = ['a', 'b', 'c'].map(s => pass(s));
  equal(planDay(x).allocations[0].prerequisiteEvidence.map(e => e.skillId), ['a', 'b', 'c']);
});
test('Planner: duplicate skill ID rejected', () => {
  const x = fixture(); x.skills.push({id: 'files'}); rejects(() => planDay(x), 'Duplicate skill');
});
test('Planner: identical shared task definitions merge across routes', () => {
  const x = fixture(); x.routeId = null; x.tasks = [task('shared'), task('shared', 45, {routeIds: ['web']})];
  const p = planDay(x); equal(p.allocations.length, 1); equal(p.taskStates.length, 1);
});
test('Planner: conflicting shared task definitions rejected', () => {
  const x = fixture(); x.tasks = [task('shared', 45), task('shared', 60)]; rejects(() => planDay(x), 'Conflicting');
});
test('Planner: unknown selected route rejected', () => {
  const x = fixture(); x.routeId = 'nonexistent'; rejects(() => planDay(x), 'route does not exist');
});
test('Planner: unknown task route rejected', () => {
  const x = fixture(); x.tasks = [task('first', 45, {routeIds: ['other']})]; rejects(() => planDay(x), 'unknown route');
});
test('Planner: no matching route differs from complete', () => {
  const x = fixture(); x.tasks = [task('web-only', 45, {routeIds: ['web']})]; equal(planDay(x).emptyReason, 'no_matching_tasks');
});
test('Planner: completed off-route task still outside selected route', () => {
  const x = fixture(); x.tasks = [task('web-only', 45, {routeIds: ['web']})]; x.completedBlockKeys = ['web-only:work'];
  equal(planDay(x).emptyReason, 'no_matching_tasks');
});
test('Planner: historical completion never becomes skill evidence', () => {
  const x = fixture(); x.tasks = [task('foundation'), task('next', 45, {skillId: 'python'})]; x.completedBlockKeys = ['foundation:work'];
  const p = planDay(x); equal(p.allocations.length, 0); equal(p.backlog[0].details.checks[0].reason, 'missing_prerequisite_evidence');
});
test('Planner: planning a prerequisite never unlocks dependent work', () => {
  const x = fixture(); x.tasks = [task('foundation'), task('next', 45, {skillId: 'python'})];
  equal(planDay(x).allocations.map(a => a.taskId), ['foundation']);
});
test('Planner: partial, failed, and assisted evidence cannot pass', () => {
  for (const patch of [{result: 'partial'}, {independent: false}, {result: 'failed'}]) {
    const x = fixture(); x.tasks = [task('next', 45, {skillId: 'python'})]; x.evidence = [pass('files', patch)]; equal(planDay(x).allocations.length, 0);
  }
});
test('Planner: allowed self-report provenance remains explicit', () => {
  const x = fixture(); x.tasks = [task('next', 45, {skillId: 'python'})]; x.evidence = [pass('files')];
  equal(planDay(x).allocations[0].prerequisiteEvidence[0].evidence.verification, 'self_report');
});
test('Planner: verified-only does not upgrade self-report', () => {
  const x = fixture(); x.evidencePolicy = 'verified_only'; x.tasks = [task('next', 45, {skillId: 'python'})]; x.evidence = [pass('files')];
  const p = planDay(x); equal(p.allocations.length, 0); equal(p.backlog[0].details.checks[0].reason, 'verification_required');
});
test('Planner: due review preserves prior independent demonstration', () => {
  const x = fixture(); x.tasks = [task('next', 45, {skillId: 'python'})]; x.evidence = [pass('files', {reviewDue: true})]; equal(planDay(x).allocations.length, 1);
});
test('Planner: transitive prerequisites are required', () => {
  const x = fixture(); x.tasks = [task('data-task', 45, {skillId: 'data'})]; x.evidence = [pass('python')]; equal(planDay(x).allocations.length, 0);
});
test('Planner: multiple current records for one skill rejected', () => {
  const x = fixture(); x.evidence = [pass('files'), pass('files', {result: 'failed'})]; rejects(() => planDay(x), 'Multiple current');
});
test('Planner: repair precedes due review and new work', () => {
  const x = fixture(); x.budget.minutes = 60;
  x.tasks = [task('new', 30), task('review', 30, {kind: 'review', dueDate: '2026-10-28'}), task('repair', 30, {kind: 'repair'})];
  equal(planDay(x).allocations.map(a => a.taskId), ['repair', 'review']);
});
test('Planner: future review remains deferred', () => {
  const x = fixture(); x.tasks = [task('later', 45, {kind: 'review', dueDate: '2026-11-05'})]; const p = planDay(x);
  equal(p.emptyReason, 'nothing_due'); equal(p.backlog[0].reason, 'not_due');
});
test('Planner: review dates must be real calendar dates', () => {
  for (const bad of ['2026-02-30', '2026-13-01', '10/29/2026']) {
    const x = fixture(); x.tasks = [task('review', 45, {kind: 'review', dueDate: bad})]; rejects(() => planDay(x));
  }
});
test('Planner: review requires explicit due date', () => {
  const x = fixture(); x.tasks = [task('review', 45, {kind: 'review'})]; rejects(() => planDay(x), 'needs a due date');
});
test('Planner: oversized priority task allows smaller independent work', () => {
  const x = fixture(); x.budget.minutes = 44; x.tasks = [task('large', 45, {kind: 'repair'}), task('small', 30)];
  const p = planDay(x); equal(p.allocations.map(a => a.taskId), ['small']); equal(p.backlog[0].reason, 'exceeds_active_budget');
});
test('Planner: deferred earlier block prevents later block bypass', () => {
  const x = fixture(); x.budget.minutes = 44; x.tasks = [task('sequence', 45, {blocks: [{id: 'first', minutes: 45}, {id: 'second', minutes: 10}]})];
  const p = planDay(x); equal(p.allocations.length, 0); equal(p.backlog.map(b => b.reason), ['exceeds_active_budget', 'earlier_block_deferred']);
});
test('Planner: exact-fit block is allocated', () => {
  const x = fixture(); x.budget.minutes = 45; x.tasks = [task('fits')]; equal(planDay(x).unusedActiveMinutes, 0);
});
test('Planner: independent block fills gap without trimming authored work', () => {
  const x = fixture(); x.budget.minutes = 60;
  x.tasks = [task('first', 45, {order: 0}), task('too-big', 30, {order: 1}), task('fits', 15, {order: 2})];
  const p = planDay(x); equal(p.allocations.map(a => a.minutes), [45, 15]); equal(p.backlog[0].reason, 'insufficient_remaining_time');
});
test('Planner: review cap retains remaining reviews', () => {
  const x = fixture(); x.reviewLimitMinutes = 30;
  x.tasks = [task('review-a', 30, {kind: 'review', dueDate: '2026-10-01'}), task('review-b', 30, {kind: 'review', dueDate: '2026-10-02'}), task('new', 60)];
  const p = planDay(x); equal(p.plannedReviewMinutes, 30); equal(p.backlog[0].reason, 'review_budget_limit'); equal(p.plannedActiveMinutes, 90);
});
test('Planner: blocked priority work consumes no capacity', () => {
  const x = fixture(); x.tasks = [task('repair', 45, {kind: 'repair', skillId: 'python'}), task('ready', 45)];
  equal(planDay(x).allocations.map(a => a.taskId), ['ready']);
});
test('Planner: completed blocks omitted while remaining blocks continue', () => {
  const x = fixture(); x.tasks = [task('two', 45, {blocks: [{id: 'one', minutes: 30}, {id: 'two', minutes: 45}]})]; x.completedBlockKeys = ['two:one'];
  const p = planDay(x); equal(p.allocations.map(a => a.key), ['two:two']); equal(p.plannedActiveMinutes, 45);
});
test('Planner: completed route makes no mastery claim', () => {
  const x = fixture(); x.tasks = [task('done')]; x.completedBlockKeys = ['done:work']; const p = planDay(x);
  equal(p.emptyReason, 'all_complete'); assert(!Object.hasOwn(p, 'mastered')); equal(x.evidence, []);
});
test('Planner: unmatched legacy records remain visible', () => {
  const x = fixture(); x.completedBlockKeys = ['old:lesson']; x.evidence = [pass('oldskill')]; const p = planDay(x);
  equal(p.unmatchedCompletionKeys, ['old:lesson']); equal(p.unmatchedEvidenceSkillIds, ['oldskill']);
});
test('Planner: frozen inputs remain unchanged', () => {
  const x = fixture(); x.tasks = [task('first')]; const before = JSON.stringify(x); freezeDeep(x); planDay(x); equal(JSON.stringify(x), before);
});
test('Planner: input array order cannot change plan', () => {
  const x = fixture(); x.tasks = [task('c'), task('a'), task('b')]; x.evidence = [pass('files'), pass('python')];
  const y = JSON.parse(JSON.stringify(x)); y.tasks.reverse(); y.skills.reverse(); y.evidence.reverse(); equal(planDay(x), planDay(y));
});
test('Planner: repeated calls are deterministic', () => { const x = fixture(); x.tasks = [task('first')]; equal(planDay(x), planDay(x)); });
test('Planner: invalid block durations and duplicate blocks rejected', () => {
  for (const bad of [0, -1, 0.5, NaN, '30']) { const x = fixture(); x.tasks = [task('bad', bad)]; rejects(() => planDay(x)); }
  const x = fixture(); x.tasks = [task('bad', 30, {blocks: [{id: 'one', minutes: 30}, {id: 'one', minutes: 30}]})]; rejects(() => planDay(x), 'Duplicate block');
});
test('Planner: completed key syntax validated', () => {
  for (const key of ['bad', 'a:b:c', '../:b']) { const x = fixture(); x.completedBlockKeys = [key]; rejects(() => planDay(x)); }
});
test('Planner: prototype-like names remain ordinary stable IDs', () => {
  const x = fixture(); x.skills.push({id: 'constructor'}); x.tasks = [task('constructor', 15, {skillId: 'constructor'})]; equal(planDay(x).allocations.length, 1);
});
test('Planner: mixed human and automated provenance remains explicit', () => {
  const x = fixture(); x.evidencePolicy = 'verified_only'; x.tasks = [task('next', 45, {skillId: 'python'})];
  x.evidence = [pass('files', {verification: 'mixed', verificationSources: ['human', 'automated']})];
  const p = planDay(x); equal(p.allocations.length, 1); equal(p.allocations[0].prerequisiteEvidence[0].evidence.verification, 'mixed');
  equal(p.allocations[0].prerequisiteEvidence[0].evidence.verificationSources, ['automated', 'human']);
});
test('Planner: mixed provenance cannot hide self-report', () => {
  const x = fixture(); x.evidencePolicy = 'verified_only'; x.tasks = [task('next', 45, {skillId: 'python'})];
  x.evidence = [pass('files', {verification: 'mixed', verificationSources: ['human', 'self_report']})];
  const p = planDay(x); equal(p.allocations.length, 0); equal(p.backlog[0].details.checks[0].reason, 'verification_required');
});
test('Planner: malformed or contradictory provenance rejected', () => {
  for (const verificationSources of [undefined, [], ['human'], ['human', 'human'], ['human', 'unknown']]) {
    const x = fixture(); x.evidence = [pass('files', {verification: 'mixed', verificationSources})]; rejects(() => planDay(x));
  }
  const x = fixture(); x.evidence = [pass('files', {verification: 'human', verificationSources: ['self_report']})]; rejects(() => planDay(x));
});
test('Planner: 500 seeded schedules conserve capacity and every authored block', () => {
  let seed = 917314;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  for (let scenario = 0; scenario < 500; scenario++) {
    const x = fixture(); x.budget.minutes = next() % 601; x.budget.breakMinutes = next() % 121;
    const count = next() % 30;
    for (let i = 0; i < count; i++) {
      const blocks = Array.from({length: 1 + next() % 4}, (_, b) => ({id: 'b' + b, minutes: 1 + next() % 150}));
      const kind = ['repair', 'review', 'learn'][next() % 3];
      x.tasks.push(task('task' + i, 1, {kind, blocks, dueDate: kind === 'review' ? '2026-10-28' : null}));
      if (next() % 4 === 0) x.completedBlockKeys.push('task' + i + ':b0');
    }
    const before = JSON.stringify(x), p = planDay(x);
    const sum = p.allocations.reduce((n, a) => n + a.minutes, 0);
    equal(sum, p.plannedActiveMinutes); equal(sum + p.unusedActiveMinutes, p.activeBudgetMinutes); assert(sum <= p.activeBudgetMinutes);
    equal(p.elapsedCapacityMinutes, p.activeBudgetMinutes + p.reservedBreakMinutes);
    equal(new Set(p.allocations.map(a => a.key)).size, p.allocations.length);
    const allocated = new Set(p.allocations.map(a => a.key)), deferred = new Set(p.backlog.map(a => a.key));
    for (const t of x.tasks) for (const b of t.blocks) {
      const key = t.id + ':' + b.id;
      equal(Number(allocated.has(key)) + Number(deferred.has(key)) + Number(x.completedBlockKeys.includes(key)), 1, 'Every block accounted for exactly once');
    }
    for (const allocation of p.allocations) {
      assert(!x.completedBlockKeys.includes(allocation.key));
      equal(allocation.minutes, x.tasks.find(t => t.id === allocation.taskId).blocks.find(b => b.id === allocation.blockId).minutes);
      assert(allocation.prerequisiteEvidence.every(e => e.reason === null));
    }
    equal(JSON.stringify(x), before);
  }
});

function definition() {
  return {id: 'day01.check', skillId: 'python.trace', referenceSheetAllowed: true, criteria: [
    {id: 'trace', description: 'Trace values after every assignment', required: true, critical: true, repairTaskId: 'repair.trace'},
    {id: 'output', description: 'Predict expected output', required: true, critical: false, repairTaskId: 'repair.output'},
    {id: 'style', description: 'Use readable names', required: false, critical: false, repairTaskId: 'repair.style'}
  ]};
}
function attempt() {
  return {assessmentId: 'day01.check', assistance: 'none', results: [
    {criterionId: 'trace', level: 2, verification: 'self_report'},
    {criterionId: 'output', level: 2, verification: 'self_report'}
  ]};
}
test('Assessment: independent required evidence demonstrates skill', () => {
  const r = evaluateAssessment(definition(), attempt()); equal(r.status, 'demonstrated'); equal(r.evidenceEligible, true);
});
test('Assessment: self-report not relabeled verified', () => {
  const r = evaluateAssessment(definition(), attempt()); assert(r.criterionResults.every(x => x.verification === 'self_report'));
});
test('Assessment: critical failure cannot be averaged away', () => {
  const a = attempt(); a.results[0].level = 0; a.results.push({criterionId: 'style', level: 2, verification: 'human'});
  const r = evaluateAssessment(definition(), a); equal(r.status, 'repair_recommended'); equal(r.criticalUnmetIds, ['trace']); equal(r.evidenceEligible, false);
});
test('Assessment: partial required result maps to targeted repair', () => {
  const a = attempt(); a.results[1].level = 1;
  equal(evaluateAssessment(definition(), a).repairRoutes, [{criterionId: 'output', taskId: 'repair.output', observedLevel: 1}]);
});
test('Assessment: missing result differs from observed failure', () => {
  const a = attempt(); a.results.pop(); const r = evaluateAssessment(definition(), a);
  equal(r.status, 'incomplete'); equal(r.missingCriterionIds, ['output']); equal(r.repairRoutes, []);
});
test('Assessment: hint-assisted response requires fresh transfer', () => {
  const a = attempt(); a.assistance = 'hint'; const r = evaluateAssessment(definition(), a);
  equal(r.status, 'practice_recorded'); equal(r.nextAction, 'attempt_fresh_transfer_task'); equal(r.independentlyMetRequiredCount, 0);
});
test('Assessment: revealed solution does not become mastery', () => {
  const a = attempt(); a.assistance = 'solution'; equal(evaluateAssessment(definition(), a).evidenceEligible, false);
});
test('Assessment: allowed reference sheet remains independent', () => {
  const a = attempt(); a.assistance = 'reference_sheet'; equal(evaluateAssessment(definition(), a).status, 'demonstrated');
});
test('Assessment: forbidden reference sheet records practice', () => {
  const d = definition(); d.referenceSheetAllowed = false; const a = attempt(); a.assistance = 'reference_sheet'; equal(evaluateAssessment(d, a).status, 'practice_recorded');
});
test('Assessment: verification requirement differs from learning gap', () => {
  const r = evaluateAssessment(definition(), attempt(), {acceptedVerification: ['human', 'automated']});
  equal(r.status, 'verification_needed'); equal(r.repairRoutes, []); equal(r.verificationNeededIds, ['trace', 'output']);
});
test('Assessment: optional criterion does not block required pass', () => {
  const a = attempt(); a.results.push({criterionId: 'style', level: 0, verification: 'self_report'}); equal(evaluateAssessment(definition(), a).status, 'demonstrated');
});
test('Assessment: unknown criterion rejected', () => {
  const a = attempt(); a.results.push({criterionId: 'wrong', level: 2, verification: 'human'}); rejects(() => evaluateAssessment(definition(), a));
});
test('Assessment: duplicate result rejected', () => {
  const a = attempt(); a.results.push({...a.results[0]}); rejects(() => evaluateAssessment(definition(), a));
});
test('Assessment: levels not coerced', () => {
  for (const bad of [-1, 3, 1.5, '2', NaN, Infinity]) { const a = attempt(); a.results[0].level = bad; rejects(() => evaluateAssessment(definition(), a)); }
});
test('Assessment: at least one required criterion', () => {
  const d = definition(); d.criteria = d.criteria.map(c => ({...c, required: false, critical: false})); rejects(() => evaluateAssessment(d, attempt()));
});
test('Assessment: critical criterion cannot be optional', () => {
  const d = definition(); d.criteria[0].required = false; rejects(() => evaluateAssessment(d, attempt()));
});
test('Assessment: each criterion needs a repair route', () => {
  const d = definition(); delete d.criteria[0].repairTaskId; rejects(() => evaluateAssessment(d, attempt()));
});
test('Assessment: mismatched attempt rejected', () => {
  const a = attempt(); a.assessmentId = 'other'; rejects(() => evaluateAssessment(definition(), a));
});
test('Assessment: frozen input records remain unchanged', () => {
  const d = freezeDeep(definition()), a = freezeDeep(attempt()); const before = JSON.stringify([d, a]); evaluateAssessment(d, a); equal(JSON.stringify([d, a]), before);
});
test('Assessment: mixed provenance retained criterion by criterion', () => {
  const a = attempt(); a.results[1].verification = 'human'; const r = evaluateAssessment(definition(), a);
  equal(r.criterionResults.map(x => x.verification), ['self_report', 'human']);
  equal(r.verificationSummary, {verification: 'mixed', verificationSources: ['human', 'self_report']});
});
test('Assessment: all 36 level/assistance combinations obey independence', () => {
  for (let first = 0; first <= 2; first++) for (let second = 0; second <= 2; second++) {
    for (const assistance of ['none', 'reference_sheet', 'hint', 'solution']) {
      const d = definition(), a = attempt(); a.results[0].level = first; a.results[1].level = second; a.assistance = assistance;
      equal(evaluateAssessment(d, a).evidenceEligible, first === 2 && second === 2 && ['none', 'reference_sheet'].includes(assistance));
    }
  }
});
test('Assessment: supplied result order cannot alter output', () => {
  const a = attempt(), b = attempt(); b.results.reverse(); equal(evaluateAssessment(definition(), a), evaluateAssessment(definition(), b));
});
test('Assessment: optional-only evidence does not hide missing required evidence', () => {
  const a = attempt(); a.results = [{criterionId: 'style', level: 2, verification: 'human'}];
  const r = evaluateAssessment(definition(), a); equal(r.status, 'incomplete'); equal(r.verificationSummary.verification, null);
});
test('Integration: demonstrated mixed evidence can supply planner without false provenance', () => {
  const d = definition(); d.skillId = 'files'; const a = attempt(); a.results[0].verification = 'automated'; a.results[1].verification = 'human';
  const assessment = evaluateAssessment(d, a); assert(assessment.evidenceEligible);
  const x = fixture(); x.evidencePolicy = 'verified_only'; x.tasks = [task('next', 45, {skillId: 'python'})];
  x.evidence = [{skillId: assessment.skillId, result: 'passed', independent: assessment.independent, ...assessment.verificationSummary}];
  const p = planDay(x); equal(p.allocations.length, 1); equal(p.allocations[0].prerequisiteEvidence[0].evidence.verification, 'mixed');
});
test('Browser scripts expose APIs without leaking implementation globals', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/planner.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/assessment.js'), 'utf8'), context);
  equal(typeof context.AtlasPlanner.planDay, 'function'); equal(typeof context.AtlasAssessment.evaluateAssessment, 'function');
  equal(Object.keys(context).sort(), ['AtlasAssessment', 'AtlasPlanner']);
  equal(context.AtlasPlanner.planDay(fixture()).activeBudgetMinutes, 360);
});

const failed = results.filter(r => !r.passed);
for (const result of failed) process.stderr.write('FAIL: ' + result.name + '\n' + result.error + '\n');
process.stdout.write(JSON.stringify({checks: results.length, passed: results.length - failed.length, failed: failed.length, generatedSchedules: 500, assessmentCombinations: 36}) + '\n');
process.exitCode = failed.length ? 1 : 0;
