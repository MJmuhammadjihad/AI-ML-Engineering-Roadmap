# First Principles — An AI & ML Learning Atlas

Edition 03 is a portable, light-themed learning application for a complete beginner with a six-hour active-study budget. It combines six fully guided foundation days with 41 modules, 205 further learning sessions, four capstones, five interactive concept labs, and five career routes.

**[Download the edition 03 HTML](dist/first-principles-atlas-v3.html)** and open the saved file in a modern browser. The application embeds its curriculum, styles, and JavaScript. It needs no account, API key, external font, CDN, or runtime installation. External learning resources require internet access.

## Choose an edition

Earlier HTML files and source archives are preserved byte for byte. GitHub links below are repository files; this repository does not configure a GitHub Pages deployment.

| Edition | What it contains | HTML | Source archive |
| --- | --- | --- | --- |
| 01 — original | 36 modules, 180 sessions | [HTML](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v1.html) | [Sources](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v1-source.zip) |
| 02 — expanded | 41 modules, 205 sessions, worked examples and diagnostics | [HTML](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v2.html) | [Sources](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v2-source.zip) |
| **03 — guided learning** | Six beginner days, stronger transfer assessments, a redesigned daily workspace, and current market evidence | [HTML](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v3.html) | [Sources](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v3-source.zip) |

`dist/first-principles-atlas.html` and `dist/first-principles-atlas-source.zip` are aliases for the latest edition. Editable `src/` files now build edition 03. Versioned manifests identify the artifacts; earlier source archives retain their original code and validation records.

## What changed in edition 03

- **Today, Path, Practice, Library:** four primary destinations, with the full curriculum, calendar, labs, portfolio, research, and learning method still available.
- **A complete beginning:** six 360-minute study plans, 42 authored work blocks, runnable Python examples, 18 misconception checks, independent tasks, transfer problems, and explicit repair exercises. One study-budget program grows from a saved file into a validated command-line tool.
- **A dedicated reading room:** clear outcomes, operating-system setup instructions, formatted source and expected output, progressive disclosures, a lesson outline, actual-time logging, and a local evidence notebook.
- **Deeper work throughout the atlas:** every one of the 41 modules has a new transfer task, observable rubric, specific misconception repair, reviewer question, readiness explanation, and scope limit.
- **Evidence-aware planning:** whole foundation work blocks are recommended only when their prerequisites have recorded demonstrations. Reading ahead remains available. Completion, time spent, assisted practice, and self-reported independent evidence remain distinct.
- **Honest time accounting:** the default is 360 active minutes, with breaks additional. An explicit elapsed-time mode includes breaks. Foundation and core-curriculum logs share the same remaining daily capacity. Reopening practice preserves earlier time records.
- **A dated research refresh:** nine primary-source entries and ten inspected job descriptions from three employers, with geography, seniority, eligibility, and sampling limits visible.
- **Safer continuity:** edition-01/02 progress can be imported or recovered from the earlier browser key. The old key is not overwritten; an exact legacy snapshot travels with edition-03 exports. New assessments begin separately.

The five routes cover AI product engineering, machine learning engineering, research-oriented engineering, full-stack AI development, and the complete reference atlas. Optional video minutes are study budgets, not claimed video runtimes or timestamps.

## Build and verify

Rebuilding requires Python 3.10+. Engine checks require Node.js 18+; browser checks require Python Playwright and Chromium. The finished HTML has none of these runtime dependencies.

```sh
python3 package.py
node --check src/app.js
node tests/test_v3_engines.js
python3 tests/test_v3_content.py
python3 tests/test_atlas.py
python3 tests/test_v3_browser.py
```

`build.py` validates content and embeds all local source into one HTML file. `src/v3.js` is deliberately inserted inside the application closure through a build marker; it shares the application's state and rendering helpers. The standalone planner and assessment modules also support CommonJS for tests. `package.py` builds the versioned HTML, latest aliases, manifests, and complete source archive. Packaging does not run the browser tests.

Browser suites serve the exact distributed HTML on loopback and block all external requests. `CHROMIUM_PATH` can select a browser. `ATLAS_TEST_TRANSPORT=file` requests direct-file testing when the selected browser permits it. The managed browser used for this release blocks `file://` navigation by administrative policy, so direct-file storage behavior remains unverified here. See [VALIDATION.md](VALIDATION.md) for the tested artifact hash and precise coverage.

## Research and learning boundaries

The November 4, 2026 refresh retrieved BLS occupational projections, the World Economic Forum's 2025 report, Stanford's 2026 AI Index economy chapter, primary ML engineering guidance, and public employer job feeds. The sample spans three employers and five listed countries. It is a targeted qualitative sample, not a representative global vacancy survey. US projections, employer expectations, current role requirements, and future scenarios are labeled separately. No salary, job probability, or personal completion deadline is inferred from them.

Read [the research analysis](research/v3-market-research.md) and [the source ledger](research/v3-market-evidence.json). Earlier technical research remains available as a dated archive. The curriculum order, duration budgets, review intervals, and contingency suggestions are authored planning heuristics; they have not been established as a universally optimal learning algorithm or validated in a longitudinal learner study.

The six new worked Python examples have reproducible execution checks. Earlier examples retain their documented validation scope: 38 were executed, two were reviewed conceptually, and the PyTorch example was not executed in the original environment. A working example does not certify a learner's independently written implementation. Criterion records are explicitly self-reported unless externally verified evidence is separately obtained.

## Progress, privacy, and portability

The application sends no analytics or background API requests. It stores progress locally when the browser permits it. Export JSON before moving the HTML file or changing browsers; storage behavior for local files varies. Imports validate data before asking to replace current progress. Keep an exported backup if both records are needed. A blocked or full storage system leaves the app usable in memory with export available.

The new storage key is `first-principles-atlas-v3`; the original `first-principles-atlas-v1` key is read only as a fallback and is preserved. Downloaded progress includes source-edition history where applicable. Notes are rendered as text. Do not put credentials in notes or source files.

Calendar exports use all-day study events. Repeated imports can create duplicates in a calendar application. Printing captures the current view or open lesson. Each cloud task is already isolated: use the existing checkout unless a separate worktree is explicitly needed.
