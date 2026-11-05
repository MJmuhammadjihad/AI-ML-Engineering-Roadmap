/* First Principles Atlas — pure daily planner, edition 3.
 * Browser: AtlasPlanner.planDay(input). Node: require('./planner.js').planDay.
 *
 * Input:
 *   today: learner-local YYYY-MM-DD (never inferred from the machine clock)
 *   budget: {mode:'active'|'elapsed', minutes:int, breakMinutes:int}
 *   routes: string[], routeId?: string|null (null means all routes)
 *   skills: {id, requires?:skillId[]}[] (the whole graph is validated)
 *   tasks: {id,title?,skillId,kind,requires?,routeIds?,dueDate?,order?,blocks}[]
 *     kind: repair|review|assessment|practice|learn; reviews require dueDate
 *     blocks: {id,title?,minutes:positiveInt}[] in pedagogical order
 *   evidence: {skillId,result,independent,verification,verificationSources?,reviewDue?}[]
 *     result: passed|partial|failed|not_assessed; one current record per skill
 *     verification: self_report|automated|human|mixed; mixed lists its sources
 *   completedBlockKeys: ['taskId:blockId', ...]
 *   evidencePolicy?: allow_self_report (default)|verified_only
 *   reviewLimitMinutes?: int|null (default: full active capacity)
 *
 * Blocks are indivisible, ordered work segments, not assessment gates. Put an
 * assessment-dependent activity in a separate task with a skill prerequisite.
 * A planned prerequisite never becomes evidence. Historical completion also
 * does not demonstrate skill. The caller owns the evidence history and chooses
 * its current snapshot; this function never mutates evidence or completion.
 *
 * This is a deterministic priority-then-fit heuristic, not an optimal learning
 * algorithm or an estimate of retention. Break minutes are a RESERVED allowance,
 * not a generated timetable. studyOffsetMinutes excludes breaks. The 1440-minute
 * maximum is this planner's chosen 24-hour window, not a claim about civil days.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AtlasPlanner = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;
  const KINDS = ['repair', 'review', 'assessment', 'practice', 'learn'];
  const RESULTS = ['passed', 'partial', 'failed', 'not_assessed'];
  const SOURCES = ['self_report', 'automated', 'human'];
  const PROVENANCE = [...SOURCES, 'mixed'];

  function invariant(ok, message) { if (!ok) throw new TypeError(message); }
  function record(value, path) {
    invariant(value !== null && typeof value === 'object' && !Array.isArray(value), path + ' must be an object');
    return value;
  }
  function id(value, path) {
    invariant(typeof value === 'string' && ID.test(value), path + ' must be a stable ID');
    return value;
  }
  function list(value, path) { invariant(Array.isArray(value), path + ' must be an array'); return value; }
  function ids(value, path) {
    const out = list(value, path).map((v, i) => id(v, path + '[' + i + ']'));
    invariant(new Set(out).size === out.length, path + ' contains duplicate IDs');
    return out.slice().sort();
  }
  function minutes(value, path, minimum = 0) {
    invariant(Number.isSafeInteger(value) && value >= minimum && value <= 1440,
      path + ' must be an integer from ' + minimum + ' to 1440');
    return value;
  }
  function date(value, path) {
    invariant(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), path + ' must be YYYY-MM-DD');
    const parsed = new Date(value + 'T00:00:00.000Z');
    invariant(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, path + ' is not a calendar date');
    return value;
  }
  function label(value, fallback, path) {
    if (value === undefined) return fallback;
    invariant(typeof value === 'string' && value.trim().length > 0 && value.length <= 2000, path + ' must be nonempty text');
    return value;
  }
  function numericOrder(value, path) {
    if (value === undefined) return 0;
    invariant(Number.isSafeInteger(value) && value >= 0, path + ' must be a nonnegative safe integer');
    return value;
  }
  function compareText(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  function planDay(input) {
    record(input, 'input');
    const today = date(input.today, 'today');
    const budget = record(input.budget, 'budget');
    invariant(budget.mode === 'active' || budget.mode === 'elapsed', 'budget.mode must be active or elapsed');
    const chosenMinutes = minutes(budget.minutes, 'budget.minutes');
    const reservedBreakMinutes = minutes(budget.breakMinutes, 'budget.breakMinutes');
    const activeBudgetMinutes = budget.mode === 'active' ? chosenMinutes : chosenMinutes - reservedBreakMinutes;
    invariant(activeBudgetMinutes >= 0, 'Breaks exceed the elapsed-time budget');
    const elapsedCapacityMinutes = activeBudgetMinutes + reservedBreakMinutes;
    invariant(elapsedCapacityMinutes <= 1440, 'Study and reserved breaks exceed the 24-hour planning window');
    const reviewLimitMinutes = input.reviewLimitMinutes === undefined || input.reviewLimitMinutes === null
      ? activeBudgetMinutes : minutes(input.reviewLimitMinutes, 'reviewLimitMinutes');
    invariant(reviewLimitMinutes <= activeBudgetMinutes, 'Review limit exceeds active capacity');
    const evidencePolicy = input.evidencePolicy === undefined ? 'allow_self_report' : input.evidencePolicy;
    invariant(['allow_self_report', 'verified_only'].includes(evidencePolicy), 'Unknown evidence policy');
    const routes = ids(input.routes, 'routes');
    const selectedRoute = input.routeId === undefined || input.routeId === null ? null : id(input.routeId, 'routeId');
    invariant(selectedRoute === null || routes.includes(selectedRoute), 'Selected route does not exist');

    const skillMap = new Map();
    for (const raw of list(input.skills, 'skills')) {
      const skill = record(raw, 'skill');
      const skillId = id(skill.id, 'skill.id');
      invariant(!skillMap.has(skillId), 'Duplicate skill ID: ' + skillId);
      skillMap.set(skillId, {id: skillId, requires: ids(skill.requires === undefined ? [] : skill.requires, 'skill.requires')});
    }
    for (const skill of skillMap.values()) for (const dependency of skill.requires) {
      invariant(skillMap.has(dependency), 'Skill ' + skill.id + ' requires unknown skill ' + dependency);
    }
    // Iterative DFS also detects disconnected cycles without recursion-depth limits.
    const colors = new Map();
    const ancestors = new Map();
    for (const root of [...skillMap.keys()].sort()) {
      if (colors.get(root) === 2) continue;
      const stack = [{id: root, next: 0}];
      colors.set(root, 1);
      while (stack.length) {
        const frame = stack[stack.length - 1];
        const dependencies = skillMap.get(frame.id).requires;
        if (frame.next < dependencies.length) {
          const dependency = dependencies[frame.next++];
          if (colors.get(dependency) === 1) {
            throw new TypeError('Skill dependency cycle: ' + stack.map(f => f.id).concat(dependency).join(' -> '));
          }
          if (colors.get(dependency) !== 2) {
            colors.set(dependency, 1);
            stack.push({id: dependency, next: 0});
          }
        } else {
          const all = new Set();
          for (const dependency of dependencies) {
            all.add(dependency);
            for (const ancestor of ancestors.get(dependency)) all.add(ancestor);
          }
          ancestors.set(frame.id, [...all].sort());
          colors.set(frame.id, 2);
          stack.pop();
        }
      }
    }

    const evidence = new Map();
    const unmatchedEvidenceSkillIds = [];
    for (const raw of list(input.evidence, 'evidence')) {
      const item = record(raw, 'evidence record');
      const skillId = id(item.skillId, 'evidence.skillId');
      invariant(!evidence.has(skillId), 'Multiple current evidence records for skill ' + skillId);
      invariant(RESULTS.includes(item.result), 'Unknown assessment result for ' + skillId);
      invariant(typeof item.independent === 'boolean', 'Evidence must state independent performance for ' + skillId);
      invariant(PROVENANCE.includes(item.verification), 'Evidence must state its verification source for ' + skillId);
      const verificationSources = item.verification === 'mixed'
        ? ids(item.verificationSources, 'evidence.verificationSources') : [item.verification];
      invariant(verificationSources.every(source => SOURCES.includes(source)), 'Unknown underlying verification source');
      invariant(item.verification !== 'mixed' || verificationSources.length >= 2, 'Mixed verification must identify at least two distinct sources');
      if (item.verification !== 'mixed' && item.verificationSources !== undefined) {
        invariant(JSON.stringify(ids(item.verificationSources, 'evidence.verificationSources')) === JSON.stringify(verificationSources), 'Verification label conflicts with its sources');
      }
      invariant(item.reviewDue === undefined || typeof item.reviewDue === 'boolean', 'reviewDue must be boolean');
      evidence.set(skillId, {
        skillId, result: item.result, independent: item.independent,
        verification: item.verification, verificationSources, reviewDue: item.reviewDue === true
      });
      if (!skillMap.has(skillId)) unmatchedEvidenceSkillIds.push(skillId);
    }

    const taskMap = new Map();
    for (const raw of list(input.tasks, 'tasks')) {
      const item = record(raw, 'task');
      const taskId = id(item.id, 'task.id');
      const skillId = id(item.skillId, 'task.skillId');
      invariant(skillMap.has(skillId), 'Task ' + taskId + ' targets unknown skill ' + skillId);
      invariant(KINDS.includes(item.kind), 'Unknown task kind for ' + taskId);
      const requires = ids(item.requires === undefined ? [] : item.requires, 'task.requires');
      for (const prerequisite of requires) invariant(skillMap.has(prerequisite), 'Task ' + taskId + ' requires unknown skill ' + prerequisite);
      const routeIds = ids(item.routeIds === undefined ? [] : item.routeIds, 'task.routeIds');
      for (const route of routeIds) invariant(routes.includes(route), 'Task ' + taskId + ' has unknown route ' + route);
      const dueDate = item.dueDate === undefined || item.dueDate === null ? null : date(item.dueDate, 'task.dueDate');
      invariant(item.kind !== 'review' || dueDate !== null, 'Review task ' + taskId + ' needs a due date');
      const blocks = list(item.blocks, 'task.blocks').map(rawBlock => {
        const block = record(rawBlock, 'block');
        const blockId = id(block.id, 'block.id');
        return {id: blockId, title: label(block.title, blockId, 'block.title'), minutes: minutes(block.minutes, 'block.minutes', 1)};
      });
      invariant(blocks.length > 0, 'Task ' + taskId + ' must have an authored work block');
      invariant(new Set(blocks.map(b => b.id)).size === blocks.length, 'Duplicate block ID in ' + taskId);
      const task = {
        id: taskId, title: label(item.title, taskId, 'task.title'), skillId,
        kind: item.kind, requires, dueDate, order: numericOrder(item.order, 'task.order'), blocks, routeIds
      };
      const previous = taskMap.get(taskId);
      if (previous) {
        const semantic = t => JSON.stringify({...t, routeIds: []});
        invariant(semantic(previous) === semantic(task), 'Conflicting definitions of task ' + taskId);
        previous.routeIds = previous.routeIds.length === 0 || task.routeIds.length === 0
          ? [] : [...new Set([...previous.routeIds, ...task.routeIds])].sort();
      } else taskMap.set(taskId, task);
    }

    const knownBlockKeys = new Set();
    for (const task of taskMap.values()) for (const block of task.blocks) knownBlockKeys.add(task.id + ':' + block.id);
    const completed = new Set();
    for (const key of list(input.completedBlockKeys, 'completedBlockKeys')) {
      invariant(typeof key === 'string' && key.split(':').length === 2, 'Completed block keys must be taskId:blockId');
      const [taskId, blockId] = key.split(':');
      id(taskId, 'completed task ID'); id(blockId, 'completed block ID');
      completed.add(key);
    }
    const unmatchedCompletionKeys = [...completed].filter(key => !knownBlockKeys.has(key)).sort();
    const tasks = [...taskMap.values()].sort((a, b) =>
      KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) ||
      compareText(a.dueDate || '9999-12-31', b.dueDate || '9999-12-31') ||
      a.order - b.order || compareText(a.id, b.id)
    );

    function prerequisiteEvidence(task) {
      const required = new Set(ancestors.get(task.skillId));
      for (const prerequisite of task.requires) {
        required.add(prerequisite);
        for (const ancestor of ancestors.get(prerequisite)) required.add(ancestor);
      }
      return [...required].sort().map(skillId => {
        const item = evidence.get(skillId);
        let reason = null;
        if (!item || item.result === 'not_assessed') reason = 'missing_prerequisite_evidence';
        else if (item.result !== 'passed' || !item.independent) reason = 'prerequisite_not_met';
        else if (evidencePolicy === 'verified_only' && item.verificationSources.includes('self_report')) reason = 'verification_required';
        return {skillId, reason, evidence: item ? {...item, verificationSources: item.verificationSources.slice()} : null};
      });
    }

    const allocations = [], backlog = [], taskStates = [], notices = [];
    let plannedActiveMinutes = 0, plannedReviewMinutes = 0;
    const deferred = (task, block, reason, details = {}) => backlog.push({
      taskId: task.id, blockId: block.id, key: task.id + ':' + block.id,
      title: block.title, minutes: block.minutes, reason, details
    });
    for (const task of tasks) {
      const pending = task.blocks.filter(block => !completed.has(task.id + ':' + block.id));
      const state = {taskId: task.id, state: null, plannedBlockCount: 0, remainingBlockCount: pending.length};
      taskStates.push(state);
      // Filter before completion so an unrelated completed route cannot make this
      // selected route appear complete.
      if (selectedRoute !== null && task.routeIds.length && !task.routeIds.includes(selectedRoute)) {
        state.state = 'outside_route';
        for (const block of pending) deferred(task, block, 'outside_route');
        continue;
      }
      if (!pending.length) { state.state = 'complete'; continue; }
      if (task.kind === 'review' && task.dueDate > today) {
        state.state = 'not_due';
        for (const block of pending) deferred(task, block, 'not_due', {dueDate: task.dueDate});
        continue;
      }
      const prerequisiteChecks = prerequisiteEvidence(task);
      const unmet = prerequisiteChecks.filter(check => check.reason !== null);
      if (unmet.length) {
        state.state = 'blocked';
        for (const block of pending) deferred(task, block, 'prerequisites', {checks: unmet});
        continue;
      }
      let blockedBy = null;
      for (const block of pending) {
        if (blockedBy !== null) {
          deferred(task, block, 'earlier_block_deferred', {blockId: blockedBy});
          continue;
        }
        const remaining = activeBudgetMinutes - plannedActiveMinutes;
        let reason = null;
        if (block.minutes > activeBudgetMinutes) reason = 'exceeds_active_budget';
        else if (block.minutes > remaining) reason = 'insufficient_remaining_time';
        else if (task.kind === 'review' && block.minutes > reviewLimitMinutes - plannedReviewMinutes) reason = 'review_budget_limit';
        if (reason !== null) {
          deferred(task, block, reason, {remainingMinutes: remaining, reviewRemainingMinutes: reviewLimitMinutes - plannedReviewMinutes});
          blockedBy = block.id;
          continue;
        }
        allocations.push({
          taskId: task.id, blockId: block.id, key: task.id + ':' + block.id,
          title: block.title, skillId: task.skillId, kind: task.kind, minutes: block.minutes,
          studyOffsetMinutes: plannedActiveMinutes, prerequisiteEvidence: prerequisiteChecks
        });
        plannedActiveMinutes += block.minutes;
        if (task.kind === 'review') plannedReviewMinutes += block.minutes;
        state.plannedBlockCount += 1;
      }
      state.state = state.plannedBlockCount === pending.length ? 'planned' : state.plannedBlockCount ? 'partly_planned' : 'deferred';
    }
    if (unmatchedCompletionKeys.length) notices.push({code: 'legacy_completion_unmatched', keys: unmatchedCompletionKeys.slice()});
    if (unmatchedEvidenceSkillIds.length) notices.push({code: 'legacy_evidence_unmatched', skillIds: unmatchedEvidenceSkillIds.sort().slice()});
    if (reservedBreakMinutes) notices.push({code: 'break_allowance_not_timetable', minutes: reservedBreakMinutes});
    if (!activeBudgetMinutes) notices.push({code: 'no_active_capacity'});
    if (plannedActiveMinutes < activeBudgetMinutes) notices.push({code: 'unassigned_study_time', minutes: activeBudgetMinutes - plannedActiveMinutes});
    const activeTasks = taskStates.filter(s => s.state !== 'outside_route');
    let emptyReason = null;
    if (!allocations.length) {
      if (!activeBudgetMinutes) emptyReason = 'no_active_capacity';
      else if (!tasks.length) emptyReason = 'no_tasks';
      else if (!activeTasks.length) emptyReason = 'no_matching_tasks';
      else if (activeTasks.every(s => s.state === 'complete')) emptyReason = 'all_complete';
      else if (activeTasks.some(s => s.state === 'deferred')) emptyReason = 'insufficient_capacity';
      else if (activeTasks.some(s => s.state === 'blocked')) emptyReason = 'prerequisites';
      else emptyReason = 'nothing_due';
    }
    return {
      plannerVersion: '3.0', policy: 'deterministic_priority_then_fit',
      today, budgetMode: budget.mode, evidencePolicy, activeBudgetMinutes,
      reservedBreakMinutes, elapsedCapacityMinutes, plannedActiveMinutes,
      plannedReviewMinutes, unusedActiveMinutes: activeBudgetMinutes - plannedActiveMinutes,
      allocations, backlog, taskStates, notices, emptyReason,
      unmatchedCompletionKeys, unmatchedEvidenceSkillIds: unmatchedEvidenceSkillIds.sort()
    };
  }
  return Object.freeze({planDay});
});
