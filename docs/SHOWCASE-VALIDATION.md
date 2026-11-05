# Showcase validation · 5 November 2026

The repository presentation update adds a static landing page, screenshots, sharing materials, contribution forms, source-package contents, and GitHub Actions workflows. It does not change the learning application. Edition 03 remains SHA-256 `99e2347f73040202825627bb462f58c49c3730f8d0ad4411093edac97470ba09`; the original application checks and limits remain in [VALIDATION.md](../VALIDATION.md).

## Local checks

`python3 tests/test_site.py` passes **eight tests** against the generated `_site` directory, served under `/AI-ML-Engineering-Roadmap/` to match the GitHub Pages project path:

- Local page/assets/download links and in-page fragments resolve.
- Main calls to action open the actual app, the first foundation lesson, and the learning routes.
- The edition 03 download saves the exact portable HTML through a real browser download.
- All three HTML editions, source ZIPs, manifests, and the hosted app match their source bytes.
- Layout has no horizontal overflow at widths of 320, 390, 768, and 1440 pixels.
- The skip link transfers focus to the main content, and FAQ disclosures work with the keyboard.
- The landing page remains usable with JavaScript disabled.
- Canonical/social metadata, the 1200 × 630 PNG, robots file, and sitemap agree with the intended site URL.

The suite reports no JavaScript errors or external browser requests. A real skip-link focus issue found during testing was fixed before the final passing run. Desktop/mobile page screenshots and the social card were visually inspected. This is Chromium functional coverage, not an accessibility certification or a complete browser matrix.

Workflow/issue-form YAML parses successfully. Workflow shell blocks pass Bash syntax checks. Relative Markdown links in the README, contribution guide, and launch documents resolve. Source archives pass ZIP integrity checks; rebuilding from the current extracted archive reproduces the unchanged edition 03 HTML.

## Publishing boundary

GitHub returned HTTP 403 (`Resource not accessible by integration`) when this session attempted to change repository About settings and enable Pages. The README therefore uses download/preview links, not an unverified live-demo link. The Pages workflow builds the deployable artifact and skips deployment while Pages is disabled. [MAINTAINER-LAUNCH.md](MAINTAINER-LAUNCH.md) gives the exact remaining owner steps, including the social-preview upload.

The workflow badge in the README displays GitHub's actual verification state. Deployment success and public availability must be checked separately; a successful build with a skipped deployment does not mean the site is live.
