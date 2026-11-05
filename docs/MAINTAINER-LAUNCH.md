# Finish the GitHub showcase setup

The repository contains a designed landing page, real UI screenshots, a social-preview image, contribution forms, and build/deployment workflows. The integration used for this update can publish repository contents, but GitHub returned HTTP 403 (`Resource not accessible by integration`) for changing repository settings and enabling Pages. These remaining steps use the repository owner's GitHub account.

## 1. Enable the live demo

1. Open **[Settings → Pages](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/settings/pages)**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **[Actions → Publish demo](https://github.com/MJmuhammadjihad/AI-ML-Engineering-Roadmap/actions/workflows/pages.yml)** and choose **Run workflow** on `main`.
4. Wait for the deployment job to succeed. Open `https://mjmuhammadjihad.github.io/AI-ML-Engineering-Roadmap/` while signed out. Try **Open the roadmap**, the first lesson, and **Download HTML** on desktop and mobile.
5. After verifying the site, add **[Open the live roadmap](https://mjmuhammadjihad.github.io/AI-ML-Engineering-Roadmap/)** to the README's first row of links and remove its pending-hosting note. Add the same URL as the repository website.

Until Pages is enabled, the workflow builds and uploads the complete site artifact and skips deployment. Once enabled, subsequent pushes to `main` deploy automatically. The app served at `/app/` is byte-identical to the portable edition 03 HTML. It uses browser-local progress; moving between hosted and downloaded copies requires JSON export/import.

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

Use [SHARING.md](SHARING.md) for a short introduction, a technical-community draft, a LinkedIn draft, and a 45-second demo script. Adapt one to the audience, disclose your connection, and invite feedback on a specific lesson. No promotional messages have been sent on your behalf.

Choose a license deliberately before describing the project as open source. Source visibility alone does not grant general reuse rights. Until a license is added, the launch copy says the source is editable and available rather than claiming an open-source license.

After sharing, check the repository's **Insights → Traffic** while the data is available and keep a dated private record. Prioritize real lesson feedback, successful use, and useful contributions alongside stars. No number of stars or level of engagement is guaranteed.
