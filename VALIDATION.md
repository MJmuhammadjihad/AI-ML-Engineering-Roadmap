# Edition 03 validation record

Validated **5 November 2026**. The standalone HTML is **1,029,400 bytes** with SHA-256:

`99e2347f73040202825627bb462f58c49c3730f8d0ad4411093edac97470ba09`

## Executed checks

| Check | Result |
| --- | --- |
| Curriculum/build validation | Passed: 41 modules, 205 sessions, six guided days, 42 foundation blocks, prerequisite references, budgets, rubrics, and source schemas |
| JavaScript syntax | `src/app.js` and `src/v3.js` passed |
| Planner and assessment engines | 74 checks passed, including 500 seeded schedules and 36 assessment combinations |
| Content and Python examples | 22 tests passed; 51 isolated Python processes exercised the six new examples, setup snippet, conversions, branches, loops, functions, malformed input, and boundary cases |
| Existing application regressions | 21 browser tests passed |
| Edition 03 behavior | 27 browser tests passed |

The **48 browser tests** check every original view, all 41 module dialogs, the six new reading views, source downloads, all five role routes, planner conservation, calendar export, diagnostics, progress migration/import/export, storage failure, escaped notes, shared daily capacity, assessment provenance, keyboard navigation, print-to-PDF, and layouts at 320/390/768/1440 pixels. Text-size enlargement is exercised as a layout check. The browser suites reported no JavaScript errors or external runtime requests.

The source code of every downloaded new worked example matches the embedded curriculum. Each independent exercise retains an unfilled learner-result field: author execution checks are not represented as the learner's achievement. Core module guidance covers all 41 IDs, with distinct transfer prompts, explicit criteria, repairs, and readiness/scope limits.

Full outputs and command exit codes are retained in [the test log](research/v3-test-results.txt) and [the machine-readable verification record](research/v3-verification.json). One misplaced assertion in the test harness was corrected; the entire affected 27-test browser suite then passed. That correction did not change the HTML.

## Preserved earlier editions

Both earlier HTML files and both original source ZIPs match their pre-upgrade SHA-256 hashes. Edition 02 HTML remains `d006150ea194be468febb25434cb5016e275329ea799b848e2c540a58a1acd49`; edition 01 remains `a372140c72a7cba3a559de0c47aada4658c84a5cd259798747ac31c30ae620e0`. The browser suite asserts all four original artifact identities.

Historical verification is retained in [the edition 02 record](research/validation-v2.md) and its source archive. Earlier examples retain their original execution scope: 38 executed, two conceptually reviewed, and one PyTorch example not executed in that environment. They were not relabeled as newly executed.

## Research provenance

The new market ledger is dated **4 November 2026**. Nine source entries and ten job-content records were matched against retained HTTPS captures; source/content hashes and supporting passages were checked. The sample covers three employers and five listed countries. Occupational projections, employer expectations, observed role requirements, engineering guidance, and future scenarios are distinguished. See [the audit and interpretation](research/v3-market-research.md).

This targeted sample is not a representative global hiring survey. Browser transport success does not establish current vacancy availability, and report retrieval does not independently reproduce its underlying study. Learning budgets, review intervals, and schedule forecasts remain editorial planning heuristics; no longitudinal learner study or employment guarantee is claimed.

## Runtime and accessibility limits

The exact distributed HTML was served on loopback with external requests blocked. Managed Chromium denies direct `file://` navigation, so direct-file storage behavior remains unverified in this environment. The page contains no external runtime script, stylesheet, image, font, API, or server dependency. External source links require internet access.

Desktop/mobile screenshots were inspected. Keyboard focus, skip navigation, section links, responsive overflow, reduced-motion CSS, and print output were reviewed or tested as described above. This is functional validation in Chromium, not an accessibility certification, a screen-reader audit, or an exhaustive cross-browser matrix. Windows/macOS/Linux setup instructions are guidance; they were not all executed on those operating systems.

## Reproduction

From the extracted source directory, run:

```sh
python3 package.py
node --check src/app.js
node --check src/v3.js
node tests/test_v3_engines.js
python3 tests/test_v3_content.py
python3 tests/test_atlas.py
python3 tests/test_v3_browser.py
```

Python 3.10+ rebuilds the application. Engine tests need Node.js 18+; browser tests need Python Playwright and Chromium. `CHROMIUM_PATH` selects a browser. Use `ATLAS_TEST_TRANSPORT=file` only where that transport is permitted. Packaging runs content validation and ZIP integrity checks, but does not automatically execute the browser tests. Compare the built HTML hash with this record.

## Source archive verification

The edition 03 source ZIP passed integrity checks and was extracted into a fresh temporary directory. Running its bundled `build.py` reproduced the exact HTML hash above. All four preserved earlier artifacts also matched. The final ZIP includes the tested source, reports, tests, and unchanged earlier editions.
