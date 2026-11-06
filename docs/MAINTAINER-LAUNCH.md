# Maintain the GitHub showcase

The [live showcase](https://mjmuhammadjihad.github.io/AI-ML-Engineering-Roadmap/) is published and verified as of **6 November 2026**. The repository owner enabled GitHub Pages, and [the first live deployment](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/actions/runs/42153865774) completed both its build and deployment jobs. The [learning app](https://mjmuhammadjihad.github.io/AI-ML-Engineering-Roadmap/app/), curriculum catalog, downloads, license, and media are available over HTTPS.

The integration can publish repository contents and deploy to the enabled site. Repository About/topics settings still require the owner's GitHub account because those API requests return HTTP 403 (`Resource not accessible by integration`). The optional presentation steps below keep their prepared copy in one place.

## 1. Deploy or recover the live site

1. For a new fork or if hosting is disabled, open **[Settings → Pages](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/settings/pages)**.
2. Under **Build and deployment → Source**, select **GitHub Actions**. This is already configured for this repository.
3. Open **[Actions → Publish demo](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/actions/workflows/pages.yml)** and choose **Run workflow** on `main`.
4. Wait for the deployment job to succeed. Open `https://mjmuhammadjihad.github.io/AI-ML-Engineering-Roadmap/` while signed out. Try **Open the roadmap**, the first lesson, and **Download HTML** on desktop and mobile.
5. Keep the README's live links current. Use `https://mjmuhammadjihad.github.io/AI-ML-Engineering-Roadmap/` as the repository website in About.

Pushes to `main` deploy automatically. If Pages is disabled later, the workflow builds and uploads the complete site artifact and skips deployment. The app served at `/app/` is byte-identical to the portable edition 03 HTML. It uses browser-local progress; moving between hosted and downloaded copies requires JSON export/import.

To preview the site locally:

```sh
python3 build_site.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory _site
```

Open `http://127.0.0.1:8000/`. The custom 404 is configured for the GitHub project URL. Tests also serve the site under that project subpath.

## 2. Correct the repository About section

On the repository's main page, click the gear beside **About**. The old description lists different module/route/lab counts; replace it with:

> Interactive AI & ML roadmap for beginners: 6 guided foundation days, 41 modules, 205 sessions, 5 career routes, and local progress tracking in one portable HTML app.

Add relevant topics:

```text
ai-roadmap
machine-learning
artificial-intelligence
learning-roadmap
python
ml-engineering
deep-learning
self-study
data-science
offline-first
generative-ai
education
```

Set the website only after the Pages deployment is verified. Topics help people find relevant projects; adding unrelated popular keywords would make the listing less useful.

## 3. Set the social preview and profile showcase

Download [`assets/social-preview.png`](assets/social-preview.png), then upload it under **[Settings → General → Social preview](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/settings)**. The image is 1200 × 630 pixels and includes a real application screenshot. GitHub does not derive repository share images from a README image. The Pages site has its own Open Graph and Twitter card metadata ready to use the same image.

On your GitHub profile, choose **Customize your pins** and pin this repository if you want it to be a featured project. Both the preview upload and profile pin are account-interface actions; they are not configured by the files in this repository.

## 4. Make sharing useful

The **Publish edition 03 release** workflow uploads the committed, checksum-verified HTML, source ZIP, manifest, MIT license, tour video, and checksums when a `v3.x.y` tag is pushed. Add its release notes in `docs/RELEASE-v3.x.y.md` before tagging. It uses GitHub's repository token because the cloud environment's credential was rejected by GitHub's separate asset-upload endpoint. The workflow can also be run manually on an existing new tag. A draft is published after all asset uploads succeed; an already published release is left unchanged.

Use [SHARING.md](SHARING.md) for a short introduction, a technical-community draft, a LinkedIn draft, and a 45-second demo script. Adapt one to the audience, disclose your connection, and invite feedback on a specific lesson. No promotional messages have been sent on your behalf.

The original project material is now available under the [MIT License](../LICENSE), as requested by the repository owner. Retain the copyright and license notice when redistributing it. Third-party resources and attributed quotations retain their respective rights and licenses.

After sharing, check the repository's **Insights → Traffic** while the data is available and keep a dated private record. Prioritize real lesson feedback, successful use, and useful contributions alongside stars. No number of stars or level of engagement is guaranteed.
