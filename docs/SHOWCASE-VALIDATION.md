# Live deployment verified · 6 November 2026

The owner enabled GitHub Pages, and [deployment 42153865774](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/actions/runs/42153865774) completed both its build and deploy jobs. The [public showcase](https://mjmuhammadjihad.github.io/AI-ML-Engineering-Roadmap/) is live over HTTPS.

Eight public endpoints—the landing page, curriculum catalog, app, portable HTML download, manifest, MIT license, social preview, and tour video—returned HTTP 200 and matched their published source bytes. The hosted app has SHA-256 `a98811b78e756488ecb7bf2a19c9ba3aad9e9ca5c3855c04fafc3628803ac5b9`.

Fresh browser sessions at 1440px and 390px verified the live landing page, responsive layout, actual HTML download, application launch, and first foundation lesson. Both downloads matched the release HTML. The sessions reported no JavaScript errors or requests outside the project site. TLS verification remained enabled. This is live Chromium smoke coverage; the broader local suite and its limits remain documented below.

The README and current release notes now link to the live site. Older release archives and the dated pre-activation records below are retained as historical snapshots. Repository About/topics changes remain account-level settings; see the [publishing guide](MAINTAINER-LAUNCH.md).

---

# Curriculum and tour update · 6 November 2026

The showcase suite now passes **11 tests**. In addition to the eight original checks below, it checks that the generated catalog includes all 41 modules and 205 sessions with the exact source titles, outcomes, and prerequisite links; that the catalog works with keyboard navigation and JavaScript disabled at 320/390/768/1440 widths; and that the tour has controls, no autoplay, a written equivalent, a valid served MP4, and an accessible MIT license download.

The 32-second video was played in Chromium and inspected visually. The catalog's desktop/mobile layouts were also inspected. The portable HTML now embeds the MIT notice; its current identity and full rerun results are in [VALIDATION.md](../VALIDATION.md). The GitHub Pages activation boundary remains unchanged.

---

# Original showcase validation · 5 November 2026

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
