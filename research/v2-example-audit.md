# Edition 02 worked-example and diagnostic audit

Reviewed 29 October 2026. Read-only review of the authored enrichment and bridge data. No network requests or repository changes were made.

## Executed checks

- Core c02–c18, c20–c24: all22 runnable examples matched their exact expected stdout, including the NumPy example.
- Bridges b01–b05: all5 examples matched exact expected stdout. b03 ran in Node.js without network requests; b02 launched only a bounded child Python process that printed a constant.
- Advanced a02–a12: all11 standard-library Python examples matched exact expected stdout (independent child review).
- Total:38 executed examples passed,0 failed. Python snippets ran in temporary working directories with timeouts; programs were inspected before execution.
- c01 pseudocode and a01 complete HTML/JavaScript example passed conceptual/static review.
- c19 PyTorch snippet was not executed because torch is unavailable. Its stated derivative (-16), accumulation (-32), and clearing (0) are mathematically and semantically consistent with PyTorch autograd. Do not claim it was runtime-tested.

## Diagnostic review

All41 module questions have exactly four options, a valid correct index, and a sound explanation with one supported answer. The b05 conditioning example also matched its expected output, and its diagnostic correctly limits a gradient check to local agreement.

No mathematical or expected-output mismatch was found. The numerical derivative example correctly uses a cubic to expose central-difference truncation error; its quadratic contrast is carefully qualified. Randomization-test claims preserve the random-assignment assumption. Model/evaluation claims distinguish training fit, generalization, calibration and causal interpretation.

## Concrete integration correction

The app's worked-example download mapping must check for HTML before JavaScript. a01 is labeled `HTML + JavaScript` and contains a complete HTML document. It should download as `.html`, not `.js`.

## Pedagogical improvement

Correct choices are heavily concentrated in option B in the core material. Rotate option ordering deterministically during assembly and update answerIndex so answer locations are balanced and stable across reloads. This avoids an answer-position shortcut without changing question meaning.

Detailed advanced notes: `v2-advanced-example-audit.md`. Raw core/bridge execution results: `v2-example-results-core.json`.

## Integration resolutions

The final app downloads the HTML example with an `.html` extension. Diagnostic choices were rotated deterministically to balanced positions without changing question meaning or explanations. Both behaviors are covered by the application review and browser checks.
