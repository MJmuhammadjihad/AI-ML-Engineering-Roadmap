# Advanced worked-example review

Reviewed 12 module examples and diagnostic questions. No JSON or project files modified.

## Executed Python examples

- a01: not run — HTML/browser example.
- a02: passed exact expected stdout.
- a03: passed exact expected stdout.
- a04: passed exact expected stdout.
- a05: passed exact expected stdout.
- a06: passed exact expected stdout.
- a07: passed exact expected stdout.
- a08: passed exact expected stdout.
- a09: passed exact expected stdout.
- a10: passed exact expected stdout.
- a11: passed exact expected stdout.
- a12: passed exact expected stdout.

All 11 Python snippets were inspected first and executed with Python isolated mode, a temporary working directory, captured output and a five-second timeout. None made network requests. a04 writes only inside its own TemporaryDirectory.

## Content review

- All 12 diagnostic questions have four options and one defensible correct answer; answer indices match the explanations.
- Mathematical/statistical quantities in tail latency, retry cost, fairness denominators and matched-seed uncertainty are correct.
- Scope caveats distinguish synthetic data, source counts, empirical results, service guarantees and global labor-market inference.
- a01 HTML/JavaScript was reviewed statically rather than in a browser. Its label association, role=status, query normalization, stable source array and textContent output support the stated behavior; a complete accessibility audit is explicitly not claimed.

## Integration issue to check

- The app download-example handler selects .js whenever the language label contains JavaScript. a01 uses language="HTML + JavaScript" and contains a complete HTML document, so it should download as .html, not .js. Check HTML before JavaScript in the extension mapping.
