# Contributing to First Principles

Help the next learner get unstuck. A clearer explanation, a reproducible bug report, or a corrected source is a useful contribution; you do not need to improve an entire module.

## Good places to begin

- **Try a beginner lesson.** Tell us the lesson title, the step that confused you, and what you expected to happen.
- **Check an example.** Run it, compare its output, and report your Python version and the smallest input that fails.
- **Improve accessibility.** Report keyboard, focus, contrast, text enlargement, or screen-reader problems with reproduction steps.
- **Refresh a source.** Provide a primary-source URL, its date, the claim it supports, and any geography or sampling limits.
- **Fix a small bug.** Search existing issues first, then submit a focused change with a clear before-and-after description.

Use the [bug report](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/issues/new?template=bug_report.yml) or [lesson improvement](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/issues/new?template=lesson_improvement.yml) form. For a substantial redesign or new curriculum branch, an issue describing the learner's problem helps establish scope before implementation.

## Find the right file

| Area | Source |
| --- | --- |
| Six guided beginner days | `src/foundations.json` |
| Core curriculum, resources, and original worked examples | `src/data.json` |
| Module transfer tasks, rubrics, and repairs | `src/module-guidance.json` |
| Interface and lesson interactions | `src/app.js`, `src/v3.js`, `src/shell.html` |
| Appearance and responsive layout | `src/styles.css` |
| Public showcase and preview assets | `site/`, `docs/assets/`, `scripts/capture_previews.py`, `scripts/record_walkthrough.py` |
| Readable curriculum index | `scripts/build_curriculum.py` generates `docs/CURRICULUM.md` and `site/curriculum.html` from the curriculum JSON |
| Scheduling and assessment logic | `src/planner.js`, `src/assessment.js` |
| Dated job-market analysis and source ledger | `research/v3-market-research.md`, `research/v3-market-evidence.json` |

Edit source files rather than the generated HTML. `src/v3.js` is inserted inside the application's closure by the build; it is not loaded as a separate browser script. Preserve existing identifiers used by saved progress unless your change also handles migration.

## Work locally

The application itself needs only a browser. Development uses Python 3.10+; engine checks also use Node.js 18+.

```sh
python3 build.py
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/dist/first-principles-atlas.html`. Stop the server with Ctrl+C. Use a separate browser profile or export your progress before testing changes to storage or imports.

Run checks that match the change:

| Change | Verification |
| --- | --- |
| Documentation or links | Read the rendered Markdown and check the changed links. |
| Curriculum or worked examples | `python3 build.py` and `python3 tests/test_v3_content.py`; manually review explanations, expected outputs, and source claims. |
| Planner or assessment | `node tests/test_v3_engines.js` and `python3 build.py`; run browser checks when user-facing behavior changes. |
| JavaScript or interface | Rebuild, run the syntax and browser checks below, and inspect the affected views on desktop and mobile. |
| Public showcase | `python3 tests/test_site.py`; inspect desktop/mobile previews and any changed copy or links. |

```sh
python3 package.py
node --check src/app.js
node --check src/v3.js
python3 tests/test_atlas.py
python3 tests/test_v3_browser.py
```

Browser checks require the Python `playwright` package and Chromium. In your Python environment, install them with `python3 -m pip install playwright` and `python3 -m playwright install chromium`. Set `CHROMIUM_PATH` if using another installed Chromium executable. The suites serve the distributed HTML on loopback and block external requests. See [VALIDATION.md](VALIDATION.md) for current coverage and environment limitations.

`build.py` updates only the unversioned preview HTML. Run `python3 package.py` **before browser verification after an application edit**: the edition 03 browser suite loads the versioned HTML, so packaging ensures it tests the current source. Packaging rebuilds edition 03, its latest aliases, manifests, and source archives; it does not run tests. Keep edition 01 and 02 artifacts unchanged. In a pull request, state whether generated artifacts were rebuilt and list any checks you could not run.

After editing curriculum JSON, also run `python3 scripts/build_curriculum.py`. CI uses `--check` to ensure the readable indexes match the app's curriculum. For documentation-only or showcase-only changes, the app does not need to be repackaged unless preparing a new source release.

## Keep the learning experience trustworthy

- Give each lesson an observable outcome and a concrete task a learner can attempt independently.
- Explain assumptions, expected output, common mistakes, and how to repair them. Keep prerequisites explicit.
- Separate source-backed facts from planning estimates. Cite primary sources where practical and date changing claims.
- Treat video allocations as study budgets unless a runtime was actually verified.
- Keep the finished HTML self-contained. Avoid introducing runtime CDNs, accounts, analytics, or API keys.
- Preserve the distinction between time spent, completion, assisted work, and independently demonstrated understanding.
- Share only the smallest relevant reproduction. Remove personal notes, credentials, and other private information from screenshots or exported progress.

Small, focused pull requests are easier to review. Describe the learner's problem, the resulting behavior, and the checks you performed. For visual changes, a screenshot of the affected view helps; for a content correction, the supporting source or runnable example helps.

## License and attribution

Original project material is MIT-licensed; see [LICENSE](LICENSE). Contributions should be material you can submit under the same license. Preserve existing copyright notices, source citations, and the rights of linked or quoted third-party materials.
