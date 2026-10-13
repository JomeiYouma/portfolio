# Portfolio

Personal portfolio of Raphaël Madoré (Youma), creative developer.

**Live:** https://jomeiyouma.github.io/portfolio/

## What it shows

- Projects with a detail view, a section for browser games, skills, testimonials, services and contact
- French and English, switchable at any time
- A high-contrast mode for readability
- Recent GitHub activity, fetched from the GitHub API

## Structure

```
index.html, assets/, data/    first version: static HTML, CSS and JavaScript
v2/                           current version: React 19, Vite, GSAP, Motion, OGL
.github/workflows/            builds v2 and deploys it to GitHub Pages
```

The live site is `v2`. The first version is kept at the root for reference.

## Run locally

```bash
cd v2
npm install
npm run dev                  # development server
npm run build                # production build, followed by the prerender step
npm run build:no-prerender   # production build only
npm run lint
```

## Deployment

Every push to `main` runs the GitHub Actions workflow, which builds `v2` and publishes `v2/dist` to GitHub Pages.
