# Edition 02 validation record

Reviewed 29 October 2026. The validated standalone HTML has SHA-256:

`d006150ea194be468febb25434cb5016e275329ea799b848e2c540a58a1acd49`

## Executed checks

- `python3 build.py`: passed. Validated 41 unique modules, 205 detailed sessions, prerequisite references and acyclicity, resource links, project fields, 41 worked examples, 41 four-option diagnostics and non-negative activity budgets.
- `node --check src/app.js`: passed.
- `python3 tests/test_atlas.py --failfast`: **21 tests passed**, zero failures. The captured result is in `research/browser-test-results.txt`.
- Browser checks cover all nine views at 320/390/768/1440-pixel viewport widths, all 41 module dialogs, concept search, focused reading, diagnostic feedback, five route dependency closures, conservation of remaining work, daily capacity, focus-block lengths, review-time logging, safe undo, progress migration, storage/import/export, source downloads, five numerical models, overdue recall and iCalendar folding.
- No JavaScript errors or external network requests occurred during the browser tests.
- 38 worked examples passed exact-output execution checks. Two examples received static/conceptual review. The PyTorch example received mathematical/semantic review but was not run because PyTorch is unavailable. See `research/v2-example-audit.md`.
- Correct diagnostic answer positions are balanced across the 41 questions: 11/10/10/10. The position ordering is deterministic and persists across reloads.
- `git diff --check`: passed. Release ZIP integrity and embedded HTML identity are checked by `package.py`.

## Scope and limitations

The managed Chromium browser blocks direct `file://` navigation. Tests therefore served the exact standalone HTML through a loopback HTTP server, with all external requests blocked. Direct-file storage behavior remains unverified in this managed browser. The artifact has no external runtime script, stylesheet, font, image or server dependency. External learning links require internet access.

Desktop, tablet and phone layouts were tested, and screenshots inspected. This is functional and responsive validation, not a full accessibility certification or exhaustive cross-browser matrix.

Research-source retrievals are dated 28–29 October 2026. Three additional primary learning resources (TypeScript, PEFT and OSTEP exercises) were retrieved for edition 02. No current job-advertisement sample was obtained: major labor-market and employer destinations remain blocked by runtime network policy. The source ledger separates retrieved engineering/research material from unverified market references and conditional scenarios.

Time budgets, review intervals and contingency are planning heuristics. The curriculum has not undergone a longitudinal learner study and makes no employment guarantee. Diagnostic answers do not automatically grant mastery. Manually marking a session, stage or gate complete records evidence; planner block logs separately record estimated study time.

## Reproduction

Run `python3 build.py`, `node --check src/app.js`, and `python3 tests/test_atlas.py` from the repository root. The browser suite requires Playwright and Chromium. `python3 package.py` creates the HTML aliases, manifest and source archives; packaging does not itself rerun browser tests. Compare the manifest hash with the hash above before treating this report as applying to a rebuilt artifact.
