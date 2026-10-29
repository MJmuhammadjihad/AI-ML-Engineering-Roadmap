(() => {
  "use strict";
  const D = window.ATLAS_DATA,
    modules = D.modules,
    byId = Object.fromEntries(modules.map((m) => [m.id, m]));
  const SOURCE_ALIASES = {
    git: "progit",
    math: "mit-linalg",
    calculus: "3b1b",
    sql: "sql",
    designingml: "made-with-ml",
  };
  const resources = D.resources,
    sourceById = Object.fromEntries(resources.map((r) => [r.id, r]));
  const KEY = "first-principles-atlas-v1";
  const $ = (s) => document.querySelector(s),
    esc = (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  const safeUrl = (u) => {
    try {
      const x = new URL(u);
      return x.protocol === "https:" ? x.href : "#";
    } catch {
      return "#";
    }
  };
  const today = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const dateAdd = (s, n) => {
    const d = new Date(s + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const dateLabel = (s) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(s + "T12:00:00Z"));
  const validDate = (s) =>
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s + "T12:00:00Z")) &&
    new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s &&
    s >= "2000-01-01" &&
    s <= "2100-12-31";
  const sum = (a) => a.reduce((x, y) => x + y, 0),
    minutes = (l) =>
      sum(
        [
          "videoMinutes",
          "readingMinutes",
          "practiceMinutes",
          "reviewMinutes",
        ].map((k) => Number(l[k]) || 0),
      );
  const lessonId = (m, i) => m.id + "-" + (i + 1),
    allLessonIds = new Set(
      modules.flatMap((m) => m.lessons.map((_, i) => lessonId(m, i))),
    );
  const nav = [
    ["overview", "◈", "Overview"],
    ["journey", "→", "Your journey"],
    ["curriculum", "▤", "The curriculum"],
    ["planner", "▦", "Daily planner"],
    ["lab", "⌁", "Concept lab"],
    ["portfolio", "◇", "Proof of skill"],
    ["evidence", "◎", "Research & outlook"],
    ["library", "▧", "Resource library"],
    ["method", "→", "How to learn"],
  ];
  const core = Array.from(
    { length: 24 },
    (_, i) => "c" + String(i + 1).padStart(2, "0"),
  );
  const foundations = ["c01", "c02", "c03", "c04", "b01"];
  const statistics = [
    "c05",
    "c06",
    "c07",
    "c08",
    "c09",
    "c10",
    "c11",
    "c12",
    "c13",
    "c14",
    "c15",
    "c16",
  ];
  const tracks = {
    ai: {
      name: "AI product engineer",
      short: "AI engineer",
      description:
        "Build useful AI products with defensible evaluation, secure integration and measured operating costs.",
      ids: [
        ...foundations,
        "a01",
        "b03",
        "b02",
        "c06",
        "a02",
        ...statistics,
        "c17",
        "c18",
        "c19",
        "c21",
        "c22",
        "c23",
        "a03",
        "a10",
        "c24",
        "b04",
        "a04",
        "a05",
        "a06",
        "a08",
        "a12",
      ],
      projects: ["p01", "p03", "p02"],
    },
    ml: {
      name: "Machine learning engineer",
      short: "ML engineer",
      description:
        "Develop reliable predictive models and own their data, training, serving and monitoring systems.",
      ids: [
        ...foundations,
        "b02",
        ...statistics,
        "c17",
        "c18",
        "c19",
        "a01",
        "a02",
        "a04",
        "a05",
        "a06",
        "a07",
        "a08",
        "a09",
        "a10",
        "a12",
      ],
      projects: ["p01", "p02"],
    },
    research: {
      name: "Research-oriented engineer",
      short: "Research",
      description:
        "Derive mechanisms, reproduce experiments, and distinguish a measured result from a plausible story.",
      ids: [
        ...foundations,
        ...statistics,
        "c17",
        "c18",
        "c19",
        "b05",
        "c20",
        "c21",
        "b02",
        "a04",
        "a11",
        "a10",
        "a12",
      ],
      projects: ["p01", "p04"],
    },
    fullstack: {
      name: "Full-stack AI developer",
      short: "Full-stack AI",
      description:
        "Build accessible interfaces and dependable APIs, then integrate AI only when evidence supports it.",
      ids: [
        ...foundations,
        "a01",
        "b03",
        "b02",
        "c06",
        "a02",
        ...statistics,
        "c17",
        "c18",
        "c19",
        "c21",
        "c22",
        "c23",
        "a03",
        "a04",
        "a06",
        "a10",
        "a12",
      ],
      projects: ["p01", "p03"],
    },
    all: {
      name: "The complete atlas",
      short: "Complete atlas",
      description:
        "Every foundation and specialization. Use this as a reference; choose a focused route when building a portfolio.",
      ids: modules.map((m) => m.id),
      projects: ["p01", "p02", "p03", "p04"],
    },
  };
  const projects = [
    {
      id: "p01",
      title: "An honest predictive system",
      label: "STATISTICAL FOUNDATION",
      hours: 60,
      prerequisites: ["c15", "c16"],
      brief:
        "Build a reproducible tabular prediction project where the evaluation survives a skeptical reviewer. Use a public dataset with a clear license; choose a question whose target would exist at prediction time.",
      stages: [
        [
          "Define the decision",
          8,
          "Write a one-page problem brief: who acts on the output, what false positives and false negatives cost, what baseline already exists, and how the data were generated.",
        ],
        [
          "Audit and split",
          12,
          "Create a dataset card, inspect missingness and group structure, freeze a group-aware or temporal holdout where appropriate, and document leakage risks.",
        ],
        [
          "Build fair baselines",
          16,
          "Compare a constant rule, linear/logistic model and tree ensemble under the same preprocessing and validation protocol. Record seeds and compute budgets.",
        ],
        [
          "Challenge the results",
          14,
          "Inspect learning curves, confidence intervals, calibration and errors by relevant slices. Test whether one feature is an unavailable future signal. Keep the holdout for the final selection.",
        ],
        [
          "Package the evidence",
          10,
          "Make one command reproduce the main result. Include tests, environment instructions, a model card, limitations, and a five-minute recorded explanation of a failed experiment.",
        ],
      ],
      rubric: [
        "A trivial baseline is reported; adopting or rejecting the model is justified by a valid comparison, costs and uncertainty.",
        "No learned preprocessing sees holdout data; groups or future observations cannot leak.",
        "A clean environment can reproduce the report from documented public inputs.",
        "Uncertainty, subgroup limitations, failed experiments and intended use are stated.",
      ],
    },
    {
      id: "p02",
      title: "A service that survives failure",
      label: "PRODUCTION ENGINEERING",
      hours: 80,
      prerequisites: ["a05", "a08", "a10"],
      brief:
        "Turn a model into a service with a measurable contract. Run locally first; use a cloud deployment only when a controlled budget and authorization are available.",
      stages: [
        [
          "Write the service contract",
          10,
          "Specify request/response schemas, timeouts, data retention, quality floor, load target and a monthly budget. Identify who is paged and what rollback means.",
        ],
        [
          "Package and serve",
          20,
          "Pin a runtime, package inference, validate inputs, add health/readiness endpoints, and test identical predictions across batch and online paths.",
        ],
        [
          "Measure under load",
          18,
          "Use a repeatable workload to measure throughput and p50/p95/p99 latency. Separate warm-up from steady state. Test oversized and malformed requests.",
        ],
        [
          "Inject failures",
          20,
          "Simulate dependency timeout, unavailable model artifact, schema mismatch and drift. Demonstrate alarms, safe degradation, idempotent recovery and rollback.",
        ],
        [
          "Publish an operations report",
          12,
          "Provide a runbook, architecture diagram, cost ledger, load report, deployment checklist and postmortem. Explain what was simulated and what was measured.",
        ],
      ],
      rubric: [
        "A stranger can start the service from the README and obtain the documented response.",
        "Failures terminate within bounded time and sensitive inputs are not leaked into logs.",
        "Latency and cost claims come from a documented workload and include limitations.",
        "Monitoring, rollback and incident recovery have been exercised, not merely drawn.",
      ],
    },
    {
      id: "p03",
      title: "An AI product with evidence",
      label: "PRODUCT & AI SYSTEMS",
      hours: 80,
      prerequisites: ["a03", "c23", "a10"],
      brief:
        "Solve one narrow problem for a plausible user, such as searching a licensed technical handbook. Compare the AI path with a simpler search or rules baseline.",
      stages: [
        [
          "Discover the actual task",
          10,
          "Interview willing users or label assumptions explicitly. Write five user tasks, a non-AI baseline, acceptance criteria, accessibility needs and a privacy plan.",
        ],
        [
          "Build a measured vertical slice",
          22,
          "Implement ingestion, retrieval, an API and a keyboard-accessible UI. Show citations and meaningful error/empty states. Keep model credentials on the server.",
        ],
        [
          "Construct an evaluation set",
          18,
          "Create answerable, unanswerable, ambiguous, stale and adversarial cases. Label relevant passages and acceptable answers before inspecting system outputs.",
        ],
        [
          "Test quality and boundaries",
          18,
          "Measure retrieval quality, groundedness, abstention, latency and per-task token cost. Compare retrieval variants and verify defenses against untrusted document instructions.",
        ],
        [
          "Ship a reviewable case study",
          12,
          "Provide a runnable demo, evaluation report, threat model, cost assumptions, screen-reader/keyboard checks and feedback from at least one independent reviewer where possible.",
        ],
      ],
      rubric: [
        "The product solves a named task and has a measured non-AI baseline.",
        "Evaluation includes failed retrieval and correct refusal, not just attractive examples.",
        "Secrets, authorization and prompt-injection boundaries are documented and tested.",
        "A reviewer can inspect the UX, source, evaluation inputs and cost calculation.",
      ],
    },
    {
      id: "p04",
      title: "Reproduce, then question a result",
      label: "RESEARCH & EXPERIMENTATION",
      hours: 100,
      prerequisites: ["c19", "c21"],
      brief:
        "Choose a small open paper with available code/data and a compute budget you can afford. Reproduction on a reduced setting is acceptable when the change is explicit.",
      stages: [
        [
          "Reconstruct the claim",
          15,
          "Write the research question, assumptions, objective, baseline, dataset license and available compute. Identify which result is feasible to reproduce and which is not.",
        ],
        [
          "Reproduce the baseline",
          25,
          "Create a pinned environment and a small sanity-check run. Audit evaluation code, splits and random seeds. Match the published protocol before changing the method.",
        ],
        [
          "Run a controlled experiment",
          25,
          "Predefine one ablation, keep the budget and data fixed, and run enough seeds to report variation within your compute limits. Preserve all runs.",
        ],
        [
          "Investigate discrepancies",
          20,
          "Compare curves and failure cases. Test a plausible explanation with one variable changed. Separate a measured discrepancy from an unsupported causal story.",
        ],
        [
          "Write a technical report",
          15,
          "Release commands, configuration, compute cost, uncertainty, negative results and a limitations section. Explain one equation and one implementation choice from memory.",
        ],
      ],
      rubric: [
        "The target claim and deviations from the original setup are explicit.",
        "Baselines share a fair data and compute protocol.",
        "The report includes run-to-run variation or states why it could not be measured.",
        "Conclusions are limited to the experiments actually performed.",
      ],
    },
  ];
  const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
  const projectStageIds = new Set(
    projects.flatMap((p) => p.stages.map((_, i) => p.id + "-" + i)),
  );
  const activityLimits = Object.fromEntries([
    ...modules.flatMap((m) =>
      m.lessons.flatMap((l, i) =>
        [
          ["video", l.videoMinutes],
          ["read", l.readingMinutes],
          ["build", l.practiceMinutes],
          ["recall", l.reviewMinutes],
        ].map(([k, n]) => [m.id + ":" + i + ":" + k, n]),
      ),
    ),
    ...projects.flatMap((p) =>
      p.stages.map((s, i) => [p.id + ":" + i + ":project", s[1] * 60]),
    ),
  ]);
  for (const m of modules) activityLimits[m.id + ":gate:gate"] = 90;
  const defaults = () => ({
    version: 2,
    blockMinutes: 60,
    dailyWork: {},
    assessments: {},
    track: "ai",
    hours: 6,
    days: 6,
    start: today(),
    completed: [],
    mastered: [],
    masteryDates: {},
    notes: {},
    checks: {},
    projectDone: [],
    activityProgress: {},
    reviewProgress: {},
    video: true,
  });
  let migrated = false,
    storageOK = true,
    state = defaults(),
    view = "overview",
    query = "",
    phase = "all",
    planPage = 0,
    libQuery = "",
    dialogModule = null,
    focusMode = false;
  const workUndo = [];
  function validateState(x) {
    if (
      !x ||
      typeof x !== "object" ||
      Array.isArray(x) ||
      ![1, 2].includes(x.version)
    )
      throw Error("This is not a supported atlas progress file.");
    const s = defaults();
    if (typeof x.track !== "string" || !Object.hasOwn(tracks, x.track))
      throw Error("Unknown career route.");
    s.track = x.track;
    if (
      !Number.isFinite(x.hours) ||
      x.hours < 1 ||
      x.hours > 12 ||
      !Number.isInteger(x.hours * 2) ||
      !Number.isInteger(x.days) ||
      x.days < 1 ||
      x.days > 7 ||
      !validDate(x.start)
    )
      throw Error("Invalid schedule settings.");
    if (x.blockMinutes !== undefined && ![45, 60, 90].includes(x.blockMinutes))
      throw Error("Invalid focus-block length.");
    s.blockMinutes = x.blockMinutes || 60;
    s.hours = x.hours;
    s.days = x.days;
    s.start = x.start;
    s.video = x.video !== false;
    for (const [key, allowed] of [
      ["completed", allLessonIds],
      ["mastered", new Set(modules.map((m) => m.id))],
      ["projectDone", projectStageIds],
    ]) {
      if (!Array.isArray(x[key] || [])) throw Error("Invalid progress list.");
      s[key] = [
        ...new Set(
          (x[key] || []).filter((v) => typeof v === "string" && allowed.has(v)),
        ),
      ];
    }
    for (const key of ["notes", "checks", "masteryDates"]) {
      const obj = x[key];
      if (
        obj !== undefined &&
        (!obj || typeof obj !== "object" || Array.isArray(obj))
      )
        throw Error("Invalid saved notes.");
      for (const [k, v] of Object.entries(obj || {})) {
        if (!Object.hasOwn(byId, k) && !Object.hasOwn(projectById, k)) continue;
        if (key === "notes" && typeof v === "string")
          s[key][k] = v.slice(0, 5000);
        if (key === "checks" && typeof v === "boolean") s[key][k] = v;
        if (key === "masteryDates" && validDate(v)) s[key][k] = v;
      }
    }
    for (const key of ["activityProgress", "reviewProgress"]) {
      const obj = x[key] || {};
      if (typeof obj !== "object" || Array.isArray(obj))
        throw Error("Invalid work progress.");
      for (const [k, v] of Object.entries(obj)) {
        const max =
          key === "activityProgress"
            ? Object.hasOwn(activityLimits, k)
              ? activityLimits[k]
              : null
            : Object.hasOwn(byId, k)
              ? 6
              : null;
        if (max !== null && Number.isInteger(v) && v >= 0 && v <= max)
          s[key][k] = v;
        else throw Error("Invalid work progress value.");
      }
    }
    for (const key of ["dailyWork", "assessments"])
      if (
        x[key] !== undefined &&
        (!x[key] || typeof x[key] !== "object" || Array.isArray(x[key]))
      )
        throw Error("Invalid tracking record.");
    for (const [date, n] of Object.entries(x.dailyWork || {})) {
      if (!validDate(date) || !Number.isInteger(n) || n < 0 || n > 720)
        throw Error("Invalid daily work log.");
      s.dailyWork[date] = n;
    }
    for (const [id, a] of Object.entries(x.assessments || {})) {
      if (
        !Object.hasOwn(byId, id) ||
        !a ||
        !Number.isInteger(a.choice) ||
        a.choice < 0 ||
        a.choice > 3 ||
        !Number.isInteger(a.attempts) ||
        a.attempts < 1 ||
        a.attempts > 10000
      )
        throw Error("Invalid diagnostic record.");
      s.assessments[id] = { choice: a.choice, attempts: a.attempts };
    }
    // Mastery is consistent with practiced sessions and prerequisite mastery, even for imported files.
    let changed = true;
    while (changed) {
      changed = false;
      s.mastered = s.mastered.filter((id) => {
        const m = byId[id],
          valid =
            m.lessons.every((_, i) => s.completed.includes(lessonId(m, i))) &&
            m.prerequisites.every((p) => s.mastered.includes(p)) &&
            s.checks[id] === true;
        if (!valid) changed = true;
        return valid;
      });
    }
    for (const id of Object.keys(s.masteryDates))
      if (!s.mastered.includes(id)) delete s.masteryDates[id];
    return s;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      migrated = parsed.version === 1;
      state = validateState(parsed);
    }
  } catch {
    storageOK = false;
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOK = true;
    } catch {
      storageOK = false;
      toast("Browser storage is unavailable. Export progress before closing.");
    }
  }
  let toastTimer;
  function toast(t) {
    $("#toast").textContent = t;
    $("#toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => $("#toast").classList.remove("visible"),
      4200,
    );
  }
  function selectedModules() {
    const seen = new Set(),
      result = [];
    function visit(id) {
      if (seen.has(id)) return;
      if (!byId[id]) throw Error("Missing prerequisite " + id);
      seen.add(id);
      byId[id].prerequisites.forEach(visit);
      result.push(byId[id]);
    }
    tracks[state.track].ids.forEach(visit);
    for (const pid of tracks[state.track].projects)
      projectById[pid].prerequisites.forEach(visit);
    return result;
  }
  function selectedProjects() {
    return tracks[state.track].projects.map((id) => projectById[id]);
  }
  function nextLesson() {
    for (const m of selectedModules()) {
      for (let i = 0; i < m.lessons.length; i++)
        if (!state.completed.includes(lessonId(m, i)))
          return { m, i, gate: false };
      if (!state.mastered.includes(m.id)) return { m, i: 0, gate: true };
    }
    return null;
  }
  function source(id) {
    return sourceById[id] || sourceById[SOURCE_ALIASES[id]];
  }
  function sourceLinks(ids) {
    return [...new Set(ids)]
      .map((id) => source(id))
      .filter(Boolean)
      .map(
        (r) =>
          `<a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>`,
      )
      .join(" · ");
  }
  function beginnerSetup(id) {
    if (id !== "c02" && id !== "c05" && id !== "c06") return "";
    if (id === "c02")
      return `<section class="notice green"><h3>Your first runnable file</h3><p>A <b>file</b> stores text; a <b>folder</b> organizes files; a <b>terminal</b> runs commands in a folder; an <b>editor</b> changes the text. Python reads your saved file and executes its instructions. Use a plain-text editor, not a word processor.</p><ol><li>Create a folder named <code>learning-atlas</code> and open it in your editor. Open the editor’s terminal in that folder.</li><li>Run <code>python3 --version</code> on macOS/Linux or <code>py --version</code> on Windows. If neither works, install Python 3 from the Python Software Foundation’s official site and reopen the terminal. This cloud environment already has Python.</li><li>Create <code>study.py</code>, enter the code below, save the file, then run <code>python3 study.py</code> (Windows: <code>py study.py</code>).</li><li>Expect <code>2160 minutes = 36.0 hours per week</code>. Change one input and predict the new output before running it.</li></ol><pre><code>minutes_per_day = 360\ndays_per_week = 6\nweekly_minutes = minutes_per_day * days_per_week\nprint(weekly_minutes, "minutes =", weekly_minutes / 60, "hours per week")</code></pre><p>If Python cannot find the file, check the terminal’s current folder and the exact filename. If a syntax error appears, compare the line, quotes and parentheses; an error is evidence to inspect.</p></section>`;
    if (id === "c05")
      return `<section class="notice green"><h3>Prepare an isolated numerical workspace</h3><p>Use the virtual-environment habits from c04. In your project folder, run <code>python3 -m venv .venv</code>. Install into that environment with <code>.venv/bin/python -m pip install numpy</code>, then run your script with <code>.venv/bin/python your_script.py</code>. On Windows use <code>py -m venv .venv</code> and <code>.venv\\Scripts\\python -m pip install numpy</code>. Verify with <code>import numpy as np</code> in your script and print <code>np.__version__</code>. Record the working package versions for reproduction. Install later libraries only when a module needs them.</p></section>`;
    return `<section class="notice green"><h3>Start SQL without a server</h3><p>Python usually includes <code>sqlite3</code>. Use a tiny local database before adding PostgreSQL or a cloud service. Save and run this example, then change the data. The <code>?</code> placeholders keep values separate from SQL syntax.</p><pre><code>import sqlite3\nconnection = sqlite3.connect(":memory:")\nconnection.execute("CREATE TABLE sessions (topic TEXT, minutes INTEGER)")\nconnection.executemany("INSERT INTO sessions VALUES (?, ?)",\n                       [("Python", 60), ("SQL", 45)])\nfor row in connection.execute("SELECT topic, SUM(minutes) FROM sessions GROUP BY topic"):\n    print(row)\nconnection.close()</code></pre><p>The database disappears when the in-memory connection closes. A filename creates a local database file instead. Use the sqlite3 resource for this module’s runtime; PostgreSQL documentation provides relational concepts and the later production path.</p></section>`;
  }
  function moduleMinutes(m) {
    return sum(m.lessons.map(minutes)) + 90;
  }
  function remainingMinutes() {
    return sum(taskQueue().map((t) => t.minutes));
  }
  const reviewIntervals = [1, 3, 7, 14, 30, 60];
  function dueReviews(date = today()) {
    return selectedModules().filter((m) => {
      const mastered = state.masteryDates[m.id],
        count = state.reviewProgress[m.id] || 0;
      if (!mastered || count >= reviewIntervals.length) return false;
      const age = Math.floor(
        (Date.parse(date) - Date.parse(mastered)) / 86400000,
      );
      return age >= reviewIntervals[count];
    });
  }
  function heading(k, title, description) {
    return `<div class="page-heading"><div class="eyebrow">${k}</div><h1>${title}</h1><p>${description}</p></div>`;
  }
  function javascriptBridge(id) {
    if (id !== "a01") return "";
    return `<section class="notice green"><h3>A bridge from Python to browser JavaScript</h3><p>HTML describes the document, CSS describes its appearance, and JavaScript changes it in response to events. <code>const</code> declares a binding you will not reassign; <code>let</code> declares one you will. A <code>function</code> accepts inputs and executes statements. Arrays store ordered values. Unlike Python, blocks use braces. The browser exposes a document object model (DOM) so code can select an element and change its text.</p><p>Create <code>index.html</code> with the following complete example. Open it in your browser and type <code>py</code>, then a word that cannot match. Predict the result before each action. No library or server is required for this example.</p><pre><code>&lt;!doctype html&gt;\n&lt;html lang="en"&gt;\n&lt;meta charset="utf-8"&gt;\n&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;\n&lt;title&gt;My first filter&lt;/title&gt;\n&lt;label for="search"&gt;Find a topic&lt;/label&gt;\n&lt;input id="search" type="search"&gt;\n&lt;p id="result" role="status"&gt;&lt;/p&gt;\n&lt;script&gt;\nconst topics = ["Python", "SQL", "Probability"];\nlet query = "";\nconst input = document.querySelector("#search");\nconst result = document.querySelector("#result");\nfunction render() {\n  const matches = topics.filter(function(topic) {\n    return topic.toLowerCase().includes(query);\n  });\n  result.textContent = matches.length ? matches.join(", ") : "No results";\n}\ninput.addEventListener("input", function(event) {\n  query = event.target.value.toLowerCase();\n  render();\n});\nrender();\n&lt;/script&gt;\n&lt;/html&gt;</code></pre><p><code>filter</code> creates a new array containing values whose predicate returns true. <code>querySelector</code> finds an element; <code>addEventListener</code> registers a function the browser calls later. <code>textContent</code> inserts text, so a user’s input is not interpreted as HTML. The conditional expression chooses the match list or an empty-state message.</p><p>Exercise: add a fourth topic; make matching ignore leading and trailing spaces using <code>trim()</code>; add a reset button; then represent each topic as an object with a name and category. Explain every changed line. For later lessons using fetch or modules, serve the folder with <code>python3 -m http.server 8000 --bind 127.0.0.1</code> and visit localhost on port 8000; stop the server with Ctrl+C. Keep source data separate from the visible filtered view.</p></section>`;
  }
  function routeSelect() {
    return `<select aria-label="Career route" class="route-select" data-setting="track">${Object.entries(
      tracks,
    )
      .map(
        ([id, t]) =>
          `<option value="${id}" ${state.track === id ? "selected" : ""}>${t.name}</option>`,
      )
      .join("")}</select>`;
  }
  function navRender() {
    $("#navigation").innerHTML = nav
      .map(
        ([id, icon, title]) =>
          `<a class="nav-item ${view === id ? "active" : ""}" href="#${id}" ${view === id ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${icon}</span>${title}${id === "curriculum" ? `<span class="nav-number">${modules.length}</span>` : ""}</a>`,
      )
      .join("");
    $("#page-name").textContent =
      nav.find((x) => x[0] === view)?.[2] || "Overview";
  }
  function render(focus = false) {
    navRender();
    const fn =
      {
        overview: overview,
        journey: journey,
        curriculum: curriculum,
        planner: planner,
        lab: labs,
        portfolio: portfolio,
        evidence: evidence,
        library: library,
        method: method,
      }[view] || overview;
    $("#main").innerHTML =
      (migrated
        ? '<div class="notice green">Welcome to edition 02. Your earlier sessions and notes are retained. New prerequisites may reopen mastery gates; inspect your journey before advancing. <button class="btn small" data-action="dismiss-upgrade">Understood</button></div>'
        : "") +
      (!storageOK
        ? '<div class="notice storage-warning">Persistent browser storage is unavailable or an old save could not be loaded. Export progress before closing this page.</div>'
        : "") +
      fn();
    if (view === "lab") updateLabs();
    if (focus) $("#main").focus({ preventScroll: true });
  }
  function heroArt() {
    return `<div class="hero-art"><svg viewBox="0 0 400 330" role="img" aria-label="A learning pathway: foundations connect mathematics, data and software to models and reliable systems"><defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#bcc8b3"/></pattern></defs><rect x="15" y="12" width="370" height="285" fill="url(#grid)" opacity=".6"/><g fill="none" stroke="#94a48a" stroke-width="1.2"><path d="M200 267L100 207V139L200 77L300 139V207Z"/><path d="M100 139L200 199L300 139M200 77V199L200 267M100 207L300 207M100 207L200 77L300 207"/><ellipse cx="200" cy="170" rx="165" ry="80" stroke-dasharray="3 6" transform="rotate(-27 200 170)"/></g><g fill="#e8eddf" stroke="#7f9474"><circle cx="200" cy="267" r="18"/><circle cx="100" cy="207" r="23"/><circle cx="300" cy="207" r="23"/><circle cx="100" cy="139" r="25"/><circle cx="300" cy="139" r="25"/></g><circle cx="200" cy="77" r="31" fill="#285b45"/><circle cx="200" cy="199" r="31" fill="#f1dfcb" stroke="#b47b53"/><g font-family="Georgia,serif" text-anchor="middle"><text x="200" y="85" fill="#fff" font-size="25">∑</text><text x="200" y="207" fill="#9b5334" font-size="25">ƒ</text><text x="100" y="145" fill="#45613d" font-size="18">x²</text><text x="300" y="145" fill="#45613d" font-size="18">{ }</text><text x="100" y="213" fill="#45613d" font-size="18">P</text><text x="300" y="213" fill="#45613d" font-size="18">∇</text><text x="200" y="273" fill="#45613d" font-size="17">1</text></g><g class="chart-label"><text x="200" y="28" text-anchor="middle">RELIABLE SYSTEMS</text><text x="25" y="111">REASON</text><text x="310" y="111">BUILD</text><text x="200" y="312" text-anchor="middle">FIRST PRINCIPLES</text></g></svg><div class="art-caption">A MAP OF DEPENDENCIES. A PRACTICE OF DISCOVERY.</div></div>`;
  }
  function overview() {
    const ms = selectedModules(),
      next = nextLesson(),
      done = ms.filter((m) => state.mastered.includes(m.id)).length,
      practice = ms.reduce(
        (n, m) =>
          n +
          m.lessons.filter((_, i) => state.completed.includes(lessonId(m, i)))
            .length,
        0,
      ),
      lessonCount = ms.length * 5;
    const stages = stageGroups(ms),
      remaining = Math.max(
        0,
        state.hours * 60 - 30 - (state.dailyWork[today()] || 0),
      ),
      scheduled = buildPlan(),
      weeks = Math.ceil(scheduled.length / state.days);
    return `<section class="v2-hero"><div class="hero-copy"><div class="hero-kicker"><span class="eyebrow">THE FIRST PRINCIPLES ATLAS</span><span class="edition-badge">EDITION 02</span></div><h1 class="hero-title">Understand deeply.<br><em>Build with purpose.</em></h1><p class="hero-intro">Your path from a blank file to reliable AI systems. Clear dependencies. Deliberate practice. Work you can explain and someone else can verify.</p><div class="hero-actions"><button class="btn primary" data-action="continue">${next?.gate ? "Review your next gate" : "Continue learning"} <span aria-hidden="true">→</span></button><a href="#journey" class="btn">See the whole journey</a></div><div class="hero-footnote"><span class="dot"></span> DESIGNED FOR YOUR START · Zero experience · ${state.hours} focused hours/day</div></div><aside class="hero-stageboard" aria-label="Learning approach"><div class="stage-label">THE PROCESS, NOT THE PROMISE</div><div class="stage-tile"><span class="stage-index">01</span><div><h3>Understand the mechanism</h3><p>Make a prediction. Trace the steps. Find the assumption.</p></div><span class="stage-meta">THINK</span></div><div class="stage-connector" aria-hidden="true"></div><div class="stage-tile"><span class="stage-index">02</span><div><h3>Make it work</h3><p>Build from a blank file. Test the result. Inspect the failure.</p></div><span class="stage-meta">BUILD</span></div><div class="stage-connector" aria-hidden="true"></div><div class="stage-tile"><span class="stage-index">03</span><div><h3>Make it trustworthy</h3><p>Explain the limits. Reproduce the evidence. Invite review.</p></div><span class="stage-meta">PROVE</span></div><div class="stageboard-foot"><span>Small steps. Inspectable progress.</span><span aria-hidden="true">→</span></div></aside></section>
 <div class="readiness-strip"><div><strong>${ms.length}<small> / ${modules.length}</small></strong><span>modules on your path</span></div><div><strong>${practice}<small> / ${lessonCount}</small></strong><span>sessions practiced</span></div><div><strong>${done}<small> / ${ms.length}</small></strong><span>mastery gates met</span></div><div><strong>${selectedProjects().length}</strong><span>capstones to make your case</span></div></div>
 <div class="section-heading"><div><span class="eyebrow">YOUR WORKBENCH</span><h2>One clear next step.</h2></div><a class="text-btn" href="#planner">Open the daily plan →</a></div>
 <div class="overview-grid"><article class="focus-card"><div class="card-top"><span class="eyebrow">${next?.gate ? "REVIEW BEFORE ADVANCING" : "UP NEXT"}</span><span class="pill">${next ? esc(next.m.id.toUpperCase()) : "WELL PRACTICED"}</span></div><h3>${next ? esc(next.gate ? next.m.project.title : next.m.lessons[next.i].title) : "Let a reviewer challenge your evidence."}</h3><p>${next ? esc(next.gate ? next.m.project.brief : next.m.lessons[next.i].practice) : "The planned sessions are practiced. Inspect the capstones, revisit weak concepts and seek independent review."}</p><div class="focus-card-meta"><span>${next ? esc(next.m.title) : "Portfolio review"}</span><span>${next ? (next.gate ? "90 min · review budget" : minutes(next.m.lessons[next.i]) + " min · full session") : "Keep the evidence current"}</span></div><button class="btn primary" data-action="continue">${next?.gate ? "Inspect the evidence gate" : "Open your learning brief"} →</button></article>
 <article class="route-summary"><div class="eyebrow">YOUR DIRECTION</div>${routeSelect()}<p>${tracks[state.track].description}</p><div class="progress-track"><div class="progress-fill" style="width:${(done / ms.length) * 100}%"></div></div><div class="row spread micro"><span>${done} gates met</span><span>Self-assessed against artifacts</span></div><div class="today-budget"><div><strong>${remaining}<small> min</small></strong><span>activity capacity left today</span></div><div><strong>${state.dailyWork[today()] || 0}<small> min</small></strong><span>activity work logged today</span></div></div><p class="micro">Plus 20 minutes of recall and 10 minutes of reflection. Breaks are additional. Logged minutes are your estimates, not a background timer.</p></article></div>
 <div class="section-heading"><div><span class="eyebrow">THE PATH AHEAD</span><h2>Each stage earns the next.</h2></div><a href="#journey" class="text-btn">Explore prerequisites →</a></div><div class="milestone-ribbon">${stages.map((g, i) => `<a class="milestone-step" href="#journey"><span>${String(i + 1).padStart(2, "0")}</span><b>${g.title}</b><small>${g.modules.filter((m) => state.mastered.includes(m.id)).length} / ${g.modules.length} gates</small></a>`).join("")}</div>
 <div class="planning-note"><span class="eyebrow">A FORECAST YOU CAN CHANGE</span><p>Your remaining route contains approximately <b>${Math.ceil(remainingMinutes() / 60)} hours</b> of lessons, project work and artifact review. At this cadence, the first pass spans roughly <b>${weeks} study weeks</b>. Add time for repetition and feedback; completion is not an employment guarantee.</p></div>
 <div class="grid-3"><article class="card"><div class="eyebrow">EXPLORE A MECHANISM</div><h3>Make intuition visible.</h3><p>Change a learning rate, a threshold, or a base rate. Predict the effect before observing it.</p><a class="btn small" href="#lab">Open the concept lab →</a></article><article class="card peach"><div class="eyebrow">BUILD YOUR CASE</div><h3>Evidence over checkmarks.</h3><p>Four capstones turn study into reproducible results, failure analysis and professional judgment.</p><a class="btn small" href="#portfolio">Read the project briefs →</a></article><article class="card"><div class="eyebrow">READ THE FOOTNOTES</div><h3>Know what is known.</h3><p>Inspect primary sources, research limitations and conditional scenarios for a changing market.</p><a class="btn small" href="#evidence">Inspect the research →</a></article></div>`;
  }
  function stageGroups(ms) {
    const defs = [
      [
        "Foundations",
        "Learn to express and debug a procedure.",
        ["c01", "c02", "c03", "c04", "b01"],
      ],
      [
        "Data & reasoning",
        "Understand representations, variation and evidence.",
        ["c05", "c06", "c07", "c08", "c09", "c10", "c11"],
      ],
      [
        "Predictive learning",
        "Build baselines that survive honest evaluation.",
        ["c12", "c13", "c14", "c15", "c16", "c17"],
      ],
      [
        "Neural & AI systems",
        "Understand learned representations and model behavior.",
        ["c18", "c19", "c20", "c21", "c22", "c23", "c24", "b04"],
      ],
      [
        "Products & operations",
        "Turn a model into a useful, dependable system.",
        [
          "a01",
          "a02",
          "a03",
          "a04",
          "a05",
          "a06",
          "a07",
          "a08",
          "a09",
          "a10",
          "b02",
          "b03",
        ],
      ],
      [
        "Research & career",
        "Make your ability visible and keep adapting.",
        ["a11", "a12", "b05"],
      ],
    ];
    return defs
      .map(([title, why, ids]) => ({
        title,
        why,
        modules: ms.filter((m) => ids.includes(m.id)),
      }))
      .filter((g) => g.modules.length);
  }
  function journey() {
    const ms = selectedModules(),
      next = nextLesson();
    return (
      heading(
        "YOUR LEARNING JOURNEY",
        "See the reason for every step.",
        "Choose a direction without losing the foundations. This map groups the route by capability; the numbered modules follow your actual prerequisite order. The planner interleaves early product work with deeper foundations.",
      ) +
      `<div class="journey-controls">${routeSelect()}<span class="micro">${ms.length} modules · ${ms.length * 5} sessions · ${selectedProjects().length} capstones</span><button class="btn small" data-action="continue">Open next step →</button></div><div class="map-grid">${stageGroups(
        ms,
      )
        .map(
          (g, i) =>
            `<section class="map-phase"><header><span class="stage-index">${String(i + 1).padStart(2, "0")}</span><div><h2>${g.title}</h2><p>${g.why}</p></div><span class="micro">${g.modules.filter((m) => state.mastered.includes(m.id)).length}/${g.modules.length} mastered</span></header><div class="map-nodes">${g.modules
              .map((m) => {
                const mastered = state.mastered.includes(m.id),
                  ready = m.prerequisites.every((p) =>
                    state.mastered.includes(p),
                  );
                return `<article class="map-node ${mastered ? "mastered" : next?.m.id === m.id ? "active" : !ready ? "locked" : ""}"><div class="row spread"><span class="micro">STEP ${String(ms.indexOf(m) + 1).padStart(2, "0")} · ${m.id.toUpperCase()}</span><span class="tag">${mastered ? "Gate met" : ready ? "Ready to study" : "Prerequisites first"}</span></div><h3><button data-action="module" data-id="${m.id}">${esc(m.title)}</button></h3><p>${esc(m.summary)}</p><div class="map-dependencies"><span>Builds on</span>${m.prerequisites.length ? m.prerequisites.map((p) => `<button data-action="module" data-id="${p}" title="${esc(byId[p].title)}">${p}</button>`).join("") : "<b>No prior knowledge</b>"}</div><div class="row spread micro"><span>${Math.round(moduleMinutes(m) / 60)}h scope budget</span><span>${m.lessons.filter((_, i) => state.completed.includes(lessonId(m, i))).length}/5 practiced</span></div></article>`;
              })
              .join("")}</div></section>`,
        )
        .join(
          "",
        )}</div><div class="notice">A prerequisite is an explanation of what the next concept assumes. You can open any module to explore it. Mastery is recorded only after its prerequisite gates and artifact criteria are met. Changing routes preserves your earlier work; shared foundations carry across.</div>`
    );
  }

  function curriculum() {
    const selected = new Set(selectedModules().map((m) => m.id)),
      terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = modules.filter(
      (m) =>
        (phase === "all" ||
          (phase === "route" && selected.has(m.id)) ||
          m.phase === phase) &&
        terms.every((q) =>
          (
            m.title +
            " " +
            m.summary +
            " " +
            m.tags.join(" ") +
            " " +
            m.lessons.map((l) => l.title).join(" ")
          )
            .toLowerCase()
            .includes(q),
        ),
    );
    let last = "";
    return (
      heading(
        "THE CURRICULUM",
        "Build the chain of understanding.",
        "The atlas contains 41 modules and 205 specific learning sessions, plus four substantial capstones. Your chosen route adds every prerequisite automatically. Explore freely; advance through mastery gates.",
      ) +
      `<div class="filters"><input class="search" id="curriculum-search" type="search" placeholder="Find a concept, tool, or skill…" aria-label="Search curriculum" value="${esc(query)}">${routeSelect()}</div><div class="filters">${[["all", "All modules"], ["route", "My route"], ...["Foundations", "Data & mathematics", "Machine learning", "Deep learning", "AI systems", "Product engineering", "Production systems", "Career & research"].map((x) => [x, x])].map(([id, label]) => `<button class="filter-btn ${phase === id ? "active" : ""}" data-action="phase" data-value="${esc(id)}">${label}</button>`).join("")}</div><p class="micro">${matches.length} modules shown · Effort includes a 90-minute artifact review per module; capstone work is additional.</p><div class="module-list">${
        matches
          .map((m) => {
            const heading =
              m.phase !== last
                ? `<h2 class="phase-heading">${esc(m.phase)}</h2>`
                : "";
            last = m.phase;
            const practiced = m.lessons.filter((_, i) =>
                state.completed.includes(lessonId(m, i)),
              ).length,
              mastered = state.mastered.includes(m.id),
              ready = m.prerequisites.every((p) => state.mastered.includes(p));
            return (
              heading +
              `<article class="module-card"><span class="module-number">${String(modules.indexOf(m) + 1).padStart(2, "0")}</span><div><span class="micro">${esc(m.id.toUpperCase())} · ${selected.has(m.id) ? "IN YOUR ROUTE" : "OPTIONAL BRANCH"}</span><h3>${esc(m.title)}</h3><p>${esc(m.summary)}</p><div class="tags"><span class="tag ${mastered ? "verified" : !ready ? "orange" : ""}">${mastered ? "Mastery gate met" : ready ? "Prerequisites met" : "Build prerequisites first"}</span><span class="tag">${practiced}/5 sessions practiced</span>${m.prerequisites.length ? `<span class="tag">Requires ${m.prerequisites.join(", ")}</span>` : ""}</div></div><div class="module-end"><small>${Math.round(moduleMinutes(m) / 60)}h planned</small><button class="btn small" data-action="module" data-id="${m.id}">Open module →</button></div></article>`
            );
          })
          .join("") ||
        '<div class="empty">No matching modules. Try a broader concept or change the filter.</div>'
      }</div>`
    );
  }
  function lessonMarkup(m, l, i, open) {
    const id = lessonId(m, i),
      done = state.completed.includes(id);
    return `<details class="lesson" id="lesson-${id}" ${open ? "open" : ""}><summary><span class="lesson-index">${done ? "✓" : i + 1}</span><span>${esc(l.title)}<span class="lesson-meta">${minutes(l)} minutes total · Video ${l.videoMinutes} · Read ${l.readingMinutes} · Build ${l.practiceMinutes} · Recall ${l.reviewMinutes}</span></span></summary><div class="lesson-body"><div class="tags">${l.concepts.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div><h4>Understand the mechanism</h4><p>${esc(l.explain)}</p><h4>Build from a blank file</h4><p>${esc(l.practice)}</p><h4>Leave evidence behind</h4><p>${esc(l.deliverable)}</p><h4>Test yourself without notes</h4><p>${esc(l.check)}</p><details class="answer"><summary>Reveal the reasoning after your attempt</summary><p>${esc(l.answer)}</p></details><h4>Optional video study</h4><p>Budget <b>${l.videoMinutes} minutes</b> on ${esc(l.videoQuery)}. This is an attention budget, not a verified video runtime or timestamp. Use the official resources below; if a matching lesson is unavailable, spend this time reading or implementing.</p><p class="micro" style="margin-top:10px">${sourceLinks(m.resourceIds)}</p><button class="btn ${done ? "" : "primary"} small" data-action="practice" data-id="${m.id}" data-index="${i}">${done ? "Undo practiced session" : "Mark session practiced"}</button></div></details>`;
  }
  function openModule(id, index = null) {
    const m = byId[id];
    if (!m) return;
    dialogModule = id;
    $("#lesson-dialog").classList.toggle("focus-mode", focusMode);
    const ready = m.prerequisites.every((p) => state.mastered.includes(p)),
      practiced = m.lessons.every((_, i) =>
        state.completed.includes(lessonId(m, i)),
      ),
      mastered = state.mastered.includes(id);
    $("#dialog-content").innerHTML =
      `<div class="dialog-top"><div><div class="eyebrow">${esc(m.id)} / ${esc(m.phase)}</div><h2 id="dialog-title">${esc(m.title)}</h2></div><button class="icon-btn" data-action="close-dialog" aria-label="Close module">×</button></div><div class="dialog-body"><div class="module-context"><p>${esc(m.why)}</p><div class="tags"><span class="tag">${Math.round(moduleMinutes(m) / 60)} planned hours including artifact review</span><span class="tag">5 sessions · flexible calendar days</span></div>${
        !ready
          ? `<div class="notice">Explore the content now. Before claiming mastery, demonstrate these prerequisites: ${m.prerequisites
              .filter((p) => !state.mastered.includes(p))
              .map(
                (p) =>
                  `<button class="btn small" data-action="module" data-id="${p}">${esc(byId[p]?.title || p)}</button>`,
              )
              .join(" ")}.</div>`
          : ""
      }${beginnerSetup(id)}${javascriptBridge(id)}<h3>What you will be able to do</h3><ul>${m.outcomes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${enrichment(m)}</div><div class="study-toolbar"><h3>The five learning sessions</h3><button class="btn small" data-action="focus-mode" aria-pressed="${focusMode}">${focusMode ? "Show module context" : "Focus on the open lesson"}</button><div class="focus-navigation"><button class="btn small" data-action="focus-prev" data-id="${id}" ${!index ? "disabled" : ""}>← Previous session</button><button class="btn small" data-action="focus-next" data-id="${id}" ${(index || 0) >= 4 ? "disabled" : ""}>Next session →</button></div></div><p class="muted">Sessions are units of work, not fixed days. The daily planner divides their activities to fit your available time. Minutes are estimates; stop and investigate when the mechanism is unclear.</p>${m.lessons.map((l, i) => lessonMarkup(m, l, i, index === i || (index === null && i === 0))).join("")}<div class="module-project"><h3>Module project · ${esc(m.project.title)}</h3><p>${esc(m.project.brief)}</p><ul>${m.project.deliverables.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><h3>Common failure modes</h3><ul>${m.pitfalls.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="mastery-card"><div class="eyebrow">A gate, not a gold star</div><h3>Demonstrate the result.</h3><ul>${m.project.rubric.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><label><input type="checkbox" data-check="${id}" ${state.checks[id] ? "checked" : ""}>I have inspected my artifact against every criterion, attempted the questions without notes, and can explain a failure case.</label><label class="note-label" for="module-note">Evidence log · artifact location, result, uncertainty, next correction</label><textarea class="note-area" id="module-note" data-note="${id}" maxlength="5000" placeholder="Record what you can now demonstrate. Local text only; no secrets.">${esc(state.notes[id] || "")}</textarea><p class="micro">This is self-assessment, not an external certification. Ask a peer to reproduce your work when possible.</p><button id="mastery-button" class="btn ${mastered ? "" : "primary"}" data-action="mastery" data-id="${id}" ${!mastered && (!ready || !practiced || !state.checks[id]) ? "disabled" : ""}>${mastered ? "Reopen this mastery gate" : "Mark mastery gate met"}</button><p class="micro" style="margin-top:9px">Requires all five sessions practiced, prerequisite gates met, and the evidence checklist confirmed. Recording mastery is separate from logging time; use planner blocks for time accounting.</p><button class="btn small" data-action="repeat-review" data-id="${id}">Schedule another 90-minute review</button></div></div>`;
    const dialog = $("#lesson-dialog");
    if (!dialog.open) dialog.showModal();
    if (index !== null)
      setTimeout(
        () =>
          $("#lesson-" + lessonId(m, index))?.scrollIntoView({
            block: "start",
          }),
        20,
      );
  }
  function taskQueue() {
    const result = [],
      visited = new Set(),
      added = new Set(),
      ps = selectedProjects();
    function add(task) {
      const key =
          task.id + ":" + task.index + ":" + (task.keyKind || task.kind),
        logged = state.activityProgress[key] || 0;
      if (task.minutes > logged)
        result.push({
          ...task,
          key,
          totalMinutes: task.minutes,
          logged,
          minutes: task.minutes - logged,
        });
    }
    function addProjects() {
      for (const p of ps) {
        if (added.has(p.id) || !p.prerequisites.every((id) => visited.has(id)))
          continue;
        added.add(p.id);
        p.stages.forEach((s, i) => {
          if (!state.projectDone.includes(p.id + "-" + i))
            add({
              kind: "project",
              id: p.id,
              index: i,
              title: p.title + " · " + s[0],
              description: s[2],
              minutes: s[1] * 60,
            });
        });
      }
    }
    for (const m of selectedModules()) {
      m.lessons.forEach((l, i) => {
        if (state.completed.includes(lessonId(m, i))) return;
        const parts = [
          [
            "video",
            l.videoMinutes,
            state.video
              ? "Optional video / " + l.videoQuery
              : "Alternative practice / " + l.videoQuery,
          ],
          [
            "read",
            l.readingMinutes,
            "Read, derive and explain / " + l.concepts.join(", "),
          ],
          ["build", l.practiceMinutes, l.practice],
          ["recall", l.reviewMinutes, l.check],
        ];
        parts.forEach(([kind, n, description]) => {
          if (n > 0)
            add({
              kind: kind === "video" && !state.video ? "build" : kind,
              keyKind: kind,
              id: m.id,
              index: i,
              title: l.title,
              description,
              minutes: n,
            });
        });
      });
      if (!state.mastered.includes(m.id))
        add({
          kind: "gate",
          id: m.id,
          index: "gate",
          title: "Artifact review · " + m.project.title,
          description:
            "Check the project rubric, reproduce a result, and repair one failure. Logging review time does not mark mastery. Repeat the review budget from the module if further repair is needed.",
          minutes: 90,
        });
      visited.add(m.id);
      addProjects();
    }
    addProjects();
    return result;
  }
  function buildPlan() {
    const queue = taskQueue(),
      budget = state.hours * 60 - 30,
      days = [];
    let current = null;
    function advance() {
      const idx = days.length,
        date = dateAdd(
          state.start,
          Math.floor(idx / state.days) * 7 + (idx % state.days),
        ),
        logged = state.dailyWork[date] || 0;
      current = {
        number: idx + 1,
        date,
        tasks: [],
        used: 0,
        logged,
        capacity: Math.max(0, budget - logged),
      };
      days.push(current);
    }
    for (const task of queue) {
      let remaining = task.minutes,
        part = 0;
      while (remaining > 0) {
        if (!current || current.used >= current.capacity) {
          advance();
          if (current.capacity === 0) continue;
        }
        const n = Math.min(
          remaining,
          current.capacity - current.used,
          state.blockMinutes,
        );
        current.tasks.push({
          ...task,
          allocated: n,
          offset: (task.logged || 0) + task.minutes - remaining,
          part: ++part,
        });
        current.used += n;
        remaining -= n;
      }
    }
    return days;
  }
  function daySummary(plan) {
    const types = {
      video: 0,
      read: 0,
      build: 0,
      recall: 0,
      project: 0,
      gate: 0,
    };
    for (const day of plan)
      for (const t of day.tasks) types[t.kind] += t.allocated;
    const total = sum(Object.values(types));
    return `<div class="study-toolbar"><div><span class="eyebrow">THIS PAGE OF YOUR PLAN</span><h3>${plan.length} study days · ${Math.round((total / 60) * 10) / 10}h of remaining activities</h3></div><button class="btn small" data-action="undo-work" ${workUndo.length ? "" : "disabled"}>Undo last logged block</button></div><div class="time-allocation">${Object.entries(
      types,
    )
      .filter(([, n]) => n)
      .map(
        ([k, n]) =>
          `<div><i class="time-dot ${k}"></i><strong>${Math.round((n / 60) * 10) / 10}h</strong><span>${{ video: "Video budget", read: "Read & reason", build: "Implement", recall: "Recall", project: "Capstone", gate: "Review" }[k]}</span></div>`,
      )
      .join("")}</div>`;
  }

  function planner() {
    const plan = buildPlan(),
      perPage = 7,
      maxPage = Math.max(0, Math.ceil(plan.length / perPage) - 1);
    planPage = Math.min(planPage, maxPage);
    const visible = plan.slice(planPage * perPage, (planPage + 1) * perPage),
      review = dueReviews();
    return (
      heading(
        "THE DAILY PLANNER",
        "Give every hour a purpose.",
        "A six-hour study day is focused work, with breaks added separately. The algorithm preserves prerequisites, reserves 30 minutes for retrieval and reflection, and splits long activities across days.",
      ) +
      `<section class="card"><div class="settings-grid"><label class="field">Career direction<select data-setting="track">${Object.entries(
        tracks,
      )
        .map(
          ([id, t]) =>
            `<option value="${id}" ${state.track === id ? "selected" : ""}>${t.name}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="field">Focused hours / day<input type="number" min="1" max="12" step=".5" data-setting="hours" value="${state.hours}"></label><label class="field">Study days / week<select data-setting="days">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option ${n === state.days ? "selected" : ""}>${n}</option>`).join("")}</select></label><label class="field">Focus block<select data-setting="blockMinutes">${[45, 60, 90].map((n) => `<option value="${n}" ${n === state.blockMinutes ? "selected" : ""}>${n} min</option>`).join("")}</select></label><label class="field">Start of remaining work<input type="date" data-setting="start" value="${state.start}"></label></div><label class="row micro" style="margin-top:15px"><input type="checkbox" data-setting="video" ${state.video ? "checked" : ""}> Include optional video study budgets. Turning this off reallocates those minutes to practice.</label></section><div class="planner-tools"><div><b>${plan.length} planned study days</b><p class="micro">${plan.length ? dateLabel(plan[0].date) + " → " + dateLabel(plan.at(-1).date) : "Your scheduled work is complete."} · ${7 - state.days} rest ${7 - state.days === 1 ? "day" : "days"} after each ${state.days}-day study block</p></div><div class="row flex-wrap"><button class="btn small" data-action="rebase">Rebase remaining work to today</button><button class="btn small" data-action="calendar">Export calendar (.ics)</button><button class="btn small" data-action="export">Back up progress</button></div></div><div class="notice">Dates are a first-pass forecast, not permission to skip a gate. Long projects appear as several work blocks; their stated minutes are planning budgets. Logging a block reduces both its remaining work and today’s available activity time. The day will not refill itself. You can undo the last logged block during this visit. After a missed day, rebase the remaining plan. After a failed check, repeat or repair before continuing. Add 25–50% contingency, and take 5–10 minute breaks between focused blocks.</div>${review.length ? `<div class="notice green">Suggested recall today: ${review.map((m) => `<button class="btn small" data-action="reviewed" data-id="${m.id}">${esc(m.title)} · record recall ✓</button>`).join(" ")}. Rebuild one key idea from memory. Review suggestions use 1, 3, 7, 14, 30 and 60 calendar days after a mastery gate; overdue reviews stay visible until recorded. These intervals are a heuristic, not a validated personal optimum.</div>` : ""}${daySummary(visible)}<div class="day-list">${visible.map((day, i) => `<details class="plan-day" ${i === 0 ? "open" : ""}><summary><span class="day-badge">DAY<b>${day.number}</b></span><span class="day-title"><b>${esc(day.tasks.find((t) => t.kind === "build" || t.kind === "project")?.title || day.tasks[0]?.title || "Today’s activity budget is logged")}</b><span>${dateLabel(day.date)} · ${day.used} min remaining + ${day.logged} min logged + 30 min recall/reflection · ${day.tasks.length} work blocks</span></span></summary><div class="day-content"><div class="review-banner"><b>20 min · Retrieve before consuming.</b> Explain yesterday’s mechanism on blank paper. On your first day, write your baseline: what you can currently do unaided. At week boundaries, revisit a previous weak concept.</div>${day.tasks.map((t) => `<div class="task"><div class="task-time">${t.allocated}m</div><div><span class="micro">${esc({ video: "OPTIONAL VIDEO", read: "READ & REASON", build: "IMPLEMENT", recall: "RETRIEVE", gate: "MASTERY GATE", project: "CAPSTONE WORK" }[t.kind])}${t.offset > 0 ? " · CONTINUED" : ""}${t.allocated < t.totalMinutes ? " · " + (t.offset + t.allocated) + " / " + t.totalMinutes + " MIN" : ""}</span><h4>${esc(t.title)}</h4><p>${esc(t.description)}</p></div><div class="task-buttons"><button class="btn small" data-action="${t.kind === "project" ? "go-project" : "module"}" data-id="${t.id}" ${Number.isInteger(t.index) ? `data-index="${t.index}"` : ""}>${t.kind === "project" ? "Project" : "Brief"} →</button>${t.key ? `<button class="btn small" data-action="log-work" data-key="${t.key}" data-minutes="${t.allocated}">Log ${t.allocated}m ✓</button>` : ""}</div></div>`).join("")}<div class="review-banner" style="margin:12px 0 0"><b>10 min · Close the loop.</b> Save the artifact, write one error and its correction, and choose the next action. Mark a session practiced only after all its activities are done.</div></div></details>`).join("") || '<div class="empty">All scheduled work is marked complete. Inspect your evidence, seek independent review, and keep revisiting weak areas.</div>'}</div><div class="pagination"><button class="btn small" data-action="plan-prev" ${planPage === 0 ? "disabled" : ""}>← Previous</button><span>Study days ${plan.length ? planPage * perPage + 1 : 0}–${Math.min((planPage + 1) * perPage, plan.length)} of ${plan.length}</span><button class="btn small" data-action="plan-next" ${planPage >= maxPage ? "disabled" : ""}>Next →</button></div><details class="prose"><summary>How the scheduling algorithm works</summary><ol><li>Choose the career route, then recursively include every prerequisite. Topologically order the modules so dependencies precede their consumers.</li><li>Expand each unfinished session into optional video, reading, implementation and retrieval activities. Insert each capstone as soon as its module prerequisites appear in the sequence.</li><li>Allocate at most <code>60 × daily hours − 30</code> activity minutes per study day. Split activities at the chosen 45-, 60- or 90-minute focus-block limit and the day’s remaining capacity. Preserve their order and remaining minutes. Subtract activity time already logged on that calendar date; a completed day never refills.</li><li>Add 20 minutes of retrieval and 10 minutes of reflection. After each configured study block, add rest days. This uses study-block days, not fixed Monday–Friday weekdays.</li><li>Remove practiced sessions, mastered gates and completed capstone stages when rebuilding. Rebase the start date explicitly. The model does not automatically infer mastery, illness, fatigue or labor-market readiness.</li></ol></details>`
    );
  }
  function portfolio() {
    const chosen = new Set(tracks[state.track].projects);
    return (
      heading(
        "PROOF OF SKILL",
        "Make your work inspectable.",
        "A portfolio is a set of falsifiable claims about what you can do. Give a reviewer the code, decisions, failures, measurements and reproduction steps—not only polished screenshots.",
      ) +
      `<div class="notice green">${selectedProjects().length} capstones are scheduled in your route. Their ${sum(selectedProjects().map((p) => p.hours))} hours are additional to the module projects. These are scope budgets, not promises; reduce a dataset or model to fit available hardware, then document the change.</div><div class="grid-3"><div class="card"><div class="eyebrow">Activity</div><h3>I followed the lesson.</h3><p>You can describe the steps with notes. Useful exposure, but not yet evidence of independent implementation.</p></div><div class="card green"><div class="eyebrow">Competence</div><h3>I can reproduce it.</h3><p>You can implement, test and explain the mechanism unaided, including a meaningful failure and correction.</p></div><div class="card peach"><div class="eyebrow">Professional evidence</div><h3>Someone can verify it.</h3><p>A reviewer can run your work, inspect its limits, and understand the decisions under real constraints.</p></div></div><div class="section-head"><h2>The capstone briefs</h2>${routeSelect()}</div>${projects.map((p) => `<article id="project-${p.id}" class="card portfolio-project"><header><div><div class="eyebrow">${p.label}</div><h3>${esc(p.title)}</h3></div><span class="pill">${p.hours}h · ${chosen.has(p.id) ? "IN YOUR ROUTE" : "OPTIONAL BRANCH"}</span></header><p>${esc(p.brief)}</p><p class="micro" style="margin-top:10px">PREREQUISITES · ${p.prerequisites.map((id) => esc(byId[id]?.title || id)).join(" · ")}</p><div class="checklist">${p.stages.map((s, i) => `<label><input type="checkbox" data-project="${p.id}-${i}" ${state.projectDone.includes(p.id + "-" + i) ? "checked" : ""}><span><b>${s[0]} · ${s[1]}h</b><br>${esc(s[2])}</span></label>`).join("")}</div><h4 style="margin-top:22px">Acceptance criteria</h4><ul>${p.rubric.map((r) => `<li>${esc(r)}</li>`).join("")}</ul><label class="note-label" for="note-${p.id}">Evidence log · repository / artifact path, experiment results, reviewer feedback</label><textarea id="note-${p.id}" class="note-area" data-note="${p.id}" maxlength="5000" placeholder="What can an independent reviewer verify? What still fails?">${esc(state.notes[p.id] || "")}</textarea></article>`).join("")}<section class="prose"><h2>A global application strategy</h2><p>Choose a role you can demonstrate, then identify the employers and regions where you can legally work. “Remote” often still has country, payroll, time-zone or experience restrictions. Track these before investing in an application. Research scientist positions can require graduate-level research and credentials that this atlas cannot replace.</p><ol><li><b>Make three artifacts excellent.</b> Prefer a reproducible baseline, an operational service or AI product, and one deep investigation. Tailor the selection to your role.</li><li><b>Write a concise case study.</b> State the problem, baseline, constraint, chosen design, evidence, failure, correction and limitations. Show what you personally built.</li><li><b>Practice live reasoning.</b> Debug an unfamiliar script, write SQL, explain a metric, sketch a system, and reason aloud about an ambiguous requirement. Adjust interview preparation to actual roles.</li><li><b>Seek review before volume.</b> Ask peers to run the project. Record where they get stuck. Apply to eligible roles with specific evidence, not a generic list of every technology.</li><li><b>Learn from the funnel.</b> Separate screening, technical, portfolio and eligibility failures. Improve the relevant evidence without interpreting a small rejection sample as proof of personal inability.</li></ol><button class="btn" data-action="job-template">Download job-research CSV template →</button></section>`
    );
  }
  function labs() {
    return (
      heading(
        "THE CONCEPT LAB",
        "Change a variable. Observe a consequence.",
        "Five deliberately small models make important mechanisms visible. They run entirely in your browser. Each is a teaching example with explicit assumptions, not a benchmark or production prediction.",
      ) +
      `<div class="lab-grid">
 <article class="lab"><div class="eyebrow">01 / Optimization</div><h3>A gradient is a local instruction.</h3><p>For one observation x = 1, y = 3, squared loss is L(w) = (w − 3)². Start at w = −1, follow the gradient, and observe the difference between cautious progress, oscillation and divergence.</p><label for="gd-rate">Learning rate η <output id="gd-rate-label">0.2</output></label><input id="gd-rate" type="range" min="0.05" max="1.2" value="0.2" step="0.05" data-lab><label for="gd-steps">Update steps <output id="gd-steps-label">6</output></label><input id="gd-steps" type="range" min="0" max="16" value="6" step="1" data-lab><div id="gd-output" class="lab-output" aria-live="polite"></div><div class="formula">dL/dw = 2(w − 3)<br>w ← w − η · 2(w − 3)</div><p style="margin-top:12px">Predict before moving: what happens at η = 0.5, 1, and 1.1? This quadratic converges for 0 &lt; η &lt; 1. Neural losses do not share this universal threshold.</p></article>
 <article class="lab"><div class="eyebrow">02 / Decision thresholds</div><h3>Accuracy can hide the decision.</h3><p>This fixed teaching sample has 20 cases, including four positives. A case is predicted positive when its score is at least the threshold. Scores are illustrative, not calibrated probabilities.</p><label for="cm-threshold">Classification threshold <output id="cm-threshold-label">0.5</output></label><input id="cm-threshold" type="range" min="0" max="1" value="0.5" step="0.05" data-lab><div id="cm-output" class="lab-output" aria-live="polite"></div><div class="formula">Precision = TP / (TP + FP)<br>Recall = TP / (TP + FN)<br>F1 = 2TP / (2TP + FP + FN)</div><p style="margin-top:12px">Choose thresholds using validation data and decision costs. A pretty score on this tiny sample establishes no generalization.</p></article>
 <article class="lab"><div class="eyebrow">03 / Base rates</div><h3>Rare events change the meaning.</h3><p>Assume a detector catches 90% of true events and falsely flags 5% of non-events. How often does a flag indicate a real event when prevalence changes?</p><label for="bayes-prevalence">Event prevalence (%) <output id="bayes-label">1</output></label><input id="bayes-prevalence" type="range" min="0.1" max="50" value="1" step="0.1" data-lab><div id="bayes-output" class="lab-output" aria-live="polite"></div><div class="formula">P(event | flag) = 0.90p / [0.90p + 0.05(1 − p)]</div><p style="margin-top:12px">Counts are expected counts per 10,000 observations. Sensitivity and false-positive rate are assumed constant; real distribution shifts can change them.</p></article>
 <article class="lab"><div class="eyebrow">04 / Evaluation design</div><h3>A split encodes a question.</h3><p>Eight records come from four people, each measured twice. A row split puts the earlier record of every person in training and the later record in testing. A person split holds out two entire people.</p><label for="split-method">Evaluation question</label><select id="split-method" data-lab><option value="row">Later records from known people</option><option value="entity">Records from unseen people</option></select><div id="split-output" class="lab-output" aria-live="polite"></div><div class="formula">Train/test entity overlap = |entities(train) ∩ entities(test)|</div><p style="margin-top:12px">Entity overlap is not automatically a defect. It is a defect when your claim concerns unseen people. A temporal claim also requires a valid prediction cutoff and features available at that cutoff.</p></article>
 <article class="lab full-width"><div class="eyebrow">05 / AI product economics</div><h3>A token budget is an engineering constraint.</h3><p>Estimate a simple request: 600 fixed input tokens plus 250 tokens per retrieved chunk, then 400 output tokens. Edit the hypothetical rates. No provider pricing is implied; caching, retries, tools, embeddings, taxes and infrastructure are excluded.</p><div class="settings-grid"><label class="field" for="cost-k">Retrieved chunks k<input id="cost-k" type="number" min="0" max="50" value="4" data-lab></label><label class="field" for="cost-input">Input $ / 1M tokens<input id="cost-input" type="number" min="0" max="1000" value="1" step="0.1" data-lab></label><label class="field" for="cost-output">Output $ / 1M tokens<input id="cost-output" type="number" min="0" max="1000" value="3" step="0.1" data-lab></label><label class="field" for="cost-requests">Requests / month<input id="cost-requests" type="number" min="0" max="10000000" value="10000" step="1000" data-lab></label></div><div id="cost-output-box" class="lab-output" aria-live="polite"></div><div class="formula">Cost/request = [(600 + 250k) × input rate + 400 × output rate] / 1,000,000</div><p style="margin-top:12px">More context does not guarantee better answers. Measure retrieval relevance, groundedness, latency and cost together on a fixed evaluation set before changing k.</p></article></div>`
    );
  }
  function updateLabs() {
    if (!$("#gd-rate")) return;
    const rate = Number($("#gd-rate").value),
      steps = Number($("#gd-steps").value);
    $("#gd-rate-label").textContent = rate.toFixed(2);
    $("#gd-steps-label").textContent = steps;
    let w = -1,
      points = [w];
    for (let i = 0; i < steps; i++) {
      w -= rate * 2 * (w - 3);
      points.push(w);
    }
    const loss = (w - 3) ** 2;
    const px = (v) => 25 + ((v + 2) / 10) * 310,
      py = (v) => 140 - (Math.min(25, v) / 25) * 115;
    const curve = Array.from({ length: 81 }, (_, i) => {
      const x = -2 + i / 8;
      return `${i ? "L" : "M"}${px(x).toFixed(1)},${py((x - 3) ** 2).toFixed(1)}`;
    }).join(" ");
    $("#gd-output").innerHTML =
      `<div class="metric-grid"><div><strong>${w.toFixed(3)}</strong><small>current weight</small></div><div><strong>${loss.toFixed(3)}</strong><small>squared loss</small></div></div><svg viewBox="0 0 360 165" role="img" aria-label="Squared loss curve with the gradient descent trajectory; points outside the displayed range are omitted"><path d="${curve}" fill="none" stroke="#78916d" stroke-width="2"/>${points
        .filter((x) => x >= -2 && x <= 8 && (x - 3) ** 2 <= 25)
        .map(
          (x, i) =>
            `<circle cx="${px(x)}" cy="${py((x - 3) ** 2)}" r="${i === 0 ? 4 : 3}" fill="#b85b35"/>`,
        )
        .join(
          "",
        )}<text x="176" y="160" class="chart-label">weight w</text></svg><p>${rate < 1 ? "The error shrinks on this quadratic." : rate === 1 ? "The weight oscillates; loss does not decrease." : "The error grows: this step size is unstable."} ${points.some((x) => x < -2 || x > 8) ? "Some iterates are outside the displayed range." : ""}</p>`;
    const scores = [
        0.95, 0.82, 0.65, 0.35, 0.88, 0.75, 0.6, 0.55, 0.5, 0.45, 0.4, 0.32,
        0.28, 0.25, 0.2, 0.17, 0.15, 0.1, 0.08, 0.03,
      ],
      threshold = Number($("#cm-threshold").value);
    $("#cm-threshold-label").textContent = threshold.toFixed(2);
    let tp = 0,
      fp = 0,
      tn = 0,
      fn = 0;
    scores.forEach((s, i) => {
      if (i < 4) {
        if (s >= threshold) tp++;
        else fn++;
      } else if (s >= threshold) fp++;
      else tn++;
    });
    const fmt = (a, b) => (b ? ((100 * a) / b).toFixed(1) + "%" : "undefined");
    $("#cm-output").innerHTML =
      `<div class="metric-grid"><div><strong>${fmt(tp + tn, 20)}</strong><small>accuracy</small></div><div><strong>${fmt(tp, tp + fp)}</strong><small>precision</small></div><div><strong>${fmt(tp, tp + fn)}</strong><small>recall</small></div><div><strong>${fmt(2 * tp, 2 * tp + fp + fn)}</strong><small>F1</small></div></div><p style="margin-top:16px">TP ${tp} · FP ${fp} · TN ${tn} · FN ${fn}</p><p>Always predicting negative gives 80% accuracy and zero recall. Precision is undefined when no positives are predicted.</p>`;
    const p = Number($("#bayes-prevalence").value) / 100;
    $("#bayes-label").textContent = (p * 100).toFixed(1);
    const trueFlags = 10000 * p * 0.9,
      falseFlags = 10000 * (1 - p) * 0.05;
    $("#bayes-output").innerHTML =
      `<strong>${((trueFlags / (trueFlags + falseFlags)) * 100).toFixed(1)}%</strong><p>of flags correspond to a real event under these assumptions.</p><div class="bar"><span style="width:${(trueFlags / (trueFlags + falseFlags)) * 100}%;background:#406b4c"></span><span style="flex:1;background:#cd9975"></span></div><p>${trueFlags.toFixed(1)} true flags + ${falseFlags.toFixed(1)} false flags per 10,000 observations.</p>`;
    const entity = $("#split-method").value === "entity";
    $("#split-output").innerHTML =
      `<strong>${entity ? "0" : "4"} shared people</strong><p>Training: ${entity ? "A₁, A₂, B₁, B₂" : "A₁, B₁, C₁, D₁"}<br>Testing: ${entity ? "C₁, C₂, D₁, D₂" : "A₂, B₂, C₂, D₂"}</p><p>${entity ? "Supports a limited test of transfer to unseen people; only two people are held out, so uncertainty remains large." : "Tests later records from people already observed. It cannot establish performance on entirely new people."}</p>`;
    const values = ["cost-k", "cost-input", "cost-output", "cost-requests"].map(
      (id) => {
        const el = $("#" + id),
          n = Number(el.value);
        return Number.isFinite(n) &&
          n >= 0 &&
          n <= Number(el.max) &&
          el.value !== ""
          ? n
          : null;
      },
    );
    if (values.some((x) => x === null)) {
      $("#cost-output-box").innerHTML =
        "<p>Enter non-negative values within the displayed input limits.</p>";
      return;
    }
    const [k, ir, or, req] = values,
      inputs = 600 + k * 250,
      cost = (inputs * ir + 400 * or) / 1e6;
    $("#cost-output-box").innerHTML =
      `<div class="metric-grid"><div><strong>$${cost.toFixed(5)}</strong><small>estimated token cost per request</small></div><div><strong>$${(cost * req).toFixed(2)}</strong><small>estimated monthly token cost</small></div></div><p style="margin-top:12px">${inputs.toLocaleString()} input + 400 output tokens/request. This is arithmetic under your assumptions, not a provider quote or measured latency.</p>`;
  }
  function evidence() {
    const verified = D.evidence.filter((e) => e.verified);
    return (
      heading(
        "RESEARCH & OUTLOOK",
        "Make the claim smaller than the evidence.",
        "Engineering responsibilities inform the core. Labor-market observations should inform electives. Forecasts belong in scenarios, with their assumptions visible.",
      ) +
      `<div class="notice"><b>Research coverage, 28 October 2026:</b> ${verified.length} primary engineering/research sources were retrieved through official or author-maintained repositories. Major labor-market and employer websites were blocked by the environment’s network policy. No current job-advertisement sample was obtained. This page does <b>not</b> claim a comprehensive survey of current global hiring; unverified follow-up sources are labeled below.</div><div class="grid-3"><article class="card green"><div class="eyebrow">Observed engineering practice</div><h3>Evaluate, test, operate.</h3><p>Primary documentation supports leakage-safe evaluation, explicit experiments, code review, bounded tools and inference tradeoffs. These are system responsibilities, not measured hiring frequencies.</p></article><article class="card"><div class="eyebrow">Curriculum judgment</div><h3>Fundamentals before frameworks.</h3><p>Representation → computation → uncertainty → models → systems. This ordering follows conceptual dependencies and is an authored teaching design, not a proven optimum for every learner.</p></article><article class="card peach"><div class="eyebrow">Forecast uncertainty</div><h3>Hedge across plausible futures.</h3><p>Invest in transferable reasoning, data quality, evaluation, software design and communication. No salary, hiring probability or exact future tool stack is promised.</p></article></div>
 <div class="section-head"><div><h2>Work backward from responsibilities</h2><p>Role mapping below is curriculum synthesis, not a frequency table from job ads.</p></div></div><div class="table-wrap"><table><thead><tr><th>ROLE FAMILY</th><th>PROBLEM YOU OWN</th><th>SKILLS TO DEMONSTRATE</th><th>STRONG EVIDENCE</th></tr></thead><tbody>${[
   [
     "Applied ML engineer",
     "Turn data into a useful, reliable decision.",
     "Python, SQL, statistics, validation, pipelines, error analysis.",
     "A reproducible baseline and decision-relevant improvement.",
   ],
   [
     "AI product engineer",
     "Make an AI capability useful and safe in a product.",
     "APIs, UI, retrieval, evaluation, authentication, cost controls.",
     "A product that beats a simpler alternative on a fixed task set.",
   ],
   [
     "ML systems engineer",
     "Keep training or serving dependable under constraints.",
     "Profiling, memory, concurrency, data contracts, monitoring.",
     "A measured latency–throughput–quality tradeoff and a tested recovery.",
   ],
   [
     "Research engineer",
     "Turn a hypothesis into a trustworthy experiment.",
     "Mathematics, implementation, diagnostics, ablations, reproduction.",
     "A faithful reproduction, negative result and carefully bounded extension.",
   ],
 ]
   .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
   .join("")}</tbody></table></div>
 <div class="section-head"><h2>The primary-source ledger</h2><span class="micro">Dates and scope travel with the claim.</span></div><div class="grid-2">${D.evidence.map((e) => `<article class="card source-card"><span class="evidence-status ${e.verified ? "" : "muted"}">${esc(e.id)} · ${e.verified ? "RETRIEVED PRIMARY SOURCE" : "UNVERIFIED FOLLOW-UP"}</span><div class="source-title"><a href="${esc(safeUrl(e.url))}" target="_blank" rel="noopener noreferrer">${esc(e.title)} →</a></div><p><b>Claim / purpose:</b> ${esc(e.claim)}</p><p><b>Scope:</b> ${esc(e.scope)}</p><p><b>Limit:</b> ${esc(e.caveat)}</p>${e.implications?.length ? `<ul class="micro">${e.implications.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}<div class="source-meta">${esc(e.publisher)} · ${esc(e.kind)}<br>Published: ${esc(e.published || "Not established")}<br>${e.verified ? "Accessed" : "Access attempted / reference recorded"}: ${esc(e.accessed || "2026-10-28")}<br>${esc(e.status)}</div></article>`).join("")}</div>
 <section class="prose"><h2>2027–2030: scenarios to prepare for</h2><p>These are conditional analyses, not predictions of job counts or model capabilities.</p><details open><summary>If models become cheaper and more capable</summary><p>Producing a prototype may become easier. A durable response is to improve problem selection, domain understanding, data governance, evaluation and integration. Test whether your product solves a real task better than a simpler baseline. This does not establish whether net employment rises or falls.</p></details><details><summary>If compute, latency or infrastructure constrain adoption</summary><p>Learn profiling, batching, memory use, caching and deployment tradeoffs. Build one reproducible workload where a quality constraint is held fixed while cost or latency changes. Which optimization matters depends on the workload and hardware.</p></details><details><summary>If accountability and security requirements increase</summary><p>Data provenance, privacy, authorization, auditable decisions and human review become explicit product constraints. Build these into projects without assuming that one country’s present law is the future global rule.</p></details><details><summary>If routine entry-level tasks are increasingly automated</summary><p>Strengthen observable competence on ambiguous tasks: debugging, adapting a system to a new constraint, writing an experiment, and explaining failure. Do not infer that all junior roles disappear, or that a certificate replaces work evidence.</p></details><details><summary>If architectures or popular frameworks change</summary><p>Statistics, optimization, data representation, algorithms, software design and controlled experiments transfer better than a memorized API. Keep one functioning project current, and learn a new tool by mapping it to mechanisms you already understand.</p></details><h2>Refresh the market evidence every month</h2><ol><li>Sample 30 distinct, current roles across at least 10 employers in regions and contract arrangements you can actually access. This is a practical audit sample, not a representative global estimate.</li><li>Record the URL, capture date, role family, seniority, location, remote eligibility, degree requirements, experience, required skills, preferred skills and requested work evidence.</li><li>Deduplicate repostings and staffing duplicates. Separate junior-accessible roles from senior-only roles. Report the denominator before reporting a skill frequency.</li><li>Change the next elective or project when repeated relevant requirements appear. Keep the mathematical and software core stable unless evidence exposes a true missing prerequisite.</li><li>Recheck promising listings directly before applying. A retrieved job description is not proof that the role is still open.</li></ol><button class="btn" data-action="job-template">Download the research worksheet →</button><h2>What “global” changes</h2><p>There is no single global entry-level market. Country eligibility, employment law, language, working hours, domain, company size and seniority shape the roles available to you. U.S. occupational projections cannot be directly mapped to Bangladesh, Europe, India or worldwide remote roles. Research labs are also a poor proxy for all employers. Learn transferable capabilities, then make your application strategy local enough to be testable.</p></section>`
    );
  }
  function library() {
    const matches = resources.filter((r) =>
      (r.title + " " + r.description + " " + r.type + " " + r.level)
        .toLowerCase()
        .includes(libQuery.toLowerCase()),
    );
    return (
      heading(
        "THE RESOURCE LIBRARY",
        "Use a few sources deeply.",
        "Primary documentation, open books and substantial courses. Choose one teaching source and one reference per topic; build before adding another playlist.",
      ) +
      `<div class="notice">“Retrieved” means the exact verification source below was accessed and inspected, often an official GitHub source document. It does not mean every canonical website, paid chapter or video was checked. No playlist runtime or timestamp is claimed. The atlas content works offline; external resources require internet access.</div><div class="filters"><input type="search" class="search" id="library-search" placeholder="Search Python, probability, evaluation, web…" aria-label="Search resources" value="${esc(libQuery)}"><span class="micro">${matches.length} / ${resources.length} sources</span></div><div class="grid-2">${matches.map((r) => `<article class="card source-card"><div class="row spread"><span class="tag ${r.verified ? "verified" : "orange"}">${r.verified ? "SOURCE RETRIEVED" : "LIVE CHECK UNAVAILABLE"}</span><span class="micro">${esc(r.access)}</span></div><div class="source-title"><a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${esc(r.title)} →</a></div><p>${esc(r.description)}</p><p><b>Use it:</b> ${esc(r.use)}</p><p><b>Video:</b> ${esc(r.videoNote)}</p><div class="source-meta">${esc(r.publisher)} · ${esc(r.type)}<br>${esc(r.level)}<br>${esc(r.verificationNote || "Live page access was unavailable.")} ${r.verified ? `<a href="${esc(safeUrl(r.verificationUrl))}" target="_blank" rel="noopener noreferrer">Exact source inspected →</a>` : ""}<br>Review date: ${esc(r.verifiedOn || "2026-10-28")}</div></article>`).join("") || '<div class="empty">No matching resources. Try a broader search.</div>'}</div>`
    );
  }
  function method() {
    return (
      heading(
        "THE LEARNING METHOD",
        "A roadmap is a feedback system.",
        "The aim is independent ability under changing conditions. A schedule helps you act; evidence tells you whether to advance.",
      ) +
      `<section class="prose"><h2>Why this order exists</h2><p>An AI system is a chain: a human decision is represented as a task; observations become data; computations transform representations; statistical reasoning separates pattern from noise; optimization fits a model; evaluation tests a claim; software turns it into a usable system; operations keep the claim useful as conditions change. The modules follow that chain and make prerequisite dependencies explicit.</p><p>There is no universal best roadmap independent of your starting point, constraints and goal. This atlas uses a transparent heuristic: build a common prerequisite base, choose a role, practice the relevant mechanisms, then revisit the weakest demonstrated capability. It does not claim to optimize an empirically calibrated learning function.</p><h2>Your six-hour study day</h2><div class="table-wrap"><table><thead><tr><th>BLOCK</th><th>PURPOSE</th><th>WHAT COUNTS AS PROGRESS</th></tr></thead><tbody><tr><td>20 min: retrieve</td><td>Recall the previous mechanism without notes.</td><td>A written explanation, derived step, or reconstructed example.</td></tr><tr><td>330 min: planned activities</td><td>Read or watch selectively, implement, test, debug and explain.</td><td>Specific lesson artifacts. Video minutes are budgets, not completion targets.</td></tr><tr><td>10 min: reflect</td><td>Record the result, one error, its correction and next action.</td><td>A concise evidence log and reproducible artifact.</td></tr><tr><td>Breaks: additional</td><td>Stand, move, eat and reset attention.</td><td>Breaks are outside six focused hours. Take 5–10 minutes between focus blocks.</td></tr></tbody></table></div><p style="margin-top:16px">Six focused hours is demanding. The planner defaults to six study days followed by one rest day. If sleep, attention or retention deteriorates, lower the setting; exhausted hours are not an achievement. A short sustainable day with independent work is more useful than passive endurance.</p><h2>The session protocol</h2><ol><li><b>Predict.</b> Before running code or revealing an answer, write what you expect and why.</li><li><b>Study one mechanism.</b> Read the explanation, then consult the linked primary resource. If a video helps, pause and reproduce the idea instead of transcribing it.</li><li><b>Implement from a blank file.</b> Close the tutorial. Use documentation for syntax, but choose the steps yourself.</li><li><b>Break it deliberately.</b> Try an empty input, wrong shape, missing value, distribution shift or failed dependency appropriate to the topic.</li><li><b>Explain the result.</b> State the assumptions, what the output establishes, and what it does not establish.</li><li><b>Leave evidence.</b> Save the artifact, test, experiment note and next correction. Only then mark the session practiced.</li></ol><h2>When to advance, repeat or branch</h2><div class="grid-3"><article class="card green"><h3>Advance</h3><p>You can reproduce the mechanism unaided, meet the artifact rubric, and explain one meaningful failure.</p></article><article class="card peach"><h3>Repeat</h3><p>You recognize the answer but cannot generate it, or the project only works while following a tutorial. Reduce scope and rebuild.</p></article><article class="card"><h3>Branch</h3><p>The core is stable and a selected role or project requires a particular capability. Choose a branch based on a concrete need.</p></article></div><h2>Use AI without outsourcing understanding</h2><p>Ask for hints, counterexamples, code review, or an explanation of a failing test. Before accepting generated code, predict its behavior, inspect dependencies, test edge cases and explain the core steps. Keep some exercises unaided. Compare quality and time on similar tasks with and without assistance; do not assume every tool helps every learner.</p><p>The METR study in the source ledger examined experienced maintainers using early-2025 tools. Its result is a reason to measure effects, not a claim that today’s AI always slows beginners or professionals. This atlas requires unaided explanation because assisted output alone cannot reveal your mental model.</p><h2>A weekly review that changes the plan</h2><ol><li>Choose one earlier artifact and reproduce it without opening the original solution.</li><li>List recurring mistakes, distinguishing conceptual gaps from syntax, tooling and attention errors.</li><li>Repair the smallest missing prerequisite. Reopen a mastery gate when your evidence no longer supports it.</li><li>Compare estimated versus actual effort. Rebase unfinished work and add recovery blocks where needed.</li><li>Once a month, review eligible job requirements and revise one elective or capstone. Avoid replacing the whole plan every time a tool is announced.</li></ol><h2>Video study: fewer claims, better practice</h2><p>Each session names a video topic and a suggested study budget, generally a small part of the session. Exact runtimes and timestamps have not been verified. Use an official course or author’s material from the library, watch the relevant segment, and reproduce its mechanism. A reading-only mode reallocates the same minutes to practice. Playback speed is a preference; comprehension is measured by what you can do afterward.</p><h2>Start with modest hardware</h2><p>The early curriculum needs a browser, editor, terminal, Python and version control. Most tabular work and small neural-network exercises can run on a CPU. Use small datasets first. GPU rental, hosted LLM APIs and paid courses are optional branches with explicit budgets; no API key is required to use this atlas. Never put credentials in a client-side HTML page or public repository.</p><details><summary>Progress, privacy and portability</summary><p>The page embeds its styles, code and curriculum. It makes no analytics or API requests. Progress is stored in this browser’s local storage when available; file-origin storage support varies across browsers. Export JSON regularly and before moving the file or changing devices. Imports validate the schema and preserve only known fields. Import replaces the current progress after confirmation; export first if you need both copies.</p></details><details><summary>What happens after a missed day?</summary><p>Nothing is morally overdue. Rebase remaining work to today, keep completed evidence, and reduce the next scope if necessary. The planner does not automatically insert guilt-driven catch-up hours. Use each planner block’s Log button to preserve partial activity and capstone work. When all activities in a session are logged, it is marked practiced. You can also mark a whole session manually after completing its work. Evidence logs preserve your reasoning; minutes alone do not meet a mastery gate.</p></details><details><summary>What do the time estimates mean?</summary><p>They are authored scope budgets, not measured averages or guaranteed proficiency dates. The calendar includes a 90-minute artifact review for each module and separate capstone budgets. Some module projects may require additional iteration; extend the plan rather than skipping a rubric. The suggested 25–50% contingency is a planning heuristic, not a confidence interval.</p></details><details><summary>Can this replace a degree or guarantee a job?</summary><p>No. It can organize study and make competence more visible. Some employers require credentials, country eligibility, professional experience or research results outside this plan. Use actual eligible job descriptions and independent feedback to judge your next step.</p></details><h2>Keep control of your workspace</h2><div class="row flex-wrap"><button class="btn" data-action="export">Export progress</button><label class="btn import-label">Import progress<input type="file" id="import-file-method" accept="application/json,.json"></label><button class="btn danger" data-action="reset">Reset local progress</button></div></section>`
    );
  }
  function enrichment(m) {
    const ex = m.workedExample,
      a = m.assessment,
      choice = state.assessments[m.id]?.choice,
      answered = Number.isInteger(choice);
    return `${m.connections ? `<div class="concept-connections"><div><span class="eyebrow">WHAT THIS BUILDS ON</span><p>${esc(m.connections.before)}</p></div><div><span class="eyebrow">WHAT IT UNLOCKS</span><p>${esc(m.connections.after)}</p></div></div>` : ""}${ex ? `<details class="worked-example"><summary><span>Trace a worked example</span><strong>${esc(ex.title)}</strong></summary><div class="worked-example-body"><p>${esc(ex.explanation)}</p><div class="code-toolbar"><span>${esc(ex.language)} · illustrative example</span><button class="btn small" data-action="download-example" data-id="${m.id}">Download example</button></div><pre class="code-block"><code>${esc(ex.code)}</code></pre><h4>Expected output / invariant</h4><pre class="expected-output">${esc(ex.expected)}</pre><p class="micro">Predict the result first. Run code in your own environment; this page never executes learner code. The example demonstrates a mechanism, not production readiness.</p></div></details>` : ""}${a ? `<section class="assessment" aria-labelledby="diagnostic-${m.id}"><div class="eyebrow">CHECK YOUR MENTAL MODEL</div><h3 id="diagnostic-${m.id}">${esc(a.question)}</h3><div class="assessment-options">${a.options.map((option, i) => `<button class="assessment-option ${choice === i ? "selected" : ""}" data-action="answer" data-id="${m.id}" data-choice="${i}" aria-pressed="${choice === i}"><span>${String.fromCharCode(65 + i)}</span>${esc(option)}</button>`).join("")}</div><div class="assessment-feedback ${answered ? (choice === a.answerIndex ? "correct" : "incorrect") : ""}" aria-live="polite">${answered ? `<b>${choice === a.answerIndex ? "That reasoning fits." : "Revisit the assumption."}</b><p>${esc(a.explanation)}</p><p class="micro">${state.assessments[m.id].attempts} ${state.assessments[m.id].attempts === 1 ? "attempt" : "attempts"} · A diagnostic answer does not replace the artifact rubric.</p>` : "Commit to an answer before opening the explanation."}</div></section>` : ""}`;
  }
  function commandSearch() {
    const q = $("#command-search").value.trim().toLowerCase(),
      matches = modules
        .filter((m) =>
          (
            m.title +
            " " +
            m.summary +
            " " +
            m.tags.join(" ") +
            " " +
            m.lessons.map((l) => l.title).join(" ")
          )
            .toLowerCase()
            .includes(q),
        )
        .slice(0, 10);
    $("#command-results").innerHTML =
      matches
        .map(
          (m) =>
            `<button class="command-result" data-action="module" data-id="${m.id}"><span>${m.id.toUpperCase()}</span><div><b>${esc(m.title)}</b><small>${esc(m.phase)} · ${Math.round(moduleMinutes(m) / 60)}h</small></div><span aria-hidden="true">→</span></button>`,
        )
        .join("") ||
      '<p class="empty">No matching concept. Try a broader term.</p>';
  }
  function openSearch() {
    $("#command-dialog").showModal();
    $("#command-search").value = "";
    commandSearch();
    $("#command-search").focus();
  }
  function logWork(key, n) {
    if (!Object.hasOwn(activityLimits, key) || !Number.isInteger(n) || n <= 0)
      return;
    const date = today(),
      available = Math.max(
        0,
        state.hours * 60 - 30 - (state.dailyWork[date] || 0),
      );
    if (!available) {
      toast(
        "Today’s activity budget is complete. Rest, reflect, or adjust your cadence intentionally.",
      );
      return;
    }
    const previous = state.activityProgress[key] || 0,
      delta = Math.min(activityLimits[key] - previous, n, available);
    if (delta <= 0) return;
    workUndo.push({
      activityProgress: { ...state.activityProgress },
      dailyWork: { ...state.dailyWork },
      completed: [...state.completed],
      projectDone: [...state.projectDone],
    });
    if (workUndo.length > 20) workUndo.shift();
    state.activityProgress[key] = previous + delta;
    state.dailyWork[date] = (state.dailyWork[date] || 0) + delta;
    const [mid, li] = key.split(":");
    if (Object.hasOwn(byId, mid) && li !== "gate") {
      const m = byId[mid],
        i = Number(li),
        done = ["video", "read", "build", "recall"].every(
          (k) =>
            (state.activityProgress[mid + ":" + i + ":" + k] || 0) ===
            activityLimits[mid + ":" + i + ":" + k],
        );
      if (done && !state.completed.includes(lessonId(m, i)))
        state.completed.push(lessonId(m, i));
    } else if (
      Object.hasOwn(projectById, mid) &&
      state.activityProgress[key] === activityLimits[key] &&
      !state.projectDone.includes(mid + "-" + li)
    )
      state.projectDone.push(mid + "-" + li);
    save();
    render();
    toast(delta + " minutes logged. Today’s remaining capacity has decreased.");
  }

  function download(name, body, type = "application/json") {
    const blob = new Blob([body], { type }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportState() {
    download(
      "first-principles-progress-" + today() + ".json",
      JSON.stringify(
        { ...state, exportedAt: new Date().toISOString() },
        null,
        2,
      ),
    );
    toast("Progress backup downloaded. Store it somewhere you control.");
  }
  function invalidateMastery() {
    let changed = true;
    while (changed) {
      changed = false;
      state.mastered = state.mastered.filter((id) => {
        const m = byId[id],
          keep =
            m.lessons.every((_, i) =>
              state.completed.includes(lessonId(m, i)),
            ) &&
            m.prerequisites.every((p) => state.mastered.includes(p)) &&
            state.checks[id];
        if (!keep) {
          delete state.masteryDates[id];
          delete state.reviewProgress[id];
          changed = true;
        }
        return keep;
      });
    }
  }
  function calendarExport() {
    const plan = buildPlan();
    if (!plan.length) {
      toast("There is no remaining scheduled work to export.");
      return;
    }
    const icsEscape = (s) =>
      String(s)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,");
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//First Principles Atlas//Study Plan//EN",
      "CALSCALE:GREGORIAN",
    ];
    for (const d of plan) {
      lines.push(
        "BEGIN:VEVENT",
        "UID:atlas-" + state.track + "-" + d.date + "@local",
        "DTSTAMP:" + stamp,
        "DTSTART;VALUE=DATE:" + d.date.replace(/-/g, ""),
        "DTEND;VALUE=DATE:" + dateAdd(d.date, 1).replace(/-/g, ""),
        "SUMMARY:" +
          icsEscape(
            "Study " + d.number + ": " + (d.tasks[0]?.title || "Review"),
          ),
        "DESCRIPTION:" +
          icsEscape(
            "20 min retrieval\n" +
              d.tasks
                .map(
                  (t) =>
                    t.allocated + " min: " + t.title + " — " + t.description,
                )
                .join("\n") +
              "\n10 min reflection. Plan estimates; advance only after mastery.",
          ),
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");
    const enc = new TextEncoder();
    function fold(line) {
      const out = [];
      let chunk = "",
        size = 0;
      for (const ch of line) {
        const n = enc.encode(ch).length;
        if (size + n > 73) {
          out.push(chunk);
          chunk = " " + ch;
          size = 1 + n;
        } else {
          chunk += ch;
          size += n;
        }
      }
      out.push(chunk);
      return out.join("\r\n");
    }
    download(
      "first-principles-study-plan.ics",
      lines.map(fold).join("\r\n") + "\r\n",
      "text/calendar;charset=utf-8",
    );
    toast(
      "All-day study blocks exported. Re-import carefully to avoid duplicates.",
    );
  }
  async function importState(file) {
    if (!file) return;
    if (file.size > 1000000) {
      toast("Import rejected: progress files must be smaller than 1 MB.");
      return;
    }
    try {
      const imported = validateState(JSON.parse(await file.text()));
      if (
        !window.confirm(
          "Replace current progress with this file? Export your current progress first if you need a backup.",
        )
      )
        return;
      migrated = JSON.parse(await file.text()).version === 1;
      state = imported;
      workUndo.length = 0;
      save();
      planPage = 0;
      $("#lesson-dialog").close();
      render();
      toast("Progress imported and validated.");
    } catch (e) {
      toast("Import rejected: " + e.message);
    }
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const { action, id, index, value } = el.dataset;
    if (action === "dismiss-upgrade") {
      migrated = false;
      save();
      render();
    }
    if (action === "undo-work") {
      const prev = workUndo.pop();
      if (prev) {
        Object.assign(state, prev);
        invalidateMastery();
        save();
        render();
        toast("Last logged block undone. Notes and settings are preserved.");
      }
    }
    if (action === "search") openSearch();
    if (action === "close-search") $("#command-dialog").close();
    if (action === "search-module") {
      $("#command-dialog").close();
      openModule(id);
    }
    if (action === "focus-mode") {
      focusMode = !focusMode;
      $("#lesson-dialog").classList.toggle("focus-mode", focusMode);
      el.setAttribute("aria-pressed", String(focusMode));
      el.textContent = focusMode
        ? "Show module context"
        : "Focus on the open lesson";
      if (focusMode) {
        const first =
          $("#lesson-dialog details.lesson[open]") ||
          $("#lesson-dialog details.lesson");
        if (first) {
          $("#lesson-dialog")
            .querySelectorAll("details.lesson")
            .forEach((l) => (l.open = l === first));
          first.open = true;
        }
      }
    }
    if (action === "focus-prev" || action === "focus-next") {
      const open = [
          ...$("#lesson-dialog").querySelectorAll("details.lesson"),
        ].findIndex((l) => l.open),
        next = Math.max(
          0,
          Math.min(4, open + (action === "focus-next" ? 1 : -1)),
        );
      openModule(id, next);
    }
    if (action === "answer") {
      const m = byId[id],
        choice = Number(el.dataset.choice);
      if (
        m?.assessment &&
        Number.isInteger(choice) &&
        choice >= 0 &&
        choice < 4
      ) {
        const scroll = $("#lesson-dialog").scrollTop;
        state.assessments[id] = {
          choice,
          attempts: Math.min(10000, (state.assessments[id]?.attempts || 0) + 1),
        };
        save();
        openModule(id);
        $("#lesson-dialog").scrollTop = scroll;
        $(
          '#lesson-dialog [data-action="answer"][data-choice="' + choice + '"]',
        )?.focus({ preventScroll: true });
      }
    }
    if (action === "download-example") {
      const ex = byId[id]?.workedExample;
      if (ex) {
        const ext = /html/i.test(ex.language)
          ? "html"
          : /python/i.test(ex.language)
            ? "py"
            : /javascript/i.test(ex.language)
              ? "js"
              : /sql/i.test(ex.language)
                ? "sql"
                : "txt";
        download(
          id + "-worked-example." + ext,
          ex.code,
          "text/plain;charset=utf-8",
        );
      }
    }
    if (action === "continue") {
      const n = nextLesson();
      if (n) {
        if (n.gate) focusMode = false;
        openModule(n.m.id, n.i);
        if (n.gate)
          setTimeout(
            () => $(".mastery-card")?.scrollIntoView({ block: "start" }),
            50,
          );
      } else location.hash = "portfolio";
    }
    if (action === "module") {
      if ($("#command-dialog").open) $("#command-dialog").close();
      openModule(id, index === undefined ? null : Number(index));
    }
    if (action === "close-dialog") $("#lesson-dialog").close();
    if (action === "phase") {
      phase = value;
      render();
    }
    if (action === "practice") {
      workUndo.length = 0;
      const m = byId[id],
        lid = lessonId(m, Number(index));
      if (state.completed.includes(lid)) {
        state.completed = state.completed.filter((x) => x !== lid);
        for (const k of Object.keys(state.activityProgress))
          if (k.startsWith(id + ":" + index + ":"))
            delete state.activityProgress[k];
        invalidateMastery();
      } else state.completed.push(lid);
      save();
      render();
      const scroll = $("#lesson-dialog").scrollTop;
      openModule(id, Number(index));
      $("#lesson-dialog").scrollTop = scroll;
      toast(
        state.completed.includes(lid)
          ? "Session practiced. Mastery still needs evidence."
          : "Session reopened; dependent mastery gates are rechecked.",
      );
    }
    if (action === "mastery") {
      workUndo.length = 0;
      if (state.mastered.includes(id)) {
        state.mastered = state.mastered.filter((x) => x !== id);
        delete state.masteryDates[id];
        invalidateMastery();
      } else {
        const m = byId[id];
        if (
          !m.prerequisites.every((p) => state.mastered.includes(p)) ||
          !m.lessons.every((_, i) =>
            state.completed.includes(lessonId(m, i)),
          ) ||
          !state.checks[id]
        )
          return;
        state.mastered.push(id);
        state.masteryDates[id] = today();
        state.reviewProgress[id] = 0;
      }
      save();
      render();
      openModule(id);
      toast("Mastery record updated. Keep the evidence current.");
    }
    if (action === "go-project") {
      location.hash = "portfolio";
      setTimeout(
        () =>
          $("#project-" + id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        40,
      );
    }
    if (action === "plan-prev") {
      planPage = Math.max(0, planPage - 1);
      render();
    }
    if (action === "plan-next") {
      planPage++;
      render();
    }
    if (action === "rebase") {
      state.start = today();
      planPage = 0;
      save();
      render();
      toast(
        "Remaining work now starts today. Completed evidence is preserved.",
      );
    }
    if (action === "log-work")
      logWork(el.dataset.key, Number(el.dataset.minutes));
    if (action === "repeat-review") {
      if (byId[id]) {
        workUndo.length = 0;
        delete state.activityProgress[id + ":gate:gate"];
        state.mastered = state.mastered.filter((x) => x !== id);
        delete state.masteryDates[id];
        invalidateMastery();
        save();
        render();
        openModule(id);
        toast(
          "Review budget reopened. Previously logged study time is preserved.",
        );
      }
    }
    if (action === "reviewed") {
      const date = state.masteryDates[id];
      if (date) {
        const age = Math.floor(
          (Date.parse(today()) - Date.parse(date)) / 86400000,
        );
        state.reviewProgress[id] = reviewIntervals.filter(
          (n) => n <= age,
        ).length;
        save();
        render();
        toast(
          "Recall recorded. If the explanation failed, reopen the mastery gate.",
        );
      }
    }
    if (action === "export") exportState();
    if (action === "calendar") calendarExport();
    if (action === "job-template") {
      download(
        "job-market-research-template.csv",
        "capture_date,employer,role_title,source_url,role_family,seniority,country,remote_eligibility,work_authorization,degree_required,experience_required,required_skills,preferred_skills,evidence_requested,eligible_to_apply,duplicate_of,notes\r\n",
        "text/csv;charset=utf-8",
      );
      toast(
        "Research worksheet downloaded. Use dated, eligible, deduplicated roles.",
      );
    }
    if (action === "print") window.print();
    if (
      action === "reset" &&
      confirm(
        "Reset all local progress, evidence notes and settings? Export a backup first.",
      )
    ) {
      state = defaults();
      workUndo.length = 0;
      save();
      planPage = 0;
      render();
      toast("Local progress reset.");
    }
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "command-search") commandSearch();
    if (el.matches("[data-lab]")) updateLabs();
    if (el.dataset.note) {
      state.notes[el.dataset.note] = el.value.slice(0, 5000);
      save();
    }
    if (el.id === "curriculum-search" || el.id === "library-search") {
      const pos = el.selectionStart,
        id = el.id;
      if (id === "curriculum-search") query = el.value;
      else libQuery = el.value;
      render();
      const next = $("#" + id);
      next.focus();
      if (pos !== null) next.setSelectionRange(pos, pos);
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.matches("[data-lab]")) updateLabs();
    if (el.id === "import-file" || el.id === "import-file-method") {
      importState(el.files[0]);
      el.value = "";
    }
    if (el.dataset.setting) {
      const k = el.dataset.setting;
      let v = el.type === "checkbox" ? el.checked : el.value;
      if (k === "hours" || k === "days" || k === "blockMinutes") v = Number(v);
      const next = { ...state, [k]: v };
      try {
        state = validateState(next);
        save();
        planPage = 0;
        render();
      } catch (err) {
        toast(err.message);
        render();
      }
    }
    if (el.dataset.check) {
      workUndo.length = 0;
      const id = el.dataset.check;
      state.checks[id] = el.checked;
      invalidateMastery();
      save();
      const m = byId[id],
        button = $("#mastery-button");
      if (button) {
        button.disabled =
          !state.mastered.includes(id) &&
          (!m.prerequisites.every((p) => state.mastered.includes(p)) ||
            !m.lessons.every((_, i) =>
              state.completed.includes(lessonId(m, i)),
            ) ||
            !state.checks[id]);
        button.textContent = state.mastered.includes(id)
          ? "Reopen this mastery gate"
          : "Mark mastery gate met";
      }
      render();
    }
    if (el.dataset.project) {
      workUndo.length = 0;
      const id = el.dataset.project;
      if (!projectStageIds.has(id)) return;
      if (el.checked && !state.projectDone.includes(id))
        state.projectDone.push(id);
      const parts = id.split("-"),
        key = parts[0] + ":" + parts[1] + ":project";
      if (el.checked) state.activityProgress[key] = activityLimits[key];
      if (!el.checked) {
        state.projectDone = state.projectDone.filter((x) => x !== id);
        delete state.activityProgress[key];
      }
      save();
      toast("Capstone evidence progress saved.");
    }
  });
  $("#lesson-dialog").addEventListener("click", (e) => {
    if (e.target === $("#lesson-dialog")) {
      const b = e.target.getBoundingClientRect();
      if (
        e.clientX < b.left ||
        e.clientX > b.right ||
        e.clientY < b.top ||
        e.clientY > b.bottom
      )
        e.target.close();
    }
  });
  function navigate() {
    const target = location.hash.slice(1);
    view = nav.some((n) => n[0] === target) ? target : "overview";
    render(true);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", navigate);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (!$("#lesson-dialog").open) openSearch();
    }
  });
  // A read-only API exposes pure calculations for regression tests; learner code is never evaluated.
  window.ATLAS = {
    buildPlan: () => buildPlan(),
    taskQueue: () => taskQueue(),
    selectedModules: () => selectedModules().map((m) => m.id),
    validateState,
    defaults,
    minutes,
    projects: JSON.parse(JSON.stringify(projects)),
    getState: () => JSON.parse(JSON.stringify(state)),
  };
  navigate();
})();
