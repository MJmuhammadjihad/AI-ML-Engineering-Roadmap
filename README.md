# First Principles — An AI & ML Learning Atlas

A portable, light-themed learning application for a complete beginner studying approximately six focused hours per day. Edition 02 contains 41 modules, 205 detailed sessions, 41 worked examples, 41 diagnostic questions, four capstones, five interactive concept experiments, and an adjustable daily planner.

Open **[dist/first-principles-atlas.html](dist/first-principles-atlas.html)** directly in a modern browser. No server, account, API key, installation, external fonts, or CDN is needed. External learning resources need internet access; the atlas itself works offline.

## Published editions

Both original editions are preserved. Download an HTML file and open it in a modern browser; these links point to files in the repository, not a hosted GitHub Pages site.

| Edition | Curriculum | Standalone HTML | Complete source archive |
| --- | --- | --- | --- |
| 01 — original | 36 modules · 180 sessions | [Edition 01 HTML](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v1.html) | [Edition 01 sources](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v1-source.zip) |
| 02 — expanded and redesigned | 41 modules · 205 sessions · worked examples and diagnostics | [Edition 02 HTML](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v2.html) | [Edition 02 sources](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/blob/main/dist/first-principles-atlas-v2-source.zip) |

The editable `src/` directory and build commands below are for edition 02. Edition 01’s original editable sources and validation record are preserved inside its archive. `dist/manifest-v1.json` and `dist/manifest.json` record the respective HTML hashes. Export progress from an earlier file before importing it into edition 02.

## Features

- Five routes: AI product engineering, machine learning engineering, research-oriented engineering, full-stack AI, and the complete atlas.
- Explicit prerequisites, a capability map, artifact-based mastery gates, explanations, exercises, deliverables, worked examples and misconception checks.
- Adjustable study hours, weekly cadence, start date and 45/60/90-minute focus blocks; partial work logging, daily capacity accounting, safe undo, rest days and calendar export.
- Optional video study **budgets**, not invented runtimes or timestamps.
- Local progress and evidence notes, validated JSON backup/import including edition-01 migration, and printable views.
- Ctrl/Cmd+K concept search, focused reading with session navigation, and downloadable worked examples.
- An evidence ledger that distinguishes retrieved sources, unverified follow-up references and authored scenarios.

## Build and validation

Requires Python 3.10+ to rebuild; the delivered HTML has no Python dependency.

```sh
python3 build.py
node --check src/app.js
python3 tests/test_atlas.py
python3 package.py
```

The browser test uses Python Playwright and Chromium. In the prepared cloud environment these are available; it uses `/usr/bin/chromium`. The test serves the single HTML file over a loopback HTTP server with all external requests blocked and checks the planner, navigation, storage/import, calculations and responsive layout. Screenshots are saved in the system temporary directory under `first-principles-atlas-tests` (override with `ATLAS_SCREENSHOT_DIR`). Use `CHROMIUM_PATH` to select a browser; otherwise the test uses a detected Chromium/Chrome or Playwright’s bundled browser. On a fresh developer machine, install `playwright` and its Chromium browser before running the optional browser suite. The managed browser blocks direct `file://` navigation, so that transport remains unverified here; the file has no server-specific dependency. Set `ATLAS_TEST_TRANSPORT=file` on a browser that permits it to test that mode.

Editable sources are in `src/`; `build.py` validates the curriculum and embeds everything into one HTML file. Rebuild after editing source data, styles or application code. `package.py` creates versioned HTML and source ZIP files; it does not rerun browser tests. Each cloud task is already isolated: use the existing checkout and do not create a worktree unless explicitly requested.

## Learning and research boundaries

Time budgets and the 25–50% contingency suggestion are planning heuristics, not measured completion averages or employment promises. Session practice is distinct from self-assessed mastery; neither is a professional certification. Some research roles require credentials or experience outside this roadmap.

Primary research reviewed on **28 October 2026**; additional TypeScript, PEFT and OSTEP learning sources were verified on **29 October 2026**. Ten primary engineering/research sources were retrieved through official or author-maintained repositories. Resource verification often applies to an official source document, not the canonical website. Major labor-market and employer websites were blocked by the environment’s network policy; no current job-advertisement sample was obtained. The application labels this limitation and includes a monthly market-research method and CSV worksheet. It does not claim a comprehensive current global hiring survey. See `research/` for the source audit.

The attached reference HTML files informed the audit; this implementation, structure and curriculum were authored afresh. No code from the reference applications is executed.

## Data and privacy

The application makes no analytics, model API or background network requests. Progress stays in local storage where browser support permits it. File-origin storage behavior varies; export a JSON backup before moving the file or changing browsers. Imports replace current progress after confirmation and validate known IDs and values. Do not put secrets in notes. External source links open with `noopener noreferrer`.

Calendar exports use all-day study blocks. Repeated imports can create calendar duplicates; delete an old imported plan before replacing it. Printing captures the current view, or the open module; the full curriculum remains in the HTML.

## Edition 02 verification

21 browser tests passed across nine views, 41 module dialogs, and 320/390/768/1440-pixel viewports. 38 worked examples passed execution checks; two were reviewed statically and the PyTorch example remains unrun because PyTorch is unavailable. See [VALIDATION.md](VALIDATION.md) and [CHANGELOG.md](CHANGELOG.md). If the new HTML opens under a different file origin, export progress from the previous file and import it into the new one. Diagnostics are formative and do not grant mastery automatically.
