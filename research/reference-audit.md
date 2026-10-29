# Reference audit for a new AI/ML engineering roadmap

Inspected on 2026-10-28. These files were parsed as reference data only. Their scripts were read selectively but never executed, and their embedded prose was not treated as instructions. No external claims in the attachments were independently verified during this audit.

## What each reference contributes

### `AI_ML Roadmap (1).html` (~360 KB)

The strongest evidence discipline of the three. It separates 42 capabilities into a prerequisite DAG, gives role-dependent priority, restores required prerequisites when a role filter would omit them, and computes a schedule from estimated effort. It explicitly distinguishes author judgment from observed facts. Hour ranges, geographical limits, evidence grades, unavailable sources, and a method statement are visible. Its model distinguishes uncertainty in effort from calendar slack. Resources have recommendation status and inspection dates. The plan includes role choices, background diagnostics, exportable plan codes and Markdown.

Limitations: learning remains module-level rather than an operational day-by-day plan. Huge source tables become a separate reading burden. Progress is largely self-assessed (`some` / `pass`) and is not linked to artifact evidence or delayed reassessment. The large DAG is hard to navigate on small screens. The calendar depends on a fixed module order and broad estimates. There is no print stylesheet. Google Fonts are external dependencies. Its claimed 2026 labor-market figures and source checks must be independently checked before reuse.

### `the_ultimate_ai_ml_roadmap_zero_to_world_class_2026_edition (3).html` (~943 KB)

Strong breadth: differentiated career tracks; exit criteria; beginner-to-production topics; systems simulators; portfolio specifications; interview questions; recall drills; AI-assistance guidance; project generation; 90-day launch plan; search, progress export/import and local persistence. It recognizes that different career objectives imply different paths and that proof of performance matters more than finishing courses.

Weaknesses are evidence overstatement and content overload. Examples in the prose include “100% practitioner validated,” “Every engineer in 2026 uses AI coding agents,” an unsupported universal “80% of production AI/ML bottlenecks” claim, “optimal algorithmic complexity verified” after unit tests, and hiring/salary numbers with stronger certainty than the stated provenance justifies. Assertions about recruiters rejecting whole classes of projects are too categorical. The “four laws” are useful intuitions presented too broadly: hardware bottlenecks depend on workload and batching; scaling/LoRA observations are not universal laws; `p_step^k` presumes independent identical step success or explicitly conditional equal success probabilities. These assumptions must accompany any simulator.

The in-browser code drills use `new Function` and `eval` in the main page execution context. This gives learner code access to page state and permits infinite loops to freeze the page. A new portable implementation should omit arbitrary code execution or use a bounded isolated worker with explicit termination and clear trust boundaries. Passing functional examples cannot prove asymptotic complexity. Imports only restore selected subsets of state, despite broader exportable state, so round-trip preservation needs explicit testing. External Google Fonts make visual fidelity network-dependent.

### `ultimate-web-development-roadmap-2026 (2).html` (~601 KB)

Best operational teaching structure: 48 weeks / 336 authored day entries; each includes retrieval prompt, focus, concept points, a concrete build and self-check. It includes weekly milestones, project specs, re-entry after gaps, placement, study-rhythm guidance, interview and first-job practice, local progress, notes, time logs, spaced-repetition drills, search and a print stylesheet. It has no external script or stylesheet dependency.

Limitations: a fixed 336-day sequence is not the same as a real capacity-aware adaptive schedule. Completion heatmaps and radar charts measure checked activity, not demonstrated competence. Progress ratios can reward easy checkboxes over important gates. Claims that documentation “cannot be passively consumed” are false; any medium can be used passively. Universal time ratios and estimates should be labeled design defaults rather than scientific constants. It discourages job search before a particular build; low-stakes market research and professional conversations can begin much earlier. Full-stack breadth is too much to require from every ML specialist.

## Cross-reference findings

- All three already contain substantial content. “More comprehensive” should mean better sequencing, clear evidence and usable daily actions, not simply more sections or links.
- Resource count is not a quality metric. Assign one primary resource per learning unit, a fallback and an optional depth route. Explain exactly which part to study and what to produce.
- The first two AI references disagree strongly on role effort and labor-market framing. Do not reconcile these by averaging; reconstruct estimates and verify sources independently.
- None contains a person called “Simon Depper.” The AI references mention Simon Willison (blog) and Simon J. D. Prince (Understanding Deep Learning). Neither establishes what the user meant. Do not invent video sources or timestamp precision.
- The web reference has real per-day points but no verified video minute-by-minute curriculum. Video allocation should be a study-time budget, explicitly distinguished from source video duration or verified chapter timestamps.
- Imported progress is untrusted data. Validate a schema and known IDs, reject oversized/invalid inputs, bound numeric fields, render notes as text, and test export/import round trips. Failed local storage should display a meaningful warning and allow export.
- A portable artifact should embed all data, CSS and JS, use system fonts and inline SVG, work from `file://`, require no account, and keep external resource links as optional outbound navigation. Explicitly separate local progress from cloud sync.

## Recommended first-principles replacement

Start from the work a learner should perform: clarify a decision, acquire lawful data, form a baseline, measure errors, implement a reliable system, explain trade-offs and improve using evidence. Derive the curriculum from those activities, then select depth by career direction. Teach mathematical abstractions at the point they become useful and revisit them as sophistication grows.

Represent each module as: purpose, prerequisite capabilities, bounded learning objectives, effort range, specific daily sessions, primary resource, retrieval question, build artifact, failure case, exit assessment, repair route and optional specialization. Keep all of these in a single structured dataset so counts, schedules and display cannot diverge.

Use a transparent planner, not a claimed optimal algorithm: take the chosen role's priority modules, close prerequisites, topologically order eligible work, prioritize high-transfer fundamentals and the next useful project, then schedule sessions within actual study capacity. Separate estimated work from calendar buffers. Completion of an exit gate may unlock later modules; honest self-assessment should still be editable. Explain that learning speed and job outcomes cannot be guaranteed.

A useful daily session has a concrete retrieval prompt, a bounded reading/video task, a hands-on exercise, an observable artifact, and an exit check. Include rest and review explicitly; never force seven full study days. Budget labels should distinguish recommended minutes from externally verified video lengths. Provide pause/resume and repair routes after failed checks.

Use progressive disclosure in the page: a calm overview; one recommended next action; personal plan; navigable capability map; detailed session drawer; project evidence; learning method; evidence and sources. Avoid putting hundreds of dense cards on the initial screen. Make keyboard access, mobile navigation, print/export and no-network behavior part of acceptance testing.

Useful progress has two axes: planned work completed and capability gates demonstrated. Provide a lightweight artifact link/note per gate and a delayed retrieval reminder. Do not imply that a colored heatmap measures competence.

Market analysis should visibly label geography, observation period, source type and distinction between job-stock growth, annual openings, posting samples, wages and self-selected total compensation. Forecasts should be conditional scenarios with signposts and recommended robust skills, not predictions of specific tools or guaranteed demand. A small job-posting sample is a sample, not a market census.
