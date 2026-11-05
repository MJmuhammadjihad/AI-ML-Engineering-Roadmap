  // Embedded inside the application closure. Content and state remain separate.
  const F = D.foundations?.lessons || [];
  const foundationById = Object.fromEntries(F.map(l => [l.id, l]));
  const foundationBlockKeys = new Set(F.flatMap(l => l.blocks.map(b => l.id + ":" + b.id)));
  const guidance = D.guidance?.modules || {};
  let currentFoundationId = F[0]?.id || "";
  const foundationUndo = [];
  const paragraphs = text => String(text || "").split(/\n\s*\n/).filter(Boolean).map(p => "<p>" + esc(p) + "</p>").join("");
  const listHtml = values => "<ul>" + (values || []).map(v => "<li>" + esc(typeof v === "string" ? v : JSON.stringify(v)) + "</li>").join("") + "</ul>";
  const fLink = (lesson, label, cls = "btn") => '<a class="' + cls + '" href="#lesson/' + esc(lesson.id) + '" data-action="foundation-open" data-id="' + esc(lesson.id) + '">' + esc(label || lesson.title) + "</a>";
  const fStatus = id => {
    const result = foundationResult(id);
    const unmet = (foundationById[id]?.prerequisiteLessonIds || []).some(p => !foundationResult(p)?.evidenceEligible);
    return result?.evidenceEligible ? "Demonstrated · self-reported" : result ? result.status.replaceAll("_", " ") : unmet ? "Earlier evidence check pending" : "Ready to practice";
  };
  function validateV3(x, s) {
    const object = (v, label) => {
      if (!v || typeof v !== "object" || Array.isArray(v)) throw Error("Invalid " + label + ".");
      return v;
    };
    s.foundationTimeMode = x.foundationTimeMode || "active";
    if (!["active", "elapsed"].includes(s.foundationTimeMode)) throw Error("Invalid foundation time mode.");
    s.foundationBreakMinutes = x.foundationBreakMinutes === undefined ? 90 : x.foundationBreakMinutes;
    if (!Number.isInteger(s.foundationBreakMinutes) || s.foundationBreakMinutes < 0 || s.foundationBreakMinutes > 240 ||
        (s.foundationTimeMode === "elapsed" && s.foundationBreakMinutes > s.hours * 60)) throw Error("Break allowance exceeds the available time.");
    if (x.foundationBlocks !== undefined && !Array.isArray(x.foundationBlocks)) throw Error("Invalid foundation completion list.");
    s.foundationBlocks = [...new Set(x.foundationBlocks || [])];
    if (s.foundationBlocks.some(k => !foundationBlockKeys.has(k))) throw Error("Unknown foundation block.");
    if (x.foundationLogs !== undefined && !Array.isArray(x.foundationLogs)) throw Error("Invalid foundation time log.");
    if ((x.foundationLogs || []).length > 5000) throw Error("Foundation time log exceeds 5,000 entries.");
    const eventIds = new Set(), dayTotals = {...s.dailyWork};
    s.foundationLogs = (x.foundationLogs || []).map(event => {
      object(event, "foundation time entry");
      if (typeof event.id !== "string" || !/^[a-zA-Z0-9._-]{1,80}$/.test(event.id) || eventIds.has(event.id) ||
          !foundationBlockKeys.has(event.key) || !validDate(event.date) ||
          !Number.isInteger(event.minutes) || event.minutes < 0 || event.minutes > 1440) throw Error("Invalid foundation time entry.");
      eventIds.add(event.id);
      dayTotals[event.date] = (dayTotals[event.date] || 0) + event.minutes;
      if (dayTotals[event.date] > 1440) throw Error("Logged study exceeds the 24-hour planning window.");
      return {id:event.id, key:event.key, date:event.date, minutes:event.minutes};
    });
    for (const [id, value] of Object.entries(object(x.foundationNotes || {}, "foundation notes"))) {
      if (!Object.hasOwn(foundationById, id) || typeof value !== "string" || value.length > 10000) throw Error("Invalid foundation note.");
      s.foundationNotes[id] = value;
    }
    for (const [id, check] of Object.entries(object(x.foundationChecks || {}, "foundation checks"))) {
      const lesson = foundationById[id];
      if (!lesson) throw Error("Unknown foundation assessment.");
      object(check, "foundation assessment");
      if (!["none", "reference_sheet", "hint", "solution"].includes(check.assistance) ||
          typeof check.submitted !== "boolean" || (check.date !== null && !validDate(check.date))) throw Error("Invalid foundation assessment.");
      const allowed = new Set(lesson.independentTask.rubric.map(r => r.id)), levels = {};
      for (const [criterion, level] of Object.entries(object(check.levels, "criterion results"))) {
        if (!allowed.has(criterion) || !Number.isInteger(level) || level < 0 || level > 2) throw Error("Invalid criterion result.");
        levels[criterion] = level;
      }
      s.foundationChecks[id] = {levels, assistance:check.assistance, submitted:check.submitted, date:check.date};
    }
    if (x.version < 3) s.legacySnapshot = JSON.parse(JSON.stringify(x));
    else if (x.legacySnapshot !== undefined && x.legacySnapshot !== null) {
      object(x.legacySnapshot, "legacy snapshot");
      if (![1, 2].includes(x.legacySnapshot.version) || JSON.stringify(x.legacySnapshot).length > 1000000) throw Error("Invalid legacy snapshot.");
      s.legacySnapshot = JSON.parse(JSON.stringify(x.legacySnapshot));
    }
  }
  function foundationDefinition(lesson) {
    return {id:lesson.id + ".check", skillId:lesson.id, referenceSheetAllowed:true,
      criteria:lesson.independentTask.rubric.map(r => ({id:r.id, description:r.requirement || r.text,
        required:true, critical:r.critical === true, repairTaskId:r.id + ".repair"}))};
  }
  function foundationResult(id, source = state) {
    const lesson = foundationById[id], check = source.foundationChecks[id];
    if (!lesson || !check?.submitted) return null;
    return window.AtlasAssessment.evaluateAssessment(foundationDefinition(lesson), {
      assessmentId:lesson.id + ".check", assistance:check.assistance,
      results:Object.entries(check.levels).map(([criterionId, level]) => ({criterionId, level, verification:"self_report"}))
    });
  }
  function foundationDayMinutes(date = today()) {
    return (state.dailyWork[date] || 0) + sum(state.foundationLogs.filter(e => e.date === date).map(e => e.minutes));
  }
  function foundationCapacity() {
    return state.hours * 60 - (state.foundationTimeMode === "elapsed" ? state.foundationBreakMinutes : 0);
  }
  function foundationPlan() {
    const available = Math.max(0, foundationCapacity() - foundationDayMinutes());
    return window.AtlasPlanner.planDay({
      today:today(), budget:{mode:"active", minutes:available, breakMinutes:state.foundationBreakMinutes},
      routes:["foundations"], routeId:"foundations",
      skills:F.map(l => ({id:l.id, requires:l.prerequisiteLessonIds || []})),
      tasks:F.map((l, order) => ({id:l.id, skillId:l.id, title:l.title, kind:"learn", order,
        routeIds:["foundations"], blocks:l.blocks.map(b => ({id:b.id, title:b.title, minutes:b.minutes}))})),
      evidence:F.flatMap(l => {
        const result = foundationResult(l.id);
        return result ? [{skillId:l.id, result:result.evidenceEligible ? "passed" : "partial",
          independent:result.independent, verification:"self_report"}] : [];
      }),
      completedBlockKeys:state.foundationBlocks, evidencePolicy:"allow_self_report"
    });
  }
  function foundationNext() {
    return F.find(l => !foundationResult(l.id)?.evidenceEligible) || null;
  }
  function foundationBudgetForm() {
    return '<div class="v3-budget-fields"><label for="foundation-time-mode">Daily time means</label><select id="foundation-time-mode" data-setting="foundationTimeMode">' +
      '<option value="active"' + (state.foundationTimeMode === "active" ? " selected" : "") + '>Active study; breaks additional</option><option value="elapsed"' +
      (state.foundationTimeMode === "elapsed" ? " selected" : "") + '>Elapsed time; includes breaks</option></select>' +
      '<label for="foundation-hours">Available hours per study day</label><input id="foundation-hours" data-setting="hours" type="number" min="1" max="12" step="0.5" value="' + state.hours + '">' +
      '<label for="foundation-breaks">Break allowance, minutes</label><input id="foundation-breaks" data-setting="foundationBreakMinutes" type="number" min="0" max="240" step="5" value="' +
      state.foundationBreakMinutes + '"><p class="micro">Breaks are a reserved allowance, not a generated timetable. Change this to fit your day.</p></div>';
  }
  function todayView() {
    const next = foundationNext(), plan = foundationPlan();
    const demonstrated = F.filter(l => foundationResult(l.id)?.evidenceEligible).length;
    const nextMain = nextLesson();
    const opening = next ? '<span class="eyebrow">YOUR NEXT CAPABILITY · FOUNDATION ' + String(F.indexOf(next) + 1).padStart(2, "0") + '</span><h2>' + esc(next.title) +
      '</h2><p class="v3-lead">' + esc(next.outcome) + '</p><div class="v3-lesson-meta"><span>Start from zero</span><span>Build a real artifact</span><span>Check your understanding</span></div>' +
      fLink(next, state.foundationBlocks.some(k => k.startsWith(next.id + ":")) ? "Continue this lesson →" : "Start this lesson →", "btn primary") :
      '<span class="eyebrow">YOUR FOUNDATIONS ARE DEMONSTRATED</span><h2>Take the next step into the full atlas.</h2><p class="v3-lead">Use the same predict, build, test, and explain cycle across software, mathematics, models, and reliable systems.</p><button class="btn primary" data-action="continue">' +
      (nextMain ? "Continue the core curriculum →" : "Review your portfolio →") + '</button>';
    return heading("YOUR LEARNING WORKSPACE · EDITION 03", "Make one idea<br>your own.", "A clear next step. Time to work. Evidence you can explain.") +
      '<div class="v3-today-grid"><section class="v3-foundation-hero">' + opening +
      '<p class="micro v3-status">' + demonstrated + ' / ' + F.length + ' foundation checks demonstrated · Self-reported evidence, not external certification.</p></section>' +
      '<aside class="card v3-budget-card"><span class="eyebrow">YOUR TIME, MADE VISIBLE</span><div class="v3-budget-number">' + foundationCapacity() +
      '<small>active-minute daily budget</small></div><dl class="v3-budget-list"><dt>Already logged</dt><dd>' + foundationDayMinutes() + ' min</dd><dt>Study planned next</dt><dd>' +
      plan.plannedActiveMinutes + ' min</dd><dt>Unassigned study capacity</dt><dd>' + plan.unusedActiveMinutes + ' min</dd><dt>Break allowance</dt><dd>' +
      state.foundationBreakMinutes + ' min</dd></dl><details><summary>Adjust today’s rhythm</summary>' + foundationBudgetForm() + '</details><a href="#planner" class="text-btn">Core curriculum calendar →</a></aside></div>' +
      '<div class="section-heading"><div><span class="eyebrow">A PLAN THAT RESPECTS YOUR EVIDENCE</span><h2>Today’s working sequence</h2></div><a href="#practice" class="text-btn">Review your evidence →</a></div>' +
      (plan.allocations.length ? '<ol class="v3-session-outline">' + plan.allocations.map(a => '<li><div><strong>' + esc(a.title) + '</strong><p>' +
        esc(foundationById[a.taskId].title) + '</p></div><span class="v3-duration">' + a.minutes + ' min</span>' + fLink(foundationById[a.taskId], "Open", "btn small") + '</li>').join("") + '</ol>' :
        '<div class="notice green"><h3>' + (plan.activeBudgetMinutes === 0 ? "Your study budget is used." : next ? "Your next step is an evidence check." : "Your foundation sequence is complete.") +
        '</h3><p>' + (plan.activeBudgetMinutes === 0 ? "Recorded time stays visible. Continue reading if you choose; tomorrow’s plan does not silently add catch-up hours." :
        next ? "Open the lesson, finish the independent task, and record its criterion checks. Completing a work block alone does not demonstrate its prerequisite skill." : "Continue with the core modules, practice labs, and portfolio projects.") + '</p></div>') +
      '<p class="micro">Whole blocks keep meaningful stopping points. A planned lesson never counts as a passed prerequisite. Read ahead whenever useful; recommendations stay tied to recorded evidence.</p>' +
      '<div class="section-heading"><div><span class="eyebrow">YOUR FIRST SIX STUDY DAYS</span><h2>One project, steadily more capable.</h2></div><a href="#journey" class="text-btn">Explore the full path →</a></div>' +
      '<div class="v3-phase-grid">' + F.map((l, i) => '<article class="v3-phase"><span class="v3-phase-number">' + String(i + 1).padStart(2, "0") +
        '</span><div><h3>' + esc(l.title) + '</h3><p>' + esc(l.outcome) + '</p><span class="v3-status">' + esc(fStatus(l.id)) + '</span></div>' +
        fLink(l, "Open lesson →", "text-btn") + '</article>').join("") + '</div><div class="notice"><b>A flexible beginning.</b> These are six authored 360-minute study plans, with breaks additional by default. They are not deadlines. Repeat a repair exercise when evidence calls for it; the full atlas remains available from Path and Library.</div>';
  }
  function foundationAssessmentMarkup(lesson) {
    const check = state.foundationChecks[lesson.id] || {levels:{}, assistance:"none", submitted:false};
    const result = foundationResult(lesson.id);
    return '<section class="v3-lesson-section" id="foundation-check"><span class="eyebrow">LEAVE EVIDENCE, NOT JUST A CHECKMARK</span><h2>Can you do it independently?</h2>' +
      '<p>Use your independent artifact and a fresh transfer attempt. A level of 2 means you can show the result and explain why it works. These are your own assessments; this page does not execute or certify your work.</p><div class="v3-criteria">' +
      lesson.independentTask.rubric.map((r, index) => '<label class="v3-criterion" for="criterion-' + index + '"><span><b>' + esc(r.requirement || r.text) + '</b>' +
        (r.critical ? '<small>Essential criterion</small>' : '') + '</span><select id="criterion-' + index + '" data-foundation-level data-id="' + lesson.id + '" data-criterion="' + esc(r.id) + '">' +
        '<option value="">Not assessed</option>' + [[0,"0 · Incorrect or missing"],[1,"1 · Partial or assisted"],[2,"2 · Independently demonstrated"]].map(([n,label]) =>
        '<option value="' + n + '"' + (check.levels[r.id] === n ? " selected" : "") + '>' + label + '</option>').join("") + '</select></label>').join("") +
      '</div><label class="note-label" for="foundation-assistance">Assistance used in this attempt</label><select id="foundation-assistance" data-foundation-assistance data-id="' +
      lesson.id + '">' + [["none","No hints or solution"],["reference_sheet","Syntax reference sheet only"],["hint","Substantial hints"],["solution","Worked solution followed"]].map(([value,label]) =>
      '<option value="' + value + '"' + (check.assistance === value ? " selected" : "") + '>' + label + '</option>').join("") + '</select><p class="micro">A permitted syntax reference is compatible with independence. Hints or a followed solution call for a fresh transfer attempt before recording independent evidence.</p>' +
      '<button class="btn primary" data-action="foundation-assess" data-id="' + lesson.id + '">Record this assessment</button>' +
      '<div class="v3-assessment-result" role="status">' + (result ? '<h3>' + esc(result.status.replaceAll("_", " ")) + '</h3><p>' +
      (result.evidenceEligible ? "All required criteria are independently demonstrated according to your record. The next foundation can now be recommended." :
      result.status === "practice_recorded" ? "The completed work is useful practice. Attempt a fresh variation without hints, then update the evidence." :
      result.status === "repair_recommended" ? "Use the targeted repair below, then test a fresh case. A correct answer on another criterion does not cancel this gap." :
      "Some required evidence is still missing. Record it when you have an artifact or explanation to inspect.") + '</p><small>Evidence source: self-report · ' + esc(check.date || "") + '</small>' : "No assessment submitted yet.") + '</div></section>';
  }
  function foundationLessonView() {
    const l = foundationById[currentFoundationId] || F[0];
    if (!l) return heading("FOUNDATIONS", "The lesson is unavailable.", "Return to Today to choose a learning step.");
    const index = F.indexOf(l), ex = l.workedExample;
    const prerequisites = (l.prerequisiteLessonIds || []).map(id => foundationById[id]).filter(Boolean);
    const unmet = prerequisites.filter(p => !foundationResult(p.id)?.evidenceEligible);
    const blockMarkup = l.blocks.map((b, i) => {
      const key = l.id + ":" + b.id, done = state.foundationBlocks.includes(key);
      return '<article class="v3-block" id="foundation-block-' + i + '"><div class="v3-block-heading"><span class="v3-phase-number">' + String(i + 1).padStart(2, "0") +
        '</span><div><h3>' + esc(b.title) + '</h3><span class="v3-duration">' + b.minutes + ' active minutes planned</span></div><span class="v3-status">' + (done ? "Practiced" : "To practice") +
        '</span></div>' + listHtml(b.actions) + '<p class="v3-evidence-line"><b>Keep:</b> ' + esc(b.evidence) + '</p>' +
        (b.stopRule ? '<p class="micro">' + esc(b.stopRule) + '</p>' : '') +
        (done ? '<button class="text-btn" data-action="foundation-reopen" data-id="' + l.id + '" data-block="' + esc(b.id) + '">Reopen practice; keep logged time</button>' :
          '<div class="v3-block-log"><label for="minutes-' + i + '">Actual active minutes</label><input id="minutes-' + i + '" data-foundation-minutes="' + esc(b.id) +
          '" type="number" min="0" max="1440" step="1" value="' + b.minutes + '"><button class="btn small" data-action="foundation-log" data-id="' + l.id +
          '" data-block="' + esc(b.id) + '">Log time & mark practiced</button></div>') + '</article>';
    }).join("");
    const setup = l.setupGuide ? setupMarkup(l.setupGuide) : "";
    return '<div class="v3-reading-header"><div class="row spread flex-wrap"><a href="#today" class="text-btn">← Today</a><span class="eyebrow">FOUNDATION ' +
      String(index + 1).padStart(2, "0") + ' / ' + F.length + '</span></div><h1>' + esc(l.title) + '</h1><p class="v3-lead">' + esc(l.outcome) +
      '</p><div class="v3-lesson-meta"><span>' + l.activeMinutes + ' active minutes</span><span>' + (l.breaks?.minutes || 90) +
      ' minutes suggested breaks, additional</span><span data-foundation-current-status>' + esc(fStatus(l.id)) + '</span></div></div>' +
      (unmet.length ? '<div class="notice"><b>Read ahead is available.</b> Before independent practice, check the earlier foundations: ' + unmet.map(p => fLink(p,p.title,"text-btn")).join(" · ") +
      '. Missing evidence does not prove you cannot do it; it means the planner cannot yet recommend the dependency.</div>' : '') +
      '<div class="v3-reading-layout"><div class="v3-lesson-content">' + setup +
      '<section class="v3-lesson-section v3-prose" id="foundation-idea"><span class="eyebrow">UNDERSTAND THE MECHANISM</span><h2>The idea beneath the code</h2>' + paragraphs(l.conceptExplanation) + '</section>' +
      '<section class="v3-lesson-section" id="foundation-example"><span class="eyebrow">PREDICT → TRACE → RUN</span><h2>A worked example you can inspect</h2>' +
      '<div class="code-toolbar"><span>' + esc(ex.fileName) + '</span><button class="btn small" data-action="foundation-download" data-id="' + l.id + '">Download Python file</button></div>' +
      '<pre class="code-block" tabindex="0" aria-label="Python worked example"><code>' + esc(ex.code) + '</code></pre>' +
      (ex.stdin ? '<h3>Inputs, in order</h3><pre class="expected-output">' + esc(ex.stdin) + '</pre>' : '') + '<h3>Expected program output</h3><pre class="expected-output">' +
      esc(ex.expectedOutput) + '</pre><p class="micro">' + esc(ex.outputNote || "") + ' Validation: ' + esc(ex.executionStatus.replaceAll("_"," ")) + '.</p>' +
      '<details><summary>Assumptions and current limits</summary>' + listHtml(ex.assumptions) + '</details></section>' +
      '<section class="v3-lesson-section" id="foundation-work"><span class="eyebrow">A DAY WITH A PURPOSE</span><h2>Your working sequence</h2><p>Time estimates set a starting scope. Record actual active time; break time stays separate. Reopening a block keeps its earlier time log.</p>' + blockMarkup +
      (foundationUndo.length ? '<button class="btn small" data-action="foundation-undo">Undo last foundation time entry</button>' : '') + '</section>' +
      '<section class="v3-lesson-section" id="foundation-independent"><span class="eyebrow">CLOSE THE EXAMPLE. BUILD AGAIN.</span><h2>Your independent task</h2>' +
      paragraphs(l.independentTask.prompt) + '<details data-foundation-hint data-id="' + l.id + '"><summary>Open a hint after your own attempt</summary>' + listHtml(l.independentTask.hints) +
      '<p class="micro">Record hints honestly when assessing this attempt. Use a fresh transfer task to demonstrate independence afterward.</p></details>' +
      (l.independentTask.tests?.length ? '<details><summary>Compare against the test cases</summary>' + l.independentTask.tests.map((t,i) => '<article class="v3-test-case"><h3>Case ' + (i+1) +
      '</h3><h4>Input or function call</h4><pre>' + esc(typeof (t.input ?? t.call) === 'string' ? (t.input ?? t.call) : JSON.stringify(t.input ?? t.call, null, 2)) + '</pre><h4>Expected result</h4>' + renderStructured(t.expected) +
      '<p class="micro">Run your own implementation and record its actual result in your notebook.</p></article>').join("") + '</details>' : '') + '</section>' +
      '<section class="v3-lesson-section" id="foundation-diagnostics"><span class="eyebrow">FIND THE MISCONCEPTION</span><h2>Make a prediction first</h2>' +
      l.diagnostics.map((q,i) => '<article class="v3-diagnostic-card"><h3>' + (i+1) + '. ' + esc(q.prompt) + '</h3><details class="v3-diagnostic"><summary>Check the reasoning after your attempt</summary><p><b>' +
      esc(q.answer) + '</b></p><p>' + esc(q.reason) + '</p><p><b>Common misconception:</b> ' + esc(q.misconception) + '</p><p><b>Repair:</b> ' + esc(q.repairExercise) + '</p></details></article>').join("") + '</section>' +
      '<section class="v3-lesson-section" id="foundation-transfer"><span class="eyebrow">CHANGE THE PROBLEM</span><h2>Transfer the idea</h2>' + paragraphs(l.transferCheck.prompt) +
      '<p><b>What to demonstrate:</b> ' + esc(l.transferCheck.passCondition) + '</p><details><summary>Check the expected result after your attempt</summary>' + paragraphs(l.transferCheck.expected) + '</details>' +
      '<div class="notice green"><h3>A targeted repair</h3><p><b>When:</b> ' + esc(l.misconceptionRepair.trigger) + '</p>' + paragraphs(l.misconceptionRepair.exercise) + '<p><b>Try again:</b> ' +
      esc(l.misconceptionRepair.recheck) + '</p></div></section>' + foundationAssessmentMarkup(l) +
      '<section class="v3-lesson-section" id="foundation-evidence"><span class="eyebrow">A RECORD YOU CAN RETURN TO</span><h2>Your evidence notebook</h2>' + listHtml(l.endArtifacts) +
      '<label class="note-label" for="foundation-note">Artifact location, test results, explanation, and next correction</label><textarea id="foundation-note" class="note-area" data-foundation-note="' + l.id +
      '" maxlength="10000" placeholder="What did you build? Which test changed your understanding?">' + esc(state.foundationNotes[l.id] || "") +
      '</textarea><p class="micro">Saved locally when browser storage is available. Export progress before moving devices.</p>' +
      (l.optionalResource ? '<div class="v3-source-card"><span class="eyebrow">OPTIONAL PRIMARY REFERENCE</span><h3><a href="' + esc(safeUrl(l.optionalResource.url)) +
      '" target="_blank" rel="noopener noreferrer">' + esc(l.optionalResource.title) + '</a></h3><p>' + esc(l.optionalResource.scope || "") + '</p><small>' +
      esc(l.optionalResource.verification || l.optionalResource.status || "See source validation record.") + '</small></div>' : "") + '</section>' +
      '<div class="row spread flex-wrap">' + (F[index-1] ? fLink(F[index-1], "← Previous foundation") : '<a href="#today" class="btn">Back to Today</a>') +
      (F[index+1] ? fLink(F[index+1], "Read next foundation →") : '<a href="#curriculum" class="btn primary">Continue into the full curriculum →</a>') + '</div></div>' +
      '<aside class="v3-lesson-toc"><span class="eyebrow">IN THIS LESSON</span>' +
      [["idea","The idea"],["example","Worked example"],["work","Working sequence"],["independent","Your task"],["diagnostics","Diagnostics"],["transfer","Transfer & repair"],["check","Evidence check"],["evidence","Your notebook"]].map(([id,label]) =>
      '<button class="text-btn" data-action="foundation-jump" data-target="foundation-' + id + '">' + label + '</button>').join("") +
      '<div class="v3-toc-note"><p>Reading is a beginning.<br>Understanding shows up in what you can do.</p><span class="micro" data-foundation-current-status>' + esc(fStatus(l.id)) + '</span></div></aside></div>';
  }
  function setupMarkup(s) {
    return '<section class="v3-lesson-section v3-setup"><span class="eyebrow">START WITH THE TOOLS YOU HAVE</span><h2>Your first saved program</h2>' + paragraphs(s.goal) +
      '<details><summary>Five words that make the setup easier</summary><dl class="v3-facts">' + s.terms.map(t => '<dt>' + esc(t.term) + '</dt><dd>' + esc(t.meaning) + '</dd>').join('') + '</dl></details>' +
      '<ol class="v3-setup-steps">' + s.commonSteps.map(step => '<li>' + esc(step) + '</li>').join('') + '</ol><h3>Save this as hello.py</h3><pre class="code-block"><code>' +
      esc(s.firstFileCode) + '</code></pre><h3>Choose your computer’s instructions</h3>' + s.platforms.map(platform => '<details class="v3-platform"><summary>' + esc(platform.name) +
      '</summary><div class="v3-platform-body"><p>' + esc(platform.explanation) + '</p><h4>Check Python, open your folder, then run the file</h4><pre class="code-block"><code>' +
      esc([...platform.checkCommands, ...platform.folderCommands, platform.runCommand].join('\n')) + '</code></pre><p><a href="' + esc(safeUrl(platform.installUrl)) +
      '" target="_blank" rel="noopener noreferrer">Official installation guidance</a></p></div></details>').join('') + '<p><b>Expected output:</b> <code>' + esc(s.expectedOutput.trim()) +
      '</code></p><details><summary>If the first run does not work</summary><dl class="v3-facts">' + s.troubleshooting.map(t => '<dt>' + esc(t.symptom) + '</dt><dd>' + esc(t.action) +
      '</dd>').join('') + '</dl></details><p class="micro">' + esc(s.stopRule) + '</p><p class="micro">The hello.py example was executed during validation. Installation steps are platform-specific guidance; they were not tested on every operating system.</p></section>';
  }
  function renderStructured(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return paragraphs(value);
    if (typeof value === "number" || typeof value === "boolean") return "<p>" + esc(value) + "</p>";
    if (Array.isArray(value)) return "<ul>" + value.map(v => "<li>" + renderStructured(v) + "</li>").join("") + "</ul>";
    return '<dl class="v3-facts">' + Object.entries(value).map(([key, v]) => "<dt>" + esc(key.replace(/([A-Z])/g," $1").replaceAll("_"," ")) + "</dt><dd>" + renderStructured(v) + "</dd>").join("") + "</dl>";
  }
  function guidanceMarkup(m) {
    const g = guidance[m.id];
    if (!g) return "";
    return '<section class="v3-module-guidance"><span class="eyebrow">EDITION 03 · TRANSFER & EVIDENCE</span><h3>' + esc(g.capability) +
      '</h3><details><summary>Check the foundations this task uses</summary>' + listHtml(g.readinessPrerequisites) +
      '</details><h4>A new problem to solve</h4><p>' + esc(g.transferTask.prompt) + '</p>' + listHtml(g.transferTask.acceptance) +
      (g.transferTask.referenceAnswer ? '<details><summary>Inspect a reference argument after your attempt</summary><p>' + esc(g.transferTask.referenceAnswer) + '</p></details>' : '') +
      '<h4>Observable evidence</h4><ul class="v3-module-rubric">' + g.rubric.map(r => '<li><b>' + esc(r.text) + '</b>' + (r.critical ? ' <span class="tag">Essential</span>' : "") + '</li>').join("") +
      '</ul><div class="notice green"><h4>Repair this specific misconception</h4><p><b>When:</b> ' + esc(g.repair.trigger) + '</p><p>' + esc(g.repair.exercise) +
      '</p><p><b>Recheck:</b> ' + esc(g.repair.recheck) + '</p></div><details><summary>Explain the reasoning to a reviewer</summary><p><b>' + esc(g.interview.prompt) +
      '</b></p><p>' + esc(g.interview.strongAnswer) + '</p></details><p class="micro"><b>Scope:</b> ' + esc(g.boundary) + '</p></section>';
  }
  function practiceView() {
    const reviews = dueReviews();
    return heading("THE PRACTICE ROOM", "Make your understanding<br>observable.", "A fresh problem tests transfer. A targeted repair addresses the smallest missing idea.") +
      '<div class="grid-3"><article class="card green"><span class="eyebrow">FOUNDATION CHECKS</span><h2>' + F.filter(l => foundationResult(l.id)?.evidenceEligible).length + ' / ' + F.length +
      '</h2><p>Independently demonstrated, according to your own criterion records.</p></article><article class="card"><span class="eyebrow">DUE RECALL</span><h2>' + reviews.length +
      '</h2><p>Previously self-assessed module gates ready for another explanation.</p></article><article class="card"><span class="eyebrow">TRANSFER TASKS</span><h2>' +
      Object.keys(guidance).length + '</h2><p>Different problems, observable rubrics, and misconception-specific repairs.</p></article></div>' +
      '<div class="section-heading"><h2>Your foundation evidence</h2></div><div class="v3-phase-grid">' +
      F.map(l => '<article class="v3-phase"><div><h3>' + esc(l.title) + '</h3><p>' + esc(fStatus(l.id)) + '</p></div>' + fLink(l,"Inspect evidence →","text-btn") + '</article>').join("") +
      '</div>' + (reviews.length ? '<div class="section-heading"><h2>Retrieve before rereading</h2></div><div class="grid-2">' +
      reviews.map(m => '<article class="card"><h3>' + esc(m.title) + '</h3><p>Explain the mechanism and one failure without opening the original artifact.</p><button class="btn" data-action="module" data-id="' +
      m.id + '">Open module & evidence</button></article>').join("") + '</div>' : '') +
      '<div class="section-heading"><div><span class="eyebrow">EVERY MODULE, A NEW TEST OF TRANSFER</span><h2>Work beyond the example.</h2></div><a href="#lab" class="text-btn">Open interactive concept labs →</a></div>' +
      '<div class="v3-module-practice-grid">' + selectedModules().map(m => '<article class="card"><span class="eyebrow">' + esc(m.id.toUpperCase()) + ' · ' + esc(m.phase) +
      '</span><h3>' + esc(m.title) + '</h3><p>' + esc(guidance[m.id]?.capability || m.summary) + '</p><button class="btn small" data-action="module-transfer" data-id="' + m.id +
      '">Open transfer task & repair →</button></article>').join("") + '</div>';
  }
  function marketMarkup() {
    const market = D.market;
    if (!market?.sources?.length) return "";
    return '<section class="v3-market-review"><div class="section-heading"><div><span class="eyebrow">PRIMARY SOURCES · ' + esc(market.asOf) +
      '</span><h2>What the evidence supports now</h2></div></div><div class="notice green">' + paragraphs(market.summary) +
      '<p>The employer sample is deliberately small and not representative of global hiring. Occupational projections, employer expectations, and individual vacancies answer different questions.</p></div>' +
      '<div class="v3-market-grid">' + market.implications.map(i => '<article class="v3-source-card"><span class="eyebrow">CURRICULUM DECISION</span><h3>' + esc(i.title) +
      '</h3><p>' + esc(i.decision) + '</p><p><b>Evidence to build:</b> ' + esc(i.artifact) + '</p><small>Source references: ' + esc((i.basis || []).join(", ")) + '</small></article>').join("") +
      '</div><details><summary>Read the research method and sampling limits</summary>' + renderStructured(market.methodology) + '</details>' +
      '<h3>Read the primary sources</h3><div class="v3-market-grid">' + market.sources.map(s => '<article class="v3-source-card" id="source-' + esc(s.id) + '"><span class="eyebrow">' +
      esc(s.id) + ' · ' + esc(s.kind) + '</span><h3><a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) +
      '</a></h3><p class="micro">' + esc(s.publisher) + ' · Retrieved ' + esc(s.accessed) + '</p><p><b>Scope:</b> ' + esc(s.scope) + '</p>' + listHtml(s.findings) +
      '<details><summary>Evidence passage and limitations</summary><blockquote>' + esc(s.excerpt) + '</blockquote>' + listHtml(s.limitations) + '<p class="micro">' +
      esc(s.verification) + '</p></details></article>').join("") + '</div><h3>A dated employer sample, with eligibility visible</h3><div class="table-wrap"><table><thead><tr><th>ROLE</th><th>LOCATION & SENIORITY</th><th>OBSERVED REQUIREMENTS</th><th>ELIGIBILITY LIMITS</th></tr></thead><tbody>' +
      market.jobSample.map(j => '<tr><td><a href="' + esc(safeUrl(j.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(j.title) + '</a><br><small>' +
      esc(j.employer) + ' · ' + esc(j.accessed) + '</small></td><td>' + esc(j.location) + '<br>' + esc(j.seniority) + '</td><td>' +
      esc(j.observedSkills.join(" · ")) + '</td><td>' + esc(j.eligibilityNotes) + '</td></tr>').join("") + '</tbody></table></div>' +
      '<details><summary>Prepare for several futures without pretending to predict one</summary>' + market.futureScenarios.map(s => '<h4>' + esc(s.condition) + '</h4><p>' +
      esc(s.response) + '</p><small>' + esc(s.status) + '</small>').join("") + '</details></section>';
  }
  function foundationDraft(id) {
    if (!state.foundationChecks[id]) state.foundationChecks[id] = {levels:{}, assistance:"none", submitted:false, date:null};
    return state.foundationChecks[id];
  }
  function v3Action(el) {
    const action = el.dataset.action, id = el.dataset.id, l = foundationById[id];
    if (!action?.startsWith("foundation-")) return false;
    if (action === "foundation-open") {
      if ($("#command-dialog").open) $("#command-dialog").close();
      if (l) location.hash = "lesson/" + id;
    } else if (action === "foundation-jump") {
      const target = document.getElementById(el.dataset.target);
      target?.scrollIntoView({block:"start"});
      if (target) { target.tabIndex = -1; target.focus({preventScroll:true}); }
    } else if (action === "foundation-download" && l) {
      download(l.workedExample.fileName, l.workedExample.code, "text/plain;charset=utf-8");
    } else if (action === "foundation-log" && l) {
      const b = l.blocks.find(b => b.id === el.dataset.block);
      const input = [...document.querySelectorAll("[data-foundation-minutes]")].find(input => input.dataset.foundationMinutes === b?.id);
      const n = input?.value === "" ? NaN : Number(input?.value);
      if (!b || !Number.isInteger(n) || n < 0 || foundationDayMinutes() + n > 1440) {
        toast("Enter whole active minutes within this 24-hour planning window."); input?.focus(); return true;
      }
      const key = l.id + ":" + b.id;
      if (state.foundationBlocks.includes(key)) return true;
      const event = {id:"f" + Date.now().toString(36) + "-" + state.foundationLogs.length, key, date:today(), minutes:n};
      foundationUndo.push({eventId:event.id, key});
      state.foundationLogs.push(event);
      state.foundationBlocks.push(key);
      save(); render();
      toast(n + " active minutes recorded. Practice completion is separate from demonstrated understanding.");
    } else if (action === "foundation-reopen" && l) {
      const key = l.id + ":" + el.dataset.block;
      state.foundationBlocks = state.foundationBlocks.filter(k => k !== key);
      save(); render(); toast("Practice reopened. Earlier time and assessment records are retained.");
    } else if (action === "foundation-undo") {
      const previous = foundationUndo.pop();
      if (previous) {
        state.foundationLogs = state.foundationLogs.filter(e => e.id !== previous.eventId);
        state.foundationBlocks = state.foundationBlocks.filter(k => k !== previous.key);
        save(); render(); toast("Last foundation time entry undone; notes and assessments are preserved.");
      }
    } else if (action === "foundation-assess" && l) {
      const check = foundationDraft(id);
      check.submitted = true; check.date = today();
      const result = foundationResult(id);
      save(); render();
      document.querySelector(".v3-assessment-result")?.scrollIntoView({block:"center"});
      toast(result.evidenceEligible ? "Independent evidence recorded as self-report." : "Assessment recorded. Inspect the next repair or evidence step.");
    }
    return true;
  }
  function v3Input(el) {
    if (el.dataset.foundationNote) {
      state.foundationNotes[el.dataset.foundationNote] = el.value.slice(0,10000);
      save(); return true;
    }
    return false;
  }
  function v3Change(el) {
    if (el.hasAttribute("data-foundation-level")) {
      const check = foundationDraft(el.dataset.id);
      if (el.value === "") delete check.levels[el.dataset.criterion];
      else check.levels[el.dataset.criterion] = Number(el.value);
      check.submitted = false; check.date = null; save(); refreshFoundationFeedback(el.dataset.id); return true;
    }
    if (el.hasAttribute("data-foundation-assistance")) {
      const check = foundationDraft(el.dataset.id);
      check.assistance = el.value; check.submitted = false; check.date = null; save(); refreshFoundationFeedback(el.dataset.id); return true;
    }
    return false;
  }
  function refreshFoundationFeedback(id) {
    const feedback = document.querySelector('.v3-assessment-result');
    if (feedback) feedback.textContent = 'Your changes are saved. Record this assessment when the evidence is ready.';
    document.querySelectorAll('[data-foundation-current-status]').forEach(node => { node.textContent = fStatus(id); });
  }
